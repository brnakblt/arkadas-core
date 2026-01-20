
import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
});

/**
 * Basic fixed window rate limiter
 * @param key Identifier (IP or User ID)
 * @param limit Max requests
 * @param windowSeconds Time window
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
    const fullKey = `rate_limit:${key}`;

    // Increment
    const current = await redis.incr(fullKey);

    // Set expiry on first request
    if (current === 1) {
        await redis.expire(fullKey, windowSeconds);
    }

    return {
        success: current <= limit,
        limit,
        remaining: Math.max(0, limit - current),
    };
}
