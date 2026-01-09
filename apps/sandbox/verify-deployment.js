#!/usr/bin/env node

/**
 * Deployment verification script for Compify Game Sandbox
 * Verifies that the built game has no server-side dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('🔍 Verifying Compify Game Sandbox deployment...\n');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
    console.error('❌ dist/ directory not found. Run "npm run build" first.');
    process.exit(1);
}

// Check if index.html exists
if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in dist/');
    process.exit(1);
}

// Read and analyze index.html
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Verify static deployment requirements
const checks = [
    {
        name: 'HTML file exists',
        test: () => indexContent.length > 0,
        pass: '✅ index.html generated successfully'
    },
    {
        name: 'No server-side code',
        test: () => !indexContent.includes('<?php') && !indexContent.includes('<%') && !indexContent.includes('{{'),
        pass: '✅ No server-side templating detected'
    },
    {
        name: 'JavaScript modules loaded',
        test: () => indexContent.includes('type="module"'),
        pass: '✅ ES modules properly configured'
    },
    {
        name: 'Game container present',
        test: () => indexContent.includes('game-container'),
        pass: '✅ Game container element found'
    },
    {
        name: 'Relative asset paths',
        test: () => !indexContent.includes('http://') && !indexContent.includes('https://') || indexContent.includes('./'),
        pass: '✅ Using relative paths for CDN compatibility'
    }
];

let allPassed = true;

checks.forEach(check => {
    if (check.test()) {
        console.log(check.pass);
    } else {
        console.error(`❌ ${check.name} failed`);
        allPassed = false;
    }
});

// Check asset files
const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    const hasMainJs = jsFiles.some(f => f.startsWith('main.'));
    const hasPhaserJs = jsFiles.some(f => f.startsWith('phaser.'));
    
    if (hasMainJs && hasPhaserJs) {
        console.log('✅ JavaScript bundles generated (main + phaser)');
    } else {
        console.error('❌ Missing required JavaScript bundles');
        allPassed = false;
    }
    
    // Check for content hashing
    const hashedFiles = assetFiles.filter(f => /\.[a-zA-Z0-9_-]{8,}\.(js|css)$/.test(f));
    if (hashedFiles.length > 0) {
        console.log('✅ Content-based hashing enabled for caching');
    } else {
        console.warn('⚠️  No content hashing detected (may affect caching)');
    }
} else {
    console.error('❌ assets/ directory not found');
    allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('🎉 Deployment verification PASSED!');
    console.log('📦 Game is ready for static deployment to CDN');
    console.log('\nNext steps:');
    console.log('1. Upload dist/ contents to your CDN/hosting service');
    console.log('2. Configure proper cache headers for assets');
    console.log('3. Test the deployed game in different browsers');
} else {
    console.log('❌ Deployment verification FAILED!');
    console.log('Please fix the issues above before deploying.');
    process.exit(1);
}

console.log('='.repeat(50));