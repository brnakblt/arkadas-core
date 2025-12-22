'use strict';

/**
 * appointment router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::appointment.appointment');

const customRoutes = {
    routes: [
        {
            method: 'GET',
            path: '/appointments/mine',
            handler: 'appointment.findMine',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/appointments/available-slots',
            handler: 'appointment.getAvailableSlots',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/appointments/book',
            handler: 'appointment.book',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/appointments/:id/cancel',
            handler: 'appointment.cancel',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/appointments/:id/confirm',
            handler: 'appointment.confirm',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};

module.exports = {
    routes: [...defaultRouter.routes, ...customRoutes.routes],
};
