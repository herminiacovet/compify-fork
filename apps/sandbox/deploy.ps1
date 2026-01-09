# Sandbox Deployment Script (PowerShell)
# This script builds and prepares the game sandbox for CDN deployment

param(
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Building Compify Game Sandbox for CDN Deployment" -ForegroundColor Green

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the sandbox directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the apps/sandbox directory"
    exit 1
}

# Clean previous builds
Write-Status "Cleaning previous builds..."
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
}

# Install dependencies
Write-Status "Installing dependencies..."
npm install

# Run tests
if (-not $SkipTests) {
    Write-Status "Running tests..."
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Please fix before deploying."
        exit 1
    }
}

# Build for production
Write-Status "Building for production..."
npm run build:prod

# Verify build
Write-Status "Verifying build..."
node verify-deployment.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build verification failed. Please check the issues above."
    exit 1
}

# Create deployment package
Write-Status "Creating deployment package..."
if (-not (Test-Path "../../dist/sandbox-deployment")) {
    New-Item -ItemType Directory -Path "../../dist/sandbox-deployment" -Force | Out-Null
}

# Copy built assets
Copy-Item -Path "dist/*" -Destination "../../dist/sandbox-deployment/" -Recurse -Force

# Copy configuration files
Copy-Item "deploy.md" "../../dist/sandbox-deployment/" -Force
Copy-Item "verify-deployment.js" "../../dist/sandbox-deployment/" -Force
Copy-Item "../../infra/sandbox-cdn.toml" "../../dist/sandbox-deployment/" -Force

# Copy _headers file for Cloudflare Pages
if (Test-Path "public/_headers") {
    Copy-Item "public/_headers" "../../dist/sandbox-deployment/" -Force
}

# Create deployment info
$deploymentInfo = @"
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
3. Set build command: ``npm run build:prod``
4. Set output directory: ``dist``

### Other CDN Services
1. Upload all files to your CDN
2. Configure cache headers as specified in _headers file
3. Ensure proper MIME types for .js files

## Verification

Run the verification script after deployment:
``````bash
node verify-deployment.js
``````

## Build Info

- Built on: $(Get-Date)
- Node version: $(node --version)
- npm version: $(npm --version)
- Build command: npm run build:prod

"@

$deploymentInfo | Out-File -FilePath "../../dist/sandbox-deployment/DEPLOYMENT.md" -Encoding UTF8

Write-Status "Deployment package created in ../../dist/sandbox-deployment/"

# Calculate package size
$packageSize = (Get-ChildItem "../../dist/sandbox-deployment/" -Recurse | Measure-Object -Property Length -Sum).Sum
$packageSizeMB = [math]::Round($packageSize / 1MB, 2)
Write-Status "Package size: $packageSizeMB MB"

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. For Cloudflare Pages:" -ForegroundColor White
Write-Host "   - Create new project in Cloudflare Pages"
Write-Host "   - Upload contents of dist/sandbox-deployment/"
Write-Host "   - Or connect Git repository with sandbox-cdn.toml config"
Write-Host ""
Write-Host "2. For other CDN services:" -ForegroundColor White
Write-Host "   - Upload dist/sandbox-deployment/ contents to your CDN"
Write-Host "   - Configure cache headers from _headers file"
Write-Host "   - Ensure proper MIME types for JavaScript files"
Write-Host ""
Write-Host "3. Test deployment:" -ForegroundColor White
Write-Host "   - Access your deployed URL"
Write-Host "   - Verify game loads and runs correctly"
Write-Host "   - Test on different devices and browsers"
Write-Host ""

Write-Status "Sandbox deployment preparation completed!"