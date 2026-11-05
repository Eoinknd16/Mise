// Mise — UI layer. Plain ES modules, string templates, event delegation. No build step.
import * as C from './core.js';
import { SHOPS, AISLES, CATALOG, ITEM, B_PROTEIN, B_BASE, B_STYLE, B_VEG } from './data.js';

let S = null;               // persisted state
let R = {};                 // all recipes (built-in + saved), normalized
const ui = {
  route: 'plan', weekOffset: 0, listWeek: 0, recTab: 'all', recQuery: '', onlineCat: null, online: [], onlineLoading: false, onlineErr: '',
  builder: null, builderSpec: {}, builderOpts: { pantryFirst: false }, builderBusy: false, receiptDraft: null, ocr: null,
  sheetServes: null, sheetCtx: null, shopFilter: null, aiStatus: { chrome: false, puter: true }
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const save = () => { C.saveState(S); updateBadge(); };
const refreshRecipes = () => { R = C.allRecipes(S); };
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtDay = d => new Date(d + 'T12:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = d => new Date(d + 'T12:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
const ICON = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>',
  pot: '<svg viewBox="0 0 24 24"><path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20M9 6c0-1 1-2 3-2s3 1 3 2"/></svg>',
  box: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 10h16M9 6.5h2M9 14h2"/></svg>',
  receipt: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>'
};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); }
function thumb(r, cls = 'thumb') { return r && r.img ? `<img class="${cls}" src="${esc(r.img)}/preview" onerror="this.onerror=null;this.src='${esc(r.img)}'" alt="" loading="lazy">` : `<div class="${cls}">${esc((r && r.title || '?')[0])}</div>`; }
function fmtIng(q, u) {
  if (u === 'taste') return 'to taste';
  if (u === 'g' || u === 'ml') return C.fmtQty(q, u);
  const n = q >= 10 ? Math.round(q) : Math.round(q * 4) / 4;
  const s = n % 1 === 0 ? String(n) : (Math.floor(n) ? Math.floor(n) + ' ' : '') + ({ 0.25: '¼', 0.5: '½', 0.75: '¾' }[+(n % 1).toFixed(2)] || (n % 1).toFixed(2));
  return (s + ' ' + (u || '')).trim();
}
const stars = (n, act, key) => `<div class="stars" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${i <= n ? 'on' : ''}" data-act="${act}" data-key="${esc(key)}" data-val="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">★</button>`).join('')}</div>`;
const shopsOpts = sel => S.settings.shops.concat(SHOPS.filter(s => !S.settings.shops.includes(s))).map(s => `<option${s === sel ? ' selected' : ''}>${esc(s)}</option>`).join('');

/* ================= Router ================= */
const TITLES = { plan: 'This week', recipes: 'Recipes', list: 'Shopping list', pantry: 'Pantry', more: 'More', make: 'What can I make?', builder: 'Meal builder', receipts: 'Receipts', deals: 'Deals', insights: 'Spending', settings: 'Settings', install: 'Install' };
const TAB_OF = { make: 'pantry', builder: 'recipes', receipts: 'more', deals: 'more', insights: 'more', settings: 'more', install: 'more' };
function route() {
  const h = (location.hash || '#plan').slice(1);
  ui.route = TITLES[h] ? h : 'plan';
  const tab = TAB_OF[ui.route] || ui.route;
  document.querySelectorAll('.tabbar a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  render(true);
}
function render(scrollTop) {
  $('#viewTitle').textContent = ui.route === 'plan' ? (ui.weekOffset === 0 ? 'This week' : ui.weekOffset === 1 ? 'Next week' : ui.weekOffset === -1 ? 'Last week' : 'Week plan') : TITLES[ui.route];
  const v = VIEWS[ui.route] || VIEWS.plan;
  $('#view').innerHTML = v();
  if (scrollTop) window.scrollTo(0, 0);
}
function updateBadge() {
  try { const l = C.buildList(S, C.weekDates(0)); const n = l.rows.filter(r => !S.list.checked[r.key]).length; const b = $('#listBadge'); b.hidden = !n; b.textContent = n; } catch (e) { /* ignore */ }
}

/* ================= Plan ================= */
function viewPlan() {
  const dates = C.weekDates(ui.weekOffset), t = C.today();
  const list = C.buildList(S, dates);
  const planned = dates.filter(d => (S.plan[d] || []).length).length;
  const budget = S.settings.budget;
  let h = `<div class="weeknav"><button class="icon-btn" data-act="week" data-val="-1" aria-label="Previous week">${ICON.left}</button><div class="grow">${fmtShort(dates[0])} – ${fmtShort(dates[6])}</div><button class="icon-btn" data-act="week" data-val="1" aria-label="Next week">${ICON.right}</button></div>
  <div class="sum"><div><div class="k">Nights planned</div><div class="v">${planned}/7</div></div><div><div class="k">List estimate</div><div class="v">${C.eur(list.total)}</div></div><div><div class="k">Weekly budget</div><div class="v">${budget ? C.eur(budget) : '–'}</div></div></div>
  <div class="row"><button class="btn primary grow" data-act="suggest">${ICON.spark.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')} ${planned ? 'Fill empty nights' : 'Suggest my week'}</button><a class="btn" href="#list">List</a></div>`;
  for (const d of dates) {
    const entries = S.plan[d] || [], wd = DOW[(new Date(d + 'T12:00').getDay() + 6) % 7];
    const off = !S.settings.nights[DOW.indexOf(wd)];
    h += `<section class="day${d === t ? ' today' : ''}${off && !entries.length ? ' off' : ''}"><div class="day-h"><b>${wd} ${new Date(d + 'T12:00').getDate()}</b><span>${d === t ? 'Today' : off && !entries.length ? 'Night off' : ''}</span></div>`;
    entries.forEach((e, i) => {
      const r = R[e.rid];
      if (!r) return;
      h += `<div class="meal${e.cooked ? ' done' : ''}">
        <button class="grow row" style="border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit" data-act="openRecipe" data-key="${esc(e.rid)}" data-date="${d}" data-idx="${i}">${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${e.serves} serving${e.serves > 1 ? 's' : ''} · ${r.time} min${e.wildcard ? ' · <span class="tag wild">Wildcard</span>' : ''}${e.cooked ? ' · cooked' : ''}</div></div></button>
        <button class="icon-btn" data-act="${e.cooked ? 'uncook' : 'cook'}" data-date="${d}" data-idx="${i}" aria-label="${e.cooked ? 'Mark not cooked' : 'Mark cooked'}" style="${e.cooked ? 'background:var(--accent);color:var(--accent-ink);border-color:var(--accent)' : ''}">${ICON.check}</button></div>`;
    });
    h += `<button class="addmeal" data-act="addMeal" data-date="${d}">+ Add ${entries.length ? 'another' : 'a'} meal</button></section>`;
  }
  return h;
}

/* ================= Recipes ================= */
function viewRecipes() {
  const tab = ui.recTab;
  let h = `<div class="seg" role="group">${[['all', 'All'], ['mine', 'Mine'], ['online', 'Online']].map(([k, n]) => `<button data-act="recTab" data-val="${k}" aria-pressed="${tab === k}">${n}</button>`).join('')}</div>
  <a class="cta" href="#builder">${ICON.pot}<div><b>Build a meal</b><span>Describe what you fancy and get a recipe, list and method.</span></div></a>
  <input type="search" id="recSearch" placeholder="${tab === 'online' ? 'Search online recipes, then press Enter' : 'Search by name or ingredient'}" value="${esc(ui.recQuery)}" data-in="recQuery" enterkeyhint="search">`;
  if (tab === 'online') {
    h += `<div class="chips">${C.MDB_CATEGORIES.map(c => `<button class="chip" data-act="mdbCat" data-val="${c}" aria-pressed="${ui.onlineCat === c}">${c}</button>`).join('')}<button class="chip" data-act="mdbRandom">Random</button></div>`;
    if (ui.onlineLoading) h += `<div class="empty"><span class="spinner"></span></div>`;
    else if (ui.onlineErr) h += `<div class="empty"><h3>Couldn't reach the recipe library</h3><p>${esc(ui.onlineErr)} Check your connection and try again.</p></div>`;
    else if (!ui.online.length) h += `<div class="empty"><h3>Thousands of free recipes</h3><p>Pick a category or search. Recipes come from TheMealDB; anything you add to your plan is saved for offline use.</p></div>`;
    else h += `<div class="rlist">${ui.online.map(card).join('')}</div>`;
    h += `<p class="tiny muted">Recipe library: <a href="https://www.themealdb.com" target="_blank" rel="noopener">TheMealDB</a>.</p>`;
    return h;
  }
  const q = ui.recQuery.toLowerCase().trim();
  let list = Object.values(R).filter(r => tab === 'all' || !String(r.id).startsWith('b:'));
  if (q) list = list.filter(r => r.title.toLowerCase().includes(q) || r.ings.some(i => i.name.toLowerCase().includes(q)) || (r.area || '').toLowerCase().includes(q));
  list.sort((a, b) => C.prefScore(S, b) - C.prefScore(S, a) || a.title.localeCompare(b.title));
  if (!list.length) return h + (tab === 'mine' ? `<div class="empty"><h3>No saved recipes yet</h3><p>Build a meal, or add online recipes to your plan, and they'll show here.</p></div>` : `<div class="empty"><h3>Nothing matches</h3><p>Try the Online tab for more.</p></div>`);
  return h + `<div class="rlist">${list.map(card).join('')}</div>`;
}
function card(r) {
  const rt = S.ratings[r.id];
  return `<button class="rcard" data-act="openRecipe" data-key="${esc(r.id)}"><div class="img">${r.img ? `<img src="${esc(r.img)}/preview" onerror="this.onerror=null;this.src='${esc(r.img)}'" alt="" loading="lazy">` : esc(r.title[0])}</div><div class="b"><div class="t">${esc(r.title)}</div><div class="tiny muted">${r.stub ? (r.cat || 'Online') : `${r.time} min · ${esc(r.area || r.cat || '')}`}${rt && rt.r ? ' · ' + '★'.repeat(rt.r) : ''}</div></div></button>`;
}
async function getRecipe(id) {
  if (R[id]) return R[id];
  const found = ui.online.find(x => x.id === id && !x.stub);
  if (found) return found;
  const r = await C.mdbLookup(S, id);
  if (!r) throw new Error('Recipe not found');
  return r;
}
async function openRecipe(id, ctx) {
  ui.sheetCtx = ctx || null;
  openSheet('<div class="empty"><span class="spinner"></span></div>');
  let r;
  try { r = await getRecipe(id); } catch (e) { setSheet(`<div class="empty"><h3>Couldn't load that recipe</h3><p>${esc(e.message)}</p></div>`); return; }
  ui.sheetRecipe = r;
  const entry = ctx ? (S.plan[ctx.date] || [])[ctx.idx] : null;
  ui.sheetServes = entry ? entry.serves : (ui.sheetServes && ui.sheetServesFor === id ? ui.sheetServes : S.settings.household || r.serves);
  ui.sheetServesFor = id;
  renderRecipeSheet();
}
function renderRecipeSheet() {
  const r = ui.sheetRecipe, ctx = ui.sheetCtx, serves = ui.sheetServes, f = serves / r.serves;
  const cost = C.recipeCost(S, r, serves), rt = S.ratings[r.id] || {};
  const saved = !!S.recipes[r.id] || String(r.id).startsWith('b:');
  const entry = ctx ? (S.plan[ctx.date] || [])[ctx.idx] : null;
  let h = r.img ? `<div class="hero"><img src="${esc(r.img)}" alt=""></div>` : '';
  h += `<h2>${esc(r.title)}</h2>
  <div class="row wrap small muted" style="gap:6px;margin:6px 0 10px"><span class="tag">${r.time} min</span>${r.area ? `<span class="tag">${esc(r.area)}</span>` : ''}${r.cat ? `<span class="tag">${esc(r.cat)}</span>` : ''}<span class="tag yours">≈ ${C.eur(cost.perServe)} a serving</span>${r.src === 'builder' ? '<span class="tag">Built by you</span>' : r.src === 'ai' ? '<span class="tag">AI recipe</span>' : r.src === 'mealdb' ? '<span class="tag">TheMealDB</span>' : ''}</div>
  <div class="row between"><div class="stepper"><button data-act="sheetServes" data-val="-1" aria-label="Fewer servings">−</button><span>${serves}</span><button data-act="sheetServes" data-val="1" aria-label="More servings">+</button></div><span class="small muted">servings · ${C.eur(cost.total)} total</span></div>`;
  if (entry) h += `<div class="row" style="margin-top:12px"><button class="btn ${entry.cooked ? '' : 'primary'} grow" data-act="${entry.cooked ? 'uncook' : 'cook'}" data-date="${ctx.date}" data-idx="${ctx.idx}">${entry.cooked ? 'Mark not cooked' : 'I cooked this'}</button><button class="btn" data-act="swap" data-date="${ctx.date}" data-idx="${ctx.idx}">Swap</button><button class="btn" data-act="removeMeal" data-date="${ctx.date}" data-idx="${ctx.idx}">Remove</button></div>`;
  else h += `<div style="margin-top:12px"><div class="small muted" style="margin-bottom:6px;font-weight:600">Add to ${ui.weekOffset === 1 ? 'next' : 'this'} week</div><div class="daypick">${C.weekDates(ui.weekOffset).map(d => { const n = (S.plan[d] || []).length; return `<button data-act="addToDay" data-date="${d}">${DOW[(new Date(d + 'T12:00').getDay() + 6) % 7]}<span>${n ? n + ' planned' : new Date(d + 'T12:00').getDate()}</span></button>`; }).join('')}</div></div>`;
  h += `<h3 style="margin:16px 0 4px">Ingredients</h3><ul class="ings">${r.ings.map(i => { const it = ITEM[i.item]; const b = it ? C.toBase(i.q * f, i.u, it) : null; const have = it && C.pantryQty(S, it.id) >= (b || 1) * 0.75; return `<li class="${have ? 'have' : ''}"><span class="q">${esc(fmtIng(i.q * f, i.u))}</span><span>${esc(i.name)}${it && it.staple ? ' <span class="tiny muted">(cupboard)</span>' : ''}</span></li>`; }).join('')}</ul>
  <h3 style="margin:16px 0 8px">Method</h3><ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
  <h3 style="margin:16px 0 4px">Your rating</h3>${stars(rt.r || 0, 'rateSheet', r.id)}<p class="tiny muted" style="margin:4px 0 0">Ratings teach Mise what you like. It still mixes in new things so you don't get stuck in a rut.</p>
  <div class="row wrap" style="margin-top:14px">${!saved ? `<button class="btn" data-act="saveRecipe">Save to my recipes</button>` : ''}${r.src !== 'builtin' && saved && !String(r.id).startsWith('b:') ? `<button class="btn" data-act="deleteRecipe" data-key="${esc(r.id)}">Delete recipe</button>` : ''}${r.url ? `<a class="btn ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Original source</a>` : ''}${r.video ? `<a class="btn ghost" href="${esc(r.video)}" target="_blank" rel="noopener">Video</a>` : ''}</div>`;
  setSheet(h);
}
function pickerSheet(date) {
  ui.pickDate = date; ui.pickQuery = '';
  renderPicker();
}
function renderPicker(keepFocus) {
  const q = (ui.pickQuery || '').toLowerCase();
  const all = Object.values(R).filter(r => !['Dessert', 'Starter', 'Side'].includes(r.cat));
  let list;
  if (q) list = all.filter(r => r.title.toLowerCase().includes(q) || r.ings.some(i => i.name.toLowerCase().includes(q)));
  else { const can = C.whatCanIMake(S).filter(x => x.cover >= 0.6).slice(0, 4).map(x => x.r.id); list = all.sort((a, b) => (can.includes(b.id) - can.includes(a.id)) || (C.prefScore(S, b) - C.prefScore(S, a))).slice(0, 30); }
  const body = `<h2>Add a meal · ${fmtDay(ui.pickDate)}</h2><input type="search" id="pickSearch" data-in="pickQuery" placeholder="Search your recipes" value="${esc(ui.pickQuery)}" style="margin:10px 0">
  <div class="row" style="margin-bottom:8px"><button class="btn sm grow" data-act="pickSuggest">Suggest one</button><a class="btn sm grow" href="#builder" data-act="closeSheet">Build a meal</a><button class="btn sm grow" data-act="pickOnline">Online</button></div>
  <div class="card flat">${list.map(r => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left;border-top:1px solid var(--line)" data-act="pickRecipe" data-key="${esc(r.id)}">${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${r.time} min · ${esc(r.area || r.cat || '')}</div></div></button>`).join('') || '<div class="empty">No matches.</div>'}</div>`;
  setSheet(body);
  if (keepFocus) { const i = $('#pickSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function addToPlan(rid, date, recipe) {
  const r = recipe || R[rid];
  if (r && !String(rid).startsWith('b:') && !S.recipes[rid]) { S.recipes[rid] = r; refreshRecipes(); }
  (S.plan[date] = S.plan[date] || []).push({ rid, serves: ui.sheetServes || S.settings.household || 2 });
  save();
}

/* ================= List ================= */
function viewList() {
  const dates = C.weekDates(ui.listWeek);
  const L = C.buildList(S, dates);
  const budget = S.settings.budget, done = L.rows.filter(r => S.list.checked[r.key]).length;
  const shops = [...new Set(L.rows.map(r => r.shop))];
  let h = `<div class="seg" role="group">${[[0, 'This week'], [1, 'Next week']].map(([k, n]) => `<button data-act="listWeek" data-val="${k}" aria-pressed="${ui.listWeek === k}">${n}</button>`).join('')}</div>
  <div class="card"><div class="row between"><div><div class="small muted">Estimated total</div><div style="font:700 26px var(--display)" class="num">${C.eur(L.total)}</div></div><div style="text-align:right"><div class="small muted">${done}/${L.rows.length} in the basket</div>${budget ? `<div class="small ${L.total > budget ? '' : 'muted'}" style="${L.total > budget ? 'color:var(--hot);font-weight:700' : ''}">${L.total > budget ? C.eur(L.total - budget) + ' over' : C.eur(budget - L.total) + ' under'} budget</div>` : ''}</div></div>
  ${budget ? `<div class="bar${L.total > budget ? ' over' : ''}"><i style="width:${Math.min(100, L.total / budget * 100)}%"></i></div>` : ''}
  <p class="tiny muted" style="margin:0">Prices tagged <span class="tag">est.</span> are rough guesses until you scan receipts; <span class="tag yours">yours</span> come from your own receipts; <span class="tag deal">deal</span> from deals you've saved.</p></div>
  <form class="row" data-form="addExtra"><input list="itemsList" id="extraName" placeholder="Add anything: milk, bin bags…" autocomplete="off" aria-label="Item to add"><button class="btn primary" type="submit">Add</button></form>`;
  if (shops.length > 1) h += `<div class="chips">${[null, ...shops].map(s => `<button class="chip" data-act="shopFilter" data-val="${esc(s || '')}" aria-pressed="${(ui.shopFilter || null) === s}">${s || 'All shops'}</button>`).join('')}</div>`;
  if (!L.rows.length && !L.staples.length) return h + `<div class="empty"><h3>Your list is empty</h3><p>Plan some dinners and the ingredients appear here, combined and rounded to real pack sizes.</p><a class="btn primary" href="#plan">Plan the week</a></div>`;
  for (const shop of shops) {
    if (ui.shopFilter && ui.shopFilter !== shop) continue;
    const rows = L.rows.filter(r => r.shop === shop);
    h += `<section class="card flat"><div class="shop-h"><b>${esc(shop)}</b><span class="num small muted">${C.eur(rows.reduce((a, r) => a + (r.cost || 0), 0))}</span></div>`;
    let aisle = null;
    for (const r of rows) {
      if (r.aisle !== aisle) { aisle = r.aisle; h += `<div class="aisle">${(AISLES.find(a => a[0] === aisle) || [, 'Other'])[1]}</div>`; }
      const on = !!S.list.checked[r.key];
      const detail = r.packs ? `Need ${C.fmtQty(r.need, r.unit)}${r.have > 0 ? ` (have ${C.fmtQty(r.have, r.unit)})` : ''} · buy ${C.packLabel(r)}` : (r.qty ? fmtIng(r.qty, r.unit) : '');
      h += `<div class="li${on ? ' on' : ''}" data-act="toggleItem" data-key="${esc(r.key)}" role="checkbox" aria-checked="${on}" tabindex="0"><span class="box"></span><div class="grow"><div class="n">${esc(r.name)} ${r.deal ? '<span class="tag deal">deal</span>' : ''}</div><div class="tiny muted">${esc(detail)}${r.from.length ? ' · ' + esc(r.from.slice(0, 2).join(', ')) + (r.from.length > 2 ? ' +' + (r.from.length - 2) : '') : ''}</div></div>
        <div class="price">${r.cost != null ? C.eur(r.cost) : ''}<div>${r.priceSrc === 'est' ? '<span class="tag">est.</span>' : r.priceSrc === 'yours' ? '<span class="tag yours">yours</span>' : r.priceSrc === 'deal' ? '<span class="tag deal">deal</span>' : ''}</div></div>
        <button class="icon-btn" data-act="itemMenu" data-key="${esc(r.key)}" aria-label="Options for ${esc(r.name)}" style="width:34px;height:34px">${ICON.more}</button></div>`;
    }
    h += `</section>`;
  }
  if (L.staples.length) h += `<section class="card"><h3>Check you have</h3><p class="small muted" style="margin:0">Cupboard basics your recipes use. Tap the ones you have.</p><div class="chips wrap">${L.staples.map(s => `<button class="chip" data-act="haveStaple" data-key="${s.item}">${esc(s.name)}</button>`).join('')}</div><button class="btn sm" data-act="stapleToList">Add the rest to the list</button></section>`;
  if (L.covered.length) h += `<details class="card"><summary><b>Already in your pantry (${L.covered.length})</b></summary><p class="small muted">${L.covered.map(c => esc(c.name)).join(', ')}</p></details>`;
  h += `<div class="row wrap"><button class="btn primary grow" data-act="doneShopping"${done ? '' : ' disabled'}>Done: move ticked items to pantry</button></div>
  <div class="row wrap"><button class="btn grow" data-act="shareList">Share list</button><button class="btn grow" data-act="smarter">Smarter list from receipts</button>${done ? '<button class="btn grow" data-act="clearTicks">Clear ticks</button>' : ''}</div>`;
  return h;
}
function listText() {
  const L = C.buildList(S, C.weekDates(ui.listWeek));
  const out = []; let shop = null;
  for (const r of L.rows.filter(r => !S.list.checked[r.key])) { if (r.shop !== shop) { shop = r.shop; out.push('', shop.toUpperCase()); } out.push(`☐ ${r.name}${r.packs ? ' – ' + C.packLabel(r) : ''}`); }
  return ('Shopping list (Mise)\n' + out.join('\n')).trim();
}

/* ================= Pantry & what can I make ================= */
function viewPantry() {
  const t = C.today();
  const can = C.whatCanIMake(S);
  const ready = can.filter(x => x.cover >= 0.999).length;
  const items = S.pantry.slice().sort((a, b) => (a.exp || '9999').localeCompare(b.exp || '9999'));
  const soon = items.filter(p => p.exp && C.daysBetween(t, p.exp) <= 3);
  const longLife = items.filter(p => !soon.includes(p) && (!p.exp || C.daysBetween(t, p.exp) > 60));
  const rest = items.filter(p => !soon.includes(p) && !longLife.includes(p));
  let h = `<a class="cta" href="#make">${ICON.pot}<div><b>What can I make?</b><span>${ready ? `${ready} recipe${ready > 1 ? 's' : ''} you can make right now` : 'Recipes ranked by what you already have'}${soon.length ? ` · ${soon.length} item${soon.length > 1 ? 's' : ''} to use soon` : ''}</span></div></a>
  <form class="row" data-form="addPantry"><input list="itemsList" id="pantryName" placeholder="Add an item you have" autocomplete="off" aria-label="Pantry item"><button class="btn primary" type="submit">Add</button></form>
  <p class="tiny muted" style="margin:-4px 0 0">Scanning a receipt fills this in for you. Use-by dates are estimates from typical shelf life.</p>`;
  if (!items.length) return h + `<div class="empty"><h3>Nothing tracked yet</h3><p>Scan a receipt, tick off your shopping list, or add items here.</p><a class="btn" href="#receipts">Scan a receipt</a></div>`;
  const sec = (title, arr) => arr.length ? `<section class="card flat"><div class="shop-h"><b>${title}</b><span class="small muted">${arr.length}</span></div>${arr.map(p => { const d = p.exp ? C.daysBetween(t, p.exp) : null; const cls = d == null ? 'none' : d < 0 ? 'hot' : d <= 3 ? 'warn' : ''; return `<div class="pi" data-act="pantryItem" data-key="${p.key}" style="cursor:pointer"><span class="dot ${cls}"></span><div class="grow"><div style="font-weight:700">${esc(p.name)}</div><div class="tiny muted">${p.item ? C.fmtQty(p.qty, p.unit) : ''}${d != null ? ` · ${d < 0 ? 'past its date' : d === 0 ? 'use today' : d === 1 ? '1 day left' : d > 60 ? 'keeps for ages' : d + ' days left'}` : ''}</div></div><span class="small muted">›</span></div>`; }).join('')}</section>` : '';
  return h + sec('Use soon', soon) + sec('In the fridge & cupboard', rest) + sec('Long-life', longLife);
}
function viewMake() {
  const can = C.whatCanIMake(S).slice(0, 30);
  if (!can.length) return `<div class="empty"><h3>Your pantry is empty</h3><p>Add what you have, or scan a receipt, and Mise will rank recipes you can make with it.</p><a class="btn primary" href="#pantry">Go to pantry</a></div>`;
  return `<p class="small muted" style="margin:0">Ranked by how much you already have. Recipes using food close to its date come first.</p>` + can.map(x => `<div class="card"><button class="row" style="border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit" data-act="openRecipe" data-key="${esc(x.r.id)}">${thumb(x.r)}<div class="grow"><div style="font-weight:700">${esc(x.r.title)}</div><div class="small muted">${Math.round(x.cover * 100)}% in stock${x.usesExp ? ' · <span class="tag warn">uses food to use soon</span>' : ''}</div></div></button>
    <div class="bar"><i style="width:${x.cover * 100}%"></i></div>${x.missing.length ? `<div class="row between"><span class="small muted grow">Missing: ${esc(x.missing.join(', '))}</span><button class="btn sm" data-act="addMissing" data-key="${esc(x.r.id)}">Add to list</button></div>` : '<span class="small" style="color:var(--accent);font-weight:700">You have everything.</span>'}</div>`).join('');
}

/* ================= More ================= */
function viewMore() {
  const tiles = [['#receipts', ICON.receipt, 'Receipts', 'Scan what you bought. Get prices, a pantry update and an honest review.'], ['#builder', ICON.pot, 'Meal builder', 'Describe a meal and tweak it until it is right.'], ['#deals', ICON.tag, 'Deals', 'Save offers you spot and plan meals around them.'], ['#insights', ICON.chart, 'Spending', 'Weekly spend, where it goes, what gets binned.'], ['#settings', ICON.gear, 'Settings', 'Household, shops, budget, AI, backup.'], ['#install', ICON.phone, 'Install the app', 'Put Mise on your home screen or install the Android app.']];
  return `<div class="more-grid">${tiles.map(t => `<a href="${t[0]}">${t[1]}<b>${t[2]}</b><span>${t[3]}</span></a>`).join('')}</div><p class="tiny muted">Mise keeps everything on this device. Nothing is uploaded unless you turn on a cloud AI option.</p>`;
}
function viewInstall() {
  return `<div class="card"><h2>Android</h2><p style="margin:0">Install the APK from the GitHub releases page, or in Chrome tap <b>⋮ → Install app</b> (or <b>Add to Home screen</b>) on this page.</p></div>
  <div class="card"><h2>iPhone</h2><p style="margin:0">Open this page in Safari, tap <b>Share → Add to Home Screen</b>. It works offline and opens full screen.</p></div>
  <div class="card"><h3>Your data</h3><p class="small muted" style="margin:0">Everything is stored on this device. Use <a href="#settings">Settings → Back up</a> to move it to another phone.</p></div>`;
}

/* ================= Receipts ================= */
function viewReceipts() {
  if (ui.receiptDraft) return viewReceiptDraft();
  let h = `<div class="card"><h2>Add a receipt</h2>
    <div class="row"><label class="f grow">Shop<select id="rcShop">${shopsOpts(S.settings.defaultShop)}</select></label><label class="f grow">Date<input type="date" id="rcDate" value="${C.today()}"></label></div>
    <div class="row"><label class="btn primary grow" for="rcFile">Take a photo</label><label class="btn grow" for="rcPick">Choose screenshot</label></div>
    <input type="file" id="rcFile" accept="image/*" capture="environment" hidden data-change="receiptFile"><input type="file" id="rcPick" accept="image/*" hidden data-change="receiptFile">
    <button class="btn block" data-act="pasteReceipt">Paste receipt text</button>
    ${ui.ocr ? `<div class="row small"><span class="spinner"></span><span>${esc(ui.ocr)}</span></div>` : ''}
    <p class="tiny muted" style="margin:0">Tip: a screenshot of a Lidl Plus digital receipt reads much better than a crumpled paper one. Reading happens on your phone; the photo isn't uploaded anywhere (the reader itself downloads once, about 10 MB).</p></div>`;
  if (!S.receipts.length) return h + `<div class="empty"><h3>No receipts yet</h3><p>Each receipt teaches Mise your real prices, fills your pantry and earns you a review of your shop.</p></div>`;
  h += `<section class="card flat"><div class="shop-h"><b>History</b><span class="small muted">${S.receipts.length}</span></div>${S.receipts.slice(0, 30).map(r => `<div class="pi" data-act="reviewReceipt" data-key="${r.id}" style="cursor:pointer"><div class="grow"><div style="font-weight:700">${esc(r.shop)} · ${fmtDay(r.date)}</div><div class="tiny muted">${r.lines.length} items</div></div><b class="num">${C.eur(r.total)}</b><span class="small muted">›</span></div>`).join('')}</section>`;
  return h;
}
function viewReceiptDraft() {
  const d = ui.receiptDraft;
  const included = d.lines.filter(l => l.include);
  const sum = included.reduce((a, l) => a + (+l.price || 0), 0);
  const opts = sel => `<option value="">Not on the list / skip match</option>` + CATALOG.slice().sort((a, b) => a.n.localeCompare(b.n)).map(i => `<option value="${i.id}"${i.id === sel ? ' selected' : ''}>${esc(i.n)}</option>`).join('');
  return `<div class="card"><h2>Check the items</h2><p class="small muted" style="margin:0">Mise guessed each line. Fix any that are wrong: it remembers your corrections for next time. Untick lines that aren't items.</p>
  <div class="row small"><b>${esc(d.shop)}</b><span class="muted">· ${fmtDay(d.date)}</span></div>
  <div>${d.lines.map((l, i) => `<div class="rl"><input type="checkbox" data-change="rcInclude" data-idx="${i}"${l.include ? ' checked' : ''} aria-label="Include line"><div><div class="src">${esc(l.text)}${l.qty > 1 ? ' ×' + l.qty : ''}</div><select data-change="rcItem" data-idx="${i}" aria-label="What is this?">${opts(l.item)}</select></div><input type="number" inputmode="decimal" step="0.01" value="${l.price}" data-change="rcPrice" data-idx="${i}" aria-label="Price"></div>`).join('')}</div>
  <div class="row between"><span class="small muted">Items add up to</span><b class="num">${C.eur(sum)}</b></div>
  ${d.total != null && Math.abs(d.total - sum) > 0.05 ? `<div class="tag warn" style="white-space:normal;padding:8px">Receipt total says ${C.eur(d.total)}. ${C.eur(Math.abs(d.total - sum))} difference: a line may have been misread.</div>` : ''}
  <button class="btn" data-act="rcAddLine">+ Add a missed line</button>
  <div class="row"><button class="btn grow" data-act="rcCancel">Cancel</button><button class="btn primary grow" data-act="rcSave">Save receipt</button></div></div>`;
}
async function readReceiptImage(file) {
  ui.ocr = 'Loading the text reader…'; render();
  try {
    if (!self.Tesseract) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = res; s.onerror = () => rej(new Error('Could not load the text reader. Are you online?')); document.head.appendChild(s); });
    const { data } = await self.Tesseract.recognize(file, 'eng', { logger: m => { if (m.status === 'recognizing text') { ui.ocr = `Reading receipt… ${Math.round(m.progress * 100)}%`; const el = document.querySelector('.spinner + span'); if (el) el.textContent = ui.ocr; } } });
    ui.ocr = null; startDraft(data.text);
  } catch (e) { ui.ocr = null; render(); toast(e.message || 'Could not read that photo'); }
}
function startDraft(text) {
  const p = C.parseReceipt(text);
  const shop = ($('#rcShop') || {}).value || S.settings.defaultShop, date = ($('#rcDate') || {}).value || C.today();
  if (!p.lines.length) { render(); toast("Couldn't find any items. Try a clearer photo, or paste the text."); return; }
  ui.receiptDraft = { shop, date, total: p.total, lines: p.lines.map(l => ({ ...l, item: C.matchReceipt(l.text, S.aliases), include: true })) };
  render(true);
}
function showReview(rec) {
  const rv = C.reviewReceipt(S, rec);
  openSheet(`<h2>Your shop, reviewed</h2><p class="small muted" style="margin:4px 0 12px">${esc(rec.shop)} · ${fmtDay(rec.date)} · ${C.eur(rec.total)} · tone: ${esc(S.settings.tone)}</p>
    ${rv.roasts.length ? `<div class="roast">${rv.roasts.map(x => `<p>${esc(x)}</p>`).join('')}</div>` : ''}
    ${rv.praise.length ? `<div class="praise" style="margin-top:10px">${rv.praise.map(esc).join('<br>')}</div>` : ''}
    ${!rv.roasts.length && !rv.praise.length ? '<div class="praise">A sensible shop. Nothing to roast. Suspicious.</div>' : ''}
    <div class="sum" style="margin-top:12px"><div><div class="k">Fruit & veg</div><div class="v">${rv.m.vegN}</div></div><div><div class="k">Snacks</div><div class="v">${C.eur(rv.m.snack)}</div></div><div><div class="k">Ready meals</div><div class="v">${C.eur(rv.m.ready)}</div></div></div>
    <h3 style="margin:14px 0 6px">Tips</h3><ul class="tips">${rv.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="closeSheet">Close</button><button class="btn primary grow" data-act="smarter">Smarter list for next week</button></div>
    <p class="tiny muted">Change the tone (gentle, cheeky, savage) in Settings.</p>`);
}

/* ================= Builder ================= */
function sel(id, obj, cur, any = 'Any') { return `<select id="${id}" data-bspec="${id.replace('b-', '')}"><option value="">${any}</option>${Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(v.n)}</option>`).join('')}</select>`; }
function viewBuilder() {
  const sp = ui.builderSpec, b = ui.builder;
  const examples = ['Creamy chicken pasta for 4, no mushrooms', 'Quick spicy veggie noodles', 'Cheap healthy curry for 2', 'Steak and potatoes, Irish comfort food', 'Salmon with lemon, light, 25 minutes'];
  let h = `<div class="card"><h2>Describe it</h2>
    <textarea id="bDesc" data-in="bDesc" placeholder="e.g. Creamy chicken pasta for 4, spicy, under €12, no mushrooms">${esc(ui.bDesc || '')}</textarea>
    <div class="chips">${examples.map(e => `<button class="chip" data-act="bExample" data-val="${esc(e)}">${esc(e)}</button>`).join('')}</div>
    <details><summary class="small" style="font-weight:700;cursor:pointer">Or choose the parts</summary>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <label class="f">Protein${sel('b-protein', B_PROTEIN, sp.protein)}</label>
        <label class="f">Base${sel('b-base', B_BASE, sp.base)}</label>
        <label class="f">Flavour${sel('b-style', B_STYLE, sp.style)}</label>
        <label class="f">Serves<input type="number" id="b-serves" data-bspec="serves" min="1" max="12" value="${sp.serves || S.settings.household}"></label>
      </div>
      <div class="small muted" style="margin:10px 0 6px;font-weight:600">Veg</div><div class="chips wrap">${Object.keys(B_VEG).map(v => `<button class="chip" data-act="bVeg" data-val="${v}" aria-pressed="${(sp.veg || []).includes(v)}">${v}</button>`).join('')}</div>
      <div class="small muted" style="margin:10px 0 6px;font-weight:600">Heat</div><div class="seg">${[[0, 'Mild'], [1, 'Medium'], [2, 'Hot']].map(([k, n]) => `<button data-act="bSpicy" data-val="${k}" aria-pressed="${(sp.spicy ?? 1) === k}">${n}</button>`).join('')}</div>
    </details>
    <div class="chips wrap"><button class="chip" data-act="bOpt" data-val="pantryFirst" aria-pressed="${ui.builderOpts.pantryFirst}">Use what I have</button><button class="chip" data-act="bFlag" data-val="healthy" aria-pressed="${!!sp.healthy}">Healthier</button><button class="chip" data-act="bFlag" data-val="cheap" aria-pressed="${!!sp.cheap}">Cheaper</button><button class="chip" data-act="bFlag" data-val="diet" aria-pressed="${sp.diet === 'veg'}">Vegetarian</button></div>
    <div class="row"><button class="btn primary grow" data-act="bBuild">Create meal</button>${S.settings.ai !== 'off' ? `<button class="btn grow" data-act="bAI"${ui.builderBusy ? ' disabled' : ''}>${ui.builderBusy ? '<span class="spinner"></span>' : 'Write it with AI'}</button>` : ''}</div>
    ${S.settings.ai === 'off' ? '<p class="tiny muted" style="margin:0">Want more creative recipes? Turn on an AI option in <a href="#settings">Settings</a>. The builder works fully without it.</p>' : ''}</div>`;
  if (b) {
    const cost = C.recipeCost(S, b, b.serves);
    h += `<div class="card"><h2>${esc(b.title)}</h2><div class="row wrap" style="gap:6px"><span class="tag">${b.time} min</span><span class="tag">Serves ${b.serves}</span><span class="tag yours">≈ ${C.eur(cost.total)} · ${C.eur(cost.perServe)} each</span>${b.src === 'ai' ? '<span class="tag">AI</span>' : ''}</div>
      ${b.src !== 'ai' ? `<div class="small muted" style="font-weight:600">Tweak it</div><div class="chips">${Object.entries(C.TWEAKS).map(([k, [n]]) => `<button class="chip" data-act="bTweak" data-val="${k}">${n}</button>`).join('')}</div>` : ''}
      <ul class="ings">${b.ings.map(i => `<li><span class="q">${esc(fmtIng(i.q, i.u))}</span><span>${esc(i.name)}</span></li>`).join('')}</ul>
      <ol class="steps">${b.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="row wrap"><button class="btn primary grow" data-act="bSave">Save & add to plan</button><button class="btn grow" data-act="bSaveOnly">Save recipe</button></div></div>`;
  }
  return h;
}
function readBuilderSpec() {
  const sp = { ...ui.builderSpec };
  const desc = ui.bDesc || '';
  const parsed = desc.trim() ? C.parseDescription(desc) : {};
  const merged = { ...parsed };
  for (const k of ['protein', 'base', 'style', 'serves', 'spicy', 'healthy', 'cheap', 'diet']) if (sp[k] !== undefined && sp[k] !== '' && sp[k] !== null) merged[k] = sp[k];
  merged.veg = (sp.veg && sp.veg.length) ? sp.veg : (parsed.veg || []);
  merged.exclude = parsed.exclude || [];
  return merged;
}

/* ================= Deals ================= */
function viewDeals() {
  const active = C.activeDeals(S), t = C.today();
  const dealItems = new Set(active.map(d => d.item).filter(Boolean));
  const meals = Object.values(R).filter(r => r.ings.some(i => dealItems.has(i.item))).slice(0, 6);
  let h = `<form class="card" data-form="addDeal"><h2>Save a deal</h2><p class="small muted" style="margin:0">Spotted an offer in a leaflet, the app or in store? Add it and Mise uses it in prices and suggestions.</p>
    <label class="f">Item<input list="itemsList" id="dealItem" required placeholder="e.g. Chicken thighs" autocomplete="off"></label>
    <div class="row"><label class="f grow">Shop<select id="dealShop">${shopsOpts(S.settings.defaultShop)}</select></label><label class="f grow">Price (€)<input type="number" inputmode="decimal" step="0.01" id="dealPrice" required></label></div>
    <label class="f">Valid until<input type="date" id="dealUntil" value="${C.addDays(t, 6)}"></label>
    <button class="btn primary" type="submit">Save deal</button></form>`;
  if (active.length) h += `<section class="card flat"><div class="shop-h"><b>Current deals</b><span class="small muted">${active.length}</span></div>${active.map(d => `<div class="pi"><span class="tag deal">${esc(d.shop)}</span><div class="grow"><b>${esc(d.name)}</b><div class="tiny muted">${C.eur(d.price)} · until ${fmtShort(d.until)}</div></div><button class="icon-btn" data-act="delDeal" data-key="${d.id}" aria-label="Delete deal">${ICON.x}</button></div>`).join('')}</section>`;
  if (meals.length) h += `<h3>Meals using your deals</h3><div class="rlist">${meals.map(card).join('')}</div>`;
  return h;
}

/* ================= Insights ================= */
function viewInsights() {
  if (!S.receipts.length) return `<div class="empty"><h3>No spending data yet</h3><p>Scan a few receipts and this fills up with weekly spend, categories and waste.</p><a class="btn primary" href="#receipts">Scan a receipt</a></div>`;
  const weeks = []; const ws0 = C.weekStart(C.today());
  for (let i = 7; i >= 0; i--) { const ws = C.addDays(ws0, -7 * i); const tot = S.receipts.filter(r => C.weekStart(r.date) === ws).reduce((a, r) => a + r.total, 0); weeks.push([ws, tot]); }
  const max = Math.max(...weeks.map(w => w[1]), S.settings.budget || 0, 1);
  const cats = {}; const t = C.today();
  for (const r of S.receipts.filter(r => C.daysBetween(r.date, t) <= 30)) for (const l of r.lines) { const c = (ITEM[l.item] || {}).cat || 'other'; cats[c] = (cats[c] || 0) + l.price; }
  const CN = { veg: 'Veg', fruit: 'Fruit', meat: 'Meat', fish: 'Fish', dairy: 'Dairy', bakery: 'Bakery', pantry: 'Cupboard', chilled: 'Chilled', ready: 'Ready meals', snack: 'Snacks', sweet: 'Sweets', drinks: 'Drinks', fizzy: 'Fizzy drinks', energy: 'Energy drinks', alcohol: 'Alcohol', household: 'Household', other: 'Other' };
  const ctot = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
  const waste = S.waste.filter(w => C.daysBetween(w.date, t) <= 30);
  const freq = {}; for (const r of S.receipts) for (const l of r.lines) if (l.item) freq[l.item] = (freq[l.item] || 0) + 1;
  return `<div class="card"><h2>Weekly spend</h2><div class="chart">${weeks.map(([ws, v]) => `<div><i class="${S.settings.budget && v > S.settings.budget ? 'over' : ''}" style="height:${v / max * 100}%" title="${C.eur(v)}"></i><span>${fmtShort(ws)}</span></div>`).join('')}</div>${S.settings.budget ? `<p class="tiny muted" style="margin:0">Budget ${C.eur(S.settings.budget)} a week. Red bars went over.</p>` : ''}</div>
  <div class="card"><h2>Last 30 days</h2>${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div><div class="row between small"><span>${CN[c] || c}</span><b class="num">${C.eur(v)}</b></div><div class="bar"><i style="width:${v / ctot * 100}%"></i></div></div>`).join('')}</div>
  <div class="sum"><div><div class="k">Receipts</div><div class="v">${S.receipts.length}</div></div><div><div class="k">Prices learned</div><div class="v">${new Set(S.prices.map(p => p.item)).size}</div></div><div><div class="k">Binned (30d)</div><div class="v">${waste.length}</div></div></div>
  <div class="card"><h3>You buy most</h3><p class="small" style="margin:0">${Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => `${esc(ITEM[id].n)} (${n})`).join(', ')}</p></div>`;
}

/* ================= Settings ================= */
function viewSettings() {
  const st = S.settings;
  return `<div class="card"><h2>Household</h2>
    <label class="f">People you usually cook for<div class="stepper" style="align-self:flex-start"><button data-act="setNum" data-key="household" data-val="-1">−</button><span>${st.household}</span><button data-act="setNum" data-key="household" data-val="1">+</button></div></label>
    <label class="f">Weekly food budget (€)<input type="number" inputmode="decimal" data-setting="budget" value="${st.budget || ''}" placeholder="No budget"></label>
    <div class="small muted" style="font-weight:600">Nights to plan dinners</div><div class="daypick">${DOW.map((d, i) => `<button data-act="toggleNight" data-val="${i}" aria-pressed="${!!st.nights[i]}">${d}</button>`).join('')}</div></div>
  <div class="card"><h2>Shops</h2><p class="small muted" style="margin:0">Where you shop. The list picks the cheapest of these once you have your own prices.</p>
    <div class="chips wrap">${SHOPS.map(s => `<button class="chip" data-act="toggleShop" data-val="${s}" aria-pressed="${st.shops.includes(s)}">${s}</button>`).join('')}</div>
    <label class="f">Main shop<select data-setting="defaultShop">${st.shops.map(s => `<option${s === st.defaultShop ? ' selected' : ''}>${s}</option>`).join('')}</select></label></div>
  <div class="card"><h2>Personality</h2>
    <div class="small muted" style="font-weight:600">Receipt review tone</div><div class="seg">${[['gentle', 'Gentle'], ['cheeky', 'Cheeky'], ['savage', 'Savage']].map(([k, n]) => `<button data-act="setTone" data-val="${k}" aria-pressed="${st.tone === k}">${n}</button>`).join('')}</div>
    <label class="f">How adventurous should suggestions be? <span class="tiny">${st.adventure < 25 ? 'Mostly favourites' : st.adventure < 60 ? 'A good mix' : 'Lots of new things'}</span><input type="range" min="0" max="100" step="5" data-setting="adventure" value="${st.adventure}" style="min-height:0;padding:0;accent-color:var(--accent)"></label></div>
  <div class="card"><h2>AI (optional)</h2><p class="small muted" style="margin:0">Mise works fully without AI. These options cost the app nothing to run.</p>
    <label class="f">AI engine<select data-setting="ai"><option value="off"${st.ai === 'off' ? ' selected' : ''}>Off</option><option value="chrome"${st.ai === 'chrome' ? ' selected' : ''}${ui.aiStatus.chrome ? '' : ' disabled'}>On this device (Chrome built-in)${ui.aiStatus.chrome ? '' : ' – not available here'}</option><option value="puter"${st.ai === 'puter' ? ' selected' : ''}>Puter (free account, cloud)</option></select></label>
    <p class="tiny muted" style="margin:0">${st.ai === 'puter' ? 'Puter asks you to sign in to a free Puter account the first time. Your recipe requests go to their cloud and use your account\'s allowance.' : st.ai === 'chrome' ? 'Runs on this device with Chrome\'s built-in model. Nothing leaves your phone.' : 'On-device AI is only available on some desktop Chrome browsers for now.'}</p></div>
  <div class="card"><h2>Recipe library</h2><label class="f">TheMealDB API key<input data-setting="mealdbKey" value="${esc(st.mealdbKey)}" autocomplete="off"></label><p class="tiny muted" style="margin:0">"1" is TheMealDB's free test key. Supporters of TheMealDB get a personal key.</p></div>
  <div class="card"><h2>Appearance</h2><div class="seg">${[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, n]) => `<button data-act="setTheme" data-val="${k}" aria-pressed="${(st.theme || 'auto') === k}">${n}</button>`).join('')}</div></div>
  <div class="card"><h2>Back up & move</h2><p class="small muted" style="margin:0">Your data lives only on this device. Back it up to move phones.</p>
    <div class="row wrap"><button class="btn grow" data-act="exportData">Back up</button><label class="btn grow" for="importFile">Restore</label><input type="file" id="importFile" accept="application/json,.json" hidden data-change="importData"></div>
    <button class="btn" data-act="resetData" style="color:var(--hot)">${ui.resetArm ? 'Tap again to erase everything' : 'Erase all data'}</button></div>
  <p class="tiny muted">Mise · prices marked "est." are rough guides only. Recipes from TheMealDB.</p>`;
}

/* ================= Sheet ================= */
function openSheet(html) { const w = $('#sheet'); if (w.hidden) { history.pushState({ sheet: 1 }, ''); } w.hidden = false; setSheet(html); document.body.style.overflow = 'hidden'; }
function setSheet(html) { $('#sheetBody').innerHTML = html; }
let afterClose = null;
function closeSheet(fromPop, then) {
  const w = $('#sheet'); if (w.hidden) { if (then) then(); return; }
  w.hidden = true; document.body.style.overflow = ''; ui.sheetCtx = null;
  if (!fromPop && history.state && history.state.sheet) { afterClose = then || null; history.back(); } else if (then) then();
}
function go(hash) { closeSheet(false, () => { if (location.hash !== '#' + hash) location.hash = hash; else render(true); }); }
window.addEventListener('popstate', () => { if (!$('#sheet').hidden) closeSheet(true); if (afterClose) { const f = afterClose; afterClose = null; setTimeout(f, 0); } });

/* ================= Actions ================= */
const A = {
  closeSheet: () => closeSheet(),
  week: el => { ui.weekOffset += +el.dataset.val; render(); },
  suggest: () => {
    const dates = C.weekDates(ui.weekOffset).filter(d => !(S.plan[d] || []).length && S.settings.nights[(new Date(d + 'T12:00').getDay() + 6) % 7]);
    if (!dates.length) { toast('Every night is already planned.'); return; }
    const picks = C.suggestWeek(S, dates);
    for (const p of picks) (S.plan[p.date] = S.plan[p.date] || []).push({ rid: p.rid, serves: S.settings.household || 2, wildcard: p.wildcard });
    save(); render(); toast(`Planned ${picks.length} dinner${picks.length > 1 ? 's' : ''}. One is a wildcard to keep things fresh.`);
  },
  addMeal: el => { ui.sheetServes = null; openSheet(''); pickerSheet(el.dataset.date); },
  pickRecipe: el => { addToPlan(el.dataset.key, ui.pickDate); closeSheet(); render(); toast('Added to ' + fmtDay(ui.pickDate)); },
  pickSuggest: () => { const p = C.suggestWeek(S, [ui.pickDate])[0]; if (!p) { toast('No suggestion available'); return; } addToPlan(p.rid, ui.pickDate); closeSheet(); render(); toast(`Added ${R[p.rid].title}`); },
  pickOnline: () => { ui.recTab = 'online'; go('recipes'); },
  openRecipe: el => { const ctx = el.dataset.date ? { date: el.dataset.date, idx: +el.dataset.idx } : null; openRecipe(el.dataset.key, ctx); },
  sheetServes: el => { ui.sheetServes = Math.max(1, ui.sheetServes + +el.dataset.val); if (ui.sheetCtx) { const e = S.plan[ui.sheetCtx.date][ui.sheetCtx.idx]; e.serves = ui.sheetServes; save(); render(); } renderRecipeSheet(); },
  addToDay: el => { const r = ui.sheetRecipe; addToPlan(r.id, el.dataset.date, r); closeSheet(); render(); toast(`${r.title} added to ${fmtDay(el.dataset.date)}`); },
  saveRecipe: () => { const r = ui.sheetRecipe; S.recipes[r.id] = r; refreshRecipes(); save(); renderRecipeSheet(); toast('Saved to your recipes'); },
  deleteRecipe: el => { delete S.recipes[el.dataset.key]; for (const d of Object.keys(S.plan)) S.plan[d] = S.plan[d].filter(e => e.rid !== el.dataset.key); refreshRecipes(); save(); closeSheet(); render(); toast('Recipe deleted'); },
  rateSheet: el => { const r = ui.sheetRecipe; if (!S.recipes[r.id] && !String(r.id).startsWith('b:')) S.recipes[r.id] = r; C.rate(S, r.id, R[r.id] || r, +el.dataset.val); refreshRecipes(); save(); renderRecipeSheet(); toast('Thanks. Mise will learn from that.'); },
  cook: el => {
    const e = S.plan[el.dataset.date][+el.dataset.idx], r = R[e.rid];
    e.cooked = true; C.markCooked(S, e.rid, r, el.dataset.date); C.cookRecipe(S, r, e.serves); save(); render();
    ui.sheetRecipe = r; openSheet(`<h2>How was ${esc(r.title)}?</h2><p class="small muted">We've taken the ingredients out of your pantry.</p>${stars((S.ratings[r.id] || {}).r || 0, 'rateCooked', r.id)}<div class="row" style="margin-top:14px"><button class="btn grow" data-act="closeSheet">Skip</button></div>`);
  },
  rateCooked: el => { const r = ui.sheetRecipe; C.rate(S, r.id, r, +el.dataset.val); save(); closeSheet(); toast(+el.dataset.val >= 4 ? "Noted. It'll come round again." : "Noted. We'll go easy on that one."); },
  uncook: el => { const e = S.plan[el.dataset.date][+el.dataset.idx]; e.cooked = false; save(); closeSheet(); render(); },
  swap: el => {
    const d = el.dataset.date, i = +el.dataset.idx, e = S.plan[d][i]; const old = R[e.rid];
    S.plan[d].splice(i, 1); C.markSkipped(S, e.rid, old);
    const p = C.suggestWeek(S, [d]).find(x => x.rid !== e.rid);
    if (p) S.plan[d].splice(i, 0, { rid: p.rid, serves: e.serves });
    save(); closeSheet(); render(); toast(p ? `Swapped for ${R[p.rid].title}` : 'Removed');
  },
  removeMeal: el => { const d = el.dataset.date; S.plan[d].splice(+el.dataset.idx, 1); save(); closeSheet(); render(); },
  recTab: el => { ui.recTab = el.dataset.val; ui.recQuery = ''; render(); },
  mdbCat: async el => { ui.onlineCat = el.dataset.val; ui.onlineLoading = true; ui.onlineErr = ''; render(); try { ui.online = await C.mdbByCategory(S, ui.onlineCat); } catch (e) { ui.onlineErr = e.message; ui.online = []; } ui.onlineLoading = false; render(); },
  mdbRandom: async () => { ui.onlineLoading = true; ui.onlineErr = ''; ui.onlineCat = null; render(); try { const rs = await Promise.all([1, 2, 3, 4, 5, 6].map(() => C.mdbRandom(S))); ui.online = rs.filter(Boolean).filter((r, i, a) => a.findIndex(x => x.id === r.id) === i); } catch (e) { ui.onlineErr = e.message; ui.online = []; } ui.onlineLoading = false; render(); },
  listWeek: el => { ui.listWeek = +el.dataset.val; render(); },
  shopFilter: el => { ui.shopFilter = el.dataset.val || null; render(); },
  toggleItem: el => { const k = el.dataset.key; if (S.list.checked[k]) delete S.list.checked[k]; else S.list.checked[k] = true; save(); el.classList.toggle('on'); el.setAttribute('aria-checked', !!S.list.checked[k]); const dn = document.querySelector('[data-act="doneShopping"]'); if (dn) dn.disabled = !Object.keys(S.list.checked).length; },
  itemMenu: (el, ev) => {
    ev.stopPropagation();
    const L = C.buildList(S, C.weekDates(ui.listWeek)); const r = L.rows.find(x => x.key === el.dataset.key); if (!r) return; ui.menuRow = r;
    openSheet(`<h2>${esc(r.name)}</h2><p class="small muted">${r.from.map(esc).join(', ')}</p>${r.priceSrc === 'est' ? `<p class="small">Price is an estimate. Scan a receipt to learn the real one${r.shop ? ' at ' + esc(r.shop) : ''}.</p>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px"><button class="btn" data-act="haveIt">I already have this</button><button class="btn" data-act="hideItem">Remove from this list</button>${r.extra ? '<button class="btn" data-act="delExtra">Delete added item</button>' : ''}<button class="btn ghost" data-act="closeSheet">Cancel</button></div>`);
  },
  haveIt: () => { const r = ui.menuRow; if (r.item) C.addPantry(S, r.item, r.buy || r.qty, r.name); else S.list.hidden[r.key] = true; save(); closeSheet(); render(); toast('Added to your pantry'); },
  hideItem: () => { S.list.hidden[ui.menuRow.key] = true; save(); closeSheet(); render(); },
  delExtra: () => { const r = ui.menuRow; S.list.extras = S.list.extras.filter(x => (x.item || 'x:' + x.name.toLowerCase()) !== r.key && x.item !== r.item); save(); closeSheet(); render(); },
  haveStaple: el => { const it = ITEM[el.dataset.key]; C.addPantry(S, it.id, it.packs[0], it.n); save(); render(); },
  stapleToList: () => { const L = C.buildList(S, C.weekDates(ui.listWeek)); for (const s of L.staples) S.list.extras.push({ item: s.item, name: s.name }); save(); render(); },
  doneShopping: () => {
    const L = C.buildList(S, C.weekDates(ui.listWeek)); let n = 0;
    for (const r of L.rows) if (S.list.checked[r.key]) { if (r.item) C.addPantry(S, r.item, r.buy || r.qty, r.name); else C.addPantry(S, null, 1, r.name); delete S.list.checked[r.key]; n++; if (r.extra) S.list.extras = S.list.extras.filter(x => x.item !== r.item && ('x:' + String(x.name).toLowerCase()) !== r.key); }
    save(); render(); toast(`${n} item${n > 1 ? 's' : ''} moved to your pantry`);
  },
  clearTicks: () => { S.list.checked = {}; save(); render(); },
  shareList: async () => { const text = listText(); try { if (navigator.share) { await navigator.share({ title: 'Shopping list', text }); return; } } catch (e) { return; } try { await navigator.clipboard.writeText(text); toast('List copied'); } catch (e) { toast('Could not share the list'); } },
  smarter: () => {
    const sm = C.smarterList(S); if (!sm.length) { toast('Scan a receipt or two first.'); return; }
    openSheet(`<h2>Smarter list for next week</h2><p class="small muted">Built from your recent receipts: your regulars, treats trimmed, less waste.</p>
      <div class="card flat">${sm.map((x, i) => `<label class="pi" style="cursor:pointer"><input type="checkbox" checked data-sm="${i}" style="width:22px;height:22px;min-height:0;accent-color:var(--accent)"><div class="grow"><b>${esc(x.name)}</b> × ${x.packs}<div class="tiny muted">${esc(x.note)}</div></div>${x.saving > 0.01 ? `<span class="tag yours">save ~${C.eur(x.saving)}</span>` : ''}</label>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn grow" data-act="closeSheet">Cancel</button><button class="btn primary grow" data-act="smarterAdd">Add ticked to next week</button></div>`);
    ui.smarter = sm;
  },
  smarterAdd: () => { document.querySelectorAll('[data-sm]').forEach(cb => { if (cb.checked) { const x = ui.smarter[+cb.dataset.sm]; S.list.extras.push({ item: x.item, name: x.name, qty: ITEM[x.item].packs[0] * x.packs }); } }); save(); ui.listWeek = 1; go('list'); toast('Added to your list'); },
  pantryItem: el => {
    const p = S.pantry.find(x => x.key === el.dataset.key); if (!p) return; ui.pItem = p;
    openSheet(`<h2>${esc(p.name)}</h2>${p.item ? `<label class="f" style="margin-top:10px">Amount left (${p.unit === 'pc' ? 'count' : p.unit})<input type="number" inputmode="decimal" id="pQty" value="${Math.round(p.qty * 10) / 10}"></label>` : ''}<label class="f" style="margin-top:8px">Use by<input type="date" id="pExp" value="${p.exp || ''}"></label>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><button class="btn primary" data-act="pSave">Save</button><button class="btn" data-act="pUsed">Used it all</button><button class="btn" data-act="pBinned" style="color:var(--hot)">Binned it</button></div><p class="tiny muted">"Binned it" helps Mise suggest smaller packs or meals that use things up.</p>`);
  },
  pSave: () => { const p = ui.pItem; const q = $('#pQty'); if (q) p.qty = Math.max(0, parseFloat(q.value) || 0); p.exp = $('#pExp').value || null; if (p.item && p.qty <= 0) S.pantry = S.pantry.filter(x => x !== p); save(); closeSheet(); render(); },
  pUsed: () => { S.pantry = S.pantry.filter(x => x !== ui.pItem); save(); closeSheet(); render(); },
  pBinned: () => { const p = ui.pItem; S.waste.push({ item: p.item, name: p.name, date: C.today() }); S.pantry = S.pantry.filter(x => x !== p); save(); closeSheet(); render(); toast('Logged. Mise will keep that in mind.'); },
  addMissing: el => { const can = C.whatCanIMake(S).find(x => x.r.id === el.dataset.key); const r = can.r; for (const i of r.ings) { const it = ITEM[i.item]; if (!it || it.staple) continue; if (can.missing.includes(it.n)) S.list.extras.push({ item: it.id, name: it.n }); } save(); toast('Missing items added to your list'); },
  pasteReceipt: () => openSheet(`<h2>Paste receipt text</h2><p class="small muted">Copy the text from an emailed or digital receipt and paste it here.</p><textarea id="rcText" style="min-height:220px;font-family:ui-monospace,monospace;font-size:13px" placeholder="CHICKEN FILLETS   4.99 A&#10;MILK 2L           1.89 A"></textarea><div class="row" style="margin-top:10px"><button class="btn grow" data-act="closeSheet">Cancel</button><button class="btn primary grow" data-act="rcParse">Read it</button></div>`),
  rcParse: () => { const text = $('#rcText').value; ui._shop = ($('#rcShop') || {}).value; ui._date = ($('#rcDate') || {}).value; closeSheet(); const shopSel = $('#rcShop'); if (shopSel && ui._shop) shopSel.value = ui._shop; startDraft(text); },
  rcAddLine: () => { ui.receiptDraft.lines.push({ text: 'Added by hand', price: 0, qty: 1, item: '', include: true }); render(); },
  rcCancel: () => { ui.receiptDraft = null; render(); },
  rcSave: () => {
    const d = ui.receiptDraft; const lines = d.lines.filter(l => l.include).map(l => ({ text: l.text, item: l.item || null, price: +l.price || 0, qty: l.qty || 1, weightKg: l.weightKg }));
    const rec = C.saveReceipt(S, { shop: d.shop, date: d.date, lines, total: d.total });
    ui.receiptDraft = null; save(); render(true); showReview(rec);
  },
  reviewReceipt: el => { const rec = S.receipts.find(r => r.id === el.dataset.key); if (rec) showReview(rec); },
  bExample: el => { ui.bDesc = el.dataset.val; ui.builderSpec = {}; render(); },
  bVeg: el => { const v = el.dataset.val; const a = ui.builderSpec.veg || []; ui.builderSpec.veg = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; render(); },
  bSpicy: el => { ui.builderSpec.spicy = +el.dataset.val; render(); },
  bOpt: el => { ui.builderOpts.pantryFirst = !ui.builderOpts.pantryFirst; render(); },
  bFlag: el => { const k = el.dataset.val; if (k === 'diet') ui.builderSpec.diet = ui.builderSpec.diet === 'veg' ? undefined : 'veg'; else ui.builderSpec[k] = !ui.builderSpec[k]; render(); },
  bBuild: () => { const spec = C.completeSpec(readBuilderSpec(), S, ui.builderOpts.pantryFirst); ui.lastSpec = spec; ui.builder = C.buildMeal(spec); render(); setTimeout(() => { const c = document.querySelectorAll('.card')[1]; if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  bTweak: el => { if (!ui.lastSpec) return; const s = { ...ui.lastSpec, veg: [...(ui.lastSpec.veg || [])] }; C.TWEAKS[el.dataset.val][1](s); const full = C.completeSpec(s, S, ui.builderOpts.pantryFirst); ui.lastSpec = full; ui.builder = C.buildMeal(full); render(); toast(C.TWEAKS[el.dataset.val][0] + ' version'); },
  bAI: async () => {
    const desc = (ui.bDesc || '').trim(); if (!desc) { toast('Describe the meal first'); return; }
    ui.builderBusy = true; render();
    try { ui.builder = await C.aiRecipe(S.settings.ai, desc, readBuilderSpec().serves || S.settings.household); ui.lastSpec = null; }
    catch (e) { toast('AI could not write that one: ' + (e.message || 'unknown error').slice(0, 80)); }
    ui.builderBusy = false; render();
  },
  bSave: () => { const r = ui.builder; S.recipes[r.id] = r; refreshRecipes(); save(); ui.sheetRecipe = R[r.id]; ui.sheetServes = r.serves; ui.sheetCtx = null; openSheet(''); renderRecipeSheet(); toast('Saved. Pick a day below.'); },
  bSaveOnly: () => { const r = ui.builder; S.recipes[r.id] = r; refreshRecipes(); save(); toast('Saved to your recipes'); },
  delDeal: el => { S.deals = S.deals.filter(d => d.id !== el.dataset.key); save(); render(); },
  setNum: el => { const k = el.dataset.key; S.settings[k] = Math.max(1, Math.min(12, (S.settings[k] || 1) + +el.dataset.val)); save(); render(); },
  toggleNight: el => { const i = +el.dataset.val; S.settings.nights[i] = S.settings.nights[i] ? 0 : 1; save(); render(); },
  toggleShop: el => { const s = el.dataset.val, a = S.settings.shops; S.settings.shops = a.includes(s) ? a.filter(x => x !== s) : [...a, s]; if (!S.settings.shops.length) S.settings.shops = [s]; if (!S.settings.shops.includes(S.settings.defaultShop)) S.settings.defaultShop = S.settings.shops[0]; save(); render(); },
  setTone: el => { S.settings.tone = el.dataset.val; save(); render(); },
  setTheme: el => { S.settings.theme = el.dataset.val; applyTheme(); save(); render(); },
  exportData: async () => {
    const text = C.exportState(S), name = `mise-backup-${C.today()}.json`;
    try { const file = new File([text], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Mise backup' }); return; } } catch (e) { /* fall through */ }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Backup saved');
  },
  resetData: () => { if (!ui.resetArm) { ui.resetArm = true; render(); setTimeout(() => { ui.resetArm = false; }, 4000); return; } S = C.freshState(); S.settings.onboarded = true; refreshRecipes(); save(); ui.resetArm = false; render(); toast('All data erased'); },
  onbDone: () => { S.settings.onboarded = true; save(); closeSheet(); render(); },
  onbShop: el => { A.toggleShop(el); onboarding(); },
  onbNum: el => { A.setNum(el); onboarding(); }
};
const CHANGE = {
  receiptFile: el => { const f = el.files && el.files[0]; if (f) readReceiptImage(f); },
  rcInclude: el => { ui.receiptDraft.lines[+el.dataset.idx].include = el.checked; render(); },
  rcItem: el => { ui.receiptDraft.lines[+el.dataset.idx].item = el.value; },
  rcPrice: el => { ui.receiptDraft.lines[+el.dataset.idx].price = parseFloat(el.value) || 0; render(); },
  importData: async el => { const f = el.files && el.files[0]; if (!f) return; try { S = C.importState(await f.text()); refreshRecipes(); save(); applyTheme(); render(); toast('Backup restored'); } catch (e) { toast(e.message); } }
};

/* ================= Global events ================= */
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'A' && el.dataset.act === 'closeSheet') { ev.preventDefault(); go(el.getAttribute('href').slice(1)); return; }
  ev.preventDefault();
  fn(el, ev);
});
document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.li[data-act]')) { ev.preventDefault(); A.toggleItem(ev.target); }
  if (ev.key === 'Escape') closeSheet();
  if (ev.key === 'Enter' && ev.target.id === 'recSearch' && ui.recTab === 'online') { ev.preventDefault(); onlineSearch(ev.target.value); }
});
async function onlineSearch(q) { if (!q.trim()) return; ui.onlineLoading = true; ui.onlineErr = ''; ui.onlineCat = null; render(); try { ui.online = await C.mdbSearch(S, q.trim()); if (!ui.online.length) { const byIng = await C.mdbByIngredient(S, q.trim()); ui.online = byIng; } } catch (e) { ui.onlineErr = e.message; ui.online = []; } ui.onlineLoading = false; render(); }
document.addEventListener('input', ev => {
  const el = ev.target;
  if (el.dataset.in === 'recQuery') { ui.recQuery = el.value; if (ui.recTab !== 'online') { render(); const i = $('#recSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  if (el.dataset.in === 'pickQuery') { ui.pickQuery = el.value; renderPicker(true); }
  if (el.dataset.in === 'bDesc') { ui.bDesc = el.value; }
  if (el.dataset.setting && el.type !== 'range' && el.tagName !== 'SELECT') { const k = el.dataset.setting; S.settings[k] = el.type === 'number' ? (parseFloat(el.value) || 0) : el.value; save(); }
});
document.addEventListener('change', ev => {
  const el = ev.target;
  if (el.dataset.change && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el);
  if (el.dataset.setting && (el.tagName === 'SELECT' || el.type === 'range')) { const k = el.dataset.setting; S.settings[k] = el.type === 'range' ? +el.value : el.value; save(); render(); }
  if (el.dataset.bspec) { const k = el.dataset.bspec; ui.builderSpec[k] = k === 'serves' ? Math.max(1, +el.value || 1) : (el.value || undefined); }
});
document.addEventListener('submit', ev => {
  const f = ev.target.dataset.form; if (!f) return; ev.preventDefault();
  if (f === 'addExtra') { const v = $('#extraName').value.trim(); if (!v) return; const id = itemByName(v); S.list.extras.push({ item: id, name: id ? ITEM[id].n : v }); save(); render(); toast(`${id ? ITEM[id].n : v} added`); const i = $('#extraName'); if (i) i.focus(); }
  if (f === 'addPantry') { const v = $('#pantryName').value.trim(); if (!v) return; const id = itemByName(v); C.addPantry(S, id, id ? ITEM[id].packs[0] : 1, id ? ITEM[id].n : v); save(); render(); toast('Added to pantry'); const i = $('#pantryName'); if (i) i.focus(); }
  if (f === 'addDeal') { const name = $('#dealItem').value.trim(); const id = itemByName(name); S.deals.push({ id: 'd' + Date.now().toString(36), item: id, name: id ? ITEM[id].n : name, shop: $('#dealShop').value, price: parseFloat($('#dealPrice').value) || 0, until: $('#dealUntil').value }); save(); render(); toast('Deal saved'); }
});
function itemByName(v) { const exact = CATALOG.find(i => i.n.toLowerCase() === v.toLowerCase()); return exact ? exact.id : C.matchIngredient(v); }

/* ================= Onboarding, theme, boot ================= */
function onboarding() {
  openSheet(`<h2>Welcome to Mise</h2><p class="muted">Plan dinners, get a smart shopping list, and learn what you actually buy. Three quick questions.</p>
    <label class="f">How many people do you cook for?<div class="stepper" style="align-self:flex-start"><button data-act="onbNum" data-key="household" data-val="-1">−</button><span>${S.settings.household}</span><button data-act="onbNum" data-key="household" data-val="1">+</button></div></label>
    <div class="small muted" style="font-weight:600;margin-top:12px">Where do you shop?</div><div class="chips wrap" style="margin-top:6px">${SHOPS.slice(0, 7).map(s => `<button class="chip" data-act="onbShop" data-val="${s}" aria-pressed="${S.settings.shops.includes(s)}">${s}</button>`).join('')}</div>
    <label class="f" style="margin-top:12px">Weekly food budget (€, optional)<input type="number" inputmode="decimal" data-setting="budget" value="${S.settings.budget || ''}"></label>
    <button class="btn primary block" style="margin-top:16px" data-act="onbDone">Start planning</button>`);
}
function applyTheme() { const t = S.settings.theme || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
const VIEWS = { plan: viewPlan, recipes: viewRecipes, list: viewList, pantry: viewPantry, make: viewMake, more: viewMore, receipts: viewReceipts, builder: viewBuilder, deals: viewDeals, insights: viewInsights, settings: viewSettings, install: viewInstall };
async function boot() {
  S = await C.loadState();
  refreshRecipes(); applyTheme();
  const dl = document.createElement('datalist'); dl.id = 'itemsList'; dl.innerHTML = CATALOG.map(i => `<option value="${esc(i.n)}">`).join(''); document.body.appendChild(dl);
  window.addEventListener('hashchange', route);
  route(); updateBadge();
  if (!S.settings.onboarded) onboarding();
  C.aiAvailable().then(a => { ui.aiStatus = a; });
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
