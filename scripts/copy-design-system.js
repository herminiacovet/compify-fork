#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function copyDesignSystem() {
  console.log('🎨 Copying Compify Design System...\n');
  
  const sourceDir = path.join(__dirname, '../shared/design-system');
  
  // Verify source directory exists
  if (!await fs.pathExists(sourceDir)) {
    console.error('❌ Design system source directory not found:', sourceDir);
    process.exit(1);
  }
  
  const targets = [
    {
      name: 'Static Site (Astro)',
      path: path.join(__dirname, '../apps/web-static/public/shared/design-system'),
      check: path.join(__dirname, '../apps/web-static')
    },
    {
      name: 'Backend Server (Go)',
      path: path.join(__dirname, '../apps/backend/static/design-system'),
      check: path.join(__dirname, '../apps/backend')
    },
    {
      name: 'Game Sandbox (Phaser)',
      path: path.join(__dirname, '../apps/sandbox/public/design-system'),
      check: path.join(__dirname, '../apps/sandbox')
    }
  ];
  
  let successCount = 0;
  let totalCount = 0;
  
  for (const target of targets) {
    totalCount++;
    
    // Check if target app exists
    if (!await fs.pathExists(target.check)) {
      console.log(`⚠️  Skipping ${target.name} - directory not found`);
      continue;
    }
    
    try {
      // Ensure target directory exists
      await fs.ensureDir(path.dirname(target.path));
      
      // Copy design system files
      await fs.copy(sourceDir, target.path, {
        overwrite: true,
        filter: (src, dest) => {
          // Skip README.md in target directories
          if (path.basename(src) === 'README.md' && src !== sourceDir + '/README.md') {
            return false;
          }
          return true;
        }
      });
      
      console.log(`✅ ${target.name}: Design system copied successfully`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ ${target.name}: Failed to copy design system`);
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Summary: ${successCount}/${totalCount} applications updated`);
  
  if (successCount === 0) {
    console.error('\n❌ No applications were updated. Please check your project structure.');
    process.exit(1);
  } else if (successCount < totalCount) {
    console.log('\n⚠️  Some applications were skipped. This is normal if you haven\'t set up all apps yet.');
  } else {
    console.log('\n🎉 All applications updated successfully!');
  }
  
  // List the files that were copied
  try {
    const files = await fs.readdir(sourceDir);
    const cssFiles = files.filter(file => file.endsWith('.css'));
    
    console.log('\n📁 Design system files:');
    cssFiles.forEach(file => {
      console.log(`   • ${file}`);
    });
    
    if (files.includes('README.md')) {
      console.log('   • README.md (documentation)');
    }
    
  } catch (error) {
    console.log('\n📁 Design system files copied (unable to list)');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Start your development servers');
  console.log('   2. Verify design system is loading correctly');
  console.log('   3. Check browser console for any CSS errors');
  console.log('   4. Test responsive design across different screen sizes');
}

// Handle command line execution
if (require.main === module) {
  copyDesignSystem().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = copyDesignSystem;