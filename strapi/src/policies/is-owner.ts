/**
 * Custom RBAC Policy: is-owner
 * Checks if user owns the resource or is admin
 * 
 * Usage in routes:
 * config: {
 *   policies: [
 *     { name: 'global::is-owner', config: { ownerField: 'user' } }
 *   ]
 * }
 */

import type { Core } from '@strapi/strapi';

interface OwnerConfig {
    ownerField?: string; // Default: 'user'
    allowAdmin?: boolean; // Default: true
}

export default async (
    policyContext: any,
    config: OwnerConfig,
    { strapi }: { strapi: Core.Strapi }
) => {
    const user = policyContext.state?.user;

    if (!user) {
        return false;
    }

    const { ownerField = 'user', allowAdmin = true } = config;

    // Admins can access all resources
    if (allowAdmin) {
        const userRole = (user.role?.type || user.role?.name || '').toLowerCase();
        if (['super_admin', 'admin', 'administrator'].includes(userRole)) {
            return true;
        }
    }

    // For find/findOne - check query params
    const { params, query } = policyContext;

    // For single resource access (findOne, update, delete)
    if (params?.id) {
        const contentType = policyContext.state?.route?.info?.apiName;

        if (contentType) {
            try {
                const entity = await strapi.db.query(`api::${contentType}.${contentType}`).findOne({
                    where: { id: params.id },
                    populate: [ownerField],
                });

                if (!entity) {
                    return false; // Resource not found
                }

                const ownerId = entity[ownerField]?.id || entity[ownerField];

                if (ownerId === user.id) {
                    return true;
                }
            } catch (error) {
                strapi.log.error('is-owner policy error:', error);
                return false;
            }
        }
    }

    // For list operations - filter will be applied by middleware
    // Allow access but data will be filtered
    if (policyContext.request?.method === 'GET' && !params?.id) {
        return true;
    }

    strapi.log.warn(`Owner check failed: User ${user.id} is not owner of resource ${params?.id}`);
    return false;
};
