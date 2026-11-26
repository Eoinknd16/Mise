// Mise Diary: food log, goals ("diet mode") and an adaptive coach. Pure logic, no DOM, so it's testable.
// Food data: USDA FoodData Central (public domain, via data/nutrition.json), Mise's own ingredients and
// recipes, Open Food Facts for packaged products (ODbL, looked up live), and foods you add yourself.
import { ITEM } from './data.js';
import * as K from './chef.js';
import { nutrition as recipeNutrition } from './smart.js';
import * as C from './core.js';

export const MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
// nutrient keys: energy, protein, carbs, fat, fibre, sugars, saturates, salt (g), calcium, iron, potassium, vitamin C (mg)
export const NK = ['kcal', 'p', 'c', 'f', 'fib', 'sug', 'sat', 'salt', 'ca', 'fe', 'k', 'vc'];
export const NLABEL = { kcal: 'Energy', p: 'Protein', c: 'Carbs', f: 'Fat', fib: 'Fibre', sug: 'Sugars', sat: 'Saturates', salt: 'Salt', ca: 'Calcium', fe: 'Iron', k: 'Potassium', vc: 'Vitamin C' };
export const NUNIT = { kcal: 'kcal', p: 'g', c: 'g', f: 'g', fib: 'g', sug: 'g', sat: 'g', salt: 'g', ca: 'mg', fe: 'mg', k: 'mg', vc: 'mg' };
const r1 = x => Math.round(x * 10) / 10;
const zero = () => Object.fromEntries(NK.map(k => [k, 0]));

/* ---------- storage ---------- */
export function ensure(S) {
  const d = S.diary || (S.diary = {});
  d.days = d.days || {}; d.weights = d.weights || []; d.foods = d.foods || {}; d.custom = d.custom || {}; d.meals = d.meals || {}; d.fav = d.fav || {};
  d.goal = d.goal || null; d.checkins = d.checkins || []; d.settings = d.settings || { exerciseBack: 0.5, show: ['p', 'c', 'f'], water: 2000 };
  return d;
}
export function day(S, date) { const d = ensure(S); return d.days[date] || (d.days[date] = { entries: [], water: 0, ex: [], note: '', done: false }); }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- foods ---------- */
// A food: { k, name, brand, src, n100 (per 100 g/ml) or nServ (per serving), units: [{ u, g, label }], approx, img, grade }
export function unitsFor(food) { return food.units && food.units.length ? food.units : [{ u: 'g', g: 1, label: 'g' }]; }
export function nutrientsOf(food, qty, unit) {
  const out = zero(); const u = unitsFor(food).find(x => x.u === unit) || unitsFor(food)[0];
  if (food.nServ) { const f = u.u === 'serving' ? qty : (food.servG ? qty * u.g / food.servG : qty); for (const k of NK) out[k] = (food.nServ[k] || 0) * f; return out; }
  const g = qty * (u.g || 1); for (const k of NK) out[k] = (food.n100[k] || 0) * g / 100; return out;
}
export function sum(list) { const t = zero(); for (const n of list) for (const k of NK) t[k] += (n && n[k]) || 0; return t; }
// typical weight of one piece, for logging "1 egg" or "2 slices"
const PIECE = { eggs: 55, banana: 120, apple: 150, orange: 150, pears: 170, kiwi: 80, plums: 60, avocado: 170, lemon: 100, lime: 60, tomato: 100, pepper: 160, onion: 150, 'red-onion': 150, potato: 180, 'sweet-potato': 250, carrot: 80, courgette: 200, cucumber: 300, mango: 300, peach: 150, bread: 36, wraps: 62, pitta: 60, naan: 100, buns: 60, bagels: 85, croissants: 60, crumpets: 55, sausages: 65, 'veggie-sausages': 60, rashers: 25, bacon: 25, burgers: 115, 'fish-fingers': 28, nuggets: 18, 'chicken-breast': 170, 'chicken-thigh': 110, 'pork-chop': 180, steak: 225, 'cheese-slices': 20, biscuits: 13, 'cereal-bars': 25, chocolate: 45 };
const fromUSDA = r => { const o = {}; K.NUTCOLS().forEach((c, i) => o[c] = r[i]); return o; };
const mapUSDA = n => ({ kcal: n.kcal || 0, p: n.protein || 0, c: n.carb || 0, f: n.fat || 0, fib: n.fiber || 0, sug: n.sugar || 0, sat: n.satfat || 0, salt: (n.sodium || 0) * 2.5 / 1000, ca: n.calcium || 0, fe: n.iron || 0, k: n.potassium || 0, vc: n.vitc || 0 });
export function miseFood(id) {
  const it = ITEM[id]; if (!it) return null; const sd = it.standin || id;
  const n = K.nutritionOf(id); if (!n || n.kcal == null) return null;
  const units = [{ u: it.u === 'ml' ? 'ml' : 'g', g: 1, label: it.u === 'ml' ? 'ml' : 'g' }];
  const pg = PIECE[id] || PIECE[sd]; if (pg) units.unshift({ u: 'piece', g: pg, label: `${pieceWord(id)} (${pg} g)` });
  return { k: 'i:' + id, name: it.n, src: 'mise', n100: mapUSDA(n), units, approx: !!it.world, item: id };
}
const pieceWord = id => ({ bread: 'slice', bacon: 'rasher', rashers: 'rasher', eggs: 'egg', 'cheese-slices': 'slice', biscuits: 'biscuit', wraps: 'wrap' }[id] || 'one');
export function usdaFood(ndb) {
  const r = K.usdaRow ? K.usdaRow(ndb) : null; if (!r) return null; const n = fromUSDA(r);
  return { k: 'n:' + ndb, name: tidyUSDA(n.name), src: 'usda', n100: mapUSDA(n), units: [{ u: 'g', g: 1, label: 'g' }] };
}
// "Chicken, broilers or fryers, breast, meat only, cooked, roasted" -> "Chicken breast, meat only, cooked, roasted"
function tidyUSDA(s) { return String(s).replace(/, broilers or fryers/i, '').replace(/^(\w+), (\w+)\b/, (m, a, b) => /^(raw|cooked|fresh|frozen|canned|dried)$/i.test(b) ? m : `${a} ${b.toLowerCase()}`).replace(/\s+/g, ' ').trim(); }
export function recipeFood(S, r) {
  const n = recipeNutrition(S, r, r.serves); if (!n) return null;
  return { k: 'r:' + r.id, name: r.title, src: 'recipe', nServ: { kcal: n.kcal, p: n.protein, c: n.carb, f: n.fat, fib: n.fibre, salt: n.salt }, units: [{ u: 'serving', g: null, label: 'serving' }], recipe: r.id };
}
// Open Food Facts product -> food
export function offFood(p, code) {
  const nm = p.nutriments || {}; const g = key => { const v = nm[key + '_100g']; return v == null || v === '' ? null : +v; };
  let kcal = g('energy-kcal'); if (kcal == null && g('energy') != null) kcal = g('energy') / 4.184; // kJ only
  if (kcal == null) return null;
  const n100 = { kcal, p: g('proteins') || 0, c: g('carbohydrates') || 0, f: g('fat') || 0, fib: g('fiber') || 0, sug: g('sugars') || 0, sat: g('saturated-fat') || 0, salt: g('salt') != null ? g('salt') : (g('sodium') || 0) * 2.5, ca: (g('calcium') || 0) * 1000, fe: (g('iron') || 0) * 1000, k: (g('potassium') || 0) * 1000, vc: (g('vitamin-c') || 0) * 1000 };
  const liquid = /\b(ml|cl|l)\b/i.test(p.quantity || '') || /beverages|drinks|milks/.test((p.categories_tags || []).join(' '));
  const units = [{ u: liquid ? 'ml' : 'g', g: 1, label: liquid ? 'ml' : 'g' }];
  const sq = +p.serving_quantity; if (sq > 0 && sq < 2000) units.unshift({ u: 'serving', g: sq, label: `serving (${p.serving_size || sq + (liquid ? ' ml' : ' g')})` });
  const pq = +p.product_quantity; if (pq > 0 && pq < 5000 && pq !== sq) units.push({ u: 'pack', g: pq, label: `whole pack (${pq} ${liquid ? 'ml' : 'g'})` });
  return { k: 'o:' + code, code, name: (p.product_name_en || p.product_name || p.generic_name || 'Product ' + code).trim(), brand: (p.brands || '').split(',')[0].trim(), src: 'off', n100, units, grade: p.nutriscore_grade || null, nova: p.nova_group || null, img: p.image_front_small_url || null };
}
export const OFF_FIELDS = 'product_name,product_name_en,generic_name,brands,quantity,product_quantity,serving_size,serving_quantity,nutriments,nutriscore_grade,nova_group,image_front_small_url,categories_tags,product_quantity_unit';
export function customFood(o) {
  const per = o.per === 'serving' ? 'serving' : '100';
  const n = Object.fromEntries(NK.map(k => [k, +o[k] || 0]));
  const sg = +o.servG || 0;
  if (per === 'serving') return { k: 'u:' + (o.id || uid()), name: o.name, brand: o.brand || '', src: 'custom', nServ: n, servG: sg || null, units: [{ u: 'serving', g: sg || null, label: sg ? `serving (${sg} g)` : 'serving' }, ...(sg ? [{ u: 'g', g: 1, label: 'g' }] : [])], code: o.code || null };
  const lu = o.per === '100ml' ? 'ml' : 'g';
  return { k: 'u:' + (o.id || uid()), name: o.name, brand: o.brand || '', src: 'custom', n100: n, units: [...(sg ? [{ u: 'serving', g: sg, label: `serving (${sg} ${lu})` }] : []), { u: lu, g: 1, label: lu }], code: o.code || null };
}
export function quickFood(o) { return { k: 'q:' + uid(), name: o.name || 'Quick add', src: 'quick', nServ: { kcal: +o.kcal || 0, p: +o.p || 0, c: +o.c || 0, f: +o.f || 0 }, units: [{ u: 'serving', g: null, label: 'serving' }] }; }

/* ---------- logging ---------- */
export function log(S, date, meal, food, qty, unit, time) {
  const d = day(S, date), n = nutrientsOf(food, qty, unit);
  const e = { id: uid(), t: time || Date.now(), meal, food: slim(food), qty, unit, n: roundN(n) };
  d.entries.push(e); remember(S, food, qty, unit, meal); return e;
}
export function edit(S, date, id, qty, unit, meal) { const d = day(S, date), e = d.entries.find(x => x.id === id); if (!e) return null; e.qty = qty; e.unit = unit; if (meal) e.meal = meal; e.n = roundN(nutrientsOf(e.food, qty, unit)); return e; }
export function remove(S, date, id) { const d = day(S, date); d.entries = d.entries.filter(x => x.id !== id); }
const slim = f => { const o = { k: f.k, name: f.name, src: f.src }; for (const k of ['brand', 'n100', 'nServ', 'servG', 'units', 'code', 'grade', 'recipe', 'item', 'approx']) if (f[k] != null) o[k] = f[k]; return o; };
const roundN = n => Object.fromEntries(NK.map(k => [k, k === 'kcal' ? Math.round(n[k]) : r1(n[k])]));
function remember(S, food, qty, unit, meal) {
  if (food.src === 'quick') return; const d = ensure(S), r = d.foods[food.k] || (d.foods[food.k] = { food: slim(food), n: 0 });
  r.food = slim(food); r.n++; r.last = Date.now(); r.qty = qty; r.unit = unit; r.meals = r.meals || {}; r.meals[meal] = (r.meals[meal] || 0) + 1;
}
export function recent(S, meal, limit = 25) {
  const d = ensure(S); return Object.values(d.foods).sort((a, b) => score(b, meal) - score(a, meal)).slice(0, limit);
  function score(r, m) { const age = (Date.now() - (r.last || 0)) / 864e5; return (r.meals && r.meals[m] || 0) * 3 + r.n - age * 0.15; }
}
export function copyMeal(S, from, to, meal, toMeal) { const src = day(S, from).entries.filter(e => e.meal === meal); for (const e of src) day(S, to).entries.push({ ...e, id: uid(), meal: toMeal || meal, t: Date.now() }); return src.length; }
export function saveMeal(S, name, entries) { const d = ensure(S), id = uid(); d.meals[id] = { id, name, items: entries.map(e => ({ food: e.food, qty: e.qty, unit: e.unit })) }; return id; }
export function logMeal(S, date, meal, mid, factor = 1) { const m = ensure(S).meals[mid]; if (!m) return 0; for (const it of m.items) log(S, date, meal, it.food, r1(it.qty * factor), it.unit); return m.items.length; }
export function totals(S, date) {
  const d = day(S, date), food = sum(d.entries.map(e => e.n)), byMeal = Object.fromEntries(MEALS.map(([m]) => [m, sum(d.entries.filter(e => e.meal === m).map(e => e.n))]));
  const ex = (d.ex || []).reduce((a, x) => a + (+x.kcal || 0), 0);
  return { food, byMeal, ex, water: d.water || 0 };
}

/* ---------- search ---------- */
let USDA_IDX = null;
function usdaIndex() {
  if (USDA_IDX) return USDA_IDX; const rows = K.usdaRows ? K.usdaRows() : []; if (!rows.length) return [];
  USDA_IDX = rows.map(r => ({ ndb: r[0], nm: tidyUSDA(r[1]), w: C.norm(r[1]) })); return USDA_IDX;
}
// Local search: your foods first, then Mise's ingredients and recipes, then the USDA list
export function search(S, q, limit = 30) {
  const n = C.norm(q); if (!n) return []; const words = n.split(' ').filter(w => w.length > 1), out = [], seen = new Set();
  const hit = s => { const t = ' ' + C.norm(s) + ' '; return words.every(w => t.includes(' ' + w) || t.includes(w)); };
  const add = (food, score, tag) => { if (!food || seen.has(food.k)) return; seen.add(food.k); out.push({ food, score, tag }); };
  const d = ensure(S);
  for (const r of Object.values(d.foods)) if (hit(r.food.name + ' ' + (r.food.brand || ''))) add(r.food, 100 + r.n, 'recent');
  for (const f of Object.values(d.custom)) if (hit(f.name + ' ' + (f.brand || ''))) add(f, 90, 'yours');
  for (const m of Object.values(d.meals)) if (hit(m.name)) add({ k: 'm:' + m.id, name: m.name, src: 'meal', meal: m.id, nServ: sum(m.items.map(i => nutrientsOf(i.food, i.qty, i.unit))), units: [{ u: 'serving', g: null, label: 'meal' }] }, 85, 'meal');
  for (const r of Object.values(S.recipes || {})) if (hit(r.title)) { const f = recipeFood(S, r); if (f) add(f, 70, 'recipe'); }
  const id = C.matchIngredient(q); if (id) add(miseFood(id), 60, 'mise');
  for (const x of usdaIndex()) { if (out.length > limit * 3) break; if (words.every(w => x.w.includes(w))) { const pref = x.w.startsWith(words[0]) ? 8 : 0, short = 6 - Math.min(6, x.w.split(' ').length / 2); add(usdaFood(x.ndb), 20 + pref + short + (/\braw\b/.test(x.w) ? -2 : 0), 'usda'); } }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ---------- goals: "diet mode" ---------- */
export const ACTIVITY = [['sedentary', 1.2, 'Mostly sitting (desk job, little exercise)'], ['light', 1.375, 'Lightly active (on your feet some of the day, or exercise 1–3 times a week)'], ['moderate', 1.55, 'Active (on your feet most of the day, or exercise 3–5 times a week)'], ['very', 1.725, 'Very active (physical job, or hard exercise 6–7 times a week)'], ['athlete', 1.9, 'Athlete (training twice a day, or a heavy manual job plus training)']];
export const GOALS = [['lose', 'Lose fat'], ['maintain', 'Maintain'], ['recomp', 'Recomp (lose fat, build muscle)'], ['muscle', 'Build muscle (lean gain)'], ['gain', 'Gain weight']];
export const STYLES = [['balanced', 'Balanced'], ['highprotein', 'High protein'], ['lowcarb', 'Lower carb'], ['keto', 'Keto'], ['mediterranean', 'Mediterranean'], ['endurance', 'Endurance (higher carb)'], ['custom', 'Custom split']];
export const bmrOf = p => 10 * p.kg + 6.25 * p.cm - 5 * p.age + (p.sex === 'm' ? 5 : -161); // Mifflin-St Jeor
export const bmiOf = p => p.kg / Math.pow(p.cm / 100, 2);
export const healthyMinKg = cm => 18.5 * Math.pow(cm / 100, 2);
// Works out the day's targets. Returns the numbers plus plain-English notes on anything it changed for safety.
export function plan(p, g, tdeeOverride) {
  const notes = [], bmr = bmrOf(p), act = (ACTIVITY.find(a => a[0] === p.activity) || ACTIVITY[1])[1];
  const formula = bmr * act, tdee = tdeeOverride || formula, bmi = bmiOf(p);
  let goal = g.goal || 'maintain', rate = Math.abs(+g.rate || 0);
  const noDeficit = p.age < 18 || p.pregnant || p.breastfeeding || bmi < 18.5;
  if (noDeficit && ['lose', 'recomp'].includes(goal)) {
    goal = 'maintain'; rate = 0;
    notes.push(p.age < 18 ? "Mise doesn't set weight-loss targets for under-18s: growing bodies need their energy. This is set to maintain; a GP can advise if you're worried about your weight." : p.pregnant || p.breastfeeding ? "During pregnancy and breastfeeding Mise doesn't set a calorie deficit. This is set to maintain; your midwife or GP can advise on what's right for you." : `Your BMI is ${bmi.toFixed(1)}, which is under the healthy range, so Mise won't set a weight-loss target. If you're losing weight without trying, it's worth talking to your GP.`);
  }
  let delta = 0;
  if (goal === 'lose') { const cap = p.kg * 0.01; if (rate > cap) { notes.push(`Capped at ${cap.toFixed(2)} kg a week (1% of your weight): faster than that costs muscle and is hard to keep up.`); rate = cap; } delta = -rate * 7700 / 7; }
  if (goal === 'recomp') delta = -0.1 * tdee;
  if (goal === 'muscle') { rate = Math.min(rate || 0.25, 0.35); delta = rate * 7700 / 7; }
  if (goal === 'gain') { rate = Math.min(rate || 0.35, 0.75); delta = rate * 7700 / 7; }
  if (delta < -0.25 * tdee) { delta = -0.25 * tdee; notes.push('The deficit is capped at 25% below what you burn, so energy, sleep and training hold up.'); }
  let kcal = tdee + delta;
  const floor = p.sex === 'm' ? 1500 : 1200;
  if (kcal < floor && delta < 0) { notes.push(`Set to ${floor} kcal, the lowest Mise will go without medical supervision. Going below that makes it hard to get enough nutrients.`); kcal = floor; }
  kcal = Math.round(kcal / 10) * 10;
  // protein by weight, using a healthy reference weight for higher BMIs (so it isn't oversized)
  const refKg = bmi > 30 ? 25 * Math.pow(p.cm / 100, 2) : p.kg;
  const style = g.style || 'balanced';
  const pPerKg = { balanced: goal === 'lose' || goal === 'recomp' ? 1.8 : 1.6, highprotein: 2.2, lowcarb: 1.8, keto: 1.6, mediterranean: 1.4, endurance: 1.5, custom: 1.8 }[style];
  let pro = refKg * pPerKg, fat, carb;
  if (style === 'custom' && g.split) { pro = kcal * g.split.p / 100 / 4; fat = kcal * g.split.f / 100 / 9; carb = kcal * g.split.c / 100 / 4; }
  else if (style === 'keto') { carb = 25; fat = (kcal - pro * 4 - carb * 4) / 9; }
  else if (style === 'lowcarb') { carb = kcal * 0.22 / 4; fat = (kcal - pro * 4 - carb * 4) / 9; }
  else { fat = kcal * ({ mediterranean: 0.35, endurance: 0.22 }[style] || 0.3) / 9; carb = (kcal - pro * 4 - fat * 9) / 4; }
  const fatMin = 0.6 * p.kg; if (fat < fatMin) { fat = fatMin; carb = Math.max(20, (kcal - pro * 4 - fat * 9) / 4); }
  if (carb < 0) { carb = 20; pro = (kcal - fat * 9 - carb * 4) / 4; }
  const fib = Math.round(14 * kcal / 1000), sugMax = Math.round(kcal * 0.1 / 4), satMax = Math.round(kcal * 0.1 / 9);
  return { kcal, p: Math.round(pro), c: Math.round(carb), f: Math.round(fat), fib, sug: sugMax, sat: satMax, salt: 6, water: Math.round(p.kg * 33 / 250) * 250, bmr: Math.round(bmr), tdee: Math.round(tdee), formula: Math.round(formula), goal, rate, notes, bmi: +bmi.toFixed(1) };
}
// Calorie cycling: same weekly total, more on chosen days
export function targetFor(S, date) {
  const G = ensure(S).goal; if (!G || !G.t) return null; const t = { ...G.t };
  if (G.cycle && G.cycle.days && G.cycle.days.length && G.cycle.extra) {
    const wd = (new Date(date + 'T12:00').getDay() + 6) % 7, up = G.cycle.days.includes(wd), nUp = G.cycle.days.length;
    const shift = up ? G.cycle.extra : -G.cycle.extra * nUp / (7 - nUp);
    t.kcal = Math.round((t.kcal + shift) / 10) * 10; t.c = Math.max(20, Math.round(t.c + shift / 4)); t.cycled = up ? 'high' : 'low';
  }
  return t;
}

/* ---------- weight trend and the adaptive coach ---------- */
const DAY = 864e5, dkey = t => new Date(t).toISOString().slice(0, 10);
export function logWeight(S, date, kg) { const d = ensure(S); d.weights = d.weights.filter(w => w.d !== date); d.weights.push({ d: date, kg: r1(+kg) }); d.weights.sort((a, b) => a.d < b.d ? -1 : 1); }
// Smoothed trend (exponential moving average, 10% a day), filled across missed days: daily weight jumps around with water
export function trend(S) {
  const W = ensure(S).weights; if (!W.length) return [];
  const out = [], byDay = new Map(W.map(w => [w.d, w.kg])); let t = W[0].kg;
  for (let x = Date.parse(W[0].d + 'T12:00'); x <= Date.parse(W[W.length - 1].d + 'T12:00'); x += DAY) {
    const k = dkey(x), v = byDay.get(k); if (v != null) t = t + 0.1 * (v - t); out.push({ d: k, kg: v ?? null, trend: r1(t * 10) / 10 });
  }
  return out;
}
const slope = pts => { const n = pts.length; if (n < 2) return 0; const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n; let num = 0, den = 0; for (const [x, y] of pts) { num += (x - mx) * (y - my); den += (x - mx) ** 2; } return den ? num / den : 0; };
// What you actually burn, worked out from what you ate and what your weight trend did.
// Uses days you logged fully; needs about two weeks before it trusts itself.
export function expenditure(S, days = 21) {
  const d = ensure(S), G = d.goal, tr = trend(S); if (!tr.length) return null;
  const end = tr[tr.length - 1].d, start = dkey(Date.parse(end + 'T12:00') - (days - 1) * DAY);
  const win = tr.filter(x => x.d >= start);
  const logged = win.map(x => ({ d: x.d, kcal: totals(S, x.d).food.kcal, done: (d.days[x.d] || {}).done })).filter(x => x.done || (G && G.t && x.kcal >= G.t.kcal * 0.6));
  if (logged.length < 10 || win.filter(x => x.kg != null).length < 6) return { ready: false, logged: logged.length, weighed: win.filter(x => x.kg != null).length, need: 'Log fully on 10 days and weigh in 6 times in three weeks, and Mise will work out what you really burn.' };
  const avgIn = logged.reduce((a, x) => a + x.kcal, 0) / logged.length;
  // the rate comes from the weigh-ins themselves (a straight line through them): the smoothed trend lags behind
  const kgPerDay = slope(win.map((x, i) => [i, x.kg]).filter(p => p[1] != null));
  const est = avgIn - kgPerDay * 7700, conf = Math.min(1, logged.length / days);
  return { ready: true, est: Math.round(est), avgIn: Math.round(avgIn), kgPerWeek: r1(kgPerDay * 70) / 10, conf, logged: logged.length };
}
// Weekly check-in: suggests a new target if your real burn differs from the plan
export function checkin(S, profile) {
  const d = ensure(S), G = d.goal; if (!G || !G.p) return null;
  const x = expenditure(S); if (!x || !x.ready) return x;
  const cur = G.tdee || plan(G.p, G).tdee, blended = Math.round(cur + (x.est - cur) * Math.min(0.8, x.conf));
  const lim = cur * 0.1, next = Math.round(Math.max(cur - lim, Math.min(cur + lim, blended))); // at most 10% a week
  const p = { ...G.p, kg: (trend(S).slice(-1)[0] || {}).trend || G.p.kg };
  const nt = plan(p, G, next);
  return { ...x, curTdee: Math.round(cur), newTdee: next, target: nt, change: nt.kcal - G.t.kcal, wantPerWeek: G.goal === 'lose' ? -G.rate : ['gain', 'muscle'].includes(G.goal) ? G.rate : 0 };
}
export function setGoal(S, p, g, tdee) { const d = ensure(S); const t = plan(p, g, tdee); d.goal = { ...g, p, t: { kcal: t.kcal, p: t.p, c: t.c, f: t.f, fib: t.fib, sug: t.sug, sat: t.sat, salt: t.salt, water: t.water }, tdee: t.tdee, set: Date.now(), notes: t.notes, goal: t.goal, rate: t.rate }; if (S.diary.settings) S.diary.settings.water = t.water; return d.goal; }

/* ---------- fasting window ---------- */
export function fasting(S, date, now = Date.now()) {
  const G = ensure(S).goal; if (!G || !G.fast) return null; const [h, m] = (G.fast.start || '12:00').split(':').map(Number), len = G.fast.eat || 8;
  const open = Date.parse(date + 'T00:00') + (h * 60 + m) * 6e4, close = open + len * 36e5;
  const ents = day(S, date).entries, outside = ents.filter(e => e.t < open || e.t > close).length;
  const st = now < open ? { state: 'fasting', mins: Math.round((open - now) / 6e4) } : now <= close ? { state: 'eating', mins: Math.round((close - now) / 6e4) } : { state: 'closed', mins: 0 };
  return { ...st, open, close, outside, len };
}

/* ---------- insights ---------- */
export function week(S, endDate) {
  const days = []; for (let i = 6; i >= 0; i--) { const dd = dkey(Date.parse(endDate + 'T12:00') - i * DAY); const t = totals(S, dd), tg = targetFor(S, dd); days.push({ d: dd, kcal: t.food.kcal, p: t.food.p, c: t.food.c, f: t.food.f, fib: t.food.fib, n: day(S, dd).entries.length, target: tg ? tg.kcal : null, ptarget: tg ? tg.p : null }); }
  const L = days.filter(x => x.n); const avg = k => L.length ? Math.round(L.reduce((a, x) => a + x[k], 0) / L.length) : 0;
  const onTarget = L.filter(x => x.target && Math.abs(x.kcal - x.target) <= x.target * 0.1).length, proteinHit = L.filter(x => x.ptarget && x.p >= x.ptarget * 0.9).length;
  // top foods by energy
  const tally = {}; for (const x of days) for (const e of day(S, x.d).entries) { const k = e.food.name; tally[k] = (tally[k] || 0) + e.n.kcal; }
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { days, logged: L.length, avg: { kcal: avg('kcal'), p: avg('p'), c: avg('c'), f: avg('f'), fib: avg('fib') }, onTarget, proteinHit, top };
}
export function streak(S, today) { let n = 0; for (let i = 0; i < 400; i++) { const dd = dkey(Date.parse(today + 'T12:00') - i * DAY); if (day(S, dd).entries.length) n++; else if (i > 0) break; } return n; }

/* ---------- export ---------- */
export function toCSV(S) {
  const d = ensure(S), rows = [['date', 'meal', 'time', 'food', 'brand', 'amount', 'unit', ...NK]];
  for (const [dt, v] of Object.entries(d.days).sort()) for (const e of v.entries) rows.push([dt, e.meal, new Date(e.t).toTimeString().slice(0, 5), e.food.name, e.food.brand || '', e.qty, e.unit, ...NK.map(k => e.n[k])]);
  for (const w of d.weights) rows.push([w.d, 'weight', '', 'Weight', '', w.kg, 'kg', ...NK.map(() => '')]);
  return rows.map(r => r.map(x => /[",\n]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x).join(',')).join('\n');
}
