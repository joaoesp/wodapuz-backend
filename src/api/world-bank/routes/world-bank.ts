export default {
  routes: [
    {
      method: 'GET',
      path: '/world-bank/gdp',
      handler: 'world-bank.getGDP',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/world-bank/gdp/years/:startYear/:endYear',
      handler: 'world-bank.getGDPYearRange',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/world-bank/gdp/:countryCode',
      handler: 'world-bank.getCountryGDP',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
