// Builds www/data/ingdb.json: every ingredient Mise can recognise beyond its own catalog, each with the
// catalog ingredient it cooks like. Sources: tools/world_ingredients.txt (written for Mise) and
// FoodOn (CC BY 4.0, https://foodon.org) via foodon_extract.py + foodon_map.mjs -> /tmp/ingdb/mapped.json
import { ITEM } from '../www/js/data.js';
import fs from 'fs';
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9' ]+/g, ' ').replace(/'/g, '').replace(/\s+/g, ' ').trim();
const known = new Set(); for (const it of Object.values(ITEM)) { known.add(norm(it.n)); for (const a of it.al) known.add(norm(a)); }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const items = [], seen = new Set();
const add = (name, sid, syn, src) => { const n = norm(name); if (!n || seen.has(n) || !ITEM[sid]) return; const ss = [...new Set(syn.map(norm))].filter(x => x && x !== n && !seen.has(x)); if (known.has(n) && !ss.some(x => !known.has(x))) return; seen.add(n); ss.forEach(x => seen.add(x)); items.push([known.has(n) ? cap(ss.find(x => !known.has(x))) : cap(name.trim()), sid, known.has(n) ? ss.filter(x => !known.has(x)).slice(1) : ss, src]); };
for (const l of fs.readFileSync(new URL('./world_ingredients.txt', import.meta.url), 'utf8').split('\n')) { if (!l.trim() || l.startsWith('#')) continue; const [names, sid] = l.split('|').map(x => x.trim()); const ns = names.split(';').map(x => x.trim()).filter(Boolean); for (const n of ns) add(n, sid, [], 'm'); }
let fo = 0; if (fs.existsSync('/tmp/ingdb/mapped.json')) for (const [n, sid, syn] of JSON.parse(fs.readFileSync('/tmp/ingdb/mapped.json'))) { const b = items.length; add(n, sid, syn, 'f'); fo += items.length - b; }
fs.writeFileSync(new URL('../www/data/ingdb.json', import.meta.url), JSON.stringify({ v: 1, credit: 'Mise world ingredients; FoodOn food ontology (CC BY 4.0, foodon.org)', items: items.map(x => x.slice(0, 3)) }));
console.log('items', items.length, 'from FoodOn', fo, 'bytes', fs.statSync(new URL('../www/data/ingdb.json', import.meta.url)).size);
