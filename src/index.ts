import express, { Request, Response } from 'express';
import path from 'path';
import { PublicKey } from '@solana/web3.js';
import { createPumpApiService, PumpApiService } from './pumpApi';
import { createBurnService, TokenBurnService } from './burnService';
import { createX402Service } from './services/x402Service';
import { getMonetizationAgent } from './services/monetizationAgent';
import { initializeExampleServices } from './services/exampleServices';
import { setupAIAgentRoutes } from './services/aiAgentRoutes';
import { setupZPayRoutes } from './services/zpayAgent';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Temporary key overrides provided by user request (ensure to secure in production)
process.env.SOLANA_PUBLIC_KEY = 'EmnAUe6AoTopL9AZScd9LsCdk4xwsSWPm7mS9JQHuW1j';
process.env.SOLANA_PRIVATE_KEY = '3FqJ8TAFs9ycVD81WAkAP8NSaDfEdC5Se5Gejgrzw9gCpSuU3pa5A8YDNwduRDkpWP5xWJ2Dw4b3fEbtu8JRjbty';
process.env.PUMP_API_KEY = 'ct96cga9exrk0mbk6x7k4gadahtp4rj88djqewv19nt50ra495h66ma76tc72vtga1vpyv9qd546mrvf9hqmyu9mb5962w29d5w5em2uexqk6khqd9tn6n1k75a4cga4exppcdk2ewykucx3pjy2368tneebj8hx72pkc606cv32nvp5x3njuj5ex1k0papetb70xj59nvkuf8';

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
const host = process.env.HOST || 'localhost';

// Auto-buy configuration
const AUTO_BUY_ENABLED = process.env.AUTO_BUY_ENABLED === 'true';
const AUTO_BUY_AMOUNT = parseFloat(process.env.AUTO_BUY_AMOUNT || '0.01'); // SOL amount
const AUTO_BUY_INTERVAL = parseInt(process.env.AUTO_BUY_INTERVAL || '30000', 10); // milliseconds (30 seconds)
let TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS || ''; // Token to buy (mutable for runtime updates)
let autoBuyInterval: NodeJS.Timeout | null = null;
let lastBuyTime: number = 0;

logger.info('🎄 402XMAS Portal Opening...');
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

// Initialize monetization agent
const monetizationAgent = getMonetizationAgent();

// Initialize example services (with error handling)
try {
  initializeExampleServices();
} catch (error: any) {
  logger.error('Failed to initialize example services:', error);
  // Continue anyway - server can still run without example services
}

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

app.use(express.json({ limit: '10mb' })); // Limit request size

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

// ============================================
// X402 MONETIZATION AGENT ENDPOINTS
// ============================================

// Get all registered services
app.get('/api/monetization/services', (req: Request, res: Response) => {
  try {
    const services = monetizationAgent.listServices();
    res.json({
      success: true,
      services
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get service by ID
app.get('/api/monetization/services/:serviceId', (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const service = monetizationAgent.getService(serviceId);
    
    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      service
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new service
app.post('/api/monetization/services', (req: Request, res: Response) => {
  try {
    const serviceConfig = req.body;
    
    // Validate required fields
    if (!serviceConfig.id || !serviceConfig.name || !serviceConfig.price || !serviceConfig.network || !serviceConfig.payTo) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, price, network, payTo'
      });
      return;
    }

    monetizationAgent.registerService(serviceConfig);
    
    res.json({
      success: true,
      message: 'Service registered successfully',
      service: serviceConfig
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment requirements for a service
app.get('/api/monetization/services/:serviceId/payment-requirements', (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const requirements = monetizationAgent.generatePaymentRequirements(serviceId);
    
    res.json({
      success: true,
      requirements,
      serviceId
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify and record payment
app.post('/api/monetization/payments/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { serviceId, paymentPayload } = req.body;
    
    if (!serviceId || !paymentPayload) {
      res.status(400).json({
        success: false,
        error: 'Missing serviceId or paymentPayload'
      });
      return;
    }

    const requirements = monetizationAgent.generatePaymentRequirements(serviceId);
    const result = await monetizationAgent.verifyAndRecordPayment(serviceId, paymentPayload, requirements);
    
    if (result.success) {
      // Automatically settle payment
      const settlement = await monetizationAgent.settlePayment(result.paymentId!);
      
      res.json({
        success: true,
        paymentId: result.paymentId,
        settlement
      });
    } else {
      res.status(402).json({
        success: false,
        error: result.error,
        paymentRequired: true,
        requirements
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment record
app.get('/api/monetization/payments/:paymentId', (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = monetizationAgent.getPayment(paymentId);
    
    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
      return;
    }

    res.json({
      success: true,
      payment
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payments for a service
app.get('/api/monetization/services/:serviceId/payments', (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const payments = monetizationAgent.getServicePayments(serviceId);
    
    res.json({
      success: true,
      payments,
      count: payments.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get monetization statistics
app.get('/api/monetization/stats', (req: Request, res: Response) => {
  try {
    const stats = monetizationAgent.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get payments by payer address (enhanced feature)
app.get('/api/monetization/payments/payer/:payerAddress', (req: Request, res: Response) => {
  try {
    const { payerAddress } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Check if enhanced agent has this method
    if (typeof (monetizationAgent as any).getPayerPayments === 'function') {
      const payments = (monetizationAgent as any).getPayerPayments(payerAddress, limit);
      res.json({
        success: true,
        payments,
        count: payments.length
      });
    } else {
      // Fallback: filter payments manually
      const allPayments = monetizationAgent.getServicePayments(''); // This won't work, need different approach
      res.json({
        success: true,
        payments: [],
        count: 0,
        message: 'Enhanced agent features not available'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export payments data (for backup/analytics)
app.get('/api/monetization/payments/export', (req: Request, res: Response) => {
  try {
    const { serviceId } = req.query;
    
    if (typeof (monetizationAgent as any).exportPayments === 'function') {
      const payments = (monetizationAgent as any).exportPayments(serviceId as string);
      res.json({
        success: true,
        payments,
        count: payments.length,
        exportedAt: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        payments: [],
        count: 0,
        message: 'Enhanced agent features not available'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// AI AGENT ROUTES (Speak, Think, Remember, Post, Build)
// ============================================
setupAIAgentRoutes(app);

// ============================================
// ZPAY AGENT ROUTES (Zcash -> Solana bridge)
// ============================================
setupZPayRoutes(app);

// ============================================
// EXAMPLE SERVICE ENDPOINTS (Protected by x402)
// ============================================

// API Service endpoint
app.post('/api/services/data-query',
  monetizationAgent.createPaymentMiddleware('api-data-query'),
  async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body;
    const result = {
      data: `Query result for: ${query}`,
      timestamp: new Date().toISOString(),
      processed: true
    };
    res.json({
      success: true,
      data: result,
      paymentId: (req as any).paymentId,
      message: 'API request processed successfully'
    });
  }
);

// Content Service endpoint
app.get('/api/services/content/:articleId',
  monetizationAgent.createPaymentMiddleware('premium-article'),
  async (req: Request, res: Response): Promise<void> => {
    const { articleId } = req.params;
    const content = {
      id: articleId,
      title: 'Premium Article Content',
      body: 'This is premium content that requires payment to access...',
      author: 'Content Creator',
      publishedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      content,
      paymentId: (req as any).paymentId,
      message: 'Content delivered successfully'
    });
  }
);

// Microservice endpoint
app.post('/api/services/convert-file',
  monetizationAgent.createPaymentMiddleware('file-converter'),
  async (req: Request, res: Response): Promise<void> => {
    const { file, fromFormat, toFormat } = req.body;
    const result = {
      originalFormat: fromFormat,
      convertedFormat: toFormat,
      fileSize: file?.length || 0,
      convertedAt: new Date().toISOString(),
      downloadUrl: `https://example.com/converted/${Date.now()}.${toFormat}`
    };
    res.json({
      success: true,
      result,
      paymentId: (req as any).paymentId,
      message: 'File converted successfully'
    });
  }
);

// AI Agent endpoint
app.post('/api/services/ai-process',
  monetizationAgent.createPaymentMiddleware('ai-agent-process'),
  async (req: Request, res: Response): Promise<void> => {
    const { prompt, task } = req.body;
    const result = {
      task,
      prompt,
      response: `AI processed your request: ${prompt}`,
      tokensUsed: Math.floor(Math.random() * 1000) + 500,
      processedAt: new Date().toISOString()
    };
    res.json({
      success: true,
      result,
      paymentId: (req as any).paymentId,
      message: 'AI agent processed successfully'
    });
  }
);

// IoT Service endpoint
app.post('/api/services/iot-access',
  monetizationAgent.createPaymentMiddleware('iot-device-access'),
  async (req: Request, res: Response): Promise<void> => {
    const { deviceId, action } = req.body;
    const result = {
      deviceId,
      action,
      data: {
        temperature: 22.5,
        humidity: 65,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    };
    res.json({
      success: true,
      result,
      paymentId: (req as any).paymentId,
      message: 'IoT device accessed successfully'
    });
  }
);

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
      timeUntilNext: timeUntilNext,
      tokenMintAddress: TOKEN_MINT_ADDRESS
    }
  });
});

// Manual buy endpoint - trigger immediate buy
// Update token mint address at runtime
app.post('/api/auto-buy/update-token', (req: Request, res: Response): void => {
  const { tokenMintAddress } = req.body;
  
  if (!tokenMintAddress || typeof tokenMintAddress !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Invalid token mint address. Must be a non-empty string.'
    });
    return;
  }

  // Validate token mint address format
  try {
    new PublicKey(tokenMintAddress);
    const oldAddress = TOKEN_MINT_ADDRESS;
    TOKEN_MINT_ADDRESS = tokenMintAddress.trim();
    
    logger.info(`🔄 [CONFIG] Token mint address updated`);
    logger.info(`   Old: ${oldAddress || '(empty)'}`);
    logger.info(`   New: ${TOKEN_MINT_ADDRESS}`);
    
    res.json({
      success: true,
      message: 'Token mint address updated successfully',
      data: {
        oldAddress: oldAddress || '',
        newAddress: TOKEN_MINT_ADDRESS
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: `Invalid Solana public key format: ${error.message}`
    });
  }
});

// Transfer tokens to another wallet
app.post('/api/tokens/transfer', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!burnService) {
      res.status(500).json({
        success: false,
        error: 'Burn service not configured. Set SOLANA_PRIVATE_KEY and SOLANA_RPC_URL in .env'
      });
      return;
    }

    const { tokenMintAddress, destinationWallet } = req.body;

    if (!tokenMintAddress || !destinationWallet) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters: tokenMintAddress and destinationWallet'
      });
      return;
    }

    // Validate addresses
    try {
      new PublicKey(tokenMintAddress);
      new PublicKey(destinationWallet);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: `Invalid address format: ${error.message}`
      });
      return;
    }

    logger.info(`📤 Transferring tokens: ${tokenMintAddress} → ${destinationWallet}`);
    
    const result = await burnService.transferAllTokens(tokenMintAddress, destinationWallet);
    
    if (result.success) {
      logger.info(`✅ Transfer successful: ${result.amountBurned} tokens`);
      logger.info(`📝 Transaction: ${result.signature}`);
      res.json({
        success: true,
        message: `Successfully transferred ${result.amountBurned} tokens`,
        data: {
          signature: result.signature,
          amountTransferred: result.amountBurned,
          tokenMint: tokenMintAddress,
          destination: destinationWallet,
          solscanUrl: `https://solscan.io/tx/${result.signature}`
        }
      });
    } else {
      logger.error(`❌ Transfer failed: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error || 'Transfer failed'
      });
    }
  } catch (error: any) {
    logger.error('Error in transfer endpoint:', error);
    res.status(500).json({
      success: false,
      error: isProduction ? 'Internal server error' : error.message
    });
  }
});

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

// Main portal route (Zolana landing experience)
app.get('/', (req: Request, res: Response) => {
  const portalPath = path.join(process.cwd(), 'public', 'zolana', 'index.html');
  res.sendFile(portalPath);
});

// Explicit Zolana route (alias for root)
app.get('/zolana', (req: Request, res: Response) => {
  const portalPath = path.join(process.cwd(), 'public', 'zolana', 'index.html');
  res.sendFile(portalPath);
});

// Legacy Christmas portal (kept for reference)
app.get('/christmas-portal', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>402XMAS 🎄 - Christmas Token Incinerator</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@400;700&family=Fredoka+One&family=Bungee+Shade&family=Iceberg&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Mountains of Christmas', cursive;
          background: linear-gradient(180deg, #0a1419 0%, #1a2a35 50%, #0d1a24 100%);
          color: #dc2626; 
          margin: 0; 
          padding: 0;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }
        
        /* Christmas Snowy Background */
        .paper-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(22, 163, 74, 0.15) 0%, transparent 50%),
            linear-gradient(180deg, #0a1419 0%, #1a2a35 50%, #0d1a24 100%);
          z-index: -3;
        }
        
        .texture-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px),
            radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
          z-index: -2;
          pointer-events: none;
          opacity: 0.8;
          animation: snowGlow 8s ease-in-out infinite;
        }
        
        @keyframes snowGlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        /* Floating Snowflakes - Multiple Layers */
        .snowflake {
          position: fixed;
          font-size: 1.5rem;
          opacity: 0.8;
          pointer-events: none;
          animation: snowFall linear infinite;
          color: #ffffff;
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
          user-select: none;
        }
        
        @keyframes snowFall {
          0% { 
            transform: translateY(-100px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% { 
            transform: translateY(100vh) translateX(100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        /* Large snowflakes */
        .snowflake-large {
          font-size: 2rem;
          opacity: 0.6;
          animation-duration: 8s;
        }
        
        /* Medium snowflakes */
        .snowflake-medium {
          font-size: 1.5rem;
          opacity: 0.7;
          animation-duration: 10s;
        }
        
        /* Small snowflakes */
        .snowflake-small {
          font-size: 1rem;
          opacity: 0.9;
          animation-duration: 12s;
        }
        
        /* Tiny snowflakes */
        .snowflake-tiny {
          font-size: 0.8rem;
          opacity: 0.7;
          animation-duration: 15s;
        }
        
        /* Position snowflakes across the screen */
        .snowflake:nth-child(1) { left: 5%; animation-delay: 0s; }
        .snowflake:nth-child(2) { left: 15%; animation-delay: 1s; }
        .snowflake:nth-child(3) { left: 25%; animation-delay: 2s; }
        .snowflake:nth-child(4) { left: 35%; animation-delay: 0.5s; }
        .snowflake:nth-child(5) { left: 45%; animation-delay: 1.5s; }
        .snowflake:nth-child(6) { left: 55%; animation-delay: 2.5s; }
        .snowflake:nth-child(7) { left: 65%; animation-delay: 0.8s; }
        .snowflake:nth-child(8) { left: 75%; animation-delay: 1.8s; }
        .snowflake:nth-child(9) { left: 85%; animation-delay: 2.8s; }
        .snowflake:nth-child(10) { left: 95%; animation-delay: 0.3s; }
        .snowflake:nth-child(11) { left: 10%; animation-delay: 3s; }
        .snowflake:nth-child(12) { left: 20%; animation-delay: 1.2s; }
        .snowflake:nth-child(13) { left: 30%; animation-delay: 2.2s; }
        .snowflake:nth-child(14) { left: 40%; animation-delay: 0.7s; }
        .snowflake:nth-child(15) { left: 50%; animation-delay: 1.7s; }
        .snowflake:nth-child(16) { left: 60%; animation-delay: 2.7s; }
        .snowflake:nth-child(17) { left: 70%; animation-delay: 0.4s; }
        .snowflake:nth-child(18) { left: 80%; animation-delay: 1.4s; }
        .snowflake:nth-child(19) { left: 90%; animation-delay: 2.4s; }
        .snowflake:nth-child(20) { left: 12%; animation-delay: 3.2s; }
        .snowflake:nth-child(21) { left: 22%; animation-delay: 0.6s; }
        .snowflake:nth-child(22) { left: 32%; animation-delay: 1.6s; }
        .snowflake:nth-child(23) { left: 42%; animation-delay: 2.6s; }
        .snowflake:nth-child(24) { left: 52%; animation-delay: 0.9s; }
        .snowflake:nth-child(25) { left: 62%; animation-delay: 1.9s; }
        .snowflake:nth-child(26) { left: 72%; animation-delay: 2.9s; }
        .snowflake:nth-child(27) { left: 82%; animation-delay: 0.2s; }
        .snowflake:nth-child(28) { left: 92%; animation-delay: 1.2s; }
        .snowflake:nth-child(29) { left: 8%; animation-delay: 2.2s; }
        .snowflake:nth-child(30) { left: 18%; animation-delay: 3.3s; }
        
        .container { 
          text-align: center; 
          background: linear-gradient(180deg, #1a2332 0%, #0f1a28 50%, #0a1419 100%);
          padding: 20px 30px;
          border-radius: 20px;
          border: 6px solid #dc2626;
          box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.6),
            0 0 60px rgba(22, 163, 74, 0.4),
            inset 0 0 100px rgba(251, 191, 36, 0.1),
            0 0 100px rgba(220, 38, 38, 0.3);
          position: relative;
          margin: 20px auto;
          max-width: 1200px;
          animation: christmasPulse 4s ease-in-out infinite;
          min-height: auto;
        }
        
        @keyframes christmasPulse {
          0%, 100% {
            box-shadow: 
              0 0 30px rgba(220, 38, 38, 0.6),
              0 0 60px rgba(22, 163, 74, 0.4),
              inset 0 0 100px rgba(251, 191, 36, 0.1);
          }
          50% {
            box-shadow: 
              0 0 50px rgba(220, 38, 38, 0.8),
              0 0 80px rgba(22, 163, 74, 0.6),
              inset 0 0 120px rgba(251, 191, 36, 0.15);
          }
        }
        
        /* Christmas Tree Logo */
        .shield-logo {
          width: 200px;
          height: 200px;
          margin: 0 auto 15px auto;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(180deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
          border-radius: 50%;
          border: 6px solid #fbbf24;
          box-shadow: 
            0 0 40px rgba(220, 38, 38, 0.8),
            0 0 80px rgba(22, 163, 74, 0.6),
            inset 0 0 60px rgba(251, 191, 36, 0.3);
          animation: treeGlow 3s ease-in-out infinite;
        }
        
        @keyframes treeGlow {
          0%, 100% {
            transform: translateX(-50%) scale(1) rotate(-2deg);
            box-shadow: 
              0 0 40px rgba(220, 38, 38, 0.8),
              0 0 80px rgba(22, 163, 74, 0.6),
              inset 0 0 60px rgba(251, 191, 36, 0.3);
          }
          50% {
            transform: translateX(-50%) scale(1.05) rotate(2deg);
            box-shadow: 
              0 0 60px rgba(220, 38, 38, 1),
              0 0 100px rgba(22, 163, 74, 0.8),
              inset 0 0 80px rgba(251, 191, 36, 0.4);
          }
        }
        
        .shield-logo::before {
          content: '🎄';
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 3rem;
          filter: drop-shadow(0 0 10px #fbbf24);
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
          font-family: 'Mountains of Christmas', cursive;
          text-transform: uppercase;
          color: #fbbf24;
          text-align: center;
        }
        
        .shield-text-middle {
          font-size: 2.2rem;
          letter-spacing: 4px;
          font-family: 'Bungee Shade', cursive;
          margin: 8px 0;
          text-transform: uppercase;
          line-height: 1;
          color: #ffffff;
          text-shadow: 0 0 30px rgba(251, 191, 36, 1);
          text-align: center;
        }
        
        .shield-text-bottom {
          font-size: 1.1rem;
          letter-spacing: 4px;
          font-family: 'Fredoka One', cursive;
          text-transform: uppercase;
          margin-top: 5px;
          color: #16a34a;
          text-align: center;
        }
        
        .main-title {
          font-family: 'Bungee Shade', cursive;
          font-size: 2.5rem;
          font-weight: 900;
          color: #dc2626;
          margin-bottom: 10px;
          letter-spacing: 6px;
          text-transform: uppercase;
          text-shadow: 
            0 0 20px rgba(220, 38, 38, 0.8),
            0 0 40px rgba(22, 163, 74, 0.6),
            3px 3px 6px rgba(0, 0, 0, 0.8);
          animation: twinkle 3s ease-in-out infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(22, 163, 74, 0.6), 3px 3px 6px rgba(0, 0, 0, 0.8); }
          50% { opacity: 0.95; text-shadow: 0 0 30px rgba(220, 38, 38, 1), 0 0 60px rgba(22, 163, 74, 0.8), 3px 3px 6px rgba(0, 0, 0, 0.8); }
        }
        
        .subtitle {
          font-size: 1.1rem;
          color: #16a34a;
          margin-bottom: 15px;
          font-style: italic;
          font-weight: 600;
          font-family: 'Mountains of Christmas', cursive;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }
        
        .status { 
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: #ffffff; 
          padding: 10px 25px; 
          border-radius: 15px;
          display: inline-block;
          margin: 15px 0;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
          box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.8),
            0 0 60px rgba(22, 163, 74, 0.4);
          border: 3px solid #fbbf24;
          font-family: 'Fredoka One', cursive;
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
          background: linear-gradient(90deg, transparent 0%, #dc2626 20%, #16a34a 50%, #dc2626 80%, transparent 100%);
          margin: 15px auto;
          position: relative;
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.6);
        }
        
        .divider::before,
        .divider::after {
          content: '⭐';
          position: absolute;
          font-size: 1.5rem;
          top: -15px;
          animation: starTwinkle 2s ease-in-out infinite;
        }
        
        @keyframes starTwinkle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-5px) scale(1.2); opacity: 0.8; }
        }
        
        .divider::before { left: -20px; }
        .divider::after { right: -20px; }
        
        .info { 
          margin: 15px 0; 
          background: linear-gradient(135deg, #1a2332 0%, #0f1a28 100%);
          padding: 15px;
          border-radius: 15px;
          border: 3px solid #dc2626;
          box-shadow: 
            0 0 20px rgba(220, 38, 38, 0.4),
            inset 0 0 30px rgba(251, 191, 36, 0.1);
        }
        
        .info h3 {
          color: #dc2626;
          font-size: 1.3rem;
          margin-bottom: 10px;
          font-family: 'Mountains of Christmas', cursive;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 0 15px rgba(251, 191, 36, 0.8);
        }
        
        .info p {
          margin: 8px 0;
          font-size: 0.95rem;
          color: #16a34a;
          line-height: 1.5;
          font-family: 'Mountains of Christmas', cursive;
          font-weight: 500;
        }
        
        
        .command-button {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: #ffffff;
          border: 2px solid #fbbf24;
          padding: 10px 20px;
          border-radius: 12px;
          font-family: 'Fredoka One', cursive;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          margin: 5px;
          box-shadow: 
            0 0 20px rgba(220, 38, 38, 0.6),
            0 0 40px rgba(22, 163, 74, 0.4);
          transition: all 0.3s ease;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
        }
        
        .command-button:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.8),
            0 0 60px rgba(22, 163, 74, 0.6);
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        
        .command-button:active {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 0 25px rgba(220, 38, 38, 0.7),
            0 0 50px rgba(22, 163, 74, 0.5);
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #1a2332 0%, #0f1a28 100%);
          padding: 15px;
          border-radius: 15px;
          border: 3px solid #dc2626;
          text-align: center;
          box-shadow: 
            0 0 20px rgba(220, 38, 38, 0.5),
            inset 0 0 30px rgba(251, 191, 36, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '🎁';
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 1.5rem;
          opacity: 0.3;
          animation: giftFloat 3s ease-in-out infinite;
        }
        
        @keyframes giftFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-10px) rotate(10deg); opacity: 0.5; }
        }
        
        .stat-card:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 
            0 0 40px rgba(220, 38, 38, 0.7),
            inset 0 0 50px rgba(251, 191, 36, 0.15);
        }
        
        .stat-value {
          font-size: 2rem;
          color: #dc2626;
          font-weight: 900;
          font-family: 'Bungee Shade', cursive;
          margin-bottom: 5px;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
        }
        
        .stat-label {
          color: #16a34a;
          font-size: 0.9rem;
          margin-top: 5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: 'Mountains of Christmas', cursive;
        }
        
        /* Christmas Ornaments */
        .corner-ornament {
          position: absolute;
          width: 60px;
          height: 60px;
          opacity: 0.5;
          pointer-events: none;
        }
        
        .corner-ornament::before {
          content: '🎄';
          font-size: 3rem;
          position: absolute;
          animation: ornamentSway 4s ease-in-out infinite;
        }
        
        @keyframes ornamentSway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
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
        
        /* Floating Stars */
        .red-star {
          position: fixed;
          font-size: 2.5rem;
          opacity: 0.4;
          animation: starFloat 8s ease-in-out infinite;
          pointer-events: none;
          filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.8));
        }
        
        @keyframes starFloat {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-30px) translateX(20px) rotate(180deg);
            opacity: 0.7;
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
          color: #dc2626;
          text-decoration: none;
          font-family: 'Fredoka One', cursive;
          font-size: 1.2rem;
          padding: 16px 32px;
          border: 3px solid #dc2626;
          border-radius: 15px;
          background: linear-gradient(135deg, #1a2332 0%, #0f1a28 100%);
          transition: all 0.3s ease;
          box-shadow: 
            0 0 20px rgba(220, 38, 38, 0.5),
            inset 0 0 20px rgba(251, 191, 36, 0.1);
          font-weight: 600;
          letter-spacing: 2px;
        }
        
        .twitter-link:hover {
          color: #ffffff;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.8),
            inset 0 0 30px rgba(251, 191, 36, 0.2);
          transform: translateY(-3px);
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
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
          background: linear-gradient(135deg, #1a2332 0%, #0f1a28 100%);
          margin: 5% auto;
          padding: 40px;
          border: 5px solid #dc2626;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          position: relative;
          box-shadow: 
            0 0 40px rgba(220, 38, 38, 0.8),
            0 0 80px rgba(22, 163, 74, 0.4);
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
          color: #dc2626;
          float: right;
          font-size: 36px;
          font-weight: bold;
          cursor: pointer;
          position: absolute;
          top: 15px;
          right: 25px;
          line-height: 1;
          text-shadow: 0 0 15px rgba(251, 191, 36, 0.8);
          transition: all 0.3s ease;
        }
        
        .close:hover {
          color: #fbbf24;
          transform: rotate(90deg) scale(1.2);
          text-shadow: 0 0 25px rgba(251, 191, 36, 1);
        }
        
        .modal h2 {
          color: #dc2626;
          text-align: center;
          margin-bottom: 30px;
          font-size: 2.5rem;
          font-family: 'Bungee Shade', cursive;
          font-weight: 700;
          letter-spacing: 4px;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          color: #dc2626;
          margin-bottom: 8px;
          font-weight: 700;
          font-family: 'Mountains of Christmas', cursive;
          font-size: 1.1rem;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #dc2626;
          border-radius: 10px;
          background: #0a1419;
          color: #16a34a;
          font-family: 'Mountains of Christmas', cursive;
          font-size: 1.05rem;
          box-shadow: 
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 15px rgba(220, 38, 38, 0.2);
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #fbbf24;
          box-shadow: 
            inset 0 2px 10px rgba(0, 0, 0, 0.5),
            0 0 25px rgba(251, 191, 36, 0.6);
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
          background: linear-gradient(135deg, #1a2332 0%, #0f1a28 100%);
          border: 3px solid #dc2626;
          border-radius: 15px;
          box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.6),
            inset 0 0 50px rgba(251, 191, 36, 0.1);
          position: relative;
        }
        
        .countdown-section::before {
          content: '🎄';
          position: absolute;
          top: 15px;
          left: 15px;
          font-size: 2rem;
          animation: treeSway 2s ease-in-out infinite;
        }
        
        @keyframes treeSway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        
        .countdown-title {
          color: #dc2626;
          font-size: 1.2rem;
          margin-bottom: 10px;
          font-family: 'Fredoka One', cursive;
          font-weight: 700;
          letter-spacing: 2px;
          text-shadow: 0 0 15px rgba(251, 191, 36, 0.8);
        }
        
        .countdown-timer {
          font-size: 2.5rem;
          font-weight: 900;
          color: #dc2626;
          font-family: 'Bungee Shade', cursive;
          letter-spacing: 8px;
          text-shadow: 
            0 0 30px rgba(220, 38, 38, 1),
            0 0 60px rgba(22, 163, 74, 0.6);
          animation: timerPulse 1s ease-in-out infinite;
        }
        
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .countdown-status {
          margin-top: 10px;
          font-size: 0.95rem;
          color: #16a34a;
          font-weight: 600;
          font-family: 'Mountains of Christmas', cursive;
        }
      </style>
    </head>
    <body>
      <!-- Christmas Snowy Background -->
      <div class="paper-bg"></div>
      <div class="texture-overlay"></div>
      
      <!-- Falling Snowflakes -->
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      <div class="snowflake snowflake-tiny">❄</div>
      <div class="snowflake snowflake-large">❄</div>
      <div class="snowflake snowflake-medium">❄</div>
      <div class="snowflake snowflake-small">❄</div>
      
      <!-- Floating Stars -->
      <div class="red-star">⭐</div>
      <div class="red-star">🎄</div>
      <div class="red-star">🎁</div>
      <div class="red-star">⭐</div>
      
      <div class="container">
        <!-- Christmas Corner Ornaments -->
        <div class="corner-ornament top-left"></div>
        <div class="corner-ornament top-right"></div>
        <div class="corner-ornament bottom-left"></div>
        <div class="corner-ornament bottom-right"></div>
        
        <!-- Christmas Tree Logo -->
        <div class="shield-logo">
          <div class="shield-text">
            <div class="shield-text-top">🎄 THE 🎄</div>
            <div class="shield-text-middle">402XMAS</div>
            <div class="shield-text-bottom">⭐ PORTAL ⭐</div>
          </div>
        </div>
        
        <h1 class="main-title">🎄 402XMAS 🎄</h1>
        <p class="subtitle">Where Tokens Get the Christmas Treatment on the Blockchain...</p>
        
        <div class="divider"></div>
        
        <div class="status">🎄 INCINERATOR ACTIVE 🎄</div>
        
        <div class="divider"></div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">🎁</div>
            <div class="stat-label">Gifted</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="burnedCount">0</div>
            <div class="stat-label">Tokens Burned</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="rewardsCount">0</div>
            <div class="stat-label">Rewards Collected</div>
          </div>
        </div>
        
        <!-- Countdown Timer Section -->
        <div class="countdown-section">
          <div class="countdown-title">🎄 Next Buy Scheduled:</div>
          <div class="countdown-timer" id="countdownTimer">--:--</div>
          <div class="countdown-status" id="countdownStatus">Waiting for Christmas magic...</div>
        </div>
        
        <div class="info">
          <h3>🎅 Christmas Services:</h3>
          <p>• 🔥 Automated Token Burning</p>
          <p>• 🎁 Token Gift Operations</p>
          <p>• ⭐ Reward Collection via Pump.fun</p>
          <p>• 🎄 Real-time Christmas Dashboard</p>
        </div>
        
        <div class="divider"></div>
        
        <button class="command-button" onclick="simulateBurn()">🔥 Burn Token</button>
        <button class="command-button" onclick="simulateRewards()">⭐ Collect Rewards</button>
        <button class="command-button" onclick="startAutoBuy()">🎄 Start Auto-Buy</button>
        <button class="command-button" onclick="stopAutoBuy()">❄️ Stop Auto-Buy</button>
        <button class="command-button" onclick="showCreateTokenForm()">🎁 Create Token</button>
        
        <!-- Token Creation Form Modal -->
        <div id="tokenFormModal" class="modal" style="display: none;">
          <div class="modal-content">
            <span class="close" onclick="hideCreateTokenForm()">&times;</span>
            <h2>🎁 Create New Token</h2>
            <form id="createTokenForm">
              <div class="form-group">
                <label for="tokenName">🎄 Token Name:</label>
                <input type="text" id="tokenName" name="name" required placeholder="e.g., Christmas Coin">
              </div>
              <div class="form-group">
                <label for="tokenSymbol">⭐ Token Symbol:</label>
                <input type="text" id="tokenSymbol" name="symbol" required placeholder="e.g., XMAS" maxlength="10">
              </div>
              <div class="form-group">
                <label for="tokenDescription">🎅 Description:</label>
                <textarea id="tokenDescription" name="description" required placeholder="Describe your Christmas token..."></textarea>
              </div>
              <div class="form-group">
                <label for="twitter">🐦 Twitter URL (optional):</label>
                <input type="url" id="twitter" name="twitter" placeholder="https://x.com/yourusername">
              </div>
              <div class="form-group">
                <label for="telegram">💬 Telegram URL (optional):</label>
                <input type="url" id="telegram" name="telegram" placeholder="https://t.me/yourchannel">
              </div>
              <div class="form-group">
                <label for="website">🌐 Website URL (optional):</label>
                <input type="url" id="website" name="website" placeholder="https://yourwebsite.com">
              </div>
              <div class="form-group">
                <label for="devBuyAmount">🎁 Initial Buy (SOL):</label>
                <input type="number" id="devBuyAmount" name="devBuyAmount" value="1" min="0.1" max="10" step="0.1">
              </div>
              <div class="form-buttons">
                <button type="button" class="command-button" onclick="hideCreateTokenForm()">Cancel</button>
                <button type="submit" class="command-button">🎄 Create</button>
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
            <span>🎄 Join the Community 🎁</span>
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
            statusElement.textContent = 'Waiting for Christmas magic...';
            return;
          }
          
          const now = Date.now();
          const timeLeft = Math.max(0, nextBuyTime - now);
          
          if (timeLeft === 0) {
            timerElement.textContent = '00:00';
            statusElement.textContent = 'Executing Christmas buy...';
            // Reset next buy time after a short delay
            setTimeout(checkAutoBuyStatus, 2000);
            return;
          }
          
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          
          timerElement.textContent = \`\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
          statusElement.textContent = \`Auto-buy is active and ready for Christmas...\`;
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
              alert('🔥 Token Burned Successfully!\\n\\nTransaction: ' + (data.txSignature || 'Pending') + '\\n\\n🎄 Another token burned by 402XMAS! Merry Christmas! 🎁');
            } else {
              alert('❌ Burn Failed: ' + data.error + '\\n\\nThe transaction could not be completed!');
            }
          } catch (error) {
            alert('❌ Error: ' + error.message + '\\n\\n🎄 Something went wrong!');
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
              alert('⭐ Rewards Collected!\\n\\nTransaction: ' + (data.txSignature || 'Pending') + '\\n\\n🎄 Merry Christmas! Your rewards have been collected! 🎁');
            } else {
              alert('❌ Collection Failed: ' + data.error + '\\n\\nRewards could not be collected this time!');
            }
          } catch (error) {
            alert('❌ Error: ' + error.message + '\\n\\n🎄 Something went wrong!');
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
              alert('🎄 Auto-Buy Started!\\n\\n' + data.message + '\\n\\n⭐ 402XMAS portal is now ACTIVE! Merry Christmas! 🎁');
              // Update countdown timer
              setTimeout(checkAutoBuyStatus, 500);
            } else {
              alert('❌ Start Failed: ' + data.message + '\\n\\nAuto-buy could not be started!');
            }
          } catch (error) {
            alert('❌ Error: ' + error.message + '\\n\\n🎄 Something went wrong!');
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
              alert('❄️ Auto-Buy Stopped!\\n\\n' + data.message + '\\n\\n🎄 402XMAS auto-buy has been paused.');
              // Stop countdown timer
              stopCountdown();
            } else {
              alert('❌ Stop Failed: ' + data.message + '\\n\\nAuto-buy could not be stopped!');
            }
          } catch (error) {
            alert('❌ Error: ' + error.message + '\\n\\n🎄 Something went wrong!');
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
              alert('🎄 Token Created Successfully!\\n\\n' +
                    '🎁 Name: ' + data.data.tokenName + '\\n' +
                    '⭐ Symbol: ' + data.data.tokenSymbol + '\\n' +
                    '🔥 Transaction: ' + data.data.txSignature + '\\n\\n' +
                    '🌐 View on Solscan: ' + data.data.solscanUrl + '\\n\\n' +
                    '🎄 Your token has been created! 402XMAS welcomes another Christmas token! 🎁');
              
              hideCreateTokenForm();
              e.target.reset(); // Reset form
            } else {
              alert('❌ Creation Failed: ' + data.error + '\\n\\nThe token could not be created!');
            }
          } catch (error) {
            alert('❌ Error: ' + error.message + '\\n\\n🎄 Failed to create the token!');
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

// Complete Portal route (x402 Payments for Machines) - Now serves as main route
app.get('/complete-portal', (req: Request, res: Response) => {
  const portalPath = path.join(process.cwd(), 'COMPLETE-PORTAL-CODE.html');
  res.sendFile(portalPath);
});

// Monetization dashboard route
app.get('/monetization-dashboard', (req: Request, res: Response) => {
  const dashboardPath = path.join(process.cwd(), 'public', 'monetization-dashboard.html');
  res.sendFile(dashboardPath);
});

// X402 client example route
app.get('/x402-client-example', (req: Request, res: Response) => {
  const clientPath = path.join(process.cwd(), 'public', 'x402-client-example.html');
  res.sendFile(clientPath);
});

// Static file serving - MUST be AFTER the main route to avoid conflicts
app.use(express.static('public'));

// Export app for serverless platforms (Vercel, etc.)
module.exports = app;

// Only start HTTP server if not in serverless environment
if (!process.env.VERCEL && !process.env.NETLIFY) {
  // Start server with proper error handling
  const server = app.listen(port, host, () => {
    logger.info(`✅ Server running at http://${host}:${port}`);
    logger.info('🎄 402XMAS Portal is OPEN! Merry Christmas! 🎁');
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
