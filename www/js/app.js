// Mise — UI layer. Plain ES modules, string templates, event delegation. No build step.
import * as C from './core.js';
import * as M from './smart.js';
import * as G from './builder.js';
import * as F from './flavour.js';
import * as K from './chef.js';
import * as TQ from './techniques.js';
import * as PX from './prep.js';
import * as AL from './allergens.js';
import * as AQ from './ask.js';
import { SHOPS, AISLES, CATALOG, ITEM, B_PROTEIN, B_BASE, B_STYLE, B_VEG } from './data.js';

let S = null;               // persisted state
let R = {};                 // all recipes (built-in + saved), normalized
const ui = {
  route: 'plan', weekOffset: 0, listWeek: 0, recTab: 'regular', recQuery: '', onlineCat: null, online: [], onlineLoading: false, onlineErr: '',
  builder: null, builderSpec: {}, builderOpts: { pantryFirst: false }, builderBusy: false, receiptDraft: null, ocr: null,
  sheetServes: null, sheetCtx: null, shopFilter: null, aiStatus: { chrome: false, puter: true }
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const save = () => { C.recipesChanged(); C.saveState(S); updateBadge(); };
const refreshRecipes = () => { C.recipesChanged(); R = C.allRecipes(S); };
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtDay = d => new Date(d + 'T12:00').toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = d => new Date(d + 'T12:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
const ICON = {
  scan: '<svg viewBox="0 0 24 24"><path d="M4 7V5a1 1 0 011-1h2M17 4h2a1 1 0 011 1v2M20 17v2a1 1 0 01-1 1h-2M7 20H5a1 1 0 01-1-1v-2M8 8v8M11 8v8M14 8v8M17 8v8"/></svg>',
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
function thumb(r, cls = 'thumb') { const u = imgSrc(r, true); return u ? `<img class="${cls}" src="${esc(u)}" onerror="this.onerror=null;this.src='${esc(C.photoOf(S, r))}'" alt="" loading="lazy">` : tile(r, cls); }
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
const TITLES = { plan: 'This week', recipes: 'Saved meals', list: 'Shopping list', pantry: 'Pantry', more: 'Menu', make: 'What can I make?', builder: 'Mise', receipts: 'Receipts', deals: 'Deals', insights: 'Stats', settings: 'Settings', install: 'Install', quiz: 'Taste quiz', add: 'Your recipe', tastes: 'Your tastes', discover: 'Discover', swipe: 'Teach Mise your taste', week: 'Plan the week', lab: 'Flavour lab', ing: 'Ingredient' };
const TAB_OF = { make: 'pantry', lab: 'builder' };
const SUBPAGE = { ing: 'builder', lab: 'builder', swipe: 'discover', week: 'plan', recipes: 'more', tastes: 'more', add: 'recipes', make: 'pantry', receipts: 'more', deals: 'more', insights: 'more', settings: 'more', install: 'more', quiz: 'more', more: 'builder' };
const OLD_ROUTES = { meals: 'recipes', saved: 'recipes', home: 'builder' };
function checkShared() { const shared = M.readShareLink(location.hash); if (!shared) return false; ui.importing = shared; history.replaceState(null, '', location.pathname + '#recipes'); ui.route = 'recipes'; render(true); setTimeout(() => openSheet(`<h2>${esc(shared.title)}</h2><p class="small muted">Someone shared this recipe with you. ${shared.ings.length} ingredients, ${shared.steps.length} steps.</p><button class="btn primary block" data-act="importKeep">Save to my recipes</button>`), 200); return true; }
function route() {
  if (/#import=/.test(location.hash)) { if (!$('#sheet').hidden) closeSheet(true); if (checkShared()) return; }
  ui.prevRoute = ui.route;
  let h = (location.hash || '#builder').slice(1);
  if (OLD_ROUTES[h]) { h = OLD_ROUTES[h]; history.replaceState(null, '', '#' + h); }
  if (h.startsWith('ing/')) { const id = decodeURIComponent(h.slice(4)); if (ITEM[id]) ui.ingId = id; h = 'ing'; }
  if (h === 'tour') { history.replaceState(null, '', '#plan'); ui.route = 'plan'; route(); setTimeout(startTour, 150); return; }
  ui.route = TITLES[h] ? h : 'builder';
  if (ui.route === 'quiz' && (!ui.quiz || ui.quiz.stage === 'done' || (ui.quiz.stage === 'swipe' && ui.quiz.i >= (ui.quiz.deck || []).length))) ui.quiz = { stage: 'diet', first: ui.quiz && ui.quiz.first };
  const tab = TAB_OF[ui.route] || ui.route;
  document.querySelectorAll('.tabbar a').forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const parent = SUBPAGE[ui.route]; $('#backBtn').hidden = !parent; if (ui.route === 'ing' || ui.route === 'lab') $('#backBtn').dataset.act = 'goBack'; else delete $('#backBtn').dataset.act; $('#brandMark').style.display = parent ? 'none' : ''; if (parent) $('#backBtn').setAttribute('href', '#' + parent); $('#menuBtn').hidden = ui.route === 'more';
  render(true);
}
function render(scrollTop) {
  $('#viewTitle').textContent = ui.route === 'ing' && ITEM[ui.ingId] ? ITEM[ui.ingId].n : ui.route === 'plan' ? (ui.weekOffset === 0 ? 'This week' : ui.weekOffset === 1 ? 'Next week' : ui.weekOffset === -1 ? 'Last week' : 'Week plan') : TITLES[ui.route];
  const v = VIEWS[ui.route] || VIEWS.plan;
  $('#view').innerHTML = v();
  if (scrollTop) window.scrollTo(0, 0);
  if (['plan', 'recipes', 'swipe'].includes(ui.route)) setTimeout(fillAutoImages, ui.route === 'swipe' ? 50 : 400);
  if (ui.route === 'discover' && ui.disco && ui.disco.pending) setTimeout(discoBuild, 30);
  if (ui.route === 'quiz' || ui.route === 'swipe') bindQuizSwipe();
}
function updateBadge() {
  try { const l = C.buildList(S, C.weekDates(0)); const n = l.rows.filter(r => !S.list.checked[r.key]).length; const b = $('#listBadge'); b.hidden = !n; b.textContent = n; } catch (e) { /* ignore */ }
}

/* ================= Plan ================= */
function viewPlan() {
  const dates = C.weekDates(ui.weekOffset), L = C.buildList(S, dates), budget = S.settings.budget;
  let h = '';
  if (ui.weekOffset === 0) {
    const sk = M.skippedPending(S)[0];
    if (sk) h += `<div class="nudge" data-tour="checkin"><div class="small"><b>${DOW[M.wdOf(sk.date)]}'s ${esc(sk.r.title)}</b>: did you cook it?</div><div class="chips wrap">${[['cooked', 'Yes'], ['tired', 'Too tired'], ['fancy', "Didn't fancy it"], ['out', 'Ate out']].map(([k, n]) => `<button class="chip" data-act="skipAns" data-date="${sk.date}" data-idx="${sk.idx}" data-val="${k}">${n}</button>`).join('')}</div></div>`;
    else { const hb = M.habits(S)[0]; if (hb) h += `<div class="nudge"><div class="small">${esc(hb.text)}</div><div class="row">${hb.act ? `<button class="btn sm primary" data-act="habitYes" data-key="${hb.id}">Yes please</button>` : ''}<button class="btn sm" data-act="habitNo" data-key="${hb.id}">${hb.act ? 'No thanks' : 'OK'}</button></div></div>`; }
    h += tonightCard();
  }
  const planned = dates.filter(d => (S.plan[d] || []).length).length;
  h += `<div class="weekhead" data-tour="weeknav"><button class="icon-btn" data-act="week" data-val="-1" aria-label="Previous week">${ICON.left}</button><div class="grow"><b>${fmtShort(dates[0])} – ${fmtShort(dates[6])}</b><div class="tiny muted" data-tour="plansum">${planned ? `${C.eur(L.total)}${budget ? ' of ' + C.eur(budget) : ''} · ` : ''}${esc(S.settings.defaultShop)}</div></div><button class="icon-btn" data-act="week" data-val="1" aria-label="Next week">${ICON.right}</button></div>
  <div class="days">${dates.map(dayRow).join('')}</div>
  <div class="row" data-tour="suggest"><button class="btn primary grow" data-act="planWeek">${ICON.spark.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')} ${planned ? 'Fill the gaps' : 'Plan my week'}</button><button class="btn" data-act="planMore" data-tour="planMore" aria-label="More options" style="width:52px;padding:0">${ICON.more}</button></div>`;
  const mb = M.monthBudget(S); if (mb && mb.tight && ui.weekOffset >= 0) h += `<div class="note">Budget mode: you're ${C.eur(mb.ahead)} ahead of your monthly pace, so cheaper meals come first.</div>`;
  const cp = M.challengeProgress(S, dates); if (cp) h += `<div class="note"><b>${esc(M.CHALLENGES[S.challenge.kind][0])}</b> · ${cp.note ? esc(cp.note) : `${cp.done} of ${cp.of}`}</div>`;
  if (planned) { const bits = C.weekLeftovers(S, dates).slice(0, 4); if (bits.length) h += `<button class="note link" data-act="useUp" data-tour="bits">Left over after this week: ${bits.map(b => esc(`${C.fmtQty(b.qty, ITEM[b.item].u)} ${ITEM[b.item].n.toLowerCase()}`)).join(', ')}. <b>Use them up ›</b></button>`; }
  return h;
}
function nightHint(n) { if (n.theme && M.THEMES[n.theme]) return M.THEMES[n.theme][0]; return { quick: 'Quick night', protein: 'Gym night', cook: 'Proper cook', normal: 'Add a meal' }[n.mode] || 'Add a meal'; }
function dayRow(d) {
  const es = S.plan[d] || [], n = M.nightOf(S, d), wd = M.wdOf(d), isT = d === C.today();
  const label = `<div class="dl${isT ? ' today' : ''}"><b>${DOW[wd]}</b><span>${new Date(d + 'T12:00').getDate()}</span></div>`;
  if (!es.length) {
    if (['takeaway', 'off'].includes(n.mode)) return `<div class="day2 off">${label}<div class="grow small muted">${M.MODES[n.mode][0]}</div><button class="icon-btn" data-act="addMeal" data-date="${d}" aria-label="Add a meal anyway" style="width:36px;height:36px">+</button></div>`;
    if (d < C.today()) return `<div class="day2 off past">${label}<div class="grow small muted">–</div></div>`;
    return `<button class="day2 empty" data-act="addMeal" data-date="${d}">${label}<div class="grow small muted">${nightHint(n)}</div><span class="plus">+</span></button>`;
  }
  return es.map((e, i) => {
    const r = R[e.rid]; if (!r) return '';
    const meta = e.leftover ? 'Leftovers' : e.fromFreezer ? 'From the freezer' : `${timeLabel(r)}${e.serves > M.servesFor(S, d) && C.isBatch(S, r) ? ' · makes extra' : ''}${e.wildcard ? ' · something new' : ''}`;
    return `<div class="day2${e.cooked ? ' done' : ''}${e.leftover || e.fromFreezer ? ' left' : ''}">${i ? '<div class="dl"></div>' : label}<button class="mealbtn grow" data-act="openRecipe" data-key="${esc(e.rid)}" data-date="${d}" data-idx="${i}">${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="tiny muted">${meta}</div></div></button><button class="tick${e.cooked ? ' on' : ''}" data-act="${e.cooked ? 'uncook' : 'cook'}" data-date="${d}" data-idx="${i}" aria-label="${e.cooked ? 'Mark not cooked' : 'Mark cooked'}">${ICON.check}</button></div>`;
  }).join('');
}
function tonightCard() {
  const t = C.today(), es = S.plan[t] || [], idx = es.findIndex(x => !x.cooked), n = M.nightOf(S, t);
  if (idx >= 0) {
    const e = es[idx], r = R[e.rid]; if (!r) return '';
    const img = imgSrc(r), tips = M.tipsFor(S, r, t).slice(0, 1);
    return `<div class="tonight" data-tour="tonight">${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : ''}<div class="tb"><div class="eyebrow">Tonight${e.leftover ? ' · leftovers' : e.fromFreezer ? ' · from the freezer' : ''}</div><h2>${esc(r.title)}</h2><div class="small muted">${e.serves} serving${e.serves > 1 ? 's' : ''}${e.leftover || e.fromFreezer ? ' · just heat it up' : ` · ${timeLabel(r)}`}</div>${tips.length ? `<div class="tiny" style="margin-top:4px">${esc(tips[0])}</div>` : ''}
      <div class="row" style="margin-top:10px"><button class="btn primary grow" data-act="${e.leftover || e.fromFreezer ? 'cook' : 'cookMode'}" data-date="${t}" data-idx="${idx}">${e.leftover || e.fromFreezer ? 'Ate it' : 'Start cooking'}</button><button class="btn" data-act="mood" data-tour="mood">Change</button></div></div></div>`;
  }
  if (es.length) return `<div class="tonight plain"><div class="tb"><div class="eyebrow">Tonight</div><h2>Done. Nice one.</h2></div></div>`;
  if (['takeaway', 'off'].includes(n.mode)) return `<div class="tonight plain"><div class="tb"><div class="eyebrow">Tonight</div><h2>${M.MODES[n.mode][0]} night</h2><button class="btn sm" data-act="mood" style="margin-top:8px">Cook something anyway</button></div></div>`;
  return `<div class="tonight plain" data-tour="tonight"><div class="tb"><div class="eyebrow">Tonight</div><h2>Nothing planned yet</h2><div class="row wrap" style="margin-top:10px"><button class="btn primary grow" data-act="mood" data-tour="mood">Help me choose</button>${M.freezer(S).length ? '<button class="btn" data-act="freezerPick">From the freezer</button>' : ''}</div></div></div>`;
}
/* ================= Recipes ================= */
function viewRecipes() {
  if (!['regular', 'mine', 'easy', 'recent'].includes(ui.recTab)) ui.recTab = 'regular';
  const tab = ui.recTab, q = (ui.recQuery || '').toLowerCase().trim();
  let h = `<div class="quick3"><a href="#discover" data-tour="discoverCta">${ICON.spark}<b>Discover</b><span>New dishes to try</span></a><a href="#builder" data-tour="buildCta">${ICON.pot}<b>Ask Home</b><span>Say what you fancy</span></a><a href="#add" data-act="newRecipe" data-tour="addRecipe"><span style="font:700 22px var(--display)">+</span><b>Add yours</b><span>Type, link, photo</span></a></div>
  <div class="seg" role="group" data-tour="recTabs">${[['regular', 'Regulars'], ['mine', 'Yours'], ['easy', 'Easy'], ['recent', 'Recent']].map(([k, n]) => `<button data-act="recTab" data-val="${k}" aria-pressed="${tab === k}">${n}</button>`).join('')}</div>
  <input type="search" id="recSearch" placeholder="Search" value="${esc(ui.recQuery)}" data-in="recQuery" enterkeyhint="search">`;
  let list = [];
  if (tab === 'regular') list = Object.values(R).filter(r => r.regular);
  if (tab === 'mine') list = Object.values(R).filter(r => ['mine', 'ai', 'builder'].includes(r.src) && !r.regular);
  if (tab === 'easy') list = easyMeals();
  if (tab === 'recent') { const seen = new Set(); const ids = (S.cookLog || []).slice().reverse().map(x => x.rid).concat(Object.entries(S.plan).sort((a, b) => b[0].localeCompare(a[0])).flatMap(([, es]) => es.map(e => e.rid))); for (const id of ids) if (id && R[id] && R[id].src === 'built' && !seen.has(id)) { seen.add(id); list.push(R[id]); } list = list.slice(0, 40); }
  if (q) list = list.filter(r => r.title.toLowerCase().includes(q) || r.ings.some(i => i.name.toLowerCase().includes(q)));
  if (!list.length) {
    const msg = { regular: ['No regulars yet', 'Meals you love become regulars. Tap "Loved it" after cooking twice, or "Save as a regular" on any meal.'], mine: ['None of your own yet', 'Add family favourites: type them in, paste them, or import from a link or photo.'], easy: ['Nothing here', 'Easy oven and freezer meals show here.'], recent: ['Nothing yet', 'Plan a week and the meals Mise builds will show here.'] }[tab];
    return h + `<div class="empty"><h3>${q ? 'No match' : msg[0]}</h3><p>${q ? 'Try Make a meal to build it.' : msg[1]}</p></div>${tab === 'mine' && !q ? '<a class="btn primary block" href="#add" data-act="newRecipe">Add a recipe</a>' : ''}${q ? `<a class="btn block" href="#builder" data-act="createFrom" data-val="${esc(ui.recQuery)}">Make "${esc(ui.recQuery)}"</a>` : ''}`;
  }
  return h + `<div class="rlist">${list.map(card).join('')}</div>`;
}
function card(r) {
  const rt = S.ratings[r.id];
  return `<button class="rcard" data-act="openRecipe" data-key="${esc(r.id)}">${imgSrc(r, true) ? `<div class="img"><img src="${esc(imgSrc(r, true))}" onerror="this.onerror=null;this.src='${esc(C.photoOf(S, r))}'" alt="" loading="lazy"></div>` : tile(r, 'img')}<div class="b"><div class="t">${esc(r.title)}</div><div class="tiny muted">${r.stub ? (r.cat || 'Online') : `${timeLabel(r)} · ${esc(r.area || r.cat || '')}`}${rt && rt.r ? ' · ' + '★'.repeat(rt.r) : ''}</div>${!r.stub && r.ings && C.ruledOut(S, r) ? '<span class="tag warn">has things you avoid</span>' : ''}</div></button>`;
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
  ui.sheetServes = entry ? entry.serves : (ui.sheetServes && ui.sheetServesFor === id ? ui.sheetServes : C.isBatch(S, r) ? Math.max(r.serves, S.settings.household || 2) : S.settings.household || r.serves);
  ui.sheetServesFor = id;
  renderRecipeSheet();
}
function convertRecipe(r, diet) {
  const P = AL.planConvert(r, diet); if (P.blocked) return { blocked: P.blocked };
  if (!P.swaps.length) return { none: true };
  const ings = r.ings.map(i => { const sw = P.swaps.find(x => x.from === i); if (!sw) return i; if (sw.skip) return null;
    const id = sw.id && ITEM[sw.id] ? sw.id : null, k = id === 'lentils' && i.u === 'g' ? 1.6 : id === 'chickpeas' && i.u === 'g' ? 1.2 : 1;
    if (i.item === 'eggs' && /cream/.test(sw.to)) return { ...i, item: id, name: sw.to, q: Math.round(i.q * 50), u: 'ml', raw: undefined, prep: undefined, whole: undefined, portion: undefined };
    return { ...i, item: id, name: sw.to, q: Math.round(i.q * k * 10) / 10, raw: undefined, prep: undefined, whole: undefined, portion: undefined }; }).filter(Boolean);
  let title = r.title, steps = r.steps.slice();
  for (const sw of P.swaps) { const i = sw.from, mn = G.MAINS[i.item], names = [...new Set([i.name, ITEM[i.item] && ITEM[i.item].n, mn && mn.n, mn && mn.short].filter(Boolean).map(x => x.toLowerCase()))].sort((a, b) => b.length - a.length);
    const to = sw.skip ? '' : sw.to.replace(/^(firm|green or brown) /, ''), short = to.split(' or ')[0];
    if (sw.id === 'lentils') names.push('mince');
    for (const nm of names) { const re = new RegExp('\\b' + nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'); if (!sw.skip) steps = steps.map(st => st.replace(re, short)); if (r.spec && i.item === r.spec.main) title = title.replace(re, sw.skip ? '' : short.replace(/s$/, '').replace(/^\w/, c => c.toUpperCase())); } }
  // lentils and chickpeas aren't browned like meat
  const swIds = P.swaps.map(x => x.id);
  if (swIds.includes('lentils')) { steps = steps.map(st => { const t = st.replace(/\b(Brown|Fry|Cook) the (lentils|mince)\b[^.]*\.\s*/i, ''); return t !== st ? t.replace(/^Add the ([^.]*?) and cook/, 'Soften the $1 in a little oil') : t; }).filter(st => st.trim()); const k = steps.findIndex(st => /tomato/i.test(st)); if (k >= 0) steps[k] = steps[k].replace(/\.?\s*$/, '. Stir in the drained lentils.'); else steps.splice(Math.max(0, steps.length - 1), 0, 'Stir in the drained lentils and heat through.'); }
  steps = steps.map(st => st.replace(/beaten ((oat )?cream)/i, '$1'));
  if (swIds.includes('chickpeas')) steps = steps.map(st => st.replace(/(chickpeas[^.]*?)until golden and cooked through/i, '$1until lightly golden').replace(/(chickpeas[^.]*?)cooked through/i, '$1hot through'));
  title = (AL.CONVERT_DIETS.find(d => d[0] === diet) ? { vegan: 'Vegan ', vegetarian: 'Veggie ', gluten: 'Gluten-free ', dairy: 'Dairy-free ', egg: 'Egg-free ' }[diet] : '') + title.replace(/\s+/g, ' ').trim().replace(/^\w/, c => c.toLowerCase());
  const r2 = { ...r, id: 'cv:' + diet + ':' + String(r.id).replace(/^cv:[a-z]+:/, ''), title: title.replace(/^\w/, c => c.toUpperCase()), ings, steps, conv: { diet, swaps: P.swaps.map(x => ({ from: x.from.name, to: x.to, note: x.note })), from: r.title }, regular: false, src: r.src === 'built' ? 'built' : r.src };
  if (r2.spec) r2.spec = { ...r2.spec, conv: diet };
  return { recipe: r2 };
}
function dietBox(r) {
  if (r.stub) return '';
  const al = AL.allergensOf(r), mine = new Set((S.settings.diet || []).flatMap(d => AL.DIET_ALG[d] || [])), hit = al.filter(a => mine.has(a));
  const opts = AL.CONVERT_DIETS.filter(([k]) => { const P = AL.planConvert(r, k); return P.swaps.length || P.blocked; });
  if (!al.length && !opts.length && !r.conv) return '';
  return `<details class="r-sec"${hit.length || r.conv ? ' open' : ''}><summary><h3>Allergens & diets</h3>${hit.length ? `<span class="tag deal">contains ${esc(hit.map(a => AL.ALG_NAME[a].toLowerCase()).join(', '))}</span>` : ''}</summary>
    ${r.conv ? `<div class="note yours"><b>Changed from ${esc(r.conv.from)}.</b>${r.conv.swaps.map(x => `<div style="margin-top:4px">${esc(x.from)} → <b>${esc(x.to)}</b>${x.note ? `. <span class="muted">${esc(x.note)}</span>` : ''}</div>`).join('')}</div>` : ''}
    ${al.length ? `<div class="small" style="margin:4px 0 6px">Usually contains: ${al.map(a => `<span class="tag${mine.has(a) ? ' deal' : ''}">${esc(AL.ALG_NAME[a])}</span>`).join(' ')}</div><p class="tiny muted" style="margin:0 0 8px">Brands differ, so always check the label.</p>` : '<p class="small muted" style="margin:4px 0 8px">None of the 14 main allergens, going by usual ingredients. Check labels.</p>'}
    ${opts.length && !r.conv ? `<div class="small muted" style="font-weight:700;margin-bottom:6px">Make it…</div><div class="chips wrap">${opts.map(([k, n]) => `<button class="chip" data-act="convertTo" data-val="${k}">${n}</button>`).join('')}</div>` : ''}</details>`;
}
function stepTime(st) { const m = String(st).match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(min|minute|hour|hr)s?\b/i); if (!m) return null; const v = +(m[2] || m[1]); return /h/i.test(m[3]) ? v * 60 : v; }
function stepHeat(st) { const m = String(st).match(/(\d{3})\s*°?\s*C\b|(\d{3})°/); if (m) return (m[1] || m[2]) + '°C'; const h = String(st).toLowerCase().match(/\b(high|medium-high|medium|low) heat\b/); return h ? h[1] + ' heat' : null; }
function renderRecipeSheet() {
  const r = ui.sheetRecipe, ctx = ui.sheetCtx, serves = ui.sheetServes, f = serves / r.serves;
  const cost = C.recipeCost(S, r, serves), rt = S.ratings[r.id] || {};
  const saved = !!S.recipes[r.id] || String(r.id).startsWith('b:');
  const entry = ctx ? (S.plan[ctx.date] || [])[ctx.idx] : null;
  const hero = C.photoOf(S, r);
  let h = hero ? `<div class="hero"><img src="${esc(hero)}" alt=""></div>` : (r.stub ? '' : tile(r, 'hero-tile'));
  const sw = r.stub ? [] : C.prepSwaps(S, r); const bad = C.dislikedIn(S, r).filter(i => !C.leaveOut(S, r).includes(i) && !sw.includes(i)); const lo = C.leaveOut(S, r).filter(i => !sw.includes(i));
  const ef = C.effort(r), timeTxt = r.handsOn ? timeLabel(r) : ef.slow ? `${hm(r.time)}` : `${ef.total} min`, timeSub = r.handsOn ? '' : ef.slow ? 'mostly hands-off' : 'all in';
  const nut = r.stub ? null : M.nutrition(S, r, serves);
  h += `<div class="r-head"><div class="eyebrow">${esc([r.spec && G.METHODS[r.spec.method] ? G.METHODS[r.spec.method].n : r.cat && r.cat !== 'Built' ? r.cat : '', r.area].filter(Boolean).join(' · ') || 'Recipe')}</div><h2 class="r-title">${esc(r.title)}</h2>
    <div class="r-tags">${r.gear ? `<span class="tag yours">${r.gear === 'af' ? 'Air fryer' : 'Slow cooker'}</span>` : ''}${ef.easy ? '<span class="tag yours">Easy</span>' : ''}${r.src === 'builder' ? '<span class="tag">Built by you</span>' : r.src === 'ai' ? '<span class="tag">AI recipe</span>' : r.src === 'mealdb' ? '<span class="tag">TheMealDB</span>' : ''}</div></div>
  <div class="facts"><div><b>${esc(timeTxt)}</b><span>${timeSub || 'time'}</span></div><div><b>${C.eur(cost.perServe)}</b><span>a serving</span></div>${nut ? `<div><b>${nut.kcal}</b><span>kcal a serving</span></div><div><b>${nut.protein} g</b><span>protein</span></div>` : `<div><b>${serves}</b><span>servings</span></div>`}</div>`;
  for (const i of sw) h += `<div class="note yours"><b>Not a fan of ${esc(i.prep === 'chips' ? i.name.toLowerCase() + ' as chips' : C.PREP_NAMES[i.prep] + ' ' + i.name.toLowerCase())}?</b> ${esc(C.prepAlt(i)[1])}</div>`;
  if (lo.length) h += `<div class="note">Leave out the ${esc(lo.map(i => i.name).join(', '))}. You don't like ${lo.length > 1 ? 'them' : 'it'}.</div>`;
  if (bad.length) h += `<div class="note ${bad.some(i => C.likeOf(S, i) <= -9) ? 'deal' : 'warn'}">Contains ${esc(bad.map(i => i.name).join(', '))}, which you marked as ${bad.some(i => C.likeOf(S, i) <= -9) ? "can't eat" : "don't like"}.</div>`;
  // actions
  if (entry && entry.leftover) h += `<p class="small muted" style="margin:12px 0 0">Leftovers from ${fmtDay(entry.leftover)}. Nothing extra on your list.</p><div class="row" style="margin-top:8px"><button class="btn grow" data-act="freezeLeft" data-date="${ctx.date}" data-idx="${ctx.idx}">Freeze it instead</button><button class="btn" data-act="swap" data-date="${ctx.date}" data-idx="${ctx.idx}">Cook something else</button></div>`;
  else if (entry) h += `${entry.cooked ? '' : '<button class="btn primary block r-cta" data-act="cookFromSheet">Start cooking</button>'}<div class="row" data-tour="sheetActions" style="margin-top:8px"><button class="btn grow" data-act="${entry.cooked ? 'uncook' : 'cook'}" data-date="${ctx.date}" data-idx="${ctx.idx}">${entry.cooked ? 'Mark not cooked' : 'I cooked this'}</button><button class="btn" data-act="swap" data-date="${ctx.date}" data-idx="${ctx.idx}">Swap</button><button class="btn" data-act="removeMeal" data-date="${ctx.date}" data-idx="${ctx.idx}">Remove</button></div>`;
  else h += `<div class="r-plan" data-tour="daypick"><div class="small muted" style="margin-bottom:6px;font-weight:600">Add to ${ui.weekOffset === 1 ? 'next' : 'this'} week</div><div class="daypick">${C.weekDates(ui.weekOffset).map(d => { const n = (S.plan[d] || []).length; return `<button data-act="addToDay" data-date="${d}">${DOW[(new Date(d + 'T12:00').getDay() + 6) % 7]}<span>${n ? n + ' planned' : new Date(d + 'T12:00').getDate()}</span></button>`; }).join('')}</div>${r.stub ? '' : '<button class="btn block" data-act="cookFromSheet" style="margin-top:8px">Cook it now</button>'}</div>`;
  // why it works
  if (!r.stub) { const w = C.whyRecipe(S, r), tp = M.tipsFor(S, r, ctx && ctx.date);
    if (w.length || tp.length || r.blocks) h += `<details class="r-sec r-why"${r.exp ? ' open' : ''}><summary><h3>Why this works</h3></summary>${w.length ? `<div class="why">${w.map(([v, t]) => `<span class="${v < 0 ? 'neg' : ''}">${v < 0 ? '−' : '+'} ${esc(t)}</span>`).join('')}</div>` : ''}${tp.map(t => `<div class="note">${esc(t)}</div>`).join('')}${r.blocks ? blocksBox(r) : ''}</details>`; }
  if (r.exp) h += labBox(r);
  // ingredients
  const fresh = r.ings.filter(i => i.item && ITEM[i.item] && !ITEM[i.item].staple), haveN = fresh.filter(i => C.pantryQty(S, i.item) > 0).length, miss = fresh.filter(i => C.pantryQty(S, i.item) <= 0 && !C.subOf(S, i));
  h += `<section class="r-sec"><div class="r-sec-h"><h3>Ingredients</h3><div class="stepper" data-tour="servings"><button data-act="sheetServes" data-val="-1" aria-label="Fewer servings">−</button><span>${serves}</span><button data-act="sheetServes" data-val="1" aria-label="More servings">+</button></div></div>
    <div class="small muted" style="margin:-2px 0 6px">${serves} serving${serves > 1 ? 's' : ''} · ${C.eur(cost.total)} total${fresh.length && S.pantry.length ? ` · <b style="color:var(--accent)">${haveN} of ${fresh.length} in your kitchen</b>` : ''}</div>`;
  if (!r.stub && r.src !== 'built' && !(entry && entry.leftover)) { const hh = S.settings.household || 2, b = C.isBatch(S, r), extra = serves - hh;
    h += `<div class="row between" style="margin:4px 0 6px"><span class="small">${b ? (extra >= hh ? `<b>Batch cook.</b> ${Math.floor(extra / hh)} more night${extra >= 2 * hh ? 's' : ''} of leftovers${extra % hh ? ` + ${extra % hh} portion${extra % hh > 1 ? 's' : ''} spare` : ''}` : extra > 0 ? `<b>Batch cook.</b> ${extra} portion${extra > 1 ? 's' : ''} spare` : '<b>Batch cook.</b> Raise servings for leftovers') : 'Always cook the full batch?'}</span><button class="chip" data-act="toggleBatch" aria-pressed="${b}">${b ? 'On' : 'Off'}</button></div>`; }
  if (entry && !entry.leftover && (S.people || []).length) { const ids = M.eaters(S, ctx.date); h += `<div class="small muted" style="font-weight:700;margin-top:6px">Who's eating?</div><div class="chips wrap">${M.people(S).map(p => `<button class="chip" data-act="whoToggle" data-key="${p.id}" aria-pressed="${ids.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div>`; }
  h += `<ul class="ings" data-tour="ings">${r.ings.map((i, idx) => { const it = ITEM[i.item]; const b = it ? C.toBase(i.q * f, i.u, it) : null; const have = it && C.pantryQty(S, it.id) >= (b || 1) * 0.75; const lk = C.likeOf(S, i), pk = i.prep && S.likes[C.prepKey(i)] != null; return `<li class="${have ? 'have' : ''}" data-act="ingMenu" data-idx="${idx}" style="cursor:pointer"><span class="q">${esc((i.whole ? i.q + ' ' + i.u : fmtIng(i.q * f, i.u)))}</span><span class="grow">${(() => { const sb = C.subOf(S, i); return sb ? (sb.skip ? `<s class="muted">${esc(i.name)}</s> <span class="tiny muted">left out</span>` : `${esc(sb.name)} <span class="tiny muted">instead of ${esc(i.name)}</span>`) : esc(i.name); })()}${it && it.staple ? ' <span class="tiny muted">(cupboard)</span>' : ''}${C.notAt(S, i) && !C.subOf(S, i) ? ` <span class="tiny" style="color:var(--hot)">not at ${esc(S.settings.defaultShop)}</span>` : ''}</span>${lk <= -9 ? '<span class="tag deal">can\'t eat</span>' : lk < 0 ? `<span class="tag ${pk && C.prepAlt(i) ? 'yours' : 'warn'}">${pk ? (C.prepAlt(i) ? 'swapped' : 'not ' + C.PREP_NAMES[i.prep]) : 'don\'t like'}</span>` : lk > 0 ? `<span class="tag yours">love${pk ? ' ' + C.PREP_NAMES[i.prep] : ''}</span>` : ''}</li>`; }).join('')}</ul><p class="tiny muted" style="margin:4px 0 0">Tap an ingredient to like, dislike or swap it. <span class="dot-have"></span> in your kitchen</p>
    ${miss.length && !entry ? `<button class="btn sm" data-act="addMissing" style="margin-top:8px">Add ${miss.length} missing to my list</button>` : ''}</section>`;
  // method
  h += `<section class="r-sec"><div class="r-sec-h"><h3>Method</h3>${r.stub ? '' : '<button class="btn sm ghost" data-act="cookFromSheet">Cook mode ›</button>'}</div><ol class="steps2">${r.steps.map((st, k) => { const n = sw.find(i => { const re = (C.PREPS.find(p => p[0] === i.prep) || [])[1]; return re && re.test(st.toLowerCase()); }); const tm = stepTime(st), ht = stepHeat(st);
      return `<li><span class="sn">${k + 1}</span><div class="grow"><p>${esc(st)}</p>${tm || ht ? `<div class="st-meta">${tm ? `<span>${tm >= 60 ? hm(tm) : tm + ' min'}</span>` : ''}${ht ? `<span>${esc(ht)}</span>` : ''}</div>` : ''}${n ? `<div class="note yours" style="margin-top:6px">Swap: ${esc(C.prepAlt(n)[1])}</div>` : ''}</div></li>`; }).join('')}</ol></section>`;
  if (r.src === 'built' && r.spec) h += `<section class="r-sec"><h3 style="margin-bottom:8px">Make it your way</h3>${builtExtras(r, ctx)}</section>`;
  if (nut) h += `<details class="r-sec"><summary><h3>Nutrition</h3><span class="small muted">per serving, roughly</span></summary><div class="nut">${[['Energy', nut.kcal + ' kcal'], ['Protein', nut.protein + ' g'], ['Carbs', nut.carb != null ? nut.carb + ' g' : null], ['Fat', nut.fat != null ? nut.fat + ' g' : null], ['Fibre', nut.fibre != null ? nut.fibre + ' g' : null], ['Salt', nut.salt != null ? nut.salt + ' g' : null]].filter(x => x[1]).map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></details>`;
  h += dietBox(r);
  h += `<section class="r-sec"><h3 style="margin-bottom:4px">Your rating</h3><div data-tour="rating">${stars(rt.r || 0, 'rateSheet', r.id)}</div>
  <div class="row wrap" style="margin-top:14px"><label class="btn" for="recipePhoto">${S.photos[r.id] ? 'Change photo' : 'Add your photo'}</label><input type="file" id="recipePhoto" accept="image/*" hidden data-change="recipePhoto">${S.photos[r.id] ? '<button class="btn" data-act="removePhoto">Remove photo</button>' : ''}${!saved ? `<button class="btn" data-act="saveRecipe">Save to my recipes</button>` : ''}${saved && !String(r.id).startsWith('b:') && r.src !== 'mealdb' ? `<button class="btn" data-act="editRecipe" data-key="${esc(r.id)}">Edit</button>` : ''}${String(r.id).startsWith('b:') ? `<button class="btn" data-act="editRecipe" data-key="${esc(r.id)}">Edit a copy</button>` : ''}${r.src !== 'builtin' && saved && !String(r.id).startsWith('b:') ? `<button class="btn" data-act="deleteRecipe" data-key="${esc(r.id)}">Delete</button>` : ''}${r.stub ? '' : '<button class="btn" data-act="cookFromSheet">Cook mode</button><button class="btn" data-act="shareRecipe">Share</button>'}${r.src === 'built' ? `<button class="btn" data-act="makeRegular">${r.regular ? 'One of your regulars ✓' : 'Save as a regular'}</button>` : ''}${r.url ? `<a class="btn ghost" href="${esc(r.url)}" target="_blank" rel="noopener">Original source</a>` : ''}${r.video ? `<a class="btn ghost" href="${esc(r.video)}" target="_blank" rel="noopener">Video</a>` : ''}</div></section>`;
  setSheet(h);
}

function cantGetSheet() {
  const i = ui.ingSel, r = ui.sheetRecipe, shop = S.settings.defaultShop, cur = C.subOf(S, i);
  const v = r ? C.withoutIt(r, i) : null, sub = C.substitutesFor(S, i);
  setSheet(`<h2>No ${esc(i.name.toLowerCase())} at ${esc(shop)}?</h2>
    ${v ? `<div class="card flat"><b>Works without it?</b><p class="small" style="margin:4px 0 0">${esc(v[1])}</p></div>` : ''}
    ${sub.tip ? `<p class="small">${esc(sub.tip)}</p>` : ''}
    <div class="small muted" style="font-weight:700;margin-top:8px">${sub.items.length ? 'Use instead' : 'No obvious swap'}</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${sub.items.map(id => `<button class="btn" style="justify-content:space-between;${cur && cur.item === id ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}" data-act="pickSub" data-val="${id}"><span>${esc(ITEM[id].n)}</span><span class="tiny muted">≈ ${C.eur(ITEM[id].p)}</span></button>`).join('')}
    ${!v || v[0] !== 'no' ? `<button class="btn" data-act="pickSub" data-val="skip" style="${cur && cur.skip ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}">Leave it out</button>` : ''}
    ${cur ? '<button class="btn ghost" data-act="pickSub" data-val="clear">I can get it after all</button>' : ''}
    ${r ? '<button class="btn ghost" data-act="backToRecipe">Back to recipe</button>' : ''}</div>
    <p class="tiny muted">Mise remembers this for ${esc(shop)} and swaps it in every recipe and on your list. Recipes that need it get suggested less.</p>`);
}
function pickerSheet(date) {
  ui.pickDate = date; ui.pickQuery = '';
  renderPicker();
}
function renderPicker(keepFocus) {
  const q = (ui.pickQuery || '').toLowerCase().trim(), d = ui.pickDate, ctx = nightCtx(d);
  if (!ui.pickOpts || ui.pickOptsFor !== d + '|' + q) { const p = q ? G.parseWant(S, q) : null; ui.pickOpts = G.options(S, { want: p ? p.want : {}, exclude: p ? p.exclude : undefined, serves: ctx.serves || M.servesFor(S, d), stock: G.pantryStock(S), maxTime: q ? null : ctx.maxTime, kids: ctx.kids, quick: (p && p.mods.quick) || ctx.quick, spicy: p && p.mods.spicy, vegOnly: (p && p.mods.veggie) || ctx.vegOnly, mood: (p && p.mods.mood) || ctx.mood, cheap: p && p.mods.cheap, healthy: p && p.mods.healthy }, 3); ui.pickOptsFor = d + '|' + q; }
  const mine = yourMeals().concat(easyMeals()).filter(r => !q || r.title.toLowerCase().includes(q) || r.ings.some(i => i.name.toLowerCase().includes(q))).slice(0, 20);
  const row = (r, act, key) => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left;border-top:1px solid var(--line)" data-act="${act}" ${key}>${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">≈ ${C.effort(r).total} min all in${r.regular ? ' · regular' : r.cat === 'Easy' ? ' · easy' : r.src === 'mine' ? ' · yours' : ''}</div></div></button>`;
  const body = `<h2>Add a meal · ${fmtDay(d)}</h2><input type="search" id="pickSearch" data-in="pickQuery" placeholder="What do you fancy? e.g. chicken wraps" value="${esc(ui.pickQuery)}" style="margin:10px 0">
  <div class="small muted" style="font-weight:700">${q ? 'Made for that' : 'Ideas for this night'}</div>
  <div class="card flat">${ui.pickOpts.map((r, i) => row(r, 'pickBuilt', `data-idx="${i}"`)).join('')}</div><button class="btn sm" data-act="pickMore">Other ideas</button>
  ${mine.length ? `<div class="small muted" style="font-weight:700;margin-top:10px">Your meals</div><div class="card flat">${mine.map(r => row(r, 'pickRecipe', `data-key="${esc(r.id)}"`)).join('')}</div>` : ''}`;
  setSheet(body);
  if (keepFocus) { const i = $('#pickSearch'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function keepSuggestion(p) { if (p && p.recipe && !S.recipes[p.rid]) { const r = { ...p.recipe }; delete r.auto; S.recipes[p.rid] = r; refreshRecipes(); } return p; }
function addToPlan(rid, date, recipe) {
  const r = recipe || R[rid];
  if (r && !String(rid).startsWith('b:') && !S.recipes[rid]) { S.recipes[rid] = r; refreshRecipes(); }
  const serves = ui.sheetServes || (C.isBatch(S, r) ? Math.max(r.serves, S.settings.household || 2) : S.settings.household || 2);
  (S.plan[date] = S.plan[date] || []).push({ rid, serves });
  if (C.isBatch(S, r)) { const lo = C.placeLeftovers(S, date, rid, serves, S.settings.household); if (lo.used.length) ui.leftNote = ` + leftovers on ${lo.used.map(fmtDay).join(', ')}`; }
  save();
}

/* ================= List ================= */
function viewList() {
  const dates = C.weekDates(ui.listWeek), L = C.buildList(S, dates);
  const budget = S.settings.budget, done = L.rows.filter(r => S.list.checked[r.key]).length;
  const shops = [...new Set(L.rows.map(r => r.shop))];
  let h = `<div class="seg" role="group" data-tour="listWeek">${[[0, 'This week'], [1, 'Next week']].map(([k, n]) => `<button data-act="listWeek" data-val="${k}" aria-pressed="${ui.listWeek === k}">${n}</button>`).join('')}</div>`;
  if (L.rows.length) h += `<div class="listsum" data-tour="listTotal"><div><b class="num">${C.eur(L.total)}</b><span class="small muted">${budget ? (L.total > budget ? ` · <span style="color:var(--hot)">${C.eur(L.total - budget)} over budget</span>` : ` · ${C.eur(budget - L.total)} under budget`) : ''}</span></div><span class="small muted">${done} of ${L.rows.length} got</span></div>${L.estimated ? `<div class="tiny muted" style="margin-top:-4px">${L.estimated} of ${L.rows.length} prices are guesses (~). Tap ⋯ on an item to fix one. Scanning receipts fixes them for good.</div>` : ''}${budget ? `<div class="bar${L.total > budget ? ' over' : ''}"><i style="width:${Math.min(100, L.total / budget * 100)}%"></i></div>` : ''}`;
  h += `<form class="row" data-form="addExtra" data-tour="addExtra"><input id="extraName" placeholder="Add anything: milk, bin bags…" autocomplete="off" aria-label="Item to add"><button class="btn primary" type="submit">Add</button></form>${dymBox('extra')}`;
  const usual = M.usualBuys(S).filter(u => !L.rows.some(r => r.item === u.item) && !S.list.extras.some(x => x.item === u.item)).slice(0, 6);
  if (usual.length && ui.listWeek === 0) h += `<div class="usual" data-tour="usual"><span class="small muted">You usually need</span><div class="chips">${usual.map(u => `<button class="chip" data-act="addUsual" data-key="${u.item}">+ ${esc(ITEM[u.item].n)}</button>`).join('')}</div></div>`;
  if (shops.length > 1) h += `<div class="chips">${[null, ...shops].map(x => `<button class="chip" data-act="shopFilter" data-val="${esc(x || '')}" aria-pressed="${(ui.shopFilter || null) === x}">${x || 'All shops'}</button>`).join('')}</div>`;
  if (!L.rows.length && !L.staples.length) return h + `<div class="empty"><h3>Nothing to buy yet</h3><p>Plan some dinners and everything you need lands here, rounded to real pack sizes.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#plan">Plan the week</a>${hiddenCount(dates) ? `<button class="btn" data-act="restoreList">Show ${hiddenCount(dates)} removed</button>` : ''}</div></div>`;
  for (const shop of shops) {
    if (ui.shopFilter && ui.shopFilter !== shop) continue;
    const rows = L.rows.filter(r => r.shop === shop);
    h += `<section class="card flat list2">${shops.length > 1 ? `<div class="shop-h"><b>${esc(shop)}</b><span class="num small muted">${C.eur(rows.reduce((a, r) => a + (r.cost || 0), 0))}</span></div>` : ''}`;
    let aisle = null;
    for (const r of rows) {
      if (r.aisle !== aisle) { aisle = r.aisle; h += `<div class="aisle">${(AISLES.find(a => a[0] === aisle) || [, 'Other'])[1]}</div>`; }
      const on = !!S.list.checked[r.key];
      const qty = r.packs ? C.packLabel(r) : (r.qty ? fmtIng(r.qty, r.unit) : '');
      const cheaper = r.item && M.cheaperElsewhere(S, r.item);
      h += `<div class="li${on ? ' on' : ''}" data-act="toggleItem" data-key="${esc(r.key)}" role="checkbox" aria-checked="${on}" tabindex="0"><span class="box"></span><div class="grow"><div class="n">${esc(r.name)}${r.deal ? ' <span class="tag deal">offer</span>' : ''}</div><div class="tiny muted">${esc(qty)}${r.have > 0 ? ` · have ${esc(C.fmtQty(r.have, r.unit))}` : ''}${cheaper ? ` · cheaper at ${esc(cheaper.shop)}` : ''}</div></div>
        <div class="price${r.priceSrc === 'est' ? ' est' : ''}">${r.cost != null ? (r.priceSrc === 'est' ? '~' : '') + C.eur(r.cost) : ''}</div>
        <button class="icon-btn" data-act="itemMenu" data-key="${esc(r.key)}" aria-label="Options for ${esc(r.name)}" style="width:34px;height:34px;border:0;background:none">${ICON.more}</button></div>`;
    }
    h += `</section>`;
  }
  if (L.staples.length) h += `<section class="card" data-tour="staples"><b>Check the cupboard</b><div class="chips wrap">${L.staples.map(x => `<button class="chip" data-act="haveStaple" data-key="${x.item}">${esc(x.name)}</button>`).join('')}</div><p class="tiny muted" style="margin:0">Tap what you have. <button class="linkbtn" data-act="stapleToList">Add the rest to the list</button></p></section>`;
  h += `<div class="row" data-tour="done"><button class="btn primary grow" data-act="doneShopping"${done ? '' : ' disabled'}>Finished shopping</button><button class="btn" data-act="listMore" data-tour="share" aria-label="More options" style="width:52px;padding:0">${ICON.more}</button></div>
  <p class="tiny muted" style="text-align:center;margin:0">~ means an estimated price. Scan a receipt and Mise learns the real ones.</p>`;
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
/* ================= Spice rack, kitchen kit, buy-one-thing, barcode scanner ================= */
const GEAR = [['oven', 'Oven'], ['hob', 'Hob'], ['microwave', 'Microwave'], ['airfryer', 'Air fryer'], ['slowcooker', 'Slow cooker']];
function gearSummary() { const g = G.gearOf(S), x = [g.airfryer && 'air fryer', g.slowcooker && 'slow cooker', !g.oven && 'no oven'].filter(Boolean); return x.length ? ' · ' + x.join(', ') : ''; }
function rackSheet() {
  const have = (ui.rackDraft = ui.rackDraft || { ...(S.rack && S.rack.have || {}) });
  return `<h2>Spice rack</h2><p class="small muted">Tap what's in your cupboard. Mise cooks with these, and puts anything else a meal needs on your list.</p>
  ${C.RACK.map(([n, ids]) => `<div class="small" style="font-weight:700;margin:10px 0 4px">${n}</div><div class="chips wrap">${ids.map(id => `<button class="chip" data-act="rackTog" data-val="${id}" aria-pressed="${!!have[id]}">${esc(ITEM[id].n)}</button>`).join('')}</div>`).join('')}
  <div class="row" style="margin-top:14px"><button class="btn grow" data-act="rackAll">Tick all</button><button class="btn grow" data-act="rackNone">Clear</button><button class="btn primary grow" data-act="rackDone">Done</button></div>`;
}
const EQUIP = [
  ['Appliances', [['oven', 'Oven', 'Roasts, traybakes, bakes and pies', 'roast traybake bake pie sticky loaded flatbread braise'], ['hob', 'Hob', 'Pan-fries, stir-fries, curries, pasta and soups', 'panfry stirfry simmer curry pasta soup friedrice risotto hash'], ['microwave', 'Microwave', 'Quicker jacket potatoes and rice', ''], ['airfryer', 'Air fryer', 'Crisp chicken, chips and roasties in about half the time', 'panfry roast traybake loaded'], ['slowcooker', 'Slow cooker', '15 minutes in the morning, dinner ready when you get home', 'pulled braise curry simmer soup']]],
  ['Pans & pots', [['pan', 'Frying pan or wok', 'Pan-fries, stir-fries, fried rice, hash and frittata', 'panfry stirfry friedrice hash frittata shakshuka burgers quesadilla'], ['pot', 'Large pot with a lid', 'Curries, stews, soups, pasta and pot roasts', 'simmer curry soup noodlesoup pasta risotto braise pulled']]],
  ['Tins & dishes', [['tin', 'Roasting tin or baking tray', 'Roasts, traybakes and loaded potatoes', 'roast traybake sticky loaded flatbread'], ['dish', 'Ovenproof dish', 'Pasta bakes, pies and gratins', 'bake pie']]]];
function gearReach(meths) {
  if (!meths) return null; const ms = meths.split(' '), mains = [...G.pantryStock(S).keys()].filter(id => G.MAINS[id]);
  const fit = mains.filter(id => { const m = G.MAINS[id].methods; return ms.some(x => (Array.isArray(m) ? m : String(m).split(' ')).includes(x)); });
  return fit;
}
function gearSheet() {
  const g = G.gearOf(S);
  return `<h2>Equipment</h2><p class="small muted">Mise only suggests meals you can cook with what you've got. Turn on what you have; turn off anything you don't.</p>
  ${EQUIP.map(([grp, list]) => `<div class="small" style="font-weight:700;margin:12px 0 6px">${grp}</div><div class="eq">${list.map(([k, n, what, meths]) => { const fit = gearReach(meths); return `<button class="eqi" data-act="gearTog" data-val="${k}" aria-pressed="${!!g[k]}"><span class="sw2" aria-hidden="true"></span><div class="grow"><b>${n}</b><span>${what}</span>${fit && fit.length ? `<span class="reach">Works with ${fit.length === 1 ? 'your ' + esc(ITEM[fit[0]].n.toLowerCase()) : `${fit.length} things you have`}</span>` : ''}</div></button>`; }).join('')}</div>`).join('')}
  <button class="btn primary block" style="margin-top:14px" data-act="closeSheet">Done</button>`;
}
function unlockSheet(res) {
  if (!res) return `<h2>One thing to buy</h2><p class="muted">Working out what unlocks the most meals…</p>`;
  const row = x => `<div class="pi" style="align-items:flex-start"><div class="grow"><b>${esc(ITEM[x.item].n)}</b> <span class="small muted">≈ ${C.eur(x.price)}</span><div class="small" style="color:var(--accent);font-weight:700">+${x.meals} meal${x.meals > 1 ? 's' : ''} with what you have</div><div class="tiny muted">${esc(x.examples.join(' · '))}</div></div><button class="btn sm" data-act="unlockAdd" data-val="${x.item}">${S.list.extras.some(e => e.item === x.item) ? 'On list' : 'Add to list'}</button></div>`;
  return `<h2>One thing to buy</h2><p class="small muted">The single item that turns what you've got into the most dinners.${res.ready ? ` You can already make about ${res.ready} without buying anything.` : ''}</p>
  ${res.basics.length ? `<div class="tag warn" style="white-space:normal;display:block;padding:8px 10px;margin-bottom:8px;font-size:13px"><b>You're out of ${esc(res.basics.map(id => ITEM[id].n.toLowerCase()).join(' and '))}</b>, which goes in most meals. <button class="btn sm" data-act="unlockAdd" data-val="${res.basics[0]}" style="margin-left:6px">Add</button></div>` : ''}
  ${res.length ? `<div class="card flat">${res.map(row).join('')}</div>` : `<p class="muted">Add a few more things to your kitchen and Mise can work this out.</p>`}`;
}
/* Barcode scanner: camera + Open Food Facts (free) + what you've taught it */
const SC = {};
function scanSheet() {
  return `<h2>Scan</h2><div class="scanbox"><video id="scanVid" playsinline muted autoplay></video><div class="scanline"></div></div>
  <p class="small muted" id="scanMsg" style="margin:8px 0">Point the camera at a barcode.</p><div id="scanRes"></div>
  <form class="row" data-form="scanCode" style="margin-top:8px"><input id="scanCode" inputmode="numeric" placeholder="Or type the barcode number" autocomplete="off" aria-label="Barcode number"><button class="btn" type="submit">Look up</button></form>`;
}
async function scanStart() {
  scanStop(); SC.busy = false; SC.last = null;
  try { SC.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false }); }
  catch (e) { const m = $('#scanMsg'); if (m) m.textContent = "Couldn't open the camera. Allow camera access, or type the number below."; return; }
  const v = $('#scanVid'); if (!v) { scanStop(); return; } v.srcObject = SC.stream; try { await v.play(); } catch (e) {}
  if ('BarcodeDetector' in window) {
    try { const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      SC.timer = setInterval(async () => { if (SC.busy || !v.videoWidth) return; try { const r = await det.detect(v); if (r && r[0]) scanFound(r[0].rawValue); } catch (e) {} }, 250); return; } catch (e) {}
  }
  try {
    if (!window.ZXing) await new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'vendor/zxing.min.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    SC.reader = new window.ZXing.BrowserMultiFormatReader();
    SC.reader.decodeFromStream(SC.stream, v, res => { if (res && !SC.busy) scanFound(res.getText()); });
  } catch (e) { const m = $('#scanMsg'); if (m) m.textContent = "This phone can't read barcodes from the camera. Type the number below."; }
}
function scanStop() {
  if (SC.timer) clearInterval(SC.timer); SC.timer = null;
  try { if (SC.reader) SC.reader.reset(); } catch (e) {} SC.reader = null;
  if (SC.stream) for (const t of SC.stream.getTracks()) t.stop(); SC.stream = null;
}
function offQty(p, it) {
  if (!it) return 1;
  if (it.u === 'pc') { const m = /(\d+)\s*(x|pcs?|pieces?|eggs?|pack|stk|st)?\b/i.exec(p.quantity || ''); return m && +m[1] < 100 ? +m[1] : it.packs[0]; }
  const q = +p.product_quantity, u = String(p.product_quantity_unit || '').toLowerCase();
  if (q > 0) return u === 'kg' || u === 'l' ? q * 1000 : q;
  const m = /([\d.,]+)\s*(kg|g|ml|l|cl)\b/i.exec(p.quantity || ''); if (m) { const n = parseFloat(m[1].replace(',', '.')), uu = m[2].toLowerCase(); return uu === 'kg' || uu === 'l' ? n * 1000 : uu === 'cl' ? n * 10 : n; }
  return it.packs[0];
}
async function scanFound(code) {
  code = String(code).replace(/\D/g, ''); if (!code || code === SC.last) return;
  SC.busy = true; SC.last = code; if (navigator.vibrate) navigator.vibrate(60);
  const msg = $('#scanMsg'), box = $('#scanRes'); if (msg) msg.textContent = 'Looking up ' + code + '…';
  const known = (S.barcodes || {})[code];
  let prod = null, item = null, qty = null;
  if (known) { item = known.item; qty = known.qty; prod = { product_name: known.name }; }
  else {
    try { const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_en,generic_name,brands,quantity,product_quantity,product_quantity_unit,categories_tags`); const j = await r.json(); if (j && j.status === 1) prod = j.product; } catch (e) {}
    if (prod) {
      const tries = [prod.product_name_en, prod.product_name, prod.generic_name, ...(prod.categories_tags || []).slice().reverse().map(t => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' '))].filter(Boolean);
      for (const t of tries) { const id = C.matchIngredient(t); if (id) { item = id; break; } }
      qty = offQty(prod, ITEM[item]);
    }
  }
  SC.cur = { code, item, qty, name: prod ? [prod.product_name_en || prod.product_name, prod.brands && prod.brands.split(',')[0]].filter(Boolean).join(' · ') : '' };
  if (msg) msg.textContent = prod ? (SC.cur.name || 'Found it') + (prod.quantity ? ' · ' + prod.quantity : '') : `Not in the free product database (${code}).`;
  if (box) box.innerHTML = scanResult();
}
function scanResult() {
  const c = SC.cur; if (!c) return '';
  const it = ITEM[c.item];
  return `<div class="card flat" style="margin:0">${it ? `<div class="row between"><div><div class="tiny muted">Adds as</div><b>${esc(it.n)}</b> <span class="small muted">${C.fmtQty(c.qty || it.packs[0], it.u)}</span></div><button class="btn primary" data-act="scanAdd">Add</button></div>` : `<p class="small" style="margin:0 0 6px">What is it?</p>`}
  <form class="row" data-form="scanFix" style="margin-top:8px"><input id="scanFix" placeholder="${it ? 'Not right? Type what it is' : 'e.g. chicken thighs'}" autocomplete="off" aria-label="What is it"><button class="btn" type="submit">${it ? 'Fix' : 'Add'}</button></form>
  <button class="btn block" style="margin-top:8px" data-act="scanNext">Scan another</button></div>`;
}
function scanSave(item, qty, name) {
  const c = SC.cur; if (!c) return;
  S.barcodes = S.barcodes || {}; S.barcodes[c.code] = { item, qty, name: c.name || name };
  C.addPantry(S, item, qty, ITEM[item] ? ITEM[item].n : name); save(); render();
  toast(`Added ${ITEM[item] ? ITEM[item].n.toLowerCase() : name}`);
  SC.cur = null; SC.busy = false; const box = $('#scanRes'); if (box) box.innerHTML = ''; const m = $('#scanMsg'); if (m) m.textContent = 'Point the camera at the next barcode.';
  setTimeout(() => { SC.last = null; }, 1500);
}
function viewPantry() {
  const t = C.today(), tab = ui.pantryTab || 'have';
  let h = `<div class="seg" role="group" data-tour="pantryTabs">${[['have', 'In the kitchen'], ['freezer', 'Freezer']].map(([k, n]) => `<button data-act="pantryTab" data-val="${k}" aria-pressed="${tab === k}">${n}${k === 'freezer' && M.freezer(S).length ? ` (${M.freezer(S).length})` : ''}</button>`).join('')}</div>`;
  if (tab === 'freezer') {
    const fz = M.freezer(S), frozen = S.pantry.filter(p => p.item && ITEM[p.item] && ITEM[p.item].a === 'frozen');
    const stock = frozen.length ? `<section class="card flat"><div class="shop-h"><b>Frozen food</b><span class="small muted">${frozen.length}</span></div>${frozen.map(p => `<div class="pi" data-act="pantryItem" data-key="${p.key}" style="cursor:pointer"><div class="grow"><b>${esc(p.name)}</b><div class="tiny muted">${C.fmtQty(p.qty, p.unit)}</div></div><span class="small muted">›</span></div>`).join('')}</section><button class="btn block" data-act="moodGoDirect" data-val="oven">What can I make from the freezer?</button>` : '';
    if (!fz.length) return h + stock + `${frozen.length ? '' : `<div class="empty"><h3>Freezer's empty</h3><p>Frozen leftovers show up here as free dinners. Frozen food you buy (scan a receipt or add it in the kitchen tab) shows here too, and Mise plans easy meals around it.</p></div>`}`;
    return h + `<h3 style="margin:4px 0 0">Your frozen meals</h3><section class="card flat">${fz.map(f => `<div class="pi"><div class="grow"><b>${esc(f.title)}</b><div class="tiny muted">${f.portions} portion${f.portions > 1 ? 's' : ''} · ${M.freezerAge(f)} days in${M.freezerAge(f) > 90 ? ' · <span style="color:var(--hot)">eat soon</span>' : ''}</div></div><button class="btn sm" data-act="freezerUse" data-key="${f.id}">Tonight</button><button class="icon-btn" data-act="freezerDel" data-key="${f.id}" aria-label="Remove">${ICON.x}</button></div>`).join('')}</section>` + stock;
  }
  const items = S.pantry.slice().sort((a, b) => (a.exp || '9999').localeCompare(b.exp || '9999'));
  const soon = items.filter(p => p.exp && C.daysBetween(t, p.exp) <= 3);
  const recent = items.filter(p => !soon.includes(p) && p.added && C.daysBetween(p.added, t) <= 2);
  const longLife = items.filter(p => !soon.includes(p) && !recent.includes(p) && (!p.exp || C.daysBetween(t, p.exp) > 60));
  const rest = items.filter(p => !soon.includes(p) && !recent.includes(p) && !longLife.includes(p));
  const filt = ui.pFilter || 'all';
  h += `<form class="ask-in" data-form="addPantry" data-tour="addPantry"><input id="pantryName" placeholder="Add food: 2 onions, pork roast, milk…" autocomplete="off" enterkeyhint="done" aria-label="Add food"><button class="btn icon" type="button" data-act="scanOpen" aria-label="Scan a barcode" data-tour="scan">${ICON.scan}</button><button class="go" type="submit" aria-label="Add"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></form>${dymBox('pantry')}
  <div class="quick3 two"><a href="#builder" data-act="togetherGo" data-tour="make">${ICON.pot}<b>What can I make?</b><span>${soon.length ? `${soon.length} thing${soon.length > 1 ? 's' : ''} to use soon` : 'From what you have'}</span></a><button data-act="snapFridge" data-tour="snap">${ICON.receipt}<b>Snap your fridge</b><span>AI adds what it sees</span></button></div><input type="file" id="fridgePhoto" accept="image/*" capture="environment" hidden data-change="fridgePhoto">`;
  const kit = () => { const g = G.gearOf(S), on = EQUIP.flatMap(([, l]) => l).filter(x => g[x[0]]).map(x => x[1].split(' or ')[0]); return `<h3 class="sec-h" style="margin-top:10px">Your kitchen</h3><div class="kit2"><button class="kitc" data-act="rackOpen" data-tour="rack">${ICON.spark}<b>Spice rack</b><span>${C.rackOn(S) ? `${Object.values(S.rack.have).filter(Boolean).length} ticked` : 'Tick what you have'}</span></button><button class="kitc" data-act="gearOpen" data-tour="gear">${ICON.pot}<b>Equipment</b><span>${esc(on.slice(0, 3).join(', '))}${on.length > 3 ? ` +${on.length - 3}` : ''}</span></button><button class="kitc" data-act="unlockOpen">${ICON.tag}<b>One thing to buy</b><span>Unlocks the most meals</span></button></div>`; };
  if (!items.length) return h + `<div class="empty"><h3>Nothing tracked yet</h3><p>Add food above, scan a barcode or a receipt, or tap Done shopping on your list.</p><a class="btn" href="#receipts">Scan a receipt</a></div>` + kit();
  h += `<div class="chips">${[['all', 'All', items.length], ['soon', 'Use soon', soon.length], ['recent', 'Recently added', recent.length], ['long', 'Long-life', longLife.length]].filter(x => x[0] === 'all' || x[2]).map(([k, n, c]) => `<button class="chip" data-act="pFilter" data-val="${k}" aria-pressed="${filt === k}">${n}${k !== 'all' ? ` · ${c}` : ''}</button>`).join('')}</div>`;
  const sec = (title, arr) => arr.length ? `<section class="card flat"><div class="shop-h"><b>${title}</b><span class="small muted">${arr.length}</span></div>${arr.map(p => { const d = p.exp ? C.daysBetween(t, p.exp) : null; const cls = d == null ? 'none' : d < 0 ? 'hot' : d <= 3 ? 'warn' : ''; return `<div class="pi" data-act="pantryItem" data-key="${p.key}" style="cursor:pointer"><span class="dot ${cls}"></span><div class="grow"><div style="font-weight:700">${esc(p.name)}</div><div class="tiny muted">${p.item ? C.fmtQty(p.qty, p.unit) : ''}${d != null ? ` · ${d < 0 ? 'past its date' : d === 0 ? 'use today' : d === 1 ? '1 day left' : d > 60 ? 'keeps for ages' : d + ' days left'}` : ''}</div></div><span class="small muted">›</span></div>`; }).join('')}</section>` : '';
  const show = k => filt === 'all' || filt === k;
  return h + (show('soon') ? sec('Use soon', soon) : '') + (show('recent') ? sec('Recently added', recent) : '') + (filt === 'all' ? sec('Fridge & cupboard', rest) : '') + (show('long') ? sec('Long-life', longLife) : '') + kit();
}
function viewMake() {
  const can = C.whatCanIMake(S).slice(0, 30);
  if (!can.length) return `<div class="empty"><h3>Your pantry is empty</h3><p>Add what you have, or scan a receipt, and Mise will rank recipes you can make with it.</p><a class="btn primary" href="#pantry">Go to pantry</a></div>`;
  return can.map(x => `<div class="card"><button class="row" style="border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit" data-act="openRecipe" data-key="${esc(x.r.id)}">${thumb(x.r)}<div class="grow"><div style="font-weight:700">${esc(x.r.title)}</div><div class="small muted">${Math.round(x.cover * 100)}% in stock${x.usesExp ? ' · <span class="tag warn">uses food to use soon</span>' : ''}</div></div></button>
    <div class="bar"><i style="width:${x.cover * 100}%"></i></div>${x.missing.length ? `<div class="row between"><span class="small muted grow">Missing: ${esc(x.missing.join(', '))}</span><button class="btn sm" data-act="addMissing" data-key="${esc(x.r.id)}">Add to list</button></div>` : '<span class="small" style="color:var(--accent);font-weight:700">You have everything.</span>'}</div>`).join('');
}

/* ================= More ================= */
function viewMore() {
  const tiles = [['#recipes', ICON.pot, 'Saved meals', 'Regulars, yours, recent'], ['#tastes', '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>', 'Your tastes', 'What you like & why'], ['#lab', ICON.spark, 'Flavour lab', 'What goes with what'], ['#receipts', ICON.receipt, 'Receipts', 'Scan & review'], ['#deals', ICON.tag, 'Deals', 'Offers you spotted'], ['#insights', ICON.chart, 'Stats', 'Savings, streaks, challenges'], ['#settings', ICON.gear, 'Settings', 'Household, shops, backup'], ['#tour', ICON.spark, 'App tour', 'How everything works'], ['#install', ICON.phone, 'Install', 'Home screen & Android']];
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
const MAKE_CHIPS = [['exp', 'Experiment'], ['have', 'Use what I have'], ['quick', 'Quick'], ['comfort', 'Comfort'], ['healthy', 'Healthy'], ['cheap', 'Cheap'], ['spicy', 'Spicy'], ['veggie', 'Veggie']];
/* ---------- Method tiles: a designed stand-in for food photos ---------- */
const TILE_ICON = {
  oven: '<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="26" rx="4"/><path d="M8 19h32M14 15.5h2M20 15.5h2"/><rect x="14" y="24" width="20" height="9" rx="2"/></svg>',
  pan: '<svg viewBox="0 0 48 48"><circle cx="20" cy="26" r="12"/><path d="M32 26h12"/><path d="M15 23c2-2 6-2 8 0"/></svg>',
  pot: '<svg viewBox="0 0 48 48"><path d="M10 20h28v12a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7z"/><path d="M6 20h36M18 14c0-2 2-4 6-4s6 2 6 4"/><path d="M18 28c2 1.5 4 1.5 6 0s4-1.5 6 0"/></svg>',
  bowl: '<svg viewBox="0 0 48 48"><path d="M8 24h32a16 14 0 0 1-32 0z"/><path d="M16 18c1-4 4-6 8-6M28 12l6-6M31 14l7-5"/></svg>',
  leaf: '<svg viewBox="0 0 48 48"><path d="M12 36C12 20 22 10 38 10c0 16-10 26-26 26z"/><path d="M12 36L28 20"/></svg>',
  wrap: '<svg viewBox="0 0 48 48"><path d="M10 34L30 10l8 8-24 20z"/><path d="M18 26l8 8M24 20l6 6"/></svg>',
  egg: '<svg viewBox="0 0 48 48"><path d="M24 8c7 0 12 11 12 19a12 12 0 0 1-24 0c0-8 5-19 12-19z"/><circle cx="24" cy="29" r="5"/></svg>',
  spark: '<svg viewBox="0 0 48 48"><path d="M24 8v8M24 32v8M8 24h8M32 24h8M13 13l5 5M30 30l5 5M35 13l-5 5M18 30l-5 5"/></svg>'
};
const TILE_OF = { roast: ['oven', '#7d4527'], traybake: ['oven', '#8a5a2b'], bake: ['oven', '#6d4a7a'], sticky: ['oven', '#93492c'], braise: ['pot', '#5b3a2e'], pie: ['oven', '#86603a'],
  panfry: ['pan', '#9a5b1f'], stirfry: ['pan', '#2f6b62'], friedrice: ['pan', '#7a6a1f'], hash: ['pan', '#8d6420'],
  pasta: ['bowl', '#5f6e2c'], risotto: ['bowl', '#6f6a3a'], bowl: ['bowl', '#3d5f7a'], salad: ['leaf', '#46703f'],
  simmer: ['pot', '#8f3f2c'], curry: ['pot', '#9a3d22'], soup: ['pot', '#7a3b4a'], noodlesoup: ['bowl', '#2e5a6b'], pulled: ['pot', '#6b3b26'],
  wraps: ['wrap', '#7d5631'], quesadilla: ['wrap', '#a0661f'], burgers: ['wrap', '#6f4a2e'], flatbread: ['wrap', '#93542a'],
  frittata: ['egg', '#a0711c'], shakshuka: ['egg', '#9b3f26'], loaded: ['oven', '#4f5f3a'] };
function tile(r, cls) {
  const m = r && r.spec && r.spec.method, [ic, col] = r && r.exp ? ['spark', '#6b2f57'] : TILE_OF[m] || ['pot', 'var(--accent)'];
  return `<div class="tile ${cls || ''}" style="--tc:${col}" aria-hidden="true">${TILE_ICON[ic]}</div>`;
}
/* ---------- Home ---------- */
const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function daysLeftLabel(n, exp) { return n < 0 ? 'past date' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 7 ? 'by ' + DAYN[new Date(exp + 'T12:00').getDay()].slice(0, 3) : n + ' days'; }
function useFirstItems() {
  const t = C.today(), seen = new Set(), out = [];
  for (const p of S.pantry.slice().sort((a, b) => (a.exp || '9').localeCompare(b.exp || '9'))) {
    const id = p.item, it = id && ITEM[id]; if (!it || it.staple || !p.exp || seen.has(id) || C.pantryQty(S, id) <= 0) continue;
    const n = C.daysBetween(t, p.exp); if (n > 4) break; seen.add(id); out.push({ id, n, exp: p.exp });
  }
  return out.slice(0, 6);
}
function homeReason(r, urgent) {
  const ids = new Set(r.ings.map(i => i.item)), u = urgent.find(x => ids.has(x.id));
  if (u) return `Uses your ${ITEM[u.id].n.toLowerCase()} ${u.n <= 0 ? 'before it goes off' : u.n === 1 ? 'before tomorrow' : 'before ' + DAYN[new Date(u.exp + 'T12:00').getDay()]}`;
  const j = [...ids].find(id => G.MAINS[id] && G.MAINS[id].joint && C.pantryQty(S, id) > 0); if (j) return `Makes the most of your ${ITEM[j].n.toLowerCase()}`;
  const fresh = [...ids].filter(id => id && ITEM[id] && !ITEM[id].staple), have = fresh.filter(id => C.pantryQty(S, id) > 0);
  if (have.length >= 3) return `Uses ${have.length} things you already have${have.length === fresh.length ? ', nothing to buy' : ''}`;
  const w = C.whyRecipe(S, r).find(x => x[0] > 0); return w ? w[1] : `Ready in about ${C.effort(r).total} minutes`;
}
function homeSuggestions(more) {
  const t = C.today(), key = t + '|' + S.pantry.map(p => p.item + p.qty).join(',') + '|' + JSON.stringify(S.gear || {});
  let H = ui.home;
  if (!H || H.key !== key) H = ui.home = { key, seen: new Set(), seenTitles: new Set(), list: null, jp: null };
  if (H.list && !more) return H;
  try {
    const stock = G.pantryStock(S), ctx = nightCtx(t), serves = M.servesFor(S, t), useStock = [...stock.keys()].some(id => G.MAINS[id]);
    const got = G.options(S, { want: {}, stock, serves, useStock, seen: H.seen, seenTitles: H.seenTitles, kids: ctx.kids, onlyStockMains: useStock, noise: 1.8, allowSlow: false, priority: useStock ? 'save' : 'balanced', recent: true }, 2);
    const urgent = useFirstItems();
    H.list = got.map(r => ({ r, why: homeReason(r, urgent) }));
    if (!H.jp) { const joints = [...stock.keys()].filter(id => G.MAINS[id] && G.MAINS[id].joint); H.jp = joints.slice(0, 1).map(id => G.jointPlan(S, id, serves)).filter(x => x && x.first.length); }
    H.err = null;
  } catch (e) { console.warn('home ideas', e); H.list = []; H.err = true; }
  return H;
}
function homeBody(B) {
  let h = ''; B.jp = null;
  const t = C.today(), es = S.plan[t] || [];
  if (es.some(e => !e.cooked && R[e.rid])) h += tonightCard();
  const uf = useFirstItems();
  if (uf.length) h += `<section class="usefirst"><div class="sec-h"><h3>Use first</h3><span class="small muted">Tap one for ideas</span></div><div class="chips">${uf.map(x => `<button class="chip uf${x.n <= 1 ? ' soon' : ''}" data-act="useFirst" data-val="${x.id}"><b>${esc(ITEM[x.id].n)}</b><span>${daysLeftLabel(x.n, x.exp)}</span></button>`).join('')}</div></section>`;
  const fresh = S.pantry.filter(p => p.item && ITEM[p.item] && !ITEM[p.item].staple && C.pantryQty(S, p.item) > 0).length;
  if (!fresh) return h + `<section class="card empty-home"><h3>Tell Mise what's in your kitchen</h3><p class="small muted" style="margin:0">Add a few things you have and Home fills with meals you can make right now, starting with what needs using.</p><div class="row"><a class="btn primary grow" href="#pantry">Add food</a><button class="btn grow" data-act="scanOpen">Scan a barcode</button></div></section>`;
  const H = homeSuggestions();
  B.jp = H.jp; B.jpR = (H.jp || []).flatMap(x => [...x.first, ...x.then]);
  h += `<section><div class="sec-h"><h3>Ideas from your kitchen</h3><button class="btn sm ghost" data-act="homeMore">Show others</button></div>`;
  h += H.list.length ? `<div class="sugs">${H.list.map((x, k) => { const r = x.r, c = C.recipeCost(S, r, r.serves);
    return `<article class="sug"><button class="sug-main" data-act="homeOpen" data-idx="${k}">${tile(r, 'sug-tile')}<div class="grow"><div class="eyebrow">${esc(G.METHODS[r.spec.method] ? G.METHODS[r.spec.method].n : 'dinner')} · ${timeLabel(r)} · ${C.eur(c.perServe)} each</div><h3>${esc(r.title)}</h3><p class="reason">${esc(x.why)}</p></div></button>
      <div class="row"><button class="btn primary sm grow" data-act="homeTonight" data-idx="${k}">Cook tonight</button><button class="btn sm grow" data-act="homeOpen" data-idx="${k}">See it</button></div></article>`; }).join('')}</div>`
    : `<div class="card"><p class="small muted" style="margin:0">${H.err ? "Something went wrong building ideas. Try typing what you fancy above." : "Nothing fits right now. Try typing what you fancy, or add a main like chicken or mince to your pantry."}</p></div>`;
  h += `</section>`;
  return h;
}
function homeLinks() {
  let h = '';
  if (S.pantry.length >= 4) h += `<div class="quick3 two"><button data-act="unlockOpen">${ICON.tag}<b>One thing to buy</b><span>Unlocks the most meals</span></button><a href="#lab">${ICON.spark}<b>Flavour lab</b><span>What goes with what</span></a></div>`;
  return h;
}
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function viewBuilder() {
  const B = ui.make || (ui.make = { text: '', chips: S.pantry.filter(p => p.item && ITEM[p.item] && !ITEM[p.item].staple).length >= 6 ? ['have'] : [], res: null });
  const night = new Date().getHours() >= 15 ? 'tonight' : 'today';
  let h = `<section class="hero-ask" data-tour="bDesc"><div class="hello">${greeting()}</div><h2 class="ask-h">What shall we cook ${night}?</h2>
    <div class="ask-in"><input id="makeText" type="search" enterkeyhint="go" autocomplete="off" aria-label="What do you fancy?" placeholder="Pork roast, something creamy, or ask a question…" value="${esc(B.text)}"><button class="go" data-act="makeGo" aria-label="Show me ideas"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
    <div class="chips">${MAKE_CHIPS.map(([k, n]) => `<button class="chip" data-act="makeChip" data-val="${k}" aria-pressed="${B.chips.includes(k)}">${n}</button>`).join('')}</div>
    <div class="row" data-tour="bGo"><button class="btn sm grow" data-act="askOpen" data-tour="ask">Help me choose</button><button class="btn sm grow" data-act="makeSurprise">Surprise me</button></div></section>
    ${B.ask && B.res ? `<div class="row between small" style="margin:0 2px"><span class="muted">From your picks: ${esc(B.ask.sum)}</span><button class="btn sm ghost" data-act="askOpen">Change</button></div>` : ''}`;
  if (B.chips.includes('exp')) h = h.replace('<div class="row" data-tour="bGo">', `<div class="exp-bar"><span class="small"><b>How adventurous?</b></span><div class="chips">${[[1, 'A twist'], [2, 'Properly wild']].map(([v, n]) => `<button class="chip" data-act="makeWild" data-val="${v}" aria-pressed="${(B.wild || 1) === v}">${n}</button>`).join('')}</div><a class="small" href="#lab" style="margin-left:auto">Flavour lab ›</a></div><div class="row" data-tour="bGo">`);
  if (B.qa) { const Q = B.qa, A2 = Q.a;
    h += `<section class="card qa"><div class="row between"><div class="eyebrow">You asked</div><button class="btn sm ghost" data-act="makeClear">Clear</button></div><p class="small muted" style="margin:-6px 0 0">${esc(Q.q)}</p>
      ${A2 ? `<h3>${esc(A2.title)}</h3>${A2.list ? `<ol class="qa-list">${A2.list.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}${(A2.lines || []).map(x => `<p class="qa-p">${x}</p>`).join('')}` : `<p style="margin:0">Mise doesn't know that one yet. It can answer swaps, storage, cooking times, doneness, what goes with what, unit conversions and kitchen rescues.</p>`}
      ${Q.ai ? `<div class="note yours"><b>AI says:</b> ${esc(Q.ai).replace(/\n+/g, '<br>')}</div>` : ''}
      <div class="row wrap">${A2 && A2.explore ? `<a class="btn sm" href="#ing/${A2.explore}">About ${esc(ITEM[A2.explore].n.toLowerCase())} ›</a>` : ''}${Q.ai ? '' : `<button class="btn sm${A2 ? ' ghost' : ' primary'}" data-act="qaAI"${Q.busy ? ' disabled' : ''}>${Q.busy ? '<span class="spinner"></span> Asking…' : 'Ask AI instead'}</button>`}</div></section>`; }
  if (B.res) h += `<div class="row between" style="margin:2px 2px -4px"><h3>${B.text ? `Ideas for \u201c${esc(B.text)}\u201d` : 'Ideas for you'}</h3><button class="btn sm ghost" data-act="makeClear">Clear</button></div>`;
  else h += homeBody(B);
  if (B.jp && B.jp.length) h += B.jp.map(J => { const nm = ITEM[J.id].n.toLowerCase(), idx = r => B.jpR.indexOf(r);
    return `<section class="card jp"><div class="eyebrow">Make the most of it</div><h3 style="margin:2px 0 6px">Your ${esc(nm)}</h3>
      <div class="small muted">Cook it whole:</div>${J.first.map(r => `<button class="meal" data-act="jpOpen" data-idx="${idx(r)}"><div class="grow"><b>${esc(r.title)}</b><div class="tiny muted">${timeLabel(r)}${r.leftover ? ` · feeds ${r.leftover.feeds}` : ''}</div></div><span class="small muted">›</span></button>`).join('')}
      ${J.then.length ? `<div class="small muted" style="margin-top:8px">Then the leftovers (about ${J.leftover.g} g) become quick dinners:</div>${J.then.map(r => `<button class="meal" data-act="jpOpen" data-idx="${idx(r)}"><div class="grow"><b>${esc(r.title)}</b><div class="tiny muted">${timeLabel(r)}</div></div><span class="small muted">›</span></button>`).join('')}` : ''}
      <button class="btn block" data-act="jpPlan" data-val="${J.id}" style="margin-top:8px">Plan it: roast + ${J.then.length ? Math.min(3, J.then.length) : 0} leftover nights</button></section>`; }).join('');
  if (B.res) h += B.res.length ? B.res.map((r, k) => { if (r.exp) return expCard(r, k); const like = G.likeThis(S, r), c = C.recipeCost(S, r, r.serves), why = C.whyRecipe(S, r).filter(w => w[0] > 0).slice(0, 2);
    const fresh = [...new Set(r.ings.map(i => i.item).filter(id => id && ITEM[id] && !(ITEM[id].staple && C.stapleHave(S, id))))], haveN = fresh.filter(id => C.pantryQty(S, id) > 0), buy = fresh.filter(id => !haveN.includes(id));
    return `<div class="card fs"><button class="mealbtn" data-act="makeOpen" data-idx="${k}" style="width:100%">${tile(r, 'fs-tile')}<div class="grow"><div class="eyebrow">${esc(G.METHODS[r.spec.method].n)} · ${timeLabel(r)} · ${C.eur(c.perServe)} each</div><h3 style="margin:2px 0 0;white-space:normal">${esc(r.title)}</h3>${like ? `<div class="tiny muted">Like the ${esc(like)} you liked</div>` : ''}</div></button>
      ${r.leftover ? `<div class="small"><b>Feeds ${r.leftover.feeds}.</b> Leaves ~${r.leftover.g} g for ${r.leftover.portions} more portion${r.leftover.portions > 1 ? 's' : ''}</div>` : ''}
      <p class="small muted" style="margin:0">${esc(r.ings.filter(i => i.u !== 'taste' && !(ITEM[i.item] || {}).staple).slice(0, 8).map(i => i.name).join(' · '))}</p>
      ${S.pantry.length ? `<div class="small"><b style="color:var(--accent)">Uses ${haveN.length} thing${haveN.length !== 1 ? 's' : ''} you have</b> · ${buy.length ? `buy: ${esc(buy.map(id => ITEM[id].n.toLowerCase()).join(', '))}` : 'nothing to buy'}</div>` : ''}${why.length ? `<div class="why" style="margin:0">${why.map(w => `<span>+ ${esc(w[1])}</span>`).join('')}</div>` : ''}
      <div class="row"><button class="btn primary grow" data-act="makeTonight" data-idx="${k}">Tonight</button><button class="btn grow" data-act="makeOpen" data-idx="${k}">See it / pick a day</button></div></div>`; }).join('') + '<button class="btn block" data-act="makeMore">More ideas</button>'
    : (() => { let why = ''; try { const pw = G.parseWant(S, B.text || ''), ids = [].concat(pw.want.main || [], pw.want.base || [], pw.want.veg || []).filter(id => ITEM[id] && C.likeOf(S, { item: id, name: ITEM[id].n }) < 0); if (ids.length) why = `You've marked ${ids.map(id => ITEM[id].n.toLowerCase()).join(' and ')} as something you don't eat. <a href="#tastes">Change that in Your tastes</a>.`; } catch (e) { /* ignore */ } return `<div class="empty"><h3>Couldn't make that work</h3><p>${why || 'Try fewer conditions, or check your dislikes in Your tastes.'}</p></div>`; })();
  else h += homeLinks();
  return h;
}
function makeRun(surprise, append) {
  const B = ui.make, p = G.parseWant(S, B.text || ''), ch = B.chips, t = C.today();
  const stock = G.pantryStock(S), ctx = nightCtx(t);
  if (!append || !B.seen) { B.seen = new Set(); B.seenTitles = new Set(); B.res = []; }
  const useStock = ch.includes('have');
  const opts = { want: p.want, exclude: p.exclude, serves: M.servesFor(S, t), stock, useStock, seen: B.seen, seenTitles: B.seenTitles, quick: p.mods.quick || ch.includes('quick'), cheap: p.mods.cheap || ch.includes('cheap'), healthy: p.mods.healthy || ch.includes('healthy'), spicy: p.mods.spicy || ch.includes('spicy'), vegOnly: p.mods.veggie || ch.includes('veggie'), mood: p.mods.mood || (ch.includes('comfort') ? 'comfort' : null), kids: ctx.kids, onlyStockMains: useStock && [...stock.keys()].some(id => G.MAINS[id] && !p.want.main), noise: surprise ? 4 : 1.6, allowSlow: !(p.mods.quick || ch.includes('quick')), maxTime: p.mods.quick || ch.includes('quick') ? 35 : null, priority: useStock ? 'save' : 'balanced' };
  if (ch.includes('exp')) { B.res = B.res.concat(F.experiments(S, { ...expWant(B.text), stock, serves: opts.serves, wild: B.wild || 1, vegOnly: opts.vegOnly, seenTitles: B.seenTitles }, 6)); return; }
  if (!append) { const joints = [...stock.keys()].filter(id => G.MAINS[id] && G.MAINS[id].joint && !opts.vegOnly && (!p.want.main || [].concat(p.want.main).includes(id))); B.jp = joints.slice(0, 2).map(id => G.jointPlan(S, id, opts.serves)).filter(x => x && x.first.length); B.jpR = B.jp.flatMap(x => [...x.first, ...x.then]); }
  let got = G.options(S, { ...opts, recent: true }, 6);
  if (!got.length && !append) got = G.options(S, { ...opts, recent: false, seen: new Set(), seenTitles: new Set(), onlyStockMains: false }, 6);
  if (!got.length && !append && useStock) got = G.options(S, { ...opts, recent: false, useStock: false, onlyStockMains: false, priority: 'balanced', seen: new Set(), seenTitles: new Set() }, 6);
  G.noteShown(S, got.map(r => r.spec)); save();
  B.res = B.res.concat(got);
}
// "pork chop, coffee and blue cheese" -> hero + partners
function expWant(text) {
  const ids = []; for (const part of String(text || '').toLowerCase().split(/,|\band\b|\bwith\b|\+|&/)) { const t = part.trim(); if (!t) continue; const id = C.matchIngredient(t); if (id && F.aroma(id) && !ids.includes(id)) ids.push(id); }
  const hero = ids.find(id => ['protein', 'veg'].includes(F.catOf(id)) || ['halloumi', 'goats-cheese', 'tofu'].includes(id)) || ids[0];
  return hero ? { hero, with: ids.filter(id => id !== hero) } : {};
}
/* ---------- Help me choose: a short quiz, then Mise fills in the rest ---------- */
const ASK_TIMES = [[20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '1 hour'], [0, 'No rush']];
const ASK_MOODS = [['any', 'Anything'], ['comfort', 'Comfort'], ['light', 'Light'], ['spicy', 'Spicy'], ['new', 'Something new']];
function askGroups() {
  const ids = [...new Set(S.pantry.map(p => p.item).filter(id => id && ITEM[id] && !ITEM[id].staple && C.pantryQty(S, id) > 0))];
  const isMain = id => G.MAINS[id], isVeg = id => G.VEG[id] && !isMain(id), isBase = id => G.BASES[id];
  return [['Meat, fish & protein', ids.filter(isMain)], ['Veg', ids.filter(isVeg)], ['Rice, pasta, bread & potatoes', ids.filter(id => isBase(id) && !isVeg(id))], ['Everything else', ids.filter(id => !isMain(id) && !isVeg(id) && !isBase(id) && (G.ADDIN_PP[id] || G.FLAIR[id] || G.COMP[id] || F.aroma(id)))]].filter(g => g[1].length);
}
function askSheet() {
  const A = ui.ask, g = G.gearOf(S);
  if (A.step === 0) return `<h2>What do you want to use?</h2><p class="small muted">Pick one thing or lots. Mise fills in the rest.</p>
    ${askGroups().map(([n, ids]) => `<div class="small" style="font-weight:700;margin:10px 0 4px">${n}</div><div class="chips wrap">${ids.map(id => `<button class="chip" data-act="askTog" data-val="${id}" aria-pressed="${A.sel.includes(id)}">${esc(ITEM[id].n)}</button>`).join('')}</div>`).join('') || '<p class="muted">Your kitchen is empty. Add a few things in Pantry first, or type below.</p>'}
    <form class="row" data-form="askAdd" style="margin-top:10px"><input id="askName" placeholder="Something else? e.g. leftover rice" autocomplete="off" aria-label="Ingredient"><button class="btn" type="submit">Add</button></form>
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="askSkip">Anything is fine</button><button class="btn primary grow" data-act="askNext">${A.sel.length ? `Next (${A.sel.length})` : 'Next'}</button></div>`;
  if (A.step === 1) return `<h2>What can you cook with?</h2><p class="small muted">Turn off anything you don't want to use tonight.</p>
    <div class="chips wrap">${GEAR.filter(([k]) => g[k] || A.gear[k]).map(([k, n]) => `<button class="chip" data-act="askGear" data-val="${k}" aria-pressed="${!!A.gear[k]}">${n}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="askBack">Back</button><button class="btn primary grow" data-act="askNext">Next</button></div>`;
  if (A.step === 2) return `<h2>How long have you got?</h2><p class="small muted">All in: prep, cooking and washing up.</p>
    <div class="chips wrap">${ASK_TIMES.map(([v, n]) => `<button class="chip" data-act="askTime" data-val="${v}" aria-pressed="${A.time === v}">${n}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="askBack">Back</button><button class="btn primary grow" data-act="askNext">Next</button></div>`;
  return `<h2>What are you in the mood for?</h2>
    <div class="chips wrap">${ASK_MOODS.map(([v, n]) => `<button class="chip" data-act="askMood" data-val="${v}" aria-pressed="${A.mood === v}">${n}</button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="askBack">Back</button><button class="btn primary grow" data-act="askGo">Show me ideas</button></div>`;
}
function askRun(append) {
  const A = ui.make.ask, B = ui.make, stock = G.pantryStock(S), serves = M.servesFor(S, C.today());
  for (const id of A.sel) if (!(stock.get(id) > 0)) stock.set(id, ITEM[id].packs[0]);
  const mains = A.sel.filter(id => G.MAINS[id]), veg = A.sel.filter(id => G.VEG[id] && !G.MAINS[id]), bases = A.sel.filter(id => G.BASES[id] && !G.VEG[id]), rest = A.sel.filter(id => !mains.includes(id) && !veg.includes(id) && !bases.includes(id));
  const want = {}; if (mains.length) { want.main = mains.length === 1 ? mains[0] : mains; want.lock = true; } if (veg.length && veg.length <= 2) want.veg = veg; if (bases.length) want.base = bases.length === 1 ? bases[0] : bases;
  const gear = { ...A.gear }, maxTime = A.time ? Math.max(10, A.time - 20) : null;
  if (!append || !B.seen) { B.seen = new Set(); B.seenTitles = new Set(); B.res = []; B.jp = null; }
  const opts = { want, stock, serves, useStock: true, gear, maxTime, allowSlow: !A.time || A.time >= 90 || !!gear.slowcooker, quick: A.time && A.time <= 30, mood: A.mood === 'comfort' || A.mood === 'light' ? A.mood : null, spicy: A.mood === 'spicy', noise: A.mood === 'new' ? 3.5 : 1.6, mustUse: new Set([...rest, ...(veg.length > 2 ? veg : [])]), seen: B.seen, seenTitles: B.seenTitles, recent: true, priority: 'save', onlyStockMains: !mains.length && [...stock.keys()].some(id => G.MAINS[id]) };
  let got = G.options(S, opts, A.time ? 9 : 6);
  if (A.time) { const fit = got.filter(r => C.effort(r).total <= A.time + 5); got = (fit.length >= 3 ? fit : got.slice().sort((a, b) => C.effort(a).total - C.effort(b).total)).slice(0, 6); }
  G.noteShown(S, got.map(r => r.spec)); save();
  B.res = B.res.concat(got);
}
function expCard(r, k) {
  const fresh = [...new Set(r.ings.map(i => i.item).filter(id => id && ITEM[id] && !(ITEM[id].staple && C.stapleHave(S, id))))], buy = fresh.filter(id => C.pantryQty(S, id) <= 0);
  return `<div class="card fs exp"><button class="mealbtn" data-act="makeOpen" data-idx="${k}" style="width:100%">${tile(r, 'fs-tile')}<div class="grow"><div class="eyebrow">Experiment · ${r.exp.wild > 1 ? 'wild' : r.exp.wild ? 'a twist' : 'safe bet'} · ${Math.round(r.exp.harmony * 100)}% harmony</div><h3 style="margin:2px 0 0;white-space:normal">${esc(r.title)}</h3></div></button>
    <div class="why" style="margin:0">${r.exp.why.slice(0, 2).map(w => `<span>${esc(w)}</span>`).join('')}</div>
    <div class="small">${buy.length ? `Buy: ${esc(buy.map(id => ITEM[id].n.toLowerCase()).join(', '))}` : '<b style="color:var(--accent)">Nothing to buy</b>'}</div>
    <div class="row"><button class="btn primary grow" data-act="makeTonight" data-idx="${k}">Try it tonight</button><button class="btn grow" data-act="makeOpen" data-idx="${k}">See it</button></div></div>`;
}
/* ================= Ingredient Explorer ================= */
const cap = x => String(x).charAt(0).toUpperCase() + String(x).slice(1);
const TASTE_N = [['sweet', 'Sweet'], ['salty', 'Salty'], ['sharp', 'Sour'], ['bitter', 'Bitter'], ['umami', 'Umami'], ['heat', 'Heat'], ['rich', 'Rich']];
function ingTaste(id) { try { const t = K.taste([[id, 100]]); const mx = { sweet: 20, salty: 1.2, rich: 30, sharp: 1.5, umami: 1.5, heat: 0.6, bitter: 1.3 }; return TASTE_N.map(([k, n]) => [n, Math.max(0, Math.min(1, (t[k] || 0) / mx[k]))]); } catch (e) { return null; } }
function viewIng() {
  const id = ui.ingId, it = ITEM[id];
  if (!it) return `<div class="empty"><h3>Pick an ingredient</h3><p>Tap any ingredient in a recipe, or search the Flavour lab.</p><a class="btn" href="#lab">Flavour lab</a></div>`;
  const sid = it.standin || id;
  const have = C.pantryQty(S, id), ar = F.aroma(id), notes = ar && ar.n ? Object.entries(ar.n).sort((a, b) => b[1] - a[1]).filter(x => F.NOTES[x[0]]).slice(0, 4).map(x => F.NOTES[x[0]]) : [];
  const t = ingTaste(sid), n = K.ready() ? K.nutritionOf(id) : null, best = TQ.bestTechniques(id), prep = PX.PREP[id], vars = PX.VARIETY[id];
  let P = null; try { P = ar ? F.partners(S, sid, { n: 10 }) : null; } catch (e) { P = null; }
  let sub = null; try { sub = C.substitutesFor(S, { item: sid, name: ITEM[sid].n, q: 1, u: '' }); } catch (e) { sub = null; }
  const like = C.likeOf(S, { item: id, name: it.n });
  let h = `<section class="ing-hero">${tile({ spec: { method: { meat: 'roast', fish: 'panfry', veg: 'salad', fruitveg: 'salad', dairy: 'bake', pantry: 'simmer', spices: 'curry' }[it.cat] || 'simmer' } }, 'ing-tile')}<div class="grow"><div class="eyebrow">${esc({ fruitveg: 'Fruit & veg', meat: 'Meat', fish: 'Fish', dairy: 'Dairy', chilled: 'Chilled', frozen: 'Frozen', bakery: 'Bakery', pantry: 'Cupboard', spices: 'Spices & sauces', snacks: 'Snacks', drinks: 'Drinks' }[it.a] || it.a)}</div><h2>${esc(it.n)}</h2>
    <div class="small ${have > 0 ? '' : 'muted'}">${have > 0 ? `<b style="color:var(--accent)">In your kitchen</b>` : 'Not in your kitchen'}${like > 0 ? ' · you love it' : like <= -9 ? " · can't eat" : like < 0 ? " · you don't like it" : ''}</div></div></section>
    ${it.standin ? `<p class="note yours" style="margin:10px 0 0">Mise cooks ${esc(it.n.toLowerCase())} like <a href="#ing/${it.standin}">${esc(ITEM[it.standin].n.toLowerCase())}</a>, and keeps your name for it in recipes.</p>` : ''}
    <button class="btn primary block" data-act="ingMeals" data-val="${id}" style="margin-top:10px">Meals with ${esc(it.n.toLowerCase())}</button>`;
  if (notes.length || (t && t.some(x => x[1] > 0.05))) h += `<section class="r-sec"><h3>Flavour</h3>${notes.length ? `<p class="small" style="margin:4px 0 8px">${esc(notes.join(', '))}</p>` : ''}${t && t.some(x => x[1] > 0.05) ? `<div class="tbars">${t.filter(x => x[1] > 0.04).map(([k, v]) => `<div><span>${k}</span><i><b style="width:${Math.round(v * 100)}%"></b></i></div>`).join('')}</div>` : ''}</section>`;
  if (best.length) h += `<section class="r-sec"><h3>Best ways to cook it</h3><div class="ilist">${best.slice(0, 5).map(tq => { const nt = TQ.noteOf(id, tq) || {}; return `<div><b>${esc(cap(TQ.TECH_NAMES[tq] || tq))}</b>${nt.time || nt.prep || nt.heat ? `<span>${esc([nt.prep, nt.time, nt.heat].filter(Boolean).join(' · '))}</span>` : ''}${nt.done ? `<span>Done: ${esc(nt.done)}</span>` : ''}</div>`; }).join('')}</div>${TQ.safeOf(id) ? `<p class="tiny muted" style="margin:6px 0 0">Safe to eat: ${esc(TQ.safeOf(id))}</p>` : ''}</section>`;
  if (prep) h += `<section class="r-sec"><h3>Ways to prepare it</h3><div class="ilist">${prep.map(([w, d]) => `<div><b>${esc(w)}</b><span>${esc(d)}</span></div>`).join('')}</div></section>`;
  if (vars) h += `<section class="r-sec"><h3>Which kind?</h3><div class="ilist">${vars.map(([w, d]) => `<div><b>${esc(w)}</b><span>${esc(d)}</span></div>`).join('')}</div></section>`;
  if (P) { const grp = (k, title) => P[k] && P[k].length ? `<div class="small muted" style="font-weight:700;margin:8px 0 4px">${title}</div><div class="chips wrap">${P[k].filter(x => !(['meat', 'fish'].includes(it.a) && ['meat', 'fish'].includes((ITEM[x.id] || {}).a))).slice(0, 8).map(x => `<button class="chip" data-act="ingPick" data-val="${x.id}" title="${esc(x.why || '')}">${esc(ITEM[x.id].n)}${C.pantryQty(S, x.id) > 0 ? ' <span class="dot-have"></span>' : ''}</button>`).join('')}</div>` : '';
    const body = grp('classic', 'Classic') + grp('surprising', 'Surprising') + grp('wild', 'Wild, but it works');
    if (body) h += `<section class="r-sec"><div class="r-sec-h"><h3>Goes with</h3><a class="small" href="#lab" data-act="ingLab" data-val="${id}">Flavour lab ›</a></div>${body}</section>`; }
  if (sub && sub.items && sub.items.length) h += `<section class="r-sec"><h3>Swap it for</h3><div class="chips wrap">${sub.items.slice(0, 6).map(sid => `<button class="chip" data-act="ingPick" data-val="${sid}">${esc(ITEM[sid].n)}</button>`).join('')}</div>${sub.tip ? `<p class="small muted" style="margin:6px 0 0">${esc(sub.tip)}</p>` : ''}</section>`;
  const store = PX.STORE[id] || PX.STORE[sid] || PX.STORE_AISLE[it.a];
  if (store || it.life) h += `<section class="r-sec"><h3>Storing it</h3><p class="small" style="margin:4px 0 0">${esc(store || '')}${it.life ? ` ${it.life >= 365 ? 'Keeps a year or more.' : it.life >= 60 ? `Keeps about ${Math.round(it.life / 30)} months.` : it.life >= 14 ? `Keeps about ${Math.round(it.life / 7)} weeks.` : `Keeps about ${it.life} day${it.life > 1 ? 's' : ''}.`}` : ''}</p></section>`;
  if (n && n.kcal != null) h += `<section class="r-sec"><h3>Nutrition <span class="small muted" style="font-family:var(--body);font-weight:400">per 100 g</span></h3><div class="nut">${[['Energy', Math.round(n.kcal) + ' kcal'], ['Protein', n.protein != null ? (+n.protein).toFixed(1) + ' g' : null], ['Carbs', n.carb != null ? (+n.carb).toFixed(1) + ' g' : null], ['Fat', n.fat != null ? (+n.fat).toFixed(1) + ' g' : null], ['Fibre', n.fiber != null ? (+n.fiber).toFixed(1) + ' g' : null], ['Salt', n.sodium != null ? (n.sodium * 2.5 / 1000).toFixed(2) + ' g' : null]].filter(x => x[1]).map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div><p class="tiny muted" style="margin:6px 0 0">${esc(n.name || '')} · USDA / Canadian Nutrient File</p></section>`;
  return h;
}
/* ================= Flavour lab ================= */
function viewLab() {
  const L = ui.lab || (ui.lab = { sel: [] }), hero = L.sel[0];
  let h = `<div class="card"><p class="small muted" style="margin:0 0 6px">Pick an ingredient to see what goes with it, from the classics to the wild ones that share hidden flavours. Tap partners to build a combo.</p>
    <form class="row" data-form="labAdd"><input id="labName" placeholder="e.g. pork, strawberries, coffee" autocomplete="off" aria-label="Ingredient"><button class="btn primary" type="submit">Explore</button></form>
    ${L.sel.length ? `<div class="chips wrap" style="margin-top:8px">${L.sel.map(id => `<button class="chip" aria-pressed="true" data-act="labDrop" data-val="${id}">${esc(ITEM[id].n)} ✕</button>`).join('')}</div>` : ''}</div>`;
  if (!hero) {
    const have = [...new Set(S.pantry.map(p => p.item).filter(id => id && F.aroma(id) && !ITEM[id].staple))].slice(0, 16);
    if (have.length) h += `<div class="small muted" style="margin:4px 2px">From your kitchen</div><div class="chips wrap">${have.map(id => `<button class="chip" data-act="labPick" data-val="${id}">${esc(ITEM[id].n)}</button>`).join('')}</div>`;
  } else {
    if (L.sel.length > 1) {
      const ck = F.comboCheck(L.sel);
      h += `<section class="card"><div class="row between"><b>Your combo</b><span class="small muted">${Math.round(ck.harmony * 100)}% harmony</span></div><div class="bar"><i style="width:${Math.round(ck.harmony * 100)}%"></i></div>
        ${ck.links.length ? `<div class="why" style="margin:8px 0 0">${ck.links.slice(0, 4).map(([a, b, w]) => `<span>${esc(ITEM[a].n)} + ${esc(ITEM[b].n.toLowerCase())}: ${esc(w)}</span>`).join('')}</div>` : '<p class="small muted">These don\'t share much. Add something that links them.</p>'}
        ${ck.need.length ? `<p class="small" style="margin:8px 0 0"><b>Could use:</b> ${esc(ck.need.map(n => n[1]).join('; '))}</p>` : ''}
        <button class="btn primary block" style="margin-top:10px" data-act="labDish">Turn it into a dish</button></section>`;
    }
    const P = F.partners(S, hero, { n: 12 });
    const grp = (k, title, sub) => P[k].length ? `<section class="card flat"><div class="shop-h"><b>${title}</b><span class="tiny muted">${sub}</span></div><div class="chips wrap">${P[k].filter(x => !L.sel.includes(x.id)).map(x => `<button class="chip" data-act="labPick" data-val="${x.id}" title="${esc(x.why)}">${esc(ITEM[x.id].n)}</button>`).join('')}</div>${L.why && P[k].some(x => x.id === L.why) ? `<p class="tiny muted" style="margin:6px 0 0">${esc(P[k].find(x => x.id === L.why).why)}</p>` : ''}</section>` : '';
    h += `<a class="btn block" href="#ing/${hero}">All about ${esc(ITEM[hero].n.toLowerCase())}: prep, storage, nutrition ›</a>`;
    const best = TQ.bestTechniques(hero);
    if (best.length) h += `<section class="card flat"><div class="shop-h"><b>Best ways to cook ${esc(ITEM[hero].n.toLowerCase())}</b></div>${best.slice(0, 5).map(t => { const nt = TQ.noteOf(hero, t) || {}; return `<div class="small" style="margin-top:6px"><b>${esc(TQ.TECH_NAMES[t] || t)}</b>${nt.time || nt.prep ? ` <span class="tiny muted">${esc([nt.prep, nt.time, nt.heat].filter(Boolean).join(' · '))}</span>` : ''}</div>`; }).join('')}${TQ.safeOf(hero) ? `<div class="tiny muted" style="margin-top:6px">Done: ${esc(TQ.safeOf(hero))}</div>` : ''}</section>`;
    h += `<h3 style="margin:10px 2px 4px">Goes with ${esc(ITEM[hero].n.toLowerCase())}</h3>` + grp('classic', 'Classic', 'everyone does these') + grp('surprising', 'Surprising', 'shared flavours') + grp('wild', 'Wild', 'odd on paper, works in the pan');
  }
  const notes = Object.entries((S.lab || {}).notes || {}).map(([id, n]) => ({ id, ...n, r: S.recipes[id] })).filter(x => x.r).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (notes.length) h += `<h3 style="margin:14px 2px 4px">Your notebook</h3><section class="card flat">${notes.map(x => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left" data-act="openRecipe" data-key="${esc(x.id)}"><div class="grow"><b>${esc(x.r.title)}</b><div class="tiny muted">${x.v > 0 ? 'Worked' : x.v < 0 ? "Didn't work" : 'Okay'}${x.note ? ' · ' + esc(x.note) : ''}</div></div></button>`).join('')}</section>`;
  return h;
}
function labBox(r) {
  if (!r.exp) return '';
  const n = ((S.lab || {}).notes || {})[r.id] || {};
  return `<div class="card flat exp" style="margin:0 0 10px"><b class="small">Why it might work</b><div class="why" style="margin:4px 0 8px">${r.exp.why.map(w => `<span>${esc(w)}</span>`).join('')}</div>
    <b class="small">How did it go?</b><div class="chips">${[[1, 'Worked'], [0, 'Okay'], [-1, "Didn't work"]].map(([v, t]) => `<button class="chip" data-act="labRate" data-val="${v}" aria-pressed="${n.v === v}">${t}</button>`).join('')}</div>
    <textarea id="labNote" placeholder="Notes for next time: more coffee, less salt, try it with lamb…" style="min-height:60px;margin-top:6px">${esc(n.note || '')}</textarea><button class="btn sm" style="margin-top:6px" data-act="labNoteSave">Save note</button></div>`;
}
function viewTogether() {
  const T = ui.together || (ui.together = { sel: S.pantry.filter(p => p.item && ITEM[p.item] && !ITEM[p.item].staple && ['veg', 'meat', 'fish', 'dairy', 'pantry', 'bakery', 'chilled'].includes(ITEM[p.item].cat) && (!p.exp || C.daysBetween(C.today(), p.exp) >= 0)).sort((a, b) => (a.exp || '9').localeCompare(b.exp || '9')).map(p => p.item).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8), ideas: null });
  const chipsHave = [...new Set(S.pantry.map(p => p.item).filter(id => id && ITEM[id] && !ITEM[id].staple))].filter(id => !T.sel.includes(id)).slice(0, 14);
  let h = `<div class="card" data-tour="together"><p class="small muted" style="margin:0">No recipe needed. Pick what you've got and Mise gives you a rough way to cook it.</p>
    <div class="chips wrap">${T.sel.map(id => `<button class="chip" aria-pressed="true" data-act="tgToggle" data-key="${id}">${esc(ITEM[id].n)} ✕</button>`).join('') || '<span class="small muted">Nothing picked yet</span>'}</div>
    <form class="row" data-form="tgAdd"><input id="tgName" placeholder="Add an ingredient" autocomplete="off" aria-label="Ingredient"><button class="btn" type="submit">Add</button></form>
    ${chipsHave.length ? `<div class="tiny muted">From your kitchen:</div><div class="chips wrap">${chipsHave.map(id => `<button class="chip" data-act="tgToggle" data-key="${id}">+ ${esc(ITEM[id].n)}</button>`).join('')}</div>` : ''}
    <button class="btn primary block" data-act="tgGo"${T.sel.length ? '' : ' disabled'}>Show me what to make</button></div>`;
  if (T.ideas) h += T.ideas.length ? T.ideas.map((x, k) => `<div class="card fs"><div class="row between"><div><div class="eyebrow">${esc(x.name)} · ${esc(x.kit)} · ~${x.time} min</div><h3 style="margin:2px 0 0">${esc(x.title)}</h3></div></div>
      <ol class="steps">${x.steps.map(st => `<li>${esc(st)}</li>`).join('')}</ol>${x.missing.length ? `<p class="tiny muted" style="margin:0">Nice to add if you have them: ${esc(x.missing.map(id => ITEM[id].n.toLowerCase()).join(', '))}</p>` : ''}
      <div class="row"><button class="btn primary grow" data-act="tgTonight" data-idx="${k}">Cook it tonight</button><button class="btn" data-act="tgShuffle" data-idx="${k}">Other flavour</button></div></div>`).join('') : `<div class="empty"><h3>Need a bit more</h3><p>Add a main (meat, fish, eggs, beans) or a base (pasta, rice, potatoes) and a couple of veg.</p></div>`;
  return h;
}
function viewBuilderIdeas() {
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
      ${I.built.map((r, k) => { const c = C.recipeCost(S, r, r.serves); return `<button class="meal" style="width:100%;border:1px solid var(--line);border-radius:12px;background:${b && b.id === r.id ? 'var(--accent-soft)' : 'var(--card)'};cursor:pointer;color:inherit;text-align:left" data-act="pickIdea" data-val="${k}"><div class="thumb">${esc(r.title[0])}</div><div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${timeLabel(r)} · ≈ ${C.eur(c.perServe)} a serving</div></div></button>`; }).join('')}
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
    <label class="f">Item<input id="dealItem" required placeholder="e.g. Chicken thighs" autocomplete="off"></label>
    <div class="row"><label class="f grow">Shop<select id="dealShop">${shopsOpts(S.settings.defaultShop)}</select></label><label class="f grow">Price (€)<input type="number" inputmode="decimal" step="0.01" id="dealPrice" required></label></div>
    <label class="f">Valid until<input type="date" id="dealUntil" value="${C.addDays(t, 6)}"></label>
    <button class="btn primary" type="submit">Save deal</button></form>`;
  if (active.length) h += `<section class="card flat"><div class="shop-h"><b>Current deals</b><span class="small muted">${active.length}</span></div>${active.map(d => `<div class="pi"><span class="tag deal">${esc(d.shop)}</span><div class="grow"><b>${esc(d.name)}</b><div class="tiny muted">${C.eur(d.price)} · until ${fmtShort(d.until)}</div></div>${d.item ? `<button class="btn sm" data-act="dealMeals" data-key="${d.item}">Meals</button>` : ''}<button class="icon-btn" data-act="delDeal" data-key="${d.id}" aria-label="Delete deal">${ICON.x}</button></div>`).join('')}</section>`;
  if (meals.length) h += `<h3>Meals using your deals</h3><div class="rlist">${meals.map(card).join('')}</div>`;
  return h;
}

/* ================= Insights ================= */
function viewInsights() {
  const st = M.stats(S), mb = M.monthBudget(S), trends = M.priceTrends(S).slice(0, 6), ch = (S.challenge || {}).kind, cp = M.challengeProgress(S, C.weekDates(0));
  let h = `<div class="statgrid" data-tour="stats"><div><b>${st.cooked}</b><span>meals cooked</span></div><div><b>${C.eur(st.saved).replace(/\.\d\d$/, '')}</b><span>saved vs takeaway</span></div><div><b>${st.streak}</b><span>week streak</span></div><div><b>${st.wasteMeals}</b><span>leftover & freezer meals eaten</span></div></div>`;
  h += `<div class="card" data-tour="challenge"><h2>This week's challenge</h2>${ch ? `<p style="margin:0"><b>${esc(M.CHALLENGES[ch][0])}</b> · ${cp ? (cp.note ? esc(cp.note) : `${cp.done} of ${cp.of}`) : ''}</p><button class="btn sm" data-act="challengeSet" data-val="">Stop challenge</button>` : `<div style="display:flex;flex-direction:column;gap:8px">${Object.entries(M.CHALLENGES).map(([k, [n, d]]) => `<button class="btn" style="justify-content:flex-start;text-align:left" data-act="challengeSet" data-val="${k}"><div><b>${n}</b><div class="tiny muted" style="font-weight:500">${d}</div></div></button>`).join('')}</div>`}</div>`;
  if (mb) h += `<div class="card"><h2>This month</h2><div class="row between small"><span>Spent ${C.eur(mb.spent)} of about ${C.eur(mb.budget)}</span><b style="${mb.tight ? 'color:var(--hot)' : ''}">${mb.tight ? 'Ahead of pace' : 'On track'}</b></div><div class="bar${mb.tight ? ' over' : ''}"><i style="width:${Math.min(100, mb.spent / mb.budget * 100)}%"></i></div>${mb.tight ? '<p class="tiny muted" style="margin:0">Budget mode is on: suggestions lean cheaper until you\'re back on pace.</p>' : ''}</div>`;
  if (trends.length) h += `<div class="card"><h2>Price watch</h2>${trends.map(t => `<div class="row between small"><span>${esc(ITEM[t.item].n)}</span><b style="color:${t.change > 0 ? 'var(--hot)' : 'var(--accent)'}">${t.change > 0 ? '▲' : '▼'} ${Math.round(Math.abs(t.change) * 100)}%</b></div>`).join('')}</div>`;
  if (st.topRecipe && R[st.topRecipe[0]]) h += `<div class="card"><h3 style="margin:0">Your most cooked</h3><p class="small" style="margin:0">${esc(R[st.topRecipe[0]].title)} (${st.topRecipe[1]}×)${st.topCuisine ? ` · favourite cuisine: ${esc(st.topCuisine[0])}` : ''} · ${st.cuisines} cuisines tried</p></div>`;
  return h + viewSpend();
}
function viewSpend() {
  if (!S.receipts.length) return `<div class="empty" style="padding:20px"><h3>No spending data yet</h3><p>Scan a few receipts and this fills up with weekly spend, categories and waste.</p><a class="btn primary" href="#receipts">Scan a receipt</a></div>`;
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
/* ================= App updates (Android) ================= */
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const UP = { state: 'idle' };
// The Android shell has no @capacitor/core bundle, so talk to the native plugin through the bridge directly
const updater = () => UP.plugin || (UP.plugin = (() => {
  const cap = window.Capacitor; if (typeof cap.registerPlugin === 'function') return cap.registerPlugin('Updater');
  const call = m => o => cap.nativePromise('Updater', m, o || {});
  return { getVersion: call('getVersion'), canInstall: call('canInstall'), openInstallSettings: call('openInstallSettings'), download: call('download'), install: call('install'), addListener: async (ev, cb) => cap.addListener('Updater', ev, cb) };
})());
async function checkUpdate(manual) {
  if (!isNative() || UP.state === 'downloading') return;
  try {
    const me = await updater().getVersion(); UP.current = me.versionName; UP.code = me.versionCode;
    const r = await fetch('https://api.github.com/repos/Eoinknd16/Mise/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
    const j = await r.json(); const n = +String(j.tag_name || '').split('.').pop();
    const asset = (j.assets || []).find(a => /\.apk$/i.test(a.name));
    S.settings.updateChecked = Date.now(); save();
    if (!n || !asset || n <= me.versionCode) { UP.state = 'current'; if (manual) toast(`You're on the newest version (${me.versionName}).`); if (ui.route === 'settings') render(); return; }
    UP.latest = { code: n, name: j.tag_name.replace(/^v/, ''), url: asset.browser_download_url, file: asset.name, notes: j.body || '' };
    if (S.settings.autoUpdate !== false || manual) downloadUpdate(); else { UP.state = 'available'; if (ui.route === 'settings') render(); toast(`Mise ${UP.latest.name} is available. Update it in Settings.`); }
  } catch (e) { if (manual) toast("Couldn't check for updates. Are you online?"); }
}
async function downloadUpdate() {
  if (!UP.latest || UP.state === 'downloading') return;
  UP.state = 'downloading'; UP.pct = 0; if (ui.route === 'settings') render();
  const h = await updater().addListener('progress', p => { UP.pct = p.percent; const el = $('#upPct'); if (el) el.textContent = p.percent + '%'; });
  try { const d = await updater().download({ url: UP.latest.url, name: UP.latest.file }); UP.path = d.path; UP.state = 'ready'; installUpdate(); }
  catch (e) { UP.state = 'failed'; toast("The update didn't download. Try again in Settings."); }
  finally { try { h.remove(); } catch (e) {} if (ui.route === 'settings') render(); }
}
async function installUpdate() {
  if (!UP.path) return;
  const r = await updater().install({ path: UP.path });
  if (r && r.needsPermission) openSheet(`<h2>One quick setting</h2><p class="muted">To update itself, Mise needs permission to install apps. You only do this once: switch on <b>Allow from this source</b>, then come back.</p><button class="btn primary block" data-act="upPerm">Open the setting</button>`);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !isNative()) return;
  if (UP.state === 'ready' && UP.waitPerm) { UP.waitPerm = false; closeSheet(); installUpdate(); return; }
  if (Date.now() - (S.settings.updateChecked || 0) > 6 * 3600e3) checkUpdate(false);
});
function updateCard() {
  if (!isNative()) return `<div class="card"><h2>Updates</h2><p class="small muted" style="margin:0">The web app updates itself. Refresh to get the newest version.</p></div>`;
  const st = UP.state, L = UP.latest;
  return `<div class="card" data-tour="sUpdate"><h2>Updates</h2><p class="small muted" style="margin:0 0 8px">Installed: ${esc(UP.current || '…')}${L && L.code > (UP.code || 0) ? ` · newest: ${esc(L.name)}` : ''}</p>
    ${st === 'downloading' ? `<p class="small">Downloading the update… <b id="upPct">${UP.pct || 0}%</b></p>` : st === 'ready' ? `<button class="btn primary block" data-act="upInstall">Install the update</button>` : st === 'available' || st === 'failed' ? `<button class="btn primary block" data-act="upGet">Update to ${esc(L.name)}</button>` : `<button class="btn block" data-act="upCheck">Check for updates</button>`}
    <div class="row between" style="margin-top:10px"><span class="small">Update automatically</span><button class="chip" data-act="upAuto" aria-pressed="${S.settings.autoUpdate !== false}">${S.settings.autoUpdate !== false ? 'On' : 'Off'}</button></div>
    <p class="tiny muted" style="margin:6px 0 0">Mise downloads new versions by itself. Android then asks you to tap Install. Your data stays as it is.</p></div>`;
}
function knowledgeCard() {
  const st = K.stats(); if (!st) return '';
  return `<div class="card"><h2>Chef knowledge</h2><p class="small" style="margin:0">${st.ingredients.toLocaleString()} ingredients · ${st.chefPairs.toLocaleString()} chef pairings · ${st.dishes.toLocaleString()} real dishes analysed (${st.pairs.toLocaleString()} proven combinations) · ${Object.keys(TQ.PROTEIN).length + Object.keys(TQ.VEGTECH).length} technique profiles${st.foods ? ` · nutrition for ${st.foods.toLocaleString()} foods` : ''}</p>
    <p class="tiny muted" style="margin:6px 0 0">Dish and nutrition data: USDA FNDDS and SR28 (public domain). Contains information licensed under the Open Government Licence – Canada (Canadian Nutrient File). World ingredient names and families from FoodOn (foodon.org), licensed CC BY 4.0, mapped to Mise ingredients by Mise.</p></div>`;
}
function viewSettings() {
  const st = S.settings, R7 = M.rhythm(S), ppl = S.people || [];
  if (ui.scrollTo) { const id = ui.scrollTo; ui.scrollTo = null; setTimeout(() => { const e = document.querySelector(`[data-tour=${id}]`); if (e) e.scrollIntoView({ block: 'start' }); }, 60); }
  if (isNative() && !UP.current && !UP.asked) (UP.asked = true, updater().getVersion()).then(v => { UP.current = v.versionName; UP.code = v.versionCode; if (ui.route === 'settings') render(); }).catch(() => {});
  let upc = ''; try { upc = updateCard(); } catch (e) { upc = ''; }
  return upc + knowledgeCard() + `<div class="card" data-tour="sHouse"><h2>Household</h2>
    <div class="pi" style="border:0;padding:0"><div class="grow"><b>You</b></div></div>
    ${ppl.map(p => `<div class="pi"><div class="grow"><b>${esc(p.name)}</b>${p.kid ? ' <span class="tag">child</span>' : ''}<div class="tiny muted">${[(p.diet || []).map(d => (C.DIETS.find(x => x[0] === d) || [, d])[1]).join(', '), Object.values(p.likes || {}).filter(v => v < 0).length ? Object.values(p.likes).filter(v => v < 0).length + ' dislikes' : ''].filter(Boolean).join(' · ') || 'Eats anything'}</div></div><button class="btn sm" data-act="personEdit" data-key="${p.id}">Edit</button></div>`).join('')}
    <button class="btn" data-act="personAdd">+ Add someone</button>
    ${ppl.length ? '' : `<label class="f">Or just set how many you cook for<div class="stepper" style="align-self:flex-start"><button data-act="setNum" data-key="household" data-val="-1">−</button><span>${st.household}</span><button data-act="setNum" data-key="household" data-val="1">+</button></div></label>`}
    <label class="f">Weekly food budget (€)<input type="number" inputmode="decimal" data-setting="budget" value="${st.budget || ''}" placeholder="No budget"></label></div>
  <div class="card" data-tour="sRhythm"><h2>Your week</h2><p class="tiny muted" style="margin:0">What each night is usually like. Suggestions follow this.</p>
    <label class="f">Weeknight time limit (prep, cooking and washing up)<select data-setting="weeknightMax">${[[30, '30 minutes'], [45, '45 minutes'], [60, '1 hour'], [90, '1½ hours'], [0, 'No limit']].map(([v, n]) => `<option value="${v}"${(st.weeknightMax ?? 60) == v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    ${DOW.map((d, i) => `<div class="rhythm"><b>${d}</b><select data-act2="rhythmMode" data-idx="${i}" aria-label="${d}">${Object.entries(M.MODES).map(([k, [n]]) => `<option value="${k}"${R7[i].mode === k ? ' selected' : ''}>${n}</option>`).join('')}</select><select data-act2="rhythmTheme" data-idx="${i}" aria-label="${d} theme"${['takeaway', 'off'].includes(R7[i].mode) ? ' disabled' : ''}><option value="">No theme</option>${Object.entries(M.THEMES).map(([k, [n]]) => `<option value="${k}"${R7[i].theme === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`).join('')}</div>
  <div class="card" data-tour="sShops"><h2>Shopping</h2>
    <label class="f">Main shop<select data-setting="defaultShop">${SHOPS.map(x => `<option${x === st.defaultShop ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
    <div class="small muted" style="font-weight:600">Other shops you use</div><div class="chips wrap">${SHOPS.map(x => `<button class="chip" data-act="toggleShop" data-val="${x}" aria-pressed="${st.shops.includes(x)}">${x}</button>`).join('')}</div>
    <label class="f">A takeaway usually costs you (per person, €)<input type="number" inputmode="decimal" data-setting="takeawayPrice" value="${st.takeawayPrice || 14}"></label></div>
  <div class="card" data-tour="sTastes"><h2>Tastes</h2><p class="small muted" style="margin:0">Likes, dislikes, cuisines, spice and what Mise has learned.</p><a class="btn" href="#tastes">Open your tastes</a></div>
  <div class="card" data-tour="sHealth"><h2>Health <span class="tiny muted">optional</span></h2>
    <label class="row between"><span class="small">Show rough calories & protein</span><input type="checkbox" data-act2="healthToggle" ${st.health ? 'checked' : ''} style="width:24px;height:24px"></label>
    ${st.health ? `<label class="row between"><span class="small">More veg in suggestions</span><input type="checkbox" data-act2="moreVeg" ${(S.taste || {}).moreVeg ? 'checked' : ''} style="width:24px;height:24px"></label><p class="tiny muted" style="margin:0">Gym nights (in Your week) pick high-protein dinners. Numbers are estimates.</p>` : ''}</div>
  <div class="card" data-tour="sAI"><h2>AI <span class="tiny muted">optional</span></h2>
    <label class="f">AI engine<select data-setting="ai"><option value="off"${st.ai === 'off' ? ' selected' : ''}>Off</option><option value="chrome"${st.ai === 'chrome' ? ' selected' : ''}${ui.aiStatus.chrome ? '' : ' disabled'}>On this device${ui.aiStatus.chrome ? '' : ' (not available here)'}</option><option value="puter"${st.ai === 'puter' ? ' selected' : ''}>Puter (free account)</option></select></label>
    <p class="tiny muted" style="margin:0">Used for "Ask AI", fridge photos and tricky imports. Everything else works without it.</p></div>
  <div class="card" data-tour="sLib"><h2>Recipe library</h2>${(() => { const L = C.libraryInfo(); return `<p class="small" style="margin:0">${ui.libBusy ? `<span class="spinner"></span> Downloading… ${Math.round(ui.libBusy * 100)}%` : L.count ? `<b>${L.count}</b> online recipes on this phone · updated ${new Date(L.at).toLocaleDateString()}` : 'Not downloaded yet (about 1 MB).'}</p><button class="btn" data-act="libSync"${ui.libBusy ? ' disabled' : ''}>${L.count ? 'Update now' : 'Download recipes'}</button>`; })()}
    <details><summary class="tiny muted">TheMealDB key</summary><label class="f"><input data-setting="mealdbKey" value="${esc(st.mealdbKey)}" autocomplete="off"></label></details></div>
  <div class="card"><h2>Look & feel</h2><div class="themes" role="group" aria-label="Colour theme">${THEMES.map(([k, n, c]) => `<button data-act="setTheme" data-val="${k}" aria-pressed="${(st.theme || 'light') === k}"><span class="sw">${c.map(x => `<i style="background:${x}"></i>`).join('')}</span>${n}</button>`).join('')}</div>
    <label class="row small" style="gap:10px"><input type="checkbox" data-act="themeAuto"${st.theme === 'auto' ? ' checked' : ''} style="width:22px;height:22px;min-height:0;accent-color:var(--accent)"><span>Match my phone (light or dark)</span></label>
    <div class="small muted" style="font-weight:600" data-tour="sPersona">Receipt reviews</div><div class="seg">${[['gentle', 'Gentle'], ['cheeky', 'Cheeky'], ['savage', 'Savage']].map(([k, n]) => `<button data-act="setTone" data-val="${k}" aria-pressed="${st.tone === k}">${n}</button>`).join('')}</div></div>
  <div class="card" data-tour="sBackup"><h2>Back up & move</h2><p class="small muted" style="margin:0">Everything stays on this phone.</p>
    <div class="row wrap"><button class="btn grow" data-act="exportData">Back up</button><label class="btn grow" for="importFile">Restore</label><input type="file" id="importFile" accept="application/json,.json" hidden data-change="importData"></div>
    <button class="btn" data-act="resetData" style="color:var(--hot)">${ui.resetArm ? 'Tap again to erase everything' : 'Erase all data'}</button></div>`;
}
function personSheet(p) {
  ui.person = p; const diet = p.diet || [];
  setSheetOrOpen(`<h2>${p.name ? esc(p.name) : 'Add someone'}</h2><label class="f">Name<input id="pName" value="${esc(p.name || '')}" placeholder="e.g. Aoife"></label>
    <label class="row" style="gap:10px"><input type="checkbox" id="pKid" ${p.kid ? 'checked' : ''} style="width:22px;height:22px"><span class="small">Child (prefers kid-friendly meals)</span></label>
    <div class="small muted" style="font-weight:700">Dietary needs</div><div class="chips wrap">${C.DIETS.map(([k, n]) => `<button class="chip" data-act="pDiet" data-val="${k}" aria-pressed="${diet.includes(k)}">${n}</button>`).join('')}</div>
    <div class="small muted" style="font-weight:700">Won't eat</div><div class="chips wrap">${Object.entries(p.likes || {}).filter(([, v]) => v < 0).map(([k]) => `<button class="chip" aria-pressed="true" data-act="pUnlike" data-key="${esc(k)}">${esc(likeLabel(k))} ✕</button>`).join('') || '<span class="tiny muted">Nothing yet</span>'}</div>
    <form class="row" data-form="pLike"><input id="pLikeName" placeholder="e.g. Mushrooms" autocomplete="off"><button class="btn" type="submit">Add</button></form>
    <div class="small muted" style="font-weight:700">Spice</div><div class="seg">${[[0, 'None'], [1, 'Mild'], [2, 'Medium'], [3, 'Hot']].map(([v, n]) => `<button data-act="pSpice" data-val="${v}" aria-pressed="${p.spice === v}">${n}</button>`).join('')}</div>
    <div class="row" style="margin-top:12px">${p.id && (S.people || []).some(x => x.id === p.id) ? '<button class="btn" data-act="personDelete" style="color:var(--hot)">Remove</button>' : ''}<button class="btn primary grow" data-act="personSave">Save</button></div>`);
}
/* ================= Sheet ================= */
function openSheet(html) { const w = $('#sheet'); if (w.hidden) { history.pushState({ sheet: 1 }, ''); } w.hidden = false; setSheet(html); document.body.style.overflow = 'hidden'; }
function setSheet(html) { $('#sheetBody').innerHTML = `<button class="sheet-x" data-act="closeSheet" aria-label="Close">${ICON.x}</button>` + html; }
let afterClose = null;
function closeSheet(fromPop, then) {
  const w = $('#sheet'); if (w.hidden) { if (then) then(); return; }
  w.hidden = true; document.body.style.overflow = ''; ui.sheetCtx = null; scanStop();
  if (!fromPop && history.state && history.state.sheet) { afterClose = then || null; history.back(); } else if (then) then();
}
function go(hash) { closeSheet(false, () => { if (location.hash !== '#' + hash) location.hash = hash; else render(true); }); }
window.addEventListener('popstate', () => { if (ui.cook) { cookModeClose(true); return; } if (!$('#sheet').hidden) closeSheet(true); if (afterClose) { const f = afterClose; afterClose = null; setTimeout(f, 0); } });

/* ================= Actions ================= */
const A = {
  closeSheet: () => closeSheet(),
  upCheck: () => { toast('Checking…'); checkUpdate(true); },
  upGet: () => downloadUpdate(),
  upInstall: () => installUpdate(),
  upAuto: () => { S.settings.autoUpdate = S.settings.autoUpdate === false; save(); render(); },
  upPerm: () => { UP.waitPerm = true; updater().openInstallSettings(); },
  week: el => { ui.weekOffset += +el.dataset.val; render(); },
  suggest: () => {
    const all = C.weekDates(ui.weekOffset), wk = M.weekKey(all[0]), W = (S.weekCheck || {})[wk] || {};
    const fzBox = $('#wcFreezer'); if (fzBox) { W.useFreezer = fzBox.checked; }
    let dates = all.filter(d => !(S.plan[d] || []).length && M.cooksOn(S, d) && d >= C.today());
    if (!dates.length) dates = all.filter(d => !(S.plan[d] || []).length && M.cooksOn(S, d));
    if (!dates.length) { closeSheet(); toast('Every night is already planned.'); return; }
    let fz = 0;
    if (W.useFreezer !== false && M.freezer(S).length) {
      const busy = dates.filter(d => M.nightOf(S, d).mode === 'quick' || (W.pace === 'busy' && M.wdOf(d) < 5) || (M.learn(S).tired[M.wdOf(d)] || 0) >= 2);
      for (const d of busy.length ? busy : (W.pace === 'busy' ? dates.slice(0, 1) : [])) { const f = M.freezer(S).sort((a, b) => a.date.localeCompare(b.date))[0]; if (!f || fz >= 2) break; const sv = Math.min(f.portions, M.servesFor(S, d)); M.takeFreezer(S, f.id, sv); S.plan[d] = [{ rid: f.rid, serves: sv, fromFreezer: f.id }]; fz++; }
      dates = dates.filter(d => !(S.plan[d] || []).length);
    }
    const picks = C.suggestWeek(S, dates, M.plannerOptions(S, dates)); let n = 0, lefts = 0;
    for (const p of picks) { if ((S.plan[p.date] || []).length) continue; keepSuggestion(p); (S.plan[p.date] = S.plan[p.date] || []).push(p.leftover ? { rid: p.rid, serves: p.serves, leftover: p.leftover } : { rid: p.rid, serves: p.serves, wildcard: p.wildcard }); if (p.leftover) lefts++; else n++; }
    save(); closeSheet(false, () => render()); const sh = picks.stats && picks.stats.sharedEur > 1;
    toast(`Planned ${n} dinner${n !== 1 ? 's' : ''}${lefts ? ` + ${lefts} leftover night${lefts > 1 ? 's' : ''}` : ''}${fz ? ` + ${fz} from the freezer` : ''}${sh ? '. Meals share ingredients to cut waste.' : '.'}`);
  },
  useUp: () => {
    const dates = C.weekDates(ui.weekOffset), bits = C.weekLeftovers(S, dates), inPlan = new Set(dates.flatMap(d => (S.plan[d] || []).map(e => e.rid)));
    const ideas = C.useUpIdeas(S, bits, inPlan, 6); ui.sheetServes = null;
    openSheet(`<h2>Use up the bits</h2><p class="small muted">Meals that use what you'll have left. Tap one, then pick a day.</p><div class="card flat">${ideas.length ? ideas.map(x => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left;border-top:1px solid var(--line)" data-act="openRecipe" data-key="${esc(x.r.id)}">${thumb(x.r)}<div class="grow"><div class="t">${esc(x.r.title)}</div><div class="small muted">Uses your ${esc(x.uses.map(id => ITEM[id].n.toLowerCase()).join(', '))}</div></div></button>`).join('') : '<p class="small muted">Nothing obvious. Freeze what you can, or add it to a stir-fry or omelette.</p>'}</div>`);
  },
  addMeal: el => { ui.sheetServes = null; openSheet(''); pickerSheet(el.dataset.date); },
  pickRecipe: el => { ui.leftNote = ''; addToPlan(el.dataset.key, ui.pickDate); closeSheet(); render(); toast('Added to ' + fmtDay(ui.pickDate) + ui.leftNote); },
  pickSuggest: () => { const p = keepSuggestion(C.suggestWeek(S, [ui.pickDate])[0]); if (!p) { toast('No suggestion available'); return; } addToPlan(p.rid, ui.pickDate); closeSheet(); render(); toast(`Added ${R[p.rid].title}`); },
  pickOnline: () => { ui.recTab = 'online'; go('recipes'); },
  openRecipe: el => { const ctx = el.dataset.date ? { date: el.dataset.date, idx: +el.dataset.idx } : null; openRecipe(el.dataset.key, ctx); },
  sheetServes: el => { ui.sheetServes = Math.max(1, ui.sheetServes + +el.dataset.val); if (ui.sheetCtx) { const d = ui.sheetCtx.date, e = S.plan[d][ui.sheetCtx.idx]; e.serves = ui.sheetServes; if (!e.leftover && C.isBatch(S, R[e.rid])) { C.clearLeftovers(S, d, e.rid); C.placeLeftovers(S, d, e.rid, e.serves, S.settings.household); } save(); render(); } renderRecipeSheet(); },
  addToDay: el => { const r = ui.sheetRecipe; ui.leftNote = ''; addToPlan(r.id, el.dataset.date, r); closeSheet(); render(); toast(`Added to ${fmtDay(el.dataset.date)}${ui.leftNote}`); },
  toggleBatch: () => { const r = ui.sheetRecipe, hh = S.settings.household || 2; S.batchPref = S.batchPref || {}; const on = !C.isBatch(S, r); S.batchPref[r.id] = on;
    if (on && ui.sheetServes <= hh) ui.sheetServes = Math.max(r.serves, hh); if (!on) ui.sheetServes = hh;
    const ctx = ui.sheetCtx, e = ctx && (S.plan[ctx.date] || [])[ctx.idx];
    if (e && !e.leftover) { e.serves = ui.sheetServes; C.clearLeftovers(S, ctx.date, r.id); if (on) C.placeLeftovers(S, ctx.date, r.id, e.serves, hh); render(); }
    save(); renderRecipeSheet(); },
  saveRecipe: () => { const r = ui.sheetRecipe; S.recipes[r.id] = r; refreshRecipes(); save(); renderRecipeSheet(); toast('Saved to your recipes'); },
  deleteRecipe: el => { delete S.recipes[el.dataset.key]; for (const d of Object.keys(S.plan)) S.plan[d] = S.plan[d].filter(e => e.rid !== el.dataset.key); refreshRecipes(); save(); closeSheet(); render(); toast('Recipe deleted'); },
  rateSheet: el => { const r = ui.sheetRecipe; if (!S.recipes[r.id] && !String(r.id).startsWith('b:')) S.recipes[r.id] = r; C.rate(S, r.id, R[r.id] || r, +el.dataset.val); refreshRecipes(); save(); renderRecipeSheet(); toast('Thanks. Mise will learn from that.'); },
  cook: el => {
    const e = S.plan[el.dataset.date][+el.dataset.idx], r = R[e.rid]; const L = M.learn(S);
    if (e.leftover || e.fromFreezer) { e.cooked = true; if (e.leftover) L.leftEaten = (L.leftEaten || 0) + 1; else S.freezerEaten = (S.freezerEaten || 0) + 1; save(); closeSheet(); render(); toast(e.leftover ? 'Leftovers done. Nothing wasted.' : 'Freezer meal done.'); return; }
    e.cooked = true; C.markCooked(S, e.rid, r, el.dataset.date); C.cookRecipe(S, r, e.serves); M.logCook(S, r, e.serves, el.dataset.date); save(); render();
    reactionSheet(r, e, el.dataset.date);
  },
  rateCooked: el => { const r = ui.sheetRecipe; C.rate(S, r.id, r, +el.dataset.val); save(); closeSheet(); toast(+el.dataset.val >= 4 ? "Noted. It'll come round again." : "Noted. We'll go easy on that one."); },
  uncook: el => { const e = S.plan[el.dataset.date][+el.dataset.idx]; e.cooked = false; save(); closeSheet(); render(); },
  swap: el => {
    const d = el.dataset.date, i = +el.dataset.idx, e = S.plan[d][i]; const old = R[e.rid];
    if (!e.leftover) { C.clearLeftovers(S, d, e.rid); if (old) C.markSkipped(S, e.rid, old); }
    const ctx = nightCtx(d); const opts = G.options(S, { serves: e.serves, stock: G.pantryStock(S), maxTime: ctx.maxTime, kids: ctx.kids, quick: ctx.quick, noise: 2 }, 3).filter(x => x.id !== e.rid && !(old && old.spec && x.spec.kit === old.spec.kit));
    const nw = opts[0] ? saveBuilt(opts[0]) : null;
    if (nw) { S.plan[d][i] = { rid: nw.id, serves: e.serves }; if (old && old.spec) G.learnSwap(S, 'kit', old.spec.kit, null); } else S.plan[d].splice(i, 1);
    save(); closeSheet(); render(); toast(nw ? `Swapped for ${nw.title}` : 'Removed');
  },
  freezeLeft: el => { const d = el.dataset.date, [e] = S.plan[d].splice(+el.dataset.idx, 1); const r = R[e.rid]; M.addFreezer(S, e.rid, r ? r.title : 'Leftovers', e.serves); const L = M.learn(S); L.leftFrozen = (L.leftFrozen || 0) + 1; save(); closeSheet(); render(); toast('In the freezer. It will show up on a busy night.'); },
  removeMeal: el => { const d = el.dataset.date, [e] = S.plan[d].splice(+el.dataset.idx, 1); if (e && !e.leftover) C.clearLeftovers(S, d, e.rid); save(); closeSheet(); render(); },
  recTab: el => { ui.recTab = el.dataset.val; ui.recQuery = ''; ui.recShow = 60; render(); },
  recMore: () => { ui.recShow = (ui.recShow || 60) + 60; const y = scrollY; render(); scrollTo(0, y); },
  createFrom: el => { ui.bDesc = el.dataset.val; ui.ideas = null; ui.builder = null; setTimeout(() => A.bIdeas(), 80); },
  libSync: () => syncLib(true),
  mdbCat: async el => { ui.onlineCat = el.dataset.val; ui.onlineLoading = true; ui.onlineErr = ''; render(); try { ui.online = await C.mdbByCategory(S, ui.onlineCat); } catch (e) { ui.onlineErr = e.message; ui.online = []; } ui.onlineLoading = false; render(); },
  mdbRandom: async () => { ui.onlineLoading = true; ui.onlineErr = ''; ui.onlineCat = null; render(); try { const rs = await Promise.all([1, 2, 3, 4, 5, 6].map(() => C.mdbRandom(S))); ui.online = rs.filter(Boolean).filter((r, i, a) => a.findIndex(x => x.id === r.id) === i); } catch (e) { ui.onlineErr = e.message; ui.online = []; } ui.onlineLoading = false; render(); },
  listWeek: el => { ui.listWeek = +el.dataset.val; render(); },
  shopFilter: el => { ui.shopFilter = el.dataset.val || null; render(); },
  toggleItem: el => { const k = el.dataset.key; if (S.list.checked[k]) delete S.list.checked[k]; else S.list.checked[k] = true; save(); el.classList.toggle('on'); el.setAttribute('aria-checked', !!S.list.checked[k]); const dn = document.querySelector('[data-act="doneShopping"]'); if (dn) dn.disabled = !Object.keys(S.list.checked).length; },
  itemMenu: (el, ev) => {
    ev.stopPropagation();
    const L = C.buildList(S, C.weekDates(ui.listWeek)); const r = L.rows.find(x => x.key === el.dataset.key); if (!r) return; ui.menuRow = r;
    openSheet(`<h2>${esc(r.name)}</h2><p class="small muted">${r.from.map(esc).join(', ')}</p>${r.priceSrc === 'est' ? `<p class="small">Price is an estimate. Scan a receipt to learn the real one${r.shop ? ' at ' + esc(r.shop) : ''}.</p>` : ''}
      ${!r.loose ? `<form class="row" data-form="fixPrice" style="align-items:flex-end"><label class="f grow">${r.priceSrc === 'est' ? 'Real price' : 'Price'} for ${esc(r.packs ? C.packLabel({ ...r, packs: 1 }) : 'one')} at ${esc(S.settings.defaultShop)} (€)<input id="fixPriceIn" type="number" inputmode="decimal" step="0.01" value="${r.packs ? (r.cost / r.packs).toFixed(2) : ''}"></label><button class="btn" type="submit" style="margin-bottom:2px">Save</button></form>` : ''}
      ${r.loose ? `<div class="row"><label class="f grow">Aisle<select id="ciAisle">${AISLES.map(a => `<option value="${a[0]}"${a[0] === r.aisle ? ' selected' : ''}>${a[1]}</option>`).join('')}</select></label><label class="f" style="width:110px">Price €<input id="ciPrice" type="number" inputmode="decimal" step="0.01" value="${r.cost != null ? r.cost : ''}"></label></div><button class="btn primary" data-act="saveCustom" style="margin:8px 0">Save for next time</button>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px"><button class="btn" data-act="haveIt">I already have this</button><button class="btn" data-act="cantGetList">Can't get it at ${esc(S.settings.defaultShop)}</button><button class="btn" data-act="hideItem">Remove from this list</button>${r.extra ? '<button class="btn" data-act="delExtra">Delete added item</button>' : ''}<button class="btn ghost" data-act="closeSheet">Cancel</button></div>`);
  },
  saveCustom: () => { const r = ui.menuRow; S.customInfo = S.customInfo || {}; const pr = $('#ciPrice').value; S.customInfo[r.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()] = { aisle: $('#ciAisle').value, price: pr === '' ? undefined : parseFloat(pr) }; save(); closeSheet(false, () => render()); toast('Saved'); },
  haveIt: () => { const r = ui.menuRow; if (r.item) C.addPantry(S, r.item, r.buy || r.qty, r.name); else S.list.hidden[r.key] = true; save(); closeSheet(); render(); toast('Added to your pantry'); },
  hideItem: () => { S.list.hidden[C.weekDates(ui.listWeek)[0] + ':' + ui.menuRow.key] = true; save(); closeSheet(); render(); },
  delExtra: () => { const r = ui.menuRow; S.list.extras = S.list.extras.filter(x => (x.item || 'x:' + x.name.toLowerCase()) !== r.key && x.item !== r.item); save(); closeSheet(); render(); },
  haveStaple: el => { const it = ITEM[el.dataset.key]; C.addPantry(S, it.id, it.packs[0], it.n); save(); render(); },
  stapleToList: () => { const L = C.buildList(S, C.weekDates(ui.listWeek)); for (const s of L.staples) S.list.extras.push({ item: s.item, name: s.name }); save(); render(); },
  listMore: () => { const dates = C.weekDates(ui.listWeek), done = Object.keys(S.list.checked).length; openSheet(`<h2>Shopping list</h2><div style="display:flex;flex-direction:column;gap:8px"><button class="btn" data-act="shareList">Send the list</button><button class="btn" data-act="smarter">Smarter list from your receipts</button>${C.buildList(S, dates).covered.length ? `<button class="btn" data-act="showCovered">Already in your pantry (${C.buildList(S, dates).covered.length})</button>` : ''}${done ? '<button class="btn" data-act="clearTicks">Untick everything</button>' : ''}${hiddenCount(dates) ? `<button class="btn" data-act="restoreList">Show ${hiddenCount(dates)} removed</button>` : ''}<button class="btn" data-act="clearList" style="color:var(--hot)">${ui.clearListArm ? 'Tap again to clear the list' : 'Clear the list'}</button></div><p class="tiny muted">Sending shares a text copy (WhatsApp, messages…). A live shared list needs an account server, which Mise doesn't use, so your data stays on your phone.</p>`); },
  showCovered: () => setSheet(`<h2>Already in your pantry</h2><p class="small">${C.buildList(S, C.weekDates(ui.listWeek)).covered.map(c => esc(c.name)).join(', ')}</p>`),
  addUsual: el => { const it = ITEM[el.dataset.key]; S.list.extras.push({ item: it.id, name: it.n, qty: it.packs[0] }); save(); render(); toast(`${it.n} added`); },
  pantryTab: el => { ui.pantryTab = el.dataset.val; render(); },
  rackOpen: () => { ui.rackDraft = null; openSheet(rackSheet()); },
  rackTog: el => { const id = el.dataset.val; ui.rackDraft[id] = !ui.rackDraft[id]; el.setAttribute('aria-pressed', !!ui.rackDraft[id]); },
  rackAll: () => { for (const [, ids] of C.RACK) for (const id of ids) ui.rackDraft[id] = true; setSheet(rackSheet()); },
  rackNone: () => { ui.rackDraft = {}; setSheet(rackSheet()); },
  rackDone: () => { S.rack = { set: true, have: Object.fromEntries(Object.entries(ui.rackDraft || {}).filter(([, v]) => v)) }; ui.rackDraft = null; ui.loIdeas = {}; save(); closeSheet(); render(); toast('Spice rack saved'); },
  gearOpen: () => openSheet(gearSheet()),
  gearTog: el => { const k = el.dataset.val, g = G.gearOf(S); g[k] = !g[k]; S.gear = g; save(); el.setAttribute('aria-pressed', !!g[k]); render(); },
  pFilter: el => { ui.pFilter = el.dataset.val; render(); },
  unlockOpen: () => { openSheet(unlockSheet(null)); setTimeout(() => { ui.unlock = G.unlockers(S, 6, { serves: S.settings.household || 2 }); setSheet(unlockSheet(ui.unlock)); }, 30); },
  unlockAdd: el => { const id = el.dataset.val; if (!S.list.extras.some(x => x.item === id)) S.list.extras.push({ item: id, name: ITEM[id].n, qty: ITEM[id].packs[0] }); save(); toast(ITEM[id].n + ' added to your list'); if (ui.unlock) setSheet(unlockSheet(ui.unlock)); },
  scanOpen: () => { openSheet(scanSheet()); scanStart(); },
  scanAdd: () => { const c = SC.cur; if (c && c.item) scanSave(c.item, c.qty || ITEM[c.item].packs[0]); },
  scanNext: () => { SC.cur = null; SC.busy = false; SC.last = null; const b = $('#scanRes'); if (b) b.innerHTML = ''; const m = $('#scanMsg'); if (m) m.textContent = 'Point the camera at a barcode.'; },
  freezerDel: el => { S.freezer = M.freezer(S).filter(f => f.id !== el.dataset.key); save(); render(); },
  togetherGo: () => { ui.make = { text: '', chips: ['have'], res: null }; makeRun(false); location.hash = 'builder'; },
  snapFridge: () => { if (S.settings.ai !== 'puter') { openSheet(`<h2>Snap your fridge</h2><p class="muted">This uses free AI (Puter) to spot what's in the photo and add it to your pantry. You sign in to a free Puter account once.</p><div class="row"><button class="btn grow" data-act="closeSheet">Not now</button><button class="btn primary grow" data-act="fridgeEnable">Turn on AI</button></div>`); return; } $('#fridgePhoto').click(); },
  fridgeEnable: () => { S.settings.ai = 'puter'; save(); closeSheet(false, () => { const f = $('#fridgePhoto'); if (f) f.click(); }); },
  fridgeAdd: () => { let n = 0; for (const [k, x] of (ui.fridge || []).entries()) { if (!$('#fr' + k) || !$('#fr' + k).checked) continue; const it = ITEM[x.item]; C.addPantry(S, x.item || null, it ? (x.unit === it.u ? x.qty : it.packs[0] * (x.qty || 1)) : x.qty, it ? it.n : x.name); n++; } save(); closeSheet(false, () => render()); toast(`Added ${n} thing${n !== 1 ? 's' : ''}`); },
  bMode: el => { ui.bMode = el.dataset.val; render(); },
  tgToggle: el => { const T = ui.together, k = el.dataset.key; T.sel = T.sel.includes(k) ? T.sel.filter(x => x !== k) : [...T.sel, k]; T.ideas = null; render(); },
  tgGo: () => { const T = ui.together; T.ideas = M.freestyle(S, T.sel, { n: 3 }); render(); setTimeout(() => { const c = $('.card.fs'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  tgShuffle: el => { const T = ui.together, k = +el.dataset.idx, cur = T.ideas[k]; const alt = M.freestyle(S, T.sel, { n: 12 }).filter(x => x.method === cur.method && x.kitId !== cur.kitId); for (let i = 0; i < 8 && !alt.length; i++) alt.push(...M.freestyle(S, T.sel, { n: 12 }).filter(x => x.method === cur.method && x.kitId !== cur.kitId)); if (alt.length) T.ideas[k] = alt[0]; else toast('That one only works one way with these'); render(); },
  tgTonight: el => { const x = ui.together.ideas[+el.dataset.idx]; const r = M.freestyleRecipe(S, x, M.servesFor(S, C.today())); S.recipes[r.id] = r; setTonight(r.id, r); toast('Tonight: ' + r.title); location.hash = 'plan'; },
  personAdd: () => personSheet({ id: 'p' + Date.now().toString(36), name: '', kid: false, likes: {}, diet: [] }),
  personEdit: el => personSheet(JSON.parse(JSON.stringify((S.people || []).find(p => p.id === el.dataset.key)))),
  pDiet: el => { const p = ui.person; p.name = $('#pName').value; p.kid = $('#pKid').checked; const k = el.dataset.val; p.diet = (p.diet || []).includes(k) ? p.diet.filter(x => x !== k) : [...(p.diet || []), k]; personSheet(p); },
  pSpice: el => { const p = ui.person; p.name = $('#pName').value; p.kid = $('#pKid').checked; p.spice = +el.dataset.val; personSheet(p); },
  pUnlike: el => { const p = ui.person; p.name = $('#pName').value; delete p.likes[el.dataset.key]; personSheet(p); },
  personSave: () => { const p = ui.person; p.name = $('#pName').value.trim() || 'Someone'; p.kid = $('#pKid').checked; S.people = S.people || []; const i = S.people.findIndex(x => x.id === p.id); if (i >= 0) S.people[i] = p; else S.people.push(p); S.settings.household = S.people.length + 1; save(); closeSheet(false, () => render()); toast(`${p.name} saved. Meals will suit everyone.`); },
  personDelete: () => { S.people = (S.people || []).filter(x => x.id !== ui.person.id); S.settings.household = Math.max(1, S.people.length + 1); save(); closeSheet(false, () => render()); },
  challengeSet: el => { S.challenge = el.dataset.val ? { kind: el.dataset.val, since: C.today() } : null; save(); render(); if (el.dataset.val) toast('Challenge on. Suggestions will help.'); },
  dealMeals: el => { const ideas = C.useUpIdeas(S, [{ item: el.dataset.key }], new Set(), 6); openSheet(`<h2>Meals with ${esc(ITEM[el.dataset.key].n.toLowerCase())}</h2><div class="card flat">${ideas.map(x => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left;border-top:1px solid var(--line)" data-act="openRecipe" data-key="${esc(x.r.id)}">${thumb(x.r)}<div class="grow"><div class="t">${esc(x.r.title)}</div><div class="small muted">${x.r.time} min</div></div></button>`).join('') || '<p class="small muted">No matches yet.</p>'}</div>`); },
  whoToggle: el => { const ctx = ui.sheetCtx, d = ctx.date, ids = M.eaters(S, d), k = el.dataset.key; S.whoEats = S.whoEats || {}; S.whoEats[d] = ids.includes(k) ? ids.filter(x => x !== k) : [...ids, k]; if (!S.whoEats[d].length) S.whoEats[d] = [k]; const e = S.plan[d][ctx.idx]; e.serves = ui.sheetServes = M.servesFor(S, d); save(); render(); renderRecipeSheet(); },
  shareRecipe: async () => { const r = ui.sheetRecipe, url = M.shareRecipeLink(r, location.href); try { if (navigator.share) { await navigator.share({ title: r.title, text: `${r.title}: open in Mise to save it`, url }); return; } await navigator.clipboard.writeText(url); toast('Link copied. Anyone with Mise can open it.'); } catch (e) { /* cancelled */ } },
  importKeep: () => { const r = ui.importing; if (!r) return; S.recipes[r.id] = r; refreshRecipes(); save(); ui.importing = null; closeSheet(false, () => openRecipe(r.id)); toast('Saved to your recipes'); },
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
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><button class="btn primary" data-act="pSave">Save</button><button class="btn" data-act="pUsed">Used it all</button><button class="btn" data-act="pBinned" style="color:var(--hot)">Binned it</button>${p.item && ITEM[p.item] ? `<a class="btn ghost" href="#ing/${p.item}" data-act="exploreIng" data-val="${p.item}">About ${esc(ITEM[p.item].n.toLowerCase())} ›</a>` : ''}</div><p class="tiny muted">"Binned it" helps Mise suggest smaller packs or meals that use things up.</p>`);
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
    (async () => { let res = []; try { if (q) res = await C.mdbSmartSearch(S, q).then(x => x.slice(0, 8)); if (!res.length && I.items[0]) res = await C.mdbByIngredient(S, ITEM[I.items[0]].n.replace(/s$/, '')); } catch (e) { res = []; } if (ui.ideas === I) { ui.ideasWeb = res.filter(r => r.stub || !C.ruledOut(S, r)); if (ui.route === 'builder') { const y = scrollY; render(); scrollTo(0, y); } } })();
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
    if (!ui.clearArm) { ui.clearArm = true; planMoreSheet(); setTimeout(() => { ui.clearArm = false; }, 3500); return; }
    ui.clearArm = false; ui.undoPlan = JSON.stringify(S.plan);
    for (const d of C.weekDates(ui.weekOffset)) delete S.plan[d];
    save(); closeSheet(false, () => render()); toast('Week cleared'); },
  clearList: () => {
    if (!ui.clearListArm) { ui.clearListArm = true; A.listMore(); setTimeout(() => { ui.clearListArm = false; }, 3500); return; }
    ui.clearListArm = false; const dates = C.weekDates(ui.listWeek); const L = C.buildList(S, dates);
    for (const r of L.rows) S.list.hidden[dates[0] + ':' + r.key] = true; for (const st of L.staples) S.list.hidden[st.key] = true;
    S.list.extras = []; S.list.checked = {}; save(); closeSheet(false, () => render()); toast('List cleared. Your meal plan is unchanged.'); },
  restoreList: () => { const ws = C.weekDates(ui.listWeek)[0]; for (const k of Object.keys(S.list.hidden)) if (k.startsWith(ws + ':') || k.startsWith('s:')) delete S.list.hidden[k]; save(); if (!$('#sheet').hidden) closeSheet(false, () => render()); else render(); },
  ingMenu: el => {
    const r = ui.sheetRecipe, i = r.ings[+el.dataset.idx], cur = S.likes[C.likeKey(i)] || 0; ui.ingSel = i;
    const pv = i.prep ? S.likes[C.prepKey(i)] : null, pn = i.prep ? C.PREP_NAMES[i.prep] : '', alt = C.prepAlt(i);
    setSheet(`<h2>${esc(i.name)}</h2>
      ${i.prep ? `<div class="small muted" style="font-weight:700">Just ${esc(pn)}, like in this recipe</div><div class="row"><button class="btn grow" style="${pv < 0 ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}" data-act="setLike" data-scope="prep" data-val="${pv < 0 ? 0 : -1}">Not ${esc(pn)}</button><button class="btn grow" style="${pv > 0 ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}" data-act="setLike" data-scope="prep" data-val="${pv > 0 ? 0 : 1}">Love it ${esc(pn)}</button></div>${alt ? `<p class="tiny muted" style="margin:0">Recipes adapt: ${esc(alt[1])}</p>` : ''}<div class="small muted" style="font-weight:700;margin-top:8px">${esc(i.name)} in general</div>` : '<p class="small muted">Used for suggestions and built meals, in every recipe with it.</p>'}
      <div style="display:flex;flex-direction:column;gap:8px">${[[1, 'Love it', 'More meals with this'], [0, 'No opinion', 'Treat it normally'], [-1, "Don't like it", 'Suggest it less and leave it out of built meals'], [-9, "Can't eat it", 'Allergy or diet: never suggest meals with it']].map(([v, n, d]) => `<button class="btn" style="justify-content:flex-start;text-align:left;min-height:56px;${cur === v ? 'border-color:var(--accent);background:var(--accent-soft)' : ''}" data-act="setLike" data-val="${v}"><div><b>${n}</b><div class="tiny muted" style="font-weight:500">${d}</div></div></button>`).join('')}
      <button class="btn" data-act="cantGet" style="margin-top:6px">${C.subOf(S, i) ? 'Change swap' : `Can't get it at ${esc(S.settings.defaultShop)}?`}</button>
      ${i.item && ITEM[i.item] ? `<a class="btn" href="#ing/${i.item}" data-act="exploreIng" data-val="${i.item}">Explore ${esc(ITEM[i.item].n.toLowerCase())}: pairings, prep, storage</a>` : ''}
      <button class="btn ghost" data-act="backToRecipe">Back to recipe</button></div>`);
  },
  exploreIng: el => { const id = el.dataset.val; closeSheet(false, () => { location.hash = 'ing/' + id; }); },
  goBack: () => { if (history.length > 1 && ui.prevRoute) history.back(); else location.hash = 'builder'; },
  ingMeals: el => { const id = el.dataset.val, B = ui.make || (ui.make = { text: '', chips: [], res: null }); B.text = ITEM[id].n; B.ask = null; B.chips = B.chips.filter(x => x !== 'exp'); location.hash = 'builder'; setTimeout(() => { makeRun(false); render(); }, 0); },
  ingPick: el => { location.hash = 'ing/' + el.dataset.val; },
  ingLab: el => { ui.lab = { sel: [el.dataset.val] }; location.hash = 'lab'; },
  cantGet: () => { ui.subFromList = false; cantGetSheet(); },
  cantGetList: () => { const r = ui.menuRow; ui.ingSel = { item: r.item, name: r.name, q: 1, u: '' }; ui.sheetRecipe = null; ui.subFromList = true; cantGetSheet(); },
  pickSub: el => {
    const i = ui.ingSel, k = C.subKey(i), shop = S.settings.defaultShop, v = el.dataset.val;
    S.subs = S.subs || {}; S.notAt = S.notAt || {}; S.notAt[shop] = S.notAt[shop] || {};
    if (v === 'clear') { delete S.subs[k]; delete S.notAt[shop][k]; } else { S.subs[k] = v; S.notAt[shop][k] = true; }
    save(); toast(v === 'clear' ? 'Swap removed' : v === 'skip' ? `Left out of every recipe` : `Using ${ITEM[v].n.toLowerCase()} instead, in every recipe`);
    if (ui.subFromList || !ui.sheetRecipe) closeSheet(false, () => render()); else { renderRecipeSheet(); render(); }
  },
  setLike: el => { const k = el.dataset.scope === 'prep' ? C.prepKey(ui.ingSel) : C.likeKey(ui.ingSel), v = +el.dataset.val; if (v) S.likes[k] = v; else delete S.likes[k]; save(); renderRecipeSheet(); render(); if (el.dataset.scope === 'prep') { toast(v === 0 ? 'Cleared' : v > 0 ? `Noted: you love it ${C.PREP_NAMES[ui.ingSel.prep]}` : `Noted: not ${C.PREP_NAMES[ui.ingSel.prep]}. ${C.prepAlt(ui.ingSel) ? 'Recipes will adapt.' : "We'll suggest these less."}`); return; } toast(v === 0 ? 'Cleared' : v > 0 ? 'Noted: you love it' : v <= -9 ? "Noted: never suggest it" : "Noted: you don't like it"); },
  backToRecipe: () => renderRecipeSheet(),
  removeLike: el => { delete S.likes[el.dataset.key]; save(); render(); },
  removePhoto: () => { delete S.photos[ui.sheetRecipe.id]; save(); renderRecipeSheet(); render(); },
  quizDiet: el => { const k = el.dataset.val, d = S.settings.diet || []; S.settings.diet = d.includes(k) ? d.filter(x => x !== k) : [...d, k]; if (k === 'vegan' && S.settings.diet.includes('vegan') && !S.settings.diet.includes('vegetarian')) { /* vegan covers it */ } save(); render(); },
  quizStart: () => { ui.quiz.stage = 'basics'; render(true); },
  quizVote: el => quizVote(+el.dataset.val),
  quizBack: () => { const q = ui.quiz; if (!q.i) return; q.i--; const x = q.deck[q.i]; if (q.stage === 'dishes') { C.voteDish(S, x, 0); delete q.votes['d:' + x.id]; } else { delete q.votes[x]; delete S.likes[x]; } save(); render(); bindQuizSwipe(); },
  quizFinish: () => { ui.quiz.i = ui.quiz.deck.length; render(); bindQuizSwipe(); },
  quizClose: () => { const first = ui.quiz && ui.quiz.first; S.settings.quizDone = true; save(); ui.quiz = null; location.hash = 'plan';
    const clash = C.weekDates(0).concat(C.weekDates(1)).flatMap(d => (S.plan[d] || []).filter(e => !e.cooked && R[e.rid] && C.ruledOut(S, R[e.rid])).map(e => R[e.rid].title));
    if (clash.length) setTimeout(() => openSheet(`<h2>Swap ${clash.length} planned meal${clash.length > 1 ? 's' : ''}?</h2><p class="muted">${esc(clash.join(', '))} use${clash.length > 1 ? '' : 's'} things you said no to.</p><div class="row"><button class="btn grow" data-act="closeSheet">Keep</button><button class="btn primary grow" data-act="swapAvoided">Swap them</button></div>`), 250);
    else if (first && !S.settings.tourSeen) setTimeout(askTour, 250); },
  setTaste: el => { S.taste = S.taste || {}; const k = el.dataset.key, v = +el.dataset.val; S.taste[k] = k === 'maxTime' && !v ? null : v; save(); const y = scrollY; render(); scrollTo(0, y); },
  triTaste: el => { S.taste = S.taste || {}; const [g, k] = el.dataset.key.split(/:(.*)/); const o = S.taste[g] = S.taste[g] || {}; const v = o[k] || 0; if (v === 0) o[k] = 1; else if (v > 0) o[k] = -1; else delete o[k]; save(); const y = scrollY; render(); scrollTo(0, y); },
  trainDishes: () => { ui.quiz = { stage: 'dishes', only: true, deck: C.dishDeck(S, 20), i: 0, votes: {} }; if (!ui.quiz.deck.length) { toast('You\'ve swiped everything! Download the library in Settings for more.'); ui.quiz = null; return; } location.hash = 'quiz'; },
  trainIngs: () => { const blocked = C.dietBlocks(S); ui.quiz = { stage: 'swipe', only: true, deck: C.TASTE_DECK.filter(id => ITEM[id] && !blocked.has(id)), i: 0, votes: {} }; location.hash = 'quiz'; },
  quizRestart: () => { ui.quiz = { stage: 'diet' }; location.hash = 'quiz'; },
  quizBasics: () => { ui.quiz.stage = 'cuisines'; render(true); },
  quizCuisines: () => { const blocked = C.dietBlocks(S); Object.assign(ui.quiz, { deck: C.TASTE_DECK.filter(id => ITEM[id] && !blocked.has(id)), i: 0, votes: {}, stage: 'swipe' }); render(true); },
  discVote: el => discVote(+el.dataset.val),
  discOpen: () => { const r = ui.disc.deck[ui.disc.i]; if (!r) return; if (String(r.id).startsWith('g:')) { ui.sheetCtx = null; openSheet(''); ui.sheetRecipe = r; ui.sheetServes = S.settings.household || 2; renderRecipeSheet(); } else openRecipe(r.id); },
  discUndo: () => { const D = ui.disc; if (!D.i) return; D.i--; const r = D.deck[D.i]; if ((S.dishVotes || {})[r.id] > 0) D.likes--; D.n--; C.voteDish(S, r, 0); delete S.dishVotes[r.id]; save(); render(); bindQuizSwipe(); },
  skipAns: el => { M.applySkip(S, el.dataset.date, +el.dataset.idx, el.dataset.val); save(); render(); toast({ cooked: 'Nice. Logged it.', tired: 'Got it. Easier nights coming.', fancy: "Noted. We'll suggest it less.", out: 'Got it.' }[el.dataset.val]); },
  habitYes: el => { const h = M.habits(S).find(x => x.id === el.dataset.key); if (h && h.act) { M.rhythm(S)[h.act[1]].mode = h.act[0]; M.syncNights(S); } (S.dismissed = S.dismissed || {})[el.dataset.key] = 1; save(); render(); toast('Done. Change it any time in Settings.'); },
  habitNo: el => { (S.dismissed = S.dismissed || {})[el.dataset.key] = 1; save(); render(); },
  mood: () => moodSheet(),
  moodGoDirect: el => { openSheet(''); A.moodGo(el); },
  moodGo: el => {
    const m = el.dataset.val;
    if (m === 'takeaway') { const t = C.today(), es = (S.plan[t] || []).filter(e => !e.cooked); S.plan[t] = (S.plan[t] || []).filter(e => e.cooked); let moved = null; for (const d of C.weekDates(0).filter(d => d > t)) if (!(S.plan[d] || []).length && M.cooksOn(S, d) && es.length) { S.plan[d] = es; moved = d; break; } save(); closeSheet(false, () => render()); toast(moved ? `Enjoy! Moved tonight's dinner to ${fmtDay(moved)}.` : 'Enjoy your takeaway!'); return; }
    const opts = moodOptions(m); ui.moodOpts = opts;
    setSheet(`<h2>${esc(MOODS.find(x => x[0] === m)[1])}</h2><div class="card flat">${opts.map(r => `<button class="meal" style="width:100%;border:0;background:none;cursor:pointer;color:inherit;text-align:left;border-top:1px solid var(--line)" data-act="moodTake" data-key="${esc(r.id)}">${thumb(r)}<div class="grow"><div class="t">${esc(r.title)}</div><div class="small muted">${timeLabel(r)}${C.whyRecipe(S, r).filter(w => w[0] > 0)[0] ? ' · ' + esc(C.whyRecipe(S, r).filter(w => w[0] > 0)[0][1]) : ''}</div></div></button>`).join('')}</div><div class="row"><button class="btn grow" data-act="moodGo" data-val="${m}">Show others</button><button class="btn grow" data-act="mood">Back</button></div>`);
  },
  moodTake: el => { const r = (ui.moodOpts || []).find(x => x.id === el.dataset.key) || R[el.dataset.key]; saveBuilt(r); setTonight(r.id, r); closeSheet(false, () => render()); toast(`Tonight: ${r.title}`); },
  freezerPick: () => { const fz = M.freezer(S); setSheetOrOpen(`<h2>From the freezer</h2><div class="card flat">${fz.map(f => `<button class="pi" style="width:100%;border:0;background:none;text-align:left;cursor:pointer;color:inherit" data-act="freezerUse" data-key="${f.id}"><div class="grow"><b>${esc(f.title)}</b><div class="tiny muted">${f.portions} portion${f.portions > 1 ? 's' : ''} · frozen ${M.freezerAge(f)} days ago${M.freezerAge(f) > 90 ? ' · eat soon' : ''}</div></div><span class="small muted">Tonight ›</span></button>`).join('')}</div>`); },
  freezerUse: el => { const f = M.freezer(S).find(x => x.id === el.dataset.key); if (!f) return; const t = C.today(), sv = Math.min(f.portions, M.servesFor(S, t)); M.takeFreezer(S, f.id, sv); S.plan[t] = (S.plan[t] || []).filter(e => e.cooked); S.plan[t].push({ rid: f.rid, serves: sv, fromFreezer: f.id }); save(); closeSheet(false, () => render()); toast(`Tonight: ${f.title} from the freezer`); },
  planWeek: () => { location.hash = 'week'; },
  planMore: () => planMoreSheet(),
  goRhythm: () => { ui.scrollTo = 'sRhythm'; closeSheet(false, () => { location.hash = 'settings'; }); },
  wcPace: el => { const W = S.weekCheck[M.weekKey(C.weekDates(ui.weekOffset)[0])]; W.pace = el.dataset.val; save(); weekCheckSheetKeep(); },
  wcGuest: el => { const W = S.weekCheck[M.weekKey(C.weekDates(ui.weekOffset)[0])], d = el.dataset.date; W.guests[d] = ((W.guests[d] || 0) + 1) % 5; if (!W.guests[d]) delete W.guests[d]; save(); weekCheckSheetKeep(); },
  wcAway: el => { const W = S.weekCheck[M.weekKey(C.weekDates(ui.weekOffset)[0])], k = el.dataset.key; W.away = W.away.includes(k) ? W.away.filter(x => x !== k) : [...W.away, k]; save(); weekCheckSheetKeep(); },
  prepPlan: () => { const p = M.prepPlan(S, C.weekDates(ui.weekOffset)); setSheet(`<h2>Prep plan</h2>${p.length ? `<p class="small muted">Do these on a quiet evening and weeknights get a lot easier.</p><ol class="steps">${p.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p class="muted">Nothing worth prepping ahead this week. Each meal is quick enough on the night.</p>'}`); },
  shareWeek: async () => { const text = M.planText(S, C.weekDates(ui.weekOffset)); try { if (navigator.share) { await navigator.share({ title: 'Our dinners', text }); return; } await navigator.clipboard.writeText(text); toast('Copied. Paste it anywhere.'); } catch (e) { /* cancelled */ } },
  cookMode: el => { const d = el.dataset.date, i = +el.dataset.idx, e = (S.plan[d] || [])[i]; if (!e) return; closeSheet(false); cookModeOpen(R[e.rid], e.serves, { date: d, idx: i }); },
  convertTo: el => { const r = ui.sheetRecipe, res = convertRecipe(r, el.dataset.val); if (res.blocked) { toast(res.blocked); return; } if (res.none) { toast('Nothing to change: it already fits.'); return; } ui.sheetServes = ui.sheetServes || r.serves; S.recipes[res.recipe.id] = res.recipe; refreshRecipes(); save(); ui.sheetRecipe = res.recipe; ui.sheetCtx = null; renderRecipeSheet(); const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; },
  addMissing: () => { const r = ui.sheetRecipe; let n = 0; for (const i of r.ings) { const it = i.item && ITEM[i.item]; if (!it || it.staple || C.pantryQty(S, it.id) > 0 || C.subOf(S, i) || S.list.extras.some(x => x.item === it.id)) continue; S.list.extras.push({ item: it.id, name: it.n, qty: it.packs[0] }); n++; } save(); updateBadge(); toast(n ? `${n} added to your list` : 'Already on your list'); },
  cookFromSheet: () => { const r = ui.sheetRecipe, ctx = ui.sheetCtx; closeSheet(false, () => cookModeOpen(r, ui.sheetServes || r.serves, ctx)); },
  cookClose: () => cookModeClose(),
  cookNext: () => { const k = ui.cook; if (k && k.step < k.r.steps.length) { k.step++; renderCook(); } },
  cookPrev: () => { const k = ui.cook; if (k && k.step > -1) { k.step--; renderCook(); } },
  cookTap: (el, ev) => { if (ev.target.closest('button')) return; const x = ev.clientX / innerWidth; if (x > 0.35) A.cookNext(); else A.cookPrev(); },
  cookTimer: el => { const k = ui.cook; const sec = +el.dataset.sec; k.timers.push({ label: el.dataset.label, end: Date.now() + sec * 1000, left: sec }); renderCook(); toast('Timer started'); },
  cookTimerX: el => { ui.cook.timers.splice(+el.dataset.idx, 1); renderCook(); },
  cookVoice: () => cookVoice(),
  cookFinish: () => { const k = ui.cook; cookModeClose(); setTimeout(() => { if (k.ctx && S.plan[k.ctx.date] && S.plan[k.ctx.date][k.ctx.idx]) A.cook({ dataset: { date: k.ctx.date, idx: k.ctx.idx } }); else { M.logCook(S, k.r, k.serves); C.markCooked(S, k.r.id, k.r, C.today()); save(); reactionSheet(k.r, null, C.today()); } }, 80); },
  reactPick: el => { ui.react.v = el.dataset.val; renderReaction(); },
  reactChip: el => { const k = ui.react, c = el.dataset.val; k.chips = k.chips.includes(c) ? k.chips.filter(x => x !== c) : [...k.chips, c]; renderReaction(); },
  reactSkip: () => closeSheet(),
  reactSave: () => { const k = ui.react; const fz = $('#reactFreeze'); if (fz && fz.checked && k.spare > 0) { M.addFreezer(S, k.r.id, k.r.title, k.spare); if (k.e) k.e.serves -= 0; }
    M.applyReaction(S, k.r, k.v, k.chips); if (k.r.spec) { if (G.learnReaction(S, k.r.spec, k.v) && S.recipes[k.r.id] && !S.recipes[k.r.id].regular) { S.recipes[k.r.id].regular = true; refreshRecipes(); setTimeout(() => toast('Loved it twice, so it\'s now one of your regulars'), 1800); } } save(); closeSheet(); render(); toast(k.v === 'love' ? "Noted. It'll come round again." : k.v === 'never' ? "Got it. You won't see it again." : 'Thanks, noted.'); },
  bkAddId: id => { const wk = M.weekKey(C.weekDates(ui.weekOffset)[0]); const bk = S.baskets[wk]; const ex = bk.find(b => b.item === id); if (ex) ex.packs++; else bk.push({ item: id, packs: 1 }); save(); const y = scrollY; render(); scrollTo(0, y); },
  bkQuick: el => A.bkAddId(el.dataset.key),
  bkPacks: el => { const wk = M.weekKey(C.weekDates(ui.weekOffset)[0]); const bk = S.baskets[wk], i = +el.dataset.idx; bk[i].packs += +el.dataset.val; if (bk[i].packs <= 0) bk.splice(i, 1); save(); const y = scrollY; render(); scrollTo(0, y); },
  wkPace: el => { S.weekCheck[M.weekKey(C.weekDates(ui.weekOffset)[0])].pace = el.dataset.val; save(); const y = scrollY; render(); scrollTo(0, y); },
  wkPriority: el => { S.settings.priority = el.dataset.val; save(); const y = scrollY; render(); scrollTo(0, y); },
  wkGuest: el => { const W = S.weekCheck[M.weekKey(C.weekDates(ui.weekOffset)[0])], d = el.dataset.date; W.guests[d] = ((W.guests[d] || 0) + 1) % 5; if (!W.guests[d]) delete W.guests[d]; save(); const y = scrollY; render(); scrollTo(0, y); },
  wkAway: el => { const W = S.weekCheck[M.weekKey(C.weekDates(ui.weekOffset)[0])], k = el.dataset.key; W.away = W.away.includes(k) ? W.away.filter(x => x !== k) : [...W.away, k]; save(); const y = scrollY; render(); scrollTo(0, y); },
  buildWeek: el => buildWeekNow(el.dataset.val === 'auto'),
  swapPart: el => {
    const r = ui.sheetRecipe, part = el.dataset.val; ui.swapPartName = part;
    const alts = G.alternatives(S, r.spec, part, { stock: G.pantryStock(S) }).map(sp => G.buildMeal(S, sp, r.serves)).filter((x, i, a) => x.id !== r.id && a.findIndex(y => y.id === x.id) === i).slice(0, 5); ui.swapAlts = alts;
    setSheet(`<h2>Swap the ${({ main: 'main', kit: 'flavour', base: 'base', veg: 'veg', method: 'way it\'s cooked' })[part]}</h2><div class="card flat">${alts.map((x, i) => `<button class="pi" style="width:100%;border:0;background:none;text-align:left;cursor:pointer;color:inherit" data-act="swapPick" data-idx="${i}"><div class="grow"><b>${esc(x.title)}</b><div class="tiny muted">≈ ${C.effort(x).total} min all in · ${esc(x.ings.filter(i2 => i2.u !== 'taste' && !(ITEM[i2.item] || {}).staple).slice(0, 5).map(i2 => i2.name).join(', '))}</div></div><span class="small muted">›</span></button>`).join('') || '<p class="small muted">Nothing else fits with the rest of this meal.</p>'}</div><button class="btn block" data-act="backToRecipe">Back</button>`);
  },
  swapPick: el => {
    const old = ui.sheetRecipe, nw = saveBuilt(ui.swapAlts[+el.dataset.idx]), part = ui.swapPartName, ctx = ui.sheetCtx;
    G.learnSwap(S, part, part === 'veg' ? old.spec.veg : old.spec[part], part === 'veg' ? nw.spec.veg : nw.spec[part]);
    if (ctx && S.plan[ctx.date] && S.plan[ctx.date][ctx.idx]) { const e = S.plan[ctx.date][ctx.idx]; for (const x of Object.values(S.plan)) for (const y of x) if (y.leftover === ctx.date && y.rid === e.rid) y.rid = nw.id; e.rid = nw.id; }
    save(); render(); ui.sheetServes = null; openRecipe(nw.id, ctx); toast('Swapped. Mise will remember you prefer that.');
  },
  makeRegular: () => { const r = ui.sheetRecipe; if (!S.recipes[r.id]) S.recipes[r.id] = r; S.recipes[r.id].regular = !S.recipes[r.id].regular; refreshRecipes(); save(); ui.sheetRecipe = R[r.id]; renderRecipeSheet(); toast(S.recipes[r.id].regular ? 'Added to your regulars' : 'Removed from regulars'); },
  askOpen: () => { const g = G.gearOf(S); ui.ask = ui.ask || { step: 0, sel: [], gear: Object.fromEntries(GEAR.map(([k]) => [k, !!g[k]])), time: S.settings.weeknightMax && new Date().getDay() % 6 ? 45 : 0, mood: 'any' }; ui.ask.step = 0; openSheet(askSheet()); },
  askTog: el => { const id = el.dataset.val, A = ui.ask; A.sel = A.sel.includes(id) ? A.sel.filter(x => x !== id) : [...A.sel, id]; el.setAttribute('aria-pressed', A.sel.includes(id)); const nb = $('#sheetBody [data-act=askNext]'); if (nb) nb.textContent = A.sel.length ? `Next (${A.sel.length})` : 'Next'; },
  askSkip: () => { ui.ask.sel = []; ui.ask.step = 1; setSheet(askSheet()); },
  askNext: () => { ui.ask.step++; setSheet(askSheet()); },
  askBack: () => { ui.ask.step = Math.max(0, ui.ask.step - 1); setSheet(askSheet()); },
  askGear: el => { const k = el.dataset.val; ui.ask.gear[k] = !ui.ask.gear[k]; el.setAttribute('aria-pressed', !!ui.ask.gear[k]); },
  askTime: el => { ui.ask.time = +el.dataset.val; setSheet(askSheet()); },
  askMood: el => { ui.ask.mood = el.dataset.val; setSheet(askSheet()); },
  askGo: () => { const A = ui.ask; ui.make = ui.make || { text: '', chips: [], res: null }; const t = ASK_TIMES.find(x => x[0] === A.time);
    ui.make.ask = { ...A, sel: A.sel.slice(), gear: { ...A.gear }, sum: [A.sel.length ? A.sel.slice(0, 4).map(id => ITEM[id].n.toLowerCase()).join(', ') + (A.sel.length > 4 ? ` +${A.sel.length - 4}` : '') : 'anything', t ? t[1] : '', A.mood !== 'any' ? ASK_MOODS.find(m => m[0] === A.mood)[1].toLowerCase() : ''].filter(Boolean).join(' · ') };
    askRun(false); closeSheet(false, () => { if (location.hash !== '#builder') location.hash = 'builder'; else render(); setTimeout(() => { const c = $('.card.fs'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); }); },
  jpOpen: el => openRecipeObj(ui.make.jpR[+el.dataset.idx]),
  jpPlan: el => { const J = (ui.make.jp || []).find(x => x.id === el.dataset.val); if (!J) return; const lead = J.first.find(r => r.leftover) || J.first[0]; let d = C.today(); const dates = [];
    for (let i = 0; i < 14 && dates.length < 1 + Math.min(3, J.then.length); i++) { const dd = C.addDays(d, i); if (!(S.plan[dd] || []).length) dates.push(dd); }
    if (!dates.length) { toast('No free nights in the next two weeks.'); return; }
    const all = [lead, ...J.then.slice(0, dates.length - 1)]; dates.forEach((dd, i) => { saveBuilt(all[i]); S.plan[dd] = [{ rid: all[i].id, serves: i ? 2 : all[i].serves }]; }); save(); toast(`Planned: ${all[0].title} then ${all.length - 1} leftover night${all.length > 2 ? 's' : ''}.`); location.hash = 'plan'; },
  makeWild: el => { ui.make.wild = +el.dataset.val; render(); },
  labPick: el => { const L = ui.lab || (ui.lab = { sel: [] }); const id = el.dataset.val; if (L.sel.includes(id)) L.why = id; else if (L.sel.length < 5) { L.sel.push(id); L.why = null; } render(); },
  labDrop: el => { ui.lab.sel = ui.lab.sel.filter(x => x !== el.dataset.val); render(); },
  labDish: () => { const L = ui.lab; const r = F.experiment(S, { hero: L.sel[0], with: L.sel.slice(1), stock: G.pantryStock(S), serves: M.servesFor(S, C.today()), wild: 2 }); if (!r) { toast("Couldn't build that one."); return; } ui.make = ui.make || { text: '', chips: [], res: null }; openRecipeObj(r); },
  labRate: el => { const r = ui.sheetRecipe; if (!r || !r.exp) return; const v = +el.dataset.val; S.lab = S.lab || { pairs: {}, notes: {} }; S.lab.notes = S.lab.notes || {}; const prev = S.lab.notes[r.id]; if (prev && prev.v != null) F.rateExperiment(S, r, -prev.v); S.lab.notes[r.id] = { ...(prev || {}), v, date: C.today() }; F.rateExperiment(S, r, v); S.recipes[r.id] = r; refreshRecipes(); save(); renderRecipeSheet(); toast(v > 0 ? "Noted. Mise will try more like this." : v < 0 ? "Noted. Mise will steer away from that combo." : 'Noted.'); },
  labNoteSave: () => { const r = ui.sheetRecipe; if (!r || !r.exp) return; S.lab = S.lab || { pairs: {}, notes: {} }; S.lab.notes = S.lab.notes || {}; S.lab.notes[r.id] = { ...(S.lab.notes[r.id] || {}), note: ($('#labNote') || {}).value || '', date: C.today() }; S.recipes[r.id] = r; refreshRecipes(); save(); toast('Saved to your notebook'); },
  makeChip: el => { const B = ui.make, k = el.dataset.val, tx = $('#makeText'); if (tx) B.text = tx.value; B.chips = B.chips.includes(k) ? B.chips.filter(x => x !== k) : [...B.chips, k]; render(); },
  makeMore: () => { const y = scrollY; if (ui.make.ask) askRun(true); else makeRun(false, true); render(); scrollTo(0, y); },
  makeGo: () => { const t = $('#makeText'); if (t) ui.make.text = t.value; ui.make.ask = null; ui.make.qa = null;
    const q = (ui.make.text || '').trim();
    if (q && AQ.isQuestion(q)) { let a = null; try { a = AQ.answer(S, q); } catch (e) { console.warn(e); }
      ui.make.qa = { q, a }; ui.make.res = null;
      if (a && a.make) { ui.make.text = ITEM[a.make].n; makeRun(false); }
      render(); setTimeout(() => { const c = $('.qa'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); return; }
    makeRun(false); render(); setTimeout(() => { const c = $('.card.fs'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  makeSurprise: () => { ui.make.ask = null; ui.make.text = ''; ui.make.chips = ui.make.chips.filter(x => x === 'have'); makeRun(true); render(); },
  makeOpen: el => openRecipeObj(ui.make.res[+el.dataset.idx]),
  discoOpen: el => { const D = ui.disco, l = el.dataset.key === 'res' ? D.res : D.rows[el.dataset.key]; openRecipeObj(l[+el.dataset.idx]); },
  discoF: el => { const F = ui.discoF, k = el.dataset.key; if (k === 'veg' || k === 'have') F[k] = !F[k]; else F[k] = +el.dataset.val; if (ui.disco && ui.disco.q) discoSearch(ui.disco.q); render(); },
  discoClear: () => { ui.disco.res = null; ui.disco.q = ''; render(); },
  makeClear: () => { Object.assign(ui.make, { res: null, text: '', ask: null, qa: null }); render(true); },
  qaAI: async () => { const Q = ui.make.qa; if (!Q) return; if (S.settings.ai === 'off' || !S.settings.ai) { location.hash = 'settings'; toast('Turn on an AI option in Settings first.'); return; } Q.busy = true; render();
    try { Q.ai = await C.aiAsk(S.settings.ai, `You are a friendly, expert home-cooking assistant for someone in Ireland who cooks weeknight dinners. Answer in under 120 words, practical and specific, metric units and °C. Question: ${Q.q}`); } catch (e) { Q.ai = null; toast(e.message || 'AI is not available right now.'); }
    Q.busy = false; render(); },
  useFirst: el => { const B = ui.make; B.text = ITEM[el.dataset.val].n; B.ask = null; if (!B.chips.includes('have')) B.chips.push('have'); makeRun(false); render(); setTimeout(() => { const c = $('.card.fs'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); },
  homeOpen: el => openRecipeObj(ui.home.list[+el.dataset.idx].r),
  homeTonight: el => { const r = saveBuilt(ui.home.list[+el.dataset.idx].r); setTonight(r.id, r); toast('Tonight: ' + r.title); ui.home.list = null; location.hash = 'plan'; },
  homeMore: () => { homeSuggestions(true); render(); },
  makeTonight: el => { const r = saveBuilt(ui.make.res[+el.dataset.idx]); setTonight(r.id, r); toast('Tonight: ' + r.title); location.hash = 'plan'; },
  discMake: () => { const r = ui.disc.deck[ui.disc.i]; if (!r) return; const p = G.guessParts(r); const res = G.options(S, { want: { kit: p.kit || undefined, main: p.main && G.MAINS[p.main] ? p.main : undefined, method: p.method || undefined }, serves: M.servesFor(S, C.today()), stock: G.pantryStock(S) }, 3); ui.make = { text: '', chips: [], res };
    openSheet(`<h2>Your way</h2><p class="small muted">Built from what you like about ${esc(r.title)}, using things you can get easily.</p><div class="card flat">${res.map((x, k) => `<button class="pi" style="width:100%;border:0;background:none;text-align:left;cursor:pointer;color:inherit" data-act="makeOpen" data-idx="${k}"><div class="grow"><b>${esc(x.title)}</b><div class="tiny muted">≈ ${C.effort(x).total} min all in</div></div><span class="small muted">›</span></button>`).join('')}</div>`); },
  pickBuilt: el => { const r = saveBuilt(ui.pickOpts[+el.dataset.idx]); ui.sheetServes = null; addToPlan(r.id, ui.pickDate, r); closeSheet(); render(); toast('Added to ' + fmtDay(ui.pickDate)); },
  pickMore: () => { ui.pickOpts = null; renderPicker(); },
  likeOpen: el => { const d = ui.dym[el.dataset.key], u = d.list[+el.dataset.idx]; ui.like = { key: el.dataset.key, idx: +el.dataset.idx, text: u.text.replace(/^[\d.,]+\s*(kg|g|ml|l|x)?\s+/i, '').trim() || u.text }; openSheet(likeSheet()); },
  likePick: el => { const L = ui.like, d = ui.dym[L.key], u = d && d.list[L.idx]; const wid = C.learnLike(S, L.text, el.dataset.val); if (!wid || !u) { closeSheet(); return; } d.onAdd(wid, u.text); d.list.splice(L.idx, 1); if (!d.list.length) ui.dym[L.key] = null; save(); closeSheet(); toast(`Added ${ITEM[wid].n}. Mise will cook it like ${ITEM[el.dataset.val].n.toLowerCase()}.`); render(); },
  dymPick: el => { const d = ui.dym[el.dataset.key], i = +el.dataset.idx, u = d.list[i]; d.onAdd(el.dataset.val || null, u.text); d.list.splice(i, 1); if (!d.list.length) ui.dym[el.dataset.key] = null; save(); const y = scrollY; render(); scrollTo(0, y); toast(`Added ${el.dataset.val ? ITEM[el.dataset.val].n : u.text}`); },
  dymClose: el => { ui.dym[el.dataset.key] = null; render(); },
  newRecipe: () => { ui.editDraft = null; if (location.hash !== '#add') location.hash = 'add'; else render(true); },
  editRecipe: el => {
    const r = R[el.dataset.key]; if (!r) return; const copy = String(r.id).startsWith('b:');
    ui.editDraft = { id: copy ? null : r.id, title: r.title + (copy ? ' (mine)' : ''), serves: r.serves, time: r.time, ing: r.ings.map(i => (i.u === 'taste' ? '' : fmtIng(i.q, i.u) + ' ') + i.name).join('\n'), steps: r.steps.join('\n'), img: S.photos[r.id] || r.img || null, batch: C.isBatch(S, r) };
    closeSheet(false, () => { location.hash = 'add'; });
  },
  arLink: () => openSheet(`<h2>Import from a link</h2><p class="small muted">Paste a link to any recipe page (BBC Good Food, Allrecipes, blogs…).</p><input id="arUrl" type="url" placeholder="https://…" style="margin-bottom:10px"><button class="btn primary block" data-act="arLinkGo">Import</button><p class="tiny muted">For TikTok or Instagram, copy the caption and use "Paste text" instead.</p>`),
  arLinkGo: async () => { const u = $('#arUrl').value.trim(); if (!/^https?:\/\//.test(u)) { toast('Paste a full link starting with https://'); return; } setSheet('<div class="empty"><span class="spinner"></span><p>Reading the page…</p></div>');
    try { const r = await M.importFromURL(u); fillDraftFrom(r); closeSheet(false, () => { render(); toast('Imported. Check it over, then save.'); }); }
    catch (e) { setSheet(`<h2>Couldn't import that</h2><p class="muted">${e.blocked ? 'This website blocks being read from a web page. It works in the Android app. Or open the page, copy the recipe and use "Paste text".' : esc(e.message)}</p><button class="btn block" data-act="arPaste">Paste text instead</button>`); } },
  arPaste: () => openSheet(`<h2>Paste a recipe</h2><p class="small muted">From a website, message or note. Mise splits it into ingredients and steps.</p><textarea id="arPasteText" style="min-height:240px"></textarea><div class="row" style="margin-top:10px"><button class="btn grow" data-act="closeSheet">Cancel</button><button class="btn primary grow" data-act="arPasteGo">Use it</button></div>`),
  arPasteGo: () => { const p = C.splitRecipeText($('#arPasteText').value); const e = ui.editDraft; if (p.title && !e.title) e.title = p.title; if (p.serves) e.serves = p.serves; if (p.time) e.time = p.time; e.ing = p.ings.map(i => i.raw).join('\n'); e.steps = p.steps.join('\n'); closeSheet(false, () => { render(); toast(`${p.ings.length} ingredients, ${p.steps.length} steps`); }); },
  arSave: () => {
    const e = readAddForm(); if (!e.title) { toast('Give it a name'); return; } if (!e.ing.trim()) { toast('Add at least one ingredient'); return; }
    const r = C.makeOwnRecipe({ id: e.id, title: e.title, serves: e.serves, time: e.time, ingText: e.ing, stepText: e.steps, batch: e.batch }); if (S.batchPref) delete S.batchPref[r.id];
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
  themeAuto: el => { S.settings.theme = el.checked ? 'auto' : (darkMQ.matches ? 'dark' : 'light'); applyTheme(); save(); render(); },
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
  arCookbook: async el => { const f = el.files && el.files[0]; if (!f) return; openSheet('<div class="empty"><span class="spinner"></span><p id="ocrMsg">Reading the page…</p></div>');
    try { if (!self.Tesseract) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; sc.onload = res; sc.onerror = () => rej(new Error('Could not load the text reader. Are you online?')); document.head.appendChild(sc); });
      const { data } = await self.Tesseract.recognize(f, 'eng', { logger: m => { const x = $('#ocrMsg'); if (x && m.status === 'recognizing text') x.textContent = `Reading the page… ${Math.round(m.progress * 100)}%`; } });
      const p = C.splitRecipeText(data.text); const e = ui.editDraft; if (p.title && !e.title) e.title = p.title; if (p.serves) e.serves = p.serves; e.ing = p.ings.map(i => i.raw).join('\n'); e.steps = p.steps.join('\n'); closeSheet(false, () => { render(); toast(`Found ${p.ings.length} ingredients and ${p.steps.length} steps. Check them over.`); }); }
    catch (err) { setSheet(`<h2>Couldn't read that photo</h2><p class="muted">${esc(err.message || '')}</p>`); } },
  arPhoto: async el => { const f = el.files && el.files[0]; if (!f) return; readAddForm(); ui.editDraft.img = await shrinkImage(f); render(); },
  fridgePhoto: async el => { const f = el.files && el.files[0]; if (!f) return; openSheet('<div class="empty"><span class="spinner"></span><p>Looking in your fridge…</p></div>'); try { const img = await shrinkImage(f, 1100); const items = await M.aiFridge(S.settings.ai, img); ui.fridge = items; setSheet(`<h2>Found ${items.length} thing${items.length !== 1 ? 's' : ''}</h2><div class="card flat">${items.map((x, k) => `<label class="pi"><input type="checkbox" id="fr${k}" checked style="width:22px;height:22px"><div class="grow"><b>${esc(x.item ? ITEM[x.item].n : x.name)}</b><div class="tiny muted">${esc(String(x.qty))} ${esc(x.unit)}</div></div></label>`).join('')}</div><button class="btn primary block" data-act="fridgeAdd">Add to pantry</button>`); } catch (e) { setSheet(`<h2>Couldn't read that</h2><p class="muted">${esc(e.message || 'AI error')}</p>`); } },
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
    if (ui.route === 'swipe' && ui.disc) want.unshift(...ui.disc.deck.slice(ui.disc.i, ui.disc.i + 4).map(r => r.id).filter(id => R[id]));
    for (const id of [...new Set(want)].slice(0, 30)) { const r = R[id]; if (!r || r.src === 'built' || r.src === 'freestyle' || C.photoOf(S, r) || S.autoImg[id] !== undefined) continue; S.autoImg[id] = await C.autoImageFor(S, r); if (S.autoImg[id]) changed = true; }
  } catch (e) { /* offline or blocked */ }
  autoBusy = false; if (changed) { save(); if (!ui.tour && ['plan', 'recipes', 'swipe'].includes(ui.route)) render(); }
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
  if (ev.key === 'Enter' && ev.target.id === 'makeText') { ev.preventDefault(); A.makeGo(); }
  if (ev.key === 'Enter' && ev.target.id === 'recSearch' && ui.recTab === 'online') { ev.preventDefault(); onlineSearch(ev.target.value); }
});
async function onlineSearch(q) { if (!q.trim()) return; ui.onlineSearched = true; ui.onlineLoading = true; ui.onlineErr = ''; ui.onlineCat = null; render(); try { ui.online = await C.mdbSmartSearch(S, q.trim()); const local = C.searchRecipes(S, q.trim(), { includeAll: true, limit: 30 }).filter(r => r.lib && !ui.online.some(o => o.id === r.id)); ui.online = ui.online.concat(local); } catch (e) { ui.onlineErr = e.message; ui.online = []; } ui.onlineLoading = false; render(); }
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
  if (el.dataset.act2) { const k = el.dataset.act2, i = +el.dataset.idx;
    if (k === 'rhythmMode') { M.rhythm(S)[i].mode = el.value; if (['takeaway', 'off'].includes(el.value)) M.rhythm(S)[i].theme = null; M.syncNights(S); }
    if (k === 'rhythmTheme') M.rhythm(S)[i].theme = el.value || null;
    if (k === 'healthToggle') S.settings.health = el.checked;
    if (k === 'moreVeg') { S.taste = S.taste || {}; S.taste.moreVeg = el.checked; }
    save(); const y = scrollY; render(); scrollTo(0, y); }
  if (el.dataset.setting && (el.tagName === 'SELECT' || el.type === 'range')) { const k = el.dataset.setting; S.settings[k] = el.type === 'range' || k === 'weeknightMax' ? +el.value : el.value; if (k === 'defaultShop' && !S.settings.shops.includes(el.value)) S.settings.shops.push(el.value); save(); render(); if (k === 'defaultShop') toast(`Planning for ${el.value}`); }
  if (el.dataset.bspec) { const k = el.dataset.bspec; ui.builderSpec[k] = k === 'serves' ? Math.max(1, +el.value || 1) : (el.value || undefined); }
});
document.addEventListener('submit', ev => {
  const f = ev.target.dataset.form; if (!f) return; ev.preventDefault();
  if (f === 'likeSearch') { ui.like.q = (($('#likeQ') || {}).value || '').trim(); setSheet(likeSheet()); return; }
  if (f === 'discoSearch') { const v = (($('#discoQ') || {}).value || '').trim(); if (v) { discoSearch(v); render(); } return; }
  if (f === 'addExtra') { addTyped('extra', '#extraName', (id, txt) => S.list.extras.push({ item: id, name: id ? ITEM[id].n : txt }), true); return; }
  if (f === 'askAdd') { const v = (($('#askName') || {}).value || '').trim(); if (!v) return; const id = C.matchIngredient(v); if (!id) { toast(`Couldn't match ${v}.`); return; } if (!ui.ask.sel.includes(id)) ui.ask.sel.push(id); setSheet(askSheet()); return; }
  if (f === 'labAdd') { const v = (($('#labName') || {}).value || '').trim(); if (!v) return; const id = C.matchIngredient(v); if (!id || !F.aroma(id)) { toast(`Mise doesn't know the flavours of ${v} yet.`); return; } ui.lab = ui.lab || { sel: [] }; if (!ui.lab.sel.includes(id)) ui.lab.sel.unshift(id); render(); return; }
  if (f === 'scanCode') { const v = ($('#scanCode') || {}).value || ''; if (v.trim()) { SC.last = null; scanFound(v.trim()); } return; }
  if (f === 'scanFix') { const v = (($('#scanFix') || {}).value || '').trim(); if (!v) return; const id = C.matchIngredient(v); const c = SC.cur; if (!c) return; if (id) scanSave(id, c.item === id && c.qty ? c.qty : ITEM[id].packs[0]); else { C.addPantry(S, null, 1, v); save(); toast('Added ' + v); SC.cur = null; SC.busy = false; $('#scanRes').innerHTML = ''; } return; }
  if (f === 'addPantry') { addTyped('pantry', '#pantryName', (id, txt) => C.addPantry(S, id, id ? ITEM[id].packs[0] : 1, id ? ITEM[id].n : txt), true); return; }
  if (f === 'fixPrice') { const r = ui.menuRow, v = parseFloat($('#fixPriceIn').value); if (!(v > 0)) return; S.prices.push({ item: r.item, shop: S.settings.defaultShop, price: v, qty: r.size || ITEM[r.item].packs[0], date: C.today(), src: 'manual' }); save(); closeSheet(false, () => render()); toast('Price saved. Mise will use it from now on.'); return; }
  if (f === 'bkAdd') { addTyped('bk', '#bkName', id => { if (!id) return; const wk = M.weekKey(C.weekDates(ui.weekOffset)[0]); const bk = S.baskets[wk]; const ex = bk.find(b => b.item === id); if (ex) ex.packs++; else bk.push({ item: id, packs: 1 }); }, false); return; }
  if (f === 'tgAdd') { const v = $('#tgName').value.trim(); const id = v && itemByName(v); if (!id) { toast("Mise doesn't know that one"); return; } const T = ui.together; if (!T.sel.includes(id)) T.sel.push(id); T.ideas = null; render(); return; }
  if (f === 'pLike') { const v = $('#pLikeName').value.trim(); if (!v) return; const id = itemByName(v), p = ui.person; p.name = $('#pName').value; p.likes = p.likes || {}; p.likes[id || 'x:' + v.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim()] = -1; personSheet(p); return; }
  if (f === 'addLike') { const v = $('#likeName').value.trim(); if (!v) return; const id = itemByName(v), pr = $('#likePrep') ? $('#likePrep').value : ''; S.likes[(id || 'x:' + v.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim()) + (pr ? ':' + pr : '')] = +$('#likeVal').value; save(); render(); toast('Saved'); }
  if (f === 'addDeal') { const name = $('#dealItem').value.trim(); const id = itemByName(name); S.deals.push({ id: 'd' + Date.now().toString(36), item: id, name: id ? ITEM[id].n : name, shop: $('#dealShop').value, price: parseFloat($('#dealPrice').value) || 0, until: $('#dealUntil').value }); save(); render(); toast('Deal saved'); }
});
/* ---- Typed ingredient matching: exact, aliases, then typo-tolerant ---- */
const nrm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const sing1 = w => w.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/(?<![su])s$/, '');
function lev(a, b) { if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length; let prev = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[b.length]; }
const sim = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length);
let NAMES = null;
function nameIndex() { if (NAMES) return NAMES; NAMES = []; for (const i of CATALOG) { if (i.id.startsWith('other-')) continue; const names = [i.n, ...(i.al || i.aliases || [])]; for (const n of names) { const k = nrm(n); if (k) NAMES.push([k, i.id, k.split(' ').map(sing1).join(' ')]); } } return NAMES; }
function findItems(text) {
  const v = nrm(text), vs = v.split(' ').map(sing1).join(' '); if (!v) return { id: null, conf: 0, alts: [] };
  const sc = {};
  const put = (id, x) => { if (!sc[id] || sc[id] < x) sc[id] = x; };
  for (const [k, id, ks] of nameIndex()) {
    if (k === v || ks === vs) put(id, 1);
    else if (ks.startsWith(vs + ' ') || ks.endsWith(' ' + vs)) put(id, 0.82);
    else if (ks.startsWith(vs) && vs.length >= 3) put(id, 0.72);
    else if (vs.length >= 3 && (' ' + ks + ' ').includes(' ' + vs + ' ')) put(id, 0.7);
    else if (vs.length >= 4) { const a = sim(vs, ks); if (a >= 0.7) put(id, a * 0.92); else { const best = Math.max(...ks.split(' ').map(w => vs.split(' ').map(x => x.length >= 4 && w.length >= 4 ? sim(x, w) : 0)).flat()); if (best >= 0.8) put(id, best * 0.7); } }
  }
  const m = C.matchIngredient(text); if (m) put(m, Math.max(sc[m] || 0, 0.86));
  const ranked = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { id: null, conf: 0, alts: [] };
  const [id, conf] = ranked[0], gap = ranked[1] ? conf - ranked[1][1] : 1;
  const sure = conf >= 0.95 || (conf >= 0.8 && gap >= 0.05) || (conf >= 0.72 && gap >= 0.12) || (conf >= 0.65 && ranked.length === 1);
  return { id, conf: sure ? Math.max(conf, 0.8) : Math.min(conf, 0.6), alts: ranked.filter(x => x[1] >= ranked[0][1] - 0.25).slice(0, 4).map(x => x[0]) };
}
function itemByName(v) { const f = findItems(v); return f.conf >= 0.8 ? f.id : (f.alts[0] && f.conf >= 0.6 ? f.alts[0] : null); }
// Add one or many typed items ("chicken thighs, peppers and rice"). Unsure ones get a "Did you mean" row under the box.
const splitItems = t => String(t || '').split(/\s*(?:,|;|\n|\band\b|\+)\s*/i).map(x => x.trim()).filter(Boolean);
function addTyped(formKey, inputSel, onAdd, allowLoose) {
  const el = $(inputSel); if (!el) return; const parts = splitItems(el.value); if (!parts.length) return;
  const unsure = [], added = [];
  for (const p of parts) { const f = findItems(p); if (f.conf >= 0.8) { onAdd(f.id, p); added.push(ITEM[f.id].n); } else unsure.push({ text: p, alts: f.alts }); }
  ui.dym = ui.dym || {}; ui.dym[formKey] = unsure.length ? { list: unsure, allowLoose, onAdd } : null;
  save(); const y = scrollY; render(); scrollTo(0, y);
  if (added.length) toast(`Added ${added.join(', ')}`);
  const again = $(inputSel); if (again && !unsure.length) { again.value = ''; again.focus(); }
}
function dymBox(formKey) {
  const d = (ui.dym || {})[formKey]; if (!d) return '';
  return `<div class="dym">${d.list.map((u, i) => `<div class="small"><b>"${esc(u.text)}"</b>${u.alts.length ? ' – did you mean:' : ' – Mise doesn\'t know that one.'}</div><div class="chips wrap">${u.alts.map(id => `<button class="chip" data-act="dymPick" data-key="${formKey}" data-idx="${i}" data-val="${id}">${esc(ITEM[id].n)}</button>`).join('')}<button class="chip" data-act="likeOpen" data-key="${formKey}" data-idx="${i}">It's like…</button>${d.allowLoose ? `<button class="chip" data-act="dymPick" data-key="${formKey}" data-idx="${i}" data-val="">Add "${esc(u.text)}" as typed</button>` : ''}</div>`).join('')}<button class="linkbtn tiny" data-act="dymClose" data-key="${formKey}">Dismiss</button></div>`;
}

/* "It's like…": teach Mise an ingredient it doesn't know. It keeps your name and cooks it like the one you pick */
const LIKE_GROUPS = [['Meat', 'chicken-thigh chicken-breast pork-chop pork-roast beef-mince steak beef-brisket lamb sausages bacon'], ['Fish', 'white-fish salmon mackerel prawns tuna'], ['Veg', 'cabbage spinach kale courgette aubergine carrot potato sweet-potato onion pepper mushroom cauliflower broccoli green-beans peas'], ['Other', 'kidney-beans lentils chickpeas tofu halloumi cheddar mozzarella rice pasta noodles couscous nuts lemon chilli ginger soy-sauce curry-paste']];
function likeSheet() {
  const L = ui.like, alts = L.q ? findItems(L.q).alts.slice(0, 8) : [];
  return `<h2>What is “${esc(L.text)}” most like?</h2><p class="small muted">Mise will cook it like the one you pick and keep calling it ${esc(L.text)}.</p>
  <form class="ask-in" data-form="likeSearch"><input id="likeQ" placeholder="Search: cabbage, white fish, beans…" autocomplete="off" value="${esc(L.q || '')}" aria-label="Search ingredients"><button class="go" type="submit" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button></form>
  ${alts.length ? `<div class="chips wrap" style="margin-top:10px">${alts.map(id => `<button class="chip" data-act="likePick" data-val="${id}">${esc(ITEM[id].n)}</button>`).join('')}</div>` : L.q ? '<p class="small muted">Nothing found. Try a broader word, like "fish" or "beans".</p>' : ''}
  ${LIKE_GROUPS.map(([g, ids]) => `<div class="small" style="font-weight:700;margin:12px 0 6px">${g}</div><div class="chips wrap">${ids.split(' ').filter(id => ITEM[id]).map(id => `<button class="chip" data-act="likePick" data-val="${id}">${esc(ITEM[id].n)}</button>`).join('')}</div>`).join('')}`;
}

/* ================= Onboarding, theme, boot ================= */
function onboarding() {
  openSheet(`<h2>Welcome to Mise</h2><p class="muted">Plan dinners, get a smart shopping list, and learn what you actually buy. Three quick questions.</p>
    <label class="f">How many people do you cook for?<div class="stepper" style="align-self:flex-start"><button data-act="onbNum" data-key="household" data-val="-1">−</button><span>${S.settings.household}</span><button data-act="onbNum" data-key="household" data-val="1">+</button></div></label>
    <div class="small muted" style="font-weight:600;margin-top:12px">Where do you shop?</div><div class="chips wrap" style="margin-top:6px">${SHOPS.slice(0, 7).map(s => `<button class="chip" data-act="onbShop" data-val="${s}" aria-pressed="${S.settings.shops.includes(s)}">${s}</button>`).join('')}</div>
    <label class="f" style="margin-top:12px">Weekly food budget (€, optional)<input type="number" inputmode="decimal" data-setting="budget" value="${S.settings.budget || ''}"></label>
    <button class="btn primary block" style="margin-top:16px" data-act="onbDone">Start planning</button>`);
}
const THEMES = [['light', 'Light', ['#f7f3ec', '#1f4d3a', '#a8b89a']], ['dark', 'Dark', ['#121814', '#8cc4a0', '#2c3630']], ['sage', 'Sage', ['#f1f4ee', '#4a6646', '#93a98a']], ['terracotta', 'Terracotta', ['#faf1ea', '#9e4429', '#c9a58e']], ['ocean', 'Ocean', ['#eff3f5', '#1f5673', '#8fb0bf']], ['plum', 'Plum', ['#f5f0f3', '#6b2f57', '#b99aae']]];
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  let t = S.settings.theme || 'light'; if (!THEMES.some(x => x[0] === t) && t !== 'auto') t = 'light';
  try { localStorage.setItem('mise-theme', JSON.stringify(t)); } catch (e) { /* private mode */ }
  if (t === 'auto') t = darkMQ.matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f7f3ec');
}
darkMQ.addEventListener && darkMQ.addEventListener('change', () => { if (S && S.settings && S.settings.theme === 'auto') applyTheme(); });

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
  for (const p of G.planWeek(S, dates.slice(0, 4), G.suggestBasket(S, 2), { planForMe: true, night: d => nightCtx(d) }).picks) { if (p.leftover) continue; saveBuilt(p.recipe); (S.plan[p.date] = S.plan[p.date] || []).push({ rid: p.recipe.id, serves: p.serves }); }
  render();
}
async function openFirstMealSheet() {
  ensureMeals();
  const d = C.weekDates(0).find(x => (S.plan[x] || []).length);
  await openRecipe(S.plan[d][0].rid, { date: d, idx: 0 });
}
const TOUR = [
  { route: 'plan', title: 'Welcome to Mise', text: 'A quick look at everything. Tap Next, or Skip to leave. You can restart it from the menu (☰) any time.' },
  { route: 'plan', scopeDoc: true, sel: '.tabbar', title: 'Getting around', text: 'Home is where you ask what to cook. Discover finds new dishes, Plan is your week, then your shopping List and Pantry.' },
  { route: 'plan', scopeDoc: true, sel: '#menuBtn', title: 'Menu', text: 'Saved meals, Your tastes, Stats, Receipts, Deals, Settings and this tour live here.' },
  { route: 'plan', sel: '[data-tour=tonight]', title: 'Tonight', text: 'Tonight\'s dinner, front and centre. "Start cooking" opens step-by-step cook mode with timers. "Change" lets you pick by mood: comfort food, something light, quick, or use what\'s in the fridge.' },
  { route: 'plan', sel: '[data-tour=weeknav]', title: 'Your week', text: 'Arrows move between weeks. Underneath: what the shopping should cost and where you\'re shopping.' },
  { route: 'plan', sel: '.day2', before: ensureMeals, title: 'Each night', text: 'Tap a dinner to open it, or the tick when it\'s cooked. Leftover nights and freezer meals cost nothing. (We added a few examples for the tour.)' },
  { route: 'plan', sel: '[data-tour=suggest]', title: 'Plan my week', text: 'This is the main way to plan. Tell Mise what you\'re buying (say chicken thighs, mince and peppers) and it builds the week around it, adding only what\'s missing. Or tap "Plan it for me".' },
  { route: 'week', sel: '[data-tour=basket]', title: 'What you\'re getting', text: 'Add the main things you\'re buying, with how many packs. What\'s already in your kitchen and freezer counts too.' },
  { route: 'week', sel: '[data-tour=priority]', title: 'Save or vary', text: '"Save most" reuses your shop across the week with the fewest extras. "More variety" changes flavours and dishes every night. "Balanced" sits in between.' },
  { route: 'week', sel: '[data-tour=buildWeek]', title: 'Build it', text: 'Mise fills each night to fit: your weeknight time limit, gym or easy nights, guests, kids, and leftovers from bigger cooks. Anything you buy that no meal uses still goes on the list.' },
  { route: 'plan', sel: '[data-tour=planMore]', title: 'More', text: 'Prep plan for the week, share it, change shop, set up quick or gym nights, or clear the week.' },
  { route: 'plan', sheet: true, before: openFirstMealSheet, sel: '[data-tour=servings]', title: 'Recipe details', text: 'Tapping a dinner opens this sheet. Use − and + to change servings; the ingredient amounts and your shopping list update to match. The price is an estimate for the whole meal.' },
  { sheet: true, sel: '[data-tour=swapParts]', title: 'Swap any part', text: 'Meals are built from parts: a main, a flavour, a base, veg and a way of cooking. Swap any one and the meal rebuilds itself. Mise learns from what you swap.' },
  { sheet: true, sel: '[data-tour=sheetActions]', title: 'Cooked, swap or remove', text: '"I cooked this" marks it done and asks how it was. Loved it twice? It becomes one of your regulars. "Swap" builds something different for that night.' },
  { sheet: true, sel: '[data-tour=ings]', title: 'Love it or hate it', text: 'Tap any ingredient to mark it "Love it", "Don\'t like it" or "Can\'t eat it". Mise then suggests those meals more, less or never, and leaves disliked items out of meals it builds. You can review them all in Settings.' },
  { sheet: true, sel: '[data-tour=rating]', title: 'Rate it', text: 'Tap the stars any time. Your ratings and Discover swipes shape the flavours, mains and dishes Mise builds for you.' },
  { sheet: true, sel: 'label[for=recipePhoto]', title: 'Add a photo', text: 'Tap "Add your photo" to use a picture you took of your own dish. Recipes without a photo try to find one online automatically.' },
  { sheet: true, sel: '.sheet-x', title: 'Closing a sheet', text: 'Close any sheet by swiping it down, tapping the ✕, tapping the dark area above it, or pressing your phone\'s back button.' },
  { route: 'recipes', sel: '[data-tour=recTabs]', title: 'Saved meals', text: 'Regulars are built meals you loved. Yours are recipes you added. Easy is oven and freezer meals. Recent is what Mise built lately.' },
  { route: 'recipes', sel: '[data-tour=buildCta]', title: 'Ask Home', text: 'Say what you fancy on Home and Mise builds options around your tastes and what you have.' },
  { route: 'recipes', sel: '[data-tour=discoverCta]', title: 'Discover', text: 'Collections of meals built from your kitchen, with filters for time and price. "Teach Mise your taste" lets you swipe dishes so suggestions learn what you like.' },
  { route: 'recipes', sel: '[data-tour=addRecipe]', title: 'Add your own', text: 'Type in a family favourite or paste a recipe from any website. Ingredients Mise doesn\'t know are kept as you wrote them and go on your list.' },
  { route: 'recipes', sel: '#recSearch', title: 'Search', text: 'Search your meals by name or ingredient.' },
  { route: 'list', sel: '[data-tour=listWeek]', title: 'Shopping list', text: 'Your list is built automatically from the dinners in your plan. Switch between this week and next week here.' },
  { route: 'list', sel: '[data-tour=listTotal]', title: 'What it should cost', text: 'The estimated total against your budget. Each price is tagged: "est." is a rough guess, "yours" comes from your own receipts, "deal" from a deal you saved. Scan receipts and the estimates turn into real prices.' },
  { route: 'list', sel: '[data-tour=addExtra]', title: 'Add anything', text: 'Type anything else you need (milk, bin bags, snacks) and tap Add. Mise recognises common items and prices them too.' },
  { route: 'list', sel: '.li', title: 'Tick as you shop', text: 'Items are grouped by shop and sorted in the order of a typical store, starting with fruit and veg. Each line says how much you need and which pack to buy. Tap a row to tick it into your basket.' },
  { route: 'list', sel: '.li .icon-btn', title: 'Item options', text: 'Tap ⋯ to say "I already have this" (it moves to your pantry and drops off the list) or to remove it from this week\'s list.' },
  { route: 'list', sel: '[data-tour=staples]', title: 'Cupboard basics', text: 'Oil, salt, spices and stock aren\'t added every week. Tap the ones you have, or add the rest to the list in one go.' },
  { route: 'list', sel: '[data-tour=done]', title: 'Done shopping', text: 'When you\'re home, tap this: everything you ticked moves into your pantry with an estimated use-by date.' },
  { route: 'list', sel: '[data-tour=share]', title: 'More list options', text: 'Send the list (WhatsApp, text), get a smarter list from your receipts, see what you already have, or clear it.' },
  { route: 'pantry', sel: '[data-tour=make]', title: 'What can I make?', text: 'Pick what you have and Mise gives you a rough way to cook it. No recipe needed.' },
  { route: 'pantry', sel: '[data-tour=snap]', title: 'Snap your fridge', text: 'Take a photo and the optional free AI adds what it sees to your pantry.' },
  { route: 'pantry', sel: '[data-tour=scan]', title: 'Scan barcodes', text: 'Scan packets to add them. Mise looks them up for free and remembers anything you correct.' },
  { route: 'pantry', sel: '[data-tour=rack]', title: 'Spice rack', text: 'Tick the spices and sauces you have once. Mise cooks with those and lists anything else a meal needs.' },
  { route: 'pantry', sel: '[data-tour=pantryTabs]', title: 'Freezer', text: 'Frozen leftovers and spare portions live in the Freezer tab. Mise slots them into busy nights as free dinners.' },
  { route: 'pantry', sel: '[data-tour=addPantry]', title: 'Your pantry', text: 'Add things you have here. Receipts and "Done shopping" fill it automatically. Tap any item to change the amount or date, mark it used, or mark it binned (which helps Mise suggest smaller packs).' },
  { route: 'receipts', sel: '[data-tour=receiptAdd]', title: 'Scan a receipt', text: 'Pick the shop and date, then "Take a photo" of a paper receipt, "Choose screenshot" (a Lidl Plus digital receipt screenshot works best) or paste the text. The reading happens on your phone.' },
  { route: 'receipts', before: () => { ui.receiptDraft = null; render(); startDraft(SAMPLE_RECEIPT); }, sel: '[data-tour=receiptDraft]', title: 'Check the items', text: 'Mise guesses what each line is, even shop shorthand like "CHKN THIGH FLT". Fix any wrong ones with the dropdown and it remembers next time. Untick lines that aren\'t food, correct prices, then Save. (This is a sample, nothing is saved.)' },
  { route: 'receipts', sheet: true, before: () => { const d = ui.receiptDraft; ui.receiptDraft = null; render(); const lines = d ? d.lines.map(l => ({ text: l.text, item: l.item, price: l.price, qty: l.qty })) : []; const rec = { id: 'tour', shop: 'Lidl', date: C.today(), total: d && d.total || 18.92, lines }; showReview(rec); }, sel: '.roast', title: 'Your shop, reviewed', text: 'After each receipt you get an honest (and funny) review, tips to save money or waste less, and a button to build a smarter list for next week. Choose Gentle, Cheeky or Savage in Settings.' },
  { route: 'builder', sel: '[data-tour=bDesc]', title: 'Make a meal', text: 'Say what you fancy in your own words: "chicken and rice", "something creamy", "salmon, no mushrooms". The chips add quick, healthy, cheap, spicy or veggie, or "Use what I have".' },
  { route: 'builder', before: () => { ui._tourMake = ui.make; ui.make = { text: 'chicken and rice', chips: [], res: null }; makeRun(false); }, sel: '.card.fs', title: 'Three options', text: 'Each one is built for you: your flavours, rough amounts, a loose method and the all-in time. Tap one to see it or pick a day, or "Tonight" to cook it now.', after: () => { ui.make = ui._tourMake || null; } },
  { route: 'deals', sel: '[data-tour=deal]', title: 'Deals', text: 'Save offers you spot with a price and end date. Your list uses the deal price and suggestions favour meals that use it.' },
  { route: 'insights', sel: '[data-tour=stats]', title: 'Stats', text: 'Meals cooked, money saved against takeaways, your streak, and leftovers eaten. Pick a weekly challenge below and suggestions help you hit it.' },
  { route: 'settings', sel: '[data-tour=sHouse]', title: 'Household', text: 'Add the people you cook for, with their own dislikes and diets. Kids get kid-friendly meals. Each dinner lets you pick who\'s eating.' },
  { route: 'settings', sel: '[data-tour=sRhythm]', title: 'Your week', text: 'Tell Mise what each night is like: quick nights, gym nights (high protein), proper cooks, takeaway nights, or themes like Taco Tuesday.' },
  { route: 'settings', sel: '[data-tour=sHealth]', title: 'Health (optional)', text: 'Turn on rough calories and protein, and nudge suggestions towards more veg.' },
  { route: 'settings', sel: '[data-tour=sShops]', title: 'Shops', text: 'Tick where you shop and pick your main shop. Once you have your own prices, each list item goes to the shop where it was cheapest.' },
  { route: 'settings', sel: '[data-tour=sPersona]', title: 'Receipt reviews', text: 'Choose how harsh the receipt roasts are.' },
  { route: 'settings', sel: '[data-tour=sTastes]', title: 'Your tastes', text: 'Everything Mise knows about what you like lives on its own page. It\'s also in the menu.' },
  { route: 'tastes', sel: '[data-tour=tBasics]', title: 'The basics', text: 'Spice level, how long you\'ll cook on a weeknight and whether you\'re eating healthier. Suggestions follow these.' },
  { route: 'tastes', sel: '[data-tour=tTypes]', title: 'Kinds of dinner & flavours', text: 'Tap once to love, twice for no. Curries, pasta, pies, stir-fries, smoky, creamy, cheesy and more.' },
  { route: 'tastes', sel: '[data-tour=sTastesList]', title: 'Ingredients, done your way', text: 'Mark ingredients you love, don\'t like or can\'t eat. You can be specific: "Potatoes, only mashed" keeps potatoes in and swaps the mash out of recipes.' },
  { route: 'tastes', sel: '[data-tour=sLearned]', title: 'What Mise has learned', text: 'A summary of what it has picked up from your swipes, ratings, cooking and receipts. Each recipe also shows why it was suggested.' },
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
  if (location.hash !== '#builder') location.hash = 'builder'; else render(true);
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
  if (q.stage === 'basics') {
    const T = S.taste || {};
    const seg = (key, opts) => `<div class="seg">${opts.map(([v, n]) => `<button data-act="setTaste" data-key="${key}" data-val="${v}" aria-pressed="${String(T[key] ?? '') === String(v)}">${n}</button>`).join('')}</div>`;
    return `<div class="card"><h2>Quick ones</h2>
      <div class="small muted" style="font-weight:600">How spicy?</div>${seg('spice', [[0, 'None'], [1, 'Mild'], [2, 'Medium'], [3, 'Hot']])}
      <div class="small muted" style="font-weight:600">Weeknight cooking time</div>${seg('maxTime', [[20, '20 min'], [30, '30'], [45, '45'], [0, 'Any']])}
      <div class="small muted" style="font-weight:600">Eating healthier?</div>${seg('health', [[0, 'Not fussed'], [1, 'A bit'], [2, 'Yes']])}
      <div class="small muted" style="font-weight:600">Favourite kinds of dinner</div><div class="chips wrap">${Object.entries(C.TYPE_NAMES).map(([k, n]) => tri((T.types || {})[k], n, 'triTaste', 'types:' + k)).join('')}</div>
      <button class="btn primary block" data-act="quizBasics">Next</button></div>`;
  }
  if (q.stage === 'cuisines') {
    const T = S.taste || {};
    return `<div class="card"><h2>Cuisines</h2><p class="small muted" style="margin:0">Tap once to love, twice for no. Leave the rest.</p><div class="chips wrap">${usedCuisines().map(c => tri((T.cuisines || {})[c], c, 'triTaste', 'cuisines:' + c)).join('')}</div>
      <button class="btn primary block" data-act="quizCuisines">Next: ingredients</button></div>`;
  }
  if (q.stage === 'dishes') {
    const deck = q.deck, i = q.i;
    if (i >= deck.length) return quizDone();
    const r = deck[i], img = C.photoOf(S, r);
    return `<div class="quiz"><div class="row between small muted"><span>Dish ${i + 1} of ${deck.length}</span><button class="btn ghost sm" data-act="quizFinish">Finish</button></div><div class="tour-dots"><i style="width:${i / deck.length * 100}%"></i></div>
      <div class="qstack"><div class="qcard" id="qcard"><div class="qimg dish">${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : ''}<span>${esc(r.title[0])}</span></div><h2>${esc(r.title)}</h2><p class="small muted">${esc([r.area, r.time + ' min'].filter(Boolean).join(' · '))}</p><div class="qhint left">NOPE</div><div class="qhint right">YUM</div></div></div>
      <p class="small muted" style="text-align:center;margin:0">Would you eat this? Right = yes · left = no</p>
      <div class="qbtns"><button class="qb no" data-act="quizVote" data-val="-1" aria-label="No">${ICON.x}</button><button class="qb meh" data-act="quizVote" data-val="0" aria-label="Not sure">Not sure</button><button class="qb yes" data-act="quizVote" data-val="1" aria-label="Yes"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>
      ${i ? '<button class="btn ghost sm" data-act="quizBack" style="align-self:center">Undo last</button>' : ''}</div>`;
  }
  if (q.stage === 'swipe') {
    const deck = q.deck, i = q.i;
    if (i >= deck.length) { if (!q.only && !q.didDishes) { q.didDishes = true; Object.assign(q, { stage: 'dishes', deck: C.dishDeck(S, 16), i: 0, votes: Object.assign({}, q.votes) }); if (q.deck.length) return viewQuiz(); } return quizDone(); }
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
  return `<div class="card" style="text-align:center"><h2>Got it</h2><p class="muted">${v.filter(x => x > 0).length} yes · ${v.filter(x => x < 0 && x > -9).length} no${v.some(x => x <= -9) ? ` · ${v.filter(x => x <= -9).length} can't eat` : ''}</p>
    <div class="row"><a class="btn grow" href="#tastes">See your tastes</a><button class="btn primary grow" data-act="quizClose">${q.first ? 'Continue' : 'Done'}</button></div></div>`;
}
function bindQuizSwipe() {
  const card = $('#qcard'); if (!card) return; let x0 = null, dx = 0;
  card.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
  card.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; card.classList.toggle('yes', dx > 40); card.classList.toggle('no', dx < -40); });
  const vote = v => ui.route === 'swipe' ? discVote(v) : quizVote(v);
  const up = () => { if (x0 == null) return; x0 = null; card.style.transition = 'transform .2s ease'; if (ui.route === 'swipe' && Math.abs(dx) < 6) { card.style.transform = ''; A.discOpen(); return; } if (Math.abs(dx) > 90) { card.style.transform = `translateX(${dx > 0 ? 600 : -600}px) rotate(${dx > 0 ? 25 : -25}deg)`; setTimeout(() => vote(dx > 0 ? 1 : -1), 160); } else { card.style.transform = ''; card.classList.remove('yes', 'no'); } };
  card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
}
function quizVote(v) { const q = ui.quiz; const x = q.deck[q.i]; if (q.stage === 'dishes') { q.votes['d:' + x.id] = v; C.voteDish(S, x, v); } else { q.votes[x] = v; if (v) S.likes[x] = v; else delete S.likes[x]; } save(); q.i++; render(); bindQuizSwipe(); }




/* ================= Meal engine glue ================= */
const THEME_WANT = { taco: { want: { method: 'wraps' } }, meatfree: { vegOnly: true }, fish: { want: { main: ['salmon', 'white-fish', 'prawns'] } }, pasta: { want: { method: 'pasta' } }, curry: { want: { method: 'curry' } }, stirfry: { want: { method: 'stirfry' } }, roast: { want: { kit: 'roastgravy' } }, comfort: { mood: 'comfort' }, pizza: { easyOnly: 'easy-pizza' } };
function nightCtx(d, W) {
  W = W || (S.weekCheck || {})[M.weekKey(d)] || {};
  const n = M.nightOf(S, d), wd = M.wdOf(d), pace = W.pace || 'normal', cap = S.settings.weeknightMax ?? 60;
  if (['takeaway', 'off'].includes(n.mode)) return { skip: true };
  const weeknight = wd < 5 && n.mode !== 'cook';
  let maxTime = weeknight && cap ? cap - 15 : null;
  if (n.mode === 'quick' || (pace === 'busy' && weeknight) || (M.learn(S).tired[wd] || 0) >= 2) maxTime = Math.min(maxTime || 99, 25);
  const th = THEME_WANT[n.theme] || {};
  return { serves: M.servesFor(S, d), maxTime, kids: M.kidsEating(S, d), protein: n.mode === 'protein', quick: n.mode === 'quick', easy: n.mode === 'easy' || !!th.easyOnly, easyOnly: th.easyOnly, allowSlow: !weeknight, leftovers: !weeknight || pace === 'busy', want: th.want, vegOnly: th.vegOnly, mood: th.mood };
}
const easyMeals = () => Object.values(R).filter(r => r.cat === 'Easy' && !C.ruledOut(S, r) && !C.rejectedDish(S, r));
function easyPick(stock, only) {
  const list = easyMeals(); if (only && R['b:' + only]) return R['b:' + only];
  const sc = r => r.ings.filter(i => i.item && (stock.get(i.item) || 0) > 0).length * 1.5 + C.prefScore(S, r) * 0.3 + Math.random() * 2;
  return list.sort((a, b) => sc(b) - sc(a))[0] || null;
}
const yourMeals = () => Object.values(R).filter(r => (r.regular || r.src === 'mine') && !C.ruledOut(S, r));
function regularPick(ctx, stock, used, pr) {
  const p = pr === 'variety' ? 0.08 : pr === 'save' ? 0.2 : 0.14; if (Math.random() > p) return null;
  const cap = ctx.maxTime ? ctx.maxTime + 15 : 999;
  const list = yourMeals().filter(r => C.effort(r).total <= cap && !(used.titles || {})[r.title] && (!ctx.kids || M.kidFriendly(S, r) || r.regular));
  if (!list.length) return null;
  const sc = r => r.ings.filter(i => i.item && (stock.get(i.item) || 0) > 0).length + Math.random() * 2;
  return { recipe: list.sort((a, b) => sc(b) - sc(a))[0] };
}
function saveBuilt(r) { if (r && !S.recipes[r.id]) { S.recipes[r.id] = r; refreshRecipes(); } return r; }
function pruneBuilt() {
  const keep = new Set(Object.values(S.plan).flat().map(e => e.rid).concat((S.cookLog || []).slice(-60).map(x => x.rid)).concat(M.freezer(S).map(f => f.rid)));
  for (const [id, r] of Object.entries(S.recipes)) if ((r.src === 'built' || (r.src === 'lab' && !((S.lab || {}).notes || {})[id])) && !r.regular && !keep.has(id)) delete S.recipes[id];
}
function openRecipeObj(r, ctx) { saveBuilt(r); openRecipe(r.id, ctx || null); }
const POPULAR = ['chicken-thigh', 'chicken-breast', 'beef-mince', 'sausages', 'salmon', 'white-fish', 'prawns', 'pork-chop', 'eggs', 'chickpeas', 'halloumi', 'cooked-chicken', 'pepper', 'onion', 'broccoli', 'spinach', 'mushroom', 'carrot', 'courgette', 'frozen-veg', 'peas', 'cherry-tomato', 'rice', 'pasta', 'potato', 'wraps', 'noodles', 'couscous'];
function viewWeek() {
  const dates = C.weekDates(ui.weekOffset), wk = M.weekKey(dates[0]); S.baskets = S.baskets || {}; const bk = S.baskets[wk] = S.baskets[wk] || [];
  S.weekCheck = S.weekCheck || {}; const W = S.weekCheck[wk] = S.weekCheck[wk] || { pace: 'normal', guests: {}, away: [] };
  const have = [...new Set(S.pantry.filter(p => p.item && ITEM[p.item] && !ITEM[p.item].staple && (G.MAINS[p.item] || G.BASES[p.item] || G.VEG[p.item])).map(p => p.item))];
  const pr = S.settings.priority || 'balanced', ppl = M.people(S).filter(p => p.id !== 'me');
  const planned = dates.filter(d => (S.plan[d] || []).length).length;
  return `<div class="card" data-tour="basket"><h2>What are you getting this week?</h2>
    <p class="small muted" style="margin:0">Add the main things you're buying. Mise builds the week around them, and only adds what's missing.</p>
    <div class="basket">${bk.length ? bk.map((b, i) => `<div class="bk"><b>${esc(ITEM[b.item].n)}</b><div class="stepper"><button data-act="bkPacks" data-idx="${i}" data-val="-1" aria-label="Less">−</button><span>${b.packs}</span><button data-act="bkPacks" data-idx="${i}" data-val="1" aria-label="More">+</button></div><span class="tiny muted">${esc(C.packLabel({ item: b.item, packs: b.packs, size: ITEM[b.item].packs[0] }))}</span></div>`).join('') : '<p class="small muted" style="margin:6px 0">Nothing yet. Tap below, or let Mise pick.</p>'}</div>
    <form class="row" data-form="bkAdd"><input id="bkName" placeholder="e.g. chicken thighs, peppers, rice" autocomplete="off" autocorrect="on" enterkeyhint="done" aria-label="Add an item"><button class="btn" type="submit">Add</button></form>${dymBox('bk')}
    <div class="chips wrap">${(() => { const ok = id => ITEM[id] && !bk.some(b => b.item === id) && C.likeOf(S, { item: id, name: ITEM[id].n }) > -1; const P = POPULAR.filter(ok); return P.filter(id => G.MAINS[id]).slice(0, 7).concat(P.filter(id => G.VEG[id]).slice(0, 5), P.filter(id => G.BASES[id]).slice(0, 5)); })().map(id => `<button class="chip" data-act="bkQuick" data-key="${id}">+ ${esc(ITEM[id].n)}</button>`).join('')}</div>
    ${have.length ? `<p class="tiny muted" style="margin:0">Also using what's at home: ${esc(have.slice(0, 8).map(id => ITEM[id].n.toLowerCase()).join(', '))}${have.length > 8 ? '…' : ''}</p>` : ''}</div>
  <div class="card" data-tour="weekpace"><h2>This week</h2>
    <div class="seg">${[['busy', 'Busy'], ['normal', 'Normal'], ['relaxed', 'Relaxed']].map(([k, n]) => `<button data-act="wkPace" data-val="${k}" aria-pressed="${W.pace === k}">${n}</button>`).join('')}</div>
    <div class="small muted" style="font-weight:700">Priority</div>
    <div class="seg" data-tour="priority">${[['save', 'Save most'], ['balanced', 'Balanced'], ['variety', 'More variety']].map(([k, n]) => `<button data-act="wkPriority" data-val="${k}" aria-pressed="${pr === k}">${n}</button>`).join('')}</div>
    <p class="tiny muted" style="margin:0">${pr === 'save' ? 'Reuses your shop across the week. Fewest extras, least waste.' : pr === 'variety' ? 'Different flavours and dishes every night. A few more extras.' : 'Mostly your shop, plenty of variety.'}</p>
    <div class="small muted" style="font-weight:700">Guests? <span class="tiny">Tap a day to add people</span></div>
    <div class="daypick">${dates.map(d => `<button data-act="wkGuest" data-date="${d}" aria-pressed="${!!W.guests[d]}">${DOW[M.wdOf(d)]}<span>${W.guests[d] ? '+' + W.guests[d] : '–'}</span></button>`).join('')}</div>
    ${ppl.length ? `<div class="small muted" style="font-weight:700">Anyone away?</div><div class="chips wrap">${ppl.map(p => `<button class="chip" data-act="wkAway" data-key="${p.id}" aria-pressed="${W.away.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div>` : ''}</div>
  <div class="row" data-tour="buildWeek"><button class="btn primary grow" data-act="buildWeek"${bk.length ? '' : ' data-val="auto"'}>${bk.length ? 'Build my week' : 'Plan it for me'}</button>${bk.length ? '<button class="btn" data-act="buildWeek" data-val="auto">Plan it for me</button>' : ''}</div>
  ${planned ? `<p class="tiny muted" style="text-align:center;margin:0">${planned} night${planned > 1 ? 's are' : ' is'} already planned and will be kept.</p>` : ''}`;
}
function buildWeekNow(auto) {
  const dates = C.weekDates(ui.weekOffset), wk = M.weekKey(dates[0]), W = S.weekCheck[wk] || {}, pr = S.settings.priority || 'balanced';
  let bk = (S.baskets[wk] || []).slice(), mine = false;
  let todo = dates.filter(d => !(S.plan[d] || []).length && d >= C.today()); if (!todo.length) todo = dates.filter(d => !(S.plan[d] || []).length);
  if (auto && !bk.length) { bk = G.suggestBasket(S, Math.min(3, Math.ceil(todo.length / 2))); S.baskets[wk] = bk.slice(); mine = true; }
  if (!todo.length) { toast('Every night is already planned.'); return; }
  const ctxs = {}; for (const d of todo) ctxs[d] = nightCtx(d, W);
  // freezer meals on the busiest nights first
  let fz = 0;
  for (const d of todo) { if (fz >= 2 || ctxs[d].skip || !(ctxs[d].maxTime && ctxs[d].maxTime <= 25)) continue; const f = M.freezer(S).sort((a, b) => a.date.localeCompare(b.date))[0]; if (!f) break; const sv = Math.min(f.portions, ctxs[d].serves); M.takeFreezer(S, f.id, sv); S.plan[d] = [{ rid: f.rid, serves: sv, fromFreezer: f.id }]; fz++; }
  todo = todo.filter(d => !(S.plan[d] || []).length);
  const res = G.planWeek(S, todo, bk, { priority: pr, planForMe: auto, night: d => ctxs[d] || { skip: true }, easyPick: (d, stock) => ctxs[d].easy ? easyPick(stock, ctxs[d].easyOnly) : null, regularPick: (d, stock, used) => regularPick(ctxs[d], stock, used, pr) });
  let n = 0, lefts = 0;
  for (const p of res.picks) { if ((S.plan[p.date] || []).length) continue; saveBuilt(p.recipe); S.plan[p.date] = [p.leftover ? { rid: p.recipe.id, serves: p.serves, leftover: p.leftover } : { rid: p.recipe.id, serves: p.serves }]; if (p.leftover) lefts++; else n++; }
  // anything you're buying that no meal used still goes on the list
  // ...unless Mise picked it itself and the week didn't need it: then just drop it
  if (mine && res.unused.length) { S.baskets[wk] = bk.filter(b => !res.unused.includes(b.item)); res.unused = []; }
  for (const id of res.unused) if (!S.list.extras.some(x => x.item === id)) S.list.extras.push({ item: id, name: ITEM[id].n, qty: ITEM[id].packs[0] * ((bk.find(b => b.item === id) || {}).packs || 1) });
  save(); location.hash = 'plan';
  if (res.freeze && res.freeze.length) S.nudgeFreeze = { items: res.freeze, date: C.today() };
  setTimeout(() => toast(`${res.freeze && res.freeze.length ? `Freeze the ${res.freeze.map(id => ITEM[id].n.toLowerCase()).join(' and ')} today: it won't last until it's needed. ` : ''}Planned ${n} dinner${n !== 1 ? 's' : ''}${lefts ? ` + ${lefts} leftover night${lefts > 1 ? 's' : ''}` : ''}${fz ? ` + ${fz} from the freezer` : ''}${res.unused.length ? `. Not used: ${res.unused.map(id => ITEM[id].n.toLowerCase()).join(', ')} (still on your list)` : ''}.`), 150);
}
// How a built dish is put together (recipe grammar) and why its flavours work (the maths)
function blocksBox(r) {
  const B = r.blocks, chips = [['Technique', B.technique], ['Flavour', B.flavour], ['Sauce', B.sauce], ['Texture', B.texture], ['Finish', B.finish]].filter(x => x[1]);
  let why = [];
  if (K.ready()) {
    const ids = [...new Set(r.ings.map(i => i.item).filter(id => id && ITEM[id] && !['garlic', 'onion', 'oil', 'olive-oil', 'salt', 'black-pepper', 'stock'].includes(id)))], hero = r.spec && r.spec.main, tech = r.spec && r.spec.method;
    const ps = []; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const p = K.pair(ids[i], ids[j], tech); if (p && p.s > 0.2) ps.push([p.s + (ids[i] === hero || ids[j] === hero ? 0.1 : 0), ids[i], ids[j]]); }
    why = ps.sort((a, b) => b[0] - a[0]).slice(0, 3).map(([, a, b]) => `${ITEM[a].n} + ${ITEM[b].n.toLowerCase()}: ${K.why(a, b, tech)}`).filter(x => !x.endsWith('null'));
  }
  return `<div class="card flat" style="margin:0 0 10px;padding:10px 12px"><div class="row between"><b class="small">How it's built</b>${r.harmony != null ? `<span class="tiny muted">flavour harmony ${Math.round(Math.min(1, r.harmony / 0.35) * 100)}%</span>` : ''}</div>
    <div class="chips wrap" style="margin:6px 0 0">${chips.map(([k, v]) => `<span class="chip" style="cursor:default"><span class="tiny muted">${k}</span>&nbsp;${esc(v)}</span>`).join('')}</div>
    ${why.length ? `<div class="why" style="margin:8px 0 0">${why.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}
    ${r.tech && r.tech.length ? `<details style="margin-top:8px"><summary class="small" style="font-weight:700;cursor:pointer">Technique notes</summary>${r.tech.map(t => `<div class="small" style="margin-top:6px"><b>${esc(t.n.charAt(0).toUpperCase() + t.n.slice(1))}</b> <span class="tiny muted">${esc(TQ.TECH_NAMES[t.tech] || t.tech)}</span><div class="tiny">${esc([t.prep, t.time, t.heat].filter(Boolean).join(' · '))}</div>${t.done || t.safe ? `<div class="tiny muted">Done: ${esc(t.done && t.safe ? t.done + '. ' + t.safe : t.done || t.safe)}</div>` : ''}</div>`).join('')}</details>` : ''}</div>`;
}
function leftBox(r) {
  if (!r.leftover) return '';
  const ideas = (ui.loIdeas = ui.loIdeas || {})[r.id] || (ui.loIdeas[r.id] = G.leftoverIdeas(S, r).map(x => x.title));
  return `<div class="tag yours" style="white-space:normal;display:block;padding:8px 10px;margin:8px 0;font-size:13px"><b>Cooks the whole ${r.wholeJoint >= 1000 ? (r.wholeJoint / 1000).toFixed(1).replace(/\.0$/, '') + ' kg' : r.wholeJoint + ' g'} joint. Feeds ${r.leftover.feeds}.</b> About ${r.leftover.g} g left over goes into your kitchen when you tick it cooked, ready for quick meals${ideas.length ? `: ${esc(ideas.join(', '))}` : ''}.</div>`;
}
const timeLabel = r => r.handsOn ? `${r.handsOn} min in the morning · ready when you're home` : C.effort(r).slow ? hm(r.time) + ' · mostly hands-off' : '≈ ' + C.effort(r).total + ' min all in';
const hm = m => m < 90 ? m + ' min' : `${Math.floor(m / 60)} hr${m % 60 ? ' ' + (m % 60) : ''}`;
function builtExtras(r, ctx) {
  const like = G.likeThis(S, r);
  return `${like ? `<p class="small" style="margin:-4px 0 8px">Like the <b>${esc(like)}</b> you liked.</p>` : ''}
  <div class="small muted" style="font-weight:700">Swap</div><div class="chips wrap" data-tour="swapParts">${[['main', 'Main'], ['kit', 'Flavour'], ['base', 'Base'], ['veg', 'Veg'], ['method', 'How it\'s cooked']].map(([k, n]) => `<button class="chip" data-act="swapPart" data-val="${k}">${n}</button>`).join('')}</div>
  ${leftBox(r)}
  ${r.nice && r.nice.length ? `<p class="tiny muted" style="margin:6px 0 0">Nice to add if you have them: ${esc(r.nice.join(', '))}</p>` : ''}`;
}

/* ================= Tonight: mood, week check, more ================= */
const MOODS = [['oven', 'Throw it in the oven'], ['comfort', 'Comfort food'], ['light', 'Something light'], ['quick', 'Quick, 20 minutes'], ['fridge', "Use what's in the fridge"], ['new', 'Something new'], ['surprise', 'Surprise me'], ['takeaway', 'Takeaway tonight']];
function moodOptions(mood) {
  const t = C.today(), ctx = nightCtx(t), stock = G.pantryStock(S);
  if (mood === 'oven') { const sc = r => r.ings.filter(i => i.item && (stock.get(i.item) || 0) > 0).length * 1.5 + C.prefScore(S, r) * 0.3 + Math.random(); return easyMeals().sort((a, b) => sc(b) - sc(a)).slice(0, 4); }
  const base = { serves: M.servesFor(S, t), stock, kids: ctx.kids, maxTime: ctx.maxTime };
  const o = mood === 'quick' ? { quick: true, maxTime: 20 } : mood === 'comfort' ? { mood: 'comfort' } : mood === 'light' ? { mood: 'light', healthy: true } : mood === 'new' ? { noise: 3.5, priority: 'variety' } : mood === 'surprise' ? { noise: 6 } : mood === 'fridge' ? { onlyStockMains: [...stock.keys()].some(id => G.MAINS[id]), priority: 'save' } : {};
  const built = G.options(S, { ...base, ...o }, 3);
  const regs = mood === 'new' || mood === 'surprise' ? [] : yourMeals().filter(r => C.effort(r).total <= (ctx.maxTime ? ctx.maxTime + 15 : 999)).sort(() => Math.random() - 0.5).slice(0, 1);
  return built.concat(regs);
}
function moodSheet() {
  openSheet(`<h2>What do you fancy tonight?</h2><div class="moodgrid">${MOODS.map(([k, n]) => `<button class="btn" data-act="moodGo" data-val="${k}">${n}</button>`).join('')}${M.freezer(S).length ? '<button class="btn" data-act="freezerPick">From the freezer</button>' : ''}</div>`);
}
function setTonight(rid, recipe) {
  ui.weekOffset = 0;
  const t = C.today(); S.plan[t] = (S.plan[t] || []).filter(e => e.cooked);
  if (recipe && !S.recipes[rid] && !String(rid).startsWith('b:') && !(recipe.lib)) S.recipes[rid] = recipe;
  S.plan[t].push({ rid, serves: M.servesFor(S, t) }); refreshRecipes(); save();
}
function weekCheckSheetKeep() { const y = $('#sheetBody') ? $('#sheetBody').scrollTop : 0; weekCheckSheet(); if ($('#sheetBody')) $('#sheetBody').scrollTop = y; }
function weekCheckSheet() {
  const dates = C.weekDates(ui.weekOffset), wk = M.weekKey(dates[0]); S.weekCheck = S.weekCheck || {}; const W = S.weekCheck[wk] = S.weekCheck[wk] || { pace: 'normal', guests: {}, away: [] };
  const ppl = M.people(S).filter(p => p.id !== 'me'), fz = M.freezer(S).reduce((a, f) => a + f.portions, 0);
  openSheet(`<h2>What's this week like?</h2>
    <div class="seg">${[['busy', 'Busy'], ['normal', 'Normal'], ['relaxed', 'Relaxed']].map(([k, n]) => `<button data-act="wcPace" data-val="${k}" aria-pressed="${W.pace === k}">${n}</button>`).join('')}</div>
    <div class="small muted" style="font-weight:700;margin-top:12px">Anyone extra for dinner? <span class="tiny">Tap a day to add guests</span></div>
    <div class="daypick">${dates.map(d => `<button data-act="wcGuest" data-date="${d}" aria-pressed="${!!W.guests[d]}">${DOW[M.wdOf(d)]}<span>${W.guests[d] ? '+' + W.guests[d] : '–'}</span></button>`).join('')}</div>
    ${ppl.length ? `<div class="small muted" style="font-weight:700;margin-top:12px">Anyone away this week?</div><div class="chips wrap">${ppl.map(p => `<button class="chip" data-act="wcAway" data-key="${p.id}" aria-pressed="${W.away.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div>` : ''}
    ${fz ? `<label class="row" style="gap:10px;margin-top:12px"><input type="checkbox" id="wcFreezer" ${W.useFreezer !== false ? 'checked' : ''} style="width:22px;height:22px"><span class="small">Use freezer meals on busy nights (${fz} portion${fz > 1 ? 's' : ''} saved)</span></label>` : ''}
    <button class="btn primary block" data-act="suggest" style="margin-top:14px">Plan it</button>`);
}
function planMoreSheet() {
  const dates = C.weekDates(ui.weekOffset), planned = dates.some(d => (S.plan[d] || []).length);
  openSheet(`<h2>This week</h2><label class="f">Shopping at<select data-setting="defaultShop">${SHOPS.map(x => `<option${x === S.settings.defaultShop ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${planned ? '<button class="btn" data-act="prepPlan">Prep plan</button><button class="btn" data-act="shareWeek">Share the week</button>' : ''}
      <a class="btn" href="#settings" data-act="goRhythm">Set up your week (quick nights, gym nights…)</a>
      <a class="btn" href="#list" data-act="closeSheet">Shopping list</a>
      ${planned ? `<button class="btn" data-act="clearWeek" style="color:var(--hot)">${ui.clearArm ? 'Tap again to clear the week' : 'Clear the week'}</button>` : ''}</div>`);
}

/* ================= Cook mode ================= */
let wakeLock = null, cookTick = null, recog = null;
function cookModeOpen(r, serves, ctx) {
  ui.cook = { r, serves, ctx, step: -1, timers: [] };
  let el = $('#cookmode'); if (!el) { el = document.createElement('div'); el.id = 'cookmode'; document.body.appendChild(el); }
  el.hidden = false; document.body.style.overflow = 'hidden'; history.pushState({ cook: 1 }, '');
  try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => { wakeLock = w; }).catch(() => {}); } catch (e) { /* no wake lock */ }
  clearInterval(cookTick); cookTick = setInterval(cookTimersTick, 1000); renderCook();
}
function cookModeClose(fromPop) {
  const el = $('#cookmode'); if (el) el.hidden = true; document.body.style.overflow = ''; clearInterval(cookTick);
  try { wakeLock && wakeLock.release(); } catch (e) { /* ignore */ } wakeLock = null; if (recog) { try { recog.onend = null; recog.stop(); } catch (e) { /* ignore */ } recog = null; }
  ui.cook = null; if (!fromPop) history.back();
}
function renderCook() {
  const k = ui.cook, el = $('#cookmode'); if (!k || !el) return; const r = k.r, f = k.serves / r.serves, n = r.steps.length;
  const body = k.step < 0
    ? `<div class="ck-eyebrow">Get ready · ${k.serves} serving${k.serves > 1 ? 's' : ''}</div><h1>${esc(r.title)}</h1><ul class="ck-ings">${C.withSubs(S, r.ings).map(i => `<li><b>${esc((i.whole ? i.q + ' ' + i.u : fmtIng(i.q * f, i.u)))}</b> ${esc(i.name)}</li>`).join('')}</ul>`
    : k.step >= n ? `<div class="ck-eyebrow">All done</div><h1>Enjoy it!</h1><button class="btn primary block" data-act="cookFinish">Finished cooking</button>`
    : `<div class="ck-eyebrow">Step ${k.step + 1} of ${n}</div><p class="ck-step">${esc(r.steps[k.step])}</p>${M.timersIn(r.steps[k.step]).map(t => `<button class="btn" data-act="cookTimer" data-sec="${t.sec}" data-label="${esc(t.label)}">⏱ Start ${esc(t.label)} timer</button>`).join('')}`;
  el.innerHTML = `<div class="ck-top"><button class="icon-btn" data-act="cookClose" aria-label="Close">${ICON.x}</button><div class="ck-dots">${Array.from({ length: n + 1 }, (_, i) => `<i class="${i - 1 <= k.step ? 'on' : ''}"></i>`).join('')}</div><button class="icon-btn" data-act="cookVoice" aria-label="Hands-free" style="${recog ? 'background:var(--accent);color:var(--accent-ink)' : ''}">🎤</button></div>
    <div class="ck-timers">${k.timers.map((t, i) => `<button class="ck-timer${t.left <= 0 ? ' ring' : ''}" data-act="cookTimerX" data-idx="${i}">${esc(t.label)} · <b>${t.left <= 0 ? 'Done!' : fmtClock(t.left)}</b></button>`).join('')}</div>
    <div class="ck-body" data-act="cookTap">${body}</div>
    <div class="ck-nav"><button class="btn grow" data-act="cookPrev"${k.step < 0 ? ' disabled' : ''}>Back</button><button class="btn primary grow" data-act="cookNext"${k.step >= n ? ' disabled' : ''}>${k.step < 0 ? 'Start' : 'Next'}</button></div>`;
}
const fmtClock = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
function cookTimersTick() {
  const k = ui.cook; if (!k || !k.timers.length) return; let ring = false;
  for (const t of k.timers) { const before = t.left; t.left = (t.end - Date.now()) / 1000; if (before > 0 && t.left <= 0) ring = true; }
  if (ring) { try { navigator.vibrate && navigator.vibrate([400, 200, 400, 200, 400]); const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(); o.frequency.value = 880; o.connect(a.destination); o.start(); setTimeout(() => { o.stop(); a.close(); }, 900); } catch (e) { /* no sound */ } toast('Timer done!'); }
  const box = $('#cookmode .ck-timers'); if (box) box.innerHTML = k.timers.map((t, i) => `<button class="ck-timer${t.left <= 0 ? ' ring' : ''}" data-act="cookTimerX" data-idx="${i}">${esc(t.label)} · <b>${t.left <= 0 ? 'Done!' : fmtClock(t.left)}</b></button>`).join('');
}
function cookVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { toast('Hands-free needs Chrome speech recognition'); return; }
  if (recog) { recog.onend = null; recog.stop(); recog = null; renderCook(); return; }
  recog = new SR(); recog.continuous = true; recog.lang = 'en-IE';
  recog.onresult = ev => { const t = ev.results[ev.results.length - 1][0].transcript.toLowerCase(); if (/next|done|okay/.test(t)) A.cookNext(); else if (/back|previous/.test(t)) A.cookPrev(); else if (/timer/.test(t)) { const b = $('#cookmode [data-act=cookTimer]'); if (b) b.click(); } };
  recog.onend = () => { if (recog) try { recog.start(); } catch (e) { /* ignore */ } };
  try { recog.start(); toast('Say "next", "back" or "timer"'); } catch (e) { recog = null; } renderCook();
}

/* ================= After cooking ================= */
function reactionSheet(r, e, date) {
  ui.react = { r, e, date, chips: [], freeze: true };
  const spare = e && C.isBatch(S, r) ? e.serves - M.servesFor(S, date) - Object.values(S.plan).flat().filter(x => x.leftover === date && x.rid === r.id).reduce((a, x) => a + x.serves, 0) : 0; ui.react.spare = spare;
  renderReaction();
}
function renderReaction() {
  const k = ui.react;
  setSheetOrOpen(`<h2>How was ${esc(k.r.title)}?</h2><div class="react3">${[['love', '😍', 'Loved it'], ['fine', '🙂', 'It was fine'], ['never', '🙅', 'Never again']].map(([v, ic, n]) => `<button class="btn${k.v === v ? ' on' : ''}" data-act="reactPick" data-val="${v}"><span style="font-size:26px">${ic}</span>${n}</button>`).join('')}</div>
    <div class="chips wrap" style="margin-top:10px">${M.REACTION_CHIPS.filter(([c]) => c !== 'kids' || M.people(S).some(p => p.kid)).map(([c, n]) => `<button class="chip" data-act="reactChip" data-val="${c}" aria-pressed="${k.chips.includes(c)}">${n}</button>`).join('')}</div>
    ${k.spare > 0 ? `<label class="row" style="gap:10px;margin-top:10px"><input type="checkbox" id="reactFreeze" ${k.freeze ? 'checked' : ''} style="width:22px;height:22px"><span class="small">Freeze the ${k.spare} spare portion${k.spare > 1 ? 's' : ''}</span></label>` : ''}
    <div class="row" style="margin-top:14px"><button class="btn grow" data-act="reactSkip">Skip</button><button class="btn primary grow" data-act="reactSave"${k.v ? '' : ' disabled'}>Save</button></div>`);
}
function setSheetOrOpen(html) { if ($('#sheet').hidden) openSheet(html); else setSheet(html); }

/* ================= Your tastes ================= */
const tri = (v, label, act, key) => `<button class="chip tri${v > 0 ? ' on' : v < 0 ? ' off' : ''}" data-act="${act}" data-key="${esc(key)}">${v > 0 ? '♥ ' : v < 0 ? '✕ ' : ''}${esc(label)}</button>`;
function likeLabel(k) { const [base, prep] = k.split(/:(?=[a-z]+$)/).length > 1 && !k.startsWith('x:') ? k.split(/:(?=[a-z]+$)/) : [k, null]; const p2 = k.startsWith('x:') && /:[a-z]+$/.test(k.slice(2)) ? k.slice(2).split(':') : null; const b = p2 ? 'x:' + p2[0] : base, pr = p2 ? p2[1] : prep; const n = ITEM[b] ? ITEM[b].n : b.replace(/^x:/, ''); return pr && C.PREP_NAMES[pr] ? `${n} (${C.PREP_NAMES[pr]})` : n; }
function usedCuisines() { const n = {}; for (const r of Object.values(R)) if (r.area && r.area !== 'Unknown') n[r.area] = (n[r.area] || 0) + 1; return Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0]); }
function viewTastes() {
  const T = S.taste || {}, tp = C.tasteProfile(S);
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, n]) => `<button data-act="setTaste" data-key="${key}" data-val="${v}" aria-pressed="${String(T[key] ?? '') === String(v)}">${n}</button>`).join('')}</div>`;
  const chips = (arr, cls) => arr.map(x => `<span class="tag ${cls}" style="font-size:13px">${esc(x)}</span>`).join(' ');
  return `<div class="card" data-tour="tTrain"><h2>Teach Mise</h2><p class="small muted" style="margin:0">The more you swipe and rate, the better your week gets.</p>
    <div class="row wrap"><button class="btn primary grow" data-act="trainDishes">Swipe dishes</button><button class="btn grow" data-act="trainIngs">Swipe ingredients</button></div><a class="btn ghost sm" href="#quiz" data-act="quizRestart">Full quiz again</a></div>
  <div class="card" data-tour="tBasics"><h2>Basics</h2>
    <div class="small muted" style="font-weight:600">Spice</div>${seg('spice', [[0, 'None'], [1, 'Mild'], [2, 'Medium'], [3, 'Hot']])}
    <div class="small muted" style="font-weight:600">Time to cook on a weeknight</div>${seg('maxTime', [[20, '20 min'], [30, '30'], [45, '45'], [0, 'Any']])}
    <div class="small muted" style="font-weight:600">Eating healthier?</div>${seg('health', [[0, 'Not fussed'], [1, 'A bit'], [2, 'Yes']])}
    <label class="f">New things vs favourites <span class="tiny">${S.settings.adventure < 25 ? 'Mostly favourites' : S.settings.adventure < 60 ? 'A good mix' : 'Lots of new things'}</span><input type="range" min="0" max="100" step="5" data-setting="adventure" value="${S.settings.adventure}" style="min-height:0;padding:0;accent-color:var(--accent)"></label></div>
  <div class="card" data-tour="tTypes"><h2>Kinds of dinner</h2><p class="tiny muted" style="margin:0">Tap once to love, twice for no, again to clear.</p><div class="chips wrap">${Object.entries(C.TYPE_NAMES).map(([k, n]) => tri((T.types || {})[k], n, 'triTaste', 'types:' + k)).join('')}</div>
    <h3 style="margin:6px 0 0">Flavours</h3><div class="chips wrap">${Object.entries(C.FLAVOUR_NAMES).map(([k, n]) => tri((T.flavours || {})[k], n, 'triTaste', 'flavours:' + k)).join('')}</div></div>
  <div class="card" data-tour="tCuisines"><h2>Cuisines</h2><div class="chips wrap">${usedCuisines().map(c => tri((T.cuisines || {})[c], c, 'triTaste', 'cuisines:' + c)).join('')}</div></div>
  <div class="card" data-tour="sTastesList"><h2>Ingredients</h2>
    ${Object.keys(S.likes).length ? `<div class="card flat">${Object.entries(S.likes).sort((a, b) => a[1] - b[1]).map(([k, v]) => `<div class="pi"><div class="grow"><b>${esc(likeLabel(k))}</b></div>${v <= -9 ? '<span class="tag deal">can\'t eat</span>' : v < 0 ? '<span class="tag warn">don\'t like</span>' : '<span class="tag yours">love</span>'}<button class="icon-btn" data-act="removeLike" data-key="${esc(k)}" aria-label="Remove">${ICON.x}</button></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">Nothing yet.</p>'}
    ${(S.settings.diet || []).length ? `<p class="small" style="margin:0">Diet: <b>${esc(S.settings.diet.map(d => (C.DIETS.find(x => x[0] === d) || [, d])[1]).join(', '))}</b> <a href="#quiz" data-act="quizRestart">change</a></p>` : ''}
    <form class="row wrap" data-form="addLike"><input id="likeName" placeholder="e.g. Potatoes" autocomplete="off" style="flex:1 1 140px" aria-label="Ingredient"><select id="likePrep" style="flex:0 1 120px" aria-label="Cooked how"><option value="">Any way</option>${Object.entries(C.PREP_NAMES).map(([k, n]) => `<option value="${k}">Only ${n}</option>`).join('')}</select><select id="likeVal" style="flex:0 1 120px" aria-label="Preference"><option value="-1">Don't like</option><option value="-9">Can't eat</option><option value="1">Love it</option></select><button class="btn primary" type="submit">Add</button></form>
    <p class="tiny muted" style="margin:0">Tip: "Potatoes · Only mashed · Don't like" keeps potatoes in, and recipes swap the mash for something else.</p></div>
  <div class="card" data-tour="sLearned"><h2>What Mise has learned</h2>
    ${tp.loves.length || tp.avoids.length || tp.cuisines.length || tp.types.length ? `${tp.loves.length ? `<div class="small"><b>Ingredients you like</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.loves, 'yours')}</div></div>` : ''}${tp.avoids.length ? `<div class="small"><b>You avoid</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.avoids, 'warn')}</div></div>` : ''}${tp.types.length ? `<div class="small"><b>Dinners you go for</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.types, '')}</div></div>` : ''}${tp.flavours.length ? `<div class="small"><b>Flavours</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.flavours, '')}</div></div>` : ''}${tp.cuisines.length ? `<div class="small"><b>Cuisines</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.cuisines, '')}</div></div>` : ''}${tp.proteins.length ? `<div class="small"><b>Mains</b><div class="row wrap" style="gap:6px;margin-top:4px">${chips(tp.proteins.filter(x => x[1] > 0).map(x => x[0]), 'yours')} ${chips(tp.proteins.filter(x => x[1] < 0).map(x => x[0]), 'warn')}</div></div>` : ''}` : '<p class="small muted" style="margin:0">Nothing yet. Swipe some dishes, rate meals and scan receipts.</p>'}
    <p class="tiny muted" style="margin:0">From ${tp.dishes} swiped dishes, ${tp.rated} ratings, ${tp.cooked} meals cooked, plus swaps and receipts.</p>
    <button class="btn sm" data-act="resetLearning" style="color:var(--hot);align-self:flex-start">${ui.resetLearnArm ? 'Tap again to reset' : 'Reset learning'}</button></div>`;
}

/* ================= Discover (endless swipe) ================= */
function discTopUp() {
  const D = ui.disc || (ui.disc = { deck: [], i: 0, seen: new Set(), likes: 0, n: 0 });
  if (D.deck.length - D.i < 4) { const more = C.discoverDeck(S, 15, D.seen); for (const r of more) D.seen.add(r.id); D.deck.push(...more); }
  if (D.deck.length - D.i < 2 && !D.fetching && navigator.onLine !== false) { D.fetching = true; Promise.all([1, 2, 3, 4, 5].map(() => C.mdbRandom(S).catch(() => null))).then(list => { for (const r of list) if (r && !D.seen.has(r.id) && !C.ruledOut(S, r) && !['Dessert', 'Starter', 'Side'].includes(r.cat)) { D.seen.add(r.id); D.deck.push(r); } D.fetching = false; if (ui.route === 'discover') render(); }); }
  return D;
}
function viewDiscover() {
  const D = discTopUp(), r = D.deck[D.i];
  if (!r) return `<div class="empty">${D.fetching ? '<span class="spinner"></span><p>Finding more…</p>' : `<h3>You've seen it all</h3><p>Download the full recipe library in Settings for hundreds more.</p><a class="btn" href="#settings">Settings</a>`}</div>`;
  const img = C.photoOf(S, r), why = C.whyRecipe(S, r).filter(w => w[0] > 0).slice(0, 2);
  return `<div class="quiz"><div class="row between small muted"><span>${D.n} swiped · ${D.likes} liked</span><a class="btn ghost sm" href="#recipes" data-act="recTab" data-val="liked">Liked</a></div>
    <div class="qstack"><div class="qcard disc" id="qcard" data-tour="discCard"><div class="qimg dish">${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : ''}<span>${esc(r.title[0])}</span></div><h2>${esc(r.title)}</h2><p class="small muted" style="margin:0">${esc([r.area, r.time + ' min', r.ings.length + ' ingredients'].filter(Boolean).join(' · '))}</p>${why.length ? `<div class="why" style="justify-content:center;margin:6px 0 0">${why.map(w => `<span>+ ${esc(w[1])}</span>`).join('')}</div>` : ''}<div class="qhint left">NOPE</div><div class="qhint right">YUM</div></div></div>
    <p class="tiny muted" style="text-align:center;margin:0">Right = I'd eat that · left = no · tap to see it · "My way" builds something like it from easy ingredients</p>
    <div class="qbtns" data-tour="discBtns"><button class="qb no" data-act="discVote" data-val="-1" aria-label="No">${ICON.x}</button><button class="qb meh" data-act="discMake" aria-label="Make it my way">My way</button><button class="qb yes" data-act="discVote" data-val="1" aria-label="Yes"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>
    ${D.i ? '<button class="btn ghost sm" data-act="discUndo" style="align-self:center">Undo last</button>' : ''}</div>`;
}
function discVote(v) {
  const D = ui.disc, r = D.deck[D.i]; if (!r) return;
  C.voteDish(S, r, v); if (v > 0 && String(r.id).startsWith('g:') && !S.recipes[r.id]) { S.recipes[r.id] = r; refreshRecipes(); }
  D.n++; if (v > 0) D.likes++; D.i++; save(); render(); bindQuizSwipe();
}

/* ================= Discover: collections from your kitchen ================= */
const DISCO_ROWS = [
  ['kitchen', 'From your kitchen', 'Uses what you have', { useStock: true }],
  ['quick', 'On the table in 30', 'Weeknight fast', { maxTime: 30, quick: true }],
  ['slow', 'Roasts & slow cooks', 'Worth the wait', { methods: ['roast', 'pulled', 'braise', 'sticky'], allowSlow: true }],
  ['pot', 'One pot & curries', 'Less washing up', { methods: ['simmer', 'curry', 'soup', 'noodlesoup', 'risotto'] }],
  ['oven', 'Throw it in the oven', 'Traybakes & bakes', { methods: ['traybake', 'bake', 'loaded', 'pie'] }],
  ['italian', 'Italian', '', { feel: ['Italian'] }],
  ['mexican', 'Mexican & Tex-Mex', '', { feel: ['Mexican', 'American'] }],
  ['asian', 'Chinese, Thai & Japanese', '', { feel: ['Chinese', 'Thai', 'Japanese'] }],
  ['indian', 'Indian & Moroccan', '', { feel: ['Indian', 'Moroccan'] }],
  ['irish', 'Irish & British', '', { feel: ['Irish', 'British'], noMeth: ['wraps', 'quesadilla', 'flatbread', 'burgers', 'bowl', 'friedrice', 'stirfry'] }],
  ['med', 'Mediterranean', '', { feel: ['Mediterranean', 'Greek', 'Portuguese', 'French'] }]];
const DISCO_TIME = [[0, 'Any time'], [30, '30 min'], [45, '45 min'], [60, '1 hour']];
const DISCO_COST = [[0, 'Any price'], [2, 'Under €2'], [3, 'Under €3']];
function discoKey() { const F = ui.discoF || {}; return C.today() + '|' + JSON.stringify(F) + '|' + S.pantry.length + '|' + JSON.stringify(S.gear || {}); }
function discoBuild() {
  const D = ui.disco; if (!D || !D.pending) return;
  const F = ui.discoF || {}, t = C.today(), stock = G.pantryStock(S), serves = M.servesFor(S, t), seenTitles = new Set();
  let curNo;
  const fits = r => (!F.time || C.effort(r).total <= F.time + 5) && (!r.spec || !(curNo || []).includes(r.spec.method)) && (!F.cost || C.recipeCost(S, r, r.serves).perServe <= F.cost);
  const base = { want: {}, stock, serves, seenTitles, recent: false, noise: 2, vegOnly: !!F.veg, cheap: !!F.cost, maxTime: F.time ? Math.max(10, F.time - 10) : null, quick: F.time && F.time <= 30, allowSlow: !F.time };
  const t0 = performance.now();
  try {
    for (const [key, , , o] of DISCO_ROWS) {
      if (D.rows[key]) continue;
      curNo = o.noMeth;
      let got = [];
      const opts = { ...base, ...o, useStock: o.useStock || F.have, onlyStockMains: (o.useStock || F.have) && [...stock.keys()].some(id => G.MAINS[id]) };
      if (o.methods) for (const m of o.methods) { got = got.concat(G.options(S, { ...opts, want: { method: m } }, 2)); }
      else if (o.feel) { const kids = Object.entries(G.KITS).filter(([, k]) => o.feel.includes(k.feel)).map(([id]) => id).sort(() => Math.random() - 0.5).slice(0, 4); for (const kid of kids) got = got.concat(G.options(S, { ...opts, want: { kit: kid } }, o.noMeth ? 3 : 2)); }
      else got = G.options(S, opts, 7);
      D.rows[key] = got.filter(fits).slice(0, 8);
      if (performance.now() - t0 > 250) { setTimeout(() => { discoBuild(); if (ui.route === 'discover') render(); }, 0); return; }
    }
    D.pending = false;
  } catch (e) { console.warn('discover', e); D.pending = false; D.err = true; for (const [k] of DISCO_ROWS) if (!D.rows[k]) D.rows[k] = []; }
  if (ui.route === 'discover') render();
}
function discoSearch(q) {
  const D = ui.disco, F = ui.discoF || {}, p = G.parseWant(S, q), t = C.today(), stock = G.pantryStock(S);
  D.q = q;
  try { const want = { ...p.want }; if (want.main) want.lock = true;
    const got = G.options(S, { want, exclude: p.exclude, stock, serves: M.servesFor(S, t), useStock: !!F.have, vegOnly: p.mods.veggie || !!F.veg, quick: p.mods.quick || (F.time && F.time <= 30), maxTime: F.time ? Math.max(10, F.time - 10) : null, cheap: p.mods.cheap || !!F.cost, spicy: p.mods.spicy, mood: p.mods.mood, healthy: p.mods.healthy, allowSlow: !F.time, noise: 1.6, seenTitles: new Set() }, 9);
    D.res = got.filter(r => (!F.time || C.effort(r).total <= F.time + 5) && (!F.cost || C.recipeCost(S, r, r.serves).perServe <= F.cost));
  } catch (e) { console.warn(e); D.res = []; }
}
function dcard(r, key, k) { const c = C.recipeCost(S, r, r.serves);
  return `<button class="dcard" data-act="discoOpen" data-key="${key}" data-idx="${k}">${tile(r, 'dtile')}<b>${esc(r.title)}</b><span>${C.effort(r).slow ? hm(r.time) : C.effort(r).total + ' min'} · ${C.eur(c.perServe)}</span></button>`; }
function viewDisco() {
  if (!ui.disco || ui.disco.key !== discoKey()) ui.disco = { key: discoKey(), rows: {}, pending: true };
  const D = ui.disco, F = ui.discoF || (ui.discoF = {});
  let h = `<form class="ask-in disco-search" data-form="discoSearch"><input id="discoQ" type="search" enterkeyhint="search" autocomplete="off" aria-label="Search dishes" placeholder="Search: lamb, curry, something creamy…" value="${esc(D.q || '')}"><button class="go" type="submit" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button></form>
  <div class="chips disco-f">${DISCO_TIME.map(([v, n]) => `<button class="chip" data-act="discoF" data-key="time" data-val="${v}" aria-pressed="${(F.time || 0) === v}">${n}</button>`).join('')}<span class="sep"></span>${DISCO_COST.map(([v, n]) => `<button class="chip" data-act="discoF" data-key="cost" data-val="${v}" aria-pressed="${(F.cost || 0) === v}">${n}</button>`).join('')}<span class="sep"></span><button class="chip" data-act="discoF" data-key="veg" aria-pressed="${!!F.veg}">Veggie</button><button class="chip" data-act="discoF" data-key="have" aria-pressed="${!!F.have}">Only what I have</button></div>`;
  if (D.res) { h += `<div class="sec-h"><h3>${esc(D.q)}</h3><button class="btn sm ghost" data-act="discoClear">Clear</button></div>${D.res.length ? `<div class="dgrid">${D.res.map((r, k) => dcard(r, 'res', k)).join('')}</div>` : '<div class="empty"><h3>Nothing for that</h3><p>Try fewer words, or turn off a filter.</p></div>'}`; return h; }
  h += `<a class="swipe-cta" href="#swipe">${ICON.spark}<div class="grow"><b>Teach Mise your taste</b><span>Swipe through dishes. Mise learns what you like.</span></div><span aria-hidden="true">›</span></a>`;
  for (const [key, title, sub] of DISCO_ROWS) {
    const list = D.rows[key];
    if (list && !list.length) continue;
    h += `<section class="drow-wrap"><div class="sec-h"><h3>${title}</h3>${sub ? `<span class="small muted">${sub}</span>` : ''}</div><div class="drow">${list ? list.map((r, k) => dcard(r, key, k)).join('') : '<div class="dcard sk"></div><div class="dcard sk"></div><div class="dcard sk"></div>'}</div></section>`;
  }
  if (!D.pending && DISCO_ROWS.every(([k]) => !(D.rows[k] || []).length)) h += `<div class="empty"><h3>${D.err ? 'Something went wrong' : 'Nothing fits those filters'}</h3><p>${D.err ? 'Pull down to refresh, or try again in a moment.' : 'Try a longer time or a higher price.'}</p></div>`;
  return h;
}
/* ================= Your own recipe ================= */
function viewAdd() {
  const e = ui.editDraft || (ui.editDraft = { title: '', serves: S.settings.household || 2, time: 30, ing: '', steps: '', id: null, img: null });
  return `${e.id ? '' : `<div class="quick3" data-tour="arImport"><button data-act="arLink">${ICON.spark}<b>From a link</b><span>Any recipe website</span></button><button data-act="arPaste">${ICON.receipt}<b>Paste text</b><span>Notes, TikTok captions</span></button><label for="arCookbook">${ICON.box}<b>From a photo</b><span>Cookbook page</span></label></div><input type="file" id="arCookbook" accept="image/*" hidden data-change="arCookbook">`}<div class="card"><label class="f">Name<input id="arTitle" value="${esc(e.title)}" placeholder="e.g. Nana's beef stew"></label>
    <div class="row"><label class="f grow">Serves<input id="arServes" type="number" min="1" value="${e.serves}"></label><label class="f grow">Minutes<input id="arTime" type="number" min="5" step="5" value="${e.time}"></label></div>
    <label class="f">Ingredients <span class="tiny">one per line, e.g. "500 g beef brisket"</span><textarea id="arIng" style="min-height:150px" placeholder="1.2 kg beef brisket&#10;2 onions&#10;300 ml BBQ sauce">${esc(e.ing)}</textarea></label>
    <label class="f">Method <span class="tiny">one step per line</span><textarea id="arSteps" style="min-height:120px" placeholder="Rub the beef with spices&#10;Slow cook 8 hours">${esc(e.steps)}</textarea></label>
    <label class="row" style="gap:10px;margin:4px 0 10px"><input type="checkbox" id="arBatch"${e.batch ? ' checked' : ''} style="width:22px;height:22px"><span class="small"><b>Big batch.</b> Always cook it all; leftovers fill the next nights.</span></label>
    <div class="row wrap"><label class="btn grow" for="arPhoto">${e.img ? 'Change photo' : 'Add a photo'}</label><input type="file" id="arPhoto" accept="image/*" hidden data-change="arPhoto"></div>
    ${e.img ? `<img src="${esc(e.img)}" alt="" style="width:100%;border-radius:12px;max-height:200px;object-fit:cover">` : ''}
    <div id="arCheck"></div>
    <button class="btn primary block" data-act="arSave">Save recipe</button></div>`;
}
function fillDraftFrom(r) { const e = ui.editDraft; e.title = r.title; e.serves = r.serves; e.time = r.time; e.ing = r.ings.map(i => i.raw || `${i.q} ${i.u} ${i.name}`).join('\n'); e.steps = r.steps.join('\n'); if (r.img) e.img = r.img; e.url = r.url; }
function readAddForm() { const e = ui.editDraft; e.title = $('#arTitle').value.trim(); e.serves = +$('#arServes').value || 2; e.time = +$('#arTime').value || 30; e.ing = $('#arIng').value; e.steps = $('#arSteps').value; e.batch = $('#arBatch').checked; return e; }

const VIEWS = { make: () => { ui.make = { text: '', chips: ['have'], res: null }; makeRun(false); history.replaceState(null, '', '#builder'); ui.route = 'builder'; return viewBuilder(); }, week: viewWeek, discover: viewDisco, swipe: viewDiscover, tastes: viewTastes, add: viewAdd, quiz: viewQuiz, plan: viewPlan, recipes: viewRecipes, list: viewList, pantry: viewPantry, more: viewMore, receipts: viewReceipts, builder: viewBuilder, lab: viewLab, ing: viewIng, deals: viewDeals, insights: viewInsights, settings: viewSettings, install: viewInstall };
async function syncLib(manual) {
  if (ui.libBusy) return; ui.libBusy = 0.01; if (ui.route === 'settings') render();
  try { const before = C.libraryInfo().count; const n = await C.syncLibrary(S, f => { ui.libBusy = Math.max(0.01, f); if (ui.route === 'settings') { const y = scrollY; render(); scrollTo(0, y); } }); ui.libBusy = 0; refreshRecipes(); if (manual || !before) toast(`${n} recipes ready, even offline`); }
  catch (e) { ui.libBusy = 0; if (manual) toast('Couldn\'t download: ' + e.message); }
  if (['settings', 'recipes'].includes(ui.route)) { const y = scrollY; render(); scrollTo(0, y); }
}
// world ingredients in your data ("w:cauliflower:romanesco") are rebuilt from their ids before anything renders
function registerWorldIds() { try { for (const id of new Set(JSON.stringify(S).match(/w:[a-z0-9-]+:[a-z0-9-]+/g) || [])) C.ensureWorld(id); } catch (e) { /* ignore */ } }
async function boot() {
  S = await C.loadState();
  registerWorldIds(); C.customWorld(S);
  refreshRecipes(); applyTheme();

  window.addEventListener('hashchange', route);
  pruneBuilt(); refreshRecipes();
  route(); updateBadge();

  if (!S.settings.onboarded) onboarding();
  if (isNative()) setTimeout(() => checkUpdate(false), 5000);
  fetch('data/ingdb.json').then(r => r.json()).then(j => { C.loadWorld(j); C.customWorld(S); }).catch(() => {});
  K.load().then(ok => { if (ok && ['builder', 'lab', 'settings'].includes(ui.route)) render(); }); setTimeout(() => K.loadNutrition(), 1500);
  C.aiAvailable().then(a => { ui.aiStatus = a; });
  C.loadLibrary().then(L => { refreshRecipes(); if (ui.route === 'recipes') render(); if (navigator.onLine !== false && (!L.count || Date.now() - L.at > 14 * 864e5)) syncLib(false); });
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
