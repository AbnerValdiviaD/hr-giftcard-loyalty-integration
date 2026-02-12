"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.config = void 0;
exports.config = {
    // Required by Payment SDK
    projectKey: process.env.CTP_PROJECT_KEY || 'projectKey',
    clientId: process.env.CTP_CLIENT_ID || 'xxx',
    clientSecret: process.env.CTP_CLIENT_SECRET || 'xxx',
    jwksUrl: process.env.CTP_JWKS_URL || 'https://mc-api.us-central1.gcp.commercetools.com/.well-known/jwks.json',
    jwtIssuer: process.env.CTP_JWT_ISSUER || 'https://mc-api.us-central1.gcp.commercetools.com',
    authUrl: process.env.CTP_AUTH_URL || 'https://auth.us-central1.gcp.commercetools.com',
    apiUrl: process.env.CTP_API_URL || 'https://api.us-central1.gcp.commercetools.com',
    sessionUrl: process.env.CTP_SESSION_URL || 'https://session.us-central1.gcp.commercetools.com/',
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
    mockConnectorCurrency: process.env.MOCK_CONNECTOR_CURRENCY || '',
    // Harry Rosen Gift Card API configuration
    // NOTE: Harry Rosen uses different servers for different operations:
    // - Status (health check) & Balance: ckinttest.harryrosen.com:5010
    // - Transactions (redeem/refund): crmapptest.harryrosen.com:8000
    harryRosenBalanceUrl: process.env.HARRYROSEN_BALANCE_URL || 'https://ckinttest.harryrosen.com:5010',
    harryRosenTransactionUrl: process.env.HARRYROSEN_TRANSACTION_URL || 'https://crmapptest.harryrosen.com:8000',
    harryRosenUser: process.env.HARRYROSEN_USER || '',
    harryRosenPassword: process.env.HARRYROSEN_PASSWORD || '',
    // Required by logger
    loggerLevel: process.env.LOGGER_LEVEL || 'info',
};
const getConfig = () => {
    return exports.config;
};
exports.getConfig = getConfig;
