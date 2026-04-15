import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { 'tightset-demo': 'docs/demo.ts' },
  format: ['esm'],
  outDir: 'docs',
  target: 'es2020',
  noExternal: [/.*/],
  sourcemap: false,
  minify: true,
})
