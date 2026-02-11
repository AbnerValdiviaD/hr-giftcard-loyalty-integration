import * as dotenv from 'dotenv';

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
async function postDeploy(properties: any) {
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
    } catch (error: any) {
      console.error('\n Post-deploy failed:', error.message);
      throw error;
    }
  }
}

async function runPostDeployScripts() {
  try {
    const properties = new Map(Object.entries(process.env));
    await postDeploy(properties);
  } catch (error) {
    if (error instanceof Error) {
      process.stderr.write(`Post-deploy failed: ${error.message}\n`);
    }
    process.exitCode = 1;
  }
}

runPostDeployScripts();
