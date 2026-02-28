export default {
  async getEnergyTypeBreakdown(ctx) {
    try {
      const { iso3, flow, year } = ctx.params;
      const yearNum = parseInt(year);

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchEnergyTypeBreakdown(iso3.toUpperCase(), flow, yearNum);
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getEnergyTypePartners(ctx) {
    try {
      const { iso3, flow, year, hs4Code } = ctx.params;
      const yearNum = parseInt(year);

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchEnergyTypePartners(iso3.toUpperCase(), hs4Code, flow, yearNum);
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getEnergyPartnerBreakdown(ctx) {
    try {
      const { iso3, flow, year, partnerIso3 } = ctx.params;
      const yearNum = parseInt(year);

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchEnergyPartnerBreakdown(iso3.toUpperCase(), partnerIso3.toUpperCase(), flow, yearNum);
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async getEnergyTradeData(ctx) {
    try {
      const { iso3, flow, year } = ctx.params;
      const yearNum = parseInt(year);

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchEnergyTradeData(iso3.toUpperCase(), flow, yearNum);
    } catch (err) {
      ctx.throw(500, err);
    }
  },

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

  async getProductHistory(ctx) {
    try {
      const { iso3, flow, partnerIso3, hsCode } = ctx.params;

      if (!['X', 'M'].includes(flow)) {
        ctx.throw(400, 'flow must be X (exports) or M (imports)');
      }

      ctx.body = await strapi
        .service('api::un-comtrade.un-comtrade')
        .fetchProductHistory(iso3.toUpperCase(), partnerIso3.toUpperCase(), flow, hsCode);
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
