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
function imgSrc(r, small) { const u = r && C.photoOf(S, r); if (!u) return null; return small && /themealdb/.test(u) ? u + '/preview' : u; }
function thumb(r, cls = 'thumb') { const u = imgSrc(r, true); return u ? `<img class="${cls}" src="${esc(u)}" onerror="this.onerror=null;this.src='${esc(C.photoOf(S, r))}'" alt="" loading="lazy">` : `<div class="${cls}">${esc((r && r.title || '?')[0])}</div>`; }
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
const TITLES = { plan: 'This week', recipes: 'Recipes', list: 'Shopping list', pantry: 'Pantry', more: 'Menu', make: 'What can I make?', builder: 'Create a meal', receipts: 'Receipts', deals: 'Deals', insights: 'Spending', settings: 'Settings', install: 'Install', quiz: 'Your tastes', add: 'Your recipe' };
const TAB_OF = { make: 'pantry' };
const SUBPAGE = { add: 'recipes', make: 'pantry', receipts: 'more', deals: 'more', insights: 'more', settings: 'more', install: 'more', quiz: 'more', more: 'plan' };
function route() {
  const h = (location.hash || '#plan').slice(1);
  if (h === 'tour') { history.replaceState(null, '', '#plan'); ui.route = 'plan'; route(); setTimeout(startTour, 150); return; }
  ui.route = TITLES[h] ? h : 'plan';
  if (ui.route === 'quiz' && (!ui.quiz || ui.quiz.stage === 'done' || (ui.quiz.stage === 'swipe' && ui.quiz.i >= (ui.quiz.deck || []).length))) ui.quiz = { stage: 'diet', first: ui.quiz && ui.quiz.first };
  const tab = TAB_OF[ui.route] || ui.route;
  document.querySelectorAll('.tabbar a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const parent = SUBPAGE[ui.route]; $('#backBtn').hidden = !parent; $('#brandMark').style.display = parent ? 'none' : ''; if (parent) $('#backBtn').setAttribute('href', '#' + parent); $('#menuBtn').hidden = ui.route === 'more';
  render(true);
}
function render(scrollTop) {
  $('#viewTitle').textContent = ui.route === 'plan' ? (ui.weekOffset === 0 ? 'This week' : ui.weekOffset === 1 ? 'Next week' : ui.weekOffset === -1 ? 'Last week' : 'Week plan') : TITLES[ui.route];
  const v = VIEWS[ui.route] || VIEWS.plan;
  $('#view').innerHTML = v();
  if (scrollTop) window.scrollTo(0, 0);
  if (['plan', 'recipes'].includes(ui.route)) setTimeout(fillAutoImages, 400);
  if (ui.route === 'quiz') bindQuizSwipe();
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
  let h = `<div class="weeknav" data-tour="weeknav"><button class="icon-btn" data-act="week" data-val="-1" aria-label="Previous week">${ICON.left}</button><div class="grow">${fmtShort(dates[0])} – ${fmtShort(dates[6])}</div><button class="icon-btn" data-act="week" data-val="1" aria-label="Next week">${ICON.right}</button></div>
  <div class="sum" data-tour="plansum"><div><div class="k">Nights planned</div><div class="v">${planned}/7</div></div><div><div class="k">List estimate</div><div class="v">${C.eur(list.total)}</div></div><div><div class="k">Weekly budget</div><div class="v">${budget ? C.eur(budget) : '–'}</div></div></div>
  <div class="row" data-tour="suggest"><button class="btn primary grow" data-act="suggest">${ICON.spark.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')} ${planned ? 'Fill empty nights' : 'Suggest my week'}</button><a class="btn" href="#list">List</a>${planned ? `<button class="btn" data-act="clearWeek" data-tour="clearWeek" style="${ui.clearArm ? 'color:#fff;background:var(--hot);border-color:var(--hot)' : ''}">${ui.clearArm ? 'Sure?' : 'Clear'}</button>` : ''}</div>`;
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
  let h = `<div class="seg" role="group" data-tour="recTabs">${[['all', 'All'], ['mine', 'Mine'], ['online', 'Online']].map(([k, n]) => `<button data-act="recTab" data-val="${k}" aria-pressed="${tab === k}">${n}</button>`).join('')}</div>
  <div class="row"><a class="cta grow" href="#builder" data-tour="buildCta" style="width:auto">${ICON.pot}<div><b>Create a meal</b><span>Say what you fancy</span></div></a><a class="btn" href="#add" data-act="newRecipe" data-tour="addRecipe" style="min-height:64px;flex:none">+ Add<br>your own</a></div>
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
  list.sort((a, b) => (C.ruledOut(S, a) - C.ruledOut(S, b)) || C.prefScore(S, b) - C.prefScore(S, a) || a.title.localeCompare(b.title));
  if (!list.length) return h + (tab === 'mine' ? `<div class="empty"><h3>No saved recipes yet</h3><p>Build a meal, or add online recipes to your plan, and they'll show here.</p></div>` : `<div class="empty"><h3>Nothing matches</h3><p>Try the Online tab for more.</p></div>`);
  return h + `<div class="rlist">${list.map(card).join('')}</div>`;
}
function card(r) {
  const rt = S.ratings[r.id];
  return `<button class="rcard" data-act="openRecipe" data-key="${esc(r.id)}"><div class="img">${imgSrc(r, true) ? `<img src="${esc(imgSrc(r, true))}" onerror="this.onerror=null;this.src='${esc(C.photoOf(S, r))}'" alt="" loading="lazy">` : esc(r.title[0])}</div><div class="b"><div class="t">${esc(r.title)}</div><div class="tiny muted">${r.stub ? (r.cat || 'Online') : `${r.time} min · ${esc(r.area || r.cat || '')}`}${rt && rt.r ? ' · ' + '★'.repeat(rt.r) : ''}</div>${!r.stub && r.ings && C.ruledOut(S, r) ? '<span class="tag warn">has things you avoid</span>' : ''}</div></button>`;
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
  const hero = C.photoOf(S, r);
  let h = hero ? `<div class="hero"><img src="${esc(hero)}" alt=""></div>` : '';
  const bad = C.dislikedIn(S, r).filter(i => !C.leaveOut(S, r).includes(i)); const lo = C.leaveOut(S, r);
  if (lo.length) h += `<div class="tag" style="white-space:normal;padding:8px 10px;margin-bottom:8px;font-size:13px">Leave out the ${esc(lo.map(i => i.name).join(', '))}. You don't like ${lo.length > 1 ? 'them' : 'it'}.</div>`;
  if (bad.length) h += `<div class="tag ${bad.some(i => C.likeOf(S, i) <= -9) ? 'deal' : 'warn'}" style="white-space:normal;padding:8px 10px;margin-bottom:8px;font-size:13px">Contains ${esc(bad.map(i => i.name).join(', '))}, which you marked as ${bad.some(i => C.likeOf(S, i) <= -9) ? "can't eat" : "don't like"}.</div>`;
  h += `<h2>${esc(r.title)}</h2>
  <div class="row wrap small muted" style="gap:6px;margin:6px 0 10px"><span class="tag">${r.time} min</span>${r.area ? `<span class="tag">${esc(r.area)}</span>` : ''}${r.cat ? `<span class="tag">${esc(r.cat)}</span>` : ''}<span class="tag yours">≈ ${C.eur(cost.perServe)} a serving</span>${r.src === 'builder' ? '<span class="tag">Built by you</span>' : r.src === 'ai' ? '<span class="tag">AI recipe</span>' : r.src === 'mealdb' ? '<span class="tag">TheMealDB</span>' : ''}</div>
  <div class="row between" data-tour="servings"><div class="stepper"><button data-act="sheetServes" data-val="-1" aria-label="Fewer servings">−</button><span>${serves}</span><button data-act="sheetServes" data-val="1" aria-label="More servings">+</button></div><span class="small muted">servings · ${C.eur(cost.total)} total</span></div>`;
  if (entry) h += `<div class="row" data-tour="sheetActions" style="margin-top:12px"><button class="btn ${entry.cooked ? '' : 'primary'} grow" data-act="${entry.cooked ? 'uncook' : 'cook'}" data-date="${ctx.date}" data-idx="${ctx.idx}">${entry.cooked ? 'Mark not cooked' : 'I cooked this'}</button><button class="btn" data-act="swap" data-date="${ctx.date}" data-idx="${ctx.idx}">Swap</button><button class="btn" data-act="removeMeal" data-date="${ctx.date}" data-idx="${ctx.idx}">Remove</button></div>`;
  else h += `<div style="margin-top:12px" data-tour="daypick"><div class="small muted" style="margin-bottom:6px;font-weight:600">Add to ${ui.weekOffset === 1 ? 'next' : 'this'} week</div><div class="daypick">${C.weekDates(ui.weekOffset).map(d => { const n = (S.plan[d] || []).length; return `<button data-act="addToDay" data-date="${d}">${DOW[(new Date(d + 'T12:00').getDay() + 6) % 7]}<span>${n ? n + ' planned' : new Date(d + 'T12:00').getDate()}</span></button>`; }).join('')}</div></div>`;
  h += `<h3 style="margin:16px 0 0">Ingredients</h3><p class="tiny muted" style="margin:2px 0 4px">Tap one to like or dislike it</p><ul class="ings" data-tour="ings">${r.ings.map((i, idx) => { const it = ITEM[i.item]; const b = it ? C.toBase(i.q * f, i.u, it) : null; const have = it && C.pantryQty(S, it.id) >= (b || 1) * 0.75; const lk = C.likeOf(S, i); return `<li class="${have ? 'have' : ''}" data-act="ingMenu" data-idx="${idx}" style="cursor:pointer"><span class="q">${esc(fmtIng(i.q * f, i.u))}</span><span class="grow">${esc(i.name)}${it && it.staple ? ' <span class="tiny muted">(cupboard)</span>' : ''}</span>${lk <= -9 ? '<span class="tag deal">can\'t eat</span>' : lk < 0 ? '<span class="tag warn">don\'t like</span>' : lk > 0 ? '<span class="tag yours">love</span>' : ''}</li>`; }).join('')}</ul>
  <h3 style="margin:16px 0 8px">Method</h3><ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
  <h3 style="margin:16px 0 4px">Your rating</h3><div data-tour="rating">${stars(rt.r || 0, 'rateSheet', r.id)}</div>
  <div class="row wrap" style="margin-top:14px"><label class="btn" for="recipePhoto">${S.photos[r.id] ? 'Change photo' : 'Add your photo'}</label><input type="file" id="recipePhoto" accept="image/*" hidden data-change="recipePhoto">${S.photos[r.id] ? '<button class="btn" data-act="removePhoto">Remove photo</button>' : ''}${!saved ? `<button class="btn" data-act="saveRecipe">Save to my recipes</button>` : ''}${saved && !String(r.id).startsWith('b:') && r.src !== 'mealdb' ? `<button class="btn" data-act="editRecipe" data-key="${esc(r.id)}">Edit</button>` : ''}${String(r.id).startsWith('b:') ? `<button class="btn" data-act="editRecipe" data-key="${esc(r.id)}">Edit a copy</button>` : ''}${r.src !== 'builtin' && saved && !String(r.id).startsWith('b:') ? `<button class="btn" data-act="deleteRecipe" data-key="${esc(r.id)}">Delete</button>` : ''}${r.url ? `<a class="btn ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Original source</a>` : ''}${r.video ? `<a class="btn ghost" href="${esc(r.video)}" target="_blank" rel="noopener">Video</a>` : ''}</div>`;
  setSheet(h);
}
function pickerSheet(date) {
  ui.pickDate = date; ui.pickQuery = '';
  renderPicker();
}
function renderPicker(keepFocus) {
  const q = (ui.pickQuery || '').toLowerCase();
  const all = Object.values(R).filter(r => !['Dessert', 'Starter', 'Side'].includes(r.cat) && !C.ruledOut(S, r));
  let list;
  if (q) list = all.filter(r => r.title.toLowerCase().includes(q) || r.ings.some(i => i.name.toLowerCase().includes(q)));
  else { const can = C.whatCanIMake(S).filter(x => x.cover >= 0.6).slice(0, 4).map(x => x.r.id); list = all.sort((a, b) => (can.includes(b.id) - can.includes(a.id)) || (C.prefScore(S, b) - C.prefScore(S, a))).slice(0, 30); }
  const body = `<h2>Add a meal · ${fmtDay(ui.pickDate)}</h2><input type="search" id="pickSearch" data-in="pickQuery" placeholder="Search your recipes" value="${esc(ui.pickQuery)}" style="margin:10px 0">
  <div class="row" style="margin-bottom:8px"><button class="btn sm grow" data-act="pickSuggest">Suggest one</button><a class="btn sm grow" href="#builder" data-act="closeSheet">Build a meal</a><button class="btn sm grow" data-act="pickOnline">Online</button></div>
  <div class="card flat">${list.map(r => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left;border-top:1px solid var(--line)" data-act="pickRecipe" data-key="${esc(r.id)}">${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${r.time} min · ${esc(r.area || r.cat || '')}</div></div></button>`).join('') || '<div class="empty">No matches.</div>'}</div>`;
  setSheet(body);
  if (keepFocus) { const i = $('#pickSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function keepSuggestion(p) { if (p && p.recipe && !S.recipes[p.rid]) { const r = { ...p.recipe }; delete r.auto; S.recipes[p.rid] = r; refreshRecipes(); } return p; }
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
  let h = `<div class="seg" role="group" data-tour="listWeek">${[[0, 'This week'], [1, 'Next week']].map(([k, n]) => `<button data-act="listWeek" data-val="${k}" aria-pressed="${ui.listWeek === k}">${n}</button>`).join('')}</div>
  <div class="card" data-tour="listTotal"><div class="row between"><div><div class="small muted">Estimated total</div><div style="font:700 26px var(--display)" class="num">${C.eur(L.total)}</div></div><div style="text-align:right"><div class="small muted">${done}/${L.rows.length} in the basket</div>${budget ? `<div class="small ${L.total > budget ? '' : 'muted'}" style="${L.total > budget ? 'color:var(--hot);font-weight:700' : ''}">${L.total > budget ? C.eur(L.total - budget) + ' over' : C.eur(budget - L.total) + ' under'} budget</div>` : ''}</div></div>
  ${budget ? `<div class="bar${L.total > budget ? ' over' : ''}"><i style="width:${Math.min(100, L.total / budget * 100)}%"></i></div>` : ''}
  <div class="row wrap tiny muted" style="gap:6px"><span class="tag">est.</span> guess <span class="tag yours">yours</span> from receipts <span class="tag deal">deal</span> saved offer</div></div>
  <form class="row" data-form="addExtra" data-tour="addExtra"><input list="itemsList" id="extraName" placeholder="Add anything: milk, bin bags…" autocomplete="off" aria-label="Item to add"><button class="btn primary" type="submit">Add</button></form>`;
  if (shops.length > 1) h += `<div class="chips">${[null, ...shops].map(s => `<button class="chip" data-act="shopFilter" data-val="${esc(s || '')}" aria-pressed="${(ui.shopFilter || null) === s}">${s || 'All shops'}</button>`).join('')}</div>`;
  if (!L.rows.length && !L.staples.length) return h + `<div class="empty"><h3>Your list is empty</h3><p>Plan some dinners and the ingredients appear here, combined and rounded to real pack sizes.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#plan">Plan the week</a>${hiddenCount(dates) ? `<button class="btn" data-act="restoreList">Show ${hiddenCount(dates)} removed</button>` : ''}</div></div>`;
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
  if (L.staples.length) h += `<section class="card" data-tour="staples"><h3>Check you have</h3><p class="small muted" style="margin:0">Cupboard basics your recipes use. Tap the ones you have.</p><div class="chips wrap">${L.staples.map(s => `<button class="chip" data-act="haveStaple" data-key="${s.item}">${esc(s.name)}</button>`).join('')}</div><button class="btn sm" data-act="stapleToList">Add the rest to the list</button></section>`;
  if (L.covered.length) h += `<details class="card"><summary><b>Already in your pantry (${L.covered.length})</b></summary><p class="small muted">${L.covered.map(c => esc(c.name)).join(', ')}</p></details>`;
  h += `<div class="row wrap" data-tour="done"><button class="btn primary grow" data-act="doneShopping"${done ? '' : ' disabled'}>Done: move ticked items to pantry</button></div>
  <div class="row wrap" data-tour="share"><button class="btn grow" data-act="shareList">Share list</button><button class="btn grow" data-act="smarter">Smarter list from receipts</button>${done ? '<button class="btn grow" data-act="clearTicks">Clear ticks</button>' : ''}</div>
  <div class="row wrap"><button class="btn grow" data-act="clearList" style="${ui.clearListArm ? 'color:#fff;background:var(--hot);border-color:var(--hot)' : 'color:var(--hot)'}">${ui.clearListArm ? 'Tap again to clear the list' : 'Clear list'}</button>${hiddenCount(dates) ? `<button class="btn grow" data-act="restoreList">Show ${hiddenCount(dates)} removed item${hiddenCount(dates) > 1 ? 's' : ''}</button>` : ''}</div>`;
  return h;
}
function hiddenCount(dates) { return Object.keys(S.list.hidden).filter(k => k.startsWith(dates[0] + ':')).length; }
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
  let h = `<a class="cta" href="#make" data-tour="make">${ICON.pot}<div><b>What can I make?</b><span>${ready ? `${ready} ready now` : 'From what you have'}${soon.length ? ` · ${soon.length} to use soon` : ''}</span></div></a>
  <form class="row" data-form="addPantry" data-tour="addPantry"><input list="itemsList" id="pantryName" placeholder="Add an item you have" autocomplete="off" aria-label="Pantry item"><button class="btn primary" type="submit">Add</button></form>
`;
  if (!items.length) return h + `<div class="empty"><h3>Nothing tracked yet</h3><p>Scan a receipt, tick off your shopping list, or add items here.</p><a class="btn" href="#receipts">Scan a receipt</a></div>`;
  const sec = (title, arr) => arr.length ? `<section class="card flat"><div class="shop-h"><b>${title}</b><span class="small muted">${arr.length}</span></div>${arr.map(p => { const d = p.exp ? C.daysBetween(t, p.exp) : null; const cls = d == null ? 'none' : d < 0 ? 'hot' : d <= 3 ? 'warn' : ''; return `<div class="pi" data-act="pantryItem" data-key="${p.key}" style="cursor:pointer"><span class="dot ${cls}"></span><div class="grow"><div style="font-weight:700">${esc(p.name)}</div><div class="tiny muted">${p.item ? C.fmtQty(p.qty, p.unit) : ''}${d != null ? ` · ${d < 0 ? 'past its date' : d === 0 ? 'use today' : d === 1 ? '1 day left' : d > 60 ? 'keeps for ages' : d + ' days left'}` : ''}</div></div><span class="small muted">›</span></div>`; }).join('')}</section>` : '';
  return h + sec('Use soon', soon) + sec('In the fridge & cupboard', rest) + sec('Long-life', longLife);
}
function viewMake() {
  const can = C.whatCanIMake(S).slice(0, 30);
  if (!can.length) return `<div class="empty"><h3>Your pantry is empty</h3><p>Add what you have, or scan a receipt, and Mise will rank recipes you can make with it.</p><a class="btn primary" href="#pantry">Go to pantry</a></div>`;
  return can.map(x => `<div class="card"><button class="row" style="border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit" data-act="openRecipe" data-key="${esc(x.r.id)}">${thumb(x.r)}<div class="grow"><div style="font-weight:700">${esc(x.r.title)}</div><div class="small muted">${Math.round(x.cover * 100)}% in stock${x.usesExp ? ' · <span class="tag warn">uses food to use soon</span>' : ''}</div></div></button>
    <div class="bar"><i style="width:${x.cover * 100}%"></i></div>${x.missing.length ? `<div class="row between"><span class="small muted grow">Missing: ${esc(x.missing.join(', '))}</span><button class="btn sm" data-act="addMissing" data-key="${esc(x.r.id)}">Add to list</button></div>` : '<span class="small" style="color:var(--accent);font-weight:700">You have everything.</span>'}</div>`).join('');
}

/* ================= More ================= */
function viewMore() {
  const tiles = [['#receipts', ICON.receipt, 'Receipts', 'Scan & review'], ['#deals', ICON.tag, 'Deals', 'Offers you spotted'], ['#insights', ICON.chart, 'Spending', 'Where it goes'], ['#quiz', ICON.pot, 'Taste quiz', 'Diet & likes'], ['#settings', ICON.gear, 'Settings', 'Household, shops, backup'], ['#tour', ICON.spark, 'App tour', 'How everything works'], ['#install', ICON.phone, 'Install', 'Home screen & Android']];
  return `<div class="more-grid">${tiles.map(t => `<a href="${t[0]}">${t[1]}<b>${t[2]}</b><span>${t[3]}</span></a>`).join('')}</div>`;
}
function viewInstall() {
  return `<div class="card"><h2>Android</h2><p style="margin:0">Install the APK from the GitHub releases page, or in Chrome tap <b>⋮ → Install app</b> (or <b>Add to Home screen</b>) on this page.</p></div>
  <div class="card"><h2>iPhone</h2><p style="margin:0">Open this page in Safari, tap <b>Share → Add to Home Screen</b>. It works offline and opens full screen.</p></div>
  <div class="card"><h3>Your data</h3><p class="small muted" style="margin:0">Everything is stored on this device. Use <a href="#settings">Settings → Back up</a> to move it to another phone.</p></div>`;
}

/* ================= Receipts ================= */
function viewReceipts() {
  if (ui.receiptDraft) return viewReceiptDraft();
  let h = `<div class="card" data-tour="receiptAdd"><h2>Add a receipt</h2>
    <div class="row"><label class="f grow">Shop<select id="rcShop">${shopsOpts(S.settings.defaultShop)}</select></label><label class="f grow">Date<input type="date" id="rcDate" value="${C.today()}"></label></div>
    <div class="row"><label class="btn primary grow" for="rcFile">Take a photo</label><label class="btn grow" for="rcPick">Choose screenshot</label></div>
    <input type="file" id="rcFile" accept="image/*" capture="environment" hidden data-change="receiptFile"><input type="file" id="rcPick" accept="image/*" hidden data-change="receiptFile">
    <button class="btn block" data-act="pasteReceipt">Paste receipt text</button>
    ${ui.ocr ? `<div class="row small"><span class="spinner"></span><span>${esc(ui.ocr)}</span></div>` : ''}
    <p class="tiny muted" style="margin:0">Lidl Plus screenshots read best. Read on your phone, never uploaded.</p></div>`;
  if (!S.receipts.length) return h + `<div class="empty"><h3>No receipts yet</h3><p>Each receipt teaches Mise your real prices, fills your pantry and earns you a review of your shop.</p></div>`;
  h += `<section class="card flat"><div class="shop-h"><b>History</b><span class="small muted">${S.receipts.length}</span></div>${S.receipts.slice(0, 30).map(r => `<div class="pi" data-act="reviewReceipt" data-key="${r.id}" style="cursor:pointer"><div class="grow"><div style="font-weight:700">${esc(r.shop)} · ${fmtDay(r.date)}</div><div class="tiny muted">${r.lines.length} items</div></div><b class="num">${C.eur(r.total)}</b><span class="small muted">›</span></div>`).join('')}</section>`;
  return h;
}
function viewReceiptDraft() {
  const d = ui.receiptDraft;
  const included = d.lines.filter(l => l.include);
  const sum = included.reduce((a, l) => a + (+l.price || 0), 0);
  const opts = sel => `<option value="">Not on the list / skip match</option>` + CATALOG.slice().sort((a, b) => a.n.localeCompare(b.n)).map(i => `<option value="${i.id}"${i.id === sel ? ' selected' : ''}>${esc(i.n)}</option>`).join('');
  return `<div class="card" data-tour="receiptDraft"><h2>Check the items</h2><p class="small muted" style="margin:0">Fix any wrong matches. Mise remembers.</p>
  <div class="row small"><b>${esc(d.shop)}</b><span class="muted">· ${fmtDay(d.date)}</span></div>
  <div>${d.lines.map((l, i) => `<div class="rl"><input type="checkbox" data-change="rcInclude" data-idx="${i}"${l.include ? ' checked' : ''} aria-label="Include line"><div><div class="src">${esc(l.text)}${l.qty > 1 ? ' ×' + l.qty : ''}${l.discount ? ' · −' + C.eur(l.discount) + ' off' : ''}</div><select data-change="rcItem" data-idx="${i}" aria-label="What is this?">${opts(l.item)}</select></div><input type="number" inputmode="decimal" step="0.01" value="${l.price}" data-change="rcPrice" data-idx="${i}" aria-label="Price"></div>`).join('')}</div>
  <div class="row between"><span class="small muted">Items add up to</span><b class="num">${C.eur(sum)}</b></div>
  <label class="f">Total on the receipt (€)<input type="number" inputmode="decimal" step="0.01" value="${d.total ?? ''}" data-change="rcTotal" placeholder="Type it if it wasn't read"></label>
  ${d.total != null && Math.abs(d.total - sum) > 0.05 ? `<div class="tag warn" style="white-space:normal;padding:8px">Receipt total is ${C.eur(d.total)}, the lines add up to ${C.eur(sum)} (${C.eur(Math.abs(d.total - sum))} ${sum > d.total ? 'too much' : 'too little'}). ${sum > d.total ? 'Look for a line that isn\'t an item, or a discount that was missed.' : 'A line may be missing: use "Add a missed line".'} The receipt total is what's saved for spending.</div>` : ''}
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
    `);
}

/* ================= Builder ================= */
function sel(id, obj, cur, any = 'Any') { return `<select id="${id}" data-bspec="${id.replace('b-', '')}"><option value="">${any}</option>${Object.entries(obj).map(([k, v]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${esc(v.n)}</option>`).join('')}</select>`; }
function viewBuilder() {
  const sp = ui.builderSpec, b = ui.builder;
  const examples = ['Rice with beef mince & onions', 'Quick spicy veggie noodles', 'Cheap curry for 2', 'Creamy chicken pasta, no mushrooms', 'Salmon, light, 25 min'];
  let h = `<div class="card"><textarea data-tour="bDesc" id="bDesc" data-in="bDesc" placeholder="What do you fancy? e.g. rice dish with beef mince and onions" style="min-height:76px">${esc(ui.bDesc || '')}</textarea>
    <div class="chips">${examples.map(e => `<button class="chip" data-act="bExample" data-val="${esc(e)}">${esc(e)}</button>`).join('')}</div>
    <div class="chips wrap" data-tour="bOpts"><button class="chip" data-act="bOpt" data-val="pantryFirst" aria-pressed="${ui.builderOpts.pantryFirst}">Use what I have</button><button class="chip" data-act="bFlag" data-val="healthy" aria-pressed="${!!sp.healthy}">Healthier</button><button class="chip" data-act="bFlag" data-val="cheap" aria-pressed="${!!sp.cheap}">Cheaper</button><button class="chip" data-act="bFlag" data-val="diet" aria-pressed="${sp.diet === 'veg'}">Veggie</button></div>
    <details data-tour="bParts"><summary class="small" style="font-weight:700;cursor:pointer">Pick parts yourself</summary>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <label class="f">Main${sel('b-protein', B_PROTEIN, sp.protein)}</label>
        <label class="f">With${sel('b-base', B_BASE, sp.base)}</label>
        <label class="f">Flavour${sel('b-style', B_STYLE, sp.style)}</label>
        <label class="f">Serves<input type="number" id="b-serves" data-bspec="serves" min="1" max="12" value="${sp.serves || S.settings.household}"></label>
      </div>
      <div class="chips wrap" style="margin-top:8px">${Object.keys(B_VEG).map(v => `<button class="chip" data-act="bVeg" data-val="${v}" aria-pressed="${(sp.veg || []).includes(v)}">${v}</button>`).join('')}</div>
      <div class="seg" style="margin-top:8px">${[[0, 'Mild'], [1, 'Medium'], [2, 'Hot']].map(([k, n]) => `<button data-act="bSpicy" data-val="${k}" aria-pressed="${(sp.spicy ?? 1) === k}">${n}</button>`).join('')}</div>
    </details>
    <div class="row" data-tour="bGo"><button class="btn primary grow" data-act="bIdeas">Get ideas</button><button class="btn" data-act="bAI"${ui.builderBusy ? ' disabled' : ''}>${ui.builderBusy ? '<span class="spinner"></span>' : 'Ask AI'}</button></div></div>`;
  if (ui.ideas) {
    const I = ui.ideas;
    h += `<section class="card" data-tour="ideas" id="ideasCard"><div class="row between"><h2>Ideas</h2><button class="btn sm" data-act="bIdeas">Shuffle</button></div>${(I.notes || []).map(n => `<span class="tag warn" style="white-space:normal">${esc(n)}</span>`).join('')}
      ${I.built.map((r, k) => { const c = C.recipeCost(S, r, r.serves); return `<button class="meal" style="width:100%;border:1px solid var(--line);border-radius:12px;background:${b && b.id === r.id ? 'var(--accent-soft)' : 'var(--card)'};cursor:pointer;color:inherit;text-align:left" data-act="pickIdea" data-val="${k}"><div class="thumb">${esc(r.title[0])}</div><div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${r.time} min · ≈ ${C.eur(c.perServe)} a serving</div></div></button>`; }).join('')}
      ${I.library.length ? `<div class="small muted" style="font-weight:700;margin-top:6px">Already in your recipes</div>` + I.library.map(x => `<button class="meal" style="width:100%;border:1px solid var(--line);border-radius:12px;background:var(--card);cursor:pointer;color:inherit;text-align:left" data-act="openRecipe" data-key="${esc(x.r.id)}">${thumb(x.r)}<div class="grow"><div class="t">${esc(x.r.title)}</div><div class="small muted">${x.r.time} min</div></div></button>`).join('') : ''}
      ${ui.ideasWeb === 'loading' ? '<div class="small muted row"><span class="spinner"></span> Looking online…</div>' : (ui.ideasWeb || []).length ? `<div class="small muted" style="font-weight:700;margin-top:6px">Online recipes</div>` + ui.ideasWeb.slice(0, 6).map(r => `<button class="meal" style="width:100%;border:1px solid var(--line);border-radius:12px;background:var(--card);cursor:pointer;color:inherit;text-align:left" data-act="openRecipe" data-key="${esc(r.id)}">${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${esc(r.area || r.cat || 'Online')}</div></div></button>`).join('') : ''}
      <div class="row wrap"><button class="btn sm grow" data-act="bAI">Ask AI for this</button><a class="btn sm grow" href="#add" data-act="newRecipe">Write my own</a></div></section>`;
  }
  if (b) {
    const cost = C.recipeCost(S, b, b.serves);
    h += `<div class="card" id="builtCard"><h2>${esc(b.title)}</h2><div class="row wrap" style="gap:6px"><span class="tag">${b.time} min</span><span class="tag">Serves ${b.serves}</span><span class="tag yours">≈ ${C.eur(cost.total)} · ${C.eur(cost.perServe)} each</span>${b.src === 'ai' ? '<span class="tag">AI</span>' : ''}</div>
      ${b.src !== 'ai' ? `<div class="chips" data-tour="bTweaks">${Object.entries(C.TWEAKS).map(([k, [n]]) => `<button class="chip" data-act="bTweak" data-val="${k}">${n}</button>`).join('')}</div>` : ''}
      <div class="tiny muted">Tap an ingredient to remove or swap it</div>
      <ul class="ings" data-tour="bIngs">${b.ings.map((i, k) => `<li data-act="bIng" data-idx="${k}" style="cursor:pointer"><span class="q">${esc(fmtIng(i.q, i.u))}</span><span class="grow">${esc(i.name)}</span><span class="muted">›</span></li>`).join('')}</ul>
      <ol class="steps">${b.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="row wrap" data-tour="bSaveRow"><button class="btn primary grow" data-act="bSave">Add to plan</button><button class="btn grow" data-act="bSaveOnly">Save</button></div></div>`;
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
  let h = `<form class="card" data-form="addDeal" data-tour="deal"><h2>Save a deal</h2>
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
  return `<div class="card" data-tour="sHouse"><h2>Household</h2>
    <label class="f">People you usually cook for<div class="stepper" style="align-self:flex-start"><button data-act="setNum" data-key="household" data-val="-1">−</button><span>${st.household}</span><button data-act="setNum" data-key="household" data-val="1">+</button></div></label>
    <label class="f">Weekly food budget (€)<input type="number" inputmode="decimal" data-setting="budget" value="${st.budget || ''}" placeholder="No budget"></label>
    <div class="small muted" style="font-weight:600">Nights to plan dinners</div><div class="daypick">${DOW.map((d, i) => `<button data-act="toggleNight" data-val="${i}" aria-pressed="${!!st.nights[i]}">${d}</button>`).join('')}</div></div>
  <div class="card" data-tour="sShops"><h2>Shops</h2>
    <div class="chips wrap">${SHOPS.map(s => `<button class="chip" data-act="toggleShop" data-val="${s}" aria-pressed="${st.shops.includes(s)}">${s}</button>`).join('')}</div>
    <label class="f">Main shop<select data-setting="defaultShop">${st.shops.map(s => `<option${s === st.defaultShop ? ' selected' : ''}>${s}</option>`).join('')}</select></label></div>
  <div class="card" data-tour="sPersona"><h2>Personality</h2>
    <div class="small muted" style="font-weight:600">Receipt review tone</div><div class="seg">${[['gentle', 'Gentle'], ['cheeky', 'Cheeky'], ['savage', 'Savage']].map(([k, n]) => `<button data-act="setTone" data-val="${k}" aria-pressed="${st.tone === k}">${n}</button>`).join('')}</div>
    <label class="f">How adventurous should suggestions be? <span class="tiny">${st.adventure < 25 ? 'Mostly favourites' : st.adventure < 60 ? 'A good mix' : 'Lots of new things'}</span><input type="range" min="0" max="100" step="5" data-setting="adventure" value="${st.adventure}" style="min-height:0;padding:0;accent-color:var(--accent)"></label></div>
  <div class="card" data-tour="sTastes"><h2>Likes & dislikes</h2>
    ${Object.keys(S.likes).length ? `<div class="card flat">${Object.entries(S.likes).sort((a, b) => a[1] - b[1]).map(([k, v]) => `<div class="pi"><div class="grow"><b>${esc(ITEM[k] ? ITEM[k].n : k.replace(/^x:/, ''))}</b></div>${v <= -9 ? '<span class="tag deal">can\'t eat</span>' : v < 0 ? '<span class="tag warn">don\'t like</span>' : '<span class="tag yours">love</span>'}<button class="icon-btn" data-act="removeLike" data-key="${esc(k)}" aria-label="Remove">${ICON.x}</button></div>`).join('')}</div>` : ''}
    <a class="btn" href="#quiz" data-tour="quizBtn">Retake the taste quiz</a>${(S.settings.diet || []).length ? `<p class="small" style="margin:0">Diet: <b>${esc(S.settings.diet.map(d => (C.DIETS.find(x => x[0] === d) || [, d])[1]).join(', '))}</b></p>` : ''}
    <form class="row wrap" data-form="addLike"><input list="itemsList" id="likeName" placeholder="e.g. Mushrooms" autocomplete="off" style="flex:1 1 140px" aria-label="Ingredient"><select id="likeVal" style="flex:0 1 140px" aria-label="Preference"><option value="-1">Don't like</option><option value="-9">Can't eat</option><option value="1">Love it</option></select><button class="btn primary" type="submit">Add</button></form></div>
  ${(() => { const tp = C.tasteProfile(S); const chips = (arr, cls) => arr.map(x => `<span class="tag ${cls}" style="font-size:13px">${esc(x)}</span>`).join(' '); return `<div class="card" data-tour="sLearned"><h2>What Mise has learned</h2>
    ${tp.loves.length || tp.avoids.length || tp.cuisines.length ? `${tp.loves.length ? `<div class="small"><b>You like</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.loves, 'yours')}</div></div>` : ''}${tp.avoids.length ? `<div class="small"><b>You avoid</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.avoids, 'warn')}</div></div>` : ''}${tp.cuisines.length ? `<div class="small"><b>Favourite cuisines</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.cuisines, '')}</div></div>` : ''}` : '<p class="small muted" style="margin:0">Nothing yet. Take the quiz, rate meals and scan receipts.</p>'}
    <p class="tiny muted" style="margin:0">Learns from the quiz, ratings, what you cook, swap and buy. ${tp.rated} rated · ${tp.cooked} cooked.</p>
    <button class="btn sm" data-act="resetLearning" style="color:var(--hot);align-self:flex-start">${ui.resetLearnArm ? 'Tap again to reset' : 'Reset learning'}</button></div>`; })()}
  <div class="card" data-tour="sAI"><h2>AI (optional)</h2><p class="small muted" style="margin:0">Optional. Everything works without it.</p>
    <label class="f">AI engine<select data-setting="ai"><option value="off"${st.ai === 'off' ? ' selected' : ''}>Off</option><option value="chrome"${st.ai === 'chrome' ? ' selected' : ''}${ui.aiStatus.chrome ? '' : ' disabled'}>On this device (Chrome built-in)${ui.aiStatus.chrome ? '' : ' – not available here'}</option><option value="puter"${st.ai === 'puter' ? ' selected' : ''}>Puter (free account, cloud)</option></select></label>
    <p class="tiny muted" style="margin:0">${st.ai === 'puter' ? 'Puter asks you to sign in to a free Puter account the first time. Your recipe requests go to their cloud and use your account\'s allowance.' : st.ai === 'chrome' ? 'Runs on this device with Chrome\'s built-in model. Nothing leaves your phone.' : 'On-device AI is only available on some desktop Chrome browsers for now.'}</p></div>
  <div class="card"><h2>Recipe library</h2><label class="f">TheMealDB API key<input data-setting="mealdbKey" value="${esc(st.mealdbKey)}" autocomplete="off"></label><p class="tiny muted" style="margin:0">"1" is TheMealDB's free test key. Supporters of TheMealDB get a personal key.</p></div>
  <div class="card"><h2>Appearance</h2><div class="seg">${[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, n]) => `<button data-act="setTheme" data-val="${k}" aria-pressed="${(st.theme || 'auto') === k}">${n}</button>`).join('')}</div></div>
  <div class="card" data-tour="sBackup"><h2>Back up & move</h2><p class="small muted" style="margin:0">Data stays on this phone.</p>
    <div class="row wrap"><button class="btn grow" data-act="exportData">Back up</button><label class="btn grow" for="importFile">Restore</label><input type="file" id="importFile" accept="application/json,.json" hidden data-change="importData"></div>
    <button class="btn" data-act="resetData" style="color:var(--hot)">${ui.resetArm ? 'Tap again to erase everything' : 'Erase all data'}</button></div>
`;
}

/* ================= Sheet ================= */
function openSheet(html) { const w = $('#sheet'); if (w.hidden) { history.pushState({ sheet: 1 }, ''); } w.hidden = false; setSheet(html); document.body.style.overflow = 'hidden'; }
function setSheet(html) { $('#sheetBody').innerHTML = `<button class="sheet-x" data-act="closeSheet" aria-label="Close">${ICON.x}</button>` + html; }
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
    for (const p of picks) { keepSuggestion(p); (S.plan[p.date] = S.plan[p.date] || []).push({ rid: p.rid, serves: S.settings.household || 2, wildcard: p.wildcard }); }
    save(); render(); toast(`Planned ${picks.length} dinner${picks.length > 1 ? 's' : ''}. One is a wildcard to keep things fresh.`);
  },
  addMeal: el => { ui.sheetServes = null; openSheet(''); pickerSheet(el.dataset.date); },
  pickRecipe: el => { addToPlan(el.dataset.key, ui.pickDate); closeSheet(); render(); toast('Added to ' + fmtDay(ui.pickDate)); },
  pickSuggest: () => { const p = keepSuggestion(C.suggestWeek(S, [ui.pickDate])[0]); if (!p) { toast('No suggestion available'); return; } addToPlan(p.rid, ui.pickDate); closeSheet(); render(); toast(`Added ${R[p.rid].title}`); },
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
    const p = keepSuggestion(C.suggestWeek(S, [d]).find(x => x.rid !== e.rid));
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
      ${r.loose ? `<div class="row"><label class="f grow">Aisle<select id="ciAisle">${AISLES.map(a => `<option value="${a[0]}"${a[0] === r.aisle ? ' selected' : ''}>${a[1]}</option>`).join('')}</select></label><label class="f" style="width:110px">Price €<input id="ciPrice" type="number" inputmode="decimal" step="0.01" value="${r.cost != null ? r.cost : ''}"></label></div><button class="btn primary" data-act="saveCustom" style="margin:8px 0">Save for next time</button>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px"><button class="btn" data-act="haveIt">I already have this</button><button class="btn" data-act="hideItem">Remove from this list</button>${r.extra ? '<button class="btn" data-act="delExtra">Delete added item</button>' : ''}<button class="btn ghost" data-act="closeSheet">Cancel</button></div>`);
  },
  saveCustom: () => { const r = ui.menuRow; S.customInfo = S.customInfo || {}; const pr = $('#ciPrice').value; S.customInfo[r.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()] = { aisle: $('#ciAisle').value, price: pr === '' ? undefined : parseFloat(pr) }; save(); closeSheet(false, () => render()); toast('Saved'); },
  haveIt: () => { const r = ui.menuRow; if (r.item) C.addPantry(S, r.item, r.buy || r.qty, r.name); else S.list.hidden[r.key] = true; save(); closeSheet(); render(); toast('Added to your pantry'); },
  hideItem: () => { S.list.hidden[C.weekDates(ui.listWeek)[0] + ':' + ui.menuRow.key] = true; save(); closeSheet(); render(); },
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
    openSheet(`<h2>Smarter list for next week</h2><p class="small muted">Your regulars, treats trimmed, less waste.</p>
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
  bBuild: () => { const spec = C.completeSpec(readBuilderSpec(), S, ui.builderOpts.pantryFirst); ui.lastSpec = spec; ui.builder = C.buildMeal(spec); ui.ideas = null; render(); setTimeout(() => { const c = $('#builtCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  bIdeas: () => {
    const text = (ui.bDesc || '').trim(); if (!text && !ui.builderSpec.protein) { toast('Type what you fancy first, e.g. "rice with beef mince and onions"'); return; }
    const base = readBuilderSpec(); const I = C.ideasFor(S, text || [ui.builderSpec.protein, ui.builderSpec.base].filter(Boolean).join(' '), 3);
    for (const k of ['protein', 'base', 'serves', 'spicy', 'healthy', 'cheap', 'diet']) if (base[k] !== undefined && ui.builderSpec[k] !== undefined) for (const r of I.built) r.spec[k] = base[k];
    ui.ideas = I; ui.builder = null; ui.ideasWeb = 'loading'; render(); setTimeout(() => { const c = $('#ideasCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
    const q = I.query || text.split(/\s+/).filter(w => w.length > 3).slice(0, 2).join(' ');
    (async () => { let res = []; try { if (q) res = await C.mdbSearch(S, q); if (!res.length && I.items[0]) res = await C.mdbByIngredient(S, ITEM[I.items[0]].n.replace(/s$/, '')); } catch (e) { res = []; } if (ui.ideas === I) { ui.ideasWeb = res.filter(r => r.stub || !C.ruledOut(S, r)); if (ui.route === 'builder') { const y = scrollY; render(); scrollTo(0, y); } } })();
  },
  bIng: el => {
    const b = ui.builder, i = b.ings[+el.dataset.idx]; ui.bIngSel = i;
    openSheet(`<h2>${esc(i.name)}</h2><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">${b.spec ? `<button class="btn" data-act="bEdit" data-val="remove">Remove it</button><button class="btn" data-act="bEdit" data-val="swap">Swap for something else</button>` : `<button class="btn" data-act="bEdit" data-val="remove">Remove it</button>`}<button class="btn" data-act="bEdit" data-val="never" style="color:var(--hot)">I don't like it (never use)</button><button class="btn ghost" data-act="closeSheet">Cancel</button></div>`);
  },
  bEdit: el => {
    const mode = el.dataset.val, i = ui.bIngSel, b = ui.builder;
    if (mode === 'never') { S.likes[C.likeKey(i)] = -1; save(); }
    if (!b.spec) { b.ings = b.ings.filter(x => x !== i); closeSheet(false, () => render()); toast('Removed'); return; }
    const e = C.editSpec(b.spec, i.name, mode === 'swap' ? 'swap' : 'remove');
    const full = C.completeSpec(e.spec, S, ui.builderOpts.pantryFirst); ui.lastSpec = full; ui.builder = C.buildMeal(full);
    closeSheet(false, () => { render(); const c = $('#builtCard'); if (c) c.scrollIntoView({ block: 'start' }); }); toast(mode === 'never' ? "Noted. Won't use it again" : e.msg);
  },
  pickIdea: el => { const r = ui.ideas.built[+el.dataset.val]; ui.builder = r; ui.lastSpec = r.spec; render(); setTimeout(() => { const c = $('#builtCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  ideasOnline: () => { const id = ui.ideas.items[0]; ui.recTab = 'online'; ui.recQuery = ITEM[id].n; location.hash = 'recipes'; setTimeout(() => onlineSearch(ITEM[id].n.replace(/s$/, '')), 60); },
  bTweak: el => { if (!ui.lastSpec) return; const s = { ...ui.lastSpec, veg: [...(ui.lastSpec.veg || [])] }; C.TWEAKS[el.dataset.val][1](s); const full = C.completeSpec(s, S, ui.builderOpts.pantryFirst); ui.lastSpec = full; ui.builder = C.buildMeal(full); render(); toast(C.TWEAKS[el.dataset.val][0] + ' version'); },
  bAI: async () => {
    const desc = (ui.bDesc || '').trim(); if (!desc) { toast('Type what you fancy first'); return; }
    if (S.settings.ai === 'off') { openSheet(`<h2>Ask AI</h2><p class="muted">AI understands any dish or ingredient. It's free: it runs through Puter, and you sign in to a free Puter account the first time. Your request goes to their cloud.</p><div class="row"><button class="btn grow" data-act="closeSheet">Not now</button><button class="btn primary grow" data-act="aiEnable">Turn on & ask</button></div>`); return; }
    ui.builderBusy = true; render();
    try { const avoid = Object.entries(S.likes).filter(([, v]) => v < 0).map(([k]) => ITEM[k] ? ITEM[k].n : k.replace(/^x:/, '')).concat([...C.dietBlocks(S)].map(id => ITEM[id].n)).slice(0, 40);
      const list = await C.aiIdeas(S.settings.ai, desc, readBuilderSpec().serves || S.settings.household, avoid);
      ui.ideas = { built: list, library: [], items: [], notes: ['Written by AI'], query: '' }; ui.ideasWeb = []; ui.builder = null; }
    catch (e) { toast('AI could not answer: ' + (e.message || 'unknown error').slice(0, 80)); }
    ui.builderBusy = false; render(); setTimeout(() => { const c = $('#ideasCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  },
  aiEnable: () => { S.settings.ai = 'puter'; save(); closeSheet(false, () => A.bAI()); },
  bSave: () => { const r = ui.builder; S.recipes[r.id] = r; refreshRecipes(); save(); ui.sheetRecipe = R[r.id]; ui.sheetServes = r.serves; ui.sheetCtx = null; openSheet(''); renderRecipeSheet(); toast('Saved. Pick a day below.'); },
  bSaveOnly: () => { const r = ui.builder; S.recipes[r.id] = r; refreshRecipes(); save(); toast('Saved to your recipes'); },
  clearWeek: () => {
    if (!ui.clearArm) { ui.clearArm = true; render(); setTimeout(() => { if (ui.clearArm) { ui.clearArm = false; if (ui.route === 'plan') render(); } }, 3500); return; }
    ui.clearArm = false; ui.undoPlan = JSON.stringify(S.plan);
    for (const d of C.weekDates(ui.weekOffset)) delete S.plan[d];
    save(); render(); toast('Week cleared'); },
  clearList: () => {
    if (!ui.clearListArm) { ui.clearListArm = true; render(); setTimeout(() => { if (ui.clearListArm) { ui.clearListArm = false; if (ui.route === 'list') render(); } }, 3500); return; }
    ui.clearListArm = false; const dates = C.weekDates(ui.listWeek); const L = C.buildList(S, dates);
    for (const r of L.rows) S.list.hidden[dates[0] + ':' + r.key] = true; for (const st of L.staples) S.list.hidden[st.key] = true;
    S.list.extras = []; S.list.checked = {}; save(); render(); toast('List cleared. Your meal plan is unchanged.'); },
  restoreList: () => { const ws = C.weekDates(ui.listWeek)[0]; for (const k of Object.keys(S.list.hidden)) if (k.startsWith(ws + ':') || k.startsWith('s:')) delete S.list.hidden[k]; save(); render(); },
  ingMenu: el => {
    const r = ui.sheetRecipe, i = r.ings[+el.dataset.idx], cur = C.likeOf(S, i); ui.ingSel = i;
    setSheet(`<h2>${esc(i.name)}</h2><p class="small muted">Mise uses this when suggesting meals and building recipes, across every recipe that contains it.</p>
      <div style="display:flex;flex-direction:column;gap:8px">${[[1, 'Love it', 'More meals with this'], [0, 'No opinion', 'Treat it normally'], [-1, "Don't like it", 'Suggest it less and leave it out of built meals'], [-9, "Can't eat it", 'Allergy or diet: never suggest meals with it']].map(([v, n, d]) => `<button class="btn" style="justify-content:flex-start;text-align:left;min-height:56px;${cur === v ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}" data-act="setLike" data-val="${v}"><div><b>${n}</b><div class="tiny muted" style="font-weight:500">${d}</div></div></button>`).join('')}
      <button class="btn ghost" data-act="backToRecipe">Back to recipe</button></div>`);
  },
  setLike: el => { const k = C.likeKey(ui.ingSel), v = +el.dataset.val; if (v) S.likes[k] = v; else delete S.likes[k]; save(); renderRecipeSheet(); render(); toast(v === 0 ? 'Cleared' : v > 0 ? 'Noted: you love it' : v <= -9 ? "Noted: never suggest it" : "Noted: you don't like it"); },
  backToRecipe: () => renderRecipeSheet(),
  removeLike: el => { delete S.likes[el.dataset.key]; save(); render(); },
  removePhoto: () => { delete S.photos[ui.sheetRecipe.id]; save(); renderRecipeSheet(); render(); },
  quizDiet: el => { const k = el.dataset.val, d = S.settings.diet || []; S.settings.diet = d.includes(k) ? d.filter(x => x !== k) : [...d, k]; if (k === 'vegan' && S.settings.diet.includes('vegan') && !S.settings.diet.includes('vegetarian')) { /* vegan covers it */ } save(); render(); },
  quizStart: () => { const blocked = C.dietBlocks(S); ui.quiz.deck = C.TASTE_DECK.filter(id => ITEM[id] && !blocked.has(id)); ui.quiz.i = 0; ui.quiz.votes = {}; ui.quiz.stage = 'swipe'; render(true); },
  quizVote: el => quizVote(+el.dataset.val),
  quizBack: () => { const q = ui.quiz; if (!q.i) return; q.i--; const id = q.deck[q.i]; delete q.votes[id]; delete S.likes[id]; save(); render(); },
  quizFinish: () => { ui.quiz.i = ui.quiz.deck.length; render(); },
  quizClose: () => { const first = ui.quiz && ui.quiz.first; S.settings.quizDone = true; save(); ui.quiz = null; location.hash = 'plan';
    const clash = C.weekDates(0).concat(C.weekDates(1)).flatMap(d => (S.plan[d] || []).filter(e => !e.cooked && R[e.rid] && C.ruledOut(S, R[e.rid])).map(e => R[e.rid].title));
    if (clash.length) setTimeout(() => openSheet(`<h2>Swap ${clash.length} planned meal${clash.length > 1 ? 's' : ''}?</h2><p class="muted">${esc(clash.join(', '))} use${clash.length > 1 ? '' : 's'} things you said no to.</p><div class="row"><button class="btn grow" data-act="closeSheet">Keep</button><button class="btn primary grow" data-act="swapAvoided">Swap them</button></div>`), 250);
    else if (first && !S.settings.tourSeen) setTimeout(askTour, 250); },
  newRecipe: () => { ui.editDraft = null; if (location.hash !== '#add') location.hash = 'add'; else render(true); },
  editRecipe: el => {
    const r = R[el.dataset.key]; if (!r) return; const copy = String(r.id).startsWith('b:');
    ui.editDraft = { id: copy ? null : r.id, title: r.title + (copy ? ' (mine)' : ''), serves: r.serves, time: r.time, ing: r.ings.map(i => (i.u === 'taste' ? '' : fmtIng(i.q, i.u) + ' ') + i.name).join('\n'), steps: r.steps.join('\n'), img: S.photos[r.id] || r.img || null };
    closeSheet(false, () => { location.hash = 'add'; });
  },
  arPaste: () => openSheet(`<h2>Paste a recipe</h2><p class="small muted">From a website, message or note. Mise splits it into ingredients and steps.</p><textarea id="arPasteText" style="min-height:240px"></textarea><div class="row" style="margin-top:10px"><button class="btn grow" data-act="closeSheet">Cancel</button><button class="btn primary grow" data-act="arPasteGo">Use it</button></div>`),
  arPasteGo: () => { const p = C.splitRecipeText($('#arPasteText').value); const e = ui.editDraft; if (p.title && !e.title) e.title = p.title; if (p.serves) e.serves = p.serves; if (p.time) e.time = p.time; e.ing = p.ings.map(i => i.raw).join('\n'); e.steps = p.steps.join('\n'); closeSheet(false, () => { render(); toast(`${p.ings.length} ingredients, ${p.steps.length} steps`); }); },
  arSave: () => {
    const e = readAddForm(); if (!e.title) { toast('Give it a name'); return; } if (!e.ing.trim()) { toast('Add at least one ingredient'); return; }
    const r = C.makeOwnRecipe({ id: e.id, title: e.title, serves: e.serves, time: e.time, ingText: e.ing, stepText: e.steps });
    S.recipes[r.id] = r; if (e.img && e.img.startsWith('data:')) S.photos[r.id] = e.img; refreshRecipes(); save();
    const unknown = r.ings.filter(i => !i.item && !i.skip && i.u !== 'taste').map(i => i.name);
    ui.editDraft = null; ui.recTab = 'mine'; location.hash = 'recipes';
    setTimeout(() => { openRecipe(r.id); if (unknown.length) toast(`Saved. New to Mise: ${unknown.slice(0, 3).join(', ')}. They'll go on your list as-is.`); else toast('Recipe saved'); }, 120);
  },
  resetLearning: () => { if (!ui.resetLearnArm) { ui.resetLearnArm = true; render(); setTimeout(() => { ui.resetLearnArm = false; }, 3500); return; } ui.resetLearnArm = false; S.ingPref = {}; S.tagPref = {}; S.skipped = {}; save(); render(); toast('Learning reset. Likes, diet and ratings kept.'); },
  swapAvoided: () => { let n = 0; for (const d of C.weekDates(0).concat(C.weekDates(1))) { const list = S.plan[d] || []; for (let i = 0; i < list.length; i++) { const r = R[list[i].rid]; if (r && !list[i].cooked && C.ruledOut(S, r)) { const p = keepSuggestion(C.suggestWeek(S, [d])[0]); if (p) { list[i] = { rid: p.rid, serves: list[i].serves }; n++; } else { list.splice(i--, 1); n++; } } } } save(); closeSheet(false, () => render()); toast(`Swapped ${n} meal${n === 1 ? '' : 's'}`); },
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
  onbDone: () => { S.settings.onboarded = true; save(); ui.quiz = { stage: 'diet', first: true }; closeSheet(false, () => { location.hash = 'quiz'; }); },
  tourStart: () => closeSheet(false, () => startTour()),
  onbShop: el => { A.toggleShop(el); onboarding(); },
  onbNum: el => { A.setNum(el); onboarding(); }
};
const CHANGE = {
  receiptFile: el => { const f = el.files && el.files[0]; if (f) readReceiptImage(f); },
  rcInclude: el => { ui.receiptDraft.lines[+el.dataset.idx].include = el.checked; render(); },
  rcItem: el => { ui.receiptDraft.lines[+el.dataset.idx].item = el.value; },
  rcTotal: el => { ui.receiptDraft.total = el.value === '' ? null : parseFloat(el.value); render(); },
  rcPrice: el => { ui.receiptDraft.lines[+el.dataset.idx].price = parseFloat(el.value) || 0; render(); },
  arPhoto: async el => { const f = el.files && el.files[0]; if (!f) return; readAddForm(); ui.editDraft.img = await shrinkImage(f); render(); },
  recipePhoto: async el => { const f = el.files && el.files[0]; if (!f) return; try { S.photos[ui.sheetRecipe.id] = await shrinkImage(f); save(); renderRecipeSheet(); render(); toast('Photo added'); } catch (e) { toast('Could not use that image'); } },
  importData: async el => { const f = el.files && el.files[0]; if (!f) return; try { S = C.importState(await f.text()); refreshRecipes(); save(); applyTheme(); render(); toast('Backup restored'); } catch (e) { toast(e.message); } }
};

function shrinkImage(file, max = 900) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.8)); }; img.onerror = rej; img.src = URL.createObjectURL(file); });
}
let autoBusy = false;
async function fillAutoImages() {
  if (autoBusy || !navigator.onLine) return; autoBusy = true; let changed = false;
  try {
    const want = [];
    for (const d of C.weekDates(ui.weekOffset)) for (const e of (S.plan[d] || [])) want.push(e.rid);
    if (ui.route === 'recipes') want.push(...Object.keys(R));
    for (const id of [...new Set(want)].slice(0, 30)) { const r = R[id]; if (!r || C.photoOf(S, r) || S.autoImg[id] !== undefined) continue; S.autoImg[id] = await C.autoImageFor(S, r); if (S.autoImg[id]) changed = true; }
  } catch (e) { /* offline or blocked */ }
  autoBusy = false; if (changed) { save(); if (!ui.tour && ['plan', 'recipes'].includes(ui.route)) render(); }
}

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
  if (ev.key === 'Escape') { if (ui.tour) endTour(); else closeSheet(); }
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
  if (f === 'addLike') { const v = $('#likeName').value.trim(); if (!v) return; const id = itemByName(v); S.likes[id || 'x:' + v.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim()] = +$('#likeVal').value; save(); render(); toast('Saved'); }
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

/* ================= Swipe down to close sheets ================= */
(function sheetSwipe() {
  const sh = document.querySelector('.sheet'); let y0 = null, dy = 0;
  sh.addEventListener('touchstart', e => { if (ui.tour) return; if (sh.scrollTop > 2 && !e.target.closest('.grab')) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
  sh.addEventListener('touchmove', e => {
    if (y0 == null) return; dy = e.touches[0].clientY - y0;
    if (dy > 0) { sh.classList.add('dragging'); sh.style.transform = `translateY(${dy}px)`; if (e.cancelable) e.preventDefault(); }
    else { y0 = null; sh.classList.remove('dragging'); sh.style.transform = ''; }
  }, { passive: false });
  const end = () => {
    if (y0 == null) return; sh.classList.remove('dragging');
    if (dy > 90) { sh.style.transition = 'transform .18s ease-in'; sh.style.transform = 'translateY(110%)'; setTimeout(() => { sh.style.transition = ''; sh.style.transform = ''; closeSheet(); }, 180); }
    else { sh.style.transition = 'transform .18s'; sh.style.transform = ''; setTimeout(() => { sh.style.transition = ''; }, 200); }
    y0 = null; dy = 0;
  };
  sh.addEventListener('touchend', end); sh.addEventListener('touchcancel', end);
})();

/* ================= Guided tour ================= */
const wait = ms => new Promise(r => setTimeout(r, ms));
const closeSheetP = () => new Promise(r => closeSheet(false, r));
const SAMPLE_RECEIPT = 'LIDL\nCHKN THIGH FLT 3.99 A\nWHL MILK 2L 1.89 A\nSPINACH 240G 1.49 A\nTAYTO CHS ONION 1.29 A\n3 x 1.29\nMONSTER ENERGY 1.25 A\nMONSTER ENERGY 1.25 A\nREADY MEAL LASAGNE 3.49 A\nBASMATI RICE 1KG 1.99 A\nTOTAL 18.92\nVISA 18.92';
function ensureMeals() {
  const dates = C.weekDates(0);
  if (dates.some(d => (S.plan[d] || []).length)) return;
  ui.tourAddedPlan = true;
  for (const p of C.suggestWeek(S, dates.slice(0, 4))) { keepSuggestion(p); (S.plan[p.date] = S.plan[p.date] || []).push({ rid: p.rid, serves: S.settings.household || 2, wildcard: p.wildcard }); }
  render();
}
async function openFirstMealSheet() {
  ensureMeals();
  const d = C.weekDates(0).find(x => (S.plan[x] || []).length);
  await openRecipe(S.plan[d][0].rid, { date: d, idx: 0 });
}
const TOUR = [
  { route: 'plan', title: 'Welcome to Mise', text: 'A quick walk through every feature. Tap Next to continue, or Skip to leave. Restart it any time from the menu (☰ top right) → App tour.' },
  { route: 'plan', scopeDoc: true, sel: '.tabbar', title: 'Getting around', text: 'Five tabs at the bottom: Plan your week, browse Recipes, Create a meal, your shopping List and your Pantry.' },
  { route: 'plan', scopeDoc: true, sel: '#menuBtn', title: 'Menu', text: 'The menu holds Receipts, Deals, Spending, the Taste quiz, Settings and this tour.' },
  { route: 'plan', sel: '[data-tour=weeknav]', title: 'Your week', text: 'The Plan tab shows one week of dinners. Use the arrows to move to next week (or back) and plan ahead.' },
  { route: 'plan', sel: '[data-tour=plansum]', title: 'Week at a glance', text: 'How many nights have a dinner, what the shopping list for this week should cost, and your weekly budget (set it in Settings).' },
  { route: 'plan', sel: '[data-tour=suggest]', title: 'Suggest my week', text: 'Tap "Suggest my week" to fill every empty night in one go. It mixes favourites with new ideas, avoids repeats and back-to-back proteins, and marks one meal as a Wildcard to keep things fresh. "List" jumps to the shopping list.' },
  { route: 'plan', sel: '.meal', before: ensureMeals, title: 'A planned dinner', text: 'Each dinner shows the recipe, servings and cooking time. Tap it to open the full recipe. (We filled a few nights with examples for the tour; they are removed at the end if your week was empty.)' },
  { route: 'plan', sel: '.meal .icon-btn', title: 'Mark it cooked', text: 'Tap the tick when you have cooked it. Mise takes the ingredients out of your pantry and asks for a star rating so it learns what you like.' },
  { route: 'plan', sel: '[data-tour=clearWeek]', title: 'Start over', text: '"Clear" empties the whole week in one go. Tap it twice to confirm, so you can\'t do it by accident.' },
  { route: 'plan', sel: '.addmeal', title: 'Add a meal to any night', text: 'Tap "+ Add a meal" under any day to pick a recipe: search your recipes, let Mise suggest one, build a new meal or browse thousands online.' },
  { route: 'plan', sheet: true, before: openFirstMealSheet, sel: '[data-tour=servings]', title: 'Recipe details', text: 'Tapping a dinner opens this sheet. Use − and + to change servings; the ingredient amounts and your shopping list update to match. The price is an estimate for the whole meal.' },
  { sheet: true, sel: '[data-tour=sheetActions]', title: 'Cooked, swap or remove', text: '"I cooked this" marks it done. "Swap" replaces it with another suggestion (and Mise learns you weren\'t keen). "Remove" clears the night.' },
  { sheet: true, sel: '[data-tour=ings]', title: 'Love it or hate it', text: 'Tap any ingredient to mark it "Love it", "Don\'t like it" or "Can\'t eat it". Mise then suggests those meals more, less or never, and leaves disliked items out of meals it builds. You can review them all in Settings.' },
  { sheet: true, sel: '[data-tour=rating]', title: 'Rate it', text: 'Tap the stars any time. High ratings come round more often, low ones less, but Mise always mixes in new things so you don\'t get stuck in a rut.' },
  { sheet: true, sel: 'label[for=recipePhoto]', title: 'Add a photo', text: 'Tap "Add your photo" to use a picture you took of your own dish. Recipes without a photo try to find one online automatically.' },
  { sheet: true, sel: '.sheet-x', title: 'Closing a sheet', text: 'Close any sheet by swiping it down, tapping the ✕, tapping the dark area above it, or pressing your phone\'s back button.' },
  { route: 'recipes', sel: '[data-tour=recTabs]', title: 'Recipes', text: '"All" is every recipe Mise knows. "Mine" is recipes you built or saved. "Online" searches thousands of free recipes from TheMealDB by category or name.' },
  { route: 'recipes', sel: '[data-tour=buildCta]', title: 'Create a meal', text: 'Shortcut to the Create tab, where you describe what you fancy and get recipe ideas.' },
  { route: 'recipes', sel: '[data-tour=addRecipe]', title: 'Add your own', text: 'Type in a family favourite or paste a recipe from any website. Ingredients Mise doesn\'t know are kept as you wrote them and go on your list.' },
  { route: 'recipes', sel: '#recSearch', title: 'Search', text: 'Search by dish or ingredient, for example "chicken" or "curry". On the Online tab, type and press Enter to search the internet library.' },
  { route: 'recipes', sel: '.rcard', title: 'Recipe cards', text: 'Tap any card to open it. From there you can add it to a day, rate it, or save an online recipe to your own collection.' },
  { route: 'recipes', sheet: true, before: async () => { await openRecipe('b:stirfry'); }, sel: '[data-tour=daypick]', title: 'Add it to a day', text: 'In a recipe you\'re browsing, tap a day here to add it to the week. Set servings first with − and +.' },
  { route: 'list', sel: '[data-tour=listWeek]', title: 'Shopping list', text: 'Your list is built automatically from the dinners in your plan. Switch between this week and next week here.' },
  { route: 'list', sel: '[data-tour=listTotal]', title: 'What it should cost', text: 'The estimated total against your budget. Each price is tagged: "est." is a rough guess, "yours" comes from your own receipts, "deal" from a deal you saved. Scan receipts and the estimates turn into real prices.' },
  { route: 'list', sel: '[data-tour=addExtra]', title: 'Add anything', text: 'Type anything else you need (milk, bin bags, snacks) and tap Add. Mise recognises common items and prices them too.' },
  { route: 'list', sel: '.li', title: 'Tick as you shop', text: 'Items are grouped by shop and sorted in the order of a typical store, starting with fruit and veg. Each line says how much you need and which pack to buy. Tap a row to tick it into your basket.' },
  { route: 'list', sel: '.li .icon-btn', title: 'Item options', text: 'Tap ⋯ to say "I already have this" (it moves to your pantry and drops off the list) or to remove it from this week\'s list.' },
  { route: 'list', sel: '[data-tour=staples]', title: 'Cupboard basics', text: 'Oil, salt, spices and stock aren\'t added every week. Tap the ones you have, or add the rest to the list in one go.' },
  { route: 'list', sel: '[data-tour=done]', title: 'Done shopping', text: 'When you\'re home, tap this: everything you ticked moves into your pantry with an estimated use-by date.' },
  { route: 'list', sel: '[data-tour=share]', title: 'Share and improve', text: '"Share list" sends it by WhatsApp, text or email. "Smarter list from receipts" builds next week\'s list from what you actually buy, with treats trimmed and less waste.' },
  { route: 'pantry', sel: '[data-tour=make]', title: 'What can I make?', text: 'Ranks every recipe by how much you already have in, with food close to its date first. Any missing items can be added to your list with one tap.' },
  { route: 'pantry', sel: '[data-tour=addPantry]', title: 'Your pantry', text: 'Add things you have here. Receipts and "Done shopping" fill it automatically. Tap any item to change the amount or date, mark it used, or mark it binned (which helps Mise suggest smaller packs).' },
  { route: 'receipts', sel: '[data-tour=receiptAdd]', title: 'Scan a receipt', text: 'Pick the shop and date, then "Take a photo" of a paper receipt, "Choose screenshot" (a Lidl Plus digital receipt screenshot works best) or paste the text. The reading happens on your phone.' },
  { route: 'receipts', before: () => { ui.receiptDraft = null; render(); startDraft(SAMPLE_RECEIPT); }, sel: '[data-tour=receiptDraft]', title: 'Check the items', text: 'Mise guesses what each line is, even shop shorthand like "CHKN THIGH FLT". Fix any wrong ones with the dropdown and it remembers next time. Untick lines that aren\'t food, correct prices, then Save. (This is a sample, nothing is saved.)' },
  { route: 'receipts', sheet: true, before: () => { const d = ui.receiptDraft; ui.receiptDraft = null; render(); const lines = d ? d.lines.map(l => ({ text: l.text, item: l.item, price: l.price, qty: l.qty })) : []; const rec = { id: 'tour', shop: 'Lidl', date: C.today(), total: d && d.total || 18.92, lines }; showReview(rec); }, sel: '.roast', title: 'Your shop, reviewed', text: 'After each receipt you get an honest (and funny) review, tips to save money or waste less, and a button to build a smarter list for next week. Choose Gentle, Cheeky or Savage in Settings.' },
  { route: 'builder', sel: '[data-tour=bDesc]', title: 'Create a meal', text: 'Say what you fancy in your own words: ingredients you want to use, a dish, who it\'s for, how spicy, budget, time, or things to avoid. For example "a rice dish with beef mince and onions". Tap an example chip to try one.' },
  { route: 'builder', sel: '[data-tour=bParts]', title: 'Or pick the parts', text: 'Open "Pick parts yourself" to choose the main ingredient, what it\'s served with, the flavour, veg, servings and heat.' },
  { route: 'builder', sel: '[data-tour=bOpts]', title: 'Quick options', text: '"Use what I have" builds from your pantry. Healthier, Cheaper and Veggie steer every idea.' },
  { route: 'builder', sel: '[data-tour=bGo]', title: 'Get ideas', text: '"Get ideas" gives four recipes built around what you typed, plus matching recipes you have and real recipes online. "Ask AI" understands anything else (free, via Puter).' },
  { route: 'builder', before: () => { ui._tourB = ui.builder; ui._tourD = ui.bDesc; ui._tourI = ui.ideas; ui.bDesc = 'A rice dish with beef mince and onions'; A.bIdeas(); }, sel: '[data-tour=ideas]', title: 'Your ideas', text: 'Tap an idea to see the full recipe and cost. "Shuffle" gives you a fresh set.' },
  { route: 'builder', before: () => { if (ui.ideas) A.pickIdea({ dataset: { val: 0 } }); }, sel: '[data-tour=bTweaks]', title: 'Tweak it', text: 'Not quite right? Tap Cheaper, Healthier, Spicier, Quicker, Veggie, More veg or Surprise me, as many times as you like.' },
  { route: 'builder', sel: '[data-tour=bIngs]', title: 'Remove or swap anything', text: 'Tap any ingredient to remove it, swap it, or mark it "never". The recipe adjusts, or picks a new sauce if you remove something it depends on.' },
  { route: 'builder', sel: '[data-tour=bSaveRow]', title: 'Keep it', text: '"Add to plan" saves it and lets you pick a night. "Save" keeps it in Recipes → Mine. Turn on AI in Settings for an extra "Ask AI" button.' },
  { route: 'deals', sel: '[data-tour=deal]', title: 'Deals', text: 'Save offers you spot with a price and end date. Your list uses the deal price and suggestions favour meals that use it.' },
  { route: 'insights', title: 'Spending', text: 'Once you\'ve scanned a few receipts, this page shows your weekly spend against budget, where the money goes by category, what gets binned and what you buy most.' },
  { route: 'settings', sel: '[data-tour=sHouse]', title: 'Household', text: 'Set how many people you cook for (default servings), your weekly budget, and which nights you want dinners planned.' },
  { route: 'settings', sel: '[data-tour=sShops]', title: 'Shops', text: 'Tick where you shop and pick your main shop. Once you have your own prices, each list item goes to the shop where it was cheapest.' },
  { route: 'settings', sel: '[data-tour=sPersona]', title: 'Personality', text: 'Choose how harsh receipt reviews are, and how adventurous suggestions should be: from mostly favourites to lots of new things.' },
  { route: 'settings', sel: '[data-tour=sTastes]', title: 'Likes & dislikes', text: 'Everything you\'ve marked as loved, disliked or can\'t eat, plus your dietary needs. "Retake the taste quiz" runs the dietary questions and the swipe cards again. It\'s also in the menu.' },
  { route: 'settings', sel: '[data-tour=sAI]', title: 'AI (optional)', text: 'Mise works fully without AI. You can turn on Puter (sign in to a free account; your requests use your own allowance) or on-device AI where your browser supports it.' },
  { route: 'settings', sel: '[data-tour=sBackup]', title: 'Back up your data', text: 'Everything is stored on your phone only. Use Back up to save a file you can restore on another phone or after reinstalling.' },
  { route: 'plan', title: 'You\'re set', text: 'Start with "Suggest my week", check the list, and scan your next receipt. Restart this tour any time from the menu.' }
];
function askTour() {
  openSheet(`<h2>Want a quick tour?</h2><p class="muted">About 3 minutes. You can start it later from the menu.</p><div class="row" style="margin-top:12px"><button class="btn grow" data-act="closeSheet">Not now</button><button class="btn primary grow" data-act="tourStart">Show me</button></div>`);
}
async function startTour() {
  if (ui.tour) return;
  ui.tourPlanSnap = JSON.stringify(S.plan); ui.tourAddedPlan = false;
  ui.tour = { i: 0 };
  const ov = document.createElement('div'); ov.className = 'tour'; ov.id = 'tour'; ov.innerHTML = '<div class="tour-hole none"></div><div class="tour-card" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { const b = e.target.closest('[data-tour-act]'); if (!b) return; const a = b.dataset.tourAct; if (a === 'next') tourGo(ui.tour.i + 1); if (a === 'back') tourGo(ui.tour.i - 1); if (a === 'end') endTour(); });
  window.addEventListener('resize', tourPlace);
  tourGo(0);
}
async function tourGo(i) {
  if (!ui.tour) return;
  if (i >= TOUR.length) return endTour();
  i = Math.max(0, i); ui.tour.i = i; const st = TOUR[i];
  if (!st.sheet && !$('#sheet').hidden) await closeSheetP();
  if (st.route && ui.route !== st.route) { location.hash = st.route; await wait(120); }
  if (st.before) { try { await st.before(); } catch (e) { /* show the step anyway */ } }
  await wait(st.sheet ? 260 : 80);
  const scope = st.scopeDoc ? document : st.sheet ? $('#sheetBody') : $('#view');
  const el = st.sel ? scope.querySelector(st.sel) : null;
  ui.tour.el = el;
  if (el) { el.scrollIntoView({ block: 'center' }); await wait(260); }
  const card = document.querySelector('#tour .tour-card');
  card.innerHTML = `<div class="step">Step ${i + 1} of ${TOUR.length}</div><div class="tour-dots"><i style="width:${(i + 1) / TOUR.length * 100}%"></i></div><h3>${esc(st.title)}</h3><p>${esc(st.text)}</p>
    <div class="row">${i ? '<button class="btn sm" data-tour-act="back">Back</button>' : ''}<button class="btn sm ghost" data-tour-act="end">${i === TOUR.length - 1 ? 'Close' : 'Skip tour'}</button><span class="grow"></span><button class="btn sm primary" data-tour-act="next">${i === TOUR.length - 1 ? 'Finish' : 'Next'}</button></div>`;
  tourPlace();
  card.querySelector('[data-tour-act=next]').focus({ preventScroll: true });
}
function tourPlace() {
  if (!ui.tour) return;
  const hole = document.querySelector('#tour .tour-hole'), card = document.querySelector('#tour .tour-card');
  const el = ui.tour.el, vh = innerHeight, ch = card.offsetHeight;
  if (!el || !el.isConnected) { hole.className = 'tour-hole none'; hole.removeAttribute('style'); card.style.top = Math.max(16, (vh - ch) / 2) + 'px'; return; }
  const r = el.getBoundingClientRect(), pad = 6;
  hole.className = 'tour-hole';
  const top = Math.max(4, r.top - pad), h = Math.min(r.height + pad * 2, vh - top - 4);
  Object.assign(hole.style, { left: Math.max(4, r.left - pad) + 'px', top: top + 'px', width: Math.min(innerWidth - 8, r.width + pad * 2) + 'px', height: h + 'px' });
  let t = r.bottom + pad + 12;
  if (t + ch > vh - 8) t = r.top - pad - 12 - ch;
  if (t < 8) t = vh - ch - 12;
  card.style.top = t + 'px';
}
async function endTour() {
  if (!ui.tour) return;
  ui.tour = null; const ov = $('#tour'); if (ov) ov.remove(); window.removeEventListener('resize', tourPlace);
  if (!$('#sheet').hidden) await closeSheetP();
  ui.receiptDraft = null;
  if ('_tourB' in ui) { ui.builder = ui._tourB; ui.bDesc = ui._tourD; ui.ideas = ui._tourI; delete ui._tourB; delete ui._tourD; delete ui._tourI; }
  if (ui.tourAddedPlan) { S.plan = JSON.parse(ui.tourPlanSnap); ui.tourAddedPlan = false; }
  S.settings.tourSeen = true; save();
  if (location.hash !== '#plan') location.hash = 'plan'; else render(true);
}


/* ================= Taste quiz ================= */
const DECK_IMG = { onion: 'Onion', garlic: 'Garlic', mushroom: 'Mushrooms', pepper: 'Red Pepper', spinach: 'Spinach', broccoli: 'Broccoli', courgette: 'Courgettes', aubergine: 'Aubergine', cauliflower: 'Cauliflower', 'sweet-potato': 'Sweet Potatoes', avocado: 'Avocado', coriander: 'Coriander', chilli: 'Red Chilli', 'cherry-tomato': 'Cherry Tomatoes', peas: 'Peas', sweetcorn: 'Sweetcorn', beetroot: 'Beetroot', kale: 'Kale', chickpeas: 'Chickpeas', 'kidney-beans': 'Kidney Beans', lentils: 'Red Lentils', tofu: 'Tofu', halloumi: 'Halloumi', feta: 'Feta', brie: 'Brie', eggs: 'Eggs', 'chicken-thigh': 'Chicken Thighs', 'beef-mince': 'Minced Beef', steak: 'Beef', 'pork-chop': 'Pork Chops', sausages: 'Sausages', bacon: 'Bacon', pudding: 'Black Pudding', 'lamb-mince': 'Lamb Mince', salmon: 'Salmon', 'white-fish': 'Cod', prawns: 'King Prawns', tuna: 'Tuna', mackerel: 'Mackerel', 'coconut-milk': 'Coconut Milk', 'curry-paste': 'Red Curry Paste', pesto: 'Pesto', olives: 'Black Olives', ginger: 'Ginger', lemon: 'Lemon' };
function viewQuiz() {
  const q = ui.quiz || (ui.quiz = { stage: 'diet' });
  if (q.stage === 'diet') {
    const diet = S.settings.diet || [];
    return `<div class="card"><h2>Any dietary needs?</h2><p class="small muted" style="margin:0">Tick all that apply.</p>
      <div style="display:flex;flex-direction:column;gap:8px" data-tour="diet">${C.DIETS.map(([k, n, d]) => `<button class="btn" style="justify-content:space-between;text-align:left;min-height:54px;${diet.includes(k) ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}" data-act="quizDiet" data-val="${k}" aria-pressed="${diet.includes(k)}"><span><b>${n}</b>${d ? `<span class="tiny muted" style="display:block;font-weight:500">${d}</span>` : ''}</span><span class="box" style="width:24px;height:24px;border-radius:7px;border:2px solid ${diet.includes(k) ? 'var(--accent)' : 'var(--line)'};background:${diet.includes(k) ? 'var(--accent)' : 'transparent'}"></span></button>`).join('')}</div>
      <button class="btn primary block" data-act="quizStart">${diet.length ? 'Next: what do you like?' : 'None of these. Next'}</button></div>`;
  }
  if (q.stage === 'swipe') {
    const deck = q.deck, i = q.i;
    if (i >= deck.length) return quizDone();
    const id = deck[i], it = ITEM[id];
    const img = DECK_IMG[id] ? `https://www.themealdb.com/images/ingredients/${encodeURIComponent(DECK_IMG[id])}.png` : null;
    return `<div class="quiz"><div class="row between small muted"><span>${i + 1} of ${deck.length}</span><button class="btn ghost sm" data-act="quizFinish">Finish early</button></div><div class="tour-dots"><i style="width:${i / deck.length * 100}%"></i></div>
      <div class="qstack"><div class="qcard" id="qcard" data-tour="qcard"><div class="qimg">${img ? `<img src="${img}" alt="" onerror="this.remove()">` : ''}<span>${esc(it.n[0])}</span></div><h2>${esc(it.n)}</h2><p class="small muted">${esc((AISLES.find(a => a[0] === it.a) || [, ''])[1])}</p><div class="qhint left">NOPE</div><div class="qhint right">YES</div></div></div>
      <p class="small muted" style="text-align:center;margin:0">Swipe right = like · left = nope</p>
      <div class="qbtns" data-tour="qbtns"><button class="qb no" data-act="quizVote" data-val="-1" aria-label="Don't like">${ICON.x}</button><button class="qb meh" data-act="quizVote" data-val="0" aria-label="No opinion">Not sure</button><button class="qb yes" data-act="quizVote" data-val="1" aria-label="Like it"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>
      <button class="btn ghost sm" data-act="quizVote" data-val="-9" style="align-self:center">I can't eat this</button>${i ? '<button class="btn ghost sm" data-act="quizBack" style="align-self:center">Undo last</button>' : ''}</div>`;
  }
  return quizDone();
}
function quizDone() {
  const q = ui.quiz, v = Object.values(q.votes || {});
  return `<div class="card" style="text-align:center"><h2>Got it</h2><p class="muted">${v.filter(x => x > 0).length} liked · ${v.filter(x => x < 0 && x > -9).length} nope${v.some(x => x <= -9) ? ` · ${v.filter(x => x <= -9).length} can't eat` : ''}</p>
    <div class="row"><a class="btn grow" href="#settings">Review in Settings</a><button class="btn primary grow" data-act="quizClose">${q.first ? 'Continue' : 'Done'}</button></div></div>`;
}
function bindQuizSwipe() {
  const card = $('#qcard'); if (!card) return; let x0 = null, dx = 0;
  card.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
  card.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; card.classList.toggle('yes', dx > 40); card.classList.toggle('no', dx < -40); });
  const up = () => { if (x0 == null) return; x0 = null; card.style.transition = 'transform .2s ease'; if (Math.abs(dx) > 90) { card.style.transform = `translateX(${dx > 0 ? 600 : -600}px) rotate(${dx > 0 ? 25 : -25}deg)`; setTimeout(() => quizVote(dx > 0 ? 1 : -1), 160); } else { card.style.transform = ''; card.classList.remove('yes', 'no'); } };
  card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
}
function quizVote(v) { const q = ui.quiz; const id = q.deck[q.i]; q.votes[id] = v; if (v) S.likes[id] = v; else delete S.likes[id]; save(); q.i++; render(); bindQuizSwipe(); }


/* ================= Your own recipe ================= */
function viewAdd() {
  const e = ui.editDraft || (ui.editDraft = { title: '', serves: S.settings.household || 2, time: 30, ing: '', steps: '', id: null, img: null });
  return `<div class="card"><label class="f">Name<input id="arTitle" value="${esc(e.title)}" placeholder="e.g. Nana's beef stew"></label>
    <div class="row"><label class="f grow">Serves<input id="arServes" type="number" min="1" value="${e.serves}"></label><label class="f grow">Minutes<input id="arTime" type="number" min="5" step="5" value="${e.time}"></label></div>
    <label class="f">Ingredients <span class="tiny">one per line, e.g. "500 g beef brisket"</span><textarea id="arIng" style="min-height:150px" placeholder="1.2 kg beef brisket&#10;2 onions&#10;300 ml BBQ sauce">${esc(e.ing)}</textarea></label>
    <label class="f">Method <span class="tiny">one step per line</span><textarea id="arSteps" style="min-height:120px" placeholder="Rub the beef with spices&#10;Slow cook 8 hours">${esc(e.steps)}</textarea></label>
    <div class="row wrap"><label class="btn grow" for="arPhoto">${e.img ? 'Change photo' : 'Add photo'}</label><input type="file" id="arPhoto" accept="image/*" hidden data-change="arPhoto"><button class="btn grow" data-act="arPaste">Paste a whole recipe</button></div>
    ${e.img ? `<img src="${esc(e.img)}" alt="" style="width:100%;border-radius:12px;max-height:200px;object-fit:cover">` : ''}
    <div id="arCheck"></div>
    <button class="btn primary block" data-act="arSave">Save recipe</button></div>`;
}
function readAddForm() { const e = ui.editDraft; e.title = $('#arTitle').value.trim(); e.serves = +$('#arServes').value || 2; e.time = +$('#arTime').value || 30; e.ing = $('#arIng').value; e.steps = $('#arSteps').value; return e; }

const VIEWS = { add: viewAdd, quiz: viewQuiz, plan: viewPlan, recipes: viewRecipes, list: viewList, pantry: viewPantry, make: viewMake, more: viewMore, receipts: viewReceipts, builder: viewBuilder, deals: viewDeals, insights: viewInsights, settings: viewSettings, install: viewInstall };
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
