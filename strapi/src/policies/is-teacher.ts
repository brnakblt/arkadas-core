/**
 * Custom RBAC Policy: is-teacher
 * Checks if user has teacher role
 */

import type { Core } from '@strapi/strapi';

export default (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
    const user = policyContext.state?.user;

    if (!user) {
        return false;
    }

    const userRole = user.role?.type || user.role?.name;
    const teacherRoles = ['super_admin', 'admin', 'teacher', 'öğretmen'];

    if (teacherRoles.includes(userRole?.toLowerCase())) {
        return true;
    }

    strapi.log.warn(`User ${user.id} denied teacher access. Role: ${userRole}`);
    return false;
};
