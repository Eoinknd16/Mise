// "Ask Mise": answers cooking questions from Mise's own knowledge. No AI needed for these.
import { ITEM } from './data.js';
import * as C from './core.js';
import * as F from './flavour.js';
import * as TQ from './techniques.js';
import * as PX from './prep.js';
import * as K from './chef.js';
import * as AL from './allergens.js';

export const isQuestion = t => /\?\s*$/.test(t) || /\b(instead of|substitute|swap for|in grams|in celsius|in fahrenheit|gas mark|how many|how much|convert)\b|^\s*\d+(\.\d+)?\s*(°|degrees?)?\s*(f|fahrenheit|oz|lb|cups?)\b/i.test(t) || /^(can|could|how|what|why|is|are|does|do|should|when|which|where|my|help|i ?'?ve|ive|it'?s|its|too)\b/i.test(t.trim()) || RESCUE.some(x => x[0].test(t.toLowerCase()));

// Fixes for when something goes wrong: [pattern, title, steps]
const RESCUE = [
  [/too salty|over ?salted|salty/, 'Too salty', ['Add more of everything else: a tin of tomatoes, more cream, more veg or more water and cook it down a little.', 'Sharpness hides salt: a squeeze of lemon or a splash of vinegar.', 'A spoon of plain yogurt, cream or a pinch of sugar softens it.', 'Serve it with plain rice, potatoes or bread, unsalted.', 'The raw-potato trick barely works; dilution is what does it.']],
  [/too (spicy|hot)|blow my head off|burning my mouth/, 'Too spicy', ['Stir in yogurt, cream, coconut milk or crème fraîche; fat and dairy calm the heat.', 'Add a little sugar or honey and a squeeze of lime.', 'Make more of the dish without chilli and mix the two.', 'Serve with plain rice, bread and a cool yogurt side.']],
  [/too sweet/, 'Too sweet', ['Add sharpness: lemon, lime or vinegar, a little at a time.', 'Add salt or soy sauce.', 'A pinch of chilli or black pepper balances sweetness.']],
  [/too (sour|sharp|acidic|vinegary)|too much (lemon|vinegar)/, 'Too sharp', ['A pinch of sugar or a little honey.', 'Butter, cream or olive oil rounds off acidity.', 'A pinch of bicarbonate of soda neutralises acid in tomato sauces (it will fizz).']],
  [/bland|tastes? (of nothing|flat|boring)|no flavou?r|needs something|missing something/, 'Tastes flat', ['Salt first: add a pinch, stir, taste again. Most flat food is under-salted.', 'Then sharpness: a squeeze of lemon or a dash of vinegar wakes everything up.', 'Then savoury depth: a splash of soy, Worcestershire, a little parmesan or a spoon of tomato purée.', 'Finish with something fresh: chopped herbs, spring onion, a little chilli.']],
  [/split|curdled|grainy|separated/, 'Sauce has split', ['Take it off the heat straight away.', 'Cream sauces: whisk in a spoon of cold cream or water.', 'Cheese sauces: whisk in a splash of milk and a little cornflour slurry over very low heat.', 'Mayonnaise or hollandaise: start a fresh egg yolk in a clean bowl and whisk the split sauce into it a spoon at a time.', 'Next time: lower heat, add dairy off the boil, and add cheese off the heat.']],
  [/burnt|burned|catch(ed)? on the bottom|stuck to the (bottom|pan)/, 'Burnt on the bottom', ['Don\'t stir. Tip the unburnt part into a clean pan without scraping the bottom.', 'Taste it. If there is a slight smoky taste, a little sugar, lemon or cream can hide it.', 'If it tastes really burnt, it won\'t come back; turn it into something with strong flavours (a chilli or curry) or start again.']],
  [/too thick|gloopy|too dry(?! meat)/, 'Too thick', ['Loosen with a splash of stock, water, milk or pasta water, a little at a time.', 'Warm through and season again: thinning dilutes the flavour.']],
  [/too thin|too runny|watery|won'?t thicken|not thickening/, 'Too thin', ['Simmer uncovered for a few minutes to cook it down.', 'Cornflour slurry: 1 teaspoon cornflour mixed with 1 tablespoon cold water, stirred in and simmered 1 minute.', 'Mash a few of the potatoes or beans into it, or stir in a spoon of tomato purée.', 'For cream sauces: a little grated cheese or a knob of butter, off the heat.']],
  [/lumpy|lumps/, 'Lumpy sauce or mash', ['Sauce: whisk hard off the heat, or pass it through a sieve.', 'Gravy or white sauce: blitz briefly with a stick blender.', 'Mash: add hot milk and use a masher, not a blender (that makes it gluey).']],
  [/tough|chewy|rubbery/, 'Meat is tough', ['Stewing cuts get tough before they get tender: keep simmering, covered, for another 30–60 minutes.', 'Quick-cook cuts (steak, chicken breast, prawns) are overcooked: slice thinly across the grain and serve with plenty of sauce.', 'Next time: cook stewing cuts low and slow, and quick cuts fast and hot, then rest.']],
  [/dry (chicken|meat|pork|turkey)|chicken is dry|meat is dry|overcooked (chicken|meat|pork)/, 'Dry meat', ['Slice it thinly and serve it in a sauce, gravy or with a dressing.', 'Shred it into wraps, fried rice or a pasta sauce.', 'Next time: take it off the heat as soon as it reaches temperature (75°C for chicken) and rest it 5 minutes.']],
  [/soggy|not crispy|won'?t crisp/, 'Not crispy', ['Spread it out: crowding steams food instead of crisping it. Use two trays.', 'Turn the heat up and give it longer, uncovered.', 'Dry things well before cooking and use enough fat.', 'Roast potatoes: parboil, shake to rough them up and put them into fat that is already hot.']],
  [/sticky rice|rice (is )?(mushy|stuck|gluey|soggy)|mushy rice/, 'Rice went mushy', ['Spread it on a tray to steam dry for a few minutes.', 'Turn it into fried rice tomorrow: cold mushy rice fries well.', 'Next time: rinse the rice, use 1.5 parts water to 1 rice, lid on, low heat, 12 minutes, then rest 5 minutes with the lid on.']],
  [/pasta (is )?(mushy|soggy|overcooked|stuck)|stuck together pasta/, 'Pasta went wrong', ['Stuck together: loosen with a splash of hot pasta water or oil and toss.', 'Overcooked: fry it in a hot pan with butter or oil and garlic for crispy edges, or bake it with sauce and cheese.', 'Next time: lots of salty water at a rolling boil, stir in the first minute, drain a minute early.']],
  [/greasy|oily|too much (oil|fat)/, 'Too greasy', ['Lay kitchen paper on the surface to soak up the oil, or spoon it off.', 'Chill a stew or sauce: the fat sets on top and lifts off.', 'Add something starchy to soak it up: potatoes, beans or bread to serve.']],
  [/undercooked|raw (in the )?middle|not cooked (through|in the middle)/, 'Not cooked through', ['Back in: cover with foil and give it more time at a lower heat so the outside doesn\'t burn.', 'Thick meat: slice it to check and finish the slices in the pan.', 'Chicken, pork and mince must reach 75°C, 70°C and 70°C inside; when in doubt, cook longer.']]
];
const GAS = { 1: 140, 2: 150, 3: 170, 4: 180, 5: 190, 6: 200, 7: 220, 8: 230, 9: 240 };
const CUP_G = { flour: 125, sugar: 200, 'brown sugar': 220, butter: 225, rice: 185, oats: 90, cheese: 100, milk: 240, water: 240, honey: 340 };
function units(t) {
  let m;
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:°|degrees?)?\s*f(ahrenheit)?\b/))) { const c = Math.round((+m[1] - 32) * 5 / 9 / 5) * 5; return { title: `${m[1]}°F`, lines: [`<b>${c}°C</b>, or ${c - 20}°C in a fan oven.`, `Gas mark ${Object.entries(GAS).reduce((a, [g, v]) => Math.abs(v - c) < Math.abs(GAS[a] - c) ? g : a, 4)}.`] }; }
  if ((m = t.match(/gas (?:mark )?(\d)/))) { const c = GAS[m[1]]; return c ? { title: `Gas mark ${m[1]}`, lines: [`<b>${c}°C</b>, or ${c - 20}°C in a fan oven.`, `About ${Math.round(c * 9 / 5 + 32)}°F.`] } : null; }
  if ((m = t.match(/(\d+(?:\.\d+)?|a|one|half a)\s*cups?\s*(?:of\s+)?([a-z ]+)?/))) { const n = m[1] === 'a' || m[1] === 'one' ? 1 : m[1] === 'half a' ? 0.5 : +m[1], what = (m[2] || '').replace(/ (in|to|into) .*$/, '').trim(), key = Object.keys(CUP_G).find(k => what.includes(k)); return { title: `${n} cup${n !== 1 ? 's' : ''}${what ? ' of ' + what : ''}`, lines: [key ? `<b>About ${Math.round(CUP_G[key] * n)} g</b> of ${key}.` : `<b>${Math.round(240 * n)} ml</b> (an American cup is 240 ml).`, 'Cups measure volume, so the weight depends on what it is.'] }; }
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(oz|ounces?)\b/))) return { title: `${m[1]} oz`, lines: [`<b>${Math.round(+m[1] * 28.35)} g</b>`] };
  if ((m = t.match(/(\d+(?:\.\d+)?)\s*(lb|lbs|pounds?)\b/))) return { title: `${m[1]} lb`, lines: [`<b>${Math.round(+m[1] * 453.6)} g</b>`] };
  if (/\btbsp|tablespoons?\b/.test(t) && /ml|teaspoon|tsp|grams?|\bg\b/.test(t)) return { title: 'Spoons', lines: ['1 tablespoon = 3 teaspoons = 15 ml.', '1 teaspoon = 5 ml.', 'A level tablespoon of flour is about 8 g; of sugar about 12 g; of butter about 14 g.'] };
  if (/fan oven|fan assisted|convert.*fan|fan.*convert/.test(t)) return { title: 'Fan ovens', lines: ['Turn the temperature down by 20°C for a fan oven.', 'Recipes in Mise give conventional temperatures unless they say "fan".'] };
  return null;
}
const STOP = new Set(['can', 'could', 'i', 'use', 'instead', 'of', 'how', 'do', 'does', 'long', 'to', 'cook', 'the', 'a', 'an', 'what', 'is', 'are', 'with', 'goes', 'go', 'should', 'my', 'it', 'in', 'for', 'and', 'or', 'be', 'when', 'keep', 'store', 'last', 'safe', 'done', 'have', 'dont', "don't", 'no', 'any', 'substitute', 'swap', 'replace', 'serve', 'pair', 'good', 'calories', 'protein', 'much', 'many', 'freeze', 'fridge', 'make', 'out', 'too', 'which', 'best', 'way', 'roast', 'fry', 'boil', 'bake', 'grill', 'temperature', 'temp', 'eat', 'there', 'some', 'this', 'that', 'need', 'without']);
const GENERIC = { chicken: 'chicken-breast', pork: 'pork-chop', beef: 'steak', lamb: 'lamb', fish: 'white-fish', mince: 'beef-mince', burger: 'burgers', burgers: 'burgers', sausage: 'sausages', turkey: 'turkey-breast' };
function ingsIn(t) {
  const ws = t.replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(Boolean), out = [];
  for (let i = 0; i < ws.length; i++) for (const len of [3, 2, 1]) { const ph = ws.slice(i, i + len); if (ph.length < len || STOP.has(ph[0]) || STOP.has(ph[ph.length - 1])) continue; const id = C.matchIngredient(ph.join(' ')) || (len === 1 ? GENERIC[ph[0]] : null); if (id && ITEM[id] && !out.includes(id)) { out.push(id); i += len - 1; break; } }
  return out;
}
const nm = id => ITEM[id].n.toLowerCase();
// Swaps for things that aren't in the shop catalog
const COMMON = [
  [/buttermilk/, 'Buttermilk', ['Stir 1 tablespoon of lemon juice or vinegar into 250 ml of milk and leave it 5 minutes.', 'Or loosen natural yogurt with a little milk, half and half.']],
  [/self.?raising/, 'Self-raising flour', ['For every 150 g plain flour add 2 level teaspoons of baking powder.']],
  [/baking powder/, 'Baking powder', ['¼ teaspoon bread soda (bicarbonate) plus ½ teaspoon lemon juice or vinegar for each teaspoon of baking powder.']],
  [/bread soda|bicarb/, 'Bread soda', ['3 teaspoons of baking powder for each teaspoon of bread soda; it is weaker, and leave out any acid in the recipe.']],
  [/brown sugar/, 'Brown sugar', ['White sugar plus a teaspoon of honey or golden syrup per 100 g.']],
  [/shallots?/, 'Shallots', ['Half a small onion per shallot, chopped finely; red onion is closest in sweetness.']],
  [/(white|red)? ?wine/, 'Wine in cooking', ['Stock with a splash of vinegar (white wine: cider or white vinegar; red wine: a little balsamic).', 'Or grape juice with a splash of vinegar for sweetness.']],
  [/fresh herbs?|fresh (basil|parsley|thyme|rosemary|oregano|coriander)/, 'Fresh herbs to dried', ['Use a third as much dried, added early in the cooking rather than at the end.', 'Soft herbs (basil, coriander, parsley) lose most of their flavour dried; add a squeeze of lemon to brighten.']],
  [/garlic clove|clove of garlic/, 'Garlic cloves', ['⅛ teaspoon garlic granules per clove, or ½ teaspoon of garlic paste.']],
  [/sour cream/, 'Sour cream', ['Crème fraîche or Greek yogurt, same amount.']],
  [/mascarpone/, 'Mascarpone', ['Full-fat cream cheese beaten with a splash of cream.']],
  [/ricotta/, 'Ricotta', ['Cottage cheese, blended smooth or drained.']],
  [/pancetta/, 'Pancetta', ['Smoked bacon lardons or chopped streaky bacon.']],
  [/heavy cream|whipping cream/, 'Heavy cream', ['Double cream. For cooking, whipping cream works too.']],
  [/cornflour|cornstarch/, 'Cornflour', ['Plain flour, twice as much, cooked a minute longer so it doesn\'t taste floury.']],
  [/lemongrass/, 'Lemongrass', ['Zest of half a lemon or lime per stalk.']],
  [/passata/, 'Passata', ['A tin of chopped tomatoes, blended, or simmered and pushed through a sieve.']],
  [/stock (cube|pot)|chicken stock|beef stock/, 'Stock', ['A stock cube or pot in boiling water; or water with a splash of soy sauce and a pinch of salt for a quick savoury base.']],
  [/eggs? in baking|egg (for|in) (a )?(cake|baking)/, 'Egg in baking', ['1 tablespoon ground flaxseed + 3 tablespoons water per egg, or 3 tablespoons apple sauce for cakes.']]
];
export function answer(S, q) {
  const t = ' ' + q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[?!.]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const ids = ingsIn(t), id = ids[0];
  const u = units(t); if (u) return u;
  const rs = RESCUE.find(x => x[0].test(t)); if (rs) return { title: rs[1], list: rs[2] };
  // swaps
  let m = t.match(/(?:instead of|substitute (?:for)?|swap (?:out )?|replace|replacement for|alternative to|don'?t have (?:any )?|out of|no) ([a-z' -]+?)(?: in | for | with |$| )/);
  if (m || /instead|substitut|swap|replace|alternative/.test(t)) {
    const cm = COMMON.find(x => x[0].test(m ? m[1] : t)); if (cm && !(m && C.matchIngredient(m[1].trim()))) return { title: `Instead of ${cm[1].toLowerCase()}`, list: cm[2] };
    const yId = (m && C.matchIngredient(m[1].trim())) || (ids.length > 1 ? ids[1] : id), xId = ids.find(x => x !== yId);
    if (yId && ITEM[yId]) {
      const sub = C.substitutesFor(S, { item: yId, name: ITEM[yId].n, q: 1, u: '' }), notes = AL.swapNotes(yId);
      const lines = [];
      if (xId && ITEM[xId]) { const ok = sub.items.includes(xId) || notes.some(n => C.matchIngredient(n[0]) === xId); lines.push(ok ? `<b>Yes</b>, ${nm(xId)} works instead of ${nm(yId)}.` : `${ITEM[xId].n} isn't a usual swap for ${nm(yId)}, but it can work if the flavours suit the dish. Closer swaps below.`); }
      if (sub.tip) lines.push(sub.tip);
      for (const [to, note, diet] of notes) lines.push(`<b>${to}</b> (${diet})${note ? ': ' + note : ''}`);
      if (sub.items.length) lines.push('Also works: ' + sub.items.map(x => ITEM[x].n).join(', ') + '.');
      if (!lines.length) lines.push(`Mise doesn't have a good swap for ${nm(yId)}. Leaving it out is often fine if it isn't the main thing in the dish.`);
      return { title: `Instead of ${nm(yId)}`, lines, explore: yId };
    }
  }
  if (id) {
    const it = ITEM[id];
    if (/keep|last|store|fridge|freez|go off|shelf|how long.*(good|ok)/.test(t)) { const st = PX.STORE[id] || PX.STORE_AISLE[it.a] || 'Cool, dry place.'; return { title: `Storing ${nm(id)}`, lines: [st, it.life && !/cooked|leftover/.test(t) ? `Keeps about ${it.life >= 60 ? Math.round(it.life / 30) + ' months' : it.life >= 14 ? Math.round(it.life / 7) + ' weeks' : it.life + ' days'} from buying, unopened.` : '', /cooked|leftover/.test(t) ? 'Cooked leftovers: cool within an hour or two, fridge, eat within 2–3 days (cooked rice within 1 day). Reheat until piping hot, once.' : '', /freez/.test(t) ? (['dairy', 'fruitveg'].includes(it.a) && !['butter', 'cheddar', 'mozzarella', 'parmesan'].includes(id) ? 'Freezing changes the texture; fine for cooking, not for eating raw.' : 'Freezes well for about 3 months. Defrost in the fridge overnight.') : ''].filter(Boolean), explore: id }; }
    if (/done|safe|temperature|temp|pink|undercook|cooked through|how do i know/.test(t)) { const sf = TQ.safeOf(id), best = TQ.bestTechniques(id), nt = best.length ? TQ.noteOf(id, best[0]) : null; return { title: `How to tell when ${nm(id)} ${/s$/.test(nm(id)) ? 'are' : 'is'} done`, lines: [sf ? `<b>${sf}</b>` : 'Cook until piping hot all the way through.', nt && nt.done ? `What to look for: ${nt.done}.` : '', 'A cheap probe thermometer takes all the guessing out.'].filter(Boolean), explore: id }; }
    if (/calorie|kcal|protein|carb|fat|healthy|nutrition/.test(t)) { const n = K.ready() ? K.nutritionOf(id) : null; return n ? { title: `${it.n}, per 100 g`, lines: [`${Math.round(n.kcal)} kcal · ${(+n.protein || 0).toFixed(1)} g protein · ${(+n.carb || 0).toFixed(1)} g carbs · ${(+n.fat || 0).toFixed(1)} g fat`], explore: id } : null; }
    if (/goes? with|go well|pair|serve with|what with|flavou?rs? (for|with)/.test(t)) { const P = F.partners(S, id, { n: 8 }); const g = k => (P[k] || []).filter(x => !(['meat', 'fish'].includes(it.a) && ['meat', 'fish'].includes((ITEM[x.id] || {}).a))).slice(0, 6).map(x => ITEM[x.id].n.toLowerCase()).join(', '); return { title: `What goes with ${nm(id)}`, lines: [g('classic') ? `<b>Classic:</b> ${g('classic')}` : '', g('surprising') ? `<b>Surprising:</b> ${g('surprising')}` : '', g('wild') ? `<b>Wild:</b> ${g('wild')}` : ''].filter(Boolean), explore: id }; }
    if (/how|cook|roast|fry|boil|bake|grill|long|prepare|prep/.test(t)) {
      const best = TQ.bestTechniques(id), want = ['roast', 'sear', 'grill', 'boil', 'bake', 'stirfry', 'braise', 'airfry', 'steam', 'slowcook'].find(k => t.includes(' ' + (TQ.TECH_NAMES[k] || k).split('-')[0]) || t.includes(' ' + k)), list = want && best.includes(want) ? [want, ...best.filter(x => x !== want)] : best;
      const lines = list.slice(0, 3).map(k => { const n = TQ.noteOf(id, k) || {}; return `<b>${(TQ.TECH_NAMES[k] || k).replace(/^\w/, c => c.toUpperCase())}:</b> ${[n.prep, n.time, n.heat].filter(Boolean).join(' · ')}${n.done ? `. Done: ${n.done}` : ''}`; });
      const pr = PX.PREP[id]; if (!lines.length && pr) for (const [w, d] of pr.slice(0, 3)) lines.push(`<b>${w}:</b> ${d}`);
      if (lines.length) return { title: `Cooking ${nm(id)}`, lines, explore: id };
    }
    if (/make|dinner|meal|recipe|use up|use/.test(t)) return { title: `Meals with ${nm(id)}`, lines: ['Here are some ideas built from what you have.'], make: id };
  }
  return null;
}
