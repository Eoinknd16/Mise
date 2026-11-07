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
tenderstem: garlic chilli lemon soy_sauce sesame ginger parmesan butter almonds anchovies salmon steak chicken-thigh ~miso ~blue-cheese
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
chicken: tarragon chorizo peanut-butter curry-paste paprika garam-masala five-spice sriracha miso kimchi bbq_sauce sweet-chilli olives capers feta halloumi pesto parmesan mozzarella spinach mushroom leek cabbage sweet_potato butternut avocado tortilla naan noodle couscous chickpeas lentils tahini fennel celery dill sage ~dates ~pomegranate ~maple ~waffles ~coffee ~kimchi ~mango-chutney
turkey: cranberry stuffing bacon chestnuts gravy sprouts parsnip carrot rosemary sausage ~chilli ~cumin ~mango
duck: hoisin cucumber pancakes noodle rice lime chilli plums cherries blackberries figs pears potato thyme garlic ~chocolate ~coffee ~beetroot
beef: stout mushroom horseradish blue-cheese peppercorn chilli ginger soy_sauce garlic onion carrot celery bay thyme rosemary red_wine tomato paprika cumin oregano chimichurri parsley lime coriander noodle rice potato yorkshire ~anchovies ~coffee ~dark-chocolate ~kimchi ~miso ~orange ~star-anise
beef_mince: chilli_powder cumin kidney-beans tomato onion garlic cheddar sour_cream tortilla rice lettuce oregano worcestershire carrot celery peas potato ~cinnamon ~allspice ~dark-chocolate ~coffee
pork: apple sage fennel-seeds cider mustard honey soy_sauce ginger garlic five-spice star-anise chilli kimchi gochujang plums pineapple orange lime coriander paprika cumin oregano bbq_sauce cabbage potato sweet_potato noodle rice beans ~coffee ~rhubarb ~peach ~maple ~miso ~black-pudding
pork-belly: honey soy_sauce five-spice star-anise ginger garlic chilli fennel-seeds apple cider cabbage kimchi rice noodle ~plums ~maple ~miso
bacon: eggs tomato mushroom potato cheddar cabbage leek peas sweetcorn spinach onion maple syrup avocado lettuce bread pasta parmesan beans scallops ~peanut-butter ~dates ~banana ~chocolate ~jam ~apple
ham: mustard honey pineapple cheddar mozzarella peas leek cabbage potato eggs bread melon ~apple ~orange ~cloves ~figs ~pears
sausage: onion mustard potato apple tomato beans pepper fennel-seeds sage thyme lentils cabbage kale chilli honey bread ~maple ~jam
chorizo: prawns chicken eggs potato chickpeas pepper tomato paprika garlic rice butter-beans kale spinach peas ~honey ~squid ~scallops
lamb: rosemary garlic mint lemon cumin coriander paprika chilli yogurt feta aubergine tomato chickpeas apricot dates honey pomegranate harissa tahini oregano thyme potato peas couscous ras-el-hanout ~anchovies ~cinnamon ~orange ~coffee
salmon: lemon dill soy_sauce honey ginger garlic lime cucumber asparagus potato spinach peas cream capers mustard chilli sesame miso teriyaki rice noodle avocado horseradish beetroot fennel ~orange ~maple
fish: lemon parsley butter capers garlic tomato potato peas dill chilli lime coriander olives fennel cream chorizo coconut curry ginger soy_sauce mayonnaise tartare chips ~orange ~saffron ~bacon
shrimp: garlic chilli lemon lime coriander ginger soy_sauce coconut tomato butter parsley spring-onion avocado mango rice noodle chorizo paprika pasta curry ~pineapple ~bacon ~peanut-butter
tuna: lemon olives capers tomato onion sweetcorn mayonnaise pasta eggs beans cucumber parsley chilli soy_sauce sesame avocado ~wasabi
mackerel: lemon horseradish beetroot potato mustard rhubarb gooseberry soy_sauce ginger chilli dill cucumber ~apple ~orange
anchovies: garlic lemon tomato olives capers broccoli lamb pasta parmesan egg butter chilli ~beef
egg: bacon cheese spinach mushroom tomato onion potato chives pepper ham chilli soy_sauce spring-onion avocado kimchi feta smoked-salmon chorizo bread rice asparagus curry ~truffle ~sriracha
tofu: soy_sauce ginger garlic chilli spring-onion sesame broccoli mushroom peanut-butter coconut curry lime miso kimchi noodle rice pak-choi
halloumi: lemon mint chilli honey courgette pepper tomato aubergine couscous melon pomegranate dates harissa
potato: butter rosemary garlic thyme onion leek cheese cream bacon parsley chives dill mustard egg paprika chilli cumin curry sausage fish ~truffle ~blue-cheese ~anchovies
sweet_potato: chilli lime cumin coriander kidney-beans feta maple cinnamon ginger coconut chickpeas spinach paprika black-beans ~miso ~sage ~bacon
tomato: basil garlic oregano olive_oil onion mozzarella parmesan chilli pepper cucumber feta capers olives vinegar bread eggs anchovies thyme ~strawberries ~cinnamon ~vanilla ~watermelon
mushroom: garlic thyme butter cream parsley soy_sauce beef chicken egg onion tarragon spinach miso blue-cheese rice pasta bacon ~truffle
aubergine: tomato garlic miso yogurt mint cumin feta tahini chilli basil lamb pomegranate honey soy_sauce ginger sesame parmesan mozzarella ~cinnamon
courgette: lemon mint basil garlic parmesan feta tomato chilli halloumi pasta eggs ~ricotta ~dill
cauliflower: cheddar curry cumin turmeric garlic parsley capers tahini chickpeas pomegranate butter ~raisin ~nutmeg ~anchovies
broccoli: garlic chilli lemon parmesan cheddar soy_sauce sesame ginger anchovies nuts beef chicken pasta ~blue-cheese ~bacon
carrot: honey cumin ginger orange thyme coriander butter parsley maple tahini chilli ~cardamom ~miso
parsnip: honey maple thyme rosemary butter curry nutmeg apple ~vanilla ~parmesan
beetroot: goats-cheese feta orange dill horseradish nuts apple vinegar yogurt mackerel ~chocolate ~cumin
spinach: garlic nutmeg cream feta egg lemon chickpeas curry parmesan ~raisin ~nuts ~cheddar
kale: garlic chilli lemon bacon parmesan sausage beans ~apple ~tahini
cabbage: bacon butter caraway apple onion pork vinegar soy_sauce ginger sausage potato ~juniper ~chilli
leek: potato cream cheese butter chicken mustard thyme bacon ~blue-cheese
peas: mint bacon ham butter parmesan lemon onion feta ~chorizo
sweetcorn: butter chilli lime cheese coriander paprika bacon ~miso
avocado: lime chilli coriander tomato onion egg bacon prawns salmon ~strawberries
cucumber: dill yogurt mint lemon garlic vinegar chilli sesame feta tomato salmon ~strawberries ~melon
pepper: tomato onion garlic paprika chilli cumin olive_oil feta chorizo basil sausage ~anchovies
butternut: sage chilli feta nutmeg cinnamon ginger coconut curry chickpeas ~maple ~blue-cheese
asparagus: lemon butter parmesan egg salmon ham mint bacon ~orange
green_beans: garlic butter lemon almonds bacon tomato chilli soy_sauce
fennel: orange lemon pork fish olives parmesan apple ~chilli
celery: apple blue-cheese nuts carrot onion ~peanut-butter
onion: garlic thyme butter beef cheese vinegar sage potato bay cheddar
mango: lime chilli coriander coconut chicken prawns red-onion mint avocado yogurt cardamom cream ~black-pepper ~salt
pineapple: ham pork chilli coriander lime coconut ginger ~basil ~mint
banana: chocolate peanut-butter honey cinnamon caramel cream yogurt oats nuts vanilla coffee ~bacon ~lime
apple: pork cinnamon cheddar sage blue-cheese nuts honey celery caramel cream custard oats ~fennel ~black-pudding
pears: blue-cheese nuts ginger cinnamon chocolate honey vanilla cream ~rocket
strawberries: cream vinegar black-pepper mint basil chocolate vanilla lemon yogurt rhubarb ~tomato ~cucumber ~goats-cheese
raspberries: chocolate cream lemon vanilla nuts white-chocolate ~mint
blueberries: lemon cream vanilla nuts yogurt oats ~lavender
berries: cream yogurt chocolate vanilla lemon oats honey
rhubarb: ginger orange custard strawberries cream ~pork ~mackerel
plums: duck pork cinnamon star-anise nuts ginger ~blue-cheese
melon: ham mint feta lime chilli ~black-pepper ~cucumber
orange: duck chocolate fennel beetroot carrot ginger cinnamon olives cranberry ~chilli ~rosemary
lemon: garlic parsley thyme oregano chicken fish butter capers dill olive_oil honey ginger blueberries ~basil
lime: chilli coriander coconut ginger mint soy_sauce avocado mango prawns ~melon
dates: nuts bacon goats-cheese lamb chocolate cinnamon ~blue-cheese
chocolate: orange raspberries coffee chilli cinnamon banana nuts peanut-butter mint vanilla cherries ~salt ~blue-cheese
dark-chocolate: chilli orange raspberries coffee cinnamon ~beef ~blue-cheese ~salt
coffee: chocolate cream cinnamon cardamom vanilla caramel ~beef ~pork ~maple
peanut_butter: banana chocolate jam honey chicken noodle lime chilli soy_sauce ~bacon ~celery ~apple
honey: mustard soy_sauce garlic lemon thyme chilli ginger yogurt nuts cheese ~blue-cheese
cinnamon: apple sugar coffee chocolate lamb ~beef_mince
vanilla: strawberries cream chocolate coffee ~tomato
cheddar: apple onion tomato potato ham bacon mustard jam broccoli cauliflower beer ~chutney
cheese: pears nuts honey jam grapes dates apple ~chocolate
feta: tomato cucumber olives oregano lemon melon spinach mint lamb honey pepper aubergine
mozzarella: tomato basil olive_oil prosciutto pesto ~peach ~strawberries
yogurt: cucumber mint garlic lemon cumin honey lamb chicken curry pomegranate berries
cream: mushroom mustard chicken pasta potato leek berries ~whiskey
soy_sauce: ginger garlic honey chilli sesame spring-onion lime rice noodle butter mushroom ~maple
miso: salmon aubergine mushroom butter honey sesame ~caramel ~sweetcorn
kimchi: rice egg pork bacon cheese spring-onion noodle ~avocado
sesame: soy_sauce ginger noodle chicken spinach broccoli honey
coconut: lime chilli curry coriander ginger prawns chicken lemongrass mango pineapple
curry: coconut onion garlic ginger tomato chickpeas chicken lamb spinach yogurt coriander lemon potato cauliflower
garlic: butter olive_oil lemon parsley chilli ginger soy_sauce rosemary thyme tomato mushroom prawns bread potato spinach
butter: garlic sage lemon parsley potato bread mushroom fish corn-cob honey ~miso ~soy_sauce
`;
const AVOID = `fish: !cheddar !mozzarella !parmesan !bbq_sauce !mint-sauce !jam !custard !chocolate !ketchup
shrimp: !jam !custard !chocolate !cheddar
salmon: !jam !chocolate !custard
strawberries: !garlic !onion
banana: !garlic !onion
ice-cream: !ketchup !garlic !onion
custard: !garlic !onion
salmon: !cheddar !bbq_sauce !ketchup
yogurt: !parmesan !soy_sauce
coconut: !parmesan !cheddar !mustard
`;
export const PAIRS = new Map(), BOLD = new Set(), AVOIDS = new Set(), POS = new Map();
const ALIAS = { walnuts: 'nuts', almonds: 'nuts', 'pine-nuts': 'nuts', chestnuts: 'nuts', maple: 'syrup', cranberry: 'jam', cranberries: 'jam', cherries: 'berries', blackberries: 'berries', gooseberry: 'berries', figs: 'dried-fruit', apricot: 'dried-fruit', raisin: 'dried-fruit', prosciutto: 'deli-meat', chives: 'spring-onion', 'pak-choi': 'cabbage', 'sea-salt': 'salt', red_wine: 'wine', white_wine: 'wine', cider: 'apple', horseradish: 'mustard', hoisin: 'oyster-sauce', gochujang: 'chilli', 'ras-el-hanout': 'cumin', harissa: 'chilli', teriyaki: 'soy_sauce', 'mango-chutney': 'mango', caramel: 'sugar', 'white-chocolate': 'chocolate', stuffing: 'sage', sprouts: 'cabbage', peppercorn: 'black-pepper', chimichurri: 'parsley', yorkshire: 'gravy', tartare: 'capers', 'black-beans': 'kidney-beans', allspice: 'cinnamon', cloves: 'nutmeg', waffles: 'syrup', beer: 'stout', grapes: 'grapes', lemongrass: 'lemongrass', peach: 'plums', ricotta: 'cream-cheese', truffle: 'mushroom', wasabi: 'mustard', juniper: 'gin', gin: 'gin', rum: 'rum', rose: 'rose', lavender: 'lavender', whiskey: 'whiskey', chutney: 'jam', 'black-pudding': 'pudding', custard: 'custard', salt: 'salt', scallops: 'prawns', squid: 'prawns', prunes: 'dried-fruit', peppers: 'pepper', watermelon: 'melon', saffron: 'cumin', balsamic: 'vinegar', caraway: 'cumin', grapefruit: 'orange', rocket: 'salad', pear: 'pears', pancakes: 'flour' };
const al = x => ALIAS[x] || x;
const k2 = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
for (const line of SRC.trim().split('\n')) {
  const [a, rest] = line.split(':'); if (!rest) continue;
  { let pos = 0; for (let b of rest.trim().split(/\s+/)) { pos++; const bold = b.startsWith('~'); b = al(b.replace(/^~/, '')); const k = k2(al(a.trim()), b); const dk = al(a.trim()) + '>' + b; if (!POS.has(dk) || POS.get(dk) > pos) POS.set(dk, pos); if (!PAIRS.has(k) || !bold) PAIRS.set(k, bold ? 1 : 2); if (bold) BOLD.add(k); } }
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
// how early b is listed among a's partners (lists run from most iconic to least): 1 = first, 99 = not listed
export function rank(idA, idB, keyOf) {
  let best = 99; for (const a of [idA, keyOf(idA)].filter(Boolean)) for (const b of [idB, keyOf(idB)].filter(Boolean)) { const v = POS.get(al(a) + '>' + al(b)); if (v && v < best) best = v; }
  return best;
}
