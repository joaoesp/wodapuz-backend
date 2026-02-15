const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export default {
  async fetchIndicatorYearRange(indicatorCode: string, indicatorName: string, startYear: number, endYear: number) {
    const cacheKey = `${indicatorCode}-range-${startYear}-${endYear}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const yearRange = `${startYear}:${endYear}`;
      const url = `${WORLD_BANK_BASE_URL}/country/all/indicator/${indicatorCode}?format=json&date=${yearRange}&per_page=20000`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.statusText}`);
      }

      const jsonData = await response.json();
      const data = jsonData[1] || [];

      // Group data by year
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

      // Cache the result
      cache.set(cacheKey, {
        data: dataByYear,
        timestamp: Date.now(),
      });

      return dataByYear;
    } catch (error) {
      strapi.log.error(`Error fetching ${indicatorName} year range from World Bank:`, error);
      throw error;
    }
  },
};
