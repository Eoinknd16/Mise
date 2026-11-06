import * as C from '/home/claude/mise/www/js/core.js';
import { ITEM } from '/home/claude/mise/www/js/data.js';
import fs from 'fs';
const terms = JSON.parse(fs.readFileSync('/tmp/ingdb/fo_terms.json'));
const grp1 = txt => /\b(fish|seafood|shellfish|mollusc\w*|crustacean\w*|shrimp|prawns?|crab|lobster|squid|octopus|clams?|mussels?|oysters?|scallops?)\b/.test(txt) ? 'fish'
  : /\b(cheese|milk|dairy|butter|cream|yogh?urt|curd)\b/.test(txt) ? 'dairy'
  : /\b(meat|sausages?|bacon|ham|beef|pork|lamb|mutton|chicken|turkey|duck|goose|poultry|veal|venison|game animal|swine|bovine|ovine|offal|organ meat|mammalian)\b/.test(txt) ? 'meat'
  : /\beggs?\b/.test(txt) ? 'egg'
  : /\b(herbs?|spices?|seasoning|condiment)\b/.test(txt) ? 'spice'
  : /\b(cereal|grains?|rice|wheat|flour|pasta|noodles?|bread)\b/.test(txt) ? 'grain'
  : /\b(beans?|legumes?|peas?|lentils?|pulses?|soy\w*)\b/.test(txt) ? 'legume'
  : /\b(nuts?|seeds?)\b/.test(txt) ? 'nut'
  : /\b(mushrooms?|fung\w*)\b/.test(txt) ? 'veg'
  : /\b(fruits?|berry|berries|citrus|melons?|pome\w*|drupes?)\b/.test(txt) ? 'fruit'
  : /\b(vegetables?|leaf|leaves|leafy|roots?|tubers?|bulbs?|stems?|spears?|florets?|brassica|onions?|squash|gourds?|cabbages?|lettuce|greens|head)\b/.test(txt) ? 'veg' : null;
const grpOf = (n, anc) => { for (const x of [n, ...anc]) { const g = grp1(x || ''); if (g) return g; } return null; };
const catGrp = it => ({ meat: 'meat', fish: 'fish', dairy: 'dairy', veg: 'veg', fruit: 'fruit' })[it.cat] || (it.id === 'eggs' ? 'egg' : 'pantry');
const ok = (g, it) => !g || g === catGrp(it) || (catGrp(it) === 'pantry' && ['spice', 'grain', 'legume', 'nut'].includes(g)) || (g === 'fruit' && it.cat === 'veg') || (g === 'veg' && it.cat === 'fruit') || (g === 'legume' && it.cat === 'veg');
const SKIP = /sandwich|soup|prepared|feed|for animal|filling|dish|meal|stubble|silage|hay|forage|baby|infant|tea|beverage|drink|candy|confection|snack|dessert|pie|cake|cookie|pastry/;
const FAMILY = [[/\b(pork cured|cured pork|processed pork|pancetta|lardo|guanciale)\b/, 'bacon'], [/\bgame animal|\bgame\b|venison|deer|elk|boar/, 'game'], [/\bpoultry|chicken\b/, 'chicken-thigh'], [/\b(duck|goose)\b/, 'duck-breast'],
  [/\b(shrimp|prawn|crustacean|lobster|crab|crayfish|langoustine)/, 'prawns'], [/\b(mollusc|mussel|clam|oyster|scallop|squid|octopus|cuttlefish|shellfish)/, 'prawns'], [/\b(tuna|bonito)\b/, 'tuna'], [/\b(mackerel|sardine|herring|anchov|pilchard|sprat|oily fish)/, 'mackerel'], [/\b(salmon|trout|char)\b/, 'salmon'], [/\bfish\b/, 'white-fish'],
  [/\b(blue cheese|blue-veined)/, 'blue-cheese'], [/\b(goat|sheep) (milk )?cheese|chevre/, 'goats-cheese'], [/\b(soft cheese|bloomy|camembert|brie)/, 'brie'], [/\b(fresh cheese|uncured cheese|curd cheese|mozzarella|burrata)/, 'mozzarella'], [/\b(brined cheese|feta)/, 'feta'], [/\bcheese\b/, 'cheddar'],
  [/\b(brassica|cruciferous|cabbage|kale|collard|choy|choi)\b/, 'cabbage'], [/\bstem or spear|\bspear\b/, 'asparagus'], [/\bfruit as|fruit used as vegetable|okra|eggplant|aubergine/, 'courgette'],
  [/\b(squash|gourd|pumpkin)/, 'butternut'], [/\b(leafy|leaf vegetable|greens|lettuce|chard|spinach)\b/, 'spinach'], [/\b(tuber|yam|taro|cassava)\b/, 'potato'], [/\b(root vegetable|\broot\b|radish|turnip|swede)/, 'carrot'], [/\b(bulb|allium|shallot|onion)/, 'onion'],
  [/\b(mushroom|fungus|fungi)/, 'mushroom'], [/\b(lentil)/, 'lentils'], [/\b(bean|legume|pulse|chickpea|pea)\b/, 'kidney-beans'], [/\b(nut|nuts)\b/, 'nuts'],
  [/\b(citrus|lime|yuzu|lemon)/, 'lemon'], [/\b(berry|berries)\b/, 'berries'], [/\b(pome|apple|quince|pear)\b/, 'apple'], [/\b(drupe|stone fruit|cherry|plum|apricot|peach)/, 'plums'], [/\b(tropical|mango|papaya|guava|passion)/, 'mango'],
  [/\b(cereal grain|grain|millet|quinoa|bulgur|freekeh|farro|barley|buckwheat|amaranth|teff|sorghum)\b/, 'couscous'], [/\b(rice)\b/, 'rice'], [/\b(herb)\b/, 'parsley'], [/\b(spice)\b/, 'cumin']];
const fam = txt => { for (const [re, id] of FAMILY) if (re.test(txt) && ITEM[id]) return id; return null; };
const NOSTAND = new Set(['dried-fruit', 'oil', 'cereal', 'grains', 'salad', 'mint-sauce', 'butter', 'honey', 'milk', 'salt', 'sugar', 'flour', 'water']);
const sing = w => w.replace(/(ies)$/, 'y').replace(/(?<=[^s])s$/, '');
const words = id => new Set([ITEM[id].n, ...ITEM[id].al].join(' ').toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean).map(sing));
const headOk = (txt, id) => { const w = txt.trim().split(/\s+/); return words(id).has(sing(w[w.length - 1])); };
const JUNK = /\b(cultivar|variety|family|product|flavou?ring|fruitbody|by-product|genus|species|group|subspecies|var|bun|relish|gravy|croquette|mincemeat|flatbread|bread|cake|cracker|chips|crisps|thymus|kidney|liver|heart|tongue|tripe|brain|blood|bone|skin|fat|tallow|lard|gelatin|broth|stock|jam|preserves?|marmalade|jelly|pizza|curry|paste|flour|bran|pulp|liquor|tree|bush|dressing|fines|meatball|spread|and|or|with|pectin|sauce|soup|pie|salad|dip|puree|syrup|frankfurter|tomalley|cluster|producing|brine|yeast|bunch|in)\b|^[a-z]+ [a-z]+(us|is|um|ae|ii|a)$/;
const out = [], stats = { exact: 0, mapped: 0, none: 0, mismatch: 0 };
const known = new Set(); for (const it of Object.values(ITEM)) { known.add(it.n.toLowerCase()); for (const a of it.al) known.add(a.toLowerCase()); }
for (const t of terms) {
  const anc = t.anc.filter(Boolean), atxt = anc.join(' | ');
  if (SKIP.test(t.n) || SKIP.test(anc.slice(0, 3).join(' '))) continue;
  const g = grpOf(t.n, anc);
  if (known.has(t.n)) { stats.exact++; continue; }
  const direct = C.matchIngredient(t.n);
  let sid = null, via = null;
  if (JUNK.test(t.n)) { stats.none++; continue; }
  if (direct && ok(g, ITEM[direct]) && !NOSTAND.has(direct) && headOk(t.n, direct)) { sid = direct; via = 'name'; }
  if (!sid) for (const a of anc) { if (!a || a.length < 3) continue; const m = C.matchIngredient(a); if (m && ok(g, ITEM[m]) && !NOSTAND.has(m) && headOk(a, m)) { sid = m; via = a; break; } }
  if (!sid) { const f = fam(t.n) || anc.slice(0, 3).map(fam).find(Boolean); if (f && ok(g, ITEM[f])) { sid = f; via = 'family'; } }
  if (!sid) { stats.none++; continue; }
  if (sid === 'baked-beans' && !/baked/.test(t.n)) sid = /\b(pod|green|runner|wax|string|snap|french|yardlong|long)\b/.test(t.n) ? 'green-beans' : 'kidney-beans';
  if (sid === 'cheddar' && /\bbleu|blue|roquefort|gorgonzola|stilton|cabrales\b/.test(t.n + ' ' + atxt)) sid = 'blue-cheese';
  if (/\bolives?\b/.test(t.n) && ITEM.olives) sid = 'olives';
  if (ITEM[sid].staple && !['spice', 'grain', 'legume'].includes(g)) { /* fine */ }
  stats.mapped++; out.push([t.n, sid, t.syn.filter(s => s !== t.n), via, g]);
}
console.log(stats, out.length);
fs.writeFileSync('/tmp/ingdb/mapped.json', JSON.stringify(out));
const pick = ['romanesco', 'broccolini', 'pancetta', 'paneer', 'okra', 'kohlrabi', 'lemongrass', 'tamarind', 'venison', 'plantain', 'kidney', 'ocean sole', 'adzuki bean', 'gouda cheese', 'morello cherry', 'abalone mushroom', 'artichoke', 'rock samphire', 'panela', 'limburger cheese', 'bass', 'chorizo', 'quinoa', 'celeriac', 'bok choy', 'pak choi', 'jackfruit', 'yuzu', 'monkfish', 'pheasant'];
for (const p of pick) { const r = out.find(x => x[0] === p); console.log(p.padEnd(18), r ? `${r[1]}  (via ${r[3]}, ${r[4]})` : '—'); }
