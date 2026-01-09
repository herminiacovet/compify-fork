#!/usr/bin/env node

/**
 * Integration Test Runner for Compify MVP
 * Orchestrates the complete integration testing process
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  timeout: 120000, // 2 minutes total timeout
  services: {
    backend: {
      command: 'go',
      args: ['run', 'cmd/main.go'],
      cwd: 'apps/backend',
      env: {
        PORT: '8081',
        ENVIRONMENT: 'test',
        LOG_LEVEL: 'warn'
      },
      healthCheck: 'http://localhost:8081/health'
    }
  }
};

class IntegrationTestRunner {
  constructor() {
    this.processes = new Map();
    this.cleanup = [];
  }

  async run() {
    console.log('🚀 Starting Compify MVP Integration Tests');
    
    try {
      // Step 1: Verify prerequisites
      await this.verifyPrerequisites();
      
      // Step 2: Start required services
      await this.startServices();
      
      // Step 3: Run deployment verification tests
      console.log('📋 Running deployment verification tests...');
      await this.runTests('tests/integration/deployment-verification.test.js');
      
      // Step 4: Run system integration tests
      console.log('🔗 Running system integration tests...');
      await this.runTests('tests/integration/system-integration.test.js');
      
      console.log('✅ All integration tests passed!');
      
    } catch (error) {
      console.error('❌ Integration tests failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async verifyPrerequisites() {
    console.log('🔍 Verifying prerequisites...');
    
    // Check required files
    const requiredFiles = [
      'package.json',
      'apps/backend/go.mod',
      'apps/backend/cmd/main.go',
      'infra/production.env.template',
      'tests/vitest.config.js'
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check Go installation
    try {
      await this.runCommand('go', ['version'], { timeout: 5000 });
    } catch (error) {
      throw new Error('Go is not installed or not in PATH');
    }

    // Check Node.js installation
    try {
      await this.runCommand('node', ['--version'], { timeout: 5000 });
    } catch (error) {
      throw new Error('Node.js is not installed or not in PATH');
    }

    console.log('✅ Prerequisites verified');
  }

  async startServices() {
    console.log('🔧 Starting required services...');
    
    // Start backend service
    const backend = CONFIG.services.backend;
    const backendProcess = spawn(backend.command, backend.args, {
      cwd: backend.cwd,
      env: { ...process.env, ...backend.env },
      stdio: 'pipe'
    });

    this.processes.set('backend', backendProcess);

    // Wait for backend to be ready
    await this.waitForService(backend.healthCheck, 30000);
    
    console.log('✅ Services started successfully');
  }

  async runTests(testFile) {
    const args = [
      'run',
      testFile,
      '--config',
      'tests/vitest.config.js',
      '--reporter=verbose'
    ];

    try {
      const result = await this.runCommand('npx', ['vitest', ...args], {
        timeout: 60000,
        stdio: 'inherit'
      });

      if (!result.success) {
        throw new Error(`Tests failed with exit code ${result.code}`);
      }
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`);
    }
  }

  async waitForService(url, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Use node-fetch if available, otherwise skip health check
        const fetch = await import('node-fetch').then(m => m.default).catch(() => null);
        
        if (fetch) {
          const response = await fetch(url, { timeout: 5000 });
          if (response.ok) {
            return;
          }
        } else {
          // If fetch is not available, just wait a bit and assume service is ready
          await new Promise(resolve => setTimeout(resolve, 5000));
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const { timeout = 30000, stdio = 'pipe', ...spawnOptions } = options;
      
      const process = spawn(command, args, {
        stdio,
        ...spawnOptions
      });

      let stdout = '';
      let stderr = '';

      if (stdio === 'pipe') {
        process.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      const timer = setTimeout(() => {
        process.kill();
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr
        });
      });

      process.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  async cleanup() {
    console.log('🧹 Cleaning up services...');
    
    // Kill all spawned processes
    for (const [name, process] of this.processes) {
      try {
        process.kill();
        console.log(`✅ Stopped ${name} service`);
      } catch (error) {
        console.warn(`⚠️  Failed to stop ${name} service:`, error.message);
      }
    }

    this.processes.clear();
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;