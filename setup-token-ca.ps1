# BURNAWEEN Token CA Setup Script
# Run this to configure your token contract address

$envContent = @"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
SOLANA_PUBLIC_KEY=HdoH3sAkc1ECJreuqpJ3rRAsiK1xM1ZNdgd1MYQSUrbS
SOLANA_PRIVATE_KEY=3WEpNYsKZCCLCixNVE2qBxZCWAq5cRvmEYDTcSeoXAdAq3qCKcEZ2qMkxdx6WzTsRpP23zRgq1QHMWCSZgwggaJL
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_API_KEY=f1b4pbuhdtv6gk35dd22pvuca9nm6m2kdt856dbt9wv7gr9g84wkevkgct64pgk2a58qccuqdnapcdtm85h46cb78dgp4dj2dt4nmhkh5dj6jw3mc9gkakutetumcva1759mukvka4yku5dp7grur91w6cthqattkak9jd4anr72hu3exjperag95wkgx2tb9t36e3t8t8kuf8
AUTO_BUY_ENABLED=false
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000
TOKEN_MINT_ADDRESS=E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump
"@

# Write to .env file
$envContent | Out-File -FilePath .env -Encoding UTF8 -NoNewline

Write-Host "✅ Token CA configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Token Contract Address: E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart server: npm start" -ForegroundColor White
Write-Host "2. Enable auto-buy (optional): Set AUTO_BUY_ENABLED=true in .env" -ForegroundColor White
Write-Host ""
Write-Host "🎃 BURNAWEEN is ready for launch! 🔥" -ForegroundColor Magenta

















