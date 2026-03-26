/**
 * Bootstrap
 */

import type { Core } from '@strapi/strapi';

export default {
  register(/*{ strapi }*/) {
    // Registration phase
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // --- Admin Seeding (Development Only) ---
    if (process.env.NODE_ENV === 'development') {
      try {
        // 1. Check/Create Admin User
        const hasAdmin = await strapi.db.query('admin::user').count();
        if (hasAdmin === 0) {
          const superAdminRole = await strapi.db.query('admin::role').findOne({ where: { code: 'strapi-super-admin' } });
          if (superAdminRole) {
            const password = process.env.STRAPI_ADMIN_PASSWORD || 'admin123';
            const email = process.env.STRAPI_ADMIN_EMAIL || 'admin@arkadas.com.tr';
            const hashedPassword = await strapi.admin.services.auth.hashPassword(password);

            await strapi.db.query('admin::user').create({
              data: {
                username: 'admin',
                email: email,
                password: hashedPassword,
                firstname: 'Admin',
                lastname: 'User',
                isActive: true,
                blocked: false,
                roles: [superAdminRole.id],
              },
            });
            console.log(`[Admin Seeder] Created admin user: ${email} / ${password}`);
          }
        }

        // 2. Set Public/Authenticated Permissions for new Content Types
        const roles = await strapi.plugin('users-permissions').service('role').find();

        const authenticatedRole = roles.find((r: any) => r.type === 'authenticated');
        const publicRole = roles.find((r: any) => r.type === 'public');

        if (authenticatedRole) {
          const permissionUpdates: any = {};

          // Enable find/findOne for student and personnel
          ['student', 'personnel'].forEach(api => {
            permissionUpdates[`api::${api}.${api}`] = {
              controllers: {
                [api]: {
                  find: { enabled: true },
                  findOne: { enabled: true },
                }
              }
            };
          });

          // This part involves complex plugin service calls usually, 
          // but for now logging reminder is safer than potentially breaking boot with incorrect service calls
          console.log('[Permission Seeder] Reminder: Ensure "Authenticated" role has find/findOne for Student and Personnel via Admin Panel or extended script.');
        }

      } catch (error) {
        console.error('[Bootstrap] Error:', error);
      }
    }
  },
};
