#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function buildIntegration() {
  console.log('🔧 Building Compify Integration...\n');
  
  let successCount = 0;
  let totalTasks = 0;
  
  // Task 1: Copy Design System
  totalTasks++;
  console.log('📋 Task 1: Copying Design System');
  try {
    const copyDesignSystem = require('./copy-design-system.js');
    await copyDesignSystem();
    successCount++;
    console.log('✅ Design system integration completed\n');
  } catch (error) {
    console.error('❌ Design system integration failed:', error.message);
  }
  
  // Task 2: Copy Sandbox to Static Site
  totalTasks++;
  console.log('📋 Task 2: Integrating Sandbox with Static Site');
  try {
    const sandboxSource = path.join(__dirname, '../apps/sandbox/dist');
    const sandboxTarget = path.join(__dirname, '../apps/web-static/public/sandbox');
    
    // Check if sandbox build exists
    if (!await fs.pathExists(sandboxSource)) {
      console.log('⚠️  Sandbox build not found. Building sandbox first...');
      
      // Try to build sandbox
      const { spawn } = require('child_process');
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: path.join(__dirname, '../apps/sandbox'),
        stdio: 'inherit',
        shell: true
      });
      
      await new Promise((resolve, reject) => {
        buildProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Sandbox build completed');
            resolve();
          } else {
            reject(new Error(`Sandbox build failed with code ${code}`));
          }
        });
      });
    }
    
    // Copy sandbox files to static site
    await fs.copy(sandboxSource, sandboxTarget, {
      overwrite: true,
      filter: (src, dest) => {
        // Skip _headers file to avoid conflicts
        if (path.basename(src) === '_headers' && src !== sandboxSource) {
          return false;
        }
        return true;
      }
    });
    
    console.log('✅ Sandbox integrated with static site');
    console.log(`   Source: ${sandboxSource}`);
    console.log(`   Target: ${sandboxTarget}`);
    
    // List copied files
    const files = await fs.readdir(sandboxTarget);
    console.log('   Files copied:');
    files.forEach(file => {
      console.log(`     • ${file}`);
    });
    
    successCount++;
    
  } catch (error) {
    console.error('❌ Sandbox integration failed:', error.message);
  }
  
  // Task 3: Verify Integration
  totalTasks++;
  console.log('\n📋 Task 3: Verifying Integration');
  try {
    const checks = [
      {
        name: 'Design System CSS',
        path: 'apps/web-static/public/shared/design-system/tokens.css'
      },
      {
        name: 'Sandbox Index',
        path: 'apps/web-static/public/sandbox/index.html'
      },
      {
        name: 'Sandbox Assets',
        path: 'apps/web-static/public/sandbox/assets'
      },
      {
        name: 'Redirects Config',
        path: 'apps/web-static/public/_redirects'
      }
    ];
    
    let checksPassed = 0;
    for (const check of checks) {
      const fullPath = path.join(__dirname, '..', check.path);
      if (await fs.pathExists(fullPath)) {
        console.log(`✅ ${check.name}: Found`);
        checksPassed++;
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    }
    
    if (checksPassed === checks.length) {
      console.log('✅ All integration checks passed');
      successCount++;
    } else {
      console.log(`⚠️  ${checksPassed}/${checks.length} integration checks passed`);
    }
    
  } catch (error) {
    console.error('❌ Integration verification failed:', error.message);
  }
  
  // Summary
  console.log(`\n📊 Integration Summary: ${successCount}/${totalTasks} tasks completed`);
  
  if (successCount === totalTasks) {
    console.log('\n🎉 Integration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start development servers:');
    console.log('      • npm run dev:static (port 4321)');
    console.log('      • npm run dev:backend (port 8080)');
    console.log('   2. Test routing:');
    console.log('      • Static pages: http://localhost:4321/');
    console.log('      • Sandbox: http://localhost:4321/sandbox/');
    console.log('      • Auth (dev): http://localhost:4321/auth/login (proxies to backend)');
    console.log('   3. Verify design system consistency across all pages');
  } else {
    console.log('\n⚠️  Integration completed with issues. Please review the errors above.');
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  buildIntegration().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = buildIntegration;