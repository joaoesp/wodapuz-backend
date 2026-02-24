const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2';
const IMF_DATAMAPPER_BASE_URL = 'https://www.imf.org/external/datamapper/api/v1';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

// L1: in-memory cache to avoid redundant DB round-trips
interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

function isStale(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_DURATION;
}

async function getFromDb(cacheKey: string): Promise<CacheEntry | null> {
  const entry = await strapi.db.query('api::indicator-cache.indicator-cache').findOne({
    where: { cacheKey },
  });

  if (!entry) return null;

  const timestamp = new Date(entry.fetchedAt).getTime();
  return { data: entry.data, timestamp };
}

async function saveToDb(cacheKey: string, data: any): Promise<void> {
  const existing = await strapi.db.query('api::indicator-cache.indicator-cache').findOne({
    where: { cacheKey },
  });

  const fetchedAt = new Date().toISOString();

  if (existing) {
    await strapi.db.query('api::indicator-cache.indicator-cache').update({
      where: { id: existing.id },
      data: { data, fetchedAt },
    });
  } else {
    await strapi.db.query('api::indicator-cache.indicator-cache').create({
      data: { cacheKey, data, fetchedAt },
    });
  }
}

async function getCached(cacheKey: string): Promise<any | null> {
  // L1: memory
  const mem = memoryCache.get(cacheKey);
  if (mem && !isStale(mem.timestamp)) {
    return mem.data;
  }

  // L2: database
  const db = await getFromDb(cacheKey);
  if (db && !isStale(db.timestamp)) {
    memoryCache.set(cacheKey, db);
    return db.data;
  }

  return null;
}

async function setCached(cacheKey: string, data: any): Promise<void> {
  const entry: CacheEntry = { data, timestamp: Date.now() };
  memoryCache.set(cacheKey, entry);
  await saveToDb(cacheKey, data);
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

async function fetchImfDebtToGdp(startYear: number, endYear: number): Promise<Record<string, Record<string, number>>> {
  const cacheKey = `imf-ggxwdg-range-${startYear}-${endYear}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${IMF_DATAMAPPER_BASE_URL}/GGXWDG_NGDP`);
  const json = (await response.json()) as any;
  const values = (json.values?.GGXWDG_NGDP || {}) as Record<string, Record<string, number>>;

  const result: Record<string, Record<string, number>> = {};
  for (const [countryCode, yearData] of Object.entries(values)) {
    result[countryCode] = {};
    for (const [year, value] of Object.entries(yearData)) {
      const yearNum = parseInt(year);
      if (yearNum >= startYear && yearNum <= endYear && value !== null) {
        result[countryCode][year] = value;
      }
    }
  }

  await setCached(cacheKey, result);
  return result;
}

export default {
  async fetchIndicatorYearRange(indicatorCode: string, indicatorName: string, startYear: number, endYear: number, supplementWithImf = false) {
    const cacheKey = `${indicatorCode}-range-${startYear}-${endYear}${supplementWithImf ? '-imf-merged' : ''}`;

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

      // Group data by year, tracking which (year, countryCode) pairs World Bank has
      const dataByYear: Record<string, any[]> = {};
      const wbPairs = new Set<string>();

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
          wbPairs.add(`${year}-${item.countryiso3code}`);
        });

      // Supplement with IMF data, filling in country-year pairs missing from World Bank
      if (supplementWithImf) {
        const [imfData, imfCountryNames] = await Promise.all([
          fetchImfDebtToGdp(startYear, endYear),
          fetchImfCountryNames(),
        ]);

        for (const [countryCode, yearData] of Object.entries(imfData)) {
          for (const [year, value] of Object.entries(yearData)) {
            if (!wbPairs.has(`${year}-${countryCode}`)) {
              if (!dataByYear[year]) {
                dataByYear[year] = [];
              }
              dataByYear[year].push({
                countryCode,
                countryName: imfCountryNames[countryCode] || countryCode,
                year,
                value,
                indicator: indicatorName,
              });
            }
          }
        }
      }

      await setCached(cacheKey, dataByYear);
      return dataByYear;
    } catch (error) {
      strapi.log.error(`Error fetching ${indicatorName} year range:`, error);
      throw error;
    }
  },
};
