# BURNTOBER - Production Deployment Guide

## ðŸš¨ Security Checklist

### âœ… Completed Security Measures

1. **No Hardcoded Credentials** - All credentials moved to environment variables
2. **Environment Validation** - Application fails to start without required env vars
3. **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection enabled
4. **Request Size Limiting** - Limited to 10MB
5. **Non-root Docker User** - Runs as 'burntober' user (UID 1001)
6. **Production Logging** - Structured logging with rotation
7. **Graceful Shutdown** - Proper SIGTERM/SIGINT handling
8. **Health Checks** - Docker and application health monitoring
9. **Error Sanitization** - Error messages sanitized in production mode
10. **.gitignore** - Prevents committing sensitive files

---

## ðŸ“‹ Pre-Deployment Checklist

### Required Environment Variables
- [ ] PUMP_API_KEY - Your pump.fun API key
- [ ] SOLANA_PUBLIC_KEY - Your Solana wallet public key  
- [ ] SOLANA_PRIVATE_KEY - Your Solana wallet private key
- [ ] SOLANA_RPC_URL - Solana RPC endpoint (default: mainnet-beta)

### Optional Configuration
- [ ] PORT - Server port (default: 3000)
- [ ] HOST - Server host (default: 0.0.0.0)
- [ ] AUTO_BUY_ENABLED - Enable auto-buy (default: false)
- [ ] AUTO_BUY_AMOUNT - SOL amount per buy (default: 0.02)
- [ ] AUTO_BUY_INTERVAL - Milliseconds between buys (default: 60000)

---

## ðŸš€ Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your credentials:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop service:**
   ```bash
   docker-compose down
   ```

### Option 2: Docker (Manual)

1. **Build image:**
   ```bash
   docker build -t burntober:latest .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     --name burntober \
     -p 3000:3000 \
     --env-file .env \
     --restart unless-stopped \
     burntober:latest
   ```

### Option 3: PM2 (Process Manager)

1. **Build application:**
   ```bash
   npm run build
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

3. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

4. **Monitor:**
   ```bash
   pm2 status
   pm2 logs burntober
   pm2 monit
   ```

### Option 4: Direct Node.js

1. **Build application:**
   ```bash
   npm run build
   ```

2. **Start server:**
   ```bash
   NODE_ENV=production npm start
   ```

---

## ðŸ”’ Security Best Practices

1. **Environment Variables:**
   - Never commit .env file to Git
   - Use .env.example as template only
   - Rotate API keys and private keys regularly

2. **Network Security:**
   - Use HTTPS in production (reverse proxy like nginx)
   - Implement rate limiting at proxy level
   - Use firewall to restrict access

3. **Monitoring:**
   - Monitor logs for suspicious activity
   - Set up alerts for errors
   - Track resource usage

4. **Updates:**
   - Keep dependencies updated
   - Review security advisories
   - Test updates in staging environment

---

## ðŸ“Š Monitoring & Health Checks

### Health Endpoints
- GET /health - Basic health check
- GET /api/health - Detailed health with services status

### Docker Health Check
Configured to check every 30 seconds, with 3 retries and 10s timeout.

### PM2 Monitoring
- Automatic restart on crash
- Memory limit: 1GB (auto-restart if exceeded)
- Max 10 restarts within 10s minimum uptime

### Logs Location
- Docker: docker logs burntober or docker-compose logs
- PM2: ./logs/ directory
  - err.log - Error logs
  - out.log - Standard output
  - combined.log - Combined logs

---

## ðŸ› Troubleshooting

### Application Won't Start
1. Check all required environment variables are set
2. Verify API key is valid
3. Check wallet keys are correct format
4. Review logs for specific error messages

### Docker Issues
```bash
# View logs
docker logs burntober

# Restart container
docker restart burntober

# Rebuild image
docker-compose build --no-cache
docker-compose up -d
```

### PM2 Issues
```bash
# Restart application
pm2 restart burntober

# Delete and restart
pm2 delete burntober
pm2 start ecosystem.config.js --env production

# Clear logs
pm2 flush
```

---

## ðŸ”„ Updates & Maintenance

### Updating the Application

1. **Stop service:**
   ```bash
   # Docker
   docker-compose down
   
   # PM2
   pm2 stop burntober
   ```

2. **Pull updates:**
   ```bash
   git pull origin main
   ```

3. **Rebuild:**
   ```bash
   npm install
   npm run build
   ```

4. **Restart service:**
   ```bash
   # Docker
   docker-compose up -d --build
   
   # PM2
   pm2 restart burntober
   ```

### Database Backups
Not applicable - this application is stateless.

### Wallet Security
- Keep private keys encrypted at rest
- Use hardware wallet for large amounts
- Regular security audits

---

## ðŸ“ž Support

### Common Issues
1. **"Missing required environment variables"**
   - Ensure all required vars are in .env file
   - Check for typos in variable names

2. **"Pump.fun API not configured"**
   - Verify PUMP_API_KEY is valid
   - Check API key hasn't expired

3. **Connection errors**
   - Verify RPC URL is accessible
   - Check network connectivity
   - Try alternative RPC endpoints

### Performance Optimization
- Use dedicated Solana RPC endpoint (not public)
- Monitor memory usage and adjust PM2 limits
- Scale horizontally with load balancer if needed

---

## âœ… Production Readiness

Your BURNTOBER application is production-ready with:

- âœ… No hardcoded credentials
- âœ… Environment variable validation  
- âœ… Security headers enabled
- âœ… Docker containerization
- âœ… PM2 process management
- âœ… Health monitoring
- âœ… Graceful shutdown
- âœ… Error handling
- âœ… Structured logging
- âœ… Non-root execution

**Ready to deploy! ðŸ”¥ðŸš€**
