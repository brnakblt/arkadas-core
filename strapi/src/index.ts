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

        // 2. Set Public Permissions for all core content types
        const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'public' },
        });

        if (publicRole) {
          const coreApis = [
            'api::hero.hero',
            'api::service.service',
            'api::about.about',
            'api::process.process',
            'api::faq.faq',
            'api::gallery.gallery',
            'api::article.article',
            'api::category.category',
            'api::author.author',
            'api::attendance-log.attendance-log'
          ];

          for (const api of coreApis) {
            // Enable find and findOne for public role
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: `${api}.find`,
                role: publicRole.id,
              },
            }).catch(() => { }); // Ignore duplicates

            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: `${api}.findOne`,
                role: publicRole.id,
              },
            }).catch(() => { }); // Ignore duplicates
          }

          // Enable create for authenticated role for attendance
          const authRole = await strapi.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' },
          });
          if (authRole) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action: 'api::attendance-log.attendance-log.create',
                role: authRole.id,
              },
            }).catch(() => { });
          }
          console.log('[Permission Seeder] Public permissions and Auth Create enabled.');
        }

      } catch (error) {
        console.error('[Bootstrap] Error:', error);
      }
    }
  },
};
