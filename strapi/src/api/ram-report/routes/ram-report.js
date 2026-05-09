'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::ram-report.ram-report');

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
    path: '/ram-reports/mebbis-sync',
    handler: 'ram-report.syncFromMebbis',
    config: {
      auth: false, // For testing
    },
  },
];

module.exports = customRouter(defaultRouter, myCustomRoutes);
