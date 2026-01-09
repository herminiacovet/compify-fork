import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'node',
    
    // Test file patterns
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'apps/**/node_modules/**',
      'apps/**/dist/**'
    ],
    
    // Test timeout (increased for integration tests)
    testTimeout: 60000,
    
    // Setup files
    setupFiles: ['./tests/setup.js'],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'apps/**/node_modules/**',
        'apps/**/dist/**',
        '**/*.config.js',
        '**/*.config.mjs'
      ]
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json'],
    
    // Retry configuration for flaky integration tests
    retry: 2,
    
    // Concurrent test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4
      }
    }
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': new URL('../', import.meta.url).pathname,
      '@tests': new URL('./', import.meta.url).pathname
    }
  }
});