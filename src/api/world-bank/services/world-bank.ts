const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2';
const IMF_DATAMAPPER_BASE_URL = 'https://www.imf.org/external/datamapper/api/v1';

// L1: in-memory cache to avoid redundant DB round-trips
const memoryCache = new Map<string, any>();

async function getCached(cacheKey: string): Promise<any | null> {
  // L1: memory
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);

  // L2: database
  const entry = await strapi.db.query('api::indicator-cache.indicator-cache').findOne({
    where: { cacheKey },
  });
  if (entry) {
    memoryCache.set(cacheKey, entry.data);
    return entry.data;
  }

  return null;
}

async function setCached(cacheKey: string, data: any): Promise<void> {
  memoryCache.set(cacheKey, data);

  const existing = await strapi.db.query('api::indicator-cache.indicator-cache').findOne({
    where: { cacheKey },
  });
  if (existing) {
    await strapi.db.query('api::indicator-cache.indicator-cache').update({
      where: { id: existing.id },
      data: { data, fetchedAt: new Date().toISOString() },
    });
  } else {
    await strapi.db.query('api::indicator-cache.indicator-cache').create({
      data: { cacheKey, data, fetchedAt: new Date().toISOString() },
    });
  }
}

async function fetchImfCountryNames(): Promise<Record<string, string>> {
  const cacheKey = 'imf-countries';
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${IMF_DATAMAPPER_BASE_URL}/countries`);
  const json = (await response.json()) as any;
  const countries = json.countries || {};

  const names: Record<string, string> = {};
  for (const [code, info] of Object.entries(countries)) {
    names[code] = (info as any).label || code;
  }

  await setCached(cacheKey, names);
  return names;
}

export default {
  async fetchIndicatorYearRange(indicatorCode: string, indicatorName: string, startYear: number, endYear: number) {
    const cacheKey = `${indicatorCode}-range-${startYear}-${endYear}`;

    const cached = await getCached(cacheKey);
    if (cached) return cached;

    try {
      const yearRange = `${startYear}:${endYear}`;
      const url = `${WORLD_BANK_BASE_URL}/country/all/indicator/${indicatorCode}?format=json&date=${yearRange}&per_page=20000`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.statusText}`);
      }

      const jsonData = await response.json();
      const data = jsonData[1] || [];

      const dataByYear: Record<string, any[]> = {};

      data
        .filter((item: any) => item.value !== null)
        .forEach((item: any) => {
          const year = item.date;
          if (!dataByYear[year]) {
            dataByYear[year] = [];
          }
          dataByYear[year].push({
            countryCode: item.countryiso3code,
            countryName: item.country.value,
            year: item.date,
            value: item.value,
            indicator: indicatorName,
          });
        });

      await setCached(cacheKey, dataByYear);
      return dataByYear;
    } catch (error) {
      strapi.log.error(`Error fetching ${indicatorName} year range:`, error);
      throw error;
    }
  },

  async fetchInflationFromImf(startYear: number, endYear: number) {
    const cacheKey = `imf-inflation-primary-${startYear}-${endYear}`;

    const cached = await getCached(cacheKey);
    if (cached) return cached;

    try {
      const [json, countryNames] = await Promise.all([
        fetch(`${IMF_DATAMAPPER_BASE_URL}/PCPIPCH`).then((r) => r.json()) as Promise<any>,
        fetchImfCountryNames(),
      ]);

      const values = (json.values?.PCPIPCH || {}) as Record<string, Record<string, number>>;

      const dataByYear: Record<string, any[]> = {};

      for (const [countryCode, yearData] of Object.entries(values)) {
        for (const [year, value] of Object.entries(yearData)) {
          const yearNum = parseInt(year);
          if (yearNum < startYear || yearNum > endYear || value === null) continue;

          if (!dataByYear[year]) {
            dataByYear[year] = [];
          }
          dataByYear[year].push({
            countryCode,
            countryName: countryNames[countryCode] || countryCode,
            year,
            value,
            indicator: 'Inflation',
          });
        }
      }

      await setCached(cacheKey, dataByYear);
      return dataByYear;
    } catch (error) {
      strapi.log.error('Error fetching Inflation from IMF:', error);
      throw error;
    }
  },

  async fetchDebtToGdpFromImf(startYear: number, endYear: number) {
    const cacheKey = `imf-debt-to-gdp-primary-${startYear}-${endYear}`;

    const cached = await getCached(cacheKey);
    if (cached) return cached;

    try {
      const [json, countryNames] = await Promise.all([
        fetch(`${IMF_DATAMAPPER_BASE_URL}/GGXWDG_NGDP`).then((r) => r.json()) as Promise<any>,
        fetchImfCountryNames(),
      ]);

      const values = (json.values?.GGXWDG_NGDP || {}) as Record<string, Record<string, number>>;

      const dataByYear: Record<string, any[]> = {};

      for (const [countryCode, yearData] of Object.entries(values)) {
        for (const [year, value] of Object.entries(yearData)) {
          const yearNum = parseInt(year);
          if (yearNum < startYear || yearNum > endYear || value === null) continue;

          if (!dataByYear[year]) {
            dataByYear[year] = [];
          }
          dataByYear[year].push({
            countryCode,
            countryName: countryNames[countryCode] || countryCode,
            year,
            value,
            indicator: 'Debt-to-GDP',
          });
        }
      }

      await setCached(cacheKey, dataByYear);
      return dataByYear;
    } catch (error) {
      strapi.log.error('Error fetching Debt-to-GDP from IMF:', error);
      throw error;
    }
  },
};
