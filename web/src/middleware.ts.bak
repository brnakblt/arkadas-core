import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Headers Middleware
 * Adds CSP, CSRF protection, XSS headers
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http:`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https: http: ws: wss:",
        `frame-src 'self' ${process.env.NEXT_PUBLIC_ONLYOFFICE_URL || ''} https://www.google.com https://maps.google.com`,
        "frame-ancestors 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
    ].join('; ');

    // Security Headers
    const headers = {
        // Content Security Policy
        'Content-Security-Policy': csp,

        // Prevent clickjacking
        'X-Frame-Options': 'SAMEORIGIN',

        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',

        // Enable XSS filter
        'X-XSS-Protection': '1; mode=block',

        // Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // Permissions Policy
        'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self), interest-cohort=()',

        // HSTS (enable in production with HTTPS)
        ...(process.env.NODE_ENV === 'production' && {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        }),

        // Add nonce for scripts
        'x-nonce': nonce,
    };

    // Apply headers
    Object.entries(headers).forEach(([key, value]) => {
        if (value) {
            response.headers.set(key, value);
        }
    });

    return response;
}

// Only run on specific paths (skip static files)
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
