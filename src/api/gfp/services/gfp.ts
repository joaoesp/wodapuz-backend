const GFP_BASE_URL = 'https://www.globalfirepower.com';

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

// GFP slug → ISO3 mapping (145 countries)
const GFP_SLUG_TO_ISO3: Record<string, string> = {
  'united-states-of-america': 'USA',
  russia: 'RUS',
  china: 'CHN',
  india: 'IND',
  'south-korea': 'KOR',
  'united-kingdom': 'GBR',
  japan: 'JPN',
  turkey: 'TUR',
  pakistan: 'PAK',
  france: 'FRA',
  italy: 'ITA',
  brazil: 'BRA',
  egypt: 'EGY',
  germany: 'DEU',
  ukraine: 'UKR',
  australia: 'AUS',
  israel: 'ISR',
  iran: 'IRN',
  indonesia: 'IDN',
  taiwan: 'TWN',
  poland: 'POL',
  spain: 'ESP',
  'saudi-arabia': 'SAU',
  vietnam: 'VNM',
  thailand: 'THA',
  'south-africa': 'ZAF',
  'north-korea': 'PRK',
  sweden: 'SWE',
  greece: 'GRC',
  mexico: 'MEX',
  netherlands: 'NLD',
  switzerland: 'CHE',
  norway: 'NOR',
  bangladesh: 'BGD',
  myanmar: 'MMR',
  nigeria: 'NGA',
  canada: 'CAN',
  peru: 'PER',
  argentina: 'ARG',
  algeria: 'DZA',
  denmark: 'DNK',
  finland: 'FIN',
  morocco: 'MAR',
  romania: 'ROU',
  'czech-republic': 'CZE',
  portugal: 'PRT',
  chile: 'CHL',
  colombia: 'COL',
  philippines: 'PHL',
  ethiopia: 'ETH',
  malaysia: 'MYS',
  angola: 'AGO',
  kenya: 'KEN',
  kazakhstan: 'KAZ',
  venezuela: 'VEN',
  cuba: 'CUB',
  ecuador: 'ECU',
  iraq: 'IRQ',
  jordan: 'JOR',
  syria: 'SYR',
  oman: 'OMN',
  azerbaijan: 'AZE',
  qatar: 'QAT',
  kuwait: 'KWT',
  bahrain: 'BHR',
  'united-arab-emirates': 'ARE',
  yemen: 'YEM',
  armenia: 'ARM',
  georgia: 'GEO',
  belarus: 'BLR',
  uzbekistan: 'UZB',
  turkmenistan: 'TKM',
  tajikistan: 'TJK',
  kyrgyzstan: 'KGZ',
  cambodia: 'KHM',
  laos: 'LAO',
  'sri-lanka': 'LKA',
  nepal: 'NPL',
  afghanistan: 'AFG',
  mongolia: 'MNG',
  'new-zealand': 'NZL',
  singapore: 'SGP',
  croatia: 'HRV',
  bulgaria: 'BGR',
  slovakia: 'SVK',
  hungary: 'HUN',
  austria: 'AUT',
  belgium: 'BEL',
  serbia: 'SRB',
  tunisia: 'TUN',
  libya: 'LBY',
  sudan: 'SDN',
  tanzania: 'TZA',
  ghana: 'GHA',
  cameroon: 'CMR',
  mozambique: 'MOZ',
  zambia: 'ZMB',
  zimbabwe: 'ZWE',
  senegal: 'SEN',
  'ivory-coast': 'CIV',
  'cote-divoire': 'CIV',
  uganda: 'UGA',
  malawi: 'MWI',
  mali: 'MLI',
  niger: 'NER',
  chad: 'TCD',
  somalia: 'SOM',
  rwanda: 'RWA',
  djibouti: 'DJI',
  eritrea: 'ERI',
  namibia: 'NAM',
  botswana: 'BWA',
  'democratic-republic-of-the-congo': 'COD',
  'republic-of-the-congo': 'COG',
  gabon: 'GAB',
  'dominican-republic': 'DOM',
  honduras: 'HND',
  guatemala: 'GTM',
  'el-salvador': 'SLV',
  'costa-rica': 'CRI',
  panama: 'PAN',
  nicaragua: 'NIC',
  bolivia: 'BOL',
  paraguay: 'PRY',
  uruguay: 'URY',
  'trinidad-and-tobago': 'TTO',
  jamaica: 'JAM',
  haiti: 'HTI',
  iceland: 'ISL',
  ireland: 'IRL',
  latvia: 'LVA',
  estonia: 'EST',
  lithuania: 'LTU',
  moldova: 'MDA',
  'north-macedonia': 'MKD',
  albania: 'ALB',
  'bosnia-and-herzegovina': 'BIH',
  slovenia: 'SVN',
  montenegro: 'MNE',
  cyprus: 'CYP',
  luxembourg: 'LUX',
  malta: 'MLT',
  madagascar: 'MDG',
  'burkina-faso': 'BFA',
  'guinea-bissau': 'GNB',
  guinea: 'GIN',
  togo: 'TGO',
  benin: 'BEN',
  'sierra-leone': 'SLE',
  liberia: 'LBR',
  'central-african-republic': 'CAF',
  'equatorial-guinea': 'GNQ',
  'south-sudan': 'SSD',
  lesotho: 'LSO',
  eswatini: 'SWZ',
  swaziland: 'SWZ',
  mauritius: 'MUS',
};

// Reverse map: ISO3 → GFP slug
const ISO3_TO_GFP_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(GFP_SLUG_TO_ISO3).map(([slug, iso3]) => [iso3, slug])
);

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Extract a `var nameJS = NNN;` JavaScript variable from the page. */
function extractJS(html: string, name: string): number | null {
  const re = new RegExp(`var\\s+${name}\\s*=\\s*([\\d,]+)\\s*;`);
  const m = html.match(re);
  return m ? parseNumber(m[1]) : null;
}

/**
 * Extract the value that appears inside a `textWhite textShadow` span
 * immediately after a label string (within 600 chars).
 */
function extractAfterLabel(html: string, label: string): number | null {
  const idx = html.indexOf(label);
  if (idx === -1) return null;
  const window = html.slice(idx, idx + 600);
  // Match pattern: <span class="textWhite textShadow">NUMBER</span>
  const m = window.match(/textWhite[^"]*textShadow[^>]*>([\d,]+)/);
  return m ? parseNumber(m[1]) : null;
}

/**
 * Extract tonnage value: looks for "Total Tonnage:" label then
 * "NNN,NNN tonnes" nearby.
 */
function extractTonnage(html: string): number | null {
  const idx = html.indexOf('Total Tonnage:');
  if (idx === -1) return null;
  const window = html.slice(idx, idx + 300);
  const m = window.match(/([\d,]+)\s*tonnes/);
  return m ? parseNumber(m[1]) : null;
}

/**
 * Extract total aircraft from "Aircraft Total:" → "Stock: N,NNN"
 */
function extractTotalAircraft(html: string): number | null {
  const idx = html.indexOf('Aircraft Total:');
  if (idx === -1) return null;
  const window = html.slice(idx, idx + 300);
  const m = window.match(/Stock:\s*([\d,]+)/);
  if (m) return parseNumber(m[1]);
  // Fallback: first number in textWhite textShadow after the label
  return extractAfterLabel(html.slice(idx), 'Aircraft Total:');
}

/**
 * Extract total naval assets from "Total Assets:" label.
 */
function extractTotalNaval(html: string): number | null {
  const idx = html.indexOf('Total Assets:');
  if (idx === -1) return null;
  const window = html.slice(idx, idx + 200);
  // Pattern: <span class="textLarge textWhite textShadow">465</span>
  const m = window.match(/textWhite[^"]*textShadow[^>]*>([\d,]+)/);
  return m ? parseNumber(m[1]) : null;
}

/**
 * Parse the GFP rankings page to extract country slugs and power indices.
 * The page contains links like: country_id=united-states-of-america
 * and power indices like: 0.0690
 */
function parseRankings(html: string): Array<{ countryCode: string; powerIndex: number; rank: number }> {
  const results: Array<{ countryCode: string; powerIndex: number; rank: number }> = [];

  // Find all country_id= occurrences
  const slugPattern = /country_id=([\w-]+)/g;
  let match: RegExpExecArray | null;
  const slugPositions: Array<{ slug: string; index: number }> = [];

  while ((match = slugPattern.exec(html)) !== null) {
    const slug = match[1];
    if (GFP_SLUG_TO_ISO3[slug]) {
      slugPositions.push({ slug, index: match.index });
    }
  }

  // Deduplicate slugs (each may appear multiple times in href/src)
  const seenSlugs = new Set<string>();
  const uniqueSlugPositions: Array<{ slug: string; index: number }> = [];
  for (const sp of slugPositions) {
    if (!seenSlugs.has(sp.slug)) {
      seenSlugs.add(sp.slug);
      uniqueSlugPositions.push(sp);
    }
  }

  // For each slug, find the power index (format: 0.XXXX, value between 0 and 6)
  // by looking in a window around the slug position
  const pwrPattern = /\b([0-5]\.\d{4})\b/g;
  const allPwrMatches: Array<{ value: number; index: number }> = [];
  while ((match = pwrPattern.exec(html)) !== null) {
    allPwrMatches.push({ value: parseFloat(match[1]), index: match.index });
  }

  let rank = 1;
  for (const { slug, index } of uniqueSlugPositions) {
    const iso3 = GFP_SLUG_TO_ISO3[slug];
    if (!iso3) continue;

    // Find the closest power index to this slug position (within 2000 chars forward)
    let best: { value: number; dist: number } | null = null;
    for (const pwr of allPwrMatches) {
      const dist = pwr.index - index;
      if (dist < 0 || dist > 2000) continue;
      if (!best || dist < best.dist) {
        best = { value: pwr.value, dist };
      }
    }

    if (best !== null) {
      results.push({ countryCode: iso3, powerIndex: best.value, rank });
      rank++;
    }
  }

  // Sort by power index ascending (lower = stronger = higher rank)
  results.sort((a, b) => a.powerIndex - b.powerIndex);
  results.forEach((r, i) => { r.rank = i + 1; });

  return results;
}

/**
 * Parse a GFP country detail page to extract Air Power, Land Forces,
 * Naval Forces, and Manpower stats.
 *
 * Strategy: GFP embeds actual counts in JavaScript variables (var xxxJS = N)
 * and a few labeled text sections. We extract from JS vars first (most reliable),
 * then fall back to label-proximity for fields not in JS vars.
 */
function parseCountryDetail(html: string) {
  // JS variables (most reliable — actual counts, not ranks)
  const fighterJS     = extractJS(html, 'fighterJS');
  const attackJS      = extractJS(html, 'attackJS');
  const helicopterJS  = extractJS(html, 'helicopterJS');
  const attackheloJS  = extractJS(html, 'attackheloJS');
  const transportJS   = extractJS(html, 'transportJS');
  const trainerJS     = extractJS(html, 'trainerJS');
  const specialJS     = extractJS(html, 'specialJS');
  const tankerJS      = extractJS(html, 'tankerJS');

  const tanksJS       = extractJS(html, 'tanksJS');
  const afvJS         = extractJS(html, 'afvJS');
  const spgJS         = extractJS(html, 'spgJS');
  const artilleryJS   = extractJS(html, 'artilleryJS');
  const mlrsJS        = extractJS(html, 'mlrsJS');

  const accarrierJS   = extractJS(html, 'accarrierJS');
  const helocarrierJS = extractJS(html, 'helocarrierJS');
  const destroyerJS   = extractJS(html, 'destroyerJS');
  const frigateJS     = extractJS(html, 'frigateJS');
  const corvetteJS    = extractJS(html, 'corvetteJS');
  const subJS         = extractJS(html, 'subJS');

  // Total aircraft = sum of all fixed-wing + rotorcraft JS vars
  const jsAircraftTotal =
    fighterJS !== null || helicopterJS !== null
      ? (fighterJS ?? 0) + (attackJS ?? 0) + (transportJS ?? 0) +
        (trainerJS ?? 0) + (specialJS ?? 0) + (tankerJS ?? 0) +
        (helicopterJS ?? 0)
      : null;

  // Total carriers = conventional + helo carriers
  const totalCarriers =
    accarrierJS !== null || helocarrierJS !== null
      ? (accarrierJS ?? 0) + (helocarrierJS ?? 0)
      : null;

  return {
    airPower: {
      totalAircraft: extractTotalAircraft(html) ?? jsAircraftTotal,
      fighters: fighterJS,
      attackAircraft: attackJS,
      helicopters: helicopterJS,
      attackHelicopters: attackheloJS,
    },
    landForces: {
      tanks: tanksJS,
      armoredVehicles: afvJS,
      selfPropelledArtillery: spgJS,
      towedArtillery: artilleryJS,
      rocketArtillery: mlrsJS,
    },
    navalForces: {
      totalAssets: extractTotalNaval(html),
      totalTonnage: extractTonnage(html),
      carriers: totalCarriers,
      destroyers: destroyerJS,
      frigates: frigateJS,
      submarines: subJS,
      corvettes: corvetteJS,
    },
    manpower: {
      army: extractAfterLabel(html, 'Army Personnel*'),
      airForce: extractAfterLabel(html, 'Air Force Personnel*'),
      navy: extractAfterLabel(html, 'Navy Personnel*'),
    },
  };
}

export default {
  async fetchRankings() {
    const cacheKey = 'gfp-rankings';
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${GFP_BASE_URL}/countries-listing.php`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!response.ok) {
        throw new Error(`GFP rankings fetch failed: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      const rankings = parseRankings(html);

      if (rankings.length === 0) {
        throw new Error('GFP rankings parse returned 0 results — HTML structure may have changed');
      }

      await setCached(cacheKey, rankings);
      return rankings;
    } catch (error) {
      strapi.log.error('Error fetching GFP rankings:', error);
      throw error;
    }
  },

  async fetchCountryDetail(iso3: string) {
    const cacheKey = `gfp-country-${iso3}`;
    const cached = await getCached(cacheKey);
    if (cached) return cached;

    const slug = ISO3_TO_GFP_SLUG[iso3];
    if (!slug) {
      throw new Error(`No GFP slug mapping for ISO3: ${iso3}`);
    }

    try {
      const url = `${GFP_BASE_URL}/country-military-strength-detail.php?country_id=${slug}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `${GFP_BASE_URL}/countries-listing.php`,
        },
      });
      if (!response.ok) {
        throw new Error(`GFP detail fetch failed for ${iso3}: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      const detail = parseCountryDetail(html);

      await setCached(cacheKey, detail);
      return detail;
    } catch (error) {
      strapi.log.error(`Error fetching GFP detail for ${iso3}:`, error);
      throw error;
    }
  },
};
