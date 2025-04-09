export default {
  root: 'src/',
  publicDir: '../static',
  base: "/",
  server: {
    host: true, // Open to local network and display URL
  },
  build:{
    outDir: '../dist',
    emptyOutDir: true, // Empty the folder first.
    sourcemap: 'hidden' // Add sourcemap
  }
}

// A source map is a file that creates a mapping between your original source code and the minified/transformed code that runs in production. 