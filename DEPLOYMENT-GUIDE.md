# 🚀 Burnathon - Complete Deployment Guide

## 📋 **Pre-Deployment Checklist**

Before deploying, ensure:
- ✅ All dependencies installed (`npm install`)
- ✅ TypeScript builds without errors (`npm run build`)
- ✅ `.env` file configured with valid credentials
- ✅ Wallet has sufficient SOL balance
- ✅ Pump.fun API key is active
- ✅ Token mint address is correct

---

## 🎯 **Deployment Options**

Choose the deployment method that fits your needs:

1. **Local Development** - Testing and development
2. **PM2 (Production)** - Best for VPS/dedicated servers
3. **Docker** - Best for containerized deployments
4. **Cloud Services** - Best for managed hosting

---

## 💻 **Option 1: Local Development**

### Quick Start
```bash
# Install dependencies
npm install

# Configure environment
notepad .env

# Start development server
npm run dev
```

### Access
- Dashboard: http://localhost:3000
- API: http://localhost:3000/api

### When to Use
- ✅ Local testing
- ✅ Development
- ✅ Quick experiments
- ❌ Not for production

---

## 🔥 **Option 2: PM2 Production**

### Installation

#### Step 1: Install PM2
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

#### Step 2: Build Project
```bash
# Clean previous builds
npm run clean

# Build TypeScript
npm run build

# Verify dist/ folder exists
ls dist/
```

#### Step 3: Start with PM2
```bash
# Start in production mode
pm2 start ecosystem.config.js --env production

# Name the process
pm2 start dist/index.js --name burntober

# Or use ecosystem config
pm2 start ecosystem.config.js
```

### PM2 Management

#### Monitor
```bash
# View process list
pm2 list

# Monitor resources
pm2 monit

# View logs
pm2 logs burntober

# View specific log
pm2 logs burntober --lines 100
```

#### Control
```bash
# Stop
pm2 stop burntober

# Restart
pm2 restart burntober

# Reload (zero-downtime)
pm2 reload burntober

# Delete process
pm2 delete burntober
```

#### Auto-Start on Boot
```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# Test (reboot and check)
pm2 list
```

### PM2 Configuration

Edit `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'burntober',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      AUTO_BUY_ENABLED: true,
      AUTO_BUY_AMOUNT: 0.02,
      AUTO_BUY_INTERVAL: 30000
    }
  }]
};
```

### When to Use PM2
- ✅ VPS/Dedicated server
- ✅ Long-running production
- ✅ Auto-restart on crashes
- ✅ Log management
- ✅ Process monitoring

---

## 🐳 **Option 3: Docker Deployment**

### Prerequisites
```bash
# Install Docker
# Windows: Docker Desktop
# Linux: docker.io

# Verify installation
docker --version
docker-compose --version
```

### Quick Deploy

#### Method A: Docker Compose (Recommended)
```bash
# 1. Edit docker-compose.yml environment variables
notepad docker-compose.yml

# 2. Build and start
docker-compose up -d

# 3. View logs
docker-compose logs -f burntober

# 4. Stop
docker-compose down
```

#### Method B: Docker CLI
```bash
# Build image
docker build -t burntober:latest .

# Run container
docker run -d \
  --name burntober \
  -p 3000:3000 \
  -e PUMP_API_KEY=your_key \
  -e SOLANA_PUBLIC_KEY=your_public_key \
  -e SOLANA_PRIVATE_KEY=your_private_key \
  -e TOKEN_MINT_ADDRESS=your_token \
  -e AUTO_BUY_ENABLED=true \
  -e AUTO_BUY_AMOUNT=0.02 \
  -e AUTO_BUY_INTERVAL=30000 \
  burntober:latest

# View logs
docker logs -f burntober

# Stop
docker stop burntober
docker rm burntober
```

### Docker Management
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Container logs
docker logs burntober
docker logs -f --tail 100 burntober

# Execute command in container
docker exec -it burntober sh

# Restart container
docker restart burntober

# Remove container
docker rm -f burntober

# Remove image
docker rmi burntober
```

### Docker Compose Configuration

Edit `docker-compose.yml`:
```yaml
version: '3.8'

services:
  burntober:
    build: .
    container_name: burntober
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PUMP_API_KEY=${PUMP_API_KEY}
      - SOLANA_PUBLIC_KEY=${SOLANA_PUBLIC_KEY}
      - SOLANA_PRIVATE_KEY=${SOLANA_PRIVATE_KEY}
      - TOKEN_MINT_ADDRESS=${TOKEN_MINT_ADDRESS}
      - AUTO_BUY_ENABLED=true
      - AUTO_BUY_AMOUNT=0.02
      - AUTO_BUY_INTERVAL=30000
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### When to Use Docker
- ✅ Consistent environments
- ✅ Easy deployment
- ✅ Isolation
- ✅ Scalability
- ✅ Cloud deployment

---

## ☁️ **Option 4: Cloud Deployment**

### AWS (EC2)

#### Step 1: Launch EC2 Instance
- AMI: Ubuntu 22.04 LTS
- Instance Type: t2.micro (free tier)
- Security Group: Allow port 3000

#### Step 2: Connect and Setup
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone your project
git clone your-repo-url
cd solana-trading-agent

# Install dependencies
npm install

# Configure environment
nano .env

# Build and start
npm run build
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

### DigitalOcean (Droplet)

#### Step 1: Create Droplet
- Image: Ubuntu 22.04
- Plan: Basic ($5/month)
- Enable backups

#### Step 2: Same as AWS EC2 setup

### Heroku

#### Step 1: Install Heroku CLI
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login
```

#### Step 2: Deploy
```bash
# Create app
heroku create your-burnathon-app

# Set environment variables
heroku config:set PUMP_API_KEY=your_key
heroku config:set SOLANA_PUBLIC_KEY=your_public_key
heroku config:set SOLANA_PRIVATE_KEY=your_private_key
heroku config:set TOKEN_MINT_ADDRESS=your_token
heroku config:set AUTO_BUY_ENABLED=true

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Step 3: Procfile
Create `Procfile`:
```
web: npm start
```

### Railway.app

#### Step 1: Connect Repository
1. Go to https://railway.app
2. Click "New Project"
3. Connect GitHub repository

#### Step 2: Configure
1. Add environment variables in dashboard
2. Set start command: `npm start`
3. Deploy automatically

### Render.com

#### Step 1: Connect Repository
1. Go to https://render.com
2. New Web Service
3. Connect GitHub

#### Step 2: Configure
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Add environment variables

---

## 🔒 **Security Best Practices**

### Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # App port
sudo ufw status

# Or use reverse proxy (recommended)
sudo ufw allow 80
sudo ufw allow 443
```

### SSL/HTTPS with Nginx

#### Install Nginx
```bash
sudo apt install nginx
sudo apt install certbot python3-certbot-nginx
```

#### Configure Nginx
Create `/etc/nginx/sites-available/burntober`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/burntober /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Install SSL
```bash
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

### Environment Security
```bash
# Secure .env file
chmod 600 .env

# Secure logs
chmod 700 logs/

# Don't commit secrets
git status  # Verify .env not tracked
```

---

## 📊 **Monitoring & Maintenance**

### Health Checks
```bash
# Manual check
curl http://localhost:3000/health

# Automated monitoring (with cron)
*/5 * * * * curl -f http://localhost:3000/health || echo "Health check failed" | mail -s "Burnathon Down" your@email.com
```

### Log Monitoring
```bash
# PM2 monitoring
pm2 monit

# Log analysis
tail -f logs/out.log | grep "ERROR"

# Disk space check
df -h
du -sh logs/
```

### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d-%H%M%S)
tar -czf backups/burnathon-$DATE.tar.gz .env logs/ dist/
find backups/ -name "*.tar.gz" -mtime +30 -delete
```

Add to cron:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 🐛 **Troubleshooting**

### Bot Crashes on Start
```bash
# Check logs
pm2 logs burntober --err

# Common issues:
# 1. Missing .env file
# 2. Invalid API credentials
# 3. Port already in use
# 4. Out of memory
```

### High Memory Usage
```bash
# Check memory
pm2 monit

# Restart with memory limit
pm2 restart burntober --max-memory-restart 500M
```

### Can't Connect to Dashboard
```bash
# Check if running
pm2 list

# Check firewall
sudo ufw status

# Check port
netstat -tlnp | grep 3000

# Check logs
pm2 logs burntober
```

---

## ✅ **Deployment Checklist**

Before going live:
- [ ] `.env` configured with production credentials
- [ ] Wallet funded with SOL
- [ ] API key active
- [ ] Firewall configured
- [ ] SSL certificate installed (if public)
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Tested with small amounts first
- [ ] Auto-restart configured
- [ ] Logs rotation enabled

---

## 📞 **Quick Commands Reference**

| Action | Command |
|--------|---------|
| Start (dev) | `npm run dev` |
| Start (PM2) | `pm2 start ecosystem.config.js` |
| Start (Docker) | `docker-compose up -d` |
| View logs (PM2) | `pm2 logs burntober` |
| View logs (Docker) | `docker-compose logs -f` |
| Stop (PM2) | `pm2 stop burntober` |
| Stop (Docker) | `docker-compose down` |
| Restart (PM2) | `pm2 restart burntober` |
| Health check | `curl http://localhost:3000/health` |

---

**🔥 Your Burnathon bot is ready for deployment! 🚀**


