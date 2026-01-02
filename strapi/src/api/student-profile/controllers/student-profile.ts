/**
 * Student Profile Controller
 * 
 * SECURITY FIX: Override find method to enforce row-level security
 * Parents can only see their own children's profiles
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::student-profile.student-profile', ({ strapi }) => ({
    /**
     * Find student profiles with row-level security
     * 
     * SECURITY: When filterByParent flag is set by parent-owns-student policy,
     * enforce mandatory filter to only return records where parentGuardian matches the user
     */
    async find(ctx) {
        // Check if parent row-level filter should be applied
        if (ctx.state.filterByParent && ctx.state.parentUserId) {
            // SECURITY: Enforce mandatory filter for parent role
            // Merge with any existing filters from query
            const existingFilters = ctx.query.filters || {};

            ctx.query.filters = {
                ...existingFilters,
                parentGuardian: {
                    id: {
                        $eq: ctx.state.parentUserId,
                    },
                },
            };

            strapi.log.info(
                `RLS: Parent ${ctx.state.parentUserId} - filtering student-profiles to own children`
            );
        }

        // Call the default core controller find
        const { data, meta } = await super.find(ctx);

        return { data, meta };
    },

    /**
     * Find one student profile with row-level security
     * The parent-owns-student policy already handles single record access
     * This override adds additional logging
     */
    async findOne(ctx) {
        const { id } = ctx.params;
        const user = ctx.state.user;

        // Call the default core controller findOne
        const result = await super.findOne(ctx);

        // Log access for audit purposes
        if (user && result?.data) {
            const userRole = (user.role?.type || user.role?.name || 'public').toLowerCase();

            if (['admin', 'super_admin'].includes(userRole)) {
                try {
                    await strapi.db.query('api::audit-log.audit-log').create({
                        data: {
                            action: 'read',
                            entityType: 'student-profile',
                            entityId: String(id),
                            userId: user.id,
                            userRole: userRole,
                            ipAddress: ctx.request?.ip || 'unknown',
                            timestamp: new Date(),
                            success: true,
                        },
                    });
                } catch (error) {
                    strapi.log.error('Failed to create audit log for student-profile access:', error);
                }
            }
        }

        return result;
    },
}));
