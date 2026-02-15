export default {
  async getGDP(ctx) {
    try {
      const { year } = ctx.query;
      const data = await strapi.service('api::world-bank.world-bank').fetchGDP(year);
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getGDPYearRange(ctx) {
    try {
      const { startYear, endYear } = ctx.params;
      const data = await strapi.service('api::world-bank.world-bank').fetchGDPYearRange(
        parseInt(startYear),
        parseInt(endYear)
      );
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getCountryGDP(ctx) {
    try {
      const { countryCode } = ctx.params;
      const { year } = ctx.query;
      const data = await strapi.service('api::world-bank.world-bank').fetchCountryGDP(countryCode, year);
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};
