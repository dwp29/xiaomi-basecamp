/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  roms.js — Xiaomi Basecamp Page Logic v1.0                     ║
 * ║  ROM Browser: filter, search, sort, tabs, paginate             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

'use strict';

(async function RomsPageInit() {

  Navbar.init('nav-root');

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const grid         = $('rom-grid');
  const searchInput  = $('search-input');
  const btnClear     = $('btn-clear-search');
  const shownCount   = $('shown-count');
  const totalBar     = $('total-count-bar');
  const afRow        = $('af-row');
  const btnLoadMore  = $('btn-load-more');
  const sortBtn      = $('btn-sort');
  const sortDd       = $('sort-dd');
  const sortLabel    = $('sort-label');
  const filterBadge  = $('filter-badge');

  let allRoms   = [];
  let activeTab = 'all';
  let activeSort = 'rating';

  /* ── SORT ────────────────────────────────────────────────── */
  const SORT_MAP = {
    rating:       { label: 'Rating',          fn: (a, b) => avgRating(b.ratings) - avgRating(a.ratings) },
    latest:       { label: 'Latest',          fn: (a, b) => new Date(b.updated_at||0) - new Date(a.updated_at||0) },
    name_az:      { label: 'Name A–Z',        fn: (a, b) => a.name.localeCompare(b.name) },
    android_desc: { label: 'Android Version', fn: (a, b) => parseInt(b.android_version||0) - parseInt(a.android_version||0) },
  };

  function avgRating(r = {}) {
    const v = Object.values(r).filter(n => typeof n === 'number');
    return v.length ? v.reduce((s,n) => s+n, 0) / v.length : 0;
  }

  function sortRoms(roms) {
    return [...roms].sort(SORT_MAP[activeSort]?.fn || SORT_MAP.rating.fn);
  }

  /* ── FILTER ENGINE ───────────────────────────────────────── */
  const FE = {
    _dims: {},
    define(key, opts) {
      this._dims[key] = { type: opts.type||'multi', field: opts.field||key, label: opts.label||key, value: (opts.type==='multi'||opts.type==='multi_any') ? [] : null };
      return this;
    },
    toggle(key, val) {
      const d = this._dims[key]; if (!d) return;
      const arr = Array.isArray(d.value) ? [...d.value] : [];
      const idx = arr.indexOf(val);
      if (idx === -1) arr.push(val); else arr.splice(idx, 1);
      d.value = arr;
    },
    set(key, val) { if (this._dims[key]) this._dims[key].value = val; },
    clear(key) { if (this._dims[key]) this._dims[key].value = Array.isArray(this._dims[key].value) ? [] : null; },
    clearAll() { Object.values(this._dims).forEach(d => { d.value = Array.isArray(d.value) ? [] : null; }); },
    apply(items) {
      return items.filter(item => Object.entries(this._dims).every(([, d]) => {
        if (!d.value || (Array.isArray(d.value) && !d.value.length)) return true;
        const val = item[d.field];
        if (d.type === 'multi') return d.value.includes(val);
        if (d.type === 'multi_any') {
          const arr = Array.isArray(val) ? val : [val];
          return d.value.some(v => arr.includes(v));
        }
        if (d.type === 'boolean') return !!val === !!d.value;
        return true;
      }));
    },
    getActive() {
      const out = [];
      Object.entries(this._dims).forEach(([key, d]) => {
        if (!d.value || (Array.isArray(d.value) && !d.value.length)) return;
        if (Array.isArray(d.value)) d.value.forEach(v => out.push({ key, label: d.label, value: v, displayValue: String(v) }));
        else out.push({ key, label: d.label, value: d.value, displayValue: d.label });
      });
      return out;
    },
  };

  FE.define('type',         { type: 'multi',     field: 'type',       label: 'Type' })
    .define('android_version', { type: 'multi',  field: 'android_version', label: 'Android' })
    .define('status',       { type: 'multi',     field: 'status',     label: 'Status' })
    .define('maintained',   { type: 'boolean',   field: 'maintained', label: 'Maintained' })
    .define('tags',         { type: 'multi_any', field: 'tags',       label: 'Tag' });

  /* ── PAGINATOR ───────────────────────────────────────────── */
  let PG = null;
  if (typeof Paginator !== 'undefined') {
    PG = Paginator.create({
      container: grid,
      renderItem: rom => RomCard.render(rom).outerHTML,
      pageSize: 12,
      mode: 'button',
      onPageLoad: ({ shown, total, hasMore }) => {
        if (shownCount) shownCount.textContent = shown;
        if (btnLoadMore) btnLoadMore.hidden = !hasMore;
      },
    });
    if (btnLoadMore) PG.bindLoadMore(btnLoadMore);
  }

  /* ── SEARCH ──────────────────────────────────────────────── */
  let SE = null;
  if (typeof SearchEngine !== 'undefined') {
    SE = SearchEngine.create({
      onResults: results => {
        const filtered = applyTabAndFilter(results);
        renderPage(sortRoms(filtered));
      },
      onEmpty: () => {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔍</div><p class="empty-state__title">ROM tidak ditemukan</p></div>`;
        if (shownCount) shownCount.textContent = '0';
      },
    });
  }

  /* ── RENDER ──────────────────────────────────────────────── */
  function applyTabAndFilter(roms) {
    let result = roms;
    if (activeTab !== 'all') result = result.filter(r => r.type === activeTab);
    return FE.apply(result);
  }

  function renderPage(roms) {
    if (totalBar) totalBar.textContent = roms.length;
    if (PG) {
      PG.reset(roms);
    } else {
      RomCard.renderGrid(grid, roms);
      if (shownCount) shownCount.textContent = roms.length;
    }
    updateActiveChips();
  }

  function applyAll() {
    const base = (SE && SE.isActive && SE.isActive()) ? (SE.getResults ? SE.getResults() : allRoms) : allRoms;
    const filtered = applyTabAndFilter(base);
    renderPage(sortRoms(filtered));
  }

  /* ── ACTIVE FILTER CHIPS ─────────────────────────────────── */
  function updateActiveChips() {
    if (!afRow) return;
    const active = FE.getActive();
    const q = searchInput?.value.trim();
    let html = '';
    active.forEach(f => {
      html += `<span class="af-tag">
        ${f.label}: ${f.displayValue}
        <button onclick="window._romRemoveFilter('${f.key}','${f.value}')">✕</button>
      </span>`;
    });
    if (q) html += `<span class="af-tag">Search: "${q}" <button onclick="window._romClearSearch()">✕</button></span>`;
    if (active.length || q) html += `<button class="af-clear" onclick="window._romResetAll()">✕ Clear All</button>`;
    afRow.innerHTML = html;
    const count = active.length;
    if (filterBadge) { filterBadge.textContent = count > 0 ? ` (${count})` : ''; filterBadge.style.display = count > 0 ? 'inline' : 'none'; }
  }

  window._romRemoveFilter = (key, val) => {
    document.querySelector(`[data-filter="${key}"][data-value="${val}"]`)?.classList.remove('active');
    FE.toggle(key, val); applyAll();
  };
  window._romClearSearch = () => {
    if (searchInput) { searchInput.value = ''; btnClear?.classList.remove('visible'); }
    SE?.reset(); applyAll();
  };
  window._romResetAll = () => {
    if (searchInput) { searchInput.value = ''; btnClear?.classList.remove('visible'); }
    SE?.reset(); FE.clearAll();
    $$('[data-filter]').forEach(el => { el.classList.remove('active'); el.setAttribute('aria-checked','false'); });
    applyAll();
  };

  /* ── TABS ────────────────────────────────────────────────── */
  $$('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      $$('[data-tab]').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === activeTab);
        b.setAttribute('aria-selected', String(b.dataset.tab === activeTab));
      });
      applyAll();
      if (typeof Router !== 'undefined') Router.setParam('type', activeTab === 'all' ? null : activeTab);
    });
  });

  /* ── FILTER OPTIONS ──────────────────────────────────────── */
  $$('[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      const key  = el.dataset.filter;
      const val  = el.dataset.value;
      const type = el.dataset.type || 'multi';
      if (type === 'boolean') {
        const was = el.classList.contains('active');
        el.classList.toggle('active', !was);
        el.setAttribute('aria-checked', String(!was));
        FE.set(key, was ? null : true);
      } else {
        el.classList.toggle('active');
        el.setAttribute('aria-checked', String(el.classList.contains('active')));
        FE.toggle(key, val);
      }
      applyAll();
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  /* ── ACCORDION ───────────────────────────────────────────── */
  $$('.fg-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = document.getElementById(btn.getAttribute('aria-controls'));
      const arrow = btn.querySelector('.fg-arrow');
      const open = body?.classList.toggle('open');
      arrow?.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ── SORT ────────────────────────────────────────────────── */
  sortBtn?.addEventListener('click', () => {
    const open = sortDd?.classList.toggle('open');
    sortBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (sortBtn && !sortBtn.contains(e.target) && sortDd && !sortDd.contains(e.target)) {
      sortDd?.classList.remove('open');
      sortBtn.setAttribute('aria-expanded', 'false');
    }
  });
  $$('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSort = btn.dataset.sort;
      if (sortLabel) sortLabel.textContent = SORT_MAP[activeSort]?.label || activeSort;
      $$('[data-sort]').forEach(b => b.classList.toggle('active', b.dataset.sort === activeSort));
      sortDd?.classList.remove('open');
      sortBtn?.setAttribute('aria-expanded', 'false');
      applyAll();
    });
  });

  /* ── SEARCH ──────────────────────────────────────────────── */
  let debTimer;
  searchInput?.addEventListener('input', e => {
    const q = e.target.value;
    btnClear?.classList.toggle('visible', q.length > 0);
    clearTimeout(debTimer);
    debTimer = setTimeout(() => {
      if (SE) { if (q.trim()) SE.query(q); else { SE.reset(); applyAll(); } }
      else applyAll();
    }, 200);
  });
  btnClear?.addEventListener('click', () => { searchInput.value = ''; btnClear.classList.remove('visible'); SE?.reset(); applyAll(); });

  /* ── MOBILE FILTER ───────────────────────────────────────── */
  $('btn-open-filter')?.addEventListener('click', () => { $('filter-sidebar')?.classList.add('open'); $('filter-overlay')?.classList.add('open'); });
  $('filter-overlay')?.addEventListener('click', () => { $('filter-sidebar')?.classList.remove('open'); $('filter-overlay')?.classList.remove('open'); });
  $('btn-reset-filter')?.addEventListener('click', () => window._romResetAll());

  /* ── URL RESTORE ─────────────────────────────────────────── */
  function restoreFromUrl() {
    if (typeof Router === 'undefined') return;
    const p = Router.getParams();
    if (p.type && p.type !== 'all') {
      activeTab = p.type;
      document.querySelector(`[data-tab="${p.type}"]`)?.click();
    }
    if (p.q && searchInput) {
      searchInput.value = p.q;
      btnClear?.classList.add('visible');
      SE?.query(p.q);
    }
  }

  /* ── MAIN INIT ───────────────────────────────────────────── */
  RomCard.renderSkeleton(9).forEach(s => grid.appendChild(s));

  try {
    allRoms = await DataLoader.getRoms();
    if ($('total-rom-count')) $('total-rom-count').textContent = allRoms.length;
    if (totalBar) totalBar.textContent = allRoms.length;
    SE?.load(allRoms);
    restoreFromUrl();
    renderPage(sortRoms(applyTabAndFilter(allRoms)));
  } catch (err) {
    console.error('[roms.js] Failed to load ROMs:', err);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">⚠</div><p class="empty-state__title">Gagal memuat ROM</p><p class="empty-state__text">Refresh halaman dan coba lagi.</p></div>`;
  }

})();
