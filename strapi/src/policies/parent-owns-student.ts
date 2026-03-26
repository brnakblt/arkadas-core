/**
 * Row-Level Security Policy: parent-owns-student
 * Ensures parents can only access student-profile records where they are the guardian
 * 
 * Usage in routes:
 * config: {
 *   policies: ['global::parent-owns-student']
 * }
 */

import type { Strapi } from '@strapi/strapi';

export default async (
    policyContext: any,
    _config: unknown,
    { strapi }: { strapi: Strapi }
) => {
    const user = policyContext.state?.user;
    const ctx = policyContext;

    // No user = no access
    if (!user) {
        return false;
    }

    const userRole = (user.role?.type || user.role?.name || 'public').toLowerCase();

    // Only apply this policy to parent role
    if (userRole !== 'parent') {
        return true; // Other roles go through normal permission checks
    }

    // Get the requested student profile ID from params
    const requestedId = ctx.params?.id || ctx.params?.documentId;

    if (!requestedId) {
        // For list operations, we need to filter results instead of blocking
        // This is handled by modifying the query in the controller/service
        // Store a flag for the controller to use
        ctx.state.filterByParent = true;
        ctx.state.parentUserId = user.id;
        return true;
    }

    try {
        // Fetch the student profile with parentGuardian relation
        const studentProfile = await strapi.db.query('api::student-profile.student-profile').findOne({
            where: { id: requestedId },
            populate: ['parentGuardian'],
        });

        if (!studentProfile) {
            strapi.log.warn(`Parent ${user.id} attempted to access non-existent student profile ${requestedId}`);
            return false;
        }

        // Check if the requesting user is the parent/guardian
        const guardianId = studentProfile.parentGuardian?.id;

        if (guardianId !== user.id) {
            strapi.log.warn(
                `Row-level security blocked: Parent ${user.id} attempted to access student ${requestedId} (guardian: ${guardianId})`
            );

            // Log to audit
            try {
                await strapi.db.query('api::audit-log.audit-log').create({
                    data: {
                        action: 'unauthorized_access_attempt',
                        entityType: 'student-profile',
                        entityId: String(requestedId),
                        userId: user.id,
                        userRole: userRole,
                        ipAddress: ctx.request?.ip || 'unknown',
                        status: 'blocked',
                        details: `Parent attempted to access another parent's child`,
                        timestamp: new Date(),
                    },
                });
            } catch (error) {
                strapi.log.error('Failed to log unauthorized access attempt:', error);
            }

            return false;
        }

        return true;
    } catch (error) {
        strapi.log.error('Error in parent-owns-student policy:', error);
        return false;
    }
};
