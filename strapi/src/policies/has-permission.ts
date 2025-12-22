/**
 * Custom RBAC Policy: has-permission
 * Flexible permission checking based on action and resource
 * 
 * Usage in routes:
 * config: {
 *   policies: [
 *     { name: 'global::has-permission', config: { action: 'read', resource: 'student-profile' } }
 *   ]
 * }
 */

import type { Core } from '@strapi/strapi';

interface PermissionConfig {
    action: 'create' | 'read' | 'update' | 'delete' | 'manage';
    resource: string;
}

// Role hierarchy - higher roles include permissions of lower roles
const ROLE_HIERARCHY: Record<string, number> = {
    'super_admin': 100,
    'admin': 80,
    'teacher': 60,
    'therapist': 55,
    'driver': 40,
    'parent': 30,
    'student': 20,
    'public': 0,
};

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
    'super_admin': {
        '*': ['create', 'read', 'update', 'delete', 'manage'],
    },
    'admin': {
        '*': ['create', 'read', 'update', 'delete'],
        'user': ['create', 'read', 'update', 'delete', 'manage'],
        'student-profile': ['create', 'read', 'update', 'delete'],
        'teacher-profile': ['create', 'read', 'update', 'delete'],
        'schedule': ['create', 'read', 'update', 'delete'],
        'service-route': ['create', 'read', 'update', 'delete'],
        'attendance-log': ['create', 'read', 'update', 'delete'],
    },
    'teacher': {
        'student-profile': ['read', 'update'],
        'schedule': ['read', 'update'],
        'attendance-log': ['create', 'read'],
        'article': ['create', 'read', 'update'],
    },
    'therapist': {
        'student-profile': ['read', 'update'],
        'schedule': ['read', 'update'],
        'attendance-log': ['create', 'read'],
    },
    'driver': {
        'service-route': ['read'],
        'route-stop': ['read'],
        'location-log': ['create', 'read'],
        'student-profile': ['read'],
    },
    'parent': {
        'student-profile': ['read'], // Only their children
        'schedule': ['read'],
        'attendance-log': ['read'],
        'service-route': ['read'],
        'location-log': ['read'],
    },
    'student': {
        'schedule': ['read'],
        'attendance-log': ['read'],
    },
};

export default async (
    policyContext: any,
    config: PermissionConfig,
    { strapi }: { strapi: Core.Strapi }
) => {
    const user = policyContext.state?.user;

    // No user = no access
    if (!user) {
        return false;
    }

    const { action, resource } = config;

    if (!action || !resource) {
        strapi.log.error('has-permission policy requires action and resource config');
        return false;
    }

    const userRole = (user.role?.type || user.role?.name || 'public').toLowerCase();

    // Get permissions for user's role
    const rolePermissions = DEFAULT_PERMISSIONS[userRole] || {};

    // Check wildcard permissions first
    if (rolePermissions['*']?.includes(action) || rolePermissions['*']?.includes('manage')) {
        return true;
    }

    // Check specific resource permissions
    const resourcePermissions = rolePermissions[resource] || [];

    if (resourcePermissions.includes(action) || resourcePermissions.includes('manage')) {
        return true;
    }

    // Check if user has higher role that should have access
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;

    // Super admin and admin always have access
    if (userRoleLevel >= ROLE_HIERARCHY['admin']) {
        return true;
    }

    strapi.log.warn(
        `Permission denied: User ${user.id} (${userRole}) attempted ${action} on ${resource}`
    );

    return false;
};
