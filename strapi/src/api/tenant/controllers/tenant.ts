/**
 * tenant controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::tenant.tenant', ({ strapi }) => ({
    /**
     * Public endpoint to list tenants for login screen
     * Only returns id and name - no sensitive data
     */
    async findPublic(ctx) {
        try {
            const tenants = await strapi.entityService.findMany('api::tenant.tenant', {
                fields: ['id', 'name'],
                sort: { name: 'asc' },
            });

            ctx.body = {
                data: (tenants as Array<{ id: string | number; name?: string }>).map((tenant) => ({
                    id: tenant.id,
                    name: tenant.name || '',
                })),
            };
        } catch (error) {
            ctx.throw(500, 'Failed to fetch tenants');
        }
    },
}));

