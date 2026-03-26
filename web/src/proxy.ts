import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ONLYOFFICE_URL = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || '';

/** Build the Content-Security-Policy string */
function buildCsp(): string {
    const isDev = process.env.NODE_ENV === 'development';
    return [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://maps.googleapis.com https://translate.google.com`,
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

/** Apply security headers to a NextResponse */
function applySecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('Content-Security-Policy', buildCsp());
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Permissions-Policy',
        'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    // HSTS — only in production
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return response;
}

export function proxy(request: NextRequest) {
    // Check if maintenance mode is enabled via environment variable
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

    // Paths accessible even in maintenance mode
    const publicPaths = [
        '/maintenance',
        '/_next',
        '/static',
        '/favicon.ico',
        '/api/health'
    ];

    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isMaintenanceMode && !isPublicPath) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // Apply security headers to all responses
    const response = NextResponse.next();
    return applySecurityHeaders(response);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

