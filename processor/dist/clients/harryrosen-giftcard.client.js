"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarryRosenGiftCardAPI = exports.HarryRosenGiftCardClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../libs/logger");
/**
 * Client for Harry Rosen Gift Card API
 *
 * NOTE: Harry Rosen uses different base URLs for different endpoints:
 * - Status (health check) & Balance: https://ckinttest.harryrosen.com:5010
 * - Redeem & Refund: https://crmapptest.harryrosen.com:8000
 */
class HarryRosenGiftCardClient {
    balanceClient; // For balance checks
    transactionClient; // For redeem/refund
    currency;
    constructor(config) {
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
        this.balanceClient = axios_1.default.create({
            baseURL: this.normalizeUrl(config.balanceBaseUrl),
            auth: authConfig,
            headers: commonHeaders,
            timeout: 30000,
        });
        // Create axios instance for TRANSACTION endpoints (redeem, refund)
        this.transactionClient = axios_1.default.create({
            baseURL: this.normalizeUrl(config.transactionBaseUrl),
            auth: authConfig,
            headers: commonHeaders,
            timeout: 30000,
        });
        // Add logging interceptors to both clients
        this.setupInterceptors(this.balanceClient, 'Balance API');
        this.setupInterceptors(this.transactionClient, 'Transaction API');
    }
    /**
     * Normalize URL - ensure it has http:// or https://
     */
    normalizeUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    }
    /**
     * Setup request/response logging interceptors
     */
    setupInterceptors(client, apiName) {
        client.interceptors.request.use((config) => {
            logger_1.log.info(`Harry Rosen ${apiName} Request`, {
                method: config.method,
                url: config.url,
                baseURL: config.baseURL,
                data: this.sanitizeLogData(config.data),
            });
            return config;
        });
        client.interceptors.response.use((response) => {
            logger_1.log.info(`Harry Rosen ${apiName} Response`, {
                status: response.status,
                data: this.sanitizeLogData(response.data),
            });
            return response;
        }, (error) => {
            logger_1.log.error(`Harry Rosen ${apiName} Error`, {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            return Promise.reject(error);
        });
    }
    /**
     * Sanitize sensitive data for logging
     */
    sanitizeLogData(data) {
        if (!data)
            return data;
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
    async healthcheck() {
        try {
            const response = await this.balanceClient.get('/', {
                timeout: 3000, // 3 second timeout for health check
            });
            logger_1.log.info('Harry Rosen health check response', {
                status: response.status,
                data: response.data
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
                    data: response.data
                }
            };
        }
        catch (error) {
            logger_1.log.error('Harry Rosen healthcheck failed', {
                error: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status
            });
            return {
                status: 'DOWN',
                details: {
                    error: error.message,
                    code: error.code,
                    statusCode: error.response?.status
                }
            };
        }
    }
    /**
     * Check gift card balance
     * Uses balance server: https://ckinttest.harryrosen.com:5010
     */
    async balance(request) {
        try {
            const response = await this.balanceClient.post('/api/giftcard/balance', {
                pan: request.pan.trim(),
                pin: request.pin.trim(),
            });
            return response.data;
        }
        catch (error) {
            logger_1.log.error('Balance check failed', { error: error.message });
            throw new Error(`Balance check failed: ${error.message}`);
        }
    }
    /**
     * Redeem gift card (charge amount)
     * Uses transaction server: https://crmapptest.harryrosen.com:8000
     */
    async redeem(request) {
        try {
            const response = await this.transactionClient.post('/api/giftcard/redeem', {
                pan: request.pan.trim(),
                pin: request.pin.trim(),
                amount: request.amount,
                reference_id: request.reference_id,
                reason: request.reason || 'purchase',
            });
            return response.data;
        }
        catch (error) {
            logger_1.log.error('Redeem failed', { error: error.message });
            throw new Error(`Redeem failed: ${error.message}`);
        }
    }
    /**
     * Refund/return a gift card transaction
     * Uses transaction server: https://crmapptest.harryrosen.com:8000
     */
    async refund(request) {
        try {
            const response = await this.transactionClient.post('/api/giftcard/return', {
                pan: request.pan,
                pin: request.pin,
                amount: request.amount,
                currency: request.currency || this.currency,
                reference_id: request.reference_id,
                program: request.program || 'bold',
            });
            return response.data;
        }
        catch (error) {
            logger_1.log.error('Refund failed', { error: error.message });
            throw new Error(`Refund failed: ${error.message}`);
        }
    }
}
exports.HarryRosenGiftCardClient = HarryRosenGiftCardClient;
/**
 * Factory function to create Harry Rosen Gift Card client
 */
const HarryRosenGiftCardAPI = (config) => {
    return new HarryRosenGiftCardClient(config);
};
exports.HarryRosenGiftCardAPI = HarryRosenGiftCardAPI;
