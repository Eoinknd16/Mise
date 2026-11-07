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
// QLever first; Wikidata's own endpoint if QLever keeps saying "too many requests"
const EPS = [EP, 'https://query.wikidata.org/sparql'];
let ep = 0;
async function q(sparql, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(EPS[ep], { method: 'POST', headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(PFX + sparql) });
      if (r.status === 429 && i >= 1) { ep = 1 - ep; console.warn('switching endpoint to', EPS[ep]); }
      if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200));
      return (await r.json()).results.bindings;
    } catch (e) { console.warn('retry', i, e.message.slice(0, 120)); await sleep(15000 * 2 ** Math.min(i, 4)); }
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
// foods the class harvest already found (from the harvest-data branch), plus anything that is a taxon
const FOODS = new Set(fs.existsSync('items.json') ? Object.keys(JSON.parse(fs.readFileSync('items.json')).items) : []);
console.log('known food items', FOODS.size);
const keep = new Map(); // qid -> catalog id
for (let i = 0; i < names.length; i += 100) {
  const vals = names.slice(i, i + 100).map(n => JSON.stringify(n) + '@en').join(' ');
  const rows = await q(`SELECT ?name ?i ?c WHERE { VALUES ?name { ${vals} } ?i rdfs:label ?name . OPTIONAL { ?i wdt:P31 ?c } }`);
  const cls = new Map(); for (const b of rows) { const k = id(b.i); if (!cls.has(k)) cls.set(k, { name: b.name.value, c: new Set() }); if (b.c) cls.get(k).c.add(id(b.c)); }
  for (const [k, v] of cls) if (FOODS.has(k) || v.c.has('Q16521') || [...v.c].some(c => FOODS.has(c))) if (!keep.has(k)) keep.set(k, want.get(v.name));
  console.log(i, '/', names.length, 'candidates kept', keep.size);
  await sleep(2500);
}
const qs = [...keep.keys()];
for (let i = 0; i < qs.length; i += 300) {
  const vals = qs.slice(i, i + 300).map(x => 'wd:' + x).join(' ');
  for (const pred of ['rdfs:label', 'skos:altLabel']) {
    for (const b of await q(`SELECT ?i ?l WHERE { VALUES ?i { ${vals} } ?i ${pred} ?l . FILTER(LANG(?l) IN (${langList})) }`)) {
      const k = id(b.i), cid = keep.get(k), o = out[cid] || (out[cid] = { qids: [], l: {} }); if (!o.qids.includes(k)) o.qids.push(k);
      const lg = b.l['xml:lang']; (o.l[lg] = o.l[lg] || []).includes(b.l.value) || o.l[lg].push(b.l.value);
    }
    await sleep(2500);
  }
  console.log('names for', Object.keys(out).length, 'catalog items');
}
fs.mkdirSync('harvest', { recursive: true });
fs.writeFileSync('harvest/catalog.json', JSON.stringify({ when: new Date().toISOString(), source: 'Wikidata (CC0)', items: out }));
console.log('DONE', Object.keys(out).length);
