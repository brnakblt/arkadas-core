'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ram-report.ram-report', ({ strapi }) => ({
    async syncFromMebbis(ctx) {
        const { tckn } = ctx.query;
        if (!tckn) return ctx.badRequest('TCKN is required');

        try {
            const data = await strapi.service('api::ram-report.mebbis-sync').pullStudentFromMebbis(tckn);
            return { success: true, data };
        } catch (error) {
            return ctx.internalServerError(`Sync failed: ${error.message}`);
        }
    }
}));
