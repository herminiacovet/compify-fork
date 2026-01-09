/**
 * Test setup file for integration tests
 * This file runs before all tests to set up the testing environment
 */

import { beforeAll, afterAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Global test configuration
global.TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  baseUrl: 'http://localhost',
  ports: {
    backend: 8081,
    static: 4322,
    sandbox: 5174
  }
};

// Mock fetch for Node.js environment if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const { default: fetch } = await import('node-fetch');
    return fetch(url, options);
  };
}

// Setup console logging for tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Suppress verbose logging during tests unless explicitly enabled
if (!process.env.VERBOSE_TESTS) {
  console.log = (...args) => {
    if (args[0] && args[0].includes && args[0].includes('TEST:')) {
      originalConsoleLog(...args);
    }
  };
  
  console.warn = (...args) => {
    if (args[0] && args[0].includes && args[0].includes('TEST:')) {
      originalConsoleWarn(...args);
    }
  };
}

// Global setup
beforeAll(async () => {
  console.log('TEST: Setting up integration test environment...');
  
  // Verify required files exist
  const requiredFiles = [
    'package.json',
    'apps/backend/go.mod',
    'apps/web-static/package.json',
    'apps/sandbox/package.json'
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.ENVIRONMENT = 'test';
  process.env.LOG_LEVEL = 'warn';
  
  console.log('TEST: Integration test environment ready');
});

// Global cleanup
afterAll(async () => {
  console.log('TEST: Cleaning up integration test environment...');
  
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  
  console.log('TEST: Integration test cleanup complete');
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('TEST: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Helper functions available globally in tests
global.testHelpers = {
  // Wait for a condition to be true
  waitFor: async (condition, timeout = 10000, interval = 100) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Retry a function with exponential backoff
  retry: async (fn, maxAttempts = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  },
  
  // Check if a service is running
  isServiceRunning: async (url) => {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000 
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  
  // Generate test data
  generateTestData: {
    user: () => ({
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'testpassword123',
      confirmPassword: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    }),
    
    randomString: (length = 10) => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }
};

// Export for ES modules
export default global.testHelpers;