import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { join } from 'path'
import { builtinModules } from 'module'

const PACKAGE_ROOT = __dirname

export default defineConfig({
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: process.cwd(),
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/'
    }
  },
  publicDir: join(PACKAGE_ROOT, 'public'),
  base: '',
  server: {
    fs: {
      strict: true
    }
  },
  build: {
    assetsDir: '.',
    sourcemap: process.env.MODE !== 'development' ? 'hidden' : 'inline',
    outDir: 'dist',
    minify: process.env.MODE !== 'development',
    rollupOptions: {
      external: ['electron', ...builtinModules]
    },
    emptyOutDir: true,
    brotliSize: false
  },
  plugins: [react()]
})
