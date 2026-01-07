/* eslint-disable no-console */
/**
 * Cookie-based Token Storage
 * 
 * Secure token storage using httpOnly cookies instead of localStorage.
 * This prevents XSS attacks from stealing authentication tokens.
 * 
 * SECURITY FIX #4: Move tokens from localStorage to cookies
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Cookie Configuration
// ============================================================

const AUTH_COOKIE_NAME = 'erp_auth_token';
const USER_COOKIE_NAME = 'erp_auth_user';

interface CookieOptions {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
}

const defaultCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

// ============================================================
// Server-side Cookie Utilities (for API routes)
// ============================================================

/**
 * Set authentication token in httpOnly cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
    response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: defaultCookieOptions.secure,
        sameSite: defaultCookieOptions.sameSite,
        path: defaultCookieOptions.path,
        maxAge: defaultCookieOptions.maxAge,
    });
}

/**
 * Set user data in cookie (not httpOnly - client needs to read)
 */
export function setUserCookie(response: NextResponse, userData: object): void {
    response.cookies.set(USER_COOKIE_NAME, JSON.stringify(userData), {
        httpOnly: false, // Client needs to read user data
        secure: defaultCookieOptions.secure,
        sameSite: defaultCookieOptions.sameSite,
        path: defaultCookieOptions.path,
        maxAge: defaultCookieOptions.maxAge,
    });
}

/**
 * Get authentication token from request
 */
export function getAuthToken(request: NextRequest): string | null {
    return request.cookies.get(AUTH_COOKIE_NAME)?.value || null;
}

/**
 * Clear authentication cookies (logout)
 */
export function clearAuthCookies(response: NextResponse): void {
    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(USER_COOKIE_NAME);
}

// ============================================================
// API Route Handlers
// ============================================================

/**
 * Login API handler - sets cookies
 * Use this in /api/auth/login route
 */
export async function handleLogin(
    strapiResponse: { jwt: string; user: object }
): Promise<NextResponse> {
    const response = NextResponse.json({
        success: true,
        user: strapiResponse.user,
    });

    setAuthCookie(response, strapiResponse.jwt);
    setUserCookie(response, strapiResponse.user);

    return response;
}

/**
 * Logout API handler - clears cookies
 * Use this in /api/auth/logout route
 */
export function handleLogout(): NextResponse {
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
}

/**
 * Auth check middleware
 * Use in API routes that require authentication
 */
export function requireAuth(request: NextRequest): { authorized: boolean; token: string | null } {
    const token = getAuthToken(request);
    return {
        authorized: !!token,
        token,
    };
}

// ============================================================
// Client-side Utilities
// ============================================================

/**
 * Client-side: Get user data from cookie
 */
export function getClientUser(): object | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const userCookie = cookies.find((c) => c.trim().startsWith(`${USER_COOKIE_NAME}=`));

    if (!userCookie) return null;

    try {
        const value = userCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(value));
    } catch {
        return null;
    }
}

/**
 * Client-side: Check if user is authenticated
 * (Based on user cookie, not token - token is httpOnly)
 */
export function isClientAuthenticated(): boolean {
    return getClientUser() !== null;
}

/**
 * Client-side: Logout via API call
 */
export async function clientLogout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

// ============================================================
// Migration Helper
// ============================================================

/**
 * Migrate from localStorage to cookies
 * Call this once on app load during transition period
 */
export async function migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    const oldToken = localStorage.getItem('erp_auth_token');
    const oldUser = localStorage.getItem('erp_auth_user');

    if (oldToken && oldUser) {
        try {
            // Call migration API endpoint
            await fetch('/api/auth/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: oldToken, user: JSON.parse(oldUser) }),
            });

            // Clear old localStorage
            localStorage.removeItem('erp_auth_token');
            localStorage.removeItem('erp_auth_user');

            console.debug('[Auth] Migrated from localStorage to cookies');
        } catch (error) {
            console.error('[Auth] Migration failed:', error);
        }
    }
}

export default {
    setAuthCookie,
    setUserCookie,
    getAuthToken,
    clearAuthCookies,
    handleLogin,
    handleLogout,
    requireAuth,
    getClientUser,
    isClientAuthenticated,
    clientLogout,
    migrateFromLocalStorage,
};
