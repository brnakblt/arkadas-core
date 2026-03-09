import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * Applies security headers and maintenance mode redirection.
 *
 * Security headers are applied to all matched routes.
 * Uses the same CSP configuration as lib/security.ts but at the Edge layer.
 */

const ONLYOFFICE_URL = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || '';

/** Build the Content-Security-Policy string */
function buildCsp(): string {
    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://translate.google.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https: http:",
        `connect-src 'self' https: http: ws: wss:`,
        `frame-src 'self' ${ONLYOFFICE_URL} https://www.google.com https://translate.google.com https://maps.google.com`,
        "media-src 'self' blob: data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
    ].join('; ');
}

export function middleware(request: NextRequest) {
    // --- Maintenance Mode ---
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

    const publicPaths = [
        '/maintenance',
        '/_next',
        '/static',
        '/favicon.ico',
        '/api/health',
    ];

    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isMaintenanceMode && !isPublicPath) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // --- Security Headers ---
    const response = NextResponse.next();

    // Content Security Policy
    response.headers.set('Content-Security-Policy', buildCsp());

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS filter (legacy browser support)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    response.headers.set(
        'Permissions-Policy',
        'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    // HSTS — only in production (HTTPS)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return response;
}

// Only run on routes that need security headers (skip static assets)
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
