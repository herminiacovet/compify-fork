#!/bin/bash

# Sandbox Deployment Script
# This script builds and prepares the game sandbox for CDN deployment

set -e

echo "🎮 Building Compify Game Sandbox for CDN Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the sandbox directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the apps/sandbox directory"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/

# Install dependencies
print_status "Installing dependencies..."
npm install

# Run tests
print_status "Running tests..."
npm test || {
    print_error "Tests failed. Please fix before deploying."
    exit 1
}

# Build for production
print_status "Building for production..."
npm run build:prod

# Verify build
print_status "Verifying build..."
node verify-deployment.js || {
    print_error "Build verification failed. Please check the issues above."
    exit 1
}

# Create deployment package
print_status "Creating deployment package..."
mkdir -p ../../dist/sandbox-deployment

# Copy built assets
cp -r dist/* ../../dist/sandbox-deployment/

# Copy configuration files
cp deploy.md ../../dist/sandbox-deployment/
cp verify-deployment.js ../../dist/sandbox-deployment/
cp ../../infra/sandbox-cdn.toml ../../dist/sandbox-deployment/

# Copy _headers file for Cloudflare Pages
if [ -f "public/_headers" ]; then
    cp public/_headers ../../dist/sandbox-deployment/
fi

# Create deployment info
cat > ../../dist/sandbox-deployment/DEPLOYMENT.md << EOF
# Sandbox Deployment Package

This package contains the built Compify Game Sandbox ready for CDN deployment.

## Contents

- **Game files**: All built assets (HTML, JS, CSS)
- **Configuration**: CDN configuration files
- **Documentation**: Deployment guide and verification script

## Quick Deploy

### Cloudflare Pages
1. Upload all files to Cloudflare Pages
2. Use sandbox-cdn.toml for configuration
3. Set build command: \`npm run build:prod\`
4. Set output directory: \`dist\`

### Other CDN Services
1. Upload all files to your CDN
2. Configure cache headers as specified in _headers file
3. Ensure proper MIME types for .js files

## Verification

Run the verification script after deployment:
\`\`\`bash
node verify-deployment.js
\`\`\`

## Build Info

- Built on: $(date)
- Node version: $(node --version)
- npm version: $(npm --version)
- Build command: npm run build:prod

EOF

print_status "Deployment package created in ../../dist/sandbox-deployment/"

# Calculate package size
PACKAGE_SIZE=$(du -sh ../../dist/sandbox-deployment/ | cut -f1)
print_status "Package size: $PACKAGE_SIZE"

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. For Cloudflare Pages:"
echo "   - Create new project in Cloudflare Pages"
echo "   - Upload contents of dist/sandbox-deployment/"
echo "   - Or connect Git repository with sandbox-cdn.toml config"
echo ""
echo "2. For other CDN services:"
echo "   - Upload dist/sandbox-deployment/ contents to your CDN"
echo "   - Configure cache headers from _headers file"
echo "   - Ensure proper MIME types for JavaScript files"
echo ""
echo "3. Test deployment:"
echo "   - Access your deployed URL"
echo "   - Verify game loads and runs correctly"
echo "   - Test on different devices and browsers"
echo ""

print_status "Sandbox deployment preparation completed! 🎉"