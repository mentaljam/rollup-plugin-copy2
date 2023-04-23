import fs from 'fs'
import {globSync} from 'glob'

import assets from './assets.js'


const test = (cond, src, dst, message) => {
  if (!cond) {
    console.error(`${message}: ${src} -> ${dst}`)
    process.exit(1)
  }
}

const compare = (src, dst) => {
  dst = 'dist/' + dst
  test(fs.existsSync(dst), src, dst, 'Destination file does not exist')
  const srcData = fs.readFileSync(src)
  const dstData = fs.readFileSync(dst)
  test(srcData.equals(dstData), src, dst, 'Destination file is different from source')
}

for (const asset of assets) {
  if (typeof asset === 'string') {
    globSync(asset).forEach(a => compare(a, a))
  } else if (Array.isArray(asset)) {
    compare(...asset)
  } else {
    throw new Error('Unexpected data')
  }
}

console.info('All tests passed successfully')
