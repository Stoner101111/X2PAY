# x4Pay Portal Deployment Script
# Automated deployment to Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  x4Pay Portal Deployment" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
try {
    vercel --version | Out-Null
    Write-Host "✓ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host ""

# Deploy to Vercel
try {
    vercel --prod --yes
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your portal is now live!" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "Need to login first. Opening browser..." -ForegroundColor Yellow
    Write-Host ""
    vercel login
    Write-Host ""
    Write-Host "Login complete. Retrying deployment..." -ForegroundColor Yellow
    vercel --prod --yes
}

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""

