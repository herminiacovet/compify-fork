#!/usr/bin/env node

/**
 * Static Site Deployment Verification Script
 * Verifies that the static site is properly deployed and accessible
 */

const https = require('https');
const http = require('http');

// Configuration
const SITE_URL = process.env.SITE_URL || 'https://compify.com';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function printStatus(message) {
    console.log(`${colors.green}[INFO]${colors.reset} ${message}`);
}

function printError(message) {
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
}

function printHeader(message) {
    console.log(`${colors.cyan}${message}${colors.reset}`);
}

// Test pages that should be available
const testPages = [
    '/',
    '/about/',
    '/rules/',
    '/timeline/',
    '/sponsors/',
    '/faq/'
];

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        
        const req = client.get(url, { timeout: TIMEOUT }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function verifyStaticSite() {
    printHeader('🔍 Verifying Static Site Deployment');
    console.log(`Testing site: ${SITE_URL}`);
    console.log('');
    
    let allTestsPassed = true;
    const results = [];
    
    for (const page of testPages) {
        const url = `${SITE_URL}${page}`;
        
        try {
            printStatus(`Testing ${page}...`);
            const response = await makeRequest(url);
            
            const result = {
                page,
                url,
                statusCode: response.statusCode,
                issues: []
            };
            
            // Check status code
            if (response.statusCode !== 200) {
                result.issues.push(`HTTP ${response.statusCode} (expected 200)`);
                allTestsPassed = false;
            }
            
            // Check content type
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.includes('text/html')) {
                result.issues.push(`Invalid content type: ${contentType}`);
                allTestsPassed = false;
            }
            
            // Check for basic HTML structure
            if (!response.body.includes('<html') || !response.body.includes('</html>')) {
                result.issues.push('Invalid HTML structure');
                allTestsPassed = false;
            }
            
            // Check for title tag
            if (!response.body.includes('<title>')) {
                printWarning(`${page}: Missing title tag`);
            }
            
            // Check for navigation
            if (!response.body.includes('nav') && !response.body.includes('navigation')) {
                printWarning(`${page}: No navigation found`);
            }
            
            results.push(result);
            
            if (result.issues.length === 0) {
                printStatus(`✓ ${page} - OK`);
            } else {
                printError(`✗ ${page} - ${result.issues.join(', ')}`);
            }
            
        } catch (error) {
            printError(`✗ ${page} - ${error.message}`);
            results.push({
                page,
                url,
                statusCode: 0,
                issues: [error.message]
            });
            allTestsPassed = false;
        }
    }
    
    // Performance check
    console.log('');
    printHeader('⚡ Performance Check');
    
    try {
        const startTime = Date.now();
        await makeRequest(SITE_URL);
        const loadTime = Date.now() - startTime;
        
        if (loadTime < 2000) {
            printStatus(`✓ Load time: ${loadTime}ms (Good)`);
        } else if (loadTime < 5000) {
            printWarning(`⚠ Load time: ${loadTime}ms (Acceptable)`);
        } else {
            printError(`✗ Load time: ${loadTime}ms (Too slow)`);
            allTestsPassed = false;
        }
    } catch (error) {
        printError(`✗ Performance check failed: ${error.message}`);
        allTestsPassed = false;
    }
    
    // Summary
    console.log('');
    printHeader('📊 Deployment Verification Summary');
    
    const passedTests = results.filter(r => r.statusCode === 200).length;
    const totalTests = results.length;
    
    console.log(`Pages tested: ${totalTests}`);
    console.log(`Pages accessible: ${passedTests}`);
    console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (allTestsPassed) {
        printStatus('🎉 All critical tests passed! Static site deployment verified.');
        return true;
    } else {
        printError('❌ Some critical tests failed. Please check the issues above.');
        return false;
    }
}

// Run verification if called directly
if (require.main === module) {
    verifyStaticSite()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            printError(`Verification failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { verifyStaticSite };