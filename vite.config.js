import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './src',
  publicDir: '../static',
  base: '/',
  server: {
    host: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: 'hidden',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        menu: resolve(__dirname, 'src/experiments/index.html'),
        tjsBuddha: resolve(__dirname, 'src/experiments/acidBuddha/index.html'),
      }
    }
  }
})