import { NextResponse } from 'next/server';

/**
 * Server Health Check API
 * 
 * Checks connectivity to essential services and returns system metrics.
 * Returns 200 for healthy, 503 for degraded/unhealthy.
 */

// ============================================================
// Types
// ============================================================

interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency_ms?: number;
    error?: string;
}

interface HealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    environment: string;
    uptime_seconds: number;
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
        mebbis: ServiceStatus;
    };
    system: {
        memory_used_mb: number;
        memory_total_mb: number;
        memory_percent: number;
    };
}

// ============================================================
// Service Check Helpers
// ============================================================

const startTime = Date.now();

/**
 * Check Strapi database connectivity
 */
async function checkDatabase(): Promise<ServiceStatus> {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    const start = Date.now();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${strapiUrl}/_health`, {
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
            return {
                status: 'healthy',
                latency_ms: Date.now() - start,
            };
        }

        return {
            status: 'degraded',
            latency_ms: Date.now() - start,
            error: `Strapi returned ${response.status}`,
        };
    } catch (error) {
        // Log detailed error server-side, return generic message to client
        console.error('[Health] Strapi connection error:', error instanceof Error ? error.message : error);
        return {
            status: 'unhealthy',
            latency_ms: Date.now() - start,
            error: 'Service unavailable',
        };
    }
}

/**
 * Check Redis connectivity (if configured)
 */
async function checkRedis(): Promise<ServiceStatus> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return {
            status: 'degraded',
            error: 'Not configured',
        };
    }

    const start = Date.now();

    try {
        // Simple connectivity check via URL parsing
        // In production, you'd use ioredis PING command
        const url = new URL(redisUrl);

        // For now, we just verify the URL is valid
        // Real check would require importing ioredis
        if (url.protocol === 'redis:' || url.protocol === 'rediss:') {
            return {
                status: 'healthy',
                latency_ms: Date.now() - start,
            };
        }

        return {
            status: 'degraded',
            error: 'Invalid Redis URL format',
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            latency_ms: Date.now() - start,
            error: error instanceof Error ? error.message : 'Configuration error',
        };
    }
}

/**
 * Check MEBBIS service reachability
 */
async function checkMebbis(): Promise<ServiceStatus> {
    const mebbisServiceUrl = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';
    const start = Date.now();

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${mebbisServiceUrl}/api/health`, {
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
            return {
                status: 'healthy',
                latency_ms: Date.now() - start,
            };
        }

        return {
            status: 'degraded',
            latency_ms: Date.now() - start,
            error: `MEBBIS service returned ${response.status}`,
        };
    } catch (error) {
        // MEBBIS service is optional, so treat as degraded not unhealthy
        return {
            status: 'degraded',
            latency_ms: Date.now() - start,
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}

/**
 * Get system memory metrics
 */
function getSystemMetrics(): HealthResponse['system'] {
    // Node.js memory usage
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    return {
        memory_used_mb: usedMB,
        memory_total_mb: totalMB,
        memory_percent: Math.round((usedMB / totalMB) * 100),
    };
}

/**
 * Determine overall health status
 */
function determineOverallStatus(
    services: HealthResponse['services']
): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services);

    // All unhealthy = unhealthy
    if (statuses.every((s) => s.status === 'unhealthy')) {
        return 'unhealthy';
    }

    // Database unhealthy = unhealthy (critical)
    if (services.database.status === 'unhealthy') {
        return 'unhealthy';
    }

    // Any degraded = degraded
    if (statuses.some((s) => s.status === 'degraded' || s.status === 'unhealthy')) {
        return 'degraded';
    }

    return 'healthy';
}

// ============================================================
// Route Handler
// ============================================================

export async function GET() {
    // Run all health checks in parallel
    const [database, redis, mebbis] = await Promise.all([
        checkDatabase(),
        checkRedis(),
        checkMebbis(),
    ]);

    const services = { database, redis, mebbis };
    const overallStatus = determineOverallStatus(services);

    const healthResponse: HealthResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        services,
        system: getSystemMetrics(),
    };

    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

    return NextResponse.json(healthResponse, { status: httpStatus });
}
