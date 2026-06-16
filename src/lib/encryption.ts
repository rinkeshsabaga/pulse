import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getRequiredEnv } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// AES-256-GCM Encryption for Credential Secrets
//
// IMPORTANT: The ENCRYPTION_KEY env var must be a 64-character hex string
// (32 bytes). Generate once with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// ⚠️  Never rotate this key after storing credentials — it will make all
//     existing encrypted data unreadable. Store it in your secrets manager.
// ─────────────────────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

function getKey(): Buffer {
  const key = getRequiredEnv('ENCRYPTION_KEY');
  if (key.length !== 64) throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string in the format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + ciphertext as base64
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypts a base64-encoded string produced by `encrypt()`.
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const combined = Buffer.from(ciphertext, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Encrypts a plain object as JSON.
 */
export function encryptObject(data: Record<string, unknown>): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypts and parses an encrypted JSON object.
 */
export function decryptObject<T = Record<string, unknown>>(ciphertext: string): T {
  return JSON.parse(decrypt(ciphertext)) as T;
}
