# ⚙️ Burnathon - Configuration Options Guide

## 🎯 **Current Configuration**

Based on your project files:

### Active Settings
- **Token:** `HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump`
- **Buy Amount:** 0.02 SOL
- **Interval:** 30 seconds (30000ms)
- **Auto-buy:** Enabled
- **Port:** 3000

---

## 🔧 **Configuration Methods**

### Method 1: Edit .env File (Recommended)
```bash
# Open .env file
notepad .env

# Or use any text editor
code .env
```

### Method 2: Environment Variables
```bash
# Windows
set AUTO_BUY_AMOUNT=0.05
npm run dev

# Linux/Mac
AUTO_BUY_AMOUNT=0.05 npm run dev
```

### Method 3: API Control (Runtime)
```bash
# Stop/Start auto-buy without restarting
curl -X POST http://localhost:3000/api/auto-buy/stop
curl -X POST http://localhost:3000/api/auto-buy/start
```

---

## 📊 **Configuration Options Reference**

### Core Settings

#### PUMP_API_KEY
- **Required:** Yes
- **Type:** String
- **Description:** Your Pump.fun API key from https://pumpportal.fun
- **Example:** `PUMP_API_KEY=abc123xyz789`

#### SOLANA_PUBLIC_KEY
- **Required:** Yes
- **Type:** String (Base58)
- **Description:** Your wallet's public key
- **Example:** `SOLANA_PUBLIC_KEY=FMizW9DDc5xM5tgaQNov4Bc6rH5SFmsStbexH3FES9vW`

#### SOLANA_PRIVATE_KEY
- **Required:** Yes
- **Type:** String (Base58 or Array)
- **Description:** Your wallet's private key (KEEP SECRET!)
- **Security:** Never commit to git, share, or expose
- **Example:** `SOLANA_PRIVATE_KEY=[1,2,3,...]` or base58 string

#### TOKEN_MINT_ADDRESS
- **Required:** For auto-buy
- **Type:** String (Base58)
- **Description:** The token you want to buy
- **Current:** `HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump`
- **Example:** `TOKEN_MINT_ADDRESS=HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump`

---

### Auto-Buy Settings

#### AUTO_BUY_ENABLED
- **Required:** No
- **Type:** Boolean
- **Default:** `false`
- **Options:** `true` or `false`
- **Description:** Enable/disable automatic buying
- **Example:** `AUTO_BUY_ENABLED=true`

#### AUTO_BUY_AMOUNT
- **Required:** No
- **Type:** Number (SOL)
- **Default:** `0.02`
- **Range:** 0.001 - 10 (recommended)
- **Description:** SOL amount to spend per buy
- **Example:** `AUTO_BUY_AMOUNT=0.05`

#### AUTO_BUY_INTERVAL
- **Required:** No
- **Type:** Number (milliseconds)
- **Default:** `60000` (1 minute)
- **Range:** 10000+ (minimum 10 seconds recommended)
- **Description:** Time between automatic buys
- **Examples:**
  - 15 seconds: `AUTO_BUY_INTERVAL=15000`
  - 30 seconds: `AUTO_BUY_INTERVAL=30000`
  - 1 minute: `AUTO_BUY_INTERVAL=60000`
  - 5 minutes: `AUTO_BUY_INTERVAL=300000`

---

### Network Settings

#### SOLANA_RPC_URL
- **Required:** No
- **Type:** String (URL)
- **Default:** `https://api.mainnet-beta.solana.com`
- **Description:** Solana RPC endpoint
- **Options:**
  - Mainnet: `https://api.mainnet-beta.solana.com`
  - Devnet: `https://api.devnet.solana.com`
  - Custom RPC: `https://your-rpc-provider.com`
- **Example:** `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`

---

### Server Settings

#### NODE_ENV
- **Required:** No
- **Type:** String
- **Default:** `development`
- **Options:** `development` or `production`
- **Description:** Runtime environment
- **Example:** `NODE_ENV=production`

#### PORT
- **Required:** No
- **Type:** Number
- **Default:** `3000`
- **Range:** 1024 - 65535
- **Description:** Server port
- **Example:** `PORT=8080`

#### HOST
- **Required:** No
- **Type:** String
- **Default:** `0.0.0.0`
- **Description:** Server host binding
- **Options:**
  - All interfaces: `0.0.0.0`
  - Localhost only: `127.0.0.1`
- **Example:** `HOST=0.0.0.0`

---

## 💡 **Preset Configurations**

### Conservative (Low Budget)
```env
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.01
AUTO_BUY_INTERVAL=120000  # 2 minutes
```
**Cost:** ~0.3 SOL/hour, ~7.2 SOL/day

### Moderate (Balanced)
```env
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000  # 1 minute
```
**Cost:** ~1.2 SOL/hour, ~28.8 SOL/day

### Aggressive (High Activity)
```env
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.05
AUTO_BUY_INTERVAL=30000  # 30 seconds
```
**Cost:** ~6 SOL/hour, ~144 SOL/day

### Ultra Aggressive (Maximum Pressure)
```env
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.1
AUTO_BUY_INTERVAL=15000  # 15 seconds
```
**Cost:** ~24 SOL/hour, ~576 SOL/day

---

## 🎮 **Dynamic Configuration (API)**

You can control the bot while it's running:

### Check Current Status
```bash
curl http://localhost:3000/api/auto-buy/status
```

Response:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "running": true,
    "amount": 0.02,
    "interval": 30000,
    "intervalSeconds": 30,
    "lastBuyTime": 1729574880000,
    "nextBuyTime": 1729574910000,
    "timeUntilNext": 15234
  }
}
```

### Stop Auto-Buy (Pause)
```bash
curl -X POST http://localhost:3000/api/auto-buy/stop
```

### Start Auto-Buy (Resume)
```bash
curl -X POST http://localhost:3000/api/auto-buy/start
```

### Manual Buy (Immediate)
```bash
curl -X POST http://localhost:3000/api/auto-buy/manual
```

### Collect Creator Fees
```bash
curl -X POST http://localhost:3000/api/collect-creator-fees \
  -H "Content-Type: application/json" \
  -d '{"priorityFee": 0.000001}'
```

---

## 🔄 **Applying Configuration Changes**

### For .env Changes:
1. Stop the bot (Ctrl+C or `pm2 stop burntober`)
2. Edit `.env` file
3. Restart the bot (`npm run dev` or `pm2 restart burntober`)

### For Runtime Changes:
Use the API endpoints (no restart required)

---

## 📊 **Cost Calculator**

Formula: `(Amount × 3600000 / Interval) × Hours = Total SOL`

Examples:
- **0.02 SOL every 30s for 1 hour:** 2.4 SOL
- **0.05 SOL every 60s for 1 hour:** 3 SOL
- **0.01 SOL every 120s for 24 hours:** 7.2 SOL

Quick calculation: `(60 / (Interval/1000)) × Amount = SOL per hour`

---

## ⚠️ **Important Notes**

1. **Start Small:** Test with small amounts first
2. **Monitor Balance:** Ensure wallet has enough SOL
3. **Priority Fees:** Higher fees = faster transactions
4. **Network Congestion:** May affect transaction speed
5. **Slippage:** Token price can change between order and execution
6. **Creator Fees:** Auto-collected before each buy

---

## 🔐 **Security Best Practices**

1. ✅ Never commit `.env` to git
2. ✅ Use a dedicated wallet for the bot
3. ✅ Start with small amounts
4. ✅ Monitor regularly
5. ✅ Keep private keys secure
6. ✅ Backup configuration safely
7. ✅ Use strong API keys
8. ✅ Review logs for suspicious activity

---

## 📱 **Quick Reference Card**

| Want to... | Set to... |
|-----------|----------|
| Buy every 15 seconds | `AUTO_BUY_INTERVAL=15000` |
| Buy every 30 seconds | `AUTO_BUY_INTERVAL=30000` |
| Buy every 1 minute | `AUTO_BUY_INTERVAL=60000` |
| Buy every 5 minutes | `AUTO_BUY_INTERVAL=300000` |
| Spend 0.01 SOL per buy | `AUTO_BUY_AMOUNT=0.01` |
| Spend 0.05 SOL per buy | `AUTO_BUY_AMOUNT=0.05` |
| Spend 0.1 SOL per buy | `AUTO_BUY_AMOUNT=0.1` |
| Disable auto-buy | `AUTO_BUY_ENABLED=false` |
| Enable auto-buy | `AUTO_BUY_ENABLED=true` |

---

**Need help? Check the dashboard at http://localhost:3000 🔥**


