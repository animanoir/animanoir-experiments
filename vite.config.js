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
        menu: resolve(__dirname, 'src/experiments/menu.html'),
        threejs: resolve(__dirname, 'src/experiments/threejs/index.html'),
        v0: resolve(__dirname, 'src/experiments/v0/v0.html'),
        vr1: resolve(__dirname, 'src/experiments/vr1/index.html'),
        webAntigua: resolve(__dirname, 'src/experiments/webAntigua/404.html')
      }
    }
  }
})