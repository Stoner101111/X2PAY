# X2PAY - Update Wallet & API Credentials

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "UPDATING X2PAY CREDENTIALS" -ForegroundColor Blue
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$envContent = @"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
SOLANA_PUBLIC_KEY=4BLLfDnAkZ5dk63d6GE2ShY9QEof9vrXyWZe7nTeMdH4
SOLANA_PRIVATE_KEY=2X8TPTbgdoQGZ662eUP8bZZB36TuL7SGaSWYdhCUjBvCSgzq2WcDU1Ma3mgf55PpYLKzAZFG6qZ2ephvCG7aNZkE
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_API_KEY=65m7ad3tah46ckbm8xrnaru16rqpmxhhc5272cbm8n43aubpen3k8v285dv32wk6758q0x3eatwk6rkmamrpahu4a1wmcm369dk5ehjmdth7egu4d596rha3cnq4we2e8d36cthgcwykua1d4wgvq95tmac2f61c4phaeagax53ahbc9hvngjkd912pwvu2dwrqckkae58kuf8
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=30000
TOKEN_MINT_ADDRESS=
"@

# Write to .env file
$envContent | Set-Content -Path .env -NoNewline -Encoding UTF8

Write-Host "Credentials updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEW CONFIGURATION:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wallet Public Key: 4BLLfDnAkZ5dk63d6GE2ShY9QEof9vrXyWZe7nTeMdH4" -ForegroundColor White
Write-Host ""
Write-Host "Wallet Private Key: [SECURED]" -ForegroundColor Green
Write-Host ""
Write-Host "API Key: [CONFIGURED]" -ForegroundColor Green
Write-Host ""
Write-Host "Auto-Buy and Burn: ENABLED (0.02 SOL every 30 seconds)" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Restart server: npm run dev" -ForegroundColor White
Write-Host "  2. Ensure wallet has SOL" -ForegroundColor White
Write-Host "  3. Monitor terminal logs" -ForegroundColor White
Write-Host ""
Write-Host "X2PAY CREDENTIALS UPDATED!" -ForegroundColor Blue
Write-Host ""
