const INDICATOR_CODES: Record<string, string> = {
  'gdp': 'NY.GDP.MKTP.CD',
  'gdp-growth': 'NY.GDP.MKTP.KD.ZG',
  'gdp-per-capita': 'NY.GDP.PCAP.CD',
  'current-account-balance': 'BN.CAB.XOKA.GD.ZS',
  'trade-openness': 'NE.TRD.GNFS.ZS',
  'exports': 'NE.EXP.GNFS.ZS',
  'imports': 'NE.IMP.GNFS.ZS',
  'trade-balance': 'BN.GSR.GNFS.CD',
};

const INDICATOR_NAMES: Record<string, string> = {
  'gdp': 'GDP',
  'gdp-growth': 'GDP Growth',
  'gdp-per-capita': 'GDP per Capita',
  'current-account-balance': 'Current Account Balance',
  'trade-openness': 'Trade Openness',
  'exports': 'Exports',
  'imports': 'Imports',
  'trade-balance': 'Trade Balance',
};

export default {
  async getIndicatorYearRange(ctx) {
    try {
      const { indicator, startYear, endYear } = ctx.params;
      const start = parseInt(startYear);
      const end = parseInt(endYear);

      // IMF-sourced indicators
      if (indicator === 'debt-to-gdp') {
        ctx.body = await strapi.service('api::world-bank.world-bank').fetchDebtToGdpFromImf(start, end);
        return;
      }

      if (indicator === 'inflation') {
        ctx.body = await strapi.service('api::world-bank.world-bank').fetchInflationFromImf(start, end);
        return;
      }

      const indicatorCode = INDICATOR_CODES[indicator];
      const indicatorName = INDICATOR_NAMES[indicator];

      if (!indicatorCode) {
        ctx.throw(400, `Unknown indicator: ${indicator}`);
      }

      const data = await strapi.service('api::world-bank.world-bank').fetchIndicatorYearRange(
        indicatorCode,
        indicatorName,
        start,
        end,
      );
      ctx.body = data;
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};
