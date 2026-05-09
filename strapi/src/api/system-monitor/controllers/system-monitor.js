'use strict';

/**
 * A set of functions called "actions" for `system-monitor`
 */

module.exports = {
    getStats: async (ctx, next) => {
        try {
            const data = await strapi.service('api::system-monitor.system-monitor').getStats();
            ctx.body = data;
        } catch (err) {
            ctx.body = err;
        }
    },

    getHealth: async (ctx, next) => {
        try {
            const data = await strapi.service('api::system-monitor.system-monitor').getHealth();
            ctx.body = data;
        } catch (err) {
            ctx.body = err;
        }
    }
};
