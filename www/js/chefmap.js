// Which ingredient family (as used in the USDA dish data) each Mise ingredient belongs to.
const G = {
  chicken: 'chicken-thigh chicken-breast chicken-drum chicken-wings whole-chicken cooked-chicken nuggets', turkey: 'turkey-breast turkey-mince', duck: 'duck-breast',
  beef_mince: 'beef-mince burgers', beef: 'steak diced-beef beef-brisket beef-roast cooked-beef game', pork: 'pork-chop pork-mince pork-fillet pork-roast pork-belly pork-ribs cooked-pork',
  ham: 'ham gammon deli-meat', bacon: 'bacon', sausage: 'sausages chorizo hot-dogs pudding', lamb: 'lamb lamb-mince lamb-chops lamb-leg cooked-lamb',
  salmon: 'salmon smoked-salmon salmon-tin', tuna: 'tuna', shrimp: 'prawns', fish: 'white-fish frozen-fish fish-cakes fish-fingers mackerel anchovies other-fish',
  egg: 'eggs', cheddar: 'cheddar cheese-slices', parmesan: 'parmesan', mozzarella: 'mozzarella', feta: 'feta halloumi goats-cheese', cheese: 'blue-cheese brie cottage-cheese',
  cream_cheese: 'cream-cheese', sour_cream: 'sour-cream creme-fraiche', cream: 'cream double-cream', yogurt: 'yogurt', milk: 'milk', butter: 'butter',
  olive_oil: 'olive-oil', oil: 'oil', flour: 'flour', rice: 'rice basmati risotto-rice', pasta: 'pasta spaghetti lasagne fresh-pasta gnocchi', noodle: 'noodles',
  breadcrumbs: 'breadcrumbs', tortilla: 'wraps', bread: 'bread buns naan pitta baguette garlic-bread', potato: 'potato chips hash-browns', sweet_potato: 'sweet-potato butternut',
  onion: 'onion red-onion spring-onion leek', garlic: 'garlic garlic-granules', tomato: 'tomato cherry-tomato chopped-tomatoes passata', tomato_paste: 'tomato-puree',
  pepper: 'pepper', chilli: 'chilli jalapenos sriracha hot-sauce sweet-chilli', carrot: 'carrot parsnip', celery: 'celery fennel', mushroom: 'mushroom', spinach: 'spinach kale',
  broccoli: 'broccoli tenderstem', cauliflower: 'cauliflower', cabbage: 'cabbage coleslaw kimchi', lettuce: 'salad salad-veg', cucumber: 'cucumber pickles gherkins', courgette: 'courgette',
  aubergine: 'aubergine', green_beans: 'green-beans sugar-snap asparagus', peas: 'peas frozen-veg', sweetcorn: 'sweetcorn corn-cob', chickpeas: 'chickpeas hummus',
  beans: 'kidney-beans baked-beans butter-beans', lentils: 'lentils', avocado: 'avocado', lemon: 'lemon', lime: 'lime', orange: 'orange', apple: 'apple pears',
  pineapple: 'pineapple', mango: 'mango', raisin: 'dried-fruit dates', coconut: 'coconut-milk', soy_sauce: 'soy-sauce oyster-sauce fish-sauce miso', worcestershire: 'worcestershire brown-sauce',
  vinegar: 'vinegar', mustard: 'mustard', ketchup: 'ketchup', mayonnaise: 'mayo salad-cream', honey: 'honey syrup', sugar: 'sugar', curry: 'curry-paste curry-powder garam-masala turmeric',
  cumin: 'cumin fajita-mix', paprika: 'paprika', chilli_powder: 'chilli-powder chilli-flakes cayenne cajun-spice peri-spice chipotle', oregano: 'oregano mixed-herbs',
  basil: 'basil dried-basil pesto', parsley: 'parsley', coriander: 'coriander ground-coriander', thyme: 'thyme dried-thyme', rosemary: 'rosemary dried-rosemary', ginger: 'ginger ground-ginger lemongrass',
  cinnamon: 'cinnamon', nutmeg: 'nutmeg', stock: 'stock', gravy: 'gravy', peanut_butter: 'peanut-butter', nuts: 'nuts', sesame: 'sesame-oil tahini', salsa: 'salsa', bbq_sauce: 'bbq-sauce',
  olives: 'olives', capers: 'capers', dill: 'dill', mint: 'mint mint-sauce', sage: 'sage', bay: 'bay-leaves'
};
export const CATKEY = {};
for (const [k, ids] of Object.entries(G)) for (const id of ids.split(' ')) CATKEY[id] = k;
