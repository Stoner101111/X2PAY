# Package Complete X2PAY Portal for Distribution

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PACKAGING X2PAY PORTAL COMPLETE" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Create target directory
$targetDir = "X2PAY-PORTAL-COMPLETE"
if (Test-Path $targetDir) {
    Write-Host "Removing existing $targetDir directory..." -ForegroundColor Yellow
    Remove-Item -Path $targetDir -Recurse -Force
}

Write-Host "Creating $targetDir directory..." -ForegroundColor Green
New-Item -ItemType Directory -Path $targetDir | Out-Null

# Essential files to copy
$itemsToCopy = @(
    "public",
    "src",
    "api",
    "arduino",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vercel.json",
    "netlify.toml",
    "Dockerfile",
    "docker-compose.yml",
    "ecosystem.config.js",
    "README.md",
    "LICENSE",
    ".gitignore",
    "requirements-python.txt",
    "x402_hardware_bridge.py"
)

# Documentation to include
$docs = @(
    "START-HERE.md",
    "QUICK-START-X402.md",
    "X402-PAYMENTS.md",
    "PUBLISH-TO-WEB.md",
    "PYTHON-BRIDGE-README.md",
    "COMPLETE-IMPLEMENTATION.md",
    "X402-IMPLEMENTATION-SUMMARY.md",
    "ADVANCED-COFFEE-README.md",
    "QUICK-START-COFFEE-MACHINE.md",
    "COFFEE-MACHINE-SUMMARY.md"
)

Write-Host ""
Write-Host "Copying portal files..." -ForegroundColor Yellow

foreach ($item in $itemsToCopy) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $targetDir -Recurse -Force
        Write-Host "  Copied: $item" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Copying documentation..." -ForegroundColor Yellow

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Copy-Item -Path $doc -Destination $targetDir -Force
        Write-Host "  Copied: $doc" -ForegroundColor Green
    }
}

# Create .env.example
Write-Host ""
Write-Host "Creating .env.example..." -ForegroundColor Yellow
$envExample = "NODE_ENV=development`nPORT=3000`nHOST=0.0.0.0`nSOLANA_PUBLIC_KEY=your_public_key_here`nSOLANA_PRIVATE_KEY=your_private_key_here`nSOLANA_RPC_URL=https://api.mainnet-beta.solana.com`nPUMP_API_KEY=your_api_key_here`nAUTO_BUY_ENABLED=false`nAUTO_BUY_AMOUNT=0.02`nAUTO_BUY_INTERVAL=30000`nTOKEN_MINT_ADDRESS="

$envExample | Out-File -FilePath "$targetDir\.env.example" -Encoding UTF8
Write-Host "  Created: .env.example" -ForegroundColor Green

# Create README for package
Write-Host ""
Write-Host "Creating package README..." -ForegroundColor Yellow
$packageReadme = @"
================================================================================
  X2PAY PORTAL - COMPLETE PACKAGE
================================================================================

This folder contains the complete X2PAY portal code ready for deployment.

--------------------------------------------------------------------------------
LIVE PORTAL:
--------------------------------------------------------------------------------

URL: https://solana-trading-agent-83vv0rp5d-idatorresm-8500s-projects.vercel.app

GitHub: https://github.com/Stoner101111/X2PAY

--------------------------------------------------------------------------------
WHAT'S INCLUDED:
--------------------------------------------------------------------------------

Portal Files:
✓ public/index.html - Complete X2PAY portal
✓ public/pricing.html - Pricing strategy tool
✓ All portal assets

Backend:
✓ src/index.ts - Express server
✓ src/services/x402Service.ts - x402 payment service
✓ src/pumpApi.ts - Pump.fun integration
✓ src/burnService.ts - Burn logic
✓ api/index.js - Vercel serverless wrapper

Hardware:
✓ arduino/ - Complete Arduino examples
✓ x402_hardware_bridge.py - Python bridge

Configuration:
✓ package.json - Dependencies
✓ tsconfig.json - TypeScript config
✓ vercel.json - Deployment config
✓ Dockerfile - Docker container

Documentation:
✓ README.md - Main documentation
✓ START-HERE.md - Quick start
✓ All guides and examples

--------------------------------------------------------------------------------
SETUP:
--------------------------------------------------------------------------------

1. Install dependencies:
   npm install

2. Configure environment:
   cp .env.example .env
   # Edit .env with your credentials

3. Start development:
   npm run dev

4. Access portal:
   http://localhost:3000

--------------------------------------------------------------------------------
DEPLOY:
--------------------------------------------------------------------------------

VERCEL:
   vercel --prod

NETLIFY:
   netlify deploy --prod

DOCKER:
   docker build -t x2pay .
   docker run -p 3000:3000 --env-file .env x2pay

--------------------------------------------------------------------------------
FEATURES:
--------------------------------------------------------------------------------

✓ X2PAY branding
✓ Welcome To X2PAY title
✓ 30-second countdown timer
✓ x402 payment integration
✓ Web Bluetooth scanner
✓ Hardware bridge status
✓ Coffee machine examples
✓ Revolutionary messaging
✓ Modern UI design

================================================================================

YOUR COMPLETE X2PAY PORTAL IS READY! 🚀

================================================================================
"@

$packageReadme | Out-File -FilePath "$targetDir\PORTAL-PACKAGE-README.txt" -Encoding UTF8
Write-Host "  Created: PORTAL-PACKAGE-README.txt" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PACKAGING COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package location: $targetDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "What's included:" -ForegroundColor Cyan
Write-Host "  Complete portal code" -ForegroundColor White
Write-Host "  All documentation" -ForegroundColor White
Write-Host "  Configuration files" -ForegroundColor White
Write-Host "  Setup instructions" -ForegroundColor White
Write-Host "  Deployment guides" -ForegroundColor White
Write-Host ""
Write-Host "You can now zip this folder and share it!" -ForegroundColor Green
Write-Host ""












