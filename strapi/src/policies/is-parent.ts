/**
 * Custom RBAC Policy: is-parent
 * Checks if user has parent/guardian role
 */

import type { Core } from '@strapi/strapi';

export default (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
    const user = policyContext.state?.user;

    if (!user) {
        return false;
    }

    const userRole = user.role?.type || user.role?.name;
    const parentRoles = ['super_admin', 'admin', 'parent', 'veli', 'guardian'];

    if (parentRoles.includes(userRole?.toLowerCase())) {
        return true;
    }

    strapi.log.warn(`User ${user.id} denied parent access. Role: ${userRole}`);
    return false;
};
