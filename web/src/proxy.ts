import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // Check if maintenance mode is enabled via environment variable
    const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

    // List of paths that should be accessible even in maintenance mode
    // - /maintenance: The maintenance page itself
    // - /_next: Next.js assets
    // - /static: Static files
    // - /api/health: Health check endpoints (optional, but good for monitoring)
    const publicPaths = [
        '/maintenance',
        '/_next',
        '/static',
        '/favicon.ico',
        '/api/health'
    ];

    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isMaintenanceMode && !isPublicPath) {
        // Redirect to maintenance page
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // Normal behavior
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> We might want to block APIs too, or handle them via specific API middleware
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * 
         * Actually, we want to match everything to block everything, 
         * but we let logic inside middleware handle the exemptions.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
