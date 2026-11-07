// Mise flavour lab: pairings by shared aroma families + taste contrast.
// Ingredients that share aroma compounds (roasted, fruity, green, citrus...) tend to taste good together,
// even when they never appear together in normal cooking. This is our own simplified map of that idea.
import * as PR from './pairings.js';
import { ITEM } from './data.js';
import * as C from './core.js';
import * as G from './builder.js';
import * as K from './chef.js';

// Aroma families, tastes and weights live in aromas.js
import { A, NOTES } from './aromas.js';
export { NOTES };

export const aroma = id => A[id] || (id && ITEM[id] && ITEM[id].standin ? A[ITEM[id].standin] || null : null);
const CAT = id => {
  const it = ITEM[id]; if (!it) return 'other';
  if (['coffee', 'cocoa', 'cinnamon', 'star-anise', 'fennel-seeds', 'cardamom', 'ground-coriander', 'cumin', 'paprika', 'nutmeg', 'five-spice', 'black-pepper', 'chilli-flakes', 'garam-masala', 'curry-powder', 'chilli-powder', 'turmeric'].includes(id)) return 'dry';
  if (['blue-cheese', 'goats-cheese', 'feta', 'parmesan', 'cheddar', 'mozzarella', 'halloumi'].includes(id)) return 'cheese';
  if (['tahini', 'peanut-butter', 'nuts', 'sesame-oil'].includes(id)) return 'nutty';
  if (['miso', 'soy-sauce', 'fish-sauce', 'anchovies', 'worcestershire', 'kimchi', 'chipotle'].includes(id)) return 'umami';
  if (['honey', 'syrup', 'dates', 'dark-chocolate', 'chocolate', 'vanilla'].includes(id)) return 'sweet';
  if (['lemon', 'lime', 'vinegar', 'capers', 'olives'].includes(id)) return 'sharp';
  if (['basil', 'coriander', 'mint', 'rosemary', 'sage', 'thyme', 'dill', 'parsley', 'tarragon', 'lemongrass', 'dried-rosemary', 'dried-thyme'].includes(id)) return 'herb';
  if (['cream', 'double-cream', 'butter', 'cream-cheese', 'creme-fraiche', 'yogurt', 'sour-cream', 'coconut-milk'].includes(id)) return 'creamy';
  if (it.cat === 'fruit' || ['tomato', 'cherry-tomato'].includes(id)) return 'fruit';
  if (G.MAINS[id] && G.MAINS[id].grp !== 'veg') return 'protein';
  if (G.VEG[id] || it.cat === 'veg') return 'veg';
  if (G.MAINS[id]) return 'protein';
  return 'other';
};
export const catOf = CAT;
// how much two ingredients share, 0..1, plus the notes they share
export function affinity(a, b) {
  if (K.ready()) { const p = K.pair(a, b); if (p) return { s: Math.max(0, Math.min(1, (p.comp - 0.25) * 1.1 + Math.max(0, p.rec || 0) * 1.8)), shared: K.sharedFams(a, b).filter(k => NOTES[k]).slice(0, 3), data: p }; }
  const x = A[a], y = A[b]; if (!x || !y) return { s: 0, shared: [] };
  let s = 0, tot = 0; const shared = [];
  for (const [k, v] of Object.entries(x.n)) { tot += v; if (y.n[k]) { const m = Math.min(v, y.n[k]); s += m; shared.push([k, m]); } }
  for (const v of Object.values(y.n)) tot += v;
  const strong = shared.filter(([k, m]) => m >= 2 || (k !== 'Cr' && k !== 'Me' && x.n[k] + y.n[k] >= 3));
  return { s: Math.min(1, (2 * s) / Math.max(1, tot) * 1.6), shared: (strong.length ? strong : shared.filter(([k]) => k !== 'Cr')).sort((p, q) => q[1] - p[1]).map(([k]) => k) };
}
// well-known pairings (sweet side mostly; savoury ones live in the builder's pairing map)
const CLASSIC = {}; for (const line of ['strawberries cream chocolate vanilla mint lemon yogurt', 'apple cinnamon cheddar sage pork-chop pork-roast honey', 'pears blue-cheese nuts chocolate cinnamon', 'banana chocolate peanut-butter honey cinnamon', 'pineapple ham gammon coconut-milk lime chilli', 'mango lime chilli coconut-milk prawns', 'beetroot goats-cheese orange dill feta', 'coffee chocolate dark-chocolate vanilla cinnamon', 'orange chocolate duck-breast fennel', 'tomato basil mozzarella', 'blueberries lemon yogurt', 'raspberries chocolate dark-chocolate cream lemon', 'rhubarb ginger cream', 'dates nuts cinnamon lamb', 'lemon salmon white-fish chicken-thigh', 'lime chilli coriander', 'blue-cheese nuts honey steak', 'goats-cheese honey nuts', 'miso salmon honey', 'tahini lemon chickpeas'])
  { const [a, ...bs] = line.split(' '); for (const b of bs) { (CLASSIC[a] = CLASSIC[a] || new Set()).add(b); (CLASSIC[b] = CLASSIC[b] || new Set()).add(a); } }
// does everyone already cook these together?
const usual = (a, b) => (K.ready() && (((K.pair(a, b) || {}).rec || 0) > 0.06 || ((K.pair(a, b) || {}).known || 0) > 0)) || (CLASSIC[a] && CLASSIC[a].has(b)) || G.pairScore([a, b]) > 0 || Object.values(G.KITS).some(k => { const ids = [...k.core, ...k.extra].map(c => c[0]); return (ids.includes(a) && (ids.includes(b) || (k.mains || []).includes(b) || (k.vegPref || []).includes(b))) || (ids.includes(b) && ((k.mains || []).includes(a) || (k.vegPref || []).includes(a))); });
// taste contrast: what makes a combo balanced even when aromas don't overlap
const CONTRAST = { s: 'al', a: 'sf', f: 'a', b: 'sf', l: 'sa', h: 'sf' };
function contrast(a, b) { return Math.max(contrast1(a, b), contrast1(b, a)); }
function contrast1(a, b) { const ta = (A[a] || {}).t || '', tb = (A[b] || {}).t || ''; let n = 0; for (const c of ta) if ((CONTRAST[c] || '').split('').some(z => tb.includes(z))) n++; return Math.min(1, n * 0.5); }
const learnt = (state, a, b) => ((state.lab || {}).pairs || {})[[a, b].sort().join('|')] || 0;
// Partners for one ingredient, grouped: classic, surprising, wild
const REP = { chilli: 'chilli', tomato: 'tomato', onion: 'onion', soy_sauce: 'soy-sauce', curry: 'curry-powder', beef: 'steak', pork: 'pork-chop', fish: 'white-fish', sausage: 'sausages', coconut: 'coconut-milk', chicken: 'chicken-thigh', basil: 'basil', ginger: 'ginger', mint: 'mint', oregano: 'oregano', thyme: 'thyme', rosemary: 'rosemary', coriander: 'coriander', cheese: 'blue-cheese', feta: 'feta', bread: 'bread', potato: 'potato', carrot: 'carrot', spinach: 'spinach', cabbage: 'cabbage', lettuce: 'salad', honey: 'honey', sugar: 'sugar', raisin: 'dates', apple: 'apple' };
// products and ready-made things aren't flavour partners
const NOPART = new Set('choc-spread hot-choc scones cake biscuits popcorn crisps cream-spray croissants puff-pastry salmon-tin frozen-burgers nuggets fish-fingers fish-cakes coleslaw cooking-sauce pasta-sauce fruit-yogurt frozen-fruit frozen-veg tinned-fruit garlic-bread cereal cereal-bars hash-browns chips hot-dogs cheese-slices crackers crumpets soda-bread buns baguette pizza-dough wraps pitta naan bread breadcrumbs ice-cream custard brown-sauce salad-cream gravy stock sugar icing-sugar brown-sugar onion-granules garlic-granules dried-basil dried-rosemary dried-thyme mixed-herbs milk oat-milk spread beer wine'.split(' '));
// rare aroma families say more than common ones: sharing 'mushroomy' means more than sharing 'roasted'
const IDF = (() => { const df = {}, n = Object.keys(A).length; for (const v of Object.values(A)) for (const k of Object.keys(v.n)) df[k] = (df[k] || 0) + 1; const o = {}; for (const k in df) o[k] = Math.log(n / df[k]); return o; })();
const cosAB = (a, b) => { const x = (A[a] || {}).n, y = (A[b] || {}).n; if (!x || !y) return 0; let d = 0, na = 0, nb = 0; for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const w = IDF[k] || 1, p = (x[k] || 0) * w, q = (y[k] || 0) * w; d += p * q; na += p * p; nb += q * q; } return na && nb ? d / Math.sqrt(na * nb) : 0; };
// sauces and blends: fine partners, never a discovery
const SAUCY = new Set('ketchup salsa sweet-chilli bbq-sauce baked-beans mayo sriracha hot-sauce stout vinegar pesto curry-paste cajun-spice fajita-mix peri-spice worcestershire mint-sauce jam passata chopped-tomatoes tomato-puree garam-masala curry-powder five-spice chilli-powder'.split(' '));
const meatish = id => ['meat', 'fish'].includes((ITEM[id] || {}).cat);
export function partners(state, id, opts = {}) {
  const out = [], fam = new Map(), h = sdi(id), catA = CAT(h), wA = (A[h] || {}).w || 2, famA = K.ready() ? K.keyOf(h) : null;
  for (const b of Object.keys(A)) {
    if (b === id || b === h || NOPART.has(b) || !ITEM[b] || !G.okItem(state, b)) continue;
    if (opts.vegOnly && CAT(b) === 'protein' && G.MAINS[b] && G.MAINS[b].grp !== 'veg') continue;
    const f = pairFit(id, b), l = learnt(state, id, b); if (f.kn === -1) continue;
    const catB = CAT(b), fk = (K.ready() && K.keyOf(b)) || b, cs = cosAB(h, b);
    if (famA && fk === famA) continue; // other cuts of the same thing
    const us = f.kn > 0 || (CLASSIC[h] && CLASSIC[h].has(b)), ev = !us && usual(h, b);
    if (((catA === 'protein' && catB === 'protein') || (meatish(h) && meatish(b))) && !us) continue; // another meat isn't a partner
    const cross = ['fruit', 'sweet', 'dry'].some(c => [catA, catB].includes(c)) && [catA, catB].some(c => ['protein', 'cheese', 'veg', 'umami'].includes(c));
    // bold pairings chefs use are the discoveries; classics are what everyone already does
    let kind = f.kn === 1 ? (cross ? 'wild' : 'surprising') : us || ev ? 'classic' : null;
    if (!kind) {
      if (G.BASES[b]) continue; // rice and pasta aren't discoveries
      if (catA === catB || cs > 0.85 || SAUCY.has(b)) continue;  // berries with berries isn't a discovery
      if (Math.abs(wA - ((A[b] || {}).w || 2)) >= 2 && cs < 0.6) continue; // a bold partner would flatten a delicate one
      if (cross && cs >= 0.55) kind = 'wild';
      else if (cs >= 0.6 || (f.ct >= 0.5 && cs >= 0.45)) kind = 'surprising';
    }
    if (!kind) continue;
    const rk = f.kn > 0 ? PR.rank(h, b, K.keyOf) : 99;
    const score = (kind === 'classic' || f.kn === 1 ? f.s + (f.kn === 2 ? 0.15 : f.kn === 1 ? 0.05 : us ? 0.12 : 0) + (rk < 99 ? 0.12 * Math.max(0, 1 - rk / 25) : 0) : cs + f.ct * 0.2) + l * 0.4;
    const prev = fam.get(fk), sc = score + (b === fk || REP[fk] === b ? 0.06 : 0);
    if (prev && prev.score >= sc) continue;
    const x = { id: b, kind, score: sc, why: whyPair(id, b, f.af, f.ct) }; if (prev) out.splice(out.indexOf(prev), 1); fam.set(fk, x); out.push(x);
  }
  out.sort((x, y) => y.score - x.score);
  const g = k => out.filter(x => x.kind === k).slice(0, opts.n || 10);
  return { classic: g('classic'), surprising: g('surprising'), wild: g('wild') };
}
const sing = s => s.replace(/^frozen |^mixed |^natural /, '').replace(/^lemons$/, 'lemon').replace(/^limes$/, 'lime').replace(/ries$/, 'ry').replace(/oes$/, 'o').replace(/(?<![s])s$/, '').replace(/ paste$| extract$| powder$| fillet$/, '');
const lbl = id => sing(nm(id));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const nm = id => (ITEM[id] ? ITEM[id].n.toLowerCase().replace(/^fresh /, '') : id);
const TASTE_WORD = { s: 'sweet', a: 'sharp', l: 'salty', b: 'bitter', f: 'rich', h: 'hot' };
export function whyPair(a, b, af = affinity(a, b), ct = contrast(a, b)) {
  const bits = [];
  if (K.ready()) { const w = K.why(a, b); if (w) bits.push(w); }
  if (af.shared.length && !bits.length) bits.push(`both have ${af.shared.slice(0, 2).map(k => NOTES[k]).join(' and ')} notes`);
  if (ct >= 0.5) { const ta = ((A[a] || {}).t || '')[0], tb = ((A[b] || {}).t || '')[0]; if (ta && tb && ta === tb) {} else if (ta && tb) bits.push(`${TASTE_WORD[tb]} ${nm(b)} against ${TASTE_WORD[ta]} ${nm(a)}`); }
  return bits.join('; ') || 'they work as a contrast';
}
// How well a whole combo hangs together, and what it's missing
// How well two ingredients go together, 0..1. Three kinds of evidence, best one wins:
// what cooks know (Mise's pairing knowledge), what real dishes do (USDA dish data), and shared aromas
// or a taste contrast (sweet mango against hot chilli). Known clashes are capped low.
const sdi = id => (ITEM[id] && ITEM[id].standin) || id;
export function pairFit(a, b) {
  a = sdi(a); b = sdi(b);
  const p = K.ready() ? K.pair(a, b) : null, kn = p ? p.known || 0 : 0;
  const af = affinity(a, b), ct = contrast(a, b), raw = Math.min(1, af.s + ct * 0.4);
  if (kn === -1) return { s: Math.min(raw, 0.08), kn, af, ct };
  let s = raw;
  if (kn === 2 || (CLASSIC[a] && CLASSIC[a].has(b))) s = Math.max(s, 0.88 + raw * 0.12);
  else if (kn === 1) s = Math.max(s, 0.72 + raw * 0.2);
  else if (usual(a, b)) s = Math.max(s, 0.6 + raw * 0.25);
  return { s: Math.min(1, s), kn, af, ct };
}
export function comboCheck(ids) {
  const links = [], n = ids.length, best = new Array(n).fill(0); let total = 0, pairs = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const f = pairFit(ids[i], ids[j]); total += f.s; pairs++; best[i] = Math.max(best[i], f.s); best[j] = Math.max(best[j], f.s);
    if (f.s >= 0.45 || f.kn === -1) links.push([ids[i], ids[j], f.kn === -1 ? 'cooks usually keep these apart' : whyPair(ids[i], ids[j], f.af, f.ct), f.s]);
  }
  links.sort((x, y) => y[3] - x[3]);
  // a combo hangs together when every part links to something; not every pair has to match
  const mean = pairs ? total / pairs : 0, conn = n ? best.reduce((a, x) => a + x, 0) / n : 0;
  const tastes = new Set(ids.flatMap(id => ((A[sdi(id)] || {}).t || '').split('').filter(Boolean)));
  const need = [];
  if ((tastes.has('f') || tastes.has('s')) && !tastes.has('a')) need.push(['a', 'something sharp (lemon, lime, vinegar, pickles)']);
  if (!tastes.has('l') && !ids.some(id => CAT(id) === 'umami' || CAT(id) === 'cheese')) need.push(['l', 'something salty (cheese, soy, miso, anchovies, or just salt)']);
  if (tastes.has('b') && !tastes.has('s') && !tastes.has('f')) need.push(['s', 'a touch of sweetness or richness to soften the bitterness']);
  if (!ids.some(id => ['nutty', 'herb'].includes(CAT(id)) || ['cucumber', 'pomegranate', 'apple', 'spring-onion', 'red-onion'].includes(id))) need.push(['c', 'crunch or freshness (nuts, herbs, raw onion, pomegranate)']);
  const clashes = links.filter(l => l[2] === 'cooks usually keep these apart').length;
  const h = n <= 2 ? mean : Math.min(1, conn * 0.55 + mean * 0.45);
  return { harmony: Math.max(0, clashes ? Math.min(h, 0.4) - 0.1 * (clashes - 1) : h), links, need };
}

/* ---------- Build an experimental dish ---------- */
const FIX = { a: ['lemon', 'lime', 'vinegar', 'capers', 'pomegranate', 'kimchi', 'yogurt'], l: ['parmesan', 'feta', 'soy-sauce', 'miso', 'anchovies', 'olives', 'capers', 'halloumi'], s: ['honey', 'syrup', 'dates', 'orange'], c: ['nuts', 'pomegranate', 'cucumber', 'spring-onion', 'red-onion', 'apple', 'parsley', 'coriander', 'mint', 'basil'] };
const ROASTFRUIT = new Set(['apple', 'pears', 'pineapple', 'plums', 'grapes', 'rhubarb', 'strawberries', 'banana', 'orange', 'mango']);
const PP = { dry: 1, fruit: 70, cheese: 30, nutty: 15, umami: 10, sweet: 10, sharp: 0.25, herb: 4, creamy: 40, veg: 100 };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function qty(id, cat, serves) {
  const it = ITEM[id]; if (!it) return { q: 1, u: '' };
  if (it.u === 'pc') return { q: Math.max(0.5, Math.round((cat === 'fruit' ? 0.5 : cat === 'sharp' ? 0.25 : 0.5) * serves * 2) / 2), u: '' };
  if (cat === 'dry') return { q: Math.max(1, Math.round(serves * 0.75)), u: 'tsp' };
  const pp = PP[cat] || 30; return { q: Math.round(pp * serves / 5) * 5 || 5, u: it.u };
}
// the component each partner turns into
function component(id, hero, ctx) {
  const c = CAT(id), n = nm(id), H = ctx.heroName;
  switch (c) {
    case 'dry': return { role: 'rub', label: `${lbl(id)}-rubbed`, prefix: true, step: `Mix ${id === 'coffee' ? 'a teaspoon of finely ground coffee' : id === 'cocoa' ? 'a teaspoon of cocoa' : `the ${n}`} per portion with salt, black pepper, a pinch of sugar and a little oil. Rub it all over the ${H}.` };
    case 'fruit': return ROASTFRUIT.has(id) && ctx.oven && Math.random() < 0.45
      ? { role: 'roast', label: `roast ${lbl(id)}`, step: `Cut the ${n} into chunks and roast or pan-fry until caramelised at the edges, about 10–15 minutes.` }
      : { role: 'salsa', label: `${lbl(id)} salsa`, step: `Dice the ${n} small. Mix with a pinch of salt${ctx.sharp ? `, a squeeze of ${nm(ctx.sharp)}` : ', a splash of vinegar'}${ctx.herb ? ` and chopped ${nm(ctx.herb)}` : ''}${ctx.heat ? ' and a little chopped chilli' : ''}. Leave 10 minutes for the flavours to mingle.` };
    case 'cheese': return id === 'blue-cheese' || id === 'goats-cheese' ? { role: 'sauce', label: `${lbl(id)} sauce`, step: `Melt the ${n} into a splash of cream or milk over a low heat, stirring until smooth. Season with black pepper.` } : { role: 'top', label: n, step: `Crumble or grate the ${n} over at the end.` };
    case 'nutty': return id === 'nuts' ? { role: 'crumb', label: 'toasted nut crumb', step: `Toast the nuts in a dry pan until golden, then roughly crush with a pinch of salt.` } : { role: 'dressing', label: `${lbl(id)} dressing`, step: `Whisk the ${n} with ${ctx.sharp ? nm(ctx.sharp) + ' juice' : 'lemon juice or vinegar'}, a little honey and warm water until it's pourable.` };
    case 'umami': return id === 'anchovies' ? { role: 'butter', label: 'anchovy butter', step: `Mash a couple of anchovies into soft butter with a little garlic. Let it melt over the ${H} as it rests.` } : id === 'kimchi' ? { role: 'top', label: 'kimchi', step: `Chop the kimchi and fry it for a minute until it catches, or serve it cold on the side.` } : { role: 'glaze', label: `${lbl(id)}-glazed`, prefix: true, step: `Mix the ${n} with a spoon of honey and a splash of water. Brush over the ${H} for the last few minutes so it goes sticky.` };
    case 'sweet': return id === 'dark-chocolate' || id === 'chocolate' ? { role: 'sauce', label: 'dark chocolate sauce', step: `Melt a square or two of the chocolate into the pan juices with a splash of stock or water and a pinch of chilli. It should be glossy, savoury and only slightly sweet.` } : id === 'vanilla' ? { role: 'butter', label: 'vanilla butter', step: `Melt butter until it smells nutty, take it off the heat and add a few drops of vanilla and a pinch of salt. Spoon over.` } : { role: 'glaze', label: `${lbl(id)}-glazed`, prefix: true, step: `Bubble the ${n} with a splash of vinegar and a pinch of salt until syrupy. Brush over the ${H} at the end.` };
    case 'herb': return { role: 'oil', label: `${lbl(id)} oil`, step: `Finely chop the ${n} with a little lemon zest and salt, and stir into a few spoons of olive oil.` };
    case 'creamy': return { role: 'sauce', label: `${n} sauce`, step: `Warm the ${n} in the pan with a pinch of salt${ctx.sharp ? ` and a squeeze of ${nm(ctx.sharp)}` : ''}.` };
    case 'veg': return ['beetroot', 'carrot', 'cauliflower', 'sweet-potato', 'butternut', 'peas', 'parsnip'].includes(id)
      ? { role: 'puree', label: `${lbl(id)} purée`, step: `Boil the ${n} until very soft, then mash or blitz with butter and salt until smooth.` }
      : { role: 'side', label: `charred ${lbl(id)}`, step: `Cook the ${n} in a very hot pan with a little oil until charred in spots. Season well.` };
    case 'sharp': return { role: 'sharp', label: null, step: null };
    default: return { role: 'side', label: n, step: `Add the ${n}.` };
  }
}
function heroStep(state, hero, ctx) {
  const m = G.MAINS[hero], c = CAT(hero), n = ctx.heroName, gear = G.gearOf(state);
  if (m && m.joint) return `Roast the ${n} at ${m.joint.temp}°C, about ${m.joint.per500 || 30} minutes per 500 g plus ${m.joint.extra}. Rest it before carving.`;
  if (m && m.ready) return `Warm the ${n} through in a pan.`;
  if (m && gear.airfryer && G.AFT[hero]) return `Air fry the ${n} at 200°C for about ${G.AFT[hero]} minutes, turning halfway, until cooked through.`;
  if (m) return m.cook.replace(/^Brown/, 'Sear') + (/until|minutes/.test(m.cook) ? '.' : ' until cooked through.');
  if (c === 'fruit') return `Halve or slice the ${n} and char it in a hot dry pan or under the grill for a few minutes.`;
  if (c === 'cheese') return `Bake or grill the ${n} until soft and golden.`;
  if (c === 'veg') return `Roast the ${n} in chunks at 200°C with oil and salt until tender and browned, 25–35 minutes.`;
  return `Cook the ${n}.`;
}
// stock: Map; opts: { hero, with: [ids], wild: 1|2, serves }
export function experiment(state, opts = {}) {
  const stock = opts.stock || G.pantryStock(state), serves = opts.serves || 2, wild = opts.wild || 1;
  const have = id => (stock.get(id) || 0) > 0 || (ITEM[id] && ITEM[id].staple && C.stapleHave(state, id));
  const ok = id => ITEM[id] && G.okItem(state, id) && !(opts.vegOnly && G.MAINS[id] && G.MAINS[id].grp !== 'veg');
  // hero: what you asked for, or something you've got
  let hero = opts.hero;
  if (!hero) { const pool = [...stock.keys()].filter(id => A[id] && ok(id) && (['protein', 'veg'].includes(CAT(id)) || ['halloumi', 'goats-cheese', 'tofu'].includes(id)) && !['onion', 'red-onion', 'garlic', 'spring-onion', 'chilli', 'ginger', 'leek', 'celery'].includes(id) && !(G.MAINS[id] && G.MAINS[id].joint)); const prot = pool.filter(id => CAT(id) === 'protein'); hero = pick(prot.length && Math.random() < 0.75 ? prot : pool.length ? pool : ['chicken-thigh']); }
  if (!A[hero]) return null;
  const chosen = (opts.with || []).filter(id => id !== hero && ok(id));
  // the surprise partner, then a bridge that links both
  const sc = id => { const af = affinity(hero, id), us = usual(hero, id); return af.s + contrast(hero, id) * 0.3 + learnt(state, hero, id) * 0.5 + (us ? (wild > 1 ? -0.6 : -0.2) : wild > 1 ? 0.35 : 0.15) + (have(id) ? 0.35 : -0.25) + Math.random() * 0.45; };
  const pool = Object.keys(A).filter(id => id !== hero && ok(id) && (affinity(hero, id).s >= 0.18 || contrast(hero, id) >= 0.5) && !['protein'].includes(CAT(id)) && !chosen.includes(id) && !['garlic', 'onion', 'salt', 'sugar', 'olive-oil', 'chilli-powder', 'black-pepper'].includes(id) && CAT(id) !== 'other');
  const wildCats = wild > 1 ? ['fruit', 'dry', 'sweet', 'cheese', 'umami'] : ['fruit', 'dry', 'cheese', 'umami', 'nutty', 'herb', 'veg'];
  while (chosen.length < 1) { const c = pool.filter(id => wildCats.includes(CAT(id))).map(id => [sc(id), id]).sort((a, b) => b[0] - a[0]).slice(0, 5); if (!c.length) break; chosen.push(pick(c)[1]); }
  if (chosen.length < 2) { const base = [hero, ...chosen]; const c = pool.filter(id => !chosen.includes(id) && CAT(id) !== CAT(chosen[0]) && !['sharp'].includes(CAT(id)) && (wild > 1 || !['sweet'].includes(CAT(id)) && !['coffee', 'cocoa', 'vanilla', 'star-anise'].includes(id))).map(id => [base.reduce((a, b) => a + affinity(b, id).s + contrast(b, id) * 0.3, 0) + (have(id) ? 0.4 : -0.3) + Math.random() * 0.4, id]).sort((a, b) => b[0] - a[0]).slice(0, 4); if (c.length) chosen.push(pick(c)[1]); }
  // balance: fix what the combo is missing with what you have
  const ids = [hero, ...chosen], chk = comboCheck(ids), extras = [];
  for (const [t] of chk.need) { if (t === 'l' || (t !== 'a' && chosen.length + extras.length >= 3) || (t === 'c' && Math.random() < 0.5)) continue; const f = (FIX[t] || []).filter(id => ok(id) && !ids.includes(id) && !extras.includes(id)).map(id => [have(id) * 2 + affinity(hero, id).s + Math.random(), id]).sort((a, b) => b[0] - a[0]).map(x => x[1])[0]; if (f && (have(f) || t === 'a')) extras.push(f); }
  const sharp = [...chosen, ...extras].find(id => CAT(id) === 'sharp' || ['lemon', 'lime', 'vinegar'].includes(id)) || null;
  const herb = [...chosen, ...extras].find(id => CAT(id) === 'herb') || null;
  const heroName = (G.MAINS[hero] ? G.MAINS[hero].n : nm(hero));
  const ctx = { heroName, sharp, herb, heat: (state.taste || {}).spice >= 2, oven: G.gearOf(state).oven || G.gearOf(state).airfryer };
  let comps = [...chosen, ...extras.filter(id => CAT(id) !== 'sharp')].map(id => ({ id, ...component(id, hero, ctx) })).filter(x => x.step);
  const salsas = comps.filter(x => x.role === 'salsa');
  if (salsas.length > 1) { const ids2 = salsas.map(x => x.id); comps = comps.filter(x => x.role !== 'salsa'); comps.push({ id: ids2[0], role: 'salsa', label: `${ids2.map(lbl).join(' & ')} salsa`, step: `Dice the ${ids2.map(nm).join(' and ')} small. Mix with a pinch of salt${sharp ? `, a squeeze of ${lbl(sharp)}` : ', a splash of vinegar'}${herb ? ` and chopped ${nm(herb)}` : ''}. Leave 10 minutes for the flavours to mingle.` }); }
  if (['fruit', 'sweet', 'creamy'].includes(CAT(hero))) {
    const all = [hero, ...chosen, ...extras], savoury = all.some(id => ['cheese', 'umami', 'veg', 'protein', 'herb'].includes(CAT(id)) || ['tomato', 'cherry-tomato', 'black-pepper'].includes(id));
    const fruits = all.filter(id => CAT(id) === 'fruit'), others = all.filter(id => !fruits.includes(id) && CAT(id) !== 'sharp');
    const title2 = cap(`${fruits.map(lbl).join(', ').replace(/, ([^,]*)$/, ' & $1')} ${savoury ? 'salad' : 'plate'}${others.length ? ' with ' + others.map(id => CAT(id) === 'creamy' ? `whipped ${lbl(id)}` : CAT(id) === 'nutty' ? `toasted ${lbl(id)}` : lbl(id)).join(' & ') : ''}`);
    const ings2 = all.map(id => { const q = qty(id, CAT(id), serves); return { q: id === hero ? q.q * 2 : q.q, u: q.u, name: nm(id), item: id, raw: `${id === hero ? q.q * 2 : q.q} ${q.u} ${nm(id)}`.replace(/\s+/g, ' ') }; });
    const st = [`Taste a little ${nm(hero)} with each partner first, so you know how much of each to use.`, `Slice or tear the ${fruits.map(nm).join(' and ')} into bite-size pieces and spread over a plate. Season with a pinch of salt${savoury ? ' and black pepper' : ''} — it wakes the flavours up.`];
    for (const id of others) { const c = CAT(id); st.push(c === 'creamy' ? `Whip or loosen the ${nm(id)} and spoon it alongside.` : c === 'cheese' ? `Crumble or shave the ${nm(id)} over.` : c === 'dry' ? `Dust over a small pinch of ${nm(id)}.` : c === 'herb' ? `Tear over the ${nm(id)}.` : c === 'nutty' ? `Toast the ${nm(id)} and scatter over.` : c === 'sweet' ? `Drizzle over a little ${nm(id)}.` : c === 'umami' ? `Dot over a little ${nm(id)} — go easy, it's strong.` : c === 'veg' ? `Slice the ${nm(id)} thinly and add.` : `Add the ${nm(id)}.`); }
    st.push(`Finish with ${sharp ? `a squeeze of ${lbl(sharp)}` : 'a few drops of vinegar'}${savoury ? ' and a drizzle of olive oil' : ''}. Taste, adjust, then rate it so Mise learns.`);
    const why2 = []; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length && why2.length < 4; j++) { const af = affinity(all[i], all[j]), ct = contrast(all[i], all[j]); if (af.s >= 0.25 || ct >= 0.5) why2.push(`${cap(lbl(all[i]))} + ${lbl(all[j])}: ${whyPair(all[i], all[j], af, ct)}.`); }
    const r2 = C.normalizeRecipe({ id: 'lab:' + all.join('+') + ':plate', src: 'lab', title: title2, serves, time: 15, cat: 'Experiment', area: '', ings: ings2, steps: st });
    r2.exp = { hero, with: chosen, extras, wild: chosen.some(id => !usual(hero, id)) ? 2 : 0, why: why2, harmony: comboCheck(all).harmony };
    return r2;
  }
  // a base if you've got one that fits
  const baseId = ['potato', 'rice', 'couscous', 'bread', 'pasta', 'noodles', 'sweet-potato'].find(b => have(b) && G.BASES[b] && ok(b) && !ids.includes(b) && Math.random() < 0.8);
  // name
  const pre = comps.filter(x => x.prefix).slice(0, 1).map(x => x.label);
  const rest = comps.filter(x => !x.prefix && x.label).map(x => x.label);
  const title = cap(`${pre.length ? pre[0] + ' ' : ''}${heroName}${rest.length ? ' with ' + (rest.length > 1 ? rest.slice(0, -1).join(', ') + ' & ' + rest[rest.length - 1] : rest[0]) : ''}`);
  // ingredients
  const ings = [];
  const addI = (id, q, u) => ings.push({ q, u, name: nm(id), item: id, raw: `${q} ${u} ${nm(id)}`.replace(/\s+/g, ' ') });
  { const m = G.MAINS[hero]; if (m) { const it = ITEM[hero]; const q = it.u === 'pc' ? m.pp * serves : Math.round(m.pp * serves / 10) * 10; addI(hero, q, it.u === 'pc' ? '' : it.u); } else { const q = qty(hero, 'veg', serves); addI(hero, q.q * (CAT(hero) === 'fruit' ? 2 : 1.5), q.u); } }
  for (const id of [...chosen, ...extras]) { const q = qty(id, CAT(id), serves); addI(id, q.q, q.u); }
  if (baseId) { const b = G.BASES[baseId], it = ITEM[baseId]; addI(baseId, it.u === 'pc' ? b.pp * serves : Math.round(b.pp * serves / 10) * 10, it.u === 'pc' ? '' : it.u); }
  // steps
  const steps = [];
  steps.push(`Taste first: try a little ${nm(chosen[0] || hero)} with a bite of ${nm(hero)} if you can. If it sings, carry on. If not, use less of it.`);
  const rub = comps.filter(x => x.role === 'rub');
  for (const x of rub) steps.push(x.step);
  if (baseId) steps.push(baseId === 'potato' ? 'Cut the potatoes into chunks and roast at 200°C with oil and salt for 35–40 minutes (or boil until tender).' : baseId === 'sweet-potato' ? 'Roast the sweet potato in chunks at 200°C for 30 minutes.' : (G.BASES[baseId].how || `Cook the ${G.BASES[baseId].n}.`));
  for (const x of comps.filter(x => ['puree', 'salsa', 'dressing', 'oil', 'crumb', 'butter'].includes(x.role))) steps.push(x.step);
  steps.push(heroStep(state, hero, ctx));
  for (const x of comps.filter(x => ['glaze', 'roast', 'side', 'sauce'].includes(x.role))) steps.push(x.step);
  steps.push(`Plate the ${heroName}${comps.some(x => x.role === 'puree') ? ' on the purée' : ''}${comps.filter(x => ['salsa', 'top', 'crumb', 'oil', 'dressing'].includes(x.role)).length ? `, then add the ${comps.filter(x => ['salsa', 'top', 'crumb', 'oil', 'dressing'].includes(x.role)).map(x => x.label).join(', ')}` : ''}${sharp && !comps.some(x => x.step && x.step.includes(nm(sharp))) ? ` and finish with a squeeze of ${lbl(sharp)}` : ''}.`);
  steps.push(`Taste and adjust: needs lifting? Add salt or something sharp. Too sharp? A little honey or butter. Then rate it so Mise learns.`);
  // why it works
  const why = [];
  for (const id of chosen) why.push(`${cap(nm(hero))} + ${nm(id)}: ${whyPair(hero, id)}.`);
  if (chosen.length > 1) why.push(`${cap(nm(chosen[0]))} + ${nm(chosen[1])}: ${whyPair(chosen[0], chosen[1])}.`);
  for (const id of extras) why.push(`${cap(lbl(id))} for balance.`);
  const surprise = chosen.filter(id => !usual(hero, id)).length;
  const r = C.normalizeRecipe({ id: 'lab:' + [hero, ...chosen.slice().sort(), ...extras.slice().sort(), baseId || ''].join('+') + ':' + comps.map(x => x.role).join(''), src: 'lab', title, serves, time: G.MAINS[hero] && G.MAINS[hero].joint ? 120 : 35, cat: 'Experiment', area: '', ings, steps });
  r.exp = { hero, with: chosen, extras, wild: surprise ? (wild > 1 || surprise > 1 ? 2 : 1) : 0, why, harmony: comboCheck([hero, ...chosen, ...extras]).harmony };
  return r;
}
export function experiments(state, opts = {}, n = 6) {
  const out = [], seen = opts.seenTitles || new Set();
  for (let i = 0; i < n * 6 && out.length < n; i++) { const r = experiment(state, opts); if (!r || seen.has(r.title)) continue; seen.add(r.title); out.push(r); }
  return out;
}
// learn from how an experiment went: +1 worked, 0 okay, -1 didn't
export function rateExperiment(state, r, v) {
  if (!r || !r.exp) return; state.lab = state.lab || { pairs: {}, notes: {} }; state.lab.pairs = state.lab.pairs || {};
  const ids = [r.exp.hero, ...r.exp.with];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const k = [ids[i], ids[j]].sort().join('|'); state.lab.pairs[k] = Math.max(-2, Math.min(2, (state.lab.pairs[k] || 0) + v)); }
}
export const pairUsual = (a, b) => usual(a, b);
export const contrastOf = (a, b) => contrast(a, b);
