# 🚀 Deploy XPAY2WIN Agent to Vercel

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional) - Install with `npm i -g vercel`
3. **Git Repository** - Your project should be in a Git repo

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import Project on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Select the `burnaween-agent` folder as the root directory
   - OR deploy from the root and configure the build settings

3. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables, add:
   ```
   PUMP_API_KEY=your_pump_api_key_here
   SOLANA_PUBLIC_KEY=your_public_key_here
   SOLANA_PRIVATE_KEY=your_private_key_here
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   TOKEN_MINT_ADDRESS=your_token_mint_address_here
   AUTO_BUY_ENABLED=true
   AUTO_BUY_AMOUNT=0.02
   AUTO_BUY_INTERVAL=60000
   PORT=3001
   NODE_ENV=production
   ```

4. **Build Settings**
   - **Framework Preset:** Other
   - **Root Directory:** `burnaween-agent` (or leave blank if deploying from root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Deploy!**
   - Click "Deploy"
   - Wait for build to complete
   - Your portal will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to project**
   ```bash
   cd burnaween-agent
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Set Environment Variables**
   ```bash
   vercel env add PUMP_API_KEY
   vercel env add SOLANA_PUBLIC_KEY
   vercel env add SOLANA_PRIVATE_KEY
   vercel env add SOLANA_RPC_URL
   vercel env add TOKEN_MINT_ADDRESS
   vercel env add AUTO_BUY_ENABLED
   vercel env add AUTO_BUY_AMOUNT
   vercel env add AUTO_BUY_INTERVAL
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Important Notes

### ⚠️ Auto-Buy on Vercel

**Important:** Vercel serverless functions have execution time limits:
- **Hobby Plan:** 10 seconds per function execution
- **Pro Plan:** 60 seconds per function execution

**Auto-buy with intervals will NOT work on Vercel** because:
1. Serverless functions are stateless
2. No persistent processes can run
3. Function execution timeouts

**Solutions:**
- Use Vercel for the **portal/dashboard only**
- Run the agent on a VPS, server, or use **Vercel Cron Jobs** for scheduled tasks
- Use external services (like Railway, Render, or your own server) for long-running processes

### ✅ What Works on Vercel

- ✅ Portal dashboard (HTML/CSS/JS)
- ✅ API endpoints for manual operations
- ✅ Health checks
- ✅ Wallet info
- ✅ Manual buy/burn operations
- ✅ Status checks

### ❌ What Doesn't Work on Vercel

- ❌ Persistent auto-buy intervals
- ❌ Long-running processes
- ❌ Background tasks

## Alternative: Hybrid Deployment

1. **Deploy Portal to Vercel** (for public access)
2. **Run Agent on VPS/Server** (for auto-buy functionality)
   - Use PM2, Docker, or systemd
   - Point to same API endpoints

## Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Ensure all dependencies are in `package.json`
- Check TypeScript compilation errors

### Environment Variables Not Loading
- Make sure variables are set in Vercel Dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Portal Not Loading
- Check Vercel function logs
- Verify `api/index.js` exists
- Ensure `dist/agent.js` is built correctly

### API Endpoints Not Working
- Check CORS settings if calling from different domain
- Verify Express app is exported correctly in `api/index.js`

## Support

For issues, check:
- Vercel logs: Dashboard → Your Project → Deployments → Logs
- Build logs: Dashboard → Your Project → Deployments → Build Logs

