"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
/**
 * Post-deploy hook for Harry Rosen Gift Card Connector
 *
 * Note: This connector uses an existing payment custom type with the following required fields:
 * - giftCardCode (String): Stores the gift card number during authorization
 * - giftCardPin (String): Stores the gift card PIN during authorization
 *
 * Ensure your commercetools project has a payment custom type with these fields before deployment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function postDeploy(properties) {
    if (properties) {
        console.log('Running post-deploy scripts...\n');
        try {
            // Verify required environment variables
            const requiredVars = [
                'CTP_PROJECT_KEY',
                'CTP_CLIENT_ID',
                'CTP_CLIENT_SECRET',
                'HARRYROSEN_BALANCE_URL',
                'HARRYROSEN_TRANSACTION_URL',
                'HARRYROSEN_USER',
                'HARRYROSEN_PASSWORD',
            ];
            const missingVars = requiredVars.filter((varName) => !process.env[varName]);
            if (missingVars.length > 0) {
                console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
                console.warn('The connector may not function correctly without these variables.\n');
            }
            console.log('Post-deploy validation completed!');
            console.log('\nNext steps:');
            console.log('   1. Ensure your payment custom type includes giftCardCode and giftCardPin fields');
            console.log('   2. Configure all required environment variables');
            console.log('   3. Test the connector with /operations/status endpoint\n');
        }
        catch (error) {
            console.error('\n Post-deploy failed:', error.message);
            throw error;
        }
    }
}
async function runPostDeployScripts() {
    try {
        const properties = new Map(Object.entries(process.env));
        await postDeploy(properties);
    }
    catch (error) {
        if (error instanceof Error) {
            process.stderr.write(`Post-deploy failed: ${error.message}\n`);
        }
        process.exitCode = 1;
    }
}
runPostDeployScripts();
