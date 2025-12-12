/**
 * Encryption Utility for Sensitive Data
 * 
 * Uses AES-256-GCM encryption for all sensitive data at rest.
 * The encryption key should be stored securely in environment variables.
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const KEY_LENGTH = 32; // 256 bits

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('⚠️ ENCRYPTION_KEY not set - using derived key (NOT SECURE FOR PRODUCTION)');
    // Derive a key from JWT_SECRET as fallback (not ideal, but better than nothing)
    const fallbackSecret = process.env.JWT_SECRET || 'default-fallback-key-change-me';
    return crypto.scryptSync(fallbackSecret, 'kindkandles-salt', KEY_LENGTH);
  }
  
  // If key is hex-encoded (64 chars for 32 bytes)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise derive key from the provided string
  return crypto.scryptSync(key, 'kindkandles-encryption', KEY_LENGTH);
}

/**
 * Encrypt sensitive data
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:ciphertext (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - The encrypted string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  // Check if data is encrypted (has our format)
  if (!encryptedData.includes(':')) {
    // Data is not encrypted, return as-is (for backward compatibility)
    return encryptedData;
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      // Not our encryption format, return as-is
      return encryptedData;
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original data if decryption fails (might be unencrypted legacy data)
    return encryptedData;
  }
}

/**
 * Check if a string is encrypted with our format
 */
export function isEncrypted(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  
  // Check if parts look like base64
  try {
    Buffer.from(parts[0], 'base64');
    Buffer.from(parts[1], 'base64');
    return true;
  } catch {
    return false;
  }
}

/**
 * Hash sensitive data for searching (one-way)
 * Use this when you need to search encrypted data
 */
export function hashForSearch(data: string): string {
  if (!data) return data;
  const salt = process.env.SEARCH_HASH_SALT || 'kindkandles-search-salt';
  return crypto.createHmac('sha256', salt).update(data.toLowerCase().trim()).digest('hex');
}

/**
 * Encrypt an object's sensitive fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T, 
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]) as T[keyof T];
    }
  }
  
  return encrypted;
}

/**
 * Decrypt an object's encrypted fields
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T, 
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field]) as T[keyof T];
    }
  }
  
  return decrypted;
}

/**
 * Mask sensitive data for display (show only last 4 chars)
 */
export function maskSensitive(data: string, showLast: number = 4): string {
  if (!data || data.length <= showLast) return '****';
  return '*'.repeat(data.length - showLast) + data.slice(-showLast);
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****@****.***';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '**';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].length > 2
    ? domainParts[0][0] + '*'.repeat(domainParts[0].length - 2) + domainParts[0][domainParts[0].length - 1]
    : '**';
  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

/**
 * Mask phone number for display
 */
export function maskPhone(phone: string): string {
  if (!phone) return '****';
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

/**
 * Generate a secure encryption key
 * Run this once to generate your ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt sensitive JSON data
 */
export function encryptJSON(data: object): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt JSON data
 */
export function decryptJSON<T = object>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted) as T;
}

// Define which fields should be encrypted for each data type
export const ENCRYPTED_FIELDS = {
  customer: ['email', 'phone', 'first_name', 'last_name'] as const,
  order: ['customer_email', 'customer_name', 'shipping_address', 'billing_address', 'phone'] as const,
  admin_user: ['email', 'first_name', 'last_name'] as const,
  survey: ['email', 'name', 'phone'] as const,
};

// Type for encrypted field names
export type CustomerEncryptedFields = typeof ENCRYPTED_FIELDS.customer[number];
export type OrderEncryptedFields = typeof ENCRYPTED_FIELDS.order[number];

