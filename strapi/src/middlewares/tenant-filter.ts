/**
 * Tenant Filter Middleware
 * 
 * Automatically extracts tenant from:
 * 1. x-tenant-id header (mobile/API)
 * 2. Subdomain (web apps)
 * 3. User's assigned tenant (fallback)
 * 
 * Stores tenant in ctx.state for use in controllers and policies
 */

import type { Core } from '@strapi/strapi';

// Content types that MUST have tenant isolation
const TENANT_FILTERED_TYPES = [
    'api::student-profile.student-profile',
    'api::teacher-profile.teacher-profile',
    'api::bireysel-egitim-plani.bireysel-egitim-plani',
    'api::kaba-degerlendirme.kaba-degerlendirme',
    'api::performans-kayit.performans-kayit',
    'api::donem-sonu-degerlendirme.donem-sonu-degerlendirme',
    'api::fatura.fatura',
    'api::rapor.rapor',
    'api::appointment.appointment',
    'api::attendance-log.attendance-log',
    'api::schedule.schedule',
    'api::service-route.service-route',
    'api::location-log.location-log',
    'api::route-stop.route-stop',
    'api::storage-file.storage-file',
    'api::device-token.device-token',
];

// Public content types (no tenant filtering)
const PUBLIC_TYPES = [
    'api::tenant.tenant',
    'api::about.about',
    'api::article.article',
    'api::faq.faq',
    'api::hero.hero',
    'api::global.global',
    'api::gallery.gallery',
    'api::team-member.team-member',
];

// URL patterns that are public
const PUBLIC_PATHS = [
    '/api/auth',
    '/api/tenants',
    '/api/onlyoffice/callback',
];

// Cache for tenant lookups
const tenantCache = new Map<string, { tenant: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
    return async (ctx: any, next: () => Promise<void>) => {
        // Skip for non-API routes
        if (!ctx.request.url.startsWith('/api/')) {
            return next();
        }

        // Skip for public paths
        if (PUBLIC_PATHS.some(path => ctx.request.url.startsWith(path))) {
            return next();
        }

        // =====================================================================
        // STEP 1: Extract Tenant ID from multiple sources
        // =====================================================================
        let tenantSlug: string | null = null;

        // 1a. Check x-tenant-id header (highest priority for mobile/API)
        const headerTenant = ctx.request.headers['x-tenant-id'];
        if (headerTenant && typeof headerTenant === 'string') {
            tenantSlug = sanitizeTenantSlug(headerTenant);
        }

        // 1b. Check subdomain (web apps: arkadas.example.com)
        if (!tenantSlug) {
            const host = ctx.request.headers.host || '';
            const subdomain = extractSubdomain(host);
            if (subdomain) {
                tenantSlug = subdomain;
            }
        }

        // 1c. Fall back to authenticated user's tenant
        if (!tenantSlug && ctx.state?.user) {
            const userTenant = await getUserTenant(strapi, ctx.state.user.id);
            if (userTenant?.slug) {
                tenantSlug = userTenant.slug;
            }
        }

        // =====================================================================
        // STEP 2: Validate Tenant and Store in Context
        // =====================================================================
        if (tenantSlug) {
            const tenant = await getTenantBySlug(strapi, tenantSlug);

            if (!tenant) {
                strapi.log.warn(`Invalid tenant requested: ${tenantSlug}`);
                ctx.status = 400;
                ctx.body = { error: 'Invalid tenant' };
                return;
            }

            if (!tenant.isActive) {
                strapi.log.warn(`Inactive tenant requested: ${tenantSlug}`);
                ctx.status = 403;
                ctx.body = { error: 'Tenant is inactive' };
                return;
            }

            // Store tenant info in context
            ctx.state.tenant = tenant;
            ctx.state.tenantId = tenant.id;
            ctx.state.tenantSlug = tenant.slug;
        }

        // =====================================================================
        // STEP 3: Verify tenant for protected content types
        // =====================================================================
        const contentType = getContentTypeFromUrl(ctx.request.url);

        if (contentType && TENANT_FILTERED_TYPES.includes(contentType)) {
            if (!ctx.state.tenantId) {
                strapi.log.warn(`Tenant required but not provided for ${ctx.request.url}`);
                ctx.status = 400;
                ctx.body = { error: 'Tenant identification required (x-tenant-id header)' };
                return;
            }
        }

        await next();
    };
};

/**
 * Sanitize tenant slug (prevent injection)
 */
function sanitizeTenantSlug(slug: string): string {
    return slug.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);
}

/**
 * Extract subdomain from host
 */
function extractSubdomain(host: string): string | null {
    // Remove port
    const hostname = host.split(':')[0];
    const parts = hostname.split('.');

    // Need at least 3 parts for subdomain.domain.tld
    if (parts.length >= 3) {
        const subdomain = parts[0];
        // Exclude common non-tenant subdomains
        if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
            return subdomain;
        }
    }

    return null;
}

/**
 * Get tenant by slug with caching
 */
async function getTenantBySlug(strapi: Core.Strapi, slug: string): Promise<any | null> {
    const cacheKey = `tenant:${slug}`;
    const cached = tenantCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
        return cached.tenant;
    }

    const tenant = await strapi.db.query('api::tenant.tenant').findOne({
        where: { slug },
    });

    if (tenant) {
        tenantCache.set(cacheKey, { tenant, expiry: Date.now() + CACHE_TTL });
    }

    return tenant;
}

/**
 * Get user's assigned tenant
 */
async function getUserTenant(strapi: Core.Strapi, userId: number): Promise<any | null> {
    const user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        userId,
        { populate: ['tenant'] as any }
    );
    return (user as any)?.tenant || null;
}

/**
 * Extract content type from API URL
 */
function getContentTypeFromUrl(url: string): string | null {
    const path = url.split('?')[0];
    const match = path.match(/^\/api\/([a-z-]+)/);
    if (!match) return null;

    const collectionName = match[1];

    const mapping: Record<string, string> = {
        'student-profiles': 'api::student-profile.student-profile',
        'teacher-profiles': 'api::teacher-profile.teacher-profile',
        'bireysel-egitim-planis': 'api::bireysel-egitim-plani.bireysel-egitim-plani',
        'kaba-degerlendirmes': 'api::kaba-degerlendirme.kaba-degerlendirme',
        'performans-kayits': 'api::performans-kayit.performans-kayit',
        'donem-sonu-degerlendirmes': 'api::donem-sonu-degerlendirme.donem-sonu-degerlendirme',
        'faturas': 'api::fatura.fatura',
        'rapors': 'api::rapor.rapor',
        'appointments': 'api::appointment.appointment',
        'attendance-logs': 'api::attendance-log.attendance-log',
        'schedules': 'api::schedule.schedule',
        'service-routes': 'api::service-route.service-route',
        'location-logs': 'api::location-log.location-log',
        'route-stops': 'api::route-stop.route-stop',
        'storage-files': 'api::storage-file.storage-file',
        'device-tokens': 'api::device-token.device-token',
    };

    return mapping[collectionName] || null;
}

/**
 * Invalidate tenant cache (call when tenant is updated)
 */
export function invalidateTenantCache(slug?: string): void {
    if (slug) {
        tenantCache.delete(`tenant:${slug}`);
    } else {
        tenantCache.clear();
    }
}
