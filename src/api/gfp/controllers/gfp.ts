export default {
  async getRankings(ctx) {
    try {
      const data = await strapi.service('api::gfp.gfp').fetchRankings();
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getCountryDetail(ctx) {
    try {
      const { iso3 } = ctx.params;
      const data = await strapi.service('api::gfp.gfp').fetchCountryDetail(iso3.toUpperCase());
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};
