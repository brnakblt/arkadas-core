/**
 * Tenant Isolation Bootstrap
 * 
 * Automatically injects tenant filter into all database queries.
 * This provides Row-Level Security (RLS) for multi-tenant data isolation.
 * 
 * How it works:
 * 1. Before any find/findMany, adds filters.tenant = user's tenant
 * 2. Before any create, sets data.tenant = user's tenant
 * 3. Before any update/delete, validates ownership
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
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/*{ strapi }*/) {
    // Registration phase
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Subscribe to lifecycle events for tenant-filtered content types
    for (const contentType of TENANT_FILTERED_TYPES) {
      // Check if content type exists
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
            // Set tenant on the data being created
            if (!params.data.tenant) {
              params.data.tenant = ctx.state.tenant.id || ctx.state.tenant;
            }
          }
        },

        // Before finding, add tenant filter
        async beforeFindMany(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;

            // Add tenant filter to the query
            if (!params.filters) {
              params.filters = {};
            }

            // Ensure tenant filter is applied
            params.filters.tenant = tenantId;
          }
        },

        async beforeFindOne(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;

            if (!params.filters) {
              params.filters = {};
            }
            params.filters.tenant = tenantId;
          }
        },

        // Before update, verify tenant ownership
        async beforeUpdate(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;

            if (!params.filters) {
              params.filters = {};
            }
            params.filters.tenant = tenantId;
          }
        },

        // Before delete, verify tenant ownership
        async beforeDelete(event) {
          const { params } = event;
          const ctx = strapi.requestContext.get();

          if (ctx?.state?.tenant) {
            const tenantId = ctx.state.tenant.id || ctx.state.tenant;

            if (!params.filters) {
              params.filters = {};
            }
            params.filters.tenant = tenantId;
          }
        },
      });
    }

    console.log('[Tenant Isolation] Row-level security enabled for', TENANT_FILTERED_TYPES.length, 'content types');
  },
};
