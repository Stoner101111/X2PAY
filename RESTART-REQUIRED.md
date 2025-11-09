# 🔄 Server Restart Required

## ⚠️ Issue Detected

The server is running with **old code** and needs to be restarted to:
1. Load the new token mint address: `CvkcVhtVieCD2PcVG81JQFzeXQeQWA4MfBD6SviFpump`
2. Enable runtime token updates
3. Activate the new buy/burn functionality

## ✅ Configuration is Correct

Your `.env` file is properly configured:
- ✅ `TOKEN_MINT_ADDRESS=CvkcVhtVieCD2PcVG81JQFzeXQeQWA4MfBD6SviFpump`
- ✅ `AUTO_BUY_ENABLED=true`
- ✅ `PUMP_API_KEY` configured
- ✅ `SOLANA_PRIVATE_KEY` configured
- ✅ `SOLANA_RPC_URL` configured

## 🚀 How to Restart

### Step 1: Stop the Current Server
1. Find the terminal window running `npm run dev`
2. Press `Ctrl+C` to stop it

### Step 2: Restart the Server
```bash
npm run dev
```

### Step 3: Auto-Buy Will Start Automatically
The server will:
- Load the new token address from `.env`
- Start auto-buy/burn automatically
- Begin buying and burning every 30 seconds

## 📊 Verify It's Working

After restart, check the logs for:
```
🚀 Starting PRODUCTION auto-buy timer (with burn)...
⚙️ Configuration:
   - Buy Amount: 0.02 SOL
   - Interval: 30 seconds
   - Token: CvkcVhtVieCD2PcV...
   - Burn: ✅ ENABLED
```

Then watch for buy/burn cycles:
```
🤖 [AUTO-BUY] Starting buy cycle: 0.02 SOL
🛒 [AUTO-BUY] Purchasing...
✅ [AUTO-BUY] Purchase SUCCESS
🔥 [BURN] Burning tokens...
🔥🔥🔥 [BURN] SUCCESS! X tokens DESTROYED!
✅ [CYCLE] BUY → BURN COMPLETE!
```

## 🎯 Alternative: Update Token Without Restart

After restarting with new code, you can update token at runtime:
```bash
# Update token address
curl -X POST http://localhost:3000/api/auto-buy/update-token \
  -H "Content-Type: application/json" \
  -d '{"tokenMintAddress": "CvkcVhtVieCD2PcVG81JQFzeXQeQWA4MfBD6SviFpump"}'
```

---

**Status:** Configuration ✅ | Code Updated ✅ | Server Restart Required ⚠️

