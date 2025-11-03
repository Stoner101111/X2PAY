# 🔥 BURNATHON - START HERE

## 🎯 **What is This?**

**Burnathon** is an automated Solana trading bot that:
- 🛒 Automatically buys your token on pump.fun
- 💰 Collects creator rewards before each buy
- 🔥 Creates constant buy pressure
- 📊 Provides real-time dashboard monitoring

---

## ⚡ **Quick Start (3 Steps)**

### Step 1: Configure Your Credentials
Edit the `.env` file (if it doesn't exist, create it):

```env
# Get API key from https://pumpportal.fun
PUMP_API_KEY=your_pump_api_key_here

# Your Solana wallet credentials
SOLANA_PUBLIC_KEY=your_public_key_here
SOLANA_PRIVATE_KEY=your_private_key_here

# Your token address
TOKEN_MINT_ADDRESS=HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump

# Auto-buy settings
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=30000
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Bot
```bash
npm run dev
```

### Step 4: Open Dashboard
Open: **http://localhost:3000**

---

## 📚 **Documentation Index**

Choose your path:

### 🚀 **Getting Started**
1. **START-HERE.md** ⬅ You are here
2. **SETUP-GUIDE.md** - Complete setup instructions
3. **CONFIGURATION-OPTIONS.md** - All configuration options

### 🔧 **Configuration**
- **CONFIGURATION-OPTIONS.md** - Detailed config reference
- **ecosystem.config.js** - PM2 configuration
- **docker-compose.yml** - Docker configuration
- **.env** - Your credentials (DO NOT COMMIT)

### 🚀 **Deployment**
- **DEPLOYMENT-GUIDE.md** - Production deployment
- **PRODUCTION-READY.md** - Production checklist
- **DEPLOYMENT.md** - Additional deployment info

### 📊 **Monitoring**
- **LOG-MONITORING.md** - Log tracking guide
- **STATUS-CHECK.md** - Current status info
- **TOKEN-LAUNCH-STATUS.md** - Launch status
- **TOKEN-LIVE.md** - Live bot status

### 📖 **Reference**
- **README.md** - Project overview
- **package.json** - Dependencies
- **tsconfig.json** - TypeScript config

---

## 🎮 **Common Commands**

### Development
```bash
# Start bot (development mode)
npm run dev

# Build for production
npm run build

# Test API connection
npm run test-api

# Type check
npm run lint
```

### Production (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs burntober

# Stop
pm2 stop burntober

# Restart
pm2 restart burntober
```

### Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f burntober

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 🎯 **Dashboard Features**

Once running, visit **http://localhost:3000** for:

- 🔥 Real-time burn counter
- 💎 Rewards collected counter
- ⏱️ Next auto-buy countdown
- 🎮 Manual control buttons
  - Burn Token
  - Claim Rewards
  - Start/Stop Auto-Buy
  - Create Token
- 📊 Live status updates

---

## ⚙️ **Configuration Presets**

### Conservative (Low Budget)
```env
AUTO_BUY_AMOUNT=0.01
AUTO_BUY_INTERVAL=120000  # 2 minutes
```
**Cost:** ~0.3 SOL/hour

### Moderate (Balanced) - **DEFAULT**
```env
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=30000  # 30 seconds
```
**Cost:** ~2.4 SOL/hour

### Aggressive (High Activity)
```env
AUTO_BUY_AMOUNT=0.05
AUTO_BUY_INTERVAL=30000  # 30 seconds
```
**Cost:** ~6 SOL/hour

### Ultra Aggressive
```env
AUTO_BUY_AMOUNT=0.1
AUTO_BUY_INTERVAL=15000  # 15 seconds
```
**Cost:** ~24 SOL/hour

---

## 🔍 **How It Works**

### Auto-Buy Cycle (Every 30 seconds):

1. **Collect Creator Fees** 💰
   - Automatically claims your creator rewards from pump.fun
   
2. **Buy Token** 🛒
   - Purchases 0.02 SOL worth of your token
   
3. **Log Transaction** 📝
   - Records transaction signature for verification

4. **Wait & Repeat** ⏱️
   - Waits 30 seconds, then repeats

### What You Get:
- ✅ Constant buy pressure on your token
- ✅ Automatic creator fee collection
- ✅ Reduced circulating supply
- ✅ Price support
- ✅ Transaction history
- ✅ Real-time monitoring

---

## 📊 **Monitoring Your Bot**

### Real-Time Dashboard
Open **http://localhost:3000** to see:
- Live countdown timer
- Burn counter
- Rewards collected
- Status indicators

### API Endpoints
```bash
# Check status
curl http://localhost:3000/api/auto-buy/status

# Manual buy
curl -X POST http://localhost:3000/api/auto-buy/manual

# Stop auto-buy
curl -X POST http://localhost:3000/api/auto-buy/stop

# Start auto-buy
curl -X POST http://localhost:3000/api/auto-buy/start

# Health check
curl http://localhost:3000/health
```

### View Logs
```bash
# Development mode
# Just watch your terminal

# PM2 mode
pm2 logs burntober

# Docker mode
docker-compose logs -f burntober
```

---

## 🐛 **Troubleshooting**

### Bot Won't Start
```bash
# Check if .env file exists
ls .env

# Verify all required variables set
cat .env

# Check Node version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Auto-Buy Not Working
```bash
# Verify configuration
curl http://localhost:3000/api/auto-buy/status

# Check wallet balance
# Make sure you have enough SOL

# Check logs for errors
# Look for [ERROR] messages
```

### Port 3000 Already In Use
```bash
# Option 1: Kill existing process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Option 2: Change port
# Edit .env: PORT=8080
```

### Transaction Failures
```bash
# Check wallet balance
# Need enough SOL for buys + fees

# Check token address
# Verify TOKEN_MINT_ADDRESS is correct

# Check network status
# Visit https://status.solana.com

# Increase priority fee
# Edit your API call with higher priorityFee
```

---

## 🔐 **Security Checklist**

Before you start:
- [ ] `.env` file created with YOUR credentials
- [ ] `.env` is in `.gitignore` (already done ✅)
- [ ] NEVER commit private keys to git
- [ ] Wallet has sufficient SOL balance
- [ ] API key is valid and active
- [ ] Using separate wallet for bot (recommended)
- [ ] Started with small amounts for testing

---

## 📈 **Expected Results**

With default settings (0.02 SOL every 30 seconds):

**Per Hour:**
- 120 buy transactions
- 120 creator fee collections
- ~2.4 SOL spent

**Per Day:**
- 2,880 buy transactions
- 2,880 creator fee collections
- ~57.6 SOL spent

**Benefits:**
- Constant buy pressure
- Regular fee collection
- Price support
- Reduced supply
- Transaction history

---

## 🎯 **Next Steps**

### For Testing:
1. ✅ Configure `.env` with valid credentials
2. ✅ Start with small AUTO_BUY_AMOUNT (0.01)
3. ✅ Run `npm run dev`
4. ✅ Watch for successful transactions
5. ✅ Monitor dashboard

### For Production:
1. ✅ Test thoroughly in development
2. ✅ Choose deployment method (PM2/Docker)
3. ✅ Set up monitoring
4. ✅ Configure auto-restart
5. ✅ Set up log rotation
6. ✅ Configure alerts (optional)

### For Support:
- 📖 Read **SETUP-GUIDE.md** for detailed setup
- ⚙️ Check **CONFIGURATION-OPTIONS.md** for all options
- 🚀 See **DEPLOYMENT-GUIDE.md** for production
- 📊 Review **LOG-MONITORING.md** for log tracking
- ✅ Check **PRODUCTION-READY.md** for checklist

---

## 💡 **Pro Tips**

1. **Start Small**
   - Test with 0.01 SOL first
   - Verify everything works
   - Scale up gradually

2. **Monitor Regularly**
   - Check dashboard daily
   - Review transaction history
   - Watch for errors

3. **Optimize Settings**
   - Adjust based on budget
   - Balance frequency vs. cost
   - Monitor token price impact

4. **Keep Records**
   - Archive logs monthly
   - Track total SOL spent
   - Monitor success rate

5. **Security First**
   - Use dedicated wallet
   - Never share private keys
   - Keep backups secure

---

## 🔥 **Ready to Launch?**

```bash
# 1. Install dependencies
npm install

# 2. Configure .env
notepad .env

# 3. Start the bot
npm run dev

# 4. Open dashboard
start http://localhost:3000
```

---

## 📞 **Quick Reference**

| File | Purpose |
|------|---------|
| **START-HERE.md** | Quick start guide (this file) |
| **SETUP-GUIDE.md** | Detailed setup instructions |
| **CONFIGURATION-OPTIONS.md** | All configuration options |
| **DEPLOYMENT-GUIDE.md** | Production deployment |
| **LOG-MONITORING.md** | Log tracking & analysis |
| **STATUS-CHECK.md** | Current status info |
| **.env** | Your credentials (edit this!) |

---

**🔥 LET'S GET BURNING! 🚀**

Questions? Check the docs above or review the logs for troubleshooting.


