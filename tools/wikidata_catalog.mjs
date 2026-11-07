// Second Wikidata pass (CC0): names in every language for Mise's own everyday ingredients.
// Many staples (thyme, sage, rosemary...) are filed in Wikidata as plant species, not foods, so the
// class harvest misses them. Here we look each catalog name up directly. Output: harvest/catalog.json
//   { catalogId: { qids: [...], l: { lang: [names] } } }
import { ITEM } from '../www/js/data.js';
import fs from 'fs';
const EP = 'https://qlever.cs.uni-freiburg.de/api/wikidata';
const UA = 'MiseIngredientHarvest/1.0 (https://github.com/Eoinknd16/Mise; open-source meal planner)';
const LANGS = ['ga', 'pl', 'ro', 'pt', 'pt-br', 'es', 'lt', 'lv', 'it', 'fr', 'de', 'ar', 'zh', 'zh-hans', 'zh-hant', 'ru', 'uk', 'hi', 'ur', 'tl'];
const PFX = 'PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function q(sparql, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(EP, { method: 'POST', headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(PFX + sparql) });
      if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200));
      return (await r.json()).results.bindings;
    } catch (e) { console.warn('retry', i, e.message.slice(0, 120)); await sleep(20000 * 2 ** i); }
  }
  throw new Error('query failed');
}
const id = u => u.value.replace('http://www.wikidata.org/entity/', '');
// English names to look up: each catalog food's name (singular too) and its first aliases
const want = new Map();
const sing = w => w.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/(?<![su])s$/, '');
for (const it of Object.values(ITEM)) {
  if (it.id.startsWith('other') || ['household', 'personal', 'baby', 'pet', 'health'].includes(it.cat)) continue;
  for (const n of [it.n, ...it.al.slice(0, 3)]) { const k = n.toLowerCase().replace(/^(fresh|frozen|dried|tinned) /, ''); for (const v of [k, sing(k)]) if (v.length > 2 && !want.has(v)) want.set(v, it.id); }
}
const names = [...want.keys()];
console.log('looking up', names.length, 'names');
const langList = LANGS.map(l => `"${l}"`).join(',');
const out = {};
for (let i = 0; i < names.length; i += 150) {
  const vals = names.slice(i, i + 150).map(n => JSON.stringify(n) + '@en').join(' ');
  // a food, or a living thing (taxon) whose English name is this; never people, bands, places...
  const rows = await q(`SELECT ?name ?i ?l WHERE { VALUES ?name { ${vals} } ?i rdfs:label ?name .
    { ?i wdt:P31 wd:Q16521 } UNION { ?i (wdt:P31|wdt:P279)/wdt:P279* wd:Q2095 } UNION { ?i (wdt:P31|wdt:P279)/wdt:P279* wd:Q25403900 }
    { ?i rdfs:label ?l } UNION { ?i skos:altLabel ?l } FILTER(LANG(?l) IN (${langList})) }`);
  for (const b of rows) {
    const cid = want.get(b.name.value); const o = out[cid] || (out[cid] = { qids: [], l: {} });
    const qq = id(b.i); if (!o.qids.includes(qq)) o.qids.push(qq);
    const lg = b.l['xml:lang']; (o.l[lg] = o.l[lg] || []).includes(b.l.value) || o.l[lg].push(b.l.value);
  }
  console.log(i, '/', names.length, 'rows', rows.length, 'catalog items with names', Object.keys(out).length);
  await sleep(3000);
}
fs.mkdirSync('harvest', { recursive: true });
fs.writeFileSync('harvest/catalog.json', JSON.stringify({ when: new Date().toISOString(), source: 'Wikidata (CC0)', items: out }));
console.log('DONE', Object.keys(out).length);
