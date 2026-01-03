/**
 * Login API Route with Rate Limiting
 * HIGH FIX: Added IP-based rate limiting to prevent brute force attacks
 */

import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

// Simple in-memory rate limiter (use Redis in production for distributed systems)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIP(req: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }
    // Fallback - use a hash of user-agent as partial identifier
    return req.headers.get('user-agent')?.slice(0, 50) || 'unknown';
}

function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record) {
        return { limited: false };
    }

    // Reset if window has passed
    if (now > record.resetTime) {
        loginAttempts.delete(ip);
        return { limited: false };
    }

    if (record.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return { limited: true, retryAfter };
    }

    return { limited: false };
}

function recordAttempt(ip: string): void {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record || now > record.resetTime) {
        loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else {
        record.count++;
    }
}

function resetAttempts(ip: string): void {
    loginAttempts.delete(ip);
}

export async function POST(req: NextRequest) {
    const clientIP = getClientIP(req);

    // SECURITY FIX: Check rate limit before processing
    const { limited, retryAfter } = isRateLimited(clientIP);
    if (limited) {
        return NextResponse.json(
            {
                error: "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.",
                retryAfter
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                }
            }
        );
    }

    try {
        const { identifier, password } = await req.json();

        const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Record failed attempt
            recordAttempt(clientIP);

            return NextResponse.json(
                { error: data.error?.message || "Giriş yapılamadı" },
                { status: response.status }
            );
        }

        // Success - reset rate limit for this IP
        resetAttempts(clientIP);

        const { jwt, user } = data;

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict" as const,
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        };

        const nextResponse = NextResponse.json({ user });
        nextResponse.cookies.set("jwt", jwt, cookieOptions);

        return nextResponse;
    } catch (error: unknown) {
        // Record attempt on error
        recordAttempt(clientIP);

        const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
