'use strict';

const NEWS_URL = 'data/news.json';
const VERSION_URL = 'data/version.json';
const POLL_MS = 60 * 1000;

const $ = id => document.getElementById(id);

const state = {
  generatedAt: null,
  items: [],
  seen: new Set(),
  cat: '全部',
  timer: null,
  pendingVersion: null,
  dismissedVersion: null,
};

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const bust = url => url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();

function relTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function card(it) {
  return `<article class="card">
    <div>
      ${it.source ? `<span class="badge">${esc(it.source)}</span>` : ''}
      ${it.cat ? `<span class="badge">${esc(it.cat)}</span>` : ''}
    </div>
    <h2><a href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h2>
    ${it.summary ? `<p>${esc(it.summary)}</p>` : ''}
    ${it.publishedAt ? `<div class="time">${esc(relTime(it.publishedAt))}</div>` : ''}
  </article>`;
}

function renderChips() {
  const cats = ['全部', ...new Set(state.items.map(i => i.cat).filter(Boolean))];
  if (!cats.includes(state.cat)) state.cat = '全部';
  $('chips').innerHTML = cats.map(c =>
    `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === state.cat}">${esc(c)}</button>`
  ).join('');
}

function render() {
  const list = state.items.filter(i => state.cat === '全部' || i.cat === state.cat);
  const when = state.generatedAt
    ? new Date(state.generatedAt).toLocaleString('zh-CN', { hour12: false })
    : '未知';
  $('stamp').textContent = `更新于 ${when} · 共 ${state.items.length} 条 · 每 60 秒自动检查新消息`;
  $('list').innerHTML = list.length
    ? list.map(card).join('')
    : '<p class="empty">这个分类下暂时没有内容。</p>';
}

function applyPayload(payload) {
  state.generatedAt = payload.generatedAt || null;
  state.items = Array.isArray(payload.items) ? payload.items : [];
  state.items.forEach(it => state.seen.add(it.id || it.link));
  renderChips();
  render();
}

function showBar(count, version) {
  if (state.dismissedVersion === version) return;
  $('newbar-text').textContent = count === 1 ? '有 1 条新消息' : `有 ${count} 条新消息`;
  $('newbar').hidden = false;
  document.title = `(${count}) 有新消息 · 今日新闻`;
}

function hideBar() {
  $('newbar').hidden = true;
  state.pendingVersion = null;
  document.title = '今日新闻';
}

async function fetchAndApply() {
  const res = await fetch(bust(NEWS_URL), { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  applyPayload(await res.json());
  hideBar();
}

async function poll() {
  if (document.hidden) return;
  try {
    const res = await fetch(bust(VERSION_URL), { cache: 'no-store' });
    if (!res.ok) return;
    const v = await res.json();
    if (!v.generatedAt || v.generatedAt === state.generatedAt) return;
    if (v.generatedAt === state.pendingVersion) return;

    const nres = await fetch(bust(NEWS_URL), { cache: 'no-store' });
    if (!nres.ok) return;
    const payload = await nres.json();

    const fresh = (payload.items || [])
      .filter(it => !state.seen.has(it.id || it.link));

    if (!fresh.length) {
      state.generatedAt = payload.generatedAt;
      return;
    }
    state.pendingVersion = payload.generatedAt;
    showBar(fresh.length, payload.generatedAt);
  } catch (_) {
    // 离线或服务器异常：忽略，下一轮再试
  }
}

function startPolling() {
  stopPolling();
  state.timer = setInterval(poll, POLL_MS);
}

function stopPolling() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

$('chips').addEventListener('click', e => {
  const b = e.target.closest('button[data-cat]');
  if (!b) return;
  state.cat = b.dataset.cat;
  renderChips();
  render();
});

$('newbar-reload').addEventListener('click', () => location.reload());

$('newbar-later').addEventListener('click', () => {
  state.dismissedVersion = state.pendingVersion;
  hideBar();
});

$('reload').addEventListener('click', () => {
  fetchAndApply().catch(err => {
    $('stamp').textContent = '加载失败：' + err.message;
  });
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPolling();
  else { poll(); startPolling(); }
});

window.addEventListener('online', poll);

(async function boot() {
  try {
    await fetchAndApply();
  } catch (err) {
    $('stamp').textContent = '加载失败：' + err.message + '（先用本地服务器打开，见说明）';
    $('list').innerHTML = '<p class="empty">没能读到 data/news.json。</p>';
  }
  startPolling();
})();
