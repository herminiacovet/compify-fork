#!/bin/bash

# Backend Deployment Script
# This script builds and prepares the backend for deployment

set -e

echo "🚀 Building Compify Backend for Deployment"

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

# Check if we're in the backend directory
if [ ! -f "go.mod" ]; then
    print_error "Please run this script from the apps/backend directory"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -f ../../dist/compify-backend*

# Tidy dependencies
print_status "Tidying Go modules..."
go mod tidy

# Run tests
print_status "Running tests..."
go test ./... || {
    print_error "Tests failed. Please fix before deploying."
    exit 1
}

# Build for Linux (most cloud platforms)
print_status "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o ../../dist/compify-backend ./cmd

# Build for local testing (current platform)
print_status "Building for local testing..."
go build -o ../../dist/compify-backend-local ./cmd

# Verify builds
if [ -f "../../dist/compify-backend" ]; then
    print_status "✓ Linux binary built successfully"
else
    print_error "✗ Linux binary build failed"
    exit 1
fi

if [ -f "../../dist/compify-backend-local" ]; then
    print_status "✓ Local binary built successfully"
else
    print_error "✗ Local binary build failed"
    exit 1
fi

# Create deployment package
print_status "Creating deployment package..."
mkdir -p ../../dist/backend-deployment

# Copy binary
cp ../../dist/compify-backend ../../dist/backend-deployment/

# Copy configuration files
cp production.env.template ../../dist/backend-deployment/
cp deploy.md ../../dist/backend-deployment/
cp verify-deployment.go ../../dist/backend-deployment/

# Copy infrastructure configurations
cp ../../infra/render-deploy.yaml ../../dist/backend-deployment/
cp ../../infra/leapcell-deploy.json ../../dist/backend-deployment/

print_status "Deployment package created in ../../dist/backend-deployment/"

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. For Render.com:"
echo "   - Push your code to Git repository"
echo "   - Connect repository to Render"
echo "   - Use render-deploy.yaml configuration"
echo "   - Set environment variables from production.env.template"
echo ""
echo "2. For Leapcell:"
echo "   - Use leapcell-deploy.json configuration"
echo "   - Deploy with: leapcell deploy --config leapcell-deploy.json"
echo "   - Set environment variables using leapcell CLI"
echo ""
echo "3. Verify deployment:"
echo "   - Set BACKEND_URL environment variable"
echo "   - Run: go run verify-deployment.go"
echo ""

print_status "Backend deployment preparation completed! 🎉"