#!/usr/bin/env python3
"""Build Mise's chef knowledge base from commercially usable open data.

Sources (all allow commercial use):
  - USDA Food and Nutrient Database for Dietary Studies (FNDDS) 2.0 - public domain (US Government work).
    6,940 foods; the mixed dishes are broken down into ingredients with gram weights. We use these
    compositions as evidence of which ingredients cooks combine, and in what proportions.
  - USDA National Nutrient Database for Standard Reference, Release 28 - public domain. 8,789 foods.
  - Canadian Nutrient File (Health Canada) - Open Government Licence - Canada. Attribution required:
    "Contains information licensed under the Open Government Licence - Canada."
Aroma families, techniques and recipe grammar are Mise's own authored data (js/flavour.js, js/techniques.js, js/chef.js).

Usage: python3 tools/build_chefdb.py FNDDS_DIR SR28_DIR CNF_DIR
  FNDDS_DIR: folder with MainFoodDesc.txt, FnddsSRLink.txt, FoodWeights.txt, FoodPortionDesc.txt, NutrientValues.txt
  SR28_DIR:  folder with ABBREV.txt and FOOD_DES.txt
  CNF_DIR:   folder with CNF.FOOD.NAME.csv and CNF_Nutrients/NUTRIENT AMOUNT.csv, NUTRIENT NAME.csv
"""
import sys, os, re, json, math, csv, collections

FNDDS, SR, CNF = sys.argv[1], sys.argv[2], sys.argv[3]
OUT = os.path.join(os.path.dirname(__file__), '..', 'www', 'data')
os.makedirs(OUT, exist_ok=True)

def caret(path):
    rows = open(path, encoding='latin-1').read().splitlines()
    return [[x.strip('~') for x in r.split('^')] for r in rows[1:] if r.strip()]

# ---------- canonical ingredient keys from USDA descriptions ----------
KEYS = [
    ('chicken', r'^CHICK|CHICKEN|BROILERS OR FRYERS'), ('turkey', r'^TURKEY'), ('duck', r'^DUCK'),
    ('bacon', r'BACON'), ('ham', r'\bHAM\b'), ('sausage', r'SAUSAGE|FRANKFURTER|BRATWURST|CHORIZO|PEPPERONI|SALAMI'),
    ('beef_mince', r'GROUND BEEF|BEEF,GROUND|BEEF, GROUND'), ('beef', r'^BEEF'), ('pork', r'^PORK'), ('lamb', r'^LAMB'),
    ('salmon', r'SALMON'), ('tuna', r'TUNA'), ('shrimp', r'SHRIMP|PRAWN'), ('fish', r'^FISH|COD|HADDOCK|POLLOCK|TILAPIA|FLOUNDER|SOLE|CATFISH'),
    ('egg', r'^EGG'), ('cheddar', r'CHEESE,CHEDDAR|CHEDDAR'), ('parmesan', r'PARMESAN'), ('mozzarella', r'MOZZARELLA'), ('feta', r'FETA'),
    ('cheese', r'^CHEESE|CHEESE,'), ('cream_cheese', r'CREAM CHEESE|CHEESE,CREAM'), ('sour_cream', r'SOUR CREAM|CREAM,SOUR'), ('cream', r'^CREAM'), ('yogurt', r'YOGURT'),
    ('milk', r'^MILK'), ('butter', r'^BUTTER'), ('olive_oil', r'OIL,OLIVE'), ('oil', r'^OIL|SHORTENING|MARGARINE|LARD'),
    ('flour', r'FLR|FLOUR|CORNSTARCH'), ('rice', r'^RICE'), ('pasta', r'MACARONI|SPAGHETTI|PASTA|NOODLES,EGG'), ('noodle', r'NOODLE'),
    ('breadcrumbs', r'BREAD CRUMBS'), ('tortilla', r'TORTILLA'), ('bread', r'^BREAD|ROLLS'),
    ('sweet_potato', r'SWEET POTATO'), ('potato', r'POTATO'), ('onion', r'^ONIONS|SCALLION|SHALLOT'), ('garlic', r'GARLIC'),
    ('tomato_paste', r'TOMATO PASTE|TOMATO PUREE'), ('tomato', r'TOMATO'), ('pepper', r'PEPPERS,SWT|PEPPERS, SWEET'), ('chilli', r'PEPPERS,HOT|JALAPENO|CHILI PEPPER|PEPPERS,JALAPENO|CHILI,'),
    ('carrot', r'CARROT'), ('celery', r'CELERY'), ('mushroom', r'MUSHROOM'), ('spinach', r'SPINACH'), ('broccoli', r'BROCCOLI'), ('cauliflower', r'CAULIFLOWER'),
    ('cabbage', r'CABBAGE|SAUERKRAUT'), ('lettuce', r'LETTUCE'), ('cucumber', r'CUCUMBER|PICKLE'), ('courgette', r'ZUCCHINI|SQUASH,SUMMER'), ('aubergine', r'EGGPLANT'),
    ('green_beans', r'BEANS,SNAP|SNAP BEANS|GREEN BEANS'), ('peas', r'^PEAS'), ('sweetcorn', r'^CORN,SWEET|CORN,SWT|CORN, SWEET'), ('chickpeas', r'CHICKPEA|GARBANZO'),
    ('beans', r'BEANS,(KIDNEY|BLACK|PINTO|NAVY|GREAT|RED)|REFRIED|BEANS,BAKED'), ('lentils', r'LENTIL'), ('avocado', r'AVOCADO'),
    ('lemon', r'LEMON'), ('lime', r'LIME'), ('orange', r'ORANGE'), ('apple', r'^APPLE'), ('pineapple', r'PINEAPPLE'), ('mango', r'MANGO'), ('raisin', r'RAISIN'),
    ('coconut', r'COCONUT'), ('soy_sauce', r'SOY SAU'), ('worcestershire', r'WORCESTERSHIRE'), ('vinegar', r'VINEGAR'), ('mustard', r'MUSTARD'),
    ('ketchup', r'CATSUP|KETCHUP'), ('mayonnaise', r'MAYONNAISE|SALAD DRSNG|SALAD DRESSING'), ('honey', r'^HONEY'), ('sugar', r'SUGARS|SUGAR,|SYRUP|MOLASSES'),
    ('curry', r'CURRY'), ('cumin', r'CUMIN'), ('paprika', r'PAPRIKA'), ('chilli_powder', r'CHILI POWDER|CHILI PDR|PEPPER,RED OR CAYENNE|CAYENNE'), ('oregano', r'OREGANO'),
    ('basil', r'BASIL'), ('parsley', r'PARSLEY'), ('coriander', r'CORIANDER|CILANTRO'), ('thyme', r'THYME'), ('rosemary', r'ROSEMARY'), ('ginger', r'GINGER'),
    ('cinnamon', r'CINNAMON'), ('nutmeg', r'NUTMEG'), ('stock', r'BROTH|BOUILLON|STOCK|SOUP,'), ('wine', r'WINE'), ('peanut_butter', r'PEANUT BUTTER'),
    ('nuts', r'ALMOND|WALNUT|PECAN|CASHEW|PEANUT|HAZELNUT'), ('sesame', r'SESAME'), ('salsa', r'SALSA'), ('bbq_sauce', r'BARBECUE'), ('gravy', r'GRAVY'),
    ('olives', r'OLIVE'), ('capers', r'CAPERS'), ('dill', r'DILL'), ('mint', r'SPEARMINT|PEPPERMINT|MINT'), ('sage', r'SAGE'), ('bay', r'BAY LEAF'),
]
SKIPK = {'salt', 'water'}
KRX = [(k, re.compile(p)) for k, p in KEYS]
def key_of(desc):
    d = desc.upper()
    if re.search(r'^SALT|^WATER|BAKING (PDR|POWDER|SODA)|LEAVENING|YEAST|VANILLA|GELATIN', d): return None
    for k, rx in KRX:
        if rx.search(d): return k
    return None

# ---------- FNDDS dishes -> pairing evidence and proportions ----------
desc = {r[0]: r[3] for r in caret(os.path.join(FNDDS, 'MainFoodDesc.txt'))}
comp = collections.defaultdict(list)
for r in caret(os.path.join(FNDDS, 'FnddsSRLink.txt')):
    try: comp[r[0]].append((r[5], float(r[11] or 0)))
    except ValueError: pass
dishes = []
SWEETD = re.compile(r'cake|cookie|pie,|pie |pudding|frosting|candy|ice cream|muffin|doughnut|pastry|brownie|dessert|sweet roll|bread, |cereal|pancake|waffle|biscuit|cracker|smoothie|shake|beverage|juice|drink|baby|infant|formula|syrup|jam|jelly|gelatin', re.I)
for code, parts in comp.items():
    name = desc.get(code, '')
    if SWEETD.search(name): continue
    keys = collections.defaultdict(float)
    for d, g in parts:
        k = key_of(d)
        if k: keys[k] += g
    tot = sum(keys.values())
    if len(keys) < 3 or tot <= 0: continue
    if keys.get('sugar', 0) / tot > 0.08: continue
    dishes.append((code, name, {k: round(g / tot, 4) for k, g in keys.items()}))
# near-duplicate dishes (with/without sauce variants) shouldn't count many times over
seen = set(); uniq = []
for code, name, ks in dishes:
    sig = tuple(sorted(ks))
    if sig in seen: continue
    seen.add(sig); uniq.append((code, name, ks))
N = len(uniq)
cnt = collections.Counter(); pair = collections.Counter(); share = collections.defaultdict(list)
for _, _, ks in uniq:
    l = sorted(ks)
    for a in l: cnt[a] += 1; share[a].append(ks[a])
    for i in range(len(l)):
        for j in range(i + 1, len(l)): pair[(l[i], l[j])] += 1
pmi = collections.defaultdict(dict)
for (a, b), k in pair.items():
    if k < 2: continue
    pab = k / N; pa = cnt[a] / N; pb = cnt[b] / N
    v = math.log(pab / (pa * pb)) / -math.log(pab)
    pmi[a][b] = pmi[b][a] = round(v, 3)
med = lambda xs: sorted(xs)[len(xs) // 2]
keys_out = {k: {'n': cnt[k], 'share': round(med(share[k]), 3), 'p': {b: v for b, v in sorted(pmi[k].items(), key=lambda x: -x[1]) if v > -0.2}} for k in cnt}
print('FNDDS dishes used', N, 'ingredient keys', len(keys_out), 'pairs', sum(len(v['p']) for v in keys_out.values()) // 2)

# typical serving weights of whole dishes (grams) from FNDDS portions, for sanity checks
portion = {}
try:
    pdesc = {r[0]: r[3] for r in caret(os.path.join(FNDDS, 'FoodPortionDesc.txt'))}
    for r in caret(os.path.join(FNDDS, 'FoodWeights.txt')):
        code, pcode, w = r[0], r[3], r[6] if len(r) > 6 else ''
        dname = pdesc.get(pcode, '').lower()
        if code in desc and w and ('1 cup' in dname or 'serving' in dname):
            portion.setdefault(code, float(w))
except Exception as e:
    print('portions skipped', e)

db = {'v': 2, 'sources': ['USDA FNDDS 2.0 (public domain)', 'USDA SR28 (public domain)', 'Canadian Nutrient File, Health Canada (Open Government Licence - Canada)'],
      'dishes': N, 'keys': keys_out,
      'examples': {k: [name for _, name, ks in uniq if k in ks][:6] for k in keys_out}}
json.dump(db, open(os.path.join(OUT, 'chefdb.json'), 'w'), separators=(',', ':'))
print('chefdb.json', os.path.getsize(os.path.join(OUT, 'chefdb.json')) // 1024, 'KB')

# ---------- nutrition: SR28 + CNF + FNDDS ----------
KEEP = ['kcal', 'protein', 'fat', 'carb', 'fiber', 'sugar', 'sodium', 'satfat', 'water', 'calcium', 'iron', 'potassium', 'vitc']
foods = []
F = ['ndb', 'sd', 'water', 'kcal', 'protein', 'fat', 'ash', 'carb', 'fiber', 'sugar', 'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium', 'vitc', 'thiamin', 'riboflavin', 'niacin', 'panto', 'b6', 'folate_tot', 'folic', 'food_folate', 'folate_dfe', 'choline', 'b12', 'vita_iu', 'vita_rae', 'retinol', 'acarot', 'bcarot', 'bcrypt', 'lycopene', 'lutzea', 'vite', 'vitd_mcg', 'vitd_iu', 'vitk', 'satfat', 'monofat', 'polyfat', 'chol', 'gm1', 'gm1d', 'gm2', 'gm2d', 'refuse']
long = {}
for line in open(os.path.join(SR, 'FOOD_DES.txt'), encoding='latin-1'):
    p = [x.strip('~') for x in line.rstrip('\r\n').split('^')]
    long[p[0]] = (p[2], p[1])
groups = {'0100': 'dairy', '0200': 'spice', '0300': 'baby', '0400': 'fat', '0500': 'poultry', '0600': 'soup', '0700': 'sausage', '0800': 'cereal', '0900': 'fruit', '1000': 'pork', '1100': 'veg', '1200': 'nut', '1300': 'beef', '1400': 'drink', '1500': 'fish', '1600': 'legume', '1700': 'lamb', '1800': 'baked', '1900': 'sweet', '2000': 'grain', '2100': 'fastfood', '2200': 'meal', '2500': 'snack', '3500': 'native', '3600': 'restaurant'}
def num(x):
    try: return round(float(x), 2)
    except (ValueError, TypeError): return None
for line in open(os.path.join(SR, 'ABBREV.txt'), encoding='latin-1'):
    p = [x.strip('~') for x in line.rstrip('\r\n').split('^')]
    if len(p) < 40: continue
    d = dict(zip(F, p)); ld, grp = long.get(d['ndb'], (d['sd'], ''))
    foods.append([d['ndb'], ld, groups.get(grp, 'other'), 'us'] + [num(d[k]) for k in KEEP])
nsr = len(foods)
# CNF: nutrient ids -> our columns
CNFID = {'208': 'kcal', '203': 'protein', '204': 'fat', '205': 'carb', '291': 'fiber', '269': 'sugar', '307': 'sodium', '606': 'satfat', '255': 'water', '301': 'calcium', '303': 'iron', '306': 'potassium', '401': 'vitc'}
names = {}
with open(os.path.join(CNF, 'CNF.FOOD.NAME.csv'), encoding='latin-1') as f:
    for r in csv.DictReader(f): names[r['FoodID']] = r['FoodDescription']
idmap = {}
with open(os.path.join(CNF, 'CNF_Nutrients', 'NUTRIENT NAME.csv'), encoding='latin-1') as f:
    for r in csv.DictReader(f):
        code = (r.get('NutrientCode') or '').strip()
        if code in CNFID: idmap[r['NutrientID']] = CNFID[code]
vals = collections.defaultdict(dict)
with open(os.path.join(CNF, 'CNF_Nutrients', 'NUTRIENT AMOUNT.csv'), encoding='latin-1') as f:
    for r in csv.DictReader(f):
        c = idmap.get(r['NutrientID'])
        if c: vals[r['FoodID']][c] = num(r['NutrientValue'])
for fid, nm in names.items():
    v = vals.get(fid)
    if not v or v.get('kcal') is None: continue
    foods.append(['ca' + fid, nm, 'other', 'ca'] + [v.get(k) for k in KEEP])
ncnf = len(foods) - nsr
# FNDDS survey foods (as eaten)
FN = {'208': 'kcal', '203': 'protein', '204': 'fat', '205': 'carb', '291': 'fiber', '269': 'sugar', '307': 'sodium', '606': 'satfat', '255': 'water', '301': 'calcium', '303': 'iron', '306': 'potassium', '401': 'vitc'}
fv = collections.defaultdict(dict)
for r in caret(os.path.join(FNDDS, 'NutrientValues.txt')):
    if len(r) > 4 and r[1] in FN: fv[r[0]][FN[r[1]]] = num(r[4])
for code, nm in desc.items():
    v = fv.get(code)
    if not v or v.get('kcal') is None: continue
    foods.append(['fn' + code, nm, 'dish', 'us'] + [v.get(k) for k in KEEP])
print('nutrition foods: SR28', nsr, 'CNF', ncnf, 'FNDDS', len(foods) - nsr - ncnf, 'total', len(foods))
json.dump({'v': 2, 'source': 'USDA SR28 + FNDDS (public domain); Canadian Nutrient File (Open Government Licence - Canada)', 'cols': ['ndb', 'name', 'group', 'origin'] + KEEP, 'per': '100 g', 'foods': foods},
          open(os.path.join(OUT, 'nutrition.json'), 'w'), separators=(',', ':'))
print('nutrition.json', os.path.getsize(os.path.join(OUT, 'nutrition.json')) // 1024, 'KB')
