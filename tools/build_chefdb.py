#!/usr/bin/env python3
"""Build Mise's chef knowledge base (www/data/chefdb.json, www/data/nutrition.json).

Sources (fetched into a scratch folder, not committed):
  - Flavor network data from Ahn, Ahnert, Bagrow & Barabasi, "Flavor network and the principles of food pairing",
    Scientific Reports 1:196 (2011), via github.com/lingcheng99/Flavor-Network (GPL-3.0):
    1,530 ingredients, 1,107 flavour compounds, 56,498 recipes across 11 cuisines.
  - USDA National Nutrient Database for Standard Reference, Release 28 (public domain), via npm fda-nutrient-database:
    8,790 foods. Cite: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central / SR28.
Usage: python3 tools/build_chefdb.py /path/to/Flavor-Network/data /path/to/fda-nutrient-database/data
"""
import sys, os, re, json, math, collections

FN, SR = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(__file__), '..', 'www', 'data')
os.makedirs(OUT, exist_ok=True)

def tsv(p):
    for line in open(p, encoding='utf-8'):
        if line.startswith('#') or not line.strip(): continue
        yield line.rstrip('\n').split('\t')

ingr = {int(r[0]): (r[1], r[2]) for r in tsv(os.path.join(FN, 'ingr_info.tsv'))}
comp = {int(r[0]): r[1] for r in tsv(os.path.join(FN, 'comp_info.tsv'))}
links = collections.defaultdict(set)
for r in tsv(os.path.join(FN, 'ingr_comp.tsv')): links[int(r[0])].add(int(r[1]))

# ---- aroma family of each compound, from its chemistry (functional groups) ----
RULES = [
    ('Me', r'furanthiol|furfurylthiol|methyl-3-furanthiol|tetrahydrofuranthiol|thiamin|beefy|meaty'),
    ('An', r'anethole|estragole|anis|chavicol|fenchone'),
    ('Sp', r'eugenol|cinnamal|cinnamyl|cinnamic|safrole|myristicin|cuminal|carvacrol|thymol|zingerone|gingerol|piperine|clove'),
    ('Sm', r'guaiacol|methoxyphenol|dimethoxyphenol|cresol|syringol|xylenol|^phenol$|ethylphenol|vanill|smok'),
    ('Ea', r'geosmin|methoxy.*pyrazine|pyrazine.*methoxy|octen-3-ol|octen-3-one|borneol|patchoul|vetiver|earth'),
    ('R',  r'pyrazin|pyrrol|pyridin|thiazolin|acetylthiazol|furfuryl_mercaptan|roast|benzaldehyde|maltol_isobutyrate'),
    ('Ca', r'furanone|maltol|furaneol|sotolon|cyclotene|cyclopent-2-en-1-one|hydroxy.*cyclopenten|furfural|caramel|homofuraneol'),
    ('Sv', r'thio|sulf|mercapt|thiazol|thiophen|dithi|isothiocyanate|trithi|methional'),
    ('Cr', r'lacton|butanedione|diacetyl|acetoin|hydroxy-2-butanone|pentanedione|dienal|decadienal|nonadienal'),
    ('Fl', r'linalo|geraniol|nerol\b|^nerol|ionone|damascon|damascen|phenylethyl|phenethyl|rose|jasm|phenylacetaldehyde|citronellol|farnesol|nerolidol|hydroxycitronellal'),
    ('Ci', r'limonene|citral|geranial|neral\b|citronellal|terpinene|valencene|nootkat|^octanal|^decanal|^nonanal|dodecanal|sinensal'),
    ('Pi', r'pinene|camphor|cineol|eucalyptol|menth|pulegone|carvone|myrcene|terpineol|sabinene|phellandrene|thujone|bornyl|fench|caryophyllene|humulene|cadinene|copaene|elemene'),
    ('Gr', r'hexenal|hexenol|hexen-1-ol|hexen-1-yl|hexenyl|^hexanal|hexyl_alcohol|heptanal|nonenal|leaf|cucumber|cis-3-hex|trans-2-hex'),
    ('Fu', r'butyric_acid|butanoic_acid|valeric_acid|pentanoic_acid|hexanoic_acid|caproic|octanoic_acid|isovaleric|methylbutyric_acid|propionic_acid|^2-heptanone|^2-nonanone|^2-undecanone|^2-pentanone|skatole|indole|trimethylamine'),
    ('Fr', r'(ethyl|methyl|propyl|butyl|amyl|hexyl|octyl|isoamyl|isobutyl|benzyl|geranyl|linalyl|citronellyl|neryl|allyl)_[a-z0-9-]*?(ate|oate)\b|_acetate|butyrate|propionate|hexanoate|octanoate|decanoate|valerate|isovalerate|formate|lactate|tiglate|cinnamate|salicylate|anthranilate|raspberry_ketone|frambinone'),
]
RX = [(f, re.compile(p)) for f, p in RULES]
def fam_of(name):
    n = name.lower()
    if re.match(r'^(sodium|potassium|calcium|magnesium|ammonium)_', n): return None
    for f, rx in RX:
        if rx.search(n): return f
    return None
cfam = {cid: fam_of(n) for cid, n in comp.items()}
print('compounds classified:', sum(1 for v in cfam.values() if v), '/', len(cfam), collections.Counter(v for v in cfam.values() if v).most_common())

# ---- recipes: who actually cooks what with what, by cuisine ----
recs = []
for line in open(os.path.join(FN, 'srep00196-s3.csv'), encoding='utf-8'):
    if line.startswith('#') or not line.strip(): continue
    p = line.strip().split(',')
    recs.append((p[0], set(p[1:])))
SWEET = {'vanilla', 'cocoa', 'yeast', 'cacao', 'strawberry_jam', 'corn_flake', 'gelatin'}
def savoury(s):
    if s & SWEET: return False
    if {'wheat', 'butter', 'egg', 'cane_molasses'} <= s: return False
    return True
sav = [(c, s) for c, s in recs if savoury(s)]
N = len(sav)
cnt = collections.Counter(); pair = collections.Counter(); cuis = collections.defaultdict(collections.Counter)
for c, s in sav:
    for a in s: cnt[a] += 1; cuis[a][c] += 1
    l = sorted(s)
    for i in range(len(l)):
        for j in range(i + 1, len(l)): pair[(l[i], l[j])] += 1
cuisine_tot = collections.Counter(c for c, _ in sav)
npmi = collections.defaultdict(dict)
for (a, b), k in pair.items():
    if k < 4: continue
    pab = k / N; pa = cnt[a] / N; pb = cnt[b] / N
    v = math.log(pab / (pa * pb)) / -math.log(pab)
    if v > 0.02: npmi[a][b] = npmi[b][a] = round(v, 3)
print('savoury recipes', N, 'ingredients', len(cnt), 'pairs with signal', sum(len(v) for v in npmi.values()) // 2)

# ---- build ingredient table ----
names = {i: n for i, (n, _) in ingr.items()}
byname = {n: i for i, n in names.items()}
CU = {'NorthAmerican': 'NA', 'SouthernEuropean': 'SE', 'LatinAmerican': 'LA', 'WesternEuropean': 'WE', 'EastAsian': 'EA', 'MiddleEastern': 'ME', 'SouthAsian': 'SA', 'SoutheastAsian': 'SEA', 'EasternEuropean': 'EE', 'African': 'AF', 'NorthernEuropean': 'NE'}
ing_out = {}
comp_index = {}
for i, (n, cat) in ingr.items():
    cs = sorted(links.get(i, ()))
    if not cs and n not in cnt: continue
    fams = collections.Counter(cfam[c] for c in cs if cfam.get(c))
    e = {'c': cat}
    if cs: e['k'] = cs
    if fams: e['f'] = dict(fams)
    if n in cnt:
        e['n'] = cnt[n]
        # cuisine lean: share of this ingredient's recipes vs that cuisine's share overall
        lean = {CU[c]: round((v / cnt[n]) / (cuisine_tot[c] / N), 2) for c, v in cuis[n].items() if v >= 3}
        e['cu'] = {k: v for k, v in sorted(lean.items(), key=lambda x: -x[1])[:4] if v > 1.2}
        top = sorted(npmi[n].items(), key=lambda x: -x[1])[:40]
        if top: e['p'] = dict(top)
    ing_out[n] = e
used_comps = sorted({c for e in ing_out.values() for c in e.get('k', [])})
comp_out = {c: [comp[c], cfam.get(c)] for c in used_comps}
db = {'v': 1, 'sources': ['Ahn et al. 2011 flavor network (Sci Rep 1:196) via lingcheng99/Flavor-Network, GPL-3.0', 'USDA SR28 (public domain)'],
      'cuisines': {v: k for k, v in CU.items()}, 'recipes': N, 'ing': ing_out, 'comp': comp_out, 'fams': ['Me', 'An', 'Sp', 'Sm', 'Ea', 'R', 'Ca', 'Sv', 'Cr', 'Fl', 'Ci', 'Pi', 'Gr', 'Fu', 'Fr']}
json.dump(db, open(os.path.join(OUT, 'chefdb.json'), 'w'), separators=(',', ':'))
print('chefdb.json', os.path.getsize(os.path.join(OUT, 'chefdb.json')) // 1024, 'KB', len(ing_out), 'ingredients', len(comp_out), 'compounds')

# ---- USDA SR28 nutrition ----
F = ['ndb', 'sd', 'water', 'kcal', 'protein', 'fat', 'ash', 'carb', 'fiber', 'sugar', 'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium', 'vitc', 'thiamin', 'riboflavin', 'niacin', 'panto', 'b6', 'folate_tot', 'folic', 'food_folate', 'folate_dfe', 'choline', 'b12', 'vita_iu', 'vita_rae', 'retinol', 'acarot', 'bcarot', 'bcrypt', 'lycopene', 'lutzea', 'vite', 'vitd_mcg', 'vitd_iu', 'vitk', 'satfat', 'monofat', 'polyfat', 'chol', 'gm1', 'gm1d', 'gm2', 'gm2d', 'refuse']
KEEP = ['kcal', 'protein', 'fat', 'carb', 'fiber', 'sugar', 'sodium', 'satfat', 'water', 'calcium', 'iron', 'potassium', 'vitc']
long = {}
for line in open(os.path.join(SR, 'FOOD_DES.txt'), encoding='latin-1'):
    p = [x.strip('~') for x in line.rstrip('\r\n').split('^')]
    long[p[0]] = (p[2], p[1])
groups = {'0100': 'dairy', '0200': 'spice', '0300': 'baby', '0400': 'fat', '0500': 'poultry', '0600': 'soup', '0700': 'sausage', '0800': 'cereal', '0900': 'fruit', '1000': 'pork', '1100': 'veg', '1200': 'nut', '1300': 'beef', '1400': 'drink', '1500': 'fish', '1600': 'legume', '1700': 'lamb', '1800': 'baked', '1900': 'sweet', '2000': 'grain', '2100': 'fastfood', '2200': 'meal', '2500': 'snack', '3500': 'native', '3600': 'restaurant'}
foods = []
for line in open(os.path.join(SR, 'ABBREV.txt'), encoding='latin-1'):
    p = [x.strip('~') for x in line.rstrip('\r\n').split('^')]
    if len(p) < 40: continue
    d = dict(zip(F, p))
    ld, grp = long.get(d['ndb'], (d['sd'], ''))
    row = [d['ndb'], ld, groups.get(grp, 'other')]
    for k in KEEP:
        try: row.append(round(float(d[k]), 2))
        except ValueError: row.append(None)
    foods.append(row)
json.dump({'v': 1, 'source': 'USDA National Nutrient Database for Standard Reference, Release 28 (public domain)', 'cols': ['ndb', 'name', 'group'] + KEEP, 'per': '100 g', 'foods': foods}, open(os.path.join(OUT, 'nutrition.json'), 'w'), separators=(',', ':'))
print('nutrition.json', os.path.getsize(os.path.join(OUT, 'nutrition.json')) // 1024, 'KB', len(foods), 'foods')
