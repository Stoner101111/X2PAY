# BURNAWEEN - Update Wallet & API Credentials

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎃 UPDATING BURNAWEEN CREDENTIALS 🎃" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$envContent = @"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
SOLANA_PUBLIC_KEY=DQNtFJrYcx18JquxK4ztpV2PKmAL54cK5nJdwFrytNFP
SOLANA_PRIVATE_KEY=459kywWntosMwr2geysMMnbdGEs6dVo4a8kvCLoSetp3q4HKnoAqG9qWWioob2MeMuJzS4qyW39out1HEAuMicm3
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_API_KEY=6ru7athkc8v7ahke9hx6rcumawun2mue9nq7ay9nf5c7mckd9h262whj6xh58nkqdd45cx26ad0n4mhfah1qcrvga9v4ww9bdmv4wpbged338tjjf1h6yvtmchd3jp9n9hckawkea4yku6xrk2tj2f1172vhp5wt58x3kdgcrvjyhj6b543edbqanv46u2f6957cna7dx0kuf8
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000
TOKEN_MINT_ADDRESS=E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump
"@

# Write to .env file
$envContent | Set-Content -Path .env -NoNewline

Write-Host "✅ Credentials updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEW CONFIGURATION:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wallet Public Key:" -ForegroundColor Cyan
Write-Host "  DQNtFJrYcx18JquxK4ztpV2PKmAL54cK5nJdwFrytNFP" -ForegroundColor White
Write-Host ""
Write-Host "Wallet Private Key:" -ForegroundColor Cyan
Write-Host "  [SECURED]" -ForegroundColor Green
Write-Host ""
Write-Host "API Key:" -ForegroundColor Cyan
Write-Host "  [CONFIGURED]" -ForegroundColor Green
Write-Host ""
Write-Host "Token CA:" -ForegroundColor Cyan
Write-Host "  E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump" -ForegroundColor White
Write-Host ""
Write-Host "Auto-Buy & Burn:" -ForegroundColor Cyan
Write-Host "  ✅ ENABLED (0.02 SOL every 60 seconds)" -ForegroundColor Green
Write-Host ""
Write-Host "🔥 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Restart server: npm start" -ForegroundColor White
Write-Host "  2. Ensure new wallet has SOL" -ForegroundColor White
Write-Host "  3. Monitor terminal logs" -ForegroundColor White
Write-Host ""
Write-Host "🎃 BURNAWEEN CREDENTIALS UPDATED! 🔥" -ForegroundColor Magenta
Write-Host ""







