#!/usr/bin/env node

/**
 * Production Deployment Script for Compify MVP (Node.js)
 * Cross-platform deployment preparation script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function printStatus(message) {
    console.log(`${colors.green}[INFO]${colors.reset} ${message}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
}

function printError(message) {
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function printHeader(message) {
    console.log(`${colors.cyan}${message}${colors.reset}`);
}

async function main() {
    console.log('🚀 Starting Compify MVP Production Deployment');
    
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
        printError('Please run this script from the project root directory');
        process.exit(1);
    }

    // Check for required environment variables
    if (!process.env.CLOUDFLARE_API_TOKEN) {
        printWarning('CLOUDFLARE_API_TOKEN not set. Manual deployment to Cloudflare Pages required.');
    }

    try {
        // Install dependencies
        printStatus('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });

        // Build all applications
        printStatus('Building all applications...');

        // Build static site
        printStatus('Building static site...');
        process.chdir('apps/web-static');
        execSync('npm run build', { stdio: 'inherit' });
        process.chdir('../..');

        // Build backend
        printStatus('Building backend server...');
        process.chdir('apps/backend');
        execSync('go mod tidy', { stdio: 'inherit' });
        
        const backendOutput = process.platform === 'win32' 
            ? '../../dist/compify-backend.exe' 
            : '../../dist/compify-backend';
        
        execSync(`go build -o ${backendOutput} ./cmd`, { stdio: 'inherit' });
        process.chdir('../..');

        // Build sandbox
        printStatus('Building game sandbox...');
        process.chdir('apps/sandbox');
        execSync('npm run build', { stdio: 'inherit' });
        process.chdir('../..');

        printStatus('All builds completed successfully!');

        // Create deployment artifacts
        printStatus('Creating deployment artifacts...');
        
        const deployDir = 'dist/deployments';
        if (!fs.existsSync(deployDir)) {
            fs.mkdirSync(deployDir, { recursive: true });
        }

        // Copy static site build
        if (fs.existsSync('apps/web-static/dist')) {
            copyRecursive('apps/web-static/dist', path.join(deployDir, 'static-site'));
        }

        // Copy sandbox build
        if (fs.existsSync('apps/sandbox/dist')) {
            copyRecursive('apps/sandbox/dist', path.join(deployDir, 'sandbox'));
        }

        // Copy backend binary
        const backendBinary = process.platform === 'win32' 
            ? 'dist/compify-backend.exe' 
            : 'dist/compify-backend';
        
        if (fs.existsSync(backendBinary)) {
            fs.copyFileSync(backendBinary, path.join(deployDir, path.basename(backendBinary)));
        }

        // Copy deployment configurations
        const configFiles = [
            'infra/cloudflare-pages.toml',
            'infra/sandbox-cdn.toml',
            'infra/render-deploy.yaml',
            'infra/leapcell-deploy.json',
            'infra/production.env.template'
        ];

        configFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.copyFileSync(file, path.join(deployDir, path.basename(file)));
            }
        });

        printStatus('Deployment artifacts created in dist/deployments/');

        // Print deployment instructions
        console.log('');
        printHeader('📋 Next Steps for Production Deployment:');
        console.log('');
        console.log(`${colors.white}1. Static Site (Cloudflare Pages):${colors.reset}`);
        console.log('   - Connect your Git repository to Cloudflare Pages');
        console.log('   - Set build command: \'npm run build\'');
        console.log('   - Set build output directory: \'apps/web-static/dist\'');
        console.log('   - Configure environment variables from production.env.template');
        console.log('');
        console.log(`${colors.white}2. Backend Server:${colors.reset}`);
        console.log('   - For Render.com: Push render-deploy.yaml to your repository root');
        console.log('   - For Leapcell: Use leapcell-deploy.json configuration');
        console.log('   - Set environment variables from production.env.template');
        console.log('');
        console.log(`${colors.white}3. Game Sandbox:${colors.reset}`);
        console.log('   - Deploy dist/deployments/sandbox to CDN');
        console.log('   - Use sandbox-cdn.toml for Cloudflare Pages configuration');
        console.log('   - Configure environment variables for game');
        console.log('');
        console.log(`${colors.white}4. Environment Variables:${colors.reset}`);
        console.log('   - Copy production.env.template to .env.production');
        console.log('   - Fill in actual values for secrets and URLs');
        console.log('   - Configure secrets in your deployment platform');
        console.log('');

        printStatus('Production deployment preparation completed! 🎉');

    } catch (error) {
        printError(`Deployment preparation failed: ${error.message}`);
        process.exit(1);
    }
}

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        fs.readdirSync(src).forEach(item => {
            copyRecursive(path.join(src, item), path.join(dest, item));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

if (require.main === module) {
    main().catch(error => {
        printError(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}