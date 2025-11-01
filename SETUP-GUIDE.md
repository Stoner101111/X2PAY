# 🚀 Burnathon - Complete Setup Guide

## 📋 **Step 1: Configure Your Environment**

### Edit the `.env` file and replace these values:

1. **PUMP_API_KEY** - Get from https://pumpportal.fun
2. **SOLANA_PUBLIC_KEY** - Your wallet public key
3. **SOLANA_PRIVATE_KEY** - Your wallet private key
4. **TOKEN_MINT_ADDRESS** - The token you want to buy

Current token: `HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump`

---

## 🎮 **Step 2: Choose How to Run**

### Option A: Development Mode (Easiest)
```bash
npm run dev
```
- Best for testing
- Hot reload enabled
- Verbose logging
- Dashboard: http://localhost:3000

### Option B: Production Mode with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor logs
pm2 logs burntober

# Stop
pm2 stop burntober
```

### Option C: Docker
```bash
# Build container
docker build -t burntober .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ⚙️ **Step 3: Configuration Options**

### Auto-Buy Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `AUTO_BUY_ENABLED` | true | Enable/disable auto-buy |
| `AUTO_BUY_AMOUNT` | 0.02 | SOL amount per buy |
| `AUTO_BUY_INTERVAL` | 30000 | Milliseconds between buys |

### Examples:

**Buy 0.05 SOL every minute:**
```env
AUTO_BUY_AMOUNT=0.05
AUTO_BUY_INTERVAL=60000
```

**Buy 0.01 SOL every 15 seconds:**
```env
AUTO_BUY_AMOUNT=0.01
AUTO_BUY_INTERVAL=15000
```

**Disable auto-buy:**
```env
AUTO_BUY_ENABLED=false
```

---

## 🎯 **Step 4: Monitor Your Bot**

### Dashboard
Open: http://localhost:3000

Features:
- Real-time countdown timer
- Token burn counter
- Rewards counter
- Manual controls

### API Endpoints

**Check Status:**
```bash
curl http://localhost:3000/api/auto-buy/status
```

**Manually Trigger Buy:**
```bash
curl -X POST http://localhost:3000/api/auto-buy/manual
```

**Stop Auto-Buy:**
```bash
curl -X POST http://localhost:3000/api/auto-buy/stop
```

**Start Auto-Buy:**
```bash
curl -X POST http://localhost:3000/api/auto-buy/start
```

---

## 📊 **Step 5: Track Performance**

### Logs Location
- **Development:** Console output
- **PM2:** `./logs/` directory
- **Docker:** `docker-compose logs`

### What to Watch For
```
[INFO] 💰 Collected creator fees: [TX_SIGNATURE]
[INFO] 🛒 Auto-buy SUCCESS: 0.02 SOL - Transaction: [TX_SIGNATURE]
[INFO] 🔥 Token: HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump
```

### Transaction Tracking
- View on Solscan: `https://solscan.io/tx/[TX_SIGNATURE]`
- View on Solana Explorer: `https://explorer.solana.com/tx/[TX_SIGNATURE]`

---

## 🔧 **Troubleshooting**

### Bot won't start
1. Check `.env` file has all required values
2. Verify API key is valid
3. Ensure wallet has SOL balance
4. Check Node.js version: `node --version` (needs 18+)

### Auto-buy not working
1. Check `AUTO_BUY_ENABLED=true` in `.env`
2. Verify `TOKEN_MINT_ADDRESS` is correct
3. Ensure wallet has enough SOL
4. Check API status: `curl http://localhost:3000/api/auto-buy/status`

### Transactions failing
1. Increase priority fee in `.env`
2. Check Solana network status
3. Verify RPC endpoint is responsive
4. Check wallet balance

---

## 🔐 **Security Checklist**

- ✅ `.env` file is in `.gitignore`
- ✅ Never commit private keys
- ✅ Use environment variables only
- ✅ Backup `.env` file securely
- ✅ Use separate wallet for bot
- ✅ Start with small amounts for testing

---

## 📈 **Expected Performance**

With default settings (0.02 SOL every 30 seconds):
- **Buys per minute:** 2
- **Buys per hour:** 120  
- **SOL spent per hour:** 2.4 SOL
- **Daily SOL spent:** 57.6 SOL

Adjust settings based on your budget and strategy!

---

## 🎉 **Quick Start Command**

```bash
# 1. Install dependencies
npm install

# 2. Edit .env with your keys
notepad .env

# 3. Start the bot
npm run dev

# 4. Open dashboard
start http://localhost:3000
```

---

## 📞 **Support**

- Check logs for errors
- Review `PRODUCTION-READY.md` for deployment
- See `DEPLOYMENT.md` for advanced setup
- Test with small amounts first

**🔥 Good luck with your token! 🔥**


