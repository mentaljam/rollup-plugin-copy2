import {promises as fs} from 'fs'
import * as path from 'path'
import type {Plugin, PluginContext} from 'rollup'
import {glob} from 'glob'


type CopyEntry = string | [string, string]

interface IPluginCopy2Options {
  assets:           CopyEntry[]
  notEmitFiles?:    boolean
  outputDirectory?: string
}

type RollupPluginCopy2 = (options: IPluginCopy2Options) => Plugin

const getAssetPathsMapper = (
  ctx: PluginContext,
  srcDir: string,
) => {
  const normalizeSrcFile = (srcFile: string) => {
    srcFile = path.normalize(srcFile)

    if (!path.isAbsolute(srcFile)) {
      srcFile = path.resolve(srcDir, srcFile)
    }

    if (process.platform === 'win32') {
      srcFile = srcFile.replace(/\\+/g, '/')
    }

    return srcFile
  }

  return (asset: CopyEntry): [string, string, boolean] => {
    if (typeof asset === 'string') {
      return [normalizeSrcFile(asset), asset, false]
    }

    if (Array.isArray(asset) && asset.length === 2) {
      const [srcFile, fileName] = asset
      return [normalizeSrcFile(srcFile), fileName, true]
    }

    ctx.error('Asset should be a string or a pair of strings [string, string]')
  }
}

const rollupPluginCopy2: RollupPluginCopy2 = (options) => ({
  name: 'copy2',

  buildStart() {
    if (!(options && options.assets && Array.isArray(options.assets))) {
      this.error('Plugin options are invalid')
    }

    if (!options.outputDirectory && options.notEmitFiles) {
      this.error('`notEmitFiles` is set but `outputDirectory` is not provided')
    }
  },

  async generateBundle() {
    const {assets, notEmitFiles} = options
    if (!assets.length) {
      this.warn('An empty list of assets was passed to plugin options')
      return
    }

    const srcDir = process.cwd()
    let {outputDirectory: outDir} = options
    if (outDir && !path.isAbsolute(outDir)) {
      outDir = path.resolve(srcDir, outDir)
    }

    const pathMapper = getAssetPathsMapper(this, srcDir)

    for (let [srcFile, fileName, assetIsPair] of assets.map(pathMapper)) {
      const files = await glob(srcFile)
      if (files.length === 0) {
        this.error(`"${srcFile}" doesn't exist`)
      }

      if (files.length > 1 && assetIsPair) {
        this.error(`Cannot mix glob "${srcFile}" pattern for assets with [string, string] notation`)
      }

      for (const file of files) {
        if (!assetIsPair) {
          fileName = path.relative(srcDir, file)
        }

        const source = await fs.readFile(file)
        if (!notEmitFiles) {
          this.emitFile({
            fileName,
            source,
            type: 'asset',
          })
        }

        if (outDir) {
          const filePath = path.resolve(outDir, fileName)
          await fs.mkdir(path.dirname(filePath), {recursive: true})
          await fs.writeFile(filePath, source)
        }
      }
    }
  },
})

export default rollupPluginCopy2
