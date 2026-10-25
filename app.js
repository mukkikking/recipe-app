'use strict';

// ============================================================
// Storage
// ============================================================

const KEYS = { settings: 'kondate.settings', book: 'kondate.book', history: 'kondate.history' };

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    toast('保存に失敗しました');
  }
}

const defaultSettings = () => ({
  timeLimit: 20,
  addKidWord: true,
  addTimeWord: true,
  stock: DEFAULT_STOCK.map((s) => ({ ...s })),
});

let settings = { ...defaultSettings(), ...load(KEYS.settings, {}) };
let book = load(KEYS.book, []);
let history = load(KEYS.history, []);

const saveSettings = () => save(KEYS.settings, settings);
const saveBook = () => save(KEYS.book, book);
const saveHistory = () => save(KEYS.history, history);

// ============================================================
// Utilities
// ============================================================

const $ = (sel) => document.querySelector(sel);
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(iso) {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ============================================================
// Search links
// ============================================================

const SITES = {
  cookpad: { label: 'クックパッド', url: (kw) => `https://cookpad.com/jp/search/${encodeURIComponent(kw)}` },
  kurashiru: { label: 'クラシル', url: (kw) => `https://www.kurashiru.com/search?query=${encodeURIComponent(kw)}` },
  nadia: { label: 'Nadia', url: (kw) => `https://oceans-nadia.com/search?q=${encodeURIComponent(kw)}` },
};

function timeWord(limit) {
  if (limit <= 10) return '10分';
  if (limit <= 20) return '時短';
  if (limit <= 30) return '簡単';
  return '';
}

function buildKeyword(dish) {
  const parts = [dish.k];
  if (settings.addKidWord) parts.push('子供');
  if (settings.addTimeWord) {
    const w = timeWord(settings.timeLimit);
    if (w) parts.push(w);
  }
  return parts.join(' ');
}

function openSite(site, keyword) {
  const kw = keyword.trim();
  if (!kw) return;
  window.open(SITES[site].url(kw), '_blank', 'noopener');
}

// ============================================================
// Suggestion engine
// ============================================================

function dayProfile(date) {
  const dow = date.getDay();
  return {
    dow,
    month: date.getMonth() + 1,
    // The day before burnable-garbage day (Mon/Thu) -> prefer fish.
    fishDay: dow === 0 || dow === 3,
    // Right after the weekend (often eating out) -> keep it healthy.
    healthyDay: dow === 1 || dow === 2,
    // Weekend drinking -> dishes that go well with beer / sake.
    drinkDay: dow === 5 || dow === 6,
  };
}

function themeMessages(p) {
  const msgs = [];
  if (p.fishDay) msgs.push('🐟 明日は燃えるゴミの日 → 魚がおすすめ');
  if (p.healthyDay) msgs.push('🥦 週初めなのでヘルシーに');
  if (p.drinkDay) msgs.push('🍺 週末：お酒に合うおかずも◎');
  if (msgs.length === 0) msgs.push('⚖️ 栄養バランス重視の日');
  return msgs;
}

// History entries in the 7 days before `date` (exclusive).
function recentHistory(date, days = 7) {
  const from = toISODate(addDays(date, -days));
  const to = toISODate(date);
  return history.filter((h) => h.date >= from && h.date < to);
}

function countMainGroups(entries) {
  const counts = {};
  for (const h of entries) {
    if (h.t !== 'main') continue;
    counts[h.g] = (counts[h.g] || 0) + 1;
  }
  return counts;
}

function stockNames() {
  return settings.stock.filter((s) => s.on).map((s) => s.name);
}

function buildContext(date) {
  const recent = recentHistory(date);
  const yesterday = toISODate(addDays(date, -1));
  return {
    ...dayProfile(date),
    stock: stockNames(),
    recent,
    recentMainCounts: countMainGroups(recent),
    yesterdayMainGroups: recent.filter((h) => h.date === yesterday && h.t === 'main').map((h) => h.g),
  };
}

function scoreDish(d, ctx) {
  if (d.m && !d.m.includes(ctx.month)) return null;

  let s = 0;
  const badges = [];

  if (d.m) { s += 3; badges.push('旬'); }

  const matched = ctx.stock.filter((name) => d.ing.includes(name) || d.k.includes(name) || d.n.includes(name));
  if (matched.length) {
    // Flat bonus: stock items overlap with Merumama's favorites (f), so keep this small.
    s += 1;
    badges.push(`在庫: ${matched.join('・')}`);
  }

  if (d.f) { s += 2; badges.push('メルママ好き'); }
  if (d.fb) { s += 1; badges.push('食物繊維'); }
  if (d.s) { s += 1; badges.push('大豆'); }
  if (d.hv) s -= 0.5;

  if (d.g === 'fish' && d.t !== 'side') {
    if (ctx.fishDay) {
      s += d.t === 'main' ? 6 : 2;
      badges.push('魚の日');
    } else if (d.t === 'main') {
      s -= 1.5;
    }
  }
  if (ctx.healthyDay && d.h) { s += 3; badges.push('ヘルシー'); }
  if (ctx.drinkDay && d.o) { s += 2.5; badges.push('おつまみ向き'); }

  // Avoid repeating the same dish within a week.
  s -= 5 * ctx.recent.filter((h) => h.name === d.n).length;

  if (d.t === 'main') {
    if (ctx.yesterdayMainGroups.includes(d.g)) s -= 2;
    const cnt = ctx.recentMainCounts[d.g] || 0;
    s -= 0.5 * cnt;
    // Nudge toward groups we have not had this week.
    if ((d.g === 'fish' || d.g === 'soy') && cnt === 0) s += 1;
  }

  s += Math.random() * 4;
  return { dish: d, score: s, badges };
}

function pickTop(scored, count, maxPerGroup) {
  const sorted = scored.filter(Boolean).sort((a, b) => b.score - a.score);
  const picked = [];
  const groupCount = {};
  for (const item of sorted) {
    const g = item.dish.g;
    if ((groupCount[g] || 0) >= maxPerGroup) continue;
    picked.push(item);
    groupCount[g] = (groupCount[g] || 0) + 1;
    if (picked.length >= count) break;
  }
  return picked;
}

function scoreBookEntry(r, ctx) {
  if (r.time && Number(r.time) > settings.timeLimit) return null;
  let s = 0;
  const badges = [];
  if (r.reaction === '◎') { s += 3; badges.push('メルママ◎'); }
  if (r.reaction === '○') s += 1;
  if (r.reaction === '△') s -= 2;
  if (ctx.fishDay && r.g === 'fish' && r.t === 'main') { s += 4; badges.push('魚の日'); }
  s -= 5 * ctx.recent.filter((h) => h.name === r.name).length;
  s += Math.random() * 3;
  return { entry: r, score: s, badges };
}

// ============================================================
// Suggestion tab rendering
// ============================================================

let current = { main: [], side: [], rice: [], book: [] };

function selectedDate() {
  return parseISODate($('#suggest-date').value);
}

function renderBalance(el, counts, label = '') {
  const groups = ['meat', 'fish', 'soy', 'egg'];
  el.innerHTML = (label ? `<span class="balance-label">${label}</span>` : '') + groups
    .map((g) => `<span class="chip g-${g}">${GROUP_LABELS[g]} ${counts[g] || 0}</span>`)
    .join('');
}

const SUGGEST_BALANCE_LABEL = '直近7日の主菜:';

function dishCard(item, key) {
  const d = item.dish;
  const kw = buildKeyword(d);
  return `
    <div class="card dish" data-key="${key}">
      <div class="dish-head">
        <strong>${escapeHtml(d.n)}</strong>
        <span class="chip g-${d.g}">${GROUP_LABELS[d.g]}</span>
      </div>
      <div class="badges">${item.badges.map((b) => `<span class="badge">${escapeHtml(b)}</span>`).join('')}</div>
      ${d.hv ? `<p class="hint">💡 ${escapeHtml(d.hv)}</p>` : ''}
      <input class="kw" value="${escapeHtml(kw)}" aria-label="検索キーワード">
      <div class="site-btns">
        ${Object.entries(SITES).map(([id, s]) => `<button class="btn site site-${id}" data-site="${id}">${s.label}</button>`).join('')}
      </div>
      <button class="btn small eat" data-action="eat">✅ これにした</button>
    </div>`;
}

function bookSuggestCard(item, key) {
  const r = item.entry;
  return `
    <div class="card dish" data-key="${key}">
      <div class="dish-head">
        <strong>${escapeHtml(r.name)}</strong>
        <span class="chip g-${r.g}">${GROUP_LABELS[r.g] || ''}</span>
      </div>
      <div class="badges">
        <span class="badge">${TYPE_LABELS[r.t]}</span>
        ${r.time ? `<span class="badge">${escapeHtml(r.time)}分</span>` : ''}
        ${item.badges.map((b) => `<span class="badge">${escapeHtml(b)}</span>`).join('')}
      </div>
      <div class="site-btns">
        ${r.url ? `<a class="btn site" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">レシピを開く</a>` : ''}
      </div>
      <button class="btn small eat" data-action="eat">✅ これにした</button>
    </div>`;
}

function renderSuggestions() {
  const date = selectedDate();
  const ctx = buildContext(date);

  $('#theme').innerHTML = themeMessages(ctx).map((m) => `<p>${m}</p>`).join('');
  renderBalance($('#balance'), ctx.recentMainCounts, SUGGEST_BALANCE_LABEL);

  const scored = DISHES.map((d) => scoreDish(d, ctx));
  const byType = (t) => scored.filter((x) => x && x.dish.t === t);

  current.main = pickTop(byType('main'), 3, 2);
  current.side = pickTop(byType('side'), 2, 2);
  current.rice = pickTop(byType('rice'), 2, 2);
  current.book = book
    .map((r) => scoreBookEntry(r, ctx))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  for (const t of ['main', 'side', 'rice']) {
    $(`#list-${t}`).innerHTML = current[t].map((item, i) => dishCard(item, `${t}-${i}`)).join('');
  }
  $('#list-book').innerHTML = current.book.length
    ? current.book.map((item, i) => bookSuggestCard(item, `book-${i}`)).join('')
    : '<p class="empty">レシピ帳に登録すると、ここにも提案が出ます。</p>';
}

function addHistory(entry) {
  history.push({ id: newId(), ...entry });
  saveHistory();
  toast(`「${entry.name}」を記録しました`);
}

$('#tab-suggest').addEventListener('click', (e) => {
  const card = e.target.closest('.dish');
  if (!card) return;
  const [type, idx] = card.dataset.key.split('-');
  const item = current[type][Number(idx)];
  const date = $('#suggest-date').value;

  const siteBtn = e.target.closest('[data-site]');
  if (siteBtn) {
    openSite(siteBtn.dataset.site, card.querySelector('.kw').value);
    return;
  }
  if (e.target.closest('[data-action="eat"]')) {
    if (type === 'book') {
      const r = item.entry;
      addHistory({ date, name: r.name, g: r.g, t: r.t, source: 'book' });
    } else {
      const d = item.dish;
      addHistory({ date, name: d.n, g: d.g, t: d.t, source: 'suggest' });
    }
    renderBalance($('#balance'), countMainGroups(recentHistory(selectedDate())), SUGGEST_BALANCE_LABEL);
  }
});

$('#btn-reshuffle').addEventListener('click', () => {
  renderSuggestions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#suggest-date').addEventListener('change', renderSuggestions);

// ============================================================
// Recipe book
// ============================================================

const BOOK_GROUPS = ['meat', 'fish', 'soy', 'egg', 'veg', 'other'];

function fillGroupSelects() {
  const opts = BOOK_GROUPS.map((g) => `<option value="${g}">${GROUP_LABELS[g]}</option>`).join('');
  $('#book-filter-group').insertAdjacentHTML('beforeend', opts);
  $('#book-form-group').innerHTML = opts;
}

function renderBook() {
  const q = $('#book-search').value.trim();
  const g = $('#book-filter-group').value;
  const reaction = $('#book-filter-reaction').value;

  const list = book
    .filter((r) => !g || r.g === g)
    .filter((r) => !reaction || r.reaction === reaction)
    .filter((r) => !q || r.name.includes(q) || (r.memo || '').includes(q))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (list.length === 0) {
    $('#book-list').innerHTML = `<p class="empty">${book.length ? '条件に合うレシピがありません。' : 'まだ登録がありません。<br>気に入ったレシピのURLを登録しましょう。'}</p>`;
    return;
  }

  $('#book-list').innerHTML = list.map((r) => `
    <div class="card book-item" data-id="${r.id}">
      <div class="dish-head">
        <strong>${escapeHtml(r.name)}</strong>
        ${r.reaction ? `<span class="reaction">${escapeHtml(r.reaction)}</span>` : ''}
      </div>
      <div class="badges">
        <span class="chip g-${r.g}">${GROUP_LABELS[r.g] || ''}</span>
        <span class="badge">${TYPE_LABELS[r.t]}</span>
        ${r.time ? `<span class="badge">${escapeHtml(r.time)}分</span>` : ''}
      </div>
      ${r.memo ? `<p class="memo">${escapeHtml(r.memo)}</p>` : ''}
      <div class="row">
        ${r.url ? `<a class="btn small" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">開く</a>` : ''}
        <button class="btn small" data-action="eat">✅ 今日これにした</button>
        <span class="spacer"></span>
        <button class="btn small" data-action="edit">編集</button>
      </div>
    </div>`).join('');
}

let editingId = null;

function openBookDialog(entry) {
  editingId = entry ? entry.id : null;
  const form = $('#book-form');
  form.reset();
  $('#book-dialog-title').textContent = entry ? 'レシピを編集' : 'レシピを登録';
  $('#btn-book-delete').hidden = !entry;
  if (entry) {
    for (const key of ['name', 'url', 't', 'g', 'time', 'reaction', 'memo']) {
      form.elements[key].value = entry[key] ?? '';
    }
  }
  $('#book-dialog').showModal();
}

$('#btn-add-book').addEventListener('click', () => openBookDialog(null));
$('#btn-book-cancel').addEventListener('click', () => $('#book-dialog').close());

$('#book-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const data = {
    name: f.name.value.trim(),
    url: f.url.value.trim(),
    t: f.t.value,
    g: f.g.value,
    time: f.time.value ? Number(f.time.value) : '',
    reaction: f.reaction.value,
    memo: f.memo.value.trim(),
  };
  if (!data.name) return;

  if (editingId) {
    const idx = book.findIndex((r) => r.id === editingId);
    if (idx >= 0) book[idx] = { ...book[idx], ...data };
  } else {
    book.push({ id: newId(), createdAt: new Date().toISOString(), ...data });
  }
  saveBook();
  $('#book-dialog').close();
  renderBook();
  toast('保存しました');
});

$('#btn-book-delete').addEventListener('click', () => {
  const entry = book.find((r) => r.id === editingId);
  if (!entry || !confirm(`「${entry.name}」を削除しますか？\nこの操作は元に戻せません。`)) return;
  book = book.filter((r) => r.id !== editingId);
  saveBook();
  $('#book-dialog').close();
  renderBook();
  toast('削除しました');
});

$('#book-list').addEventListener('click', (e) => {
  const card = e.target.closest('.book-item');
  if (!card) return;
  const entry = book.find((r) => r.id === card.dataset.id);
  if (!entry) return;
  if (e.target.closest('[data-action="edit"]')) openBookDialog(entry);
  if (e.target.closest('[data-action="eat"]')) {
    addHistory({ date: toISODate(new Date()), name: entry.name, g: entry.g, t: entry.t, source: 'book' });
  }
});

['#book-search', '#book-filter-group', '#book-filter-reaction'].forEach((sel) => {
  $(sel).addEventListener('input', renderBook);
});

// ============================================================
// History
// ============================================================

function renderHistory() {
  const today = new Date();
  // Last 7 days including today.
  renderBalance($('#history-balance'), countMainGroups(recentHistory(addDays(today, 1))));

  if (history.length === 0) {
    $('#history-list').innerHTML = '<p class="empty">まだ記録がありません。<br>提案画面の「これにした」で記録できます。</p>';
    return;
  }

  const byDate = {};
  for (const h of history) (byDate[h.date] ||= []).push(h);
  const dates = Object.keys(byDate).sort().reverse();

  $('#history-list').innerHTML = dates.map((date) => `
    <div class="card">
      <h3>${formatDate(date)}</h3>
      ${byDate[date].map((h) => `
        <div class="history-row" data-id="${h.id}">
          <span class="chip g-${h.g}">${GROUP_LABELS[h.g] || ''}</span>
          <span class="history-type">${TYPE_LABELS[h.t] || ''}</span>
          <span class="history-name">${escapeHtml(h.name)}</span>
          <button class="icon-btn" data-action="delete" aria-label="削除">✕</button>
        </div>`).join('')}
    </div>`).join('');
}

$('#history-list').addEventListener('click', (e) => {
  if (!e.target.closest('[data-action="delete"]')) return;
  const id = e.target.closest('.history-row').dataset.id;
  const h = history.find((x) => x.id === id);
  if (!h || !confirm(`${formatDate(h.date)}「${h.name}」の記録を削除しますか？`)) return;
  history = history.filter((x) => x.id !== id);
  saveHistory();
  renderHistory();
});

// ============================================================
// Settings
// ============================================================

function renderSettings() {
  $('#set-time').value = String(settings.timeLimit);
  $('#set-kid').checked = settings.addKidWord;
  $('#set-timeword').checked = settings.addTimeWord;
  $('#stock-list').innerHTML = settings.stock.map((s, i) => `
    <label class="stock-item ${s.on ? 'on' : ''}">
      <input type="checkbox" data-idx="${i}" ${s.on ? 'checked' : ''}>${escapeHtml(s.name)}
    </label>`).join('');
}

$('#set-time').addEventListener('change', (e) => {
  settings.timeLimit = Number(e.target.value);
  saveSettings();
});
$('#set-kid').addEventListener('change', (e) => {
  settings.addKidWord = e.target.checked;
  saveSettings();
});
$('#set-timeword').addEventListener('change', (e) => {
  settings.addTimeWord = e.target.checked;
  saveSettings();
});

$('#stock-list').addEventListener('change', (e) => {
  const idx = Number(e.target.dataset.idx);
  settings.stock[idx].on = e.target.checked;
  saveSettings();
  e.target.closest('.stock-item').classList.toggle('on', e.target.checked);
});

$('#btn-stock-add').addEventListener('click', () => {
  const input = $('#stock-new');
  const name = input.value.trim();
  if (!name) return;
  if (settings.stock.some((s) => s.name === name)) {
    toast('すでに登録されています');
    return;
  }
  settings.stock.push({ name, on: true });
  saveSettings();
  input.value = '';
  renderSettings();
});

// ---------- Backup ----------

$('#btn-export').addEventListener('click', async () => {
  const payload = { app: 'kondate', version: 1, exportedAt: new Date().toISOString(), settings, book, history };
  const name = `kondate-backup-${toISODate(new Date()).replace(/-/g, '')}.json`;
  const file = new File([JSON.stringify(payload, null, 2)], name, { type: 'application/json' });

  // On iPhone, the share sheet lets the user save to Files / AirDrop.
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
    } catch (e) {
      // User cancelled the share sheet.
    }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'kondate' || !Array.isArray(data.book) || !Array.isArray(data.history)) {
      throw new Error('invalid');
    }
    if (!confirm('現在のレシピ帳・履歴・設定を、読み込んだデータで上書きします。よろしいですか？')) return;
    settings = { ...defaultSettings(), ...data.settings };
    book = data.book;
    history = data.history;
    saveSettings();
    saveBook();
    saveHistory();
    renderSettings();
    toast('読み込みました');
  } catch (err) {
    toast('読み込めませんでした（ファイルを確認してください）');
  }
});

// ============================================================
// Tabs
// ============================================================

const TAB_TITLES = { suggest: '今日の提案', book: 'レシピ帳', history: '履歴', settings: '設定' };
const TAB_RENDER = { suggest: renderSuggestions, book: renderBook, history: renderHistory, settings: renderSettings };

document.querySelectorAll('.tabbar button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('active', s.id === `tab-${tab}`));
    $('#page-title').textContent = TAB_TITLES[tab];
    TAB_RENDER[tab]();
    window.scrollTo(0, 0);
  });
});

// ============================================================
// Init
// ============================================================

fillGroupSelects();
$('#suggest-date').value = toISODate(new Date());
renderSuggestions();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
