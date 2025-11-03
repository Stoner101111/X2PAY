import { createPumpApiService } from './pumpApi';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPumpApi() {
  console.log('🧪 Testing Pump.fun API Integration...\n');

  // Check if API key is configured
  if (!process.env.PUMP_API_KEY) {
    console.error('❌ PUMP_API_KEY not found in environment variables');
    console.log('Please add PUMP_API_KEY to your .env file');
    return;
  }

  const pumpApi = createPumpApiService(
    process.env.PUMP_API_KEY!,
    process.env.SOLANA_PUBLIC_KEY!,
    process.env.SOLANA_PRIVATE_KEY!,
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  );

  try {
    // Test collecting all creator fees (pump.fun)
    console.log('📊 Testing pump.fun creator fee collection...');
    const result = await pumpApi.collectCreatorFee(0.000001);
    
    if (result.success) {
      console.log('✅ Pump.fun API call successful!');
      console.log('Transaction Signature:', result.txSignature);
    } else {
      console.log('❌ Pump.fun API call failed:', result.error);
    }

  } catch (error: any) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testPumpApi();
