// Mise chef intelligence: pairing maths from real flavour-compound and recipe data,
// plus the recipe grammar (sauce, texture and finishing blocks) with compatibility rules.
// Data: www/data/chefdb.json (built by tools/build_chefdb.py from Ahn et al. 2011 + USDA SR28).
import { ITEM } from './data.js';
import { FMAP, COOKED } from './chefmap.js';

let DB = null, NUT = null;
const cache = new Map();
export const ready = () => !!DB;
export function setDB(db, nut, nmap) { DB = db; if (nut) NUT = nut; if (nmap) NUTMAP = nmap; cache.clear(); for (const e of Object.values(DB.ing)) if (e.k && !e.ks) e.ks = new Set(e.k); }
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
export function fname(id, tech) {
  if (!DB || !id) return null;
  const u = id.replace(/-/g, '_'), sg = u.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/s$/, '');
  let n = FMAP[id] || (DB.ing[u] ? u : DB.ing[sg] ? sg : null);
  if (!n || !DB.ing[n]) return null;
  if (tech && COOKED[n]) { const c = COOKED[n][tech] || COOKED[n]['*']; if (c && DB.ing[c]) n = c; }
  return n;
}
const ingOf = n => (DB && n ? DB.ing[n] : null);
// shared aroma compounds, cosine-normalised (0..1)
function compCos(a, b) {
  const A = ingOf(a), B = ingOf(b); if (!A || !B || !A.ks || !B.ks) return 0;
  let s = 0; const [x, y] = A.ks.size < B.ks.size ? [A.ks, B.ks] : [B.ks, A.ks];
  for (const c of x) if (y.has(c)) s++;
  return s / Math.sqrt(A.ks.size * B.ks.size);
}
function shared(a, b) { const A = ingOf(a), B = ingOf(b); if (!A || !B || !A.ks || !B.ks) return []; return A.k.filter(c => B.ks.has(c)); }
// how much more often cooks put them together than chance (normalised PMI, -1..1); null if no recipe evidence
function rec(a, b) {
  const A = ingOf(a), B = ingOf(b); if (!A || !B) return null;
  const v = (A.p && A.p[b]) || (B.p && B.p[a]);
  if (v) return v;
  if (A.n && B.n && A.n > 150 && B.n > 150) return -0.05; // both common, almost never together
  return null;
}
function famCos(a, b) {
  const A = ingOf(a), B = ingOf(b); if (!A || !B || !A.f || !B.f) return 0;
  let d = 0, na = 0, nb = 0; for (const k of DB.fams) { const x = A.f[k] || 0, y = B.f[k] || 0; d += x * y; na += x * x; nb += y * y; }
  return na && nb ? d / Math.sqrt(na * nb) : 0;
}
// The pairing score between two Mise ingredients (optionally as cooked by a technique)
export function pair(idA, idB, tech) {
  if (!DB) return null;
  const a = fname(idA, tech), b = fname(idB, tech); if (!a || !b || a === b) return null;
  const k = a < b ? a + '|' + b : b + '|' + a; if (cache.has(k)) return cache.get(k);
  const cc = compCos(a, b), r = rec(a, b), fc = famCos(a, b);
  const recS = r == null ? null : Math.max(-1, Math.min(1, r * 3));
  const s = recS == null ? cc * 0.75 + fc * 0.25 : recS * 0.55 + cc * 0.3 + fc * 0.15;
  const out = { s, comp: cc, rec: r, fam: fc, a, b, n: shared(a, b).length };
  cache.set(k, out); return out;
}
// aroma families shared by two ingredients (plain-English names via flavour.js NOTES keys)
export function sharedFams(idA, idB, tech) {
  const a = fname(idA, tech), b = fname(idB, tech); if (!a || !b) return [];
  const cnt = {}; for (const c of shared(a, b)) { const f = (DB.comp[c] || [])[1]; if (f) cnt[f] = (cnt[f] || 0) + 1; }
  return Object.entries(cnt).sort((x, y) => y[1] - x[1]).map(x => x[0]);
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
const FAMNAME = { R: 'roasted', Ca: 'caramel', Sv: 'savoury', Gr: 'green', Ci: 'citrus', Pi: 'herbal', Fr: 'fruity', Cr: 'buttery', Sp: 'warm-spice', Sm: 'smoky', Ea: 'earthy', Fl: 'floral', Fu: 'cheesy', Me: 'meaty', An: 'aniseed' };
export function why(idA, idB, tech) {
  const p = pair(idA, idB, tech); if (!p) return null;
  const bits = [];
  if (p.rec != null && p.rec > 0.08) bits.push(p.rec > 0.2 ? 'a proven classic in real recipes' : 'cooks pair them often');
  if (p.n >= 3) { const all = sharedFams(idA, idB, tech), pref = all.filter(x => !['Fu', 'Sv', 'Cr'].includes(x)); const f = (pref.length ? pref : all).slice(0, 2).map(x => FAMNAME[x]).filter(Boolean); bits.push(`${p.n} shared aroma compounds${f.length ? ` (${f.join(' and ')} notes)` : ''}`); }
  return bits.join('; ') || null;
}
// Partners for an ingredient across the whole database: classic (recipe evidence), surprising and wild (chemistry)
export function partnersOf(id, mapBack) {
  const a = fname(id); if (!a) return null;
  const A = ingOf(a), out = { classic: [], surprising: [], wild: [] };
  const cands = mapBack(); // Mise ids that exist in the database
  for (const b of cands) {
    if (b === id) continue; const p = pair(id, b); if (!p) continue;
    const catA = A.c, catB = (ingOf(fname(b)) || {}).c;
    if (p.rec != null && p.rec > 0.06) out.classic.push([p.rec * 3 + p.comp, b, p]);
    else if (p.comp >= 0.22 && (p.rec == null || p.rec <= 0.02)) (catA !== catB ? out.wild : out.surprising).push([p.comp, b, p]);
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
export const stats = () => DB ? { ingredients: Object.keys(DB.ing).length, compounds: Object.keys(DB.comp).length, recipes: DB.recipes, pairs: Object.values(DB.ing).reduce((a, e) => a + Object.keys(e.p || {}).length, 0) / 2, foods: NUT ? NUT.foods.length : null } : null;
// In Node (tests and build tools) load the data straight from disk
if (typeof window === 'undefined' && globalThis.process && process.getBuiltinModule) {
  try { const fs = process.getBuiltinModule('fs'), url = process.getBuiltinModule('url'), path = process.getBuiltinModule('path'); const d = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'data');
    setDB(JSON.parse(fs.readFileSync(path.join(d, 'chefdb.json'))), JSON.parse(fs.readFileSync(path.join(d, 'nutrition.json'))), JSON.parse(fs.readFileSync(path.join(d, 'nutmap.json')))); } catch (e) { /* no data: engine falls back to the built-in map */ }
}
