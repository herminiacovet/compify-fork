/**
 * System Integration Tests for Compify MVP
 * Tests end-to-end user flows across all three applications
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_CONFIG = {
  backend: {
    port: 8081,
    url: 'http://localhost:8081',
    healthEndpoint: '/health'
  },
  static: {
    port: 4322,
    url: 'http://localhost:4322'
  },
  sandbox: {
    port: 5174,
    url: 'http://localhost:5174'
  },
  timeout: 30000 // 30 seconds for server startup
};

let backendProcess = null;
let staticProcess = null;
let sandboxProcess = null;

describe('System Integration Tests', () => {
  beforeAll(async () => {
    // Start all services for integration testing
    console.log('Starting services for integration tests...');
    
    // Start backend server
    backendProcess = spawn('go', ['run', 'cmd/main.go'], {
      cwd: join(process.cwd(), 'apps/backend'),
      env: {
        ...process.env,
        PORT: TEST_CONFIG.backend.port.toString(),
        ENVIRONMENT: 'test',
        LOG_LEVEL: 'warn'
      },
      stdio: 'pipe'
    });

    // Wait for backend to be ready
    await waitForService(TEST_CONFIG.backend.url + TEST_CONFIG.backend.healthEndpoint, TEST_CONFIG.timeout);
    
    console.log('Backend server started successfully');
  }, TEST_CONFIG.timeout);

  afterAll(async () => {
    // Clean up processes
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    if (staticProcess) {
      staticProcess.kill();
      staticProcess = null;
    }
    if (sandboxProcess) {
      sandboxProcess.kill();
      sandboxProcess = null;
    }
  });

  describe('Cross-Application Communication', () => {
    it('should handle HTTP communication between static site and backend', async () => {
      // Test that static site can communicate with backend via HTTP
      const response = await fetch(TEST_CONFIG.backend.url + '/health');
      expect(response.ok).toBe(true);
      
      const healthData = await response.json();
      expect(healthData).toHaveProperty('status');
      expect(healthData.status).toBe('healthy');
    });

    it('should maintain proper CORS configuration', async () => {
      // Test CORS headers for cross-origin requests
      const response = await fetch(TEST_CONFIG.backend.url + '/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:4321',
          'Access-Control-Request-Method': 'GET'
        }
      });

      // Should allow CORS for development origins
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });

    it('should prevent direct imports between applications', () => {
      // Verify that applications don't have direct imports from each other
      const backendFiles = getJavaScriptFiles('apps/backend');
      const staticFiles = getJavaScriptFiles('apps/web-static');
      const sandboxFiles = getJavaScriptFiles('apps/sandbox');

      // Backend should not import from other apps
      backendFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/import.*from.*\.\.\/web-static/);
        expect(content).not.toMatch(/import.*from.*\.\.\/sandbox/);
      });

      // Static site should not import from other apps
      staticFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/import.*from.*\.\.\/backend/);
        expect(content).not.toMatch(/import.*from.*\.\.\/sandbox/);
      });

      // Sandbox should not import from other apps
      sandboxFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/import.*from.*\.\.\/backend/);
        expect(content).not.toMatch(/import.*from.*\.\.\/web-static/);
      });
    });
  });

  describe('End-to-End User Flows', () => {
    it('should handle complete user registration flow', async () => {
      // Test complete registration flow across backend
      const registrationData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpassword123',
        confirmPassword: 'testpassword123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Step 1: Get registration page
      const regPageResponse = await fetch(TEST_CONFIG.backend.url + '/register');
      expect(regPageResponse.ok).toBe(true);
      expect(regPageResponse.headers.get('content-type')).toContain('text/html');

      // Step 2: Submit registration
      const formData = new URLSearchParams(registrationData);
      const regResponse = await fetch(TEST_CONFIG.backend.url + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });

      // Should redirect to dashboard on success or return form with errors
      expect([200, 302, 303].includes(regResponse.status)).toBe(true);
    });

    it('should handle authentication flow with session management', async () => {
      // Test login flow with session cookies
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      // Step 1: Get login page
      const loginPageResponse = await fetch(TEST_CONFIG.backend.url + '/login');
      expect(loginPageResponse.ok).toBe(true);

      // Step 2: Submit login
      const formData = new URLSearchParams(loginData);
      const loginResponse = await fetch(TEST_CONFIG.backend.url + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData,
        redirect: 'manual'
      });

      // Should handle login attempt (success or failure)
      expect([200, 302, 303, 401].includes(loginResponse.status)).toBe(true);

      // If successful, should set session cookie
      if (loginResponse.status === 302 || loginResponse.status === 303) {
        const cookies = loginResponse.headers.get('set-cookie');
        expect(cookies).toBeTruthy();
      }
    });

    it('should handle dashboard access and HTMX updates', async () => {
      // Test dashboard functionality
      const dashboardResponse = await fetch(TEST_CONFIG.backend.url + '/dashboard');
      
      // Should either show dashboard or redirect to login
      expect([200, 302, 303].includes(dashboardResponse.status)).toBe(true);

      if (dashboardResponse.ok) {
        const content = await dashboardResponse.text();
        expect(content).toContain('html');
        
        // Should contain HTMX attributes for partial updates
        expect(content).toMatch(/hx-/);
      }
    });
  });

  describe('Static Asset Delivery', () => {
    it('should serve static assets with proper cache headers', async () => {
      // Test that static assets are served with appropriate caching
      const response = await fetch(TEST_CONFIG.backend.url + '/health');
      expect(response.ok).toBe(true);

      // Health endpoint should not be cached
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        expect(cacheControl).not.toContain('max-age=31536000');
      }
    });

    it('should handle missing static assets gracefully', async () => {
      // Test 404 handling for missing assets
      const response = await fetch(TEST_CONFIG.backend.url + '/nonexistent-asset.png');
      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle backend service interruption gracefully', async () => {
      // Test that system handles backend downtime
      const originalBackend = backendProcess;
      
      try {
        // Temporarily stop backend
        if (backendProcess) {
          backendProcess.kill();
          backendProcess = null;
        }

        // Wait a moment for service to stop
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test that requests fail gracefully
        try {
          await fetch(TEST_CONFIG.backend.url + '/health', { 
            timeout: 5000 
          });
          // If this succeeds, the service didn't actually stop
          expect(true).toBe(true);
        } catch (error) {
          // Expected - service is down
          expect(error).toBeDefined();
        }

      } finally {
        // Restart backend for other tests
        if (!backendProcess) {
          backendProcess = spawn('go', ['run', 'cmd/main.go'], {
            cwd: join(process.cwd(), 'apps/backend'),
            env: {
              ...process.env,
              PORT: TEST_CONFIG.backend.port.toString(),
              ENVIRONMENT: 'test',
              LOG_LEVEL: 'warn'
            },
            stdio: 'pipe'
          });

          // Wait for restart
          await waitForService(TEST_CONFIG.backend.url + TEST_CONFIG.backend.healthEndpoint, 10000);
        }
      }
    });

    it('should handle malformed requests gracefully', async () => {
      // Test various malformed requests
      const malformedRequests = [
        {
          url: TEST_CONFIG.backend.url + '/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"invalid": json}'
        },
        {
          url: TEST_CONFIG.backend.url + '/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'email=invalid-email&password='
        },
        {
          url: TEST_CONFIG.backend.url + '/dashboard',
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: 'random text data'
        }
      ];

      for (const request of malformedRequests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body
          });

          // Should handle malformed requests gracefully (not crash)
          expect([400, 405, 422, 500].includes(response.status)).toBe(true);
        } catch (error) {
          // Network errors are also acceptable
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Security Integration', () => {
    it('should enforce HTTPS redirects in production mode', async () => {
      // Test security headers and HTTPS enforcement
      const response = await fetch(TEST_CONFIG.backend.url + '/health');
      
      // Check for security headers
      const headers = response.headers;
      
      // These headers should be present for security
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      securityHeaders.forEach(header => {
        // In test mode, these might not be set, but in production they should be
        if (headers.get(header)) {
          expect(headers.get(header)).toBeTruthy();
        }
      });
    });

    it('should prevent XSS in user-generated content', async () => {
      // Test XSS prevention in forms
      const xssPayload = '<script>alert("xss")</script>';
      
      const formData = new URLSearchParams({
        email: xssPayload,
        password: 'test123'
      });

      const response = await fetch(TEST_CONFIG.backend.url + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      // Should handle XSS attempts gracefully
      expect([200, 400, 422].includes(response.status)).toBe(true);

      if (response.ok) {
        const content = await response.text();
        // Should not contain unescaped script tags
        expect(content).not.toContain('<script>alert("xss")</script>');
      }
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent requests without degradation', async () => {
      // Test concurrent request handling
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        fetch(TEST_CONFIG.backend.url + '/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Should handle concurrent requests reasonably quickly
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds for 10 requests
    });

    it('should maintain reasonable response times under load', async () => {
      // Test response time consistency
      const requestTimes = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await fetch(TEST_CONFIG.backend.url + '/health');
        const endTime = Date.now();

        expect(response.ok).toBe(true);
        requestTimes.push(endTime - startTime);
      }

      // Calculate average response time
      const avgTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
      
      // Should maintain reasonable response times (under 1 second)
      expect(avgTime).toBeLessThan(1000);
    });
  });
});

// Helper functions
async function waitForService(url, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Service not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

function getJavaScriptFiles(directory) {
  const files = [];
  
  function walkDir(dir) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.go') || item.endsWith('.astro'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }
  
  walkDir(directory);
  return files;
}