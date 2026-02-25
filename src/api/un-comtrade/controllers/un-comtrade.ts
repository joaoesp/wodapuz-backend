export default {
  async getTradeData(ctx) {
    try {
      const { iso3, flow, year } = ctx.params;
      const yearNum = parseInt(year);

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchTradeData(iso3.toUpperCase(), flow, yearNum);
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getPartnerProducts(ctx) {
    try {
      const { iso3, flow, year, partnerIso3 } = ctx.params;
      const yearNum = parseInt(year);

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchPartnerProducts(iso3.toUpperCase(), partnerIso3.toUpperCase(), flow, yearNum);
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};
