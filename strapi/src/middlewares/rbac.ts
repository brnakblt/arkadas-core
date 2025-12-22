/**
 * RBAC Middleware
 * Adds user role info to context and filters data based on ownership
 */

import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
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

            // Log access for auditing
            strapi.log.debug(
                `[RBAC] User ${user.id} (${ctx.state.userRole}) accessing ${ctx.request.method} ${ctx.request.url}`
            );
        }

        await next();

        // Post-processing: Filter data for non-admin users
        if (user && !ctx.state.isAdmin && ctx.response.body?.data) {
            // For parents: filter to only show their children's data
            if (ctx.state.isParent && ctx.request.url.includes('student-profile')) {
                const data = ctx.response.body.data;
                if (Array.isArray(data)) {
                    ctx.response.body.data = data.filter((item: any) => {
                        const parentId = item.attributes?.parentGuardian?.data?.id || item.parentGuardian?.id;
                        return parentId === user.id;
                    });
                }
            }

            // For drivers: filter to only show assigned routes
            if (ctx.state.isDriver && ctx.request.url.includes('service-route')) {
                const data = ctx.response.body.data;
                if (Array.isArray(data)) {
                    ctx.response.body.data = data.filter((item: any) => {
                        const driverId = item.attributes?.driver?.data?.id || item.driver?.id;
                        const assistantId = item.attributes?.assistant?.data?.id || item.assistant?.id;
                        return driverId === user.id || assistantId === user.id;
                    });
                }
            }
        }
    };
};
