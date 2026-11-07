// Mise flavour profiles, written for Mise from culinary knowledge (no third-party data).
// Each ingredient gets: the aroma families it carries (1 faint, 2 clear, 3 dominant), its tastes,
// and its weight (1 delicate, 2 medium, 3 bold). Ingredients that share aroma families tend to work
// together; tastes that contrast (sweet against hot, rich against sharp) balance each other.
export const NOTES = {
  R: 'roasted, toasty', Ca: 'caramel', Sv: 'savoury, oniony', Sl: 'sulphury, cabbagey', Gr: 'fresh, green', Ve: 'vegetal', Ci: 'citrusy',
  Pi: 'piney, herbal', Mn: 'minty, cooling', Fr: 'fruity', Be: 'berry', Tr: 'tropical', St: 'stone fruit, almond', Fl: 'floral',
  Cr: 'creamy, buttery', La: 'tangy, lactic', Fu: 'funky, cheesy', Um: 'savoury umami', Me: 'meaty', Ma: 'of the sea', Ea: 'earthy',
  Mu: 'mushroomy', Sp: 'warm spice', Pe: 'peppery, pungent', Sm: 'smoky', An: 'aniseed', Nu: 'nutty', Wo: 'woody, vanilla', Mt: 'malty'
};
// one-word versions for "both have ... notes"
export const SHORT = { R: 'roasted', Ca: 'caramel', Sv: 'savoury', Sl: 'sulphury', Gr: 'green', Ve: 'vegetal', Ci: 'citrus', Pi: 'herbal', Mn: 'minty', Fr: 'fruity', Be: 'berry', Tr: 'tropical', St: 'stone-fruit', Fl: 'floral', Cr: 'creamy', La: 'tangy', Fu: 'funky', Um: 'umami', Me: 'meaty', Ma: 'sea', Ea: 'earthy', Mu: 'mushroomy', Sp: 'warm-spice', Pe: 'peppery', Sm: 'smoky', An: 'aniseed', Nu: 'nutty', Wo: 'woody', Mt: 'malty' };
// Tastes: s sweet, a sour, l salty, b bitter, f rich/fatty, h hot, u umami
const SRC = `
pork-chop pork-fillet pork-roast pork-mince pork-ribs cooked-pork | Me3 R2 Cr1 Ca1 Nu1 | f | 2
pork-belly | Me3 R2 Cr3 Ca1 | f | 2
gammon ham | Me2 Sm2 Ca1 | l | 2
deli-meat | Me2 Fu2 Sp1 Pe1 Sm1 | lf | 3
bacon | Sm3 Me2 R2 Ca1 | lfu | 3
chorizo | Sm3 Sp2 Pe1 Me2 Fu1 | lfh | 3
sausages | Me2 Sp1 Pi1 Pe1 | lf | 2
hot-dogs | Me2 Sm2 | lf | 2
pudding | Me2 Sp2 Ea2 Nu1 | lf | 3
steak beef-roast diced-beef beef-brisket cooked-beef burgers frozen-burgers beef-mince | Me3 R2 Um2 Fu1 | fu | 3
lamb lamb-leg lamb-chops cooked-lamb lamb-mince | Me3 R2 Fu2 Pi1 | f | 3
chicken-thigh chicken-drum chicken-wings whole-chicken cooked-chicken | Me2 R2 Cr1 Sv1 | f | 1
chicken-breast nuggets turkey-breast turkey-mince | Me2 R1 Cr1 | | 1
duck-breast | Me3 R2 Fr1 Cr2 Sp1 | f | 3
game | Me3 Ea2 Pi1 Be1 | f | 3
salmon salmon-tin | Cr2 Ma1 Fr1 Gr1 R1 | f | 2
smoked-salmon | Ma1 Sm2 Cr2 | lf | 2
mackerel | Ma2 Gr1 Fu1 Sm1 | f | 3
white-fish frozen-fish fish-cakes | Ma1 Cr1 Gr1 | | 1
fish-fingers | Ma1 R2 Cr1 | | 1
prawns | Ma2 Ca2 Nu1 Sv1 | s | 1
tuna | Me1 Ma1 Um2 | l | 2
anchovies | Um3 Ma2 Fu2 | lu | 3
eggs | Sv1 Cr2 Sl1 | f | 1
halloumi | La2 Cr1 Fu1 | l | 2
tofu | Gr1 Cr1 Nu1 | | 1
chickpeas | Ea2 Nu2 R1 | | 1
hummus | Nu2 Ea1 Ci1 R1 | f | 2
lentils | Ea2 Ve1 Nu1 | | 1
kidney-beans butter-beans | Ea1 Cr1 Nu1 | | 1
baked-beans | Ca2 Fr1 Um1 | sa | 2
parmesan | Fu3 Fr1 Um3 Nu2 R1 | lu | 3
cheddar cheese-slices | Fu2 Cr1 Um1 Nu1 La1 | lf | 2
blue-cheese | Fu3 Ea2 Cr1 Mu1 | lf | 3
brie | Cr3 Mu2 Fu1 Nu1 | f | 2
feta | La2 Fu1 Cr1 | la | 2
goats-cheese | Fu2 La2 Ea1 Cr1 | af | 2
mozzarella | Cr2 La1 | f | 1
cottage-cheese | La2 Cr1 | a | 1
cream double-cream cream-cheese cream-spray | Cr3 La1 | f | 1
creme-fraiche sour-cream | Cr2 La2 | af | 1
butter | Cr3 Nu1 Ca1 | f | 1
milk | Cr2 | | 1
oat-milk | Cr1 Nu1 Mt1 | | 1
buttermilk | La3 Cr1 | a | 1
yogurt | Cr2 La3 | a | 1
fruit-yogurt | Cr2 La2 Be1 | sa | 1
custard ice-cream | Cr3 Wo2 Ca1 | sf | 1
coconut-milk | Cr3 Tr2 Nu1 | fs | 2
strawberries | Be3 Fr2 Ca1 Gr1 Fl1 | sa | 1
raspberries | Be3 Fl2 Fr1 | sa | 2
blueberries berries frozen-fruit | Be3 Fr1 Fl1 Sp1 | sa | 1
apple | Fr3 Gr2 Fl1 | sa | 1
pears | Fr3 Fl2 Gr1 | s | 1
banana | Tr2 Fr2 Sp1 Wo1 | s | 2
pineapple | Tr3 Fr2 Ca1 Fu1 | sa | 2
mango | Tr3 Pi2 Fr1 Cr1 Ci1 | s | 2
orange | Ci3 Fr1 Fl1 | sa | 2
lemon | Ci3 Pi1 Fl1 | a | 2
lime | Ci3 Pi1 Gr1 | a | 2
kiwi | Gr2 Fr2 Tr1 | a | 1
melon | Gr2 Fr2 Fl1 Tr1 | s | 1
grapes | Fr2 Fl2 Be1 | s | 1
pomegranate | Fr2 Be2 | sa | 1
rhubarb | Gr2 Fr1 Be1 | a | 2
dates dried-fruit | Ca3 Fr1 Wo1 | s | 2
plums | St2 Fr2 Ca1 Sp1 | sa | 2
tinned-fruit | St1 Tr1 Fr2 | s | 1
avocado | Gr1 Cr3 Nu1 | f | 1
onion red-onion onion-granules | Sv3 Sl1 Ca1 | s | 2
garlic garlic-granules | Sv3 Sl2 Pe1 | | 3
spring-onion | Sv2 Gr2 Pe1 | | 1
leek | Sv2 Gr1 Cr1 | s | 1
cabbage | Sl2 Ve2 Pe1 | b | 2
broccoli tenderstem | Sl2 Ve2 Gr2 Nu1 | b | 2
cauliflower | Sl1 Nu2 Ve1 Cr1 | | 1
kale | Ve2 Ea1 Sl1 Gr1 | b | 2
asparagus | Ve2 Gr2 Sl1 Nu1 | | 2
potato hash-browns gnocchi | Ea2 Cr1 Nu1 | | 1
chips | Ea1 R2 Cr1 | l | 1
sweet-potato butternut squash | Ca2 Nu1 Ea1 Fl1 | s | 1
carrot | Fl2 Ca1 Ea1 Pi1 | s | 1
parsnip | Ca2 Ea1 Sp1 Nu1 | s | 2
beetroot | Ea3 Ca1 Be1 | s | 2
mushroom | Mu3 Ea2 Um2 | u | 2
pepper | Ve2 Gr2 Fr1 Ca1 | s | 1
tomato cherry-tomato chopped-tomatoes | Gr2 Fr2 Ca1 Um2 | sau | 2
passata pasta-sauce | Fr2 Um2 Ca1 | sau | 2
tomato-puree | Um3 Ca2 Fr1 | su | 3
cucumber | Gr3 Fl1 Mn1 | | 1
peas sugar-snap frozen-veg | Gr2 Ve1 Ca1 | s | 1
sweetcorn corn-cob | Ca2 Cr1 Ve1 Nu1 | s | 1
courgette green-beans | Gr2 Ve1 | | 1
spinach | Ve2 Ea1 Gr1 Um1 | b | 1
aubergine | Ea1 Ve1 Cr1 | b | 1
fennel | An3 Gr2 Ci1 | s | 2
celery | Gr2 Ve1 Pe1 Pi1 | l | 1
radish | Pe2 Gr1 Sl1 | b | 1
salad salad-veg | Gr2 Pe1 | b | 1
coleslaw | Cr2 La1 Gr1 Sl1 | af | 1
olives | Fr1 Gr1 Fu1 Ea1 | lb | 2
pickles gherkins | Gr1 Sv1 La1 | a | 2
capers | Pe1 Fl1 Gr1 | la | 2
kimchi | Fu2 Sv2 Pe1 La2 | ahu | 3
chilli | Gr2 Fr1 | h | 2
jalapenos | Gr2 Ve1 La1 | ha | 2
basil | An2 Ci1 Sp1 Gr1 Fl1 Mn1 | | 2
dried-basil | An1 Sp1 Pi1 | | 1
coriander | Gr2 Ci2 Fl1 | | 2
mint | Mn3 Gr1 | | 2
rosemary dried-rosemary | Pi3 Wo1 Sp1 | b | 3
sage | Pi2 Ea1 Sp1 Mn1 | b | 3
thyme dried-thyme | Pi2 Sp2 Ea1 | | 2
dill | Gr2 An1 Ci1 | | 2
parsley | Gr3 Pi1 Pe1 | | 1
tarragon | An3 Gr1 | | 2
lemongrass | Ci3 Fl1 Gr1 | | 2
ginger | Ci2 Sp1 Pe2 | h | 2
ground-ginger | Sp2 Pe1 Ci1 | h | 2
oregano mixed-herbs | Pi2 Pe1 Ea1 Sp1 | | 2
bay-leaves | Pi2 Sp1 Fl1 | | 1
coffee | R3 Ca2 Sm1 Ea1 Nu1 | b | 3
cocoa dark-chocolate | R3 Ca1 Fr1 Ea1 Wo1 | b | 3
chocolate choc-spread hot-choc | R2 Ca2 Cr2 Wo1 | sf | 2
vanilla | Wo3 Ca1 Fl1 Cr1 | s | 1
cinnamon | Sp3 Wo2 Ca1 | s | 2
star-anise fennel-seeds | An3 Sp1 Wo1 | | 3
cardamom | Pi2 Ci2 Fl2 Mn1 | | 2
ground-coriander | Ci2 Fl2 Wo1 Nu1 | | 1
cumin | Ea2 Sp1 Sm1 Nu1 | | 2
paprika | Sm2 Ca1 Fr1 | | 2
chipotle | Sm3 Fr1 Ea1 | h | 3
chilli-powder chilli-flakes cayenne | Sm1 Fr1 Pe1 | h | 2
black-pepper | Pe3 Pi1 Wo1 | h | 2
nutmeg | Sp3 Wo1 Pi1 | | 2
curry-powder garam-masala | Sp3 Ea1 Ci1 Pe1 | h | 3
turmeric | Ea2 Pe1 | b | 2
five-spice | An2 Sp2 Pe1 | | 3
cajun-spice fajita-mix peri-spice | Sm2 Pe2 Sp1 Sv1 | hl | 3
honey | Ca2 Fl3 Fr1 | s | 2
syrup | Ca3 Wo1 Sm1 | s | 2
sugar icing-sugar | Ca1 | s | 1
brown-sugar | Ca3 Wo1 | s | 1
jam | Be2 Fr2 Ca1 | s | 1
soy-sauce | Um3 R2 Ca1 Fu1 | lu | 3
miso | Um3 R1 Nu1 Fu2 | lu | 3
fish-sauce | Um3 Ma2 Fu2 | lu | 3
oyster-sauce | Um3 Ma1 Ca2 | lsu | 3
worcestershire | Um2 Sp1 Sv1 Fu1 | la | 3
mustard | Pe3 Sv1 | h | 3
tahini | R3 Nu3 | bf | 2
peanut-butter | R3 Nu3 Cr1 | f | 2
nuts | R2 Nu3 Cr1 | f | 1
sesame-oil | R3 Nu3 | f | 3
olive-oil | Gr2 Fr1 Pe1 | f | 1
vinegar | Fr1 Fu1 | a | 2
bbq-sauce | Sm2 Ca3 Sp1 | sa | 3
sweet-chilli | Ca2 Fr1 | sh | 2
sriracha hot-sauce | Sv1 Fr1 La1 | ha | 3
curry-paste | Sp2 Ci2 Pe1 Gr1 | h | 3
pesto | An1 Gr2 Fu1 Nu2 | f | 2
ketchup | Ca2 Fr1 Um1 | sa | 2
brown-sauce | Fr1 Sp1 Fu1 Ca1 | sa | 2
mayo salad-cream | Cr3 La1 | f | 1
mint-sauce | Mn3 La1 | as | 2
gravy stock | Me2 Um2 R1 Sv1 | lu | 2
salsa | Gr1 Fr1 Sv1 | ah | 2
cooking-sauce | Fr1 Um1 Sv1 Ca1 | sa | 2
stout beer | Mt3 R2 Ca1 | b | 2
wine | Fr2 Fu1 Wo1 | a | 2
bread baguette buns pitta wraps crumpets soda-bread crackers breadcrumbs pizza-dough | R2 Mt1 Nu1 | | 1
naan | R2 Mt1 Cr1 | | 1
garlic-bread | R2 Sv2 Cr2 | f | 2
croissants puff-pastry | Cr2 R2 | f | 1
scones cake biscuits | Ca2 Cr1 R1 Wo1 | s | 1
rice risotto-rice | Fl1 Nu1 | | 1
basmati | Fl2 Nu2 | | 1
pasta spaghetti fresh-pasta lasagne noodles couscous grains | Nu1 Mt1 | | 1
oats cereal cereal-bars | Nu2 Mt2 Ca1 | | 1
popcorn | R2 Ca1 Cr1 | | 1
crisps | R2 Sv1 | l | 1
`;
export const A = {};
for (const line of SRC.trim().split('\n')) {
  const [ids, notes, taste, w] = line.split('|').map(x => x.trim());
  const n = Object.fromEntries(notes.split(/\s+/).filter(Boolean).map(x => [x.replace(/\d/, ''), +(x.match(/\d/) || [2])[0]]));
  for (const id of ids.split(/\s+/)) A[id] = { n, t: taste || '', w: +w || 2 };
}
