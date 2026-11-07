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
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/'/g, '').replace(/\s+/g, ' ').trim();
const sing = w => w.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/(?<![su])s$/, '');
const slug = s => norm(s).replace(/ /g, '-');
// what Mise already knows, by English name -> catalog id or world id
const KNOWN = new Map();
const know = (n, target) => { for (const v of [norm(n), norm(n).split(' ').map(sing).join(' ')]) if (v && !KNOWN.has(v)) KNOWN.set(v, target); };
for (const it of Object.values(ITEM)) { if (it.id.startsWith('other') || ['household', 'personal', 'baby', 'pet', 'health'].includes(it.cat)) continue; know(it.n, { cat: it.id }); for (const a of it.al) know(a, { cat: it.id }); }
for (const [n, sid, syn] of OLD.items) { const t = { world: 'w:' + sid + ':' + slug(n), sid, n }; know(n, t); for (const s of syn || []) know(s, t); }
const lookup = n => KNOWN.get(norm(n)) || KNOWN.get(norm(n).split(' ').map(sing).join(' '));
const sidOf = t => t.cat ? (ITEM[t.cat].standin || t.cat) : t.sid;
// Not ingredients, or not safe: same spirit as the FoodOn filter
const DROP = /toxic|poison|castor|jojoba|pokeweed|foxglove|hemlock|nightshade|belladonna|oleander|mistletoe|tansy|comfrey|rue\b|calamus|aconite|monkshood|yew|datura|ackee|cassava leaf|magic mushroom|psilocybin|amanita|death cap|cannabis|marijuana|hemp|tobacco|coca\b|kava|khat|opium|poppy straw|ayahuasca|peyote|kratom|ephedra|ma huang|senna|cascara|aloe latex|pennyroyal|sassafras|wormwood|absinthe|brand|company|restaurant|cultivar group|\bfeed\b|fodder|silage|pet food|dog food|cat food|baby food|infant|formula|supplement|pill|tablet|capsule|e number|^e\d|additive|emulsifier|preservative|colou?ring|flavou?ring agent|starch\b|maltodextrin|glucose syrup|hydrolys|isolate|protein powder|by-product|byproduct|waste|peel extract|extract\b|essential oil|perfume|cosmetic|medicinal|medicine|drug|\bdish\b|cuisine|recipe|meal\b|festival|day\b|competition|museum|film|album|song|novel|ship|band\b|\d{3,}/i;
const TOO_GENERIC = /^(food|foods|ingredient|food ingredient|vegetable|fruit|meat|fish|spice|herb|nut|cereal|sauce|condiment|dairy product|seafood|plant|animal|organism|product|substance|thing|item)$/;
// Default stand-ins by the root class an item sits under (used only if nothing closer is known)
const ROOT_SID = { 'vegetable': 'courgette', 'fruit': 'apple', 'spice': 'cumin', 'herb': 'parsley', 'meat': 'diced-beef', 'seafood': 'prawns', 'cheese': 'cheddar', 'cereal': 'couscous', 'nut': 'nuts', 'sauce': 'cooking-sauce', 'condiment': 'mustard', 'sausage': 'sausages', 'bread': 'bread', 'pasta': 'pasta', 'noodle': 'noodles', 'rice': 'rice', 'edible mushroom': 'mushroom', 'fish as food': 'white-fish', 'legume': 'kidney-beans', 'pulse': 'lentils', 'milk': 'milk', 'dairy product': 'yogurt', 'egg as food': 'eggs', 'sugar': 'sugar', 'root vegetable': 'carrot', 'berry': 'berries', 'flour': 'flour', 'cut of meat': 'steak', 'cooking oil': 'oil', 'citrus': 'orange', 'leaf vegetable': 'spinach', 'shellfish': 'prawns', 'vinegar': 'vinegar', 'dried fruit': 'dried-fruit', 'cured meat': 'deli-meat', 'tropical fruit': 'mango', 'stone fruit': 'plums', 'squash': 'butternut', 'chili pepper': 'chilli', 'onion': 'onion', 'tuber': 'potato', 'yogurt': 'yogurt', 'butter': 'butter', 'curry powder': 'curry-powder', 'spice mix': 'curry-powder', 'syrup': 'syrup', 'honey': 'honey', 'chocolate': 'chocolate', 'tea': 'tea', 'game meat': 'game', 'poultry meat': 'chicken-thigh', 'pickled food': 'pickles', 'fermented food': 'kimchi' };
// roots that are too risky to guess from: recognised only if something closer is known
const NO_DEFAULT = new Set(['food ingredient', 'paste', 'edible seaweed', 'offal', 'edible insect', 'sprout', 'coffee bean', 'P1582']);
const L = id => (H.items[id] && H.items[id].l.en) || H.parentLabels[id] || null;
function standinFor(q0) {
  const it = H.items[q0];
  // 1. the item's own English names
  for (const n of [it.l.en, ...(it.a.en || [])].filter(Boolean)) { const t = lookup(n); if (t) return { t, how: 'same' }; }
  // 2. the last word or two of its name ("thai eggplant" -> "eggplant", "blood orange" -> "orange")
  const w = norm(it.l.en || '').split(' ');
  for (const k of [2, 1]) if (w.length > k) { const t = lookup(w.slice(-k).join(' ')); if (t && !ITEM[t.cat || ''] ?.staple) return { t: { sid: sidOf(t) }, how: 'word' }; }
  // 3. up the subclass tree, nearest known ancestor wins
  let frontier = [...it.p], seen = new Set(frontier);
  for (let d = 0; d < 5 && frontier.length; d++) {
    for (const p of frontier) { const n = L(p); if (!n || TOO_GENERIC.test(norm(n))) continue; const t = lookup(n); if (t) return { t: { sid: sidOf(t) }, how: 'tree' }; }
    const next = []; for (const p of frontier) for (const pp of (H.items[p] ? H.items[p].p : [])) if (!seen.has(pp)) { seen.add(pp); next.push(pp); } frontier = next;
  }
  // 4. the root class it was found under
  for (const r of it.r) { const rn = H.roots[r]; if (rn && !NO_DEFAULT.has(rn) && ROOT_SID[rn]) return { t: { sid: ROOT_SID[rn] }, how: 'root' }; }
  return null;
}
const LANGS = ['en', 'ga', 'pl', 'ro', 'pt', 'es', 'lt', 'lv', 'it', 'fr', 'de', 'ar', 'zh', 'ru', 'uk', 'hi', 'ur', 'tl'];
const langOf = l => l === 'pt-br' ? 'pt' : l.startsWith('zh') ? 'zh' : l;
const okName = s => s && s.length >= 2 && s.length <= 40 && !/[(),;:\/]|\d/.test(s) && !DROP.test(s);
const out = [], packs = Object.fromEntries(LANGS.map(l => [l, new Map()])), stats = { same: 0, word: 0, tree: 0, root: 0, none: 0, dropped: 0 };
const seenNew = new Map();
for (const [q0, it] of Object.entries(H.items)) {
  const en = it.l.en;
  if (en && (DROP.test(en) || TOO_GENERIC.test(norm(en)))) { stats.dropped++; continue; }
  if (en && !okName(en)) { stats.dropped++; continue; }
  const r = standinFor(q0); if (!r) { stats.none++; continue; }
  stats[r.how]++;
  let target;
  if (r.how === 'same') target = r.t.cat || r.t.world;
  else {
    if (!en) continue; // a brand-new ingredient needs an English name to show
    const sid = r.t.sid; if (!ITEM[sid]) { stats.none++; continue; }
    const key = norm(en); if (lookup(en)) continue;
    target = 'w:' + sid + ':' + slug(en);
    if (!seenNew.has(key)) { seenNew.set(key, out.length); out.push([en.charAt(0).toUpperCase() + en.slice(1), sid, []]); }
    const row = out[seenNew.get(key)];
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
