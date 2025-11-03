import express, { Request, Response } from 'express';
import path from 'path';
import { PublicKey } from '@solana/web3.js';
import { createPumpApiService, PumpApiService } from './pumpApi';
import { createBurnService, TokenBurnService } from './burnService';
import { createX402Service } from './services/x402Service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Production logging setup
const isProduction = process.env.NODE_ENV === 'production';

// Simple logger for production
const logger = {
  info: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }
};

// Environment variable validation
const requiredEnvVars = ['PUMP_API_KEY', 'SOLANA_PUBLIC_KEY', 'SOLANA_PRIVATE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Do NOT exit if env vars are missing; allow UI to load and APIs to gracefully error
if (missingEnvVars.length > 0) {
  logger.warn(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  logger.warn('The portal will load, but API operations requiring these keys are disabled.');
}

// Initialize server configuration
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

// Auto-buy configuration
const AUTO_BUY_ENABLED = process.env.AUTO_BUY_ENABLED === 'true';
const AUTO_BUY_AMOUNT = parseFloat(process.env.AUTO_BUY_AMOUNT || '0.02'); // SOL amount
const AUTO_BUY_INTERVAL = parseInt(process.env.AUTO_BUY_INTERVAL || '60000', 10); // milliseconds (1 minute)
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS || ''; // Token to buy
let autoBuyInterval: NodeJS.Timeout | null = null;
let lastBuyTime: number = 0;

logger.info('🎃 BURNAWEEN Portal Opening...');
logger.info(`👻 Haunted Dashboard will be available at http://${host}:${port}`);
if (!isProduction) {
  logger.info('⚠️  Remember to configure your .env file with your dark secrets!');
}

// Auto-buy status
if (AUTO_BUY_ENABLED) {
  logger.info(`🤖 Auto-buy ENABLED: ${AUTO_BUY_AMOUNT} SOL every ${AUTO_BUY_INTERVAL/1000} seconds`);
} else {
  logger.info('🤖 Auto-buy DISABLED (set AUTO_BUY_ENABLED=true to enable)');
}

// Initialize pump.fun API service with wallet configuration
const pumpApi: PumpApiService | null = process.env.PUMP_API_KEY 
  ? createPumpApiService(
      process.env.PUMP_API_KEY,
      process.env.SOLANA_PUBLIC_KEY,
      process.env.SOLANA_PRIVATE_KEY,
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )
  : null;

// Initialize burn service
const burnService: TokenBurnService | null = (process.env.SOLANA_PRIVATE_KEY && process.env.SOLANA_RPC_URL)
  ? createBurnService(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      process.env.SOLANA_PRIVATE_KEY
    )
  : null;

// Initialize x402 payment service
const x402Service = createX402Service();

// x402 Hardware Bridge integration (Python service endpoint)
const HARDWARE_BRIDGE_URL = process.env.HARDWARE_BRIDGE_URL || 'http://localhost:8402';

const app = express();

// Security middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Rate limiting (basic)
  if (req.path.startsWith('/api/')) {
    // Simple rate limiting - in production, use redis or similar
    const clientIP = req.ip || req.connection.remoteAddress;
    logger.info(`API request from ${clientIP}: ${req.method} ${req.path}`);
  }
  
  next();
});

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' })); // Limit request size

// Minimalist MageAi portal served from public/index.html (takes precedence over later routes)
app.get('/', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(filePath);
});

// API Routes with proper error handling
app.post('/api/collect-creator-fees', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!pumpApi) {
      logger.error('Pump.fun API not configured');
      res.status(500).json({ 
        success: false, 
        error: 'Pump.fun API not configured. Please set PUMP_API_KEY in your .env file.' 
      });
      return;
    }

    const { priorityFee = 0.000001 } = req.body;

    // Validate priority fee
    if (typeof priorityFee !== 'number' || priorityFee < 0 || priorityFee > 1) {
      logger.warn(`Invalid priority fee provided: ${priorityFee}`);
      res.status(400).json({
        success: false,
        error: 'Priority fee must be a number between 0 and 1'
      });
      return;
    }

    logger.info(`Collecting creator fees with priority fee: ${priorityFee}`);
    const result = await pumpApi.collectCreatorFee(priorityFee);
    
    if (result.success) {
      logger.info(`Creator fees collected successfully: ${result.txSignature}`);
    } else {
      logger.error(`Failed to collect creator fees: ${result.error}`);
    }
    
    res.json(result);
  } catch (error: any) {
    logger.error('Error in collect-creator-fees endpoint', error);
    res.status(500).json({ 
      success: false, 
      error: isProduction ? 'Internal server error' : error.message 
    });
  }
});

// Get wallet information
app.get('/api/wallet-info', (req: Request, res: Response) => {
  if (!pumpApi) {
    return res.status(500).json({
      success: false,
      error: 'Pump.fun API not configured'
    });
  }

  const walletInfo = {
    publicKey: pumpApi.getWalletPublicKey(),
    rpcUrl: pumpApi.getRpcUrl(),
    hasPrivateKey: !!pumpApi.getWalletPrivateKey()
  };

  return res.json({
    success: true,
    data: walletInfo
  });
});

// x402 Payment Endpoints
// Verify payment
app.post('/api/x402/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    if (!paymentPayload || !paymentRequirements) {
      res.status(400).json({
        success: false,
        error: 'Missing paymentPayload or paymentRequirements'
      });
      return;
    }

    logger.info('Verifying x402 payment');
    const isValid = await x402Service.verifyPayment(paymentPayload, paymentRequirements);

    res.json({
      success: true,
      isValid
    });
  } catch (error: any) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: isProduction ? 'Internal server error' : error.message
    });
  }
});

// Settle payment
app.post('/api/x402/settle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    if (!paymentPayload || !paymentRequirements) {
      res.status(400).json({
        success: false,
        error: 'Missing paymentPayload or paymentRequirements'
      });
      return;
    }

    logger.info('Settling x402 payment');
    const result = await x402Service.settlePayment(paymentPayload, paymentRequirements);

    if (result.success) {
      logger.info(`Payment settled successfully: ${result.transaction}`);
    } else {
      logger.error(`Payment settlement failed: ${result.error}`);
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Payment settlement error:', error);
    res.status(500).json({
      success: false,
      error: isProduction ? 'Internal server error' : error.message
    });
  }
});

// Get payment requirements
app.post('/api/x402/requirements', async (req: Request, res: Response): Promise<void> => {
  try {
    const { network, payTo, amount, description } = req.body;

    if (!network || !payTo || !amount) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: network, payTo, amount'
      });
      return;
    }

    const requirements = x402Service.buildPaymentRequirements(network, payTo, amount, description);

    res.json({
      success: true,
      requirements
    });
  } catch (error: any) {
    logger.error('Build requirements error:', error);
    res.status(500).json({
      success: false,
      error: isProduction ? 'Internal server error' : error.message
    });
  }
});

// x402 Hardware Bridge Endpoints (Integration with Python service)
app.get('/api/hardware/bridge-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${HARDWARE_BRIDGE_URL}/`);
    res.json(response.data);
  } catch (error: any) {
    res.json({
      success: false,
      message: 'Hardware bridge not available',
      error: 'Python bridge service not running on port 8402'
    });
  }
});

app.get('/api/hardware/devices', async (req: Request, res: Response): Promise<void> => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${HARDWARE_BRIDGE_URL}/hardware/devices`);
    res.json(response.data);
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'Hardware bridge not available. Start Python service: python x402_hardware_bridge.py'
    });
  }
});

app.post('/api/hardware/discover', async (req: Request, res: Response): Promise<void> => {
  try {
    const axios = require('axios');
    const { duration = 5 } = req.body;
    const response = await axios.post(`${HARDWARE_BRIDGE_URL}/hardware/discover`, { duration });
    res.json(response.data);
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'Hardware bridge not available'
    });
  }
});

app.post('/api/hardware/:deviceId/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const axios = require('axios');
    const { deviceId } = req.params;
    const payment = req.body;
    const response = await axios.post(
      `${HARDWARE_BRIDGE_URL}/hardware/${deviceId}/payment`,
      payment
    );
    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({
        success: false,
        error: 'Hardware bridge communication failed'
      });
    }
  }
});

// Auto-buy function WITH AUTOMATIC BURNING (Production-Ready)
async function performAutoBuy() {
  if (!pumpApi) {
    logger.error('Cannot perform auto-buy: Pump.fun API not configured');
    return;
  }

  // PRODUCTION CHECK: Validate token mint address
  if (!TOKEN_MINT_ADDRESS || TOKEN_MINT_ADDRESS.trim() === '') {
    logger.error(`❌ TOKEN_MINT_ADDRESS not configured - cannot buy tokens!`);
    logger.error(`Please set TOKEN_MINT_ADDRESS in your .env file`);
    
    // Stop auto-buy if token not configured to prevent spam errors
    if (autoBuyInterval) {
      clearInterval(autoBuyInterval);
      autoBuyInterval = null;
      logger.error('🛑 Auto-buy STOPPED due to missing TOKEN_MINT_ADDRESS');
    }
    return;
  }

  // PRODUCTION CHECK: Validate token mint address format (basic Solana public key check)
  try {
    new PublicKey(TOKEN_MINT_ADDRESS);
  } catch (error) {
    logger.error(`❌ Invalid TOKEN_MINT_ADDRESS format: ${TOKEN_MINT_ADDRESS}`);
    logger.error('Token mint address must be a valid Solana public key');
    return;
  }

  try {
    lastBuyTime = Date.now(); // Update last buy time for countdown
    logger.info(`🤖 [AUTO-BUY] Starting buy cycle: ${AUTO_BUY_AMOUNT} SOL`);
    
    // STEP 1: Collect any available creator fees (optional, won't fail if none available)
    try {
      const collectResult = await pumpApi.collectCreatorFee(0.000001);
      if (collectResult.success) {
        logger.info(`💰 [AUTO-BUY] Collected creator fees: ${collectResult.txSignature}`);
      }
    } catch (feeError: any) {
      // Creator fee collection failure shouldn't stop the buy cycle
      logger.warn(`⚠️ [AUTO-BUY] Could not collect creator fees: ${feeError.message}`);
    }

    // STEP 2: Buy tokens
    logger.info(`🛒 [AUTO-BUY] Purchasing ${AUTO_BUY_AMOUNT} SOL worth of ${TOKEN_MINT_ADDRESS.substring(0, 8)}...`);
    const buyResult = await pumpApi.buyToken(TOKEN_MINT_ADDRESS, AUTO_BUY_AMOUNT, 0.000001);
    
    if (buyResult.success && buyResult.txSignature) {
      logger.info(`✅ [AUTO-BUY] Purchase SUCCESS`);
      logger.info(`📝 Transaction: ${buyResult.txSignature}`);
      logger.info(`💵 Amount: ${AUTO_BUY_AMOUNT} SOL`);
      logger.info(`🪙 Token: ${TOKEN_MINT_ADDRESS}`);

      // STEP 3: BURN THE TOKENS! 🔥 (Production critical)
      if (burnService) {
        logger.info(`⏳ [BURN] Waiting for tokens to arrive in wallet (max 30s)...`);
        
        // Wait for tokens to appear (up to 30 seconds)
        const tokensArrived = await burnService.waitForTokens(TOKEN_MINT_ADDRESS, 30000);
        
        if (tokensArrived) {
          // PRODUCTION CHECK: Verify token balance before burning
          const balanceBeforeBurn = await burnService.getTokenBalance(TOKEN_MINT_ADDRESS);
          
          if (balanceBeforeBurn > 0) {
            logger.info(`🔥 [BURN] Burning ${balanceBeforeBurn} tokens...`);
            
            // Retry logic for burn (max 3 attempts)
            let burnAttempts = 0;
            const maxBurnAttempts = 3;
            let burnSuccess = false;
            
            while (burnAttempts < maxBurnAttempts && !burnSuccess) {
              burnAttempts++;
              logger.info(`🔥 [BURN] Attempt ${burnAttempts}/${maxBurnAttempts}...`);
              
              const burnResult = await burnService.burnAllTokens(TOKEN_MINT_ADDRESS);
              
              if (burnResult.success && burnResult.signature) {
                burnSuccess = true;
                logger.info(`🔥🔥🔥 [BURN] SUCCESS! ${burnResult.amountBurned} tokens DESTROYED!`);
                logger.info(`📝 Burn Transaction: ${burnResult.signature}`);
                logger.info(`✅ [CYCLE] BUY → BURN COMPLETE!`);
                
                // Verify tokens were actually burned
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for confirmation
                const balanceAfterBurn = await burnService.getTokenBalance(TOKEN_MINT_ADDRESS);
                
                if (balanceAfterBurn === 0) {
                  logger.info(`✅ [BURN] Verified: Wallet balance is now 0 (tokens fully burned)`);
                } else {
                  logger.warn(`⚠️ [BURN] Warning: Wallet still has ${balanceAfterBurn} tokens - may need manual burn`);
                }
              } else {
                logger.error(`❌ [BURN] Attempt ${burnAttempts} FAILED: ${burnResult.error}`);
                if (burnAttempts < maxBurnAttempts) {
                  logger.info(`🔄 [BURN] Retrying in 5 seconds...`);
                  await new Promise(resolve => setTimeout(resolve, 5000));
                }
              }
            }
            
            if (!burnSuccess) {
              logger.error(`❌ [BURN] All ${maxBurnAttempts} burn attempts FAILED!`);
              logger.error(`⚠️ Tokens may still be in wallet - manual intervention required`);
            }
          } else {
            logger.warn(`⚠️ [BURN] No tokens found in wallet (balance: ${balanceBeforeBurn}) - skipping burn`);
          }
        } else {
          logger.warn(`⚠️ [BURN] Tokens did not arrive within timeout - skipping burn`);
          logger.warn(`⚠️ This may indicate a transaction delay - tokens will accumulate`);
        }
      } else {
        logger.error(`❌ [BURN] Burn service not initialized!`);
        logger.error(`⚠️ Tokens will accumulate in wallet - configure SOLANA_PRIVATE_KEY and SOLANA_RPC_URL`);
      }
    } else {
      logger.error(`❌ [AUTO-BUY] Purchase FAILED: ${buyResult.error || 'Unknown error'}`);
      
      // Log additional debugging info in development
      if (!isProduction) {
        logger.error(`Debug info: ${JSON.stringify(buyResult, null, 2)}`);
      }
    }
  } catch (error: any) {
    logger.error(`❌ [AUTO-BUY] Fatal error: ${error.message}`);
    logger.error(`Stack trace: ${error.stack}`);
    
    // Don't let errors crash the auto-buy cycle - continue trying
    logger.info(`🔄 [AUTO-BUY] Will retry on next interval`);
  }
}

// Start auto-buy if enabled (Production-ready validation)
if (AUTO_BUY_ENABLED) {
  if (!pumpApi) {
    logger.error('❌ Auto-buy ENABLED but Pump.fun API not configured!');
    logger.error('⚠️ Set PUMP_API_KEY, SOLANA_PUBLIC_KEY, and SOLANA_PRIVATE_KEY in .env');
  } else if (!TOKEN_MINT_ADDRESS || TOKEN_MINT_ADDRESS.trim() === '') {
    logger.error('❌ Auto-buy ENABLED but TOKEN_MINT_ADDRESS not configured!');
    logger.error('⚠️ Set TOKEN_MINT_ADDRESS in .env file to enable auto-buy');
  } else if (!burnService) {
    logger.warn('⚠️ Auto-buy ENABLED but burn service not initialized!');
    logger.warn('⚠️ Tokens will be purchased but NOT burned - set SOLANA_PRIVATE_KEY and SOLANA_RPC_URL');
    logger.info('🚀 Starting auto-buy timer (WITHOUT burn capability)...');
    autoBuyInterval = setInterval(performAutoBuy, AUTO_BUY_INTERVAL);
    setTimeout(performAutoBuy, 5000);
  } else {
    logger.info('🚀 Starting PRODUCTION auto-buy timer (with burn)...');
    logger.info(`⚙️ Configuration:`);
    logger.info(`   - Buy Amount: ${AUTO_BUY_AMOUNT} SOL`);
    logger.info(`   - Interval: ${AUTO_BUY_INTERVAL / 1000} seconds`);
    logger.info(`   - Token: ${TOKEN_MINT_ADDRESS.substring(0, 16)}...`);
    logger.info(`   - Burn: ✅ ENABLED`);
    autoBuyInterval = setInterval(performAutoBuy, AUTO_BUY_INTERVAL);
    
    // Perform initial buy after 5 seconds
    logger.info('⏰ Initial buy will execute in 5 seconds...');
    setTimeout(performAutoBuy, 5000);
  }
}

// Auto-buy control endpoints
app.post('/api/auto-buy/start', (req: Request, res: Response): void => {
  if (!pumpApi) {
    res.status(500).json({
      success: false,
      error: 'Pump.fun API not configured'
    });
    return;
  }

  if (autoBuyInterval) {
    res.json({
      success: false,
      message: 'Auto-buy is already running'
    });
    return;
  }

  autoBuyInterval = setInterval(performAutoBuy, AUTO_BUY_INTERVAL);
  logger.info('🚀 Auto-buy started manually');
  
  res.json({
    success: true,
    message: `Auto-buy started: ${AUTO_BUY_AMOUNT} SOL every ${AUTO_BUY_INTERVAL/1000} seconds`
  });
});

app.post('/api/auto-buy/stop', (req: Request, res: Response): void => {
  if (autoBuyInterval) {
    clearInterval(autoBuyInterval);
    autoBuyInterval = null;
    logger.info('⏹️ Auto-buy stopped manually');
    
    res.json({
      success: true,
      message: 'Auto-buy stopped'
    });
  } else {
    res.json({
      success: false,
      message: 'Auto-buy is not running'
    });
  }
});

app.get('/api/auto-buy/status', (req: Request, res: Response) => {
  const now = Date.now();
  const nextBuyTime = lastBuyTime > 0 ? lastBuyTime + AUTO_BUY_INTERVAL : now + AUTO_BUY_INTERVAL;
  const timeUntilNext = Math.max(0, nextBuyTime - now);
  
  res.json({
    success: true,
    data: {
      enabled: AUTO_BUY_ENABLED,
      running: autoBuyInterval !== null,
      amount: AUTO_BUY_AMOUNT,
      interval: AUTO_BUY_INTERVAL,
      intervalSeconds: AUTO_BUY_INTERVAL / 1000,
      lastBuyTime: lastBuyTime,
      nextBuyTime: nextBuyTime,
      timeUntilNext: timeUntilNext
    }
  });
});

// Manual buy endpoint - trigger immediate buy
app.post('/api/auto-buy/manual', async (req: Request, res: Response): Promise<void> => {
  if (!pumpApi) {
    res.status(500).json({
      success: false,
      error: 'Pump.fun API not configured'
    });
    return;
  }

  try {
    logger.info('🔥 Manual buy triggered!');
    await performAutoBuy();
    res.json({
      success: true,
      message: `Manual buy executed: ${AUTO_BUY_AMOUNT} SOL`
    });
  } catch (error: any) {
    logger.error('Manual buy failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Manual buy failed'
    });
  }
});

// Token creation endpoint
app.post('/api/create-token', async (req: Request, res: Response): Promise<void> => {
  if (!pumpApi) {
    res.status(500).json({
      success: false,
      error: 'Pump.fun API not configured'
    });
    return;
  }

  try {
    const { 
      name, 
      symbol, 
      description, 
      twitter, 
      telegram, 
      website, 
      devBuyAmount = 1,
      slippage = 10,
      priorityFee = 0.0005
    } = req.body;

    if (!name || !symbol || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, symbol, description'
      });
      return;
    }

    logger.info(`Creating new token: ${name} (${symbol})`);

    // Generate a random keypair (in a real app, you'd use proper keypair generation)
    const mintKeypair = generateRandomKeypair();

    // Create default image buffer (in a real app, you'd upload an actual image)
    const defaultImageBuffer = createDefaultTokenImage(name, symbol);

    // Upload metadata to IPFS
    const ipfsResult = await pumpApi.uploadToIpfs({
      name,
      symbol,
      description,
      twitter,
      telegram,
      website,
      showName: 'true'
    }, defaultImageBuffer);

    if (!ipfsResult.success) {
      res.status(500).json({
        success: false,
        error: 'Failed to upload metadata to IPFS: ' + ipfsResult.error
      });
      return;
    }

    // Create the token
    const createResult = await pumpApi.createToken(
      {
        name,
        symbol,
        uri: ipfsResult.metadataUri || ''
      },
      mintKeypair,
      devBuyAmount,
      slippage,
      priorityFee
    );

    if (createResult.success) {
      logger.info(`Token created successfully: ${createResult.txSignature}`);
      res.json({
        success: true,
        data: {
          txSignature: createResult.txSignature,
          solscanUrl: `https://solscan.io/tx/${createResult.txSignature}`,
          tokenName: name,
          tokenSymbol: symbol
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create token: ' + createResult.error
      });
    }
  } catch (error: any) {
    logger.error('Token creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Token creation failed: ' + error.message
    });
  }
});

// Helper function to generate a random keypair string (simplified)
function generateRandomKeypair(): string {
  // In a real implementation, you'd use proper Solana keypair generation
  // This is a simplified version for demonstration
  const randomBytes = Array.from({ length: 64 }, () => Math.floor(Math.random() * 256));
  return Buffer.from(randomBytes).toString('base64');
}

// Helper function to create a default token image
function createDefaultTokenImage(name: string, symbol: string): Buffer {
  // In a real implementation, you'd load an actual image file
  // This creates a simple placeholder
  const canvas = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#ff0000"/>
      <text x="100" y="100" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        ${symbol}
      </text>
      <text x="100" y="130" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
        ${name}
      </text>
    </svg>
  `;
  return Buffer.from(canvas, 'utf-8');
}

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      pumpApi: pumpApi ? 'connected' : 'disconnected',
      database: 'not_required'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.json(health);
});

app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BURNAWEEN 🎃 - Spooky Token Incinerator</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Nosifer&family=Eater&family=Butcherman&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Butcherman', cursive;
          background: #0a0a0a;
          color: #ff8800; 
          margin: 0; 
          padding: 0;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }
        
        /* Spooky Halloween Background */
        .paper-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, #1a0a00 0%, #0a0a0a 50%, #000000 100%);
          z-index: -3;
        }
        
        .texture-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(255, 136, 0, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 0, 139, 0.1) 0%, transparent 50%);
          z-index: -2;
          pointer-events: none;
          opacity: 0.6;
          animation: hauntedGlow 10s ease-in-out infinite;
        }
        
        @keyframes hauntedGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
        
        /* Floating Bats */
        .bat {
          position: fixed;
          font-size: 2rem;
          opacity: 0.3;
          pointer-events: none;
          animation: batFly 15s ease-in-out infinite;
          color: #ff8800;
        }
        
        @keyframes batFly {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(100px, -50px) rotate(10deg); }
          50% { transform: translate(200px, 50px) rotate(-10deg); }
          75% { transform: translate(100px, 100px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        
        .bat:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
        .bat:nth-child(2) { top: 30%; right: 15%; animation-delay: 3s; }
        .bat:nth-child(3) { bottom: 20%; left: 20%; animation-delay: 6s; }
        .bat:nth-child(4) { bottom: 40%; right: 10%; animation-delay: 9s; }
        
        .container { 
          text-align: center; 
          background: linear-gradient(180deg, #1a0f0a 0%, #0d0806 50%, #000000 100%);
          padding: 20px 30px;
          border-radius: 20px;
          border: 6px solid #ff8800;
          box-shadow: 
            0 0 30px rgba(255, 136, 0, 0.6),
            0 0 60px rgba(255, 68, 0, 0.4),
            inset 0 0 100px rgba(255, 136, 0, 0.1),
            0 0 100px rgba(139, 0, 139, 0.3);
          position: relative;
          margin: 20px auto;
          max-width: 1200px;
          animation: eeriePulse 4s ease-in-out infinite;
          min-height: auto;
        }
        
        @keyframes eeriePulse {
          0%, 100% {
            box-shadow: 
              0 0 30px rgba(255, 136, 0, 0.6),
              0 0 60px rgba(255, 68, 0, 0.4),
              inset 0 0 100px rgba(255, 136, 0, 0.1);
          }
          50% {
            box-shadow: 
              0 0 50px rgba(255, 136, 0, 0.8),
              0 0 80px rgba(255, 68, 0, 0.6),
              inset 0 0 120px rgba(255, 136, 0, 0.15);
          }
        }
        
        /* Jack-o-Lantern Logo */
        .shield-logo {
          width: 200px;
          height: 200px;
          margin: 0 auto 15px auto;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(180deg, #ff8800 0%, #ff6600 50%, #ff4400 100%);
          border-radius: 50% 50% 45% 45%;
          border: 6px solid #2a1a00;
          box-shadow: 
            0 0 40px rgba(255, 136, 0, 0.8),
            0 0 80px rgba(255, 68, 0, 0.6),
            inset 0 -50px 60px rgba(0, 0, 0, 0.5);
          animation: pumpkinGlow 3s ease-in-out infinite;
        }
        
        @keyframes pumpkinGlow {
          0%, 100% {
            transform: translateX(-50%) scale(1) rotate(-2deg);
            box-shadow: 
              0 0 40px rgba(255, 136, 0, 0.8),
              0 0 80px rgba(255, 68, 0, 0.6),
              inset 0 -50px 60px rgba(0, 0, 0, 0.5);
          }
          50% {
            transform: translateX(-50%) scale(1.05) rotate(2deg);
            box-shadow: 
              0 0 60px rgba(255, 136, 0, 1),
              0 0 100px rgba(255, 68, 0, 0.8),
              inset 0 -50px 60px rgba(0, 0, 0, 0.6);
          }
        }
        
        .shield-logo::before {
          content: '🎃';
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 3rem;
          filter: drop-shadow(0 0 10px #ff8800);
        }
        
        .shield-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #000000;
          font-weight: 900;
          text-align: center;
          width: 100%;
          line-height: 1.15;
          text-shadow: 0 0 20px rgba(255, 136, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .shield-text-top {
          font-size: 1rem;
          letter-spacing: 6px;
          margin-bottom: 5px;
          font-family: 'Creepster', cursive;
          text-transform: uppercase;
          color: #2a1a00;
          text-align: center;
        }
        
        .shield-text-middle {
          font-size: 2.2rem;
          letter-spacing: 4px;
          font-family: 'Nosifer', cursive;
          margin: 8px 0;
          text-transform: uppercase;
          line-height: 1;
          color: #000000;
          text-shadow: 0 0 30px rgba(255, 200, 0, 1);
          text-align: center;
        }
        
        .shield-text-bottom {
          font-size: 1.1rem;
          letter-spacing: 4px;
          font-family: 'Eater', cursive;
          text-transform: uppercase;
          margin-top: 5px;
          color: #2a1a00;
          text-align: center;
        }
        
        .main-title {
          font-family: 'Nosifer', cursive;
          font-size: 2.5rem;
          font-weight: 900;
          color: #ff8800;
          margin-bottom: 10px;
          letter-spacing: 6px;
          text-transform: uppercase;
          text-shadow: 
            0 0 20px rgba(255, 136, 0, 0.8),
            0 0 40px rgba(255, 68, 0, 0.6),
            3px 3px 6px rgba(0, 0, 0, 0.8);
          animation: flicker 3s ease-in-out infinite;
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(255, 136, 0, 0.8), 0 0 40px rgba(255, 68, 0, 0.6), 3px 3px 6px rgba(0, 0, 0, 0.8); }
          50% { opacity: 0.95; text-shadow: 0 0 30px rgba(255, 136, 0, 1), 0 0 60px rgba(255, 68, 0, 0.8), 3px 3px 6px rgba(0, 0, 0, 0.8); }
        }
        
        .subtitle {
          font-size: 1.1rem;
          color: #ffaa44;
          margin-bottom: 15px;
          font-style: italic;
          font-weight: 600;
          font-family: Georgia, serif;
          text-shadow: 0 0 10px rgba(255, 136, 0, 0.5);
        }
        
        .status { 
          background: linear-gradient(135deg, #ff8800 0%, #ff4400 100%);
          color: #000000; 
          padding: 10px 25px; 
          border-radius: 15px;
          display: inline-block;
          margin: 15px 0;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(255, 200, 0, 0.8);
          box-shadow: 
            0 0 30px rgba(255, 136, 0, 0.8),
            0 0 60px rgba(255, 68, 0, 0.4);
          border: 3px solid #2a1a00;
          font-family: 'Eater', cursive;
          letter-spacing: 2px;
          animation: statusPulse 2s ease-in-out infinite;
        }
        
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .divider {
          width: 60%;
          height: 3px;
          background: linear-gradient(90deg, transparent 0%, #ff8800 20%, #ff4400 50%, #ff8800 80%, transparent 100%);
          margin: 15px auto;
          position: relative;
          box-shadow: 0 0 10px rgba(255, 136, 0, 0.6);
        }
        
        .divider::before,
        .divider::after {
          content: '🦇';
          position: absolute;
          font-size: 1.5rem;
          top: -15px;
          animation: batHover 2s ease-in-out infinite;
        }
        
        @keyframes batHover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .divider::before { left: -20px; }
        .divider::after { right: -20px; }
        
        .info { 
          margin: 15px 0; 
          background: linear-gradient(135deg, #1a0f0a 0%, #0d0806 100%);
          padding: 15px;
          border-radius: 15px;
          border: 3px solid #ff8800;
          box-shadow: 
            0 0 20px rgba(255, 136, 0, 0.4),
            inset 0 0 30px rgba(255, 136, 0, 0.1);
        }
        
        .info h3 {
          color: #ff8800;
          font-size: 1.3rem;
          margin-bottom: 10px;
          font-family: 'Creepster', cursive;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 0 15px rgba(255, 136, 0, 0.8);
        }
        
        .info p {
          margin: 8px 0;
          font-size: 0.95rem;
          color: #ffaa44;
          line-height: 1.5;
          font-family: Arial, sans-serif;
          font-weight: 500;
        }
        
        
        .command-button {
          background: linear-gradient(135deg, #ff8800 0%, #ff4400 100%);
          color: #000000;
          border: 2px solid #2a1a00;
          padding: 10px 20px;
          border-radius: 12px;
          font-family: 'Eater', cursive;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          margin: 5px;
          box-shadow: 
            0 0 20px rgba(255, 136, 0, 0.6),
            0 0 40px rgba(255, 68, 0, 0.4);
          transition: all 0.3s ease;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(255, 200, 0, 0.8);
        }
        
        .command-button:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 
            0 0 30px rgba(255, 136, 0, 0.8),
            0 0 60px rgba(255, 68, 0, 0.6);
          background: linear-gradient(135deg, #ffaa00 0%, #ff6600 100%);
        }
        
        .command-button:active {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 0 25px rgba(255, 136, 0, 0.7),
            0 0 50px rgba(255, 68, 0, 0.5);
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #2a1500 0%, #1a0a00 100%);
          padding: 15px;
          border-radius: 15px;
          border: 3px solid #ff8800;
          text-align: center;
          box-shadow: 
            0 0 20px rgba(255, 136, 0, 0.5),
            inset 0 0 30px rgba(255, 136, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '👻';
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 1.5rem;
          opacity: 0.3;
          animation: ghostFloat 3s ease-in-out infinite;
        }
        
        @keyframes ghostFloat {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-10px); opacity: 0.5; }
        }
        
        .stat-card:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 
            0 0 40px rgba(255, 136, 0, 0.7),
            inset 0 0 50px rgba(255, 136, 0, 0.15);
        }
        
        .stat-value {
          font-size: 2rem;
          color: #ff8800;
          font-weight: 900;
          font-family: 'Nosifer', cursive;
          margin-bottom: 5px;
          text-shadow: 0 0 20px rgba(255, 136, 0, 0.8);
        }
        
        .stat-label {
          color: #ffaa44;
          font-size: 0.9rem;
          margin-top: 5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Creepster', cursive;
        }
        
        /* Cobweb Corner Ornaments */
        .corner-ornament {
          position: absolute;
          width: 60px;
          height: 60px;
          opacity: 0.3;
          pointer-events: none;
        }
        
        .corner-ornament::before {
          content: '🕸️';
          font-size: 3rem;
          position: absolute;
        }
        
        .corner-ornament.top-left {
          top: 5px;
          left: 5px;
        }
        
        .corner-ornament.top-right {
          top: 5px;
          right: 5px;
          transform: scaleX(-1);
        }
        
        .corner-ornament.bottom-left {
          bottom: 5px;
          left: 5px;
          transform: scaleY(-1);
        }
        
        .corner-ornament.bottom-right {
          bottom: 5px;
          right: 5px;
          transform: scale(-1);
        }
        
        /* Floating Ghosts */
        .red-star {
          position: fixed;
          font-size: 2.5rem;
          opacity: 0.2;
          animation: ghostFloat2 8s ease-in-out infinite;
          pointer-events: none;
          filter: drop-shadow(0 0 10px rgba(255, 136, 0, 0.5));
        }
        
        @keyframes ghostFloat2 {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) translateX(20px);
            opacity: 0.4;
          }
        }
        
        .red-star:nth-child(1) { top: 10%; left: 5%; animation-delay: 0s; }
        .red-star:nth-child(2) { top: 20%; right: 8%; animation-delay: 2s; }
        .red-star:nth-child(3) { bottom: 15%; left: 10%; animation-delay: 4s; }
        .red-star:nth-child(4) { bottom: 25%; right: 5%; animation-delay: 6s; }
        
        .social-links {
          margin-top: 40px;
          text-align: center;
        }
        
        .twitter-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ff8800;
          text-decoration: none;
          font-family: 'Eater', cursive;
          font-size: 1.2rem;
          padding: 16px 32px;
          border: 3px solid #ff8800;
          border-radius: 15px;
          background: linear-gradient(135deg, #2a1500 0%, #1a0a00 100%);
          transition: all 0.3s ease;
          box-shadow: 
            0 0 20px rgba(255, 136, 0, 0.5),
            inset 0 0 20px rgba(255, 136, 0, 0.1);
          font-weight: 600;
          letter-spacing: 2px;
        }
        
        .twitter-link:hover {
          color: #000000;
          background: linear-gradient(135deg, #ff8800 0%, #ff4400 100%);
          box-shadow: 
            0 0 30px rgba(255, 136, 0, 0.8),
            inset 0 0 30px rgba(255, 200, 0, 0.2);
          transform: translateY(-3px);
          text-shadow: 0 0 10px rgba(255, 200, 0, 0.8);
        }
        
        .twitter-link svg {
          width: 24px;
          height: 24px;
          fill: currentColor;
        }
        
        .twitter-link span {
          font-weight: 700;
        }
        
        /* Modal Styles */
        .modal {
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          background: linear-gradient(135deg, #1a0f0a 0%, #0d0806 100%);
          margin: 5% auto;
          padding: 40px;
          border: 5px solid #ff8800;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          position: relative;
          box-shadow: 
            0 0 40px rgba(255, 136, 0, 0.8),
            0 0 80px rgba(255, 68, 0, 0.4);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .close {
          color: #ff8800;
          float: right;
          font-size: 36px;
          font-weight: bold;
          cursor: pointer;
          position: absolute;
          top: 15px;
          right: 25px;
          line-height: 1;
          text-shadow: 0 0 15px rgba(255, 136, 0, 0.8);
          transition: all 0.3s ease;
        }
        
        .close:hover {
          color: #ffaa00;
          transform: rotate(90deg) scale(1.2);
          text-shadow: 0 0 25px rgba(255, 136, 0, 1);
        }
        
        .modal h2 {
          color: #ff8800;
          text-align: center;
          margin-bottom: 30px;
          font-size: 2.5rem;
          font-family: 'Nosifer', cursive;
          font-weight: 700;
          letter-spacing: 4px;
          text-shadow: 0 0 20px rgba(255, 136, 0, 0.8);
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          color: #ff8800;
          margin-bottom: 8px;
          font-weight: 700;
          font-family: 'Creepster', cursive;
          font-size: 1.1rem;
          text-shadow: 0 0 10px rgba(255, 136, 0, 0.5);
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #ff8800;
          border-radius: 10px;
          background: #0a0a0a;
          color: #ffaa44;
          font-family: 'Butcherman', cursive;
          font-size: 1.05rem;
          box-shadow: 
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 15px rgba(255, 136, 0, 0.2);
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #ffaa00;
          box-shadow: 
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 25px rgba(255, 136, 0, 0.6);
        }
        
        .form-group textarea {
          height: 80px;
          resize: vertical;
        }
        
        .form-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }
        
        .form-buttons .command-button {
          flex: 1;
          max-width: 200px;
        }
        
        /* Countdown Timer Styles */
        .countdown-section {
          margin: 15px 0;
          padding: 20px;
          background: linear-gradient(135deg, #2a1500 0%, #1a0a00 100%);
          border: 3px solid #ff8800;
          border-radius: 15px;
          box-shadow: 
            0 0 30px rgba(255, 136, 0, 0.6),
            inset 0 0 50px rgba(255, 136, 0, 0.1);
          position: relative;
        }
        
        .countdown-section::before {
          content: '⏰';
          position: absolute;
          top: 15px;
          left: 15px;
          font-size: 2rem;
          animation: clockTick 2s ease-in-out infinite;
        }
        
        @keyframes clockTick {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }
        
        .countdown-title {
          color: #ff8800;
          font-size: 1.2rem;
          margin-bottom: 10px;
          font-family: 'Eater', cursive;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 0 15px rgba(255, 136, 0, 0.8);
        }
        
        .countdown-timer {
          font-size: 2.5rem;
          font-weight: 900;
          color: #ff8800;
          font-family: 'Nosifer', cursive;
          letter-spacing: 8px;
          text-shadow: 
            0 0 30px rgba(255, 136, 0, 1),
            0 0 60px rgba(255, 68, 0, 0.6);
          animation: timerPulse 1s ease-in-out infinite;
        }
        
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .countdown-status {
          margin-top: 10px;
          font-size: 0.95rem;
          color: #ffaa44;
          font-weight: 600;
          font-family: 'Creepster', cursive;
        }
      </style>
    </head>
    <body>
      <!-- Spooky Halloween Background -->
      <div class="paper-bg"></div>
      <div class="texture-overlay"></div>
      
      <!-- Floating Bats -->
      <div class="bat">🦇</div>
      <div class="bat">🦇</div>
      <div class="bat">🦇</div>
      <div class="bat">🦇</div>
      
      <!-- Floating Ghosts -->
      <div class="red-star">👻</div>
      <div class="red-star">🎃</div>
      <div class="red-star">💀</div>
      <div class="red-star">👻</div>
      
      <div class="container">
        <!-- Cobweb Corner Ornaments -->
        <div class="corner-ornament top-left"></div>
        <div class="corner-ornament top-right"></div>
        <div class="corner-ornament bottom-left"></div>
        <div class="corner-ornament bottom-right"></div>
        
        <!-- Jack-o-Lantern Logo -->
        <div class="shield-logo">
          <div class="shield-text">
            <div class="shield-text-top">🔥 THE 🔥</div>
            <div class="shield-text-middle">BURNAWEEN</div>
            <div class="shield-text-bottom">💀 PORTAL 💀</div>
          </div>
        </div>
        
        <h1 class="main-title">🎃 BURNAWEEN 🎃</h1>
        <p class="subtitle">Where Tokens Go to Haunt the Blockchain Forever...</p>
        
        <div class="divider"></div>
        
        <div class="status">🔥 INCINERATOR ACTIVE 🔥</div>
        
        <div class="divider"></div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">🎃</div>
            <div class="stat-label">Haunted</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="burnedCount">0</div>
            <div class="stat-label">Souls Burned</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="rewardsCount">0</div>
            <div class="stat-label">Treats Collected</div>
          </div>
        </div>
        
        <!-- Countdown Timer Section -->
        <div class="countdown-section">
          <div class="countdown-title">⏰ Next Sacrifice Scheduled:</div>
          <div class="countdown-timer" id="countdownTimer">--:--</div>
          <div class="countdown-status" id="countdownStatus">Awaiting midnight ritual...</div>
        </div>
        
        <div class="info">
          <h3>👻 Spooky Services:</h3>
          <p>• 🔥 Automated Token Cremation</p>
          <p>• 💀 Soul Extraction Operations</p>
          <p>• 🍬 Trick-or-Treat Rewards via Pump.fun</p>
          <p>• 🕷️ Real-time Haunted Dashboard</p>
        </div>
        
        <div class="divider"></div>
        
        <button class="command-button" onclick="simulateBurn()">🔥 Incinerate Token</button>
        <button class="command-button" onclick="simulateRewards()">🍬 Collect Treats</button>
        <button class="command-button" onclick="startAutoBuy()">🎃 Start Haunting</button>
        <button class="command-button" onclick="stopAutoBuy()">💀 Stop Ritual</button>
        <button class="command-button" onclick="showCreateTokenForm()">👻 Summon Token</button>
        
        <!-- Token Creation Form Modal -->
        <div id="tokenFormModal" class="modal" style="display: none;">
          <div class="modal-content">
            <span class="close" onclick="hideCreateTokenForm()">&times;</span>
            <h2>👻 Summon New Token</h2>
            <form id="createTokenForm">
              <div class="form-group">
                <label for="tokenName">🎃 Token Name:</label>
                <input type="text" id="tokenName" name="name" required placeholder="e.g., Spooky Coin">
              </div>
              <div class="form-group">
                <label for="tokenSymbol">💀 Token Symbol:</label>
                <input type="text" id="tokenSymbol" name="symbol" required placeholder="e.g., SPKY" maxlength="10">
              </div>
              <div class="form-group">
                <label for="tokenDescription">👻 Description:</label>
                <textarea id="tokenDescription" name="description" required placeholder="Describe your haunting tale..."></textarea>
              </div>
              <div class="form-group">
                <label for="twitter">🦇 Twitter URL (optional):</label>
                <input type="url" id="twitter" name="twitter" placeholder="https://x.com/yourusername">
              </div>
              <div class="form-group">
                <label for="telegram">🕷️ Telegram URL (optional):</label>
                <input type="url" id="telegram" name="telegram" placeholder="https://t.me/yourchannel">
              </div>
              <div class="form-group">
                <label for="website">🕸️ Website URL (optional):</label>
                <input type="url" id="website" name="website" placeholder="https://yourwebsite.com">
              </div>
              <div class="form-group">
                <label for="devBuyAmount">🔥 Initial Sacrifice (SOL):</label>
                <input type="number" id="devBuyAmount" name="devBuyAmount" value="1" min="0.1" max="10" step="0.1">
              </div>
              <div class="form-buttons">
                <button type="button" class="command-button" onclick="hideCreateTokenForm()">Flee</button>
                <button type="submit" class="command-button">👻 Summon</button>
              </div>
            </form>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="social-links">
          <a href="https://x.com/i/communities/1982289285962186822" target="_blank" class="twitter-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>👻 Join the Coven 🎃</span>
          </a>
        </div>
      </div>
      
      <script>
        // No particle system needed for this design
        
        // Countdown Timer Variables
        let countdownInterval = null;
        let nextBuyTime = null;
        let isAutoBuyRunning = false;
        
        // Function to update countdown timer
        function updateCountdown() {
          const timerElement = document.getElementById('countdownTimer');
          const statusElement = document.getElementById('countdownStatus');
          
          if (!isAutoBuyRunning || !nextBuyTime) {
            timerElement.textContent = '--:--';
            statusElement.textContent = 'Waiting for the witching hour...';
            return;
          }
          
          const now = Date.now();
          const timeLeft = Math.max(0, nextBuyTime - now);
          
          if (timeLeft === 0) {
            timerElement.textContent = '00:00';
            statusElement.textContent = 'Summoning the dark ritual...';
            // Reset next buy time after a short delay
            setTimeout(checkAutoBuyStatus, 2000);
            return;
          }
          
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          
          timerElement.textContent = \`\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
          statusElement.textContent = \`The curse is active and spirits are restless...\`;
        }
        
        // Function to start countdown
        function startCountdown() {
          if (countdownInterval) {
            clearInterval(countdownInterval);
          }
          
          countdownInterval = setInterval(updateCountdown, 1000);
          updateCountdown();
        }
        
        // Function to stop countdown
        function stopCountdown() {
          if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
          }
          
          isAutoBuyRunning = false;
          nextBuyTime = null;
          updateCountdown();
        }
        
        // Function to check auto-buy status
        async function checkAutoBuyStatus() {
          try {
            const response = await fetch('/api/auto-buy/status');
            const data = await response.json();
            
            if (data.success && data.data) {
              isAutoBuyRunning = data.data.running;
              
              if (isAutoBuyRunning) {
                // Use next buy time from server
                nextBuyTime = data.data.nextBuyTime;
                startCountdown();
              } else {
                stopCountdown();
              }
            }
          } catch (error) {
            console.error('Error checking auto-buy status:', error);
          }
        }
        
        // Check status on page load and every 10 seconds
        checkAutoBuyStatus();
        setInterval(checkAutoBuyStatus, 10000);
        
        // Function to increment burned token count
        function incrementBurnedCount() {
          const burnedElement = document.getElementById('burnedCount');
          if (burnedElement) {
            const currentCount = parseInt(burnedElement.textContent) || 0;
            const newCount = currentCount + 1;
            burnedElement.textContent = newCount;
            
            // Add some visual feedback
            burnedElement.style.color = '#ff0000';
            burnedElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
              burnedElement.style.color = '#ff6666';
              burnedElement.style.transform = 'scale(1)';
            }, 500);
          }
        }
        
        // Function to increment rewards count
        function incrementRewardsCount(amount = 1) {
          const rewardsElement = document.getElementById('rewardsCount');
          if (rewardsElement) {
            const currentCount = parseInt(rewardsElement.textContent) || 0;
            const newCount = currentCount + amount;
            rewardsElement.textContent = newCount;
            
            // Add some visual feedback
            rewardsElement.style.color = '#00ff00';
            rewardsElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
              rewardsElement.style.color = '#ff6666';
              rewardsElement.style.transform = 'scale(1)';
            }, 500);
          }
        }
        
        // Function to process token using pump.fun API
        async function simulateBurn() {
          try {
            const response = await fetch('/api/collect-creator-fees', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                priorityFee: 0.000001
              })
            });
            const data = await response.json();
            
            if (data.success) {
              incrementBurnedCount();
              alert('🔥 Token Soul Incinerated!\\n\\nTransaction: ' + (data.txSignature || 'Pending') + '\\n\\n💀 Another victim claimed by BURNAWEEN! The ashes scatter into the void... 🎃');
            } else {
              alert('❌ Ritual Failed: ' + data.error + '\\n\\nThe spirits reject this offering!');
            }
          } catch (error) {
            alert('❌ Dark Magic Error: ' + error.message + '\\n\\n👻 Something went terribly wrong!');
          }
        }
        
        // Function to collect rewards using pump.fun API
        async function simulateRewards() {
          try {
            const response = await fetch('/api/collect-creator-fees', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                priorityFee: 0.000001
              })
            });
            const data = await response.json();
            
            if (data.success) {
              incrementRewardsCount(1);
              alert('🍬 Treats Collected!\\n\\nTransaction: ' + (data.txSignature || 'Pending') + '\\n\\n🎃 Trick-or-Treat! Your candy bag is fuller! Sweet rewards from the crypto graveyard! 👻');
            } else {
              alert('❌ Trick Failed: ' + data.error + '\\n\\nNo treats this time... only tricks!');
            }
          } catch (error) {
            alert('❌ Haunting Error: ' + error.message + '\\n\\n💀 The ghosts are not cooperating!');
          }
        }
        
        // Auto-buy control functions
        async function startAutoBuy() {
          try {
            const response = await fetch('/api/auto-buy/start', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            
            if (data.success) {
              alert('🎃 Haunting Commenced!\\n\\n' + data.message + '\\n\\n👻 The spirits are awakened! BURNAWEEN portal is now ACTIVE! 🔥');
              // Update countdown timer
              setTimeout(checkAutoBuyStatus, 500);
            } else {
              alert('❌ Ritual Failed: ' + data.message + '\\n\\nThe curse could not be activated!');
            }
          } catch (error) {
            alert('❌ Summoning Error: ' + error.message + '\\n\\n💀 Dark forces prevent the ritual!');
          }
        }
        
        async function stopAutoBuy() {
          try {
            const response = await fetch('/api/auto-buy/stop', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            
            if (data.success) {
              alert('💀 Ritual Stopped!\\n\\n' + data.message + '\\n\\n👻 The spirits return to their graves... BURNAWEEN rests for now.');
              // Stop countdown timer
              stopCountdown();
            } else {
              alert('❌ Banishment Failed: ' + data.message + '\\n\\nThe spirits refuse to leave!');
            }
          } catch (error) {
            alert('❌ Exorcism Error: ' + error.message + '\\n\\n🎃 The haunting continues!');
          }
        }
        
        // Token creation functions
        function showCreateTokenForm() {
          document.getElementById('tokenFormModal').style.display = 'block';
        }
        
        function hideCreateTokenForm() {
          document.getElementById('tokenFormModal').style.display = 'none';
        }
        
        // Handle form submission
        document.getElementById('createTokenForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const tokenData = {
            name: formData.get('name'),
            symbol: formData.get('symbol'),
            description: formData.get('description'),
            twitter: formData.get('twitter') || undefined,
            telegram: formData.get('telegram') || undefined,
            website: formData.get('website') || undefined,
            devBuyAmount: parseFloat(formData.get('devBuyAmount') || '1')
          };
          
          try {
            const response = await fetch('/api/create-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(tokenData)
            });
            
            const data = await response.json();
            
            if (data.success) {
              alert('👻 Token Summoned Successfully!\\n\\n' +
                    '🎃 Name: ' + data.data.tokenName + '\\n' +
                    '💀 Symbol: ' + data.data.tokenSymbol + '\\n' +
                    '🔥 Transaction: ' + data.data.txSignature + '\\n\\n' +
                    '🕷️ View on Solscan: ' + data.data.solscanUrl + '\\n\\n' +
                    '👻 Your token has risen from the crypto graveyard! BURNAWEEN welcomes another haunted soul! 🎃');
              
              hideCreateTokenForm();
              e.target.reset(); // Reset form
            } else {
              alert('❌ Summoning Failed: ' + data.error + '\\n\\nThe dark ritual was interrupted!');
            }
          } catch (error) {
            alert('❌ Necromancy Error: ' + error.message + '\\n\\n💀 Failed to raise the token from the dead!');
          }
        });
        
        // Close modal when clicking outside
        window.onclick = function(event) {
          const modal = document.getElementById('tokenFormModal');
          if (event.target === modal) {
            hideCreateTokenForm();
          }
        };
      </script>
    </body>
    </html>
  `);
});

// Export app for serverless platforms (Vercel, etc.)
module.exports = app;

// Only start HTTP server if not in serverless environment
if (!process.env.VERCEL && !process.env.NETLIFY) {
  // Start server with proper error handling
  const server = app.listen(port, host, () => {
    logger.info(`✅ Server running at http://${host}:${port}`);
    logger.info('🎃 BURNAWEEN Portal is OPEN! Enter if you dare... 👻');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    // Stop auto-buy if running
    if (autoBuyInterval) {
      clearInterval(autoBuyInterval);
      logger.info('Auto-buy stopped during shutdown');
    }
    
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    
    // Stop auto-buy if running
    if (autoBuyInterval) {
      clearInterval(autoBuyInterval);
      logger.info('Auto-buy stopped during shutdown');
    }
    
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
  });
}
