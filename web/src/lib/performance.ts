/**
 * Performance Optimization Utilities
 * 
 * Tenant-aware caching, image optimization, and query helpers
 */

import { getCache, cacheKeys } from './cache';

// ============================================================
// Tenant-Aware Cache
// ============================================================

/**
 * Generate tenant-scoped cache key
 */
export function tenantCacheKey(tenantId: number, ...parts: (string | number)[]): string {
    return `tenant:${tenantId}:${parts.join(':')}`;
}

/**
 * Cache wrapper with tenant isolation
 */
export async function cachedWithTenant<T>(
    tenantId: number,
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
): Promise<T> {
    const cache = getCache();
    const tenantKey = tenantCacheKey(tenantId, key);

    // Try cache first
    const cached = await cache.get<T>(tenantKey);
    if (cached !== null) {
        return cached;
    }

    // Fetch and cache
    const data = await fetcher();
    await cache.set(tenantKey, data, ttl);

    return data;
}

/**
 * Invalidate all cache for a tenant
 */
export async function invalidateTenantCache(tenantId: number): Promise<void> {
    const cache = getCache();
    await cache.invalidatePattern(`tenant:${tenantId}:*`);
}

/**
 * Invalidate specific entity cache for a tenant
 */
export async function invalidateTenantEntity(
    tenantId: number,
    entity: 'students' | 'schedules' | 'attendance' | 'invoices'
): Promise<void> {
    const cache = getCache();
    await cache.invalidatePattern(`tenant:${tenantId}:${entity}:*`);
}

// ============================================================
// Tenant Cache Keys
// ============================================================

export const tenantCacheKeys = {
    students: (tenantId: number) => tenantCacheKey(tenantId, 'students', 'list'),
    student: (tenantId: number, id: number) => tenantCacheKey(tenantId, 'students', id),
    schedules: (tenantId: number) => tenantCacheKey(tenantId, 'schedules', 'list'),
    schedule: (tenantId: number, id: number) => tenantCacheKey(tenantId, 'schedules', id),
    attendance: (tenantId: number, date: string) => tenantCacheKey(tenantId, 'attendance', date),
    invoices: (tenantId: number, month: string) => tenantCacheKey(tenantId, 'invoices', month),
    stats: (tenantId: number) => tenantCacheKey(tenantId, 'stats'),
    users: (tenantId: number) => tenantCacheKey(tenantId, 'users', 'list'),
};

// ============================================================
// Image Optimization Helpers
// ============================================================

interface ImageOptimizeOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * Generate optimized image URL (for Next.js Image component)
 */
export function optimizedImageUrl(
    src: string,
    options: ImageOptimizeOptions = {}
): string {
    const { width = 800, quality = 75, format: _format = 'webp' } = options;

    // If already a Next.js optimized URL, return as-is
    if (src.startsWith('/_next/image')) {
        return src;
    }

    // Build optimization params
    const params = new URLSearchParams({
        url: src,
        w: String(width),
        q: String(quality),
    });

    return `/_next/image?${params.toString()}`;
}

/**
 * Lazy load image configuration
 */
export const imageLazyConfig = {
    loading: 'lazy' as const,
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAgEDBAMBAAAAAAAAAAAAAgMBAAQREhMUIQUGMUH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABYRAQEBAAAAAAAAAAAAAAAAAAASAf/2gAMAwEAAhEDEQA/AMtnu47GS4uI12cVQoGEQQP1AAfmqp/EZ//Z',
};

/**
 * Responsive image sizes for different breakpoints
 */
export const responsiveImageSizes = {
    thumbnail: '(max-width: 768px) 100vw, 150px',
    card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    hero: '100vw',
    profile: '(max-width: 768px) 96px, 128px',
};

// ============================================================
// Query Optimization Helpers
// ============================================================

interface PaginationParams {
    page?: number;
    pageSize?: number;
    sort?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Build Strapi pagination query string
 */
export function buildPaginationQuery(params: PaginationParams = {}): string {
    const { page = 1, pageSize = 25, sort, sortOrder = 'desc' } = params;

    const queryParts: string[] = [
        `pagination[page]=${page}`,
        `pagination[pageSize]=${pageSize}`,
    ];

    if (sort) {
        queryParts.push(`sort=${sort}:${sortOrder}`);
    }

    return queryParts.join('&');
}

/**
 * Build Strapi filter query string
 */
export function buildFilterQuery(filters: Record<string, unknown>): string {
    const parts: string[] = [];

    function addFilter(key: string, value: unknown, prefix = 'filters') {
        if (value === null || value === undefined) return;

        if (typeof value === 'object' && !Array.isArray(value)) {
            // Nested filter
            Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
                addFilter(k, v, `${prefix}[${key}]`);
            });
        } else {
            parts.push(`${prefix}[${key}]=${encodeURIComponent(String(value))}`);
        }
    }

    Object.entries(filters).forEach(([key, value]) => {
        addFilter(key, value);
    });

    return parts.join('&');
}

/**
 * Build populate query for relations
 */
export function buildPopulateQuery(fields: string[]): string {
    if (fields.length === 0) return '';
    if (fields.length === 1) return `populate=${fields[0]}`;
    return `populate=${fields.join(',')}`;
}

// ============================================================
// Request Deduplication
// ============================================================

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicate concurrent requests with the same key
 */
export async function deduplicatedFetch<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<T> {
    // Check if request is already pending
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const promise = fetcher().finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
}

// Re-export cache utilities
export { getCache, cacheKeys };
