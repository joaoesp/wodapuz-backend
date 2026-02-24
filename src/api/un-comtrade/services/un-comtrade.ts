const COMTRADE_BASE_URL = 'https://comtradeapi.un.org/data/v1/get/C/A/HS';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

// ISO 3-letter → UN Comtrade M49 numeric reporter codes
const ISO3_TO_M49: Record<string, string> = {
  AFG: '4', ALB: '8', DZA: '12', AGO: '24', ARG: '32', ARM: '51', AUS: '36',
  AUT: '40', AZE: '31', BHS: '44', BGD: '50', BLR: '112', BEL: '56', BLZ: '84',
  BEN: '204', BTN: '64', BOL: '68', BIH: '70', BWA: '72', BRA: '76', BRN: '96',
  BGR: '100', BFA: '854', BDI: '108', CPV: '132', KHM: '116', CMR: '120',
  CAN: '124', CAF: '140', TCD: '148', CHL: '152', CHN: '156', COL: '170',
  COG: '178', COD: '180', CRI: '188', HRV: '191', CUB: '192', CYP: '196',
  CZE: '203', DNK: '208', DJI: '262', DOM: '214', ECU: '218', EGY: '818',
  SLV: '222', GNQ: '226', ERI: '232', EST: '233', SWZ: '748', ETH: '231',
  FJI: '242', FIN: '246', FRA: '250', GAB: '266', GMB: '270', GEO: '268',
  DEU: '276', GHA: '288', GRC: '300', GRL: '304', GTM: '320', GIN: '324',
  GNB: '624', GUY: '328', HTI: '332', HND: '340', HKG: '344', HUN: '348',
  ISL: '352', IND: '356', IDN: '360', IRN: '364', IRQ: '368', IRL: '372',
  ISR: '376', ITA: '380', CIV: '384', JAM: '388', JPN: '392', JOR: '400',
  KAZ: '398', KEN: '404', KWT: '414', KGZ: '417', LAO: '418', LVA: '428',
  LBN: '422', LSO: '426', LBR: '430', LBY: '434', LTU: '440', LUX: '442',
  MDG: '450', MWI: '454', MYS: '458', MDV: '462', MLI: '466', MLT: '470',
  MRT: '478', MEX: '484', MDA: '498', MNG: '496', MNE: '499', MAR: '504',
  MOZ: '508', MMR: '104', NAM: '516', NPL: '524', NLD: '528', NZL: '554',
  NIC: '558', NER: '562', NGA: '566', PRK: '408', NOR: '578', OMN: '512',
  PAK: '586', PAN: '591', PNG: '598', PRY: '600', PER: '604', PHL: '608',
  POL: '616', PRT: '620', QAT: '634', ROU: '642', RUS: '643', RWA: '646',
  SAU: '682', SEN: '686', SRB: '688', SLE: '694', SGP: '702', SVK: '703',
  SVN: '705', SOM: '706', ZAF: '710', KOR: '410', SSD: '728', ESP: '724',
  LKA: '144', SDN: '729', SUR: '740', SWE: '752', CHE: '756', SYR: '760',
  TWN: '158', TJK: '762', TZA: '834', THA: '764', TLS: '626', TGO: '768',
  TTO: '780', TUN: '788', TUR: '792', TKM: '795', UGA: '800', UKR: '804',
  ARE: '784', GBR: '826', USA: '842', URY: '858', UZB: '860', VEN: '862',
  VNM: '704', YEM: '887', ZMB: '894', ZWE: '716',
};

interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

function isStale(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_DURATION;
}

async function getFromDb(cacheKey: string): Promise<CacheEntry | null> {
  const entry = await strapi.db
    .query('api::indicator-cache.indicator-cache')
    .findOne({ where: { cacheKey } });
  if (!entry) return null;
  return { data: entry.data, timestamp: new Date(entry.fetchedAt).getTime() };
}

async function saveToDb(cacheKey: string, data: any): Promise<void> {
  const existing = await strapi.db
    .query('api::indicator-cache.indicator-cache')
    .findOne({ where: { cacheKey } });
  const fetchedAt = new Date().toISOString();
  if (existing) {
    await strapi.db
      .query('api::indicator-cache.indicator-cache')
      .update({ where: { id: existing.id }, data: { data, fetchedAt } });
  } else {
    await strapi.db
      .query('api::indicator-cache.indicator-cache')
      .create({ data: { cacheKey, data, fetchedAt } });
  }
}

async function getCached(cacheKey: string): Promise<any | null> {
  const mem = memoryCache.get(cacheKey);
  if (mem && !isStale(mem.timestamp)) return mem.data;
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

export default {
  async fetchTradeData(iso3: string, flow: string, year: number) {
    const cacheKey = `comtrade-${iso3}-${flow}-${year}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const m49 = ISO3_TO_M49[iso3];
    if (!m49) {
      throw new Error(`No M49 code for ISO3: ${iso3}`);
    }

    const apiKey = process.env.UN_COMTRADE_API_KEY;
    if (!apiKey) {
      throw new Error('UN_COMTRADE_API_KEY not configured');
    }

    const baseParams = `reporterCode=${m49}&period=${year}&flowCode=${flow}&includeDesc=true&subscription-key=${apiKey}`;

    // Sequential requests to respect Comtrade's 1 req/sec rate limit
    const partnersRes = await fetch(`${COMTRADE_BASE_URL}?${baseParams}&cmdCode=TOTAL`);
    if (!partnersRes.ok) {
      const text = await partnersRes.text().catch(() => '');
      throw new Error(`Comtrade partners error ${partnersRes.status}: ${text.slice(0, 200)}`);
    }
    const partnersJson = (await partnersRes.json()) as any;

    await new Promise((r) => setTimeout(r, 1200));

    const productsRes = await fetch(`${COMTRADE_BASE_URL}?${baseParams}&cmdCode=AG2&partnerCode=0`);
    if (!productsRes.ok) {
      const text = await productsRes.text().catch(() => '');
      throw new Error(`Comtrade products error ${productsRes.status}: ${text.slice(0, 200)}`);
    }
    const productsJson = (await productsRes.json()) as any;

    // Partners: exclude world aggregate (partnerISO W00), sort by value, top 10
    const partners = ((partnersJson.data || []) as any[])
      .filter((r: any) => r.partnerISO !== 'W00' && r.primaryValue > 0)
      .sort((a: any, b: any) => b.primaryValue - a.primaryValue)
      .slice(0, 10)
      .map((r: any) => ({
        name: r.partnerDesc,
        iso: r.partnerISO,
        value: r.primaryValue,
      }));

    // Products: exclude aggregate rows (cmdCode TOTAL), sort by value, top 10
    const products = ((productsJson.data || []) as any[])
      .filter((r: any) => r.cmdCode !== 'TOTAL' && r.primaryValue > 0)
      .sort((a: any, b: any) => b.primaryValue - a.primaryValue)
      .slice(0, 10)
      .map((r: any) => ({
        code: r.cmdCode,
        name: r.cmdDesc,
        value: r.primaryValue,
      }));

    // Total exports/imports value (world aggregate row)
    const worldRow = ((partnersJson.data || []) as any[]).find(
      (r: any) => r.partnerISO === 'W00'
    );
    const total = worldRow?.primaryValue ?? 0;

    const result = { partners, products, total, flow, year, iso3 };
    await setCached(cacheKey, result);
    return result;
  },
};
