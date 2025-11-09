import { Request, Response, NextFunction } from 'express';
import { X402Service, createX402Service } from './x402Service';
import { PaymentPayload, PaymentRequirements } from '../types/x402';
import crypto from 'crypto';

// Service types for different monetization models
export enum ServiceType {
  API = 'api',
  CONTENT = 'content',
  MICROSERVICE = 'microservice',
  IOT = 'iot',
  AI_AGENT = 'ai_agent'
}

export interface ServiceConfig {
  id: string;
  name: string;
  type: ServiceType;
  price: string; // USDC amount
  network: string;
  payTo: string;
  description?: string;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  serviceId: string;
  paymentPayload: PaymentPayload;
  requirements: PaymentRequirements;
  transactionHash?: string;
  payer?: string;
  amount: string;
  network: string;
  timestamp: number;
  status: 'pending' | 'verified' | 'settled' | 'failed';
}

export interface MonetizationStats {
  totalPayments: number;
  totalRevenue: string; // Total USDC collected
  successfulPayments: number;
  failedPayments: number;
  byService: Record<string, { count: number; revenue: string }>;
  byNetwork: Record<string, { count: number; revenue: string }>;
}

export class MonetizationAgent {
  private x402Service: X402Service;
  private services: Map<string, ServiceConfig>;
  private payments: Map<string, PaymentRecord>;
  private paymentNonces: Set<string>;

  constructor() {
    this.x402Service = createX402Service();
    this.services = new Map();
    this.payments = new Map();
    this.paymentNonces = new Set();
  }

  // Register a service for monetization
  registerService(config: ServiceConfig): void {
    this.services.set(config.id, config);
  }

  // Unregister a service
  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
  }

  // Get service configuration
  getService(serviceId: string): ServiceConfig | undefined {
    return this.services.get(serviceId);
  }

  // List all registered services
  listServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  // Generate payment requirements for a service
  generatePaymentRequirements(serviceId: string): PaymentRequirements {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    if (!service.enabled) {
      throw new Error(`Service ${serviceId} is disabled`);
    }

    return this.x402Service.buildPaymentRequirements(
      service.network,
      service.payTo,
      service.price,
      service.description || `Payment for ${service.name}`
    );
  }

  // Verify payment and record it
  async verifyAndRecordPayment(
    serviceId: string,
    paymentPayload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // Check for duplicate nonce
      const nonce = paymentPayload.payload.authorization.nonce;
      if (this.paymentNonces.has(nonce)) {
        return { success: false, error: 'Duplicate payment nonce detected' };
      }

      // Verify payment
      const isValid = await this.x402Service.verifyPayment(paymentPayload, requirements);
      if (!isValid) {
        return { success: false, error: 'Payment verification failed' };
      }

      // Record payment
      const paymentId = crypto.randomBytes(16).toString('hex');
      const paymentRecord: PaymentRecord = {
        id: paymentId,
        serviceId,
        paymentPayload,
        requirements,
        amount: requirements.maxAmountRequired,
        network: requirements.network,
        timestamp: Date.now(),
        status: 'verified',
        payer: paymentPayload.payload.authorization.from
      };

      this.payments.set(paymentId, paymentRecord);
      this.paymentNonces.add(nonce);

      return { success: true, paymentId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Settle payment (complete the transaction)
  async settlePayment(paymentId: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.status !== 'verified') {
      return { success: false, error: `Payment status is ${payment.status}, expected verified` };
    }

    try {
      const result = await this.x402Service.settlePayment(payment.paymentPayload, payment.requirements);
      
      if (result.success && result.transaction) {
        payment.status = 'settled';
        payment.transactionHash = result.transaction;
        payment.payer = result.payer;
        this.payments.set(paymentId, payment);
        
        return { success: true, transactionHash: result.transaction };
      } else {
        payment.status = 'failed';
        this.payments.set(paymentId, payment);
        return { success: false, error: result.error || 'Settlement failed' };
      }
    } catch (error: any) {
      payment.status = 'failed';
      this.payments.set(paymentId, payment);
      return { success: false, error: error.message };
    }
  }

  // Get payment record
  getPayment(paymentId: string): PaymentRecord | undefined {
    return this.payments.get(paymentId);
  }

  // Get all payments for a service
  getServicePayments(serviceId: string): PaymentRecord[] {
    return Array.from(this.payments.values()).filter(p => p.serviceId === serviceId);
  }

  // Get statistics
  getStats(): MonetizationStats {
    const stats: MonetizationStats = {
      totalPayments: this.payments.size,
      totalRevenue: '0',
      successfulPayments: 0,
      failedPayments: 0,
      byService: {},
      byNetwork: {}
    };

    let totalRevenue = 0;
    
    for (const payment of this.payments.values()) {
      const amount = parseFloat(payment.amount);
      
      if (payment.status === 'settled') {
        stats.successfulPayments++;
        totalRevenue += amount;
      } else if (payment.status === 'failed') {
        stats.failedPayments++;
      }

      // By service
      if (!stats.byService[payment.serviceId]) {
        stats.byService[payment.serviceId] = { count: 0, revenue: '0' };
      }
      stats.byService[payment.serviceId].count++;
      if (payment.status === 'settled') {
        const serviceRevenue = parseFloat(stats.byService[payment.serviceId].revenue) + amount;
        stats.byService[payment.serviceId].revenue = serviceRevenue.toFixed(2);
      }

      // By network
      if (!stats.byNetwork[payment.network]) {
        stats.byNetwork[payment.network] = { count: 0, revenue: '0' };
      }
      stats.byNetwork[payment.network].count++;
      if (payment.status === 'settled') {
        const networkRevenue = parseFloat(stats.byNetwork[payment.network].revenue) + amount;
        stats.byNetwork[payment.network].revenue = networkRevenue.toFixed(2);
      }
    }

    stats.totalRevenue = totalRevenue.toFixed(2);
    return stats;
  }

  // Express middleware for protecting endpoints with x402 payments
  createPaymentMiddleware(serviceId: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const service = this.getService(serviceId);
        if (!service) {
          res.status(404).json({ error: 'Service not found' });
          return;
        }

        if (!service.enabled) {
          res.status(503).json({ error: 'Service is disabled' });
          return;
        }

        // Check if payment payload is provided
        const paymentPayload = req.body.paymentPayload;
        if (!paymentPayload) {
          // Return 402 Payment Required with payment requirements
          const requirements = this.generatePaymentRequirements(serviceId);
          res.status(402).json({
            error: 'Payment Required',
            paymentRequired: true,
            requirements,
            service: {
              id: service.id,
              name: service.name,
              price: service.price,
              description: service.description
            }
          });
          return;
        }

        // Verify payment
        const requirements = this.generatePaymentRequirements(serviceId);
        const verification = await this.verifyAndRecordPayment(
          serviceId,
          paymentPayload as PaymentPayload,
          requirements
        );

        if (!verification.success) {
          res.status(402).json({
            error: 'Payment verification failed',
            reason: verification.error,
            paymentRequired: true,
            requirements
          });
          return;
        }

        // Attach payment info to request for use in the route handler
        (req as any).paymentId = verification.paymentId;
        (req as any).paymentVerified = true;

        // Settle payment (async, don't wait)
        if (verification.paymentId) {
          this.settlePayment(verification.paymentId).catch(err => {
            console.error(`Failed to settle payment ${verification.paymentId}:`, err);
          });
        }

        next();
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    };
  }
}

// Singleton instance
let monetizationAgentInstance: MonetizationAgent | null = null;

export function getMonetizationAgent(): MonetizationAgent {
  if (!monetizationAgentInstance) {
    monetizationAgentInstance = new MonetizationAgent();
  }
  return monetizationAgentInstance;
}

