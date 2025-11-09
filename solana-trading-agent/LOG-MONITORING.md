# 📊 Burnathon - Log Monitoring & Tracking Guide

## 🔍 **What to Monitor**

Your Burnathon bot logs important events for tracking performance and debugging issues.

---

## 📝 **Log Types**

### 1. Startup Logs
```
[INFO] 🔥 Burnathon Starting...
[INFO] 📊 Dashboard will be available at http://0.0.0.0:3000
[INFO] 🤖 Auto-buy ENABLED: 0.02 SOL every 30 seconds
[INFO] ✅ Server running at http://0.0.0.0:3000
[INFO] 🎉 Burnathon is ready!
```

### 2. Auto-Buy Activity
```
[INFO] 🤖 Auto-buy: Attempting to buy 0.02 SOL worth of tokens...
[INFO] 💰 Collected creator fees: 5XGZf...ABC123
[INFO] 🛒 Auto-buy SUCCESS: 0.02 SOL - Transaction: 3kHnP...XYZ789
[INFO] 🔥 Token: HydrUA3pQw1rcijFadAvM3mqBNfpgP1qJq55eMWEpump
```

### 3. Error Logs
```
[ERROR] Auto-buy error: [error details]
[ERROR] ❌ TOKEN_MINT_ADDRESS not configured - cannot buy tokens!
[ERROR] 🛒 Auto-buy FAILED: Insufficient funds
```

### 4. API Request Logs
```
[INFO] API request from ::ffff:127.0.0.1: POST /api/auto-buy/stop
[INFO] 🚀 Auto-buy started manually
[INFO] ⏹️ Auto-buy stopped manually
```

---

## 📂 **Log Locations**

### Development Mode (`npm run dev`)
**Location:** Console output (terminal)
**Persistence:** No (lost when terminal closes)

**View:**
```bash
# Just watch your terminal where you ran:
npm run dev
```

### PM2 Mode (`pm2 start`)
**Location:** `./logs/` directory
**Files:**
- `out.log` - Standard output
- `err.log` - Error output
- `combined.log` - All logs

**View:**
```bash
# Real-time logs
pm2 logs burntober

# Last 100 lines
pm2 logs burntober --lines 100

# Only errors
pm2 logs burntober --err

# Only output
pm2 logs burntober --out

# View log files directly
cat logs/out.log
cat logs/err.log
cat logs/combined.log
```

### Docker Mode (`docker-compose up`)
**Location:** Docker container logs
**Persistence:** Managed by Docker

**View:**
```bash
# Real-time logs
docker-compose logs -f burntober

# Last 100 lines
docker-compose logs --tail=100 burntober

# Save to file
docker-compose logs > burntober-logs.txt
```

---

## 🎯 **Key Metrics to Track**

### Transaction Success Rate
Look for these patterns:
```
✅ SUCCESS: "🛒 Auto-buy SUCCESS"
❌ FAILURE: "🛒 Auto-buy FAILED"
```

**Calculate:**
```
Success Rate = (Successful buys / Total attempts) × 100%
```

### Creator Fee Collection
```
💰 Collected creator fees: [TX_SIGNATURE]
```

**Track:**
- How often fees are collected
- Transaction signatures for verification
- Any collection failures

### Token Purchases
```
🛒 Auto-buy SUCCESS: 0.02 SOL - Transaction: [TX_SIGNATURE]
🔥 Token: [MINT_ADDRESS]
```

**Track:**
- Number of successful purchases
- SOL spent per transaction
- Transaction signatures
- Time between purchases

### Errors and Issues
```
[ERROR] Auto-buy error: [details]
[ERROR] ❌ [error message]
```

**Common errors:**
- Insufficient funds
- Network issues
- Invalid token address
- API rate limits

---

## 📊 **Log Analysis Tools**

### Create a Log Parser
Save this as `parse-logs.js`:
```javascript
const fs = require('fs');

// Read log file
const logs = fs.readFileSync('logs/out.log', 'utf8').split('\n');

let stats = {
  totalBuys: 0,
  successfulBuys: 0,
  failedBuys: 0,
  feesCollected: 0,
  errors: []
};

logs.forEach(line => {
  if (line.includes('Auto-buy SUCCESS')) stats.successfulBuys++;
  if (line.includes('Auto-buy FAILED')) stats.failedBuys++;
  if (line.includes('Collected creator fees')) stats.feesCollected++;
  if (line.includes('[ERROR]')) stats.errors.push(line);
});

stats.totalBuys = stats.successfulBuys + stats.failedBuys;
stats.successRate = ((stats.successfulBuys / stats.totalBuys) * 100).toFixed(2) + '%';

console.log('📊 Burnathon Statistics:');
console.log(JSON.stringify(stats, null, 2));
```

Run: `node parse-logs.js`

### PowerShell Log Analysis
```powershell
# Count successful buys
Get-Content logs\out.log | Select-String "Auto-buy SUCCESS" | Measure-Object

# Count failed buys  
Get-Content logs\out.log | Select-String "Auto-buy FAILED" | Measure-Object

# Find all errors
Get-Content logs\err.log | Select-String "ERROR"

# Get last 20 transactions
Get-Content logs\out.log | Select-String "Transaction:" | Select-Object -Last 20

# Count fees collected
Get-Content logs\out.log | Select-String "Collected creator fees" | Measure-Object
```

### Bash Log Analysis (Linux/Mac/WSL)
```bash
# Count successful buys
grep -c "Auto-buy SUCCESS" logs/out.log

# Count failed buys
grep -c "Auto-buy FAILED" logs/out.log

# Extract all transaction signatures
grep "Transaction:" logs/out.log | awk -F'Transaction: ' '{print $2}'

# Get last 20 lines
tail -20 logs/out.log

# Follow logs in real-time
tail -f logs/out.log

# Count errors
grep -c "ERROR" logs/err.log

# Show only errors
grep "ERROR" logs/err.log
```

---

## 📈 **Create a Log Dashboard**

### Option 1: File Watcher Script
Save as `watch-logs.ps1`:
```powershell
$logFile = "logs\out.log"

Write-Host "📊 Watching Burnathon logs..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

Get-Content $logFile -Wait | ForEach-Object {
    $line = $_
    
    if ($line -match "SUCCESS") {
        Write-Host $line -ForegroundColor Green
    }
    elseif ($line -match "FAILED|ERROR") {
        Write-Host $line -ForegroundColor Red
    }
    elseif ($line -match "Collected creator fees") {
        Write-Host $line -ForegroundColor Cyan
    }
    else {
        Write-Host $line
    }
}
```

Run: `powershell .\watch-logs.ps1`

### Option 2: Simple Web Viewer
Create `log-viewer.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Burnathon Logs</title>
    <style>
        body { background: #000; color: #0f0; font-family: monospace; padding: 20px; }
        .success { color: #0f0; }
        .error { color: #f00; }
        .info { color: #0ff; }
    </style>
</head>
<body>
    <h1>🔥 Burnathon Live Logs</h1>
    <div id="logs"></div>
    <script>
        // Fetch and display logs every 2 seconds
        setInterval(async () => {
            const response = await fetch('/api/logs');
            const logs = await response.text();
            document.getElementById('logs').innerHTML = logs.split('\n')
                .slice(-50)  // Last 50 lines
                .map(line => {
                    let className = '';
                    if (line.includes('SUCCESS')) className = 'success';
                    if (line.includes('ERROR')) className = 'error';
                    if (line.includes('Collected')) className = 'info';
                    return `<div class="${className}">${line}</div>`;
                })
                .join('');
        }, 2000);
    </script>
</body>
</html>
```

---

## 🔔 **Set Up Alerts**

### Email Alerts (Example with nodemailer)
```javascript
const nodemailer = require('nodemailer');

function sendAlert(subject, message) {
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.ALERT_EMAIL,
            pass: process.env.ALERT_PASSWORD
        }
    });

    transporter.sendMail({
        from: process.env.ALERT_EMAIL,
        to: process.env.ALERT_TO,
        subject: `🔥 Burnathon: ${subject}`,
        text: message
    });
}

// Add to your code:
if (buyResult.success) {
    logger.info(`✅ Buy successful`);
} else {
    logger.error(`❌ Buy failed: ${buyResult.error}`);
    sendAlert('Buy Failed', `Transaction failed: ${buyResult.error}`);
}
```

### Discord Webhook (Simple)
```javascript
const axios = require('axios');

async function sendDiscordAlert(message) {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
        content: `🔥 **Burnathon Alert**\n${message}`
    });
}

// Usage:
if (!buyResult.success) {
    await sendDiscordAlert(`❌ Auto-buy failed: ${buyResult.error}`);
}
```

---

## 📦 **Log Rotation**

### PM2 Log Rotation (Automatic)
Already configured in `ecosystem.config.js`:
- Logs stored in `./logs/`
- Auto-rotates when large
- Keeps history

### Manual Log Rotation
```bash
# Archive old logs
mkdir -p logs/archive
mv logs/out.log logs/archive/out-$(date +%Y%m%d).log
mv logs/err.log logs/archive/err-$(date +%Y%m%d).log

# PM2 will create new log files automatically
pm2 restart burntober
```

### PowerShell Log Rotation
```powershell
# Create archive directory
New-Item -ItemType Directory -Force -Path logs\archive

# Archive logs with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Move-Item logs\out.log logs\archive\out-$timestamp.log
Move-Item logs\err.log logs\archive\err-$timestamp.log

# Restart to create new logs
pm2 restart burntober
```

---

## 🎯 **Best Practices**

1. **Monitor Regularly**
   - Check logs at least daily
   - Look for unusual patterns
   - Track success rates

2. **Archive Logs**
   - Keep logs for at least 30 days
   - Archive monthly for long-term analysis
   - Compress old logs to save space

3. **Set Up Alerts**
   - Alert on consecutive failures
   - Alert on low wallet balance
   - Alert on API errors

4. **Track Metrics**
   - Success rate over time
   - Average transaction cost
   - Creator fees collected
   - Daily SOL spent

5. **Debug Issues**
   - Always check logs first
   - Look for error patterns
   - Verify transaction signatures on Solscan

---

## 📞 **Quick Reference**

| Command | Purpose |
|---------|---------|
| `pm2 logs burntober` | View live PM2 logs |
| `pm2 logs --lines 100` | Last 100 lines |
| `docker-compose logs -f` | Docker live logs |
| `tail -f logs/out.log` | Follow log file |
| `grep "ERROR" logs/err.log` | Find errors |
| `Get-Content logs\out.log -Tail 50` | Last 50 lines (PS) |

---

**Monitor your bot's performance in real-time! 🔥**











