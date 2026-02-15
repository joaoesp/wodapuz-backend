const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export default {
  async fetchGDP(year?: string) {
    const targetYear = year || new Date().getFullYear() - 1; // Default to last year
    const cacheKey = `gdp-all-${targetYear}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const url = `${WORLD_BANK_BASE_URL}/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=${targetYear}&per_page=300`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.statusText}`);
      }

      const jsonData = await response.json();

      // World Bank API returns [metadata, data]
      const data = jsonData[1] || [];

      // Transform and filter data
      const transformedData = data
        .filter((item: any) => item.value !== null)
        .map((item: any) => ({
          countryCode: item.countryiso3code,
          countryName: item.country.value,
          year: item.date,
          value: item.value,
          indicator: 'GDP',
        }));

      // Cache the result
      cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now(),
      });

      return transformedData;
    } catch (error) {
      strapi.log.error('Error fetching GDP data from World Bank:', error);
      throw error;
    }
  },

  async fetchCountryGDP(countryCode: string, year?: string) {
    const targetYear = year || new Date().getFullYear() - 1;
    const cacheKey = `gdp-${countryCode}-${targetYear}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const url = `${WORLD_BANK_BASE_URL}/country/${countryCode}/indicator/NY.GDP.MKTP.CD?format=json&date=${targetYear}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.statusText}`);
      }

      const jsonData = await response.json();
      const data = jsonData[1]?.[0];

      if (!data) {
        return null;
      }

      const transformedData = {
        countryCode: data.countryiso3code,
        countryName: data.country.value,
        year: data.date,
        value: data.value,
        indicator: 'GDP',
      };

      // Cache the result
      cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now(),
      });

      return transformedData;
    } catch (error) {
      strapi.log.error(`Error fetching GDP data for ${countryCode}:`, error);
      throw error;
    }
  },

  async fetchGDPYearRange(startYear: number, endYear: number) {
    const cacheKey = `gdp-range-${startYear}-${endYear}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const yearRange = `${startYear}:${endYear}`;
      const url = `${WORLD_BANK_BASE_URL}/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=${yearRange}&per_page=20000`;

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
            indicator: 'GDP',
          });
        });

      // Cache the result
      cache.set(cacheKey, {
        data: dataByYear,
        timestamp: Date.now(),
      });

      return dataByYear;
    } catch (error) {
      strapi.log.error('Error fetching GDP year range from World Bank:', error);
      throw error;
    }
  },
};
