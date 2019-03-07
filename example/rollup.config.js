import copy from 'rollup-plugin-copy2'


export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [
    copy({
      assets: [
        'README.md',
        ['data.txt', 'assets/data.txt'],
      ]
    }),
  ],
}
