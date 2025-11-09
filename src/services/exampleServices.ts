import { Request, Response } from 'express';
import { getMonetizationAgent } from './monetizationAgent';
import { ServiceType } from './monetizationAgent';

/**
 * Example service implementations for different monetization models
 */

// Example: Pay-per-request API service
export function createApiServiceExample() {
  const agent = getMonetizationAgent();
  
  // Register API service
  agent.registerService({
    id: 'api-data-query',
    name: 'Data Query API',
    type: ServiceType.API,
    price: '0.10', // 10 cents per API call
    network: 'base-sepolia',
    payTo: process.env.PAYMENT_WALLET || process.env.SOLANA_PUBLIC_KEY?.replace(/^[A-Za-z0-9]+/, '0x') || '0x0000000000000000000000000000000000000000',
    description: 'Access to premium data query API',
    enabled: true,
    metadata: {
      rateLimit: '100 requests/hour',
      features: ['real-time data', 'historical data', 'analytics']
    }
  });

  return {
    // Example API endpoint handler (protected by x402 middleware)
    handleApiRequest: async (req: Request, res: Response): Promise<void> => {
      // This would be called after payment middleware verifies payment
      const { query } = req.body;
      
      // Simulate API processing
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
  };
}

// Example: Digital content service
export function createContentServiceExample() {
  const agent = getMonetizationAgent();
  
  // Register content service
  agent.registerService({
    id: 'premium-article',
    name: 'Premium Article Access',
    type: ServiceType.CONTENT,
    price: '0.05', // 5 cents per article
    network: 'base-sepolia',
    payTo: process.env.PAYMENT_WALLET || process.env.SOLANA_PUBLIC_KEY?.replace(/^[A-Za-z0-9]+/, '0x') || '0x0000000000000000000000000000000000000000',
    description: 'Access to premium article content',
    enabled: true,
    metadata: {
      contentType: 'article',
      format: 'markdown',
      includeMedia: true
    }
  });

  return {
    handleContentRequest: async (req: Request, res: Response): Promise<void> => {
      const { articleId } = req.params;
      
      // Simulate content delivery
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
  };
}

// Example: Microservice tool
export function createMicroserviceExample() {
  const agent = getMonetizationAgent();
  
  // Register file converter service
  agent.registerService({
    id: 'file-converter',
    name: 'File Format Converter',
    type: ServiceType.MICROSERVICE,
    price: '0.25', // 25 cents per conversion
    network: 'base-sepolia',
    payTo: process.env.PAYMENT_WALLET || process.env.SOLANA_PUBLIC_KEY?.replace(/^[A-Za-z0-9]+/, '0x') || '0x0000000000000000000000000000000000000000',
    description: 'Convert files between different formats',
    enabled: true,
    metadata: {
      supportedFormats: ['pdf', 'docx', 'txt', 'html'],
      maxFileSize: '10MB'
    }
  });

  return {
    handleFileConversion: async (req: Request, res: Response): Promise<void> => {
      const { file, fromFormat, toFormat } = req.body;
      
      // Simulate file conversion
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
  };
}

// Example: AI Agent service
export function createAIAgentServiceExample() {
  const agent = getMonetizationAgent();
  
  // Register AI agent service
  agent.registerService({
    id: 'ai-agent-process',
    name: 'AI Agent Processing',
    type: ServiceType.AI_AGENT,
    price: '0.50', // 50 cents per processing task
    network: 'base-sepolia',
    payTo: process.env.PAYMENT_WALLET || process.env.SOLANA_PUBLIC_KEY?.replace(/^[A-Za-z0-9]+/, '0x') || '0x0000000000000000000000000000000000000000',
    description: 'AI agent processing and task execution',
    enabled: true,
    metadata: {
      model: 'gpt-4',
      maxTokens: 4000,
      features: ['text generation', 'analysis', 'summarization']
    }
  });

  return {
    handleAIRequest: async (req: Request, res: Response): Promise<void> => {
      const { prompt, task } = req.body;
      
      // Simulate AI processing
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
  };
}

// Example: IoT device service
export function createIoTServiceExample() {
  const agent = getMonetizationAgent();
  
  // Register IoT device service
  agent.registerService({
    id: 'iot-device-access',
    name: 'IoT Device Data Access',
    type: ServiceType.IOT,
    price: '0.02', // 2 cents per data access
    network: 'base-sepolia',
    payTo: process.env.PAYMENT_WALLET || process.env.SOLANA_PUBLIC_KEY?.replace(/^[A-Za-z0-9]+/, '0x') || '0x0000000000000000000000000000000000000000',
    description: 'Access IoT device data and control',
    enabled: true,
    metadata: {
      deviceTypes: ['sensor', 'actuator', 'gateway'],
      dataTypes: ['temperature', 'humidity', 'pressure', 'motion']
    }
  });

  return {
    handleIoTRequest: async (req: Request, res: Response): Promise<void> => {
      const { deviceId, action } = req.body;
      
      // Simulate IoT device interaction
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
  };
}

// Initialize all example services
export function initializeExampleServices() {
  createApiServiceExample();
  createContentServiceExample();
  createMicroserviceExample();
  createAIAgentServiceExample();
  createIoTServiceExample();
  
  console.log('✅ Example services initialized');
}

