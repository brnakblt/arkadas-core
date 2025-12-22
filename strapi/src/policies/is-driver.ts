/**
 * Custom RBAC Policy: is-driver
 * Checks if user has driver role (for service bus tracking)
 */

import type { Core } from '@strapi/strapi';

export default (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
    const user = policyContext.state?.user;

    if (!user) {
        return false;
    }

    const userRole = user.role?.type || user.role?.name;
    const driverRoles = ['super_admin', 'admin', 'driver', 'şoför', 'sürücü'];

    if (driverRoles.includes(userRole?.toLowerCase())) {
        return true;
    }

    strapi.log.warn(`User ${user.id} denied driver access. Role: ${userRole}`);
    return false;
};
