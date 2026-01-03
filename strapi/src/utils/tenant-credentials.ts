/**
 * Tenant Credential Manager
 * Handles encrypted per-tenant credentials (MEBBIS, etc.)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'base64';

interface MebbisCredentials {
    username: string;
    password: string;
}

interface TenantCredentials {
    mebbis?: MebbisCredentials;
}

/**
 * Encrypt credentials and save to file
 */
export function encryptCredentials(
    data: TenantCredentials,
    encryptionKey: string,
    outputPath: string
): void {
    const key = crypto.scryptSync(encryptionKey, 'tenant-salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag();

    const payload = {
        iv: iv.toString(ENCODING),
        authTag: authTag.toString(ENCODING),
        data: encrypted,
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(payload));
}

/**
 * Decrypt credentials from file
 */
export function decryptCredentials(
    filePath: string,
    encryptionKey: string
): TenantCredentials | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const key = crypto.scryptSync(encryptionKey, 'tenant-salt', 32);
        const iv = Buffer.from(payload.iv, ENCODING);
        const authTag = Buffer.from(payload.authTag, ENCODING);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(payload.data, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Failed to decrypt credentials:', error);
        return null;
    }
}

/**
 * Get MEBBIS credentials for a tenant
 */
export function getMebbisCredentials(
    tenantPath: string,
    encryptionKey: string
): MebbisCredentials | null {
    const configPath = path.join(tenantPath, 'config.json');

    if (!fs.existsSync(configPath)) {
        return null;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.mebbis?.enabled || !config.mebbis?.credentialsFile) {
        return null;
    }

    const credPath = path.join(tenantPath, config.mebbis.credentialsFile);
    const creds = decryptCredentials(credPath, encryptionKey);

    return creds?.mebbis || null;
}
