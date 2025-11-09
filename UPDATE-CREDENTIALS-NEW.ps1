# X402GATE - Update Wallet & API Credentials

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🔄 UPDATING X402GATE CREDENTIALS 🔄" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$envContent = @"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
SOLANA_PUBLIC_KEY=gsrRicZVTocSkP1R7krsHNaQikngv7DfkCZ98LpzM8M
SOLANA_PRIVATE_KEY=2V2Z5mmWerdMkj26xpYQ9UgL1bbnJQXoAsHnNsi426aRibd6z4kby6J8RC2XQVVbbo35fXoY4VfukgA6TZ5hAXFf
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_API_KEY=e0u6gkvp9586jhj661mqexbad4tkamkr6nmngdkd9d864jvdanu74rkh6gtn0mhja1v7abuf88vq8wa29h4nexbqc5b68uuaa4v6umbfc4v6crae8du5ehar9xvpumuk8xw4yh2ja4yku8dn50cj389x5jgk6ed9ngav78r8986yh25ax54ymbme9w4wmkaah8kcrvb9d8kuf8
AUTO_BUY_ENABLED=false
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000
TOKEN_MINT_ADDRESS=
"@

# Write to .env file
$envContent | Set-Content -Path .env -NoNewline

Write-Host "✅ Credentials updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEW CONFIGURATION:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wallet Public Key:" -ForegroundColor Cyan
Write-Host "  gsrRicZVTocSkP1R7krsHNaQikngv7DfkCZ98LpzM8M" -ForegroundColor White
Write-Host ""
Write-Host "Wallet Private Key:" -ForegroundColor Cyan
Write-Host "  [SECURED]" -ForegroundColor Green
Write-Host ""
Write-Host "API Key:" -ForegroundColor Cyan
Write-Host "  [CONFIGURED]" -ForegroundColor Green
Write-Host ""
Write-Host "🤖 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Restart server: npm run dev" -ForegroundColor White
Write-Host "  2. Verify credentials are loaded" -ForegroundColor White
Write-Host "  3. Test X402 payment functionality" -ForegroundColor White
Write-Host ""
Write-Host "X402GATE CREDENTIALS UPDATED!" -ForegroundColor Green
Write-Host ""
