// Mise flavour lab: pairings by shared aroma families + taste contrast.
// Ingredients that share aroma compounds (roasted, fruity, green, citrus...) tend to taste good together,
// even when they never appear together in normal cooking. This is our own simplified map of that idea.
import { ITEM } from './data.js';
import * as C from './core.js';
import * as G from './builder.js';

// Aroma families (plain-English names shown in the app)
export const NOTES = {
  R: 'roasted, toasty', Ca: 'caramel', Sv: 'savoury, oniony', Gr: 'fresh, green', Ci: 'citrusy', Pi: 'piney, herbal',
  Fr: 'fruity', Cr: 'creamy, buttery', Sp: 'warm spice', Sm: 'smoky', Ea: 'earthy', Fl: 'floral', Fu: 'funky, cheesy',
  Um: 'savoury umami', Me: 'meaty', An: 'aniseed'
};
// Tastes for contrast: s sweet, a sour, l salty, b bitter, f fat, h heat
const A = {};
const def = (ids, notes, taste = '') => { for (const id of ids.split(' ')) A[id] = { n: Object.fromEntries(notes.split(' ').filter(Boolean).map(x => [x.replace(/\d/, ''), +(x.match(/\d/) || [2])[0]])), t: taste }; };
// meat & fish
def('pork-chop pork-fillet pork-roast pork-mince pork-ribs cooked-pork', 'Me3 R2 Cr1 Ca1', 'f');
def('pork-belly', 'Me3 R2 Cr2 Ca1', 'f'); def('gammon ham', 'Me2 Sm2', 'l'); def('bacon', 'Sm3 Me2 R1', 'lf'); def('chorizo', 'Sm3 Sp2 Me1', 'lfh'); def('sausages', 'Me2 Sp1 Pi1', 'lf');
def('steak beef-roast diced-beef beef-mince beef-brisket cooked-beef burgers', 'Me3 R2 Um1', 'f');
def('lamb lamb-leg lamb-chops cooked-lamb', 'Me3 R2 Fu1 Pi1', 'f');
def('chicken-thigh chicken-breast chicken-drum chicken-wings whole-chicken turkey-breast turkey-mince cooked-chicken nuggets', 'Me2 R2 Cr1', 'f');
def('duck-breast', 'Me3 R2 Fr1 Cr1', 'f');
def('salmon smoked-salmon', 'Cr2 Fr1 Gr1 R1', 'f'); def('mackerel', 'Gr1 Fr1 Sm1', 'f'); def('white-fish frozen-fish fish-cakes', 'Gr1 Cr1', ''); def('prawns', 'Ca2 Sv1 Fr1', 's'); def('tuna', 'Me1 Um1', 'l');
def('anchovies', 'Um3 Fu1 Me1', 'l');
// veg-ish mains
def('eggs', 'Sv2 Cr2', 'f'); def('halloumi', 'Fu1 Cr1', 'l'); def('tofu', 'Gr1 Cr1', ''); def('chickpeas', 'Ea2 R1', ''); def('lentils', 'Ea2', ''); def('kidney-beans butter-beans', 'Ea1 Cr1', '');
// cheese & dairy
def('parmesan', 'Fu3 Fr2 Um3 R1', 'l'); def('cheddar', 'Fu2 Cr1 Um1', 'lf'); def('blue-cheese', 'Fu3 Ea1 Cr1', 'lf'); def('feta', 'Fu1 Cr1', 'la'); def('goats-cheese', 'Fu2 Cr1 Ea1', 'af'); def('mozzarella', 'Cr2', 'f');
def('cream double-cream butter cream-cheese creme-fraiche', 'Cr3', 'f'); def('yogurt sour-cream', 'Cr2', 'a'); def('coconut-milk', 'Cr3 Fr1', 'fs');
// fruit
def('strawberries', 'Fr3 Ca2 Gr1 Fl1 Fu1', 'sa'); def('raspberries', 'Fl3 Fr2 Ca1', 'sa'); def('blueberries berries', 'Fr2 Gr1 Fl1 Sp1', 'sa');
def('apple', 'Fr3 Gr2 Fl1', 'sa'); def('pears', 'Fr3 Gr1 Fl1', 's'); def('banana', 'Fr3 Sp1 Gr1', 's'); def('pineapple', 'Fr3 Ca2 Fu1', 'sa'); def('mango', 'Fr2 Pi2 Ci1 Cr1', 's');
def('orange', 'Ci3 Fr1 Fl1', 'sa'); def('lemon', 'Ci3 Pi1', 'a'); def('lime', 'Ci3 Pi1', 'a'); def('kiwi', 'Gr2 Fr2', 'a'); def('melon', 'Gr2 Fr2', 's'); def('grapes', 'Fr2 Fl1', 's');
def('pomegranate', 'Fr2', 'sa'); def('rhubarb', 'Gr2 Fr1', 'a'); def('dates', 'Ca3', 's'); def('plums tinned-fruit', 'Fr2 Ca1', 'sa'); def('avocado', 'Gr1 Cr2', 'f');
// veg
def('onion red-onion', 'Sv3 Ca1', 's'); def('garlic', 'Sv3', ''); def('spring-onion leek', 'Sv2 Gr1', ''); def('cabbage broccoli cauliflower', 'Sv2 Gr1 Ea1', 'b'); def('asparagus', 'Sv2 Gr1', '');
def('potato', 'Ea2 Sv1 R1', ''); def('sweet-potato butternut', 'Ca2 Ea1 Fl1', 's'); def('carrot', 'Fl2 Pi1 Ea1', 's'); def('parsnip', 'Ca1 Ea1 Sp1', 's'); def('beetroot', 'Ea3 Ca1', 's');
def('mushroom', 'Ea3 Um2 Sv1', ''); def('pepper', 'Ea2 Gr2 Fr1', 's'); def('tomato cherry-tomato chopped-tomatoes passata tomato-puree', 'Gr2 Ca2 Fr1 Um2', 'sa');
def('cucumber', 'Gr3', ''); def('peas', 'Gr2', 's'); def('sweetcorn', 'Sv1 Ca1', 's'); def('courgette green-beans', 'Gr2', ''); def('spinach kale', 'Ea1 Gr1', 'b'); def('aubergine', 'Ea1', 'b'); def('fennel', 'An3 Gr1', 's');
def('olives', 'Fr1 Gr1', 'lb'); def('capers', 'Sv1 Gr1', 'la'); def('kimchi', 'Sv2 Fr1 Fu1', 'ah'); def('chilli', 'Gr1', 'h'); def('jalapenos', 'Gr2', 'ha');
// herbs
def('basil', 'An2 Ci1 Sp1 Gr1 Fl1', ''); def('coriander', 'Gr2 Ci1', ''); def('mint', 'Pi2 Gr1', ''); def('rosemary dried-rosemary', 'Pi3 Sp1', ''); def('sage', 'Pi2 Ea1 Sp1', '');
def('thyme dried-thyme', 'Sp2 Pi1 Ea1', ''); def('dill', 'Gr2 An1 Ci1', ''); def('parsley', 'Gr3 Pi1', ''); def('tarragon', 'An3 Gr1', ''); def('lemongrass', 'Ci3', ''); def('ginger', 'Ci2 Sp1 Pi1', 'h');
// spices & cupboard
def('coffee', 'R3 Ca2 Sm1 Ea1', 'b'); def('cocoa dark-chocolate', 'R3 Ca2 Fl1 Fr1 Sm1', 'b'); def('chocolate', 'R2 Ca2 Cr2', 'sf'); def('vanilla', 'Sm2 Ca1 Fl1 Cr1', 's');
def('cinnamon', 'Sp3 Ca1', 's'); def('star-anise fennel-seeds', 'An3 Sp1', ''); def('cardamom', 'Pi2 Ci2 Fl1', ''); def('ground-coriander', 'Ci2 Fl2 Pi1', ''); def('cumin', 'Ea2 Sp1 Sm1', '');
def('paprika', 'Sm2 Ca1', ''); def('chipotle', 'Sm3 Fr1', 'h'); def('chilli-powder chilli-flakes cayenne', 'Sm1', 'h'); def('black-pepper', 'Pi2 Ci1 Sp1', 'h'); def('nutmeg', 'Sp3 Pi1', ''); def('curry-powder garam-masala', 'Sp2 Ea1 Ci1', 'h');
def('turmeric', 'Ea2', 'b'); def('five-spice', 'An2 Sp2', ''); def('honey', 'Ca2 Fl2 Fr1', 's'); def('syrup', 'Ca3 Sm1', 's'); def('sugar', 'Ca1', 's');
def('soy-sauce', 'Um3 R2 Ca1', 'l'); def('miso', 'Um3 R1 Fr1 Fu1', 'l'); def('fish-sauce', 'Um3 Fu2', 'l'); def('worcestershire', 'Um2 Sp1 Sv1', 'la'); def('mustard', 'Sv2', 'h');
def('tahini', 'R3', 'bf'); def('peanut-butter', 'R3 Cr1', 'f'); def('nuts', 'R2 Cr1', 'f'); def('sesame-oil', 'R3', 'f'); def('olive-oil', 'Gr2 Fr1', 'f');
def('vinegar', 'Fr1', 'a'); def('bbq-sauce', 'Sm2 Ca2', 'sa'); def('sweet-chilli', 'Ca1', 'sh'); def('sriracha hot-sauce', 'Sv1', 'ha'); def('curry-paste', 'Sp2 Ci1', 'h'); def('pesto', 'An1 Gr2 Fu1', 'f');

export const aroma = id => A[id] || null;
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
const usual = (a, b) => (CLASSIC[a] && CLASSIC[a].has(b)) || G.pairScore([a, b]) > 0 || Object.values(G.KITS).some(k => { const ids = [...k.core, ...k.extra].map(c => c[0]); return (ids.includes(a) && (ids.includes(b) || (k.mains || []).includes(b) || (k.vegPref || []).includes(b))) || (ids.includes(b) && ((k.mains || []).includes(a) || (k.vegPref || []).includes(a))); });
// taste contrast: what makes a combo balanced even when aromas don't overlap
const CONTRAST = { s: 'al', a: 'sf', f: 'a', b: 'sf', l: 'sa', h: 'sf' };
function contrast(a, b) { return Math.max(contrast1(a, b), contrast1(b, a)); }
function contrast1(a, b) { const ta = (A[a] || {}).t || '', tb = (A[b] || {}).t || ''; let n = 0; for (const c of ta) if ((CONTRAST[c] || '').split('').some(z => tb.includes(z))) n++; return Math.min(1, n * 0.5); }
const learnt = (state, a, b) => ((state.lab || {}).pairs || {})[[a, b].sort().join('|')] || 0;
// Partners for one ingredient, grouped: classic, surprising, wild
export function partners(state, id, opts = {}) {
  const out = [];
  for (const b of Object.keys(A)) {
    if (b === id || !ITEM[b] || !G.okItem(state, b)) continue;
    if (opts.vegOnly && CAT(b) === 'protein' && G.MAINS[b] && G.MAINS[b].grp !== 'veg') continue;
    const af = affinity(id, b), ct = contrast(id, b), us = usual(id, b), l = learnt(state, id, b);
    const cross = CAT(id) !== CAT(b) && ['fruit', 'sweet', 'dry'].some(c => [CAT(id), CAT(b)].includes(c)) && [CAT(id), CAT(b)].some(c => ['protein', 'cheese', 'veg', 'umami'].includes(c));
    const score = af.s + ct * 0.35 + l * 0.4;
    if (score < 0.35 && !us) continue;
    const kind = us ? 'classic' : cross && af.s >= 0.3 ? 'wild' : af.s >= 0.3 || ct >= 0.5 ? 'surprising' : null;
    if (!kind) continue;
    out.push({ id: b, kind, score: score + (us ? 0.2 : 0), why: whyPair(id, b, af, ct) });
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
  if (af.shared.length) bits.push(`both have ${af.shared.slice(0, 2).map(k => NOTES[k]).join(' and ')} notes`);
  if (ct >= 0.5) { const ta = ((A[a] || {}).t || '')[0], tb = ((A[b] || {}).t || '')[0]; if (ta && tb && ta === tb) {} else if (ta && tb) bits.push(`${TASTE_WORD[tb]} ${nm(b)} against ${TASTE_WORD[ta]} ${nm(a)}`); }
  return bits.join('; ') || 'they work as a contrast';
}
// How well a whole combo hangs together, and what it's missing
export function comboCheck(ids) {
  const links = []; let total = 0, pairs = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const af = affinity(ids[i], ids[j]), ct = contrast(ids[i], ids[j]); total += af.s + ct * 0.4; pairs++; if (af.s >= 0.25 || ct >= 0.5) links.push([ids[i], ids[j], whyPair(ids[i], ids[j], af, ct)]); }
  const tastes = new Set(ids.flatMap(id => ((A[id] || {}).t || '').split('').filter(Boolean)));
  const need = [];
  if ((tastes.has('f') || tastes.has('s')) && !tastes.has('a')) need.push(['a', 'something sharp (lemon, lime, vinegar, pickles)']);
  if (!tastes.has('l') && !ids.some(id => CAT(id) === 'umami' || CAT(id) === 'cheese')) need.push(['l', 'something salty (cheese, soy, miso, anchovies, or just salt)']);
  if (tastes.has('b') && !tastes.has('s') && !tastes.has('f')) need.push(['s', 'a touch of sweetness or richness to soften the bitterness']);
  if (!ids.some(id => ['nutty', 'herb'].includes(CAT(id)) || ['cucumber', 'pomegranate', 'apple', 'spring-onion', 'red-onion'].includes(id))) need.push(['c', 'crunch or freshness (nuts, herbs, raw onion, pomegranate)']);
  return { harmony: pairs ? Math.min(1, total / pairs) : 0, links, need };
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
  if (!hero) { const pool = [...stock.keys()].filter(id => A[id] && ok(id) && (['protein', 'veg'].includes(CAT(id)) || ['halloumi', 'goats-cheese', 'tofu'].includes(id)) && !(G.MAINS[id] && G.MAINS[id].joint)); const prot = pool.filter(id => CAT(id) === 'protein'); hero = pick(prot.length && Math.random() < 0.75 ? prot : pool.length ? pool : ['chicken-thigh']); }
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
