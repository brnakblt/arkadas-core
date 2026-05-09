'use strict';

module.exports = {
    async check(ctx) {
        try {
            const { studentId } = ctx.request.query;
            if (!studentId) return ctx.badRequest('studentId is required');

            const issues = await strapi.service('api::consistency-check.consistency-check').validateStudent(studentId);
            ctx.body = { valid: issues.length === 0, issues };
        } catch (err) {
            ctx.badRequest('Consistency check failed', { moreDetails: err.message });
        }
    }
};
