/**
 * Rate Limiting Middleware
 * Token bucket algorithm for API rate limiting
 */

// ============================================================
// Types
// ============================================================

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    message?: string;      // Custom error message
    keyGenerator?: (req: Request) => string;
}

interface RateLimitState {
    tokens: number;
    lastRefill: number;
}

// ============================================================
// In-Memory Rate Limit Store
// ============================================================

const rateLimitStore = new Map<string, RateLimitState>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [key, state] of rateLimitStore.entries()) {
            if (now - state.lastRefill > maxAge) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

// ============================================================
// Rate Limiter
// ============================================================

export function createRateLimiter(config: RateLimitConfig) {
    const {
        windowMs,
        maxRequests,
        message = 'Çok fazla istek. Lütfen bekleyin.',
        keyGenerator = defaultKeyGenerator,
    } = config;

    return async function rateLimitMiddleware(request: Request): Promise<Response | null> {
        const key = keyGenerator(request);
        const now = Date.now();

        let state = rateLimitStore.get(key);

        if (!state) {
            state = {
                tokens: maxRequests,
                lastRefill: now,
            };
            rateLimitStore.set(key, state);
        }

        // Refill tokens based on time passed
        const timePassed = now - state.lastRefill;
        const tokensToAdd = Math.floor(timePassed / windowMs) * maxRequests;

        if (tokensToAdd > 0) {
            state.tokens = Math.min(maxRequests, state.tokens + tokensToAdd);
            state.lastRefill = now;
        }

        // Check if request is allowed
        if (state.tokens <= 0) {
            const retryAfter = Math.ceil(windowMs / 1000);

            return new Response(
                JSON.stringify({
                    error: {
                        status: 429,
                        name: 'TooManyRequestsError',
                        message,
                    },
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil((state.lastRefill + windowMs) / 1000)),
                    },
                }
            );
        }

        // Consume a token
        state.tokens -= 1;

        // Return null to indicate request is allowed
        return null;
    };
}

// ============================================================
// Default Key Generator
// ============================================================

function defaultKeyGenerator(request: Request): string {
    // Use IP address from headers (common in proxy setups)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

    // Include path for more granular limiting
    const url = new URL(request.url);
    return `${ip}:${url.pathname}`;
}

// ============================================================
// Pre-configured Rate Limiters
// ============================================================

// Standard API rate limit: 100 req/min
export const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'API istek limiti aşıldı. 1 dakika bekleyin.',
});

// Authentication rate limit: 5 req/min (prevent brute force)
export const authLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Çok fazla giriş denemesi. 1 dakika bekleyin.',
});

// File upload rate limit: 10 req/min
export const uploadLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Çok fazla dosya yükleme. 1 dakika bekleyin.',
});

// Heavy operations: 5 req/min
export const heavyLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Bu işlem için limit aşıldı. 1 dakika bekleyin.',
});

// ============================================================
// Rate Limit Headers Helper
// ============================================================

export function addRateLimitHeaders(
    response: Response,
    limit: number,
    remaining: number,
    resetTime: number
): Response {
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(limit));
    headers.set('X-RateLimit-Remaining', String(remaining));
    headers.set('X-RateLimit-Reset', String(resetTime));

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

// ============================================================
// Client-side Rate Limit Handler
// ============================================================

export class RateLimitError extends Error {
    retryAfter: number;

    constructor(message: string, retryAfter: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export async function handleRateLimitedFetch(
    url: string,
    options?: RequestInit
): Promise<Response> {
    const response = await fetch(url, options);

    if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        throw new RateLimitError('Rate limit exceeded', retryAfter);
    }

    return response;
}
