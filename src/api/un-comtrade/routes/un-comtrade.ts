export default {
  routes: [
    {
      method: 'GET',
      path: '/un-comtrade/:iso3/:flow/:year/partner/:partnerIso3',
      handler: 'un-comtrade.getPartnerProducts',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
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
