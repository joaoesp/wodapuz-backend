export default {
  routes: [
    {
      method: 'GET',
      path: '/un-comtrade/:iso3/:flow/:year',
      handler: 'un-comtrade.getTradeData',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
