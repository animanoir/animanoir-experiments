import { defineConfig } from 'vite'
import { resolve } from 'path'
import glsl from 'vite-plugin-glsl'

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
        tjsBuddha: resolve(__dirname, 'src/experiments/acidBuddha/index.html'),
        led: resolve(__dirname, 'src/experiments/led/index.html'),
        arena3d: resolve(__dirname, 'src/experiments/arena3d/index.html'),
        melodyBird: resolve(__dirname, 'src/experiments/melodyBird/index.html'),
        melodyBirdDark: resolve(__dirname, 'src/experiments/melodyBirdDark/index.html'),
      }
    }
  },
  plugins:[
    glsl()
  ]

})