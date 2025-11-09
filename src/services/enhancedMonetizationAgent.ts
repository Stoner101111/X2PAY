import { Request, Response, NextFunction } from 'express';
import { X402Service, createX402Service } from './x402Service';
import { PaymentPayload, PaymentRequirements } from '../types/x402';
import crypto from 'crypto';
import axios from 'axios';

// Service types for different monetization models
export enum ServiceType {
  API = 'api',
  CONTENT = 'content',
  MICROSERVICE = 'microservice',
  IOT = 'iot',
  AI_AGENT = 'ai_agent',
  CLOUD_SERVICE = 'cloud_service',
  STORAGE = 'storage',
  COMPUTE = 'compute'
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
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  webhookUrl?: string; // Optional webhook for payment notifications
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
  metadata?: Record<string, any>;
}

export interface MonetizationStats {
  totalPayments: number;
  totalRevenue: string; // Total USDC collected
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  byService: Record<string, { count: number; revenue: string }>;
  byNetwork: Record<string, { count: number; revenue: string }>;
  byType: Record<string, { count: number; revenue: string }>;
  hourlyRevenue: Array<{ hour: string; revenue: string; count: number }>;
  recentPayments: PaymentRecord[];
}

export interface RateLimitTracker {
  requests: number[];
  lastReset: number;
}

export class EnhancedMonetizationAgent {
  private x402Service: X402Service;
  private services: Map<string, ServiceConfig>;
  private payments: Map<string, PaymentRecord>;
  private paymentNonces: Set<string>;
  private rateLimiters: Map<string, RateLimitTracker>;
  private webhookCallbacks: Map<string, (payment: PaymentRecord) => Promise<void>>;

  constructor() {
    this.x402Service = createX402Service();
    this.services = new Map();
    this.payments = new Map();
    this.paymentNonces = new Set();
    this.rateLimiters = new Map();
    this.webhookCallbacks = new Map();
  }

  // Register a service for monetization
  registerService(config: ServiceConfig): void {
    this.services.set(config.id, config);
    
    // Initialize rate limiter for this service
    if (config.rateLimit) {
      this.rateLimiters.set(config.id, {
        requests: [],
        lastReset: Date.now()
      });
    }
    
    // Set up webhook callback if provided
    if (config.webhookUrl) {
      this.webhookCallbacks.set(config.id, async (payment: PaymentRecord) => {
        try {
          await axios.post(config.webhookUrl!, {
            event: 'payment.settled',
            payment: {
              id: payment.id,
              serviceId: payment.serviceId,
              amount: payment.amount,
              network: payment.network,
              transactionHash: payment.transactionHash,
              payer: payment.payer,
              timestamp: payment.timestamp
            }
          }, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error(`Webhook failed for service ${config.id}:`, error);
        }
      });
    }
  }

  // Unregister a service
  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
    this.rateLimiters.delete(serviceId);
    this.webhookCallbacks.delete(serviceId);
  }

  // Get service configuration
  getService(serviceId: string): ServiceConfig | undefined {
    return this.services.get(serviceId);
  }

  // List all registered services
  listServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  // Check rate limit for a service
  checkRateLimit(serviceId: string, clientId?: string): { allowed: boolean; resetIn?: number } {
    const service = this.services.get(serviceId);
    if (!service || !service.rateLimit) {
      return { allowed: true };
    }

    const limiter = this.rateLimiters.get(serviceId);
    if (!limiter) {
      return { allowed: true };
    }

    const now = Date.now();
    const requests = limiter.requests.filter(timestamp => {
      // Keep requests within relevant time windows
      return now - timestamp < 86400000; // 24 hours max
    });
    limiter.requests = requests;

    // Check per-minute limit
    if (service.rateLimit.requestsPerMinute) {
      const minuteRequests = requests.filter(t => now - t < 60000);
      if (minuteRequests.length >= service.rateLimit.requestsPerMinute) {
        const oldestRequest = Math.min(...minuteRequests);
        return { allowed: false, resetIn: 60000 - (now - oldestRequest) };
      }
    }

    // Check per-hour limit
    if (service.rateLimit.requestsPerHour) {
      const hourRequests = requests.filter(t => now - t < 3600000);
      if (hourRequests.length >= service.rateLimit.requestsPerHour) {
        const oldestRequest = Math.min(...hourRequests);
        return { allowed: false, resetIn: 3600000 - (now - oldestRequest) };
      }
    }

    // Check per-day limit
    if (service.rateLimit.requestsPerDay) {
      const dayRequests = requests.filter(t => now - t < 86400000);
      if (dayRequests.length >= service.rateLimit.requestsPerDay) {
        const oldestRequest = Math.min(...dayRequests);
        return { allowed: false, resetIn: 86400000 - (now - oldestRequest) };
      }
    }

    // Record this request
    requests.push(now);
    limiter.requests = requests;
    limiter.lastReset = now;

    return { allowed: true };
  }

  // Generate payment requirements for a service
  generatePaymentRequirements(serviceId: string, metadata?: Record<string, any>): PaymentRequirements {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    if (!service.enabled) {
      throw new Error(`Service ${serviceId} is disabled`);
    }

    let description = service.description || `Payment for ${service.name}`;
    if (metadata?.customDescription) {
      description = metadata.customDescription;
    }

    const requirements = this.x402Service.buildPaymentRequirements(
      service.network,
      service.payTo,
      service.price,
      description
    );

    // Add custom metadata to resource URL
    if (metadata) {
      const params = new URLSearchParams(metadata);
      requirements.resource = `${requirements.resource}?${params.toString()}`;
    }

    return requirements;
  }

  // Verify payment and record it
  async verifyAndRecordPayment(
    serviceId: string,
    paymentPayload: PaymentPayload,
    requirements: PaymentRequirements,
    metadata?: Record<string, any>
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
        payer: paymentPayload.payload.authorization.from,
        metadata
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
        
        // Trigger webhook if configured
        const webhookCallback = this.webhookCallbacks.get(payment.serviceId);
        if (webhookCallback) {
          webhookCallback(payment).catch(err => {
            console.error(`Webhook callback failed for payment ${paymentId}:`, err);
          });
        }
        
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
  getServicePayments(serviceId: string, limit?: number): PaymentRecord[] {
    const payments = Array.from(this.payments.values())
      .filter(p => p.serviceId === serviceId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? payments.slice(0, limit) : payments;
  }

  // Get payments by payer
  getPayerPayments(payer: string, limit?: number): PaymentRecord[] {
    const payments = Array.from(this.payments.values())
      .filter(p => p.payer === payer)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? payments.slice(0, limit) : payments;
  }

  // Get enhanced statistics
  getStats(includeRecentPayments: number = 10): MonetizationStats {
    const stats: MonetizationStats = {
      totalPayments: this.payments.size,
      totalRevenue: '0',
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0,
      byService: {},
      byNetwork: {},
      byType: {},
      hourlyRevenue: [],
      recentPayments: []
    };

    let totalRevenue = 0;
    const hourlyRevenueMap = new Map<string, { revenue: number; count: number }>();
    
    for (const payment of this.payments.values()) {
      const amount = parseFloat(payment.amount);
      const service = this.services.get(payment.serviceId);
      
      if (payment.status === 'settled') {
        stats.successfulPayments++;
        totalRevenue += amount;
      } else if (payment.status === 'failed') {
        stats.failedPayments++;
      } else if (payment.status === 'pending' || payment.status === 'verified') {
        stats.pendingPayments++;
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

      // By type
      if (service) {
        if (!stats.byType[service.type]) {
          stats.byType[service.type] = { count: 0, revenue: '0' };
        }
        stats.byType[service.type].count++;
        if (payment.status === 'settled') {
          const typeRevenue = parseFloat(stats.byType[service.type].revenue) + amount;
          stats.byType[service.type].revenue = typeRevenue.toFixed(2);
        }
      }

      // Hourly revenue tracking
      if (payment.status === 'settled') {
        const hour = new Date(payment.timestamp).toISOString().substring(0, 13) + ':00:00Z';
        if (!hourlyRevenueMap.has(hour)) {
          hourlyRevenueMap.set(hour, { revenue: 0, count: 0 });
        }
        const hourData = hourlyRevenueMap.get(hour)!;
        hourData.revenue += amount;
        hourData.count += 1;
      }
    }

    // Convert hourly revenue map to array
    stats.hourlyRevenue = Array.from(hourlyRevenueMap.entries())
      .map(([hour, data]) => ({
        hour,
        revenue: data.revenue.toFixed(2),
        count: data.count
      }))
      .sort((a, b) => b.hour.localeCompare(a.hour))
      .slice(0, 24); // Last 24 hours

    stats.totalRevenue = totalRevenue.toFixed(2);
    
    // Recent payments
    stats.recentPayments = Array.from(this.payments.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, includeRecentPayments);

    return stats;
  }

  // Express middleware for protecting endpoints with x402 payments
  createPaymentMiddleware(serviceId: string, options?: { requireRateLimit?: boolean; customMetadata?: (req: Request) => Record<string, any> }) {
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

        // Check rate limit if enabled
        if (options?.requireRateLimit !== false && service.rateLimit) {
          const clientId = req.ip || req.headers['x-client-id'] as string;
          const rateLimitCheck = this.checkRateLimit(serviceId, clientId);
          if (!rateLimitCheck.allowed) {
            res.status(429).json({
              error: 'Rate limit exceeded',
              resetIn: rateLimitCheck.resetIn,
              message: 'Too many requests. Please try again later.'
            });
            return;
          }
        }

        // Check if payment payload is provided
        const paymentPayload = req.body.paymentPayload;
        if (!paymentPayload) {
          // Return 402 Payment Required with payment requirements
          const customMetadata = options?.customMetadata ? options.customMetadata(req) : {};
          const requirements = this.generatePaymentRequirements(serviceId, customMetadata);
          res.status(402).json({
            error: 'Payment Required',
            paymentRequired: true,
            requirements,
            service: {
              id: service.id,
              name: service.name,
              price: service.price,
              description: service.description,
              type: service.type
            }
          });
          return;
        }

        // Verify payment
        const customMetadata = options?.customMetadata ? options.customMetadata(req) : {};
        const requirements = this.generatePaymentRequirements(serviceId, customMetadata);
        const verification = await this.verifyAndRecordPayment(
          serviceId,
          paymentPayload as PaymentPayload,
          requirements,
          customMetadata
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
        (req as any).paymentAmount = requirements.maxAmountRequired;
        (req as any).paymentNetwork = requirements.network;

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

  // Export payments data (for backup/analytics)
  exportPayments(serviceId?: string): PaymentRecord[] {
    if (serviceId) {
      return this.getServicePayments(serviceId);
    }
    return Array.from(this.payments.values());
  }

  // Clear old payment records (keep last N days)
  clearOldPayments(daysToKeep: number = 30): number {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    let cleared = 0;
    
    for (const [id, payment] of this.payments.entries()) {
      if (payment.timestamp < cutoffTime && payment.status === 'settled') {
        this.payments.delete(id);
        cleared++;
      }
    }
    
    return cleared;
  }
}

// Singleton instance
let enhancedMonetizationAgentInstance: EnhancedMonetizationAgent | null = null;

export function getEnhancedMonetizationAgent(): EnhancedMonetizationAgent {
  if (!enhancedMonetizationAgentInstance) {
    enhancedMonetizationAgentInstance = new EnhancedMonetizationAgent();
  }
  return enhancedMonetizationAgentInstance;
}

