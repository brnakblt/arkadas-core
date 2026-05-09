export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/2fa/setup',
      handler: 'api::two-factor-auth.two-factor-auth.setup',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/2fa/verify',
      handler: 'api::two-factor-auth.two-factor-auth.verify',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/2fa/disable',
      handler: 'api::two-factor-auth.two-factor-auth.disable',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
