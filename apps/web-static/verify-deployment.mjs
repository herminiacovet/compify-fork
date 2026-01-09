#!/usr/bin/env node

/**
 * Static Site Deployment Verification Script
 * Verifies that the static site is properly deployed and accessible
 */

import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Expected SEO meta tags
const expectedMetaTags = [
    'title',
    'description',
    'og:title',
    'og:description',
    'og:type',
    'og:url'
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

function checkSEOMetaTags(html) {
    const missingTags = [];
    
    expectedMetaTags.forEach(tag => {
        const patterns = [
            new RegExp(`<title[^>]*>.*?</title>`, 'i'),
            new RegExp(`<meta[^>]*name=["']${tag}["'][^>]*>`, 'i'),
            new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*>`, 'i')
        ];
        
        const found = patterns.some(pattern => pattern.test(html));
        if (!found && tag !== 'title') {
            // Special case for title tag
            if (tag === 'title' && !/<title[^>]*>.*?<\/title>/i.test(html)) {
                missingTags.push(tag);
            }
        } else if (tag === 'title' && !/<title[^>]*>.*?<\/title>/i.test(html)) {
            missingTags.push(tag);
        } else if (!found) {
            missingTags.push(tag);
        }
    });
    
    return missingTags;
}

function checkCacheHeaders(headers) {
    const issues = [];
    
    // Check for cache control headers
    if (!headers['cache-control']) {
        issues.push('Missing Cache-Control header');
    }
    
    // Check for security headers
    const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
    ];
    
    securityHeaders.forEach(header => {
        if (!headers[header]) {
            issues.push(`Missing security header: ${header}`);
        }
    });
    
    return issues;
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
            
            // Check SEO meta tags
            const missingSEOTags = checkSEOMetaTags(response.body);
            if (missingSEOTags.length > 0) {
                result.issues.push(`Missing SEO tags: ${missingSEOTags.join(', ')}`);
                // Don't fail for missing SEO tags, just warn
                printWarning(`${page}: Missing SEO tags: ${missingSEOTags.join(', ')}`);
            }
            
            // Check cache headers
            const cacheIssues = checkCacheHeaders(response.headers);
            if (cacheIssues.length > 0) {
                result.issues.push(...cacheIssues);
                // Don't fail for cache headers, just warn
                printWarning(`${page}: ${cacheIssues.join(', ')}`);
            }
            
            // Check for navigation
            if (!response.body.includes('nav') && !response.body.includes('navigation')) {
                result.issues.push('No navigation found');
                printWarning(`${page}: No navigation found`);
            }
            
            results.push(result);
            
            if (result.issues.length === 0) {
                printStatus(`✓ ${page} - OK`);
            } else {
                const criticalIssues = result.issues.filter(issue => 
                    issue.includes('HTTP') || issue.includes('Invalid')
                );
                if (criticalIssues.length > 0) {
                    printError(`✗ ${page} - ${criticalIssues.join(', ')}`);
                } else {
                    printStatus(`✓ ${page} - OK (with warnings)`);
                }
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
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyStaticSite()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            printError(`Verification failed: ${error.message}`);
            process.exit(1);
        });
}

export { verifyStaticSite };