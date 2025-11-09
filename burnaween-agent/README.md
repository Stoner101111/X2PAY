# 🚀 XPAY2WIN Agent

**Token buy & burn agent for Solana pump.fun tokens**

---

## 🔥 What is XPAY2WIN?

XPAY2WIN is an automated trading agent that:
- 🛒 **Automatically buys** your token on pump.fun
- 🔥 **Automatically burns** all purchased tokens (100% burn rate!)
- 💰 **Collects creator fees** before each buy
- 🎃 **Halloween-themed** spooky interface
- 📊 **Real-time dashboard** with countdown timer

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd xpay2win-agent
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PUMP_API_KEY=your_pump_api_key_here
SOLANA_PUBLIC_KEY=your_public_key_here
SOLANA_PRIVATE_KEY=your_private_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
TOKEN_MINT_ADDRESS=your_token_mint_address_here
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000
PORT=3001
```

### 3. Start the Agent

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

### 4. Access Dashboard

Open your browser to: **http://localhost:3001**

---

## 🔥 How It Works

### The Complete Burn Cycle

Every configured interval (default: 60 seconds):

1. **💰 Collect Creator Fees**
   - Claims all available trading fees from pump.fun
   
2. **🛒 Buy Tokens**  
   - Purchases configured SOL amount worth of your token
   
3. **⏳ Wait for Tokens**
   - Monitors wallet for purchased tokens (up to 30 seconds)
   
4. **🔥 BURN EVERYTHING**
   - Permanently destroys ALL tokens using SPL Token burn
   
5. **✅ COMPLETE**
   - Cycle repeats automatically

---

## 🎯 Features

### Automatic Buy & Burn
- ✅ Constant buy pressure on your token
- ✅ 100% burn rate (all purchased tokens are destroyed)
- ✅ Deflationary tokenomics
- ✅ Fully automated - no manual intervention needed

### Production-Ready
- ✅ Retry logic for failed burns
- ✅ Transaction confirmation
- ✅ Balance verification
- ✅ Comprehensive error handling
- ✅ Graceful shutdown

### Dashboard
- 🎃 Spooky Halloween-themed UI
- ⏰ Real-time countdown timer
- 📊 Statistics tracking
- 🎮 Manual control buttons

---

## 📊 Configuration Options

### Auto-Buy Settings

```env
# Enable/disable auto-buy
AUTO_BUY_ENABLED=true

# SOL amount per buy
AUTO_BUY_AMOUNT=0.02

# Interval between buys (milliseconds)
AUTO_BUY_INTERVAL=60000  # 60 seconds
```

### Preset Configurations

**Conservative (Low Budget)**
```env
AUTO_BUY_AMOUNT=0.01
AUTO_BUY_INTERVAL=120000  # 2 minutes
```
Cost: ~0.3 SOL/hour

**Moderate (Balanced) - DEFAULT**
```env
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000  # 1 minute
```
Cost: ~1.2 SOL/hour

**Aggressive (High Activity)**
```env
AUTO_BUY_AMOUNT=0.05
AUTO_BUY_INTERVAL=30000  # 30 seconds
```
Cost: ~6 SOL/hour

---

## 🔌 API Endpoints

### Auto-Buy Control

**Start Auto-Buy**
```bash
POST /api/auto-buy/start
```

**Stop Auto-Buy**
```bash
POST /api/auto-buy/stop
```

**Get Status**
```bash
GET /api/auto-buy/status
```

**Manual Buy**
```bash
POST /api/auto-buy/manual
```

**Update Token**
```bash
POST /api/auto-buy/update-token
Body: { "tokenMintAddress": "your_token_address" }
```

### Other Endpoints

**Collect Creator Fees**
```bash
POST /api/collect-creator-fees
Body: { "priorityFee": 0.000001 }
```

**Get Wallet Info**
```bash
GET /api/wallet-info
```

**Health Check**
```bash
GET /health
GET /api/health
```

---

## 🛠️ Development

### Scripts

```bash
# Build TypeScript
npm run build

# Start development server
npm run dev

# Start in production mode
npm start

# Watch mode (auto-reload)
npm run watch

# Type check
npm run lint

# Clean build files
npm run clean
```

---

## 📁 Project Structure

```
xpay2win-agent/
├── src/
│   ├── agent.ts          # Main agent server
│   ├── burnService.ts     # Token burning logic
│   └── pumpApi.ts         # Pump.fun API integration
├── public/                # Static files (if needed)
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## ⚠️ Important Notes

### Wallet Requirements

- **SOL Balance:** Ensure sufficient SOL for:
  - Token purchases (configured amount per cycle)
  - Transaction fees (~0.000005 SOL per tx)
  - Minimum 5 SOL recommended for continuous operation

### Token Availability

- Bot waits up to 30 seconds for tokens after purchase
- If tokens don't arrive, cycle completes without burn
- Next cycle will retry automatically

### Network Conditions

- Burns may take longer during network congestion
- All transactions include proper confirmation
- Failed burns are logged for review

---

## 🔥 The Power of Buy & Burn

### Traditional Buy Bots:
❌ Buy tokens → Accumulate in wallet → No supply impact

### XPAY2WIN (This Agent):
✅ Buy tokens → Immediately burn → **PERMANENT supply reduction**

---

## 📈 Expected Impact

### Per Cycle (60 seconds):
- **Buy:** 0.02 SOL → Tokens
- **Burn:** 100% of purchased tokens
- **Net Effect:** Price support + supply reduction

### Per Hour:
- **60 buy cycles**
- **60 burn transactions**  
- **1.2 SOL of buy pressure**
- **100% of purchased tokens destroyed**

### Per Day:
- **1,440 buy & burn cycles**
- **28.8 SOL of buy pressure**
- **Massive supply reduction**

---

## 🎉 Why XPAY2WIN?

- 🚀 **Modern Design** - Professional interface
- 🔥 **True Burn** - Uses Solana's native burn function
- 🤖 **Fully Automated** - Set it and forget it
- 📊 **Transparent** - All burns visible on-chain
- 💪 **Production-Ready** - Robust error handling
- 🚀 **Easy Setup** - Configure and run in minutes

---

## 🔗 Links

- **Dashboard:** http://localhost:3001
- **Solscan:** https://solscan.io (to verify burns)
- **Pump.fun:** https://pump.fun

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎃 Happy Haunting!

**XPAY2WIN - Win Through Automated Token Burning** 🔥🚀

---

*Last Updated: November 2025*  
*Status: OPERATIONAL* ✅

