#!/bin/bash

# Production Deployment Script for Compify MVP
# This script handles the complete deployment process for all three applications

set -e

echo "🚀 Starting Compify MVP Production Deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_warning "CLOUDFLARE_API_TOKEN not set. Manual deployment to Cloudflare Pages required."
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build all applications
print_status "Building all applications..."

# Build static site
print_status "Building static site..."
cd apps/web-static
npm run build
cd ../..

# Build backend
print_status "Building backend server..."
cd apps/backend
go mod tidy
go build -o ../../dist/compify-backend ./cmd
cd ../..

# Build sandbox
print_status "Building game sandbox..."
cd apps/sandbox
npm run build
cd ../..

print_status "All builds completed successfully!"

# Create deployment artifacts
print_status "Creating deployment artifacts..."
mkdir -p dist/deployments

# Copy static site build
cp -r apps/web-static/dist dist/deployments/static-site

# Copy sandbox build
cp -r apps/sandbox/dist dist/deployments/sandbox

# Copy backend binary
cp dist/compify-backend dist/deployments/

# Copy deployment configurations
cp infra/cloudflare-pages.toml dist/deployments/
cp infra/sandbox-cdn.toml dist/deployments/
cp infra/render-deploy.yaml dist/deployments/
cp infra/leapcell-deploy.json dist/deployments/
cp infra/production.env.template dist/deployments/

print_status "Deployment artifacts created in dist/deployments/"

# Deployment instructions
echo ""
echo "📋 Next Steps for Production Deployment:"
echo ""
echo "1. Static Site (Cloudflare Pages):"
echo "   - Connect your Git repository to Cloudflare Pages"
echo "   - Set build command: 'npm run build'"
echo "   - Set build output directory: 'apps/web-static/dist'"
echo "   - Configure environment variables from production.env.template"
echo ""
echo "2. Backend Server:"
echo "   - For Render.com: Push render-deploy.yaml to your repository root"
echo "   - For Leapcell: Use leapcell-deploy.json configuration"
echo "   - Set environment variables from production.env.template"
echo ""
echo "3. Game Sandbox:"
echo "   - Deploy dist/deployments/sandbox to CDN"
echo "   - Use sandbox-cdn.toml for Cloudflare Pages configuration"
echo "   - Configure environment variables for game"
echo ""
echo "4. Environment Variables:"
echo "   - Copy production.env.template to .env.production"
echo "   - Fill in actual values for secrets and URLs"
echo "   - Configure secrets in your deployment platform"
echo ""

print_status "Production deployment preparation completed! 🎉"