import axios, { AxiosInstance } from 'axios';
import { log } from '../libs/logger';

/**
 * Types for Harry Rosen Gift Card API
 */
export interface HarryRosenBalanceRequest {
  pan: string; // Card number
  pin: string; // Security code
}

export interface HarryRosenBalanceResponse {
  amount: number; // Balance in dollars (not cents)
}

export interface HarryRosenRedeemRequest {
  pan: string;
  pin: string;
  amount: number; // Amount in dollars (not cents)
  reference_id: string;
  reason: string;
  orderId: string;
}

export interface HarryRosenRedeemResponse {
  reference_id: string;
}

export interface HarryRosenRefundRequest {
  pan: string;
  pin: string;
  amount: number; // Amount in dollars (not cents)
  currency: string;
  reference_id: string;
  program: string;
  orderId: string;
}

export interface HarryRosenRefundResponse {
  reference_id: string;
}

/**
 * Client for Harry Rosen Gift Card API
 *
 * NOTE: Harry Rosen uses different base URLs for different endpoints:
 * - Status (health check) & Balance: https://ckinttest.harryrosen.com:5010
 * - Redeem & Refund: https://crmapptest.harryrosen.com:8000
 */
export class HarryRosenGiftCardClient {
  private balanceClient: AxiosInstance; // For balance checks
  private transactionClient: AxiosInstance; // For redeem/refund
  private currency: string;

  constructor(config: {
    balanceBaseUrl: string;
    transactionBaseUrl: string;
    username: string;
    password: string;
    apiKey: string;
    currency: string;
  }) {
    this.currency = config.currency;

    // Create auth config
    const authConfig = {
      username: config.username,
      password: config.password,
    };

    const commonHeaders = {
      'Content-Type': 'application/json',
    };

    // Create axios instance for BALANCE endpoint
    this.balanceClient = axios.create({
      baseURL: this.normalizeUrl(config.balanceBaseUrl),
      auth: authConfig,
      headers: commonHeaders,
      timeout: 30000,
    });

    // Create axios instance for TRANSACTION endpoints (redeem, refund)
    // Uses Bearer token authentication per CTPaymentPluginCTEndpoints.md
    const base64ApiKey = Buffer.from(config.apiKey).toString('base64');
    this.transactionClient = axios.create({
      baseURL: this.normalizeUrl(config.transactionBaseUrl),
      headers: {
        ...commonHeaders,
        'Authorization': `Bearer ${base64ApiKey}`,
      },
      timeout: 30000,
    });

    // Add logging interceptors to both clients
    this.setupInterceptors(this.balanceClient, 'Balance API');
    this.setupInterceptors(this.transactionClient, 'Transaction API');
  }

  /**
   * Normalize URL - ensure it has http:// or https://
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Setup request/response logging interceptors
   */
  private setupInterceptors(client: AxiosInstance, apiName: string) {
    client.interceptors.request.use((config) => {
      log.info(`Harry Rosen ${apiName} Request`, {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        data: this.sanitizeLogData(config.data),
      });
      return config;
    });

    client.interceptors.response.use(
      (response) => {
        log.info(`Harry Rosen ${apiName} Response`, {
          status: response.status,
          data: this.sanitizeLogData(response.data),
        });
        return response;
      },
      (error) => {
        log.error(`Harry Rosen ${apiName} Error`, {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        return Promise.reject(error);
      },
    );
  }

  /**
   * Sanitize sensitive data for logging
   */
  private sanitizeLogData(data: any): any {
    if (!data) return data;
    const sanitized = { ...data };
    if (sanitized.pan) {
      sanitized.pan = '****' + sanitized.pan.slice(-4);
    }
    if (sanitized.pin) {
      sanitized.pin = '****';
    }
    return sanitized;
  }

  /**
   * Health check - verify connectivity with Harry Rosen API
   * Uses GET / endpoint on the balance server (same as balance endpoint)
   */
  async healthcheck(): Promise<{ status: string; details?: any }> {
    try {
      const response = await this.balanceClient.get<string>('/', {
        timeout: 3000, // 3 second timeout for health check
      });

      log.info('Harry Rosen health check response', {
        status: response.status,
        data: response.data,
      });

      // Response should be "OK" string
      if (response.data === 'OK' || response.status === 200) {
        return { status: 'OK', details: { responseCode: response.status } };
      }

      return {
        status: 'DOWN',
        details: {
          message: 'Unexpected response',
          responseCode: response.status,
          data: response.data,
        },
      };
    } catch (error: any) {
      log.error('Harry Rosen healthcheck failed', {
        error: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      return {
        status: 'DOWN',
        details: {
          error: error.message,
          code: error.code,
          statusCode: error.response?.status,
        },
      };
    }
  }

  /**
   * Check gift card balance
   * Uses balance server: https://ckinttest.harryrosen.com:5010
   */
  async balance(request: HarryRosenBalanceRequest): Promise<HarryRosenBalanceResponse> {
    try {
      const response = await this.balanceClient.post<HarryRosenBalanceResponse>('/api/giftcard/balance', {
        pan: request.pan.trim(),
        pin: request.pin.trim(),
      });

      return response.data;
    } catch (error: any) {
      log.error('Balance check failed', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        `Balance check failed: ${error.message}${error.response?.data ? ` - ${JSON.stringify(error.response.data)}` : ''}`,
      );
    }
  }

  /**
   * Redeem gift card (charge amount)
   * Uses transaction server: https://crmapptest.harryrosen.com:8000
   */
  async redeem(request: HarryRosenRedeemRequest): Promise<HarryRosenRedeemResponse> {
    try {
      const response = await this.transactionClient.post<HarryRosenRedeemResponse>('/ct/payment/capture', {
        pan: request.pan.trim(),
        pin: request.pin.trim(),
        amount: request.amount,
        reference_id: request.reference_id,
        reason: request.reason || 'purchase',
        orderId: request.orderId,
      });

      return response.data;
    } catch (error: any) {
      log.error('Redeem failed', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        `Redeem failed: ${error.message}${error.response?.data ? ` - ${JSON.stringify(error.response.data)}` : ''}`,
      );
    }
  }

  /**
   * Refund/return a gift card transaction
   * Uses transaction server: https://crmapptest.harryrosen.com:8000
   */
  async refund(request: HarryRosenRefundRequest): Promise<HarryRosenRefundResponse> {
    try {
      const response = await this.transactionClient.post<HarryRosenRefundResponse>('/api/giftcard/return', {
        pan: request.pan,
        pin: request.pin,
        amount: request.amount,
        currency: request.currency || this.currency,
        reference_id: request.reference_id,
        program: request.program || 'bold',
        orderId: request.orderId,
      });

      return response.data;
    } catch (error: any) {
      log.error('Refund failed', { error: error.message });
      throw new Error(`Refund failed: ${error.message}`);
    }
  }
}

/**
 * Factory function to create Harry Rosen Gift Card client
 */
export const HarryRosenGiftCardAPI = (config: {
  balanceBaseUrl: string;
  transactionBaseUrl: string;
  username: string;
  password: string;
  apiKey: string;
  currency: string;
}): HarryRosenGiftCardClient => {
  return new HarryRosenGiftCardClient(config);
};
