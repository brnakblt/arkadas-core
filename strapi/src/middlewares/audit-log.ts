/**
 * Audit Log Middleware
 * Logs all data modifications for compliance and debugging
 */

import type { Core } from '@strapi/strapi';

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
    return async (ctx: any, next: () => Promise<void>) => {
        const startTime = Date.now();
        const { method, url } = ctx.request;
        const user = ctx.state?.user;

        // Only log mutations (POST, PUT, DELETE)
        const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        await next();

        if (shouldLog) {
            const duration = Date.now() - startTime;
            const status = ctx.response.status;

            const logEntry = {
                timestamp: new Date().toISOString(),
                userId: user?.id || 'anonymous',
                userEmail: user?.email || 'anonymous',
                userRole: ctx.state?.userRole || 'unknown',
                method,
                url,
                status,
                duration: `${duration}ms`,
                ip: ctx.request.ip,
                userAgent: ctx.request.headers['user-agent']?.substring(0, 100),
            };

            // Log to console (can be extended to database or external service)
            if (status >= 400) {
                strapi.log.warn('[AUDIT] Failed operation:', logEntry);
            } else {
                strapi.log.info('[AUDIT] Success:', JSON.stringify(logEntry));
            }
        }
    };
};
