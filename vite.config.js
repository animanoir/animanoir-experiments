export default {
  root: 'src/',
  publicDir: '../static',
  base: '/', // Ensure proper routing for Netlify
  server: {
    host: true, // Open to local network and display URL
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true, // Empty the folder first.
    sourcemap: 'hidden', // Add sourcemap
    rollupOptions: {
      input: {
        main: 'src/index.html',
        menu: 'src/experiments/menu.html',
        threejs: 'src/experiments/threejs/index.html',
        v0: 'src/experiments/v0/v0.html',
        vr1: 'src/experiments/vr1/index.html',
        webAntigua: 'src/experiments/webAntigua/404.html' // Add other entry points as needed
      }
    }
  }
}

// A source map is a file that creates a mapping between your original source code and the minified/transformed code that runs in production.