
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { MebbisConfig } from '../services/mebbis-automation';

// Cache credentials to avoid hitting Strapi on every request
// In a real app, listen for Strapi webhooks to invalidate this cache
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const CACHE_TTL = 300; // 5 minutes

export async function getTenantCredentials(tenantId: string | number): Promise<Partial<MebbisConfig>> {
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }

    const cacheKey = `tenant:${tenantId}:credentials`;
    const cached = await redis.get(cacheKey);

    if (cached) {
        return JSON.parse(cached);
    }

    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const strapiToken = process.env.STRAPI_API_TOKEN;

    if (!strapiToken) {
        throw new Error('STRAPI_API_TOKEN is not configured');
    }

    try {
        const response = await fetch(`${strapiUrl}/api/tenants/${tenantId}`, {
            headers: {
                'Authorization': `Bearer ${strapiToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch tenant credentials: ${response.statusText}`);
        }

        const data = await response.json();
        const tenant = data.data;

        if (!tenant || !tenant.attributes) {
            throw new Error('Tenant not found');
        }

        const { mebbisUsername, mebbisPassword } = tenant.attributes;

        if (!mebbisUsername || !mebbisPassword) {
            logger.warn(`Tenant ${tenantId} missing MEBBIS credentials`);
        }

        // In a real implementation, you would decrypt the password here
        // For this MVP, we assume Strapi returns the raw (but private) fields if token is admin

        const config: Partial<MebbisConfig> = {
            username: mebbisUsername,
            password: mebbisPassword,
        };

        await redis.set(cacheKey, JSON.stringify(config), 'EX', CACHE_TTL);

        return config;

    } catch (error) {
        logger.error(`Error fetching tenant credentials: ${error}`);
        throw error;
    }
}
