// Mise — "knows how you live": rhythm, household, reactions, habits, money, freezer, prep, stats, sharing, import, nutrition.
import { ITEM, CATALOG } from './data.js';
import * as C from './core.js';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const wdOf = d => (new Date(d + 'T12:00').getDay() + 6) % 7;
const learn = s => (s.learn = s.learn || { tired: {}, out: {}, effort: 0, cheap: 0, portion: 0, leftEaten: 0, leftFrozen: 0, kidNo: {}, asked: {} });

/* ================= Week rhythm ================= */
export const MODES = {
  normal: ['Normal', ''], quick: ['Quick', '20 min or less'], protein: ['Gym night', 'High protein'], cook: ['Proper cook', 'Time to enjoy it'],
  takeaway: ['Takeaway', 'No cooking'], off: ['No dinner', 'Out or skipping']
};
export const THEMES = {
  taco: ['Taco night', r => r.tags.includes('type:handheld') || r.area === 'Mexican'],
  meatfree: ['Meat-free', r => C.proteinOf(r) === 'veg'],
  fish: ['Fish night', r => C.proteinOf(r) === 'fish'],
  pasta: ['Pasta night', r => r.tags.includes('type:pasta')],
  curry: ['Curry night', r => r.tags.includes('type:curry')],
  pizza: ['Pizza night', r => r.tags.includes('type:pizza') || /pizza|flatbread/i.test(r.title)],
  stirfry: ['Stir-fry night', r => r.tags.includes('type:stirfry')],
  roast: ['Roast', r => r.tags.includes('type:roast') || /roast/i.test(r.title)],
  comfort: ['Comfort food', r => ['type:pie', 'type:stew', 'type:pasta'].some(t => r.tags.includes(t))]
};
export function rhythm(state) {
  if (!Array.isArray(state.rhythm) || state.rhythm.length !== 7) state.rhythm = state.settings.nights.map(n => ({ mode: n ? 'normal' : 'off', theme: null }));
  return state.rhythm;
}
export const nightOf = (state, date) => rhythm(state)[wdOf(date)];
export const cooksOn = (state, date) => !['takeaway', 'off'].includes(nightOf(state, date).mode);
export function syncNights(state) { state.settings.nights = rhythm(state).map(n => ['takeaway', 'off'].includes(n.mode) ? 0 : 1); }

/* ================= Household ================= */
export function people(state) {
  const extra = (state.people || []);
  return [{ id: 'me', name: 'You', kid: false }].concat(extra);
}
export const householdSize = state => (state.people && state.people.length) ? state.people.length + 1 : (state.settings.household || 2);
function memberState(state, p) {
  if (p.id === 'me') return state;
  return { ...state, likes: p.likes || {}, settings: { ...state.settings, diet: p.diet || [] } };
}
export function ruledOutFor(state, r, ids) {
  for (const p of people(state)) { if (ids && !ids.includes(p.id)) continue; if (C.ruledOut(memberState(state, p), r)) return p; }
  return null;
}
// Who's eating on a date (defaults to everyone not away this week)
export function eaters(state, date) {
  const set = (state.whoEats || {})[date]; const away = ((state.weekCheck || {})[weekKey(date)] || {}).away || [];
  return people(state).filter(p => set ? set.includes(p.id) : !away.includes(p.id)).map(p => p.id);
}
export function servesFor(state, date) {
  const base = state.people && state.people.length ? eaters(state, date).length : (state.settings.household || 2);
  const g = (((state.weekCheck || {})[weekKey(date)] || {}).guests || {})[date] || 0;
  const scale = 1 + (learn(state).portion || 0) * 0.15;
  return Math.max(1, Math.round((base + g) * scale));
}
export const kidsEating = (state, date) => people(state).some(p => p.kid && eaters(state, date).includes(p.id));
export function kidFriendly(state, r) {
  if ((learn(state).kidNo || {})[r.id]) return false;
  if (r.tags.includes('fl:spicy')) return false;
  const easy = ['type:pasta', 'type:pie', 'type:handheld', 'type:pizza', 'type:fry', 'type:roast', 'type:rice', 'type:stew'].some(t => r.tags.includes(t));
  return easy && r.ings.length <= 12 && !r.lib;
}
export function tipsFor(state, r, date) {
  const tips = [], ids = date ? eaters(state, date) : people(state).map(p => p.id), ps = people(state).filter(p => ids.includes(p.id));
  if (ps.some(p => p.kid)) { const veg = r.ings.filter(i => ITEM[i.item] && ITEM[i.item].cat === 'veg' && !['onion', 'garlic', 'potato'].includes(i.item)).map(i => i.name.toLowerCase()); if (veg.length) tips.push(`Hide the veg: grate or blend the ${veg.slice(0, 2).join(' and ')} into the sauce.`); }
  if (r.tags.includes('fl:spicy') && ps.some(p => p.kid || (p.spice != null && p.spice <= 1))) tips.push('Split it: take out a mild portion before adding the chilli.');
  const who = ruledOutFor(state, r, ids); if (who && who.id !== 'me') tips.push(`${who.name} won't eat something in this. Check the ingredients.`);
  return tips;
}

/* ================= Week check ================= */
export const weekKey = d => C.weekDates(0) && (() => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); })();

/* ================= Seasons ================= */
const SEASON = {
  winter: { months: [10, 11, 0, 1], tags: ['type:stew', 'type:pie', 'type:soup', 'type:roast', 'type:curry'], items: ['parsnip', 'cabbage', 'leek', 'carrot', 'potato', 'kale', 'beetroot', 'butternut'] },
  spring: { months: [2, 3, 4], tags: ['type:stirfry', 'type:pasta'], items: ['asparagus', 'spring-onion', 'spinach', 'lamb', 'radish'] },
  summer: { months: [5, 6, 7], tags: ['type:salad', 'type:roast', 'type:handheld'], items: ['courgette', 'tomato', 'cherry-tomato', 'berries', 'corn-cob', 'cucumber', 'salad'] },
  autumn: { months: [8, 9], tags: ['type:stew', 'type:curry', 'type:pie'], items: ['butternut', 'mushroom', 'apple', 'pumpkin', 'cauliflower', 'leek'] }
};
export function season(date = C.today()) { const m = new Date(date + 'T12:00').getMonth(); return Object.entries(SEASON).find(([, v]) => v.months.includes(m)); }
function seasonBoost(r, date) { const [, s] = season(date); let b = 1; if (s.tags.some(t => r.tags.includes(t))) b *= 1.3; if (r.ings.some(i => s.items.includes(i.item))) b *= 1.15; return b; }

/* ================= Difficulty & skill ================= */
export const difficulty = r => (r.steps || []).length * 0.6 + r.ings.length * 0.35 + (r.time || 40) / 30;
export function masteredTypes(state) {
  const n = {}; for (const [rid, rt] of Object.entries(state.ratings || {})) { const r = C.allRecipes(state)[rid]; if (!r || !rt.n) continue; for (const t of r.tags.filter(t => t.startsWith('type:'))) { n[t] = n[t] || { c: 0, good: 0, d: 0 }; n[t].c += rt.n; if ((rt.r || 4) >= 4) n[t].good += rt.n; n[t].d = Math.max(n[t].d, difficulty(r)); } }
  return Object.entries(n).filter(([, v]) => v.c >= 3 && v.good >= 2).map(([t, v]) => ({ tag: t, level: v.d }));
}

/* ================= Rut ================= */
export function rut(state) {
  const since = C.addDays(C.today(), -21), all = C.allRecipes(state), c = {}; let tot = 0;
  for (const [d, es] of Object.entries(state.plan)) if (d >= since && d <= C.today()) for (const e of es) { if (e.leftover) continue; const r = all[e.rid]; if (!r) continue; const p = C.proteinOf(r); c[p] = (c[p] || 0) + 1; tot++; }
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return top && tot >= 6 && top[1] / tot >= 0.45 && top[0] !== 'veg' ? { protein: top[0], n: top[1], of: tot } : null;
}

/* ================= Money ================= */
export function stockAt(state, shop) { const s = new Set(); for (const p of state.prices || []) if (p.shop === shop) s.add(p.item); return s; }
export function priceByShop(state, item) {
  const out = {}; for (const p of state.prices || []) if (p.item === item && p.qty > 0) { const u = p.price / p.qty; if (!out[p.shop] || p.date > out[p.shop].date) out[p.shop] = { unit: u, date: p.date }; }
  return out;
}
export function cheaperElsewhere(state, item) {
  const by = priceByShop(state, item), mine = by[state.settings.defaultShop]; if (!mine) return null;
  let best = null; for (const [shop, v] of Object.entries(by)) if (shop !== state.settings.defaultShop && v.unit < mine.unit * 0.9 && (!best || v.unit < best.unit)) best = { shop, unit: v.unit, pct: Math.round((1 - v.unit / mine.unit) * 100) };
  return best;
}
export function priceTrends(state) {
  const by = {}; for (const p of state.prices || []) if (p.qty > 0) (by[p.item] = by[p.item] || []).push(p);
  const out = [];
  for (const [item, rows] of Object.entries(by)) {
    if (rows.length < 3 || !ITEM[item]) continue; rows.sort((a, b) => a.date.localeCompare(b.date));
    const last = rows[rows.length - 1], old = rows.filter(r => C.daysBetween(r.date, last.date) >= 30);
    if (!old.length) continue; const avg = old.reduce((a, r) => a + r.price / r.qty, 0) / old.length, now = last.price / last.qty;
    const ch = (now - avg) / avg; if (Math.abs(ch) >= 0.1) out.push({ item, change: ch });
  }
  return out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
export function monthBudget(state) {
  const t = C.today(), m = t.slice(0, 7), d = new Date(t + 'T12:00'), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const spent = (state.receipts || []).filter(r => (r.date || '').startsWith(m)).reduce((a, r) => a + (r.total || 0), 0);
  const budget = (state.settings.budget || 0) * dim / 7; if (!budget) return null;
  const expected = budget * d.getDate() / dim;
  return { spent, budget, expected, ahead: spent - expected, tight: spent > expected * 1.1 && spent > 20, left: budget - spent };
}

/* ================= Freezer ================= */
export function freezer(state) { return (state.freezer = state.freezer || []); }
export function addFreezer(state, rid, title, portions, date = C.today()) { if (portions <= 0) return; const ex = freezer(state).find(f => f.rid === rid && f.date === date); if (ex) ex.portions += portions; else freezer(state).push({ id: 'f' + Math.random().toString(36).slice(2, 8), rid, title, portions, date }); }
export function takeFreezer(state, id, portions) { const f = freezer(state).find(x => x.id === id); if (!f) return null; f.portions -= portions; if (f.portions <= 0) state.freezer = freezer(state).filter(x => x.id !== id); return f; }
export const freezerAge = f => C.daysBetween(f.date, C.today());

/* ================= Usual buys ================= */
export function usualBuys(state) {
  const by = {}; for (const r of state.receipts || []) for (const l of r.lines || []) if (l.item && ITEM[l.item]) (by[l.item] = by[l.item] || new Set()).add(r.date);
  const out = [];
  for (const [item, ds] of Object.entries(by)) {
    const d = [...ds].sort(); if (d.length < 3) continue;
    const gaps = d.slice(1).map((x, i) => C.daysBetween(d[i], x)).filter(g => g > 0); if (!gaps.length) continue;
    const every = Math.max(2, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)), due = C.addDays(d[d.length - 1], every);
    if (C.daysBetween(C.today(), due) <= 3 && C.pantryQty(state, item) <= 0) out.push({ item, every, due });
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}

/* ================= Reactions & check-ins ================= */
export const REACTION_CHIPS = [['spicy', 'Too spicy'], ['bland', 'Too bland'], ['effort', 'Too much effort'], ['long', 'Took too long'], ['pricey', 'Too pricey'], ['small', 'Not enough food'], ['kids', 'Kids didn\'t like it'], ['again', 'Have it again soon']];
export function applyReaction(state, r, verdict, chips) {
  const L = learn(state), stars = verdict === 'love' ? 5 : verdict === 'fine' ? 3 : 1;
  C.rate(state, r.id, r, stars);
  if (verdict === 'never') { state.dishVotes = state.dishVotes || {}; state.dishVotes[r.id] = -1; }
  const T = state.taste = state.taste || {};
  for (const c of chips) {
    if (c === 'spicy') { if (r.tags.includes('fl:spicy')) T.spice = Math.max(0, (T.spice ?? 2) - 1); state.tagPref['fl:spicy'] = (state.tagPref['fl:spicy'] || 0) - 1; }
    if (c === 'bland') { T.spice = Math.min(3, (T.spice ?? 1) + 1); state.tagPref['fl:spicy'] = (state.tagPref['fl:spicy'] || 0) + 0.7; }
    if (c === 'effort') L.effort = Math.min(5, (L.effort || 0) + 1);
    if (c === 'long') { const wd = r.time; if (!T.maxTime || T.maxTime > wd - 10) T.maxTime = Math.max(20, Math.min(45, Math.round((wd - 10) / 5) * 5)); }
    if (c === 'pricey') L.cheap = Math.min(5, (L.cheap || 0) + 1);
    if (c === 'small') L.portion = Math.min(3, (L.portion || 0) + 1);
    if (c === 'kids') L.kidNo[r.id] = 1;
    if (c === 'again') { const rt = state.ratings[r.id]; if (rt) rt.last = C.addDays(C.today(), -30); }
  }
}
// Past planned dinners you never ticked off
export function skippedPending(state) {
  const t = C.today(), since = C.addDays(t, -7), all = C.allRecipes(state), out = [], L = learn(state);
  for (const [d, es] of Object.entries(state.plan)) if (d >= since && d < t) es.forEach((e, i) => { if (!e.cooked && !e.leftover && !e.fromFreezer && !L.asked[d + ':' + e.rid] && all[e.rid]) out.push({ date: d, idx: i, rid: e.rid, r: all[e.rid] }); });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
export function applySkip(state, date, idx, reason) {
  const L = learn(state), e = (state.plan[date] || [])[idx]; if (!e) return; L.asked[date + ':' + e.rid] = 1;
  const r = C.allRecipes(state)[e.rid], wd = wdOf(date);
  if (reason === 'cooked') { e.cooked = true; C.markCooked(state, e.rid, r, date); logCook(state, r, e.serves, date); return; }
  if (reason === 'tired') L.tired[wd] = (L.tired[wd] || 0) + 1;
  if (reason === 'out') L.out[wd] = (L.out[wd] || 0) + 1;
  if (reason === 'fancy' && r) C.markSkipped(state, e.rid, r);
  e.skipped = reason;
}
export function logCook(state, r, serves, date = C.today()) {
  state.cookLog = state.cookLog || [];
  const cost = r ? C.recipeCost(state, r, serves).total : 0;
  state.cookLog.push({ date, rid: r ? r.id : null, serves, cost, area: r && r.area, p: r && C.proteinOf(r) });
  if (state.cookLog.length > 1500) state.cookLog = state.cookLog.slice(-1500);
}

/* ================= Habits Mise noticed ================= */
export function habits(state) {
  const out = [], L = learn(state), R = rhythm(state);
  for (const [wd, n] of Object.entries(L.tired || {})) if (n >= 2 && R[wd].mode === 'normal') out.push({ id: 'tired' + wd, text: `${DOW[wd]}s often end up too busy to cook. Make ${DOW[wd]} a quick night?`, act: ['quick', +wd] });
  for (const [wd, n] of Object.entries(L.out || {})) if (n >= 2 && !['takeaway', 'off'].includes(R[wd].mode)) out.push({ id: 'out' + wd, text: `You often eat out on ${DOW[wd]}s. Stop planning dinner that night?`, act: ['takeaway', +wd] });
  const conv = {}; for (const r of state.receipts || []) { const wd = wdOf(r.date); for (const l of r.lines || []) if (['pizza', 'ready-meal', 'frozen-meal', 'frozen-burgers', 'nuggets', 'meal-deal'].includes(l.item)) conv[wd] = (conv[wd] || 0) + 1; }
  for (const [wd, n] of Object.entries(conv)) { const fri = (+wd + 0) % 7; if (n >= 3 && R[fri].mode === 'normal') out.push({ id: 'conv' + wd, text: `You often buy ready meals or pizza on ${DOW[wd]}s. Make ${DOW[wd]} an easy night?`, act: ['quick', +wd] }); }
  if ((L.leftFrozen || 0) >= 3 && L.leftFrozen > (L.leftEaten || 0)) out.push({ id: 'smallbatch', text: 'You usually freeze leftovers instead of eating them. Mise now cooks smaller batches.', info: true });
  const rt = rut(state); if (rt) out.push({ id: 'rut', text: `You've had ${rt.protein} ${rt.n} times in 3 weeks. Next week will mix it up.`, info: true });
  return out.filter(h => !(state.dismissed || {})[h.id]);
}
export const smallBatches = state => { const L = learn(state); return (L.leftFrozen || 0) >= 3 && L.leftFrozen > (L.leftEaten || 0); };

/* ================= Challenges ================= */
export const CHALLENGES = {
  newcuisine: ['Try a new cuisine', 'One dinner from somewhere you\'ve never cooked'],
  budget2: ['Under €2 a portion', 'Every dinner under €2 a serving'],
  meatfree2: ['Two meat-free nights', 'Two veggie dinners this week'],
  nowaste: ['Zero waste week', 'Use up every fresh ingredient'],
  cook5: ['Cook 5 nights', 'Five home-cooked dinners']
};
export function challengeAdjust(state, r) {
  const c = (state.challenge || {}).kind; if (!c) return 1;
  if (c === 'meatfree2' && C.proteinOf(r) === 'veg') return 1.6;
  if (c === 'budget2') return C.recipeCost(state, r, r.serves).perServe <= 2 ? 1.6 : 0.4;
  if (c === 'newcuisine') { const done = new Set((state.cookLog || []).map(x => x.area)); return r.area && !done.has(r.area) ? 1.4 : 1; }
  return 1;
}
export function challengeProgress(state, dates) {
  const c = (state.challenge || {}).kind; if (!c) return null; const all = C.allRecipes(state);
  const es = dates.flatMap(d => (state.plan[d] || []).filter(e => !e.leftover).map(e => ({ d, e, r: all[e.rid] }))).filter(x => x.r);
  if (c === 'meatfree2') { const n = es.filter(x => C.proteinOf(x.r) === 'veg').length; return { done: Math.min(n, 2), of: 2 }; }
  if (c === 'cook5') { const n = es.filter(x => x.e.cooked).length; return { done: Math.min(n, 5), of: 5 }; }
  if (c === 'budget2') { const n = es.filter(x => C.recipeCost(state, x.r, x.r.serves).perServe <= 2).length; return { done: n, of: es.length || 1 }; }
  if (c === 'newcuisine') { const before = new Set((state.cookLog || []).filter(x => x.date < dates[0]).map(x => x.area)); const n = es.some(x => x.r.area && !before.has(x.r.area)) ? 1 : 0; return { done: n, of: 1 }; }
  if (c === 'nowaste') { const bits = C.weekLeftovers(state, dates); return { done: bits.length ? 0 : 1, of: 1, note: bits.length ? `${bits.length} bits left` : 'Nothing left over' }; }
  return null;
}

/* ================= Stats ================= */
export function stats(state) {
  const log = state.cookLog || [], takeaway = state.settings.takeawayPrice || 14;
  const serves = log.reduce((a, x) => a + (x.serves || 2), 0), cost = log.reduce((a, x) => a + (x.cost || 0), 0);
  const saved = Math.max(0, serves * takeaway - cost);
  const weeks = {}; for (const x of log) { const k = weekKey(x.date); weeks[k] = (weeks[k] || 0) + 1; }
  let streak = 0; for (let k = weekKey(C.today()), i = 0; i < 52; i++, k = C.addDays(k, -7)) { if ((weeks[k] || 0) >= 3) streak++; else if (i > 0 || (weeks[k] || 0) < 3) { if (i === 0) continue; break; } }
  const month = C.today().slice(0, 7), thisMonth = log.filter(x => x.date.startsWith(month)).length;
  const L = learn(state), wasteMeals = (L.leftEaten || 0) + (state.freezerEaten || 0);
  const areas = {}; for (const x of log) if (x.area) areas[x.area] = (areas[x.area] || 0) + 1;
  const top = {}; for (const x of log) if (x.rid) top[x.rid] = (top[x.rid] || 0) + 1;
  return { cooked: log.length, thisMonth, saved, streak, wasteMeals, cuisines: Object.keys(areas).length, topCuisine: Object.entries(areas).sort((a, b) => b[1] - a[1])[0], topRecipe: Object.entries(top).sort((a, b) => b[1] - a[1])[0] };
}

/* ================= Prep plan ================= */
export function prepPlan(state, dates) {
  const all = C.allRecipes(state), chop = {}, grains = {}, grate = {}, marinate = [];
  for (const d of dates) for (const e of (state.plan[d] || [])) {
    if (e.leftover || e.cooked || e.fromFreezer) continue; const r = all[e.rid]; if (!r) continue; const f = (e.serves || r.serves) / r.serves, day = DOW[wdOf(d)];
    for (const i of C.withSubs(state, r.ings)) {
      const it = ITEM[i.item]; if (!it) continue;
      if (['onion', 'red-onion', 'pepper', 'carrot', 'celery', 'leek', 'courgette', 'mushroom', 'garlic', 'butternut', 'sweet-potato', 'aubergine', 'broccoli', 'cauliflower', 'cabbage'].includes(it.id)) { const c = chop[it.id] = chop[it.id] || { q: 0, u: i.u, days: new Set() }; c.q += i.q * f; c.days.add(day); }
      if (['rice', 'basmati', 'couscous', 'grains'].includes(it.id)) { const b = C.toBase(i.q * f, i.u, it) || 0; grains[it.id] = grains[it.id] || { q: 0, days: new Set() }; grains[it.id].q += b; grains[it.id].days.add(day); }
      if (['cheddar', 'mozzarella', 'parmesan'].includes(it.id) && /grat/i.test((r.steps || []).join(' ') + i.raw)) { const b = C.toBase(i.q * f, i.u, it) || 0; grate[it.id] = (grate[it.id] || 0) + b; }
    }
    if (/marinat|overnight/i.test((r.steps || []).join(' '))) marinate.push(`${r.title} (${day}): marinate the night before`);
  }
  const out = [];
  for (const [id, c] of Object.entries(chop)) if (c.days.size >= 2) out.push(`Chop ${id === 'garlic' ? Math.ceil(c.q) + ' cloves of garlic' : C.fmtQty(c.q, c.u === 'g' ? 'g' : '').trim() + ' ' + ITEM[id].n.toLowerCase()} for ${[...c.days].join(', ')}. Keeps 3 days in a tub in the fridge.`);
  for (const [id, g] of Object.entries(grains)) if (g.days.size >= 2) out.push(`Cook ${Math.round(g.q)} g ${ITEM[id].n.toLowerCase()} in one go for ${[...g.days].join(', ')}. Cool it quickly and keep it in the fridge for up to a day.`);
  for (const [id, q] of Object.entries(grate)) if (q >= 50) out.push(`Grate ${Math.round(q)} g ${ITEM[id].n.toLowerCase()} and keep it in a bag.`);
  return out.concat(marinate);
}

/* ================= Planner options (passed into suggestWeek) ================= */
export function plannerOptions(state, dates) {
  const L = learn(state), T = state.taste || {}, mb = monthBudget(state), budgetMode = mb && mb.tight;
  const mastered = masteredTypes(state), r0 = rut(state), costCache = {};
  const cost = r => costCache[r.id] ?? (costCache[r.id] = C.recipeCost(state, r, r.serves).perServe);
  return {
    budgetMode,
    servesFor: d => servesFor(state, d),
    filter: r => !(state.people && state.people.length) || !ruledOutFor(state, r),
    adjust: (r, d) => {
      const n = nightOf(state, d), wd = wdOf(d), pace = ((state.weekCheck || {})[weekKey(d)] || {}).pace || 'normal';
      const batch = C.isBatch(state, r), t = r.time || 40; let x = 1;
      if (n.mode === 'quick') x *= t <= 25 ? 2 : batch ? 0.25 : 0.12;
      if (n.mode === 'protein') { const p = C.proteinOf(r); x *= ['chicken', 'beef', 'pork', 'lamb', 'fish'].includes(p) ? 1.8 : 0.5; const nu = nutrition(state, r, r.serves); if (nu && nu.protein >= 30) x *= 1.4; }
      if (n.mode === 'cook') x *= (t >= 45 || batch || difficulty(r) > 7) ? 1.7 : 0.8;
      if (n.theme && THEMES[n.theme]) x *= THEMES[n.theme][1](r) ? 5 : 0.2;
      if (pace === 'busy' && wd < 5 && t > 30 && !batch) x *= 0.35;
      if (pace === 'relaxed' && t >= 45) x *= 1.3;
      if ((L.tired[wd] || 0) >= 2 && t > 30) x *= 0.5;
      if (kidsEating(state, d)) x *= kidFriendly(state, r) ? 1.7 : 0.45;
      if (L.effort) x *= (r.ings.length > 10 || (r.steps || []).length > 6) ? 1 / (1 + 0.35 * L.effort) : 1;
      const cheapW = (L.cheap || 0) + (budgetMode ? 3 : 0); if (cheapW) { const c = cost(r); x *= c <= 2 ? 1 + 0.15 * cheapW : c >= 3.5 ? 1 / (1 + 0.25 * cheapW) : 1; }
      x *= seasonBoost(r, d);
      if (r0 && C.proteinOf(r) === r0.protein) x *= 0.55;
      if ((wd >= 5 || n.mode === 'cook') && mastered.some(m => r.tags.includes(m.tag) && difficulty(r) > m.level)) x *= 1.4;
      x *= challengeAdjust(state, r);
      if (state.settings.health && T.moreVeg) { const v = new Set(r.ings.filter(i => ITEM[i.item] && ITEM[i.item].cat === 'veg').map(i => i.item)).size; x *= v >= 3 ? 1.4 : v <= 1 ? 0.7 : 1; }
      return x;
    }
  };
}

/* ================= Nutrition (rough, optional) ================= */
// kcal, protein: per 100 g/ml, or per piece for things counted in pieces
const NUT = {
  onion: [40, 1.1], 'red-onion': [40, 1.1], garlic: [4, 0.2], potato: [77, 2], 'sweet-potato': [86, 1.6], carrot: [41, 0.9], celery: [16, 0.7], pepper: [30, 1], courgette: [35, 2.5], broccoli: [34, 2.8], cauliflower: [150, 12], spinach: [23, 2.9], salad: [15, 1.2], tomato: [22, 1.1], 'cherry-tomato': [18, 0.9], cucumber: [45, 2], mushroom: [22, 3.1], leek: [61, 1.5], cabbage: [250, 13], 'green-beans': [31, 1.8], avocado: [240, 3], lemon: [17, 0.6], lime: [11, 0.3], ginger: [80, 1.8], chilli: [4, 0.2], 'spring-onion': [5, 0.3],
  bread: [80, 3], wraps: [190, 5], buns: [150, 5], naan: [260, 8], pitta: [165, 6], baguette: [700, 24],
  'chicken-breast': [120, 23], 'chicken-thigh': [180, 19], 'chicken-wings': [200, 18], 'whole-chicken': [190, 19], 'beef-mince': [250, 17], steak: [200, 26], 'diced-beef': [190, 22], 'beef-brisket': [250, 20], 'pork-chop': [230, 25], 'pork-mince': [260, 17], sausages: [180, 8], bacon: [270, 16], 'lamb-mince': [280, 17], lamb: [240, 21], ham: [110, 18], chorizo: [450, 24], salmon: [200, 20], 'white-fish': [85, 18], prawns: [70, 15], tuna: [110, 25], 'smoked-salmon': [180, 23], 'chicken-drum': [170, 18], 'turkey-mince': [150, 20], burgers: [250, 17], gammon: [160, 22], 'pork-belly': [500, 9], mackerel: [300, 19], pudding: [300, 10],
  milk: [50, 3.4], butter: [740, 0.6], cheddar: [415, 25], mozzarella: [250, 18], parmesan: [400, 33], feta: [265, 14], halloumi: [320, 21], cream: [200, 2.5], 'double-cream': [450, 1.7], 'creme-fraiche': [290, 2.4], yogurt: [60, 4], eggs: [75, 6.5], 'cream-cheese': [250, 6], tofu: [120, 13], 'fresh-pasta': [270, 11], coleslaw: [150, 1],
  pasta: [355, 12], spaghetti: [355, 12], rice: [350, 7], basmati: [350, 8], noodles: [340, 11], couscous: [360, 13], oats: [370, 13], flour: [340, 10], sugar: [400, 0], 'chopped-tomatoes': [21, 1.2], passata: [30, 1.4], 'tomato-puree': [80, 4], 'coconut-milk': [180, 1.5], stock: [15, 1], chickpeas: [115, 7], 'kidney-beans': [100, 7], 'baked-beans': [80, 4.7], lentils: [330, 24], sweetcorn: [80, 2.7], 'olive-oil': [820, 0], oil: [820, 0], honey: [330, 0], 'curry-paste': [180, 3], pesto: [450, 5], 'peanut-butter': [600, 25], peas: [70, 5.5], 'frozen-veg': [50, 3], chips: [160, 2.5], 'bbq-sauce': [170, 1], 'pasta-sauce': [60, 1.6], 'cooking-sauce': [90, 1.5], aubergine: [90, 4], beetroot: [43, 1.6], parsnip: [75, 1.2], butternut: [450, 10], kale: [35, 2.9], asparagus: [20, 2.2], 'sugar-snap': [40, 2.8], 'corn-cob': [100, 3.5], 'salad-veg': [15, 1], olives: [150, 1], gnocchi: [150, 3.5], lasagne: [350, 12], breadcrumbs: [380, 12], 'salmon-tin': [150, 21], hummus: [300, 7]
};
export function nutrition(state, r, serves) {
  if (!r || !r.ings) return null; let kcal = 0, protein = 0, known = 0, veg = 0;
  const f = (serves || r.serves) / r.serves;
  for (const i of C.withSubs(state, r.ings)) {
    const it = ITEM[i.item], n = it && NUT[it.id]; if (it && it.cat === 'veg') veg++;
    if (!n) continue; const b = C.toBase(i.q * f, i.u, it); if (!b) continue;
    const k = it.u === 'pc' ? b : b / 100; kcal += n[0] * k; protein += n[1] * k; known++;
  }
  if (!known) return null; const s = serves || r.serves;
  return { kcal: Math.round(kcal / s / 10) * 10, protein: Math.round(protein / s), veg };
}

/* ================= Cook mode helpers ================= */
export function timersIn(step) {
  const out = []; const re = /(\d+(?:[.,]\d+)?|½|one|two|three|four|five|ten|twenty|thirty)\s*(?:-|–|to)?\s*(\d+)?\s*(hours?|hrs?|minutes?|mins?)/gi; let m;
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, twenty: 20, thirty: 30, '½': 0.5 };
  while ((m = re.exec(step))) { const a = words[m[1].toLowerCase()] ?? parseFloat(m[1].replace(',', '.')); const v = m[2] ? +m[2] : a; const sec = /h/i.test(m[3]) ? v * 3600 : v * 60; if (sec > 0 && sec <= 12 * 3600) out.push({ label: m[0], sec }); }
  return out;
}

/* ================= Sharing ================= */
const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
export function shareRecipeLink(r, base) {
  const slim = { t: r.title, s: r.serves, m: r.time, a: r.area || '', c: r.cat || '', i: r.ings.map(i => i.raw || `${i.q} ${i.u} ${i.name}`), p: r.steps, g: r.img && /^https?:/.test(r.img) ? r.img : undefined };
  return base.replace(/#.*$/, '') + '#import=' + b64(JSON.stringify(slim));
}
export function readShareLink(hash) {
  const m = /#import=([A-Za-z0-9_-]+)/.exec(hash || ''); if (!m) return null;
  try { const o = JSON.parse(unb64(m[1])); return C.makeOwnRecipe({ title: o.t, serves: o.s, time: o.m, ingText: o.i.join('\n'), stepText: o.p.join('\n'), cat: o.c, img: o.g }); } catch (e) { return null; }
}
export function planText(state, dates) {
  const all = C.allRecipes(state); const lines = [];
  for (const d of dates) { const es = state.plan[d] || []; const n = nightOf(state, d); lines.push(`${DOW[wdOf(d)]}: ${es.length ? es.map(e => (all[e.rid] || {}).title + (e.leftover ? ' (leftovers)' : e.fromFreezer ? ' (from freezer)' : '')).join(', ') : n.mode === 'takeaway' ? 'Takeaway' : '–'}`); }
  return 'Our dinners this week\n' + lines.join('\n');
}

/* ================= Import a recipe from a web page ================= */
const isoMin = s => { const m = /P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i.exec(s || ''); return m ? (+m[1] || 0) * 60 + (+m[2] || 0) : 0; };
export function recipeFromHTML(html, url) {
  const blocks = [...String(html).matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const find = o => { if (!o || typeof o !== 'object') return null; if (Array.isArray(o)) { for (const x of o) { const f = find(x); if (f) return f; } return null; } const t = o['@type']; if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return o; return find(o['@graph']) || null; };
  for (const b of blocks) {
    let o; try { o = JSON.parse(b.trim()); } catch (e) { continue; }
    const r = find(o); if (!r) continue;
    const steps = [].concat(r.recipeInstructions || []).flatMap(x => typeof x === 'string' ? x.split(/\n+/) : x.itemListElement ? x.itemListElement.map(y => y.text || y.name) : [x.text || x.name]).map(s => String(s || '').replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    const yieldN = parseInt([].concat(r.recipeYield || [])[0]) || 4;
    const img = [].concat(r.image || [])[0]; const imgUrl = typeof img === 'string' ? img : img && img.url;
    const time = isoMin(r.totalTime) || isoMin(r.cookTime) + isoMin(r.prepTime) || 40;
    const ings = [].concat(r.recipeIngredient || []).map(s => String(s).replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    return C.makeOwnRecipe({ title: String(r.name || 'Imported recipe').trim(), serves: yieldN, time, ingText: ings.join('\n'), stepText: steps.join('\n'), cat: [].concat(r.recipeCategory || [])[0] || '', img: imgUrl });
  }
  return null;
}
export async function importFromURL(url) {
  let res; try { res = await fetch(url, { headers: { Accept: 'text/html' } }); } catch (e) { const err = new Error('blocked'); err.blocked = true; throw err; }
  if (!res.ok) throw new Error('The page said ' + res.status);
  const html = await res.text(); const r = recipeFromHTML(html, url);
  if (!r) throw new Error("Couldn't find a recipe on that page");
  r.url = url; return r;
}

/* ================= Fridge photo (optional AI) ================= */
export async function aiFridge(provider, dataUrl) {
  if (provider !== 'puter') throw new Error('Turn on Puter AI first');
  if (!self.puter) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://js.puter.com/v2/'; s.onload = res; s.onerror = () => rej(new Error('Could not load Puter')); document.head.appendChild(s); });
  const prompt = 'List the food items you can see in this photo of a fridge or cupboard. Reply with JSON only: {"items":[{"name":"...","qty":number,"unit":"g|ml|pc"}]}. Use simple names like "milk", "eggs", "cheddar", "chicken breast".';
  const resp = await self.puter.ai.chat(prompt, dataUrl);
  const text = typeof resp === 'string' ? resp : (resp && (resp.message && (resp.message.content && (resp.message.content[0] && resp.message.content[0].text || resp.message.content)) || resp.text)) || String(resp);
  const m = /\{[\s\S]*\}/.exec(String(text)); if (!m) throw new Error('No items found');
  const j = JSON.parse(m[0]); return (j.items || []).map(x => ({ name: x.name, qty: +x.qty || 1, unit: x.unit || 'pc', item: C.matchIngredient(x.name) }));
}

export { wdOf, DOW, learn };

/* ================= Throw it together (freestyle cooking from what you have) ================= */
const CARBS = { pasta: 'pasta', spaghetti: 'pasta', 'fresh-pasta': 'pasta', gnocchi: 'pasta', rice: 'rice', basmati: 'rice', noodles: 'noodles', couscous: 'grains', grains: 'grains', potato: 'potato', 'sweet-potato': 'potato', chips: 'potato', 'hash-browns': 'potato', wraps: 'wraps', pitta: 'wraps', naan: 'wraps', bread: 'bread', baguette: 'bread', buns: 'bread', 'soda-bread': 'bread', 'pizza-dough': 'wraps' };
const HARD = new Set(['carrot', 'potato', 'sweet-potato', 'butternut', 'parsnip', 'beetroot', 'cauliflower', 'broccoli', 'onion', 'red-onion', 'leek', 'celery', 'cabbage']);
const LEAFY = new Set(['spinach', 'kale', 'salad', 'salad-veg']);
const LEGUMES = new Set(['chickpeas', 'kidney-beans', 'lentils', 'baked-beans', 'tofu']);
const roleOf = id => { const it = ITEM[id]; if (!it) return 'other'; if (CARBS[id]) return 'carb'; if (id === 'eggs') return 'egg'; if (LEGUMES.has(id)) return 'protein'; if (it.tags.some(t => t.startsWith('p:')) && it.cat !== 'veg') return 'protein'; if (it.cat === 'veg') return LEAFY.has(id) ? 'leafy' : HARD.has(id) ? 'hard' : 'soft'; if (it.cat === 'dairy') return 'dairy'; if (it.cat === 'sauce' || ['chopped-tomatoes', 'passata', 'coconut-milk', 'pesto', 'curry-paste', 'pasta-sauce', 'cooking-sauce', 'stock'].includes(id)) return 'sauce'; return 'other'; };
// Flavour kits: a few cupboard things that make anything taste like a dish
const KITS = {
  asian: ['Soy, garlic & ginger', ['soy-sauce', 'garlic', 'ginger', 'honey', 'sweet-chilli', 'oyster-sauce', 'spring-onion'], 'a splash of soy, a squeeze of honey, garlic and ginger'],
  smoky: ['Smoky paprika', ['paprika', 'cumin', 'garlic', 'bbq-sauce', 'chorizo'], 'smoked paprika, a pinch of cumin and garlic'],
  italian: ['Garlic, tomato & herbs', ['chopped-tomatoes', 'passata', 'garlic', 'oregano', 'basil', 'parmesan', 'pesto', 'olive-oil'], 'garlic, a tin of tomatoes and dried oregano'],
  creamy: ['Creamy garlic', ['cream', 'creme-fraiche', 'cream-cheese', 'garlic', 'parmesan', 'mustard', 'stock'], 'garlic, a splash of cream and a spoon of mustard'],
  curry: ['Curry', ['curry-paste', 'curry-powder', 'coconut-milk', 'chopped-tomatoes', 'garlic', 'ginger', 'cumin'], 'curry paste or powder, then coconut milk or a tin of tomatoes'],
  lemon: ['Lemon & herb', ['lemon', 'parsley', 'thyme', 'rosemary', 'garlic', 'olive-oil', 'feta'], 'lemon juice and zest, garlic and herbs'],
  mexican: ['Mexican-ish', ['chilli-powder', 'cumin', 'paprika', 'lime', 'salsa', 'kidney-beans', 'cheddar', 'coriander'], 'chilli powder, cumin and a squeeze of lime']
};
const METHODS = [
  { id: 'stirfry', n: 'Stir-fry', need: s => s.veg + s.protein >= 2, carbs: ['noodles', 'rice'], kits: ['asian', 'curry'], time: 20,
    steps: (x) => [`Slice everything thinly. ${x.carb ? `Get the ${x.carbName} cooking first.` : ''}`, x.protein.length ? `Fry the ${x.protein.join(' and ')} in a very hot pan with a little oil until browned, then lift out.` : null, x.hard.length ? `Fry the ${x.hard.join(', ')} for 4 minutes.` : null, x.soft.length ? `Add the ${x.soft.join(', ')} for 2 minutes.` : null, `Return everything${x.protein.length ? '' : ''}, add ${x.kitText} and toss for a minute.${x.leafy.length ? ` Wilt in the ${x.leafy.join(', ')} at the end.` : ''}`, x.carb ? `Toss through the ${x.carbName} or serve on top.` : 'Serve with rice or noodles if you have them.'] },
  { id: 'traybake', n: 'Traybake', need: s => s.protein + s.hard >= 2 || s.hard >= 3, carbs: ['potato'], kits: ['smoky', 'lemon'], time: 45,
    steps: (x) => ['Heat the oven to 200°C.', `Chop the ${[...x.hard, ...(x.carb === 'potato' ? [x.carbName] : [])].join(', ') || 'veg'} into chunks, toss with oil, salt and ${x.kitText}. Roast 20 minutes.`, x.protein.length ? `Add the ${x.protein.join(' and ')} and roast another 20–25 minutes until cooked through.` : null, x.soft.length ? `Add the ${x.soft.join(', ')} for the last 10 minutes.` : null, x.dairy.length ? `Finish with the ${x.dairy.join(', ')}.` : null] },
  { id: 'pasta', n: 'Pasta toss', need: (s, has) => has('pasta'), carbs: ['pasta'], kits: ['italian', 'creamy', 'lemon'], time: 20,
    steps: (x) => [`Boil the ${x.carbName}. Keep a mug of the water.`, x.protein.length ? `Fry the ${x.protein.join(' and ')} until golden.` : null, (x.hard.length || x.soft.length) ? `Add the ${[...x.hard, ...x.soft].join(', ')} and cook 5 minutes.` : null, `Add ${x.kitText} and simmer a few minutes.${x.leafy.length ? ` Stir in the ${x.leafy.join(', ')}.` : ''}`, `Toss with the pasta and a splash of the water until glossy.${x.dairy.length ? ` Top with ${x.dairy.join(', ')}.` : ''}`] },
  { id: 'onepot', n: 'One-pot stew', need: s => s.protein >= 1 && (s.veg >= 2 || s.sauce.length > 0), carbs: ['rice', 'potato', 'bread'], kits: ['curry', 'smoky', 'italian'], time: 40,
    steps: (x) => [`Soften ${x.hard.includes('onion') ? 'the onion' : 'some onion if you have it'} in a big pan.`, x.protein.length ? `Add the ${x.protein.join(' and ')} and brown.` : null, `Add the ${[...x.hard.filter(h => h !== 'onion'), ...x.soft].join(', ') || 'veg'}, then ${x.kitText} and enough stock or water to almost cover.`, 'Simmer 25 minutes until thick and tender.', x.leafy.length ? `Stir in the ${x.leafy.join(', ')}.` : null, x.carb ? `Serve with the ${x.carbName}.` : 'Serve with bread, rice or a jacket potato.'] },
  { id: 'friedrice', n: 'Fried rice', need: (s, has) => has('rice'), carbs: ['rice'], kits: ['asian', 'curry'], time: 15,
    steps: (x) => ['Best with cold, cooked rice. If yours is raw, cook it and spread it out to cool.', `Fry the ${[...x.protein, ...x.hard, ...x.soft].join(', ') || 'veg'} in a hot pan.`, 'Add the rice and fry until it starts to crisp.', x.egg ? 'Push to one side, scramble the eggs, then mix through.' : null, `Season with ${x.kitText}.${x.leafy.length ? ` Toss in the ${x.leafy.join(', ')}.` : ''}`] },
  { id: 'omelette', n: 'Frittata', need: s => s.egg, carbs: ['potato', 'bread'], kits: ['lemon', 'smoky'], time: 20,
    steps: (x) => [`Fry the ${[...x.protein, ...x.hard, ...x.soft].join(', ') || 'veg'} in an ovenproof pan until soft.`, `Beat 2–3 eggs per person with salt, pepper and ${x.kitText}${x.dairy.length ? ` and the ${x.dairy.join(', ')}` : ''}.`, 'Pour over, cook on low for 5 minutes, then finish under the grill until set.', x.leafy.length ? `Serve with the ${x.leafy.join(', ')} on the side.` : 'Serve with toast or salad.'] },
  { id: 'wraps', n: 'Wraps or quesadillas', need: (s, has) => has('wraps'), carbs: ['wraps'], kits: ['mexican', 'smoky'], time: 20,
    steps: (x) => [x.protein.length ? `Fry the ${x.protein.join(' and ')} with ${x.kitText}.` : `Fry the veg with ${x.kitText}.`, (x.hard.length || x.soft.length) ? `Add the ${[...x.hard, ...x.soft].join(', ')} for 4 minutes.` : null, `Fill the ${x.carbName}${x.dairy.length ? ` with ${x.dairy.join(', ')}` : ''}${x.leafy.length ? ` and ${x.leafy.join(', ')}` : ''}.`, 'Eat as wraps, or fold and dry-fry 2 minutes a side for quesadillas.'] },
  { id: 'soup', n: 'Soup', need: s => s.veg >= 3, carbs: ['bread'], kits: ['curry', 'italian', 'lemon'], time: 35,
    steps: (x) => [`Chop the ${[...x.hard, ...x.soft].join(', ')}.`, 'Soften in a big pan with a little butter or oil for 8 minutes.', `Add ${x.kitText} and stock to cover by 2 cm. Simmer 20 minutes.`, x.leafy.length ? `Add the ${x.leafy.join(', ')} for the last minute.` : null, `Blend or leave chunky.${x.dairy.length ? ` Swirl in the ${x.dairy.join(', ')}.` : ''} Serve with bread.`] },
  { id: 'hash', n: 'Hash', need: (s, has) => has('potato') && s.protein + s.veg >= 2, carbs: ['potato'], kits: ['smoky', 'lemon'], time: 30,
    steps: (x) => [`Dice the ${x.carbName} small and boil 5 minutes, then drain.`, `Fry in a wide pan until crisp, adding the ${[...x.protein, ...x.hard, ...x.soft].join(', ')}.`, `Season with ${x.kitText}.`, x.egg ? 'Make dips and crack in the eggs. Cover until set.' : 'Top with a fried egg if you have one.'] },
  { id: 'bowl', n: 'Big bowl', need: (s, has) => (has('grains') || has('rice')) && s.veg >= 2, carbs: ['grains', 'rice'], kits: ['lemon', 'asian', 'mexican'], time: 25,
    steps: (x) => [`Cook the ${x.carbName}.`, x.protein.length ? `Cook the ${x.protein.join(' and ')} however you like.` : null, `Roast or fry the ${[...x.hard, ...x.soft].join(', ')}.`, `Make a dressing: oil plus ${x.kitText}.`, `Pile it all into bowls${x.leafy.length ? ` on the ${x.leafy.join(', ')}` : ''}${x.dairy.length ? ` with ${x.dairy.join(', ')}` : ''}.`] }
];
const PER_PERSON = { protein: 150, carb: { pasta: 90, rice: 75, noodles: 75, grains: 70, potato: 250, wraps: 2, bread: 2 }, veg: 120 };
export function freestyle(state, ids, opts = {}) {
  const have = [...new Set(ids)].filter(id => ITEM[id] && C.likeOf(state, { item: id, name: ITEM[id].n }) > -1);
  const by = { protein: [], carb: [], hard: [], soft: [], leafy: [], dairy: [], sauce: [], egg: [], other: [] };
  for (const id of have) by[roleOf(id)].push(id);
  const carbTypes = new Set(by.carb.map(c => CARBS[c]));
  const spuds = by.carb.filter(c => CARBS[c] === 'potato' && c !== 'chips' && c !== 'hash-browns');
  const s = { protein: by.protein.length, veg: by.hard.length + by.soft.length + by.leafy.length + spuds.length, hard: by.hard.length + spuds.length, egg: by.egg.length > 0, carbType: null, sauce: by.sauce };
  const has = t => carbTypes.has(t);
  const owned = new Set(have.concat(state.pantry.map(p => p.item).filter(Boolean)));
  const spice = (state.taste || {}).spice;
  const out = [];
  for (const m of METHODS) {
    if (!m.need(s, has)) continue;
    // Pick the flavour kit you have the most of (and that suits your tastes)
    let best = null;
    for (const k of m.kits) { const [kn, items, text] = KITS[k]; let sc = items.filter(i => owned.has(i)).length + items.filter(i => by.sauce.includes(i)).length * 3 + Math.random() * 0.8 + (opts.kit === k ? 9 : 0); if (k === 'curry' || k === 'mexican') sc += spice === 0 ? -2 : spice >= 2 ? 0.5 : 0; if (!best || sc > best.sc) best = { k, kn, items, text, sc }; }
    const carbId = by.carb.find(c => m.carbs.includes(CARBS[c])) || null;
    const SHORT = { bacon: 'bacon', 'chicken-thigh': 'chicken', 'chicken-breast': 'chicken', 'chicken-drum': 'chicken', 'beef-mince': 'mince', 'turkey-mince': 'turkey mince', 'white-fish': 'fish', 'diced-beef': 'beef', 'frozen-veg': 'mixed veg' };
    const nm = id => SHORT[id] || ITEM[id].n.toLowerCase();
    const spudVeg = carbId && CARBS[carbId] === 'potato' ? [] : spuds.map(nm);
    const x = { protein: by.protein.map(nm), hard: by.hard.map(nm).concat(m.id === 'stirfry' ? [] : spudVeg), soft: by.soft.map(nm), leafy: by.leafy.map(nm), dairy: by.dairy.map(nm), egg: s.egg, carb: carbId, carbName: carbId ? nm(carbId) : '', kitText: best.text };
    let score = 2 + (carbId ? 1.5 : 0) + best.sc * 0.4 + Math.random();
    if (m.id === 'soup') score += !s.protein && s.veg >= 4 ? 2 : -0.5;
    if (m.id === 'onepot' && s.sauce.length) score += 1.5;
    if (m.id === 'stirfry' && !carbId && !has('noodles') && !has('rice')) score -= 1;
    const usedIds = [...new Set([...by.protein, ...by.hard, ...by.soft, ...by.leafy, ...by.dairy, ...by.sauce.filter(i => best.items.includes(i)), ...(s.egg ? ['eggs'] : []), ...(carbId ? [carbId] : []), ...(m.id === 'stirfry' ? [] : spuds)])];
    score += usedIds.length * 0.3;
    const missing = best.items.filter(i => !owned.has(i)).slice(0, 3);
    const main = [...new Set([...by.protein, ...(carbId && CARBS[carbId] === 'potato' ? [carbId] : []), ...by.hard.filter(h => !['onion', 'red-onion', 'garlic'].includes(h)), ...by.soft, ...by.leafy])].slice(0, 3).map(id => nm(id).replace(/(?<!s)s$/, '').replace(/oe$/, 'o'));
    const title = (main.length > 1 ? main.slice(0, -1).join(', ') + ' & ' + main[main.length - 1] : main[0] || 'Veg').replace(/^./, c => c.toUpperCase()) + ' ' + (m.id === 'onepot' ? { curry: 'curry', italian: 'tomato stew', smoky: 'smoky stew' }[best.k] || 'stew' : m.n.toLowerCase());
    out.push({ method: m.id, name: m.n, title, kit: best.kn, kitId: best.k, time: m.time, steps: m.steps(x).filter(Boolean), uses: usedIds, missing, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, opts.n || 3);
}
// Turn a freestyle idea into a loose recipe so it can go on the plan and the list
export function freestyleRecipe(state, idea, serves) {
  serves = serves || servesFor(state, C.today());
  const ings = idea.uses.map(id => { const it = ITEM[id], role = roleOf(id); let q, u = it.u === 'pc' ? '' : it.u;
    if (role === 'protein') q = PER_PERSON.protein * serves; else if (role === 'carb') { const c = PER_PERSON.carb[CARBS[id]] || 80; q = c * serves; if (c <= 2) u = ''; } else if (role === 'egg') { q = 2 * serves; u = ''; } else if (role === 'dairy') q = 30 * serves; else q = it.u === 'pc' ? Math.max(1, Math.round(serves / 2)) : PER_PERSON.veg * serves / Math.max(1, idea.uses.length - 2);
    if (it.u === 'pc' && u === '') q = Math.max(1, Math.round(q)); return { q: Math.round(q), u, name: it.n.toLowerCase(), item: id, raw: `${Math.round(q)} ${u} ${it.n.toLowerCase()}`.replace(/\s+/g, ' ') }; });
  const owned = new Set(state.pantry.map(p => p.item)); const kitItems = KITS[idea.kitId][1].filter(id => !idea.uses.includes(id) && ITEM[id]); for (const id of kitItems.filter(i => owned.has(i)).concat(kitItems.filter(i => !owned.has(i))).slice(0, 3)) ings.push({ q: 1, u: 'taste', name: ITEM[id].n.toLowerCase(), item: id, raw: ITEM[id].n.toLowerCase() });
  return C.normalizeRecipe({ id: 'f:' + Date.now().toString(36), src: 'freestyle', title: idea.title, serves, time: idea.time, cat: '', area: '', ings, steps: idea.steps });
}
