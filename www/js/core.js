// Mise — core logic: storage, parsing, matching, planning, list, pricing, pantry, receipts, roast, builder, AI.
import { CATALOG, ITEM, AISLES, BUILTIN, B_PROTEIN, B_BASE, B_STYLE, B_VEG } from './data.js';

/* ================= Storage (IndexedDB with localStorage fallback) ================= */
const DB_NAME = 'mise', STORE = 'kv';
function idb() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in self)) return rej(new Error('no idb'));
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
export async function loadState() {
  try {
    const db = await idb();
    const v = await new Promise((res, rej) => { const t = db.transaction(STORE).objectStore(STORE).get('state'); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); });
    if (v) return migrate(v);
  } catch (e) {
    try { const s = localStorage.getItem('mise-state'); if (s) return migrate(JSON.parse(s)); } catch (e2) { /* ignore */ }
  }
  return migrate(null);
}
let saveTimer = null;
export function saveState(state) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { const db = await idb(); db.transaction(STORE, 'readwrite').objectStore(STORE).put(state, 'state'); }
    catch (e) { try { localStorage.setItem('mise-state', JSON.stringify(state)); } catch (e2) { /* storage full or blocked */ } }
  }, 250);
}
export function freshState() {
  return {
    v: 1,
    settings: { household: 2, shops: ['Lidl'], defaultShop: 'Lidl', budget: 80, tone: 'cheeky', adventure: 30, nights: [1, 1, 1, 1, 1, 1, 1], mealdbKey: '1', ai: 'off', onboarded: false },
    plan: {}, recipes: {}, ratings: {}, tagPref: {}, skipped: {},
    pantry: [], list: { checked: {}, extras: [], hidden: {}, weekOffset: 0 },
    prices: [], receipts: [], aliases: {}, deals: [], waste: []
  };
}
function migrate(s) {
  const f = freshState();
  if (!s) return f;
  const out = Object.assign(f, s);
  out.settings = Object.assign(freshState().settings, s.settings || {});
  out.list = Object.assign(freshState().list, s.list || {});
  return out;
}
export function exportState(state) { return JSON.stringify({ app: 'mise', exported: new Date().toISOString(), state }, null, 1); }
export function importState(text) { const o = JSON.parse(text); if (!o || o.app !== 'mise' || !o.state) throw new Error('This is not a Mise backup file.'); return migrate(o.state); }

/* ================= Dates ================= */
export const iso = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
export const today = () => iso(new Date());
export function addDays(isoDate, n) { const d = new Date(isoDate + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); }
export function weekStart(isoDate) { const d = new Date(isoDate + 'T12:00'); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); }
export function weekDates(offset = 0) { const s = addDays(weekStart(today()), offset * 7); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); }
export function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000); }

/* ================= Quantities & units ================= */
const FRACT = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
const UNIT_ALIASES = {
  g: 'g', gr: 'g', gram: 'g', grams: 'g', kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', milliliter: 'ml', millilitres: 'ml', l: 'l', litre: 'l', liter: 'l', litres: 'l', liters: 'l', ltr: 'l', cl: 'cl', dl: 'dl',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', tsps: 'tsp', tbsp: 'tbsp', tbs: 'tbsp', tblsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbsps: 'tbsp',
  cup: 'cup', cups: 'cup', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  clove: 'clove', cloves: 'clove', slice: 'slice', slices: 'slice', tin: 'tin', tins: 'tin', can: 'can', cans: 'can', pack: 'pack', packs: 'pack', packet: 'pack',
  handful: 'handful', handfuls: 'handful', bunch: 'bunch', bunches: 'bunch', sprig: 'sprig', sprigs: 'sprig', pinch: 'pinch', pinches: 'pinch', dash: 'pinch', knob: 'knob',
  stick: 'stick', sticks: 'stick', stalk: 'stalk', stalks: 'stalk', head: 'head', heads: 'head', cube: 'cube', cubes: 'cube', fillet: 'fillet', fillets: 'fillet',
  rasher: 'rasher', rashers: 'rasher', thumb: 'thumb', piece: 'piece', pieces: 'piece', large: 'large', medium: 'medium', small: 'small', whole: '', bag: 'bag', jar: 'jar', ball: 'ball', loaf: 'loaf', nest: 'nest', nests: 'nest', bulb: 'bulb', pot: 'pot'
};
const MASS = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
const VOL = { ml: 1, l: 1000, cl: 10, dl: 100, tsp: 5, tbsp: 15, cup: 240 };

export function parseNumber(s) {
  s = String(s).trim();
  for (const [k, v] of Object.entries(FRACT)) if (s.includes(k)) { const rest = s.replace(k, '').trim(); return (rest ? parseFloat(rest) || 0 : 0) + v; }
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)/); if (m) return +m[1] + m[2] / m[3];
  m = s.match(/^(\d+)\/(\d+)/); if (m) return m[1] / m[2];
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:-|to)\s*(\d+(?:[.,]\d+)?)/); if (m) return (parseFloat(m[1].replace(',', '.')) + parseFloat(m[2].replace(',', '.'))) / 2;
  m = s.match(/^(\d+(?:[.,]\d+)?)/); if (m) return parseFloat(m[1].replace(',', '.'));
  return NaN;
}
// "200g", "1 1/2 tbsp", "2 cloves", "To taste", "1 large" -> {q,u}
export function parseMeasure(str) {
  str = String(str || '').toLowerCase().replace(/\(.*?\)/g, ' ').trim();
  if (!str || /to taste|as needed|for frying|to serve|garnish|optional/.test(str)) return { q: 0, u: 'taste' };
  const m = str.match(/^([\d½¼¾⅓⅔⅛.,\/\s-]+(?:to\s*\d+)?)\s*([a-zé]+)?/);
  if (!m) { const u = UNIT_ALIASES[str.split(/\s+/)[0]]; return { q: 1, u: u ?? '' }; }
  const q = parseNumber(m[1]);
  const u = m[2] ? (UNIT_ALIASES[m[2]] ?? '') : '';
  return { q: isNaN(q) ? 1 : q, u };
}
// convert q/u for an item into the item's base unit; returns null if impossible
export function toBase(q, u, item) {
  if (!item) return null;
  if (u === 'taste' || q === 0) return 0;
  const conv = item.conv || {};
  if (u && conv[u] != null) return q * conv[u];
  if (MASS[u] != null) { const g = q * MASS[u]; if (item.u === 'g') return g; if (item.u === 'ml') return g; return g / (pcWeight(item)); }
  if (VOL[u] != null) { const ml = q * VOL[u]; if (item.u === 'ml' || item.u === 'g') return ml; return ml / pcWeight(item); }
  if (u === '' || u === 'piece' || u === 'large' || u === 'medium' || u === 'small' || u === 'whole') {
    if (item.u === 'pc') return q * (u === 'large' ? 1.3 : u === 'small' ? 0.7 : 1);
    const first = Object.values(conv)[0];
    return q * (first || 100) * (u === 'large' ? 1.3 : u === 'small' ? 0.7 : 1);
  }
  if (u === 'tin' || u === 'can') return item.u === 'pc' ? q : q * 400;
  if (u === 'pack' || u === 'bag' || u === 'jar' || u === 'pot') return q * item.packs[0];
  if (u === 'handful') return item.u === 'pc' ? q : q * 30;
  if (u === 'bunch') return item.u === 'pc' ? q * 8 : q * 30;
  if (u === 'pinch') return item.u === 'pc' ? 0 : q * 0.5;
  if (u === 'knob') return item.u === 'pc' ? q : q * 15;
  if (u === 'sprig') return item.u === 'pc' ? q : q * 1;
  if (item.u === 'pc') return q;
  return null;
}
function pcWeight(item) { return { pepper: 160, courgette: 250, tomato: 90, avocado: 170, lemon: 100, lime: 70, cucumber: 300, apple: 150, banana: 120, orange: 140, eggs: 55, wraps: 60, buns: 70, naan: 120, pitta: 60, bread: 35, baguette: 250, sausages: 57, chilli: 15, 'spring-onion': 15, cauliflower: 600, cabbage: 800 }[item.id] || 100; }

export function fmtQty(q, u) {
  if (q == null || isNaN(q)) return '';
  const r = n => (n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 2) / 2 : Math.round(n * 10) / 10).toString();
  if (u === 'g') return q >= 1000 ? r(q / 1000) + ' kg' : r(q) + ' g';
  if (u === 'ml') return q >= 1000 ? r(q / 1000) + ' L' : r(q) + ' ml';
  if (u === 'pc' || u === '') return niceCount(q);
  if (u === 'taste') return 'to taste';
  return r(q) + ' ' + u;
}
function niceCount(q) { const w = Math.floor(q), f = q - w; const fr = f < 0.13 ? '' : f < 0.38 ? '¼' : f < 0.63 ? '½' : f < 0.88 ? '¾' : ''; const whole = f >= 0.88 ? w + 1 : w; return (whole || !fr ? whole : '') + fr || '0'; }
export const eur = n => '€' + (Math.round(n * 100) / 100).toFixed(2);

/* ================= Ingredient matching ================= */
const DESCRIPTORS = new Set('fresh chopped diced sliced finely roughly thinly minced crushed grated peeled large small medium ripe boneless skinless organic lean extra cold warm hot softened melted beaten dried cooked uncooked raw frozen tinned canned drained rinsed halved quartered torn shredded to serve for of a an the and or into pieces piece chunks cubed approx about handful pack packet tin tins can cans jar bunch good quality plus more few some little splash'.split(' '));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const sing = w => w.length > 3 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 4 && /(oes|ches|shes)$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
const PHRASES = []; // [normalized phrase, itemId]
for (const it of CATALOG) for (const p of [it.n, it.id.replace(/-/g, ' '), ...it.al]) { const n = norm(p); if (n) PHRASES.push([n, it.id], [n.split(' ').map(sing).join(' '), it.id]); }
PHRASES.sort((a, b) => b[0].length - a[0].length);

export function matchIngredient(name) {
  const n = norm(name);
  if (!n) return null;
  if (/salt (and|&) (black )?pepper/.test(n)) return 'salt';
  const variants = [n, n.split(' ').map(sing).join(' '), n.split(' ').filter(w => !DESCRIPTORS.has(w)).map(sing).join(' ')];
  for (const v of variants) {
    const padded = ' ' + v + ' ';
    for (const [p, id] of PHRASES) if (padded.includes(' ' + p + ' ')) return id;
  }
  return null;
}

// Receipt shorthand ("CHKN BRST FLLT 4.99") — learned aliases, then normal match, then abbreviation match
const skel = w => w[0] + w.slice(1).replace(/[aeiou]/g, '');
const subseq = (t, w) => { if (t[0] !== w[0] || t.length < 3) return false; let j = 0; for (const ch of w) { if (ch === t[j]) j++; if (j === t.length) return true; } return false; };
const BRANDS = new Set(['tayto', 'pringles', 'haribo', 'monster', 'red bull', 'lucozade', 'coke', 'pepsi', 'fanta', '7up', 'avonmore', 'kerrygold', 'barrys', 'lyons', 'dairy milk', 'weetabix', 'philadelphia', 'roosters', 'maris piper']);
const UNIT_TOK = /^\d+(\.\d+)?(g|kg|ml|l|ltr|cl|pk|pack|x)?$/;
const VOCAB = new Set(PHRASES.flatMap(([p]) => p.split(' ')));
const tokMatch = (t, pt) => t === pt || (VOCAB.has(t) && !pt.startsWith(t) && !t.startsWith(pt)) ? t === pt : pt.startsWith(t) || (t.startsWith(pt) && pt.length >= 3) || (t.length >= 3 && (skel(pt).startsWith(skel(t)) || subseq(t, pt)));
export function matchReceipt(text, aliases = {}) {
  const key = norm(text);
  if (aliases[key]) return aliases[key];
  const toks = key.split(' ').filter(t => t.length >= 2 && !UNIT_TOK.test(t));
  if (!toks.length) return matchIngredient(text);
  let best = null, bestScore = 0;
  const seen = new Set();
  for (const [p, id] of PHRASES) {
    if (seen.has(p + id)) continue; seen.add(p + id);
    const ptoks = p.split(' ');
    if (!ptoks.every(pt => toks.some(t => tokMatch(t, pt)))) continue;
    const covered = toks.filter(t => ptoks.some(pt => tokMatch(t, pt))).length;
    const exact = ptoks.filter(pt => toks.includes(pt)).length;
    const score = covered * 2 + ptoks.length * 0.5 + exact * 0.3 + (BRANDS.has(p) ? 1.6 : 0);
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return best || matchIngredient(text);
}

/* ================= Recipes ================= */
export function normalizeRecipe(r) {
  const ings = (r.ings || (r.ingLines || []).map(l => { const [m, name] = l.split('|'); return { ...parseMeasure(m), name: name.trim(), raw: (m + ' ' + name).trim() }; }))
    .map(i => { const skip = /^(cold |hot |boiling |warm |tap |iced? )?(water|ice( cubes)?)$/i.test(String(i.name).trim()); return { ...i, skip, item: skip ? null : (i.item !== undefined ? i.item : matchIngredient(i.name)) }; });
  return { ...r, ings, serves: r.serves || 4, time: r.time || 45, tags: recipeTags({ ...r, ings }) };
}
const CAT_PROTEIN = { Beef: 'beef', Chicken: 'chicken', Lamb: 'lamb', Pork: 'pork', Seafood: 'fish', Vegetarian: 'veg', Vegan: 'veg', Goat: 'lamb' };
export function recipeTags(r) {
  const t = [];
  if (r.cat) t.push('cat:' + r.cat);
  if (r.area) t.push('area:' + r.area);
  let p = CAT_PROTEIN[r.cat];
  if (!p) for (const i of r.ings || []) { const it = ITEM[i.item]; const pt = it && it.tags.find(x => x.startsWith('p:')); if (pt) { p = pt.slice(2); break; } }
  t.push('p:' + (p || 'veg'));
  if ((r.time || 45) <= 30) t.push('quick');
  return t;
}
export const proteinOf = r => (r.tags.find(t => t.startsWith('p:')) || 'p:veg').slice(2);
export function allRecipes(state) {
  const out = {};
  for (const b of BUILTIN) out[b.id] = normalizeRecipe(b);
  for (const [id, r] of Object.entries(state.recipes)) out[id] = r.ings && r.tags ? r : normalizeRecipe(r);
  return out;
}
const MAIN_EXCLUDE = new Set(['Dessert', 'Starter', 'Side', 'Breakfast']);

/* ---- TheMealDB (free test key "1"; supporter key optional) ---- */
const MDB = key => `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key || '1')}/`;
async function mdb(state, path) {
  const r = await fetch(MDB(state.settings.mealdbKey) + path);
  if (!r.ok) throw new Error('Recipe service error ' + r.status);
  return r.json();
}
export function fromMealDB(m) {
  const ings = [];
  for (let i = 1; i <= 20; i++) {
    const name = (m['strIngredient' + i] || '').trim(); if (!name) continue;
    const meas = (m['strMeasure' + i] || '').trim();
    ings.push({ ...parseMeasure(meas), name, raw: (meas + ' ' + name).trim() });
  }
  const steps = String(m.strInstructions || '').split(/\r?\n+/).map(s => s.replace(/^(step\s*\d+[:.)]?|\d+[.)])\s*/i, '').trim()).filter(s => s.length > 2 && !/^step\s*\d*$/i.test(s));
  return normalizeRecipe({ id: 'm:' + m.idMeal, src: 'mealdb', title: m.strMeal, cat: m.strCategory, area: m.strArea, img: m.strMealThumb, url: m.strSource || null, video: m.strYoutube || null, serves: 4, time: estimateTime(steps.join(' ')), ings, steps });
}
function estimateTime(text) {
  let total = 0; const re = /(\d+)\s*(?:-|to)?\s*(\d+)?\s*(min|minute|hour|hr)/gi; let m;
  while ((m = re.exec(text))) { const v = +(m[2] || m[1]); total += /h/i.test(m[3]) ? v * 60 : v; }
  return Math.min(240, Math.max(20, total ? Math.round((total + 10) / 5) * 5 : 45));
}
export async function mdbSearch(state, q) { const d = await mdb(state, 'search.php?s=' + encodeURIComponent(q)); return (d.meals || []).map(fromMealDB); }
export async function mdbByCategory(state, c) { const d = await mdb(state, 'filter.php?c=' + encodeURIComponent(c)); return (d.meals || []).map(m => ({ id: 'm:' + m.idMeal, title: m.strMeal, img: m.strMealThumb, cat: c, stub: true })); }
export async function mdbByIngredient(state, i) { const d = await mdb(state, 'filter.php?i=' + encodeURIComponent(i.replace(/\s+/g, '_'))); return (d.meals || []).map(m => ({ id: 'm:' + m.idMeal, title: m.strMeal, img: m.strMealThumb, stub: true })); }
export async function mdbLookup(state, id) { const d = await mdb(state, 'lookup.php?i=' + encodeURIComponent(id.replace(/^m:/, ''))); return d.meals && d.meals[0] ? fromMealDB(d.meals[0]) : null; }
export async function mdbRandom(state) { const d = await mdb(state, 'random.php'); return d.meals && d.meals[0] ? fromMealDB(d.meals[0]) : null; }
export const MDB_CATEGORIES = ['Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Pasta', 'Vegetarian', 'Vegan', 'Breakfast', 'Side', 'Dessert'];

/* ================= Learning ================= */
export function rate(state, rid, recipe, stars) {
  const prev = state.ratings[rid] || { r: 0, n: 0 };
  const delta = (stars - 3) * 0.5 - (prev.r ? (prev.r - 3) * 0.5 : 0);
  for (const t of recipe.tags) state.tagPref[t] = (state.tagPref[t] || 0) + delta;
  state.ratings[rid] = { ...prev, r: stars };
}
export function markCooked(state, rid, recipe, date) {
  const prev = state.ratings[rid] || { r: 0, n: 0 };
  state.ratings[rid] = { ...prev, n: (prev.n || 0) + 1, last: date };
  for (const t of recipe.tags) state.tagPref[t] = (state.tagPref[t] || 0) + 0.1;
}
export function markSkipped(state, rid, recipe) {
  state.skipped[rid] = (state.skipped[rid] || 0) + 1;
  for (const t of recipe.tags) state.tagPref[t] = (state.tagPref[t] || 0) - 0.15;
}
export function prefScore(state, r) {
  let s = 0; for (const t of r.tags) s += state.tagPref[t] || 0;
  const rt = state.ratings[r.id]; if (rt && rt.r) s += (rt.r - 3) * 1.5;
  s -= (state.skipped[r.id] || 0) * 0.5;
  return s;
}
// Suggest a week of dinners: favourites / similar / brand new, with cooldown and variety rules
export function suggestWeek(state, dates, opts = {}) {
  const recipes = allRecipes(state), today0 = today();
  const deals = activeDeals(state).map(d => d.item);
  const expiring = new Set(state.pantry.filter(p => p.item && p.exp && daysBetween(today0, p.exp) <= 3).map(p => p.item));
  const pool = Object.values(recipes).filter(r => !MAIN_EXCLUDE.has(r.cat) && r.ings.length);
  const used = new Set();
  for (const d of dates) for (const e of (state.plan[d] || [])) used.add(e.rid);
  const cooldown = r => { const l = state.ratings[r.id] && state.ratings[r.id].last; return l && daysBetween(l, dates[0]) < 10; };
  const boost = r => r.ings.reduce((a, i) => a + (deals.includes(i.item) ? 1.5 : 0) + (expiring.has(i.item) ? 2 : 0), 0);
  const fav = [], similar = [], fresh = [];
  for (const r of pool) {
    if (used.has(r.id) || cooldown(r)) continue;
    const rt = state.ratings[r.id], s = prefScore(state, r);
    if ((rt && rt.r >= 4) || s > 1.5) fav.push(r);
    else if (!(rt && rt.n) && s > 0) similar.push(r);
    else if (!(rt && (rt.n || rt.r))) fresh.push(r);
    else similar.push(r);
  }
  const a = (state.settings.adventure ?? 30) / 100;
  const pNew = 0.1 + a * 0.4, pFav = (1 - pNew) * 0.6, pSim = 1 - pNew - pFav;
  const out = []; let prevP = null; const areaCount = {}; let wildcardGiven = false;
  const pick = (list) => {
    const cands = list.filter(r => !used.has(r.id) && proteinOf(r) !== prevP && (areaCount[r.area] || 0) < 2);
    const L = cands.length ? cands : list.filter(r => !used.has(r.id));
    if (!L.length) return null;
    const w = L.map(r => Math.max(0.2, 1 + prefScore(state, r) * 0.3 + boost(r) + (opts.quick && r.time <= 30 ? 1 : 0)));
    let x = Math.random() * w.reduce((s, v) => s + v, 0);
    for (let i = 0; i < L.length; i++) { x -= w[i]; if (x <= 0) return L[i]; }
    return L[L.length - 1];
  };
  for (const d of dates) {
    const roll = Math.random();
    let order = roll < pNew ? [fresh, similar, fav] : roll < pNew + pSim ? [similar, fav, fresh] : [fav, similar, fresh];
    if (!wildcardGiven && fresh.length && d === dates[Math.floor(dates.length / 2)]) order = [fresh, similar, fav];
    let r = null, bucket = null;
    for (const b of order) { r = pick(b); if (r) { bucket = b; break; } }
    if (!r) break;
    used.add(r.id); prevP = proteinOf(r); areaCount[r.area] = (areaCount[r.area] || 0) + 1;
    const wild = bucket === fresh && !wildcardGiven; if (wild) wildcardGiven = true;
    out.push({ date: d, rid: r.id, wildcard: wild });
  }
  return out;
}

/* ================= Prices ================= */
export function activeDeals(state) { const t = today(); return state.deals.filter(d => !d.until || d.until >= t); }
// unit price (per base unit) for an item at a shop, from user's own receipts within 120 days
export function knownUnitPrice(state, itemId, shop) {
  const t = today();
  const rows = state.prices.filter(p => p.item === itemId && (!shop || p.shop === shop) && daysBetween(p.date, t) <= 120 && p.qty > 0);
  if (!rows.length) return null;
  rows.sort((a, b) => b.date.localeCompare(a.date));
  return { unit: rows[0].price / rows[0].qty, date: rows[0].date, shop: rows[0].shop };
}
export function bestPrice(state, itemId) {
  const it = ITEM[itemId]; if (!it) return null;
  const shops = state.settings.shops.length ? state.settings.shops : ['Lidl'];
  let best = null;
  for (const d of activeDeals(state)) if (d.item === itemId && d.price) { const u = d.price / (d.qty || it.packs[0]); if (!best || u < best.unit) best = { unit: u, shop: d.shop || state.settings.defaultShop, src: 'deal', deal: d }; }
  for (const s of shops) { const k = knownUnitPrice(state, itemId, s); if (k && (!best || k.unit < best.unit)) best = { unit: k.unit, shop: s, src: 'yours', date: k.date }; }
  if (!best) best = { unit: it.p / it.packs[0], shop: state.settings.defaultShop || shops[0], src: 'est' };
  return best;
}

/* ================= Pantry ================= */
export function pantryQty(state, itemId) { return state.pantry.filter(p => p.item === itemId).reduce((a, p) => a + (p.qty || 0), 0); }
export function addPantry(state, itemId, qty, name, date = today()) {
  const it = ITEM[itemId];
  const exp = it ? addDays(date, it.life) : null;
  const ex = state.pantry.find(p => itemId ? p.item === itemId : p.name === name);
  if (ex) { ex.qty = (ex.qty || 0) + qty; if (exp && (!ex.exp || exp > ex.exp)) ex.exp = exp; ex.added = date; }
  else state.pantry.push({ key: 'p' + Math.random().toString(36).slice(2, 9), item: itemId || null, name: it ? it.n : name, qty, unit: it ? it.u : 'pc', added: date, exp });
}
export function usePantry(state, itemId, qty) {
  for (const p of state.pantry.filter(p => p.item === itemId)) { const take = Math.min(p.qty, qty); p.qty -= take; qty -= take; }
  state.pantry = state.pantry.filter(p => p.qty > 0.001 || !p.item);
}
export function cookRecipe(state, recipe, serves) {
  const f = serves / recipe.serves;
  for (const i of recipe.ings) { const it = ITEM[i.item]; if (!it || it.staple) continue; const b = toBase(i.q * f, i.u, it); if (b) usePantry(state, it.id, b); }
}
export function whatCanIMake(state) {
  const t = today();
  const expiring = new Set(state.pantry.filter(p => p.item && p.exp && daysBetween(t, p.exp) <= 3).map(p => p.item));
  return Object.values(allRecipes(state)).filter(r => !MAIN_EXCLUDE.has(r.cat)).map(r => {
    const need = r.ings.filter(i => { const it = ITEM[i.item]; return !(it && it.staple) && i.u !== 'taste' && !i.skip; });
    let have = 0; const missing = []; let usesExp = 0;
    for (const i of need) {
      const it = ITEM[i.item];
      const q = it ? toBase(i.q, i.u, it) : null;
      const pq = it ? pantryQty(state, it.id) : 0;
      const ok = it ? (q ? pq >= q * 0.75 : pq > 0) : state.pantry.some(p => !p.item && norm(p.name) === norm(i.name));
      if (ok) { have++; if (expiring.has(i.item)) usesExp++; } else missing.push(it ? it.n : i.name);
    }
    return { r, cover: need.length ? have / need.length : 0, missing, usesExp };
  }).filter(x => x.cover > 0).sort((a, b) => (b.cover - a.cover) || (b.usesExp - a.usesExp));
}

/* ================= Shopping list ================= */
export function buildList(state, dates) {
  const recipes = allRecipes(state);
  const need = {}; const staples = {};
  const add = (key, base) => { if (!need[key]) need[key] = Object.assign({ key, qty: 0, from: new Set() }, base); return need[key]; };
  for (const d of dates) for (const e of (state.plan[d] || [])) {
    if (e.cooked) continue;
    const r = recipes[e.rid]; if (!r) continue;
    const f = (e.serves || r.serves) / r.serves;
    for (const i of r.ings) {
      const it = ITEM[i.item];
      if (it && it.staple) { staples[it.id] = it; continue; }
      if (i.u === 'taste' || i.skip) continue;
      if (it) { const b = toBase(i.q * f, i.u, it); const n = add(it.id, { item: it.id, name: it.n, unit: it.u, aisle: it.a }); n.qty += b || 0; n.from.add(r.title); }
      else { const k = 'x:' + norm(i.name); const n = add(k, { item: null, name: i.name, unit: i.u || '', aisle: 'other', loose: true }); n.qty += i.q * f; n.from.add(r.title); }
    }
  }
  for (const x of state.list.extras) {
    const it = ITEM[x.item];
    const k = it ? it.id : 'x:' + norm(x.name);
    const n = add(k, it ? { item: it.id, name: it.n, unit: it.u, aisle: it.a } : { item: null, name: x.name, unit: '', aisle: 'other', loose: true });
    n.qty += it ? (x.qty || it.packs[0]) : (x.qty || 1); n.from.add('Added by you'); n.extra = true;
  }
  const rows = [], covered = [];
  for (const n of Object.values(need)) {
    if (state.list.hidden[n.key]) continue;
    const it = ITEM[n.item];
    if (it) {
      const have = n.extra ? 0 : pantryQty(state, it.id);
      const short = Math.max(0, n.qty - have);
      if (short <= 0.0001) { covered.push({ ...n, from: [...n.from] }); continue; }
      const { packs, size } = choosePacks(short, it.packs);
      const buy = packs * size;
      const bp = bestPrice(state, it.id);
      rows.push({ ...n, from: [...n.from], need: short, have, packs, size, buy, leftover: buy - short, unitPrice: bp.unit, cost: buy * bp.unit, shop: bp.shop, priceSrc: bp.src, deal: bp.deal || null });
    } else rows.push({ ...n, from: [...n.from], packs: null, cost: null, shop: state.settings.defaultShop, priceSrc: null });
  }
  const aisleIdx = Object.fromEntries(AISLES.map((a, i) => [a[0], i]));
  rows.sort((a, b) => (aisleIdx[a.aisle] - aisleIdx[b.aisle]) || a.name.localeCompare(b.name));
  const stapleRows = Object.values(staples).filter(s => pantryQty(state, s.id) <= 0 && !state.list.hidden['s:' + s.id]).map(s => ({ key: 's:' + s.id, item: s.id, name: s.n }));
  return { rows, covered, staples: stapleRows, total: rows.reduce((a, r) => a + (r.cost || 0), 0) };
}
function choosePacks(qty, sizes) {
  let best = null;
  for (const s of sizes) { const p = Math.max(1, Math.ceil(qty / s - 1e-9)); const waste = p * s - qty; if (!best || waste < best.waste - 1e-9 || (Math.abs(waste - best.waste) < 1e-9 && p < best.packs)) best = { packs: p, size: s, waste }; }
  return best;
}
const PACK_TEXT = { garlic: 'net of 4 bulbs', bread: 'loaf', 'spring-onion': 'bunch', stock: 'box of 12', tea: 'box of 80', eggs: null };
export function packLabel(row) {
  const it = ITEM[row.item]; if (!it) return '';
  if (it.u === 'pc') { const t = PACK_TEXT[it.id]; if (t) return `${row.packs} × ${t}`; return row.size === 1 ? `${row.packs}` : `${row.packs} × ${row.size}-pack`; }
  return `${row.packs} × ${fmtQty(row.size, it.u)}`;
}
export function recipeCost(state, r, serves) {
  const f = (serves || r.serves) / r.serves; let total = 0, known = 0, unknown = 0;
  for (const i of r.ings) { const it = ITEM[i.item]; if (!it) { unknown++; continue; } const b = toBase(i.q * f, i.u, it); if (!b) continue; total += b * bestPrice(state, it.id).unit; known++; }
  return { total, perServe: total / (serves || r.serves), unknown };
}

/* ================= Receipts ================= */
const SKIP = /\b(sub\s*-?total|total|balance|change|card|visa|mastercard|debit|credit|cash|tender|contactless|vat|tax|amount|payment|lidl plus|points|receipt|thank|store|tel\b|www\.|http|cashier|till|operator|auth|aid:|merchant|terminal|refund due|you saved|saving total|items?\b\s*\d|eur\b total)/i;
export function parseReceipt(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = []; let total = null;
  for (const line of lines) {
    const tot = line.match(/\btotal\b.*?(\d+[.,]\d{2})/i);
    if (tot && !/sub/i.test(line)) { total = parseFloat(tot[1].replace(',', '.')); continue; }
    const mult = line.match(/^(\d+)\s*[xX×]\s*(\d+[.,]\d{2})\b/);
    if (mult && out.length) { out[out.length - 1].qty = +mult[1]; continue; }
    const weight = line.match(/^(\d+[.,]\d+)\s*kg\s*[xX×@]\s*(\d+[.,]\d{2})/i);
    if (weight && out.length) { out[out.length - 1].weightKg = parseFloat(weight[1].replace(',', '.')); continue; }
    if (SKIP.test(line)) continue;
    const m = line.match(/^(.*?[a-zA-Z].*?)\s+(-?\d+[.,]\d{2})\s*(?:-)?\s*[A-Z*]{0,2}$/);
    if (!m) continue;
    const price = parseFloat(m[2].replace(',', '.'));
    const name = m[1].replace(/^\d+\s+(?=[a-z])/i, '').trim();
    if (price < 0 || /discount|offer|saving|promo|coupon|reduced/i.test(name)) { if (out.length) out[out.length - 1].price = Math.round((out[out.length - 1].price + price) * 100) / 100; continue; }
    if (name.length < 2) continue;
    out.push({ text: name, price, qty: 1 });
  }
  return { lines: out, total };
}
export function saveReceipt(state, { shop, date, lines, total }) {
  const rec = { id: 'r' + Date.now().toString(36), shop, date, total: total ?? lines.reduce((a, l) => a + l.price, 0), lines };
  for (const l of lines) {
    if (l.item) state.aliases[norm(l.text)] = l.item;
    const it = ITEM[l.item];
    if (!it) continue;
    const qty = l.weightKg && it.u === 'g' ? l.weightKg * 1000 * (l.qty || 1) : it.packs[0] * (l.qty || 1);
    state.prices.push({ item: it.id, shop, price: l.price, qty, date, src: 'receipt' });
    if (!['household'].includes(it.cat)) addPantry(state, it.id, qty, it.n, date);
  }
  state.receipts.unshift(rec);
  if (state.prices.length > 4000) state.prices = state.prices.slice(-4000);
  return rec;
}

/* ================= Receipt review ("roast") ================= */
export function reviewReceipt(state, rec) {
  const tone = state.settings.tone || 'cheeky';
  const sum = c => rec.lines.filter(l => (ITEM[l.item] || {}).cat === c).reduce((a, l) => a + l.price, 0);
  const count = c => rec.lines.filter(l => (ITEM[l.item] || {}).cat === c).reduce((a, l) => a + (l.qty || 1), 0);
  const m = {
    total: rec.total || rec.lines.reduce((a, l) => a + l.price, 0),
    snack: sum('snack') + sum('sweet'), fizzy: count('fizzy'), energy: count('energy'), alcohol: sum('alcohol'), ready: sum('ready'), readyN: count('ready'),
    vegN: new Set(rec.lines.filter(l => ['veg', 'fruit'].includes((ITEM[l.item] || {}).cat)).map(l => l.item)).size,
    veg: sum('veg') + sum('fruit'), meat: sum('meat') + sum('fish'), lines: rec.lines.length
  };
  const budget = state.settings.budget;
  const T = (g, c, s) => ({ gentle: g, cheeky: c, savage: s }[tone] || c);
  const roasts = [], praise = [], tips = [];
  if (m.snack >= 8) roasts.push(T(`${eur(m.snack)} on snacks and sweets this time. Maybe one less treat next week?`, `${eur(m.snack)} on snacks. That's a Lidl dinner for four, and change.`, `${eur(m.snack)} on snacks. Your dentist and your bank both felt that.`));
  if (m.energy >= 3) roasts.push(T(`${m.energy} energy drinks. Hope you're sleeping OK!`, `${m.energy} energy drinks. Are you studying, or just vibrating?`, `${m.energy} energy drinks. Your heart has filed a complaint.`));
  if (m.fizzy >= 2) roasts.push(T(`A few fizzy drinks in there.`, `${m.fizzy} bottles of fizzy. Sparkling water exists, just saying.`, `${m.fizzy} bottles of fizzy. Hydration via sugar, bold.`));
  if (m.readyN >= 2) { roasts.push(T(`${m.readyN} ready meals (${eur(m.ready)}). Busy week?`, `${m.readyN} ready meals for ${eur(m.ready)}. The microwave sends its thanks.`, `${m.readyN} ready meals. Cooking is just heating, apparently.`)); tips.push(`Swap two ready meals for a quick stir-fry or egg fried rice: about €1.50 a portion instead of ${eur(m.ready / Math.max(1, m.readyN))}.`); }
  if (m.alcohol >= 15) roasts.push(T(`${eur(m.alcohol)} on drinks. Hope it was a good weekend.`, `${eur(m.alcohol)} on drink. Planning a session or a lifestyle?`, `${eur(m.alcohol)} on booze and ${m.vegN} kinds of veg. Priorities, sorted.`));
  if (m.vegN <= 1 && m.lines >= 6) roasts.push(T(`Only ${m.vegN} fruit or veg this time.`, `${m.vegN === 0 ? 'Zero' : 'One'} fruit or veg. Scurvy speedrun?`, `${m.vegN === 0 ? 'No' : 'One lonely'} vegetable${m.vegN === 0 ? 's' : ''}. Pirates ate better.`));
  if (budget && m.total > budget * 1.15) roasts.push(T(`That's ${eur(m.total - budget)} over your weekly budget.`, `${eur(m.total - budget)} over budget. The budget was more of a suggestion, then.`, `${eur(m.total - budget)} over budget. We set it together and you ignored it.`));
  if (m.vegN >= 5) praise.push(T(`${m.vegN} kinds of fruit and veg. Lovely.`, `${m.vegN} kinds of fruit and veg. Look at you, thriving.`, `${m.vegN} fruit and veg. Fine. Respect.`));
  if (budget && m.total <= budget * 0.9) praise.push(`Came in ${eur(budget - m.total)} under budget. Nice one.`);
  if (m.snack < 3 && !m.energy && !m.fizzy && !m.readyN && m.lines >= 6) praise.push('Barely any junk. Who are you?');
  // price changes vs your last known price
  for (const l of rec.lines) {
    const it = ITEM[l.item]; if (!it) continue;
    const prev = state.prices.filter(p => p.item === it.id && p.shop === rec.shop && p.date < rec.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (prev) { const was = prev.price / prev.qty * it.packs[0], now = l.price / (l.qty || 1); if (now > was * 1.12) tips.push(`${it.n} is up from ${eur(was)} to ${eur(now)} at ${rec.shop}.`); }
  }
  const wasted = new Set(state.waste.filter(w => daysBetween(w.date, today()) <= 45).map(w => w.item));
  for (const l of rec.lines) if (wasted.has(l.item)) tips.push(`You binned ${ITEM[l.item].n.toLowerCase()} recently. Buy a smaller pack, or plan a meal that uses it up.`);
  if (m.snack >= 8) tips.push('Set a snack budget: buy one multipack instead of single bags.');
  if (!tips.length) tips.push('Plan a "use it up" night before the next shop to clear what is left in the fridge.');
  return { m, roasts: roasts.slice(0, 3), praise: praise.slice(0, 2), tips: [...new Set(tips)].slice(0, 4) };
}
// Next week's smarter list from receipt history
export function smarterList(state) {
  const recent = state.receipts.slice(0, 4);
  if (!recent.length) return [];
  const freq = {};
  for (const r of recent) for (const l of r.lines) if (l.item) { freq[l.item] = freq[l.item] || { n: 0, qty: 0 }; freq[l.item].n++; freq[l.item].qty += l.qty || 1; }
  const wasted = new Set(state.waste.map(w => w.item));
  const out = [];
  for (const [id, f] of Object.entries(freq)) {
    const it = ITEM[id]; if (!it) continue;
    const per = f.qty / recent.length;
    let qty = Math.max(1, Math.round(per)), note = 'You buy this most weeks';
    if (['snack', 'sweet', 'fizzy', 'energy'].includes(it.cat)) { qty = Math.max(1, Math.floor(per / 2)); note = per >= 2 ? 'Halved: same treat, less spend' : 'Kept as your treat'; }
    if (it.cat === 'ready') { note = 'Try a quick home-cooked swap instead'; qty = Math.max(0, Math.floor(per / 2)); }
    if (wasted.has(id)) { note = 'Smaller amount: some went in the bin last time'; qty = Math.max(1, qty - 1); }
    if (f.n >= 2 || recent.length === 1) out.push({ item: id, name: it.n, packs: qty, note, saving: ['snack', 'sweet', 'fizzy', 'energy', 'ready'].includes(it.cat) ? (per - qty) * it.p : 0 });
  }
  return out.filter(x => x.packs > 0).sort((a, b) => b.saving - a.saving);
}

/* ================= Meal builder (rule-based) ================= */
const WORD_MAP = {
  protein: [['chicken breast', 'chicken breast'], ['chicken', 'chicken'], ['steak', 'steak'], ['mince', 'beef'], ['beef', 'beef'], ['sausage', 'pork'], ['bacon', 'bacon'], ['salmon', 'salmon'], ['cod', 'white fish'], ['fish', 'white fish'], ['prawn', 'prawns'], ['shrimp', 'prawns'], ['chickpea', 'chickpeas'], ['lentil', 'lentils'], ['halloumi', 'halloumi'], ['tofu', 'tofu'], ['egg', 'eggs']],
  base: [['rice', 'rice'], ['pasta', 'pasta'], ['spaghetti', 'pasta'], ['noodle', 'noodles'], ['potato', 'potatoes'], ['mash', 'potatoes'], ['wrap', 'wraps'], ['taco', 'wraps'], ['burrito', 'wraps'], ['couscous', 'couscous'], ['bread', 'bread'], ['salad', 'none'], ['low carb', 'none'], ['no carb', 'none']],
  style: [['creamy', 'creamy'], ['cream', 'creamy'], ['carbonara', 'creamy'], ['curry', 'curry'], ['korma', 'curry'], ['tikka', 'curry'], ['thai', 'curry'], ['tomato', 'tomato'], ['italian', 'tomato'], ['arrabbiata', 'tomato'], ['stir fry', 'stirfry'], ['stir-fry', 'stirfry'], ['asian', 'stirfry'], ['teriyaki', 'stirfry'], ['chinese', 'stirfry'], ['mexican', 'mexican'], ['fajita', 'mexican'], ['taco', 'mexican'], ['burrito', 'mexican'], ['greek', 'mediterranean'], ['mediterranean', 'mediterranean'], ['traybake', 'mediterranean'], ['pesto', 'pesto'], ['chilli', 'chilli'], ['chili', 'chilli'], ['lemon', 'lemon'], ['herb', 'lemon'], ['gravy', 'gravy'], ['irish', 'gravy'], ['comfort', 'gravy']]
};
export function parseDescription(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  const spec = { exclude: [], veg: [] };
  for (const k of ['protein', 'base', 'style']) for (const [w, v] of WORD_MAP[k]) if (t.includes(w) && !new RegExp('(no|without|not)\\s+' + w).test(t)) { spec[k] = v; break; }
  if (/\b(veggie|vegetarian|meat ?free)\b/.test(t)) spec.diet = 'veg';
  if (/\bvegan\b/.test(t)) spec.diet = 'vegan';
  if (/\b(spicy|hot|fiery|kick)\b/.test(t)) spec.spicy = 2; else if (/\bmild\b/.test(t)) spec.spicy = 0;
  if (/\b(healthy|light|lean|low cal)\b/.test(t)) spec.healthy = true;
  if (/\b(cheap|budget|thrifty)\b/.test(t)) spec.cheap = true;
  let m = t.match(/(?:for|feeds|serves|serving)\s+(\d+)/); if (m) spec.serves = +m[1];
  m = t.match(/(\d+)\s*(?:min|mins|minutes)/); if (m) spec.maxTime = +m[1];
  if (/\b(quick|fast|speedy)\b/.test(t) && !spec.maxTime) spec.maxTime = 30;
  m = t.match(/(?:under|below|less than|max)\s*€?\s*(\d+(?:\.\d+)?)/); if (m) spec.budget = +m[1];
  for (const mm of t.matchAll(/(?:no|without|hate|not)\s+([a-z]+)/g)) spec.exclude.push(mm[1].replace(/s$/, ''));
  for (const v of Object.keys(B_VEG)) if (t.includes(v.replace(/s$/, '')) && !spec.exclude.some(x => v.startsWith(x))) spec.veg.push(v);
  return spec;
}
export function completeSpec(spec, state, pantryFirst) {
  const s = { serves: state.settings.household || 2, spicy: 1, veg: [], exclude: [], ...spec };
  const vegOK = k => !s.diet || (s.diet === 'veg' ? B_PROTEIN[k].veg : B_PROTEIN[k].vegan);
  const notExcluded = name => !s.exclude.some(x => name.toLowerCase().includes(x));
  const inPantry = name => { const id = matchIngredient(name); return id && pantryQty(state, id) > 0; };
  if (!s.protein || !vegOK(s.protein)) {
    let opts = Object.keys(B_PROTEIN).filter(k => vegOK(k) && notExcluded(B_PROTEIN[k].item) && (!s.maxTime || B_PROTEIN[k].min <= s.maxTime / 2));
    if (s.cheap) opts = opts.filter(k => B_PROTEIN[k].cost <= 2);
    if (pantryFirst) { const p = opts.filter(k => inPantry(B_PROTEIN[k].item)); if (p.length) opts = p; }
    s.protein = opts[Math.floor(Math.random() * opts.length)] || 'chickpeas';
  }
  if (!s.style) { let o = Object.keys(B_STYLE).filter(k => (s.spicy === 0 ? B_STYLE[k].spice < 2 : true) && (!s.healthy || B_STYLE[k].healthy >= 2)); s.style = o[Math.floor(Math.random() * o.length)]; }
  if (!s.base) { const fit = { curry: 'rice', stirfry: 'noodles', mexican: 'wraps', creamy: 'pasta', pesto: 'pasta', tomato: 'pasta', chilli: 'rice', mediterranean: 'couscous', lemon: 'potatoes', gravy: 'potatoes' }; s.base = fit[s.style] || 'rice'; if (s.maxTime && B_BASE[s.base].min > s.maxTime / 2) s.base = 'couscous'; }
  if (!s.veg.length) { const v = Object.keys(B_VEG).filter(k => notExcluded(k) && !(B_STYLE[s.style].ings.some(i => i[1].includes(k.replace(/s$/, ''))))); if (pantryFirst) { const p = v.filter(k => inPantry(B_VEG[k][1])); if (p.length) v.splice(0, v.length, ...p); } s.veg = [v[Math.floor(Math.random() * v.length)]].filter(Boolean); if (s.healthy && v.length > 1) s.veg.push(v.find(x => !s.veg.includes(x))); }
  return s;
}
export function buildMeal(spec) {
  const P = B_PROTEIN[spec.protein], Bs = B_BASE[spec.base], St = B_STYLE[spec.style], n = spec.serves;
  const lines = [];
  const add = (q, u, name) => lines.push({ ...{ q: Math.round(q * 100) / 100, u }, name, raw: '' });
  add(P.q * n, P.u, P.item);
  if (spec.base !== 'none' || true) add(Bs.q * n, Bs.u, Bs.item);
  for (const [u, name, q] of St.ings) { let qq = q * n; if (spec.healthy && /cream|butter/.test(name)) qq *= 0.5; if (spec.exclude.some(x => name.includes(x))) continue; add(qq, u, name); }
  for (const v of spec.veg) { const [u, name, q] = B_VEG[v]; add(q * n * (spec.healthy ? 1.5 : 1), u, name); }
  if (spec.spicy >= 2 && St.spice < 2) add(Math.max(1, Math.round(n / 2)), '', 'chilli');
  add(1, 'tbsp', 'oil');
  const steps = [];
  steps.push(`Get everything ready: ${spec.base !== 'none' ? 'put a pan of water on to boil for the ' + Bs.n.toLowerCase() + ', and ' : ''}chop the veg.`);
  if (Bs.min >= 10 && spec.base !== 'none') steps.push(Bs.cook);
  if (spec.protein !== 'lentils') steps.push(P.cook);
  steps.push(St.sauce + (spec.protein === 'lentils' ? ' ' + P.cook : ''));
  for (const v of spec.veg) steps.push(B_VEG[v][3]);
  if (spec.spicy >= 2 && St.spice < 2) steps.push('Finely chop the chilli and add it with the sauce for some heat.');
  if (Bs.min < 10 || spec.base === 'none') steps.push(Bs.cook);
  steps.push(spec.protein === 'lentils' || ['curry', 'chilli', 'tomato', 'creamy', 'gravy'].includes(spec.style) ? `Return the ${P.n.toLowerCase()} to the sauce, season to taste and serve with the ${Bs.n.toLowerCase()}.` : `Serve the ${P.n.toLowerCase()} on the ${Bs.n.toLowerCase()} with the sauce over the top.`);
  const time = Math.max(15, Math.round((Math.max(P.min, Bs.min) + 12 + (spec.style === 'mediterranean' ? 15 : 0)) / 5) * 5);
  const title = `${St.n} ${P.n.toLowerCase()} with ${Bs.n.toLowerCase()}`.replace('with no carbs (salad)', 'salad');
  return normalizeRecipe({ id: 'u:' + Date.now().toString(36), src: 'builder', title: title[0].toUpperCase() + title.slice(1), cat: P.veg ? 'Vegetarian' : ({ chicken: 'Chicken', 'chicken breast': 'Chicken', beef: 'Beef', steak: 'Beef', pork: 'Pork', bacon: 'Pork' }[spec.protein] || 'Seafood'), area: { curry: 'Indian', stirfry: 'Chinese', mexican: 'Mexican', mediterranean: 'Mediterranean', tomato: 'Italian', pesto: 'Italian', creamy: 'Italian', chilli: 'Mexican', gravy: 'Irish', lemon: 'Mediterranean' }[spec.style], serves: n, time, ings: lines, steps, spec });
}
export const TWEAKS = {
  cheaper: ['Cheaper', s => { const c = Object.keys(B_PROTEIN).filter(k => B_PROTEIN[k].cost < B_PROTEIN[s.protein].cost && (!s.diet || B_PROTEIN[k].veg)); if (c.length) s.protein = c[Math.floor(Math.random() * c.length)]; s.cheap = true; if (s.style === 'pesto') s.style = 'tomato'; }],
  healthier: ['Healthier', s => { s.healthy = true; if (B_STYLE[s.style].healthy < 2) s.style = ['tomato', 'stirfry', 'lemon', 'mediterranean'][Math.floor(Math.random() * 4)]; const extra = Object.keys(B_VEG).find(v => !s.veg.includes(v)); if (extra) s.veg = [...s.veg, extra]; }],
  spicier: ['Spicier', s => { s.spicy = 2; }],
  quicker: ['Quicker', s => { s.maxTime = 25; if (B_BASE[s.base].min > 10) s.base = ['noodles', 'couscous', 'wraps'][Math.floor(Math.random() * 3)]; if (B_PROTEIN[s.protein].min > 10) s.protein = B_PROTEIN[s.protein].veg ? 'chickpeas' : 'prawns'; }],
  veggie: ['Veggie', s => { s.diet = 'veg'; const v = ['chickpeas', 'halloumi', 'tofu', 'lentils', 'eggs']; s.protein = v[Math.floor(Math.random() * v.length)]; }],
  moreveg: ['More veg', s => { const extra = Object.keys(B_VEG).filter(v => !s.veg.includes(v) && !s.exclude.some(x => v.includes(x))); if (extra.length) s.veg = [...s.veg, extra[Math.floor(Math.random() * extra.length)]]; }],
  surprise: ['Surprise me', s => { const st = Object.keys(B_STYLE).filter(k => k !== s.style); s.style = st[Math.floor(Math.random() * st.length)]; s.base = null; }]
};

/* ================= Optional AI (no running cost to the app owner) ================= */
export async function aiAvailable() {
  const out = { chrome: false, puter: true };
  try { if ('LanguageModel' in self) { const a = await self.LanguageModel.availability(); out.chrome = a && a !== 'unavailable' && a !== 'no'; } } catch (e) { /* not supported */ }
  return out;
}
function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); }); }
export async function aiAsk(provider, prompt) {
  if (provider === 'chrome') { const session = await self.LanguageModel.create(); const r = await session.prompt(prompt); session.destroy && session.destroy(); return r; }
  if (provider === 'puter') {
    await loadScript('https://js.puter.com/v2/');
    const r = await self.puter.ai.chat(prompt);
    return typeof r === 'string' ? r : (r && r.message && (typeof r.message.content === 'string' ? r.message.content : (r.message.content || []).map(c => c.text || '').join(''))) || String(r);
  }
  throw new Error('AI is turned off. Pick an AI option in Settings.');
}
export async function aiRecipe(provider, description, serves) {
  const prompt = `You are a home-cooking assistant for Irish home cooks shopping at supermarkets like Lidl. Create one dinner recipe for: "${description}". Serves ${serves}. Use metric units (g, ml, tsp, tbsp) or plain counts. Reply with ONLY JSON, no prose, in this shape: {"title":"...","serves":${serves},"time":30,"ingredients":[{"qty":200,"unit":"g","name":"chicken thighs"}],"steps":["..."]}`;
  const text = await aiAsk(provider, prompt);
  const json = JSON.parse(String(text).replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
  return normalizeRecipe({ id: 'u:' + Date.now().toString(36), src: 'ai', title: json.title || 'AI recipe', serves: +json.serves || serves, time: +json.time || 40, cat: '', area: '', ings: (json.ingredients || []).map(i => ({ q: +i.qty || 1, u: UNIT_ALIASES[String(i.unit || '').toLowerCase()] ?? '', name: i.name, raw: `${i.qty || ''} ${i.unit || ''} ${i.name}`.trim() })), steps: json.steps || [] });
}
export { CATALOG, ITEM, AISLES };
