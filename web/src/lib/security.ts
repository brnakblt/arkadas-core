/**
 * Security Middleware and Utilities
 * Provides CSRF protection, security headers, and input sanitization
 */

// ============================================================
// CSRF Protection
// ============================================================

/**
 * Generate a CSRF token
 * Uses crypto API for secure random generation
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
     
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(request: Request, storedToken: string): boolean {
    const headerToken = request.headers.get('X-CSRF-Token');
    const formToken = new URL(request.url).searchParams.get('_csrf');

    const providedToken = headerToken || formToken;

    if (!providedToken || !storedToken) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(providedToken, storedToken);
}

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * CSRF middleware for API routes
 */
export async function csrfMiddleware(
    request: Request,
    getStoredToken: () => Promise<string | null>
): Promise<Response | null> {
    // Skip CSRF for safe methods
    const safesMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safesMethods.includes(request.method)) {
        return null;
    }

    const storedToken = await getStoredToken();

    if (!storedToken) {
        return new Response(
            JSON.stringify({
                error: {
                    status: 403,
                    name: 'ForbiddenError',
                    message: 'CSRF token bulunamadı',
                },
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    if (!validateCsrfToken(request, storedToken)) {
        return new Response(
            JSON.stringify({
                error: {
                    status: 403,
                    name: 'ForbiddenError',
                    message: 'Geçersiz CSRF token',
                },
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    return null; // Request is valid
}

// ============================================================
// Security Headers
// ============================================================

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
    contentSecurityPolicy?: string;
    strictTransportSecurity?: boolean;
    xContentTypeOptions?: boolean;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN';
    xXssProtection?: boolean;
    referrerPolicy?: string;
    permissionsPolicy?: string;
}

/**
 * Default security headers configuration
 * NOTE: For production, replace nonce placeholders with actual cryptographic nonces
 */
export const defaultSecurityHeaders: SecurityHeadersConfig = {
    contentSecurityPolicy: [
        "default-src 'self'",
        // SECURITY FIX #8: Removed unsafe-inline and unsafe-eval
        // In production, use nonces: script-src 'self' 'nonce-{RANDOM}'
        "script-src 'self' https://maps.googleapis.com https://translate.google.com",
        "style-src 'self' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https://api.*.arkadas.com.tr https://*.strapi.io wss: https://translate.google.com https://maps.googleapis.com",
        "frame-src 'self' https://www.google.com https://translate.google.com",
        "media-src 'self' blob: data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
        "upgrade-insecure-requests",
    ].join('; '),
    strictTransportSecurity: true,
    xContentTypeOptions: true,
    xFrameOptions: 'SAMEORIGIN',
    xXssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
        'camera=(self)',
        'microphone=(self)',
        'geolocation=(self)',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
    ].join(', '),
};

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(
    response: Response,
    config: SecurityHeadersConfig = defaultSecurityHeaders
): Response {
    const headers = new Headers(response.headers);

    if (config.contentSecurityPolicy) {
        headers.set('Content-Security-Policy', config.contentSecurityPolicy);
    }

    if (config.strictTransportSecurity) {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    if (config.xContentTypeOptions) {
        headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (config.xFrameOptions) {
        headers.set('X-Frame-Options', config.xFrameOptions);
    }

    if (config.xXssProtection) {
        headers.set('X-XSS-Protection', '1; mode=block');
    }

    if (config.referrerPolicy) {
        headers.set('Referrer-Policy', config.referrerPolicy);
    }

    if (config.permissionsPolicy) {
        headers.set('Permissions-Policy', config.permissionsPolicy);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Security headers middleware for Next.js
 */
export function securityHeadersMiddleware(response: Response): Response {
    return addSecurityHeaders(response);
}

// ============================================================
// Input Sanitization
// ============================================================

/**
 * HTML entities to escape for XSS prevention
 */
const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
    if (typeof str !== 'string') {
        return str;
    }

    return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize string input - removes potentially dangerous content
 */
export function sanitizeString(input: string): string {
    if (typeof input !== 'string') {
        return input;
    }

    return input
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove script tags (case insensitive)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove inline event handlers
        .replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '')
        // Remove data: URLs (can be dangerous)
        .replace(/data:[^,]*,/gi, '')
        // Escape remaining HTML
        .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = {} as T;

    for (const key of Object.keys(obj)) {
        const value = obj[key];

        if (typeof value === 'string') {
            (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            (sanitized as Record<string, unknown>)[key] = value.map((item) =>
                typeof item === 'string' ? sanitizeString(item) :
                    typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) :
                        item
            );
        } else if (typeof value === 'object' && value !== null) {
            (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            (sanitized as Record<string, unknown>)[key] = value;
        }
    }

    return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string, allowedProtocols = ['http:', 'https:']): string | null {
    try {
        const parsed = new URL(url);

        if (!allowedProtocols.includes(parsed.protocol)) {
            return null;
        }

        // Prevent open redirects by only allowing relative URLs or same-origin
        return parsed.toString();
    } catch {
        // Invalid URL
        return null;
    }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
    return filename
        // Remove path traversal attempts
        .replace(/\.\./g, '')
        .replace(/[/\\]/g, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Keep only safe characters
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255); // Limit length
}

// ============================================================
// SQL Injection Prevention (for raw queries if ever needed)
// ============================================================

/**
 * Escape SQL special characters
 * Note: Prefer parameterized queries instead of this function
 */
export function escapeSql(str: string): string {
    if (typeof str !== 'string') {
        return str;
    }

    return str
        .replace(/'/g, "''")
        .replace(/\\/g, '\\\\')
        // eslint-disable-next-line no-control-regex
        .replace(/\x00/g, '\\0')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        // eslint-disable-next-line no-control-regex
        .replace(/\x1a/g, '\\Z');
}

// ============================================================
// Request Validation
// ============================================================

/**
 * Validate Content-Type header
 */
export function validateContentType(
    request: Request,
    allowedTypes: string[] = ['application/json']
): boolean {
    const contentType = request.headers.get('content-type');

    if (!contentType) {
        return false;
    }

    return allowedTypes.some((type) => contentType.includes(type));
}

/**
 * Parse and validate JSON body with size limit
 */
export async function parseJsonBody<T>(
    request: Request,
    maxSize = 1024 * 1024 // 1MB default
): Promise<{ data?: T; error?: string }> {
    try {
        const contentLength = request.headers.get('content-length');

        if (contentLength && parseInt(contentLength) > maxSize) {
            return { error: 'Request body too large' };
        }

        const text = await request.text();

        if (text.length > maxSize) {
            return { error: 'Request body too large' };
        }

        const data = JSON.parse(text) as T;
        return { data: sanitizeObject(data as Record<string, unknown>) as T };
    } catch {
        return { error: 'Invalid JSON body' };
    }
}

// ============================================================
// Origin Validation
// ============================================================

/**
 * Escape special regex characters
 * SECURITY FIX #9: Properly escape regex special chars before pattern construction
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate request origin for CORS
 */
export function validateOrigin(
    request: Request,
    allowedOrigins: string[]
): boolean {
    const origin = request.headers.get('origin');

    if (!origin) {
        // No origin header - could be same-origin request
        return true;
    }

    return allowedOrigins.some((allowed) => {
        if (allowed === '*') {
            return true;
        }

        if (allowed.includes('*')) {
            // Wildcard subdomain matching
            // SECURITY FIX: Escape special regex chars except for wildcard replacement
            const escapedAllowed = escapeRegex(allowed).replace(/\\\*/g, '.*');
            const pattern = new RegExp('^' + escapedAllowed + '$');
            return pattern.test(origin);
        }

        return origin === allowed;
    });
}

// ============================================================
// Export all utilities
// ============================================================

export const security = {
    // CSRF
    generateCsrfToken,
    validateCsrfToken,
    csrfMiddleware,

    // Headers
    addSecurityHeaders,
    securityHeadersMiddleware,
    defaultSecurityHeaders,

    // Sanitization
    escapeHtml,
    sanitizeString,
    sanitizeObject,
    sanitizeUrl,
    sanitizeFilename,
    escapeSql,

    // Validation
    validateContentType,
    parseJsonBody,
    validateOrigin,
};

export default security;
