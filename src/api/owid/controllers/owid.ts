export default {
  async getEnergyByYear(ctx) {
    try {
      const { startYear, endYear } = ctx.params;
      const data = await strapi
        .service('api::owid.owid')
        .getEnergyByYear(parseInt(startYear), parseInt(endYear));
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getConsumptionByYear(ctx) {
    try {
      const { startYear, endYear } = ctx.params;
      const data = await strapi
        .service('api::owid.owid')
        .getConsumptionByYear(parseInt(startYear), parseInt(endYear));
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getCountryConsumption(ctx) {
    try {
      const { iso3 } = ctx.params;
      const data = await strapi
        .service('api::owid.owid')
        .getCountryConsumption(iso3.toUpperCase());
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getCountryEnergy(ctx) {
    try {
      const { iso3 } = ctx.params;
      const data = await strapi
        .service('api::owid.owid')
        .getCountryEnergy(iso3.toUpperCase());
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};
