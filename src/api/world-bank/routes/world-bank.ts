export default {
  routes: [
    {
      method: 'GET',
      path: '/world-bank/:indicator/years/:startYear/:endYear',
      handler: 'world-bank.getIndicatorYearRange',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
