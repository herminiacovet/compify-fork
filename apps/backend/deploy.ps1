# Backend Deployment Script (PowerShell)
# This script builds and prepares the backend for deployment

param(
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Building Compify Backend for Deployment" -ForegroundColor Green

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

# Check if we're in the backend directory
if (-not (Test-Path "go.mod")) {
    Write-Error "Please run this script from the apps/backend directory"
    exit 1
}

# Clean previous builds
Write-Status "Cleaning previous builds..."
Remove-Item "../../dist/compify-backend*" -Force -ErrorAction SilentlyContinue

# Tidy dependencies
Write-Status "Tidying Go modules..."
go mod tidy

# Run tests
if (-not $SkipTests) {
    Write-Status "Running tests..."
    go test ./...
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Please fix before deploying."
        exit 1
    }
}

# Build for Linux (most cloud platforms)
Write-Status "Building for Linux (amd64)..."
$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -o "../../dist/compify-backend" ./cmd

# Build for Windows (local testing)
Write-Status "Building for Windows..."
$env:GOOS = "windows"
$env:GOARCH = "amd64"
go build -o "../../dist/compify-backend.exe" ./cmd

# Reset environment variables
Remove-Item Env:GOOS -ErrorAction SilentlyContinue
Remove-Item Env:GOARCH -ErrorAction SilentlyContinue

# Verify builds
if (Test-Path "../../dist/compify-backend") {
    Write-Status "Linux binary built successfully"
} else {
    Write-Error "Linux binary build failed"
    exit 1
}

if (Test-Path "../../dist/compify-backend.exe") {
    Write-Status "Windows binary built successfully"
} else {
    Write-Error "Windows binary build failed"
    exit 1
}

# Create deployment package
Write-Status "Creating deployment package..."
if (-not (Test-Path "../../dist/backend-deployment")) {
    New-Item -ItemType Directory -Path "../../dist/backend-deployment" -Force | Out-Null
}

# Copy binary
Copy-Item "../../dist/compify-backend" "../../dist/backend-deployment/" -Force

# Copy configuration files
Copy-Item "production.env.template" "../../dist/backend-deployment/" -Force
Copy-Item "deploy.md" "../../dist/backend-deployment/" -Force
Copy-Item "verify-deployment.go" "../../dist/backend-deployment/" -Force

# Copy infrastructure configurations
Copy-Item "../../infra/render-deploy.yaml" "../../dist/backend-deployment/" -Force
Copy-Item "../../infra/leapcell-deploy.json" "../../dist/backend-deployment/" -Force

Write-Status "Deployment package created in ../../dist/backend-deployment/"

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. For Render.com:" -ForegroundColor White
Write-Host "   - Push your code to Git repository"
Write-Host "   - Connect repository to Render"
Write-Host "   - Use render-deploy.yaml configuration"
Write-Host "   - Set environment variables from production.env.template"
Write-Host ""
Write-Host "2. For Leapcell:" -ForegroundColor White
Write-Host "   - Use leapcell-deploy.json configuration"
Write-Host "   - Deploy with: leapcell deploy --config leapcell-deploy.json"
Write-Host "   - Set environment variables using leapcell CLI"
Write-Host ""
Write-Host "3. Verify deployment:" -ForegroundColor White
Write-Host "   - Set BACKEND_URL environment variable"
Write-Host "   - Run: go run verify-deployment.go"
Write-Host ""

Write-Status "Backend deployment preparation completed!"