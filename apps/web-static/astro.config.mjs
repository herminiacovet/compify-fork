// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://compify.com',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets', // Custom assets directory for better caching
  },
  compressHTML: true,
  vite: {
    server: {
      port: 4321, // Force specific port
      proxy: {
        // Proxy backend page routes to backend in development
        '/login': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/register': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/dashboard': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        // Proxy auth form submission routes to backend in development
        '/auth': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        // Proxy API routes to backend in development
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Add hash to filenames for cache busting
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
        },
      },
    },
  },
});
