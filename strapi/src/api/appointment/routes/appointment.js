'use strict';

/**
 * appointment router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::appointment.appointment', {
    config: {
        find: {
            policies: [],
        },
        findOne: {
            policies: [],
        },
        create: {
            policies: [],
        },
        update: {
            policies: [],
        },
        delete: {
            policies: [],
        },
    },
    only: ['find', 'findOne', 'create', 'update', 'delete'],
    // Custom routes should be in a separate file like `01-custom-appointment.js` 
    // or added via `routes/custom.js` if sticking to FS API.
    // But mixing them in `routes/appointment.js` via spread usually works IF `defaultRouter` is instantiated.
    // However, let's just export the default router first to see if it boots.
});

