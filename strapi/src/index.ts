/**
 * Tenant Isolation Bootstrap
 * 
 * Automatically injects tenant filter into all database queries.
 * This provides Row-Level Security (RLS) for multi-tenant data isolation.
 */

import type { Core } from '@strapi/strapi';

// Content types that require tenant filtering
const TENANT_FILTERED_TYPES = [
  'api::student-profile.student-profile',
  'api::teacher-profile.teacher-profile',
  'api::bireysel-egitim-plani.bireysel-egitim-plani',
  'api::kaba-degerlendirme.kaba-degerlendirme',
  'api::performans-kayit.performans-kayit',
  'api::donem-sonu-degerlendirme.donem-sonu-degerlendirme',
  'api::fatura.fatura',
  'api::rapor.rapor',
  'api::appointment.appointment',
  'api::attendance-log.attendance-log',
  'api::schedule.schedule',
  'api::service-route.service-route',
  'api::location-log.location-log',
  'api::route-stop.route-stop',
];

export default {
  register(/*{ strapi }*/) {
    // Registration phase
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Subscribe to lifecycle events for tenant-filtered content types
    for (const contentType of TENANT_FILTERED_TYPES) {
      if (!strapi.contentTypes[contentType]) {
        console.warn(`[Tenant Isolation] Content type ${contentType} not found, skipping...`);
        continue;
      }

      strapi.db.lifecycles.subscribe({
        models: [contentType],

        // Before creating, auto-assign tenant from context
        async beforeCreate(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const data = params.data as Record<string, unknown>;
            if (!data.tenant) {
              data.tenant = ctx.state.tenant.id || ctx.state.tenant;
            }
          }
        },

        // Before finding, add tenant filter
        async beforeFindMany(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;
            const p = params as Record<string, unknown>;
            if (!p.where) {
              p.where = {};
            }
            (p.where as Record<string, unknown>).tenant = tenantId;
          }
        },

        async beforeFindOne(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;
            const p = params as Record<string, unknown>;
            if (!p.where) {
              p.where = {};
            }
            (p.where as Record<string, unknown>).tenant = tenantId;
          }
        },

        // Before update, verify tenant ownership
        async beforeUpdate(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;
            const p = params as Record<string, unknown>;
            if (!p.where) {
              p.where = {};
            }
            (p.where as Record<string, unknown>).tenant = tenantId;
          }
        },

        // Before delete, verify tenant ownership
        async beforeDelete(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;
            const p = params as Record<string, unknown>;
            if (!p.where) {
              p.where = {};
            }
            (p.where as Record<string, unknown>).tenant = tenantId;
          }
        },
      });
    }

    console.log('[Tenant Isolation] Row-level security enabled for', TENANT_FILTERED_TYPES.length, 'content types');

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
