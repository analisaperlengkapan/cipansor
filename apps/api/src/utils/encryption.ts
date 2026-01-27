import crypto from 'crypto';

// Default key for development only (32 bytes as hex)
const DEFAULT_KEY_HEX = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended 96-bit IV for AES-GCM

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_KEY_HEX;

// Validate key length
if (Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  } else {
    console.warn('WARNING: ENCRYPTION_KEY is invalid. Using default key for development.');
  }
}

const getKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) return Buffer.from(DEFAULT_KEY_HEX, 'hex');
  return key;
};

/**
 * Encrypts a string value
 * @param text The text to encrypt
 * @returns format: iv:authTag:encryptedText (hex encoded)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: IV:TAG:ENCRYPTED
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string value
 * @param text The encrypted string (format: iv:authTag:encryptedText)
 * @returns The decrypted string
 */
export function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    if (parts.length !== 3) {
      // Return original text if not encrypted properly (for backward compatibility or error)
      // or throw error. Ideally throw.
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt value');
  }
}
