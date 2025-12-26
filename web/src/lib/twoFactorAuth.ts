/**
 * İki Faktörlü Kimlik Doğrulama (2FA) Servisi
 * 
 * TOTP (Time-based One-Time Password) tabanlı 2FA implementasyonu
 * RFC 6238 uyumlu - Google Authenticator, Authy vb. ile çalışır
 */

import crypto from 'crypto';

// ============================================================
// Types
// ============================================================

export interface TwoFactorSetup {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}

export interface TwoFactorVerification {
    valid: boolean;
    error?: string;
    remainingAttempts?: number;
}

// ============================================================
// TOTP Configuration
// ============================================================

const TOTP_CONFIG = {
    algorithm: 'sha1',
    digits: 6,
    period: 30, // seconds
    window: 1,  // Allow 1 period before/after for clock skew
};

const LOCKOUT_CONFIG = {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// ============================================================
// TOTP Functions
// ============================================================

/**
 * Rastgele TOTP secret oluşturur (Base32 encoded)
 */
export function generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    return base32Encode(buffer);
}

/**
 * Yedek kodlar oluşturur (8 adet, 8 karakterli)
 */
export function generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
}

/**
 * QR kod URL'i oluşturur (otpauth:// formatı)
 */
export function generateQRCodeUrl(
    secret: string,
    email: string,
    issuer: string = 'Arkadaş ERP'
): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * 2FA kurulum bilgilerini döndürür
 */
export function setup2FA(email: string, issuer?: string): TwoFactorSetup {
    const secret = generateSecret();
    const qrCodeUrl = generateQRCodeUrl(secret, email, issuer);
    const backupCodes = generateBackupCodes();

    return {
        secret,
        qrCodeUrl,
        backupCodes,
    };
}

/**
 * TOTP kodu doğrular
 */
export function verifyTOTP(secret: string, token: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    const period = TOTP_CONFIG.period;

    // Check current and adjacent time windows
    for (let i = -TOTP_CONFIG.window; i <= TOTP_CONFIG.window; i++) {
        const counter = Math.floor((now + i * period) / period);
        const expectedToken = generateTOTP(secret, counter);
        if (timingSafeEqual(token, expectedToken)) {
            return true;
        }
    }

    return false;
}

/**
 * Yedek kod doğrular
 */
export function verifyBackupCode(
    code: string,
    backupCodes: string[]
): { valid: boolean; updatedCodes: string[] } {
    const normalizedCode = code.replace('-', '').toUpperCase();
    const codeIndex = backupCodes.findIndex(
        (bc) => bc.replace('-', '').toUpperCase() === normalizedCode
    );

    if (codeIndex === -1) {
        return { valid: false, updatedCodes: backupCodes };
    }

    // Remove used backup code
    const updatedCodes = [...backupCodes];
    updatedCodes.splice(codeIndex, 1);

    return { valid: true, updatedCodes };
}

/**
 * 2FA doğrulama (TOTP veya yedek kod)
 */
export function verify2FA(
    secret: string,
    token: string,
    backupCodes: string[],
    failedAttempts: number,
    lockedUntil: Date | null
): TwoFactorVerification & { updatedBackupCodes?: string[] } {
    // Check lockout
    if (lockedUntil && new Date() < lockedUntil) {
        const remainingMs = lockedUntil.getTime() - Date.now();
        return {
            valid: false,
            error: `Hesap kilitli. ${Math.ceil(remainingMs / 60000)} dakika sonra tekrar deneyin.`,
        };
    }

    // Try TOTP first
    if (verifyTOTP(secret, token)) {
        return { valid: true };
    }

    // Try backup code
    const backupResult = verifyBackupCode(token, backupCodes);
    if (backupResult.valid) {
        return {
            valid: true,
            updatedBackupCodes: backupResult.updatedCodes,
        };
    }

    // Failed attempt
    const newFailedAttempts = failedAttempts + 1;
    const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - newFailedAttempts;

    if (remainingAttempts <= 0) {
        return {
            valid: false,
            error: `Çok fazla başarısız deneme. Hesap ${LOCKOUT_CONFIG.lockoutDuration / 60000} dakika kilitlendi.`,
            remainingAttempts: 0,
        };
    }

    return {
        valid: false,
        error: 'Geçersiz doğrulama kodu',
        remainingAttempts,
    };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * TOTP token oluşturur
 */
function generateTOTP(secret: string, counter: number): string {
    const secretBuffer = base32Decode(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac(TOTP_CONFIG.algorithm, secretBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0x0f;
    const binary = ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, TOTP_CONFIG.digits);
    return otp.toString().padStart(TOTP_CONFIG.digits, '0');
}

/**
 * Base32 encoding
 */
function base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            result += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
}

/**
 * Base32 decoding
 */
function base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');

    let bits = 0;
    let value = 0;
    const result: number[] = [];

    for (const char of cleanedInput) {
        const index = alphabet.indexOf(char);
        if (index === -1) continue;

        value = (value << 5) | index;
        bits += 5;

        if (bits >= 8) {
            result.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }

    return Buffer.from(result);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ============================================================
// Trusted Device Management
// ============================================================

export interface TrustedDevice {
    id: string;
    name: string;
    userAgent: string;
    ipAddress: string;
    createdAt: string;
    lastUsedAt: string;
}

/**
 * Güvenilir cihaz oluşturur
 */
export function createTrustedDevice(
    userAgent: string,
    ipAddress: string
): TrustedDevice {
    const id = crypto.randomBytes(16).toString('hex');
    const name = parseUserAgent(userAgent);

    return {
        id,
        name,
        userAgent,
        ipAddress,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
    };
}

/**
 * Güvenilir cihaz kontrolü
 */
export function isTrustedDevice(
    deviceId: string,
    trustedDevices: TrustedDevice[]
): boolean {
    return trustedDevices.some((d) => d.id === deviceId);
}

/**
 * User agent'ı parse eder
 */
function parseUserAgent(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    return 'Unknown Device';
}

// ============================================================
// Exports
// ============================================================

export default {
    generateSecret,
    generateBackupCodes,
    generateQRCodeUrl,
    setup2FA,
    verifyTOTP,
    verifyBackupCode,
    verify2FA,
    createTrustedDevice,
    isTrustedDevice,
};
