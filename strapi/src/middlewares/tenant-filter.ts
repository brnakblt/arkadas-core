/**
 * Tenant Filter Middleware
 * 
 * Automatically filters all API requests by the authenticated user's tenant.
 * This ensures complete data isolation between tenants.
 */

import type { Core } from '@strapi/strapi';

// Content types that should be filtered by tenant
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
];

// Content types that are public (no tenant filtering)
const PUBLIC_TYPES = [
    'api::tenant.tenant',
    'api::about.about',
    'api::article.article',
    'api::faq.faq',
    'api::hero.hero',
    'api::global.global',
];

export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
    return async (ctx: any, next: () => Promise<void>) => {
        // Skip for non-API routes
        if (!ctx.request.url.startsWith('/api/')) {
            return next();
        }

        // Skip for public routes (auth, tenants list for login)
        if (
            ctx.request.url.startsWith('/api/auth') ||
            ctx.request.url === '/api/tenants' ||
            ctx.request.url.startsWith('/api/tenants?')
        ) {
            return next();
        }

        // Get authenticated user
        const user = ctx.state?.user;

        if (!user) {
            // No user = public request, let Strapi handle permissions
            return next();
        }

        // Get user's tenant
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let userTenant = (user as any).tenant;

        // If tenant is not populated, fetch it
        if (!userTenant && user.id) {
            const fullUser = await strapi.entityService.findOne(
                'plugin::users-permissions.user',
                user.id,
                { populate: ['tenant'] as any }
            );
            userTenant = (fullUser as any)?.tenant;
        }

        // Store tenant in context for use in controllers
        ctx.state.tenant = userTenant;

        // If user has no tenant, deny access to tenant-filtered content
        if (!userTenant) {
            // Check if this is a tenant-filtered content type
            const contentType = getContentTypeFromUrl(ctx.request.url);
            if (contentType && TENANT_FILTERED_TYPES.includes(contentType)) {
                ctx.status = 403;
                ctx.body = { error: 'User must belong to a tenant to access this resource' };
                return;
            }
        }

        await next();
    };
};

/**
 * Extract content type from API URL
 */
function getContentTypeFromUrl(url: string): string | null {
    // Remove query params
    const path = url.split('?')[0];

    // Match /api/{collection-name}
    const match = path.match(/^\/api\/([a-z-]+)/);
    if (!match) return null;

    const collectionName = match[1];

    // Map URL collection names to content type UIDs
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
    };

    return mapping[collectionName] || null;
}
