'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::session-plan.session-plan');

const customRouter = (innerRouter, customRoutes = []) => {
  return {
    get prefix() {
      return innerRouter.prefix;
    },
    get routes() {
      return [...customRoutes, ...innerRouter.routes];
    },
  };
};

const myCustomRoutes = [
  {
    method: 'GET',
    path: '/session-plans/export',
    handler: 'session-plan.exportExcel',
    config: {
      auth: false, // For public testing, normally true
    },
  },
];

module.exports = customRouter(defaultRouter, myCustomRoutes);
