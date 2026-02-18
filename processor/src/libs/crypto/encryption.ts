import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encryption service for sensitive payment data
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly authTagLength = 16; // 128 bits
  private readonly key: Buffer;

  constructor(encryptionKey: string) {
    // Validate key length (must be 32 bytes for AES-256)
    if (!encryptionKey) {
      throw new Error('Encryption key is required');
    }

    // Convert hex string to buffer (expecting 64 hex chars = 32 bytes)
    if (encryptionKey.length !== 64) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }

    this.key = Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Encrypt a string value using AES-256-GCM
   * @param plaintext - The value to encrypt
   * @returns Base64-encoded encrypted string: [IV][Ciphertext][AuthTag]
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty value');
    }

    // Generate random IV (nonce) for this encryption
    const iv = randomBytes(this.ivLength);

    // Create cipher
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: IV + Encrypted Data + Auth Tag
    const result = Buffer.concat([iv, encrypted, authTag]);

    // Return as Base64 string for storage
    return result.toString('base64');
  }

  /**
   * Decrypt a value encrypted with encrypt()
   * @param encryptedData - Base64-encoded encrypted string
   * @returns Decrypted plaintext string
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      throw new Error('Cannot decrypt empty value');
    }

    try {
      // Decode from Base64
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = buffer.subarray(0, this.ivLength);
      const authTag = buffer.subarray(buffer.length - this.authTagLength);
      const encrypted = buffer.subarray(this.ivLength, buffer.length - this.authTagLength);

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once to generate a key, then store in environment variable
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
