import * as fs from 'fs'
import * as path from 'path'
import {Plugin} from 'rollup'
import * as glob from 'glob'


type CopyEntry = string | [string, string]

interface IPluginCopy2Options {
  assets:           CopyEntry[]
  outputDirectory?: string
}

type RollupPluginCopy2 = (options: IPluginCopy2Options) => Plugin

const rollupPluginCopy2: RollupPluginCopy2 = (options) => ({
  name: 'copy2',
  generateBundle() {
    if (!(options && options.assets && Array.isArray(options.assets))) {
      this.error('Plugin options are invalid')
    }
    const {assets} = options
    if (!assets.length) {
      this.warn('An empty list of assets was passed to plugin options')
      return
    }
    const srcDir = process.cwd()
    let outDir   = options.outputDirectory
    if (outDir && !path.isAbsolute(outDir)) {
      outDir = path.resolve(srcDir, outDir)
    }
    for (const asset of assets) {
      let srcFile:  string
      let fileName: string
      const assetIsPair = Array.isArray(asset) && asset.length === 2
      if (typeof asset === 'string') {
        srcFile  = asset
        fileName = asset
      } else if (assetIsPair) {
        srcFile  = asset[0]
        fileName = asset[1]
      } else {
        this.error('Asset should be a string or a pair of strings [string, string]')
      }
      srcFile = path.normalize(srcFile)
      if (!path.isAbsolute(srcFile)) {
        srcFile = path.resolve(srcDir, srcFile)
      }
      const files = glob.sync(srcFile)
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
        const source = fs.readFileSync(file)
        this.emitFile({
          fileName,
          source,
          type: 'asset',
        })
        if (outDir) {
          const filePath = path.resolve(outDir, fileName)
          fs.mkdirSync(path.dirname(filePath), {recursive: true})
          fs.writeFileSync(filePath, source)
        }
      }
    }
  },
})

export default rollupPluginCopy2
