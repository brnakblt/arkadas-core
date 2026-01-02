/**
 * Tenant Isolation Policy
 * 
 * Automatically injects tenant filter into all queries for protected content types.
 * Ensures complete data isolation between tenants.
 */

import type { Core } from '@strapi/strapi';

export default async (
    policyContext: any,
    _config: unknown,
    { strapi }: { strapi: Core.Strapi }
) => {
    const ctx = policyContext;
    const tenantId = ctx.state?.tenantId;

    if (!tenantId) {
        // No tenant in context - let other policies handle access
        return true;
    }

    // Inject tenant filter into query
    if (ctx.query) {
        const existingFilters = (ctx.query.filters as Record<string, unknown>) || {};

        ctx.query.filters = {
            ...existingFilters,
            tenant: {
                id: {
                    $eq: tenantId,
                },
            },
        };
    }

    // Store tenant ID for use in create operations
    ctx.state.autoTenantId = tenantId;

    strapi.log.debug(`Tenant isolation applied: tenant=${tenantId}`);

    return true;
};
