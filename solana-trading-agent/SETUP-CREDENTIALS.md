# 🎃 BURNAWEEN Portal - Credential Setup Guide

## Quick Setup

To configure your BURNAWEEN portal with your credentials, create a `.env` file in the project root with the following content:

```bash
# BURNAWEEN Portal Configuration 🎃
NODE_ENV=development

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Solana Wallet Configuration
SOLANA_PUBLIC_KEY=HdoH3sAkc1ECJreuqpJ3rRAsiK1xM1ZNdgd1MYQSUrbS
SOLANA_PRIVATE_KEY=3WEpNYsKZCCLCixNVE2qBxZCWAq5cRvmEYDTcSeoXAdAq3qCKcEZ2qMkxdx6WzTsRpP23zRgq1QHMWCSZgwggaJL

# Solana RPC Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Pump.fun API Configuration
PUMP_API_KEY=f1b4pbuhdtv6gk35dd22pvuca9nm6m2kdt856dbt9wv7gr9g84wkevkgct64pgk2a58qccuqdnapcdtm85h46cb78dgp4dj2dt4nmhkh5dj6jw3mc9gkakutetumcva1759mukvka4yku5dp7grur91w6cthqattkak9jd4anr72hu3exjperag95wkgx2tb9t36e3t8t8kuf8

# Auto-Buy Configuration (BURNAWEEN Features)
AUTO_BUY_ENABLED=false
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000

# Token to buy/burn (set this to enable auto-haunting)
TOKEN_MINT_ADDRESS=
```

## Windows PowerShell Command

Run this command in PowerShell to create the `.env` file automatically:

```powershell
@"
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
SOLANA_PUBLIC_KEY=HdoH3sAkc1ECJreuqpJ3rRAsiK1xM1ZNdgd1MYQSUrbS
SOLANA_PRIVATE_KEY=3WEpNYsKZCCLCixNVE2qBxZCWAq5cRvmEYDTcSeoXAdAq3qCKcEZ2qMkxdx6WzTsRpP23zRgq1QHMWCSZgwggaJL
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_API_KEY=f1b4pbuhdtv6gk35dd22pvuca9nm6m2kdt856dbt9wv7gr9g84wkevkgct64pgk2a58qccuqdnapcdtm85h46cb78dgp4dj2dt4nmhkh5dj6jw3mc9gkakutetumcva1759mukvka4yku5dp7grur91w6cthqattkak9jd4anr72hu3exjperag95wkgx2tb9t36e3t8t8kuf8
AUTO_BUY_ENABLED=false
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=60000
TOKEN_MINT_ADDRESS=
"@ | Out-File -FilePath .env -Encoding UTF8
```

## Your Credentials

### Wallet Public Key
```
HdoH3sAkc1ECJreuqpJ3rRAsiK1xM1ZNdgd1MYQSUrbS
```

### Wallet Private Key
```
3WEpNYsKZCCLCixNVE2qBxZCWAq5cRvmEYDTcSeoXAdAq3qCKcEZ2qMkxdx6WzTsRpP23zRgq1QHMWCSZgwggaJL
```

### API Key
```
f1b4pbuhdtv6gk35dd22pvuca9nm6m2kdt856dbt9wv7gr9g84wkevkgct64pgk2a58qccuqdnapcdtm85h46cb78dgp4dj2dt4nmhkh5dj6jw3mc9gkakutetumcva1759mukvka4yku5dp7grur91w6cthqattkak9jd4anr72hu3exjperag95wkgx2tb9t36e3t8t8kuf8
```

## ⚠️ Security Warning

**IMPORTANT:** 
- Never share your private keys
- The `.env` file is already in `.gitignore` and won't be committed to git
- Keep these credentials secure
- Use environment variables in production

## 🎃 Start the Portal

Once your `.env` file is created:

```bash
# Start development server
npm run dev

# Or start production server
npm start
```

Then open your browser to:
```
http://localhost:3000
```

## 🔥 Enable Auto-Haunting

To enable automatic token buying and burning:

1. Set a token mint address in `.env`:
   ```
   TOKEN_MINT_ADDRESS=YourTokenMintAddressHere
   ```

2. Enable auto-buy:
   ```
   AUTO_BUY_ENABLED=true
   ```

3. Restart the server

The BURNAWEEN portal will automatically:
- Buy tokens every 60 seconds (configurable)
- Burn them immediately after purchase
- Collect creator rewards

**Happy Haunting! 🎃👻🔥**







