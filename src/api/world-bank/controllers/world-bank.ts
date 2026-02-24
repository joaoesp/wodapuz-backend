const INDICATOR_CODES: Record<string, string> = {
  'gdp': 'NY.GDP.MKTP.CD',
  'gdp-growth': 'NY.GDP.MKTP.KD.ZG',
  'gdp-per-capita': 'NY.GDP.PCAP.CD',
  'inflation': 'FP.CPI.TOTL.ZG',
  'current-account-balance': 'BN.CAB.XOKA.GD.ZS',
};

const INDICATOR_NAMES: Record<string, string> = {
  'gdp': 'GDP',
  'gdp-growth': 'GDP Growth',
  'gdp-per-capita': 'GDP per Capita',
  'inflation': 'Inflation',
  'current-account-balance': 'Current Account Balance',
};

export default {
  async getIndicatorYearRange(ctx) {
    try {
      const { indicator, startYear, endYear } = ctx.params;
      const start = parseInt(startYear);
      const end = parseInt(endYear);

      // Debt-to-GDP uses IMF as primary source
      if (indicator === 'debt-to-gdp') {
        const data = await strapi.service('api::world-bank.world-bank').fetchDebtToGdpFromImf(start, end);
        ctx.body = data;
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
