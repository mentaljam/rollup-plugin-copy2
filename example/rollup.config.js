import copy from 'rollup-plugin-copy2'

import assets from './assets.mjs'


export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    copy({
      assets
    }),
  ],
}
