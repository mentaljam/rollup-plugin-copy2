import * as fs from 'fs'
import * as path from 'path'
import {Plugin} from 'rollup'
import {isArray, isString} from 'util'


type CopyEntry = string | [string, string]

interface IPluginOptions {
  assets: CopyEntry[]
}

export default (options: IPluginOptions): Plugin => ({
  name: 'copy2-plugin',
  generateBundle(_, bundle) {
    if (!(options && options.assets && isArray(options.assets))) {
      this.error('Plugin options are invalid')
    }
    const {assets} = options
    if (!assets.length) {
      this.warn('An empty list of asstes was passed to plugin options')
      return
    }
    const srcDir = process.cwd()
    assets.forEach(asset => {
      let srcFile
      let fileName
      if (isString(asset)) {
        srcFile = asset
        fileName = asset
      } else if (isArray(asset) && asset.length === 2) {
        srcFile = asset[0]
        fileName = asset[1]
      } else {
        this.error('Asset should be a string or a pair of strings [string, string]')
        return
      }
      srcFile = path.normalize(srcFile)
      if (!path.isAbsolute(srcFile)) {
        srcFile = path.resolve(srcDir, srcFile)
      }
      if (!fs.existsSync(srcFile) || !fs.statSync(srcFile).isFile()) {
        this.error(`"${srcFile}" doesn't exist`)
      }
      bundle[fileName] = {
        fileName,
        isAsset: true,
        source: fs.readFileSync(srcFile),
      }
    })
  },
})
