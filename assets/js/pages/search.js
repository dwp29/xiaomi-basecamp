/**
 * search.js — Xiaomi Basecamp v1.0
 * Cross-content search: devices, ROMs, tools, tutorials simultaneously
 */
'use strict';

(async function SearchPageInit() {
  Navbar.init('nav-root');

  const $ = id => document.getElementById(id);
  const searchInput  = $('main-search');
  const btnClear     = $('btn-clear');
  const statsEl      = $('search-stats');
  const resultsEl    = $('results-container');
  const initialState = $('initial-state');

  let allData = { devices: [], roms: [], tools: [], tutorials: [] };
  let activeType = 'all';
  let lastQuery  = '';
  let lastResults = { devices: [], roms: [], tools: [], tutorials: [] };

  /* ── TYPE ICONS & COLORS ─────────────────────────────────── */
  const TYPE_META = {
    devices:   { icon: '📱', color: '#00ffe0', label: 'Device',   url: id => `/device-detail.html?id=${id}` },
    roms:      { icon: '💿', color: '#b800ff', label: 'ROM',      url: id => `/rom-detail.html?id=${id}` },
    tools:     { icon: '🔧', color: '#ffa500', label: 'Tool',     url: id => `/tools.html#${id}` },
    tutorials: { icon: '📖', color: '#29ff5a', label: 'Tutorial', url: id => `/tutorial-detail.html?id=${id}` },
  };

  /* ── SIMPLE FUZZY SEARCH ─────────────────────────────────── */
  function simpleSearch(items, q) {
    const lower = q.toLowerCase().trim();
    if (!lower) return [];
    const terms = lower.split(/\s+/);
    return items.filter(item => {
      const blob = (item.search_blob || item.name || item.title || '').toLowerCase();
      return terms.every(t => blob.includes(t));
    });
  }

  /* ── HIGHLIGHT MATCH ─────────────────────────────────────── */
  function highlight(text, q) {
    if (!q || !text) return escHtml(text || '');
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let result = escHtml(text);
    terms.forEach(term => {
      const re = new RegExp(`(${escRe(term)})`, 'gi');
      result = result.replace(re, '<mark class="se-match">$1</mark>');
    });
    return result;
  }
  const escHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const escRe   = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* ── RENDER RESULT CARD ──────────────────────────────────── */
  function renderCard(item, type, q) {
    const meta  = TYPE_META[type];
    const name  = item.name || item.title || '';
    const sub   = [item.codename, item.chipset, item.category, item.difficulty].filter(Boolean).join(' · ');
    const url   = meta.url(item.id || item.slug);
    return `
      <a href="${url}" class="sr-card reveal" aria-label="${name}">
        <div class="sr-card-icon" style="background:${meta.color}15;border:1px solid ${meta.color}25" aria-hidden="true">
          ${item.logo || item.thumbnail ? `<img src="${item.logo||item.thumbnail}" style="width:32px;height:32px;object-fit:contain;border-radius:6px" loading="lazy" onerror="this.parentElement.textContent='${meta.icon}'" alt="">` : meta.icon}
        </div>
        <div class="sr-card-body">
          <div class="sr-card-title">${highlight(name, q)}</div>
          ${sub ? `<div class="sr-card-sub">${sub}</div>` : ''}
        </div>
        <span class="sr-card-badge" style="border-color:${meta.color}25;color:${meta.color}">${meta.label}</span>
        <span class="sr-card-arrow" aria-hidden="true">›</span>
      </a>`;
  }

  /* ── UPDATE TAB COUNTS ───────────────────────────────────── */
  function updateCounts(results) {
    const total = Object.values(results).reduce((s, a) => s + a.length, 0);
    $('tc-all')?.     (() => {})(); // noop — set below
    const tc = (id, n) => { const el = $(id); if (el) el.textContent = n > 0 ? n : ''; };
    tc('tc-all',       total);
    tc('tc-devices',   results.devices.length);
    tc('tc-roms',      results.roms.length);
    tc('tc-tools',     results.tools.length);
    tc('tc-tutorials', results.tutorials.length);
  }

  /* ── RENDER RESULTS ──────────────────────────────────────── */
  function renderResults(results, q) {
    const t0 = performance.now();
    lastResults = results;
    updateCounts(results);

    const types = activeType === 'all'
      ? Object.keys(TYPE_META)
      : [activeType];

    const total = types.reduce((s, t) => s + results[t].length, 0);

    if (initialState) initialState.hidden = true;

    if (total === 0) {
      resultsEl.innerHTML = `
        <div class="sr-empty">
          <div class="sr-empty-icon">😶</div>
          <h2 class="sr-empty-title">Tidak ditemukan</h2>
          <p class="sr-empty-sub">Tidak ada hasil untuk "<strong style="color:var(--acid)">${escHtml(q)}</strong>"</p>
          <div class="sr-suggestions">
            <button class="sr-suggestion" data-q="poco">POCO</button>
            <button class="sr-suggestion" data-q="magisk">Magisk</button>
            <button class="sr-suggestion" data-q="twrp">TWRP</button>
          </div>
        </div>`;
      bindSuggestions();
      if (statsEl) statsEl.textContent = '';
      return;
    }

    const elapsed = Math.round(performance.now() - t0);
    if (statsEl) statsEl.innerHTML = `Ditemukan <strong>${total}</strong> hasil untuk "<strong>${escHtml(q)}</strong>" dalam ${elapsed}ms`;

    let html = '';
    types.forEach(type => {
      const items = results[type];
      if (!items.length) return;
      const meta = TYPE_META[type];
      html += `
        <div class="sr-group" id="group-${type}">
          <div class="sr-group-header">
            <span class="sr-group-title">${meta.icon} ${type}</span>
            <span class="sr-group-count">${items.length} hasil</span>
          </div>
          ${items.slice(0, 8).map(item => renderCard(item, type, q)).join('')}
          ${items.length > 8 ? `<p style="font-family:'DM Mono',monospace;font-size:.65rem;color:var(--t3);padding:8px 16px">+${items.length - 8} hasil lainnya — <a href="/${type}.html?q=${encodeURIComponent(q)}" style="color:var(--acid)">lihat semua →</a></p>` : ''}
        </div>`;
    });
    resultsEl.innerHTML = html;

    // Animate results
    resultsEl.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--stagger-delay', i * 30 + 'ms');
      setTimeout(() => el.classList.add('is-visible'), i * 30);
    });
    bindSuggestions();
  }

  /* ── DO SEARCH ───────────────────────────────────────────── */
  function doSearch(q) {
    lastQuery = q;
    if (!q.trim()) {
      resultsEl.innerHTML = '';
      if (initialState) initialState.hidden = false;
      if (statsEl) statsEl.textContent = '';
      updateCounts({ devices: [], roms: [], tools: [], tutorials: [] });
      return;
    }
    const results = {
      devices:   simpleSearch(allData.devices,   q),
      roms:      simpleSearch(allData.roms,      q),
      tools:     simpleSearch(allData.tools,     q),
      tutorials: simpleSearch(allData.tutorials, q),
    };
    renderResults(results, q);
    if (typeof Router !== 'undefined') Router.setParam('q', q);
  }

  /* ── SUGGESTIONS ─────────────────────────────────────────── */
  function bindSuggestions() {
    document.querySelectorAll('.sr-suggestion[data-q]').forEach(btn => {
      btn.addEventListener('click', () => {
        searchInput.value = btn.dataset.q;
        btnClear?.classList.add('visible');
        doSearch(btn.dataset.q);
      });
    });
  }

  /* ── TYPE TABS ───────────────────────────────────────────── */
  document.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type;
      document.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type === activeType));
      if (lastQuery) doSearch(lastQuery);
    });
  });

  /* ── INPUT ───────────────────────────────────────────────── */
  let debTimer;
  searchInput?.addEventListener('input', e => {
    const q = e.target.value;
    btnClear?.classList.toggle('visible', q.length > 0);
    clearTimeout(debTimer);
    debTimer = setTimeout(() => doSearch(q), 250);
  });
  btnClear?.addEventListener('click', () => {
    searchInput.value = ''; btnClear.classList.remove('visible');
    doSearch('');
    if (typeof Router !== 'undefined') Router.removeParam('q');
  });
  bindSuggestions();

  /* ── LOAD ALL DATA ───────────────────────────────────────── */
  try {
    const [devices, roms, tools, tutorials] = await Promise.all([
      DataLoader.getDevices().catch(() => []),
      DataLoader.getRoms().catch(() => []),
      DataLoader.getTools().catch(() => []),
      DataLoader.getTutorials().catch(() => []),
    ]);

    // Add search_blob to all items
    const addBlob = (items, type) => items.map(item => ({
      ...item,
      search_blob: [
        item.name, item.title, item.codename, item.series, item.brand,
        item.chipset, item.category, item.developer, item.description,
        ...(item.tags || []), ...(item.features || [])
      ].filter(Boolean).join(' ').toLowerCase(),
    }));

    allData.devices   = addBlob(devices, 'devices');
    allData.roms      = addBlob(roms, 'roms');
    allData.tools     = addBlob(tools, 'tools');
    allData.tutorials = addBlob(tutorials, 'tutorials');

    // Restore from URL
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { searchInput.value = q; btnClear?.classList.add('visible'); doSearch(q); }
    searchInput?.focus();

  } catch(err) {
    console.error('[search.js]', err);
  }
})();
