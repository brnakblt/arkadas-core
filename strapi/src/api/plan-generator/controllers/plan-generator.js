'use strict';

module.exports = {
    async generateBEP(ctx) {
        try {
            const { studentId, kabaDegerlendirmeId } = ctx.request.body;
            const result = await strapi.service('api::plan-generator.bep-generator').generate(studentId, kabaDegerlendirmeId);
            ctx.body = result;
        } catch (err) {
            ctx.badRequest('BEP generation failed', { moreDetails: err.message });
        }
    },

    async generateBOP(ctx) {
        try {
            const { bepId, startDate, period } = ctx.request.body;
            const result = await strapi.service('api::plan-generator.bop-generator').generate(bepId, startDate, period);
            ctx.body = result;
        } catch (err) {
            ctx.badRequest('BÖP generation failed', { moreDetails: err.message });
        }
    }
};
