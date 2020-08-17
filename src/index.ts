import * as fs from 'fs'
import * as path from 'path'
import { Plugin } from 'rollup'
import { glob } from 'glob';
import * as mkdirp from 'mkdirp';


type CopyEntry = string | [string, string]

interface IPluginCopy2Options {
  assets: CopyEntry[];
  outputDirectory?: string;
}

type RollupPluginCopy2 = (options: IPluginCopy2Options) => Plugin

const rollupPluginCopy2: RollupPluginCopy2 = (options) => ({
  name: 'copy2',
  generateBundle() {
    if (!(options && options.assets && Array.isArray(options.assets))) {
      this.error('Plugin options are invalid')
    }
    const { assets, outputDirectory } = options
    let outputDir: string;
    if (outputDirectory) {
      outputDir = path.resolve(process.cwd(), outputDirectory);
    }
    if (!assets.length) {
      this.warn('An empty list of asstes was passed to plugin options')
      return
    }
    const srcDir = process.cwd()
    for (const asset of assets) {
      let srcFile: string
      let fileName: string
      if (typeof asset === 'string') {
        srcFile = asset
        fileName = asset
      } else if (Array.isArray(asset) && asset.length === 2) {
        srcFile = asset[0]
        fileName = asset[1]
      } else {
        this.error('Asset should be a string or a pair of strings [string, string]')
      }
      srcFile = path.normalize(srcFile)
      if (!path.isAbsolute(srcFile)) {
        srcFile = path.resolve(srcDir, srcFile)
      }
      glob(srcFile, {}, (err, files) => {
        if (err) {
          this.error(err);
        }
        if (!files || files.length === 0) {
          this.error(`"${srcFile}" doesn't exist`)
        } else if (files.length > 1 && Array.isArray(asset)) {
          this.error(`Cannot mix * pattern for assets with [string, string] notation`)
        } else {
          files.forEach((file) => {
            if (!Array.isArray(asset)) {
              fileName = path.relative(process.cwd(), file);
            }
            if (fs.statSync(file).isFile()) {
              const source = fs.readFileSync(file)
              this.emitFile({
                fileName,
                source,
                type: 'asset',
              });
              if (outputDir) {
                const filePath = path.resolve(outputDir, fileName);
                mkdirp(path.dirname(filePath)).then(() => {
                  fs.writeFileSync(filePath, source);
                }).catch(this.error);
              }
            }
          });
        }
      });
    }
  },
})

export default rollupPluginCopy2
