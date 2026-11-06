// Mise's own pairing knowledge: what goes with what, written from culinary practice.
// Keys are ingredient families (see chefmap.js) or Mise ingredient ids. Each line: ingredient, then partners.
// Grades: classic partners first; a "~" prefix marks a bolder but proven partner; "!" marks things to avoid.
const SRC = `
chicken: lemon garlic thyme rosemary tarragon paprika honey soy_sauce ginger mushroom leek bacon cream mustard coriander lime chilli curry coconut tomato pepper onion potato rice sweetcorn peas parsley sage white_wine stock yogurt cumin oregano basil pesto mango ~peanut_butter ~pineapple ~orange ~apple ~fennel ~olives ~chorizo ~sesame
turkey: sage thyme cranberries bacon onion potato mushroom leek stock mustard ~apple ~orange ~chilli ~cumin
duck: orange cherries plums honey soy_sauce ginger star-anise five-spice spring-onion cabbage potato ~raspberries ~blueberries ~fennel ~pomegranate
beef: onion garlic mushroom thyme rosemary mustard horseradish potato carrot stock tomato red_wine worcestershire soy_sauce ginger chilli pepper paprika cumin bay parsley peas ~coffee ~dark-chocolate ~blue-cheese ~anchovies ~beetroot ~star-anise
beef_mince: onion garlic tomato tomato_paste chilli_powder cumin paprika oregano basil carrot celery mushroom cheddar mozzarella parmesan beans pepper worcestershire ketchup mustard tortilla rice pasta potato ~cinnamon ~dark-chocolate ~feta ~mint
pork: apple sage fennel mustard honey ginger soy_sauce garlic rosemary thyme cabbage onion potato cider plums chilli five-spice star-anise orange paprika cumin bbq_sauce pineapple coriander ~prunes ~rhubarb ~kimchi ~miso ~coffee ~peach
ham: mustard honey pineapple cheese peas cabbage potato egg parsley leek ~apple ~orange ~cloves
bacon: egg mushroom tomato cabbage potato leek peas onion cheddar maple ~apple ~dates ~chocolate
sausage: onion mustard potato apple tomato beans peppers fennel sage thyme rosemary lentils cabbage ~chilli ~honey
lamb: rosemary garlic mint lemon cumin coriander paprika yogurt feta aubergine tomato chickpeas apricot dates honey onion potato peas thyme oregano harissa ~anchovies ~pomegranate ~cinnamon ~orange
salmon: lemon dill parsley soy_sauce honey ginger garlic lime cucumber asparagus potato spinach peas cream butter capers mustard chilli sesame ~miso ~orange ~beetroot ~avocado ~fennel ~horseradish
fish: lemon parsley butter capers garlic tomato potato peas dill chilli lime coriander olives fennel cream ~chorizo ~orange ~coconut
tuna: lemon olives capers tomato onion sweetcorn mayonnaise pasta egg beans cucumber parsley chilli ~avocado ~soy_sauce
shrimp: garlic chilli lemon lime coriander ginger soy_sauce coconut tomato butter parsley spring-onion avocado mango rice noodle ~chorizo ~pineapple
egg: cheese bacon spinach mushroom tomato onion potato chives pepper ham chilli soy_sauce spring-onion ~avocado ~kimchi ~feta ~smoked-salmon
tofu: soy_sauce ginger garlic chilli spring-onion sesame broccoli mushroom peanut_butter coconut curry lime ~miso ~kimchi
halloumi: lemon mint chilli honey courgette pepper tomato aubergine couscous ~watermelon ~pomegranate ~figs
chickpeas: cumin coriander lemon garlic spinach tomato curry tahini paprika feta onion yogurt sweet_potato ~harissa ~chorizo ~apricot
beans: tomato onion garlic cumin chilli_powder bacon sausage pepper sweetcorn coriander cheddar tortilla rice ~sage
lentils: onion carrot celery tomato cumin curry garlic spinach lemon coriander bay ~bacon ~feta ~coconut
potato: butter rosemary garlic thyme onion leek cheese cream bacon parsley chives dill mustard egg ~truffle ~blue-cheese
sweet_potato: chilli lime cumin coriander black-beans feta maple cinnamon ginger coconut ~miso ~sage
rice: soy_sauce egg spring-onion peas coconut lime coriander chicken curry beans ~kimchi ~saffron
pasta: tomato garlic basil parmesan olive_oil chilli mushroom cream bacon spinach pesto courgette lemon ~anchovies ~sausage
noodle: soy_sauce ginger garlic chilli spring-onion sesame peanut_butter lime coriander egg ~miso
tomato: basil garlic oregano olive_oil onion mozzarella parmesan chilli pepper cucumber feta capers olives balsamic ~strawberries ~cinnamon ~vanilla
onion: garlic thyme butter beef cheese vinegar sage potato bay
mushroom: garlic thyme butter cream parsley soy_sauce beef chicken egg onion tarragon spinach ~miso ~blue-cheese
spinach: garlic nutmeg cream feta egg lemon chickpeas curry parmesan ricotta ~raisin ~pine-nuts
broccoli: garlic chilli lemon parmesan cheddar soy_sauce sesame ginger anchovies ~blue-cheese ~almonds
cauliflower: cheese curry cumin turmeric garlic parsley capers ~raisin ~nutmeg ~tahini
carrot: honey cumin ginger orange thyme coriander butter parsley ~cardamom ~tahini
pepper: tomato onion garlic paprika chilli cumin olive_oil feta chorizo basil ~anchovies
courgette: lemon mint basil garlic parmesan feta tomato chilli ~ricotta
aubergine: tomato garlic miso yogurt mint cumin feta tahini chilli basil lamb ~pomegranate ~honey
cabbage: bacon butter caraway apple onion pork vinegar soy_sauce ginger ~juniper ~chilli
leek: potato cream cheese butter chicken mustard thyme bacon ~blue-cheese
peas: mint bacon ham butter parmesan lemon onion ~feta
sweetcorn: butter chilli lime cheese coriander paprika bacon ~miso
avocado: lime chilli coriander tomato onion salt egg ~strawberries ~grapefruit
cucumber: dill yogurt mint lemon garlic vinegar chilli sesame ~strawberries ~gin
beetroot: goats-cheese feta orange dill horseradish walnuts apple balsamic ~chocolate ~cumin
butternut: sage chilli feta nutmeg cinnamon ginger coconut curry ~maple ~blue-cheese
asparagus: lemon butter parmesan egg salmon ham mint ~orange
apple: pork cinnamon cheddar sage blue-cheese walnuts honey celery ~fennel ~black-pudding
pears: blue-cheese walnuts ginger cinnamon chocolate honey ~rocket ~vanilla
orange: duck chocolate fennel beetroot carrot ginger cinnamon olives ~chilli ~rosemary
lemon: garlic parsley thyme oregano chicken fish butter capers dill olive_oil honey ~blueberries
lime: chilli coriander coconut ginger mint soy_sauce avocado mango prawns ~watermelon
mango: lime chilli coriander coconut chicken prawns red-onion mint ~avocado ~black-pepper
pineapple: ham pork chilli coriander lime coconut ginger ~rum ~basil
strawberries: cream balsamic black-pepper mint basil chocolate vanilla lemon ~tomato ~cucumber ~goats-cheese
raspberries: chocolate cream lemon vanilla almonds ~rose ~mint
blueberries: lemon cream vanilla almonds yogurt ~lavender
rhubarb: ginger orange custard strawberries cream ~pork ~mackerel
plums: duck pork cinnamon star-anise almonds ginger ~blue-cheese
kiwi: lime mint strawberries yogurt ~chilli
pomegranate: lamb mint feta yogurt aubergine chicken orange ~chocolate
coconut: lime chilli curry coriander ginger prawns chicken lemongrass ~mango ~pineapple
cheddar: apple onion tomato potato ham bacon mustard ~chutney
parmesan: basil tomato garlic pasta mushroom spinach lemon ~pear ~honey
mozzarella: tomato basil olive_oil prosciutto ~peach ~strawberries
feta: tomato cucumber olives oregano lemon watermelon spinach mint lamb ~honey
blue-cheese: pear walnuts apple honey steak celery ~chocolate ~beetroot
goats-cheese: beetroot honey walnuts thyme figs ~strawberries
yogurt: cucumber mint garlic lemon cumin honey lamb chicken curry ~pomegranate
cream: mushroom mustard chicken pasta potato leek ~whiskey
honey: mustard soy_sauce garlic lemon thyme chilli ginger ~blue-cheese
soy_sauce: ginger garlic honey chilli sesame spring-onion lime rice ~butter
curry: coconut onion garlic ginger tomato chickpeas chicken lamb spinach yogurt coriander lemon
coffee: chocolate cream cinnamon cardamom ~beef ~pork ~maple
dark-chocolate: chilli orange raspberries coffee cinnamon ~beef ~blue-cheese ~sea-salt
cocoa: chilli cinnamon coffee ~beef ~pork
pesto: pasta chicken tomato mozzarella potato courgette ~salmon
kimchi: rice egg pork bacon cheese spring-onion noodle ~avocado
miso: salmon aubergine mushroom butter honey sesame ~caramel ~sweetcorn
`;
const AVOID = `fish: !cheddar !mozzarella !parmesan !bbq_sauce !mint-sauce
salmon: !cheddar !bbq_sauce !ketchup
yogurt: !parmesan !soy_sauce
coconut: !parmesan !cheddar !mustard
`;
export const PAIRS = new Map(), BOLD = new Set(), AVOIDS = new Set();
const k2 = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
for (const line of SRC.trim().split('\n')) {
  const [a, rest] = line.split(':'); if (!rest) continue;
  for (let b of rest.trim().split(/\s+/)) { const bold = b.startsWith('~'); b = b.replace(/^~/, ''); const k = k2(a.trim(), b); if (!PAIRS.has(k) || !bold) PAIRS.set(k, bold ? 1 : 2); if (bold) BOLD.add(k); }
}
for (const line of AVOID.trim().split('\n')) { const [a, rest] = line.split(':'); for (const b of rest.trim().split(/\s+/)) AVOIDS.add(k2(a.trim(), b.replace(/^!/, ''))); }
// 2 = classic, 1 = bold but proven, -1 = avoid, 0 = no knowledge. Checks both the family keys and the exact ids.
export function known(idA, idB, keyOf) {
  const as = [idA, keyOf(idA)].filter(Boolean), bs = [idB, keyOf(idB)].filter(Boolean);
  let best = 0;
  for (const a of as) for (const b of bs) { const k = k2(a, b); if (AVOIDS.has(k)) return -1; const v = PAIRS.get(k) || 0; if (v > best) best = v; }
  return best;
}
export const size = () => PAIRS.size;
