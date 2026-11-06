// Mise technique database: how each ingredient is prepped and cooked for each technique.
// Entry: [prep, time, heat, how you know it's done]. Times are for typical home portions.
// Techniques: sear (pan-fry), stirfry, roast, grill, airfry, braise, simmer, poach, steam, boil, bake, slowcook, raw.
// fit: 2 great, 1 fine, 0 poor (the engine avoids poor fits).

// Doneness and food-safety guidance (core temperatures where a probe helps)
export const SAFE = {
  poultry: 'cooked through: no pink, juices run clear, 75°C in the thickest part',
  mince: 'no pink left anywhere (70°C for 2 minutes for burgers and meatballs)',
  pork: 'juices run clear with no pink (70°C); rest a few minutes',
  beefWhole: 'to your liking: 50–52°C rare, 55–57°C medium-rare, 60–63°C medium, 70°C well done; rest before slicing',
  lambWhole: 'pink is fine: 60–63°C for pink, 70°C for well done; rest before carving',
  fish: 'opaque all the way through and flakes easily (63°C)',
  shellfish: 'pink, curled and firm all over',
  egg: 'whites fully set',
  ready: 'piping hot all the way through',
  veg: 'tender to the point of a knife',
};

// Proteins
export const PROTEIN = {
  'chicken-thigh': { tex: 'tender, forgiving', safe: 'poultry', fit: { sear: 2, roast: 2, airfry: 2, grill: 2, braise: 2, simmer: 2, stirfry: 2, slowcook: 2, steam: 0, raw: 0 },
    sear: ['skin-side down in a cold-to-medium pan so the fat renders', '7–8 min skin side, 5–6 min other side', 'medium-high', 'skin deep golden and crisp'],
    roast: ['bone-in or boneless, skin on, seasoned', '30–35 min (bone-in 40)', '200°C', 'juices clear, skin crisp'],
    airfry: ['boneless, lightly oiled', '18–20 min, turn halfway', '200°C', 'golden, 75°C inside'],
    stirfry: ['skinless, 2 cm strips', '5–6 min', 'very high', 'no pink inside'],
    simmer: ['skinless, chunks', '20–25 min in the sauce', 'gentle bubble', 'tender, no pink'] },
  'chicken-breast': { tex: 'lean, dries out if overcooked', safe: 'poultry', fit: { sear: 2, roast: 1, airfry: 2, grill: 2, poach: 2, stirfry: 2, simmer: 1, braise: 0, slowcook: 0 },
    sear: ['butterfly or bash to an even 2 cm', '5–6 min a side', 'medium-high', '75°C, still juicy; rest 3 min'],
    roast: ['whole breast, oiled and seasoned', '20–25 min', '200°C', '75°C, rest 5 min'],
    airfry: ['even thickness', '14–16 min, turn halfway', '190°C', '75°C inside'],
    poach: ['whole, in barely simmering stock', '12–15 min, then rest in the liquid', 'just below a simmer', 'firm and white through'],
    stirfry: ['thin strips across the grain', '4–5 min', 'very high', 'white all the way through'] },
  'chicken-drum': { tex: 'dark meat, bone-in', safe: 'poultry', fit: { roast: 2, airfry: 2, braise: 2, simmer: 2, grill: 2, sear: 1, stirfry: 0 },
    roast: ['slash 2–3 times, season well', '40–45 min', '200°C', 'juices clear at the bone'], airfry: ['oiled, slashed', '22–25 min, turning', '190°C', '75°C at the bone'] },
  'chicken-wings': { tex: 'skin and fat, needs time to crisp', safe: 'poultry', fit: { roast: 2, airfry: 2, grill: 1, braise: 1, sear: 0, stirfry: 0 },
    roast: ['pat dry, toss with a little baking powder and salt', '40–45 min, turn once', '220°C', 'crisp and browned'], airfry: ['dry and lightly oiled', '20–22 min, shake twice', '200°C', 'crisp skin'] },
  'whole-chicken': { tex: 'mix of lean and dark', safe: 'poultry', fit: { roast: 2, slowcook: 2, braise: 1, airfry: 1, sear: 0, stirfry: 0 },
    roast: ['dry the skin, rub with butter or oil and salt', '20 min per 500 g + 20 min', '200°C', 'leg juices clear, 75°C in the thigh'] },
  'turkey-breast': { tex: 'very lean', safe: 'poultry', fit: { sear: 2, roast: 2, airfry: 2, stirfry: 2, braise: 0 }, sear: ['steaks or escalopes, even thickness', '4–5 min a side', 'medium-high', '75°C, still juicy'] },
  'turkey-mince': { tex: 'lean mince', safe: 'mince', fit: { sear: 2, simmer: 2, stirfry: 1, bake: 2 }, sear: ['break up as it cooks', '8–10 min', 'high', 'no pink, any liquid cooked off'] },
  'duck-breast': { tex: 'thick fat layer, served pink', safe: 'lambWhole', fit: { sear: 2, roast: 1, airfry: 1, stirfry: 1 },
    sear: ['score the skin, start skin-down in a cold pan', '8–10 min skin side, 3–4 min flesh side', 'medium', 'crisp skin, 57–60°C for pink; rest 5 min'] },
  'beef-mince': { tex: 'mince', safe: 'mince', fit: { sear: 2, simmer: 2, bake: 2, stirfry: 1, grill: 2 }, sear: ['hot dry pan, in batches; don\'t stir for the first minute so it browns', '8–10 min', 'high', 'browned with crisp bits, no pink'], simmer: ['browned first', '20–40 min', 'gentle bubble', 'thick and glossy'] },
  steak: { tex: 'tender quick-cook cut', safe: 'beefWhole', fit: { sear: 2, grill: 2, stirfry: 2, airfry: 1, roast: 1, braise: 0, simmer: 0, slowcook: 0 },
    sear: ['room temperature, pat dry, salt well', '2–3 min a side for 2 cm (medium-rare)', 'smoking hot', 'see doneness; rest 5 min'], stirfry: ['thin strips across the grain', '1–2 min', 'smoking hot', 'just browned'] },
  'diced-beef': { tex: 'tough stewing cut, needs long slow cooking', safe: 'beefWhole', fit: { braise: 2, simmer: 2, slowcook: 2, sear: 0, stirfry: 0, roast: 0, airfry: 0 },
    braise: ['brown in batches first', '2–2½ hours', '160°C oven or gentle simmer', 'falls apart with a spoon'] },
  'beef-brisket': { tex: 'very tough, collagen-rich', safe: 'beefWhole', fit: { braise: 2, slowcook: 2, roast: 1, sear: 0, stirfry: 0 }, braise: ['whole, browned', '4–5 hours', '150–160°C', 'pulls apart'] },
  'beef-roast': { tex: 'lean roasting joint', safe: 'beefWhole', fit: { roast: 2, braise: 1, sear: 1, stirfry: 1, slowcook: 1 }, roast: ['seared all over first', '20 min per 500 g + 20 min (medium)', '190°C', 'see doneness; rest 20 min'] },
  burgers: { tex: 'minced patties', safe: 'mince', fit: { sear: 2, grill: 2, airfry: 2 }, sear: ['press a dimple in the middle', '4–5 min a side', 'medium-high', '70°C, no pink'] },
  'pork-chop': { tex: 'lean loin, dries out easily', safe: 'pork', fit: { sear: 2, grill: 2, roast: 2, airfry: 2, stirfry: 1, braise: 1, simmer: 0 },
    sear: ['snip the fat edge so it stays flat; salt 15 min ahead', '4–5 min a side', 'medium-high', '70°C, juicy, rest 3 min'], airfry: ['lightly oiled', '12–14 min, turn once', '200°C', '70°C inside'] },
  'pork-mince': { tex: 'mince', safe: 'mince', fit: { sear: 2, stirfry: 2, simmer: 2, bake: 1 }, sear: ['hot pan, let it crisp', '8–10 min', 'high', 'browned, no pink'] },
  'pork-fillet': { tex: 'very lean, tender', safe: 'pork', fit: { roast: 2, sear: 2, stirfry: 2, airfry: 2, braise: 0 }, roast: ['sear all over first', '15–20 min', '200°C', '70°C (63°C if you like it blush); rest 5 min'] },
  'pork-roast': { tex: 'shoulder or loin joint', safe: 'pork', fit: { roast: 2, slowcook: 2, braise: 2, sear: 1, stirfry: 1 }, roast: ['score and dry the skin, salt well', '25 min at 220°C, then 30 min per 500 g + 30', '220°C then 180°C', 'juices clear; crackling crisp'] },
  'pork-belly': { tex: 'very fatty, needs rendering', safe: 'pork', fit: { roast: 2, slowcook: 1, braise: 2, airfry: 2, sear: 1, stirfry: 0 }, roast: ['score and dry the skin', '2 hours at 160°C then 20 min at 220°C', 'low then high', 'soft meat, crackling puffed'] },
  'pork-ribs': { tex: 'tough, needs low and slow first', safe: 'pork', fit: { roast: 2, slowcook: 2, braise: 2, sear: 0, stirfry: 0 }, roast: ['wrapped in foil', '1½ hours at 160°C then glaze at 220°C 15 min', 'low then high', 'meat pulls from the bone'] },
  sausages: { tex: 'fatty, cased', safe: 'pork', fit: { sear: 2, roast: 2, airfry: 2, grill: 2, braise: 2, simmer: 2 }, sear: ['don\'t prick them', '12–15 min, turning', 'medium', 'browned all over, no pink'], roast: ['on a tray', '20–25 min', '200°C', 'browned, cooked through'] },
  bacon: { tex: 'cured, quick', safe: 'ready', fit: { sear: 2, airfry: 2, roast: 2, grill: 2 }, sear: ['cold pan for crispier rashers', '3–4 min a side', 'medium', 'crisp at the edges'] },
  gammon: { tex: 'cured joint or steak', safe: 'pork', fit: { roast: 2, simmer: 2, sear: 2, braise: 1 }, sear: ['snip the fat edge', '4 min a side', 'medium-high', 'piping hot'], roast: ['soak first if smoked', '20 min per 500 g + 20', '180°C', '70°C inside'] },
  chorizo: { tex: 'cured, releases red oil', safe: 'ready', fit: { sear: 2, simmer: 2, roast: 2, stirfry: 1 }, sear: ['slice or dice', '3–4 min', 'medium', 'oil released, edges crisp'] },
  lamb: { tex: 'diced lamb, needs slow cooking', safe: 'lambWhole', fit: { braise: 2, simmer: 2, slowcook: 2, sear: 0, stirfry: 0 }, braise: ['brown in batches', '1½–2 hours', '160°C', 'tender'] },
  'lamb-mince': { tex: 'mince, fatty', safe: 'mince', fit: { sear: 2, simmer: 2, bake: 2, grill: 2 }, sear: ['brown hard, drain extra fat', '8–10 min', 'high', 'browned, no pink'] },
  'lamb-chops': { tex: 'tender, served pink', safe: 'lambWhole', fit: { sear: 2, grill: 2, airfry: 2, roast: 1 }, sear: ['render the fat edge first, holding with tongs', '3–4 min a side', 'high', 'pink in the middle; rest 3 min'] },
  'lamb-leg': { tex: 'roasting joint', safe: 'lambWhole', fit: { roast: 2, slowcook: 2, braise: 2, sear: 1 }, roast: ['studded with garlic and rosemary', '25 min per 500 g + 25 (pink)', '190°C', 'see doneness; rest 20 min'] },
  salmon: { tex: 'oily fish, flakes easily', safe: 'fish', fit: { sear: 2, roast: 2, airfry: 2, poach: 2, steam: 2, grill: 2, simmer: 1, braise: 0, stirfry: 0 },
    sear: ['skin on, pat the skin very dry', '4 min skin side, 1–2 min flesh side', 'medium-high', 'just opaque, flakes'], roast: ['on a lined tray', '12–15 min', '200°C', 'flakes easily'], airfry: ['skin down', '8–10 min', '200°C', 'flakes'] },
  'white-fish': { tex: 'delicate', safe: 'fish', fit: { sear: 2, roast: 2, steam: 2, poach: 2, airfry: 1, simmer: 2, stirfry: 0, braise: 0 }, sear: ['dust in a little flour, don\'t move it', '3 min a side', 'medium-high', 'opaque, flakes'], roast: ['oiled, seasoned', '10–12 min', '200°C', 'flakes'] },
  prawns: { tex: 'quick, toughens if overcooked', safe: 'shellfish', fit: { sear: 2, stirfry: 2, simmer: 2, grill: 2, roast: 1 }, stirfry: ['peeled, patted dry', '2–3 min', 'very high', 'pink and curled'], simmer: ['add at the end', '3 min', 'gentle', 'pink all over'] },
  mackerel: { tex: 'oily, strong', safe: 'fish', fit: { sear: 2, grill: 2, roast: 2, raw: 1 }, sear: ['skin side down, slash the skin', '3 min skin side, 1 min flesh', 'high', 'skin crisp'] },
  tuna: { tex: 'tinned: ready to eat', safe: 'ready', fit: { raw: 2, bake: 2, simmer: 1 } },
  'smoked-salmon': { tex: 'ready to eat', safe: 'ready', fit: { raw: 2, simmer: 1 } },
  eggs: { tex: 'sets quickly', safe: 'egg', fit: { sear: 2, poach: 2, boil: 2, bake: 2, simmer: 1, stirfry: 2 },
    sear: ['hot oil for crispy edges, or butter for soft', '2–3 min', 'medium', 'whites set'], boil: ['from boiling water', '6½ min jammy, 9 min hard; into cold water after', 'rolling boil', 'as you like'], poach: ['fresh eggs, gently simmering water', '3 min', 'barely bubbling', 'whites set, yolk runny'] },
  halloumi: { tex: 'grilling cheese', safe: 'ready', fit: { sear: 2, grill: 2, airfry: 2, roast: 1 }, sear: ['1 cm slices, dry pan', '1–2 min a side', 'medium-high', 'golden stripes'] },
  tofu: { tex: 'firm, absorbs flavour', safe: 'ready', fit: { sear: 2, stirfry: 2, roast: 2, airfry: 2, simmer: 2 }, sear: ['pressed for 15 min, cubed, dusted in cornflour', '8–10 min, turning', 'medium-high', 'crisp on all sides'] },
  chickpeas: { tex: 'tinned: cooked', safe: 'ready', fit: { simmer: 2, roast: 2, airfry: 2, raw: 2, sear: 1 }, roast: ['drained and dried well', '25–30 min', '200°C', 'crunchy'] },
  lentils: { tex: 'dried red lentils break down', safe: 'ready', fit: { simmer: 2, boil: 2 }, simmer: ['rinsed', '20–25 min', 'gentle', 'soft and thick'] },
  'kidney-beans': { tex: 'tinned: cooked', safe: 'ready', fit: { simmer: 2, bake: 1, raw: 1 } },
  'butter-beans': { tex: 'tinned: creamy', safe: 'ready', fit: { simmer: 2, roast: 1, raw: 1 } },
  'cooked-chicken': { tex: 'ready, just reheat', safe: 'ready', fit: { stirfry: 2, simmer: 2, raw: 2, bake: 2, sear: 1 } },
  'cooked-pork': { tex: 'ready, just reheat', safe: 'ready', fit: { stirfry: 2, sear: 2, simmer: 1, bake: 1 } },
  'cooked-beef': { tex: 'ready, just reheat', safe: 'ready', fit: { stirfry: 2, sear: 1, simmer: 1, raw: 1 } },
  'cooked-lamb': { tex: 'ready, just reheat', safe: 'ready', fit: { sear: 2, simmer: 2, raw: 1 } },
  nuggets: { tex: 'frozen, breaded', safe: 'ready', fit: { roast: 2, airfry: 2 }, roast: ['from frozen', '18–20 min', '200°C', 'golden and piping hot'], airfry: ['from frozen', '10–12 min', '200°C', 'crisp, piping hot'] },
  'fish-fingers': { tex: 'frozen, breaded', safe: 'ready', fit: { roast: 2, airfry: 2, sear: 1 } },
  'frozen-fish': { tex: 'frozen breaded fillets', safe: 'fish', fit: { roast: 2, airfry: 2 }, roast: ['from frozen', '25 min', '200°C', 'golden, flakes'] },
  'fish-cakes': { tex: 'breaded', safe: 'fish', fit: { sear: 2, roast: 2, airfry: 2 } }
};

// Vegetables and starches: prep + times per technique
export const VEGTECH = {
  onion: { fit: { sear: 2, roast: 2, stirfry: 2, simmer: 2, braise: 2, raw: 1, steam: 0, airfry: 1 }, prep: 'halved and sliced, or diced', sear: '8–10 min until soft and golden; 25+ for deep caramelised', roast: '30–35 min in wedges at 200°C', stirfry: '2–3 min, still with bite' },
  'red-onion': { fit: { raw: 2, roast: 2, sear: 2, stirfry: 2, simmer: 1 }, prep: 'thin slices raw, wedges to roast', roast: '25–30 min at 200°C', raw: 'quick-pickle in lime or vinegar for 10 min to soften the bite' },
  carrot: { fit: { roast: 2, steam: 2, boil: 2, simmer: 2, stirfry: 2, raw: 2, braise: 2, airfry: 2 }, prep: 'batons or 2 cm chunks', roast: '30–35 min at 200°C', boil: '8–10 min', stirfry: '3–4 min, thin batons', steam: '8 min' },
  potato: { fit: { roast: 2, boil: 2, bake: 2, airfry: 2, sear: 2, simmer: 2, steam: 1, stirfry: 0, raw: 0 }, prep: 'chunks to roast or boil, wedges for chips', roast: 'parboil 10 min, shake, roast 45–50 min at 200°C', boil: '15–20 min until a knife slides in', airfry: '20–25 min at 200°C, shake twice', bake: 'jacket: 1 hour at 200°C or 8 min microwave + 15 min oven' },
  'sweet-potato': { fit: { roast: 2, bake: 2, airfry: 2, simmer: 2, boil: 2, sear: 1 }, prep: '2 cm chunks or wedges', roast: '25–30 min at 200°C', simmer: '15 min in the sauce', bake: '45 min whole at 200°C' },
  broccoli: { fit: { roast: 2, steam: 2, stirfry: 2, boil: 2, sear: 2, airfry: 2, simmer: 1, braise: 0, slowcook: 0 }, prep: 'florets, peel and slice the stalk', roast: '15–18 min at 200°C until charred at the edges', steam: '4–5 min', stirfry: '3–4 min with a splash of water', boil: '3–4 min' },
  cauliflower: { fit: { roast: 2, steam: 2, simmer: 2, boil: 2, airfry: 2, stirfry: 1 }, prep: 'florets', roast: '25–30 min at 200°C', simmer: '12–15 min in curry', steam: '6–8 min' },
  pepper: { fit: { roast: 2, stirfry: 2, sear: 2, simmer: 2, raw: 2, airfry: 2, grill: 2 }, prep: 'strips or chunks, seeds out', roast: '25 min at 200°C', stirfry: '3 min', sear: '5–6 min until blistered' },
  mushroom: { fit: { sear: 2, roast: 2, stirfry: 2, simmer: 2, braise: 2, airfry: 1, raw: 0 }, prep: 'sliced or quartered; wipe, don\'t wash', sear: 'hot pan, don\'t crowd, 6–8 min until golden; salt at the end', roast: '20 min at 200°C' },
  spinach: { fit: { sear: 2, simmer: 2, raw: 2, steam: 2, roast: 0, braise: 0 }, prep: 'as it is', sear: 'wilt for 1–2 min at the very end', simmer: 'stir in for the last minute' },
  kale: { fit: { sear: 2, simmer: 2, roast: 2, steam: 2, raw: 1 }, prep: 'stalks out, torn', sear: '3–4 min', roast: 'crisps: 10 min at 180°C' },
  courgette: { fit: { sear: 2, roast: 2, stirfry: 2, grill: 2, raw: 1, simmer: 1, airfry: 2 }, prep: 'half-moons or batons', sear: '5–6 min until golden; salt at the end', roast: '20 min at 200°C' },
  aubergine: { fit: { roast: 2, sear: 2, simmer: 2, braise: 2, grill: 2, airfry: 2, raw: 0, stirfry: 1 }, prep: 'chunks or slices', roast: '30–35 min at 200°C with plenty of oil until soft and creamy', sear: '10–12 min, generous oil' },
  cabbage: { fit: { sear: 2, stirfry: 2, raw: 2, braise: 2, roast: 2, steam: 2 }, prep: 'shredded, or wedges to roast', stirfry: '3–4 min', roast: 'wedges 25 min at 200°C', raw: 'finely shredded slaw' },
  leek: { fit: { sear: 2, simmer: 2, braise: 2, roast: 2, steam: 1, raw: 0 }, prep: 'sliced, washed well', sear: '8–10 min gently in butter until soft' },
  tomato: { fit: { raw: 2, roast: 2, simmer: 2, sear: 1, grill: 2 }, prep: 'chopped, or halved to roast', roast: '20–25 min at 200°C', simmer: '15–20 min to break down' },
  'cherry-tomato': { fit: { raw: 2, roast: 2, sear: 2, simmer: 2 }, prep: 'halved or whole', roast: '15 min at 200°C until blistered', sear: '3–4 min until bursting' },
  cucumber: { fit: { raw: 2, sear: 0, roast: 0, simmer: 0, stirfry: 0, braise: 0 }, prep: 'sliced or diced; salt to draw water for pickles', raw: 'quick-pickle with salt, sugar and vinegar for 10 min' },
  sweetcorn: { fit: { simmer: 2, sear: 2, raw: 1, roast: 2, stirfry: 2 }, prep: 'drained', sear: 'char in a dry pan 4–5 min' },
  peas: { fit: { simmer: 2, boil: 2, stirfry: 2, sear: 1, raw: 1 }, prep: 'from frozen', boil: '2–3 min', simmer: 'last 3 min' },
  'green-beans': { fit: { boil: 2, steam: 2, stirfry: 2, sear: 2, roast: 2, simmer: 1 }, prep: 'tops trimmed', boil: '4–5 min', stirfry: '4–5 min', roast: '15 min at 200°C' },
  'sugar-snap': { fit: { stirfry: 2, steam: 2, raw: 2, boil: 2 }, prep: 'as they are', stirfry: '2 min' },
  tenderstem: { fit: { roast: 2, sear: 2, grill: 2, steam: 2, boil: 2, stirfry: 2, airfry: 2, simmer: 1, braise: 0, slowcook: 0 }, prep: 'trim the ends; halve thick stems lengthways', roast: '12–15 min at 200°C until the tips char', sear: '4–5 min in a hot pan, then a splash of water and a lid for 1 min', steam: '3–4 min', boil: '2–3 min', stirfry: '3–4 min', done: 'bright green, stems tender to a knife but still snappy' },
  asparagus: { fit: { roast: 2, sear: 2, grill: 2, steam: 2, boil: 2, airfry: 2 }, prep: 'woody ends snapped off', roast: '10–12 min at 200°C', sear: '4–5 min', steam: '3–4 min' },
  butternut: { fit: { roast: 2, simmer: 2, braise: 2, airfry: 2, steam: 1 }, prep: 'peeled, seeds out, 2–3 cm chunks', roast: '30–35 min at 200°C', simmer: '15–20 min' },
  parsnip: { fit: { roast: 2, boil: 2, simmer: 2, airfry: 2 }, prep: 'quartered lengthways, woody core out', roast: '30–35 min at 200°C, drizzle honey for the last 10' },
  beetroot: { fit: { roast: 2, raw: 2, boil: 2 }, prep: 'cooked: slice; raw: grate or roast whole in foil', roast: 'raw whole in foil: 50–60 min at 200°C' },
  celery: { fit: { simmer: 2, braise: 2, raw: 2, stirfry: 1, roast: 1 }, prep: 'diced as a base, or sliced raw for crunch' },
  fennel: { fit: { roast: 2, braise: 2, raw: 2, sear: 2 }, prep: 'thin slices raw, wedges to roast', roast: '30 min at 200°C', raw: 'shaved very thin with lemon' },
  'frozen-veg': { fit: { boil: 2, stirfry: 2, simmer: 2, steam: 2, roast: 1 }, prep: 'from frozen', boil: '3–4 min', stirfry: '4 min' },
  avocado: { fit: { raw: 2, sear: 0, roast: 0, simmer: 0 }, prep: 'sliced or smashed with salt and lime' },
  salad: { fit: { raw: 2 }, prep: 'washed, dried, dressed at the last minute' },
  'spring-onion': { fit: { raw: 2, stirfry: 2, sear: 1 }, prep: 'sliced thin; whites into the pan, greens on top' },
  chilli: { fit: { raw: 2, sear: 2, stirfry: 2, simmer: 2 }, prep: 'seeds out for less heat' },
  'corn-cob': { fit: { boil: 2, roast: 2, grill: 2, airfry: 2 }, boil: '5–6 min', roast: '20 min at 200°C' },
  rice: { fit: { boil: 2, simmer: 2 }, prep: 'rinsed until the water runs clear', boil: 'absorption: 1 part rice to 1½ water, lid on, 12 min, rest 5 min' },
  basmati: { fit: { boil: 2 }, prep: 'rinsed and soaked 15 min', boil: '1:1½ water, 10 min lid on, rest 5' },
  'risotto-rice': { fit: { simmer: 2 }, prep: 'not rinsed', simmer: 'hot stock a ladle at a time, 18–20 min, stirring' },
  pasta: { fit: { boil: 2, bake: 2 }, prep: 'plenty of well-salted water', boil: '1 min less than the packet; save a mug of the water for the sauce' },
  spaghetti: { fit: { boil: 2 }, prep: 'well-salted water', boil: 'packet time minus 1 min; finish in the sauce' },
  noodles: { fit: { boil: 2, stirfry: 2 }, prep: 'cooked, rinsed in cold water so they don\'t stick', boil: '3–4 min' },
  couscous: { fit: { raw: 2 }, prep: 'equal volume of boiling stock, covered 5 min, fluffed with a fork' },
  gnocchi: { fit: { boil: 2, sear: 2, bake: 2, airfry: 2 }, boil: 'until they float, 2–3 min', sear: 'straight from the pack in butter, 6–8 min until golden' }
};

// Map Mise's cooking methods onto the core techniques used above
export const METHOD_TECH = { panfry: 'sear', stirfry: 'stirfry', friedrice: 'stirfry', traybake: 'roast', roast: 'roast', sticky: 'roast', bake: 'bake', pie: 'bake', flatbread: 'bake', loaded: 'bake', simmer: 'simmer', curry: 'simmer', pasta: 'simmer', soup: 'simmer', noodlesoup: 'simmer', risotto: 'simmer', shakshuka: 'simmer', braise: 'braise', pulled: 'braise', hash: 'sear', frittata: 'sear', quesadilla: 'sear', burgers: 'sear', wraps: 'sear', bowl: 'sear', salad: 'raw' };
export function techOf(method, gear) { if (gear === 'af') return 'airfry'; if (gear === 'sc') return 'slowcook'; return METHOD_TECH[method] || 'sear'; }
// how well an ingredient suits a technique: 2 great, 1 fine, 0 poor, null unknown
export function fitOf(id, tech) {
  id = sd(id);
  const p = PROTEIN[id] || VEGTECH[id]; if (!p || !p.fit) return null;
  if (tech === 'slowcook' && p.fit.slowcook == null) return p.fit.braise ?? null;
  if (tech === 'airfry' && p.fit.airfry == null) return p.fit.roast ?? null;
  return p.fit[tech] ?? null;
}
// world ingredients ("w:<stand-in>:<name>") are cooked like their stand-in
const sd = id => { const m = /^w:([a-z0-9-]+):/.exec(id || ''); return m ? m[1] : id; };
export const safeOf = id => { id = sd(id); return PROTEIN[id] ? SAFE[PROTEIN[id].safe] : null; };
// one line of guidance for an ingredient in a technique
export function noteOf(id, tech) {
  id = sd(id);
  const p = PROTEIN[id];
  if (p) { const t = p[tech] || (tech === 'airfry' ? p.roast : null); return t ? { prep: t[0], time: t[1], heat: t[2], done: t[3] } : { done: SAFE[p.safe] }; }
  const v = VEGTECH[id]; if (!v) return null;
  return { prep: v.prep, time: v[tech] || null };
}
export function bestTechniques(id) {
  id = sd(id);
  const p = PROTEIN[id] || VEGTECH[id]; if (!p || !p.fit) return [];
  return Object.entries(p.fit).filter(([, f]) => f === 2).map(([t]) => t);
}
export const TECH_NAMES = { sear: 'pan-fry', stirfry: 'stir-fry', roast: 'roast', grill: 'grill', airfry: 'air fry', braise: 'braise', simmer: 'simmer', poach: 'poach', steam: 'steam', boil: 'boil', bake: 'bake', slowcook: 'slow cook', raw: 'raw' };
