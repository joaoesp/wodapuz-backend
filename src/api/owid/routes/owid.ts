export default {
  routes: [
    {
      method: 'GET',
      path: '/owid/energy/years/:startYear/:endYear',
      handler: 'owid.getEnergyByYear',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/owid/energy/country/:iso3',
      handler: 'owid.getCountryEnergy',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/owid/consumption/years/:startYear/:endYear',
      handler: 'owid.getConsumptionByYear',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/owid/consumption/country/:iso3',
      handler: 'owid.getCountryConsumption',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
