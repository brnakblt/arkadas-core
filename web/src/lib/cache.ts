/* eslint-disable no-console */
/**
 * Redis Cache Service
 * Caching layer for API responses, sessions, and rate limiting
 */

// ============================================================
// Types
// ============================================================

interface CacheOptions {
    ttl?: number;  // Time to live in seconds
    prefix?: string;
}

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

// ============================================================
// In-Memory Cache Fallback
// ============================================================

class MemoryCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every minute
        if (typeof setInterval !== 'undefined') {
            this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    async set<T>(key: string, value: T, ttl: number): Promise<void> {
        this.cache.set(key, {
            data: value,
            expiresAt: Date.now() + (ttl * 1000),
        });
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async exists(key: string): Promise<boolean> {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    async keys(pattern: string): Promise<string[]> {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.cache.keys()).filter(k => regex.test(k));
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }
}

// ============================================================
// Redis Client Wrapper
// ============================================================

class RedisCache {
    private client: unknown = null;
    private isConnected = false;
    private memoryFallback: MemoryCache;

    constructor() {
        this.memoryFallback = new MemoryCache();
        this.connect();
    }

    private async connect(): Promise<void> {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            console.debug('[Cache] REDIS_URL not configured, using memory cache');
            return;
        }

        try {
            // Dynamic import for Redis (only in Node.js)
            if (typeof window === 'undefined') {
                const { createClient } = await import('redis');
                this.client = createClient({ url: redisUrl });

                (this.client as { connect: () => Promise<void> }).connect()
                    .then(() => {
                        this.isConnected = true;
                        console.debug('[Cache] Connected to Redis');
                    })
                    .catch((err: Error) => {
                        console.error('[Cache] Redis connection failed:', err.message);
                        this.isConnected = false;
                    });
            }
        } catch {
            console.debug('[Cache] Redis not available, using memory cache');
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) {
            return this.memoryFallback.get<T>(key);
        }

        try {
            const data = await (this.client as { get: (k: string) => Promise<string | null> }).get(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return this.memoryFallback.get<T>(key);
        }
    }

    async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
        if (!this.isConnected || !this.client) {
            return this.memoryFallback.set(key, value, ttl);
        }

        try {
            await (this.client as { setEx: (k: string, t: number, v: string) => Promise<void> })
                .setEx(key, ttl, JSON.stringify(value));
        } catch {
            await this.memoryFallback.set(key, value, ttl);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected || !this.client) {
            return this.memoryFallback.del(key);
        }

        try {
            await (this.client as { del: (k: string) => Promise<void> }).del(key);
        } catch {
            await this.memoryFallback.del(key);
        }
    }

    async invalidatePattern(pattern: string): Promise<void> {
        if (!this.isConnected || !this.client) {
            const keys = await this.memoryFallback.keys(pattern);
            for (const key of keys) {
                await this.memoryFallback.del(key);
            }
            return;
        }

        try {
            const keys = await (this.client as { keys: (p: string) => Promise<string[]> }).keys(pattern);
            if (keys.length > 0) {
                await (this.client as { del: (k: string[]) => Promise<void> }).del(keys);
            }
        } catch {
            // Fallback cleanup
        }
    }
}

// ============================================================
// Cache Instance
// ============================================================

let cacheInstance: RedisCache | null = null;

export function getCache(): RedisCache {
    if (!cacheInstance) {
        cacheInstance = new RedisCache();
    }
    return cacheInstance;
}

// ============================================================
// Cache Helpers
// ============================================================

const DEFAULT_TTL = {
    short: 60,        // 1 minute
    medium: 300,      // 5 minutes
    long: 3600,       // 1 hour
    day: 86400,       // 1 day
};

export const cacheKeys = {
    students: () => 'students:list',
    student: (id: number) => `students:${id}`,
    attendance: (date: string) => `attendance:${date}`,
    schedule: (userId: number) => `schedule:${userId}`,
    routes: () => 'routes:list',
    route: (id: number) => `routes:${id}`,
    user: (id: number) => `users:${id}`,
};

/**
 * Cache wrapper for API calls
 */
export async function cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttl = DEFAULT_TTL.medium, prefix = 'api' } = options;
    const fullKey = `${prefix}:${key}`;
    const cache = getCache();

    // Try to get from cache
    const cached = await cache.get<T>(fullKey);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    await cache.set(fullKey, data, ttl);

    return data;
}

/**
 * Invalidate cache for a specific key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
    const cache = getCache();
    await cache.invalidatePattern(`api:${pattern}*`);
}

// ============================================================
// React Query Cache Integration
// ============================================================

export function createCacheConfig() {
    return {
        defaultOptions: {
            queries: {
                staleTime: DEFAULT_TTL.medium * 1000,
                gcTime: DEFAULT_TTL.long * 1000,
                refetchOnWindowFocus: false,
                retry: 2,
            },
        },
    };
}

// ============================================================
// Session Cache
// ============================================================

export const sessionCache = {
    async set(sessionId: string, data: unknown): Promise<void> {
        const cache = getCache();
        await cache.set(`session:${sessionId}`, data, DEFAULT_TTL.day);
    },

    async get<T>(sessionId: string): Promise<T | null> {
        const cache = getCache();
        return cache.get<T>(`session:${sessionId}`);
    },

    async delete(sessionId: string): Promise<void> {
        const cache = getCache();
        await cache.del(`session:${sessionId}`);
    },
};

export { DEFAULT_TTL };
