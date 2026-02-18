/**
 * Verification script for encryption setup
 * Run with: npx ts-node scripts/verify-encryption.ts
 */

import { EncryptionService, generateEncryptionKey } from '../src/libs/crypto';
import { getConfig } from '../src/config/config';

console.log('='.repeat(70));
console.log('Gift Card PIN Encryption Verification');
console.log('='.repeat(70));
console.log();

// Test 1: Generate new key
console.log('✓ Test 1: Generate new encryption key');
const newKey = generateEncryptionKey();
console.log(`  Generated key: ${newKey}`);
console.log(`  Key length: ${newKey.length} characters (expected: 64)`);
console.log();

// Test 2: Check environment configuration
console.log('✓ Test 2: Check environment configuration');
const config = getConfig();
if (config.encryptionKey) {
  console.log(`  ENCRYPTION_KEY is set: ${config.encryptionKey.substring(0, 16)}...`);
  console.log(`  Key length: ${config.encryptionKey.length} characters`);

  if (config.encryptionKey.length === 64) {
    console.log('  ✓ Key length is correct');
  } else {
    console.log('  ✗ WARNING: Key length should be 64 characters');
  }
} else {
  console.log('  ✗ WARNING: ENCRYPTION_KEY is not set in environment');
  console.log('  The service will fail to start without this key');
}
console.log();

// Test 3: Test encryption/decryption
console.log('✓ Test 3: Test encryption/decryption');
try {
  const testKey = config.encryptionKey || newKey;
  const encryption = new EncryptionService(testKey);

  const testPIN = '1234';
  console.log(`  Plain text PIN: ${testPIN}`);

  const encrypted = encryption.encrypt(testPIN);
  console.log(`  Encrypted PIN: ${encrypted}`);
  console.log(`  Encrypted length: ${encrypted.length} characters`);

  const decrypted = encryption.decrypt(encrypted);
  console.log(`  Decrypted PIN: ${decrypted}`);

  if (decrypted === testPIN) {
    console.log('  ✓ Encryption/decryption successful');
  } else {
    console.log('  ✗ ERROR: Decrypted value does not match original');
  }

  // Test uniqueness
  const encrypted2 = encryption.encrypt(testPIN);
  if (encrypted !== encrypted2) {
    console.log('  ✓ Unique ciphertext for same plaintext (random IV)');
  } else {
    console.log('  ✗ WARNING: Ciphertext should be unique');
  }
} catch (error: any) {
  console.log(`  ✗ ERROR: ${error.message}`);
}
console.log();

// Test 4: Test error handling
console.log('✓ Test 4: Test error handling');
try {
  const testKey = config.encryptionKey || newKey;
  const encryption = new EncryptionService(testKey);

  // Test empty value
  try {
    encryption.encrypt('');
    console.log('  ✗ Should have thrown error for empty value');
  } catch (error: any) {
    if (error.message.includes('Cannot encrypt empty value')) {
      console.log('  ✓ Correctly rejects empty values');
    }
  }

  // Test invalid decryption
  try {
    encryption.decrypt('invalid-base64-data');
    console.log('  ✗ Should have thrown error for invalid data');
  } catch (error: any) {
    if (error.message.includes('Decryption failed')) {
      console.log('  ✓ Correctly rejects invalid encrypted data');
    }
  }

  // Test tampered data
  try {
    const validEncrypted = encryption.encrypt('test');
    const buffer = Buffer.from(validEncrypted, 'base64');
    buffer[buffer.length - 1] ^= 1; // Flip one bit
    const tampered = buffer.toString('base64');

    encryption.decrypt(tampered);
    console.log('  ✗ Should have detected tampered data');
  } catch (error: any) {
    if (error.message.includes('Decryption failed')) {
      console.log('  ✓ Correctly detects tampered data (auth tag verification)');
    }
  }
} catch (error: any) {
  console.log(`  ✗ ERROR: ${error.message}`);
}
console.log();

// Summary
console.log('='.repeat(70));
console.log('Verification Complete');
console.log('='.repeat(70));
console.log();

if (config.encryptionKey && config.encryptionKey.length === 64) {
  console.log('✓ Encryption is properly configured');
  console.log('  Your service is ready to encrypt gift card PINs');
} else {
  console.log('⚠ Action Required:');
  console.log('  1. Generate a new encryption key:');
  console.log('     node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.log('  2. Add to your .env file:');
  console.log('     ENCRYPTION_KEY=<your-64-character-key>');
  console.log('  3. Restart the service');
}
console.log();
