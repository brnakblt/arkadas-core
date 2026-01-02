/**
 * AES-256-GCM Encryption Utility for PII Data
 * Used to encrypt sensitive fields like TCKN, health data
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (256 bits)');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string
 * @param text - The plaintext to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (base64)
 */
export function encrypt(text: string): string {
    if (!text) return text;

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * @param ciphertext - Encrypted string in format: iv:authTag:ciphertext
 * @returns Original plaintext
 */
export function decrypt(ciphertext: string): string {
    if (!ciphertext || !ciphertext.includes(':')) return ciphertext;

    try {
        const key = getKey();
        const parts = ciphertext.split(':');

        if (parts.length !== 3) return ciphertext; // Not encrypted

        const iv = Buffer.from(parts[0], 'base64');
        const authTag = Buffer.from(parts[1], 'base64');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // If decryption fails, return as-is (might be unencrypted legacy data)
        console.warn('Decryption failed, returning raw value');
        return ciphertext;
    }
}

/**
 * Check if a value is already encrypted (has our format)
 */
export function isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3 && parts[0].length === 16; // base64 of 12 bytes = 16 chars
}

/**
 * Hash a value (one-way, for comparison purposes)
 */
export function hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}
