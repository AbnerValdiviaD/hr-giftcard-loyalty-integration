import { EncryptionService, generateEncryptionKey } from '../src/libs/crypto';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const testKey = generateEncryptionKey();

  beforeEach(() => {
    encryptionService = new EncryptionService(testKey);
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a value correctly', () => {
      const plaintext = '1234567890';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for the same plaintext', () => {
      const plaintext = '1234';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      // Different because of random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same value
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should throw error for empty plaintext', () => {
      expect(() => encryptionService.encrypt('')).toThrow('Cannot encrypt empty value');
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => encryptionService.decrypt('invalid-data')).toThrow('Decryption failed');
    });

    it('should throw error if auth tag is tampered', () => {
      const plaintext = '1234';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with the encrypted data
      const buffer = Buffer.from(encrypted, 'base64');
      buffer[buffer.length - 1] ^= 1; // Flip one bit in auth tag
      const tampered = buffer.toString('base64');

      expect(() => encryptionService.decrypt(tampered)).toThrow('Decryption failed');
    });
  });

  describe('constructor validation', () => {
    it('should throw error if key is missing', () => {
      expect(() => new EncryptionService('')).toThrow('Encryption key is required');
    });

    it('should throw error if key is wrong length', () => {
      expect(() => new EncryptionService('tooshort')).toThrow('must be 32 bytes');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex key', () => {
      const key = generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });
});
