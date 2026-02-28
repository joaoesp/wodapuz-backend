export default {
  routes: [
    {
      method: 'GET',
      path: '/un-comtrade/:iso3/:flow/partner/:partnerIso3/product/:hsCode',
      handler: 'un-comtrade.getProductHistory',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
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
      path: '/un-comtrade/:iso3/:flow/:year/energy/types',
      handler: 'un-comtrade.getEnergyTypeBreakdown',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/un-comtrade/:iso3/:flow/:year/energy/partner/:partnerIso3',
      handler: 'un-comtrade.getEnergyPartnerBreakdown',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/un-comtrade/:iso3/:flow/:year/energy/:hs4Code/partners',
      handler: 'un-comtrade.getEnergyTypePartners',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/un-comtrade/:iso3/:flow/:year/energy',
      handler: 'un-comtrade.getEnergyTradeData',
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
