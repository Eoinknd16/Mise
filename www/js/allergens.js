// The 14 EU allergens, which Mise catalog items usually contain them, and how to convert a recipe for a diet.
// Written for Mise. Products vary: the app always tells people to check the label.
export const ALLERGENS = [['gluten', 'Gluten'], ['crustaceans', 'Crustaceans'], ['eggs', 'Eggs'], ['fish', 'Fish'], ['peanuts', 'Peanuts'], ['soy', 'Soy'], ['milk', 'Milk'], ['nuts', 'Tree nuts'], ['celery', 'Celery'], ['mustard', 'Mustard'], ['sesame', 'Sesame'], ['sulphites', 'Sulphites'], ['lupin', 'Lupin'], ['molluscs', 'Molluscs']];
const L = {
  gluten: 'flour bread wraps buns naan pitta baguette pasta spaghetti noodles couscous fresh-pasta croissants scones soda-bread cake crumpets breadcrumbs lasagne gnocchi biscuits crackers cereal oats beer pizza garlic-bread pizza-dough pot-noodle fish-fingers nuggets soy-sauce grains quiche puff-pastry sausages burgers frozen-burgers hot-dogs gravy stock worcestershire brown-sauce fish-cakes pudding oyster-sauce cereal-bars meal-deal ready-meal pie',
  crustaceans: 'prawns',
  eggs: 'eggs mayo salad-cream fresh-pasta noodles cake quiche custard croissants',
  fish: 'salmon white-fish tuna smoked-salmon mackerel fish-cakes fish-fingers frozen-fish salmon-tin anchovies fish-sauce worcestershire other-fish',
  peanuts: 'peanut-butter',
  soy: 'soy-sauce tofu miso oyster-sauce teriyaki',
  milk: 'milk butter cheddar mozzarella parmesan feta blue-cheese goats-cheese halloumi cream double-cream creme-fraiche yogurt cream-cheese cheese-slices cottage-cheese brie fruit-yogurt spread custard cream-spray ice-cream chocolate pesto quiche garlic-bread pizza croissants scones cake naan hot-choc other-dairy',
  nuts: 'nuts pesto choc-spread',
  celery: 'celery stock',
  mustard: 'mustard salad-cream',
  sesame: 'sesame-oil tahini hummus',
  sulphites: 'wine dried-fruit vinegar',
  lupin: '',
  molluscs: 'oyster-sauce'
};
export const ALG = {};
for (const [k, ids] of Object.entries(L)) for (const id of ids.split(' ').filter(Boolean)) (ALG[id] = ALG[id] || []).push(k);
export const allergensOfItem = id => ALG[id] || [];
export function allergensOf(r) { const s = new Set(); for (const i of r.ings || []) for (const a of allergensOfItem(i.item)) s.add(a); return ALLERGENS.filter(([k]) => s.has(k)).map(([k]) => k); }
export const ALG_NAME = Object.fromEntries(ALLERGENS);
// Which allergens each diet setting avoids
export const DIET_ALG = { gluten: ['gluten'], dairy: ['milk'], nuts: ['nuts', 'peanuts'], shellfish: ['crustaceans', 'molluscs'], egg: ['eggs'], sesame: ['sesame'], soy: ['soy'], mustard: ['mustard'], celery: ['celery'], fish: ['fish'], sulphites: ['sulphites'] };

// ---- Converting a recipe for a diet: [replacement name, how to use it, catalog id if there is one]
const GF = {
  pasta: ['gluten-free pasta', 'Cook a minute or two less than the packet says; rinse briefly if it goes sticky.'], spaghetti: ['gluten-free spaghetti', 'Cook a minute or two less than the packet says.'], 'fresh-pasta': ['gluten-free pasta', ''], lasagne: ['gluten-free lasagne sheets', ''], gnocchi: ['gluten-free gnocchi', ''],
  noodles: ['rice noodles', 'Soak or boil for 3–4 minutes.'], couscous: ['quinoa', 'Simmer 12–15 minutes.', 'grains'], 'soy-sauce': ['tamari', 'Same amount. Most tamari is wheat-free; check the label.'], breadcrumbs: ['gluten-free breadcrumbs or crushed cornflakes', 'Same amount.'],
  flour: ['cornflour', 'Use half as much, mixed with a little cold water first.'], wraps: ['corn tortillas', 'Warm them in a dry pan so they bend without cracking.'], bread: ['gluten-free bread', ''], buns: ['gluten-free buns', ''], naan: ['gluten-free flatbread', ''], pitta: ['gluten-free flatbread', ''], baguette: ['gluten-free bread', ''],
  stock: ['gluten-free stock cube', 'Check the label: many stock cubes contain wheat.'], gravy: ['gluten-free gravy granules', ''], sausages: ['gluten-free sausages', ''], worcestershire: ['tamari', 'A splash of tamari gives a similar savoury kick.'], 'oyster-sauce': ['gluten-free oyster sauce', ''], 'puff-pastry': ['gluten-free puff pastry', ''], beer: ['cider', 'Same amount.'], nuggets: ['plain chicken strips in crushed cornflakes', 'Bake 20 minutes at 200°C.'], 'fish-fingers': ['gluten-free fish fingers', ''], pudding: ['gluten-free black pudding', '']
};
const DF = {
  butter: ['olive oil or dairy-free spread', 'Same amount.', 'olive-oil'], milk: ['oat milk', 'Same amount.', 'oat-milk'], cream: ['oat cream', 'Same amount. Simmer gently; don\'t boil hard.'], 'double-cream': ['oat cream', 'Same amount.'], 'creme-fraiche': ['oat crème fraîche', 'Same amount.'],
  yogurt: ['soya or coconut yogurt', 'Same amount.'], cheddar: ['dairy-free cheese', 'Grate it finely; it melts less than cheddar.'], mozzarella: ['dairy-free mozzarella', ''], 'cheese-slices': ['dairy-free cheese slices', ''], parmesan: ['nutritional yeast', '2 teaspoons for every 10 g of parmesan.'],
  feta: ['dairy-free feta-style cheese', ''], 'goats-cheese': ['dairy-free soft cheese', ''], 'blue-cheese': ['dairy-free cheese', ''], brie: ['dairy-free soft cheese', ''], 'cream-cheese': ['dairy-free cream cheese', 'Same amount.'], 'cottage-cheese': ['crumbled silken tofu', ''], pesto: ['dairy-free pesto', ''], naan: ['plain flatbread', 'Most naan contains milk or yogurt.']
};
const EF = { eggs: ['flaxseed "egg"', '1 tablespoon ground flaxseed mixed with 3 tablespoons water for each egg, left 5 minutes. For binding only: if the egg is a topping, leave it out.'], mayo: ['vegan mayo', 'Same amount.'], 'salad-cream': ['vegan mayo with a squeeze of lemon', ''], 'fresh-pasta': ['dried pasta', 'Most dried pasta has no egg.', 'pasta'], noodles: ['rice noodles', 'Most egg noodles contain egg.'] };
const VEG_EXTRA = { stock: ['vegetable stock', 'Same amount.'], 'fish-sauce': ['soy sauce', 'Same amount.', 'soy-sauce'], worcestershire: ['soy sauce', 'Same amount; most Worcestershire sauce contains anchovies.', 'soy-sauce'], parmesan: ['vegetarian hard cheese', 'Parmesan is made with animal rennet.'], gravy: ['vegetarian gravy granules', ''], anchovies: ['capers', 'A teaspoon of capers for the salty hit.', 'capers'], 'oyster-sauce': ['vegetarian stir-fry sauce or soy with a little sugar', ''] };
const VEGAN_EXTRA = { honey: ['maple syrup', 'Same amount.'], gravy: ['vegan gravy granules', ''], parmesan: ['nutritional yeast', '2 teaspoons for every 10 g of parmesan.'] };
// Mains: what stands in for meat or fish depends on how it's cooked
const MINCE = new Set(['beef-mince', 'lamb-mince', 'pork-mince', 'turkey-mince']);
const BIRD = new Set(['chicken-thigh', 'chicken-breast', 'chicken-drum', 'chicken-wings', 'cooked-chicken', 'nuggets', 'turkey-breast', 'duck-breast']);
const RED = new Set(['steak', 'diced-beef', 'beef-brisket', 'pork-chop', 'pork-fillet', 'lamb', 'lamb-chops', 'cooked-beef', 'cooked-pork', 'cooked-lamb', 'game', 'pork-belly', 'pork-ribs']);
const SEA = new Set(['salmon', 'white-fish', 'tuna', 'smoked-salmon', 'mackerel', 'prawns', 'frozen-fish', 'fish-cakes', 'fish-fingers', 'salmon-tin']);
const JOINT = new Set(['pork-roast', 'beef-roast', 'lamb-leg', 'whole-chicken', 'gammon']);
const CURED = new Set(['bacon', 'ham', 'chorizo', 'deli-meat']);
const WET = new Set(['curry', 'simmer', 'soup', 'noodlesoup', 'braise', 'bake', 'pie', 'traybake', 'risotto', 'pulled']);
function mainSwap(id, method, vegan) {
  if (JOINT.has(id)) return { blocked: 'A roasting joint has no good meat-free stand-in. A whole roasted cauliflower or a nut roast is the closest.' };
  if (MINCE.has(id)) return ['lentils', 'One 400 g tin of green or brown lentils, drained, for every 250 g of mince. Add with the tomatoes, not at the browning stage.', 'lentils'];
  if (id === 'sausages') return [vegan ? 'vegan sausages' : 'vegetarian sausages', 'Cook as the packet says; they brown faster than meat ones.'];
  if (CURED.has(id)) return ['mushrooms', 'Fry sliced mushrooms hard with half a teaspoon of smoked paprika for the smoky, salty taste.', 'mushroom'];
  if (id === 'halloumi' || id === 'eggs') return vegan ? ['firm tofu', 'Press for 20 minutes, then cook the same way.', 'tofu'] : null;
  if (BIRD.has(id) || SEA.has(id) || RED.has(id)) return WET.has(method) ? ['chickpeas', 'One 400 g tin, drained, for every 200 g of meat. Add for the last 10 minutes so they keep their shape.', 'chickpeas'] : ['firm tofu', 'Press for 20 minutes, cube, toss in a little cornflour and fry until golden before the sauce goes in.', 'tofu'];
  return null;
}
const isMeat = id => MINCE.has(id) || BIRD.has(id) || RED.has(id) || JOINT.has(id) || CURED.has(id) || id === 'sausages';
const isSea = id => SEA.has(id) || id === 'anchovies';
const DAIRY_IDS = new Set(Object.keys(DF).concat(['halloumi', 'ice-cream', 'custard']));
export const CONVERT_DIETS = [['vegan', 'Vegan'], ['vegetarian', 'Vegetarian'], ['gluten', 'Gluten-free'], ['dairy', 'Dairy-free'], ['egg', 'Egg-free']];
const PREFIX = { vegan: 'Vegan', vegetarian: 'Veggie', gluten: 'Gluten-free', dairy: 'Dairy-free', egg: 'Egg-free' };
// Returns { swaps: [{ from, to, note }], blocked, needed } for a recipe; ingredient i: { item, name }
export function planConvert(r, diet) {
  const method = r.spec && r.spec.method, swaps = [], out = [];
  let blocked = null;
  for (const i of r.ings || []) {
    const id = i.item; let s = null;
    if (diet === 'gluten') s = GF[id];
    if (diet === 'dairy') s = DF[id];
    const eggSauce = id === 'eggs' && (r.steps || []).some(st => /beaten egg/i.test(st));
    if (diet === 'egg') s = eggSauce ? ['cream', 'A good splash of cream makes the silky sauce instead of egg.', 'cream'] : EF[id];
    if (diet === 'vegan' && eggSauce) s = ['oat cream', 'A good splash makes the silky sauce instead of egg.'];
    if (diet === 'vegetarian' || diet === 'vegan') {
      if (s) { /* already decided */ } else if (isMeat(id) || isSea(id) || (diet === 'vegan' && (id === 'halloumi' || id === 'eggs') && r.spec && r.spec.main === id)) { const m = mainSwap(id, method, diet === 'vegan'); if (m && m.blocked) { blocked = m.blocked; } else if (m) s = m; else if (isMeat(id) || isSea(id)) s = ['leave it out', ''], s.skip = true; }
      else if (VEG_EXTRA[id] && (diet === 'vegetarian' || !VEGAN_EXTRA[id])) s = VEG_EXTRA[id];
      if (diet === 'vegan' && !s && !eggSauce) s = VEGAN_EXTRA[id] || DF[id] || EF[id] || (DAIRY_IDS.has(id) ? ['leave it out', ''] : null);
    }
    if (s) { swaps.push({ from: i, to: s[0], note: s[1] || '', id: s[2] || null, skip: s[0] === 'leave it out' }); }
    out.push(i);
  }
  return { swaps, blocked, prefix: PREFIX[diet] };
}
// Every written swap for an ingredient, across diets: [[to, note, diet]]
export function swapNotes(id) {
  const out = []; const add = (m, d) => { if (m[id]) out.push([m[id][0], m[id][1] || '', d]); };
  add(GF, 'gluten-free'); add(DF, 'dairy-free'); add(EF, 'egg-free'); add(VEG_EXTRA, 'vegetarian'); add(VEGAN_EXTRA, 'vegan');
  return out;
}
