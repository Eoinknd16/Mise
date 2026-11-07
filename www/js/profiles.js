// Ingredient profiles, written for Mise. A world ingredient cooks like its stand-in, but it isn't the
// same thing: mussels aren't prawns, quinoa isn't couscous, cassava must never be eaten raw.
// Each rule matches an ingredient's name and says what's different about it:
//   tip   - one line Mise adds to the method the first time the ingredient appears
//   prep  - how to get it ready (shown in the Ingredient Explorer)
//   t     - extra minutes it needs over its stand-in
//   only  - the ways of cooking it suits (anything else is skipped)
//   not   - ways of cooking it doesn't suit
//   off   - Mise recognises it but won't build dinners around it (a garnish, raw-only, or specialist)
//   taste - a few words on what it's like
const FAST = 'panfry stirfry friedrice pasta bowl wraps salad noodlesoup risotto quesadilla flatbread thai';
const SLOW = 'braise pulled stew curry indian simmer pie cottagepie chickenpie roast roastdinner soup bake';
const WET = 'pasta noodlesoup soup curry indian thai simmer risotto stew fishpie friedrice';
const RULES = [
  // ---- Shellfish and squid
  [/mussel|clam|cockle|vongole|razor/, { sid: 'prawns', only: WET.replace(' fishpie', ''), prep: 'Scrub, and pull off any beards. Throw away any that are cracked, or open and won\'t close when tapped.', tip: 'Add them with a splash of liquid, lid on, for 4–5 minutes until they open; throw away any that stay shut.', taste: 'Sweet, briny and rich; the juices they release are half the flavour.' }],
  [/scallop/, { sid: 'prawns', only: 'panfry pasta bowl stirfry risotto salad', prep: 'Pull off the small tough muscle on the side and pat completely dry.', tip: 'Sear them in a very hot pan for 90 seconds a side, no longer, until golden outside and just opaque.', taste: 'Sweet and delicate; overcooked they go rubbery.' }],
  [/squid|calamari|cuttlefish/, { not: 'traybake bake roast sticky pie fishpie', prep: 'Clean, open out the tubes and score the inside in a criss-cross.', tip: 'Cook squid either very fast (2 minutes in a smoking pan) or very slowly (45 minutes or more); anything in between turns it rubbery.', taste: 'Mild and sweet with a bit of chew.' }],
  [/octopus/, { only: 'simmer pasta salad bowl stew', t: 60, prep: 'Most octopus is sold cleaned and frozen; freezing tenderises it.', tip: 'Simmer the octopus whole for about an hour, until a knife slides into the thickest part, then cut and char it.', taste: 'Meaty, sweet and tender when cooked long enough.' }],
  [/lobster|langoust|crayfish|crawfish|crab|dublin bay|norway lobster/, { sid: 'prawns', only: 'pasta risotto salad bowl friedrice noodlesoup soup wraps', prep: 'Cooked meat is ready to use. Raw shellfish: boil in well-salted water, about 12 minutes per 500 g, then crack and pick out the meat.', tip: 'Cooked crab or lobster meat only needs warming through; stir it in at the end.', taste: 'Sweet and rich; keep other flavours light.' }],
  [/oyster(?! mushroom)|abalone|sea urchin|uni\b|caviar|roe\b|ikura|tarako|sujiko/, { off: true, prep: 'Best eaten as it is: oysters raw on ice with lemon, roe spooned over at the end.', taste: 'Briny and rich.' }],
  [/ackee|akee/, { off: true, prep: 'Use tinned ackee, or fresh pods that have opened naturally on the tree; unripe ackee is poisonous. Fold it in gently at the end, as in ackee and saltfish.', taste: 'Soft, buttery and mild, like scrambled egg.' }],
  [/surimi|crab stick|kamaboko/, { only: 'salad wraps bowl friedrice noodlesoup', tip: 'It\'s already cooked: add it at the end just to warm through.', taste: 'Mild, sweet and soft.' }],
  // ---- Fish
  [/monkfish/, { prep: 'Pull off the thin grey membrane; it shrinks and goes tough when cooked.', tip: 'Monkfish holds together like meat: roast or pan-fry it 10–12 minutes, until it just turns opaque.', taste: 'Firm, sweet and meaty.' }],
  [/skate|ray wing/, { only: 'panfry bowl', tip: 'Pan-fry the wing 4 minutes a side in foaming butter; the flesh slides off the bones in strands.', taste: 'Sweet, delicate strands. Great with brown butter and capers.' }],
  [/salt cod|bacalao|bacalhau|stockfish/, { prep: 'Soak in plenty of cold water for 24–48 hours in the fridge, changing the water 3 or 4 times.', tip: 'Make sure the salt cod has been soaked for a day or two first, or the dish will be far too salty.', taste: 'Firm and savoury once soaked.' }],
  [/smoked haddock|finnan|kipper|smoked mackerel|kippered/, { not: 'stirfry', tip: 'It\'s already cured, so it only needs gentle heat: poach it in milk for 5–6 minutes, or flake it in near the end.', taste: 'Smoky and salty; lovely with potatoes, eggs and cream.' }],
  [/sardine|sprat|pilchard|anchov(y|ies) fresh|fresh anchov|herring(?! roe)/, { only: 'panfry traybake bowl salad pasta flatbread', prep: 'Ask the fishmonger to gut them; scale under running water.', tip: 'Small oily fish cook in minutes: grill or pan-fry 2–3 minutes a side until the skin blisters.', taste: 'Rich, oily and full-flavoured; sharp sides like lemon and tomato suit them.' }],
  [/tuna steak|swordfish|marlin|yellowfin|bluefin/, { only: 'panfry bowl salad stirfry', tip: 'Sear it hot and fast, about 1 minute a side, and leave it pink in the middle; cooked through it goes dry.', taste: 'Meaty and firm.' }],
  [/sea bass|seabass|sea bream|bream|dorade|red mullet|snapper/, { prep: 'Score the skin a few times so it stays flat.', tip: 'Fry the fillets skin-side down for 3–4 minutes, pressing them flat at first, then turn for just 30 seconds.', taste: 'Delicate and sweet with crisp skin.' }],
  [/trout/, { tip: 'Trout is thin and cooks fast: 3 minutes skin-side down, 1 more on the other side.', taste: 'Like a milder, lighter salmon.' }],
  [/tilapia|basa|pangasius|catfish/, { taste: 'Very mild, so it takes bold seasoning well.' }],
  // ---- Poultry, game and offal
  [/chicken liver|livers?\b/, { sid: 'chicken-thigh chicken-breast game duck-breast', only: 'panfry pasta bowl salad wraps', prep: 'Trim off any sinew and green bits (they\'re bitter) and pat dry.', tip: 'Fry the livers hot and fast, 2–3 minutes a side, until browned outside and just cooked through with no raw red in the middle; any longer and they go grainy.', taste: 'Rich, soft and iron-y.' }],
  [/heart/, { sid: 'chicken-thigh chicken-breast game beef-brisket lamb steak', only: 'panfry stirfry bowl wraps', prep: 'Trim any fat and tubes from the top.', tip: 'Cook hearts quickly over high heat; they toughen if cooked to well done.', taste: 'Lean and meaty, like steak.' }],
  [/quail|pigeon|partridge|grouse|woodcock|ptarmigan|snipe/, { not: SLOW.replace(/roast |roastdinner /g, ''), tip: 'Small birds cook quickly: roast at 220°C (200°C fan) for 12–20 minutes, then rest for 5. Pigeon is best left pink.', taste: 'Rich and gamey.' }],
  [/guinea fowl/, { tip: 'Guinea fowl is leaner than chicken: cover the breast with bacon or baste it often so it doesn\'t dry out.', taste: 'Like a more flavourful chicken.' }],
  [/turkey (thigh|leg|drumstick)/, { t: 20, tip: 'Turkey legs are bigger than chicken thighs: give them about 20 minutes longer, until 75°C in the thickest part.', taste: 'Dark, rich meat.' }],
  [/hare|rabbit/, { only: 'braise stew pie simmer curry indian', t: 60, tip: 'Rabbit and hare are lean: cook them slowly in liquid for 1½–2 hours, or they go tough.', taste: 'Lean and gamey.' }],
  [/goat|mutton/, { only: 'braise pulled stew curry indian simmer', t: 60, tip: 'Goat and mutton are firm: give it at least 2 hours of slow cooking, until it falls apart.', taste: 'Like a deeper, leaner lamb.' }],
  [/shank|neck of lamb|lamb neck|lamb breast|foreshank|ossobuco|osso buco/, { only: 'braise stew pulled curry indian simmer', tip: 'This cut needs long, slow cooking (2½–3 hours) to go tender.', taste: 'Rich and gelatinous after slow cooking.' }],
  [/skirt|flank|bavette|hanger/, { only: 'panfry stirfry wraps bowl salad quesadilla', tip: 'Cuts like this are best cooked hot and fast and never past medium, and always sliced across the grain, or they\'ll be chewy.', taste: 'Big beefy flavour with a loose grain.' }],
  [/venison|deer|elk|reindeer/, { tip: 'Venison is very lean: steaks are best pink and rested; diced venison needs slow cooking.', taste: 'Rich, dark and gamey with almost no fat.' }],
  [/jackfruit/, { only: 'pulled curry wraps bowl stew', prep: 'Use young green jackfruit in water or brine. Drain, rinse and squeeze it dry, and cut out the hard core pieces.', tip: 'Jackfruit only needs 25–30 minutes in the sauce, then shred it with two forks.', taste: 'Neutral and stringy; it takes on whatever sauce it\'s cooked in.' }],
  // ---- Grains, rice and pulses
  [/giant couscous|pearl couscous|moghrabieh|fregola/, { t: 6, tip: 'Giant couscous is boiled like pasta: 8–10 minutes in salted water, then drain.', taste: 'Chewy little pearls.' }],
  [/quinoa/, { t: 12, prep: 'Rinse well in a sieve; the coating can taste soapy.', tip: 'Simmer quinoa in twice its volume of water for 15 minutes, then leave it covered off the heat for 5.', taste: 'Nutty with a little pop.' }],
  [/buckwheat|kasha/, { sid: 'couscous grains rice', t: 10, tip: 'Simmer buckwheat in twice its volume of water for 12–15 minutes.', taste: 'Earthy and nutty.' }],
  [/freekeh|farro|spelt|barley|kamut|khorasan|groats|wheat\b|\brye\b/, { sid: 'couscous grains rice', t: 30, tip: 'This grain needs 25–40 minutes of simmering in plenty of salted water until tender but chewy; drain well.', taste: 'Nutty and chewy.' }],
  [/millet|sorghum|fonio|teff|amaranth/, { sid: 'couscous grains rice', t: 15, tip: 'Toast the grain in a dry pan for 2 minutes, then simmer in 2½ times its volume of water for 15–20 minutes.', taste: 'Mild and slightly sweet.' }],
  [/polenta|cornmeal|grits|farina|semolina/, { tip: 'Whisk it into simmering salted water (4 times its volume), then stir until thick: about 5 minutes for quick-cook, 40 for traditional. Finish with butter and cheese.', taste: 'Soft, creamy and comforting.' }],
  [/wild rice/, { t: 30, tip: 'Wild rice takes 40–45 minutes to simmer until the grains split.', taste: 'Nutty and chewy.' }],
  [/brown rice|red rice|black rice/, { t: 15, tip: 'Wholegrain rice takes about 30 minutes; keep the lid on.', taste: 'Nuttier and chewier than white.' }],
  [/sticky rice|glutinous rice/, { only: 'bowl stirfry curry thai', t: 20, prep: 'Soak for at least 4 hours, or overnight.', tip: 'Steam the soaked sticky rice for about 25 minutes rather than boiling it.', taste: 'Sweet and very sticky.' }],
  [/sushi rice|short.grain/, { prep: 'Rinse until the water runs clear.', taste: 'Sticky and slightly sweet.' }],
  [/beans?\b|chickpea|cowpea|pinto|borlotti|cannellini|flageolet|adzuki|mung|black turtle/, { sid: 'kidney-beans butter-beans chickpeas', prep: 'Tinned beans are ready: just drain and rinse. Dried beans need an overnight soak, then 10 minutes at a hard boil and 1–1½ hours of simmering until soft.', tip: 'If your beans are dried, soak them overnight and boil them hard for 10 minutes before simmering; undercooked dried kidney beans are poisonous.', taste: 'Creamy and filling.' }],
  [/broad bean|fava/, { prep: 'Blanch for 2 minutes, cool, then slip off the pale skins for the brightest green beans.', taste: 'Sweet and green.' }],
  [/split pea|chana dal|toor dal|urad/, { t: 25, tip: 'Split peas and chana dal hold their shape longer than red lentils: allow 40–50 minutes of simmering.', taste: 'Earthy and thick.' }],
  // ---- Veg
  [/cassava|yuca|manioc/, { not: 'salad stirfry', t: 10, prep: 'Peel off the waxy skin, cut out the woody core and cut into chunks.', tip: 'Cassava must be fully cooked, never eaten raw: boil it for 20–25 minutes until tender before frying or roasting.', taste: 'Starchy and slightly sweet.' }],
  [/taro|eddo/, { not: 'salad stirfry', t: 5, prep: 'Wear gloves to peel; raw taro can make your hands itch.', tip: 'Taro must be fully cooked: boil it 15–20 minutes until tender.', taste: 'Starchy, nutty and creamy.' }],
  [/\byam\b/, { prep: 'Peel and cut into chunks; keep in water until cooking.', tip: 'Boil yam for about 20 minutes until tender.', taste: 'Dry, starchy and filling.' }],
  [/jerusalem artichoke|sunchoke/, { prep: 'Scrub well; no need to peel.', tip: 'Roast Jerusalem artichokes for 35–40 minutes at 200°C until golden and soft inside.', taste: 'Nutty and sweet (and known for causing wind).' }],
  [/okra|ladies fingers|bhindi/, { not: 'salad pasta', tip: 'Cook okra hot and dry for crispness, or long in a curry or stew, where it thickens the sauce.', taste: 'Grassy; sticky inside.' }],
  [/artichoke/, { prep: 'Jarred or frozen hearts are the easy way; fresh ones need trimming down to the heart.', taste: 'Nutty and slightly sweet.' }],
  [/spaghetti squash/, { only: 'bake pasta bowl roast', tip: 'Roast the squash halved for 40 minutes at 200°C, then scrape out the strands with a fork.', taste: 'Mild, with noodle-like strands.' }],
  [/kabocha|delicata|acorn squash|kuri|pumpkin|hubbard|buttercup/, { prep: 'Kabocha, delicata and kuri skin softens when roasted, so no need to peel.', taste: 'Sweet and dense.' }],
  [/marrow/, { sid: 'courgette butternut', prep: 'Peel if large, scoop out the seeds, salt for 15 minutes and pat dry; it\'s very watery.', taste: 'Mild and soft.' }],
  [/samphire/, { only: 'panfry pasta salad bowl stirfry', tip: 'Samphire is naturally salty, so don\'t add salt: blanch it for 1–2 minutes, or toss it in butter at the end.', taste: 'Salty, crisp and of the sea.' }],
  [/bamboo/, { prep: 'Tinned shoots are ready; rinse them. Fresh shoots must be peeled and boiled for at least 20 minutes.', taste: 'Crunchy and mild.' }],
  [/padron|shishito/, { only: 'panfry bowl salad', tip: 'Blister them whole in a very hot pan with oil for 4–5 minutes, then sprinkle with flaky salt.', taste: 'Mostly mild; the odd one is hot.' }],
  [/poblano|anaheim/, { prep: 'Char the skin over a flame or under the grill, steam in a covered bowl for 10 minutes, then peel.', taste: 'Mild, smoky and green.' }],
  [/pak choi|pak choy|bok choy|choy sum|tatsoi|gai lan/, { only: 'stirfry noodlesoup bowl friedrice thai panfry soup', prep: 'Halve or quarter lengthways and rinse out any grit.', tip: 'Give the stalks 2 minutes, then add the leaves for the last minute.', taste: 'Juicy stalks, soft leaves; mild.' }],
  [/chard/, { prep: 'Strip the leaves from the stalks; slice the stalks separately.', tip: 'Cook the sliced chard stalks for 4 minutes before adding the leaves.', taste: 'Earthy, like a sturdier spinach.' }],
  [/brussels|sprouts?\b/, { sid: 'cabbage', not: 'salad wraps', prep: 'Trim the base and pull off any tired outer leaves; halve them.', tip: 'Roast halved sprouts at 200°C for 25 minutes, or shred them and stir-fry for 4 minutes; boiled whole, they go sulphurous.', taste: 'Nutty and sweet when browned.' }],
  [/napa|chinese (cabbage|leaf)/, { only: 'stirfry noodlesoup bowl friedrice soup salad', taste: 'Sweet, crisp and juicy.' }],
  [/kohlrabi/, { prep: 'Peel thickly; the outer layer is woody.', taste: 'Like a sweet, crisp broccoli stalk. Great raw in slaws.' }],
  [/daikon|mooli/, { prep: 'Peel; slice thin or cut into chunks.', tip: 'Daikon is good raw and crunchy, or simmered in broth for 20 minutes until translucent.', taste: 'Peppery raw, sweet when cooked.' }],
  [/swede|rutabaga|turnip/, { prep: 'Peel thickly and cut into even chunks.', taste: 'Sweet and peppery; classic mashed with carrot and butter.' }],
  [/celeriac|celery root/, { prep: 'Cut off the knobbly skin with a knife and drop the pieces into lemon water.', taste: 'Like a nutty, mellow celery. Great in mash and soup.' }],
  [/salsify|parsley root/, { prep: 'Scrub and peel, then keep in lemon water so they don\'t brown.', taste: 'Earthy and slightly sweet.' }],
  [/lettuce|romaine|little gem|cos\b|iceberg|lollo|batavia|butterhead|frisee|endive|radicchio|chicory|witloof|watercress|arugula|rocket|mizuna|cornsalad|lambs lettuce/, { only: 'salad wraps bowl burgers flatbread quesadilla', prep: 'Wash in cold water and spin or pat completely dry.', taste: 'Fresh and crisp; the bitter ones (radicchio, endive) love a sweet dressing.' }],
  [/sorrel/, { only: 'salad soup pasta risotto bowl', tip: 'Sorrel turns olive green and melts in seconds; stir it in at the very end.', taste: 'Sharp and lemony.' }],
  // ---- Mushrooms
  [/morel/, { prep: 'Halve and rinse well; they hide grit. Dried morels: soak 20 minutes and keep the liquid.', tip: 'Morels must always be cooked, never eaten raw.', taste: 'Deep, nutty and earthy.' }],
  [/porcini|cep|bolete/, { prep: 'Fresh: brush clean. Dried: soak in hot water for 20 minutes and use the strained liquid too.', taste: 'Intensely savoury and woody.' }],
  [/truffle/, { off: true, prep: 'Brush clean and shave thinly over hot food just before eating.', taste: 'Heady and earthy; a little goes a long way.' }],
  [/enoki/, { tip: 'Enoki need only a minute of heat; add them right at the end.', taste: 'Mild with a crunchy bite.' }],
  [/shiitake/, { prep: 'Pull off the stalks; they\'re tough (save them for stock).', taste: 'Meaty and savoury.' }],
  [/chanterelle|girolle/, { prep: 'Brush clean rather than washing.', tip: 'Fry chanterelles in a dry pan first to drive off their water, then add butter.', taste: 'Fruity and peppery.' }],
  [/king oyster/, { prep: 'Slice the stems into thick coins and score them.', taste: 'Meaty, like scallops.' }],
  // ---- Spices that aren't cumin
  [/clove|cassia|allspice|mace/, { sid: 'cumin nutmeg cinnamon curry-powder', not: 'stirfry salad wraps quesadilla flatbread panfry', taste: 'Warm and sweet; use sparingly.' }],
  [/saffron/, { prep: 'Crumble a pinch into 2 tablespoons of warm water and leave for 10 minutes.', taste: 'Floral, honeyed and golden.' }],
  [/mustard seed|nigella|fenugreek seed|cumin seed|caraway/, { tip: 'Fry the whole seeds in hot oil until they pop and smell toasty before adding anything else.', taste: 'Nutty and aromatic when toasted.' }],
];
const cache = new Map();
export function profileOf(name, sid) {
  const k = String(name || '').toLowerCase(); if (!k) return null;
  const ck = k + '|' + (sid || ''); if (cache.has(ck)) return cache.get(ck);
  let p = null; for (const [rx, v] of RULES) if (rx.test(k) && (!v.sid || !sid || v.sid.split(' ').includes(sid))) { p = { ...v }; break; }
  if (p) { if (p.only) p.only = new Set(p.only.split(' ')); if (p.not) p.not = new Set(p.not.split(' ')); }
  cache.set(ck, p); return p;
}
// Does this way of cooking suit the ingredient?
export function suits(p, method) {
  if (!p) return true; if (p.off) return false; if (!method) return true;
  if (p.only && !p.only.has(method)) return false;
  if (p.not && p.not.has(method)) return false;
  return true;
}
