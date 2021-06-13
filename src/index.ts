import * as fs from 'fs'
import * as path from 'path'
import {Plugin} from 'rollup'
import {isArray, isString} from 'util'


type CopyEntry = string | [string, string]

interface IPluginCopy2Options {
  assets: CopyEntry[]
}

type RollupPluginCopy2 = (options: IPluginCopy2Options) => Plugin

const rollupPluginCopy2: RollupPluginCopy2 = (options) => ({
  name: 'copy2',
  generateBundle() {
    if (!(options && options.assets && isArray(options.assets))) {
      this.error('Plugin options are invalid')
    }
    const {assets} = options
    if (!assets.length) {
      this.warn('An empty list of assets was passed to plugin options')
      return
    }
    const srcDir = process.cwd()
    for (const asset of assets) {
      let srcFile:  string
      let fileName: string
      if (isString(asset)) {
        srcFile  = asset
        fileName = asset
      } else if (isArray(asset) && asset.length === 2) {
        srcFile  = asset[0]
        fileName = asset[1]
      } else {
        this.error('Asset should be a string or a pair of strings [string, string]')
      }
      srcFile = path.normalize(srcFile)
      if (!path.isAbsolute(srcFile)) {
        srcFile = path.resolve(srcDir, srcFile)
      }
      if (!fs.existsSync(srcFile) || !fs.statSync(srcFile).isFile()) {
        this.error(`"${srcFile}" doesn't exist`)
      }
      const source = fs.readFileSync(srcFile)
      this.emitFile({
        fileName,
        source,
        type: 'asset',
      })
    }
  },
})

export default rollupPluginCopy2
