// Turns the Wikidata harvest (tools/harvest/items.json, CC0) into Mise world ingredients and language packs.
// Each Wikidata food either IS something Mise already knows (then its names in every language are added
// to that ingredient), or becomes a new world ingredient that cooks like the nearest thing Mise knows,
// found by reading Wikidata's "subclass of" tree upwards ("Thai eggplant" -> "eggplant" -> aubergine).
// Output: www/data/ingwd.json (new English ingredients) and www/data/names/<lang>.json (names in a language).
import { ITEM } from '../www/js/data.js';
import fs from 'fs';
const H = JSON.parse(fs.readFileSync(new URL('./harvest/items.json', import.meta.url)));
const OLD = JSON.parse(fs.readFileSync(new URL('../www/data/ingdb.json', import.meta.url)));
// keep letters of every script; strip Latin accents only
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const sing = w => w.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/(?<![su])s$/, '');
const slug = s => norm(s).replace(/ /g, '-');
// what Mise already knows, by English name -> catalog id or world id
const KNOWN = new Map();
const know = (n, target) => { for (const v of [norm(n), norm(n).split(' ').map(sing).join(' ')]) if (v && !KNOWN.has(v)) KNOWN.set(v, target); };
for (const it of Object.values(ITEM)) { if (it.id.startsWith('other') || ['household', 'personal', 'baby', 'pet', 'health'].includes(it.cat)) continue; know(it.n, { cat: it.id }); for (const a of it.al) know(a, { cat: it.id }); }
for (const [n, sid, syn] of OLD.items) { const t = { world: 'w:' + sid + ':' + slug(n), sid, n }; know(n, t); for (const s of syn || []) know(s, t); }
// pickled vegetables (tsukemono, turshi...) cook like kimchi, not like Branston
KNOWN.set('pickle', { sid: 'kimchi' }); KNOWN.set('pickled vegetable', { sid: 'kimchi' }); KNOWN.set('tsukemono', { sid: 'kimchi' });
const lookup = n => KNOWN.get(norm(n)) || KNOWN.get(norm(n).split(' ').map(sing).join(' '));
const sidOf = t => t.cat ? (ITEM[t.cat].standin || t.cat) : t.sid;
// Not ingredients, or not safe: same spirit as the FoodOn filter
const DROP = /toxic|poison|castor|jojoba|pokeweed|foxglove|hemlock|nightshade|belladonna|oleander|mistletoe|tansy|comfrey|rue\b|calamus|aconite|monkshood|yew|datura|ackee|cassava leaf|magic mushroom|psilocybin|amanita|death cap|cannabis|marijuana|hemp|tobacco|coca\b|kava|khat|opium|poppy straw|ayahuasca|peyote|kratom|ephedra|ma huang|senna|cascara|aloe latex|pennyroyal|sassafras|wormwood|absinthe|brand|company|restaurant|cultivar group|\bfeed\b|fodder|silage|pet food|dog food|cat food|baby food|infant|formula|supplement|pill|tablet|capsule|e number|^e\d|additive|emulsifier|preservative|colou?ring|flavou?ring agent|starch\b|maltodextrin|glucose syrup|hydrolys|isolate|protein powder|by-product|byproduct|waste|peel extract|extract\b|essential oil|perfume|cosmetic|medicinal|medicine|drug|\bdish\b|cuisine|recipe|meal\b|festival|day\b|competition|museum|film|album|song|novel|ship|band\b|\d{3,}/i;
const TOO_GENERIC = /^(berry|berries|drupe|pome|accessory fruit|aggregate fruit|multiple fruit|hesperidium|pepo|nut|seed|fruit vegetable|edible plant|food plant|crop|plant product|food|foods|ingredient|food ingredient|vegetable|fruit|meat|fish|spice|herb|nut|cereal|sauce|condiment|dairy product|seafood|plant|animal|organism|product|substance|thing|item)$/;
// Default stand-ins by the root class an item sits under (used only if nothing closer is known)
const ROOT_SID = { 'cheese': 'cheddar', 'bread': 'bread', 'pasta': 'pasta', 'noodle': 'noodles', 'rice': 'rice', 'sausage': 'sausages', 'berry': 'berries', 'honey': 'honey', 'tea': 'tea', 'chocolate': 'chocolate', 'syrup': 'syrup', 'vinegar': 'vinegar', 'yogurt': 'yogurt', 'butter': 'butter', 'flour': 'flour', 'edible mushroom': 'mushroom', 'cereal': 'grains', 'chili pepper': 'chilli', 'onion': 'onion', 'citrus': 'orange', 'dried fruit': 'dried-fruit', 'spice mix': 'curry-powder',
  // too broad to cook from: recognised (so pantry, lists and receipts work) but never built into a dinner
  'vegetable': 'other-veg', 'leaf vegetable': 'other-veg', 'root vegetable': 'other-veg', 'tuber': 'other-veg', 'squash': 'other-veg', 'fruit': 'other-fruit', 'tropical fruit': 'other-fruit', 'stone fruit': 'other-fruit', 'meat': 'other-meat', 'cut of meat': 'other-meat', 'game meat': 'other-meat', 'poultry meat': 'other-meat', 'offal': 'other-meat', 'seafood': 'other-fish', 'shellfish': 'other-fish', 'fish as food': 'other-fish', 'sauce': 'other-sauce', 'condiment': 'other-sauce', 'paste': 'other-sauce', 'milk': 'other-dairy', 'dairy product': 'other-dairy', 'egg as food': 'other-food', 'spice': 'other-food', 'herb': 'other-food', 'nut': 'nuts', 'legume': 'other-food', 'pulse': 'other-food', 'sugar': 'sugar', 'cooking oil': 'oil', 'food ingredient': 'other-food', 'edible seaweed': 'other-food', 'pickled food': 'other-food' };
// roots that are too risky to guess from: recognised only if something closer is known
const NO_DEFAULT = new Set(['fermented food', 'edible insect', 'sprout', 'coffee bean', 'P1582']);
const ANC = new Map();
function ancestors(q0) { if (ANC.has(q0)) return ANC.get(q0); const out = new Set(); let fr = [...((H.items[q0] || {}).p || [])], seen = new Set(fr);
  for (let d = 0; d < 8 && fr.length; d++) { const nx = []; for (const p of fr) { const n = L(p); if (n) out.add(n.toLowerCase()); for (const pp of (H.items[p] ? H.items[p].p : [])) if (!seen.has(pp)) { seen.add(pp); nx.push(pp); } } fr = nx; }
  ANC.set(q0, out); return out; }
const NOT_INGREDIENT = /^(dish|food dish|prepared food|meal|soup|stew|salad|sandwich|dessert|cake|pastry|confectionery|candy|snack food|beverage|drink|alcoholic beverage|wine|beer|spirit|distilled beverage|liqueur|cocktail|soft drink|mixed drink|juice|fruit juice|liquor|brandy|whisky|vodka|cider|wine region|appellation|protected designation of origin|tobacco|drug|medication|essential oil|cosmetic)$/;
const EDIBLE_OIL = /olive|sunflower|rapeseed|canola|vegetable|sesame|peanut|groundnut|coconut|avocado|walnut|hazelnut|corn|maize|rice bran|grapeseed|grape seed|mustard|almond|pumpkin|linseed|flax|soy|ghee|lard|dripping|tallow|schmaltz|chilli|chili|garlic|truffle|palm|argan|pistachio|macadamia|cottonseed|safflower|camelina|cooking|frying|salad|butter/i;
const L = id => (H.items[id] && H.items[id].l.en) || H.parentLabels[id] || null;
function standinFor(q0) {
  const it = H.items[q0];
  // 1. the item's own English names
  for (const n of [it.l.en, ...(it.a.en || [])].filter(Boolean)) { const t = lookup(n); if (t) return { t, how: 'same' }; }
  // 3. up the subclass tree, nearest known ancestor wins
  let frontier = [...it.p], seen = new Set(frontier);
  for (let d = 0; d < 5 && frontier.length; d++) {
    for (const p of frontier) { const n = L(p); if (!n || TOO_GENERIC.test(norm(n))) continue; const t = lookup(n); if (t) return { t: { sid: sidOf(t) }, how: 'tree' }; }
    const next = []; for (const p of frontier) for (const pp of (H.items[p] ? H.items[p].p : [])) if (!seen.has(pp)) { seen.add(pp); next.push(pp); } frontier = next;
  }
  // 4. the root class it was found under
  // 2. the last word or two of its name ("thai eggplant" -> "eggplant", "blood orange" -> "orange")
  const w = norm(it.l.en || '').split(' ');
  for (const k of [2, 1]) if (w.length > k) { const t = lookup(w.slice(-k).join(' ')); if (t && !ITEM[t.cat || ''] ?.staple) return { t: { sid: sidOf(t) }, how: 'word' }; }
  const en0 = norm(it.l.en || '');
  if (it.r.some(r => H.roots[r] === 'cheese')) { const sid = /bleu|blue|blau|azul|gorgonzola|roquefort|stilton/.test(en0) ? 'blue-cheese' : /goat|chevre|chèvre|caprino|cabra/.test(en0) ? 'goats-cheese' : /mozzarella|burrata|bocconcini/.test(en0) ? 'mozzarella' : /brie|camembert|coulommiers/.test(en0) ? 'brie' : /feta|brinza|bryndza|halloumi/.test(en0) ? 'feta' : /ricotta|quark|cottage|curd|paneer/.test(en0) ? 'cottage-cheese' : 'cheddar'; return { t: { sid }, how: 'root' }; }
  for (const r of it.r) { const rn = H.roots[r]; if (rn && !NO_DEFAULT.has(rn) && ROOT_SID[rn]) return { t: { sid: ROOT_SID[rn] }, how: 'root' }; }
  return null;
}
const LANGS = ['en', 'ga', 'pl', 'ro', 'pt', 'es', 'lt', 'lv', 'it', 'fr', 'de', 'ar', 'zh', 'ru', 'uk', 'hi', 'ur', 'tl'];
const langOf = l => l === 'pt-br' ? 'pt' : l.startsWith('zh') ? 'zh' : l;
const okName = s => s && s.length >= 2 && s.length <= 40 && !/[(),;:\/®™]|\d/.test(s) && !DROP.test(s) && !/^(slice|piece|portion|serving) of /i.test(s);
let out = [], packs = Object.fromEntries(LANGS.map(l => [l, new Map()])), stats = { same: 0, word: 0, tree: 0, root: 0, none: 0, dropped: 0 };
const seenNew = new Map();
// Names written for Mise come first of all (tools/names_core.txt)
{ let lg = null, n0 = 0; for (const line of fs.readFileSync(new URL('./names_core.txt', import.meta.url), 'utf8').split('\n')) {
    const t = line.trim(); if (!t || (t.startsWith('#') && !t.startsWith('##'))) continue;
    if (t.startsWith('## ')) { lg = t.slice(3).trim(); continue; }
    const i = t.indexOf(':'); const cid = t.slice(0, i).trim(); if (!ITEM[cid]) { console.warn('names_core: unknown id', cid); continue; }
    for (const nm of t.slice(i + 1).split(';')) { const k = norm(nm); if (k && packs[lg] && !packs[lg].has(k)) { packs[lg].set(k, cid); n0++; } } }
  console.log('core names', n0); }
// Mise's own ingredients first: names looked up directly by their English name (harvest/catalog.json)
{ const f = new URL('./harvest/catalog.json', import.meta.url); if (fs.existsSync(f)) {
  const C = JSON.parse(fs.readFileSync(f)).items, claim = new Map();
  for (const [cid, o] of Object.entries(C)) for (const [lg0, ns] of Object.entries(o.l)) { const lg = langOf(lg0); for (const n of ns) { const k = lg + '|' + norm(n); (claim.get(k) || claim.set(k, new Set()).get(k)).add(cid); } }
  let n0 = 0; for (const [cid, o] of Object.entries(C)) { if (!ITEM[cid]) continue; for (const [lg0, ns] of Object.entries(o.l)) { const lg = langOf(lg0); if (!packs[lg]) continue; for (const nm of ns) { const k = norm(nm); if (!okName(nm) || !k || claim.get(lg + '|' + k).size > 1 || packs[lg].has(k)) continue; packs[lg].set(k, cid); n0++; } } }
  console.log('catalog names', n0); } }
for (const [q0, it] of Object.entries(H.items)) {
  if (it.l.en) it.l.en = it.l.en.replace(/ as (a )?food$| \(food\)$| meat as food$/i, m => / meat /i.test(m) ? ' meat' : '');
  const en = it.l.en;
  if (en && (DROP.test(en) || TOO_GENERIC.test(norm(en)))) { stats.dropped++; continue; }
  if (en && !okName(en)) { stats.dropped++; continue; }
  if ([...ancestors(q0)].some(x => NOT_INGREDIENT.test(x)) || /\b(doc|docg|aoc|aop|igt|dop|do|pdo|pgi|igp|vdqs)\b|smell|aroma|fragrance|odou?r|processing|preserving|\band wine\b|communion|wine\b|\bbeer\b|\bale\b|lager|whisk(e)?y|vodka|\bgin\b|\brum\b|liqueur|brandy|cocktail|soda\b/i.test(en || '')) { stats.dropped++; continue; }
  if (/\boil\b/i.test(en || '') && !EDIBLE_OIL.test(en)) { stats.dropped++; continue; }
  if (/\begg\b/i.test(en || '') && !/chicken|duck|quail|goose|hen|egg$/i.test(en || '')) { stats.dropped++; continue; }
  const r = standinFor(q0); if (!r) { stats.none++; continue; }
  stats[r.how]++;
  let target;
  if (r.how === 'same') target = r.t.cat || r.t.world;
  else {
    if (!en) continue; // a brand-new ingredient needs an English name to show
    const sid = r.t.sid; if (!ITEM[sid]) { stats.none++; continue; }
    const key = norm(en); if (lookup(en)) continue;
    // a cultivar is shown with its fruit ("Pioneer apple"); a bare one-word cultivar name would catch ordinary words
    let show = en; const base = ITEM[sid].n.toLowerCase().replace(/^(fresh|frozen) /, '').split(' ').pop(); const base1 = base.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/(?<![su])s$/, '');
    const isCult = ['fruit', 'veg'].includes(ITEM[sid].cat) && ['tree', 'root'].includes(r.how);
    const syns = [ITEM[sid].n, ...ITEM[sid].al].map(x => norm(x)).flatMap(x => [x, x.split(' ').map(sing).join(' '), sing(x.split(' ').pop())]);
    if (isCult && !syns.some(x => x && (' ' + norm(en).split(' ').map(sing).join(' ') + ' ').includes(' ' + x + ' '))) show = en + ' ' + base1;
    if (isCult && show !== en && norm(en).split(' ').length < 2) { /* keep only the long form */ } else if (show !== en) it.a.en = [...(it.a.en || []), en];
    const key2 = norm(show); if (lookup(show)) continue;
    target = 'w:' + sid + ':' + slug(show);
    if (!seenNew.has(key2)) { seenNew.set(key2, out.length); out.push([show.charAt(0).toUpperCase() + show.slice(1), sid, []]); }
    const row = out[seenNew.get(key2)];
    for (const a of it.a.en || []) if (okName(a) && !lookup(a) && !row[2].includes(a.toLowerCase())) row[2].push(a.toLowerCase());
  }
  // names in every language point at the same thing
  for (const [lg0, lab] of Object.entries(it.l)) { const lg = langOf(lg0); if (lg === 'en' || !packs[lg] || !okName(lab)) continue; const k = norm(lab); if (k && !packs[lg].has(k)) packs[lg].set(k, target); }
  for (const [lg0, as] of Object.entries(it.a)) { const lg = langOf(lg0); if (!packs[lg]) continue; for (const a of as) { if (!okName(a)) continue; const k = norm(a); if (!k) continue; if (lg === 'en') { if (!lookup(a) && r.how === 'same') packs.en.set(k, target); } else if (!packs[lg].has(k)) packs[lg].set(k, target); } }
}
fs.writeFileSync(new URL('../www/data/ingwd.json', import.meta.url), JSON.stringify({ v: 1, credit: 'Wikidata (CC0)', items: out }));
fs.mkdirSync(new URL('../www/data/names/', import.meta.url), { recursive: true });
for (const [lg, m] of Object.entries(packs)) if (m.size) fs.writeFileSync(new URL(`../www/data/names/${lg}.json`, import.meta.url), JSON.stringify({ v: 1, lang: lg, credit: 'Wikidata (CC0)', names: [...m.entries()] }));
console.log('new ingredients', out.length, 'stats', JSON.stringify(stats));
console.log('names per language', Object.entries(packs).map(([l, m]) => l + ':' + m.size).join(' '));
