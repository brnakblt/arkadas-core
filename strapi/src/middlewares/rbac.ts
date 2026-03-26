/**
 * RBAC Middleware
 * Adds user role info to context and injects tenant filter at the query level.
 *
 * Data isolation strategy:
 *   - Tenant scoping: injected into ctx.query.filters BEFORE Strapi processes the request
 *   - Row-level filtering (parent→student, driver→route): handled by dedicated policies
 *     (parent-owns-student.ts, is-driver.ts)
 */

import type { Strapi } from '@strapi/strapi';

const TENANT_ID_PATTERN = /^[a-z0-9_-]+$/;

export default (config: any, { strapi }: { strapi: Strapi }) => {
    return async (ctx: any, next: () => Promise<void>) => {
        const user = ctx.state?.user;

        if (user) {
            // Add role info to context for easy access
            const userRole = user.role?.type || user.role?.name || 'authenticated';
            ctx.state.userRole = userRole.toLowerCase();
            ctx.state.isAdmin = ['super_admin', 'admin', 'administrator'].includes(ctx.state.userRole);
            ctx.state.isTeacher = ['super_admin', 'admin', 'teacher'].includes(ctx.state.userRole);
            ctx.state.isParent = ['super_admin', 'admin', 'parent', 'veli'].includes(ctx.state.userRole);
            ctx.state.isDriver = ['super_admin', 'admin', 'driver', 'şoför'].includes(ctx.state.userRole);

            // --- Tenant Isolation (DB-Level) ---
            const tenantId = ctx.request?.header?.['x-tenant-id'];

            if (tenantId && TENANT_ID_PATTERN.test(tenantId)) {
                ctx.state.tenantId = tenantId;

                // Inject tenant filter into Strapi query engine (pre-fetch, not post-fetch)
                if (!ctx.query) {
                    ctx.query = {};
                }
                if (ctx.query.filters && typeof ctx.query.filters === 'object') {
                    ctx.query.filters = { ...ctx.query.filters, tenant: tenantId };
                } else {
                    ctx.query.filters = { tenant: tenantId };
                }

                strapi.log.debug(
                    `[RBAC] Tenant filter injected: ${tenantId} for user ${user.id} (${ctx.state.userRole})`
                );
            }

            // Log access for auditing
            strapi.log.debug(
                `[RBAC] User ${user.id} (${ctx.state.userRole}) accessing ${ctx.request.method} ${ctx.request.url}`
            );
        }

        await next();
    };
};

