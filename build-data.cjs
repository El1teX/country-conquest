const fs = require('fs');
const path = require('path');
const getBounds = require('svg-path-bounds');

const svgMap = require('./node_modules/@svg-maps/world/index.js').default;
const countries = require('./node_modules/world-countries/index.cjs');

const cca3ToCca2 = new Map();
const cca2ToCountry = new Map();
countries.forEach(c => {
  cca3ToCca2.set(c.cca3.toLowerCase(), c.cca2.toLowerCase());
  cca2ToCountry.set(c.cca2.toLowerCase(), c);
});

// Top countries realistic data (GDP in Billion USD, Army active personnel)
const realisticMajor = {
  us: { gdp: 27360, army: 1390000, perk: 'blitzkrieg' },
  cn: { gdp: 17790, army: 2035000, perk: 'demography' },
  de: { gdp: 44560, army: 181000, perk: 'technocracy' },
  jp: { gdp: 4210, army: 247000, perk: 'technocracy' },
  in: { gdp: 3730, army: 1455000, perk: 'demography' },
  gb: { gdp: 3340, army: 152000, perk: 'banking' },
  fr: { gdp: 3030, army: 205000, perk: 'blitzkrieg' },
  it: { gdp: 2250, army: 165000, perk: 'blitzkrieg' },
  br: { gdp: 2170, army: 360000, perk: 'demography' },
  ca: { gdp: 2140, army: 68000, perk: 'blitzkrieg' },
  ru: { gdp: 2000, army: 1320000, perk: 'military' },
  kr: { gdp: 1710, army: 500000, perk: 'technocracy' },
  au: { gdp: 1690, army: 60000, perk: 'blitzkrieg' },
  mx: { gdp: 1780, army: 216000, perk: 'demography' },
  es: { gdp: 1580, army: 120000, perk: 'blitzkrieg' },
  id: { gdp: 1370, army: 400000, perk: 'demography' },
  nl: { gdp: 1110, army: 41000, perk: 'technocracy' },
  tr: { gdp: 1100, army: 425000, perk: 'military' },
  sa: { gdp: 1070, army: 257000, perk: 'oil' },
  ch: { gdp: 905, army: 147000, perk: 'fortress' },
  pl: { gdp: 857, army: 160000, perk: 'military' },
  tw: { gdp: 756, army: 170000, perk: 'technocracy' },
  be: { gdp: 632, army: 25000, perk: 'banking' },
  se: { gdp: 593, army: 24000, perk: 'technocracy' },
  ar: { gdp: 640, army: 83000, perk: 'blitzkrieg' },
  ie: { gdp: 545, army: 9000, perk: 'banking' },
  no: { gdp: 485, army: 23000, perk: 'oil' },
  at: { gdp: 516, army: 22000, perk: 'fortress' },
  ae: { gdp: 507, army: 65000, perk: 'oil' },
  il: { gdp: 509, army: 170000, perk: 'military' },
  sg: { gdp: 501, army: 72000, perk: 'technocracy' },
  th: { gdp: 514, army: 360000, perk: 'demography' },
  eg: { gdp: 395, army: 438000, perk: 'military' },
  vn: { gdp: 430, army: 482000, perk: 'fortress' },
  ir: { gdp: 400, army: 580000, perk: 'military' },
  za: { gdp: 377, army: 73000, perk: 'blitzkrieg' },
  dk: { gdp: 404, army: 17000, perk: 'technocracy' },
  ph: { gdp: 437, army: 143000, perk: 'demography' },
  pk: { gdp: 340, army: 654000, perk: 'military' },
  co: { gdp: 363, army: 293000, perk: 'military' },
  fi: { gdp: 300, army: 24000, perk: 'fortress' },
  pt: { gdp: 287, army: 27000, perk: 'blitzkrieg' },
  cl: { gdp: 335, army: 77000, perk: 'fortress' },
  cz: { gdp: 330, army: 27000, perk: 'technocracy' },
  ro: { gdp: 350, army: 71500, perk: 'military' },
  pe: { gdp: 268, army: 81000, perk: 'blitzkrieg' },
  nz: { gdp: 253, army: 9000, perk: 'blitzkrieg' },
  kz: { gdp: 261, army: 70000, perk: 'oil' },
  gr: { gdp: 238, army: 142000, perk: 'fortress' },
  ua: { gdp: 180, army: 800000, perk: 'military' },
  qa: { gdp: 235, army: 16500, perk: 'oil' },
  dz: { gdp: 240, army: 130000, perk: 'oil' },
  hu: { gdp: 212, army: 37000, perk: 'technocracy' },
  kw: { gdp: 160, army: 17500, perk: 'oil' },
  ma: { gdp: 141, army: 195000, perk: 'military' },
  ve: { gdp: 100, army: 125000, perk: 'oil' },
  kp: { gdp: 40, army: 1280000, perk: 'military' },
  by: { gdp: 72, army: 48000, perk: 'military' },
  uz: { gdp: 90, army: 48000, perk: 'oil' }
};

const perksDef = {
  oil: { id: 'oil', name: 'Ресурсная сверхдержава', icon: 'RES', desc: 'Ударная мощь от ВВП +50%', gdpPowerMult: 1.5 },
  demography: { id: 'demography', name: 'Демографический гигант', icon: 'DEM', desc: 'Базовая армия +30%', armyPowerMult: 1.3 },
  military: { id: 'military', name: 'Милитаристская держава', icon: 'MIL', desc: 'Потери армии при неудаче снижены вдвое', casualtyDiscount: 0.5 },
  technocracy: { id: 'technocracy', name: 'Технократия и хай-тек', icon: 'TECH', desc: 'Множитель кубика 1.25x вместо 1.1x', diceMultiplierCoeff: 1.25 },
  fortress: { id: 'fortress', name: 'Несокрушимая крепость', icon: 'FORT', desc: 'Кубик d5 гарантированно не падает ниже 2', minDice: 2 },
  blitzkrieg: { id: 'blitzkrieg', name: 'Блицкриг-доктрина', icon: 'BLITZ', desc: 'Множитель кубика 1.25x вместо 1.1x', diceMultiplierCoeff: 1.25 },
  banking: { id: 'banking', name: 'Финансовая столица', icon: 'FIN', desc: 'Экономическая мощь ВВП +40%', gdpPowerMult: 1.4 }
};

const perkKeys = Object.keys(perksDef);

// Maritime links
const maritimeLinks = {
  'jp': ['kr', 'ru', 'cn', 'tw', 'ph'],
  'gb': ['fr', 'ie', 'be', 'nl'],
  'ie': ['gb'],
  'au': ['id', 'pg', 'nz'],
  'nz': ['au', 'fj'],
  'cu': ['us', 'mx', 'bs', 'jm', 'ht'],
  'is': ['gb', 'no', 'gl'],
  'gl': ['ca', 'is'],
  'ph': ['tw', 'my', 'id', 'vn'],
  'id': ['my', 'pg', 'au', 'sg', 'ph'],
  'mg': ['mz', 'za', 'tz'],
  'lk': ['in'],
  'tw': ['cn', 'jp', 'ph'],
  'cy': ['tr', 'gr', 'sy', 'lb'],
  'mt': ['it', 'tn'],
  'sg': ['my', 'id'],
  'bh': ['sa', 'qa'],
  'qa': ['sa', 'ae', 'bh'],
  'jm': ['cu', 'ht'],
  'do': ['ht', 'pr'],
  'ht': ['do', 'cu', 'jm'],
  'mu': ['mg'],
  'sc': ['mg', 'ke'],
  'cv': ['sn', 'mr'],
  'tt': ['ve'],
  'fj': ['nz', 'vu'],
  'pg': ['id', 'au', 'sb'],
  'sb': ['pg', 'vu'],
  'vu': ['sb', 'fj'],
  'km': ['mz', 'mg'],
  'mv': ['in', 'lk'],
  'bs': ['us', 'cu'],
  'bb': ['lc', 'tt'],
  'ws': ['fj', 'to'],
  'to': ['fj', 'ws']
};

const validIds = new Set(svgMap.locations.map(l => l.id.toLowerCase()));
const neighborsMap = new Map();
validIds.forEach(id => neighborsMap.set(id, new Set()));

// Build border adjacency
svgMap.locations.forEach(loc => {
  const id = loc.id.toLowerCase();
  const c = cca2ToCountry.get(id);
  if (c && c.borders) {
    c.borders.forEach(b3 => {
      const b2 = cca3ToCca2.get(b3.toLowerCase());
      if (b2 && validIds.has(b2) && b2 !== id) {
        neighborsMap.get(id).add(b2);
        neighborsMap.get(b2).add(id);
      }
    });
  }
  if (maritimeLinks[id]) {
    maritimeLinks[id].forEach(m2 => {
      if (validIds.has(m2) && m2 !== id) {
        neighborsMap.get(id).add(m2);
        neighborsMap.get(m2).add(id);
      }
    });
  }
});

function dist(c1, c2) {
  if (!c1 || !c2 || !c1.latlng || !c2.latlng) return 999999;
  const dLat = c1.latlng[0] - c2.latlng[0];
  const dLng = c1.latlng[1] - c2.latlng[1];
  return dLat * dLat + dLng * dLng;
}

validIds.forEach(id => {
  if (neighborsMap.get(id).size === 0) {
    const c1 = cca2ToCountry.get(id);
    let bestDist = Infinity;
    let bestId = null;
    validIds.forEach(otherId => {
      if (otherId === id) return;
      const c2 = cca2ToCountry.get(otherId);
      const d = dist(c1, c2);
      if (d < bestDist) {
        bestDist = d;
        bestId = otherId;
      }
    });
    if (bestId) {
      neighborsMap.get(id).add(bestId);
      neighborsMap.get(bestId).add(id);
    }
  }
});

// Build final country dictionary with exact SVG bounding boxes
const countriesData = {};

svgMap.locations.forEach((loc) => {
  const id = loc.id.toLowerCase();
  const c = cca2ToCountry.get(id);
  const major = realisticMajor[id];

  const nameEn = (c && c.name && c.name.common) || loc.name || id.toUpperCase();
  const nameRu = (c && c.translations && c.translations.rus && c.translations.rus.common) || nameEn;
  const capital = (c && c.capital && c.capital[0]) || '';
  const region = (c && c.region) || 'World';

  let population = (c && c.population) ? c.population : 1000000;
  if (population < 100000) population = 100000;

  let gdp;
  if (major && major.gdp) {
    gdp = major.gdp;
  } else {
    let gdpPerCapita = 12000;
    if (region === 'Europe') gdpPerCapita = 35000;
    else if (region === 'Americas') gdpPerCapita = 16000;
    else if (region === 'Asia') gdpPerCapita = 11000;
    else if (region === 'Oceania') gdpPerCapita = 30000;
    else if (region === 'Africa') gdpPerCapita = 3500;
    gdp = Math.max(10, Math.round((population * gdpPerCapita) / 1e9));
  }

  let army;
  if (major && major.army) {
    army = major.army;
  } else {
    army = Math.max(15000, Math.round(population * 0.0045));
  }

  let perkId;
  if (major && major.perk) {
    perkId = major.perk;
  } else {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
    perkId = perkKeys[Math.abs(hash) % perkKeys.length];
  }

  const perk = perksDef[perkId] || perksDef['blitzkrieg'];
  const neighbors = Array.from(neighborsMap.get(id) || []);

  // Compute exact bounding box for flag texturing
  let bbox = { x: 0, y: 0, w: 100, h: 100 };
  try {
    const [left, top, right, bottom] = getBounds(loc.path);
    bbox = {
      x: +left.toFixed(2),
      y: +top.toFixed(2),
      w: +Math.max(1, right - left).toFixed(2),
      h: +Math.max(1, bottom - top).toFixed(2)
    };
  } catch (err) {
    console.warn('Could not compute bounds for ' + id);
  }

  countriesData[id] = {
    id,
    name: nameEn,
    nameRu,
    capital,
    region,
    gdp,
    population,
    army,
    perk,
    neighbors,
    path: loc.path,
    bbox
  };
});

const output = `// Auto-generated Country Conquest World Data with Flag BBoxes
export const WORLD_VIEWBOX = "${svgMap.viewBox}";
export const PERKS_DEF = ${JSON.stringify(perksDef, null, 2)};
export const COUNTRIES_DATA = ${JSON.stringify(countriesData, null, 2)};
`;

fs.writeFileSync('C:/Users/maxim/.gemini/antigravity/scratch/country-conquest/src/worldData.js', output, 'utf8');
console.log('Successfully generated src/worldData.js with bboxes for ' + Object.keys(countriesData).length + ' countries!');
