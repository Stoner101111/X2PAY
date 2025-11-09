# 🐙 GitHub Repository Setup Guide

## 📋 Create Your X2PAY GitHub Repository

Follow these steps to create and publish your project on GitHub:

---

## Option 1: Using GitHub Website (Easiest)

### Step 1: Create Repository

1. Go to: https://github.com/new
2. Repository name: `x2pay`
3. Description: `Revolutionary machine-to-machine payments powered by x402 BLE protocol`
4. Visibility: **Public** (recommended)
5. **DO NOT** initialize with README (we'll push our code)
6. Click **"Create repository"**

### Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Run these:

```bash
# Navigate to project directory
cd C:\Users\Admin\solana-trading-agent

# Initialize git (if not already done)
git init
git branch -M main

# Add all files
git add .

# Commit
git commit -m "Initial commit: X2PAY portal with x402 payments"

# Add your GitHub remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/x2pay.git

# Push to GitHub
git push -u origin main
```

### Step 3: Authentication

If prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your GitHub password)

**Generate Token:** https://github.com/settings/tokens/new
- Select scopes: `repo` (full control)

---

## Option 2: Install Git First

If Git is not installed on your system:

### Download Git for Windows
1. Visit: https://git-scm.com/download/win
2. Download and install Git
3. Restart terminal/PowerShell
4. Run commands from Option 1 above

---

## Option 3: Manual Upload via GitHub Website

1. Create repository on GitHub.com
2. Click **"uploading an existing file"**
3. Drag and drop your project files (excluding `node_modules/`)
4. Commit changes

---

## ✅ After Setup

Your repository will be live at:
**`https://github.com/YOUR-USERNAME/x2pay`**

---

## 🔗 Update Portal Link

After creating the repository, update the GitHub link in your portal:

1. Edit: `public/index.html`
2. Find line with: `https://github.com/AbhinavBuilds/x4-pay-core`
3. Replace with: `https://github.com/YOUR-USERNAME/x2pay`
4. Commit and redeploy to Vercel

---

## 📝 Recommended Repository Settings

- **Topics:** `x2pay`, `x402`, `bluetooth`, `iot`, `payments`, `solana`, `usdc`, `ble`, `arduino`
- **Website:** Link to your Vercel URL
- **Description:** "Revolutionary machine-to-machine payments powered by x402 BLE protocol"

---

## 🔒 Security Notes

✅ **Already protected:**
- `.env` in `.gitignore` (credentials safe)
- `node_modules/` excluded
- Secrets won't be committed

⚠️ **Remember:**
- Never commit `.env` files
- Never share private keys
- Use GitHub Secrets for CI/CD

---

## 📊 GitHub Actions (Optional)

Add automated deployments:
- Auto-deploy to Vercel on push
- Run tests
- Build checks

---

**Ready to make your project open source! 🚀**

