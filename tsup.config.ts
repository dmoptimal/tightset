import { defineConfig } from 'tsup'

export default defineConfig([
  // Core + Canvas + DOM (no framework deps)
  {
    entry: {
      index: 'src/index.ts',
      canvas: 'src/canvas.ts',
      dom: 'src/dom.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
  },
  // React (needs jsx transform)
  {
    entry: { react: 'src/react/Tightset.tsx' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    },
  },
])
