/**
 * Credential Vault Utilities
 * 
 * Secure storage for sensitive credentials like MEBBIS passwords.
 * Uses encryption at rest and integrates with environment-based secrets.
 * 
 * In production, this should connect to:
 * - HashiCorp Vault
 * - AWS Secrets Manager
 * - Azure Key Vault
 * - Google Secret Manager
 */

import crypto from 'crypto';

// ============================================================
// Types
// ============================================================

export interface CredentialEntry {
    id: string;
    service: string;
    username: string;
    encryptedPassword: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    metadata?: Record<string, string>;
}

export interface VaultConfig {
    encryptionKey?: string;
    provider: 'local' | 'vault' | 'aws' | 'azure' | 'gcp';
    endpoint?: string;
}

// ============================================================
// Encryption Utilities
// ============================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.VAULT_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
    if (!key) {
        // Development fallback - NOT SECURE FOR PRODUCTION
        console.warn('[Vault] No encryption key found, using dev fallback');
        return crypto.scryptSync('dev-only-key', 'salt', 32);
    }
    return Buffer.from(key, 'hex');
}

function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// ============================================================
// In-Memory Store (Development/Testing)
// ============================================================

const memoryStore = new Map<string, CredentialEntry>();

// ============================================================
// Vault Operations
// ============================================================

/**
 * Clear all credentials (for testing/logout)
 */
export async function clearCredentials(): Promise<void> {
    memoryStore.clear();
}

/**
 * Store credentials securely
 */
export async function storeCredential(
    service: string,
    username: string,
    password: string,
    metadata?: Record<string, string>
): Promise<string> {
    const id = `cred_${service}_${crypto.randomUUID()}`;
    const encryptedPassword = encrypt(password);

    const entry: CredentialEntry = {
        id,
        service,
        username,
        encryptedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata,
    };

    // Store in memory (replace with production vault)
    memoryStore.set(id, entry);

    console.log(`[Vault] Credential stored: ${service}/${username}`);
    return id;
}

/**
 * Retrieve credentials
 */
export async function retrieveCredential(
    service: string,
    username?: string
): Promise<{ username: string; password: string } | null> {
    // Find matching credential
    for (const [, entry] of memoryStore) {
        if (entry.service === service) {
            if (!username || entry.username === username) {
                return {
                    username: entry.username,
                    password: decrypt(entry.encryptedPassword),
                };
            }
        }
    }

    // Check environment variables as fallback
    const envKey = `${service.toUpperCase()}_PASSWORD`;
    const envPassword = process.env[envKey];
    const envUsername = process.env[`${service.toUpperCase()}_USERNAME`];

    if (envPassword && envUsername) {
        return {
            username: envUsername,
            password: envPassword,
        };
    }

    return null;
}

/**
 * Update credential password
 */
export async function updateCredential(
    id: string,
    newPassword: string
): Promise<boolean> {
    const entry = memoryStore.get(id);
    if (!entry) return false;

    entry.encryptedPassword = encrypt(newPassword);
    entry.updatedAt = new Date();
    memoryStore.set(id, entry);

    console.log(`[Vault] Credential updated: ${entry.service}`);
    return true;
}

/**
 * Delete credential
 */
export async function deleteCredential(id: string): Promise<boolean> {
    const deleted = memoryStore.delete(id);
    if (deleted) {
        console.log(`[Vault] Credential deleted: ${id}`);
    }
    return deleted;
}

/**
 * List all stored credentials (without passwords)
 */
export async function listCredentials(): Promise<Omit<CredentialEntry, 'encryptedPassword'>[]> {
    const entries: Omit<CredentialEntry, 'encryptedPassword'>[] = [];

    for (const [, entry] of memoryStore) {
        const { encryptedPassword, ...safe } = entry;
        entries.push(safe);
    }

    return entries;
}

/**
 * Check if credential is expired
 */
export function isCredentialExpired(entry: CredentialEntry): boolean {
    if (!entry.expiresAt) return false;
    return new Date() > entry.expiresAt;
}

// ============================================================
// MEBBIS Specific
// ============================================================

const MEBBIS_SERVICE = 'mebbis';

/**
 * Store MEBBIS credentials
 */
export async function storeMebbisCredentials(
    tcNo: string,
    password: string
): Promise<string> {
    return storeCredential(MEBBIS_SERVICE, tcNo, password, {
        type: 'mebbis',
        createdBy: 'admin',
    });
}

/**
 * Get MEBBIS credentials
 */
export async function getMebbisCredentials(): Promise<{
    tcNo: string;
    password: string;
} | null> {
    const cred = await retrieveCredential(MEBBIS_SERVICE);
    if (!cred) return null;

    return {
        tcNo: cred.username,
        password: cred.password,
    };
}

/**
 * Validate MEBBIS credentials format
 */
export function validateMebbisCredentials(tcNo: string, password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // TC No validation
    if (!/^\d{11}$/.test(tcNo)) {
        errors.push('TC Kimlik No 11 haneli olmalıdır');
    }

    // Basic password validation
    if (password.length < 6) {
        errors.push('Şifre en az 6 karakter olmalıdır');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ============================================================
// Export
// ============================================================

export const vault = {
    store: storeCredential,
    retrieve: retrieveCredential,
    update: updateCredential,
    delete: deleteCredential,
    list: listCredentials,
    clear: clearCredentials,
    mebbis: {
        store: storeMebbisCredentials,
        get: getMebbisCredentials,
        validate: validateMebbisCredentials,
    },
};

export default vault;
