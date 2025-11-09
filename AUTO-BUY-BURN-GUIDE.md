# 🔥 AUTO BUY & BURN - COMPLETE GUIDE

## 🎯 YOUR TOKEN CA:
```
E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump
```

---

## ⚡ QUICK SETUP (2 OPTIONS):

### Option 1: Run PowerShell Script (EASIEST)
```powershell
.\ENABLE-AUTO-BUY-BURN.ps1
```
Then restart: `npm start`

### Option 2: Manual Edit
1. Open `.env` file
2. Change these lines:
```env
TOKEN_MINT_ADDRESS=E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump
AUTO_BUY_ENABLED=true
```
3. Save and restart: `npm start`

---

## 🔥 WHAT WILL HAPPEN:

### Automatic Cycle (Every 60 seconds):

1. **🛒 BUY**: System buys 0.02 SOL worth of your token
   - Transaction sent to Solana
   - Tokens arrive in wallet

2. **⏳ WAIT**: System waits for tokens to arrive (up to 30 seconds)

3. **🔥 BURN**: System burns ALL tokens in wallet
   - Tokens sent to null address
   - Permanently destroyed

4. **💰 COLLECT**: System collects creator fees
   - Rewards sent to your wallet

5. **⏰ REPEAT**: Cycle repeats every 60 seconds

---

## 📊 CONFIGURATION:

| Setting | Value | What It Does |
|---------|-------|-------------|
| **TOKEN_MINT_ADDRESS** | `E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump` | Your token to buy/burn |
| **AUTO_BUY_ENABLED** | `true` | Enables automatic buying |
| **AUTO_BUY_AMOUNT** | `0.02` | SOL amount per purchase |
| **AUTO_BUY_INTERVAL** | `60000` | Milliseconds (60 seconds) |

---

## 💰 COST CALCULATION:

**Per Cycle:**
- Token purchase: 0.02 SOL
- Gas fees: ~0.00001 SOL
- **Total per cycle: ~0.02001 SOL**

**Per Hour:**
- 60 cycles (1 per minute)
- **Cost: ~1.2 SOL/hour**

**Per Day:**
- 1,440 cycles
- **Cost: ~28.8 SOL/day**

⚠️ **Make sure your wallet has enough SOL!**

---

## 📋 TERMINAL LOGS YOU'LL SEE:

```
[INFO] 🤖 Auto-buy: Attempting to buy 0.02 SOL worth of tokens...
[INFO] 💰 Collected creator fees: [signature]
[INFO] 🛒 Auto-buy SUCCESS: 0.02 SOL - Transaction: [signature]
[INFO] 🔥 Token: E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump
[INFO] ⏳ Waiting for tokens to arrive in wallet...
[INFO] 🔥 BURNING tokens now...
[INFO] 🔥🔥🔥 BURN SUCCESS: [amount] tokens DESTROYED!
[INFO] 🔥 Burn transaction: [signature]
[INFO] ✅ BUY → BURN CYCLE COMPLETE!
```

---

## 🎛️ PORTAL CONTROLS:

Even with auto-buy enabled, you can use portal buttons:

- **🎃 Start Haunting** - Starts auto-buy (if stopped)
- **💀 Stop Ritual** - Stops auto-buy immediately
- **🔥 Incinerate Token** - Manual burn
- **🍬 Collect Treats** - Manual rewards collection

---

## ⚠️ IMPORTANT SAFETY NOTES:

### Before Enabling:
✅ Verify wallet has enough SOL (at least 5-10 SOL recommended)
✅ Double-check token CA is correct
✅ Test with manual buy first (use portal buttons)
✅ Monitor first few cycles closely

### While Running:
✅ Watch terminal logs for errors
✅ Check wallet balance regularly
✅ Monitor Solscan for transactions
✅ Be ready to stop if needed (💀 Stop Ritual button)

### How to Stop:
1. **Portal Button**: Click "💀 Stop Ritual"
2. **Terminal**: Press `Ctrl+C`
3. **Edit .env**: Set `AUTO_BUY_ENABLED=false` and restart

---

## 🔍 VERIFY IT'S WORKING:

### Check Status:
```bash
curl http://localhost:3000/api/auto-buy/status
```

### Check Portal:
Open http://localhost:3000
- Countdown timer should be running
- Stats should update after each cycle

### Check Solscan:
https://solscan.io/account/HdoH3sAkc1ECJreuqpJ3rRAsiK1xM1ZNdgd1MYQSUrbS
- View recent transactions
- See burn transactions
- Verify token movements

---

## 🚨 TROUBLESHOOTING:

### "Auto-buy FAILED"
- Check wallet SOL balance
- Verify token CA is correct
- Check RPC endpoint is working

### "BURN FAILED"
- Tokens may not have arrived yet
- Check wallet on Solscan
- System will retry next cycle

### "Tokens did not arrive in time"
- Network congestion
- RPC delay
- Tokens will burn in next cycle

---

## 📊 EXPECTED RESULTS:

✅ **Buying**: Continuous buy pressure on token
✅ **Burning**: Reduces circulating supply
✅ **Volume**: Increases trading volume
✅ **Rewards**: Collects creator fees for you

---

## 🎃 FINAL CHECKLIST:

- [ ] Token CA configured: `E4arvD15WEDkqrKyk6fVF3zYqDDa6197Kkq4Sy3zpump`
- [ ] AUTO_BUY_ENABLED set to `true`
- [ ] Wallet has sufficient SOL (5-10 SOL minimum)
- [ ] Server restarted: `npm start`
- [ ] Watching terminal logs for first cycle
- [ ] Portal accessible at http://localhost:3000
- [ ] Ready to monitor transactions

---

## 🔥 YOU'RE READY!

Run the script or edit .env manually, then restart your server!

**The system will automatically buy and burn your token every 60 seconds! 🎃🔥**

---

## 📞 QUICK COMMANDS:

**Run auto-buy setup:**
```powershell
.\ENABLE-AUTO-BUY-BURN.ps1
```

**Restart server:**
```bash
npm start
```

**Stop server:**
```bash
Ctrl+C
```

**Check status:**
```bash
curl http://localhost:3000/api/auto-buy/status
```

---

**LET THE BURNING BEGIN! 🔥👻🎃**

















