const OWID_CSV_URL =
  'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';

// L1: in-memory cache for API responses
const memoryCache = new Map<string, any>();

// Parsed CSV rows, held in memory after first fetch
let parsedRowsCache: ParsedRow[] | null = null;

interface ParsedRow {
  iso: string;
  country: string;
  year: number;
  // electricity generation (production)
  total: number | null;
  coal: number | null;
  gas: number | null;
  oil: number | null;
  nuclear: number | null;
  hydro: number | null;
  solar: number | null;
  wind: number | null;
  biofuel: number | null;
  // primary energy consumption
  consumptionTotal: number | null;
  consumptionCoal: number | null;
  consumptionGas: number | null;
  consumptionOil: number | null;
  consumptionNuclear: number | null;
  consumptionHydro: number | null;
  consumptionSolar: number | null;
  consumptionWind: number | null;
  consumptionBiofuel: number | null;
  consumptionOtherRenewable: number | null;
}

async function getCached(cacheKey: string): Promise<any | null> {
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);
  const entry = await strapi.db
    .query('api::indicator-cache.indicator-cache')
    .findOne({ where: { cacheKey } });
  if (entry) {
    memoryCache.set(cacheKey, entry.data);
    return entry.data;
  }
  return null;
}

async function setCached(cacheKey: string, data: any): Promise<void> {
  memoryCache.set(cacheKey, data);
  const existing = await strapi.db
    .query('api::indicator-cache.indicator-cache')
    .findOne({ where: { cacheKey } });
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

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function toNum(s: string): number | null {
  if (!s || s.trim() === '') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

async function getParsedRows(): Promise<ParsedRow[]> {
  if (parsedRowsCache) return parsedRowsCache;

  strapi.log.info('Fetching OWID energy CSV...');
  const response = await fetch(OWID_CSV_URL);
  if (!response.ok) throw new Error(`Failed to fetch OWID CSV: ${response.status}`);
  const csv = await response.text();

  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);

  const col = (name: string) => headers.indexOf(name);
  const isoCol = col('iso_code');
  const countryCol = col('country');
  const yearCol = col('year');
  const totalCol = col('electricity_generation');
  const coalCol = col('coal_electricity');
  const gasCol = col('gas_electricity');
  const oilCol = col('oil_electricity');
  const nuclearCol = col('nuclear_electricity');
  const hydroCol = col('hydro_electricity');
  const solarCol = col('solar_electricity');
  const windCol = col('wind_electricity');
  const biofuelCol = col('biofuel_electricity');
  const consumptionTotalCol = col('primary_energy_consumption');
  const consumptionCoalCol = col('coal_consumption');
  const consumptionGasCol = col('gas_consumption');
  const consumptionOilCol = col('oil_consumption');
  const consumptionNuclearCol = col('nuclear_consumption');
  const consumptionHydroCol = col('hydro_consumption');
  const consumptionSolarCol = col('solar_consumption');
  const consumptionWindCol = col('wind_consumption');
  const consumptionBiofuelCol = col('biofuel_consumption');
  const consumptionOtherRenewableCol = col('other_renewable_consumption');

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const f = parseCSVLine(line);
    const iso = (f[isoCol] ?? '').trim();
    // Skip aggregate/regional rows (no ISO code or OWID_ prefix)
    if (!iso || iso.startsWith('OWID_')) continue;
    const year = parseInt(f[yearCol] ?? '');
    if (isNaN(year)) continue;

    rows.push({
      iso,
      country: (f[countryCol] ?? iso).trim(),
      year,
      total: toNum(f[totalCol] ?? ''),
      coal: toNum(f[coalCol] ?? ''),
      gas: toNum(f[gasCol] ?? ''),
      oil: toNum(f[oilCol] ?? ''),
      nuclear: toNum(f[nuclearCol] ?? ''),
      hydro: toNum(f[hydroCol] ?? ''),
      solar: toNum(f[solarCol] ?? ''),
      wind: toNum(f[windCol] ?? ''),
      biofuel: toNum(f[biofuelCol] ?? ''),
      consumptionTotal: toNum(f[consumptionTotalCol] ?? ''),
      consumptionCoal: toNum(f[consumptionCoalCol] ?? ''),
      consumptionGas: toNum(f[consumptionGasCol] ?? ''),
      consumptionOil: toNum(f[consumptionOilCol] ?? ''),
      consumptionNuclear: toNum(f[consumptionNuclearCol] ?? ''),
      consumptionHydro: toNum(f[consumptionHydroCol] ?? ''),
      consumptionSolar: toNum(f[consumptionSolarCol] ?? ''),
      consumptionWind: toNum(f[consumptionWindCol] ?? ''),
      consumptionBiofuel: toNum(f[consumptionBiofuelCol] ?? ''),
      consumptionOtherRenewable: toNum(f[consumptionOtherRenewableCol] ?? ''),
    });
  }

  strapi.log.info(`OWID CSV parsed: ${rows.length} rows`);
  parsedRowsCache = rows;
  return rows;
}

export default {
  async getEnergyByYear(startYear: number, endYear: number) {
    // Clamp endYear to what the data actually contains
    const cacheKey = `owid-energy-map-${startYear}-${endYear}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const rows = await getParsedRows();
    const dataByYear: Record<string, any[]> = {};

    for (const row of rows) {
      if (row.year < startYear || row.year > endYear || row.total === null) continue;
      const yr = String(row.year);
      if (!dataByYear[yr]) dataByYear[yr] = [];
      dataByYear[yr].push({
        countryCode: row.iso,
        countryName: row.country,
        year: yr,
        value: row.total,
        indicator: 'Energy Production',
      });
    }

    await setCached(cacheKey, dataByYear);
    return dataByYear;
  },

  async getConsumptionByYear(startYear: number, endYear: number) {
    const cacheKey = `owid-consumption-map-${startYear}-${endYear}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const rows = await getParsedRows();
    const dataByYear: Record<string, any[]> = {};

    for (const row of rows) {
      if (row.year < startYear || row.year > endYear || row.consumptionTotal === null) continue;
      const yr = String(row.year);
      if (!dataByYear[yr]) dataByYear[yr] = [];
      dataByYear[yr].push({
        countryCode: row.iso,
        countryName: row.country,
        year: yr,
        value: row.consumptionTotal,
        indicator: 'Energy Consumption',
      });
    }

    await setCached(cacheKey, dataByYear);
    return dataByYear;
  },

  async getCountryConsumption(iso3: string) {
    const cacheKey = `owid-consumption-country-${iso3}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const rows = await getParsedRows();
    const countryRows = rows.filter((r) => r.iso === iso3).sort((a, b) => a.year - b.year);

    const result = {
      years: countryRows.map((r) => r.year),
      total: countryRows.map((r) => r.consumptionTotal),
      coal: countryRows.map((r) => r.consumptionCoal),
      gas: countryRows.map((r) => r.consumptionGas),
      oil: countryRows.map((r) => r.consumptionOil),
      nuclear: countryRows.map((r) => r.consumptionNuclear),
      hydro: countryRows.map((r) => r.consumptionHydro),
      solar: countryRows.map((r) => r.consumptionSolar),
      wind: countryRows.map((r) => r.consumptionWind),
      biofuel: countryRows.map((r) => r.consumptionBiofuel),
      otherRenewable: countryRows.map((r) => r.consumptionOtherRenewable),
    };

    await setCached(cacheKey, result);
    return result;
  },

  async getCountryEnergy(iso3: string) {
    const cacheKey = `owid-energy-country-${iso3}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const rows = await getParsedRows();
    const countryRows = rows.filter((r) => r.iso === iso3).sort((a, b) => a.year - b.year);

    const result = {
      years: countryRows.map((r) => r.year),
      total: countryRows.map((r) => r.total),
      coal: countryRows.map((r) => r.coal),
      gas: countryRows.map((r) => r.gas),
      oil: countryRows.map((r) => r.oil),
      nuclear: countryRows.map((r) => r.nuclear),
      hydro: countryRows.map((r) => r.hydro),
      solar: countryRows.map((r) => r.solar),
      wind: countryRows.map((r) => r.wind),
      biofuel: countryRows.map((r) => r.biofuel),
    };

    await setCached(cacheKey, result);
    return result;
  },
};
