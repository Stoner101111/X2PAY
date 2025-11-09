import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';
import { createPumpApiService, PumpApiService } from './pumpApi';
import { createBurnService, TokenBurnService } from './burnService';

// Load environment variables
dotenv.config();

// Production logging setup
const isProduction = process.env.NODE_ENV === 'production';

// Production-ready logger - always logs critical info, errors, and warnings
const logger = {
  info: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, ...args);
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error);
    if (error && error.stack) {
      console.error(`[ERROR] Stack trace: ${error.stack}`);
    }
  },
  warn: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`, ...args);
  }
};

// Environment variable validation
const requiredEnvVars = ['PUMP_API_KEY', 'SOLANA_PUBLIC_KEY', 'SOLANA_PRIVATE_KEY', 'SOLANA_RPC_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.warn(`⚠️ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.warn('⚠️ The portal will load, but auto buy & burn will be disabled until keys are configured.');
} else {
  logger.info('✅ All required environment variables are configured');
}

// Server configuration
const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

// Auto buy & burn configuration
const AUTO_BUY_ENABLED = process.env.AUTO_BUY_ENABLED !== 'false'; // enabled by default
const AUTO_BUY_AMOUNT = parseFloat(process.env.AUTO_BUY_AMOUNT || '0.01'); // SOL
const AUTO_BUY_INTERVAL = 30000; // Fixed 30 seconds
const AUTO_PRIORITY_FEE = parseFloat(process.env.AUTO_PRIORITY_FEE || '0.000001');
const AUTO_SLIPPAGE = parseFloat(process.env.AUTO_SLIPPAGE || '10');
let TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS || '';

let autoCycleInterval: NodeJS.Timeout | null = null;
let lastCycleTime = 0;
let lastCycleError: string | null = null;
let lastBuySignature: string | null = null;
let lastBurnSignature: string | null = null;
let totalCycles = 0;
let isCycleRunning = false;

logger.info('🔥 Auto Buy & Burn Agent Starting...');
logger.info(`📊 Dashboard available at http://${host}:${port}`);

// Initialize services
const pumpApi: PumpApiService | null = process.env.PUMP_API_KEY
  ? createPumpApiService(
      process.env.PUMP_API_KEY,
      process.env.SOLANA_PUBLIC_KEY,
      process.env.SOLANA_PRIVATE_KEY,
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )
  : null;

const burnService: TokenBurnService | null = (process.env.SOLANA_PRIVATE_KEY && process.env.SOLANA_RPC_URL)
  ? createBurnService(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      process.env.SOLANA_PRIVATE_KEY
    )
  : null;

if (!pumpApi) {
  logger.warn('⚠️ Pump.fun API not configured - set PUMP_API_KEY, SOLANA_PUBLIC_KEY, SOLANA_PRIVATE_KEY');
}

if (!burnService) {
  logger.warn('⚠️ Burn service not configured - set SOLANA_PRIVATE_KEY and SOLANA_RPC_URL');
}

// Resolve public path
let projectRoot: string;
try {
  if (typeof __dirname !== 'undefined') {
    projectRoot = path.resolve(__dirname, '..');
  } else {
    projectRoot = process.cwd();
  }
} catch (error) {
  projectRoot = process.cwd();
}

const publicPath = path.join(projectRoot, 'public');
if (fs.existsSync(publicPath)) {
  logger.info(`✅ Serving static files from: ${publicPath}`);
} else {
  logger.warn(`⚠️ Public folder not found at: ${publicPath}`);
}

const app = express();

// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.path.startsWith('/api/')) {
    const clientIP = req.ip || req.socket.remoteAddress;
    logger.info(`API request from ${clientIP}: ${req.method} ${req.path}`);
  }

  next();
});

app.use(express.json({ limit: '5mb' }));

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath, {
    maxAge: '1d',
    etag: false,
    lastModified: false
  }));
}

app.get('/', (req: Request, res: Response) => {
  const filePath = path.join(publicPath, 'index.html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error('Error serving index.html', err);
      res.status(500).send('Portal UI not found. Ensure public/index.html exists.');
    }
  });
});

function validateTokenAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

async function performAutoCycle(triggerSource: 'auto' | 'manual' = 'auto'): Promise<void> {
  if (!pumpApi) {
    lastCycleError = 'Pump.fun API not configured';
    logger.error(`❌ [CYCLE] Cannot run - Pump.fun API missing`);
    return;
  }

  if (!burnService) {
    lastCycleError = 'Burn service not configured';
    logger.error(`❌ [CYCLE] Cannot run - burn service missing`);
    return;
  }

  if (!TOKEN_MINT_ADDRESS || TOKEN_MINT_ADDRESS.trim() === '') {
    lastCycleError = 'TOKEN_MINT_ADDRESS not configured';
    logger.error(`❌ [CYCLE] Token mint address missing`);
    return;
  }

  if (!validateTokenAddress(TOKEN_MINT_ADDRESS)) {
    lastCycleError = 'Invalid token mint address';
    logger.error(`❌ [CYCLE] Invalid TOKEN_MINT_ADDRESS format: ${TOKEN_MINT_ADDRESS}`);
    return;
  }

  if (isCycleRunning) {
    logger.warn('⚠️ [CYCLE] Previous cycle still running - skipping this trigger');
    return;
  }

  isCycleRunning = true;
  const cycleLabel = triggerSource === 'auto' ? 'AUTO' : 'MANUAL';
  logger.info(`🤖 [${cycleLabel}-CYCLE] Starting buy & burn cycle: ${AUTO_BUY_AMOUNT} SOL`);

  try {
    lastCycleTime = Date.now();
    lastCycleError = null;

    // Step 1: Optional creator fee collection
    try {
      const collectResult = await pumpApi.collectCreatorFee(AUTO_PRIORITY_FEE);
      if (collectResult.success && collectResult.txSignature) {
        logger.info(`💰 [CYCLE] Creator fees collected: ${collectResult.txSignature}`);
      }
    } catch (feeError: any) {
      logger.warn(`⚠️ [CYCLE] Creator fee collection failed: ${feeError.message || feeError}`);
    }

    // Step 2: Buy tokens
    logger.info(`🛒 [CYCLE] Buying ${AUTO_BUY_AMOUNT} SOL of ${TOKEN_MINT_ADDRESS.substring(0, 8)}...`);
    const buyResult = await pumpApi.buyToken(TOKEN_MINT_ADDRESS, AUTO_BUY_AMOUNT, AUTO_PRIORITY_FEE, AUTO_SLIPPAGE);

    if (!buyResult.success || !buyResult.txSignature) {
      lastCycleError = buyResult.error || 'Unknown buy error';
      logger.error(`❌ [CYCLE] Buy failed: ${lastCycleError}`);
      return;
    }

    lastBuySignature = buyResult.txSignature;
    logger.info(`✅ [CYCLE] Buy success! TX: ${lastBuySignature}`);

    // Step 3: Wait for tokens to settle
    logger.info(`⏳ [CYCLE] Waiting for token balance...`);
    const tokensArrived = await burnService.waitForTokens(TOKEN_MINT_ADDRESS, AUTO_BUY_INTERVAL);
    if (!tokensArrived) {
      lastCycleError = 'Tokens did not arrive within timeout';
      logger.warn(`⚠️ [CYCLE] Tokens not detected yet - skipping burn this cycle`);
      return;
    }

    // Step 4: Burn tokens
    logger.info(`🔥 [CYCLE] Burning purchased tokens...`);
    const burnResult = await burnService.burnAllTokens(TOKEN_MINT_ADDRESS);

    if (!burnResult.success || !burnResult.signature) {
      lastCycleError = burnResult.error || 'Unknown burn error';
      logger.error(`❌ [CYCLE] Burn failed: ${lastCycleError}`);
      return;
    }

    lastBurnSignature = burnResult.signature;
    totalCycles += 1;

    logger.info(`🔥🔥🔥 [CYCLE] Burn success! TX: ${lastBurnSignature}`);
    logger.info(`✅ [CYCLE] Buy & burn cycle complete`);
  } catch (error: any) {
    lastCycleError = error.message || 'Unhandled cycle error';
    logger.error(`❌ [CYCLE] Fatal error: ${lastCycleError}`, error);
  } finally {
    isCycleRunning = false;
  }
}

function startAutoCycle(): boolean {
  if (autoCycleInterval) {
    return false;
  }

  if (!AUTO_BUY_ENABLED) {
    logger.info('ℹ️ Auto buy disabled via configuration (AUTO_BUY_ENABLED=false)');
    return false;
  }

  autoCycleInterval = setInterval(() => performAutoCycle('auto'), AUTO_BUY_INTERVAL);
  logger.info(`🚀 Auto buy & burn scheduled every ${AUTO_BUY_INTERVAL / 1000} seconds`);

  // Kick off first cycle after short delay to allow startup
  setTimeout(() => performAutoCycle('auto'), 5000);
  return true;
}

function stopAutoCycle(): boolean {
  if (!autoCycleInterval) {
    return false;
  }
  clearInterval(autoCycleInterval);
  autoCycleInterval = null;
  logger.info('⏹️ Auto buy & burn stopped');
  return true;
}

if (AUTO_BUY_ENABLED) {
  if (pumpApi && burnService && TOKEN_MINT_ADDRESS) {
    logger.info('🚀 Auto buy & burn is ENABLED');
    logger.info(`   • Amount: ${AUTO_BUY_AMOUNT} SOL`);
    logger.info(`   • Interval: ${AUTO_BUY_INTERVAL / 1000} seconds`);
    logger.info(`   • Token: ${TOKEN_MINT_ADDRESS.substring(0, 16)}...`);
    logger.info(`   • Priority fee: ${AUTO_PRIORITY_FEE}`);
    logger.info(`   • Slippage: ${AUTO_SLIPPAGE}%`);
    startAutoCycle();
  } else {
    logger.warn('⚠️ Auto buy enabled but configuration incomplete. Use API to start after fixing env.');
  }
} else {
  logger.info('ℹ️ Auto buy disabled by configuration (AUTO_BUY_ENABLED=false)');
}

// -----------------------------
// API ROUTES
// -----------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    autoBuyEnabled: AUTO_BUY_ENABLED,
    autoBuyRunning: autoCycleInterval !== null,
    lastCycleTime: lastCycleTime || null,
    lastCycleError,
    totalCycles,
    version: '1.0.0'
  });
});

app.get('/api/wallet-info', (req: Request, res: Response) => {
  if (!pumpApi) {
    res.status(500).json({
      success: false,
      error: 'Pump.fun API not configured'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      publicKey: pumpApi.getWalletPublicKey(),
      rpcUrl: pumpApi.getRpcUrl(),
      hasPrivateKey: !!pumpApi.getWalletPrivateKey()
    }
  });
});

app.get('/api/auto-cycle/status', (req: Request, res: Response) => {
  const now = Date.now();
  const nextCycleTime = autoCycleInterval ? lastCycleTime + AUTO_BUY_INTERVAL : null;
  const timeUntilNext = nextCycleTime ? Math.max(0, nextCycleTime - now) : null;

  res.json({
    success: true,
    data: {
      enabled: AUTO_BUY_ENABLED,
      running: autoCycleInterval !== null,
      amount: AUTO_BUY_AMOUNT,
      intervalMs: AUTO_BUY_INTERVAL,
      intervalSeconds: AUTO_BUY_INTERVAL / 1000,
      priorityFee: AUTO_PRIORITY_FEE,
      slippage: AUTO_SLIPPAGE,
      tokenMintAddress: TOKEN_MINT_ADDRESS || null,
      lastCycleTime: lastCycleTime || null,
      lastCycleTimeIso: lastCycleTime ? new Date(lastCycleTime).toISOString() : null,
      lastBuySignature,
      lastBurnSignature,
      lastCycleError,
      totalCycles,
      timeUntilNextMs: timeUntilNext,
      timeUntilNextSeconds: timeUntilNext ? Math.floor(timeUntilNext / 1000) : null
    }
  });
});

app.post('/api/auto-cycle/start', (req: Request, res: Response) => {
  if (!pumpApi || !burnService) {
    res.status(500).json({
      success: false,
      error: 'Pump.fun API or burn service not configured'
    });
    return;
  }

  const started = startAutoCycle();
  if (!started) {
    res.json({
      success: false,
      message: 'Auto cycle already running or disabled'
    });
    return;
  }

  res.json({
    success: true,
    message: `Auto buy & burn started: ${AUTO_BUY_AMOUNT} SOL every ${AUTO_BUY_INTERVAL / 1000} seconds`
  });
});

app.post('/api/auto-cycle/stop', (req: Request, res: Response) => {
  const stopped = stopAutoCycle();
  if (!stopped) {
    res.json({
      success: false,
      message: 'Auto cycle not running'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Auto buy & burn stopped'
  });
});

app.post('/api/auto-cycle/trigger', async (req: Request, res: Response): Promise<void> => {
  await performAutoCycle('manual');
  res.json({
    success: !lastCycleError,
    message: lastCycleError ? `Cycle failed: ${lastCycleError}` : 'Manual cycle completed',
    lastBuySignature,
    lastBurnSignature,
    error: lastCycleError
  });
});

app.post('/api/auto-cycle/update-token', (req: Request, res: Response) => {
  const { tokenMintAddress } = req.body;

  if (!tokenMintAddress || typeof tokenMintAddress !== 'string') {
    res.status(400).json({
      success: false,
      error: 'tokenMintAddress must be a non-empty string'
    });
    return;
  }

  if (!validateTokenAddress(tokenMintAddress)) {
    res.status(400).json({
      success: false,
      error: 'Invalid Solana public key format'
    });
    return;
  }

  const oldAddress = TOKEN_MINT_ADDRESS;
  TOKEN_MINT_ADDRESS = tokenMintAddress.trim();
  logger.info(`🔄 Token mint updated: ${oldAddress || '(none)'} → ${TOKEN_MINT_ADDRESS}`);

  res.json({
    success: true,
    message: 'Token mint address updated successfully',
    data: {
      oldAddress: oldAddress || null,
      newAddress: TOKEN_MINT_ADDRESS
    }
  });
});

// Health endpoint shortcut
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Export app for serverless
module.exports = app;

if (!process.env.VERCEL && !process.env.NETLIFY) {
  const server = app.listen(port, host, () => {
    logger.info(`✅ Server running at http://${host}:${port}`);
  }).on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${port} is already in use`);
      logger.error(`Change PORT in .env or stop the other process.`);
    } else {
      logger.error(`❌ Server failed to start: ${error.message}`);
    }
    process.exit(1);
  });

  const gracefulShutdown = () => {
    logger.info('🧹 Shutting down gracefully...');
    if (autoCycleInterval) {
      clearInterval(autoCycleInterval);
      autoCycleInterval = null;
      logger.info('⏹️ Auto cycle stopped during shutdown');
    }
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
  });
}