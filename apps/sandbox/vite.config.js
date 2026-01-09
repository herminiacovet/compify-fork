import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for CDN deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'esbuild', // Use esbuild for faster builds
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          phaser: ['phaser']
        },
        // Use content-based hashing for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Optimize for web delivery
    target: 'es2018',
    cssCodeSplit: true,
    // Ensure no server-side dependencies
    ssr: false
  },
  server: {
    port: 5173,
    open: true,
    host: true, // Allow external connections for testing
    // Add cache headers for development
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  preview: {
    port: 5173,
    host: true,
    // Add cache headers for preview mode
    headers: {
      '/assets/*': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '/*.js': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '/*.css': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '/index.html': {
        'Cache-Control': 'public, max-age=3600'
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: []
  }
});