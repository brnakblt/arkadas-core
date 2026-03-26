/**
 * Custom RBAC Policy: has-permission
 * Dynamic permission checking that merges:
 * 1. Hardcoded DEFAULT_PERMISSIONS (base)
 * 2. Dynamic permissions from erp-role content type (override)
 * 
 * Usage in routes:
 * config: {
 *   policies: [
 *     { name: 'global::has-permission', config: { action: 'read', resource: 'student-profile' } }
 *   ]
 * }
 */

import type { Strapi } from '@strapi/strapi';

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

// Default permissions by role (base layer)
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
        'student-profile': ['read'], // Row-level filter applied via parent-owns-student policy
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

// Cache for dynamic permissions (TTL: 5 minutes)
const permissionCache = new Map<string, { permissions: Record<string, string[]>; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and merge dynamic permissions from erp-role content type
 */
async function getMergedPermissions(
    strapi: Strapi,
    roleName: string
): Promise<Record<string, string[]>> {
    const cacheKey = `role:${roleName}`;
    const cached = permissionCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
        return cached.permissions;
    }

    // Start with default permissions
    const basePermissions = { ...DEFAULT_PERMISSIONS[roleName] };

    try {
        // Fetch dynamic role from erp-role content type
        const dynamicRole = await strapi.db.query('api::erp-role.erp-role').findOne({
            where: { name: roleName },
        });

        if (dynamicRole?.permissions && typeof dynamicRole.permissions === 'object') {
            // Merge: dynamic permissions override base permissions
            for (const [resource, actions] of Object.entries(dynamicRole.permissions)) {
                if (Array.isArray(actions)) {
                    // Merge actions (union of base + dynamic)
                    const existing = basePermissions[resource] || [];
                    basePermissions[resource] = [...new Set([...existing, ...actions])];
                }
            }
        }
    } catch (error) {
        strapi.log.warn(`Failed to fetch dynamic permissions for role ${roleName}:`, error);
    }

    // Cache the merged permissions
    permissionCache.set(cacheKey, {
        permissions: basePermissions,
        expiry: Date.now() + CACHE_TTL,
    });

    return basePermissions;
}

/**
 * Log permission check to audit-log
 */
async function logPermissionCheck(
    strapi: Strapi,
    userId: number,
    role: string,
    action: string,
    resource: string,
    granted: boolean,
    ipAddress?: string
): Promise<void> {
    try {
        // Only log denied attempts and admin/sensitive actions
        const shouldLog = !granted ||
            ['admin', 'super_admin'].includes(role) ||
            ['delete', 'manage'].includes(action);

        if (shouldLog) {
            await strapi.db.query('api::audit-log.audit-log').create({
                data: {
                    action: `${action}:${resource}`,
                    entityType: resource,
                    userId: userId,
                    userRole: role,
                    ipAddress: ipAddress || 'unknown',
                    status: granted ? 'granted' : 'denied',
                    timestamp: new Date(),
                },
            });
        }
    } catch (error) {
        // Don't fail the request if audit logging fails
        strapi.log.error('Failed to create audit log:', error);
    }
}

export default async (
    policyContext: any,
    config: PermissionConfig,
    { strapi }: { strapi: Strapi }
) => {
    const user = policyContext.state?.user;
    const ctx = policyContext;

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
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
    const ipAddress = ctx.request?.ip || ctx.req?.socket?.remoteAddress;

    // Get merged permissions (static + dynamic)
    const rolePermissions = await getMergedPermissions(strapi, userRole);

    let granted = false;

    // Check wildcard permissions first
    if (rolePermissions['*']?.includes(action) || rolePermissions['*']?.includes('manage')) {
        granted = true;
    }

    // Check specific resource permissions
    if (!granted) {
        const resourcePermissions = rolePermissions[resource] || [];
        if (resourcePermissions.includes(action) || resourcePermissions.includes('manage')) {
            granted = true;
        }
    }

    // REMOVED: Unconditional admin bypass
    // Admin permissions must now be explicitly defined in DEFAULT_PERMISSIONS or erp-role
    // This ensures all admin actions go through permission checks and are logged

    // Log the permission check
    await logPermissionCheck(strapi, user.id, userRole, action, resource, granted, ipAddress);

    if (!granted) {
        strapi.log.warn(
            `Permission denied: User ${user.id} (${userRole}) attempted ${action} on ${resource}`
        );
    }

    return granted;
};

/**
 * Invalidate permission cache for a specific role
 * Call this when erp-role is updated
 */
export function invalidateRoleCache(roleName?: string): void {
    if (roleName) {
        permissionCache.delete(`role:${roleName}`);
    } else {
        permissionCache.clear();
    }
}
