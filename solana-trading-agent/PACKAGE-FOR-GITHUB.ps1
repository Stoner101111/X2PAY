# Package X2PAY for GitHub Upload
# This script copies essential files to a new directory for GitHub upload

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PACKAGING X2PAY FOR GITHUB UPLOAD" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Create target directory
$targetDir = "X2PAY-GITHUB"
if (Test-Path $targetDir) {
    Write-Host "Removing existing $targetDir directory..." -ForegroundColor Yellow
    Remove-Item -Path $targetDir -Recurse -Force
}

Write-Host "Creating $targetDir directory..." -ForegroundColor Green
New-Item -ItemType Directory -Path $targetDir | Out-Null

# Essential files and folders to copy
$essentialItems = @(
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

# Documentation files to include
$docFiles = @(
    "START-HERE.md",
    "QUICK-START-X402.md",
    "X402-PAYMENTS.md",
    "PUBLISH-TO-WEB.md",
    "PYTHON-BRIDGE-README.md",
    "COMPLETE-IMPLEMENTATION.md",
    "COMPLETE-X402-IMPLEMENTATION.md",
    "X402-IMPLEMENTATION-SUMMARY.md",
    "DEPLOYMENT-GUIDE.md",
    "PRODUCTION-READY.md",
    "CONFIGURATION-OPTIONS.md",
    "SETUP-GUIDE.md",
    "HOW-TO-USE-X402.md"
)

Write-Host ""
Write-Host "Copying essential files and folders..." -ForegroundColor Yellow

# Copy essential items
foreach ($item in $essentialItems) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $targetDir -Recurse -Force
        Write-Host "  Copied: $item" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $item" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying documentation files..." -ForegroundColor Yellow

# Copy documentation
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Copy-Item -Path $doc -Destination $targetDir -Force
        Write-Host "  Copied: $doc" -ForegroundColor Green
    }
}

# Create .env.example file
Write-Host ""
Write-Host "Creating .env.example..." -ForegroundColor Yellow
$envExample = "NODE_ENV=development`nPORT=3000`nHOST=0.0.0.0`nSOLANA_PUBLIC_KEY=your_public_key_here`nSOLANA_PRIVATE_KEY=your_private_key_here`nSOLANA_RPC_URL=https://api.mainnet-beta.solana.com`nPUMP_API_KEY=your_api_key_here`nAUTO_BUY_ENABLED=false`nAUTO_BUY_AMOUNT=0.02`nAUTO_BUY_INTERVAL=30000`nTOKEN_MINT_ADDRESS="

$envExample | Out-File -FilePath "$targetDir\.env.example" -Encoding UTF8
Write-Host "  Created: .env.example" -ForegroundColor Green

# Create upload instructions
Write-Host ""
Write-Host "Creating upload instructions..." -ForegroundColor Yellow
$instructions = @"
================================================================================
  X2PAY - GitHub Upload Instructions
================================================================================

This folder contains all files needed to upload to GitHub.

You can upload via:

1. GITHUB WEBSITE (Easiest):
   - Go to: https://github.com/Stoner101111/X2PAY
   - Click "uploading an existing file"
   - Drag entire X2PAY-GITHUB folder contents
   - Commit changes

2. GIT COMMAND LINE:
   cd X2PAY-GITHUB
   git init
   git add .
   git commit -m "Initial commit: X2PAY"
   git remote add origin https://github.com/Stoner101111/X2PAY.git
   git push -u origin main

3. ZIP AND UPLOAD:
   - Zip this entire folder
   - Extract to your local machine
   - Use GitHub CLI or desktop app to push

================================================================================

Your portal is already live at:
https://solana-trading-agent-1jc2g5mgj-idatorresm-8500s-projects.vercel.app

================================================================================
"@

$instructions | Out-File -FilePath "$targetDir\UPLOAD-INSTRUCTIONS.txt" -Encoding UTF8
Write-Host "  Created: UPLOAD-INSTRUCTIONS.txt" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PACKAGING COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Folder ready: $targetDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "What's included:" -ForegroundColor Cyan
Write-Host "   Source code (src/, public/, api/)" -ForegroundColor White
Write-Host "   Arduino examples" -ForegroundColor White
Write-Host "   Python hardware bridge" -ForegroundColor White
Write-Host "   Configuration files" -ForegroundColor White
Write-Host "   Documentation" -ForegroundColor White
Write-Host "   LICENSE and README" -ForegroundColor White
Write-Host "   .env.example template" -ForegroundColor White
Write-Host ""
Write-Host "What's excluded (protected):" -ForegroundColor Cyan
Write-Host "   .env files (your secrets)" -ForegroundColor White
Write-Host "   node_modules/ (dependencies)" -ForegroundColor White
Write-Host "   dist/ (build output)" -ForegroundColor White
Write-Host "   logs/ (log files)" -ForegroundColor White
Write-Host ""
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "   Open the $targetDir folder and follow UPLOAD-INSTRUCTIONS.txt" -ForegroundColor White
Write-Host ""
