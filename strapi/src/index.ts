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
        const hasAdmin = await strapi.db.query('admin::user').count();

        if (hasAdmin === 0) {
          const superAdminRole = await strapi.db.query('admin::role').findOne({
            where: { code: 'strapi-super-admin' },
          });

          if (superAdminRole) {
            const password = process.env.STRAPI_ADMIN_PASSWORD || 'admin123';
            const email = process.env.STRAPI_ADMIN_EMAIL || 'admin@arkadas.com.tr';

            // Generate hash
            const hashedPassword = await strapi.admin.services.auth.hashPassword(password);

            // Create user
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
      } catch (error) {
        console.error('[Admin Seeder] Failed to seed admin user:', error);
      }
    }
  },
};
