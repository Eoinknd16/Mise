// Mise meal engine: builds dinners from parts (main + base + veg + flavour kit + way of cooking) to suit your tastes and what you're buying.
import { ITEM } from './data.js';
import * as C from './core.js';
import * as F from './flavour.js';
import * as Chef from './chef.js';
import * as Tech from './techniques.js';
import * as P from './process.js';
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/* ================= Parts ================= */
// pp = per person in the catalog's unit (g, ml or pieces)
const M = (n, short, grp, pp, methods, o = {}) => ({ n, short, grp, pp, methods: methods.split(' '), ...o });
export const MAINS = {
  'chicken-thigh': M('chicken thighs', 'chicken', 'chicken', 150, 'traybake panfry stirfry friedrice pasta simmer curry wraps bowl bake burgers soup noodlesoup hash pie salad risotto flatbread quesadilla', { roast: 30, cook: 'Fry the chicken until golden and cooked through, 8–10 minutes' }),
  'chicken-breast': M('chicken breast', 'chicken', 'chicken', 150, 'traybake panfry stirfry friedrice pasta simmer curry wraps bowl bake burgers soup noodlesoup salad risotto flatbread quesadilla pie', { roast: 25, cook: 'Fry the chicken until golden and cooked through, 6–8 minutes' }),
  'cooked-chicken': M('cooked chicken', 'chicken', 'chicken', 100, 'stirfry friedrice pasta wraps bowl bake soup noodlesoup hash pie salad risotto flatbread quesadilla loaded', { ready: true, cook: 'Add the cooked chicken and heat through' }),
  'beef-mince': M('beef mince', 'beef', 'beef', 125, 'simmer pasta wraps bowl bake burgers stirfry hash loaded pie quesadilla flatbread', { mince: true, cook: 'Brown the mince, breaking it up, 6–8 minutes' }),
  'pork-mince': M('pork mince', 'pork', 'pork', 125, 'stirfry pasta bowl burgers simmer wraps noodlesoup', { mince: true, cook: 'Brown the pork mince, breaking it up, 6–8 minutes' }),
  'turkey-mince': M('turkey mince', 'turkey', 'chicken', 125, 'simmer pasta wraps bowl burgers bake loaded pie', { mince: true, cook: 'Brown the turkey mince, breaking it up, 6 minutes' }),
  'lamb-mince': M('lamb mince', 'lamb', 'lamb', 125, 'simmer wraps bowl burgers', { mince: true, cook: 'Brown the lamb mince, breaking it up, 6–8 minutes' }),
  steak: M('steak', 'steak', 'beef', 150, 'panfry stirfry wraps bowl salad', { cook: 'Fry the steak in a very hot pan, 2–3 minutes a side, rest, then slice' }),
  'pork-chop': M('pork chops', 'pork', 'pork', 180, 'traybake panfry stirfry bowl wraps hash salad sticky', { strip: 'Trim the fat, slice the pork chops into thin strips and fry them in a hot pan for 3–4 minutes until just cooked', roast: 25, cook: 'Fry the pork chops 4–5 minutes a side' }),
  sausages: M('sausages', 'sausage', 'pork', 2, 'traybake simmer pasta panfry bake hash flatbread pie soup', { roast: 25, cook: 'Fry the sausages until browned all over, 10 minutes, then slice' }),
  bacon: M('bacon', 'bacon', 'pork', 60, 'pasta friedrice bake panfry hash soup risotto frittata flatbread loaded quesadilla salad', { cook: 'Fry the bacon until crisp' }),
  salmon: M('salmon', 'salmon', 'fish', 120, 'traybake panfry bowl pasta stirfry salad risotto noodlesoup', { roast: 15, cook: 'Pan-fry the salmon skin-side down 4 minutes, then flip for 2' }),
  'white-fish': M('white fish', 'fish', 'fish', 140, 'traybake panfry curry simmer wraps pie soup', { roast: 15, cook: 'Pan-fry the fish 3 minutes a side' }),
  prawns: M('prawns', 'prawn', 'fish', 100, 'stirfry friedrice pasta curry wraps bowl simmer noodlesoup risotto salad flatbread', { cook: 'Fry the prawns just until pink, 2–3 minutes' }),
  eggs: M('eggs', 'egg', 'veg', 2, 'friedrice bowl frittata shakshuka hash noodlesoup salad', { cook: 'Fry or scramble the eggs' }),
  chickpeas: M('chickpeas', 'chickpea', 'veg', 130, 'curry simmer traybake bowl wraps soup salad shakshuka loaded', { roast: 25, cook: 'Add the drained chickpeas' }),
  'kidney-beans': M('beans', 'bean', 'veg', 130, 'simmer wraps bowl bake loaded quesadilla soup', { cook: 'Add the drained beans' }),
  lentils: M('lentils', 'lentil', 'veg', 60, 'curry simmer soup', { cook: 'Add the rinsed lentils with enough water to cover and simmer 20 minutes' }),
  halloumi: M('halloumi', 'halloumi', 'veg', 100, 'traybake wraps bowl burgers panfry salad hash flatbread', { roast: 15, cook: 'Fry the halloumi slices until golden, 2 minutes a side' }),
  tofu: M('tofu', 'tofu', 'veg', 140, 'stirfry curry bowl friedrice noodlesoup', { cook: 'Fry the cubed tofu until crisp, 8 minutes' }),
  nuggets: M('chicken goujons', 'goujon', 'chicken', 150, 'wraps bowl burgers', { ready: true, oven: 20, cook: 'Oven-cook the goujons as the pack says' }),
  'fish-fingers': M('fish fingers', 'fish finger', 'fish', 4, 'wraps burgers', { ready: true, oven: 20, cook: 'Oven-cook the fish fingers as the pack says' }),
  'diced-beef': M('diced beef', 'beef', 'beef', 150, 'simmer pie braise', { slow: true, cook: 'Brown the beef in batches' }),
  'pork-roast': M('pork roast', 'pork', 'pork', 200, 'roast pulled braise', { cut: { n: 'pork steaks', short: 'pork', pp: 170, cook: 'Cut 1–2 cm thick steaks from the pork joint (wrap and freeze the rest, or keep it for a roast). Fry them 4–5 minutes a side until cooked through', strip: 'Cut a few thin steaks from the pork joint (wrap and freeze or keep the rest) and slice into strips. Fry hard for 3–4 minutes until cooked' }, joint: { temp: 180, per500: 30, extra: 30, start: 'Start at 220°C for 25 minutes so the crackling puffs up, then turn down to 180°C', skin: true }, leftover: 'cooked-pork', cook: 'Brown the pork all over' }),
  'beef-roast': M('roast beef', 'beef', 'beef', 180, 'roast braise', { cut: { n: 'beef steaks', short: 'beef', pp: 160, cook: 'Cut 1–2 cm steaks from the beef joint (wrap and freeze the rest, or keep it for a roast). Fry in a very hot pan 2–3 minutes a side and rest', strip: 'Cut a few thin slices from the beef joint (keep or freeze the rest) and slice into strips across the grain. Fry fast in a very hot pan for 1–2 minutes' }, joint: { temp: 190, per500: 20, extra: 20, note: 'for medium (15 per 500 g for rare)' }, leftover: 'cooked-beef', cook: 'Brown the beef all over' }),
  'beef-brisket': M('brisket', 'beef', 'beef', 200, 'pulled braise', { joint: { temp: 160, per500: 0, extra: 240, slow: true }, leftover: 'cooked-beef', cook: 'Brown the brisket all over' }),
  'lamb-leg': M('lamb', 'lamb', 'lamb', 220, 'roast pulled braise', { cut: { n: 'lamb steaks', short: 'lamb', pp: 170, cook: 'Cut 2 cm steaks from the leg of lamb (keep or freeze the rest). Fry 3–4 minutes a side and rest', strip: 'Cut a couple of steaks from the leg of lamb (keep or freeze the rest), fry 3–4 minutes a side, rest and slice' }, joint: { temp: 190, per500: 25, extra: 25, note: 'for pink (add 20 minutes for well done)' }, leftover: 'cooked-lamb', cook: 'Brown the lamb all over' }),
  'whole-chicken': M('whole chicken', 'chicken', 'chicken', 300, 'roast pulled traybake', { cut: { n: 'chicken pieces', short: 'chicken', pp: 300, roast: 40, cook: 'Joint the chicken into 8 pieces (legs, thighs, wings, breasts)', strip: 'Joint the chicken and cut the meat off the bone into chunks. Fry until golden and cooked through' }, joint: { temp: 200, per500: 20, extra: 20, bird: true }, leftover: 'cooked-chicken', cook: 'Brown the chicken' }),
  gammon: M('gammon', 'gammon', 'pork', 180, 'roast braise', { cut: { n: 'gammon steaks', short: 'gammon', pp: 150, cook: 'Cut thick steaks from the gammon (keep or freeze the rest), snip the fat so they stay flat and fry 4 minutes a side', strip: 'Cut a thick slice from the gammon (keep the rest), dice it and fry until golden' }, joint: { temp: 180, per500: 20, extra: 20, glaze: true }, leftover: 'ham', cook: 'Brown the gammon' }),
  'pork-belly': M('pork belly', 'pork belly', 'pork', 180, 'roast bowl sticky', { joint: { temp: 160, per500: 0, extra: 120, skin: true, start: 'Roast at 160°C for 2 hours, then 220°C for 20 minutes to crisp the crackling' }, leftover: 'cooked-pork', cook: 'Crisp the pork belly' }),
  'pork-fillet': M('pork fillet', 'pork', 'pork', 150, 'traybake panfry stirfry bowl wraps salad', { roast: 20, cook: 'Sear the pork fillet all over, then roast at 200°C for 15–20 minutes. Rest and slice' }),
  'pork-ribs': M('ribs', 'rib', 'pork', 350, 'sticky', { cook: 'Bake the ribs' }),
  'chicken-wings': M('chicken wings', 'wing', 'chicken', 300, 'sticky traybake', { roast: 40, cook: 'Bake the wings' }),
  'chicken-drum': M('chicken drumsticks', 'chicken', 'chicken', 250, 'traybake curry simmer sticky bowl', { roast: 40, cook: 'Brown the drumsticks all over' }),
  'lamb-chops': M('lamb chops', 'lamb', 'lamb', 180, 'panfry traybake bowl wraps salad sticky', { strip: 'Fry the lamb chops 3–4 minutes a side, rest for a few minutes, then slice the meat off the bone', roast: 15, cook: 'Fry the lamb chops 3–4 minutes a side, then rest' }),
  lamb: M('diced lamb', 'lamb', 'lamb', 150, 'curry braise simmer', { slow: true, cook: 'Brown the lamb in batches' }),
  'turkey-breast': M('turkey breast', 'turkey', 'chicken', 150, 'panfry traybake stirfry wraps bowl salad', { roast: 25, cook: 'Fry the turkey until golden and cooked through, 6–8 minutes' }),
  'duck-breast': M('duck breast', 'duck', 'chicken', 175, 'panfry bowl salad stirfry', { cook: 'Score the duck skin, start skin-side down in a cold pan, cook 8 minutes until crisp, flip for 4, rest and slice' }),
  'cooked-pork': M('leftover pork', 'pork', 'pork', 100, 'stirfry friedrice wraps quesadilla noodlesoup hash pasta bowl salad flatbread loaded pie', { ready: true, cook: 'Add the leftover pork and heat through' }),
  'cooked-beef': M('leftover beef', 'beef', 'beef', 100, 'stirfry friedrice wraps quesadilla hash pasta bowl salad loaded pie', { ready: true, cook: 'Add the leftover beef and heat through' }),
  'cooked-lamb': M('leftover lamb', 'lamb', 'lamb', 100, 'wraps hash bowl salad flatbread curry pie', { ready: true, cook: 'Add the leftover lamb and heat through' }),
  'smoked-salmon': M('smoked salmon', 'smoked salmon', 'fish', 60, 'pasta salad frittata bowl', { ready: true, cook: 'Fold in the smoked salmon at the end' }),
  mackerel: M('mackerel', 'mackerel', 'fish', 100, 'salad bowl pasta', { ready: true, cook: 'Flake in the mackerel' }),
  pudding: M('black & white pudding', 'pudding', 'pork', 80, 'hash salad', { cook: 'Fry the sliced pudding until crisp' }),
  'fish-cakes': M('fish cakes', 'fish cake', 'fish', 2, 'panfry traybake salad bowl', { cook: 'Bake or fry the fish cakes as the pack says, about 20 minutes' }),
  'frozen-fish': M('breaded fish', 'fish', 'fish', 130, 'traybake wraps bowl', { cook: 'Bake the fish from frozen as the pack says, about 25 minutes', roast: 25 }),
  burgers: M('beef burgers', 'burger', 'beef', 1, 'burgers loaded', { cook: 'Grill or fry the burgers 5–6 minutes a side until cooked through' }),
  chorizo: M('chorizo', 'chorizo', 'pork', 60, 'pasta simmer friedrice hash flatbread soup risotto traybake shakshuka', { cook: 'Fry the sliced chorizo until it releases its red oil' }),
  ham: M('ham', 'ham', 'pork', 60, 'quesadilla flatbread pasta bake frittata pie salad', { ready: true, cook: 'Tear in the ham' }),
  tuna: M('tuna', 'tuna', 'fish', 70, 'pasta bake salad loaded quesadilla', { ready: true, cook: 'Flake in the drained tuna' }),
  'butter-beans': M('butter beans', 'butter bean', 'veg', 130, 'simmer soup salad traybake shakshuka bowl', { cook: 'Add the drained butter beans' })
};
const B = (n, pp, methods, how, o = {}) => ({ n, pp, methods: methods.split(' '), how, ...o });
export const BASES = {
  rice: B('rice', 75, 'panfry simmer curry bowl stirfry friedrice traybake wraps pulled sticky braise', 'Cook the rice.'),
  basmati: B('basmati rice', 75, 'curry simmer bowl panfry friedrice', 'Cook the rice.'),
  pasta: B('pasta', 90, 'pasta bake', 'Boil the pasta.'),
  spaghetti: B('spaghetti', 90, 'pasta', 'Boil the spaghetti.'),
  gnocchi: B('gnocchi', 150, 'pasta bake traybake', 'Boil the gnocchi until they float.'),
  noodles: B('noodles', 75, 'stirfry bowl noodlesoup', 'Cook the noodles.'),
  potato: B('potatoes', 250, 'traybake panfry simmer burgers bake hash loaded salad frittata soup roast braise sticky pulled', null, { forms: { traybake: 'roast', panfry: 'mash', simmer: 'mash', burgers: 'wedges', bake: 'sliced', hash: 'diced', loaded: 'jacket', salad: 'boiled', frittata: 'sliced', soup: 'diced', roast: 'roast', braise: 'mash', sticky: 'wedges', pulled: 'jacket' } }),
  'sweet-potato': B('sweet potatoes', 250, 'traybake panfry bowl burgers hash loaded salad soup', null, { forms: { traybake: 'roast', panfry: 'mash', bowl: 'roast', burgers: 'wedges', hash: 'diced', loaded: 'jacket', salad: 'roast', soup: 'diced' } }),
  chips: B('oven chips', 200, 'burgers panfry loaded pulled sticky', 'Bake the oven chips.'),
  wraps: B('wraps', 2, 'wraps quesadilla flatbread pulled', 'Warm the wraps.'),
  pitta: B('pittas', 2, 'wraps flatbread', 'Warm the pittas.'),
  buns: B('buns', 1, 'burgers pulled', 'Toast the buns.'),
  bread: B('crusty bread', 2, 'simmer soup shakshuka noodlesoup braise', 'Serve with crusty bread.'),
  couscous: B('couscous', 70, 'traybake bowl simmer salad', 'Pour boiling water over the couscous, cover for 5 minutes, then fluff up.'),
  naan: B('naan', 1, 'curry flatbread', 'Warm the naan.'),
  'risotto-rice': B('risotto rice', 80, 'risotto', null),
  'puff-pastry': B('puff pastry', 80, 'pie', null)
};
// kind: hard (needs time), firm, quick, leafy, side (served raw)
const V = (pp, kind, o = {}) => ({ pp, kind, ...o });
export const VEG = {
  onion: V(75, 'firm', { base: true }), 'red-onion': V(75, 'firm'), pepper: V(0.5, 'firm'), courgette: V(0.5, 'firm'), mushroom: V(80, 'firm'), aubergine: V(0.4, 'firm'), leek: V(80, 'firm'), cabbage: V(0.15, 'firm'),
  broccoli: V(80, 'hard'), cauliflower: V(0.25, 'hard'), carrot: V(80, 'hard'), butternut: V(0.25, 'hard'), 'sweet-potato': V(150, 'hard'),
  'frozen-veg': V(100, 'quick'), peas: V(70, 'quick'), sweetcorn: V(60, 'quick'), 'cherry-tomato': V(80, 'quick'), tomato: V(1, 'quick'), 'green-beans': V(70, 'quick'), 'sugar-snap': V(50, 'quick'),
  celery: V(40, 'firm'), beetroot: V(80, 'side'), parsnip: V(80, 'hard'), asparagus: V(60, 'quick'), tenderstem: V(70, 'quick'), 'corn-cob': V(1, 'side'), radish: V(40, 'side'), 'salad-veg': V(90, 'quick'),
  spinach: V(40, 'leafy'), kale: V(40, 'leafy'),
  salad: V(40, 'side'), cucumber: V(0.25, 'side'), avocado: V(0.5, 'side'), coleslaw: V(75, 'side')
};
// Anything in the catalog can be cooked: register mains/veg on the fly from the item's name
const LEAFY = /kale|chard|rocket|lettuce|spinach|cabbage|greens|pak choi|bok choy/, HARDV = /root|parsnip|turnip|swede|beet|celeriac|squash|pumpkin|carrot|sweet potato/, QUICKV = /asparagus|bean|mangetout|pea|corn|tomato|sprout/;
export function ensureVeg(id) {
  if (VEG[id] || BASES[id] || !ITEM[id] || ITEM[id].cat !== 'veg') return !!VEG[id];
  const n = ITEM[id].n.toLowerCase(); if (/garlic|ginger|chilli|coriander|parsley|basil|thyme|rosemary|mint|sage|dill|tarragon|lemongrass|other/.test(n)) return false;
  VEG[id] = V(ITEM[id].u === 'pc' ? 0.5 : 80, LEAFY.test(n) ? 'leafy' : HARDV.test(n) ? 'hard' : QUICKV.test(n) ? 'quick' : 'firm'); return true;
}
export function ensureMain(id, label) {
  if (MAINS[id]) return true; const it = ITEM[id]; if (!it || !['meat', 'fish'].includes(it.cat)) return false;
  const nm = (label || it.n).toLowerCase(), tag = (it.tags.find(t => t.startsWith('p:')) || '').slice(2), grp = tag === 'fish' || it.cat === 'fish' ? 'fish' : ['chicken', 'beef', 'pork', 'lamb'].includes(tag) ? tag : 'beef';
  const short = nm.replace(/^(other|fresh|frozen|cooked|sliced|diced) /, '').replace(/s$/, '');
  if (/cooked|deli|smoked|tin|leftover/.test(nm)) MAINS[id] = M(nm, short, grp, 90, 'wraps salad bowl hash quesadilla friedrice pasta', { ready: true, cook: `Add the ${short} and heat through` });
  else if (/joint|roast|shoulder|leg|whole|brisket|haunch/.test(nm)) MAINS[id] = M(nm, short, grp, 200, 'roast braise pulled', { joint: { temp: 180, per500: 25, extra: 25 }, leftover: grp === 'chicken' ? 'cooked-chicken' : grp === 'lamb' ? 'cooked-lamb' : grp === 'pork' ? 'cooked-pork' : 'cooked-beef', cook: `Brown the ${short} all over` });
  else if (/mince/.test(nm)) MAINS[id] = M(nm, short, grp, 125, 'simmer pasta wraps bowl bake', { mince: true, cook: `Brown the ${short}, breaking it up` });
  else if (grp === 'fish') MAINS[id] = M(nm, short, 'fish', 140, 'traybake panfry pasta bowl', { roast: 15, cook: `Pan-fry the ${short} 3–4 minutes a side` });
  else MAINS[id] = M(nm, short, grp, 160, 'panfry traybake stirfry bowl wraps', { roast: 25, cook: `Fry the ${short} until golden and cooked through` });
  return true;
}
for (const it of Object.values(ITEM)) if (it.cat === 'veg') ensureVeg(it.id);
// Extras that make a meal yours: cheese, a fried egg, olives, beans...
export const ADDIN_PP = { cheddar: 30, mozzarella: 40, feta: 25, parmesan: 12, halloumi: 50, 'cream-cheese': 25, eggs: 1, olives: 25, capers: 6, jalapenos: 12, sweetcorn: 50, 'kidney-beans': 70, chickpeas: 70, 'butter-beans': 70, bacon: 30, chorizo: 25, ham: 30, nuts: 12, avocado: 0.5, 'spring-onion': 1, 'cherry-tomato': 50, coleslaw: 50, salsa: 30, 'sesame-oil': 3, mayo: 12, yogurt: 30, 'sour-cream': 20 };
const ADDIN_TEXT = { eggs: 'Top each plate with a fried egg.', olives: 'Scatter over the olives.', capers: 'Scatter over the capers.', jalapenos: 'Add jalapeños for a kick.', sweetcorn: 'Stir in the sweetcorn to heat through.', 'kidney-beans': 'Stir in the drained beans to heat through.', chickpeas: 'Stir in the drained chickpeas.', 'butter-beans': 'Stir in the drained butter beans.', bacon: 'Fry the bacon until crisp and crumble over.', chorizo: 'Fry the chorizo until crisp and scatter over.', ham: 'Tear over the ham.', nuts: 'Toast the nuts and scatter over.', avocado: 'Serve with sliced avocado.', 'spring-onion': 'Finish with sliced spring onion.', 'cherry-tomato': 'Halve the cherry tomatoes and add at the end.', coleslaw: 'Serve with coleslaw.', salsa: 'Serve with salsa.', 'sesame-oil': 'Finish with a drizzle of sesame oil.', mayo: 'Drizzle with a little mayo.', yogurt: 'Serve with a spoon of yogurt.' };
const ADDIN_FAM = { cheddar: 'british american mex', mozzarella: 'italian', feta: 'med mideast', parmesan: 'italian med', halloumi: 'med mideast', 'cream-cheese': 'american british', eggs: 'asian british american mex med thai', olives: 'med italian', capers: 'italian med', jalapenos: 'mex american', sweetcorn: 'mex american asian british', 'kidney-beans': 'mex american', chickpeas: 'mideast indian med', 'butter-beans': 'med italian british', bacon: 'british american italian french', chorizo: 'med mex', ham: 'british italian french', nuts: 'asian thai indian med', avocado: 'mex american', 'spring-onion': 'asian thai mex', 'cherry-tomato': 'italian med', coleslaw: 'american british', salsa: 'mex', 'sesame-oil': 'asian', mayo: 'american british', yogurt: 'indian mideast med' };
const ADDIN_METHODS = { eggs: 'bowl friedrice hash loaded salad noodlesoup', cheddar: 'quesadilla loaded flatbread bake pasta frittata pie hash wraps burgers', mozzarella: 'flatbread bake pasta quesadilla frittata', feta: 'salad traybake flatbread wraps bowl frittata pasta', parmesan: 'pasta risotto bake salad', halloumi: 'salad traybake bowl wraps', 'cream-cheese': 'pasta bake quesadilla', bacon: 'pasta risotto hash salad loaded soup frittata', chorizo: 'pasta risotto hash shakshuka soup flatbread', ham: 'quesadilla flatbread frittata pasta salad' };
const VEG_FOR = { roast: ['hard', 'firm', 'quick'], pulled: ['side', 'firm'], braise: ['hard', 'firm'], sticky: ['side', 'quick'], soup: ['hard', 'firm', 'quick', 'leafy'], noodlesoup: ['firm', 'quick', 'leafy'], frittata: ['firm', 'quick', 'leafy'], shakshuka: ['firm', 'leafy'], hash: ['firm', 'quick', 'leafy', 'hard'], loaded: ['quick', 'side', 'firm'], quesadilla: ['firm', 'quick', 'leafy'], flatbread: ['firm', 'quick', 'leafy'], pie: ['hard', 'firm', 'quick', 'leafy'], salad: ['side', 'quick', 'leafy', 'firm'], risotto: ['firm', 'quick', 'leafy'], traybake: ['hard', 'firm', 'quick'], panfry: ['firm', 'quick', 'leafy', 'hard'], stirfry: ['firm', 'quick', 'leafy'], friedrice: ['firm', 'quick'], pasta: ['firm', 'quick', 'leafy'], simmer: ['hard', 'firm', 'quick', 'leafy'], curry: ['hard', 'firm', 'quick', 'leafy'], wraps: ['firm', 'side'], bowl: ['firm', 'quick', 'side', 'leafy'], bake: ['firm', 'quick', 'leafy', 'hard'], burgers: ['side'] };
// Ways of cooking: base minutes before the main's own time is considered
export const METHODS = {
  traybake: { n: 'traybake', t: 45, easyClean: true }, panfry: { n: 'pan-fry', t: 30 }, stirfry: { n: 'stir-fry', t: 20 }, friedrice: { n: 'fried rice', t: 20 },
  pasta: { n: 'pasta', t: 25 }, simmer: { n: 'one-pot', t: 40, batch: true }, curry: { n: 'curry', t: 35, batch: true }, wraps: { n: 'wraps', t: 25 },
  bowl: { n: 'bowl', t: 30 }, bake: { n: 'bake', t: 45, batch: true }, burgers: { n: 'burgers', t: 30 },
  soup: { n: 'soup', t: 35, batch: true }, noodlesoup: { n: 'noodle soup', t: 25 }, frittata: { n: 'frittata', t: 25 }, shakshuka: { n: 'baked eggs', t: 30 }, hash: { n: 'hash', t: 30 },
  loaded: { n: 'loaded potatoes', t: 30 }, roast: { n: 'roast', t: 90, slow: true, joint: true }, pulled: { n: 'slow-cooked & pulled', t: 300, slow: true, joint: true }, braise: { n: 'pot roast', t: 180, slow: true, batch: true }, sticky: { n: 'sticky oven bake', t: 60 }, quesadilla: { n: 'quesadillas', t: 20 }, flatbread: { n: 'flatbread pizza', t: 20 }, pie: { n: 'pie', t: 50, batch: true }, salad: { n: 'warm salad', t: 25 }, risotto: { n: 'risotto', t: 35 }
};
// Flavour kits. core/extra: [item, per person, unit]. Each kit lists what it works with, so nothing weird gets paired.
const K = (n, adj, o) => ({ n, adj, spice: 0, feel: '', tags: [], extra: [], finish: '', ...o, vegPref: (o.vegPref || '').split(' ').filter(Boolean), methods: o.methods.split(' '), mains: o.mains === 'all' ? null : o.mains.split(' '), bases: o.bases.split(' ') });
export const KITS = {
  smokybbq: K('Smoky BBQ', 'smoky BBQ', { feel: 'American', spice: 1, tags: ['fl:smoky', 'fl:sweet'], core: [['bbq-sauce', 30, 'g'], ['paprika', 0.5, 'tsp']], extra: [['garlic', 1, '']], rub: 'smoked paprika, salt and a little oil', sauce: 'the BBQ sauce', methods: 'pulled sticky roast loaded flatbread hash quesadilla traybake panfry wraps bowl burgers', mains: 'pork-roast beef-brisket pork-ribs chicken-wings chicken-drum pork-belly whole-chicken cooked-pork cooked-beef bacon cooked-chicken chorizo ham chicken-thigh chicken-breast pork-chop sausages beef-mince pork-mince halloumi chickpeas nuggets', bases: 'buns rice chips wraps pitta naan potato sweet-potato chips rice wraps buns', vegPref: 'sweetcorn onion pepper coleslaw red-onion', words: 'bbq barbecue smoky pulled' }),
  garliclemon: K('Garlic & lemon', 'garlic & lemon', { feel: 'Mediterranean', tags: ['fl:zesty', 'fl:herby'], core: [['lemon', 0.25, ''], ['garlic', 1, '']], extra: [['thyme', 2, 'g']], rub: 'crushed garlic, lemon zest, thyme, salt and olive oil', sauce: 'a squeeze of lemon', methods: 'roast salad risotto traybake panfry pasta bowl', mains: 'whole-chicken lamb-leg pork-roast lamb-chops pork-fillet turkey-breast chicken-drum duck-breast tuna eggs butter-beans chicken-thigh chicken-breast salmon white-fish prawns pork-chop halloumi chickpeas', bases: 'potato risotto-rice potato couscous rice pasta gnocchi', vegPref: 'courgette green-beans cherry-tomato broccoli spinach red-onion', words: 'lemon garlic herb zesty' }),
  sweetchilli: K('Sweet chilli', 'sweet chilli', { feel: 'Thai', spice: 1, tags: ['fl:sweet', 'fl:spicy'], core: [['sweet-chilli', 20, 'ml'], ['soy-sauce', 7, 'ml']], extra: [['spring-onion', 1, ''], ['garlic', 1, '']], sauce: 'sweet chilli sauce and a splash of soy', finish: 'spring onion', methods: 'sticky noodlesoup salad stirfry bowl wraps friedrice traybake', mains: 'chicken-wings cooked-pork turkey-breast eggs chicken-thigh chicken-breast prawns salmon pork-mince nuggets tofu cooked-chicken halloumi', bases: 'rice noodles couscous rice noodles wraps', vegPref: 'pepper broccoli sugar-snap frozen-veg onion carrot', words: 'sweet chilli thai' }),
  soyhoney: K('Soy, honey & garlic', 'sticky soy & honey', { feel: 'Chinese', tags: ['fl:sweet'], core: [['soy-sauce', 15, 'ml'], ['honey', 10, 'g'], ['garlic', 1, '']], extra: [['ginger', 5, 'g'], ['spring-onion', 1, '']], sauce: 'soy, honey, crushed garlic and grated ginger', finish: 'spring onion', methods: 'sticky pulled noodlesoup stirfry traybake bowl friedrice panfry', mains: 'pork-belly pork-ribs chicken-wings pork-roast cooked-pork cooked-beef pork-fillet duck-breast eggs chicken-thigh chicken-breast salmon pork-chop pork-mince beef-mince tofu prawns steak cooked-chicken', bases: 'rice noodles rice noodles basmati', vegPref: 'broccoli pepper sugar-snap frozen-veg carrot spinach', words: 'sticky honey soy garlic korean chinese' }),
  teriyaki: K('Teriyaki', 'teriyaki', { feel: 'Japanese', tags: ['fl:sweet'], core: [['soy-sauce', 15, 'ml'], ['honey', 10, 'g'], ['ginger', 5, 'g']], extra: [['vinegar', 5, 'ml'], ['spring-onion', 1, '']], sauce: 'soy, honey, a splash of vinegar and grated ginger, bubbled until glossy', finish: 'spring onion', methods: 'sticky noodlesoup stirfry bowl panfry traybake', mains: 'chicken-wings pork-belly duck-breast pork-fillet cooked-pork eggs salmon chicken-thigh chicken-breast tofu steak prawns', bases: 'rice noodles rice noodles', vegPref: 'broccoli sugar-snap pepper frozen-veg green-beans', words: 'teriyaki japanese' }),
  sweetsour: K('Sweet & sour', 'sweet & sour', { feel: 'Chinese', tags: ['fl:sweet'], core: [['ketchup', 20, 'g'], ['vinegar', 10, 'ml'], ['soy-sauce', 7, 'ml'], ['honey', 7, 'g']], sauce: 'ketchup, vinegar, soy and honey', methods: 'stirfry bowl', mains: 'chicken-breast chicken-thigh pork-mince prawns tofu nuggets', bases: 'rice noodles', vegPref: 'pepper onion frozen-veg carrot', words: 'sweet sour' }),
  fajita: K('Fajita spice', 'fajita', { feel: 'Mexican', spice: 1, tags: ['fl:smoky'], core: [['paprika', 1, 'tsp'], ['cumin', 0.5, 'tsp'], ['chilli-powder', 0.25, 'tsp']], extra: [['lime', 0.25, ''], ['salsa', 30, 'g']], rub: 'paprika, cumin, a pinch of chilli powder and salt', finish: 'lime and salsa', methods: 'pulled wraps bowl traybake', mains: 'pork-roast cooked-pork cooked-beef turkey-breast chicken-breast chicken-thigh steak prawns halloumi kidney-beans cooked-chicken', bases: 'wraps wraps rice', vegPref: 'pepper onion red-onion avocado salad', words: 'fajita fajitas mexican tex' }),
  taco: K('Taco spice', 'taco', { feel: 'Mexican', spice: 1, tags: ['fl:smoky'], core: [['chilli-powder', 0.5, 'tsp'], ['cumin', 0.5, 'tsp'], ['tomato-puree', 10, 'g']], extra: [['cheddar', 30, 'g'], ['salsa', 30, 'g']], sauce: 'chilli powder, cumin, a squeeze of tomato purée and a splash of water', finish: 'grated cheese and salsa', methods: 'pulled quesadilla loaded wraps bowl bake', mains: 'pork-roast beef-brisket cooked-pork cooked-beef cooked-chicken chorizo beef-mince turkey-mince pork-mince kidney-beans chicken-thigh', bases: 'wraps rice chips wraps rice potato', vegPref: 'onion sweetcorn pepper salad avocado', words: 'taco tacos burrito nachos quesadilla mexican' }),
  chilli: K('Chilli', 'chilli', { feel: 'Mexican', spice: 2, tags: ['fl:spicy', 'fl:smoky'], core: [['chopped-tomatoes', 200, 'g'], ['chilli-powder', 0.5, 'tsp'], ['cumin', 0.5, 'tsp']], extra: [['kidney-beans', 100, 'g'], ['garlic', 1, '']], sauce: 'a tin of chopped tomatoes, chilli powder, cumin and garlic', finish: 'a spoon of yogurt or soured cream', methods: 'braise loaded quesadilla simmer bake bowl', mains: 'beef-brisket cooked-beef chorizo beef-mince turkey-mince pork-mince chickpeas kidney-beans', bases: 'rice chips rice potato wraps', vegPref: 'onion pepper sweetcorn carrot', words: 'chilli chili con carne' }),
  tomatoherb: K('Tomato & herb', 'tomato & herb', { feel: 'Italian', tags: ['fl:herby'], core: [['chopped-tomatoes', 200, 'g'], ['garlic', 1, ''], ['oregano', 0.5, 'tsp']], extra: [['parmesan', 15, 'g'], ['basil', 3, 'g']], sauce: 'a tin of chopped tomatoes, garlic and oregano', finish: 'parmesan', methods: 'braise soup shakshuka flatbread pie risotto pasta simmer bake traybake', mains: 'lamb lamb-leg beef-brisket pork-roast chicken-drum cooked-pork cooked-beef chorizo eggs butter-beans ham tuna bacon cooked-chicken beef-mince sausages chicken-thigh chicken-breast white-fish chickpeas lentils prawns pork-mince turkey-mince', bases: 'potato risotto-rice puff-pastry wraps pitta naan pasta spaghetti gnocchi rice bread potato', vegPref: 'onion courgette mushroom spinach pepper aubergine', words: 'italian tomato bolognese ragu marinara napoli arrabbiata' }),
  creamymushroom: K('Creamy garlic mushroom', 'creamy garlic mushroom', { feel: 'French', tags: ['fl:creamy'], core: [['mushroom', 80, 'g'], ['cream', 60, 'ml'], ['garlic', 1, '']], extra: [['mustard', 3, 'g'], ['thyme', 1, 'g']], sauce: 'cream, garlic and a little mustard', methods: 'pie risotto soup panfry pasta bake', mains: 'pork-fillet turkey-breast duck-breast cooked-pork ham salmon chicken-thigh chicken-breast pork-chop steak sausages bacon cooked-chicken', bases: 'risotto-rice puff-pastry bread pasta rice potato gnocchi', vegPref: 'onion spinach peas leek', words: 'creamy mushroom stroganoff' }),
  pesto: K('Pesto', 'pesto', { feel: 'Italian', tags: ['fl:herby'], core: [['pesto', 25, 'g']], extra: [['parmesan', 15, 'g'], ['cherry-tomato', 60, 'g']], sauce: 'pesto', finish: 'parmesan', methods: 'flatbread risotto salad pasta traybake bowl', mains: 'ham tuna eggs chicken-breast chicken-thigh salmon prawns halloumi chickpeas cooked-chicken', bases: 'risotto-rice wraps pitta naan pasta gnocchi potato couscous', vegPref: 'cherry-tomato spinach courgette peas green-beans', words: 'pesto basil' }),
  tikka: K('Tikka-style', 'tikka', { feel: 'Indian', spice: 2, tags: ['fl:spicy', 'fl:creamy'], core: [['curry-paste', 20, 'g'], ['chopped-tomatoes', 100, 'g'], ['yogurt', 40, 'g']], extra: [['garlic', 1, ''], ['ginger', 5, 'g'], ['coriander', 3, 'g']], sauce: 'curry paste, chopped tomatoes and a spoon of yogurt', finish: 'coriander', methods: 'soup curry traybake', mains: 'lamb chicken-drum cooked-lamb cooked-chicken butter-beans chicken-thigh chicken-breast chickpeas prawns lentils white-fish', bases: 'bread rice basmati naan', vegPref: 'onion spinach cauliflower peas pepper', words: 'tikka masala curry indian tandoori butter chicken' }),
  coconutcurry: K('Coconut curry', 'coconut', { feel: 'Thai', spice: 1, tags: ['fl:creamy'], core: [['curry-paste', 20, 'g'], ['coconut-milk', 100, 'ml']], extra: [['garlic', 1, ''], ['ginger', 5, 'g'], ['lime', 0.25, '']], sauce: 'curry paste, then coconut milk', finish: 'a squeeze of lime', methods: 'soup noodlesoup curry', mains: 'chicken-drum cooked-chicken butter-beans chicken-thigh chicken-breast prawns chickpeas white-fish tofu lentils', bases: 'bread noodles rice basmati noodles naan', vegPref: 'pepper green-beans spinach sugar-snap onion butternut', words: 'coconut korma thai green red curry laksa' }),
  cheesybake: K('Cheesy bake', 'cheesy', { feel: 'British', tags: ['fl:cheesy', 'fl:creamy'], core: [['cheddar', 40, 'g'], ['creme-fraiche', 50, 'g']], extra: [['mustard', 3, 'g']], sauce: 'crème fraîche, a little mustard and half the cheese', finish: 'the rest of the cheese', methods: 'pie quesadilla loaded bake pasta', mains: 'ham tuna kidney-beans chicken-thigh chicken-breast bacon sausages cooked-chicken beef-mince', bases: 'puff-pastry wraps chips pasta potato gnocchi', vegPref: 'broccoli leek spinach peas onion', words: 'cheesy bake gratin mac cheese' }),
  cajun: K('Cajun', 'Cajun', { feel: 'American', spice: 2, tags: ['fl:spicy', 'fl:smoky'], core: [['paprika', 1, 'tsp'], ['chilli-powder', 0.25, 'tsp'], ['oregano', 0.25, 'tsp'], ['garlic', 1, '']], rub: 'paprika, oregano, garlic, a pinch of chilli and salt', methods: 'sticky roast hash salad traybake panfry bowl wraps', mains: 'chicken-wings whole-chicken chicken-drum pork-fillet turkey-breast chorizo cooked-chicken chicken-thigh chicken-breast salmon prawns sausages halloumi', bases: 'rice chips potato couscous rice potato sweet-potato wraps', vegPref: 'pepper red-onion sweetcorn onion', words: 'cajun creole jambalaya' }),
  cajuncream: K('Creamy Cajun', 'creamy Cajun', { feel: 'American', spice: 1, tags: ['fl:creamy', 'fl:spicy'], core: [['paprika', 1, 'tsp'], ['chilli-powder', 0.25, 'tsp'], ['garlic', 1, ''], ['cream', 60, 'ml']], extra: [['parmesan', 10, 'g']], sauce: 'paprika, garlic and a pinch of chilli, then the cream', methods: 'pasta panfry', mains: 'chicken-breast chicken-thigh prawns sausages salmon', bases: 'pasta rice', vegPref: 'pepper onion spinach', words: 'cajun creamy' }),
  peri: K('Peri-peri', 'peri-peri', { feel: 'Portuguese', spice: 2, tags: ['fl:spicy', 'fl:zesty'], core: [['paprika', 1, 'tsp'], ['chilli', 0.5, ''], ['lemon', 0.25, ''], ['garlic', 1, '']], rub: 'paprika, chopped chilli, garlic, lemon juice and oil', methods: 'roast sticky salad hash traybake wraps burgers bowl', mains: 'whole-chicken chicken-wings chicken-drum chorizo chicken-thigh chicken-breast halloumi prawns', bases: 'chips rice potato couscous rice chips wraps buns potato', vegPref: 'pepper red-onion sweetcorn salad coleslaw', words: 'peri piri nandos portuguese' }),
  greek: K('Greek-style', 'Greek', { feel: 'Greek', tags: ['fl:zesty', 'fl:herby'], core: [['oregano', 0.5, 'tsp'], ['lemon', 0.25, ''], ['garlic', 1, '']], extra: [['feta', 30, 'g'], ['yogurt', 40, 'g'], ['cucumber', 0.15, '']], rub: 'oregano, lemon, garlic and olive oil', finish: 'feta and a quick yogurt-cucumber dip', methods: 'roast pulled salad flatbread traybake wraps bowl', mains: 'lamb-leg whole-chicken lamb-chops chicken-drum cooked-lamb turkey-breast eggs butter-beans chicken-thigh chicken-breast lamb-mince halloumi chickpeas pork-chop', bases: 'pitta wraps pitta naan pitta wraps rice potato couscous', vegPref: 'red-onion pepper cucumber courgette cherry-tomato salad', words: 'greek souvlaki gyros kofta feta tzatziki' }),
  moroccan: K('Moroccan-spiced', 'Moroccan', { feel: 'Moroccan', spice: 1, tags: ['fl:sweet'], core: [['cumin', 0.5, 'tsp'], ['cinnamon', 0.25, 'tsp'], ['paprika', 0.5, 'tsp']], extra: [['honey', 5, 'g'], ['lemon', 0.25, '']], rub: 'cumin, cinnamon, paprika, a little honey and oil', sauce: 'cumin, cinnamon and paprika, then a tin of tomatoes', methods: 'roast braise pulled soup salad shakshuka traybake simmer bowl', mains: 'lamb-leg lamb chicken-drum cooked-lamb eggs butter-beans chicken-thigh lamb-mince chickpeas sweet-potato', bases: 'couscous bread couscous rice', vegPref: 'red-onion carrot butternut courgette pepper', words: 'moroccan tagine harissa' }),
  honeymustard: K('Honey & mustard', 'honey mustard', { feel: 'Irish', tags: ['fl:sweet'], core: [['honey', 10, 'g'], ['mustard', 8, 'g']], extra: [['thyme', 1, 'g']], rub: 'honey, mustard and thyme', sauce: 'honey and mustard', methods: 'roast sticky traybake panfry', mains: 'gammon pork-roast pork-belly pork-fillet pork-ribs chicken-wings chicken-drum sausages pork-chop chicken-thigh chicken-breast salmon', bases: 'potato chips potato rice', vegPref: 'carrot broccoli green-beans red-onion', words: 'honey mustard glazed' }),
  roastgravy: K('Roast dinner', 'roast', { feel: 'Irish', tags: [], core: [['gravy', 15, 'g']], extra: [['thyme', 1, 'g'], ['rosemary', 1, 'g']], rub: 'salt, pepper, thyme and rosemary', sauce: 'gravy', finish: 'gravy', methods: 'roast braise pie hash traybake panfry', mains: 'pork-roast beef-roast lamb-leg whole-chicken gammon pork-belly chicken-drum lamb-chops turkey-breast pork-fillet cooked-pork cooked-beef cooked-lamb cooked-chicken bacon chicken-thigh sausages pork-chop chicken-breast', bases: 'potato puff-pastry potato potato', vegPref: 'carrot broccoli peas green-beans onion', words: 'roast gravy sunday dinner bangers mash' }),
  carbonara: K('Carbonara-style', 'carbonara-style', { feel: 'Italian', tags: ['fl:creamy', 'fl:cheesy'], core: [['parmesan', 20, 'g'], ['eggs', 1, '']], extra: [['garlic', 1, '']], sauce: 'beaten egg and parmesan, tossed off the heat', methods: 'pasta', mains: 'bacon chicken-breast', bases: 'spaghetti pasta', vegPref: 'peas onion', words: 'carbonara' }),
  egg: K('Egg fried rice', 'egg-fried', { feel: 'Chinese', tags: [], core: [['soy-sauce', 10, 'ml'], ['eggs', 1, '']], extra: [['spring-onion', 1, ''], ['garlic', 1, '']], sauce: 'soy sauce', finish: 'spring onion', methods: 'friedrice', mains: 'cooked-pork cooked-beef chicken-thigh chicken-breast prawns bacon cooked-chicken tofu eggs pork-mince', bases: 'rice', vegPref: 'peas frozen-veg onion sweetcorn pepper', words: 'fried rice' }),
  buffalo: K('Buffalo', 'buffalo', { feel: 'American', spice: 2, tags: ['fl:spicy'], core: [['hot-sauce', 10, 'ml'], ['butter', 8, 'g']], extra: [['mayo', 15, 'g']], sauce: 'hot sauce melted with a little butter', methods: 'sticky wraps burgers traybake', mains: 'chicken-wings chicken-drum chicken-breast chicken-thigh nuggets cooked-chicken', bases: 'chips wraps buns potato', vegPref: 'salad coleslaw', words: 'buffalo hot wings' }),
  burger: K('Classic burger', 'classic', { feel: 'American', tags: ['fl:cheesy'], core: [['cheese-slices', 1, ''], ['ketchup', 15, 'g']], extra: [['mayo', 10, 'g'], ['salad', 20, 'g']], sauce: 'ketchup and mayo', methods: 'burgers wraps', mains: 'beef-mince chicken-breast halloumi pork-mince turkey-mince fish-fingers nuggets', bases: 'buns chips wraps potato', vegPref: 'salad coleslaw', words: 'burger cheeseburger smash' }),
  stew: K('Rich stew', 'rich', { feel: 'Irish', tags: [], core: [['stock', 0.5, ''], ['tomato-puree', 10, 'g']], extra: [['thyme', 1, 'g'], ['worcestershire', 3, 'ml']], sauce: 'stock, a squeeze of tomato purée and a dash of Worcestershire', methods: 'braise pie soup simmer', mains: 'beef-brisket beef-roast lamb lamb-leg pork-roast diced-beef chorizo butter-beans diced-beef sausages chicken-thigh beef-mince lentils', bases: 'potato bread puff-pastry bread potato bread rice', vegPref: 'carrot onion leek', words: 'stew casserole hotpot coddle irish' })
};


/* ================= Cupboard flavours: invented from what you have ================= */
// role, families, per person amount, unit, short name for titles
const FAM = { asian: 'Asian', thai: 'Thai', indian: 'Indian', med: 'Mediterranean', italian: 'Italian', mex: 'Mexican', american: 'American', british: 'Irish', french: 'French', mideast: 'Middle Eastern' };
const ALLF = Object.keys(FAM);
const CP = (role, fam, pp, unit, word, o = {}) => ({ role, fam: fam === '*' ? ALLF : fam.split(' '), pp, unit, word, ...o });
export const COMP = {
  lemon: CP('acid', 'med italian british french mideast american', 0.25, '', 'lemon'), lime: CP('acid', 'thai asian mex indian', 0.25, '', 'lime'), vinegar: CP('acid', 'asian british american med french', 5, 'ml', 'vinegar'), capers: CP('acid', 'italian med french', 8, 'g', 'caper'),
  honey: CP('sweet', '*', 8, 'g', 'honey'), 'sweet-chilli': CP('sweet', 'asian thai', 15, 'ml', 'sweet chilli', { heat: 1 }), ketchup: CP('sweet', 'american british asian', 15, 'g', 'ketchup'), 'bbq-sauce': CP('sweet', 'american british', 25, 'g', 'BBQ', { smoky: 1 }),
  'soy-sauce': CP('umami', 'asian thai', 12, 'ml', 'soy'), 'oyster-sauce': CP('umami', 'asian', 10, 'ml', 'oyster sauce'), 'fish-sauce': CP('umami', 'thai', 5, 'ml', 'fish sauce'), worcestershire: CP('umami', 'british american', 4, 'ml', 'Worcestershire'),
  parmesan: CP('umami', 'italian med', 15, 'g', 'parmesan', { cheese: 1 }), 'tomato-puree': CP('umami', 'italian med mex indian american british mideast', 10, 'g', 'tomato'), stock: CP('liquid', '*', 0.5, '', 'stock'), mustard: CP('umami', 'british french american', 6, 'g', 'mustard'),
  garlic: CP('aroma', '*', 1, '', 'garlic'), ginger: CP('aroma', 'asian thai indian', 5, 'g', 'ginger'), 'spring-onion': CP('aroma', 'asian thai mex', 1, '', 'spring onion'), chilli: CP('heat', 'asian thai indian mex med', 0.5, '', 'chilli', { heat: 1 }), 'sesame-oil': CP('aroma', 'asian', 3, 'ml', 'sesame'),
  paprika: CP('spice', 'mex american med mideast british', 1, 'tsp', 'smoky paprika', { smoky: 1 }), cumin: CP('spice', 'mex indian mideast', 0.5, 'tsp', 'cumin'), 'curry-powder': CP('spice', 'indian british', 1, 'tsp', 'curry'), 'chilli-powder': CP('heat', 'mex indian american', 0.25, 'tsp', 'chilli', { heat: 1 }), cinnamon: CP('spice', 'mideast indian', 0.25, 'tsp', 'cinnamon'),
  oregano: CP('herb', 'italian med mex', 0.5, 'tsp', 'oregano'), thyme: CP('herb', 'british french med', 1, 'g', 'thyme'), rosemary: CP('herb', 'italian british french med', 1, 'g', 'rosemary'), basil: CP('herb', 'italian med thai', 3, 'g', 'basil'), parsley: CP('herb', 'med french british mideast', 3, 'g', 'parsley'), coriander: CP('herb', 'thai indian mex asian mideast', 3, 'g', 'coriander'), mint: CP('herb', 'mideast indian med', 2, 'g', 'mint'),
  'garam-masala': CP('spice', 'indian', 1, 'tsp', 'garam masala'), turmeric: CP('spice', 'indian mideast', 0.5, 'tsp', 'golden'), 'ground-coriander': CP('spice', 'indian mideast', 0.5, 'tsp', 'coriander'), 'five-spice': CP('spice', 'asian', 0.5, 'tsp', 'five-spice'),
  'cajun-spice': CP('spice', 'american', 1, 'tsp', 'cajun', { heat: 1 }), 'fajita-mix': CP('spice', 'mex', 1.5, 'tsp', 'fajita', { smoky: 1 }), 'peri-spice': CP('spice', 'american med', 1, 'tsp', 'peri-peri', { heat: 1 }), 'chilli-flakes': CP('heat', 'italian med asian', 0.25, 'tsp', 'chilli', { heat: 1 }),
  'mixed-herbs': CP('herb', 'italian med british french', 1, 'tsp', 'herby'), 'dried-thyme': CP('herb', 'british french med', 0.5, 'tsp', 'thyme'), 'dried-rosemary': CP('herb', 'italian british med', 0.5, 'tsp', 'rosemary'), 'garlic-granules': CP('aroma', '*', 0.5, 'tsp', 'garlic'),
  'curry-paste': CP('paste', 'indian thai', 20, 'g', 'curry', { heat: 1 }), sriracha: CP('heat', 'asian american', 8, 'ml', 'sriracha', { heat: 1 }), 'hot-sauce': CP('heat', 'american mex', 6, 'ml', 'hot sauce', { heat: 1 }), jalapenos: CP('heat', 'mex american', 15, 'g', 'jalapeño', { heat: 1 }),
  'coconut-milk': CP('liquid', 'thai indian asian', 100, 'ml', 'coconut', { rich: 1 }), cream: CP('liquid', 'french italian british american', 60, 'ml', 'creamy', { rich: 1, dairy: 1 }), 'double-cream': CP('liquid', 'french italian british', 50, 'ml', 'creamy', { rich: 1, dairy: 1 }), 'chopped-tomatoes': CP('liquid', 'italian med mex indian mideast british american', 200, 'g', 'tomato'), passata: CP('liquid', 'italian med mex indian british', 150, 'g', 'tomato'),
  'creme-fraiche': CP('rich', 'french british italian', 50, 'g', 'crème fraîche', { dairy: 1 }), yogurt: CP('rich', 'indian mideast med', 40, 'g', 'yogurt', { dairy: 1 }), butter: CP('rich', 'french british american italian', 10, 'g', 'butter', { dairy: 1 }), 'cream-cheese': CP('rich', 'american british italian', 30, 'g', 'cream cheese', { dairy: 1 }), pesto: CP('rich', 'italian', 25, 'g', 'pesto'), 'peanut-butter': CP('rich', 'asian thai', 15, 'g', 'peanut', { nut: 1 })
};
const STYLE = { wet: 'simmer curry pasta bake soup noodlesoup pie risotto shakshuka braise', glaze: 'stirfry friedrice bowl panfry sticky', dry: 'traybake wraps burgers loaded hash flatbread quesadilla salad frittata roast pulled' };
const styleOf = m => Object.keys(STYLE).find(k => STYLE[k].split(' ').includes(m));
const FAMBASES = { asian: 'rice noodles', thai: 'rice noodles', indian: 'rice basmati naan bread', mex: 'wraps rice potato chips sweet-potato', italian: 'pasta spaghetti gnocchi risotto-rice bread potato wraps puff-pastry', med: 'couscous potato pitta rice pasta bread wraps', american: 'potato chips buns wraps rice sweet-potato', british: 'potato rice pasta bread puff-pastry chips', french: 'potato rice pasta bread puff-pastry risotto-rice', mideast: 'couscous pitta rice bread' };
const FISH_BAD = ['bbq-sauce', 'ketchup', 'peanut-butter', 'cream-cheese', 'cinnamon', 'worcestershire'];
const DYN = {};
export const kitOf = id => KITS[id] || DYN[id] || rebuildKit(id);
function makeKit(fam, comps, style) {
  const C2 = comps.map(c => COMP[c]);
  const heat = C2.reduce((a, c) => a + (c.heat || 0), 0);
  const tags = []; if (C2.some(c => c.rich && c !== COMP.butter) || comps.includes('creme-fraiche') || comps.includes('cream-cheese')) tags.push('fl:creamy'); if (heat) tags.push('fl:spicy'); if (C2.some(c => c.smoky)) tags.push('fl:smoky'); if (C2.some(c => c.role === 'acid')) tags.push('fl:zesty'); if (C2.some(c => c.role === 'sweet')) tags.push('fl:sweet'); if (C2.some(c => c.role === 'herb') || comps.includes('pesto')) tags.push('fl:herby'); if (comps.includes('parmesan')) tags.push('fl:cheesy');
  const sigOld = comps.filter(c => !['garlic', 'stock', 'butter'].includes(c)).sort((a, b) => ({ liquid: 0, paste: 1, rich: 2, sweet: 3, umami: 4, spice: 5, acid: 6, heat: 7, herb: 8, aroma: 9 })[COMP[a].role] - ({ liquid: 0, paste: 1, rich: 2, sweet: 3, umami: 4, spice: 5, acid: 6, heat: 7, herb: 8, aroma: 9 })[COMP[b].role]);
  const BASEW = { 'chopped-tomatoes': 'tomato', passata: 'tomato', 'coconut-milk': 'coconut', cream: 'creamy', 'double-cream': 'creamy', 'creme-fraiche': 'creamy', 'curry-paste': 'curry', pesto: 'pesto', 'peanut-butter': 'satay', yogurt: 'yogurt', 'cream-cheese': 'creamy', 'bbq-sauce': 'BBQ', 'sweet-chilli': 'sweet chilli' };
  const ACC = { paprika: 'smoky', cumin: 'cumin', 'curry-powder': 'curried', 'chilli-powder': 'chilli', chilli: 'chilli', cinnamon: 'spiced', lemon: 'lemony', lime: 'lime', vinegar: 'tangy', capers: 'caper', honey: 'honey', ketchup: 'sticky', 'soy-sauce': 'soy', 'oyster-sauce': 'savoury', 'fish-sauce': 'savoury', worcestershire: 'savoury', parmesan: 'parmesan', mustard: 'mustard', ginger: 'ginger', 'spring-onion': 'spring onion', 'sesame-oil': 'sesame', oregano: 'herby', thyme: 'thyme', rosemary: 'rosemary', basil: 'basil', parsley: 'herby', coriander: 'coriander', mint: 'minty', sriracha: 'sriracha', 'hot-sauce': 'hot', jalapenos: 'jalapeño', 'tomato-puree': 'tomato', butter: 'buttery', 'cream-cheese': 'creamy', yogurt: 'yogurt', 'coconut-milk': 'coconut', 'bbq-sauce': 'BBQ', 'sweet-chilli': 'sweet chilli' };
  const ORDER = ['paprika', 'curry-powder', 'cumin', 'honey', 'lime', 'lemon', 'ginger', 'soy-sauce', 'chilli', 'chilli-powder', 'sriracha', 'mustard', 'parmesan', 'basil', 'coriander', 'mint', 'rosemary', 'thyme', 'oregano', 'parsley', 'capers', 'vinegar', 'sesame-oil', 'cinnamon', 'hot-sauce', 'jalapenos', 'ketchup', 'worcestershire', 'oyster-sauce', 'fish-sauce', 'tomato-puree', 'spring-onion', 'butter'];
  const baseC = comps.find(c => BASEW[c]), accs = ORDER.filter(c => comps.includes(c) && ACC[c] !== (baseC && BASEW[baseC]));
  let name;
  if (baseC) name = `${accs[0] ? ACC[accs[0]] + ' ' : 'garlicky '}${BASEW[baseC]}`;
  else if (accs.length >= 2) { const ADJ = new Set(['smoky', 'curried', 'spiced', 'tangy', 'herby', 'minty', 'sticky', 'savoury', 'hot', 'buttery', 'lemony']); const NOUN = { lemony: 'lemon', herby: 'herb', minty: 'mint', curried: 'curry', spiced: 'spice', tangy: 'vinegar', savoury: 'soy', buttery: 'butter', sticky: 'ketchup', hot: 'hot sauce' }; const a0 = ACC[accs[0]], a1 = ACC[accs[1]]; name = ADJ.has(a0) ? `${a0} ${NOUN[a1] || a1}` : ADJ.has(a1) ? `${a1} ${NOUN[a0] || a0}` : `${a0} & ${a1}`; name = name.replace(/^honey & soy$|^soy & honey$/, 'honey-soy').replace(/^lime & ginger$|^ginger & lime$/, 'ginger-lime'); }
  else name = `garlic & ${accs[0] ? ACC[accs[0]] : 'herb'}`;
  name = name.replace(/^lemony & /, 'lemon & ').replace(/ & lemony$/, ' & lemon').replace(/^smoky & /, 'smoky ').replace(/^herby & /, 'herby ');
  const PHR = { lemon: 'a squeeze of lemon', lime: 'a squeeze of lime', 'tomato-puree': 'a spoon of tomato purée', 'chilli-powder': 'a pinch of chilli powder', cinnamon: 'a pinch of cinnamon', paprika: 'smoked paprika', honey: 'a little honey', 'soy-sauce': 'a splash of soy sauce', vinegar: 'a splash of vinegar', stock: 'a stock cube', 'chopped-tomatoes': 'a tin of chopped tomatoes', passata: 'passata', 'coconut-milk': 'coconut milk', cream: 'cream', 'double-cream': 'cream', worcestershire: 'a dash of Worcestershire sauce', 'fish-sauce': 'a dash of fish sauce', 'oyster-sauce': 'a spoon of oyster sauce', chilli: 'chopped chilli', garlic: 'garlic', ginger: 'grated ginger', oregano: 'dried oregano', 'sesame-oil': 'a few drops of sesame oil', 'curry-powder': 'curry powder', 'curry-paste': 'curry paste', cumin: 'cumin', parmesan: 'grated parmesan', mustard: 'a spoon of mustard', sriracha: 'a squeeze of sriracha', 'hot-sauce': 'a dash of hot sauce', 'peanut-butter': 'a spoon of peanut butter', 'sweet-chilli': 'sweet chilli sauce', 'bbq-sauce': 'BBQ sauce', ketchup: 'a squeeze of ketchup' };
  const list = comps.map(c => PHR[c] || ITEM[c].n.toLowerCase().replace('dried herbs', 'oregano'));
  const text = list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0];
  const id = 'cx:' + fam + ':' + style + ':' + comps.slice().sort().join('+');
  const k = { id, n: name.charAt(0).toUpperCase() + name.slice(1), adj: name, feel: FAM[fam], fam, spice: heat >= 2 ? 2 : heat, tags, core: comps.map(c => [c, COMP[c].pp, COMP[c].unit]), extra: [], finish: comps.includes('spring-onion') ? 'spring onion' : comps.includes('coriander') ? 'coriander' : comps.includes('parsley') ? 'parsley' : '',
    rub: style === 'dry' ? text + ', salt and a little oil' : null, sauce: style !== 'dry' ? text : comps.some(c => COMP[c].role === 'rich') ? comps.filter(c => COMP[c].role === 'rich').map(c => ITEM[c].n.toLowerCase()).join(' and ') + ' mixed with a little garlic' : null,
    methods: STYLE[style].split(' '), mains: null, bases: FAMBASES[fam].split(' '), vegPref: [], words: '', composed: true, fishOk: !comps.some(c => FISH_BAD.includes(c)) };
  DYN[id] = k; return k;
}
function rebuildKit(id) { const m = /^cx:([a-z]+):([a-z]+):(.+)$/.exec(id || ''); if (!m) return null; const comps = m[3].split('+').filter(c => COMP[c] && ITEM[c]); return comps.length ? makeKit(m[1], comps, m[2]) : null; }
// Invent n flavour combinations from what's available (your stock plus everyday cupboard basics)
export function composeKits(state, stock, n = 14) {
  const usedC = {};
  const avail = c => ITEM[c] && okItem(state, c) && ((stock.get(c) || 0) > 0 || C.stapleHave(state, c) || c === 'garlic');
  const T = partTaste(state), out = [], seen = new Set();
  const famW = ALLF.map(f => { const have = Object.entries(COMP).filter(([c, x]) => x.fam.includes(f) && (stock.get(c) || 0) > 0).length; const liked = Object.entries(KITS).filter(([, k]) => k.feel === FAM[f]).reduce((a, [id]) => a + sq(T.kit[id]), 0); return [f, Math.max(0.2, 1 + have * 0.6 + liked * 0.3)]; });
  const pickW = arr => { let t = Math.random() * arr.reduce((a, x) => a + x[1], 0); for (const x of arr) { t -= x[1]; if (t <= 0) return x[0]; } return arr[arr.length - 1][0]; };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  for (let tries = 0; out.length < n && tries < n * 12; tries++) {
    const fam = pickW(famW), style = rnd(['wet', 'glaze', 'dry', 'dry', 'wet']);
    const pool = role => Object.keys(COMP).filter(c => COMP[c].role === role && COMP[c].fam.includes(fam) && avail(c) && c !== 'garlic-granules');
    const comps = ['garlic'];
    const wpick = c => { const w = c.map(x => 1 / (1 + (usedC[x] || 0) * 0.8)); let t = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < c.length; i++) { t -= w[i]; if (t <= 0) return c[i]; } return c[0]; };
    // choose each component so it pairs with what's already in the kit (real pairing data when loaded)
    const fit = x => { if (!Chef.ready()) return 1; const ps = comps.filter(c => c !== 'garlic').map(c => { const p = Chef.pair(c, x); return p ? p.s : 0.05; }); return ps.length ? Math.exp(4 * (ps.reduce((a, v) => a + v, 0) / ps.length)) : 1; };
    const add = (role, p = 1) => { if (Math.random() > p) return; const c = pool(role).filter(x => !comps.includes(x)); if (!c.length) return; const w = c.map(x => (1 / (1 + (usedC[x] || 0) * 0.8)) * fit(x)); let t = Math.random() * w.reduce((a, v) => a + v, 0); for (let i = 0; i < c.length; i++) { t -= w[i]; if (t <= 0) { comps.push(c[i]); return; } } comps.push(c[0]); };
    if (style === 'wet') { const liq = pool('liquid').concat(pool('paste').length ? ['__paste'] : []); if (!liq.length) continue; const l = rnd(liq); if (l === '__paste') { comps.push(rnd(pool('paste'))); const cl = pool('liquid').filter(x => ['coconut-milk', 'chopped-tomatoes', 'passata', 'stock'].includes(x)); if (!cl.length) continue; comps.push(rnd(cl)); } else comps.push(l); add('spice', 0.8); add('herb', 0.6); add('umami', 0.5); add('heat', 0.3); if (!comps.some(c => COMP[c].rich)) add('rich', 0.25); add('acid', 0.25); add('aroma', 0.4); }
    if (style === 'glaze') { add('umami', 1); add('sweet', 0.85); add('acid', 0.5); add('aroma', 0.7); add('heat', 0.35); add('herb', 0.3); if (fam === 'asian' || fam === 'thai') add('rich', 0.15); }
    if (style === 'dry') { add('spice', 0.9); add('spice', 0.4); add('herb', 0.6); add('acid', 0.6); add('heat', 0.25); add('rich', 0.35); add('sweet', 0.2); }
    // coherence rules
    const has = c => comps.includes(c);
    if (comps.length < 3) continue;
    if (comps.filter(c => COMP[c].role === 'liquid').length > 1 && !(has('stock') && comps.filter(c => COMP[c].role === 'liquid').length === 2)) continue;
    if ((has('cream') || has('double-cream') || has('creme-fraiche') || has('yogurt') || has('cream-cheese')) && (has('soy-sauce') || has('oyster-sauce') || has('fish-sauce') || has('sweet-chilli') || has('ketchup') || has('lime'))) continue;
    if (has('coconut-milk') && (has('parmesan') || has('oregano') || has('cream') || has('mustard'))) continue;
    if (has('peanut-butter') && !(has('soy-sauce') || has('lime') || has('honey'))) continue;
    if (has('cinnamon') && !(has('cumin') || has('chopped-tomatoes') || has('passata') || has('honey'))) continue;
    if (has('pesto') && (has('soy-sauce') || has('curry-paste') || has('cumin'))) continue;
    if (has('mayo') && style === 'wet') continue;
    if (has('ketchup') && (has('coconut-milk') || has('cream'))) continue;
    if (has('ketchup') && (has('curry-powder') || has('garam-masala') || has('turmeric') || has('dried-rosemary'))) continue;
    if ((has('cream') || has('double-cream')) && (has('vinegar') || has('ketchup'))) continue;
    if (has('yogurt') && (has('parmesan') || has('cream') || has('cream-cheese') || has('creme-fraiche'))) continue;
    if (comps.filter(c => COMP[c].cheese).length > 1) continue;
    // the kit must hang together: no strong clashes, decent average pairing
    if (Chef.ready()) { const xs = comps.filter(c => c !== 'garlic' && c !== 'stock'); let t = 0, n2 = 0, worst = 1; for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) { const p = Chef.pair(xs[i], xs[j]); if (!p) continue; t += p.s; n2++; worst = Math.min(worst, p.s); } if (n2 && (t / n2 < 0.03 || worst < -0.06)) continue; }
    const key = fam + style + comps.slice().sort().join('+'); if (seen.has(key)) continue; seen.add(key);
    for (const c of comps) usedC[c] = (usedC[c] || 0) + 1;
    out.push(makeKit(fam, comps, style));
  }
  return out;
}

/* ================= Named dishes (the built-ins, broken into parts) ================= */
const N = (n, main, kit, method, base) => ({ n, main: main.split(' '), kit, method, base: base ? base.split(' ') : null });
const CURED = new Set(['ham', 'bacon', 'chorizo']);
const TEXMEX = ['cheddar', 'salsa', 'sour-cream', 'avocado', 'jalapenos', 'sweetcorn', 'kidney-beans'];
const CURRYV = ['onion', 'pepper', 'spinach', 'peas', 'cauliflower', 'sweet-potato', 'green-beans', 'courgette', 'mushroom', 'aubergine', 'butternut'];
const ROASTV = ['carrot', 'broccoli', 'parsnip', 'green-beans', 'peas', 'cabbage', 'cauliflower', 'onion', 'leek', 'butternut'];
// What belongs in each classic. veg: allowed veg (n = how many), add: allowed extras from your kitchen
export const CANON = {
  'Spaghetti bolognese': { veg: ['onion', 'carrot', 'celery', 'mushroom'], n: 2, add: ['parmesan', 'cheddar', 'bacon'] }, 'Pasta bolognese': { veg: ['onion', 'carrot', 'celery', 'mushroom'], n: 2, add: ['parmesan', 'cheddar', 'bacon'] },
  'Chilli con carne': { veg: ['onion', 'pepper'], add: TEXMEX }, 'Chilli jacket potatoes': { veg: ['onion', 'pepper'], add: TEXMEX }, 'Veggie chilli': { veg: ['onion', 'pepper', 'sweet-potato', 'courgette'], add: TEXMEX },
  'Spaghetti carbonara': { veg: ['mushroom', 'peas'], n: 0, add: ['parmesan'] }, 'Mac & cheese with bacon': { veg: ['broccoli', 'peas', 'spinach'], n: 1, add: ['cheddar', 'parmesan'] },
  'Chicken tikka masala': { veg: CURRYV, add: ['yogurt'] }, 'Chicken korma-style curry': { veg: CURRYV, add: ['yogurt', 'nuts'] }, 'Thai green-style curry': { veg: CURRYV, add: [] }, 'Chickpea curry': { veg: CURRYV, add: ['yogurt'] }, 'Lamb curry': { veg: CURRYV, add: ['yogurt'] }, 'Tarka dal': { veg: ['onion', 'spinach', 'cauliflower'], n: 1, add: ['yogurt'] },
  'Beef stew': { veg: ['onion', 'carrot', 'celery', 'mushroom', 'leek', 'parsnip'], add: ['bacon'] }, 'Sausage casserole': { veg: ['onion', 'carrot', 'pepper', 'celery'], add: ['butter-beans', 'bacon'] }, 'Chicken cacciatore': { veg: ['onion', 'pepper', 'mushroom'], add: ['olives', 'parmesan'] },
  'Chicken fajitas': { veg: ['onion', 'pepper'], add: TEXMEX }, 'Steak fajitas': { veg: ['onion', 'pepper'], add: TEXMEX }, 'Halloumi fajitas': { veg: ['onion', 'pepper'], add: TEXMEX }, 'Prawn fajitas': { veg: ['onion', 'pepper'], add: TEXMEX },
  'Beef tacos': { veg: ['onion', 'pepper', 'salad'], add: TEXMEX }, 'Turkey tacos': { veg: ['onion', 'pepper', 'salad'], add: TEXMEX }, 'Bean burritos': { veg: ['onion', 'pepper'], add: TEXMEX }, 'Burrito bowl': { veg: ['onion', 'pepper', 'salad'], add: TEXMEX }, 'Pulled pork tacos': { veg: ['onion', 'salad'], add: TEXMEX },
  'Chicken stroganoff': { veg: ['onion', 'mushroom'], add: ['sour-cream'] }, 'Steak & creamy mushrooms': { veg: ['mushroom', 'onion', 'spinach'], add: [] }, 'Creamy chicken & mushroom pasta': { veg: ['mushroom', 'onion', 'spinach'], add: ['parmesan'] },
  'Bangers & mash': { veg: ['onion', 'peas', 'carrot', 'cabbage', 'green-beans'], add: [] }, 'Sunday roast pork & crackling': { veg: ROASTV, add: [] }, 'Roast beef dinner': { veg: ROASTV, add: [] }, 'Roast chicken dinner': { veg: ROASTV, add: [] }, 'Roast lamb with rosemary': { veg: ROASTV, add: [] }, 'Honey-glazed gammon': { veg: ROASTV, add: [] }, 'Beef pot roast': { veg: ['onion', 'carrot', 'celery', 'parsnip', 'leek'], add: [] },
  'Egg fried rice': { veg: ['peas', 'onion', 'pepper', 'spring-onion'], add: [] }, 'Chicken fried rice': { veg: ['peas', 'onion', 'pepper', 'carrot'], add: ['eggs'] }, 'Prawn fried rice': { veg: ['peas', 'onion', 'pepper'], add: ['eggs'] }, 'Pork fried rice': { veg: ['peas', 'onion', 'pepper'], add: ['eggs'] },
  'Sweet & sour chicken': { veg: ['pepper', 'onion', 'pineapple', 'carrot'], add: [] }, 'Sweet & sour pork': { veg: ['pepper', 'onion', 'pineapple', 'carrot'], add: [] }, 'Chicken chow mein': { veg: ['pepper', 'onion', 'carrot', 'cabbage', 'mushroom', 'spring-onion'], add: [] },
  'Lamb tagine': { veg: ['onion', 'carrot', 'butternut', 'sweet-potato'], add: ['chickpeas', 'nuts'] }, 'Chickpea tagine': { veg: ['onion', 'carrot', 'butternut', 'sweet-potato', 'courgette'], add: ['nuts'] }, 'Moroccan chicken & couscous': { veg: ['onion', 'pepper', 'courgette', 'carrot'], add: ['chickpeas', 'nuts'] },
  'Cheeseburgers': { veg: ['salad', 'onion', 'tomato'], add: ['cheddar', 'mayo'] }, 'Fish finger sandwiches': { veg: ['salad'], add: ['mayo'] }
};
// Named dishes without their own entry: no cured meats or odd extras, sensible veg for the method
const CANON_DEF = { roast: { veg: ROASTV, add: [] }, curry: { veg: CURRYV, add: ['yogurt'] }, pulled: { add: ['coleslaw', 'cheddar', 'salsa'] }, sticky: { add: ['coleslaw'] }, wraps: { add: TEXMEX.concat(['feta', 'yogurt']) }, traybake: { add: ['feta', 'halloumi', 'olives'] }, burgers: { add: ['cheddar', 'mayo', 'coleslaw'] }, bowl: { add: ['eggs', 'avocado', 'spring-onion', 'sesame-oil'] }, stirfry: { add: ['nuts', 'spring-onion', 'sesame-oil'] }, pasta: { add: ['parmesan'] }, bake: { add: ['cheddar', 'mozzarella', 'parmesan'] }, simmer: { add: [] }, panfry: { add: [] } };
export const NAMED = [
  N('Chicken fajitas', 'chicken-breast chicken-thigh', 'fajita', 'wraps'), N('Steak fajitas', 'steak', 'fajita', 'wraps'), N('Halloumi fajitas', 'halloumi', 'fajita', 'wraps'), N('Prawn fajitas', 'prawns', 'fajita', 'wraps'),
  N('Beef tacos', 'beef-mince', 'taco', 'wraps'), N('Turkey tacos', 'turkey-mince', 'taco', 'wraps'), N('Bean burritos', 'kidney-beans', 'taco', 'wraps'), N('Burrito bowl', 'beef-mince chicken-thigh chicken-breast', 'taco fajita', 'bowl', 'rice'),
  N('Chilli con carne', 'beef-mince', 'chilli', 'simmer', 'rice'), N('Chilli jacket potatoes', 'beef-mince turkey-mince', 'chilli', 'simmer', 'potato'), N('Veggie chilli', 'kidney-beans chickpeas', 'chilli', 'simmer'),
  N('Spaghetti bolognese', 'beef-mince turkey-mince', 'tomatoherb', 'pasta', 'spaghetti'), N('Pasta bolognese', 'beef-mince', 'tomatoherb', 'pasta', 'pasta'), N('Sausage pasta', 'sausages', 'tomatoherb', 'pasta', 'pasta spaghetti'), N('Sausage casserole', 'sausages', 'tomatoherb stew', 'simmer'),
  N('Chicken cacciatore', 'chicken-thigh', 'tomatoherb', 'simmer'), N('Prawn linguine', 'prawns', 'garliclemon tomatoherb', 'pasta', 'pasta spaghetti'), N('Pasta bake', 'beef-mince sausages chicken-breast', 'tomatoherb cheesybake', 'bake', 'pasta'),
  N('Chicken tikka masala', 'chicken-thigh chicken-breast', 'tikka', 'curry'), N('Chickpea curry', 'chickpeas', 'tikka coconutcurry', 'curry'), N('Tarka dal', 'lentils', 'tikka', 'curry'), N('Tandoori chicken traybake', 'chicken-thigh chicken-breast', 'tikka', 'traybake'),
  N('Thai green-style curry', 'chicken-thigh chicken-breast prawns', 'coconutcurry', 'curry'), N('Chicken korma-style curry', 'chicken-thigh chicken-breast', 'coconutcurry', 'curry'),
  N('Teriyaki salmon', 'salmon', 'teriyaki', 'bowl panfry'), N('Teriyaki chicken', 'chicken-thigh chicken-breast', 'teriyaki', 'bowl stirfry'), N('Sweet & sour chicken', 'chicken-breast chicken-thigh', 'sweetsour', 'stirfry'), N('Sweet & sour pork', 'pork-mince', 'sweetsour', 'stirfry'),
  N('Chicken chow mein', 'chicken-breast chicken-thigh', 'soyhoney', 'stirfry', 'noodles'), N('Egg fried rice', 'eggs', 'egg', 'friedrice'), N('Chicken fried rice', 'chicken-thigh chicken-breast cooked-chicken', 'egg', 'friedrice'), N('Prawn fried rice', 'prawns', 'egg', 'friedrice'),
  N('Creamy chicken & mushroom pasta', 'chicken-breast chicken-thigh', 'creamymushroom', 'pasta', 'pasta spaghetti'), N('Chicken stroganoff', 'chicken-breast chicken-thigh', 'creamymushroom', 'panfry', 'rice'), N('Steak & creamy mushrooms', 'steak', 'creamymushroom', 'panfry'),
  N('Spaghetti carbonara', 'bacon', 'carbonara', 'pasta'), N('Creamy Cajun chicken pasta', 'chicken-breast chicken-thigh', 'cajuncream', 'pasta', 'pasta spaghetti'), N('Pesto chicken pasta', 'chicken-breast chicken-thigh cooked-chicken', 'pesto', 'pasta', 'pasta spaghetti'),
  N('Cheesy chicken & broccoli bake', 'chicken-breast chicken-thigh', 'cheesybake', 'bake'), N('Mac & cheese with bacon', 'bacon', 'cheesybake', 'bake pasta', 'pasta'),
  N('Bangers & mash', 'sausages', 'roastgravy', 'panfry', 'potato'), N('Roast chicken traybake', 'chicken-thigh', 'roastgravy', 'traybake', 'potato'), N('Honey mustard sausage traybake', 'sausages', 'honeymustard', 'traybake'),
  N('BBQ chicken traybake', 'chicken-thigh chicken-breast', 'smokybbq', 'traybake'), N('BBQ pulled chicken wraps', 'chicken-thigh chicken-breast', 'smokybbq', 'wraps'),
  N('Peri-peri chicken', 'chicken-thigh chicken-breast', 'peri', 'traybake'), N('Peri-peri chicken wraps', 'chicken-breast chicken-thigh', 'peri', 'wraps'), N('Cajun chicken & rice', 'chicken-thigh chicken-breast', 'cajun', 'bowl panfry', 'rice'),
  N('Greek chicken traybake', 'chicken-thigh', 'greek', 'traybake'), N('Chicken souvlaki pittas', 'chicken-breast chicken-thigh', 'greek', 'wraps'), N('Lamb kofta wraps', 'lamb-mince', 'greek', 'wraps'), N('Halloumi souvlaki', 'halloumi', 'greek', 'wraps traybake'),
  N('Moroccan chicken & couscous', 'chicken-thigh', 'moroccan', 'traybake', 'couscous'), N('Chickpea tagine', 'chickpeas', 'moroccan', 'simmer'),
  N('Cheeseburgers', 'beef-mince', 'burger', 'burgers'), N('Chicken burgers', 'chicken-breast', 'burger buffalo', 'burgers'), N('Halloumi burgers', 'halloumi', 'burger peri', 'burgers'), N('Buffalo chicken wraps', 'chicken-breast nuggets cooked-chicken', 'buffalo', 'wraps'),
  N('Fish finger sandwiches', 'fish-fingers', 'burger', 'burgers'), N('Beef stew', 'diced-beef', 'stew', 'simmer'), N('Sticky honey garlic chicken', 'chicken-thigh', 'soyhoney', 'traybake panfry'), N('Korean-style beef bowl', 'beef-mince steak', 'soyhoney', 'bowl'),
  N('Sunday roast pork & crackling', 'pork-roast', 'roastgravy', 'roast'), N('Roast beef dinner', 'beef-roast', 'roastgravy', 'roast'), N('Roast chicken dinner', 'whole-chicken', 'roastgravy garliclemon', 'roast'), N('Roast lamb with rosemary', 'lamb-leg', 'roastgravy garliclemon', 'roast'), N('Honey-glazed gammon', 'gammon', 'honeymustard', 'roast'),
  N('BBQ pulled pork buns', 'pork-roast', 'smokybbq', 'pulled', 'buns'), N('Pulled pork tacos', 'pork-roast', 'taco', 'pulled', 'wraps'), N('BBQ pulled beef buns', 'beef-brisket', 'smokybbq', 'pulled', 'buns'), N('Pulled lamb flatbreads', 'lamb-leg', 'greek moroccan', 'pulled'),
  N('Sticky BBQ ribs', 'pork-ribs', 'smokybbq', 'sticky'), N('Sticky honey-soy ribs', 'pork-ribs', 'soyhoney', 'sticky'), N('Buffalo wings', 'chicken-wings', 'buffalo', 'sticky'), N('Sticky BBQ wings', 'chicken-wings', 'smokybbq', 'sticky'), N('Crispy pork belly bowl', 'pork-belly', 'soyhoney teriyaki', 'bowl sticky'),
  N('Beef pot roast', 'beef-roast beef-brisket', 'stew', 'braise'), N('Lamb tagine', 'lamb lamb-leg', 'moroccan', 'braise'), N('Lamb curry', 'lamb', 'tikka', 'curry'), N('Pork fried rice', 'cooked-pork', 'egg', 'friedrice'), N('Leftover roast hash', 'cooked-pork cooked-beef cooked-lamb', 'roastgravy', 'hash'),
  N('Lemon garlic salmon', 'salmon', 'garliclemon', 'traybake panfry'), N('Lemon & herb chicken', 'chicken-thigh chicken-breast', 'garliclemon', 'traybake')
];

/* ================= Taste: learn parts from swipes, ratings and reactions ================= */
const METHOD_FROM_TYPE = { 'type:roast': 'traybake', 'type:stirfry': 'stirfry', 'type:pasta': 'pasta', 'type:curry': 'curry', 'type:stew': 'simmer', 'type:soup': 'simmer', 'type:handheld': 'wraps', 'type:pie': 'bake', 'type:salad': 'bowl', 'type:rice': 'bowl', 'type:fry': 'panfry', 'type:pizza': 'bake' };
const TYPE_TO_METHODS = { curry: ['curry'], pasta: ['pasta'], stew: ['simmer'], pie: ['bake'], stirfry: ['stirfry', 'friedrice'], soup: ['simmer'], handheld: ['wraps', 'burgers'], salad: ['bowl'], roast: ['traybake'], rice: ['friedrice', 'bowl'], pizza: ['bake'], fry: ['panfry'] };
export function guessParts(r) {
  if (r.spec && r.spec.kit) return r.spec;
  const ids = new Set(r.ings.map(i => i.item).filter(Boolean)), title = ' ' + norm(r.title) + ' ';
  let main = Object.keys(MAINS).find(id => ids.has(id)) || null;
  let base = Object.keys(BASES).find(id => ids.has(id)) || null;
  let kit = null, best = 0;
  for (const [id, k] of Object.entries(KITS)) { let s = k.core.filter(([it]) => ids.has(it)).length / k.core.length * 2; for (const w of (k.words || '').split(' ')) if (w && title.includes(' ' + w)) s += 1.5; if (r.area && k.feel === r.area) s += 0.4; if (s > best) { best = s; kit = id; } }
  if (best < 1) kit = null;
  let method = null; for (const t of r.tags) if (METHOD_FROM_TYPE[t]) { method = METHOD_FROM_TYPE[t]; break; }
  if (/burger/.test(title)) method = 'burgers'; if (/fried rice/.test(title)) method = 'friedrice'; if (/bowl/.test(title)) method = 'bowl'; if (/traybake|tray bake|sheet pan/.test(title)) method = 'traybake';
  return { main, base, kit, method, veg: [...ids].filter(id => VEG[id]) };
}
let tasteCache = { key: '', t: null };
export function partTaste(state) {
  const key = JSON.stringify([Object.keys(state.dishVotes || {}).length, Object.keys(state.ratings || {}).length, state.partFb ? JSON.stringify(state.partFb).length : 0, JSON.stringify(state.taste || {}), Object.keys(state.likes || {}).length, C.libraryInfo().count]);
  if (tasteCache.key === key) return tasteCache.t;
  const t = { kit: {}, method: {}, main: {}, base: {}, veg: {}, grp: {} }, add = (k, id, v) => { if (id) t[k][id] = (t[k][id] || 0) + v; };
  const all = C.allRecipes(state);
  const learnFrom = (r, w) => { const p = guessParts(r); add('kit', p.kit, w); add('method', p.method, w * 0.7); add('main', p.main, w * 0.6); add('base', p.base, w * 0.4); if (p.main && MAINS[p.main]) add('grp', MAINS[p.main].grp, w * 0.4); for (const v of p.veg || []) add('veg', v, w * 0.2); };
  for (const [id, v] of Object.entries(state.dishVotes || {})) if (v && all[id]) learnFrom(all[id], v > 0 ? 1 : -1.2);
  for (const [id, rt] of Object.entries(state.ratings || {})) if (rt.r && all[id]) learnFrom(all[id], (rt.r - 3) * 0.6);
  const fb = state.partFb || {}; for (const k of Object.keys(t)) for (const [id, v] of Object.entries(fb[k] || {})) add(k, id, v);
  const T = state.taste || {};
  for (const [ty, v] of Object.entries(T.types || {})) for (const m of TYPE_TO_METHODS[ty] || []) add('method', m, v > 0 ? 1.5 : -2.5);
  for (const [fl, v] of Object.entries(T.flavours || {})) for (const [id, k] of Object.entries(KITS)) if (k.tags.includes('fl:' + fl)) add('kit', id, v > 0 ? 1.2 : -2);
  for (const [cu, v] of Object.entries(T.cuisines || {})) for (const [id, k] of Object.entries(KITS)) if (k.feel === cu) add('kit', id, v > 0 ? 1.2 : -2);
  for (const [tag, v] of Object.entries(state.tagPref || {})) { if (tag.startsWith('p:')) add('grp', tag.slice(2), v * 0.4); if (tag.startsWith('type:')) for (const m of TYPE_TO_METHODS[tag.slice(5)] || []) add('method', m, v * 0.3); }
  tasteCache = { key, t }; return t;
}
// process dishes (process.js) have their own techniques; these entries only name them
Object.assign(METHODS, { 'p-bake': { n: 'oven bake', t: 90, slow: true, batch: true }, 'p-pie': { n: 'pie', t: 70, batch: true }, 'p-curry': { n: 'curry', t: 45, batch: true }, 'p-risotto': { n: 'risotto', t: 35 }, 'p-soup': { n: 'soup', t: 35, batch: true }, 'p-roast': { n: 'roast dinner', t: 120, slow: true, joint: true } });
const sq = v => Math.tanh((v || 0) / 3) * 3;

/* ================= Is a part allowed for you? ================= */
export const okItem = (state, id, prep) => { const it = ITEM[id]; if (!it) return false; return C.likeOf(state, { item: id, name: it.n, prep: prep || null }) > -1; };
function spiceCap(state, opts) { if (opts.kids) return 1; const s = (state.taste || {}).spice; return s == null ? 3 : s === 0 ? 0 : s === 1 ? 1 : 3; }
export function kitAllowed(state, kitId, opts = {}) { const k = kitOf(kitId); if (!k) return false; if (k.spice > spiceCap(state, opts)) return false; return k.core.every(([id]) => okItem(state, id)); }

/* ================= Build one meal ================= */
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const join = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const VSHORT = { 'sugar-snap': 'sugar snaps', 'frozen-veg': 'mixed veg', 'cherry-tomato': 'cherry tomatoes', butternut: 'squash', 'green-beans': 'green beans', 'spring-onion': 'spring onions', 'red-onion': 'red onions', salad: 'salad leaves' };
const vegName = id => VSHORT[id] || (ITEM[id].n.toLowerCase().replace(/^frozen /, '').replace(/ mix$/, ''));
const single = w => w.replace(/oes$/, 'o').replace(/ies$/, 'y').replace(/(?<![su])s$/, '');
function qtyFor(id, perPerson, serves, unit) {
  const it = ITEM[id]; let q = perPerson * serves;
  if (unit === 'tsp' || unit === 'tbsp') return { q: Math.max(0.5, Math.round(q * 2) / 2), u: unit };
  if (it.u === 'pc' || unit === '') { const r = Math.max(id === 'garlic' ? 1 : 0.5, Math.round(q * 2) / 2); return { q: r, u: '' }; }
  const step = q > 300 ? 50 : q > 60 ? 10 : 5; return { q: Math.max(step, Math.round(q / step) * step), u: unit || it.u };
}
export function pantryStock(state) { const m = new Map(); for (const p of state.pantry || []) if (p.item) { const k = C.standinOf(p.item); m.set(k, (m.get(k) || 0) + (p.qty || 0)); } return m; }
export function specKey(sp) { return [sp.main, sp.base, sp.kit, sp.method, (sp.veg || []).slice().sort().join('+'), (sp.add || []).slice().sort().join('+')].join('|') + (sp.gear ? '|' + sp.gear : ''); }
// World ingredients: the engine cooks the stand-in; the recipe shows what you actually have or asked for
let AS = null;
const escRe = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function worldSwap(state, r) {
  const sw = new Map(), has = id => (state.pantry || []).some(p => p.item === id && p.qty > 0);
  for (const p of state.pantry || []) { const it = p.item && ITEM[p.item]; if (it && it.standin && p.qty > 0 && !sw.has(it.standin) && !has(it.standin)) sw.set(it.standin, p.item); }
  if (AS) for (const [s0, w] of Object.entries(AS)) if (ITEM[w]) { const mine = sw.get(s0) || (state.pantry || []).map(p => p.item).find(id => id && ITEM[id] && ITEM[id].standin === s0); sw.set(s0, mine && norm(ITEM[mine].n).includes(norm(ITEM[w].n)) ? mine : w); }
  if (!sw.size) return r;
  for (const i of r.ings) {
    const w = i.item && sw.get(i.item); if (!w) continue;
    const from = ITEM[i.item], to = ITEM[w].n.toLowerCase(), names = [...new Set([from.n, i.name, from.n.replace(/s$/, ''), String(i.name || '').replace(/s$/, ''), MAINS[from.id] && MAINS[from.id].n, MAINS[from.id] && MAINS[from.id].short, VSHORT[from.id], BASES[from.id] && BASES[from.id].n].filter(x => x && x.length > 2).map(x => x.toLowerCase()))].sort((a, b) => b.length - a.length);
    const rx = new RegExp('\\b(' + names.map(escRe).join('|') + ')s?\\b', 'gi'), rep = m => m[0] === m[0].toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to;
    i.item = w; i.name = to; i.raw = (i.raw || '').replace(rx, rep);
    r.title = r.title.replace(rx, rep); if (r.steps) r.steps = r.steps.map(st => st.replace(rx, rep));
    if (r.tech) for (const t of r.tech) { if (t.id === from.id) t.n = ITEM[w].n; }
  }
  return r;
}
export function buildMeal(state, sp, serves, stock) {
  if (sp.proc) { const pr = P.build(state, sp, serves); return pr ? worldSwap(state, pr) : null; }
  stock = stock || pantryStock(state);
  let main = MAINS[sp.main]; const base = sp.base ? BASES[sp.base] : null, kit = kitOf(sp.kit), meth = METHODS[sp.method];
  serves = serves || 2;
  const ings = [], add = (id, pp, unit, name) => { const { q, u } = qtyFor(id, pp, serves, unit); ings.push({ q, u, name: name || ITEM[id].n.toLowerCase(), item: id, raw: `${q} ${u} ${name || ITEM[id].n.toLowerCase()}`.replace(/\s+/g, ' ') }); };
  const J = main.joint && ['roast', 'pulled', 'braise'].includes(sp.method) ? main.joint : null;
  let jointG = 0;
  if (!J && main.cut) main = { ...main, ...main.cut, joint: null, cutFrom: sp.main };
  if (J) { const have = stock.get(sp.main) || 0; jointG = sp.qty || (have >= main.pp * 2 ? have : Math.max(ITEM[sp.main].packs[0], main.pp * serves)); jointG = Math.round(jointG / 50) * 50;
    const jn = ITEM[sp.main].n.toLowerCase().replace(/ or shoulder/, '').replace(/^beef roasting joint$/, 'beef roasting joint'); ings.push({ q: jointG >= 1000 ? +(jointG / 1000).toFixed(2) : jointG, u: jointG >= 1000 ? 'kg' : 'g', name: jn, item: sp.main, whole: true, portion: main.pp, raw: `${jointG >= 1000 ? +(jointG / 1000).toFixed(2) + ' kg' : jointG + ' g'} ${jn}` }); }
  else add(sp.main, main.pp, ITEM[sp.main].u === 'pc' ? '' : ITEM[sp.main].u, main.n);
  const form = base && base.forms ? base.forms[sp.method] : null;
  if (base) add(sp.base, base.pp, ITEM[sp.base].u === 'pc' ? '' : ITEM[sp.base].u, base.n);
  const veg = (sp.veg || []).filter(v => VEG[v]);
  for (const v of veg) add(v, VEG[v].pp, ITEM[v].u === 'pc' ? '' : ITEM[v].u);
  const adds = (sp.add || []).filter(a => ITEM[a] && okItem(state, a) && a !== sp.main && !veg.includes(a));
  const cheeseAdd = adds.filter(a => ['cheddar', 'mozzarella', 'feta', 'parmesan', 'halloumi', 'cream-cheese'].includes(a));
  const addMeat = adds.filter(a => ['bacon', 'chorizo', 'ham'].includes(a));
  const addOther = adds.filter(a => !cheeseAdd.includes(a) && !(addMeat.includes(a) && ['frittata'].includes(sp.method)));
  for (const a of adds) add(a, ADDIN_PP[a] || 30, ITEM[a].u === 'pc' ? '' : ITEM[a].u);
  if (['frittata', 'shakshuka'].includes(sp.method) && sp.main !== 'eggs' && !adds.includes('eggs')) add('eggs', 2, '');
  const kitItems = [...kit.core.filter(([id]) => !adds.includes(id)), ...kit.extra.filter(([id]) => !adds.includes(id)).filter(([id]) => ITEM[id] && (C.stapleHave(state, id) || (stock.get(id) || 0) > 0 || ['garlic', 'spring-onion', 'cheddar', 'salsa', 'kidney-beans', 'lime', 'lemon'].includes(id)))].filter(([id]) => ITEM[id] && id !== sp.main && !veg.includes(id) && id !== sp.base && okItem(state, id));
  const niceToAdd = kit.extra.filter(([id]) => ITEM[id] && !kitItems.some(k => k[0] === id) && okItem(state, id)).map(([id]) => ITEM[id].n.toLowerCase());
  for (const [id, pp, u] of kitItems) add(id, pp, u);
  // Loose steps
  const mN = main.n, hard = veg.filter(v => VEG[v].kind === 'hard'), firm = veg.filter(v => VEG[v].kind === 'firm'), quick = veg.filter(v => VEG[v].kind === 'quick'), leafy = veg.filter(v => VEG[v].kind === 'leafy'), side = veg.filter(v => VEG[v].kind === 'side');
  // wet dishes: delicate veg go in for the last few minutes (technique database), not for the whole simmer
  if (['simmer', 'curry', 'soup', 'pasta', 'noodlesoup', 'risotto'].includes(sp.method)) { const LATE = new Set(['broccoli', 'tenderstem', 'green-beans', 'peas', 'courgette', 'sugar-snap', 'asparagus', 'frozen-veg', 'cauliflower']); for (const g of [hard, firm]) for (const v of g.filter(x => LATE.has(x))) { g.splice(g.indexOf(v), 1); if (!quick.includes(v)) quick.push(v); } }
  const vn = arr => join(arr.map(vegName));
  const flavour = kit.sauce || kit.rub, rub = kit.rub || kit.sauce;
  const potato = form === 'mash' ? `Boil the ${base.n} until soft, then mash with butter and a splash of milk.` : form === 'wedges' ? `Cut the ${base.n} into wedges, toss with oil and salt and roast at 200°C for 35 minutes.` : null;
  const baseStep = base && !form ? base.how : potato;
  const steps = []; let roastMins = 0, gearDone = false, handsOn = 0;
  const GR = gearOf(state), batches = serves > 4 ? ' (in batches if your basket is small)' : '';
  let mainCook = main.ready ? main.cook + '.' : main.cook + '.';
  if (main.strip && ['stirfry', 'wraps', 'bowl', 'friedrice', 'noodlesoup', 'quesadilla', 'salad', 'hash'].includes(sp.method)) mainCook = main.strip + '.';
  if (sp.gear === 'af') {
    const LATE = ['broccoli', 'cauliflower']; const hard2 = hard.filter(v => !LATE.includes(v)); quick.push(...hard.filter(v => LATE.includes(v))); hard.splice(0, hard.length, ...hard2);
    const t = AFT[sp.main] || 15, roastVeg = [...(form === 'roast' ? [base.n] : []), ...hard.map(vegName), ...firm.map(vegName)];
    if (sp.method === 'traybake') {
      steps.push(`Heat the air fryer to 200°C.`);
      if (roastVeg.length) steps.push(`Chop the ${join(roastVeg)} into chunks, toss with oil and salt and air fry ${hard.length || form === 'roast' ? 12 : 8} minutes.`);
      steps.push(`Coat the ${mN} in ${rub}, add to the basket${batches} and air fry ${t} minutes, shaking halfway, until cooked through${quick.length ? `. Add the ${vn(quick)} for the last 5` : ''}.`);
      if (kit.sauce && kit.rub) steps.push(`Brush over ${kit.sauce} and give it 2 more minutes.`); else if (kit.sauce && !kit.rub) steps.push(`Toss everything in ${kit.sauce} before serving.`);
      if (base && !form) steps.push(baseStep);
      roastMins = t + (roastVeg.length ? 10 : 0) + 5; gearDone = true;
    } else if (sp.method === 'sticky') {
      const ribs = sp.main === 'pork-ribs', belly = sp.main === 'pork-belly';
      steps.push(`${belly ? `Cut the pork belly into thick strips. ` : ''}Season the ${main.n} with salt${sp.main === 'chicken-wings' ? ', a teaspoon of baking powder (for crispy skin)' : ''} and ${kit.rub || 'pepper'}.`);
      steps.push(`Air fry at ${ribs ? 180 : 200}°C for ${t} minutes${batches}, turning halfway.`);
      steps.push(`${sp.main === 'chicken-wings' ? `Toss in ${kit.sauce || flavour} straight away.` : `Brush with ${kit.sauce || flavour} and air fry 3–5 minutes more until sticky.`}`);
      if (base && !form) steps.push(baseStep); else if (potato) steps.push(potato);
      if (veg.length) steps.push(`Serve with the ${vn(veg)}.`);
      roastMins = t + 8; gearDone = true;
    } else if (sp.method === 'roast' && J) {
      const mins = Math.round((jointG / 1000 * 32 + 10) / 5) * 5;
      steps.push(`Rub the chicken with oil, salt and ${rub || 'pepper'}. Put half a lemon and some garlic inside.`);
      steps.push(`Air fry breast-side down at 180°C for 30 minutes, flip, then ${mins - 30} minutes more until the juices run clear (75°C in the thickest part).`);
      if (base && sp.base === 'potato') steps.push(`Meanwhile boil chunks of potato for 10 minutes, then roast in the oven or air fry at 200°C for 20 minutes once the chicken is resting.`);
      const boil = [...hard, ...firm.filter(v => !['onion', 'red-onion'].includes(v)), ...quick, ...leafy];
      if (boil.length) steps.push(`Steam or boil the ${vn(boil)} while it rests.`);
      steps.push(`Rest 10 minutes, then carve.`);
      roastMins = mins + 15; gearDone = true;
    } else if (sp.method === 'panfry') {
      mainCook = `Air fry the ${mN} at 200°C for ${t} minutes, turning halfway, until cooked through.`;
    }
  } else if (sp.gear === 'sc') {
    const low = main.grp === 'chicken' && !J ? '5–6 hours on low (3 on high)' : '8 hours on low (5 on high)';
    if (sp.method === 'pulled') {
      steps.push(`In the morning: put a sliced onion in the slow cooker. Rub the ${mN} with ${rub || 'salt, smoked paprika and garlic'}, sit it on top and add a small mug of water${main.grp === 'beef' ? ' or stock' : ''}.`);
      steps.push(`Cook ${low}, until it falls apart.`);
      steps.push(`Shred with two forks, discarding fat and bones. Skim the fat off the juices and stir back in with ${kit.sauce || flavour || 'a little of the juices'}.`);
      if (base) steps.push(base.how || baseStep || `Serve with the ${base.n}.`);
      if (veg.length) steps.push(`Serve with the ${vn(veg)}.`);
    } else {
      const late = [...quick, ...leafy];
      steps.push(`In the morning: season the ${mN}${['braise'].includes(sp.method) || J ? ' (brown it in a pan first if you have 5 minutes — tastier)' : ''} and put it in the slow cooker with a chopped onion${[...hard, ...firm].filter(v => v !== 'onion').length ? ` and the ${vn([...hard, ...firm].filter(v => v !== 'onion'))}` : ''}.`);
      steps.push(`Add ${flavour || 'a tin of tomatoes'}${sp.method === 'curry' ? '' : ' and a little stock'}, stir, put the lid on and cook ${low}.`);
      if (late.length) steps.push(`When you're home, stir in the ${vn(late)} and give it 15 minutes on high.`);
      if (base && !form) steps.push(baseStep); else if (potato) steps.push(potato);
      if (J) steps.push(`Lift out the meat, carve or pull into chunks and spoon over the sauce.`);
    }
    roastMins = /chicken/.test(low) && !J ? 330 : 480; handsOn = 20; gearDone = true;
  }
  if (!gearDone) switch (sp.method) {
    case 'traybake': {
      { const LATE = ['broccoli', 'cauliflower']; quick.push(...hard.filter(v => LATE.includes(v))); const h2 = hard.filter(v => !LATE.includes(v)); hard.splice(0, hard.length, ...h2); }
      const roastVeg = [...(form === 'roast' ? [base.n] : []), ...hard.map(vegName), ...firm.map(vegName)];
      steps.push(`Heat the oven to 200°C.`);
      steps.push(`Chop ${roastVeg.length ? 'the ' + join(roastVeg) : 'some onion'} into chunks, toss on a big tray with oil and salt${hard.length || form === 'roast' ? ' and roast for 15 minutes' : ''}.`);
      steps.push(`Coat the ${mN} in ${rub}, add to the tray and roast ${main.roast || 25} minutes until cooked through${quick.length ? `, adding the ${vn(quick)} for the last 10` : ''}.`);
      if (kit.sauce && kit.rub) steps.push(`Brush over ${kit.sauce} for the last 5 minutes.`); else if (kit.sauce && !kit.rub) steps.push(`Toss everything in ${kit.sauce} before serving.`);
      if (base && !form) steps.push(baseStep);
      break; }
    case 'panfry':
      if (baseStep) steps.push(baseStep);
      steps.push(`Season the ${mN}${kit.rub ? ` with ${kit.rub}` : ''}. ${mainCook}`);
      if (firm.length || hard.length) steps.push(`In the same pan, fry the ${vn([...hard, ...firm])} for 5 minutes.`);
      steps.push(`Add ${flavour}${quick.length ? ` and the ${vn(quick)}` : ''}, bubble for 2–3 minutes${leafy.length ? `, then wilt in the ${vn(leafy)}` : ''}. Return the ${main.short} to the pan.`);
      break;
    case 'stirfry':
      if (base) steps.push(base.how);
      steps.push(`Slice everything thinly. ${main.ready ? '' : mainCook.replace('Fry', 'Stir-fry') + ' Lift out.'}`);
      steps.push(`Stir-fry the ${vn([...firm, ...quick]) || 'veg'} in a very hot pan for 3–4 minutes.`);
      steps.push(`Return the ${main.short}${base ? ` and the ${base.n}` : ''}, add ${flavour} and toss for a minute${leafy.length ? ` with the ${vn(leafy)}` : ''}.${kit.finish ? ` Top with ${kit.finish}.` : ''}`);
      break;
    case 'friedrice':
      steps.push(`Best with cold cooked rice. If yours isn't cooked, cook it and spread it out to cool.`);
      steps.push(`${main.ready ? 'Heat' : 'Fry'} the ${mN}${firm.length ? ` with the ${vn(firm)}` : ''} in a hot pan until cooked.`);
      steps.push(`Add the rice${quick.length ? ` and ${vn(quick)}` : ''} and fry until it starts to crisp. Push to one side and scramble in the egg.`);
      steps.push(`Season with ${flavour}.${kit.finish ? ` Top with ${kit.finish}.` : ''}`);
      break;
    case 'pasta':
      steps.push(base ? base.how + ' Keep a mug of the water.' : 'Boil the pasta.');
      steps.push(`${mainCook}${firm.length ? ` Add the ${vn(firm)} and cook 5 minutes.` : ''}`);
      steps.push(`Add ${flavour}${quick.length ? ` and the ${vn(quick)}` : ''} and simmer a few minutes${leafy.length ? `, then stir in the ${vn(leafy)}` : ''}.`);
      steps.push(`Toss with the pasta and a splash of the water until glossy.${kit.finish ? ` Top with ${kit.finish}.` : ''}`);
      break;
    case 'simmer': case 'curry':
      steps.push(`Soften ${firm.includes('onion') ? 'the onion' : 'an onion'}${firm.filter(v => v !== 'onion').length ? ` and the ${vn(firm.filter(v => v !== 'onion'))}` : ''} in a big pan for 5 minutes.`);
      steps.push(`${main.ready ? main.cook : main.cook.replace('Fry', 'Brown')}.${hard.length ? ` Add the ${vn(hard)}.` : ''}`);
      steps.push(`Stir in ${flavour}${sp.method === 'simmer' && !/tin|stock|tomatoes|coconut|cream/.test(flavour) ? ' and a splash of water' : ''}. Simmer ${main.slow ? '1½–2 hours, until tender' : '20 minutes, until thick'}${quick.length ? `, adding the ${vn(quick)} for the last 5` : ''}.`);
      if (leafy.length) steps.push(`Stir in the ${vn(leafy)} until wilted.`);
      if (base) steps.push(form === 'mash' ? potato : base.how);
      if (kit.finish) steps.push(`Serve with ${kit.finish}.`);
      break;
    case 'wraps':
      if (main.ready) steps.push(main.cook + '.'); else steps.push(`Slice the ${mN} and coat in ${rub}. ${mainCook}`);
      if (firm.length) steps.push(`Fry the ${vn(firm)} until soft and a bit charred.`);
      if (kit.sauce && !kit.rub) steps.push(`Toss the ${main.short} in ${kit.sauce}.`);
      steps.push(`${base ? base.how : 'Warm the wraps.'} Fill with everything${side.length ? `, the ${vn(side)}` : ''}${kit.finish ? ` and ${kit.finish}` : ''}.`);
      break;
    case 'bowl':
      if (base) steps.push(form === 'roast' ? `Roast the ${base.n} in chunks at 200°C for 30 minutes.` : base.how);
      steps.push(`${kit.rub ? `Coat the ${mN} in ${kit.rub}. ` : ''}${mainCook}${kit.sauce && !kit.rub ? ` Toss in ${kit.sauce}.` : ''}`);
      if (firm.length || quick.length) steps.push(`Cook the ${vn([...firm, ...quick])} for a few minutes.`);
      steps.push(`Build bowls: ${base ? base.n : 'base'}, ${main.short}, veg${leafy.length || side.length ? `, ${vn([...leafy, ...side])}` : ''}${kit.finish ? `, then ${kit.finish}` : ''}.`);
      break;
    case 'bake':
      steps.push(`Heat the oven to 200°C. ${base && base.how ? base.how.replace('.', ' for 2 minutes less than the pack says.') : `Thinly slice the ${base ? base.n : 'potatoes'}.`}`);
      steps.push(`${mainCook}${firm.length ? ` Add the ${vn(firm)}.` : ''}${hard.length ? ` Add the ${vn(hard)} (chopped small).` : ''}`);
      steps.push(`Stir in ${flavour}${quick.length ? `, the ${vn(quick)}` : ''}${leafy.length ? ` and the ${vn(leafy)}` : ''}, then mix with the ${base ? base.n : 'pasta'} in a baking dish.`);
      steps.push(`Top with ${kit.finish || 'grated cheese'} and bake 20 minutes until bubbling.`);
      break;
    case 'burgers':
      if (potato) steps.push(potato); else if (base && base.id !== 'buns' && sp.base !== 'buns') steps.push(base.how);
      if (main.ready) steps.push(main.cook + '.');
      else if (main.mince) steps.push(`Mix the ${mN} with salt and pepper and shape into burgers. Fry or grill 4–5 minutes a side.`);
      else steps.push(`${kit.rub ? `Coat the ${mN} in ${kit.rub}. ` : ''}${mainCook}`);
      steps.push(`Toast the buns. Build with ${flavour}${side.length ? `, ${vn(side)}` : ''}${kit.core.some(c => c[0] === 'cheese-slices') ? ' and a slice of cheese' : ''}.`);
      if (sp.base === 'buns') steps.push('Serve with oven chips or salad if you like.');
      break;
    case 'soup':
      steps.push(`Soften ${firm.includes('onion') ? 'the onion' : 'an onion'}${firm.filter(v => v !== 'onion').length ? ` and the ${vn(firm.filter(v => v !== 'onion'))}` : ''} in a big pot for 5 minutes.`);
      steps.push(`${main.ready ? main.cook : main.cook.replace('Fry', 'Brown')}.${hard.length || form ? ` Add the ${vn(hard)}${form ? `${hard.length ? ' and ' : ''}diced ${base.n}` : ''}.` : ''}`);
      steps.push(`Add ${flavour} and about 300 ml water or stock per person. Simmer 20 minutes${quick.length ? `, adding the ${vn(quick)} for the last 5` : ''}.`);
      steps.push(`${leafy.length ? `Stir in the ${vn(leafy)}. ` : ''}Blend half for a thicker soup, or leave it chunky.${kit.finish ? ` Finish with ${kit.finish}.` : ''}`);
      if (base && !form) steps.push(base.how);
      break;
    case 'noodlesoup':
      steps.push(`Bring about 400 ml stock per person to a simmer with ${flavour}.`);
      steps.push(main.ready ? `${main.cook}.` : `${mainCook} Slice it.`);
      steps.push(`Add the noodles${firm.length || quick.length ? ` and the ${vn([...firm, ...quick])}` : ''} and simmer 4 minutes${leafy.length ? `, wilting in the ${vn(leafy)} at the end` : ''}.`);
      steps.push(`Ladle into bowls and top with the ${main.short}${kit.finish ? ` and ${kit.finish}` : ''}.`);
      break;
    case 'frittata':
      if (form) steps.push(`Slice the ${base.n} thinly and fry until soft and golden, about 10 minutes.`);
      steps.push(`Fry the ${vn([...firm, ...quick]) || 'veg'}${addMeat.length || sp.main !== 'eggs' ? ` with the ${join([...(sp.main !== 'eggs' ? [mN] : []), ...addMeat.map(a => ITEM[a].n.toLowerCase())])}` : ''} in an ovenproof pan for 5 minutes${leafy.length ? `, then wilt in the ${vn(leafy)}` : ''}.`);
      steps.push(`Beat 2–3 eggs per person with salt, pepper and ${rub}${cheeseAdd.length ? ` and half the ${join(cheeseAdd.map(c => ITEM[c].n.toLowerCase()))}` : ''}. Pour over.`);
      steps.push(`Cook on low for 6 minutes, ${cheeseAdd.length ? 'scatter over the rest of the cheese, ' : ''}then finish under a hot grill until set and golden.`);
      break;
    case 'shakshuka':
      steps.push(`Soften an onion${firm.filter(v => v !== 'onion').length ? ` and the ${vn(firm.filter(v => v !== 'onion'))}` : ''} in a wide pan for 6 minutes.`);
      if (sp.main !== 'eggs') steps.push(`${main.ready ? main.cook : mainCook}.`);
      steps.push(`Add ${flavour} and simmer 10 minutes until thick${leafy.length ? `, stirring in the ${vn(leafy)}` : ''}.`);
      steps.push(`Make little wells and crack in 2 eggs per person. Cover and cook 6–8 minutes until the whites are set.${kit.finish ? ` Top with ${kit.finish}.` : ''} ${base ? base.how : ''}`);
      break;
    case 'hash':
      steps.push(`Dice the ${base ? base.n : 'potatoes'} small, boil 5 minutes and drain well.`);
      steps.push(`Fry in a wide pan with oil until crisp, about 12 minutes, turning now and then.`);
      steps.push(`${main.ready ? `Add the ${mN}` : `Push to one side and cook the ${mN}`}${firm.length || quick.length ? ` with the ${vn([...firm, ...quick])}` : ''}. Season with ${rub}.`);
      steps.push(`${leafy.length ? `Toss in the ${vn(leafy)}. ` : ''}Top with a fried egg if you like${kit.sauce && !kit.rub ? `, and ${kit.sauce}` : ''}.`);
      break;
    case 'loaded':
      steps.push(form === 'jacket' ? `Prick the ${base.n} and microwave 10–12 minutes until soft (crisp in a hot oven for 10 more if you have time).` : `${base ? base.how : 'Bake the chips.'}`);
      steps.push(`${main.ready ? main.cook : mainCook}${firm.length ? ` with the ${vn(firm)}` : ''}, then add ${flavour}${quick.length ? ` and the ${vn(quick)}` : ''}.`);
      steps.push(`${form === 'jacket' ? 'Split the potatoes and pile' : 'Pile'} it on${cheeseAdd.length ? `, topped with ${join(cheeseAdd.map(c => ITEM[c].n.toLowerCase()))}` : ''}${side.length ? ` and ${vn(side)}` : ''}.`);
      break;
    case 'quesadilla':
      steps.push(`${main.ready ? main.cook + '.' : mainCook} Mix with ${flavour}${firm.length || quick.length ? ` and the ${vn([...firm, ...quick])}` : ''}.`);
      steps.push(`Spread over half of each wrap${leafy.length ? ` with some ${vn(leafy)}` : ''}${cheeseAdd.length ? `, scatter over the ${join(cheeseAdd.map(c => ITEM[c].n.toLowerCase()))}` : ''} and fold over.`);
      steps.push(`Dry-fry 2–3 minutes a side until crisp and melted. Cut into wedges.`);
      break;
    case 'flatbread':
      steps.push(`Heat the oven to 220°C. Lay the ${base ? base.n : 'wraps'} on trays.`);
      steps.push(kit.rub && !kit.sauce ? `Spread with a thin layer of passata or tomato purée, then sprinkle over ${kit.rub.replace(', salt and a little oil', '')}.` : kit.rub ? `Brush with oil mixed with ${kit.rub.replace(', salt and a little oil', '')}, then spread over ${kit.sauce}.` : `Spread with ${kit.sauce || 'a little passata'}.`);
      steps.push(`Top with the ${main.ready ? mN : mN + ' (cooked first)'}${firm.length || quick.length ? `, ${vn([...firm, ...quick])}` : ''}${cheeseAdd.length ? ` and ${join(cheeseAdd.map(c => ITEM[c].n.toLowerCase()))}` : ' and grated cheese'}.`);
      steps.push(`Bake 8–10 minutes until crisp.${leafy.length ? ` Scatter over the ${vn(leafy)}.` : ''}`);
      break;
    case 'pie':
      steps.push(`Heat the oven to 200°C. ${main.ready ? main.cook : mainCook}${firm.length ? ` with the ${vn(firm)}` : ''}.`);
      steps.push(`${hard.length ? `Add the ${vn(hard)} (chopped small), then ` : ''}Stir in ${flavour}${quick.length ? ` and the ${vn(quick)}` : ''} and simmer 10 minutes until thick.${leafy.length ? ` Stir in the ${vn(leafy)}.` : ''}`);
      steps.push(`Tip into a dish and lay the ${base ? base.n : 'pastry'} over the top. Cut a little hole and brush with milk or egg.`);
      steps.push('Bake 25 minutes until puffed and golden.');
      break;
    case 'salad':
      if (form) steps.push(`Boil the ${base.n} until tender, then halve.`); else if (base) steps.push(base.how);
      steps.push(`${kit.rub ? `Coat the ${mN} in ${kit.rub}. ` : ''}${main.ready ? main.cook + '.' : mainCook}${firm.length || quick.length ? ` Cook the ${vn([...firm, ...quick])} in the same pan for a few minutes.` : ''}`);
      steps.push(`Make a dressing: olive oil with ${kit.sauce && kit.rub ? kit.sauce : (kit.sauce || 'lemon juice')}, salt and pepper.`);
      steps.push(`Toss everything${leafy.length || side.length ? ` with the ${vn([...leafy, ...side])}` : ''} and the dressing while warm.${cheeseAdd.length ? ` Crumble over the ${join(cheeseAdd.map(c => ITEM[c].n.toLowerCase()))}.` : ''}`);
      break;
    case 'risotto':
      steps.push(`Soften an onion${firm.filter(v => v !== 'onion').length ? ` and the ${vn(firm.filter(v => v !== 'onion'))}` : ''} in butter for 5 minutes. ${main.ready ? '' : mainCook}`);
      steps.push(`Stir in the risotto rice for a minute, then add hot stock a ladle at a time, stirring, for 18–20 minutes.`);
      steps.push(`Stir in ${flavour}${quick.length ? ` and the ${vn(quick)}` : ''}${leafy.length ? `, then the ${vn(leafy)}` : ''}${main.ready ? ` and the ${mN}` : ''}.`);
      steps.push(`Finish with a knob of butter${cheeseAdd.length ? ` and ${join(cheeseAdd.map(c => ITEM[c].n.toLowerCase()))}` : ' and parmesan'}. It should be loose and creamy.`);
      break;
    case 'roast': {
      const w = jointG, kg = (w / 1000).toFixed(1).replace(/\.0$/, ''), mins = Math.round((J.per500 * w / 500 + J.extra + (J.start && !J.slow && J.per500 ? 25 : 0)) / 5) * 5;
      roastMins = mins;
      steps.push(`Take the ${mN} out of the fridge 30 minutes before. Heat the oven to ${J.start ? 220 : J.temp}°C.`);
      if (J.skin) steps.push(`Pat the skin dry, score it with a sharp knife and rub in plenty of salt and a little oil.${rub && !kit.sauce ? ` Rub ${rub} into the meat (not the skin).` : ''}`);
      else if (J.bird) steps.push(`Rub the chicken with butter or oil, salt and ${rub || 'pepper'}. Pop half a lemon and a few garlic cloves inside.`);
      else if (J.glaze) steps.push(`If it's a smoked gammon, soak it in cold water for an hour first. Wrap loosely in foil.`);
      else steps.push(`Rub the ${mN} with oil, salt and ${rub || 'pepper'}.`);
      const ROOT = ['carrot', 'parsnip', 'butternut', 'beetroot', 'sweet-potato', 'celery'], under = hard.filter(v => ROOT.includes(v));
      steps.push(`Sit it on a roasting tin on a halved onion${under.length ? ` and chunks of ${vn(under)}` : ''}. ${J.start ? J.start + '. ' : ''}Roast for ${J.per500 ? `${J.per500} minutes per 500 g plus ${J.extra}` : Math.round(J.extra / 60) + ' hours'}${J.note ? ' ' + J.note : ''}: about ${fmtMins(mins)} for your ${kg} kg.`);
      if (J.glaze) steps.push(`For the last 25 minutes, take off the foil, cut off the skin leaving the fat, score it, brush with ${kit.sauce || 'honey and mustard'} and turn the oven up to 200°C.`);
      else if (kit.sauce && kit.rub && kit.sauce !== kit.rub) steps.push(`Brush with ${kit.sauce} for the last 15 minutes.`);
      if (base && sp.base === 'potato') steps.push(`An hour before it's done, peel and chunk the potatoes, boil 10 minutes, drain and shake to rough them up. Roast in hot oil on the top shelf for 50 minutes, turning once.`);
      else if (base && !form) steps.push(baseStep); else if (potato) steps.push(potato);
      const boil = [...hard.filter(v => !under.includes(v)), ...firm.filter(v => !['onion', 'red-onion', 'celery'].includes(v)), ...quick, ...leafy];
      if (boil.length) steps.push(`While it rests, steam or boil the ${vn(boil)} until just tender.`);
      steps.push(`Rest the meat under foil for 15–20 minutes. ${sp.kit === 'roastgravy' || /gravy/.test(flavour || '') ? 'Make gravy in the tin: stir a spoon of flour into the juices, add stock and bubble 5 minutes.' : 'Spoon the tin juices over to serve.'}${J.skin ? ' If the crackling needs more, blast it under a hot grill.' : ''}`);
      steps.push(`Carve${side.length ? ` and serve with the ${vn(side)}` : ''}.`);
      break;
    }
    case 'pulled': {
      const hrs = J && J.bird ? 1.5 : 4.5; roastMins = hrs * 60 + 20;
      steps.push(`Heat the oven to ${J && J.bird ? 190 : 150}°C. Rub the ${mN} all over with ${rub || 'salt, smoked paprika, garlic and pepper'}.`);
      steps.push(`Put it in a lidded pot or deep tin on a sliced onion with a mug of water${main.grp === 'beef' ? ' or stock' : ''}. Cover tightly.`);
      steps.push(J && J.bird ? 'Roast for 1½ hours until the juices run clear.' : `Slow-cook for 4–5 hours until it falls apart (or 8 hours on low in a slow cooker). Hands off.`);
      steps.push(`Shred with two forks, discarding fat and bones. Skim the fat off the juices and stir back in with ${kit.sauce || flavour || 'a little of the juices'}.`);
      if (base) steps.push(base.how || baseStep || `Serve with the ${base.n}.`);
      if (veg.some(v => ['cabbage', 'carrot', 'red-onion', 'coleslaw', 'salad-veg'].includes(v))) steps.push(`Quick slaw: finely shred the ${vn(veg.filter(v => ['cabbage', 'carrot', 'red-onion', 'salad-veg'].includes(v)))} and mix with a spoon of mayo and a splash of vinegar.`);
      else if (veg.length) steps.push(`Serve with the ${vn(veg)}.`);
      break;
    }
    case 'braise': {
      const late = v => ['broccoli', 'tenderstem', 'cauliflower', 'green-beans', 'peas', 'asparagus', 'sugar-snap', 'frozen-veg'].includes(v); hard.splice(0, hard.length, ...hard.filter(v => !late(v))); quick.push(...veg.filter(v => late(v) && !quick.includes(v)));
      const hrs = J ? 3 : 2; roastMins = hrs * 60 + 30;
      steps.push(`Heat the oven to 160°C. ${J ? `Season the ${mN} and brown it all over in a big ovenproof pot` : main.cook.replace('Fry', 'Brown')}.`);
      steps.push(`Add an onion${hard.length ? ` and chunky ${vn(hard)}` : ''}${firm.filter(v => v !== 'onion').length ? `, ${vn(firm.filter(v => v !== 'onion'))}` : ''}, then ${flavour || 'a tin of tomatoes'} and stock to come halfway up.`);
      steps.push(`Cover and cook in the oven ${hrs === 3 ? '3 hours' : '2 hours'}, until it's tender enough to pull apart with a spoon.${quick.length || leafy.length ? ` Stir in the ${vn([...quick, ...leafy])} for the last 10 minutes.` : ''}`);
      if (base && !form) steps.push(baseStep); else if (potato) steps.push(potato);
      if (J) steps.push(`Lift out the meat, carve or pull into chunks, and spoon over the sauce.`);
      break;
    }
    case 'sticky': {
      const ribs = sp.main === 'pork-ribs', wings = sp.main === 'chicken-wings', belly = sp.main === 'pork-belly';
      roastMins = ribs ? 120 : belly ? 75 : 50;
      if (ribs) { steps.push(`Heat the oven to 160°C. Rub the ribs with salt and ${rub || 'paprika'}, wrap tightly in foil and bake for 1½ hours.`); steps.push(`Unwrap, brush thickly with ${kit.sauce || flavour}, turn the oven up to 220°C and bake 15–20 minutes more, brushing again halfway.`); }
      else if (wings) { steps.push(`Heat the oven to 220°C. Pat the wings dry and toss with salt, a teaspoon of baking powder (for crispy skin) and ${kit.rub || 'pepper'}.`); steps.push(`Bake on a rack or tray for 40–45 minutes, turning once, until crisp. Toss in ${kit.sauce || flavour} straight away.`); }
      else if (belly) { steps.push(`Heat the oven to 200°C. Cut the pork belly into thick strips and roast for 45 minutes.`); steps.push(`Pour off the fat, toss in ${kit.sauce || flavour} and roast 15 minutes more until sticky.`); }
      else { steps.push(`Heat the oven to 200°C. Season the ${mN} with ${kit.rub || 'salt and pepper'} and roast 35–40 minutes.`); steps.push(`Brush with ${kit.sauce || flavour} and roast 10 minutes more until sticky.`); }
      if (base && !form) steps.push(baseStep); else if (potato) steps.push(potato);
      if (veg.length) steps.push(`Serve with the ${vn(veg)}${veg.some(v => VEG[v].kind !== 'side') ? ', cooked how you like' : ''}.`);
      break;
    }
  }
  if (main.cutFrom && !steps.some(st => /from the|Joint the/.test(st))) steps.unshift(main.cook.split('. ')[0].replace(/\.$/, '') + '.');
  // Add-ins from your kitchen
  const STIR = new Set(['sweetcorn', 'kidney-beans', 'chickpeas', 'butter-beans', 'olives', 'capers', 'jalapenos', 'cherry-tomato', 'ham']);
  const stirIn = addOther.filter(a => STIR.has(a)), tops = addOther.filter(a => !STIR.has(a));
  if (stirIn.length) { const verb = ['flatbread', 'quesadilla', 'loaded', 'salad', 'traybake', 'bowl', 'wraps'].includes(sp.method) ? 'Scatter over' : 'Stir in'; const txt = `${verb} the ${join(stirIn.map(a => ITEM[a].n.toLowerCase().replace('olives & antipasti', 'olives').replace('tinned ', '')))}.`; const late = ['bake', 'pie', 'flatbread', 'quesadilla', 'frittata', 'shakshuka', 'soup', 'risotto', 'loaded', 'traybake'].includes(sp.method); if (late && steps.length > 1) steps.splice(steps.length - 1, 0, txt); else steps.push(txt); }
  for (const a of tops) steps.push(ADDIN_TEXT[a] ? ADDIN_TEXT[a] : `Add the ${ITEM[a].n.toLowerCase()}.`);
  if (GR.airfryer) for (let i = 0; i < steps.length; i++) steps[i] = steps[i].replace('Bake the oven chips.', 'Air fry the chips at 200°C for 15–18 minutes, shaking halfway.').replace(/toss with oil and salt and roast at 200°C for 35 minutes\./, 'toss with oil and salt and air fry at 200°C for 20–25 minutes, shaking halfway.');
  if (!GR.microwave) for (let i = 0; i < steps.length; i++) steps[i] = steps[i].replace(/microwave 10–12 minutes until soft \(crisp in a hot oven for 10 more if you have time\)/, GR.airfryer ? 'rub with oil and salt and air fry at 190°C for 40–45 minutes' : 'bake at 200°C for an hour until crisp');
  if (sp.flair && ITEM[sp.flair] && FLAIR[sp.flair]) {
    const id = sp.flair, n = ITEM[id].n.toLowerCase().replace(/^fresh /, ''), kind = FLAIR[id][1], u = ITEM[id].u;
    const sharp = ['lime', 'lemon'].find(x => (stock.get(x) || 0) > 0) || null;
    add(id, u === 'pc' ? (kind === 'salsa' || kind === 'beet' ? 0.5 : 0.25) : kind === 'salsa' ? 60 : kind === 'crumble' || kind === 'dot' ? 25 : kind === 'choc' ? 5 : 30, u === 'pc' ? '' : u, n);
    const T = { salsa: `Quick ${n.replace(/s$/, '')} salsa: dice it small and mix with ${sharp ? `a squeeze of ${sharp}` : 'a splash of vinegar'}, a pinch of salt and a little chopped chilli or spring onion if you have it. Spoon over to serve.`,
      scatter: `Scatter over the ${n}.`, roastfruit: `Add the ${n} to the pan or tray for the last 10 minutes so they blister and go jammy.`, crumble: `Crumble a little ${n} over at the end.`, dot: `Dot the ${n} over and let it soften in the heat.`,
      kimchi: `Serve with kimchi on the side (or fry it with the ${sp.method === 'friedrice' ? 'rice' : 'veg'} for a minute for a tangy kick).`, hummus: `Spread a spoon of hummus on each plate${sp.method === 'wraps' ? ' or wrap' : ''} and pile everything on top.`,
      pickle: `Quick pickle: slice the cucumber thinly, toss with a pinch of salt, sugar and a splash of vinegar, and serve on the side.`, beet: `Slice the beetroot and serve alongside.`, dates: `Stir in a few chopped dates for a sweet edge.`,
      choc: `Stir a square of dark chocolate into the sauce at the end. It deepens it without tasting sweet.`, swirl: `Swirl in a spoon of ${n} before serving.`, avo: `Slice the avocado over the top with a pinch of salt.` };
    steps.push(T[kind] || `Add the ${n}.`);
  }
  // Recipe grammar: add a SAUCE block to dry dishes and a TEXTURE block to soft ones, chosen by the maths, built from what you have
  const blk = {};
  if (Chef.ready()) {
    const fam = kit.fam || FEEL2FAM[kit.feel] || 'british', ids0 = [...new Set(ings.map(i => i.item).filter(Boolean))];
    const b = Chef.blocks({ ids: ids0, method: sp.method, fam, tags: kit.tags, hero: sp.main, hasSauce: !!kit.sauce || ['curry', 'simmer', 'pasta', 'soup', 'braise', 'bake', 'pie', 'risotto', 'salad', 'shakshuka', 'noodlesoup'].includes(sp.method), crunch: ids0.some(id => ['nuts', 'breadcrumbs', 'coleslaw', 'cucumber', 'spring-onion', 'red-onion'].includes(id)), have: id => (stock.get(id) || 0) > 0 || (ITEM[id] && ITEM[id].staple && C.stapleHave(state, id)) });
    if (b.sauce) { for (const id of b.sauce.items) if (ITEM[id] && !ings.some(i => i.item === id)) add(id, ITEM[id].u === 'pc' ? 0.25 : ITEM[id].u === 'g' ? 15 : 15, ITEM[id].u === 'pc' ? '' : ITEM[id].u); steps.push(b.sauce.step); blk.sauce = b.sauce.n; }
    if (b.texture) { for (const id of b.texture.items) if (ITEM[id] && !ings.some(i => i.item === id)) add(id, ITEM[id].u === 'pc' ? 0.5 : ITEM[id].u === 'g' ? 15 : 5, ITEM[id].u === 'pc' ? '' : ITEM[id].u); steps.push(b.texture.step); blk.texture = b.texture.n; }
  }
  // TASTE + FINISH: work out what the plate tastes like per serving, then finish it where it falls short
  let tasteNow = null;
  if (Chef.ready()) {
    const parts = ings.filter(i => i.item && ITEM[i.item] && ITEM[i.item].u !== 'pc').map(i => [i.item, (C.toBase(i.q, i.u, ITEM[i.item]) || 0) / serves]);
    tasteNow = Chef.taste(parts);
    const fam = kit.fam || FEEL2FAM[kit.feel] || 'british', ids1 = [...new Set(ings.map(i => i.item).filter(Boolean))];
    const fb = Chef.finish({ ids: ids1, method: sp.method, fam, hero: sp.main, taste: tasteNow, spicy: ((state.taste || {}).spice || 0) >= 2, have: id => (stock.get(id) || 0) > 0 || (ITEM[id] && ITEM[id].staple && C.stapleHave(state, id)), clash: ids => chefCheck({ ...sp, add: [...(sp.add || []), ...ids.filter(id => !spItems(sp).includes(id))] }, kit).fail });
    if (fb && !blk.texture) { const u = ITEM[fb.id].u; add(fb.id, u === 'pc' ? 0.25 : 5, u === 'pc' ? '' : u, ITEM[fb.id].n.toLowerCase()); steps.push(fb.text); blk.finish = fb.n; }
  }
  { const ft = blk.texture || blk.finish || Chef.ready() ? null : finishingTouch(state, sp, kit, stock, chefCheck(sp, kit)); if (ft) { const u = ITEM[ft.id].u; add(ft.id, u === 'pc' ? 0.25 : u === 'g' ? 5 : 5, u === 'pc' ? '' : u, ITEM[ft.id].n.toLowerCase()); steps.push(ft.text); blk.finish = ft.text.split(/[:.—-]/)[0].replace(/^Finish with |^Scatter over some |^For crunch, |^Toast /, '').trim(); } }
  // Time and name
  let time = (meth.t || 30) + (sp.method === 'traybake' ? Math.max(0, (main.roast || 25) - 25) : 0) + (main.slow ? 90 : 0) + (form === 'mash' || form === 'wedges' ? 5 : 0);
  if (main.ready && ['wraps', 'bowl', 'burgers'].includes(sp.method)) time = Math.min(time, 25);
  if (roastMins) time = roastMins + (sp.method === 'roast' && !sp.gear ? 25 : 0);
  let leftover = null;
  if (J && main.leftover && ITEM[main.leftover]) { const spare = jointG - main.pp * serves; if (spare >= main.pp * 0.8) { const g = Math.round(spare * 0.65 / 50) * 50; leftover = { item: main.leftover, g, portions: Math.max(1, Math.floor(spare / main.pp)), feeds: Math.floor(jointG / main.pp) }; } }
  const named = NAMED.find(x => x.main.includes(sp.main) && x.kit.split(' ').includes(sp.kit) && x.method.split(' ').includes(sp.method) && (!x.base || x.base.includes(sp.base)));
  const flairName = sp.flair && FLAIR[sp.flair] ? ({ salsa: ITEM[sp.flair].n.toLowerCase().replace(/s$/, '') + ' salsa', crumble: 'blue cheese', dot: "goat's cheese", kimchi: 'kimchi', pickle: 'quick pickles', hummus: 'hummus', roastfruit: 'roast ' + ITEM[sp.flair].n.toLowerCase(), avo: 'avocado' })[FLAIR[sp.flair][1]] : null;
  const baseTitle = dedupeWords(named ? named.n : madeUpName(sp, main, base, kit, veg));
  const title = (flairName && !baseTitle.toLowerCase().includes(flairName.split(' ')[0]) ? baseTitle + (/ with /.test(baseTitle) ? ' & ' : ' with ') + flairName : baseTitle) + (sp.gear === 'af' ? ' (air fryer)' : sp.gear === 'sc' ? ' (slow cooker)' : '');
  const id = 'g2:' + specKey(sp).replace(/[^a-z0-9|+-]/gi, '') + (jointG ? '|' + jointG : '');
  const r = C.normalizeRecipe({ id, src: 'built', title, serves, time, cat: 'Built', area: kit.feel || '', ings, steps: steps.filter(Boolean), spec: { ...sp, veg }, named: !!named, nice: niceToAdd });
  if (leftover) { r.leftover = leftover; r.wholeJoint = jointG; }
  // technique notes for each ingredient, and the doneness cue on the main's cooking step
  const tech = Tech.techOf(sp.method, sp.gear), notes = [];
  { const nm = Tech.noteOf(sp.main, tech) || {}, safe = Tech.safeOf(sp.main); if (nm.prep || nm.time || safe) notes.push({ id: sp.main, n: main.n, tech, ...nm, safe });
    for (const v of veg) { const nv = Tech.noteOf(v, VEG[v].kind === 'side' ? 'raw' : tech); if (nv && (nv.prep || nv.time)) notes.push({ id: v, n: vegName(v), tech: VEG[v].kind === 'side' ? 'raw' : tech, ...nv }); }
    if (sp.base) { const bt = form === 'roast' || form === 'wedges' ? (sp.gear === 'af' ? 'airfry' : 'roast') : form === 'jacket' ? 'bake' : 'boil'; const nb = Tech.noteOf(sp.base, bt); if (nb && (nb.prep || nb.time)) notes.push({ id: sp.base, n: base.n, tech: bt, ...nb }); }
    const done = !main.ready && Tech.PROTEIN[sp.main] && Tech.PROTEIN[sp.main].safe !== 'ready' ? (Tech.noteOf(sp.main, tech) || {}).done || Tech.safeOf(sp.main) : null;
    if (done && r.steps) { const k = r.steps.findIndex(st => st.includes(main.n) || st.includes(mainCook.slice(0, 18))); if (k >= 0 && !/°C|cooked through|no pink|juices run clear|until pink/.test(r.steps[k])) r.steps[k] = r.steps[k].replace(/\.?\s*$/, '') + ` (done when: ${done}).`; } }
  r.tech = notes; if (tasteNow) r.taste = tasteNow;
  r.blocks = { technique: (sp.gear === 'af' ? 'air fryer ' : sp.gear === 'sc' ? 'slow cooker ' : '') + (sp.method === 'braise' && !main.joint ? 'stew' : METHODS[sp.method].n), flavour: kit.n, ...blk };
  if (Chef.ready()) { const h = Chef.harmony([...new Set(ings.map(i => i.item).filter(Boolean))], sp.method, sp.main); if (h) r.harmony = Math.round(h.h * 100) / 100; }
  if (J || sp.method === 'sticky' || sp.method === 'braise') r.slow = time > 75;
  if (sp.gear) { r.gear = sp.gear; if (handsOn) r.handsOn = handsOn; }
  return worldSwap(state, r);
}
const dedupeWords = t => { const w = t.split(' '), out = []; for (const x of w) { const p = out[out.length - 1]; if (p && x.length > 3 && p.length > 3 && p.slice(0, 4).toLowerCase() === x.slice(0, 4).toLowerCase()) continue; out.push(x); } return out.join(' '); };
const fmtMins = m => m < 60 ? m + ' minutes' : `${Math.floor(m / 60)} hr${m >= 120 ? 's' : ''}${m % 60 ? ' ' + (m % 60) + ' min' : ''}`;
function madeUpName(sp, main, base, kit, veg) {
  const m = main.cutFrom ? main.n.replace(/s$/, '') : main.short === 'chickpea' ? 'chickpea' : main.short;
  const v = veg.filter(x => !['onion', 'red-onion'].includes(x) && VEG[x].kind !== 'side')[0];
  const vbit = v ? ` & ${single(vegName(v))}` : '';
  const bShort = base ? single(base.n.replace(/^basmati /, '').replace(/^oven /, '')) : '';
  const A = cap(kit.adj);
  switch (sp.method) {
    case 'traybake': return `${A} ${m}${vbit} traybake`;
    case 'panfry': return kit.adj === 'roast' ? `${m.charAt(0).toUpperCase() + m.slice(1)}${main.cutFrom || /chop/.test(main.n) ? (main.cutFrom ? 's' : ' chops') : ''} with ${base ? (base.forms && base.forms.panfry === 'mash' ? 'mash' : base.n) : 'greens'} & gravy` : `${A} ${m} with ${base ? (base.forms && base.forms.panfry === 'mash' ? 'mash' : base.n) : 'greens'}`;
    case 'stirfry': return `${A} ${m}${vbit} ${sp.base === 'noodles' ? 'noodles' : 'stir-fry'}`;
    case 'friedrice': return `${cap(m)}${vbit} fried rice`;
    case 'pasta': return `${A} ${m}${vbit} ${sp.base === 'gnocchi' ? 'gnocchi' : 'pasta'}`;
    case 'simmer': return `${A} ${m}${vbit} ${main.mince ? 'ragù' : 'casserole'}${sp.base === 'potato' ? ' & mash' : ''}`;
    case 'curry': return `${cap(m)}${vbit} ${kit.adj === 'coconut' ? 'coconut curry' : 'curry'}`;
    case 'wraps': return `${A} ${m} ${sp.base === 'pitta' ? 'pittas' : 'wraps'}`;
    case 'bowl': return `${A} ${m} ${bShort} bowl`.replace(/\s+/g, ' ');
    case 'bake': return `${A} ${m}${vbit} ${sp.base === 'potato' ? 'potato bake' : sp.base === 'gnocchi' ? 'gnocchi bake' : 'pasta bake'}`;
    case 'burgers': return m === 'burger' ? `${A} burgers` : `${A} ${m} burgers`;
    case 'soup': return `${A} ${m}${vbit} soup`;
    case 'noodlesoup': return `${A} ${m} noodle soup`;
    case 'frittata': return `${cap(join(veg.filter(x => !['onion', 'red-onion'].includes(x)).slice(0, 2).map(x => single(vegName(x)))) || 'Veg')} frittata`.replace(/^./, c => c.toUpperCase());
    case 'shakshuka': return `${A} baked eggs${sp.main !== 'eggs' ? ' with ' + m : ''}`;
    case 'hash': return `${A} ${m}${vbit} hash`;
    case 'loaded': return `${A} ${m} loaded ${sp.base === 'chips' ? 'fries' : 'potatoes'}`;
    case 'quesadilla': return `${A} ${m} quesadillas`;
    case 'flatbread': return `${A} ${m} flatbread pizza`;
    case 'pie': return `${A} ${m}${vbit} pie`;
    case 'salad': return `Warm ${kit.adj} ${m}${vbit} salad`;
    case 'risotto': return `${A} ${m}${vbit} risotto`;
    case 'roast': return `${kit.adj === 'roast' ? 'Roast' : A + ' roast'} ${m}${base && sp.base === 'potato' ? ' & roasties' : ''}`;
    case 'pulled': return `${A} pulled ${m}${sp.base === 'buns' ? ' buns' : sp.base === 'wraps' ? ' wraps' : sp.base === 'rice' ? ' rice bowls' : sp.base === 'chips' ? ' loaded fries' : ''}`;
    case 'braise': return main.joint ? `${kit.adj === 'roast' ? 'Pot-roast' : A + ' pot-roast'} ${m}` : `${A} ${m} stew`;
    case 'sticky': return `Sticky ${kit.adj} ${main.n.replace(/^chicken (wings|drumsticks)$/, '$1')}`.replace(/sticky sticky/i, 'Sticky');
  }
  return `${A} ${m}`;
}
// "Like that X you liked"
export function likeThis(state, r) {
  if (!r.spec) return null; const all = C.allRecipes(state);
  const liked = Object.entries(state.dishVotes || {}).filter(([, v]) => v > 0).map(([id]) => all[id]).filter(Boolean)
    .concat(Object.entries(state.ratings || {}).filter(([, x]) => x.r >= 4).map(([id]) => all[id]).filter(Boolean)).filter(x => x.id !== r.id && x.src !== 'built');
  for (const x of liked) { const p = guessParts(x); if (p.kit === r.spec.kit && (p.method === r.spec.method || (p.main && MAINS[p.main] && MAINS[r.spec.main] && MAINS[p.main].grp === MAINS[r.spec.main].grp))) return x.title; }
  return null;
}

/* ================= Scoring & choosing ================= */
/* ---------- Your kitchen kit ---------- */
export const gearOf = state => ({ oven: true, hob: true, microwave: true, airfryer: false, slowcooker: false, pan: true, pot: true, tin: true, dish: true, ...(state.gear || {}) });
// Which pan, pot or tin each way of cooking needs (an air fryer or slow cooker stands in when it's used)
export const KIT_NEED = { panfry: 'pan', hash: 'pan', frittata: 'pan', shakshuka: 'pan', burgers: 'pan', quesadilla: 'pan', stirfry: 'pan', friedrice: 'pan', simmer: 'pot', curry: 'pot', soup: 'pot', noodlesoup: 'pot', pasta: 'pot', risotto: 'pot', braise: 'pot', pulled: 'pot', roast: 'tin', traybake: 'tin', sticky: 'tin', loaded: 'tin', flatbread: 'tin', bake: 'dish', pie: 'dish' };
// air fryer minutes at 200°C for each main (from raw)
export const AFT = { 'chicken-thigh': 18, 'chicken-breast': 15, 'chicken-drum': 24, 'chicken-wings': 22, sausages: 12, salmon: 10, 'white-fish': 10, 'frozen-fish': 14, 'fish-cakes': 12, halloumi: 8, chickpeas: 14, 'pork-chop': 13, 'pork-fillet': 18, 'lamb-chops': 10, 'turkey-breast': 15, nuggets: 10, tofu: 14, prawns: 7, burgers: 11, 'pork-belly': 25, 'pork-ribs': 30, gnocchi: 12, 'sweet-potato': 18 };
const HOB_ONLY = new Set(['panfry', 'stirfry', 'simmer', 'curry', 'pasta', 'soup', 'noodlesoup', 'friedrice', 'risotto', 'shakshuka', 'frittata', 'hash', 'quesadilla', 'burgers']);
const OVEN_ONLY = new Set(['bake', 'pie', 'flatbread', 'roast', 'traybake', 'sticky', 'braise']);
function afOk(meth, mid, stock) {
  if (meth === 'traybake' || meth === 'panfry') return !!AFT[mid] && !['pork-belly', 'pork-ribs'].includes(mid);
  if (meth === 'sticky') return ['chicken-wings', 'chicken-drum', 'pork-belly', 'pork-ribs'].includes(mid);
  if (meth === 'roast') return mid === 'whole-chicken' && ((stock && stock.get(mid)) || 1500) <= 1900;
  return meth === 'loaded';
}
const scOk = (meth, m) => meth === 'pulled' || meth === 'braise' || (['simmer', 'curry'].includes(meth) && !!m.slow);
const okMethod = (m, opts) => { const t = METHODS[m].t; if (opts.maxTime && t > opts.maxTime + 5) return false; if (opts.methods && !opts.methods.includes(m)) return false; return true; };
const FEEL2FAM = { American: 'american', Mediterranean: 'med', Thai: 'thai', Chinese: 'asian', Japanese: 'asian', Mexican: 'mex', Italian: 'italian', French: 'french', Indian: 'indian', British: 'british', Irish: 'british', Portuguese: 'med', Greek: 'med', Moroccan: 'mideast', 'Middle Eastern': 'mideast', Asian: 'asian' };
const DEFAULT_VEG = ['onion', 'pepper', 'carrot', 'broccoli', 'spinach', 'peas', 'frozen-veg', 'courgette', 'mushroom', 'cherry-tomato', 'salad', 'green-beans', 'sweetcorn'];
/* ---------- Flavour pairing map: what genuinely goes with what ---------- */
const PAIR_SRC = [
  'g:pork apple mustard honey sage dried-thyme dried-rosemary cabbage carrot onion bbq-sauce soy-sauce five-spice ginger fennel paprika garlic cider leek potato',
  'g:beef onion mushroom garlic worcestershire mustard carrot pepper chilli-powder cumin soy-sauce ginger thyme dried-thyme stock gravy tomato-puree chopped-tomatoes bbq-sauce potato',
  'g:lamb mint rosemary dried-rosemary garlic lemon cumin yogurt feta aubergine chickpeas peas potato onion tomato-puree ground-coriander',
  'g:chicken lemon garlic thyme dried-thyme paprika honey soy-sauce ginger mushroom leek bacon cream pesto peri-spice cajun-spice curry-paste coconut-milk sweetcorn pepper tarragon',
  'g:fish lemon lime garlic dill parsley capers butter chilli ginger soy-sauce spring-onion potato peas cherry-tomato spinach fennel olives',
  'salmon soy-sauce honey ginger lime sesame-oil broccoli asparagus potato spinach cream-cheese teriyaki dill',
  'prawns garlic chilli lime coconut-milk spring-onion pepper sweet-chilli tomato-puree chorizo',
  'eggs bacon spinach cheddar feta mushroom potato tomato chorizo spring-onion soy-sauce chilli-flakes peppers',
  'halloumi lemon honey chilli mint pepper courgette red-onion chickpeas couscous cherry-tomato',
  'chickpeas spinach cumin tomato-puree lemon feta curry-paste coconut-milk sweet-potato harissa',
  'tofu soy-sauce ginger garlic sesame-oil chilli spring-onion broccoli peanut-butter',
  'mushroom garlic thyme cream parmesan spinach soy-sauce',
  'spinach garlic feta nutmeg cream lemon',
  'broccoli garlic lemon chilli-flakes soy-sauce cheddar parmesan',
  'cauliflower cumin turmeric cheddar curry-paste',
  'sweet-potato chilli lime cumin feta black-beans',
  'butternut sage feta chilli',
  'courgette lemon feta mint garlic',
  'cabbage bacon butter caraway',
  'potato rosemary dried-rosemary garlic cheddar bacon',
  'tomato basil garlic mozzarella olives',
  'pepper chorizo paprika onion',
  'carrot honey cumin ginger',
  'peas mint bacon',
  'leek cream cheddar mustard',
];
const PAIR = {};
for (const line of PAIR_SRC) { const [a, ...bs] = line.split(' '); for (const b of bs) { (PAIR[a] = PAIR[a] || new Set()).add(b); (PAIR[b] = PAIR[b] || new Set()).add(a); } }
const keyOf = id => [id, MAINS[id] ? 'g:' + MAINS[id].grp : null].filter(Boolean);
export function pairScore(ids) {
  let n = 0; const ks = ids.map(keyOf);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (ks[i].some(a => ks[j].some(b => PAIR[a] && PAIR[a].has(b)))) n++;
  return n;
}
const pairWith = (v, ids) => ids.reduce((a, id) => a + (keyOf(id).some(k => PAIR[k] && PAIR[k].has(v)) ? 1 : 0), 0);

/* ---------- The chef's rulebook: catch dishes a cook wouldn't make ---------- */
const STARCH = new Set(['rice', 'basmati', 'pasta', 'spaghetti', 'gnocchi', 'noodles', 'potato', 'sweet-potato', 'chips', 'couscous', 'risotto-rice']);
const RICH = new Set(['cream', 'double-cream', 'creme-fraiche', 'cream-cheese', 'cheddar', 'mozzarella', 'parmesan', 'coconut-milk', 'butter', 'pesto', 'peanut-butter', 'mayo', 'sour-cream']);
const SWEET = new Set(['honey', 'bbq-sauce', 'ketchup', 'sweet-chilli', 'syrup', 'sugar']);
const ACID = new Set(['lemon', 'lime', 'vinegar', 'capers', 'jalapenos', 'salsa', 'olives', 'chopped-tomatoes', 'passata', 'yogurt', 'feta', 'pickles', 'red-onion']);
const FRESH = new Set(['coriander', 'parsley', 'basil', 'mint', 'spring-onion', 'salad', 'cherry-tomato', 'avocado', 'cucumber', 'rocket', 'coleslaw']);
const CRUNCH = new Set(['nuts', 'spring-onion', 'breadcrumbs', 'coleslaw', 'cucumber', 'red-onion', 'salad', 'crisps']);
const CLASH = [['soy-sauce', 'parmesan'], ['soy-sauce', 'mozzarella'], ['soy-sauce', 'feta'], ['fish-sauce', 'cream'], ['fish-sauce', 'cheddar'], ['curry-paste', 'pesto'], ['curry-paste', 'mozzarella'], ['pesto', 'bbq-sauce'], ['mint-sauce', 'g:fish'], ['bbq-sauce', 'g:fish'], ['peanut-butter', 'cheddar'], ['coconut-milk', 'cheddar'], ['coconut-milk', 'parmesan'], ['cinnamon', 'g:fish'], ['honey', 'cheddar'], ['sweet-chilli', 'parmesan'], ['oyster-sauce', 'cheddar'], ['five-spice', 'cheddar'], ['salsa', 'parmesan']];
const CLASHSET = new Set(CLASH.flatMap(([a, b]) => [a + '|' + b, b + '|' + a]));
export function chefCheck(sp, kit) {
  const ids = [sp.main, sp.base, sp.flair, ...(sp.veg || []), ...(sp.add || []), ...kit.core.map(c => c[0]), ...kit.extra.map(c => c[0])].filter(Boolean);
  const keys = ids.flatMap(keyOf), why = [];
  let fail = false, score = 0;
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) if (CLASHSET.has(keys[i] + '|' + keys[j])) { fail = true; why.push('clash ' + keys[i] + '+' + keys[j]); }
  // one starch is plenty (pasta + potatoes, rice + chips...)
  if (ids.filter(id => STARCH.has(id)).length > 1) { fail = true; why.push('two starches'); }
  // too sweet / too rich
  if (ids.filter(id => SWEET.has(id)).length > 2) { fail = true; why.push('too sweet'); }
  const rich = ids.filter(id => RICH.has(id)).length + (kit.tags.includes('fl:creamy') ? 1 : 0);
  if (rich > 3) { fail = true; why.push('too rich'); } else if (rich === 3) score -= 1;
  // cheese and fish mostly don't mix (tuna melts, smoked salmon & cream cheese are fine)
  const g = MAINS[sp.main] && MAINS[sp.main].grp;
  if (g === 'fish' && !['tuna', 'smoked-salmon'].includes(sp.main) && !['bake', 'pie'].includes(sp.method) && (sp.add || []).some(a => ['cheddar', 'mozzarella', 'parmesan', 'halloumi'].includes(a))) { score -= 2; why.push('fish & cheese'); }
  // a plate needs balance: richness wants something sharp or fresh, soft dishes want a bit of crunch
  const hasAcid = ids.some(id => ACID.has(id)), hasFresh = ids.some(id => FRESH.has(id)) || !!kit.finish;
  if (rich >= 2 && !hasAcid) score -= 0.8;
  if (hasAcid) score += 0.3; if (hasFresh) score += 0.3;
  if ((sp.veg || []).length > 4) score -= 1;
  if ((sp.veg || []).length === 0 && !['burgers', 'pulled', 'sticky'].includes(sp.method) && g !== 'veg') score -= 0.7;
  // pairings that are known to work
  score += Math.min(4, pairScore([sp.main, ...(sp.veg || []), ...(sp.add || []), ...kit.core.map(c => c[0])])) * 0.45;
  // the maths: shared aroma compounds + how often real cooks combine them (Ahn et al. flavour network)
  const hm = Chef.ready() ? Chef.harmony(ids, sp.method, sp.main) : null;
  if (hm && hm.pairs >= 3) { score += (hm.h - 0.14) * 7; if (hm.h < 0.03) { fail = true; why.push('poor harmony'); } }
  return { fail, score, why, rich, hasAcid, hasFresh, harmony: hm ? hm.h : null };
}
// The finishing touch: fix balance with what's in the kitchen
function finishingTouch(state, sp, kit, stock, ck) {
  const inSt = id => (stock.get(id) || 0) > 0 && okItem(state, id), used = new Set([sp.main, sp.base, ...(sp.veg || []), ...(sp.add || []), ...kit.core.map(c => c[0]), ...kit.extra.map(c => c[0])]);
  const fam = kit.fam || FEEL2FAM[kit.feel] || 'british';
  const pick = list => list.find(([id, f]) => !used.has(id) && inSt(id) && (!f || f.split(' ').includes(fam)));
  if (ck.rich >= 2 && !ck.hasAcid) { const p = pick([['lemon', 'italian med british french mideast american indian'], ['lime', 'thai asian mex indian'], ['vinegar', 'british american asian'], ['pickles', 'american british']]); if (p) return { id: p[0], text: `Finish with a squeeze of ${ITEM[p[0]].n.toLowerCase()} — it cuts through the richness.` }; }
  if (['curry', 'simmer', 'pasta', 'bake', 'risotto', 'soup', 'braise', 'pulled', 'pie'].includes(sp.method) && !ck.hasFresh) { const p = pick([['coriander', 'indian thai mex asian mideast'], ['parsley', 'med french british italian mideast'], ['basil', 'italian med'], ['spring-onion', 'asian thai mex american'], ['mint', 'mideast indian med']]); if (p) return { id: p[0], text: `Scatter over some ${ITEM[p[0]].n.toLowerCase().replace('fresh ', '')} for freshness.` }; }
  if (['curry', 'simmer', 'risotto', 'soup', 'bowl', 'pasta'].includes(sp.method) && !(sp.veg || []).concat(sp.add || []).some(id => CRUNCH.has(id))) { const p = pick([['nuts', 'asian thai indian med mideast'], ['breadcrumbs', 'italian british french'], ['spring-onion', 'asian thai']]); if (p) return { id: p[0], text: p[0] === 'breadcrumbs' ? 'For crunch, toast a handful of breadcrumbs in a little oil and garlic and scatter over.' : p[0] === 'nuts' ? 'Toast a handful of nuts in a dry pan and scatter over for crunch.' : 'Slice spring onion over the top for crunch.' }; }
  return null;
}

// How soon things in the kitchen go off (days), so they get used first
export function urgencyMap(state, date) {
  const m = new Map(), d0 = date || C.today();
  for (const p of state.pantry || []) if (p.item && p.exp && ITEM[p.item] && !ITEM[p.item].staple) { const d = C.daysBetween(d0, p.exp), k = C.standinOf(p.item); if (!m.has(k) || d < m.get(k)) m.set(k, d); }
  return m;
}
const urgBonus = (d, big) => d == null ? 0 : d <= 1 ? big : d <= 3 ? big * 0.6 : d <= 5 ? big * 0.25 : 0;
// Ideas you've already been shown recently count against them, so Make keeps moving
const recentKey = sp => sp.main + '|' + sp.kit + '|' + sp.method;
const spItems = sp => { const k = kitOf(sp.kit); return [...new Set([sp.main, sp.base, ...(sp.veg || []), ...(sp.add || []), sp.flair, ...(k ? k.core.map(c => c[0]) : [])].filter(Boolean))]; };
export const recentUse = (state, id) => { const e = (state.makeUse || {})[id]; return e ? e.n * Math.pow(0.6, C.daysBetween(e.d, C.today())) : 0; };
export function noteShown(state, sps) {
  const t = C.today(), m = state.makeSeen = state.makeSeen || {}, u = state.makeUse = state.makeUse || {};
  for (const sp of sps) for (const id of spItems(sp)) { const e = u[id]; u[id] = { n: (e ? e.n * Math.pow(0.6, C.daysBetween(e.d, t)) : 0) + 1, d: t }; }
  for (const sp of sps) { const k = recentKey(sp), e = m[k]; m[k] = { n: (e ? e.n * Math.pow(0.6, C.daysBetween(e.d, t)) : 0) + 1, d: t }; }
  const keys = Object.keys(m); if (keys.length > 600) for (const k of keys.sort((a, b) => m[a].d.localeCompare(m[b].d)).slice(0, keys.length - 500)) delete m[k];
}
/* ---------- Pantry flair: the odd things in your kitchen (fruit, kimchi, blue cheese...) as a finishing component ---------- */
const FRUITM = 'bowl wraps burgers traybake panfry salad sticky roast pulled loaded quesadilla';
export const FLAIR = {
  apple: [FRUITM, 'salsa'], pears: [FRUITM, 'salsa'], orange: [FRUITM + ' stirfry', 'salsa'], mango: [FRUITM + ' curry stirfry', 'salsa'], pineapple: [FRUITM + ' stirfry friedrice curry', 'salsa'], berries: ['salad bowl', 'scatter'], strawberries: ['salad bowl wraps', 'salsa'], grapes: ['salad roast traybake', 'roastfruit'], plums: ['roast traybake panfry sticky', 'roastfruit'], kiwi: ['bowl wraps salad', 'salsa'], melon: ['salad', 'scatter'], pomegranate: ['salad bowl curry traybake wraps flatbread braise', 'scatter'],
  'blue-cheese': ['panfry salad burgers loaded pasta traybake', 'crumble'], 'goats-cheese': ['salad traybake pasta flatbread frittata bowl roast', 'dot'], kimchi: ['bowl friedrice burgers wraps noodlesoup stirfry quesadilla', 'kimchi'], hummus: ['wraps flatbread bowl traybake salad panfry', 'hummus'],
  cucumber: ['curry bowl wraps burgers stirfry salad sticky pulled noodlesoup', 'pickle'], beetroot: ['salad bowl traybake wraps burgers roast', 'beet'], dates: ['curry braise simmer', 'dates'], 'dark-chocolate': ['simmer braise', 'choc'], 'creme-fraiche': ['soup curry simmer pasta pie loaded', 'swirl'], 'sour-cream': ['wraps loaded quesadilla bowl soup', 'swirl'], avocado: ['wraps bowl burgers salad quesadilla', 'avo'], pickles: ['burgers wraps loaded pulled sticky', 'scatter'], gherkins: ['burgers wraps loaded pulled', 'scatter']
};
const FLAIR_FAM = { salsa: 'mex american thai asian med', kimchi: 'asian thai american mex', crumble: 'american british french italian', dot: 'med italian french british', hummus: 'mideast med', beet: 'british med mideast american', dates: 'mideast indian', roastfruit: 'british french med italian american', avo: 'mex american med' };
function pickFlair(state, sp, k, pool) {
  const used = new Set(spItems(sp)); let best = null, bv = 0.6;
  for (const id of pool) {
    if (used.has(id) || !FLAIR[id][0].split(' ').includes(sp.method)) continue;
    const fam = k.fam || FEEL2FAM[k.feel] || 'british', okFam = FLAIR_FAM[FLAIR[id][1]]; if (okFam && !okFam.split(' ').includes(fam)) continue;
    if (id === 'dark-chocolate' && !['chilli', 'smokybbq', 'moroccan'].includes(sp.kit)) continue;
    if (FLAIR[id][1] === 'swirl' && (k.tags.includes('fl:creamy') || used.has('cream') || used.has('coconut-milk'))) continue;
    const core = k.core.map(c => c[0]);
    const v = F.affinity(sp.main, id).s * 0.8 + Math.max(0, ...core.map(c => F.affinity(c, id).s)) * 0.5 + (F.pairUsual(sp.main, id) ? 0.4 : 0) + (F.contrastOf(sp.main, id)) * 0.3 - recentUse(state, id) * 0.15 + Math.random() * 0.35;
    if (v > bv && !chefCheck({ ...sp, flair: id }, k).fail) { bv = v; best = id; }
  }
  return best;
}
const LIGHT = new Set(['ham', 'nuggets', 'fish-fingers', 'hot-dogs', 'frozen-burgers']);
export function candidates(state, opts = {}) {
  // opts: stock (Map id->qty), serves, priority, used (week history), want: {main, kit, base, method, veg[], tag}, exclude: Set, maxTime, kids, protein, quick, mood, useStock, compose
  const T = partTaste(state), serves = opts.serves || 2, stock = opts.stock || new Map(), used = opts.used || { kit: {}, method: {}, main: {}, base: {}, lastMain: null };
  const pr = opts.priority || 'balanced', W = { save: { reuse: 3, extra: 1.1, vary: 0.6 }, balanced: { reuse: 1.6, extra: 0.5, vary: 1.2 }, variety: { reuse: 0.6, extra: 0.15, vary: 2.2 } }[pr];
  const want = opts.want || {}, ex = opts.exclude || new Set(), useStock = !!opts.useStock;
  const has = (id, need) => (stock.get(id) || 0) >= need * 0.6;
  const inSt = id => (stock.get(id) || 0) > 0;
  const composed = opts.composedKits || composeKits(state, stock, opts.compose ?? (useStock ? 26 : 14));
  const kitList = Object.entries(KITS).concat(composed.map(k => [k.id, k]));
  for (const id of stock.keys()) { if (!['hot-dogs', 'deli-meat', 'other-meat', 'other-fish', 'frozen-burgers'].includes(id)) ensureMain(id); ensureVeg(id); }
  const urg = opts.urgent || urgencyMap(state, opts.date), seenM = opts.recent ? (state.makeSeen || {}) : null, tday = C.today();
  const flairPool = useStock ? [...stock.keys()].filter(id => FLAIR[id] && okItem(state, id) && !ex.has(id)) : [];
  const addPool = Object.keys(ADDIN_PP).filter(a => ITEM[a] && inSt(a) && okItem(state, a) && !ex.has(a));
  const out = [];
  for (const [mid, m] of Object.entries(MAINS)) {
    if (want.main && want.main !== mid && !(Array.isArray(want.main) && want.main.includes(mid))) continue;
    if (ex.has(mid) || !okItem(state, mid)) continue;
    if (['cooked-pork', 'cooked-beef', 'cooked-lamb'].includes(mid) && !inSt(mid) && !want.main) continue;
    const typed = !!want.main && (want.main === mid || (Array.isArray(want.main) && want.main.includes(mid)));
    if (opts.vegOnly && m.grp !== 'veg') continue;
    if (opts.protein && !['chicken', 'beef', 'pork', 'lamb', 'fish'].includes(m.grp) && mid !== 'halloumi') continue;
    const mainHave = has(mid, m.pp * serves);
    if (opts.onlyStockMains && !mainHave) continue;
    for (const meth of m.methods) {
      if (!METHODS[meth]) continue;
      if (want.method && want.method !== meth) continue;
      const GR = opts.gear ? { ...gearOf(state), ...opts.gear } : gearOf(state);
      // slow cooker: 15 minutes in the morning counts as a weeknight meal
      const gear = GR.slowcooker && scOk(meth, m) ? 'sc' : GR.airfryer && afOk(meth, mid, stock) && (meth !== 'panfry' || Math.random() < 0.5 || !GR.hob) ? 'af' : null;
      if (!GR.oven && OVEN_ONLY.has(meth) && gear !== 'af' && gear !== 'sc') continue;
      if (!GR.hob && HOB_ONLY.has(meth) && gear !== 'af' && gear !== 'sc') continue;
      if (!GR.hob && !GR.oven && gear !== 'af' && gear !== 'sc') continue;
      if (KIT_NEED[meth] && GR[KIT_NEED[meth]] === false && gear !== 'af' && gear !== 'sc') continue;
      const tech = Tech.techOf(meth, gear), mfit = Tech.fitOf(mid, tech);
      if (mfit === 0 && !typed) continue; // e.g. stewing beef can't be stir-fried
      if (gear !== 'sc') {
        if (m.slow && !opts.allowSlow && !typed) continue;
        if (!okMethod(meth, typed ? { ...opts, maxTime: null } : gear === 'af' ? { ...opts, maxTime: opts.maxTime ? opts.maxTime + 15 : null } : opts)) continue;
        if (METHODS[meth].slow && !opts.allowSlow && !typed) continue;
      }
      // eligible flavours for this main + method
      let kits = [];
      for (const [kid, k] of kitList) {
        if (want.kit && want.kit !== kid) continue;
        if (!k.methods.includes(meth) || (k.mains && !k.mains.includes(mid)) || ex.has(kid)) continue;
        if (k.composed && m.grp === 'fish' && !k.fishOk) continue;
        if (k.composed && ['eggs'].includes(mid) && k.core.some(c => ['bbq-sauce', 'peanut-butter', 'cinnamon'].includes(c[0]))) continue;
        const explicit = want.kit === kid || want.method === meth || want.tag === 'fl:spicy' || opts.spicy;
        if (!kitAllowed(state, kid, opts) && !(explicit && k.spice <= spiceCap(state, opts) + 1 && k.core.every(([id]) => okItem(state, id)))) continue;
        if (want.tag && !k.tags.includes(want.tag) && want.tag !== 'fl:spicy') continue;
        if (opts.spicy && k.spice < 1) continue;
        if (k.core.some(([id]) => ex.has(id))) continue;
        const coreHave = k.core.filter(([id]) => inSt(id) || C.stapleHave(state, id)).length / k.core.length;
        kits.push([sq(T.kit[kid]) + (k.composed ? sq(T.kit[k.fam]) * 0.3 : 0) + coreHave * (useStock ? 3 : 1) + Math.random() * 1.5, kid, k]);
      }
      if (kits.length > 6) { kits.sort((a, b) => b[0] - a[0]); kits = kits.slice(0, 4).concat(kits.slice(4).sort(() => Math.random() - 0.5).slice(0, 2)); }
      for (const [, kid, k] of kits) {
        const fam = k.fam || FEEL2FAM[k.feel] || 'british';
        // base
        const bases = Object.entries(BASES).filter(([bid, b]) => b.methods.includes(meth) && k.bases.includes(bid) && !ex.has(bid) && okItem(state, bid, b.forms && b.forms[meth] === 'mash' ? 'mashed' : null) && (!want.base || want.base === bid || (Array.isArray(want.base) && want.base.includes(bid))));
        let base = null, bs = -99;
        for (const [bid, b] of bases) { let s = sq(T.base[bid]) * 0.5 + (has(bid, b.pp * serves) ? (useStock ? 4 : 2 * W.reuse / 1.6) : 0) - (used.base[bid] || 0) * 0.4 * W.vary + Math.random() * 0.8; if (bid === 'basmati' && !has(bid, 1)) s -= 0.5; if (s > bs) { bs = s; base = bid; } }
        const needsBase = !['bowl', 'traybake', 'panfry', 'simmer', 'curry', 'soup', 'frittata', 'salad', 'shakshuka'].includes(meth);
        if (!base && needsBase) continue;
        if (meth === 'pie' && base !== 'puff-pastry') continue; if (meth === 'risotto' && base !== 'risotto-rice') continue;
        // veg: what you have first, then what suits the flavour
        const kinds = VEG_FOR[meth] || ['firm', 'quick'];
        const prefs = k.vegPref && k.vegPref.length ? k.vegPref : DEFAULT_VEG;
        let vegC = Object.keys(VEG).filter(v => kinds.includes(VEG[v].kind) && (VEG[v].kind === 'side' || Tech.fitOf(v, tech) !== 0) && !ex.has(v) && okItem(state, v) && v !== base && !(v === 'sweet-potato' && ['sweet-potato', 'potato'].includes(base)) && (prefs.includes(v) || inSt(v) || (want.veg && want.veg.includes(v))));
        const vScore = v => (inSt(v) ? (useStock ? (prefs.includes(v) ? 4.5 : 3.6) : 3) : 0) - (opts.recent ? Math.min(3, recentUse(state, v) * 0.6) : 0) + sq(T.veg[v]) * 0.4 + (want.veg && want.veg.includes(v) ? 5 : 0) + (['onion', 'pepper'].includes(v) && ['wraps', 'stirfry', 'simmer', 'curry', 'pasta', 'friedrice', 'panfry', 'soup', 'shakshuka', 'quesadilla'].includes(meth) ? 0.8 : 0) + (VEG[v].kind === 'side' && meth === 'burgers' && v === 'salad' ? 1 : 0) + Math.random() * 1.4 + (C.likeOf(state, { item: v, name: ITEM[v].n }) > 0 ? 1 : 0) + (k.extra.some(e => e[0] === v) ? 1 : 0) + pairWith(v, [mid, ...k.core.map(c => c[0])]) * 0.9 + (prefs.length - Math.max(0, prefs.indexOf(v))) * 0.1 + (opts.healthy ? 0.5 : 0);
        const ranked = vegC.map(v => [vScore(v), v]).sort((a, b) => b[0] - a[0]);
        const stockVeg = ranked.filter(([, v]) => inSt(v)).length;
        const nVeg = meth === 'burgers' ? 1 : meth === 'friedrice' ? 2 : useStock ? Math.min(3, Math.max(2, stockVeg)) : opts.healthy ? 3 : 2 + (Math.random() < 0.3 ? 1 : 0);
        const veg = (want.veg || []).filter(v => VEG[v] && okItem(state, v) && !ex.has(v)); for (const [, v] of ranked) { if (veg.length >= nVeg) break; if (veg.includes(v) || k.core.some(c => c[0] === v)) continue; veg.push(v); }
        // extras from your kitchen that suit the flavour and dish
        const addC = addPool.filter(a => a !== mid && !veg.includes(a) && !k.core.some(c => c[0] === a) && !k.extra.some(c => c[0] === a) && !(a === 'kidney-beans' && mid === 'kidney-beans') && (ADDIN_FAM[a] || '').split(' ').includes(fam) && (!ADDIN_METHODS[a] || ADDIN_METHODS[a].split(' ').includes(meth)) && !(a === 'eggs' && mid === 'eggs') && !(MAINS[a] && MAINS[a].grp !== 'veg' && (m.grp === 'veg' && opts.vegOnly)));
        const nAdd = useStock ? (Math.random() < 0.5 ? 2 : 1) : 1;
        const adds = addC.map(a => [pairWith(a, [mid, ...veg, ...k.core.map(c => c[0])]) + Math.random() * 1.2, a]).sort((x, y) => y[0] - x[0]).map(x => x[1]).slice(0, Math.random() < (useStock ? 0.85 : 0.35) ? nAdd : 0);
        if (['quesadilla', 'flatbread'].includes(meth) && !adds.some(a => ['cheddar', 'mozzarella', 'feta'].includes(a))) adds.push(fam === 'italian' ? 'mozzarella' : fam === 'med' ? 'feta' : 'cheddar');
        if (opts.mustUse) for (const id of opts.mustUse) if (ADDIN_PP[id] && !adds.includes(id) && id !== mid && !veg.includes(id) && okItem(state, id) && (!ADDIN_METHODS[id] || ADDIN_METHODS[id].split(' ').includes(meth))) adds.push(id);
        // cured meats: at most one, and never as an extra on a dish that already has a meat main of its own kind
        { const cur = CURED.has(mid) ? 1 : 0; let n = cur; for (let i = adds.length - 1; i >= 0; i--) { const x = adds[i]; if (!CURED.has(x)) continue; if (n >= 1 || (x === 'ham' && ['beef', 'lamb', 'fish', 'pork'].includes(m.grp)) || (m.grp === 'fish')) adds.splice(i, 1); else n++; } }
        // a classic dish keeps to its classic ingredients: no ham in a bolognese
        const nm0 = NAMED.find(x => x.main.includes(mid) && x.kit.split(' ').includes(kid) && x.method.split(' ').includes(meth) && (!x.base || x.base.includes(base)));
        // you asked for green beans: don't push them into a bolognese, cook something they belong in
        if (nm0 && !want.named && want.veg && want.veg.length) { const cn = CANON[nm0.n] || {}; if (cn.veg && want.veg.some(v => !cn.veg.includes(v))) continue; }
        if (nm0) { const cn = CANON[nm0.n] || CANON_DEF[meth] || {}, okA = cn.add || [];
          for (let i = adds.length - 1; i >= 0; i--) if (!okA.includes(adds[i]) && !(opts.mustUse && opts.mustUse.has && opts.mustUse.has(adds[i]))) adds.splice(i, 1);
          if (cn.veg) { const keep = veg.filter(v => cn.veg.includes(v) || (want.veg && want.veg.includes(v))); veg.splice(0, veg.length, ...keep); const target = Math.min(cn.n ?? 2, cn.veg.length);
            for (const v of cn.veg.filter(v => VEG[v] && okItem(state, v) && !ex.has(v)).sort((a, b) => (inSt(b) ? 1 : 0) - (inSt(a) ? 1 : 0))) { if (veg.length >= target) break; if (!veg.includes(v) && v !== base) veg.push(v); } } }
        const sp = { main: mid, base, kit: kid, method: meth, veg, add: adds };
        if (opts.mustUse) { const f = [...opts.mustUse].find(id => FLAIR[id] && FLAIR[id][0].split(' ').includes(meth) && !spItems(sp).includes(id)); if (f && !chefCheck({ ...sp, flair: f }, k).fail) sp.flair = f; }
        if (!sp.flair && !nm0 && useStock && flairPool.length && Math.random() < 0.65) { const f = pickFlair(state, sp, k, flairPool); if (f) sp.flair = f; }
        if (gear) sp.gear = gear;
        if (!GR.oven && !GR.airfryer && ['chips'].includes(base)) continue;
        if (typed && want.qty && m.joint) sp.qty = want.qty;
        const ck = chefCheck(sp, k); if (ck.fail) { if (!(sp.add || []).length) continue; sp.add = []; const ck2 = chefCheck(sp, k); if (ck2.fail) continue; }
        // score
        const items = [mid, base, sp.flair, ...veg, ...adds, ...k.core.map(c => c[0])].filter(Boolean);
        const fresh = [...new Set(items.filter(id => ITEM[id] && !(ITEM[id].staple && C.stapleHave(state, id))))];
        const inStock = fresh.filter(id => inSt(id)).length, extras = fresh.length - inStock;
        let s = sq(T.kit[kid]) * 1.1 + sq(T.method[meth]) * 0.8 + sq(T.main[mid]) * 0.7 + sq(T.grp[m.grp]) * 0.5 + sq(T.base[base]) * 0.3;
        if (k.composed) s += sq((T.kit[k.fam] || 0)) * 0.3 + Object.entries(KITS).filter(([, kk]) => kk.feel === k.feel).reduce((a, [id]) => a + sq(T.kit[id]), 0) * 0.15;
        if (useStock) s += inStock * 1.2 - extras * 1.6;
        // the big, valuable things in your kitchen (a whole joint) matter more than a pack of sliced ham
        if (useStock && inSt(mid)) { const portions = (stock.get(mid) || 0) / Math.max(1, m.pp * serves); s += Math.min(2.5, Math.log2(1 + portions)) * 0.6 + Math.min(2, (ITEM[mid].p || 1) / 4); }
        if (LIGHT.has(mid) && !opts.quick && !opts.kids) s -= 1.2;
        else s += W.reuse * (inStock / Math.max(1, fresh.length)) * 2 + (mainHave ? W.reuse : 0) - W.extra * extras * 0.6;
        s -= W.vary * k.tags.reduce((a, tg) => a + ((used.tags || {})[tg] || 0) * 0.35, 0);
        s -= W.vary * ((used.kit[kid] || 0) * 1.4 + (used.method[meth] || 0) * 0.7 + (used.main[mid] || 0) * (pr === 'save' ? 0.1 : 0.6)) + (used.lastMain === mid ? 0.8 : 0);
        const nm = NAMED.find(x => x.main.includes(mid) && x.kit.split(' ').includes(kid) && x.method.split(' ').includes(meth) && (!x.base || x.base.includes(base)));
        if (nm) s += opts.named === false ? 0 : 0.5; if (nm && used.titles && used.titles[nm.n]) s -= 4;
        const comboFb = ((state.partFb || {}).combo || {})[kid + '|' + meth + '|' + m.grp]; if (comboFb) s += comboFb * 1.2;
        if (opts.kids) s += ['pasta', 'bake', 'burgers', 'wraps', 'friedrice', 'quesadilla', 'flatbread', 'pie', 'loaded'].includes(meth) ? 1 : -0.5;
        if (opts.quick) s += METHODS[meth].t <= 25 ? 1.5 : -1.5;
        if (opts.mood === 'comfort') s += ['bake', 'simmer', 'pasta', 'curry', 'pie', 'loaded', 'risotto', 'soup'].includes(meth) || k.tags.includes('fl:creamy') || k.tags.includes('fl:cheesy') ? 2 : -0.5;
        if (opts.mood === 'light') s += ['bowl', 'stirfry', 'traybake', 'salad', 'noodlesoup', 'soup'].includes(meth) && !k.tags.includes('fl:creamy') && !k.tags.includes('fl:cheesy') ? 2 : -1.5;
        if (opts.healthy) s += (k.tags.includes('fl:creamy') || k.tags.includes('fl:cheesy') ? -1.2 : 0.3) + (m.grp === 'fish' || m.grp === 'veg' ? 0.4 : 0);
        if (opts.cheap) s += ['chickpeas', 'kidney-beans', 'lentils', 'eggs', 'sausages', 'chicken-thigh', 'beef-mince', 'pork-mince', 'butter-beans'].includes(mid) ? 1.2 : -0.6;
        if (want.veg && want.veg.length) s += want.veg.filter(v => VEG[v] && kinds.includes(VEG[v].kind)).length * 2.5 - (m.slow || METHODS[meth].slow ? 2 : 0);
        s += chefCheck(sp, k).score;
        s += urgBonus(urg.get(mid), 5) + veg.reduce((a, v) => a + urgBonus(urg.get(v), 1.2), 0) + (base ? urgBonus(urg.get(base), 0.8) : 0) + adds.reduce((a, v) => a + urgBonus(urg.get(v), 0.6), 0);
        if (m.cut && !['roast', 'pulled', 'braise'].includes(meth)) s -= opts.allowSlow && !(urg.get(mid) <= 3) ? 2 : 0.4;
        if (seenM) { const e = seenM[recentKey(sp)]; if (e) s -= Math.min(5, e.n * Math.pow(0.6, C.daysBetween(e.d, tday)) * 1.6); }
        if (mfit === 2) s += 0.6; else if (mfit === 1) s -= 0.2;
        if (gear === 'af' && opts.maxTime) s += 0.8; if (gear === 'sc') s += opts.allowSlow ? 0 : 0.3 - (used.gear || 0) * 1.5;
        if (opts.mustUse) { const its = new Set(spItems(sp)); for (const id of opts.mustUse) if (its.has(id)) s += 2.5; }
        if (want.kit === kid) s += 5; if (want.main === mid) s += 3; if (want.method === meth) s += 4; if (want.named) { if (nm && nm.n === want.named) s += 8; else if (!(want.kit === kid && want.method === meth)) s -= 3; }
        if (opts.seen && opts.seen.has(specKey(sp))) s -= 6;
        out.push({ sp, s: s + Math.random() * (opts.noise ?? 1.2), mainHave, inStock, extras });
      }
    }
  }
  return out.sort((a, b) => b.s - a.s);
}
// A few different options (not five versions of the same thing)
// Pick n options that are good AND different from each other (and from ones already shown)
const simSp = (a, b) => (a.main === b.main ? 1.7 : MAINS[a.main] && MAINS[b.main] && MAINS[a.main].grp === MAINS[b.main].grp ? 0.4 : 0) + (a.kit === b.kit ? 1.2 : (kitOf(a.kit) || {}).feel === (kitOf(b.kit) || {}).feel ? 0.4 : 0) + (a.method === b.method ? 0.9 : 0) + (a.base === b.base ? 0.3 : 0);
export function options(state, opts = {}, n = 3) {
  AS = (opts.want && opts.want.as) || null;
  const picked = [], w = { ...(opts.want || {}) }, seen = opts.seen || new Set();
  let pool = candidates(state, { ...opts, want: w });
  const lock = w.lock && w.main, vegLock = (w.veg || []).length > 0;
  for (const drop of ['tag', 'base', 'veg', 'method', 'kit', 'main']) { if ((drop === 'main' && lock) || (drop === 'veg' && vegLock)) continue; if (pool.filter(x => !seen.has(specKey(x.sp))).length >= n * 2) break; if (opts.vegOnly && drop === 'main' && w.main && MAINS[w.main] && MAINS[w.main].grp !== 'veg') { delete w.main; } if (!w[drop] || (Array.isArray(w[drop]) && !w[drop].length)) continue; delete w[drop]; pool = pool.concat(candidates(state, { ...opts, want: w })); }
  if (pool.filter(x => !seen.has(specKey(x.sp))).length < n) pool = pool.concat(candidates(state, { ...opts, want: lock || vegLock ? { main: lock ? w.main : undefined, qty: w.qty, veg: w.veg, lock: w.lock } : {}, allowSlow: lock ? true : opts.allowSlow, quick: false, spicy: false, mood: null, onlyStockMains: false, maxTime: opts.maxTime ? opts.maxTime + 20 : null }));
  { const sc = pool.map(x => x.s).sort((a, b) => b - a), ref = sc.length ? sc[0] - 4 : 4;
    let pc = []; try { if (!opts.noProc && (w.proc || (!w.kit && !w.method && !w.tag && !opts.methods))) pc = P.candidates(state, { ...opts, want: w }, ref); } catch (e) { console.warn('process', e); }
    if (pc.length) pool = pool.concat(pc).sort((a, b) => b.s - a.s); }
  pool = pool.filter(x => !seen.has(specKey(x.sp)));
  const titles = opts.seenTitles || new Set();
  while (picked.length < n && pool.length) {
    let best = null, bv = -1e9;
    const usedNow = new Map(); for (const p of picked) for (const id of spItems(p.sp)) usedNow.set(id, (usedNow.get(id) || 0) + 1);
    for (const x of pool.slice(0, 400)) { const pen = picked.reduce((a, p) => a + simSp(x.sp, p.sp), 0); let v = x.s - pen * 1.6;
      if (opts.useStock && opts.stock) for (const id of spItems(x.sp)) { if (!(opts.stock.get(id) > 0) || ['garlic', 'onion'].includes(id) || (ITEM[id] && ITEM[id].staple)) continue; const n = usedNow.get(id) || 0; v += n ? -0.9 * n : 0.7 / (1 + (opts.recent ? recentUse(state, id) * 0.7 : 0)); }
      if (v > bv) { bv = v; best = x; } }
    pool = pool.filter(x => x !== best);
    // the same dish from both engines (a roast beef dinner twice): keep the first
    { const famOf = sp => sp.proc ? sp.method.slice(2) : ({ roast: 'roast', curry: 'curry', soup: 'soup', risotto: 'risotto', pie: 'pie', bake: 'bake' })[sp.method];
      const f = famOf(best.sp); if (f && picked.some(p => famOf(p.sp) === f && p.sp.main === best.sp.main && !!p.sp.proc !== !!best.sp.proc)) continue; }
    const r = buildMeal(state, best.sp, opts.serves, opts.stock);
    if (!r) continue;
    if (titles.has(r.title)) continue; titles.add(r.title); seen.add(specKey(best.sp)); best.r = r; picked.push(best);
  }
  AS = null;
  return picked.map(x => x.r);
}
// Process dishes (bakes, pies, curries, risotto, soups, roasts) for a collection
export function processDishes(state, opts, fams, n = 6) {
  const got = P.candidates(state, { ...opts, allowSlow: opts.allowSlow !== false }, 4).filter(x => fams.includes(P.families().find(f => f.id === x.sp.proc).fam));
  const out = [], seenT = new Set(); for (const x of got) { if (out.length >= n) break; const r = worldSwap(state, x.r); if (seenT.has(r.title)) continue; seenT.add(r.title); out.push(r); } return out;
}
// Alternatives for one part (used by the swap buttons)
export function alternatives(state, sp, part, opts = {}) {
  const T = partTaste(state), out = [];
  if (part === 'main') for (const [id, m] of Object.entries(MAINS)) { if (id === sp.main || !m.methods.includes(sp.method) || (kitOf(sp.kit).mains && !kitOf(sp.kit).mains.includes(id)) || !okItem(state, id) || m.slow) continue; out.push([sq(T.main[id]) + sq(T.grp[m.grp]) + (opts.stock && opts.stock.get(id) ? 2 : 0), { ...sp, main: id }]); }
  if (part === 'kit') for (const [id, k] of Object.entries(KITS)) { if (id === sp.kit || !k.methods.includes(sp.method) || (k.mains && !k.mains.includes(sp.main)) || !kitAllowed(state, id)) continue; const base = sp.base && k.bases.includes(sp.base) ? sp.base : Object.keys(BASES).find(b => k.bases.includes(b) && BASES[b].methods.includes(sp.method)) || null; out.push([sq(T.kit[id]) + Math.random() * 0.3, { ...sp, kit: id, base }]); }
  if (part === 'base') for (const [id, b] of Object.entries(BASES)) { if (id === sp.base || !b.methods.includes(sp.method) || !kitOf(sp.kit).bases.includes(id) || !okItem(state, id)) continue; out.push([sq(T.base[id]) + (opts.stock && opts.stock.get(id) ? 2 : 0), { ...sp, base: id }]); }
  if (part === 'method') for (const meth of MAINS[sp.main].methods) { if (meth === sp.method) continue; const kits = Object.keys(KITS).filter(k => KITS[k].methods.includes(meth) && (!KITS[k].mains || KITS[k].mains.includes(sp.main)) && kitAllowed(state, k)); if (!kits.length) continue; const kit = kits.includes(sp.kit) ? sp.kit : kits.sort((a, b) => sq(T.kit[b]) - sq(T.kit[a]))[0]; const base = Object.keys(BASES).find(b => BASES[b].methods.includes(meth) && KITS[kit].bases.includes(b) && (b === sp.base)) || Object.keys(BASES).find(b => BASES[b].methods.includes(meth) && KITS[kit].bases.includes(b)) || null; out.push([sq(T.method[meth]), { ...sp, method: meth, kit, base, veg: sp.veg.filter(v => VEG_FOR[meth].includes(VEG[v].kind)) }]); }
  if (part === 'veg') { const kinds = VEG_FOR[sp.method]; const pool = Object.keys(VEG).filter(v => kinds.includes(VEG[v].kind) && !sp.veg.includes(v) && okItem(state, v)); for (let i = 0; i < 6 && pool.length; i++) { const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], b2 = pool.length && sp.veg.length > 1 ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0] : null; out.push([(opts.stock && opts.stock.get(a) ? 2 : 0) + Math.random(), { ...sp, veg: [a, ...(b2 ? [b2] : sp.veg.slice(1, 2))] }]); } }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 6).map(x => x[1]);
}
// Learn from a swap: old part down a little, new part up
export function learnSwap(state, part, from, to) {
  const fb = state.partFb = state.partFb || {}; const k = part === 'method' ? 'method' : part === 'kit' ? 'kit' : part === 'base' ? 'base' : part === 'main' ? 'main' : 'veg';
  fb[k] = fb[k] || {}; const f = [].concat(from), t = [].concat(to);
  for (const x of f) if (x) fb[k][x] = (fb[k][x] || 0) - 0.4; for (const x of t) if (x) fb[k][x] = (fb[k][x] || 0) + 0.5;
}
// Learn from how a built meal went
export function learnReaction(state, sp, verdict) {
  const fb = state.partFb = state.partFb || {}; const w = verdict === 'love' ? 1 : verdict === 'fine' ? 0.2 : -1.5;
  const bump = (k, id, v) => { if (!id) return; fb[k] = fb[k] || {}; fb[k][id] = (fb[k][id] || 0) + v; };
  bump('kit', sp.kit, w); bump('method', sp.method, w * 0.6); bump('main', sp.main, w * 0.4); bump('base', sp.base, w * 0.3);
  bump('combo', sp.kit + '|' + sp.method + '|' + MAINS[sp.main].grp, w);
  if (verdict === 'love') { const R2 = state.regularsCount = state.regularsCount || {}; const k = specKey(sp); R2[k] = (R2[k] || 0) + 1; return R2[k] >= 2; }
  return false;
}

/* ================= Plan a week around what you're buying ================= */
// basket: [{item, packs}] ; returns { picks:[{date, recipe, leftover?}], unused:[item], extras:[item] }
const packPrice = (state, id) => { const bp = C.bestPrice(state, id); return bp && bp.unit ? +(bp.unit * ITEM[id].packs[0]).toFixed(2) : ITEM[id].p; };
// Buy one thing, unlock the most meals: which single purchase turns what you have into the most good dinners
export function unlockers(state, n = 5, opts = {}) {
  const real = pantryStock(state);
  const shoppable = id => ITEM[id] && !/^(cooked-pork|cooked-beef|cooked-lamb|other-)/.test(id) && !['ham', 'pudding', 'game', 'smoked-salmon'].includes(id) && okItem(state, id);
  const has = id => (real.get(id) || 0) > 0 || (ITEM[id] && ITEM[id].staple && C.stapleHave(state, id));
  const by = {}, ready = new Set();
  for (let pass = 0; pass < 3; pass++) {
    const cands = candidates(state, { ...opts, stock: real, useStock: true, noise: 1.5, compose: 30, allowSlow: true });
    for (const c of cands) {
      const k = kitOf(c.sp.kit); if (!k) continue;
      const items = [...new Set([c.sp.main, c.sp.base, ...(c.sp.veg || []), ...k.core.map(x => x[0])].filter(Boolean))];
      const miss = items.filter(id => !has(id)), key = c.sp.main + '|' + c.sp.kit + '|' + c.sp.method;
      if (!miss.length) { ready.add(key); continue; }
      if (miss.length !== 1 || !shoppable(miss[0])) continue;
      const b = by[miss[0]] || (by[miss[0]] = { item: miss[0], keys: new Set(), score: 0, eg: [] });
      if (b.keys.has(key)) continue; b.keys.add(key); b.score += Math.max(0.3, Math.min(3, c.s / 4));
      if (b.eg.length < 3 && !b.eg.some(e => e.main === c.sp.main && e.kit === c.sp.kit) && !b.eg.some(e => e.kit === c.sp.kit && e.method === c.sp.method)) b.eg.push({ ...c.sp, add: (c.sp.add || []).filter(has) });
    }
  }
  for (const id of Object.keys(by)) if (ready.size && [...by[id].keys].every(k => ready.has(k))) delete by[id];
  const total = Object.values(by).reduce((a, b) => a + b.keys.size, 0) + ready.size;
  const basics = Object.values(by).filter(b => b.keys.size > Math.max(25, total * 0.3)).map(b => b.item);
  for (const id of basics) delete by[id];
  const out = Object.values(by).filter(b => b.keys.size >= 2).map(b => ({ item: b.item, meals: b.keys.size, price: packPrice(state, b.item), score: b.score / Math.max(0.8, Math.sqrt(packPrice(state, b.item))) * (MAINS[b.item] && [...real.keys()].some(id => MAINS[id] && id !== b.item && MAINS[id].grp === MAINS[b.item].grp && MAINS[id].grp !== 'veg') ? 0.45 : 1), examples: b.eg.map(sp => buildMeal(state, sp, opts.serves || 2, new Map([...real, [b.item, 99999]])).title) }))
    .sort((a, b) => b.score - a.score).slice(0, n);
  out.basics = basics; out.ready = ready.size; return out;
}
// Make the most of a joint: ways to cook it, then what to do with the leftovers
export function jointPlan(state, id, serves = 2) {
  const stock = pantryStock(state), m = MAINS[id]; if (!m || !m.joint) return null;
  const first = [];
  for (const meth of ['roast', 'pulled', 'braise']) { if (!m.methods.includes(meth)) continue; const o = options(state, { want: { main: id, method: meth, lock: true }, stock, serves, useStock: true, allowSlow: true, priority: 'save', noise: 1.5 }, 1); if (o[0]) first.push(o[0]); }
  const lead = first.find(r => r.leftover) || first[0];
  const then = lead && lead.leftover ? leftoverIdeas(state, lead, 4) : [];
  return { id, first, then, leftover: lead && lead.leftover };
}
// What to do with the rest of a joint
export function leftoverIdeas(state, r, n = 3) {
  if (!r || !r.leftover) return [];
  const stock = new Map(pantryStock(state)); stock.set(r.leftover.item, (stock.get(r.leftover.item) || 0) + r.leftover.g);
  return options(state, { want: { main: r.leftover.item, lock: true }, stock, serves: 2, useStock: true, priority: 'save', noise: 2, maxTime: 30 }, n);
}
export function planWeek(state, dates, basket, opts = {}) {
  AS = null;
  const stock = new Map();
  const addStock = (id, q) => stock.set(id, (stock.get(id) || 0) + q);
  for (const b of basket || []) if (ITEM[b.item]) addStock(b.item, (b.packs || 1) * ITEM[b.item].packs[0]);
  const expOf = new Map();
  for (const p of state.pantry) if (p.item && ITEM[p.item] && !ITEM[p.item].staple && (!p.exp || p.exp >= dates[0])) { const k = C.standinOf(p.item); addStock(k, p.qty || 0); if (p.exp && (!expOf.has(k) || p.exp < expOf.get(k))) expOf.set(k, p.exp); }
  const basketIds = new Set((basket || []).map(b => b.item));
  const used = { kit: {}, method: {}, main: {}, base: {}, lastMain: null, titles: {}, tags: {} };
  const picks = [], cover = new Set();
  const pr = opts.priority || 'balanced';
  for (const d of dates) {
    if (cover.has(d)) continue;
    const ctx = opts.night ? opts.night(d) : {};
    if (ctx.skip) continue;
    const serves = ctx.serves || 2;
    // Easy nights: oven & freezer meals from the fixed list
    if (ctx.easy) { const e = opts.easyPick && opts.easyPick(d, stock); if (e) { picks.push({ date: d, recipe: e, serves }); continue; } }
    // Sometimes a regular or your own recipe instead (more often on 'save' if they use the basket)
    if (opts.regularPick) { const rg = opts.regularPick(d, stock, used); if (rg) { picks.push({ date: d, recipe: rg.recipe, serves }); for (const i of rg.recipe.ings) if (i.item && stock.has(i.item)) stock.set(i.item, Math.max(0, stock.get(i.item) - (C.toBase(i.q * serves / rg.recipe.serves, i.u, ITEM[i.item]) || 0))); continue; } }
    // what's still good tonight, and how urgent it is
    const night = new Map([...stock].filter(([id, q]) => q > 0 && !(expOf.has(id) && expOf.get(id) < d)));
    const urgent = new Map([...expOf].filter(([id]) => night.has(id)).map(([id, e]) => [id, C.daysBetween(d, e)]));
    const haveMain = Object.keys(MAINS).some(id => (night.get(id) || 0) >= MAINS[id].pp * serves * 0.6 && !(MAINS[id].slow && !ctx.allowSlow && !gearOf(state).slowcooker));
    const c = candidates(state, { stock: night, urgent, date: d, serves, used, priority: pr, useStock: pr === 'save' || haveMain, maxTime: ctx.maxTime, kids: ctx.kids, protein: ctx.protein, quick: ctx.quick, allowSlow: ctx.allowSlow, onlyStockMains: haveMain && pr !== 'variety', exclude: opts.exclude, healthy: opts.healthy, cheap: opts.cheap, noise: 1.4 });
    // dishes built as a process (bakes, pies, staged curries, risotto, soups, roast dinners) compete for the night too
    try { const ref = (c.length ? c[Math.min(4, c.length - 1)].s : 4) - (used.procN || 0) * 1.8, pc = P.candidates(state, { stock: night, serves, allowSlow: ctx.allowSlow, maxTime: ctx.maxTime, quick: ctx.quick, useStock: true, noise: 1, vegOnly: opts.vegOnly }, ref).filter(x => !used.titles[x.r.title] && !(used.procF || {})[x.sp.proc]).slice(0, 4);
      if (pc.length) { c.push(...pc); c.sort((a, b) => b.s - a.s); } } catch (e) { console.warn('process', e); }
    if (!c.length) continue;
    // Softmax-ish choice among the top few
    const top = c.slice(0, 6), wts = top.map(x => Math.exp((x.s - top[0].s) / 0.9));
    let t = Math.random() * wts.reduce((a, b) => a + b, 0), ch = top[0]; for (let i = 0; i < top.length; i++) { t -= wts[i]; if (t <= 0) { ch = top[i]; break; } }
    let cook = serves;
    const leftoverOk = ctx.leftovers && METHODS[ch.sp.method].batch;
    const next = dates[dates.indexOf(d) + 1];
    if (leftoverOk && !(MAINS[ch.sp.main] && MAINS[ch.sp.main].joint) && ch.sp.proc !== 'roastdinner' && next && !(opts.night && opts.night(next).skip) && pr !== 'variety') cook = serves * 2;
    let r = buildMeal(state, ch.sp, cook, stock);
    for (const alt of c.slice(0, 12)) { if (!used.titles[r.title]) break; if (alt === ch) continue; ch = alt; r = buildMeal(state, ch.sp, cook, stock); }
    picks.push({ date: d, recipe: r, serves: cook });
    if (cook > serves && next) { picks.push({ date: next, recipe: r, serves, leftover: d }); cover.add(next); }
    for (const i of r.ings) if (i.item && stock.has(i.item)) stock.set(i.item, Math.max(0, stock.get(i.item) - (C.toBase(i.q, i.u, ITEM[i.item]) || 0)));
    if (r.leftover) addStock(r.leftover.item, r.leftover.g); // the rest of the joint becomes quick meals later in the week
    if (r.gear === 'sc') used.gear = (used.gear || 0) + 1;
    if (ch.sp.proc) { used.procN = (used.procN || 0) + 1; (used.procF = used.procF || {})[ch.sp.proc] = 1; }
    used.kit[ch.sp.kit] = (used.kit[ch.sp.kit] || 0) + 1; used.method[ch.sp.method] = (used.method[ch.sp.method] || 0) + 1; used.main[ch.sp.main] = (used.main[ch.sp.main] || 0) + 1; used.base[ch.sp.base] = (used.base[ch.sp.base] || 0) + 1; used.lastMain = ch.sp.main; used.titles[r.title] = 1; for (const tg of (kitOf(ch.sp.kit) || { tags: [] }).tags) used.tags[tg] = (used.tags[tg] || 0) + 1;
  }
  const usedItems = new Set(picks.flatMap(p => p.recipe.ings.map(i => i.item)));
  const unused = [...basketIds].filter(id => !usedItems.has(id));
  // meat or fish that will go off before the plan uses it: freeze it today
  const last = dates[dates.length - 1];
  const freeze = [...expOf].filter(([id, e]) => (MAINS[id] && MAINS[id].grp !== 'veg' || ['meat', 'fish'].includes(ITEM[id].cat)) && e <= last && (stock.get(id) || 0) > 0 && !usedItems.has(id)).map(([id]) => id);
  return { picks, unused, stockLeft: stock, freeze };
}
// "Plan it for me": pick a sensible basket from your tastes
export function suggestBasket(state, n = 3) {
  const T = partTaste(state), mains = Object.entries(MAINS).filter(([id, m]) => !m.slow && !m.ready && okItem(state, id) && !['bacon', 'eggs', 'lentils'].includes(id))
    .map(([id, m]) => [sq(T.main[id]) + sq(T.grp[m.grp]) * 0.7 + (['chicken-thigh', 'beef-mince', 'sausages', 'salmon', 'chicken-breast', 'chickpeas'].includes(id) ? 1 : 0) + Math.random() * 1.2, id]).sort((a, b) => b[0] - a[0]);
  // start from what's already in the kitchen: only buy mains for the nights it can't cover
  const stock = pantryStock(state), urg = urgencyMap(state);
  const haveMains = [...stock.keys()].filter(id => MAINS[id] && !MAINS[id].ready && MAINS[id].grp !== 'veg' && stock.get(id) >= MAINS[id].pp * 2 && !(urg.get(id) < 0));
  n = Math.max(0, n - haveMains.length);
  const out = []; const grp = new Set(haveMains.map(id => MAINS[id].grp)); for (const [, id] of mains) { if (out.length >= n) break; if (stock.get(id) > 0) continue; if (grp.has(MAINS[id].grp) && out.length < n - 1) continue; grp.add(MAINS[id].grp); out.push({ item: id, packs: 1 }); if (out.length >= n) break; }
  return out;
}
// Understand "rice dish with mince and onions, no mushrooms, quick" in terms of parts
const MEATW = new Set(['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'prawn', 'prawns', 'salmon', 'steak', 'sausage', 'sausages', 'halloumi', 'chickpea', 'bean', 'veggie', 'egg']);
const DISH_SKIP = new Set(['&', 'and', 'with', 'style', 'the', 'a', 'of', 'spaghetti', 'pasta', 'dinner', 'traybake', 'wraps', 'buns', 'bowl', 'rice', 'pittas', 'flatbreads', 'mash', 'potatoes', 'jacket', 'sandwiches']);
export function namedDish(clean) {
  const has = w => clean.includes(' ' + w + ' ') || clean.includes(' ' + w.replace(/s$/, '') + ' ');
  let best = null, bestN = 0;
  for (const x of NAMED) {
    const ws = norm(x.n).split(/\s+/).filter(Boolean), key = ws.filter(w => !DISH_SKIP.has(w) && !MEATW.has(w)), meat = ws.filter(w => MEATW.has(w));
    if (!key.length || !key.every(has)) continue;
    const other = meat.length && !meat.some(has) && [...MEATW].some(w => has(w)); // "chicken curry" is not "lamb curry": keep your meat, borrow the dish
    const n = key.length * 2 + meat.filter(has).length + ws.filter(w => DISH_SKIP.has(w) && has(w)).length * 0.5 - (other ? 0.5 : 0);
    if (n > bestN) { best = other ? { ...x, other: true } : x; bestN = n; }
  }
  return best;
}
export function parseWant(state, text) {
  const as = {}, mi = ph => { const id = C.matchIngredient(ph); if (id && ITEM[id] && ITEM[id].standin) { as[ITEM[id].standin] = id; return ITEM[id].standin; } return id; };
  const t = ' ' + norm(text) + ' ', want = { veg: [] }, exclude = new Set(), mods = {};
  for (const m of t.matchAll(/\b(?:no|without|not|hate|minus)\s+([a-z ]+?)(?=\s(?:and|or|with|but|please|,)\s|$|\s{2})/g)) { const id = mi(m[1].trim()); if (id) exclude.add(id); { const wd = norm(m[1].trim()).replace(/s$/, ''); if (wd.length >= 4) for (const it of Object.values(ITEM)) if (!it.world && (norm(it.n).split(' ').some(x => x.replace(/s$/, '') === wd) || (it.al || []).some(a => norm(a).split(' ').some(x => x.replace(/s$/, '') === wd)))) exclude.add(it.id); } for (const [kid, k] of Object.entries(KITS)) if ((k.words || '').split(' ').some(w => w && m[1].includes(w))) exclude.add(kid); }
  let clean = t.replace(/\b(?:no|without|not|hate|minus)\s+[a-z]+(?: [a-z]+)?/g, ' ');
  // How much you've got: "1.2kg pork roast", "800 g ribs"
  const qm = /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilos|g|grams?)\b/.exec(text.toLowerCase());
  if (qm) { const v = parseFloat(qm[1].replace(',', '.')); want.qty = /^k/.test(qm[2]) ? v * 1000 : v; }
  clean = clean.replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kilos?|g|grams?)\b/g, ' ').replace(/\b\d+(?:[.,]\d+)?\b/g, ' ');
  // 0) Vegetables you name ("fresh green beans", "tenderstem broccoli") are claimed first, longest phrase first,
  //    so "beans" in "green beans" never turns into kidney beans and "fresh" there isn't a flavour request
  { const DESC = new Set(['fresh', 'frozen', 'some', 'my', 'the', 'a', 'few', 'bit', 'of', 'leftover', 'baby', 'fine']);
    const ws = clean.trim().split(/\s+/), used = new Array(ws.length).fill(false);
    for (const len of [3, 2, 1]) for (let i = 0; i + len <= ws.length; i++) {
      if (used.slice(i, i + len).some(Boolean) || DESC.has(ws[i])) continue;
      const ph = ws.slice(i, i + len).join(' '); if (len === 1 && ph.length < 4) continue;
      const id = mi(ph); if (!id || !VEG[id] || MAINS[id] || exclude.has(id)) continue;
      { const it = ITEM[id], hay = new Set(norm([it.n, ...(it.al || [])].join(' ')).split(/\s+/).map(w => w.replace(/s$/, ''))); if (!ph.split(' ').every(w => hay.has(w.replace(/s$/, '')))) continue; }
      if (len === 1 && (['pork', 'beef', 'chicken', 'lamb', 'fish', 'turkey'].includes(ph) || ['beans', 'bean', 'rice', 'pasta', 'potato', 'potatoes'].includes(ph))) continue;
      if (!want.veg.includes(id)) want.veg.push(id);
      for (let k = i; k < i + len; k++) used[k] = true; for (let k = i - 1; k >= 0 && DESC.has(ws[k]); k--) used[k] = true;
    }
    if (used.some(Boolean)) clean = ' ' + ws.filter((_, k) => !used[k]).join(' ') + ' '; }
  // 1) The exact thing you typed comes first: "pork roast", "leg of lamb", "chicken wings", "brisket"
  const stock = pantryStock(state), sg = w => w.replace(/ies$/, 'y').replace(/(?<=[^s])s$/, '');
  const GROUPW = { pork: 'pork', beef: 'beef', chicken: 'chicken', lamb: 'lamb', fish: 'fish', turkey: 'chicken' };
  const strong = (ph, id) => { const it = ITEM[id]; if (!it) return false; const hay = new Set(norm([it.n, ...it.al].join(' ')).split(/\s+/).map(sg)); return ph.split(' ').every(w => hay.has(sg(w)) || ['of', 'a', 'whole'].includes(w)); };
  { const ws = clean.trim().split(/\s+/).filter(Boolean); let hit = null;
    outer: for (const len of [4, 3, 2, 1]) for (let i = 0; i + len <= ws.length; i++) { const ph = ws.slice(i, i + len).join(' '); if (len === 1 && (GROUPW[ph] || ['roast', 'pulled', 'leftover', 'leftovers', 'joint', 'steak', 'mince', 'fillet', 'fillets'].includes(ph))) continue; const id = mi(ph); if (!id || exclude.has(id) || !strong(ph, id)) continue; if (!MAINS[id] && !ensureMain(id, ph)) continue; hit = { id, i, len }; break outer; }
    if (hit) { want.main = hit.id; want.lock = true; clean = ' ' + ws.filter((_, k) => k < hit.i || k >= hit.i + hit.len).join(' ') + ' '; } }
  // 2) Just "pork" / "beef": use whichever cut you've actually got
  if (!want.main) for (const w of clean.trim().split(/\s+/)) if (GROUPW[w]) { for (const id of stock.keys()) ensureMain(id); const got = [...stock.entries()].filter(([id, q]) => MAINS[id] && MAINS[id].grp === GROUPW[w] && q > 0 && !exclude.has(id) && !LIGHT.has(id) && !['deli-meat', 'other-meat', 'bacon', 'chorizo', 'sausages', 'gammon'].includes(id) && (w !== 'turkey' || /turkey/.test(id))).sort((a, b) => b[1] - a[1]).map(([id]) => id); if (got.length) { want.main = got.length === 1 ? got[0] : got; want.lock = true; } break; }
  if (/\bpulled\b|\bshredded\b/.test(clean)) want.method = 'pulled';
  if (/\bpot roast\b|\bbraised?\b/.test(clean)) want.method = 'braise';
  if (/\b(sunday )?roast dinner\b|\bsunday roast\b/.test(clean)) want.method = 'roast';
  const GENERIC = new Set(['rice', 'sweet', 'sour', 'hot', 'green', 'red', 'dinner', 'chicken', 'butter', 'mac', 'cheese', 'creamy', 'herb', 'glazed', 'irish', 'garlic', 'honey', 'lemon', 'mushroom', 'tomato', 'basil', 'coconut', 'soy', 'korean', 'chinese', 'smoky']);
  const kitHit = (k, txt) => (k.words || '').split(' ').some(w => w && !GENERIC.has(w) && txt.includes(' ' + w + ' '));
  for (const [kid, k] of Object.entries(KITS)) if (kitHit(k, clean)) { want.kit = want.kit || kid; }
  if (!want.kit) { const pairs = [['smokybbq', / bbq | barbecue /], ['soyhoney', / honey .*soy | soy .*honey | sticky /], ['garliclemon', / lemon .*garlic | garlic .*lemon | lemon /], ['creamymushroom', / creamy .*mushroom | mushroom /], ['coconutcurry', / coconut /], ['sweetsour', / sweet (and|&)? ?sour /], ['sweetchilli', / sweet chilli /], ['tomatoherb', / tomato /], ['cheesybake', / cheesy /], ['egg', / fried rice /]]; for (const [kid, re] of pairs) if (re.test(clean)) { want.kit = kid; break; } }
  const methodWords = { friedrice: ['fried rice'], traybake: ['traybake', 'tray bake', 'sheet pan', 'roast', 'oven'], stirfry: ['stir fry', 'stirfry', 'wok', 'noodles'], pasta: ['pasta', 'spaghetti', 'penne', 'linguine'], simmer: ['stew', 'casserole', 'one pot', 'chilli', 'chili'], curry: ['curry'], wraps: ['wrap', 'wraps', 'taco', 'tacos', 'burrito', 'burritos', 'fajitas', 'pitta'], bowl: ['bowl', 'rice dish', 'rice bowl'], bake: ['bake', 'gratin'], burgers: ['burger', 'burgers'] };
  for (const [m, ws] of Object.entries(methodWords)) if (ws.some(w => clean.includes(' ' + w + ' '))) { want.method = want.method || m; }
  const mainList = () => [].concat(want.main || []).filter(id => MAINS[id]);
  const SYN_MAIN = { fish: 'white-fish', cod: 'white-fish', hake: 'white-fish', haddock: 'white-fish', beef: 'beef-mince', mince: 'beef-mince', chicken: 'chicken-thigh', pork: 'pork-chop', lamb: 'lamb-mince', turkey: 'turkey-mince', beans: 'kidney-beans', bean: 'kidney-beans', egg: 'eggs', eggs: 'eggs', salmon: 'salmon', prawn: 'prawns', prawns: 'prawns', shrimp: 'prawns', sausage: 'sausages', sausages: 'sausages', chickpea: 'chickpeas', chickpeas: 'chickpeas', halloumi: 'halloumi', tofu: 'tofu', lentil: 'lentils', lentils: 'lentils', steak: 'steak', bacon: 'bacon', goujons: 'nuggets', nuggets: 'nuggets' };
  const SYN_BASE = { rice: 'rice', pasta: 'pasta', spaghetti: 'spaghetti', linguine: 'spaghetti', penne: 'pasta', noodle: 'noodles', noodles: 'noodles', potato: 'potato', potatoes: 'potato', spuds: 'potato', mash: 'potato', wedges: 'potato', chips: 'chips', fries: 'chips', wrap: 'wraps', wraps: 'wraps', tortilla: 'wraps', tortillas: 'wraps', pitta: 'pitta', pittas: 'pitta', bun: 'buns', buns: 'buns', couscous: 'couscous', naan: 'naan', gnocchi: 'gnocchi', bread: 'bread' };
  const SKIPW = new Set(['stir', 'fry', 'fried', 'bake', 'baked', 'roast', 'roasted', 'curry', 'bowl', 'dish', 'stew', 'casserole', 'traybake', 'tray', 'sheet', 'pan', 'one', 'pot', 'food', 'meal', 'dinner', 'something', 'quick', 'easy', 'cheap', 'healthy', 'light', 'spicy', 'creamy', 'cheesy', 'smoky', 'sticky', 'comfort', 'with', 'and', 'some', 'a', 'the', 'for', 'tonight', 'make', 'want', 'like', 'style', 'hot', 'sweet', 'sour', 'pulled', 'shredded', 'loaded', 'lemon', 'garlic', 'honey', 'soy', 'bbq', 'chilli', 'chili', 'taco', 'tacos', 'fajita', 'fajitas', 'burrito', 'burger', 'burgers', 'bbq', 'teriyaki', 'pesto', 'cajun', 'greek', 'thai', 'indian', 'mexican', 'italian', 'veggie', 'vegetarian']);
  const words = clean.trim().split(/\s+/);
  for (const w of words) { if (SYN_MAIN[w] && !want.main && !(want.method === 'pulled' && GROUPW[w])) want.main = SYN_MAIN[w]; if (SYN_BASE[w] && !want.base) want.base = SYN_BASE[w]; }
  if (want.method === 'pulled' && !want.main) { const g = /beef/.test(clean) ? 'beef' : /lamb/.test(clean) ? 'lamb' : /chicken/.test(clean) ? 'chicken' : 'pork'; want.main = [...stock.keys()].find(id => MAINS[id] && MAINS[id].grp === g && MAINS[id].methods.includes('pulled')) || { beef: 'beef-brisket', lamb: 'lamb-leg', chicken: 'whole-chicken', pork: 'pork-roast' }[g]; }
  if (/\b(curry|stew|casserole|tagine|braise|braised)\b/.test(clean) && !/\bmince\b/.test(clean)) { const m0 = mainList()[0]; if (m0 && /mince/.test(m0) && MAINS[m0].grp) { const m = /curry/.test(clean) ? 'curry' : 'braise'; const alt = Object.keys(MAINS).filter(id => !/mince|cooked|leftover/.test(id) && MAINS[id].grp === MAINS[m0].grp && !MAINS[id].joint && (MAINS[id].methods.includes(m) || MAINS[id].methods.includes('simmer'))).sort((a, b) => (stock.get(b) || 0) - (stock.get(a) || 0))[0]; if (alt) want.main = alt; } if (/\bcurry\b/.test(clean) && !want.method) want.method = 'curry'; }
  if (want.method === 'traybake' && /\broast(ed)?\b/.test(clean) && mainList().some(id => MAINS[id].methods.includes('roast'))) want.method = 'roast';
  if (/\bchicken (breast|breasts)\b/.test(clean)) want.main = 'chicken-breast';
  if (/\bpork mince\b/.test(clean)) want.main = 'pork-mince'; if (/\bturkey mince\b/.test(clean)) want.main = 'turkey-mince'; if (/\bsweet potato/.test(clean)) want.base = 'sweet-potato';
  const rest = words.filter(w => !SKIPW.has(w) && !SYN_MAIN[w] && !SYN_BASE[w] && w.length > 2);
  for (let i = 0; i < rest.length; i++) for (const len of [2, 1]) { const ph = rest.slice(i, i + len).join(' '); const id = mi(ph); if (!id || exclude.has(id)) continue; if (MAINS[id] && !want.main) want.main = id; else if (BASES[id] && !want.base) want.base = id; else if (VEG[id] && !want.veg.includes(id)) want.veg.push(id); break; }
  const TAGW = { creamy: 'fl:creamy', cheesy: 'fl:cheesy', spicy: 'fl:spicy', smoky: 'fl:smoky', sticky: 'fl:sweet', sweet: 'fl:sweet', zesty: 'fl:zesty', lemony: 'fl:zesty', herby: 'fl:herby', fresh: 'fl:herby' };
  for (const [w, tg] of Object.entries(TAGW)) if (clean.includes(' ' + w + ' ') && !(w === 'fresh' && !/ fresh (and |or |please |tasting |\s*$)/.test(clean + ' '))) { want.tag = tg; break; }
  if (/\bquick|fast|easy|20 min/.test(clean)) mods.quick = true; if (/\bcheap|budget|thrifty/.test(clean)) mods.cheap = true; if (/\bhealthy|light|lighter|healthier/.test(clean)) mods.healthy = true;
  if (/\bspicy|hot|kick/.test(clean)) mods.spicy = true; if (/\bveggie|vegetarian|meat free|meatless/.test(clean)) mods.veggie = true; if (/\bcomfort|cosy|cozy/.test(clean)) mods.mood = 'comfort';
  // A dish you named ("chilli con carne", "bolognese", "tikka masala") sets the flavour and the way it's cooked
  { const nd = namedDish(clean); if (nd) { want.kit = nd.kit.split(' ')[0]; want.method = nd.method.split(' ')[0]; if (!nd.other) want.named = nd.n; if (nd.base && !want.base) want.base = [].concat(nd.base)[0];
    const ndMain = [].concat(nd.main).join(' ').split(' ');
    const ok = mainList().filter(id => ndMain.includes(id) || (MAINS[id] && MAINS[id].methods.includes(want.method)));
    if (want.main && !ok.length) { const g = MAINS[mainList()[0]] && MAINS[mainList()[0]].grp; const alt = ndMain.find(id => MAINS[id] && MAINS[id].grp === g) || Object.keys(MAINS).find(id => MAINS[id].grp === g && !LIGHT.has(id) && !MAINS[id].ready && MAINS[id].methods.includes(want.method)); if (alt) want.main = alt; }
    else if (want.main) want.main = ok.length === 1 ? ok[0] : ok;
    else if (!nd.other) { const inS = ndMain.filter(id => (stock.get(id) || 0) > 0); want.main = inS[0] || ndMain[0]; } } }
  // keep only mains that can be cooked the way you asked, rather than dropping the way you asked
  if (want.main && want.method && Array.isArray(want.main)) { const ok = want.main.filter(id => MAINS[id].methods.includes(want.method)); if (ok.length) want.main = ok.length === 1 ? ok[0] : ok; }
  if (want.main && want.method && !Array.isArray(want.main) && !MAINS[want.main].methods.includes(want.method) && LIGHT.has(want.main)) { const g = MAINS[want.main].grp, alt = Object.keys(MAINS).find(id => MAINS[id].grp === g && !LIGHT.has(id) && !MAINS[id].ready && MAINS[id].methods.includes(want.method)); if (alt) want.main = alt; }
  if (mods.veggie && want.main && mainList().some(id => MAINS[id].grp !== 'veg')) { delete want.main; delete want.lock; }
  if (want.base && want.method && !BASES[want.base].methods.includes(want.method)) { if (want.method === 'bowl') delete want.method; else delete want.base; }
  if (want.main && want.method && !mainList().some(id => MAINS[id].methods.includes(want.method))) delete want.method;
  if (Object.keys(as).length) want.as = as;
  { const pd = P.detect(text); if (pd) want.proc = pd; }
  return { want, exclude, mods };
}
