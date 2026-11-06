import pickle,re,json,collections
lab,syn,par=pickle.load(open('/tmp/ingdb/fo.pkl','rb'))
anc_cache={}
def ancestors(c):
    if c in anc_cache: return anc_cache[c]
    seen=[];q=[c];s=set()
    while q:
        x=q.pop(0)
        for p in sorted(par.get(x,[])):
            if p not in s: s.add(p); seen.append(p); q.append(p)
    anc_cache[c]=seen; return seen
ROOTS={'food product','spice or herb','plant food product','animal food product'}
BAD=re.compile(r'\d|\b(by|organism|process|method|ingredient|packag|container|label|facility|brand|consumer|dietary|infant|formula|supplement|feed|pet|preserv|treated|state|part|shape|section|portion|class|type|grouping|product type|derived|fraction|extract|isolate|concentrate|byproduct|by-product|waste|material|anatomical|tissue|use|used|natural|artificial|flavou?red|imitation|substitute|analog|mixture|mix|blend|style|form|ready|instant|frozen|canned|dried|cooked|raw|boiled|fried|baked|smoked|salted|fermented|powder|juice|oil|sauce)\b',re.I)
def clean(t):
    t=t.lower().strip()
    t=re.sub(r'\s*\((?:raw|fresh|whole|food|plant|[a-z]+ [a-z]+)\)','',t)
    t=re.sub(r'\b(food product|food source|vegetable food product|plant food product|plant|vegetable plant|fruit plant|meat food product|food)\b','',t)
    t=re.sub(r'\s+',' ',t).strip(' ,-')
    return t
out={}
for c,l in lab.items():
    if not (c.startswith('FOODON') ): continue
    al=[lab.get(a,'') for a in ancestors(c)]
    if not any(r in al for r in ROOTS) and not any(a.endswith('plant') for a in al): continue
    if any(x in ' '.join(al) for x in ['dish','meal','beverage food product','infant','dietary supplement','pet food','animal feed']): continue
    n=clean(l)
    if not n or len(n)<3 or len(n.split())>4 or BAD.search(n) or '(' in n or ',' in n or '/' in n: continue
    names=[n]+[clean(t) for k,t in syn.get(c,[]) if k.startswith('synonym (exact)')]
    names=[x for x in dict.fromkeys(names) if x and len(x)>2 and len(x.split())<=4 and not BAD.search(x) and '(' not in x and ',' not in x]
    if not names: continue
    out[c]={'n':names[0],'syn':names[1:],'anc':[clean(a) for a in al[:8] if a]}
# dedupe by name
byname={}
for c,v in out.items():
    k=v['n']
    if k not in byname or len(v['anc'])>len(byname[k]['anc']): byname[k]={'id':c,**v}
print(len(out),len(byname))
json.dump(list(byname.values()),open('/tmp/ingdb/fo_terms.json','w'))
import random; random.seed(1)
for v in random.sample(list(byname.values()),40): print(v['n'],'|',v['syn'][:2],'|',' > '.join(v['anc'][:3]))
