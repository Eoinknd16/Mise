// Which entry in the flavour database each Mise ingredient corresponds to,
// plus the cooked versions whose aromas change with technique (roasting makes new compounds).
export const FMAP = {
  courgette: 'zucchini', salad: 'lettuce', 'spring-onion': 'scallion', prawns: 'prawn', sweetcorn: 'corn', butternut: 'squash', sausages: 'pork_sausage', 'chicken-breast': 'chicken', pasta: 'macaroni', noodles: 'egg_noodle', olives: 'olive', 'baked-beans': 'bean', berries: 'berry',
  'red-onion': 'onion', spinach: 'dried_spinach', 'cherry-tomato': 'tomato', 'green-beans': 'bean', chilli: 'pepper',
  wraps: 'wheat_bread', buns: 'white_bread', naan: 'wheat_bread', pitta: 'wheat_bread', baguette: 'white_bread', 'garlic-bread': 'bread',
  'chicken-thigh': 'chicken', 'chicken-wings': 'chicken', 'whole-chicken': 'chicken', 'chicken-drum': 'chicken', 'cooked-chicken': 'chicken', nuggets: 'chicken', 'turkey-breast': 'turkey', 'turkey-mince': 'turkey', 'duck-breast': 'chicken',
  'beef-mince': 'beef', steak: 'beef', 'diced-beef': 'beef', 'beef-brisket': 'beef', 'beef-roast': 'beef', 'cooked-beef': 'roasted_beef', burgers: 'beef',
  'pork-chop': 'pork', 'pork-mince': 'pork', 'pork-roast': 'pork', 'pork-fillet': 'pork', 'pork-ribs': 'pork', 'pork-belly': 'pork', 'cooked-pork': 'roasted_pork', gammon: 'ham', 'deli-meat': 'ham', chorizo: 'smoked_sausage', pudding: 'pork_sausage',
  'lamb-mince': 'lamb', 'lamb-leg': 'lamb', 'lamb-chops': 'lamb', 'cooked-lamb': 'roasted_lamb',
  mozzarella: 'mozzarella_cheese', parmesan: 'parmesan_cheese', halloumi: 'sheep_cheese', 'double-cream': 'cream', 'creme-fraiche': 'sour_milk', 'sour-cream': 'sour_milk', cheddar: 'cheddar_cheese', brie: 'camembert_cheese', 'cheese-slices': 'cheese',
  tofu: 'soybean', hummus: 'chickpea', 'fresh-pasta': 'macaroni', spaghetti: 'macaroni', lasagne: 'macaroni', gnocchi: 'potato', basmati: 'rice', 'risotto-rice': 'rice', couscous: 'wheat', grains: 'barley',
  flour: 'wheat', sugar: 'cane_molasses', 'chopped-tomatoes': 'tomato', passata: 'tomato', 'tomato-puree': 'tomato', 'coconut-milk': 'coconut', stock: 'chicken_broth', 'puff-pastry': 'butter',
  'fish-sauce': 'fish', sriracha: 'thai_pepper', 'hot-sauce': 'tabasco_pepper', jalapenos: 'pepper', capers: 'olive', 'butter-beans': 'lima_bean', mayo: 'egg', ketchup: 'tomato', 'curry-paste': 'turmeric', pesto: 'basil',
  paprika: 'pimento', 'garam-masala': 'cardamom', 'mixed-herbs': 'oregano', 'chilli-flakes': 'cayenne', 'garlic-granules': 'garlic', 'onion-granules': 'onion', 'ground-ginger': 'ginger', 'ground-coriander': 'coriander', 'cajun-spice': 'cayenne', 'fajita-mix': 'cumin', 'five-spice': 'star_anise', 'peri-spice': 'thai_pepper',
  'dried-thyme': 'thyme', 'dried-rosemary': 'rosemary', 'dried-basil': 'basil', 'bay-leaves': 'bay', 'fennel-seeds': 'fennel', cocoa: 'cocoa', vanilla: 'vanilla', 'frozen-veg': 'pea', chips: 'french_fried_potato', 'hash-browns': 'potato', 'fish-fingers': 'cod', 'frozen-fish': 'cod', 'fish-cakes': 'cod', 'salmon-tin': 'salmon', 'other-fish': 'fish',
  chocolate: 'cocoa', 'dark-chocolate': 'cocoa', 'bbq-sauce': 'smoke', 'sweet-chilli': 'thai_pepper', 'brown-sauce': 'tamarind', worcestershire: 'tamarind', 'oyster-sauce': 'oyster', 'mint-sauce': 'mint', salsa: 'tomato', gravy: 'beef_broth', 'pasta-sauce': 'tomato', 'cooking-sauce': 'tomato',
  aubergine: 'vegetable', beetroot: 'beet', 'sugar-snap': 'pea', 'corn-cob': 'corn', 'salad-veg': 'lettuce', coleslaw: 'cabbage', 'tinned-fruit': 'peach', 'frozen-fruit': 'berry', 'tinned-veg': 'vegetable',
  miso: 'soybean', tahini: 'sesame_seed', chipotle: 'smoke', anchovies: 'fish', kimchi: 'chinese_cabbage', breadcrumbs: 'bread', baking: 'wheat', cheddar_: 'cheddar_cheese',
  'curry-powder': 'turmeric', oil: 'vegetable_oil', 'white-fish': 'cod', 'peanut-butter': 'peanut_butter', nuts: 'nut', syrup: 'maple_syrup', 'dried-fruit': 'raisin', game: 'veal', 'hot-dogs': 'frankfurter'
};
// cooked versions of ingredients that exist in the data (roasting/frying create new aromas)
export const COOKED = {
  pork: { roast: 'roasted_pork', traybake: 'roasted_pork', sticky: 'roasted_pork', panfry: 'fried_pork', pulled: 'roasted_pork', braise: 'boiled_pork', simmer: 'boiled_pork' },
  beef: { roast: 'roasted_beef', traybake: 'roasted_beef', panfry: 'grilled_beef', burgers: 'grilled_beef', stirfry: 'fried_beef', braise: 'boiled_beef', simmer: 'boiled_beef', pulled: 'roasted_beef' },
  chicken: { roast: 'roasted_chicken', traybake: 'roasted_chicken', sticky: 'roasted_chicken', panfry: 'fried_chicken', simmer: 'boiled_chicken', curry: 'boiled_chicken', soup: 'boiled_chicken' },
  lamb: { roast: 'roasted_lamb', traybake: 'roasted_lamb', panfry: 'roasted_lamb', braise: 'boiled_mutton' },
  turkey: { roast: 'roasted_turkey', traybake: 'roasted_turkey' },
  potato: { roast: 'baked_potato', traybake: 'baked_potato', loaded: 'baked_potato', burgers: 'french_fried_potato', sticky: 'french_fried_potato' },
  onion: { roast: 'roasted_onion', traybake: 'roasted_onion', hash: 'roasted_onion' },
  nut: { '*': 'roasted_nut' }, peanut: { '*': 'roasted_peanut' }, sesame_seed: { '*': 'roasted_sesame_seed' }, almond: { '*': 'roasted_almond' }, hazelnut: { '*': 'roasted_hazelnut' }
};
