/**
 * Custom public routes for tenant
 * These routes bypass authentication for login screen usage
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/tenants/public',
            handler: 'tenant.findPublic',
            config: {
                auth: false, // No authentication required
                policies: [],
                middlewares: [],
            },
        },
    ],
};
