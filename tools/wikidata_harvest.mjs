// Harvests food ingredients from Wikidata (CC0, https://www.wikidata.org) for Mise's world ingredient
// database. Runs in GitHub Actions (tools/ can't reach Wikidata from the dev sandbox).
// Output: harvest/roots.json (root classes with labels, to check the IDs), harvest/items.json
//   items: { qid: { p: [parent qids], l: { lang: label }, a: { lang: [aliases] }, t: taxon qid } }
import fs from 'fs';
const EP = 'https://qlever.cs.uni-freiburg.de/api/wikidata';
const UA = 'MiseIngredientHarvest/1.0 (https://github.com/Eoinknd16/Mise; open-source meal planner)';
const LANGS = ['en', 'ga', 'pl', 'ro', 'pt', 'pt-br', 'es', 'lt', 'lv', 'it', 'fr', 'de', 'ar', 'zh', 'zh-hans', 'zh-hant', 'ru', 'uk', 'hi', 'ur', 'tl'];
// Where ingredients live in Wikidata's class tree. Expected English label alongside, so a wrong ID shows up.
const ROOTS = {
  Q25403900: 'food ingredient', Q11004: 'vegetable', Q3314483: 'fruit', Q42527: 'spice', Q207123: 'herb', Q10990: 'meat',
  Q192935: 'seafood', Q10943: 'cheese', Q12117: 'cereal', Q11009: 'nut', Q178359: 'sauce', Q2596997: 'condiment',
  Q131419: 'sausage', Q7802: 'bread', Q178: 'pasta', Q192874: 'noodle', Q5090: 'rice', Q654236: 'edible mushroom',
  Q600396: 'fish as food', Q145909: 'legume', Q8495: 'milk', Q185217: 'dairy product', Q93189: 'egg as food', Q11002: 'sugar',
  Q20136: 'root vegetable', Q13184: 'berry'
};
// roots found by English name: the candidate with the most things under it wins
const BYNAME = ['flour', 'cut of meat', 'cooking oil', 'citrus', 'leaf vegetable', 'shellfish', 'pulse', 'edible seaweed', 'offal', 'pickled food', 'fermented food', 'vinegar', 'dried fruit', 'cured meat', 'tropical fruit', 'stone fruit', 'squash', 'chili pepper', 'onion', 'tuber', 'sprout', 'yogurt', 'butter', 'curry powder', 'spice mix', 'paste', 'syrup', 'honey', 'chocolate', 'tea', 'coffee bean', 'edible insect', 'game meat', 'poultry meat'];
const PFX = 'PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function q(sparql, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(EP, { method: 'POST', headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(PFX + sparql) });
      if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 300));
      return (await r.json()).results.bindings;
    } catch (e) { console.warn('retry', i, e.message.slice(0, 120)); await sleep(20000 * 2 ** i); }
  }
  throw new Error('query failed: ' + sparql.slice(0, 200));
}
const id = u => u.value.replace('http://www.wikidata.org/entity/', '');
fs.mkdirSync('harvest', { recursive: true });
// 1. check the roots
const langList = LANGS.map(l => `"${l}"`).join(',');
const roots = {};
for (const b of await q(`SELECT ?r ?l WHERE { VALUES ?r { ${Object.keys(ROOTS).map(x => 'wd:' + x).join(' ')} } ?r rdfs:label ?l . FILTER(LANG(?l) = "en") }`)) roots[id(b.r)] = { want: ROOTS[id(b.r)], got: b.l.value };
for (const nm of BYNAME) {
  const rows = await q(`SELECT ?r (COUNT(?c) AS ?n) WHERE { ?r rdfs:label "${nm}"@en . OPTIONAL { ?c (wdt:P31|wdt:P279) ?r } } GROUP BY ?r ORDER BY DESC(?n) LIMIT 1`);
  if (rows.length && +rows[0].n.value > 2) { const r = id(rows[0].r); if (!ROOTS[r]) { ROOTS[r] = nm; roots[r] = { want: nm, got: nm + ' (by name, ' + rows[0].n.value + ' under it)' }; } }
  else roots['?' + nm] = { want: nm, got: 'not found' };
  await sleep(1500);
}
fs.writeFileSync('harvest/roots.json', JSON.stringify(roots, null, 1));
console.log(Object.entries(roots).map(([k, v]) => `${k} want "${v.want}" got "${v.got}"${v.want.toLowerCase() === v.got.toLowerCase() ? '' : '  <-- CHECK'}`).join('\n'));
// 2. everything under each root (instance or subclass, any depth), with direct parents and source taxon
const items = {};
const get = qid => items[qid] || (items[qid] = { p: [], l: {}, a: {}, r: [] });
for (const R of Object.keys(ROOTS)) {
  const t0 = Date.now();
  const rows = await q(`SELECT ?i ?p ?t WHERE { { ?i (wdt:P31|wdt:P279)/wdt:P279* wd:${R} } UNION { BIND(wd:${R} AS ?i) } OPTIONAL { ?i wdt:P279 ?p } OPTIONAL { ?i wdt:P1582 ?t } }`);
  for (const b of rows) { const it = get(id(b.i)); if (!it.r.includes(R)) it.r.push(R); if (b.p && !it.p.includes(id(b.p))) it.p.push(id(b.p)); if (b.t) it.t = id(b.t); }
  console.log(R, ROOTS[R], 'rows', rows.length, 'items so far', Object.keys(items).length, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await sleep(4000);
}
// 3. foods made from an organism (P1582) that the roots missed
{ const rows = await q(`SELECT ?i ?t ?l WHERE { ?i wdt:P1582 ?t . ?i rdfs:label ?l . FILTER(LANG(?l) = "en") }`);
  let n = 0; for (const b of rows) { const q0 = id(b.i); if (!items[q0]) { n++; const it = get(q0); it.t = id(b.t); it.l.en = b.l.value; it.r.push('P1582'); } }
  console.log('P1582 extra', n); }
// 4. names in every language, in batches
{ const ids = Object.keys(items); let nl = 0, na = 0;
  for (let i = 0; i < ids.length; i += 1500) {
    const vals = ids.slice(i, i + 1500).map(x => 'wd:' + x).join(' ');
    for (const b of await q(`SELECT ?i ?l WHERE { VALUES ?i { ${vals} } ?i rdfs:label ?l . FILTER(LANG(?l) IN (${langList})) }`)) { get(id(b.i)).l[b.l['xml:lang']] = b.l.value; nl++; }
    await sleep(2500);
    for (const b of await q(`SELECT ?i ?l WHERE { VALUES ?i { ${vals} } ?i skos:altLabel ?l . FILTER(LANG(?l) IN (${langList})) }`)) { const it = get(id(b.i)), lg = b.l['xml:lang']; (it.a[lg] = it.a[lg] || []).includes(b.l.value) || it.a[lg].push(b.l.value); na++; }
    await sleep(2500);
    if (i % 15000 === 0) console.log('names', i, '/', ids.length, nl, na);
  } console.log('labels', nl, 'aliases', na); }
// 4. English labels of every parent class, so the mapping can read the tree
const parents = [...new Set(Object.values(items).flatMap(x => x.p))].filter(p => !items[p] || !items[p].l.en);
const plab = {};
for (let i = 0; i < parents.length; i += 2000) {
  for (const b of await q(`SELECT ?i ?l WHERE { VALUES ?i { ${parents.slice(i, i + 2000).map(x => 'wd:' + x).join(' ')} } ?i rdfs:label ?l . FILTER(LANG(?l) = "en") }`)) plab[id(b.i)] = b.l.value;
}
fs.writeFileSync('harvest/items.json', JSON.stringify({ when: new Date().toISOString(), source: 'Wikidata (CC0)', roots: ROOTS, items, parentLabels: plab }));
const n = Object.keys(items).length, names = Object.values(items).reduce((a, x) => a + Object.keys(x.l).length + Object.values(x.a).reduce((s, v) => s + v.length, 0), 0);
console.log('DONE items', n, 'names', names, 'bytes', fs.statSync('harvest/items.json').size);
