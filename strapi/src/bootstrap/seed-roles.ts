/**
 * Bootstrap ERP Roles
 * Seeds default roles on first startup
 */

import type { Core } from '@strapi/strapi';

const DEFAULT_ROLES = [
    {
        name: 'super_admin',
        displayName: 'Süper Yönetici',
        description: 'Tüm sistem yetkilerine sahip',
        level: 100,
        isSystem: true,
        permissions: {
            '*': ['create', 'read', 'update', 'delete', 'manage'],
        },
    },
    {
        name: 'admin',
        displayName: 'Yönetici',
        description: 'Kurum yönetim yetkileri',
        level: 80,
        isSystem: true,
        permissions: {
            'user': ['create', 'read', 'update', 'delete'],
            'student-profile': ['create', 'read', 'update', 'delete'],
            'teacher-profile': ['create', 'read', 'update', 'delete'],
            'schedule': ['create', 'read', 'update', 'delete'],
            'service-route': ['create', 'read', 'update', 'delete'],
            'attendance-log': ['create', 'read', 'update', 'delete'],
        },
    },
    {
        name: 'teacher',
        displayName: 'Öğretmen',
        description: 'Öğretmen yetkileri',
        level: 60,
        isSystem: true,
        permissions: {
            'student-profile': ['read', 'update'],
            'schedule': ['read', 'update'],
            'attendance-log': ['create', 'read'],
        },
    },
    {
        name: 'therapist',
        displayName: 'Terapist',
        description: 'Terapist yetkileri',
        level: 55,
        isSystem: true,
        permissions: {
            'student-profile': ['read', 'update'],
            'schedule': ['read', 'update'],
            'attendance-log': ['create', 'read'],
        },
    },
    {
        name: 'driver',
        displayName: 'Şoför',
        description: 'Servis şoförü yetkileri',
        level: 40,
        isSystem: true,
        permissions: {
            'service-route': ['read'],
            'route-stop': ['read'],
            'location-log': ['create', 'read'],
            'student-profile': ['read'],
        },
    },
    {
        name: 'parent',
        displayName: 'Veli',
        description: 'Veli yetkileri - sadece kendi çocukları',
        level: 30,
        isSystem: true,
        permissions: {
            'student-profile': ['read'],
            'schedule': ['read'],
            'attendance-log': ['read'],
            'service-route': ['read'],
            'location-log': ['read'],
        },
    },
    {
        name: 'student',
        displayName: 'Öğrenci',
        description: 'Öğrenci yetkileri',
        level: 20,
        isSystem: true,
        permissions: {
            'schedule': ['read'],
            'attendance-log': ['read'],
        },
    },
];

export async function seedErpRoles(strapi: Core.Strapi) {
    const existingRoles = await strapi.db.query('api::erp-role.erp-role').findMany();

    if (existingRoles.length > 0) {
        strapi.log.info(`[RBAC] Found ${existingRoles.length} existing ERP roles, skipping seed`);
        return;
    }

    strapi.log.info('[RBAC] Seeding default ERP roles...');

    for (const role of DEFAULT_ROLES) {
        try {
            await strapi.db.query('api::erp-role.erp-role').create({
                data: role,
            });
            strapi.log.info(`[RBAC] Created role: ${role.displayName}`);
        } catch (error) {
            strapi.log.error(`[RBAC] Failed to create role ${role.name}:`, error);
        }
    }

    strapi.log.info('[RBAC] Default ERP roles seeded successfully');
}

export default seedErpRoles;
