# BURNAWEEN - Enable Auto Buy & Burn
# Token CA: E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump

Write-Host "🎃 BURNAWEEN - Configuring Auto Buy & Burn..." -ForegroundColor Magenta
Write-Host ""

# Create .env with auto-buy ENABLED
$envContent = @"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
SOLANA_PUBLIC_KEY=HdoH3sAkc1ECJreuqpJ3rRAsiK1xM1ZNdgd1MYQSUrbS
SOLANA_PRIVATE_KEY=3WEpNYsKZCCLCixNVE2qBxZCWAq5cRvmEYDTcSeoXAdAq3qCKcEZ2qMkxdx6WzTsRpP23zRgq1QHMWCSZgwggaJL
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_API_KEY=f1b4pbuhdtv6gk35dd22pvuca9nm6m2kdt856dbt9wv7gr9g84wkevkgct64pgk2a58qccuqdnapcdtm85h46cb78dgp4dj2dt4nmhkh5dj6jw3mc9gkakutetumcva1759mukvka4yku5dp7grur91w6cthqattkak9jd4anr72hu3exjperag95wkgx2tb9t36e3t8t8kuf8
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000
TOKEN_MINT_ADDRESS=E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump
"@

# Write to .env file
$envContent | Set-Content -Path .env -NoNewline

Write-Host "✅ Configuration saved!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 AUTO BUY & BURN SETTINGS:" -ForegroundColor Yellow
Write-Host "   Token CA: E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump" -ForegroundColor Cyan
Write-Host "   Auto-Buy: ENABLED ✅" -ForegroundColor Green
Write-Host "   Buy Amount: 0.02 SOL per purchase" -ForegroundColor White
Write-Host "   Interval: 60 seconds (1 minute)" -ForegroundColor White
Write-Host "   Auto-Burn: ENABLED ✅ (burns immediately after buy)" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "   1. Make sure your wallet has enough SOL" -ForegroundColor Yellow
Write-Host "   2. Restart server: npm start" -ForegroundColor Yellow
Write-Host "   3. Watch terminal for buy/burn logs" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔥 System will now:" -ForegroundColor Magenta
Write-Host "   ✅ Buy 0.02 SOL worth every 60 seconds" -ForegroundColor White
Write-Host "   ✅ Burn tokens immediately after purchase" -ForegroundColor White
Write-Host "   ✅ Collect creator rewards automatically" -ForegroundColor White
Write-Host ""
Write-Host "🎃 BURNAWEEN AUTO BUY & BURN IS READY! 🔥" -ForegroundColor Green







