# 🚀 X2PAY Production Checklist

## ✅ Buy & Burn Configuration

### Required Environment Variables

```env
# Solana Wallet (REQUIRED for buy & burn)
SOLANA_PUBLIC_KEY=your_public_key_here
SOLANA_PRIVATE_KEY=your_private_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Pump.fun API (REQUIRED for buying)
PUMP_API_KEY=your_pump_api_key_here

# Auto-Buy & Burn Settings
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02                    # SOL amount per buy
AUTO_BUY_INTERVAL=60000                # Milliseconds (60000 = 1 minute)
TOKEN_MINT_ADDRESS=YourTokenMintHere   # REQUIRED: Token to buy and burn
```

### ✅ Validation Checks

The system now validates:
- ✅ Token mint address is configured
- ✅ Token mint address is valid Solana public key format
- ✅ Pump.fun API is configured
- ✅ Burn service is initialized (with SOLANA_PRIVATE_KEY)
- ✅ Auto-buy stops if token mint not configured (prevents spam errors)

## 🔥 Buy & Burn Cycle

### Production-Ready Features

1. **Buy Process:**
   - ✅ Validates token mint address before buying
   - ✅ Collects creator fees (optional, doesn't fail if none available)
   - ✅ Purchases tokens with proper error handling
   - ✅ Logs transaction signatures for tracking

2. **Burn Process:**
   - ✅ Waits for tokens to arrive (30 second timeout)
   - ✅ Verifies token balance before burning
   - ✅ Retry logic (3 attempts with 5 second delays)
   - ✅ Confirms burn transaction succeeded
   - ✅ Verifies balance after burn (ensures tokens destroyed)
   - ✅ Provides Solscan links for transaction verification

3. **Error Handling:**
   - ✅ Won't crash on errors (continues retrying)
   - ✅ Detailed logging for debugging
   - ✅ Graceful handling of network delays
   - ✅ Stops auto-buy if critical config missing

4. **Safety Features:**
   - ✅ Validates configuration on startup
   - ✅ Stops auto-buy if token mint missing
   - ✅ Prevents buying without valid token address
   - ✅ Logs all transactions for audit trail

## 📊 Monitoring

### Check Auto-Buy Status

```bash
# API Endpoint
curl http://localhost:3000/api/auto-buy/status

# Response includes:
# - enabled: true/false
# - running: true/false
# - amount: SOL amount per buy
# - interval: milliseconds
# - nextBuyTime: timestamp
```

### Log Monitoring

The system logs:
- `[AUTO-BUY]` - All buy operations
- `[BURN]` - All burn operations
- `[CYCLE]` - Complete buy→burn cycles
- Transaction signatures for tracking on Solscan

## ⚠️ Common Issues

### Issue: "TOKEN_MINT_ADDRESS not configured"
**Solution:** Set `TOKEN_MINT_ADDRESS` in your `.env` file

### Issue: "Burn service not initialized"
**Solution:** Set `SOLANA_PRIVATE_KEY` and `SOLANA_RPC_URL` in your `.env` file

### Issue: "Tokens did not arrive in time"
**Solution:** Network delay - tokens may arrive later. Check wallet manually.

### Issue: "All burn attempts FAILED"
**Solution:** 
1. Check wallet has SOL for transaction fees
2. Verify token mint address is correct
3. Check RPC endpoint is accessible
4. Review logs for specific error messages

## 🔍 Verification Steps

### 1. Check Configuration
```bash
# Verify all required env vars are set
npm run dev
# Look for startup logs showing configuration status
```

### 2. Test Buy & Burn
```bash
# Start auto-buy
curl -X POST http://localhost:3000/api/auto-buy/start

# Check status
curl http://localhost:3000/api/auto-buy/status

# Monitor logs for buy/burn cycle
```

### 3. Verify Transactions
1. Check Solscan links in logs for buy transactions
2. Verify tokens arrived in wallet
3. Check Solscan links in logs for burn transactions
4. Verify wallet balance is 0 after burn

## 🎯 Production Deployment

### Before Going Live:

1. ✅ Test on devnet first
2. ✅ Verify all environment variables are set
3. ✅ Test manual buy/burn cycle
4. ✅ Monitor first few automated cycles
5. ✅ Set up log monitoring/alerts
6. ✅ Ensure wallet has sufficient SOL for fees
7. ✅ Verify RPC endpoint reliability

### Recommended Settings:

```env
# Conservative settings for production
AUTO_BUY_AMOUNT=0.01                    # Smaller amount for testing
AUTO_BUY_INTERVAL=120000               # 2 minutes (safer interval)
NODE_ENV=production                     # Enable production mode
```

### After Deployment:

1. Monitor first buy/burn cycle completes
2. Verify transactions on Solscan
3. Check logs for any errors
4. Gradually adjust interval/amount as needed

---

**Status:** ✅ Production-Ready with comprehensive error handling and validation

