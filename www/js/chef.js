// Mise chef intelligence: pairing maths from real dish compositions (USDA FNDDS) plus Mise's own aroma map,
// and the recipe grammar (sauce, texture and finishing blocks) with compatibility rules.
// Data: www/data/chefdb.json (built by tools/build_chefdb.py from public-domain USDA data). Commercially usable.
import { ITEM } from './data.js';
import { CATKEY } from './chefmap.js';
import * as FL from './flavour.js';
import * as PR from './pairings.js';

let DB = null, NUT = null;
const cache = new Map();
export const ready = () => !!DB;
export function setDB(db, nut, nmap) { DB = db; if (nut) NUT = nut; if (nmap) NUTMAP = nmap; cache.clear(); }
export async function load() {
  if (DB) return true;
  try { const r = await fetch('data/chefdb.json'); setDB(await r.json()); return true; } catch (e) { return false; }
}
let NUTMAP = {};
export async function loadNutrition() {
  if (NUT) return NUT;
  try { const [a, b] = await Promise.all([fetch('data/nutrition.json'), fetch('data/nutmap.json')]); NUT = await a.json(); NUTMAP = await b.json(); return NUT; } catch (e) { return null; }
}

// ---------- ingredient identity ----------
export const keyOf = id => CATKEY[id] || null;
export function fname(id) { return keyOf(id); }
const keyData = k => (DB && k ? DB.keys[k] : null);
// how much more often real dishes combine two ingredient families than chance (normalised PMI); null = no evidence
function rec(a, b) {
  const ka = keyOf(a), kb = keyOf(b); if (!ka || !kb || ka === kb) return null;
  const A = keyData(ka), B = keyData(kb); if (!A || !B) return null;
  const v = (A.p && A.p[kb] != null) ? A.p[kb] : (B.p && B.p[ka] != null ? B.p[ka] : null);
  if (v != null) return v;
  if (A.n >= 25 && B.n >= 25) return -0.04; // both common in dishes, practically never together
  return null;
}
// cooking adds roasted (Maillard) notes to proteins and veg
const BROWN = new Set(['roast', 'traybake', 'panfry', 'sticky', 'burgers', 'stirfry', 'hash', 'loaded', 'friedrice']);
function vec(id, tech) {
  const a = FL.aroma(id); if (!a) return null;
  const v = { ...a.n };
  if (tech && BROWN.has(tech) && (CATKEY[id] && /chicken|turkey|duck|beef|pork|lamb|sausage|potato|onion|mushroom|carrot|cauliflower|broccoli|bread|tortilla/.test(CATKEY[id]))) v.R = Math.max(v.R || 0, 2);
  return v;
}
function aroCos(a, b, tech) {
  const A = vec(a, tech), B = vec(b, tech); if (!A || !B) return null;
  let d = 0, na = 0, nb = 0; for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) { const x = A[k] || 0, y = B[k] || 0; d += x * y; na += x * x; nb += y * y; }
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}
// The pairing score between two Mise ingredients (optionally as cooked by a technique)
export function pair(idA, idB, tech) {
  if (!DB || !idA || !idB || idA === idB) return null;
  const k = (idA < idB ? idA + '|' + idB : idB + '|' + idA) + '|' + (tech && BROWN.has(tech) ? 'b' : '');
  if (cache.has(k)) return cache.get(k);
  const r = rec(idA, idB), ac = aroCos(idA, idB, tech), kn = PR.known(idA, idB, keyOf);
  if (r == null && ac == null && !kn) { cache.set(k, null); return null; }
  const recS = r == null ? null : Math.max(-1, Math.min(1, r * 2.5));
  const aro = ac == null ? 0.3 : ac;
  // three kinds of evidence: chef knowledge (Mise's own), real dish data (USDA), shared aroma families
  let s = recS == null ? (aro - 0.25) * 0.4 : recS * 0.6 + (aro - 0.25) * 0.3;
  if (kn === 2) s = Math.max(s, 0.32) + 0.08; else if (kn === 1) s = Math.max(s, 0.24) + 0.04; else if (kn === -1) s = Math.min(s, -0.3);
  const out = { s, rec: r, comp: aro, fam: aro, n: 0, known: kn };
  cache.set(k, out); return out;
}
const NOTE = { R: 'roasted', Ca: 'caramel', Sv: 'savoury', Gr: 'green', Ci: 'citrus', Pi: 'herbal', Fr: 'fruity', Cr: 'creamy', Sp: 'warm-spice', Sm: 'smoky', Ea: 'earthy', Fl: 'floral', Fu: 'tangy', Um: 'umami', Me: 'meaty', An: 'aniseed' };
export function sharedFams(idA, idB, tech) {
  const A = vec(idA, tech), B = vec(idB, tech); if (!A || !B) return [];
  return Object.keys(A).filter(k => B[k]).sort((x, y) => Math.min(B[y], A[y]) - Math.min(B[x], A[x]));
}
const QUIET = new Set(['garlic', 'onion', 'oil', 'olive-oil', 'salt', 'black-pepper', 'stock', 'flour', 'sugar', 'butter']);
// Harmony of a whole dish: mean pairing over its meaningful pairs, with the hero pairings counted double
export function harmony(ids, tech, hero) {
  if (!DB) return null;
  const xs = [...new Set(ids.filter(id => id && !QUIET.has(id)))];
  let t = 0, w = 0, known = 0;
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
    const p = pair(xs[i], xs[j], tech); if (!p) continue; known++;
    const wt = xs[i] === hero || xs[j] === hero ? 2 : 1; t += p.s * wt; w += wt;
  }
  return w ? { h: t / w, pairs: known } : null;
}
// Plain-English reasons for a pairing
export function why(idA, idB, tech) {
  const p = pair(idA, idB, tech); if (!p) return null;
  const bits = [];
  if (p.known === 2) bits.push('a classic pairing'); else if (p.known === 1) bits.push('a bold pairing chefs use');
  if (p.rec != null && p.rec > 0.08) bits.push(p.rec > 0.2 ? 'proven in real dishes' : 'often combined in real dishes');
  const f = sharedFams(idA, idB, tech).slice(0, 2).map(x => NOTE[x]).filter(Boolean);
  if (f.length && p.comp >= 0.45) bits.push(`both have ${f.join(' and ')} notes`);
  return bits.join('; ') || null;
}
// Partners for an ingredient: classic (dish evidence), surprising and wild (shared aromas, little evidence)
export function partnersOf(id, mapBack) {
  if (!FL.aroma(id) && !keyOf(id)) return null;
  const out = { classic: [], surprising: [], wild: [] }, catA = FL.catOf(id);
  for (const b of mapBack()) {
    if (b === id) continue; const p = pair(id, b); if (!p) continue;
    if (p.known === 2 || (p.rec != null && p.rec > 0.08)) out.classic.push([(p.known === 2 ? 1 : 0) + (p.rec || 0) * 3 + p.comp, b, p]);
    else if (p.known === 1) out.wild.push([1 + p.comp, b, p]);
    else if (p.comp >= 0.55 && (p.rec == null || p.rec <= 0.03)) (FL.catOf(b) !== catA ? out.wild : out.surprising).push([p.comp, b, p]);
  }
  for (const k of Object.keys(out)) out[k] = out[k].sort((x, y) => y[0] - x[0]).map(x => ({ id: x[1], p: x[2] }));
  return out;
}

// ---------- techniques: doneness and handling (food-safety guidance) ----------
export const DONE = {
  chicken: 'cook until the juices run clear and there is no pink in the middle (75°C at the thickest part)',
  pork: 'cook until there is no pink and the juices run clear (70°C), then rest a few minutes',
  mince: 'cook mince until there is no pink left',
  burgers: 'cook burgers through with no pink in the middle (70°C)',
  fish: 'cook until it flakes easily and is opaque all the way through',
  prawns: 'cook prawns until pink all over and curled, 2–3 minutes',
  beef: 'steaks and joints can be served pink; rest them before slicing',
  lamb: 'chops and joints can be pink in the middle; rest them before carving'
};

// ---------- recipe grammar: blocks and compatibility constraints ----------
// Every dish = INGREDIENTS (main, base, veg) + FLAVOUR (the flavour kit) + TECHNIQUE (method)
//            + SAUCE (optional) + TEXTURE (contrast) + FINISH (balance). Blocks only join when their constraints hold.
const has = (S, id) => S.has(id);
export const SAUCES = [
  { id: 'pansauce', n: 'pan sauce', techs: 'panfry roast', fams: 'british french american italian', need: [['stock'], ['cream', 'creme-fraiche', 'butter', 'mustard']], not: 'fl:creamy coconut-milk soy-sauce fish-sauce curry-paste',
    step: (x, w) => `Pour off most of the fat, add a splash of stock to the hot pan and scrape up the browned bits. Bubble for 2 minutes, then stir in a spoon of ${w[1]}. Spoon over.` },
  { id: 'herbsauce', n: 'green herb sauce', techs: 'panfry roast traybake bowl sticky burgers wraps', fams: 'med italian mex british american french mideast', need: [['parsley', 'coriander', 'basil', 'mint'], ['lemon', 'lime', 'vinegar']], not: 'fl:creamy soy-sauce bbq-sauce sweet-chilli',
    step: (x, w) => `Finely chop a handful of ${w[0]} with a little garlic, a squeeze of ${w[1]}, a pinch of salt and a few spoons of olive oil. Spoon over to serve.` },
  { id: 'yogsauce', n: 'garlic yogurt sauce', techs: 'curry traybake wraps bowl panfry roast flatbread', fams: 'indian mideast med', need: [['yogurt'], ['mint', 'cucumber', 'lemon', 'coriander', 'garlic']], not: 'fl:creamy coconut-milk cream soy-sauce bbq-sauce honey sweet-chilli',
    step: (x, w) => `Stir ${w[1] === 'garlic' ? 'a little grated garlic' : w[1] === 'cucumber' ? 'grated cucumber' : `chopped ${w[1]}`} and a pinch of salt into the yogurt. Serve cool on the side.` },
  { id: 'glaze', n: 'sticky glaze', techs: 'panfry traybake roast', fams: 'asian american british thai', need: [['honey', 'syrup'], ['soy-sauce', 'mustard', 'vinegar']], not: 'fl:sweet fl:creamy curry-powder curry-paste garam-masala cumin turmeric yogurt',
    step: (x, w) => `Mix a spoon of ${w[0]} with a splash of ${w[1]}. Brush over for the last few minutes until sticky and glossy.` },
  { id: 'peanut', n: 'peanut sauce', techs: 'bowl stirfry wraps noodlesoup', fams: 'asian thai', need: [['peanut-butter'], ['soy-sauce'], ['lime', 'vinegar']], not: 'fl:creamy cream',
    step: (x, w) => `Whisk a spoon of peanut butter with a splash of soy, a squeeze of ${w[2]} and enough hot water to make it pourable. Drizzle over.` },
  { id: 'salsa', n: 'fresh tomato salsa', techs: 'wraps bowl burgers panfry traybake quesadilla loaded', fams: 'mex american', need: [['tomato', 'cherry-tomato'], ['red-onion', 'onion', 'spring-onion'], ['lime', 'lemon']], not: '',
    step: (x, w) => `Finely chop the ${w[0] === 'cherry-tomato' ? 'cherry tomatoes' : 'tomato'} and a little ${w[1].replace('-', ' ')}, mix with a squeeze of ${w[2]} and a pinch of salt.` },
  { id: 'tahini', n: 'lemon tahini sauce', techs: 'traybake roast bowl wraps flatbread panfry', fams: 'mideast med', need: [['tahini'], ['lemon', 'lime']], not: 'fl:creamy soy-sauce bbq-sauce',
    step: (x, w) => `Whisk 2 spoons of tahini with a squeeze of ${w[1]}, a pinch of salt and cold water until smooth and pourable. Drizzle over.` },
  { id: 'gravy', n: 'onion gravy', techs: 'panfry roast traybake burgers', fams: 'british american', need: [['gravy', 'stock'], ['onion']], not: 'fl:creamy soy-sauce curry-paste coconut-milk',
    step: () => 'Soften a sliced onion in the pan for 8 minutes, stir in gravy granules or a little flour and stock, and bubble until thick.' },
  { id: 'pesto', n: 'pesto drizzle', techs: 'panfry roast traybake bowl salad', fams: 'italian med', need: [['pesto'], ['lemon', 'olive-oil']], not: 'fl:creamy soy-sauce curry-paste bbq-sauce',
    step: (x, w) => `Loosen a spoon of pesto with ${w[1] === 'lemon' ? 'a squeeze of lemon' : 'a little olive oil'} and drizzle over.` },
  { id: 'vinaigrette', n: 'mustard dressing', techs: 'salad bowl', fams: '*', need: [['vinegar', 'lemon'], ['mustard', 'honey']], not: 'fl:creamy',
    step: (x, w) => `Shake 3 spoons of oil with 1 of ${w[0]}, a little ${w[1]} and a pinch of salt. Dress while the ingredients are warm.` }
];
export const TEXTURES = [
  { id: 'nutcrunch', n: 'toasted nuts', item: 'nuts', fams: '*', meths: 'curry noodlesoup braise pulled soup', step: () => 'Toast a handful of nuts in a dry pan until golden, roughly chop and scatter over for crunch.' },
  { id: 'crumbs', n: 'garlic crumbs', item: 'breadcrumbs', fams: 'italian british french med american', meths: 'pasta bake pie risotto soup braise simmer', step: () => 'Fry a handful of breadcrumbs in a little oil with a pinch of garlic until golden and crisp. Scatter over.' },
  { id: 'sesame', n: 'toasted sesame', item: 'sesame-oil', fams: 'asian thai', meths: 'curry noodlesoup soup pulled', step: () => 'Finish with a few drops of sesame oil and, if you have them, toasted sesame seeds.' },
  { id: 'crispchick', n: 'crispy chickpeas', item: 'chickpeas', fams: 'indian mideast med', meths: 'curry soup braise simmer', step: () => 'Drain and dry some chickpeas, fry them in hot oil with a pinch of salt and spice until crisp. Scatter over.' },
  { id: 'slaw', n: 'crunchy slaw', item: 'cabbage', fams: 'american british mex asian', meths: 'pulled braise simmer bake pie', step: () => 'Very finely shred some cabbage (and carrot), toss with a splash of vinegar and a pinch of salt for a crunchy side.' },
  { id: 'rawonion', n: 'quick-pickled onion', item: 'red-onion', fams: 'mex american mideast med indian', meths: 'curry pulled braise simmer soup shakshuka', step: () => 'Thinly slice a little red onion, toss with a pinch of salt and a squeeze of lime or a splash of vinegar. Leave 10 minutes.' },
  { id: 'springonion', n: 'sliced spring onion', item: 'spring-onion', fams: 'asian thai mex american', meths: 'curry noodlesoup soup simmer pulled pasta', step: () => 'Slice spring onions thinly and scatter over for crunch and freshness.' }
];
const SOFT = new Set(['curry', 'simmer', 'pasta', 'risotto', 'soup', 'braise', 'pie', 'bake', 'pulled', 'noodlesoup', 'shakshuka']);
const DRY = new Set(['traybake', 'roast', 'panfry', 'bowl', 'wraps', 'burgers', 'sticky', 'loaded', 'salad']);
// Pick the sauce and texture blocks for a dish. dish: { ids, method, fam, tags, hasSauce, crunch, have(id) }
export function blocks(dish) {
  const out = {}; if (!DB) return out;
  const fam = dish.fam, S = new Set(dish.ids);
  const score = extra => { const h = harmony([...dish.ids, ...extra], dish.method, dish.hero); return h ? h.h : 0; };
  const base = score([]);
  // SAUCE: only when the dish is dry and its flavour brings no sauce of its own
  if (!dish.hasSauce && DRY.has(dish.method)) {
    let best = null;
    for (const sc of SAUCES) {
      if (!sc.techs.split(' ').includes(dish.method)) continue;
      if (sc.fams !== '*' && !sc.fams.split(' ').includes(fam)) continue;
      if (sc.not && sc.not.split(' ').some(t => (dish.tags || []).includes(t) || S.has(t))) continue;
      const w = sc.need.map(alts => alts.find(id => dish.have(id)) || null); if (w.some(x => !x)) continue; // build only from what you have
      if (w.filter(id => S.has(id)).length >= Math.max(1, w.length - 1) && sc.id !== 'pansauce') continue; // the dish already has this sauce in all but name
      if (sc.id === 'salsa' && S.has('salsa')) continue;
      const gain = score(w) - base;
      const v = gain + Math.random() * 0.06;
      if (gain > -0.03 && (!best || v > best.v)) best = { v, sc, w };
    }
    if (best) out.sauce = { id: best.sc.id, n: best.sc.n, items: best.w.filter(id => !S.has(id)), step: best.sc.step(dish, best.w.map(id => (ITEM[id] ? ITEM[id].n.toLowerCase().replace(/^fresh /, '').replace(/s$/, '') : id))) };
  }
  // TEXTURE: soft dishes need a crunch
  if (SOFT.has(dish.method) && !dish.crunch) {
    let best = null;
    for (const t of TEXTURES) {
      if (t.fams !== '*' && !t.fams.split(' ').includes(fam)) continue;
      if (t.meths && !t.meths.split(' ').includes(dish.method)) continue;
      if (!dish.have(t.item) || S.has(t.item)) continue;
      const v = score([t.item]) - base + Math.random() * 0.05;
      if (v > -0.04 && (!best || v > best.v)) best = { v, t };
    }
    if (best) out.texture = { id: best.t.id, n: best.t.n, items: [best.t.item], step: best.t.step() };
  }
  return out;
}

// ---------- nutrition from USDA SR28 ----------
export function nutritionOf(id) {
  if (!NUT) return null; const ndb = NUTMAP[id]; if (!ndb) return null;
  NUT.idx = NUT.idx || new Map(NUT.foods.map(r => [r[0], r]));
  const r = NUT.idx.get(ndb); if (!r) return null; const o = {}; NUT.cols.forEach((c, i) => o[c] = r[i]); return o;
}
export const stats = () => DB ? { chefPairs: PR.size(), ingredients: Object.keys(CATKEY).length, families: Object.keys(DB.keys).length, dishes: DB.dishes, pairs: Math.round(Object.values(DB.keys).reduce((a, e) => a + Object.values(e.p || {}).filter(v => v > 0.05).length, 0) / 2), foods: NUT ? NUT.foods.length : null } : null;
// In Node (tests and build tools) load the data straight from disk
if (typeof window === 'undefined' && globalThis.process && process.getBuiltinModule) {
  try { const fs = process.getBuiltinModule('fs'), url = process.getBuiltinModule('url'), path = process.getBuiltinModule('path'); const d = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'data');
    setDB(JSON.parse(fs.readFileSync(path.join(d, 'chefdb.json'))), JSON.parse(fs.readFileSync(path.join(d, 'nutrition.json'))), JSON.parse(fs.readFileSync(path.join(d, 'nutmap.json')))); } catch (e) { /* no data: engine falls back to the built-in map */ }
}

// ---------- taste balance: sweet, salty and rich from USDA numbers; sharp, bitter, umami and heat from the flavour tags ----------
const TAGS = { a: ['lemon', 'lime', 'vinegar', 'capers', 'pickles', 'gherkins', 'yogurt', 'sour-cream', 'creme-fraiche', 'chopped-tomatoes', 'passata', 'tomato', 'cherry-tomato', 'feta', 'goats-cheese', 'kimchi', 'salsa', 'pomegranate', 'apple', 'rhubarb', 'kiwi', 'jalapenos', 'red-onion', 'mint-sauce', 'sweet-chilli', 'bbq-sauce', 'ketchup', 'worcestershire', 'mustard', 'tomato-puree'],
  u: ['soy-sauce', 'miso', 'fish-sauce', 'oyster-sauce', 'parmesan', 'anchovies', 'mushroom', 'tomato-puree', 'worcestershire', 'stock', 'gravy', 'cheddar', 'bacon', 'chorizo', 'ham', 'kimchi', 'beef-mince', 'steak'],
  h: ['chilli', 'chilli-powder', 'chilli-flakes', 'cayenne', 'sriracha', 'hot-sauce', 'jalapenos', 'curry-paste', 'chipotle', 'peri-spice', 'cajun-spice', 'black-pepper', 'ginger', 'mustard', 'kimchi'],
  b: ['coffee', 'cocoa', 'dark-chocolate', 'kale', 'spinach', 'broccoli', 'turmeric', 'tahini', 'olives', 'aubergine'] };
const TAGSET = Object.fromEntries(Object.entries(TAGS).map(([k, v]) => [k, new Set(v)]));
// grams of each ingredient per serving -> taste profile of the dish
export function taste(parts) {
  const t = { sweet: 0, salty: 0, rich: 0, sharp: 0, umami: 0, heat: 0, bitter: 0 };
  for (const [id, g] of parts) {
    const n = nutritionOf(id), w = Math.min(1, g / 100);
    if (n) { t.sweet += (n.sugar || 0) * g / 100; t.salty += (n.sodium || 0) * g / 100000; t.rich += (n.fat || 0) * g / 100; }
    if (TAGSET.a.has(id)) t.sharp += 0.5 + w; if (TAGSET.u.has(id)) t.umami += 0.5 + w; if (TAGSET.h.has(id)) t.heat += 0.6; if (TAGSET.b.has(id)) t.bitter += 0.3 + w * 0.5;
  }
  return { sweet: +t.sweet.toFixed(1), salty: +t.salty.toFixed(2), rich: +t.rich.toFixed(1), sharp: +t.sharp.toFixed(1), umami: +t.umami.toFixed(1), heat: +t.heat.toFixed(1), bitter: +t.bitter.toFixed(1) };
}
// What the plate is missing, from its taste profile
export function needs(t, method) {
  const out = [];
  if (t.rich >= 18 && t.sharp < 1) out.push('sharp');
  if (t.sweet >= 14 && t.sharp < 1.5) out.push('sharp');
  if (t.umami < 0.6 && t.salty < 0.5) out.push('savoury');
  if (['curry', 'simmer', 'braise', 'pulled', 'soup', 'bake', 'pie', 'pasta', 'risotto', 'roast', 'traybake'].includes(method)) out.push('fresh');
  if (t.bitter >= 1 && t.sweet < 6 && t.rich < 10) out.push('round');
  return [...new Set(out)];
}
// FINISH blocks: the last touch, chosen for what the plate needs and how well it pairs
export const FINISHES = [
  { id: 'citrus', n: 'squeeze of lemon', item: 'lemon', fills: 'sharp fresh', fams: 'italian med british french mideast american indian', text: 'Finish with a squeeze of lemon — it lifts the whole plate.' },
  { id: 'lime', n: 'squeeze of lime', item: 'lime', fills: 'sharp fresh', fams: 'thai asian mex indian american', text: 'Squeeze over some lime just before eating.' },
  { id: 'vinegar', n: 'splash of vinegar', item: 'vinegar', fills: 'sharp', fams: 'british american asian french', text: 'A small splash of vinegar at the end sharpens a rich dish.' },
  { id: 'parsley', n: 'chopped parsley', item: 'parsley', fills: 'fresh', fams: 'med french british italian mideast', text: 'Scatter over chopped parsley.' },
  { id: 'coriander', n: 'fresh coriander', item: 'coriander', fills: 'fresh', fams: 'indian thai mex asian mideast', text: 'Scatter over fresh coriander.' },
  { id: 'basil', n: 'torn basil', item: 'basil', fills: 'fresh', fams: 'italian med', text: 'Tear over a few basil leaves.' },
  { id: 'mint', n: 'fresh mint', item: 'mint', fills: 'fresh', fams: 'mideast indian med thai', text: 'Scatter over a little chopped mint.' },
  { id: 'dill', n: 'fresh dill', item: 'dill', fills: 'fresh', fams: 'british french', text: 'Finish with chopped dill.' },
  { id: 'scallion', n: 'spring onion', item: 'spring-onion', fills: 'fresh', fams: 'asian thai mex american', text: 'Slice spring onion over the top.' },
  { id: 'parm', n: 'grated parmesan', item: 'parmesan', fills: 'savoury', fams: 'italian med french', text: 'Grate over a little parmesan.' },
  { id: 'soy', n: 'dash of soy', item: 'soy-sauce', fills: 'savoury', fams: 'asian thai', text: 'Add a dash of soy to taste.' },
  { id: 'feta', n: 'crumbled feta', item: 'feta', fills: 'savoury sharp', fams: 'med mideast', text: 'Crumble over a little feta.' },
  { id: 'honey', n: 'drizzle of honey', item: 'honey', fills: 'round', fams: '*', text: 'A small drizzle of honey softens the bitter edges.' },
  { id: 'yog', n: 'spoon of yogurt', item: 'yogurt', fills: 'sharp round', fams: 'indian mideast med', text: 'Serve with a spoon of cool yogurt.' },
  { id: 'chilli', n: 'fresh chilli', item: 'chilli', fills: 'heat', fams: 'asian thai mex indian', text: 'Slice a little fresh chilli over if you like heat.' }
];
export function finish(dish) {
  if (!DB) return null;
  const S = new Set(dish.ids), wants = needs(dish.taste, dish.method);
  if (['parsley', 'coriander', 'basil', 'mint', 'dill', 'spring-onion', 'thyme', 'rosemary'].some(h => S.has(h))) { const i = wants.indexOf('fresh'); if (i >= 0) wants.splice(i, 1); }
  if (['lemon', 'lime', 'vinegar'].some(h => S.has(h))) { const i = wants.indexOf('sharp'); if (i >= 0 && dish.taste.sharp >= 0.8) wants.splice(i, 1); }
  if (dish.spicy && dish.taste.heat < 0.6) wants.push('heat');
  if (!wants.length) return null;
  const base = harmony(dish.ids, dish.method, dish.hero), b0 = base ? base.h : 0;
  let best = null;
  for (const f of FINISHES) {
    if (S.has(f.item) || !dish.have(f.item)) continue;
    if (f.fams !== '*' && !f.fams.split(' ').includes(dish.fam)) continue;
    const fill = f.fills.split(' ').filter(x => wants.includes(x)).length; if (!fill) continue;
    if (dish.clash && dish.clash([...dish.ids, f.item])) continue;
    const h = harmony([...dish.ids, f.item], dish.method, dish.hero), gain = (h ? h.h : b0) - b0;
    const v = fill * 0.5 + gain * 3 + Math.random() * 0.15;
    if (!best || v > best.v) best = { v, f };
  }
  return best ? { id: best.f.item, n: best.f.n, text: best.f.text, fills: best.f.fills } : null;
}
