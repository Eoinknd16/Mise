// Mise process engine: a dish is a set of components (a filling, a sauce, a topping, sides), each made by a
// sequence of real techniques with times, heat and doneness cues. Components are scheduled together backwards
// from the moment you eat, so the method says what to do while something else simmers.
// This covers dishes that don't fit "main + method + sauce + carb": layered bakes, topped pies, curries built in
// stages, risotto, blended soups and full roast dinners.
import { ITEM } from './data.js';
import * as C from './core.js';
import * as G from './builder.js';
import * as RT from './ratios.js';

/* ---------------- amounts ---------------- */
function qty(id, pp, serves, unit) {
  const it = ITEM[id]; let q = pp * serves;
  if (unit === 'tsp' || unit === 'tbsp') return { q: Math.max(0.5, Math.round(q * 2) / 2), u: unit };
  if (it.u === 'pc' || unit === '') return { q: Math.max(id === 'garlic' ? 1 : 0.5, Math.round(q * 2) / 2), u: '' };
  const step = q > 300 ? 50 : q > 60 ? 10 : 5; return { q: Math.max(step, Math.round(q / step) * step), u: unit || it.u };
}
const nm = id => ITEM[id] ? ITEM[id].n.toLowerCase() : id;
const sg = n => String(n).replace(/(oes|ies)$/, m => m === 'ies' ? 'y' : 'o').replace(/([^s])s$/, '$1');
const list = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const tl = t => t >= 60 ? `${Math.floor(t / 60)} hr${t % 60 ? ' ' + (t % 60) + ' min' : ''}` : `${t} min`;

class Dish {
  constructor(state, serves) { this.state = state; this.serves = serves; this.ings = []; this.comps = []; this.ratios = []; }
  // add an ingredient; returns its display name for the step text
  use(id, pp, unit, name) {
    if (!ITEM[id]) return null; const { q, u } = qty(id, pp, this.serves, unit);
    const ex = this.ings.find(i => i.item === id && i.u === u);
    if (ex) ex.q = Math.round((ex.q + q) * 2) / 2; else this.ings.push({ q, u, name: name || nm(id), item: id, raw: '' });
    return name || nm(id);
  }
  // use a ratio scaled so its anchor totals `total` grams for the whole dish; returns display names by id
  ratio(key, total, swap = {}) { const am = RT.scale(key, total), out = {}; if (!am) return out; if (!this.ratios.includes(key)) this.ratios.push(key);
    for (const [id0, g] of Object.entries(am)) { if (id0 === 'water') { out.water = `${Math.round(g / 5) * 5} ml water`; continue; } const id = swap[id0] || id0; if (!ITEM[id]) continue;
      const pcw = { eggs: 55, banana: 120, lemon: 100 }[id]; if (pcw) out[id0] = this.use(id, Math.max(1, Math.round(g / pcw)) / this.serves, ''); else if (['baking-powder', 'bread-soda', 'yeast', 'salt'].includes(id) && g < 20) out[id0] = this.use(id, Math.max(0.25, Math.round(g / 4 * 4) / 4) / this.serves, 'tsp'); else out[id0] = this.use(id, g / this.serves); }
    return out; }
  has(id) { return C.pantryQty(this.state, id) > 0; }
  ok(id) { return ITEM[id] && G.okItem(this.state, id); }
  comp(name, ready = 'serve') { const c = { name, ready, tasks: [] }; this.comps.push(c); return c; }
}
// a task: text, minutes, how much of it is hands-on, and the cue that tells you it's done
const T = (c, text, t, o = {}) => { c.tasks.push({ text, t, hands: o.passive ? Math.min(2, t) : (o.hands != null ? o.hands : t), cue: o.cue || '', oven: o.oven || null, passive: !!o.passive, verb: o.verb || '' }); return c; };

/* ---------------- technique library (shared building blocks) ---------------- */
const TQ = {
  // soffritto / mirepoix / onion base
  sweat(d, c, ids, fat = 'olive-oil') { const f = d.use(fat, fat === 'butter' ? 10 : 8, 'ml' === ITEM[fat]?.u ? 'ml' : undefined); const v = ids.map(([id, pp]) => d.use(id, pp)).filter(Boolean);
    return T(c, `Soften the ${list(v)} in the ${f} over a medium-low heat with a pinch of salt, stirring now and then`, 10, { cue: 'soft and sweet but not browned' }); },
  brown(d, c, id, pp, how = 'mince') { const m = d.use(id, pp); d.use('oil', 5);
    return T(c, how === 'mince' ? `Brown the ${m} in a little oil over a high heat, breaking it up and leaving it alone long enough to colour` : `Brown the ${m} in batches in a hot pan with a little oil; don't crowd the pan`, 8, { cue: 'deep brown, not grey' }); },
  garlic(d, c, n = 2, extra) { const g = d.use('garlic', n / 2, ''); const e = extra ? extra.map(([id, pp, u]) => d.use(id, pp, u)).filter(Boolean) : [];
    return T(c, `Add the ${list([g + ', crushed', ...e])} and stir`, 2, { cue: 'fragrant, the raw smell gone' }); },
  puree(d, c) { const p = d.use('tomato-puree', 8, 'g'); return T(c, `Stir in the ${p} and cook it out`, 2, { cue: 'it darkens to brick red and smells sweet' }); },
  deglaze(d, c, liquid) { return T(c, `Pour in ${liquid} and scrape up every browned bit from the bottom of the pan`, 1); },
  simmer(d, c, t, lid = 'lid ajar', cue = 'thick and rich') { return T(c, `Simmer gently, ${lid}, stirring now and then`, t, { passive: true, cue, verb: 'simmers' }); },
  reduce(d, c, t = 8) { return T(c, 'Take the lid off and let it bubble down', t, { passive: true, cue: 'thick enough to hold a line when you drag a spoon through', verb: 'reduces' }); },
  // béchamel / cheese sauce by ratio: per person 12 g butter, 12 g flour, 125 ml milk
  roux(d, c, cheese, extra = 1) { if (!d.ratios.includes('bechamel')) d.ratios.push('bechamel'); const b = d.use('butter', 12 * extra), f = d.use('flour', 12 * extra), m = d.use('milk', 125 * extra); d.use('nutmeg', 0.1, 'tsp');
    T(c, `Melt the ${b} in a saucepan, stir in the ${f} and cook, stirring`, 2, { cue: 'a smooth paste that smells biscuity' });
    T(c, `Whisk in the ${m} a splash at a time, letting it thicken before the next splash, then simmer, stirring`, 6, { cue: 'it coats the back of a spoon' });
    return T(c, `Season with salt, pepper and a grating of nutmeg${cheese ? `, then stir in half the ${cheese}` : ''}`, 1); },
  mash(d, c, pp = 250, cheese) { const p = d.use('potato', pp), b = d.use('butter', 12), m = d.use('milk', 30);
    T(c, `Peel the ${p}, cut into even chunks and put in a pan of cold, well-salted water. Bring to the boil and simmer`, 18, { passive: true, cue: 'a knife slides in with no resistance', verb: 'boil' });
    return T(c, `Drain, leave to steam dry for 2 minutes, then mash with the ${b} and warm ${m}${cheese ? ` and a handful of ${cheese}` : ''}; season well`, 4, { cue: 'smooth, with no lumps' }); },
  rice(d, c, id = 'basmati') { if (!d.ok(id)) id = 'rice'; const r = d.use(id, 75);
    T(c, `Rinse the ${r} until the water runs clear, then put in a pan with 1½ times its volume of water and a pinch of salt. Bring to the boil, lid on, lowest heat`, 12, { passive: true, cue: 'the water has all gone and little holes dot the surface', verb: 'cooks' });
    return T(c, 'Turn off the heat and leave the lid on to steam', 5, { passive: true, cue: 'fluffy; fork through before serving', verb: 'steams' }); },
  bake(c, temp, t, cue, what = 'Bake') { return T(c, `${what} at ${temp}°C (${temp - 20}°C fan)`, t, { passive: true, oven: temp, cue, verb: /bake/i.test(what) ? 'bakes' : 'roasts' }); },
  rest(c, t, what) { return T(c, `Leave ${what} to rest before serving`, t, { passive: true, cue: 'it sets, so it cuts cleanly and doesn\'t scald', verb: 'rests' }); }
};

/* ---------------- dish families ---------------- */
// Each variant: mains it can use (first is the default), what it needs, and how to make it.
const PICK = (d, opts) => opts.find(id => d.has(id) && d.ok(id)) || opts.find(id => d.ok(id));
const pickHave = (d, opts, n = 1) => opts.filter(id => d.has(id) && d.ok(id)).slice(0, n);

const FAMILIES = {
  /* ---- layered bakes ---- */
  lasagne: { n: 'Lasagne', fam: 'bake', area: 'Italian', words: 'lasagne|lasagna', mains: ['beef-mince', 'pork-mince', 'turkey-mince', 'lentils', 'mushroom'], needs: ['lasagne', 'milk', 'flour', 'butter', 'chopped-tomatoes'], gear: ['oven', 'hob', 'dish'], slow: true,
    title: (d, m) => m === 'lentils' ? 'Lentil lasagne' : m === 'mushroom' ? 'Mushroom lasagne' : m === 'beef-mince' ? 'Lasagne' : `${ITEM[m].n.replace(/ mince$/i, '')} lasagne`,
    make(d, m) {
      const ragu = d.comp('ragù', 'final');
      if (/mince/.test(m)) TQ.brown(d, ragu, m, 125); else if (m === 'mushroom') TQ.brown(d, ragu, 'mushroom', 150, 'pieces');
      TQ.sweat(d, ragu, [['onion', 70], ['carrot', 50], ['celery', 30]].filter(([id]) => d.ok(id)));
      TQ.garlic(d, ragu, 2); TQ.puree(d, ragu);
      const wine = d.has('wine') ? d.use('wine', 40, 'ml') : null;
      TQ.deglaze(d, ragu, wine ? `the ${wine}` : 'a splash of water');
      const t = d.use('chopped-tomatoes', 130), s = d.use('stock', 0.25, ''); if (m === 'lentils') d.use('lentils', 60);
      T(ragu, `Add the ${t}${m === 'lentils' ? ', the lentils' : ''}, the ${s} dissolved in 100 ml water per person, a pinch of sugar and ${d.use('oregano', 0.25, 'tsp')}`, 1);
      TQ.simmer(d, ragu, m === 'lentils' ? 30 : 40); TQ.reduce(d, ragu);
      const bech = d.comp('béchamel', 'final'); const ch = PICK(d, ['parmesan', 'cheddar', 'mozzarella']); if (ch) d.use(ch, 25);
      TQ.roux(d, bech, ch ? nm(ch) : null);
      const fin = d.comp('lasagne', 'serve'); const sh = d.use('lasagne', 3, '', 'lasagne sheets');
      T(fin, `In an ovenproof dish, layer ragù, ${sh} and béchamel, three times over, finishing with béchamel. Scatter over the rest of the ${ch ? nm(ch) : 'cheese'}`, 8);
      TQ.bake(fin, 190, 40, 'bubbling at the edges and golden on top'); TQ.rest(fin, 10, 'the lasagne');
      return fin;
    } },
  moussaka: { n: 'Moussaka', fam: 'bake', area: 'Greek', words: 'moussaka', mains: ['lamb-mince', 'beef-mince', 'lentils'], needs: ['aubergine', 'milk', 'flour', 'butter', 'chopped-tomatoes'], gear: ['oven', 'hob', 'dish'], slow: true,
    title: (d, m) => m === 'lentils' ? 'Lentil moussaka' : m === 'beef-mince' ? 'Beef moussaka' : 'Moussaka',
    make(d, m) {
      const aub = d.comp('aubergines', 'final'); const a = d.use('aubergine', 0.5, ''); d.use('olive-oil', 15);
      T(aub, `Slice the ${a} into 1 cm rounds, brush both sides with olive oil, season and roast in a single layer at 200°C (180°C fan)`, 25, { passive: true, oven: 200, cue: 'soft and golden; they shrink a lot', verb: 'roast' });
      const ragu = d.comp('meat sauce', 'final');
      if (/mince/.test(m)) TQ.brown(d, ragu, m, 125);
      TQ.sweat(d, ragu, [['onion', 80]]); TQ.garlic(d, ragu, 2, [['cinnamon', 0.25, 'tsp'], ['oregano', 0.5, 'tsp']]); TQ.puree(d, ragu);
      const t = d.use('chopped-tomatoes', 120); if (m === 'lentils') d.use('lentils', 60);
      T(ragu, `Add the ${t}${m === 'lentils' ? ' and lentils with 150 ml water per person' : ' and a splash of water'}`, 1); TQ.simmer(d, ragu, 30, 'lid off', 'thick, not watery');
      const bech = d.comp('topping', 'final'); const ch = PICK(d, ['parmesan', 'feta', 'cheddar']); if (ch) d.use(ch, 25); TQ.roux(d, bech, ch ? nm(ch) : null);
      if (d.ok('eggs')) T(bech, `Off the heat, beat in an ${sg(d.use('eggs', 0.5, ''))} so the topping sets like a custard`, 1);
      const fin = d.comp('moussaka', 'serve');
      T(fin, 'Layer half the aubergines in a dish, then the meat sauce, then the rest of the aubergines. Pour over the topping and finish with the remaining cheese', 6);
      TQ.bake(fin, 180, 40, 'puffed and deep golden'); TQ.rest(fin, 15, 'the moussaka');
      return fin;
    } },
  enchiladas: { n: 'Enchiladas', fam: 'bake', area: 'Mexican', words: 'enchilada|enchiladas', mains: ['chicken-thigh', 'cooked-chicken', 'beef-mince', 'kidney-beans', 'chicken-breast'], needs: ['wraps', 'passata', 'cheddar', 'cumin'], gear: ['oven', 'hob', 'dish'],
    title: (d, m) => `${{ 'chicken-thigh': 'Chicken', 'chicken-breast': 'Chicken', 'cooked-chicken': 'Chicken', 'beef-mince': 'Beef', 'kidney-beans': 'Bean' }[m]} enchiladas`,
    make(d, m) {
      const sauce = d.comp('red sauce', 'final'); const pa = d.use('passata', 100), cu = d.use('cumin', 0.25, 'tsp'), chp = d.use('chilli-powder', 0.25, 'tsp');
      T(sauce, `Fry ${d.use('garlic', 0.5, '')}, crushed, in a little oil for 30 seconds, add the ${cu}, ${chp} and a pinch of oregano for 30 seconds more, then the ${pa} and a splash of water`, 2, { cue: 'the spices smell toasted, not burnt' });
      TQ.simmer(d, sauce, 10, 'lid off', 'slightly thickened; season it well');
      const fill = d.comp('filling', 'final');
      if (m === 'beef-mince') TQ.brown(d, fill, m, 110);
      else if (m === 'chicken-thigh' || m === 'chicken-breast') { const c = d.use(m, 130); T(fill, `Slice the ${c} into strips and fry in a little oil over a high heat`, 7, { cue: 'golden and cooked through' }); }
      else if (m === 'cooked-chicken') { const c = d.use(m, 100); T(fill, `Shred the ${c}`, 3); }
      else { const b = d.use('kidney-beans', 0.4, ''); T(fill, `Drain and rinse the ${b}, then roughly crush half of them`, 3); }
      const v = pickHave(d, ['pepper', 'onion', 'sweetcorn', 'spinach'], 2).map(id => d.use(id, id === 'spinach' ? 30 : 0.5, id === 'spinach' ? undefined : ''));
      T(fill, `Add ${v.length ? `the ${list(v)} (sliced) and ` : ''}a ladle of the red sauce, ${d.use('paprika', 0.25, 'tsp')} and a pinch of salt; cook together`, 5, { cue: 'saucy but not wet' });
      const fin = d.comp('enchiladas', 'serve'); const w = d.use('wraps', 1.5, '', 'tortilla wraps'), ch = d.use('cheddar', 40);
      T(fin, `Spoon the filling along each of the ${w}, roll up tightly and pack seam-side down into a dish. Pour over the rest of the sauce and scatter with the ${ch}, grated`, 6);
      TQ.bake(fin, 200, 20, 'the cheese is melted and spotted brown');
      if (d.ok('yogurt') || d.ok('sour-cream')) T(fin, `Serve with spoonfuls of ${d.use(d.ok('sour-cream') ? 'sour-cream' : 'yogurt', 30)}${d.has('coriander') ? ' and torn ' + d.use('coriander', 3) : ''}`, 1);
      return fin;
    } },
  /* ---- topped pies ---- */
  cottagepie: { n: 'Cottage pie', fam: 'pie', area: 'Irish', words: 'cottage pie|shepherds pie|shepherd s pie|shepherd pie|shepherdess pie', mains: ['beef-mince', 'lamb-mince', 'lentils', 'turkey-mince'], needs: ['potato', 'stock', 'onion', 'carrot'], gear: ['oven', 'hob', 'dish'],
    title: (d, m) => m === 'lamb-mince' ? "Shepherd's pie" : m === 'lentils' ? 'Lentil shepherdess pie' : m === 'turkey-mince' ? 'Turkey cottage pie' : 'Cottage pie',
    make(d, m) {
      const fill = d.comp('filling', 'final');
      if (/mince/.test(m)) TQ.brown(d, fill, m, 130);
      TQ.sweat(d, fill, [['onion', 70], ['carrot', 60]].concat(d.has('celery') ? [['celery', 30]] : []));
      TQ.puree(d, fill);
      T(fill, `Sprinkle over ${d.use('flour', 5)} and stir for a minute`, 1, { cue: 'no dry flour left' });
      const s = d.use('stock', 0.25, ''), w = d.ok('worcestershire') ? d.use('worcestershire', 5, 'ml') : null; if (m === 'lentils') d.use('lentils', 70);
      T(fill, `Add the ${s} dissolved in 150 ml hot water per person${m === 'lentils' ? ', the lentils' : ''}${w ? `, a good splash of ${w}` : ''} and a few sprigs of ${d.use('thyme', 1)}`, 1);
      TQ.simmer(d, fill, m === 'lentils' ? 30 : 25, 'lid off', 'thick and glossy, like a good gravy');
      if (d.ok('peas')) T(fill, `Stir in ${d.use('peas', 40)}`, 1);
      const top = d.comp('potatoes', 'final'); const ch = PICK(d, ['cheddar']); TQ.mash(d, top, 250);
      const fin = d.comp('pie', 'serve');
      T(fin, `Spoon the filling into an ovenproof dish, let it cool for a few minutes so the mash sits on top, then spread over the mash and rough it up with a fork${ch ? `. Scatter with ${d.use(ch, 20)}` : ''}`, 5);
      TQ.bake(fin, 200, 25, 'golden ridges and bubbling at the edges'); TQ.rest(fin, 5, 'the pie');
      return fin;
    } },
  fishpie: { n: 'Fish pie', fam: 'pie', area: 'British', words: 'fish pie', mains: ['white-fish', 'salmon', 'prawns'], needs: ['potato', 'milk', 'flour', 'butter'], gear: ['oven', 'hob', 'dish'],
    title: () => 'Fish pie',
    make(d, m) {
      const fish = ['white-fish', 'salmon', 'prawns'].filter(id => id === m || (d.has(id) && d.ok(id))).slice(0, 3);
      const sauce = d.comp('fish & sauce', 'final'); const milk = d.use('milk', 150), bay = d.ok('bay-leaves') ? d.use('bay-leaves', 0.5, '') : null;
      const poach = fish.filter(id => id !== 'prawns').map(id => d.use(id, 120 / Math.max(1, fish.length - (fish.includes('prawns') ? 1 : 0)) * (fish.length > 1 ? 0.8 : 1)));
      if (poach.length) T(sauce, `Put the ${list(poach)} in a wide pan with the ${milk}${bay ? ` and ${bay}` : ''}, bring just to a simmer, then turn off the heat and leave`, 8, { passive: true, cue: 'the fish turns opaque and flakes', verb: 'poaches' });
      T(sauce, 'Lift out the fish, flake it into large pieces into a dish and keep the milk', 3);
      const b = d.use('butter', 15), f = d.use('flour', 15);
      T(sauce, `Melt the ${b}, stir in the ${f} for a minute, then whisk in the poaching milk a splash at a time and simmer`, 6, { cue: 'thick enough to coat the fish' });
      const extra = [fish.includes('prawns') ? d.use('prawns', 50) : null, d.ok('peas') ? d.use('peas', 30) : null, d.has('spinach') ? d.use('spinach', 30) : null].filter(Boolean);
      T(sauce, `Season with salt, pepper${d.ok('lemon') ? ', the zest of ' + sg(d.use('lemon', 0.25, '')) : ''}${d.ok('parsley') ? ' and chopped ' + d.use('parsley', 3) : ''}, then pour over the fish${extra.length ? ` with the ${list(extra)}` : ''}`, 2);
      const top = d.comp('potatoes', 'final'); const ch = PICK(d, ['cheddar', 'parmesan']); TQ.mash(d, top, 230, ch ? nm(ch) : null); if (ch) d.use(ch, 20);
      const fin = d.comp('pie', 'serve');
      T(fin, 'Spread the mash over the fish, starting at the edges so the sauce stays in, and rough the top with a fork', 4);
      TQ.bake(fin, 200, 30, 'golden on top and bubbling up at the sides'); TQ.rest(fin, 5, 'the pie');
      return fin;
    } },
  chickenpie: { n: 'Chicken & mushroom pie', fam: 'pie', area: 'British', words: 'chicken pie|chicken and mushroom pie|chicken & mushroom pie|chicken leek pie|pie', mains: ['chicken-thigh', 'chicken-breast', 'cooked-chicken', 'turkey-breast'], needs: ['puff-pastry', 'stock', 'flour'], gear: ['oven', 'hob', 'dish'],
    title: (d, m, x) => x.bacon ? `Chicken, ${x.leek ? 'leek' : 'mushroom'} & bacon pie` : `Chicken & ${x.leek ? 'leek' : 'mushroom'} pie`,
    make(d, m, x) {
      const fill = d.comp('filling', 'final');
      if (x.bacon) { const ba = d.use('bacon', 30); T(fill, `Fry the ${ba}, chopped, until crisp`, 5, { cue: 'the fat has run and it\'s golden' }); }
      if (m !== 'cooked-chicken') { const c = d.use(m, 140); T(fill, `Cut the ${c} into bite-size pieces, season and brown in a little oil`, 7, { cue: 'golden on the outside (it finishes in the oven)' }); } else d.use(m, 120);
      const v = x.leek ? d.use('leek', 0.5, '') : d.use('mushroom', 80);
      T(fill, `Add a knob of ${d.use('butter', 10)} and the ${v}, sliced, and cook`, 6, { cue: x.leek ? 'soft and silky' : 'golden and any liquid gone' });
      T(fill, `Stir in ${d.use('flour', 10)}, then gradually add ${d.use('stock', 0.25, '')} made up with 150 ml hot water per person${d.ok('cream') ? ' and a splash of ' + d.use('cream', 30) : ''}, and a few sprigs of ${d.use('thyme', 1)}`, 3);
      TQ.simmer(d, fill, 10, 'lid off', 'thick enough to coat the chicken; season well');
      T(fill, 'Tip into a pie dish and let it cool', 10, { passive: true, cue: 'warm, not hot, so the pastry stays crisp', verb: 'cools' });
      const fin = d.comp('pie', 'serve'); const p = d.use('puff-pastry', 0.25, '');
      T(fin, `Lay the ${p} over the dish, press the edges onto the rim, trim and cut a small slit in the middle${d.ok('eggs') ? '. Brush with beaten ' + sg(d.use('eggs', 0.25, '')) : ''}`, 5);
      TQ.bake(fin, 200, 25, 'puffed, crisp and deep golden'); TQ.rest(fin, 5, 'the pie');
      return fin;
    } },
  /* ---- curries built in stages ---- */
  indian: { n: 'Curry', fam: 'curry', area: 'Indian', words: 'curry|tikka masala|tikka|korma|rogan josh|madras|chana masala|chana|balti|jalfrezi|bhuna', mains: ['chicken-thigh', 'chicken-breast', 'lamb', 'beef-brisket', 'chickpeas', 'halloumi', 'prawns', 'cauliflower'], needs: ['onion', 'garlic', 'ginger'], gear: ['hob', 'pot'],
    styles: {
      tikka: { n: 'tikka masala', words: 'tikka', spices: [['garam-masala', 0.5], ['cumin', 0.25], ['ground-coriander', 0.25], ['paprika', 0.5], ['chilli-powder', 0.15]], tom: 'passata', finish: 'cream', mains: 'chicken-thigh chicken-breast halloumi chickpeas prawns', spice: 1 },
      korma: { n: 'korma', words: 'korma', spices: [['garam-masala', 0.5], ['turmeric', 0.25], ['cinnamon', 0.15]], tom: null, finish: 'cream', nuts: true, mains: 'chicken-thigh chicken-breast chickpeas cauliflower prawns', spice: 0 },
      rogan: { n: 'rogan josh', words: 'rogan josh|rogan', spices: [['paprika', 1], ['garam-masala', 0.5], ['cumin', 0.25], ['cinnamon', 0.15], ['chilli-powder', 0.25]], tom: 'chopped-tomatoes', finish: 'yogurt', mains: 'lamb beef-brisket chicken-thigh', spice: 2 },
      madras: { n: 'madras', words: 'madras', spices: [['chilli-powder', 0.5], ['cumin', 0.5], ['ground-coriander', 0.5], ['turmeric', 0.25], ['garam-masala', 0.25]], tom: 'chopped-tomatoes', finish: 'lemon', mains: 'beef-brisket lamb chicken-thigh chickpeas', spice: 3 },
      chana: { n: 'chana masala', words: 'chana', spices: [['cumin', 0.5], ['ground-coriander', 0.5], ['garam-masala', 0.5], ['turmeric', 0.25], ['chilli-powder', 0.25]], tom: 'chopped-tomatoes', finish: 'lemon', mains: 'chickpeas', spice: 1 } },
    title: (d, m, x) => { const s = FAMILIES.indian.styles[x.style], w = { 'chicken-thigh': 'Chicken', 'chicken-breast': 'Chicken', lamb: 'Lamb', 'beef-brisket': 'Beef', chickpeas: 'Chickpea', halloumi: 'Halloumi', prawns: 'Prawn', cauliflower: 'Cauliflower' }[m];
      return x.style === 'chana' ? 'Chana masala' : `${w} ${s.n}`; },
    make(d, m, x) {
      const S = FAMILIES.indian.styles[x.style], cu = d.comp('curry', 'serve'), slow = { lamb: 75, 'beef-brisket': 90 }[m];
      if (!x.quick && d.ok('yogurt') && /chicken|lamb|halloumi/.test(m) && x.style !== 'korma') { const y = d.use('yogurt', 30), mm = d.use(m, m === 'halloumi' ? 110 : 150);
        T(cu, `Cut the ${mm} into chunks and coat in the ${y} with half the spices and a pinch of salt`, 4); T(cu, 'Leave to marinate (longer is better, overnight is best)', 20, { passive: true, cue: '~the yogurt tenderises the meat', verb: 'marinates' }); }
      else d.use(m, m === 'chickpeas' ? 0.5 : m === 'cauliflower' ? 0.3 : 150, m === 'chickpeas' || m === 'cauliflower' ? '' : undefined);
      const o = d.use('onion', 0.75, ''); d.use('oil', 10);
      T(cu, `Fry the ${o}, finely chopped, in oil over a medium heat, stirring often`, 15, { cue: 'deep golden and jammy; this is where the flavour comes from, so don\'t rush it' });
      T(cu, `Add ${d.use('garlic', 1, '')} and ${d.use('ginger', 5)}, both grated, and fry`, 2, { cue: 'the raw smell has gone' });
      const sp = S.spices.filter(([id]) => d.ok(id)).map(([id, pp]) => d.use(id, pp, 'tsp'));
      T(cu, `Add the ${list(sp)} and stir constantly`, 1, { cue: 'fragrant and a shade darker; add a splash of water if they start to catch' });
      if (S.tom) { const t = d.use(S.tom, S.tom === 'passata' ? 90 : 100); T(cu, `Add the ${t} and cook down, stirring`, 8, { cue: 'thick, and the oil starts to separate at the edges' }); }
      if (m === 'lamb' || m === 'beef-brisket') T(cu, `Add the ${nm(m)} and turn it in the masala`, 4, { cue: 'coated and sealed on all sides' });
      else if (/chicken|halloumi|prawns/.test(m)) T(cu, `Add the ${nm(m)}${m === 'halloumi' ? ' (fried golden first in a separate pan)' : ''} and stir to coat`, 3);
      else T(cu, `Add the ${nm(m)}${m === 'chickpeas' ? ', drained' : ', in small florets'}`, 1);
      if (S.nuts && d.ok('nuts')) d.use('nuts', 10);
      const liq = x.style === 'korma' && d.ok('coconut-milk') ? `the ${d.use('coconut-milk', 100)}` : `${slow ? 200 : 120} ml water per person`;
      T(cu, `Pour in ${liq}${S.nuts && d.ok('nuts') ? ` and the ${nm('nuts')}, ground or finely chopped` : ''} and bring to a simmer`, 1);
      TQ.simmer(d, cu, slow || (m === 'prawns' ? 5 : m === 'chickpeas' ? 15 : m === 'cauliflower' ? 15 : 20), slow ? 'lid on' : 'lid off', slow ? 'the meat is tender enough to break with a spoon' : m === 'prawns' ? 'the prawns are pink' : 'the sauce is thick and the chicken cooked through');
      const fin = S.finish === 'cream' && d.ok('cream') ? `a splash of ${d.use('cream', 30)}` : S.finish === 'yogurt' && d.ok('yogurt') ? `spoonfuls of ${d.use('yogurt', 25)}, one at a time off the heat so it doesn't split` : S.finish === 'lemon' && d.ok('lemon') ? `a squeeze of ${sg(d.use('lemon', 0.25, ''))}` : null;
      T(cu, `Finish with ${d.ok('garam-masala') ? 'a pinch more garam masala' : 'a pinch of salt'}${fin ? ' and ' + fin : ''}${d.ok('coriander') ? ', then scatter with chopped ' + d.use('coriander', 4) : ''}. Taste and add salt until the flavours pop`, 2);
      const r = d.comp('rice', 'serve'); TQ.rice(d, r);
      if (d.has('naan') && d.ok('naan')) { const n = d.comp('naan', 'serve'); T(n, `Warm the ${d.use('naan', 0.5, '')} in the oven or a dry pan`, 4); }
      return cu;
    } },
  thai: { n: 'Thai curry', fam: 'curry', area: 'Thai', words: 'thai curry|green curry|red curry|thai green|thai red|massaman', mains: ['chicken-thigh', 'chicken-breast', 'prawns', 'tofu', 'white-fish', 'beef-brisket'], needs: ['curry-paste', 'coconut-milk'], gear: ['hob', 'pot'],
    title: (d, m) => `Thai ${{ 'chicken-thigh': 'chicken', 'chicken-breast': 'chicken', prawns: 'prawn', tofu: 'tofu', 'white-fish': 'fish', 'beef-brisket': 'beef' }[m]} curry`,
    make(d, m) {
      const cu = d.comp('curry', 'serve'); const cm = d.use('coconut-milk', 130), cp = d.use('curry-paste', 15, 'g');
      T(cu, `Spoon the thick cream off the top of the ${cm} into a wok or wide pan and bubble it over a medium-high heat`, 3, { cue: 'it splits and you see little pools of oil' });
      T(cu, `Fry the ${cp} in the coconut cream, stirring`, 2, { cue: 'very fragrant and a shade darker; this is the step most recipes skip' });
      const mm = d.use(m, m === 'tofu' ? 120 : 140); T(cu, `Add the ${mm}${m === 'tofu' ? ', cubed and pressed dry' : ', sliced'} and turn it in the paste`, 3);
      const v = pickHave(d, ['pepper', 'green-beans', 'sugar-snap', 'broccoli', 'courgette', 'spinach', 'tenderstem'], 2).map(id => d.use(id, id === 'spinach' ? 30 : 60));
      T(cu, `Pour in the rest of the coconut milk with a splash of ${d.ok('fish-sauce') ? d.use('fish-sauce', 5, 'ml') : d.use('soy-sauce', 5, 'ml')} and a pinch of sugar${v.length ? `, then add the ${list(v)}` : ''}`, 1);
      TQ.simmer(d, cu, m === 'prawns' || m === 'white-fish' ? 5 : 10, 'lid off', m === 'prawns' ? 'the prawns are pink' : 'cooked through, veg still bright');
      T(cu, `Finish with ${d.ok('lime') ? 'a squeeze of ' + sg(d.use('lime', 0.25, '')) : 'a squeeze of lemon'}${d.ok('coriander') || d.ok('basil') ? ' and torn ' + d.use(d.ok('basil') ? 'basil' : 'coriander', 3) : ''}. Taste: it should be salty, hot, sour and a little sweet`, 1);
      const r = d.comp('rice', 'serve'); TQ.rice(d, r, 'rice');
      return cu;
    } },
  /* ---- risotto ---- */
  risotto: { n: 'Risotto', fam: 'risotto', area: 'Italian', words: 'risotto', mains: ['mushroom', 'bacon', 'chicken-thigh', 'butternut', 'peas', 'prawns', 'leek'], needs: ['risotto-rice', 'stock', 'onion'], gear: ['hob', 'pot'],
    title: (d, m) => ({ mushroom: 'Mushroom risotto', bacon: 'Pea & bacon risotto', 'chicken-thigh': 'Chicken & lemon risotto', butternut: 'Roast squash & sage risotto', peas: 'Pea & parmesan risotto', prawns: 'Prawn & lemon risotto', leek: 'Leek & thyme risotto' })[m],
    make(d, m) {
      const fin = d.comp('risotto', 'serve');
      if (m === 'butternut') { const sq = d.comp('squash', 'serve'); const b = d.use('butternut', 0.2, ''); T(sq, `Peel and cube the ${b}, toss in oil and roast at 200°C (180°C fan)`, 30, { passive: true, oven: 200, cue: 'soft and caramelised at the edges', verb: 'roasts' }); }
      const st = d.use('stock', 0.35, ''); T(fin, `Dissolve the ${st} in 300 ml just-boiled water per person and keep it hot on a low heat`, 2);
      if (m === 'mushroom') T(fin, `Fry the ${d.use('mushroom', 120)}, sliced, in a hot pan with a little butter until golden, then set aside`, 7, { cue: 'browned and squeaky, not wet' });
      if (m === 'bacon') T(fin, `Fry the ${d.use('bacon', 35)}, chopped, until crisp, then set aside`, 5);
      if (m === 'chicken-thigh') T(fin, `Season and fry the ${d.use('chicken-thigh', 110)}, diced, until golden and cooked through, then set aside`, 8);
      const o = d.use('onion', 0.4, ''), b = d.use('butter', 10);
      T(fin, `Soften the ${o}, finely chopped${m === 'leek' ? ', and ' + d.use('leek', 0.5, '') + ', sliced,' : ''} in the ${b}`, 6, { cue: 'soft and translucent' });
      const r = d.use('risotto-rice', 80); T(fin, `Add the ${r} and stir to toast it`, 2, { cue: 'the edges of the grains go see-through' });
      if (d.has('wine')) T(fin, `Pour in a splash of ${d.use('wine', 30, 'ml')} and let it bubble away`, 1);
      T(fin, 'Add the hot stock a ladle at a time, stirring often and waiting until each is almost absorbed before the next', 18, { cue: 'the rice is tender with a slight bite and the risotto flows like lava when you shake the pan' });
      if (m === 'peas' || m === 'bacon') d.use('peas', 50);
      if (m === 'prawns') T(fin, `Stir in the ${d.use('prawns', 80)} for the last 3 minutes`, 1);
      const ch = d.ok('parmesan') ? d.use('parmesan', 20) : d.ok('cheddar') ? d.use('cheddar', 20) : null;
      T(fin, `Off the heat, beat in a knob of butter${ch ? ` and the ${ch}, grated` : ''}${m === 'mushroom' || m === 'bacon' || m === 'chicken-thigh' ? `, then fold back in the ${nm(m)}` : ''}${m === 'peas' || m === 'bacon' ? ' and the peas' : ''}${m === 'butternut' ? ' and the squash' : ''}${(m === 'chicken-thigh' || m === 'prawns') && d.ok('lemon') ? ' and the zest of a ' + sg(d.use('lemon', 0.25, '')) : ''}. Lid on`, 2, { cue: '~rest it for 2 minutes and it turns glossy and creamy' });
      return fin;
    } },
  /* ---- blended soups ---- */
  soup: { n: 'Soup', fam: 'soup', area: 'Irish', words: 'soup', mains: ['butternut', 'carrot', 'leek', 'tomato', 'broccoli', 'mushroom', 'peas', 'lentils', 'sweet-potato', 'parsnip', 'cauliflower'], needs: ['onion', 'stock'], gear: ['hob', 'pot'],
    title: (d, m) => ({ butternut: 'Roast squash soup', carrot: 'Carrot & coriander soup', leek: 'Leek & potato soup', tomato: 'Roast tomato soup', broccoli: 'Broccoli & cheddar soup', mushroom: 'Mushroom soup', peas: 'Pea & mint soup', lentils: 'Spiced lentil soup', 'sweet-potato': 'Sweet potato & chilli soup', parsnip: 'Curried parsnip soup', cauliflower: 'Cauliflower cheese soup' })[m],
    make(d, m) {
      const so = d.comp('soup', 'serve'); const roast = m === 'butternut' || m === 'tomato';
      const amt = { butternut: [0.25, ''], carrot: [180], leek: [1, ''], tomato: [250], broccoli: [150], mushroom: [180], peas: [120], lentils: [60], 'sweet-potato': [200], parsnip: [180], cauliflower: [0.3, ''] }[m];
      const v = d.use(m, amt[0], amt[1]);
      if (roast) T(so, `Roast the ${v}, chopped, with a drizzle of oil and salt at 200°C (180°C fan)`, 30, { passive: true, oven: 200, cue: 'soft and caramelised at the edges; that\'s the flavour', verb: 'roasts' });
      const fat = d.use('butter', 10), o = d.use('onion', 0.5, '');
      T(so, `Soften the ${o}${m === 'leek' ? ' and ' + v : ''} in the ${fat} with a pinch of salt`, 8, { cue: 'soft and sweet, not coloured' });
      if (m === 'lentils' || m === 'parsnip' || m === 'sweet-potato') T(so, `Add ${d.use('garlic', 0.5, '')}, crushed, and ${d.use(m === 'lentils' ? 'cumin' : 'curry-powder', 0.5, 'tsp')} for a minute`, 1);
      const body = m === 'leek' || m === 'broccoli' || m === 'cauliflower' || m === 'mushroom' ? d.use('potato', 80) : null;
      const adds = [m === 'leek' ? null : roast ? `the roasted ${v}` : `the ${v}, chopped`, body ? `the ${body}, diced` : null].filter(Boolean);
      T(so, `Add ${adds.length ? list(adds) + ', and ' : ''}the ${d.use('stock', 0.35, '')} made up with 300 ml hot water per person`, 2);
      TQ.simmer(d, so, m === 'lentils' ? 25 : m === 'peas' ? 6 : 20, 'lid on', 'everything is completely soft');
      const fin = m === 'broccoli' || m === 'cauliflower' ? `stir in ${d.use('cheddar', 25)}, grated, until melted` : m === 'peas' && d.ok('mint') ? `add a handful of ${d.use('mint', 3)} leaves` : m === 'carrot' && d.ok('coriander') ? `add a handful of ${d.use('coriander', 4)}` : null;
      T(so, `Blend until completely smooth (a stick blender is easiest; or mash for a rustic soup)${fin ? ', then ' + fin : ''}. Loosen with a splash of water if it's thick and season well`, 3, { cue: 'silky and pourable' });
      if (d.ok('cream')) T(so, `Serve with a swirl of ${d.use('cream', 15)}${d.ok('bread') ? ' and buttered ' + d.use('bread', 1.5, '', 'slices of bread') : ''}`, 1);
      else if (d.ok('bread')) T(so, `Serve with ${d.use('bread', 1.5, '', 'slices of bread')}`, 1);
      return so;
    } },
  /* ---- roast dinners: the joint, potatoes, veg, gravy and the right extra, all timed to land together ---- */
  roastdinner: { n: 'Roast dinner', fam: 'roast', area: 'Irish', words: 'roast dinner|sunday roast|sunday dinner|roast', mains: ['pork-roast', 'beef-roast', 'lamb-leg', 'whole-chicken', 'gammon'], needs: ['potato'], gear: ['oven', 'hob', 'tin'], slow: true,
    title: (d, m) => ({ 'pork-roast': 'Roast pork dinner with crackling & apple sauce', 'beef-roast': 'Roast beef dinner with Yorkshire puddings', 'lamb-leg': 'Roast lamb dinner with rosemary & garlic', 'whole-chicken': 'Roast chicken dinner with lemon & thyme', gammon: 'Honey-glazed gammon dinner' })[m],
    make(d, m) {
      const J = (G.MAINS[m] && G.MAINS[m].joint) || { temp: 180, per500: 25, extra: 25 };
      const have = C.pantryQty(d.state, m), wt = m === 'whole-chicken' ? 1600 : Math.max(800, Math.min(3000, have > 200 ? have : 1200));
      const roastT = m === 'gammon' ? 0 : Math.round((wt / 500) * (J.per500 || 25) + (J.extra || 20)), rest = m === 'whole-chicken' ? 15 : 25;
      d.ings.push({ q: Math.round(wt), u: 'g', name: nm(m), item: m, raw: '', whole: true, portion: Math.round(wt / Math.max(d.serves, 1)) });
      if (G.MAINS[m] && G.MAINS[m].leftover) { const left = Math.round(wt * 0.65 - d.serves * 180); if (left > 150) d.leftover = { item: G.MAINS[m].leftover, g: left }; }
      const jt = d.comp(m === 'gammon' ? 'gammon' : m === 'whole-chicken' ? 'chicken' : 'joint', 'serve');
      if (m === 'pork-roast') { T(jt, 'Pat the skin bone dry, score it in thin lines (a Stanley knife is best) and rub in plenty of salt', 5, { cue: '~dry skin is the secret to crackling' });
        TQ.bake(jt, 220, 25, 'the skin starts to bubble', 'Roast'); TQ.bake(jt, 170, Math.max(30, roastT - 25), 'the juices run clear and it reads 70°C in the middle', 'Turn the oven down and roast'); }
      else if (m === 'beef-roast') { T(jt, `Season the ${nm(m)} all over and sear in a hot pan with a little oil`, 6, { cue: 'brown all over; colour is flavour' });
        TQ.bake(jt, 190, roastT, '52°C in the middle for rare, 58°C for medium', 'Roast'); }
      else if (m === 'lamb-leg') { T(jt, `Make small cuts all over the ${nm(m)} and push in slivers of ${d.use('garlic', 0.5, '')} and sprigs of ${d.use('rosemary', 1)}. Rub with oil, salt and pepper`, 6);
        TQ.bake(jt, 190, roastT, '60°C in the middle for pink, 65°C for medium', 'Roast'); }
      else if (m === 'whole-chicken') { T(jt, `Rub the chicken with soft ${d.use('butter', 10)}, salt and pepper; push half a ${sg(d.use('lemon', 0.25, ''))} and a few sprigs of ${d.use('thyme', 1)} inside`, 5);
        TQ.bake(jt, 200, roastT, 'the juices run clear when you pierce the thickest part of the thigh, 75°C', 'Roast'); }
      else { T(jt, `Put the ${nm(m)} in a large pot, cover with cold water, bring to the boil and simmer`, Math.round(wt / 500 * 20 + 10), { passive: true, cue: '~about 20 minutes per 500 g, until tender', verb: 'simmers' });
        T(jt, `Lift out, cut off the skin leaving a thin layer of fat, score it in diamonds and spread with ${d.use('honey', 10)} mixed with ${d.use('mustard', 5)}`, 6);
        TQ.bake(jt, 200, 25, 'glossy, sticky and caramelised', 'Roast'); }
      T(jt, 'Lift onto a board, cover loosely with foil and rest. Keep the roasting tin and its juices for the gravy', rest, { passive: true, cue: 'the juices settle back into the meat', verb: 'rests' });
      // roast potatoes: in the oven for the joint's last stretch, then turned up while it rests
      const rp = d.comp('roast potatoes', 'serve'); const p = d.use('potato', 250);
      T(rp, `Peel the ${p}, cut into even chunks and boil in salted water`, 10, { passive: true, cue: 'the edges are soft but the middle is still firm', verb: 'boil' });
      T(rp, 'Drain, leave to steam for 2 minutes, then shake in the pan to rough up the edges', 3, { cue: '~fluffy, battered edges are what make them crisp' });
      T(rp, `Tip into a tray of very hot ${d.use('oil', 15)} (heated in the oven first), turn to coat, season and roast on the top shelf; turn the oven up to 220°C (200°C fan) once the joint comes out`, 50, { passive: true, oven: 220, cue: 'deep golden and glassy-crisp; turn them once halfway', verb: 'roast' });
      // veg: a roast veg if there's a root, plus a green
      const root = pickHave(d, ['carrot', 'parsnip'], 2), green = pickHave(d, ['broccoli', 'tenderstem', 'cabbage', 'green-beans', 'peas', 'sprouts', 'spinach'], 1);
      if (root.length) { const rv = d.comp('roast veg', 'serve'); const rs = root.map(id => d.use(id, 100));
        T(rv, `Cut the ${list(rs)} into batons, toss with oil, salt${d.ok('honey') ? ' and a little ' + nm('honey') : ''} and roast alongside the potatoes`, 35, { passive: true, oven: 200, cue: 'tender with caramelised tips', verb: 'roast' }); }
      if (!green.length && !root.length) green.push(d.ok('peas') ? 'peas' : 'carrot');
      if (green.length) { const gv = d.comp('greens', 'serve'); const g = d.use(green[0], green[0] === 'spinach' ? 60 : 90);
        T(gv, green[0] === 'cabbage' ? `Shred the ${g} and cook in a lidded pan with a knob of butter and a splash of water` : `Boil or steam the ${g}`, green[0] === 'cabbage' ? 6 : 4, { cue: 'bright green and just tender', verb: 'cook' });
        T(gv, `Drain and toss with a little butter and salt`, 1); }
      // extras by joint
      if (m === 'beef-roast' && d.ok('eggs') && d.ok('flour')) { const y = d.comp('Yorkshire puddings', 'serve');
        T(y, `Whisk ${d.use('eggs', 0.75, '')}, ${d.use('flour', 35)} and ${d.use('milk', 50)} with a pinch of salt until smooth (equal volumes of each is the ratio), then rest the batter`, 30, { hands: 4, passive: false, cue: '~it should be the thickness of single cream' });
        T(y, 'Put a little oil in each hole of a muffin tin and heat in the 220°C oven until smoking, then pour in the batter and bake. Don\'t open the oven door', 22, { passive: true, oven: 220, cue: 'risen high, deep golden and crisp', verb: 'bake' }); }
      if (m === 'pork-roast' && d.ok('apple')) { const a = d.comp('apple sauce', 'serve');
        T(a, `Peel and chop ${d.use('apple', 0.5, '')} and simmer with a splash of water and a pinch of sugar`, 10, { passive: true, cue: 'it collapses into a sauce; beat with a fork', verb: 'cooks' }); }
      if (m === 'lamb-leg' && d.ok('mint-sauce')) d.use('mint-sauce', 15);
      // gravy from the tin
      const gr = d.comp('gravy', 'serve');
      if (d.ok('flour') && m !== 'gammon') { T(gr, `Spoon most of the fat out of the roasting tin and set it over a medium heat. Stir ${d.use('flour', 5)} into the juices`, 2, { cue: 'it bubbles and browns slightly' });
        T(gr, `Gradually whisk in ${d.use('stock', 0.2, '')} made up with 100 ml hot water per person${d.has('wine') ? ' and a splash of ' + d.use('wine', 20, 'ml') : ''}, scraping up the sticky bits, plus any resting juices from the board`, 6, { cue: 'glossy and it coats a spoon; strain if you like' }); }
      else T(gr, `Make up the ${d.use('gravy', 1, '')} with the resting juices and hot water`, 3);
      T(jt, `Carve the ${m === 'whole-chicken' ? 'chicken' : 'meat'} and serve with everything, gravy poured over at the table`, 4);
      return jt;
    } }
};

/* ---------------- breakfast ---------------- */
const BRK = {
  pancakes: { n: 'Pancakes', fam: 'breakfast', course: 'breakfast', area: 'American', words: 'pancake|pancakes|american pancakes|fluffy pancakes', mains: ['self-raising-flour', 'flour'], needs: ['milk', 'eggs'], gear: ['hob', 'pan'],
    title: (d, m, x) => x.top ? `Fluffy pancakes with ${x.top}` : 'Fluffy pancakes',
    make(d, m, x) { const c = d.comp('pancakes', 'serve'); const R = d.ratio('pancake', 50 * d.serves, m === 'flour' ? { 'self-raising-flour': 'flour' } : {});
      if (m === 'flour') d.use('baking-powder', 0.5, 'tsp');
      T(c, `Whisk the ${R['self-raising-flour']}, ${R.sugar}, ${R['baking-powder'] || 'baking powder'}${m === 'flour' ? ' (a little extra, since it\'s plain flour)' : ''} and a pinch of salt in a bowl. In a jug, whisk the ${R.milk} with the ${R.eggs} and the ${R.butter}, melted`, 4);
      T(c, 'Pour the wet into the dry and fold together, then leave the batter to rest', 5, { hands: 1, cue: '~stop while there are still a few lumps; overmixing makes them tough' });
      T(c, 'Heat a frying pan over a medium heat, wipe with a little butter and pour in about 60 ml of batter per pancake. Flip when bubbles pop on top and the edges look set, then cook the other side', 12, { cue: 'golden on both sides; keep them warm in a low oven while you cook the rest' });
      const tops = pickHave(d, ['berries', 'banana', 'bacon', 'yogurt', 'honey', 'syrup', 'peanut-butter'], 3).map(id => d.use(id, { berries: 50, banana: 0.5, bacon: 40, yogurt: 40, honey: 10, syrup: 15, 'peanut-butter': 15 }[id], id === 'banana' ? '' : undefined));
      if (tops.length) T(c, `Stack and top with ${list(tops)}`, 2);
      return c; } },
  crepes: { n: 'Crêpes', fam: 'breakfast', course: 'breakfast dessert', area: 'French', words: 'crepe|crepes|crêpes|pancake tuesday|shrove', mains: ['flour'], needs: ['milk', 'eggs', 'butter'], gear: ['hob', 'pan'],
    title: (d, m, x) => `Crêpes with ${x.fill}`,
    make(d, m, x) { const c = d.comp('crêpes', 'serve'); const R = d.ratio('crepe', 30 * d.serves);
      T(c, `Whisk the ${R.flour}, ${R.eggs} and a pinch of salt, then whisk in the ${R.milk} a little at a time and the ${R.butter}, melted`, 4, { cue: 'smooth, the thickness of single cream' });
      T(c, 'Rest the batter', 15, { passive: true, cue: '~resting lets the flour swell so the crêpes don\'t tear', verb: 'rests' });
      T(c, 'Heat a non-stick pan until hot, wipe with butter, pour in a small ladle of batter and swirl to coat the base thinly. Cook, flip, cook the other side', 14, { cue: 'lacy and golden; the first one is always a test' });
      T(c, `Fill with ${x.fill === 'lemon & sugar' ? `a squeeze of ${sg(d.use('lemon', 0.5, ''))} and a sprinkle of ${d.use('sugar', 10)}` : x.fill === 'ham & cheese' ? `${d.use('ham', 40)} and ${d.use('cheddar', 25)}, folded and warmed in the pan until melted` : x.fill === 'jam' ? d.use('jam', 20) : `${d.use('banana', 0.5, '')} and ${d.use('chocolate', 15)}`}`, 3);
      return c; } },
  porridge: { n: 'Porridge', fam: 'breakfast', course: 'breakfast', area: 'Irish', words: 'porridge|oatmeal', mains: ['oats'], needs: ['milk'], gear: ['hob', 'pot'],
    title: (d, m, x) => x.top ? `Porridge with ${x.top}` : 'Creamy porridge',
    make(d, m) { const c = d.comp('porridge', 'serve'); const R = d.ratio('porridge', 50 * d.serves);
      T(c, `Put the ${R.oats} in a pan with the ${R.milk}, ${R.water} and a small pinch of salt. Bring to a simmer and cook, stirring`, 6, { cue: 'thick and creamy and the oats have swollen; add a splash more milk if it gets stiff' });
      const tops = pickHave(d, ['banana', 'berries', 'apple', 'honey', 'syrup', 'nuts', 'yogurt', 'peanut-butter', 'dried-fruit'], 3).map(id => d.use(id, { banana: 0.5, berries: 50, apple: 0.5, honey: 10, syrup: 10, nuts: 15, yogurt: 30, 'peanut-butter': 15, 'dried-fruit': 15 }[id], ['banana', 'apple'].includes(id) ? '' : undefined));
      T(c, `Serve topped with ${tops.length ? list(tops) : 'a drizzle of honey'}${d.ok('cinnamon') ? ' and a pinch of ' + d.use('cinnamon', 0.25, 'tsp') : ''}`, 1);
      return c; } },
  fullirish: { n: 'Full Irish breakfast', fam: 'breakfast', course: 'breakfast', area: 'Irish', words: 'full irish|fry up|full breakfast|irish breakfast|irish fry', mains: ['sausages', 'bacon'], needs: ['eggs'], gear: ['hob', 'pan'],
    title: () => 'Full Irish breakfast',
    make(d) { const main = d.comp('fry', 'serve');
      const parts = [['sausages', 2], ['bacon', 2.5], ['pudding', 2], ['mushroom', 60], ['tomato', 0.5], ['baked-beans', 0.5]].filter(([id]) => d.has(id) && d.ok(id));
      if (parts.some(p => p[0] === 'sausages')) { const sa = d.comp('sausages', 'serve'); T(sa, `Put the ${d.use('sausages', 2, '')} on a tray and cook in the oven at 200°C (180°C fan), turning once`, 25, { passive: true, oven: 200, cue: 'browned all over and cooked through', verb: 'cook' }); }
      const pan = [];
      if (parts.some(p => p[0] === 'bacon')) pan.push(d.use('bacon', 2.5, '', 'rashers'));
      if (parts.some(p => p[0] === 'pudding')) pan.push(d.use('pudding', 2, '', 'slices of black & white pudding'));
      if (pan.length) T(main, `Fry the ${list(pan)} in a little oil over a medium heat, turning once, then keep warm in the oven with the sausages`, 8, { cue: 'the rashers are golden at the edges and the pudding crisp' });
      const veg = [];
      if (parts.some(p => p[0] === 'mushroom')) veg.push('sliced ' + d.use('mushroom', 60));
      if (parts.some(p => p[0] === 'tomato')) veg.push('halved ' + d.use('tomato', 0.5, ''));
      if (veg.length) T(main, `In the same pan, fry the ${list(veg)} in the bacon fat`, 5, { cue: 'the mushrooms are golden and the tomatoes softened' });
      if (parts.some(p => p[0] === 'baked-beans')) { const b = d.comp('beans', 'serve'); T(b, `Warm the ${d.use('baked-beans', 0.5, '')} in a small pan`, 4); }
      const e = d.comp('eggs', 'serve'); T(e, `Fry the ${d.use('eggs', 1, '')} in a little butter or oil over a medium-low heat, spooning hot fat over the yolks`, 3, { cue: 'the whites are set and the yolks still runny' });
      if (d.has('soda-bread') || d.has('bread')) { const t = d.comp('toast', 'serve'); T(t, `Toast the ${d.use(d.has('soda-bread') ? 'soda-bread' : 'bread', 2, '', 'slices of ' + (d.has('soda-bread') ? 'soda bread' : 'bread'))} and butter them`, 3); }
      T(main, 'Serve everything on warm plates with a pot of tea', 1);
      return main; } },
  frenchtoast: { n: 'French toast', fam: 'breakfast', course: 'breakfast', area: 'French', words: 'french toast|eggy bread', mains: ['bread', 'soda-bread'], needs: ['eggs', 'milk'], gear: ['hob', 'pan'],
    title: (d, m, x) => x.savoury ? 'Eggy bread with crispy bacon' : 'Cinnamon French toast',
    make(d, m, x) { const c = d.comp('French toast', 'serve'); const e = d.use('eggs', 1, ''), mk = d.use('milk', 50), b = d.use(m, 2, '', 'slices of bread');
      T(c, `Whisk the ${e} with the ${mk}${x.savoury ? ', salt and pepper' : `, ${d.use('cinnamon', 0.25, 'tsp')} and a little ${d.use('sugar', 5)}`}. Soak the ${b} in it for a few seconds a side`, 3, { cue: '~day-old bread soaks up more without falling apart' });
      if (x.savoury) T(c, `Fry the ${d.use('bacon', 2, '', 'rashers')} until crisp and set aside`, 6);
      T(c, `Fry the bread in a knob of ${d.use('butter', 10)} over a medium heat`, 6, { cue: 'golden and crisp on both sides, about 3 minutes a side' });
      if (!x.savoury) { const tops = pickHave(d, ['berries', 'banana', 'honey', 'syrup', 'yogurt'], 2).map(id => d.use(id, { berries: 50, banana: 0.5, honey: 10, syrup: 15, yogurt: 30 }[id], id === 'banana' ? '' : undefined)); T(c, `Serve with ${tops.length ? list(tops) : 'a dusting of sugar'}`, 1); }
      else T(c, 'Serve with the bacon on top', 1);
      return c; } },
  omelette: { n: 'Omelette', fam: 'breakfast', course: 'breakfast lunch', area: 'French', words: 'omelette|omelet', mains: ['eggs'], needs: ['butter'], gear: ['hob', 'pan'],
    title: (d, m, x) => x.fill ? `${x.fill.charAt(0).toUpperCase() + x.fill.slice(1)} omelette` : 'French omelette',
    make(d, m, x) { const c = d.comp('omelette', 'serve'); const ids = x.ids || [];
      if (ids.some(id => ['mushroom', 'onion', 'pepper', 'spinach', 'bacon'].includes(id))) T(c, `Cook the ${list(ids.filter(id => ['mushroom', 'onion', 'pepper', 'spinach', 'bacon'].includes(id)).map(id => d.use(id, { mushroom: 50, onion: 30, pepper: 40, spinach: 30, bacon: 30 }[id])))} in a little butter first, then tip out`, 5, { cue: 'golden and any liquid gone' });
      T(c, `Beat the ${d.use('eggs', 3, '')} with salt and pepper. Melt a knob of ${d.use('butter', 10)} in a non-stick pan over a medium heat until it foams`, 2);
      T(c, 'Pour in the eggs and stir with a fork while shaking the pan, then stop and let the bottom set', 2, { cue: 'just set on the bottom, still glossy on top' });
      const ch = ids.find(id => ['cheddar', 'ham', 'feta', 'goats-cheese'].includes(id) || ['mushroom', 'onion', 'pepper', 'spinach', 'bacon'].includes(id));
      T(c, `Scatter over the filling${ids.filter(id => ['cheddar', 'ham', 'feta', 'goats-cheese'].includes(id)).map(id => ' and ' + d.use(id, 30)).join('')}, tilt the pan and roll the omelette onto a warm plate. Make one per person`, 2, { cue: '~it keeps cooking on the plate, so take it off while the middle is still soft' });
      return c; } }
};
/* ---------------- desserts & baking ---------------- */
const SWEET = {
  crumble: { n: 'Crumble', fam: 'dessert', course: 'dessert', area: 'Irish', words: 'crumble|apple crumble|fruit crumble', mains: ['apple', 'berries', 'plums', 'pears', 'banana'], needs: ['flour', 'butter'], gear: ['oven', 'dish'], batch: 6,
    title: (d, m) => ({ apple: 'Apple crumble', berries: 'Berry crumble', plums: 'Plum crumble', pears: 'Pear & ginger crumble', banana: 'Banana & toffee crumble' })[m] + (d.has('custard') || (d.ok('eggs') && d.ok('milk')) ? ' & custard' : ''),
    make(d, m) { const f = d.comp('fruit', 'final'); const fr = d.use(m, { apple: 1, berries: 80, plums: 1, pears: 1, banana: 0.7 }[m], ['apple', 'plums', 'pears', 'banana'].includes(m) ? '' : undefined);
      T(f, `Peel and chop the ${fr} (if needed) and toss with ${d.use('sugar', 10)}${d.ok('cinnamon') && m !== 'berries' ? ' and a pinch of ' + d.use('cinnamon', 0.1, 'tsp') : ''} in an ovenproof dish`, 6);
      const t = d.comp('topping', 'final'); const R = d.ratio('crumble', 30 * d.serves, d.ok('brown-sugar') ? {} : { 'brown-sugar': 'sugar' });
      T(t, `Rub the ${R.butter}, cold and cubed, into the ${R.flour} with your fingertips, then stir in the ${R['brown-sugar']}${R.oats && d.ok('oats') ? ' and ' + R.oats : ''}`, 5, { cue: 'it looks like rough breadcrumbs with a few pea-size lumps' });
      const fin = d.comp('crumble', 'serve'); T(fin, 'Scatter the topping loosely over the fruit; don\'t press it down', 1);
      TQ.bake(fin, 190, 35, 'golden on top and bubbling up at the edges');
      if (d.has('custard')) T(fin, `Serve warm with ${d.use('custard', 80)}, heated`, 2);
      else if (d.ok('eggs') && d.ok('milk')) { const cu = d.comp('custard', 'serve'); const C2 = d.ratio('custard', 70 * d.serves);
        T(cu, `Heat the ${C2.milk}${d.ok('vanilla') ? ' with a few drops of ' + d.use('vanilla', 0.5, 'ml') : ''} until steaming. Whisk the ${C2.eggs} with the ${C2.sugar} and ${C2.flour}, pour the hot milk on while whisking, return to the pan and stir over a low heat`, 8, { cue: 'it coats the back of a spoon and a finger drawn through leaves a clean line; don\'t let it boil' }); }
      else if (d.ok('cream')) T(fin, `Serve with ${d.use('cream', 30)}`, 1);
      return fin; } },
  ricepud: { n: 'Rice pudding', fam: 'dessert', course: 'dessert', area: 'Irish', words: 'rice pudding|rice pud', mains: ['rice'], needs: ['milk', 'sugar'], gear: ['hob', 'pot'], batch: 4,
    title: () => 'Creamy rice pudding',
    make(d) { const c = d.comp('rice pudding', 'serve'); const R = d.ratio('ricepud', 25 * d.serves);
      T(c, `Put the ${R.rice} (short-grain pudding rice is creamiest), ${R.milk}, ${R.sugar} and ${R.butter} in a heavy pan${d.ok('vanilla') ? ' with a few drops of ' + d.use('vanilla', 0.5, 'ml') : ''}. Bring to a gentle simmer`, 4);
      T(c, 'Cook very gently, stirring often so it doesn\'t catch, adding a splash more milk if it gets thick', 35, { hands: 8, cue: 'the rice is completely soft and it\'s thick but still spoonable; it thickens as it cools' });
      T(c, `Serve warm with ${d.ok('jam') ? 'a spoon of ' + d.use('jam', 15) : 'a grating of nutmeg'}`, 1);
      return c; } },
  brownies: { n: 'Brownies', fam: 'baking', course: 'dessert baking', area: 'American', words: 'brownie|brownies|chocolate brownies', mains: ['dark-chocolate', 'chocolate'], needs: ['butter', 'eggs', 'sugar', 'flour'], gear: ['oven'], batch: 16, makes: '16 squares',
    title: () => 'Fudgy chocolate brownies',
    make(d, m) { const c = d.comp('brownies', 'serve'); const R = d.ratio('brownie', 200, { 'dark-chocolate': m });
      T(c, `Line a 20 cm square tin. Melt the ${R['dark-chocolate']} and ${R.butter} together in a bowl over a pan of barely simmering water, then cool slightly`, 6, { cue: 'smooth and glossy' });
      T(c, `Whisk the ${R.eggs} and ${R.sugar} together`, 4, { cue: 'pale, thick and doubled in volume; this gives the crackly top' });
      T(c, `Fold in the chocolate, then sift over the ${R.flour}${R.cocoa && d.ok('cocoa') ? ' and ' + R.cocoa : ''} with a pinch of salt and fold until just combined`, 3, { cue: '~stop as soon as you can\'t see flour' });
      TQ.bake(c, 180, 25, 'the top is set and papery, with a slight wobble in the middle; a skewer comes out sticky');
      T(c, 'Cool completely in the tin before cutting into squares', 60, { passive: true, cue: '~they set as they cool; cut too early and they\'re soup', verb: 'cool' });
      return c; } },
  breadpud: { n: 'Bread & butter pudding', fam: 'dessert', course: 'dessert', area: 'Irish', words: 'bread and butter pudding|bread & butter pudding|bread pudding', mains: ['bread', 'soda-bread'], needs: ['eggs', 'milk', 'butter', 'sugar'], gear: ['oven', 'dish'], batch: 6,
    title: () => 'Bread & butter pudding',
    make(d, m) { const c = d.comp('pudding', 'serve'); const b = d.use(m, 1.5, '', 'slices of bread'); const R = d.ratio('custard', 70 * d.serves);
      T(c, `Butter the ${b} with ${d.use('butter', 8)}, cut into triangles and layer in a buttered dish${d.ok('dried-fruit') ? ', scattering ' + d.use('dried-fruit', 10) + ' between the layers' : ''}`, 6);
      T(c, `Whisk the ${R.eggs}, ${R.milk} and ${R.sugar}${d.ok('vanilla') ? ' with a few drops of ' + d.use('vanilla', 0.5, 'ml') : ''}, pour over the bread and press down. Grate over a little ${d.use('nutmeg', 0.1, 'tsp')}`, 3);
      T(c, 'Leave to soak', 15, { passive: true, cue: '~soaking makes it a pudding, not a soggy sandwich', verb: 'soaks' });
      TQ.bake(c, 180, 35, 'puffed and golden with a just-set wobble in the middle');
      return c; } },
  sponge: { n: 'Victoria sponge', fam: 'baking', course: 'baking dessert', area: 'British', words: 'victoria sponge|sponge|sponge cake|birthday cake|jam sponge', mains: ['self-raising-flour', 'flour'], needs: ['butter', 'sugar', 'eggs', 'jam'], gear: ['oven'], batch: 8, makes: '8 slices',
    title: () => 'Victoria sponge',
    make(d, m) { const c = d.comp('sponge', 'serve'); const R = d.ratio('sponge', 220, m === 'flour' ? { 'self-raising-flour': 'flour' } : {});
      if (m === 'flour') d.use('baking-powder', 0.25, 'tsp');
      T(c, `Grease and line two 20 cm sandwich tins. Beat the ${R.butter}, soft, with the ${R.sugar}`, 4, { cue: 'pale and fluffy; this traps the air that makes it rise' });
      T(c, `Beat in the ${R.eggs} one at a time, adding a spoon of the flour with each if it starts to curdle`, 3);
      T(c, `Fold in the ${R['self-raising-flour']}${m === 'flour' ? ' and 2 tsp baking powder' : ''} with a splash of milk until just combined, and divide between the tins`, 3, { cue: 'a dropping consistency: it falls off the spoon in a few seconds' });
      TQ.bake(c, 180, 22, 'golden, springing back when pressed and a skewer comes out clean');
      T(c, 'Cool for 5 minutes in the tins, then turn out onto a rack and cool completely', 40, { passive: true, verb: 'cools' });
      T(c, `Sandwich with ${d.use('jam', 15)}${d.ok('cream') ? ` and ${d.use('cream', 25)}, whipped to soft peaks` : ''} and dust with sugar`, 4);
      return c; } },
  scones: { n: 'Scones', fam: 'baking', course: 'baking', area: 'Irish', words: 'scone|scones', mains: ['self-raising-flour', 'flour'], needs: ['butter', 'milk', 'sugar'], gear: ['oven'], batch: 8, makes: '8 scones',
    title: (d, m, x) => x.fruit ? 'Fruit scones' : 'Scones with jam & cream',
    make(d, m, x) { const c = d.comp('scones', 'serve'); const R = d.ratio('scone', 225, m === 'flour' ? { 'self-raising-flour': 'flour' } : {});
      if (m === 'flour') d.use('baking-powder', 0.4, 'tsp');
      T(c, `Rub the ${R.butter}, cold and cubed, into the ${R['self-raising-flour']} with ${R['baking-powder'] || 'baking powder'} and a pinch of salt, then stir in the ${R.sugar}${x.fruit ? ' and ' + d.use('dried-fruit', 8) : ''}`, 5, { cue: 'it looks like fine breadcrumbs' });
      T(c, `Add the ${R.milk} and bring together with a knife, then pat out 3 cm thick on a floured surface`, 3, { cue: '~don\'t knead; a light hand makes a light scone' });
      T(c, 'Cut straight down with a floured cutter (don\'t twist), put on a lined tray and brush the tops with milk', 4);
      TQ.bake(c, 220, 12, 'well risen and golden; they sound hollow when tapped underneath');
      T(c, `Serve warm with ${d.ok('jam') ? d.use('jam', 10) : 'butter'}${d.ok('cream') ? ' and ' + d.use('cream', 15) : ''}`, 1);
      return c; } },
  bananabread: { n: 'Banana bread', fam: 'baking', course: 'baking', area: 'American', words: 'banana bread|banana loaf|banana cake', mains: ['banana'], needs: ['butter', 'eggs'], gear: ['oven'], batch: 10, makes: '1 loaf',
    title: () => 'Banana bread',
    make(d) { const c = d.comp('banana bread', 'serve'); const R = d.ratio('banana', 300, { 'self-raising-flour': d.ok('self-raising-flour') ? 'self-raising-flour' : 'flour', 'brown-sugar': d.ok('brown-sugar') ? 'brown-sugar' : 'sugar' });
      T(c, `Line a 900 g loaf tin. Mash the ${R.banana} (the blacker the better) and beat in the ${R.butter}, melted, the ${R['brown-sugar']} and the ${R.eggs}`, 6);
      T(c, `Fold in the ${R['self-raising-flour']}, ${R['bread-soda'] || 'bread soda'}${d.ok('cinnamon') ? ', ' + d.use('cinnamon', 0.05, 'tsp') : ''} and a pinch of salt${d.has('nuts') ? ', and ' + d.use('nuts', 5) + ', chopped' : ''}`, 3, { cue: '~just until combined; lumps are fine' });
      TQ.bake(c, 170, 55, 'risen and cracked on top, and a skewer comes out clean');
      T(c, 'Cool in the tin for 10 minutes, then on a rack', 30, { passive: true, verb: 'cools' });
      return c; } },
  cookies: { n: 'Cookies', fam: 'baking', course: 'baking dessert', area: 'American', words: 'cookie|cookies|choc chip cookies|chocolate chip cookies|biscuits', mains: ['flour'], needs: ['butter', 'sugar', 'eggs'], gear: ['oven'], batch: 16, makes: '16 cookies',
    title: (d, m, x) => x.choc ? 'Chocolate chip cookies' : 'Brown butter cookies',
    make(d, m, x) { const c = d.comp('cookies', 'serve'); const R = d.ratio('cookie', 225, d.ok('brown-sugar') ? {} : { 'brown-sugar': 'sugar' });
      T(c, `Melt the ${R.butter} in a pan and keep cooking${x.choc ? '' : ', swirling'}`, 4, { cue: x.choc ? 'just melted' : 'it smells nutty and flecks of brown appear on the bottom' });
      T(c, `Whisk with the ${R['brown-sugar']}${R.sugar ? ' and ' + R.sugar : ''}, then beat in the ${R.eggs}${d.ok('vanilla') ? ' and a few drops of ' + d.use('vanilla', 0.3, 'ml') : ''}`, 3);
      T(c, `Stir in the ${R.flour}, ${R['bread-soda'] || 'bread soda'} and a good pinch of salt${x.choc ? `, then the ${d.use(d.has('dark-chocolate') ? 'dark-chocolate' : 'chocolate', 6)}, roughly chopped` : ''}`, 3);
      T(c, 'Chill the dough', 30, { passive: true, cue: '~cold dough spreads less and the cookies get chewier', verb: 'chills' });
      T(c, 'Roll into 16 balls and space well apart on two lined trays', 6);
      TQ.bake(c, 180, 11, 'golden at the edges and still soft in the middle; they firm up as they cool');
      return c; } },
  sodabread: { n: 'Soda bread', fam: 'baking', course: 'baking', area: 'Irish', words: 'soda bread|brown bread|irish bread|wheaten', mains: ['flour'], needs: ['bread-soda'], gear: ['oven'], batch: 8, makes: '1 loaf',
    title: () => 'Irish soda bread',
    make(d, m, x) { const c = d.comp('soda bread', 'serve'); const sour = d.ok('buttermilk') && (d.has('buttermilk') || !d.has('yogurt'));
      const R = d.ratio('soda', 450, sour ? {} : { buttermilk: 'milk' });
      if (!sour) T(c, `No buttermilk? Stir a squeeze of ${sg(d.use('lemon', 0.5, ''))} into the ${R.buttermilk} and leave it`, 10, { passive: true, cue: 'it thickens and curdles slightly, which is what you want', verb: 'stands' });
      T(c, `Mix the ${R.flour}${x.brown && d.ok('oats') ? ' with ' + d.use('oats', 6) : ''}, ${R['bread-soda']} and ${R.salt} in a big bowl. Make a well and pour in most of the ${sour ? R.buttermilk : 'soured milk'}`, 3);
      T(c, 'Mix with one hand into a soft, sticky dough, adding the rest of the liquid if it\'s dry. Tip out, shape into a round and cut a deep cross in the top', 3, { cue: '~don\'t knead; the bread soda starts working straight away, so get it into the oven' });
      TQ.bake(c, 220, 15, 'it has risen and started to colour'); TQ.bake(c, 200, 25, 'it sounds hollow when you tap the bottom', 'Turn the oven down and bake');
      T(c, 'Wrap in a clean tea towel to cool, for a soft crust', 30, { passive: true, verb: 'cools' });
      return c; } },
  loaf: { n: 'White loaf', fam: 'baking', course: 'baking', area: 'British', words: 'white bread|bread loaf|white loaf|loaf of bread|homemade bread|bake bread|make bread|loaf', mains: ['strong-flour'], needs: ['yeast'], gear: ['oven'], batch: 10, makes: '1 loaf', slow: true,
    title: () => 'Crusty white loaf',
    make(d) { const c = d.comp('loaf', 'serve'); const R = d.ratio('bread', 500);
      T(c, `Mix the ${R['strong-flour']}, ${R.yeast} and ${R.salt} (keep the salt and yeast apart at first), then add ${R.water}, lukewarm, and a splash of oil`, 4);
      T(c, 'Knead on the worktop', 10, { cue: 'smooth and stretchy: a small piece stretches thin enough to see light through without tearing' });
      T(c, 'Put in an oiled bowl, cover and leave somewhere warm to prove', 60, { passive: true, cue: 'doubled in size', verb: 'proves' });
      T(c, 'Knock back, shape into a tight ball or a loaf for a tin, and prove again on a floured tray', 45, { hands: 4, passive: false, cue: 'risen and a fingertip leaves a dent that springs back slowly' });
      T(c, 'Slash the top, and put a tray of hot water in the bottom of the oven for steam', 2);
      TQ.bake(c, 220, 30, 'deep golden and it sounds hollow when tapped underneath');
      T(c, 'Cool on a rack before slicing', 30, { passive: true, cue: '~it\'s still cooking inside', verb: 'cools' });
      return c; } },
  pizza: { n: 'Homemade pizza', fam: 'baking', course: 'dinner baking', area: 'Italian', words: 'pizza|homemade pizza|margherita', mains: ['strong-flour', 'flour'], needs: ['yeast', 'passata', 'mozzarella'], gear: ['oven'],
    title: (d, m, x) => x.top ? `Homemade ${x.top} pizza` : 'Homemade margherita pizza',
    make(d, m, x) { const dg = d.comp('dough', 'final'); const R = d.ratio('pizza', 125 * d.serves, m === 'flour' ? { 'strong-flour': 'flour' } : {});
      T(dg, `Mix the ${R['strong-flour']}, ${R.yeast}, ${R.salt}, ${R['olive-oil']} and ${R.water}, lukewarm, then knead`, 10, { cue: 'smooth and elastic' });
      T(dg, 'Cover and leave to prove', 60, { passive: true, cue: 'doubled; a longer, cooler prove in the fridge tastes even better', verb: 'proves' });
      const sa = d.comp('sauce', 'final'); T(sa, `Stir the ${d.use('passata', 60)} with a crushed ${sg(d.use('garlic', 0.5, ''))} clove, a pinch of ${d.use('oregano', 0.25, 'tsp')}, salt and a drizzle of olive oil. No need to cook it`, 3);
      const fin = d.comp('pizza', 'serve');
      T(fin, 'Heat the oven as hot as it goes (240°C+) with a heavy baking tray inside for 30 minutes', 30, { passive: true, oven: 240, cue: '~a screaming hot tray is what gives a crisp base', verb: 'heats' });
      const tops = (x.ids || []).map(id => d.use(id, { ham: 30, mushroom: 40, pepper: 40, olives: 15, chorizo: 25, 'red-onion': 20, onion: 20, spinach: 20, 'cooked-chicken': 40, bacon: 30, sweetcorn: 30, pineapple: 30 }[id] || 30));
      T(fin, `Divide the dough into ${d.serves} balls. Stretch each one into a thin round on a floured sheet of baking paper. Spread thinly with the sauce, tear over the ${d.use('mozzarella', 60)}${tops.length ? ' and add the ' + list(tops) : ''}`, 6, { cue: '~less is more: too much topping makes a soggy middle' });
      T(fin, 'Slide onto the hot tray (on its paper) and bake one at a time', 10, { passive: true, oven: 240, cue: 'the crust is blistered and the cheese bubbling, 8 to 12 minutes', verb: 'bakes' });
      if (d.ok('basil')) T(fin, `Scatter with ${d.use('basil', 2)} and a drizzle of oil`, 1);
      return fin; } },
  flatbreads: { n: 'Flatbreads', fam: 'baking', course: 'baking lunch', area: 'Middle Eastern', words: 'flatbread|flatbreads|naan|quick bread', mains: ['self-raising-flour', 'flour'], needs: ['yogurt'], gear: ['hob', 'pan'], batch: 4, makes: '4 flatbreads',
    title: () => 'Two-ingredient flatbreads',
    make(d, m) { const c = d.comp('flatbreads', 'serve'); const R = d.ratio('flatbread', 200, m === 'flour' ? { 'self-raising-flour': 'flour' } : {}); if (m === 'flour') d.use('baking-powder', 0.5, 'tsp');
      T(c, `Mix the ${R['self-raising-flour']}${m === 'flour' ? ' with 2 tsp baking powder' : ''}, ${R.yogurt} and a pinch of salt into a soft dough and knead briefly`, 4, { cue: 'smooth and only slightly sticky' });
      T(c, 'Divide into 4, roll each out thinly and cook in a hot dry pan', 10, { cue: 'puffed with charred spots, about 2 minutes a side' });
      if (d.ok('garlic') && d.ok('butter')) T(c, `Brush with ${d.use('butter', 5)} melted with a crushed ${sg(d.use('garlic', 0.25, ''))} clove${d.ok('parsley') ? ' and chopped parsley' : ''}`, 2);
      return c; } }
};
Object.assign(FAMILIES, BRK, SWEET);
for (const F of Object.values(FAMILIES)) if (!F.course) F.course = F.fam === 'soup' ? 'lunch dinner' : 'dinner';

/* ---------------- scheduling: everything lands at the same time ---------------- */
function schedule(comps) {
  // components marked 'final' must be ready when the finishing component (the last 'serve' one built) starts its assembly
  const dur = c => c.tasks.reduce((a, t) => a + t.t, 0);
  const serveC = comps.filter(c => c.ready === 'serve'), finalC = comps.filter(c => c.ready === 'final');
  const main = serveC[0]; const mainDur = dur(main);
  // the main serve component ends at 0; prerequisites end when the main starts
  const out = [];
  const place = (c, end) => { let t = end - dur(c); for (const k of c.tasks) { out.push({ ...k, comp: c.name, start: t, end: t + k.t }); t += k.t; } };
  for (const c of finalC) place(c, -mainDur);
  place(main, 0);
  // sides: the roast veg/potatoes come out with the joint after it rests; gravy is made while the joint rests
  for (const c of serveC.slice(1)) {
    if (c.name === 'gravy') { const restT = out.find(t => t.comp === main.name && t.verb === 'rests'); place(c, restT ? restT.end - 2 : -2); continue; }
    if (c.name === 'apple sauce') { place(c, -15); continue; }
    place(c, c.name === 'greens' ? -4 : c.name === 'rice' || c.name === 'naan' ? 0 : -1);
  }
  // risotto-style dishes where a side (roast squash) feeds in at the end: fine to finish a little early
  const start = Math.min(...out.map(t => t.start));
  for (const t of out) { t.at = Math.round(t.start - start); }
  out.sort((a, b) => a.at - b.at || (a.comp === main.name ? -1 : b.comp === main.name ? 1 : 0));
  return { tasks: out, total: Math.round(-start), handsOn: out.reduce((a, t) => a + t.hands, 0) };
}
function writeSteps(tasks) {
  const steps = [], running = [], started = new Set();
  for (const t of tasks) {
    const busy = running.filter(r => r.end > t.start + 0.5 && r.comp !== t.comp);
    let lead = '';
    if (!started.has(t.comp) && busy.length) lead = `While the ${busy[busy.length - 1].comp} ${busy[busy.length - 1].verb || 'cooks'}, `;
    started.add(t.comp);
    let txt = t.text; if (lead) txt = lead + txt.charAt(0).toLowerCase() + txt.slice(1);
    const time = t.t > 1 ? (/°C fan\)$/.test(t.text) ? ` for ${tl(t.t)}` : ` (${tl(t.t)})`) : '';
    const cue = !t.cue ? '' : t.cue.startsWith('~') ? `. ${t.cue.charAt(1).toUpperCase() + t.cue.slice(2)}` : `, until ${t.cue}`;
    steps.push(`${txt}${time}${cue}.`.replace(/\.\.$/, '.'));
    if (t.passive) running.push(t);
  }
  return steps;
}

/* ---------------- building and choosing ---------------- */
function variantsOf(fid, state) {
  const F = FAMILIES[fid], have = id => ITEM[id] && C.pantryQty(state, id) > 0 && G.okItem(state, id);
  if (fid === 'indian') return Object.entries(F.styles).flatMap(([sid, s]) => s.mains.split(' ').map(m => ({ main: m, x: { style: sid } })));
  if (fid === 'chickenpie') return F.mains.flatMap(m => [{ main: m, x: { leek: false, bacon: false } }, { main: m, x: { leek: true, bacon: false } }, { main: m, x: { leek: false, bacon: true } }]);
  const mains = F.mains, V = xs => mains.flatMap(m => xs.map(x => ({ main: m, x })));
  if (fid === 'pancakes') return V([{}, ...[['berries', 'berries'], ['banana', 'banana & honey'], ['bacon', 'crispy bacon & syrup']].filter(([id]) => have(id)).map(([, t]) => ({ top: t }))]);
  if (fid === 'crepes') return V([['lemon & sugar', ['lemon']], ['ham & cheese', ['ham', 'cheddar']], ['jam', ['jam']], ['banana & chocolate', ['banana', 'chocolate']]].filter(([, ids]) => ids.every(id => ITEM[id] && G.okItem(state, id))).map(([f]) => ({ fill: f })));
  if (fid === 'porridge') { const t = ['banana', 'berries', 'apple', 'honey'].filter(have); return V([{ top: t.length ? t.slice(0, 2).join(' & ').replace('apple', 'stewed apple') : null }]); }
  if (fid === 'frenchtoast') return V([{ savoury: false }, ...(have('bacon') ? [{ savoury: true }] : [])]);
  if (fid === 'omelette') { const f = ['cheddar', 'ham', 'mushroom', 'spinach', 'pepper', 'onion', 'feta', 'bacon'].filter(have); const combos = [f.slice(0, 2), f.slice(2, 4), f.slice(0, 1)].filter(c => c.length && c.some(id => !['onion', 'pepper'].includes(id)));
    return V(combos.length ? combos.map(c => ({ ids: c, fill: c.map(id => ({ cheddar: 'cheese', ham: 'ham', mushroom: 'mushroom', spinach: 'spinach', pepper: 'pepper', onion: 'onion', feta: 'feta', bacon: 'bacon' })[id]).join(' & ') })) : [{}]); }
  if (fid === 'scones') return V([{ fruit: false }, ...(have('dried-fruit') ? [{ fruit: true }] : [])]);
  if (fid === 'cookies') return V([{ choc: have('dark-chocolate') || have('chocolate') }]);
  if (fid === 'pizza') { const t = ['ham', 'mushroom', 'pepper', 'chorizo', 'olives', 'red-onion', 'spinach', 'cooked-chicken', 'bacon', 'sweetcorn'].filter(have).slice(0, 3);
    return V([{}, ...(t.length ? [{ ids: t, top: t.slice(0, 2).map(id => ({ bacon: 'bacon', 'cooked-chicken': 'chicken', 'red-onion': 'red onion', olives: 'olive' })[id] || ITEM[id].n.toLowerCase().replace(/^(sliced|cooked|tinned) /, '').replace(/s$/, '')).join(' & ') }] : [])]); }
  return mains.map(m => ({ main: m, x: {} })); }
export const isDinnerFam = fid => !!FAMILIES[fid] && FAMILIES[fid].course.split(' ').some(c => c === 'dinner' || c === 'lunch');
export function build(state, sp, serves) {
  const F = FAMILIES[sp.proc]; if (!F) return null;
  const d = new Dish(state, F.batch || serves || 2); F.make(d, sp.main, sp.px || {});
  const sch = schedule(d.comps), steps = writeSteps(sch.tasks);
  const title = F.title(d, sp.main, sp.px || {});
  for (const i of d.ings) i.raw = i.raw || `${i.q}${i.u ? (['g', 'ml'].includes(i.u) ? '' : ' ') + i.u : ''} ${i.name}`;
  const id = 'p:' + sp.proc + ':' + sp.main + ':' + Object.values(sp.px || {}).map(v => v === true ? 1 : v === false ? 0 : v).join('');
  const r = C.normalizeRecipe({ id, src: 'built', title, serves: d.serves, course: F.course || 'dinner', makes: F.makes || null, time: sch.total, cat: 'Built', area: F.area, ings: d.ings, steps, spec: { ...sp }, proc: sp.proc, timeline: sch.tasks.map(t => ({ at: t.at, t: t.t, comp: t.comp, passive: t.passive, oven: t.oven })), comps: d.comps.map(c => c.name) });
  r.active = sch.handsOn; if (sch.total > 60) r.slowish = true;
  r.ratioNotes = d.ratios.map(k => `${RT.RATIOS[k].n}: ${RT.RATIOS[k].why}.`);
  if (d.leftover && ITEM[d.leftover.item]) { r.leftover = d.leftover; r.steps.push(`Leftovers: wrap the rest of the meat (about ${Math.round(d.leftover.g / 50) * 50} g) and refrigerate within 2 hours. It makes quick meals later in the week.`); }
  return r;
}
// typed words that ask for a process dish ("lasagne", "fish pie", "roast dinner", "korma"...)
export function detect(text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  let best = null, bl = 0;
  for (const [fid, F] of Object.entries(FAMILIES)) {
    const words = fid === 'indian' ? Object.entries(F.styles).flatMap(([sid, s]) => s.words.split('|').map(w => [w, { proc: fid, style: sid }])) : F.words.split('|').map(w => [w, { proc: fid }]);
    for (const [w, res] of words) { if (['pie', 'roast', 'curry', 'soup'].includes(w)) continue; if (t.includes(' ' + w + ' ') && w.length > bl) { best = res; bl = w.length; } }
  }
  const course = / (breakfast|brunch) /.test(t) ? 'breakfast' : / (dessert|desert|pudding|something sweet|sweet treat|sweet|treat) /.test(t) ? 'dessert' : / (bake|baking|baked goods) /.test(t) ? 'baking' : / lunch /.test(t) ? 'lunch' : null;
  if (best) return course ? { ...best, course } : best;
  if (/ roast (dinner|lunch)| sunday /.test(t)) return { proc: 'roastdinner' };
  if (/ curry /.test(t) && !/ thai /.test(t)) return { proc: 'indian', loose: true };
  if (/ soup /.test(t)) return { proc: 'soup', loose: true };
  if (/ pie /.test(t)) return { proc: /fish|salmon|cod|haddock/.test(t) ? 'fishpie' : /chicken|turkey/.test(t) ? 'chickenpie' : 'cottagepie', loose: true };
  return course ? { course } : null;
}
// Candidates for the main options() picker. Scores are on the same scale as the meal builder's.
export function candidates(state, opts, ref = 4) {
  const out = [], T = G.partTaste(state), gear = G.gearOf(state), stock = opts.stock || new Map(), urg = G.urgencyMap(state);
  const w = opts.want || {}, asked = w.proc || null, spiceCap = (state.taste && state.taste.spice != null ? state.taste.spice : 2) + 1;
  for (const [fid, F] of Object.entries(FAMILIES)) {
    if (asked && asked.proc !== fid && !(asked.loose && FAMILIES[asked.proc].fam === F.fam)) continue;
    { const course = w.course || (asked ? null : 'dinner'); if (course && !F.course.split(' ').includes(course) && !(asked && asked.proc === fid)) continue; }
    if (F.gear.some(g => gear[g] === false)) continue;
    if (!F.needs.every(id => ITEM[id] && G.okItem(state, id))) continue;
    for (const v of variantsOf(fid, state)) {
      const m = v.main; if (!ITEM[m] || !G.okItem(state, m)) continue;
      if ((opts.useStock || opts.onlyStockMains) && !asked && !(stock.get(m) > 0) && !(w.main === m) && isDinnerFam(fid) && !(ITEM[m] && ITEM[m].staple)) continue;
      if (w.main && w.main !== m && !(asked && asked.proc === fid && !isDinnerFam(fid))) continue;
      if (fid === 'indian') { const s = F.styles[v.x.style]; if (s.spice > spiceCap) continue; if (asked && asked.style && asked.style !== v.x.style) continue; }
      if (fid === 'chickenpie') { if (v.x.leek && !(stock.get('leek') > 0)) continue; if (v.x.bacon && !(stock.get('bacon') > 0)) continue; if (!v.x.leek && !G.okItem(state, 'mushroom')) continue; }
      if (opts.vegOnly && G.MAINS[m] && !['chickpeas', 'halloumi', 'tofu', 'lentils'].includes(m) && ITEM[m].cat !== 'veg') continue;
      if (opts.vegOnly && ['bacon', 'prawns', 'white-fish', 'salmon'].includes(m)) continue;
      if (F.slow && !opts.allowSlow && !asked) continue;
      const px = { ...v.x }; if (fid === 'indian' && !opts.allowSlow && !asked) px.quick = true;
      const r = build(state, { proc: fid, main: m, px, method: 'p-' + F.fam, kit: 'p-' + fid + (v.x.style || ''), veg: [] }, opts.serves || 2);
      if (!r) continue;
      if (opts.maxTime && r.time > opts.maxTime + 5) continue;
      const ex = opts.exclude ? (opts.exclude instanceof Set ? opts.exclude : new Set(opts.exclude)) : null;
      if (ex && r.ings.some(i => ex.has(i.item))) continue;
      if ((w.veg || []).length && !w.veg.every(v => r.ings.some(i => i.item === v))) continue;
      if (!opts.allowSlow && !asked && r.time > 75) continue;
      // score: what you have, what needs using, what you like
      const fresh = r.ings.filter(i => i.item && ITEM[i.item] && !ITEM[i.item].staple), have = fresh.filter(i => stock.get(i.item) > 0 || C.pantryQty(state, i.item) > 0);
      let s = ref + (have.length / Math.max(1, fresh.length) - 0.5) * 3 + (stock.get(m) > 0 ? 1.5 : -0.6);
      for (const i of fresh) { const u = urg.get(i.item); if (u != null && u <= 3) s += 0.8; }
      s += (T.main && T.main[m] ? Math.tanh(T.main[m] / 3) : 0);
      if (asked) s += 6 + (w.main === m ? 2 : 0);
      if (w.main === m) s += 1.5; if ((w.veg || []).some(vid => r.ings.some(i => i.item === vid))) s += 1;
      if (opts.quick && r.time > 40) s -= 2;
      if (F.fam === 'soup' && !asked) s -= 1.2;
      if (w.text && ITEM[m] && w.text.includes(' ' + ITEM[m].n.toLowerCase().split(' ')[0].replace(/s$/, ''))) s += 2.5; // a soup is a lighter supper; offer it, don't lead with it
      s += (Math.random() - 0.5) * (opts.noise || 1);
      r.spec.add = [...new Set(fresh.map(i => i.item))].filter(id => id !== m);
      out.push({ s, sp: r.spec, r });
    }
  }
  return out.sort((a, b) => b.s - a.s);
}
export const families = () => Object.entries(FAMILIES).map(([id, F]) => ({ id, n: F.n, fam: F.fam, area: F.area }));
