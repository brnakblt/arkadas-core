/**
 * Custom RBAC Policy: is-admin
 * Checks if user has admin or super_admin role
 */

import type { Core } from '@strapi/strapi';

export default (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
    const user = policyContext.state?.user;

    if (!user) {
        return false;
    }

    // Check if user has admin role
    const userRole = user.role?.type || user.role?.name;
    const adminRoles = ['super_admin', 'admin', 'administrator'];

    if (adminRoles.includes(userRole?.toLowerCase())) {
        return true;
    }

    strapi.log.warn(`User ${user.id} denied admin access. Role: ${userRole}`);
    return false;
};
