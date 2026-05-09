
export default {
  routes: [
    {
      method: 'GET',
      path: '/mobile/dashboard',
      handler: 'mobile.dashboard',
      config: {
        auth: false, // For testing
      },
    },
    {
      method: 'GET',
      path: '/mobile/student/:id',
      handler: 'mobile.studentProfile',
      config: {
        auth: false, // For testing
      },
    }
  ],
};
