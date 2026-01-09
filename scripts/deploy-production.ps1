# Production Deployment Script for Compify MVP (PowerShell)
# This script handles the complete deployment process for all three applications

param(
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Compify MVP Production Deployment" -ForegroundColor Green

# Function to print colored output
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

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Check for required environment variables
if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Warning "CLOUDFLARE_API_TOKEN not set. Manual deployment to Cloudflare Pages required."
}

if (-not $SkipBuild) {
    # Install dependencies
    Write-Status "Installing dependencies..."
    npm install

    # Build all applications
    Write-Status "Building all applications..."

    # Build static site
    Write-Status "Building static site..."
    Set-Location "apps/web-static"
    npm run build
    Set-Location "../.."

    # Build backend
    Write-Status "Building backend server..."
    Set-Location "apps/backend"
    go mod tidy
    go build -o "../../dist/compify-backend.exe" ./cmd
    Set-Location "../.."

    # Build sandbox
    Write-Status "Building game sandbox..."
    Set-Location "apps/sandbox"
    npm run build
    Set-Location "../.."

    Write-Status "All builds completed successfully!"
}

# Create deployment artifacts
Write-Status "Creating deployment artifacts..."
if (-not (Test-Path "dist/deployments")) {
    New-Item -ItemType Directory -Path "dist/deployments" -Force | Out-Null
}

# Copy static site build
if (Test-Path "apps/web-static/dist") {
    Copy-Item -Path "apps/web-static/dist" -Destination "dist/deployments/static-site" -Recurse -Force
}

# Copy sandbox build
if (Test-Path "apps/sandbox/dist") {
    Copy-Item -Path "apps/sandbox/dist" -Destination "dist/deployments/sandbox" -Recurse -Force
}

# Copy backend binary
if (Test-Path "dist/compify-backend.exe") {
    Copy-Item -Path "dist/compify-backend.exe" -Destination "dist/deployments/" -Force
}

# Copy deployment configurations
$configFiles = @(
    "infra/cloudflare-pages.toml",
    "infra/sandbox-cdn.toml", 
    "infra/render-deploy.yaml",
    "infra/leapcell-deploy.json",
    "infra/production.env.template"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "dist/deployments/" -Force
    }
}

Write-Status "Deployment artifacts created in dist/deployments/"

# Deployment instructions
Write-Host ""
Write-Host "📋 Next Steps for Production Deployment:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Static Site (Cloudflare Pages):" -ForegroundColor White
Write-Host "   - Connect your Git repository to Cloudflare Pages"
Write-Host "   - Set build command: 'npm run build'"
Write-Host "   - Set build output directory: 'apps/web-static/dist'"
Write-Host "   - Configure environment variables from production.env.template"
Write-Host ""
Write-Host "2. Backend Server:" -ForegroundColor White
Write-Host "   - For Render.com: Push render-deploy.yaml to your repository root"
Write-Host "   - For Leapcell: Use leapcell-deploy.json configuration"
Write-Host "   - Set environment variables from production.env.template"
Write-Host ""
Write-Host "3. Game Sandbox:" -ForegroundColor White
Write-Host "   - Deploy dist/deployments/sandbox to CDN"
Write-Host "   - Use sandbox-cdn.toml for Cloudflare Pages configuration"
Write-Host "   - Configure environment variables for game"
Write-Host ""
Write-Host "4. Environment Variables:" -ForegroundColor White
Write-Host "   - Copy production.env.template to .env.production"
Write-Host "   - Fill in actual values for secrets and URLs"
Write-Host "   - Configure secrets in your deployment platform"
Write-Host ""

Write-Status "Production deployment preparation completed! 🎉"