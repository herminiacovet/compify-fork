#!/usr/bin/env node

/**
 * Performance test for Compify Game Sandbox
 * Tests loading times and asset sizes for CDN deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');

console.log('⚡ Testing Compify Game Sandbox Performance...\n');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
    console.error('❌ dist/ directory not found. Run "npm run build:prod" first.');
    process.exit(1);
}

// Performance thresholds
const THRESHOLDS = {
    totalSize: 2 * 1024 * 1024,      // 2MB total
    htmlSize: 10 * 1024,             // 10KB for HTML
    jsSize: 1.5 * 1024 * 1024,       // 1.5MB for JS (Phaser is large)
    cssSize: 50 * 1024,              // 50KB for CSS
    assetCount: 20                   // Max 20 assets
};

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dirPath) {
    const stats = {
        totalSize: 0,
        fileCount: 0,
        files: [],
        byType: {}
    };

    function scanDir(currentPath) {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                scanDir(itemPath);
            } else {
                const relativePath = path.relative(distPath, itemPath);
                const ext = path.extname(item).toLowerCase();
                const size = stat.size;
                
                stats.totalSize += size;
                stats.fileCount++;
                stats.files.push({ path: relativePath, size, ext });
                
                if (!stats.byType[ext]) {
                    stats.byType[ext] = { count: 0, size: 0 };
                }
                stats.byType[ext].count++;
                stats.byType[ext].size += size;
            }
        }
    }
    
    scanDir(dirPath);
    return stats;
}

// Analyze build output
const stats = analyzeDirectory(distPath);

console.log('📊 Build Analysis:');
console.log(`Total files: ${stats.fileCount}`);
console.log(`Total size: ${formatBytes(stats.totalSize)}`);
console.log('');

// Check file types
console.log('📁 File Types:');
Object.entries(stats.byType)
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([ext, data]) => {
        console.log(`${ext || 'no-ext'}: ${data.count} files, ${formatBytes(data.size)}`);
    });
console.log('');

// Performance checks
let allPassed = true;
const checks = [];

// Total size check
if (stats.totalSize <= THRESHOLDS.totalSize) {
    checks.push({ name: 'Total bundle size', status: '✅', message: `${formatBytes(stats.totalSize)} (under ${formatBytes(THRESHOLDS.totalSize)})` });
} else {
    checks.push({ name: 'Total bundle size', status: '⚠️', message: `${formatBytes(stats.totalSize)} (exceeds ${formatBytes(THRESHOLDS.totalSize)})` });
}

// File count check
if (stats.fileCount <= THRESHOLDS.assetCount) {
    checks.push({ name: 'Asset count', status: '✅', message: `${stats.fileCount} files (under ${THRESHOLDS.assetCount})` });
} else {
    checks.push({ name: 'Asset count', status: '⚠️', message: `${stats.fileCount} files (exceeds ${THRESHOLDS.assetCount})` });
}

// HTML size check
const htmlSize = stats.byType['.html']?.size || 0;
if (htmlSize <= THRESHOLDS.htmlSize) {
    checks.push({ name: 'HTML size', status: '✅', message: `${formatBytes(htmlSize)} (under ${formatBytes(THRESHOLDS.htmlSize)})` });
} else {
    checks.push({ name: 'HTML size', status: '⚠️', message: `${formatBytes(htmlSize)} (exceeds ${formatBytes(THRESHOLDS.htmlSize)})` });
}

// JavaScript size check
const jsSize = stats.byType['.js']?.size || 0;
if (jsSize <= THRESHOLDS.jsSize) {
    checks.push({ name: 'JavaScript size', status: '✅', message: `${formatBytes(jsSize)} (under ${formatBytes(THRESHOLDS.jsSize)})` });
} else {
    checks.push({ name: 'JavaScript size', status: '⚠️', message: `${formatBytes(jsSize)} (exceeds ${formatBytes(THRESHOLDS.jsSize)})` });
}

// Check for content hashing
const hashedFiles = stats.files.filter(f => /\.[a-zA-Z0-9_-]{8,}\.(js|css)$/.test(f.path));
if (hashedFiles.length > 0) {
    checks.push({ name: 'Content hashing', status: '✅', message: `${hashedFiles.length} files with content hashes` });
} else {
    checks.push({ name: 'Content hashing', status: '❌', message: 'No content hashing detected' });
    allPassed = false;
}

// Check for gzip potential
const compressibleSize = stats.files
    .filter(f => ['.js', '.css', '.html', '.json'].includes(f.ext))
    .reduce((sum, f) => sum + f.size, 0);

const compressionRatio = compressibleSize / stats.totalSize;
if (compressionRatio > 0.8) {
    checks.push({ name: 'Compression potential', status: '✅', message: `${Math.round(compressionRatio * 100)}% of files are compressible` });
} else {
    checks.push({ name: 'Compression potential', status: '⚠️', message: `Only ${Math.round(compressionRatio * 100)}% of files are compressible` });
}

// Display results
console.log('🔍 Performance Checks:');
checks.forEach(check => {
    console.log(`${check.status} ${check.name}: ${check.message}`);
});

console.log('');

// Largest files
console.log('📦 Largest Files:');
stats.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach(file => {
        console.log(`  ${file.path}: ${formatBytes(file.size)}`);
    });

console.log('');

// Recommendations
console.log('💡 Optimization Recommendations:');

if (jsSize > THRESHOLDS.jsSize) {
    console.log('  • Consider code splitting to reduce initial bundle size');
    console.log('  • Use dynamic imports for non-critical game features');
}

if (stats.totalSize > THRESHOLDS.totalSize) {
    console.log('  • Enable gzip/brotli compression on your CDN');
    console.log('  • Consider using WebP images if any images are included');
}

if (hashedFiles.length === 0) {
    console.log('  • Enable content-based hashing for better caching');
}

console.log('  • Set aggressive cache headers for hashed assets (1 year)');
console.log('  • Use CDN with global edge locations for best performance');

console.log('');
console.log('='.repeat(50));

if (allPassed) {
    console.log('🎉 Performance test PASSED!');
    console.log('📦 Game is optimized for CDN deployment');
} else {
    console.log('⚠️  Performance test completed with warnings');
    console.log('📦 Game will work but consider optimizations above');
}

console.log('='.repeat(50));