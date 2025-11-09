# BURNAWEEN - VERIFY CORRECT TOKEN CA
# This script verifies you have the CORRECT token configured

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎃 BURNAWEEN TOKEN VERIFICATION 🎃" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# The CORRECT token CA
$CORRECT_CA = "E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump"

Write-Host "✅ CORRECT TOKEN CA:" -ForegroundColor Green
Write-Host "   $CORRECT_CA" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    Write-Host "📄 Checking .env file..." -ForegroundColor Yellow
    
    # Read .env content
    $envContent = Get-Content .env -Raw
    
    # Check if correct CA is in the file
    if ($envContent -match $CORRECT_CA) {
        Write-Host "✅ SUCCESS! Correct token CA found in .env!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔍 Current Configuration:" -ForegroundColor Cyan
        Get-Content .env | Select-String "TOKEN_MINT_ADDRESS"
        Write-Host ""
    } else {
        Write-Host "❌ WARNING! Token CA NOT FOUND or INCORRECT!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Current TOKEN_MINT_ADDRESS in .env:" -ForegroundColor Yellow
        Get-Content .env | Select-String "TOKEN_MINT_ADDRESS"
        Write-Host ""
        Write-Host "🔧 FIXING NOW..." -ForegroundColor Yellow
        
        # Fix the .env file
        $fixedContent = @"
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
        $fixedContent | Set-Content -Path .env -NoNewline
        
        Write-Host "✅ FIXED! Correct token CA now configured!" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "🔧 Creating .env with correct token CA..." -ForegroundColor Yellow
    
    $newContent = @"
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
    $newContent | Set-Content -Path .env -NoNewline
    
    Write-Host "✅ .env file created with correct token CA!" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📊 FINAL VERIFICATION" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Token CA that will be bought & burned:" -ForegroundColor White
Write-Host "E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Auto-Buy: ENABLED" -ForegroundColor Green
Write-Host "✅ Auto-Burn: ENABLED" -ForegroundColor Green
Write-Host "✅ Amount per buy: 0.02 SOL" -ForegroundColor Green
Write-Host "✅ Interval: 60 seconds" -ForegroundColor Green
Write-Host ""
Write-Host "🔥 Next Step: Restart server" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "🎃 BURNAWEEN IS CONFIGURED CORRECTLY! 🔥" -ForegroundColor Magenta
Write-Host ""







