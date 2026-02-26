export default {
  routes: [
    {
      method: 'GET',
      path: '/gfp/rankings',
      handler: 'gfp.getRankings',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/gfp/country/:iso3',
      handler: 'gfp.getCountryDetail',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
