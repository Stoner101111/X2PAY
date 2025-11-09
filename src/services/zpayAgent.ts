import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import bs58 from 'bs58';
import { Response, Request, Application } from 'express';

type PaymentStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'detected'
  | 'confirmed'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface CreateZPaySessionInput {
  amountZec: number;
  targetAction: 'transfer-sol' | 'transfer-token' | 'custom';
  solanaDestination: string;
  solanaAmount?: number;
  merchantId?: string;
  metadata?: Record<string, any>;
  memo?: string;
  expiresInMinutes?: number;
}

export interface PaymentEvent {
  type:
    | 'session.created'
    | 'payment.detected'
    | 'payment.confirmed'
    | 'solana.execution_started'
    | 'solana.execution_completed'
    | 'session.failed'
    | 'session.expired';
  timestamp: number;
  payload: Record<string, any>;
}

export interface PaymentSession {
  id: string;
  merchantId?: string;
  zcashAddress: string;
  amountZec: number;
  solanaDestination: string;
  solanaAmount?: number;
  targetAction: 'transfer-sol' | 'transfer-token' | 'custom';
  status: PaymentStatus;
  memo?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  detectionTxId?: string;
  confirmations?: number;
  confirmationsRequired: number;
  flashiftOrderId?: string;
  flashiftDepositAddress?: string;
  solanaTxSignature?: string;
  errorReason?: string;
  events: PaymentEvent[];
}

export interface ZPayAgentConfig {
  zcashRpcUrl?: string;
  zcashRpcUsername?: string;
  zcashRpcPassword?: string;
  flashiftApiKey?: string;
  flashiftBaseUrl?: string;
  flashiftProviderName?: string;
  solanaRpcUrl?: string;
  solanaCustodialKey?: string;
  upstashRedisUrl?: string;
  upstashRedisToken?: string;
  merchantWebhookUrl?: string;
  merchantWebhookSecret?: string;
  pollingIntervalMs?: number;
  confirmationsRequired?: number;
}

interface ZcashRpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: any[];
}

interface ZcashRpcResponse<T = any> {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
  id: string;
}

class ZPayAgent extends EventEmitter {
  private sessions: Map<string, PaymentSession>;
  private sseClients: Set<Response>;
  private config: ZPayAgentConfig;
  private poller: NodeJS.Timeout | null;
  private zcashClient: AxiosInstance | null;
  private upstashClient: AxiosInstance | null;

  constructor(config: ZPayAgentConfig) {
    super();
    this.config = {
      pollingIntervalMs: config.pollingIntervalMs ?? 15000,
      confirmationsRequired: config.confirmationsRequired ?? 3,
      ...config
    };
    this.sessions = new Map();
    this.sseClients = new Set();
    this.poller = null;
    this.zcashClient = config.zcashRpcUrl
      ? axios.create({
          baseURL: config.zcashRpcUrl,
          auth:
            config.zcashRpcUsername && config.zcashRpcPassword
              ? {
                  username: config.zcashRpcUsername,
                  password: config.zcashRpcPassword
                }
              : undefined,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      : null;
    this.upstashClient =
      config.upstashRedisUrl && config.upstashRedisToken
        ? axios.create({
            baseURL: config.upstashRedisUrl,
            headers: {
              Authorization: `Bearer ${config.upstashRedisToken}`,
              'Content-Type': 'application/json'
            }
          })
        : null;

    this.startPolling();
  }

  createSession(input: CreateZPaySessionInput): PaymentSession {
    const id = crypto.randomUUID();
    const address = this.generateZcashAddress();
    const now = Date.now();
    const confirmationsRequired = this.config.confirmationsRequired ?? 3;
    const expiresAt = input.expiresInMinutes
      ? now + input.expiresInMinutes * 60 * 1000
      : undefined;

    const session: PaymentSession = {
      id,
      merchantId: input.merchantId,
      zcashAddress: address,
      amountZec: input.amountZec,
      solanaDestination: input.solanaDestination,
      solanaAmount: input.solanaAmount,
      targetAction: input.targetAction,
      status: 'pending',
      memo: input.memo,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      confirmationsRequired,
      events: []
    };

    this.sessions.set(id, session);
    this.recordEvent(session.id, 'session.created', {
      zcashAddress: session.zcashAddress,
      amountZec: session.amountZec,
      solanaDestination: session.solanaDestination
    });
    this.persistSession(session).catch((error) => {
      this.emit('error', new Error(`Upstash persist failed: ${error.message}`));
    });
    this.broadcast('session.created', session);
    return session;
  }

  getSession(sessionId: string): PaymentSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(filter?: {
    merchantId?: string;
    status?: PaymentStatus;
    limit?: number;
  }): PaymentSession[] {
    let sessions = Array.from(this.sessions.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    if (filter?.merchantId) {
      sessions = sessions.filter((s) => s.merchantId === filter.merchantId);
    }
    if (filter?.status) {
      sessions = sessions.filter((s) => s.status === filter.status);
    }
    if (filter?.limit) {
      sessions = sessions.slice(0, filter.limit);
    }

    return sessions;
  }

  async markDetected(
    sessionId: string,
    detection: { txId: string; amountZec: number; confirmations: number }
  ): Promise<PaymentSession | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (session.status === 'completed' || session.status === 'failed') {
      return session;
    }

    session.status =
      detection.confirmations >= session.confirmationsRequired
        ? 'confirmed'
        : 'detected';
    session.detectionTxId = detection.txId;
    session.confirmations = detection.confirmations;
    session.updatedAt = Date.now();

    this.recordEvent(session.id, 'payment.detected', {
      txId: detection.txId,
      confirmations: detection.confirmations,
      amountZec: detection.amountZec
    });

    if (session.status === 'confirmed') {
      this.recordEvent(session.id, 'payment.confirmed', {
        txId: detection.txId,
        confirmations: detection.confirmations
      });
      await this.queueFlashiftExecution(session.id);
    }

    await this.persistSession(session);
    this.broadcast('session.updated', session);
    return session;
  }

  async queueFlashiftExecution(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (!this.config.flashiftApiKey || !this.config.flashiftBaseUrl) {
      this.emit(
        'warn',
        `Flashift config missing; session ${sessionId} remains confirmed without execution`
      );
      return;
    }

    if (session.status !== 'confirmed') return;

    session.status = 'executing';
    session.updatedAt = Date.now();
    this.recordEvent(session.id, 'solana.execution_started', {});
    this.broadcast('session.updated', session);

    try {
      const response = await axios.post(
        `${this.config.flashiftBaseUrl}/transactions`,
        {
          provider: this.config.flashiftProviderName || 'flashift',
          amount: session.solanaAmount ?? session.amountZec,
          depositNetwork: 'zcash',
          payoutNetwork: 'solana',
          depositAddress: session.zcashAddress,
          payoutAddress: session.solanaDestination,
          metadata: {
            sessionId: session.id,
            merchantId: session.merchantId,
            targetAction: session.targetAction,
            memo: session.memo
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.flashiftApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      session.flashiftOrderId = data?.id || data?.orderId;
      session.flashiftDepositAddress =
        data?.depositAddress || data?.deposit?.address;
      session.solanaTxSignature =
        data?.payoutTransactionHash || data?.settlement?.txSignature;
      session.status = 'completed';
      session.updatedAt = Date.now();

      this.recordEvent(session.id, 'solana.execution_completed', {
        flashiftOrderId: session.flashiftOrderId,
        solanaTxSignature: session.solanaTxSignature
      });

      await this.persistSession(session);
      this.broadcast('session.updated', session);
      await this.notifyMerchantWebhook(session);
    } catch (error: any) {
      session.status = 'failed';
      session.errorReason = error?.message || 'Flashift execution failed';
      session.updatedAt = Date.now();
      this.recordEvent(session.id, 'session.failed', {
        reason: session.errorReason
      });
      await this.persistSession(session);
      this.broadcast('session.updated', session);
      this.emit('error', error);
    }
  }

  async runSettlementCron(): Promise<{
    processed: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    const sessions = Array.from(this.sessions.values());
    let processed = 0;
    let completed = 0;
    let failed = 0;

    for (const session of sessions) {
      if (session.status === 'confirmed') {
        processed++;
        try {
          await this.queueFlashiftExecution(session.id);
          const updatedSession = this.sessions.get(session.id);
          if (updatedSession?.status === 'completed') {
            completed++;
          } else if (updatedSession?.status === 'failed') {
            failed++;
          }
        } catch (error) {
          failed++;
          this.emit('error', error);
        }
      }
    }

    const pending = sessions.filter((s) => s.status === 'pending').length;

    return { processed, pending, completed, failed };
  }

  registerSseClient(res: Response): void {
    this.sseClients.add(res);
  }

  unregisterSseClient(res: Response): void {
    this.sseClients.delete(res);
  }

  private startPolling(): void {
    if (this.poller) return;
    if (!this.zcashClient) return;
    this.poller = setInterval(
      () => this.pollZcashForPayments().catch((err) => this.emit('error', err)),
      this.config.pollingIntervalMs
    );
  }

  private async pollZcashForPayments(): Promise<void> {
    const now = Date.now();
    for (const session of Array.from(this.sessions.values())) {
      if (
        session.status === 'pending' ||
        session.status === 'detected' ||
        session.status === 'awaiting_confirmation'
      ) {
        if (session.expiresAt && session.expiresAt < now) {
          session.status = 'expired';
          session.updatedAt = now;
          this.recordEvent(session.id, 'session.expired', {
            reason: 'timeout'
          });
          await this.persistSession(session);
          this.broadcast('session.updated', session);
          continue;
        }

        if (this.zcashClient) {
          try {
            const received = await this.callZcashRpc<
              Array<{ txid: string; amount: number; confirmations: number }>
            >('z_listreceivedbyaddress', [session.zcashAddress, 0]);

            const match = received?.find(
              (entry) => entry.amount >= session.amountZec
            );

            if (match) {
              await this.markDetected(session.id, {
                txId: match.txid,
                amountZec: match.amount,
                confirmations: match.confirmations
              });
            }
          } catch (error) {
            this.emit('error', error);
          }
        }
      }
    }
  }

  private async callZcashRpc<T>(method: string, params: any[]): Promise<T> {
    if (!this.zcashClient) {
      throw new Error('Zcash RPC client not configured');
    }

    const payload: ZcashRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method,
      params
    };

    const { data } = await this.zcashClient.post<ZcashRpcResponse<T>>(
      '',
      payload
    );

    if (data.error) {
      throw new Error(`Zcash RPC error: ${data.error.message}`);
    }

    return data.result as T;
  }

  private recordEvent(
    sessionId: string,
    type: PaymentEvent['type'],
    payload: Record<string, any>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const event: PaymentEvent = {
      type,
      timestamp: Date.now(),
      payload
    };

    session.events.push(event);
    session.updatedAt = event.timestamp;
  }

  private broadcast(event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      client.write(payload);
    }
  }

  private async persistSession(session: PaymentSession): Promise<void> {
    if (!this.upstashClient) return;
    try {
      await this.upstashClient.post('', {
        command: ['SET', `zpay:session:${session.id}`, JSON.stringify(session)]
      });
    } catch (error: any) {
      this.emit('error', new Error(`Upstash persist error: ${error.message}`));
    }
  }

  private async notifyMerchantWebhook(session: PaymentSession): Promise<void> {
    if (!this.config.merchantWebhookUrl) return;
    try {
      await axios.post(
        this.config.merchantWebhookUrl,
        {
          event: 'session.completed',
          session: {
            id: session.id,
            merchantId: session.merchantId,
            zcashAddress: session.zcashAddress,
            amountZec: session.amountZec,
            solanaDestination: session.solanaDestination,
            solanaTxSignature: session.solanaTxSignature,
            flashiftOrderId: session.flashiftOrderId,
            status: session.status,
            metadata: session.metadata
          },
          signature: this.config.merchantWebhookSecret
            ? this.createWebhookSignature(session)
            : undefined
        },
        { timeout: 5000 }
      );
    } catch (error) {
      this.emit('error', error);
    }
  }

  private createWebhookSignature(session: PaymentSession): string | undefined {
    if (!this.config.merchantWebhookSecret) return undefined;
    const canonicalPayload = JSON.stringify({
      id: session.id,
      merchantId: session.merchantId,
      status: session.status,
      solanaTxSignature: session.solanaTxSignature
    });
    return crypto
      .createHmac('sha256', this.config.merchantWebhookSecret)
      .update(canonicalPayload)
      .digest('hex');
  }

  private generateZcashAddress(): string {
    const payload = crypto.randomBytes(32);
    const encoded = bs58.encode(payload);
    return `zs${encoded.slice(0, 60)}`;
  }
}

let zpayAgentInstance: ZPayAgent | null = null;

export function getZPayAgent(): ZPayAgent {
  if (!zpayAgentInstance) {
    zpayAgentInstance = new ZPayAgent({
      zcashRpcUrl: process.env.ZCASH_RPC_URL,
      zcashRpcUsername: process.env.ZCASH_RPC_USERNAME,
      zcashRpcPassword: process.env.ZCASH_RPC_PASSWORD,
      flashiftApiKey: process.env.FLASHIFT_API_KEY,
      flashiftBaseUrl: process.env.FLASHIFT_API_BASE_URL,
      flashiftProviderName: process.env.FLASHIFT_PROVIDER_NAME,
      solanaRpcUrl: process.env.SOLANA_RPC_URL,
      solanaCustodialKey: process.env.SOLANA_CUSTODIAL_PRIVATE_KEY,
      upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
      upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      merchantWebhookUrl: process.env.MERCHANT_WEBHOOK_URL,
      merchantWebhookSecret: process.env.MERCHANT_WEBHOOK_SECRET,
      pollingIntervalMs: process.env.ZPAY_POLL_INTERVAL_MS
        ? parseInt(process.env.ZPAY_POLL_INTERVAL_MS, 10)
        : undefined,
      confirmationsRequired: process.env.ZPAY_CONFIRMATIONS_REQUIRED
        ? parseInt(process.env.ZPAY_CONFIRMATIONS_REQUIRED, 10)
        : undefined
    });
  }
  return zpayAgentInstance;
}

export function setupZPayRoutes(app: Application) {
  const agent = getZPayAgent();

  app.post('/api/zpay/sessions', async (req: Request, res) => {
    try {
      const {
        amountZec,
        targetAction,
        solanaDestination,
        solanaAmount,
        merchantId,
        metadata,
        memo,
        expiresInMinutes
      } = req.body;

      if (
        typeof amountZec !== 'number' ||
        !targetAction ||
        !solanaDestination
      ) {
        res.status(400).json({
          success: false,
          error:
            'amountZec (number), targetAction, and solanaDestination are required'
        });
        return;
      }

      const session = agent.createSession({
        amountZec,
        targetAction,
        solanaDestination,
        solanaAmount,
        merchantId,
        metadata,
        memo,
        expiresInMinutes
      });

      res.json({
        success: true,
        session
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/zpay/sessions', (req: Request, res) => {
    try {
      const { merchantId, status, limit } = req.query;
      const sessions = agent.listSessions({
        merchantId: merchantId as string | undefined,
        status: status as PaymentStatus | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });

      res.json({
        success: true,
        sessions,
        count: sessions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/zpay/sessions/:sessionId', (req: Request, res) => {
    try {
      const { sessionId } = req.params;
      const session = agent.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        session
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/zpay/sessions/:sessionId/mock-detect', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { txId, amountZec, confirmations } = req.body;
      if (!txId || typeof amountZec !== 'number') {
        res.status(400).json({
          success: false,
          error: 'txId and amountZec are required for mock detection'
        });
        return;
      }

      const session = await agent.markDetected(sessionId, {
        txId,
        amountZec,
        confirmations: confirmations ?? 1
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        session
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/zpay/cron', async (_req, res) => {
    try {
      const result = await agent.runSettlementCron();
      res.json({
        success: true,
        result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/zpay/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    agent.registerSseClient(res);
    res.write(
      `event: session.snapshot\ndata: ${JSON.stringify({
        sessions: agent.listSessions({ limit: 50 })
      })}\n\n`
    );

    req.on('close', () => {
      agent.unregisterSseClient(res);
    });
  });
}


