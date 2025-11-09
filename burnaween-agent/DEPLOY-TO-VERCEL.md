# 🚀 Quick Deploy to Vercel

## Step-by-Step Guide

### 1. Prepare Your Project

Make sure you're in the `burnaween-agent` directory:
```bash
cd burnaween-agent
```

### 2. Build the Project

Test the build locally:
```bash
npm run build
```

This should create a `dist/` folder with compiled JavaScript.

### 3. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [vercel.com/new](https://vercel.com/new)**

2. **Import your Git repository**
   - Connect GitHub/GitLab/Bitbucket
   - Select your repository
   - If deploying from root, set **Root Directory** to `burnaween-agent`

3. **Configure Build Settings:**
   - **Framework Preset:** Other
   - **Root Directory:** `burnaween-agent` (if deploying from repo root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   Go to Settings → Environment Variables and add:
   ```
   PUMP_API_KEY=dhrkaw9b8xbq4uvq91tmjub2a9nmpkhka9h56nbt8nb62gvc5xkketbc8n54at3c91d4rhac8xvk6d3u9dcken9ne5qppy1kc4tp4c389176cxk8dnp4an2aa1h4upb268rn0h3qa4ykub533jmhhchwmjjjca9up6w9m84cdanjxbkax44mm26618kaykt8xtk0mjtexkkuf8
   SOLANA_PUBLIC_KEY=E3msYu6mALLp5WNsAdpuUHP5WD1zFgYmjcD1P3xd9cGp
   SOLANA_PRIVATE_KEY=5bGAv23CR1HKWQdhhWPHi3XoBeUEmqbekVZFLLf6hKFWSuYdnPnRfdPLK9fYji2di4qn8q3Z4LfzHTR8FBoJipek
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   TOKEN_MINT_ADDRESS=your_token_mint_address_here
   AUTO_BUY_ENABLED=true
   AUTO_BUY_AMOUNT=0.02
   AUTO_BUY_INTERVAL=60000
   NODE_ENV=production
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your portal will be live at: `https://your-project-name.vercel.app`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd burnaween-agent

# Deploy
vercel

# Add environment variables
vercel env add PUMP_API_KEY
vercel env add SOLANA_PUBLIC_KEY
vercel env add SOLANA_PRIVATE_KEY
vercel env add SOLANA_RPC_URL
vercel env add TOKEN_MINT_ADDRESS
vercel env add AUTO_BUY_ENABLED
vercel env add AUTO_BUY_AMOUNT
vercel env add AUTO_BUY_INTERVAL

# Deploy to production
vercel --prod
```

## ⚠️ Important Notes

### Auto-Buy Limitations on Vercel

**The auto-buy feature will NOT work on Vercel** because:
- Vercel uses serverless functions (stateless)
- Functions have execution time limits (10-60 seconds)
- No persistent processes can run

**What WILL work:**
- ✅ Portal dashboard
- ✅ Manual operations (buy, burn, collect fees)
- ✅ API endpoints
- ✅ Status checks

**What WON'T work:**
- ❌ Automatic buy intervals
- ❌ Background tasks
- ❌ Long-running processes

### Recommended Architecture

For full functionality:
1. **Deploy Portal to Vercel** (for public access)
2. **Run Agent on VPS/Server** (for auto-buy)
   - Use your local server or cloud VPS
   - Run with PM2: `pm2 start ecosystem.config.js`
   - Or use Railway, Render, DigitalOcean, etc.

## After Deployment

Your portal will be accessible at:
- **Production:** `https://your-project.vercel.app`
- **Preview:** `https://your-project-git-branch.vercel.app`

## Troubleshooting

### Build Fails
- Run `npm run build` locally first to check for errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors

### Portal Not Loading
- Check Vercel deployment logs
- Verify `api/index.js` exists
- Ensure environment variables are set

### API Endpoints Not Working
- Check function logs in Vercel dashboard
- Verify Express app exports correctly
- Test endpoints with: `https://your-project.vercel.app/api/health`

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Project Logs:** Vercel Dashboard → Your Project → Deployments → Logs

