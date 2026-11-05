// Mise — reference data: ingredient catalog, built-in recipes, meal-builder parts.
// Prices are rough Irish discounter estimates (EUR) used only until the user's own
// receipts provide real prices. They are always labelled "est." in the UI.

export const AISLES = [
  ['fruitveg', 'Fruit & veg'], ['bakery', 'Bakery'], ['meat', 'Meat'], ['fish', 'Fish'],
  ['dairy', 'Dairy & eggs'], ['chilled', 'Chilled'], ['pantry', 'Cupboard'], ['spices', 'Herbs & spices'],
  ['frozen', 'Frozen'], ['snacks', 'Snacks & treats'], ['drinks', 'Drinks'], ['household', 'Household'], ['other', 'Other']
];

// id | name | aisle | base unit (g/ml/pc) | pack sizes (comma) | est price of first pack | shelf life days | spend category | aliases (;) | flags (s=staple) | extra units (unit:base;...)
const RAW = `
onion|Onions|fruitveg|g|1000|1.19|30|veg|onions;brown onion;yellow onion;white onion||onion:150;large:200;small:100
red-onion|Red onions|fruitveg|g|750|1.19|30|veg|red onions;rd onion||onion:150
garlic|Garlic|fruitveg|pc|40|0.99|60|veg|garlic clove;garlic cloves;cloves garlic;garlic bulbs||clove:1;bulb:10;head:10
potato|Potatoes|fruitveg|g|2500,1000|2.49|30|veg|potatoes;roosters;rooster potatoes;baby potatoes;new potatoes;maris piper;spuds||potato:200;large:250;medium:180
sweet-potato|Sweet potatoes|fruitveg|g|1000|1.79|21|veg|sweet potatoes||potato:250
carrot|Carrots|fruitveg|g|1000|0.89|21|veg|carrots||carrot:80;large:120
celery|Celery|fruitveg|g|500|1.19|14|veg|celery sticks;celery stalk||stick:40;stalk:40
pepper|Peppers|fruitveg|pc|3|1.69|10|veg|bell pepper;red pepper;green pepper;yellow pepper;peppers mixed;sweet pepper|
courgette|Courgettes|fruitveg|pc|2|1.29|10|veg|zucchini;courgettes|
broccoli|Broccoli|fruitveg|g|350|0.89|7|veg|broccoli head;tenderstem||head:350;floret:20
cauliflower|Cauliflower|fruitveg|pc|1|1.29|7|veg|cauli|
spinach|Spinach|fruitveg|g|240|1.49|4|veg|baby spinach;spinach leaves||handful:30;bag:240
salad|Salad leaves|fruitveg|g|120|1.19|4|veg|mixed leaves;rocket;lettuce;iceberg;little gem;salad bag||head:250;handful:20
tomato|Tomatoes|fruitveg|pc|6|1.29|7|veg|tomatoes;salad tomatoes;vine tomatoes;plum tomatoes fresh|
cherry-tomato|Cherry tomatoes|fruitveg|g|250|1.09|7|veg|cherry tomatoes;baby plum tomatoes||handful:80
cucumber|Cucumber|fruitveg|pc|1|0.79|7|veg|cucumbers|
mushroom|Mushrooms|fruitveg|g|250|1.29|5|veg|mushrooms;button mushrooms;chestnut mushrooms;closed cup||mushroom:20
leek|Leeks|fruitveg|g|500|1.19|14|veg|leeks||leek:200
cabbage|Cabbage|fruitveg|pc|1|0.99|21|veg|savoy cabbage;red cabbage|
green-beans|Green beans|fruitveg|g|200|1.29|5|veg|fine beans;string beans|
avocado|Avocados|fruitveg|pc|2|1.49|5|fruit|avocado|
lemon|Lemons|fruitveg|pc|4|1.29|21|fruit|lemon;lemon juice;lemon zest||juice:1
lime|Limes|fruitveg|pc|4|1.29|21|fruit|lime;lime juice|
ginger|Ginger|fruitveg|g|150|0.99|21|veg|fresh ginger;root ginger;ginger root||thumb:20;piece:20;inch:15
chilli|Fresh chillies|fruitveg|pc|8|0.79|10|veg|chilli;chillies;chili;red chilli;green chilli;jalapeno|
coriander|Coriander|fruitveg|g|30|0.79|5|veg|cilantro;fresh coriander||handful:10;bunch:30
parsley|Parsley|fruitveg|g|30|0.79|7|veg|fresh parsley;flat leaf parsley||handful:10;bunch:30
basil|Basil|fruitveg|g|30|0.99|5|veg|fresh basil;basil leaves||handful:10;bunch:30
spring-onion|Spring onions|fruitveg|pc|8|0.69|7|veg|scallions;green onions;spring onion|
apple|Apples|fruitveg|pc|6|1.49|21|fruit|apples|
banana|Bananas|fruitveg|pc|5|0.95|6|fruit|bananas|
orange|Oranges|fruitveg|pc|6|1.49|14|fruit|oranges;easy peelers;clementines;mandarins|
berries|Berries|fruitveg|g|150|1.99|4|fruit|strawberries;blueberries;raspberries|
grapes|Grapes|fruitveg|g|500|1.99|7|fruit|grape|
thyme|Fresh thyme|fruitveg|g|20|0.99|10|veg|thyme sprigs||sprig:1
rosemary|Fresh rosemary|fruitveg|g|20|0.99|10|veg|rosemary sprigs||sprig:1
bread|Sliced pan|bakery|pc|20|1.19|5|bakery|bread;sliced bread;white bread;brown bread;wholemeal bread;pan;toast||slice:1;loaf:20
wraps|Wraps|bakery|pc|8|1.29|14|bakery|tortillas;tortilla wraps;flour tortillas;wrap|
buns|Burger buns|bakery|pc|6|1.09|5|bakery|burger buns;brioche buns;bap;rolls|
naan|Naan bread|bakery|pc|2|1.29|7|bakery|naan;naans|
pitta|Pitta bread|bakery|pc|6|0.79|7|bakery|pitta;pita|
baguette|Baguette|bakery|pc|1|0.69|2|bakery|french stick|
chicken-breast|Chicken fillets|meat|g|500|4.99|3|meat|chicken breast;chicken breasts;chicken fillet;chkn brst;chicken|p:chicken|breast:180;fillet:180
chicken-thigh|Chicken thighs|meat|g|500|3.99|3|meat|chicken thighs;boneless chicken thighs;thigh fillets;chicken thigh fillets|p:chicken|thigh:120
chicken-wings|Chicken wings|meat|g|1000|3.49|3|meat|wings|p:chicken
whole-chicken|Whole chicken|meat|g|1500|5.49|3|meat|roast chicken|p:chicken|chicken:1500
beef-mince|Beef mince|meat|g|500,1000|3.99|3|meat|minced beef;ground beef;mince;lean mince;steak mince|p:beef
steak|Steak|meat|g|225|4.99|3|meat|sirloin;ribeye;rib eye;striploin|p:beef|steak:225
diced-beef|Diced beef|meat|g|400|4.99|3|meat|stewing beef;beef chuck;braising steak;beef stew meat|p:beef
beef-brisket|Beef brisket|meat|g|1000|8.99|4|meat|brisket;beef joint;roasting joint;silverside;topside;beef roast;chuck roast;pulled beef|p:beef
pork-chop|Pork chops|meat|g|500|3.99|3|meat|pork chop;pork loin|p:pork|chop:200
pork-mince|Pork mince|meat|g|500|2.99|3|meat|minced pork;ground pork|p:pork
sausages|Sausages|meat|pc|8|1.99|5|meat|sausage;pork sausages|p:pork
bacon|Rashers|meat|g|300|2.49|7|meat|bacon;rashers;streaky bacon;back bacon;smoked bacon;lardons;pancetta|p:pork|rasher:25;slice:25
lamb-mince|Lamb mince|meat|g|500|4.99|3|meat|minced lamb;ground lamb|p:lamb
lamb|Lamb pieces|meat|g|500|6.99|3|meat|lamb leg;lamb shoulder;diced lamb;lamb chops|p:lamb
ham|Sliced ham|meat|g|150|1.79|5|meat|ham slices;cooked ham|p:pork|slice:20
chorizo|Chorizo|meat|g|200|2.29|21|meat||p:pork
salmon|Salmon fillets|fish|g|240|4.49|2|fish|salmon;salmon fillet|p:fish|fillet:120
white-fish|White fish fillets|fish|g|300|4.49|2|fish|cod;haddock;hake;white fish;pollock|p:fish|fillet:140
prawns|Prawns|fish|g|200|2.99|2|fish|king prawns;shrimp;tiger prawns|p:fish
tuna|Tinned tuna|pantry|g|145|1.19|700|pantry|tuna;tuna chunks|p:fish|tin:145;can:145
smoked-salmon|Smoked salmon|fish|g|100|2.49|7|fish||p:fish
milk|Milk|dairy|ml|2000,1000|1.89|7|dairy|whole milk;full fat milk;semi skimmed;low fat milk;avonmore;milk 2l|
butter|Butter|dairy|g|227|2.99|60|dairy|salted butter;unsalted butter;kerrygold||knob:15;stick:113
cheddar|Cheddar|dairy|g|200,400|2.19|30|dairy|cheese;cheddar cheese;mature cheddar;grated cheese;red cheddar|
mozzarella|Mozzarella|dairy|g|125|0.89|10|dairy|mozzarella ball;grated mozzarella||ball:125
parmesan|Parmesan|dairy|g|100|2.49|60|dairy|grana padano;parmigiano;hard cheese|
feta|Feta|dairy|g|200|1.49|14|dairy|feta cheese;salad cheese|
halloumi|Halloumi|dairy|g|225|2.49|30|dairy|grilling cheese|p:veg
cream|Cream|dairy|ml|250|1.29|7|dairy|single cream;cooking cream;fresh cream;whipping cream||
double-cream|Double cream|dairy|ml|250|1.49|7|dairy|heavy cream|
creme-fraiche|Crème fraîche|dairy|g|200|1.29|10|dairy|creme fraiche;sour cream|
yogurt|Natural yogurt|dairy|g|500|1.09|10|dairy|plain yogurt;natural yoghurt;yoghurt;greek yogurt;greek style yogurt|
eggs|Eggs|dairy|pc|12,6|3.29|21|dairy|egg;free range eggs;large eggs|p:egg
cream-cheese|Cream cheese|dairy|g|200|1.29|14|dairy|soft cheese;philadelphia|
tofu|Tofu|chilled|g|280|1.99|10|chilled|firm tofu|p:veg
hummus|Hummus|chilled|g|200|1.29|7|chilled|houmous|
fresh-pasta|Fresh pasta|chilled|g|250|1.59|7|chilled|tortellini;ravioli|
coleslaw|Coleslaw|chilled|g|300|0.99|5|chilled||
ready-meal|Ready meal|chilled|pc|1|3.49|4|ready|ready meal;microwave meal;meal for one;lasagne ready|
pizza|Pizza|frozen|pc|1|2.29|180|ready|frozen pizza;stonebaked pizza;pizza chilled|
pasta|Pasta|pantry|g|500|0.69|700|pantry|penne;fusilli;rigatoni;macaroni;farfalle;conchiglie;dried pasta|
spaghetti|Spaghetti|pantry|g|500|0.69|700|pantry|linguine;tagliatelle;spaghetti pasta|
rice|Rice|pantry|g|1000|1.39|700|pantry|long grain rice;white rice;easy cook rice|
basmati|Basmati rice|pantry|g|1000|1.99|700|pantry|basmati|
noodles|Noodles|pantry|g|250|0.89|700|pantry|egg noodles;rice noodles;udon;ramen noodles||nest:60
couscous|Couscous|pantry|g|500|0.99|700|pantry||
oats|Porridge oats|pantry|g|1000|1.19|300|pantry|oats;rolled oats;porridge|
flour|Plain flour|pantry|g|1000|0.79|300|pantry|flour;self raising flour;cornflour;cornstarch;corn starch|s
sugar|Sugar|pantry|g|1000|1.29|700|pantry|caster sugar;brown sugar;granulated sugar|s
chopped-tomatoes|Chopped tomatoes|pantry|g|400|0.59|700|pantry|tinned tomatoes;canned tomatoes;tomatoes chopped;plum tomatoes||tin:400;can:400
passata|Passata|pantry|g|500|0.89|700|pantry|tomato passata|
tomato-puree|Tomato purée|pantry|g|200|0.69|60|pantry|tomato puree;tomato paste|s|
coconut-milk|Coconut milk|pantry|ml|400|1.09|700|pantry|coconut cream||tin:400;can:400
stock|Stock cubes|pantry|pc|12|0.99|700|pantry|stock cube;chicken stock;beef stock;vegetable stock;veg stock;bouillon|s|cube:1;pot:1;litre:2
chickpeas|Chickpeas|pantry|g|400|0.59|700|pantry|chick peas|p:veg|tin:400;can:400
kidney-beans|Kidney beans|pantry|g|400|0.59|700|pantry|red kidney beans;black beans;mixed beans|p:veg|tin:400;can:400
baked-beans|Baked beans|pantry|g|420|0.69|700|pantry|beans|p:veg|tin:420;can:420
lentils|Lentils|pantry|g|500|1.29|700|pantry|red lentils;green lentils;puy lentils|p:veg
sweetcorn|Sweetcorn|pantry|g|340|0.79|700|pantry|corn;tinned sweetcorn||tin:340;can:340
olive-oil|Olive oil|pantry|ml|500|4.99|500|pantry|extra virgin olive oil;evoo|s
oil|Vegetable oil|pantry|ml|1000|2.29|500|pantry|sunflower oil;rapeseed oil;cooking oil;vegetable oil|s
soy-sauce|Soy sauce|pantry|ml|150|1.29|500|pantry|soy;light soy;dark soy|s
honey|Honey|pantry|g|340|2.99|700|pantry||s
mayo|Mayonnaise|pantry|g|500|1.69|90|pantry|mayo;mayonnaise|s
ketchup|Ketchup|pantry|g|500|1.39|180|pantry|tomato ketchup;tomato sauce|s
mustard|Mustard|pantry|g|200|0.99|180|pantry|dijon mustard;wholegrain mustard|s
curry-paste|Curry paste|pantry|g|190|1.49|180|pantry|tikka paste;korma paste;thai curry paste;red curry paste;green curry paste|
pesto|Pesto|pantry|g|190|1.79|30|pantry|basil pesto;green pesto;red pesto|
vinegar|Vinegar|pantry|ml|350|0.89|700|pantry|white wine vinegar;balsamic vinegar;cider vinegar|s
peanut-butter|Peanut butter|pantry|g|340|1.89|180|pantry||
cereal|Breakfast cereal|pantry|g|500|1.99|180|pantry|cornflakes;granola;muesli;weetabix|
jam|Jam|pantry|g|454|1.39|180|pantry|strawberry jam;marmalade|
coffee|Coffee|drinks|g|227|3.49|180|drinks|ground coffee;instant coffee;coffee beans|
tea|Tea bags|drinks|pc|80|2.49|500|drinks|tea;barrys;lyons;teabags|
salt|Salt|spices|g|750|0.49|999|pantry|sea salt;table salt|s|pinch:0.5
black-pepper|Black pepper|spices|g|50|0.99|999|pantry|pepper ground;ground black pepper;black pepper|s|pinch:0.3
paprika|Paprika|spices|g|50|0.89|700|pantry|smoked paprika|s
cumin|Cumin|spices|g|40|0.89|700|pantry|ground cumin;cumin seeds|s
chilli-powder|Chilli powder|spices|g|50|0.89|700|pantry|chili powder;cayenne;chilli flakes;red pepper flakes|s
curry-powder|Spice mix|spices|g|50|0.89|700|pantry|curry powder;garam masala;turmeric;ground coriander;ground ginger;allspice;nutmeg;five spice;cardamom|s
oregano|Dried herbs|spices|g|15|0.79|700|pantry|oregano;dried oregano;mixed herbs;italian herbs;dried thyme;dried basil;bay leaf;bay leaves|s
cinnamon|Cinnamon|spices|g|40|0.89|700|pantry|ground cinnamon|s
peas|Frozen peas|frozen|g|1000|1.99|180|veg|peas;garden peas;petits pois||handful:40
frozen-veg|Frozen veg mix|frozen|g|1000|1.79|180|veg|mixed veg;stir fry veg;stir fry vegetables;frozen vegetables;mixed vegetables|
chips|Oven chips|frozen|g|1500|2.49|180|ready|chips;fries;potato wedges|
fish-fingers|Fish fingers|frozen|pc|10|1.99|180|ready|fish finger|p:fish
ice-cream|Ice cream|frozen|ml|900|2.49|180|sweet|ice cream tub;vanilla ice cream|
crisps|Crisps|snacks|pc|1|1.29|90|snack|crisp;tayto;crisps multipack;pringles;tortilla chips;nachos|
chocolate|Chocolate|snacks|g|100|0.99|180|sweet|choc;chocolate bar;dairy milk;chocolate buttons|
biscuits|Biscuits|snacks|g|300|1.19|90|sweet|cookies;digestives;biscuit|
sweets|Sweets|snacks|g|200|1.29|180|sweet|jellies;candy;haribo;gummies|
nuts|Nuts|snacks|g|200|2.29|180|snack|peanuts;cashews;almonds;mixed nuts|
juice|Juice|drinks|ml|1000|1.29|10|drinks|orange juice;apple juice;oj|
fizzy|Fizzy drinks|drinks|ml|2000|1.79|180|fizzy|cola;coca cola;coke;pepsi;7up;fanta;lemonade;soft drink;mineral|
energy|Energy drinks|drinks|ml|250|0.99|180|energy|energy drink;red bull;monster;lucozade|
water|Sparkling water|drinks|ml|1500|0.49|365|drinks|water;still water;sparkling water|
beer|Beer|drinks|ml|2000|5.99|180|alcohol|lager;cider;stout;cans|
wine|Wine|drinks|ml|750|6.99|365|alcohol|red wine;white wine;rose wine|
toilet-roll|Toilet roll|household|pc|9|3.99|999|household|toilet tissue;loo roll|
kitchen-roll|Kitchen roll|household|pc|2|1.79|999|household|kitchen towel;paper towels|
washing-up|Washing-up liquid|household|pc|1|1.29|999|household|washing up liquid;dish soap|
bin-bags|Bin bags|household|pc|1|1.49|999|household|bin liners|
laundry|Laundry detergent|household|pc|1|4.99|999|household|washing powder;washing liquid;detergent;capsules|

bbq-sauce|BBQ sauce|pantry|g|500|1.49|180|sauce|barbecue sauce;bbq;smokey bbq;sticky bbq|s
hot-sauce|Hot sauce|pantry|ml|150|1.29|365|sauce|sriracha;tabasco;peri peri;piri piri;buffalo sauce;franks;gochujang;peri peri sauce|s
sweet-chilli|Sweet chilli sauce|pantry|ml|300|1.29|365|sauce|sweet chili sauce;sweet chilli|s
brown-sauce|Brown sauce|pantry|g|450|1.49|180|sauce|hp sauce;chef brown sauce;yr sauce|s
salad-cream|Salad cream|pantry|g|425|1.49|180|sauce|salad dressing;caesar dressing;dressing;vinaigrette|s
worcestershire|Worcestershire sauce|pantry|ml|150|1.29|500|sauce|lea perrins;worcester sauce|s
oyster-sauce|Oyster sauce|pantry|ml|150|1.49|365|sauce|hoisin;hoisin sauce;teriyaki sauce;fish sauce;black bean sauce|s
pasta-sauce|Pasta sauce|pantry|g|500|1.29|365|sauce|bolognese sauce;tomato pasta sauce;dolmio;arrabbiata sauce;pasta sauce jar;lasagne sauce;white sauce;cheese sauce;carbonara sauce|
cooking-sauce|Cooking sauce|pantry|g|500|1.49|365|sauce|curry sauce;korma sauce;tikka masala sauce;sweet and sour sauce;stir fry sauce;chasseur sauce;jar sauce;butter chicken sauce;fajita sauce|
gravy|Gravy granules|pantry|g|300|1.49|365|sauce|bisto;gravy|s
mint-sauce|Relish & chutney|pantry|g|300|1.39|365|sauce|mint sauce;cranberry sauce;relish;chutney;mango chutney;pickle;branston;apple sauce|s
salsa|Salsa & dips|chilled|g|300|1.29|14|sauce|salsa;dip;guacamole;tzatziki;sour cream and chive dip|
pears|Pears|fruitveg|pc|4|1.49|10|fruit|pear;conference pears|
kiwi|Kiwis|fruitveg|pc|6|1.49|14|fruit|kiwi fruit|
mango|Mango|fruitveg|pc|1|0.99|6|fruit|mangoes|
pineapple|Pineapple|fruitveg|pc|1|1.49|6|fruit||
melon|Melon|fruitveg|pc|1|1.69|7|fruit|watermelon;cantaloupe;honeydew|
plums|Stone fruit|fruitveg|g|500|1.99|6|fruit|plums;peaches;nectarines;apricots;cherries|
aubergine|Aubergine|fruitveg|pc|1|0.89|7|veg|eggplant|
beetroot|Beetroot|fruitveg|g|250|0.99|21|veg|cooked beetroot|
parsnip|Parsnips|fruitveg|g|500|0.89|21|veg|parsnip;turnip;swede|
butternut|Butternut squash|fruitveg|pc|1|1.29|30|veg|squash;pumpkin|
kale|Kale|fruitveg|g|200|1.29|5|veg|cavolo nero;pak choi;bok choy;spring greens|
asparagus|Asparagus|fruitveg|g|250|2.49|4|veg||
sugar-snap|Mangetout & sugar snaps|fruitveg|g|150|1.29|5|veg|mange tout;sugar snap peas;baby corn;tenderstem|
corn-cob|Corn on the cob|fruitveg|pc|2|1.29|5|veg|corn cobs;sweetcorn cobs|
radish|Radishes|fruitveg|g|200|0.79|7|veg|radish;spring onions bunch|
mint|Fresh mint|fruitveg|g|20|0.99|6|veg|mint;dill;chives;fresh herbs;tarragon|
salad-veg|Prepared veg|fruitveg|g|300|1.29|4|veg|stir fry mix;coleslaw mix;veg medley;soup mix;prepared vegetables;diced onion|
croissants|Croissants & pastries|bakery|pc|4|1.29|3|bakery|croissant;pain au chocolat;danish;pastries;cinnamon swirl|
scones|Scones|bakery|pc|4|1.49|4|bakery|scone|
soda-bread|Brown soda bread|bakery|pc|1|1.49|4|bakery|soda bread;wholemeal loaf;brennans;wholegrain bread;sourdough;bloomer|
cake|Cakes & buns|bakery|pc|1|2.29|5|sweet|cake;muffins;muffin;doughnuts;donuts;brownies;cupcakes;swiss roll;tarts;apple tart|
crumpets|Crumpets & pancakes|bakery|pc|6|1.09|5|bakery|crumpet;pancakes;potato farls;potato cakes;waffles fresh|
chicken-drum|Chicken drumsticks|meat|g|1000|3.49|3|meat|drumsticks;chicken legs;chicken drumsticks|p:chicken
turkey-mince|Turkey mince|meat|g|500|3.49|3|meat|turkey breast;turkey steaks;minced turkey|p:chicken
burgers|Burgers|meat|pc|4|2.99|3|meat|beef burgers;quarter pounders;burger patties|p:beef
pudding|Black & white pudding|meat|g|280|1.49|14|meat|black pudding;white pudding;clonakilty;pudding|p:pork
deli-meat|Cooked meats|meat|g|150|1.79|5|meat|salami;pepperoni;chicken slices;turkey slices;roast beef slices;corned beef;chicken pieces cooked;sliced chicken|p:pork
hot-dogs|Hot dogs|meat|pc|8|1.29|21|meat|frankfurters;hot dog sausages|p:pork
gammon|Gammon & bacon joint|meat|g|1000|5.99|7|meat|gammon;bacon joint;ham joint|p:pork
pork-belly|Pork belly & roast|meat|g|600|4.49|3|meat|pork belly;pork shoulder;pork steaks;pork fillet;pork roast|p:pork
mackerel|Mackerel & sardines|fish|g|125|1.19|365|fish|mackerel;sardines;tinned mackerel;kippers|p:fish
fish-cakes|Fish cakes|fish|pc|4|2.49|4|fish|fishcakes;crab sticks|p:fish
cheese-slices|Cheese slices|dairy|pc|10|1.49|21|dairy|easi singles;cheese singles;sliced cheese;dubliner|
cottage-cheese|Cottage cheese & soft cheese|dairy|g|300|1.29|10|dairy|cottage cheese;ricotta;mascarpone;quark|
brie|Speciality cheese|dairy|g|200|2.29|14|dairy|brie;camembert;blue cheese;goats cheese;gouda;emmental;edam;stilton|
fruit-yogurt|Yogurt pots|dairy|pc|6|1.69|14|dairy|yogurt pots;fruit yogurt;kids yogurt;petits filous;yoplait;muller;activia|
oat-milk|Plant milk|dairy|ml|1000|1.69|10|dairy|oat milk;soya milk;soy milk;almond milk;coconut drink;alpro|
spread|Butter spread|dairy|g|500|2.49|60|dairy|dairygold;flora;low fat spread;margarine;olive spread|
custard|Custard & desserts|dairy|g|500|1.29|10|sweet|custard;rice pudding;jelly pots;trifle;cheesecake;mousse;creme caramel|
cream-spray|Squirty cream|dairy|ml|250|1.79|21|sweet|aerosol cream;whipped cream|
fresh-soup|Fresh soup|chilled|ml|600|2.29|5|chilled|soup chilled;fresh soup pot|
quiche|Quiche & savoury pies|chilled|pc|1|2.49|5|ready|quiche;pork pie;sausage rolls;pasties;scotch eggs|
garlic-bread|Garlic bread|chilled|pc|2|1.29|7|ready|garlic baguette;garlic slices;dough balls|
meal-deal|Sandwich or salad|chilled|pc|1|3.29|2|ready|sandwich;wrap meal;salad pot;pasta salad;sushi;meal deal;roll filled|
olives|Olives & antipasti|chilled|g|200|1.69|30|chilled|olives;sundried tomatoes;antipasti;pickled onions;gherkins|
pizza-dough|Pastry & dough|chilled|pc|1|1.49|10|chilled|puff pastry;shortcrust pastry;pizza dough;filo pastry|
soup-tin|Tinned soup|pantry|g|400|0.89|700|pantry|soup tin;cup a soup;packet soup;minestrone|
pot-noodle|Instant noodles|pantry|pc|1|0.99|300|ready|pot noodle;super noodles;instant noodles;cup noodles|
crackers|Crackers & rice cakes|snacks|g|200|1.09|180|snack|crackers;cream crackers;rice cakes;crispbread;oatcakes|
cereal-bars|Cereal bars|snacks|pc|6|1.49|180|snack|cereal bar;granola bars;protein bar;nature valley|
popcorn|Popcorn & pretzels|snacks|g|100|0.99|180|snack|popcorn;pretzels;puffs|
gum|Chewing gum & mints|snacks|pc|1|0.99|365|sweet|chewing gum;mints;gum|
choc-spread|Chocolate spread|pantry|g|400|2.49|365|sweet|nutella;hazelnut spread|
syrup|Syrup|pantry|g|450|1.69|700|sweet|golden syrup;maple syrup;agave|s
baking|Baking items|pantry|g|200|1.29|700|pantry|baking powder;bread soda;bicarbonate;yeast;cocoa;vanilla;icing sugar;baking chocolate;chocolate chips|s
breadcrumbs|Breadcrumbs|pantry|g|200|0.79|300|pantry|panko|s
dried-fruit|Dried fruit, nuts & seeds|pantry|g|200|1.49|300|pantry|raisins;sultanas;dried apricots;seeds;chia;flaxseed;ground almonds;flaked almonds|
grains|Quinoa & grains|pantry|g|500|1.79|700|pantry|quinoa;bulgur;pearl barley;polenta|
gnocchi|Gnocchi|pantry|g|500|1.29|60|pantry||
lasagne|Lasagne sheets|pantry|g|500|0.99|700|pantry|lasagne sheets;cannelloni|
tinned-fruit|Tinned fruit|pantry|g|410|0.89|700|fruit|peaches tin;pineapple chunks;fruit cocktail;mandarins tin|
tinned-veg|Tinned veg & pulses|pantry|g|400|0.59|700|pantry|butter beans;cannellini beans;borlotti;tinned potatoes;tinned carrots;mushy peas;processed peas;tinned spaghetti;spaghetti hoops;ravioli tin|
salmon-tin|Tinned salmon|pantry|g|213|2.49|700|pantry|red salmon;pink salmon|p:fish
nuggets|Chicken nuggets & goujons|frozen|g|500|2.49|180|ready|nuggets;goujons;chicken dippers;popcorn chicken;breaded chicken;chicken kiev;kievs|p:chicken
frozen-fish|Frozen fish|frozen|g|400|2.99|180|fish|breaded fish;battered fish;fish fillets frozen;frozen cod;frozen prawns|p:fish
frozen-burgers|Frozen burgers & sausages|frozen|pc|8|2.49|180|ready|frozen burgers;frozen sausages|p:beef
hash-browns|Potato products|frozen|g|750|1.49|180|ready|hash browns;potato waffles;wedges;croquettes;roast potatoes frozen;mash frozen|
frozen-fruit|Frozen fruit|frozen|g|500|2.49|180|fruit|frozen berries;smoothie mix;frozen mango|
lollies|Ice lollies|frozen|pc|6|1.99|180|sweet|ice lolly;ice pops;magnum;cornetto;choc ices|
frozen-meal|Frozen ready meal|frozen|pc|1|2.49|180|ready|frozen lasagne;frozen curry;frozen meal|
squash|Squash & cordial|drinks|ml|1000|1.49|180|fizzy|squash;cordial;miwadi;ribena;robinsons|
hot-choc|Hot chocolate|drinks|g|300|2.29|365|sweet|cocoa drink;hot chocolate|
smoothie|Smoothies|drinks|ml|750|2.49|7|drinks|smoothie;kombucha;kefir|
sports|Sports drinks|drinks|ml|500|1.29|365|fizzy|lucozade sport;powerade;isotonic|
spirits|Spirits|drinks|ml|700|19.99|999|alcohol|vodka;gin;whiskey;whisky;rum;tequila;baileys;liqueur|
shampoo|Shampoo & shower|household|pc|1|2.49|999|personal|shampoo;conditioner;shower gel;body wash;soap;hand wash;bubble bath|
toothpaste|Toothpaste & dental|household|pc|1|1.49|999|personal|toothpaste;toothbrush;mouthwash;floss|
deodorant|Deodorant & toiletries|household|pc|1|2.29|999|personal|deodorant;deo;antiperspirant;razors;shaving foam;moisturiser;lotion;sun cream;cotton pads;cotton buds|
baby|Baby products|household|pc|1|4.99|999|personal|nappies;diapers;baby wipes;wipes;baby food;formula|
health|Health & medicine|household|pc|1|2.49|999|personal|paracetamol;ibuprofen;plasters;vitamins;cold and flu;lemsip|
sanitary|Sanitary products|household|pc|1|1.99|999|personal|tampons;sanitary pads;pantyliners;period pants|
tissues|Tissues|household|pc|1|1.29|999|household|facial tissues;tissue|
cleaning|Cleaning products|household|pc|1|1.49|999|household|bleach;cleaning spray;surface spray;disinfectant;toilet cleaner;cif;sponges;scourers;cloths;rubber gloves;air freshener|
dishwasher|Dishwasher tablets|household|pc|1|4.99|999|household|dishwasher tabs;finish;rinse aid|
fabric|Fabric softener|household|pc|1|2.49|999|household|softener;comfort;fabric conditioner|
foil|Foil, wrap & bags|household|pc|1|1.49|999|household|tin foil;aluminium foil;cling film;baking paper;freezer bags;sandwich bags;food bags|
batteries|Batteries & bulbs|household|pc|1|3.99|999|household|batteries;light bulbs;bulb|
pet|Pet food|household|pc|1|2.99|999|pet|dog food;cat food;pet food;dog treats;cat litter;whiskas;pedigree|
other-veg|Other veg|fruitveg|pc|1|1.00|7|veg|vegetables;veg|
other-fruit|Other fruit|fruitveg|pc|1|1.00|7|fruit|fruit|
other-meat|Other meat|meat|pc|1|4.00|3|meat|meat|
other-fish|Other fish|fish|pc|1|4.00|3|fish|seafood|
other-dairy|Other dairy|dairy|pc|1|1.50|10|dairy|dairy|
other-bakery|Other bakery|bakery|pc|1|1.50|4|bakery|bakery|
other-food|Other food|pantry|pc|1|1.50|180|pantry|grocery;food|
other-sauce|Other sauce or condiment|pantry|pc|1|1.50|180|sauce|sauce;condiment|s
other-snack|Other snacks|snacks|pc|1|1.50|180|snack|snack|
other-sweet|Other sweets & treats|snacks|pc|1|1.50|180|sweet|treat;dessert|
other-frozen|Other frozen|frozen|pc|1|2.50|180|ready|frozen|
other-drink|Other soft drinks|drinks|pc|1|1.50|180|drinks|drink|
other-alcohol|Other alcohol|drinks|pc|1|6.00|365|alcohol|alcohol;booze|
other-household|Other household|household|pc|1|2.00|999|household|household|
other-personal|Other toiletries|household|pc|1|2.00|999|personal|toiletries|`;

export const CATALOG = RAW.trim().split('\n').filter(l => l.trim()).map(line => {
  const [id, n, a, u, packs, p, life, cat, aliases = '', flags = '', extra = ''] = line.split('|');
  const tags = []; let staple = false;
  for (const f of flags.split(',').filter(Boolean)) { if (f === 's') staple = true; else tags.push(f); }
  const conv = {};
  for (const e of extra.split(';').filter(Boolean)) { const [k, v] = e.split(':'); conv[k] = +v; }
  return { id, n, a, u, packs: packs.split(',').map(Number), p: +p, life: +life, cat, al: aliases.split(';').filter(Boolean), staple, tags, conv };
});
export const ITEM = Object.fromEntries(CATALOG.map(i => [i.id, i]));

export const SHOPS = ['Lidl', 'Aldi', 'Tesco', 'Dunnes', 'SuperValu', 'Centra', 'Spar', 'Other'];

// ---------- Built-in recipes (work offline) ----------
// ingredient line format: "qty unit | name"   (unit may be empty)
const R = (id, title, cat, area, serves, time, ings, steps, extra = {}) => ({ id: 'b:' + id, src: 'builtin', title, cat, area, serves, time, ingLines: ings, steps, ...extra });

export const BUILTIN = [
  R('bolognese', 'Spaghetti bolognese', 'Beef', 'Italian', 4, 45, [
    '500 g|beef mince', '1 |onion', '2 clove|garlic', '1 |carrot', '400 g|chopped tomatoes', '2 tbsp|tomato puree', '1 cube|beef stock', '1 tsp|dried oregano', '400 g|spaghetti', '40 g|parmesan'],
    ['Finely chop the onion, carrot and garlic.', 'Brown the mince in a large pan over a high heat, breaking it up. Drain off excess fat.', 'Add the onion and carrot and cook 5 minutes until soft, then the garlic for 1 minute.', 'Stir in the tomatoes, purée, crumbled stock cube, oregano and 150 ml water. Simmer 25 minutes, stirring now and then.', 'Meanwhile cook the spaghetti in salted boiling water for 10 minutes. Drain.', 'Season the sauce, serve over the spaghetti with grated parmesan.']),
  R('chicken-curry', 'Easy chicken curry', 'Chicken', 'Indian', 4, 40, [
    '600 g|chicken thighs', '1 |onion', '3 clove|garlic', '20 g|ginger', '3 tbsp|curry paste', '400 ml|coconut milk', '400 g|chopped tomatoes', '100 g|spinach', '300 g|basmati rice', '1 tbsp|oil'],
    ['Cut the chicken into bite-sized pieces. Chop the onion; grate the garlic and ginger.', 'Fry the onion in oil for 6 minutes until golden. Add garlic, ginger and curry paste and cook 1 minute.', 'Add the chicken and cook 5 minutes, turning, until sealed.', 'Pour in the coconut milk and tomatoes. Simmer 20 minutes until the chicken is cooked through.', 'Rinse the rice and cook in boiling water for 10–12 minutes. Drain.', 'Stir the spinach into the curry until wilted. Serve with the rice.']),
  R('chilli', 'Chilli con carne', 'Beef', 'Mexican', 4, 50, [
    '500 g|beef mince', '1 |onion', '1 |red pepper', '2 clove|garlic', '2 tsp|chilli powder', '1 tsp|ground cumin', '400 g|chopped tomatoes', '400 g|kidney beans', '1 cube|beef stock', '300 g|rice'],
    ['Chop the onion, pepper and garlic.', 'Brown the mince in a large pan, then add the onion and pepper and cook 5 minutes.', 'Stir in the garlic, chilli powder and cumin for 1 minute.', 'Add tomatoes, drained beans, crumbled stock cube and 200 ml water. Simmer 30 minutes.', 'Cook the rice for 10–12 minutes and drain.', 'Season the chilli and serve over rice.']),
  R('stirfry', 'Chicken & veg stir-fry', 'Chicken', 'Chinese', 4, 25, [
    '500 g|chicken breast', '250 g|noodles', '1 |red pepper', '200 g|broccoli', '4 |spring onions', '2 clove|garlic', '15 g|ginger', '3 tbsp|soy sauce', '1 tbsp|honey', '1 tbsp|oil'],
    ['Cook the noodles as per the pack, drain and toss with a drop of oil.', 'Slice the chicken thinly. Slice the pepper, cut the broccoli into small florets, slice the spring onions. Grate garlic and ginger.', 'Mix soy sauce and honey with 2 tbsp water.', 'Stir-fry the chicken in hot oil for 5 minutes until cooked. Add the veg and stir-fry 3 minutes.', 'Add garlic and ginger for 30 seconds, then the noodles and sauce. Toss for 2 minutes and serve.']),
  R('shepherds-pie', "Shepherd's pie", 'Lamb', 'Irish', 4, 75, [
    '500 g|lamb mince', '1 |onion', '2 |carrots', '2 tbsp|tomato puree', '1 cube|beef stock', '1 kg|potatoes', '50 g|butter', '50 ml|milk', '100 g|frozen peas'],
    ['Heat the oven to 200°C (180°C fan).', 'Peel and chop the potatoes, boil 15–20 minutes until soft. Drain and mash with the butter and milk. Season.', 'Brown the mince, add the chopped onion and carrots and cook 8 minutes.', 'Stir in the purée, stock cube and 250 ml water. Simmer 15 minutes until thick. Add the peas.', 'Spoon the mince into a dish, top with the mash and rough up the surface with a fork.', 'Bake 25 minutes until golden.']),
  R('salmon-traybake', 'Lemon salmon traybake', 'Seafood', 'Irish', 2, 35, [
    '240 g|salmon fillets', '500 g|baby potatoes', '150 g|green beans', '1 |lemon', '2 tbsp|olive oil', '1 clove|garlic', '10 g|parsley'],
    ['Heat the oven to 200°C (180°C fan).', 'Halve the potatoes, toss with 1 tbsp oil and salt, roast 20 minutes.', 'Add the beans and salmon to the tray. Drizzle with remaining oil, grated garlic and lemon zest.', 'Roast 12–15 minutes until the salmon flakes.', 'Squeeze over the lemon and scatter with chopped parsley.']),
  R('chickpea-curry', 'Chickpea & spinach curry', 'Vegetarian', 'Indian', 4, 30, [
    '1 |onion', '2 clove|garlic', '15 g|ginger', '2 tbsp|curry paste', '800 g|chickpeas', '400 ml|coconut milk', '400 g|chopped tomatoes', '150 g|spinach', '300 g|basmati rice', '1 tbsp|oil'],
    ['Fry the chopped onion in oil for 6 minutes.', 'Add garlic, ginger and curry paste for 1 minute.', 'Add drained chickpeas, coconut milk and tomatoes. Simmer 15 minutes.', 'Cook the rice for 10–12 minutes.', 'Stir in the spinach until wilted. Serve with rice.']),
  R('carbonara', 'Bacon carbonara', 'Pork', 'Italian', 4, 25, [
    '400 g|spaghetti', '200 g|bacon lardons', '3 |eggs', '60 g|parmesan', '2 clove|garlic', '1 tsp|black pepper'],
    ['Cook the spaghetti in salted boiling water for 10 minutes. Keep a mug of the pasta water.', 'Fry the bacon until crisp, add the crushed garlic for 1 minute, then take off the heat.', 'Whisk the eggs with most of the grated parmesan and plenty of pepper.', 'Toss the drained pasta in the bacon pan off the heat. Stir in the egg mix and a splash of pasta water until glossy (the heat cooks the egg without scrambling).', 'Serve with the remaining parmesan.']),
  R('fajitas', 'Chicken fajitas', 'Chicken', 'Mexican', 4, 25, [
    '500 g|chicken breast', '2 |peppers', '1 |red onion', '2 tsp|smoked paprika', '1 tsp|ground cumin', '1 tsp|chilli powder', '1 |lime', '8 |wraps', '100 g|creme fraiche', '80 g|cheddar', '1 tbsp|oil'],
    ['Slice the chicken, peppers and onion into strips.', 'Toss the chicken with the spices, a pinch of salt and the oil.', 'Fry the chicken in a hot pan for 5 minutes, add the veg and cook 5 more until charred at the edges.', 'Squeeze over the lime.', 'Warm the wraps and fill with the chicken, crème fraîche and grated cheese.']),
  R('sausage-casserole', 'Sausage & bean casserole', 'Pork', 'Irish', 4, 45, [
    '8 |sausages', '1 |onion', '2 |carrots', '2 clove|garlic', '1 tsp|smoked paprika', '400 g|chopped tomatoes', '400 g|mixed beans', '1 cube|chicken stock', '1 kg|potatoes'],
    ['Brown the sausages in a large pan, then cut each into 3.', 'Fry the chopped onion and carrots for 5 minutes, add garlic and paprika.', 'Add tomatoes, drained beans, stock cube and 200 ml water, return the sausages. Simmer 25 minutes.', 'Meanwhile boil the potatoes and mash or serve boiled.']),
  R('lentil-soup', 'Red lentil soup', 'Vegetarian', 'Irish', 4, 35, [
    '1 |onion', '2 |carrots', '1 stick|celery', '200 g|red lentils', '1 tsp|ground cumin', '2 cube|vegetable stock', '1 |lemon', '4 slice|bread'],
    ['Chop the onion, carrots and celery and soften in a little oil for 8 minutes.', 'Add cumin, rinsed lentils, stock cubes and 1.2 litres water. Simmer 20 minutes.', 'Blend until smooth, season and add a squeeze of lemon.', 'Serve with buttered bread.']),
  R('tuna-bake', 'Tuna pasta bake', 'Seafood', 'Irish', 4, 35, [
    '400 g|pasta', '2 tin|tuna', '200 g|sweetcorn', '500 g|passata', '1 |onion', '120 g|cheddar', '1 tsp|dried oregano'],
    ['Heat the oven to 200°C (180°C fan). Cook the pasta for 8 minutes, drain.', 'Soften the chopped onion, add passata and oregano and simmer 5 minutes.', 'Mix pasta, sauce, drained tuna and sweetcorn in a dish. Top with grated cheese.', 'Bake 15 minutes until bubbling.']),
  R('beef-stew', 'Irish beef stew', 'Beef', 'Irish', 4, 150, [
    '800 g|diced beef', '1 |onion', '3 |carrots', '600 g|potatoes', '2 tbsp|tomato puree', '2 tbsp|flour', '2 cube|beef stock', '2 sprig|thyme'],
    ['Toss the beef in flour and brown in batches in a heavy pot.', 'Add chopped onion and cook 5 minutes, then the purée.', 'Add 1 litre water, stock cubes and thyme. Cover and simmer 1½ hours.', 'Add chunky carrots and potatoes and cook 40 minutes more until tender. Season.']),
  R('halloumi-wraps', 'Halloumi & pepper wraps', 'Vegetarian', 'Mediterranean', 2, 20, [
    '225 g|halloumi', '1 |pepper', '1 |red onion', '4 |wraps', '100 g|hummus', '60 g|salad leaves', '1 |lemon'],
    ['Slice the halloumi, pepper and onion.', 'Griddle or fry the veg 6 minutes, then the halloumi 2 minutes each side.', 'Spread wraps with hummus, fill with leaves, veg and halloumi, squeeze over lemon and roll.']),
  R('fried-rice', 'Egg fried rice', 'Vegetarian', 'Chinese', 2, 20, [
    '250 g|rice', '3 |eggs', '150 g|frozen peas', '4 |spring onions', '2 tbsp|soy sauce', '1 tbsp|oil'],
    ['Cook the rice and spread out to cool (or use leftover rice).', 'Scramble the eggs in hot oil, set aside.', 'Stir-fry the rice and peas for 4 minutes, add the soy sauce, egg and sliced spring onions.']),
  R('pesto-pasta', 'Pesto chicken pasta', 'Chicken', 'Italian', 4, 25, [
    '400 g|pasta', '400 g|chicken breast', '190 g|pesto', '250 g|cherry tomatoes', '80 g|spinach', '30 g|parmesan'],
    ['Cook the pasta for 10 minutes.', 'Slice and fry the chicken for 6–8 minutes until cooked. Add halved tomatoes for 2 minutes.', 'Toss the drained pasta with the chicken, pesto and spinach. Top with parmesan.']),
  R('fish-tacos', 'Crispy fish tacos', 'Seafood', 'Mexican', 2, 25, [
    '300 g|white fish', '4 |wraps', '2 tbsp|flour', '1 tsp|smoked paprika', '1 |lime', '100 g|yogurt', '100 g|cabbage', '1 |avocado'],
    ['Cut the fish into strips, toss in flour, paprika and salt.', 'Fry in hot oil 2–3 minutes each side until golden.', 'Mix yogurt with lime juice. Shred the cabbage, slice the avocado.', 'Warm the wraps, fill with fish, slaw, avocado and lime yogurt.']),
  R('veg-pasta', 'Roast veg & feta pasta', 'Vegetarian', 'Mediterranean', 4, 35, [
    '400 g|pasta', '1 |courgette', '2 |peppers', '1 |red onion', '250 g|cherry tomatoes', '200 g|feta', '2 tbsp|olive oil', '1 tsp|dried oregano'],
    ['Heat the oven to 200°C. Chop the veg, toss with oil and oregano, roast 25 minutes.', 'Cook the pasta for 10 minutes.', 'Toss pasta with the roasted veg and crumbled feta.']),
  R('pork-chops', 'Pork chops, mash & greens', 'Pork', 'Irish', 4, 35, [
    '4 |pork chops', '1 kg|potatoes', '50 g|butter', '60 ml|milk', '300 g|broccoli', '1 tsp|mustard'],
    ['Boil the potatoes 15–20 minutes, mash with butter, milk and mustard.', 'Season the chops and fry 4–5 minutes each side until cooked through. Rest 3 minutes.', 'Steam or boil the broccoli 4 minutes. Serve together.']),
  R('omelette', 'Cheese & ham omelette', 'Breakfast', 'Irish', 1, 10, [
    '3 |eggs', '30 g|cheddar', '2 slice|ham', '1 knob|butter'],
    ['Beat the eggs with salt and pepper.', 'Melt the butter in a pan, add the eggs and stir gently until almost set.', 'Add grated cheese and ham, fold over and serve.']),
  R('pulled-beef', 'BBQ pulled beef buns', 'Beef', 'American', 6, 270, [
    '1.2 kg|beef brisket', '1 |onion', '2 tsp|smoked paprika', '1 tbsp|brown sugar', '300 ml|bbq sauce', '1 cube|beef stock', '2 tbsp|cider vinegar', '6 |burger buns', '300 g|coleslaw'],
    ['Rub the beef with paprika, sugar, salt and pepper. Brown it all over in a hot pan.', 'Put the sliced onion in a slow cooker or casserole, sit the beef on top and add the stock (made with 250 ml water) and vinegar.', 'Cook 8 hours on low in a slow cooker, or covered in the oven at 150°C for 4 hours, until it falls apart.', 'Shred with two forks, discard fat, and stir through the BBQ sauce with a few spoons of the cooking juices.', 'Pile into toasted buns with coleslaw.']),
  R('pulled-pork', 'Pulled pork wraps', 'Pork', 'American', 6, 270, [
    '1.2 kg|pork shoulder', '2 tsp|smoked paprika', '1 tbsp|brown sugar', '1 tsp|ground cumin', '250 ml|bbq sauce', '150 ml|apple juice', '8 |wraps', '300 g|coleslaw'],
    ['Rub the pork with the spices, sugar and salt.', 'Slow-cook with the apple juice 8 hours on low, or covered at 150°C for 4–5 hours.', 'Shred, mix with the BBQ sauce and some juices.', 'Serve in warm wraps with coleslaw.']),
  R('lasagne', 'Beef lasagne', 'Beef', 'Italian', 6, 90, [
    '500 g|beef mince', '1 |onion', '2 clove|garlic', '1 |carrot', '400 g|chopped tomatoes', '2 tbsp|tomato puree', '1 tsp|dried oregano', '250 g|lasagne sheets', '50 g|butter', '50 g|plain flour', '600 ml|milk', '100 g|cheddar'],
    ['Make a bolognese: brown the mince, add chopped onion, carrot and garlic, then tomatoes, purée and oregano. Simmer 20 minutes.', 'For the white sauce, melt the butter, stir in the flour for 1 minute, then whisk in the milk gradually until thick. Season.', 'Layer meat sauce, lasagne sheets and white sauce in a dish, three times, finishing with white sauce.', 'Top with grated cheese and bake at 190°C for 40 minutes. Rest 10 minutes.']),
  R('cottage-pie', 'Cottage pie', 'Beef', 'Irish', 4, 75, [
    '500 g|beef mince', '1 |onion', '2 |carrots', '1 tbsp|worcestershire sauce', '2 tbsp|tomato puree', '1 cube|beef stock', '1 kg|potatoes', '50 g|butter', '50 ml|milk', '60 g|cheddar'],
    ['Brown the mince with chopped onion and carrots for 10 minutes.', 'Add purée, Worcestershire sauce, stock cube and 250 ml water. Simmer 20 minutes.', 'Boil and mash the potatoes with butter and milk.', 'Top the mince with mash and cheese, bake at 200°C for 25 minutes.']),
  R('bacon-cabbage', 'Bacon & cabbage', 'Pork', 'Irish', 4, 120, [
    '1 kg|gammon', '1 |cabbage', '1 kg|potatoes', '50 g|butter', '1 tbsp|wholegrain mustard', '250 ml|cream'],
    ['Soak the bacon joint in cold water 1 hour if salty. Cover with fresh water and simmer 20 minutes per 450 g plus 20 minutes.', 'Boil the potatoes in their skins.', 'Shred the cabbage and cook it in some of the bacon water for 6–8 minutes. Toss with butter.', 'Warm the cream with the mustard for a sauce. Slice the bacon and serve.']),
  R('coddle', 'Dublin coddle', 'Pork', 'Irish', 4, 90, [
    '8 |sausages', '200 g|bacon', '2 |onions', '1 kg|potatoes', '1 cube|chicken stock', '10 g|parsley'],
    ['Cut sausages and rashers into chunks and brown them lightly.', 'Layer with sliced onions and thick potato slices in a pot.', 'Add the stock cube and enough water to just cover. Cover and simmer gently for 1 hour.', 'Scatter with parsley and serve with brown bread.']),
  R('tikka-masala', 'Chicken tikka masala', 'Chicken', 'Indian', 4, 45, [
    '600 g|chicken breast', '150 g|natural yogurt', '3 tbsp|tikka paste', '1 |onion', '2 clove|garlic', '20 g|ginger', '400 g|chopped tomatoes', '150 ml|cream', '300 g|basmati rice', '2 |naan'],
    ['Mix the chicken pieces with yogurt and 1 tbsp tikka paste. Leave 15 minutes or longer.', 'Fry the chicken in batches until charred. Set aside.', 'Fry chopped onion 8 minutes, add garlic, ginger and remaining paste, then tomatoes. Simmer 10 minutes.', 'Blend if you like it smooth, add cream and the chicken, simmer 8 minutes.', 'Serve with rice and warm naan.']),
  R('thai-green', 'Thai green chicken curry', 'Chicken', 'Thai', 4, 30, [
    '500 g|chicken thighs', '3 tbsp|green curry paste', '400 ml|coconut milk', '150 g|green beans', '1 |red pepper', '1 |lime', '15 g|coriander', '300 g|basmati rice'],
    ['Fry the curry paste 1 minute, add sliced chicken and cook 5 minutes.', 'Add coconut milk, beans and sliced pepper, simmer 12 minutes.', 'Finish with lime juice and coriander. Serve with rice.']),
  R('meatballs', 'Spaghetti & meatballs', 'Beef', 'Italian', 4, 40, [
    '500 g|beef mince', '40 g|breadcrumbs', '1 |egg', '30 g|parmesan', '1 |onion', '2 clove|garlic', '500 g|passata', '1 tsp|dried oregano', '400 g|spaghetti'],
    ['Mix the mince, breadcrumbs, egg, half the parmesan and seasoning. Roll into 20 balls.', 'Brown the meatballs in a pan, set aside.', 'Soften the onion and garlic, add passata and oregano, return the meatballs and simmer 15 minutes.', 'Serve on spaghetti with the rest of the parmesan.']),
  R('burgers', 'Homemade beef burgers & chips', 'Beef', 'American', 4, 35, [
    '500 g|beef mince', '1 |red onion', '4 |burger buns', '4 slice|cheese slices', '1 |tomato', '60 g|salad leaves', '600 g|oven chips', '2 tbsp|ketchup'],
    ['Put the chips in the oven at 220°C for 25 minutes.', 'Shape the mince into 4 patties, season well.', 'Fry or grill 4–5 minutes each side, adding cheese for the last minute.', 'Toast buns, fill with burger, lettuce, tomato and onion.']),
  R('burrito', 'Beef burrito bowls', 'Beef', 'Mexican', 4, 30, [
    '500 g|beef mince', '2 tsp|smoked paprika', '1 tsp|ground cumin', '400 g|kidney beans', '200 g|sweetcorn', '300 g|rice', '1 |avocado', '1 |lime', '100 g|creme fraiche', '80 g|cheddar'],
    ['Cook the rice.', 'Brown the mince with the spices, add drained beans and a splash of water, simmer 5 minutes.', 'Serve rice topped with mince, sweetcorn, sliced avocado, lime, crème fraîche and cheese.']),
  R('fish-chips', 'Oven fish & chips', 'Seafood', 'Irish', 4, 40, [
    '600 g|white fish', '60 g|breadcrumbs', '1 |egg', '2 tbsp|plain flour', '800 g|potatoes', '300 g|frozen peas', '1 |lemon'],
    ['Cut potatoes into chips, toss in oil and bake at 220°C for 35 minutes.', 'Coat the fish in flour, beaten egg and breadcrumbs. Bake on an oiled tray for the last 15 minutes.', 'Cook the peas, mash lightly. Serve with lemon.']),
  R('stew-lamb', 'Irish lamb stew', 'Lamb', 'Irish', 4, 120, [
    '700 g|lamb pieces', '2 |onions', '3 |carrots', '800 g|potatoes', '2 cube|chicken stock', '2 sprig|thyme', '10 g|parsley'],
    ['Brown the lamb in batches.', 'Add sliced onion, carrots, stock cubes, thyme and 1 litre water. Simmer covered 1 hour.', 'Add chunky potatoes and cook 40 minutes more. Finish with parsley.']),
  R('chicken-caesar', 'Chicken Caesar salad', 'Chicken', 'American', 2, 20, [
    '300 g|chicken breast', '1 |little gem lettuce', '2 slice|bread', '30 g|parmesan', '3 tbsp|caesar dressing', '2 |rashers'],
    ['Season and fry the chicken 6–8 minutes, slice.', 'Fry the rashers until crisp. Toast cubed bread in the pan for croutons.', 'Toss lettuce with dressing, top with chicken, bacon, croutons and shaved parmesan.']),
  R('teriyaki-salmon', 'Teriyaki salmon & noodles', 'Seafood', 'Japanese', 2, 20, [
    '240 g|salmon fillets', '3 tbsp|soy sauce', '1 tbsp|honey', '1 clove|garlic', '10 g|ginger', '150 g|noodles', '150 g|broccoli', '2 |spring onions'],
    ['Mix soy, honey, grated garlic and ginger.', 'Pan-fry the salmon 4 minutes skin-side down, flip, pour in the sauce and bubble 2 minutes.', 'Cook noodles and broccoli together for 4 minutes, drain.', 'Serve the salmon on the noodles with sauce and spring onion.']),
  R('korma', 'Chicken korma', 'Chicken', 'Indian', 4, 35, [
    '600 g|chicken breast', '1 |onion', '3 tbsp|korma paste', '400 ml|coconut milk', '100 ml|cream', '300 g|basmati rice'],
    ['Fry the onion 6 minutes, add the paste for 1 minute.', 'Add the chicken and cook 5 minutes.', 'Add coconut milk and simmer 15 minutes, stir in the cream.', 'Serve with rice.'])
];

// ---------- Meal builder parts (per serving amounts) ----------
export const B_PROTEIN = {
  chicken: { n: 'Chicken', item: 'chicken thighs', q: 150, u: 'g', cook: 'Cut the chicken into bite-sized pieces, season and fry in a little oil over a medium-high heat for 6–8 minutes until golden and cooked through.', min: 10, veg: false, cost: 2 },
  'chicken breast': { n: 'Chicken breast', item: 'chicken breast', q: 150, u: 'g', cook: 'Slice the chicken breast, season and fry in a little oil for 5–6 minutes until cooked through.', min: 8, veg: false, cost: 3 },
  beef: { n: 'Beef mince', item: 'beef mince', q: 125, u: 'g', cook: 'Brown the mince in a hot pan for 6–8 minutes, breaking it up. Drain off excess fat.', min: 10, veg: false, cost: 2 },
  steak: { n: 'Steak', item: 'steak', q: 170, u: 'g', cook: 'Season the steak and sear in a very hot pan 2–3 minutes each side for medium. Rest 5 minutes, then slice.', min: 10, veg: false, cost: 5 },
  pork: { n: 'Sausages', item: 'sausages', q: 2, u: '', cook: 'Fry or grill the sausages for 12–15 minutes, turning, until cooked through. Slice into chunks.', min: 15, veg: false, cost: 1 },
  bacon: { n: 'Bacon', item: 'bacon lardons', q: 60, u: 'g', cook: 'Fry the bacon until crisp, 5 minutes.', min: 6, veg: false, cost: 1 },
  salmon: { n: 'Salmon', item: 'salmon fillets', q: 120, u: 'g', cook: 'Season the salmon and pan-fry skin-side down 4 minutes, flip and cook 2–3 minutes more.', min: 8, veg: false, fish: true, cost: 4 },
  'white fish': { n: 'White fish', item: 'white fish', q: 150, u: 'g', cook: 'Season the fish and pan-fry 3 minutes each side until it flakes.', min: 7, veg: false, fish: true, cost: 3 },
  prawns: { n: 'Prawns', item: 'prawns', q: 100, u: 'g', cook: 'Fry the prawns in a hot pan for 2–3 minutes until pink.', min: 4, veg: false, fish: true, cost: 3 },
  chickpeas: { n: 'Chickpeas', item: 'chickpeas', q: 120, u: 'g', cook: 'Drain and rinse the chickpeas, then fry for 4 minutes until lightly crisp.', min: 5, veg: true, vegan: true, cost: 0.5 },
  lentils: { n: 'Lentils', item: 'red lentils', q: 60, u: 'g', cook: 'Rinse the lentils and simmer in the sauce (add 150 ml extra water per serving) for 20 minutes until soft.', min: 20, veg: true, vegan: true, cost: 0.5 },
  halloumi: { n: 'Halloumi', item: 'halloumi', q: 75, u: 'g', cook: 'Slice the halloumi and fry 2 minutes each side until golden.', min: 5, veg: true, cost: 2 },
  tofu: { n: 'Tofu', item: 'tofu', q: 100, u: 'g', cook: 'Press the tofu dry, cube it and fry until crisp on all sides, about 8 minutes.', min: 10, veg: true, vegan: true, cost: 1.5 },
  eggs: { n: 'Eggs', item: 'eggs', q: 2, u: '', cook: 'Fry or poach the eggs to your liking (3–4 minutes).', min: 4, veg: true, cost: 0.6 },
  'pulled beef': { n: 'Pulled beef', item: 'beef brisket', q: 200, u: 'g', cook: 'Rub the beef with salt, pepper and smoked paprika and brown it all over. Slow-cook covered with 200 ml stock: 8 hours on low in a slow cooker, or 3½–4 hours in the oven at 150°C, until it falls apart. Shred with two forks.', min: 240, veg: false, cost: 3.5, slow: true },
  'pulled pork': { n: 'Pulled pork', item: 'pork shoulder', q: 200, u: 'g', cook: 'Rub the pork with salt, pepper, smoked paprika and a little brown sugar. Slow-cook covered with 150 ml stock: 8 hours on low, or 4 hours in the oven at 150°C, until it pulls apart. Shred with two forks.', min: 240, veg: false, cost: 2, slow: true },
  'pulled chicken': { n: 'Pulled chicken', item: 'chicken thighs', q: 170, u: 'g', cook: 'Simmer the chicken thighs, covered, in 150 ml stock for 25 minutes (or slow-cook 4 hours on low), then shred with two forks.', min: 30, veg: false, cost: 2 },
  meatballs: { n: 'Meatballs', item: 'beef mince', q: 130, u: 'g', cook: 'Season the mince, mix in a little grated onion, roll into walnut-sized balls and brown in a pan for 8–10 minutes, turning.', min: 15, veg: false, cost: 2 },
  burgers: { n: 'Burgers', item: 'beef mince', q: 150, u: 'g', cook: 'Shape the mince into one patty per person, season well and fry or grill 4–5 minutes each side.', min: 12, veg: false, cost: 2 },
  lamb: { n: 'Lamb', item: 'lamb pieces', q: 150, u: 'g', cook: 'Season the lamb and brown in a hot pan, then cook through for 10–12 minutes.', min: 15, veg: false, cost: 4 },
  turkey: { n: 'Turkey', item: 'turkey mince', q: 130, u: 'g', cook: 'Brown the turkey mince in a hot pan for 6–8 minutes, breaking it up.', min: 10, veg: false, cost: 2 },
  chorizo: { n: 'Chorizo', item: 'chorizo', q: 50, u: 'g', cook: 'Slice the chorizo and fry 3–4 minutes until it releases its oil.', min: 5, veg: false, cost: 1 },
  'pork chops': { n: 'Pork chops', item: 'pork chops', q: 200, u: 'g', cook: 'Season the chops and fry 4–5 minutes each side until cooked through. Rest 3 minutes.', min: 12, veg: false, cost: 2 }
};
export const B_BASE = {
  rice: { n: 'Rice', item: 'basmati rice', q: 75, u: 'g', cook: 'Rinse the rice and cook in boiling salted water for 10–12 minutes. Drain and steam with the lid on.', min: 15 },
  pasta: { n: 'Pasta', item: 'pasta', q: 100, u: 'g', cook: 'Cook the pasta in plenty of salted boiling water for 10 minutes. Keep a cup of pasta water before draining.', min: 12 },
  noodles: { n: 'Noodles', item: 'noodles', q: 65, u: 'g', cook: 'Cook the noodles as per the pack (usually 4 minutes), drain and toss with a drop of oil.', min: 5 },
  potatoes: { n: 'Potatoes', item: 'potatoes', q: 250, u: 'g', cook: 'Cut the potatoes into chunks and boil 15–18 minutes until tender (or roast at 200°C for 35 minutes).', min: 20 },
  wraps: { n: 'Wraps', item: 'wraps', q: 2, u: '', cook: 'Warm the wraps in a dry pan for 20 seconds each side.', min: 2 },
  couscous: { n: 'Couscous', item: 'couscous', q: 70, u: 'g', cook: 'Pour boiling water over the couscous to just cover, cover for 5 minutes, then fluff with a fork.', min: 5 },
  bread: { n: 'Crusty bread', item: 'baguette', q: 0.25, u: '', cook: 'Warm the bread in the oven for 5 minutes.', min: 5 },
  none: { n: 'No carbs (salad)', item: 'salad leaves', q: 40, u: 'g', cook: 'Arrange the salad leaves on plates.', min: 1 },
  buns: { n: 'Brioche buns', item: 'burger buns', q: 1, u: '', cook: 'Split the buns and toast them cut-side down for 1 minute.', min: 3 },
  chips: { n: 'Chips', item: 'oven chips', q: 150, u: 'g', cook: 'Bake the chips at 220°C for 20–25 minutes, turning once.', min: 25 },
  naan: { n: 'Naan', item: 'naan bread', q: 1, u: '', cook: 'Warm the naan in the oven for 3 minutes.', min: 3 },
  mash: { n: 'Mash', item: 'potatoes', q: 250, u: 'g', cook: 'Boil the peeled potatoes 15–18 minutes, then mash with a knob of butter and a splash of milk.', min: 20 }
};
export const B_STYLE = {
  creamy: { n: 'Creamy garlic', ings: [['', 'onion', 0.25], ['clove', 'garlic', 1], ['ml', 'cream', 60], ['g', 'parmesan', 10], ['g', 'spinach', 30]], sauce: 'Soften the chopped onion for 5 minutes, add the garlic for 1 minute, then pour in the cream and simmer 3 minutes. Stir in the parmesan and spinach until wilted.', rich: 3, spice: 0, healthy: 1 },
  tomato: { n: 'Tomato & herb', ings: [['', 'onion', 0.25], ['clove', 'garlic', 1], ['g', 'chopped tomatoes', 100], ['tsp', 'dried oregano', 0.25], ['g', 'basil', 3]], sauce: 'Soften the chopped onion for 5 minutes, add garlic for 1 minute, then the tomatoes and oregano. Simmer 10 minutes and finish with torn basil.', rich: 1, spice: 0, healthy: 3 },
  curry: { n: 'Curry', ings: [['', 'onion', 0.25], ['clove', 'garlic', 1], ['g', 'ginger', 4], ['tbsp', 'curry paste', 0.75], ['ml', 'coconut milk', 100]], sauce: 'Fry the chopped onion 6 minutes, add garlic, ginger and curry paste for 1 minute, then the coconut milk. Simmer 10 minutes.', rich: 2, spice: 2, healthy: 2 },
  stirfry: { n: 'Stir-fry', ings: [['clove', 'garlic', 1], ['g', 'ginger', 4], ['tbsp', 'soy sauce', 0.75], ['tsp', 'honey', 1], ['', 'spring onion', 1]], sauce: 'Mix the soy sauce and honey with 1 tbsp water. Stir-fry the garlic and ginger 30 seconds, add the sauce and toss everything together for 2 minutes. Top with sliced spring onion.', rich: 1, spice: 1, healthy: 3 },
  mexican: { n: 'Fajita spice', ings: [['', 'peppers', 0.5], ['', 'red onion', 0.25], ['tsp', 'smoked paprika', 0.5], ['tsp', 'ground cumin', 0.25], ['', 'lime', 0.25], ['g', 'creme fraiche', 25]], sauce: 'Slice the pepper and onion and fry in a hot pan with the paprika and cumin for 6 minutes until charred. Squeeze over the lime and serve with crème fraîche.', rich: 1, spice: 2, healthy: 2 },
  mediterranean: { n: 'Mediterranean traybake', ings: [['', 'peppers', 0.5], ['', 'courgette', 0.25], ['', 'red onion', 0.25], ['tbsp', 'olive oil', 0.5], ['tsp', 'dried oregano', 0.25], ['g', 'feta', 30]], sauce: 'Chop the veg, toss with the oil and oregano and roast at 200°C for 25 minutes. Crumble over the feta to serve.', rich: 1, spice: 0, healthy: 3 },
  pesto: { n: 'Pesto', ings: [['g', 'pesto', 45], ['g', 'cherry tomatoes', 60], ['g', 'spinach', 20]], sauce: 'Halve the tomatoes and warm them in the pan for 2 minutes, then stir through the pesto and spinach.', rich: 2, spice: 0, healthy: 2 },
  chilli: { n: 'Smoky chilli', ings: [['', 'onion', 0.25], ['clove', 'garlic', 1], ['g', 'chopped tomatoes', 100], ['g', 'kidney beans', 60], ['tsp', 'chilli powder', 0.5], ['tsp', 'ground cumin', 0.25]], sauce: 'Soften the onion and garlic, add the spices for 1 minute, then the tomatoes and drained beans. Simmer 15 minutes.', rich: 1, spice: 2, healthy: 3 },
  lemon: { n: 'Lemon & herb', ings: [['', 'lemon', 0.25], ['clove', 'garlic', 1], ['tbsp', 'olive oil', 0.5], ['g', 'parsley', 5]], sauce: 'Mix lemon zest and juice, crushed garlic, olive oil and chopped parsley. Spoon over at the end.', rich: 1, spice: 0, healthy: 3 },
  bbq: { n: 'BBQ', ings: [['tbsp', 'bbq sauce', 2.5], ['tsp', 'smoked paprika', 0.5], ['tsp', 'brown sugar', 1], ['tsp', 'cider vinegar', 1], ['', 'onion', 0.25]], sauce: 'Soften the sliced onion, then stir in the BBQ sauce, paprika, sugar, vinegar and 2 tbsp water. Simmer 5 minutes until sticky and toss the meat through it.', rich: 2, spice: 1, healthy: 1 },
  teriyaki: { n: 'Teriyaki', ings: [['tbsp', 'soy sauce', 1], ['tsp', 'honey', 2], ['clove', 'garlic', 1], ['g', 'ginger', 4], ['', 'spring onion', 1]], sauce: 'Mix the soy sauce, honey, grated garlic and ginger with 2 tbsp water. Pour into the pan and bubble for 2–3 minutes until glossy. Top with sliced spring onion.', rich: 1, spice: 0, healthy: 2 },
  jerk: { n: 'Jerk', ings: [['tsp', 'allspice', 0.5], ['', 'chilli', 0.5], ['', 'lime', 0.25], ['g', 'thyme', 1], ['tsp', 'honey', 1], ['', 'spring onion', 1]], sauce: 'Blitz or finely chop the chilli, spring onion, thyme, allspice, lime juice and honey into a paste. Rub it over the meat before cooking.', rich: 1, spice: 2, healthy: 2 },
  peri: { n: 'Peri peri', ings: [['tbsp', 'peri peri sauce', 1], ['', 'lemon', 0.25], ['clove', 'garlic', 1], ['tsp', 'smoked paprika', 0.5]], sauce: 'Mix the peri peri sauce, lemon juice, crushed garlic and paprika. Coat the meat before cooking and spoon the rest over at the end.', rich: 1, spice: 2, healthy: 3 },
  cajun: { n: 'Cajun', ings: [['tsp', 'smoked paprika', 0.5], ['tsp', 'ground cumin', 0.25], ['tsp', 'dried oregano', 0.25], ['tsp', 'chilli powder', 0.25], ['', 'peppers', 0.5]], sauce: 'Toss the meat in the paprika, cumin, oregano and chilli powder before cooking. Fry the sliced pepper alongside until charred.', rich: 1, spice: 2, healthy: 3 },
  thai: { n: 'Thai green curry', ings: [['tbsp', 'green curry paste', 0.75], ['ml', 'coconut milk', 100], ['', 'lime', 0.25], ['g', 'coriander', 4], ['g', 'green beans', 40]], sauce: 'Fry the curry paste for 1 minute, add the coconut milk and green beans and simmer 8 minutes. Finish with lime juice and coriander.', rich: 2, spice: 2, healthy: 2 },
  katsu: { n: 'Katsu curry', ings: [['g', 'breadcrumbs', 25], ['', 'eggs', 0.25], ['tsp', 'curry powder', 1], ['', 'onion', 0.25], ['', 'carrot', 0.25], ['tsp', 'honey', 1], ['cube', 'chicken stock', 0.25]], sauce: 'Coat the meat in flour, beaten egg and breadcrumbs and fry until golden. For the sauce, soften the onion and carrot, add the curry powder, honey, stock and 100 ml water per person, simmer 10 minutes and blend smooth.', rich: 2, spice: 1, healthy: 1 },
  sweetsour: { n: 'Sweet & sour', ings: [['g', 'pineapple chunks', 50], ['', 'peppers', 0.5], ['tbsp', 'ketchup', 1], ['tsp', 'vinegar', 1], ['tsp', 'soy sauce', 1], ['tsp', 'sugar', 1]], sauce: 'Stir-fry the pepper 3 minutes, add the pineapple, then the ketchup, vinegar, soy sauce, sugar and 2 tbsp pineapple juice. Bubble until glossy.', rich: 1, spice: 0, healthy: 2 },
  honeygarlic: { n: 'Honey garlic', ings: [['tsp', 'honey', 2], ['clove', 'garlic', 2], ['tbsp', 'soy sauce', 0.75], ['', 'spring onion', 1]], sauce: 'Fry the crushed garlic 30 seconds, add the honey and soy sauce and bubble until sticky. Toss the meat through and top with spring onion.', rich: 1, spice: 0, healthy: 2 },
  buffalo: { n: 'Buffalo', ings: [['tbsp', 'hot sauce', 1], ['g', 'butter', 8], ['g', 'blue cheese', 15]], sauce: 'Melt the butter with the hot sauce and toss the cooked meat through it. Serve with crumbled blue cheese.', rich: 2, spice: 2, healthy: 1 },
  greek: { n: 'Greek-style', ings: [['g', 'yogurt', 40], ['clove', 'garlic', 1], ['', 'lemon', 0.25], ['tsp', 'dried oregano', 0.5], ['', 'cucumber', 0.15]], sauce: 'Rub the meat with oregano, lemon juice and garlic before cooking. Grate the cucumber into the yogurt with a pinch of salt for tzatziki.', rich: 1, spice: 0, healthy: 3 },
  moroccan: { n: 'Moroccan', ings: [['tsp', 'ground cumin', 0.5], ['tsp', 'cinnamon', 0.25], ['g', 'chopped tomatoes', 100], ['g', 'dried apricots', 15], ['tsp', 'honey', 1], ['', 'onion', 0.25]], sauce: 'Soften the onion, add the cumin and cinnamon for 1 minute, then the tomatoes, chopped apricots and honey. Simmer 15 minutes.', rich: 1, spice: 1, healthy: 3 },
  korean: { n: 'Korean-style', ings: [['tbsp', 'gochujang', 0.5], ['tbsp', 'soy sauce', 0.75], ['tsp', 'honey', 1], ['clove', 'garlic', 1], ['', 'spring onion', 1]], sauce: 'Mix the gochujang, soy sauce, honey and crushed garlic. Toss the meat in it for the last 2 minutes of cooking and top with spring onion.', rich: 1, spice: 2, healthy: 2 },
  gravy: { n: 'Gravy & greens', ings: [['', 'onion', 0.25], ['cube', 'beef stock', 0.25], ['tsp', 'flour', 1], ['g', 'butter', 5]], sauce: 'Soften the sliced onion in the butter for 8 minutes, stir in the flour, then 75 ml hot water per serving with the crumbled stock cube. Simmer until thick.', rich: 2, spice: 0, healthy: 1 }
};
export const B_VEG = {
  broccoli: ['g', 'broccoli', 80, 'Cut the broccoli into florets and steam or boil for 4 minutes.'],
  peppers: ['', 'peppers', 0.5, 'Slice the pepper and add it to the pan for the last 5 minutes.'],
  spinach: ['g', 'spinach', 30, 'Stir the spinach in at the end until wilted.'],
  mushrooms: ['g', 'mushrooms', 60, 'Slice the mushrooms and fry with the onion.'],
  courgette: ['', 'courgette', 0.25, 'Dice the courgette and fry with the onion.'],
  peas: ['g', 'frozen peas', 50, 'Add the peas for the last 3 minutes.'],
  carrots: ['g', 'carrots', 60, 'Slice the carrots and boil or roast until tender.'],
  'green beans': ['g', 'green beans', 50, 'Boil the beans for 4 minutes.'],
  'frozen veg': ['g', 'frozen veg mix', 80, 'Cook the frozen veg as per the pack.'],
  onions: ['', 'onion', 0.35, 'Slice the onion and soften it in the pan for 6–8 minutes before the sauce.'],
  sweetcorn: ['g', 'sweetcorn', 50, 'Stir in the drained sweetcorn for the last 3 minutes.'],
  tomatoes: ['g', 'cherry tomatoes', 60, 'Halve the tomatoes and add them for the last 3 minutes.'],
  coleslaw: ['g', 'coleslaw', 70, 'Serve with coleslaw on the side.'],
  salad: ['g', 'salad leaves', 30, 'Serve with a handful of salad leaves.'],
  corn: ['', 'corn on the cob', 0.5, 'Boil or grill the corn cobs 8 minutes.']
};
