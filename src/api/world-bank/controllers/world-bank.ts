const INDICATOR_CODES: Record<string, string> = {
  'gdp': 'NY.GDP.MKTP.CD',
  'gdp-growth': 'NY.GDP.MKTP.KD.ZG',
  'gdp-per-capita': 'NY.GDP.PCAP.CD',
  'current-account-balance': 'BN.CAB.XOKA.GD.ZS',
  'trade-openness': 'NE.TRD.GNFS.ZS',
  'exports': 'NE.EXP.GNFS.ZS',
  'imports': 'NE.IMP.GNFS.ZS',
  'trade-balance': 'BN.GSR.GNFS.CD',
  'defense-spending': 'MS.MIL.XPND.CD',
  'active-personnel': 'MS.MIL.TOTL.P1',
  'net-energy-balance': 'EG.IMP.CONS.ZS',
  'arable-land': 'AG.LND.ARBL.HA.PC',
  'freshwater-resources': 'ER.H2O.INTR.PC',
  'population': 'SP.POP.TOTL',
  'population-growth': 'SP.POP.GROW',
  'fertility-rate': 'SP.DYN.TFRT.IN',
  'net-migration': 'SM.POP.NETM',
  'life-expectancy': 'SP.DYN.LE00.IN',
  'age-dependency': 'SP.POP.DPND',
  'labor-force': 'SL.TLF.ACTI.ZS',
  'population-65-plus': 'SP.POP.65UP.TO.ZS',
  'population-0-14': 'SP.POP.0014.TO.ZS',
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
  'defense-spending': 'Defense Spending',
  'active-personnel': 'Active Personnel',
  'net-energy-balance': 'Net Energy Balance',
  'arable-land': 'Arable Land',
  'freshwater-resources': 'Freshwater Resources',
  'population': 'Population',
  'population-growth': 'Population Growth',
  'fertility-rate': 'Fertility Rate',
  'net-migration': 'Net Migration',
  'life-expectancy': 'Life Expectancy',
  'age-dependency': 'Age Dependency',
  'labor-force': 'Labor Force',
  'population-65-plus': 'Population 65+',
  'population-0-14': 'Population 0-14',
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
