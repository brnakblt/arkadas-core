export default {
  routes: [
    {
      method: 'POST',
      path: '/mebbis-compliance/validate-lesson',
      handler: 'mebbis-compliance.validateLesson',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/mebbis-compliance/validate-compensation',
      handler: 'mebbis-compliance.validateCompensation',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/mebbis-compliance/calculate-fee-increase',
      handler: 'mebbis-compliance.calculateFeeIncrease',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
