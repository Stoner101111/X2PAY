# 🚀 Deploy Your x4Pay Portal to the Web

Multiple deployment options to make your portal public.

---

## 🌐 **Recommended: Vercel (Free & Fast)**

### **Why Vercel?**
- ✅ Free tier
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy deployment
- ✅ GitHub integration

### **Steps:**

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial x4Pay portal"
git branch -M main
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up / Login with GitHub
   - Click "New Project"
   - Import your GitHub repo
   - Vercel auto-detects Node.js
   - Click "Deploy"

3. **Done!**
   - Get public URL like: `https://your-app.vercel.app`
   - Auto-deploys on every git push

---

## 🔵 **Alternatives:**

### **Option 1: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```
**Website:** https://netlify.com

### **Option 2: Railway**
```bash
# Connect GitHub repo
# Automatically builds and deploys
```
**Website:** https://railway.app

### **Option 3: Render**
```bash
# Free tier available
# GitHub integration
# Auto-deploy
```
**Website:** https://render.com

### **Option 4: Fly.io**
```bash
# Deploy globally
fly launch
fly deploy
```
**Website:** https://fly.io

---

## 🐳 **Docker Deployment**

Use provided `Dockerfile` and `docker-compose.yml`.

### **Railway/Render/Fly.io**
```bash
# They auto-detect Docker
# Just push your code
```

### **Your Own Server**
```bash
docker build -t x4pay-portal .
docker run -p 3000:3000 x4pay-portal
```

---

## 📋 **Environment Variables**

Set these in your hosting platform:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_key_here
TOKEN_MINT_ADDRESS=your_token_address
PUMP_FUN_API_KEY=your_api_key
```

---

## ✅ **Quick Deploy Checklist**

- [ ] Code pushed to GitHub
- [ ] Hosting platform connected
- [ ] Environment variables set
- [ ] Build successful
- [ ] Public URL working
- [ ] HTTPS enabled
- [ ] Custom domain (optional)

---

## 🎯 **Recommended Setup**

**For fastest deployment:**
1. Push to GitHub
2. Deploy to Vercel (5 minutes)
3. Done!

**Your portal will be live at:**
`https://your-app.vercel.app`

---

**Need help? Check platform docs or ask for assistance!**

