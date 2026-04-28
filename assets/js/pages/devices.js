/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  devices.js — Xiaomi Basecamp Page Logic v1.0                  ║
 * ║  Device Center: filter, search, sort, paginate, compare        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  DEPENDS ON (loaded before this):
 *    vendor: filter-engine.js, search-engine.js, paginator.js
 *    core:   dataTransformer.js, dataLoader.js, state.js, router.js
 *    comp:   navbar.js, deviceCard.js
 *
 *  HTML IDs expected in devices.html:
 *    #nav-root, #filter-sidebar, #filter-overlay
 *    #search-input, #btn-clear-search
 *    #btn-sort, #sort-dd, #sort-label
 *    #btn-grid-view, #btn-list-view
 *    #af-row, #shown-count, #total-count-bar, #search-time
 *    #device-grid, #btn-load-more, #progress-fill, #progress-txt
 *    #compare-bar, #compare-count, #btn-do-compare, #btn-clear-compare
 *    #btn-open-filter, #btn-reset-filter, #filter-active-count
 *    [data-filter] — sidebar filter option elements
 */

'use strict';

(async function DevicesPageInit() {

  /* ── NAVBAR ─────────────────────────────────────────────── */
  Navbar.init('nav-root');

  /* ── DOM REFS ────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const grid          = $('device-grid');
  const searchInput   = $('search-input');
  const btnClearSearch = $('btn-clear-search');
  const shownCount    = $('shown-count');
  const totalCountBar = $('total-count-bar');
  const searchTime    = $('search-time');
  const afRow         = $('af-row');
  const btnLoadMore   = $('btn-load-more');
  const progressFill  = $('progress-fill');
  const progressTxt   = $('progress-txt');
  const compareBar    = $('compare-bar');
  const compareCountEl = $('compare-count');
  const btnSort       = $('btn-sort');
  const sortDd        = $('sort-dd');
  const sortLabel     = $('sort-label');
  const filterActiveCount = $('filter-active-count');

  /* ── STATE ───────────────────────────────────────────────── */
  let allDevices   = [];   // Full normalized dataset
  let activeSort   = 'modding_score';
  let isListView   = false;
  let _startTime   = 0;

  /* ── SORT FUNCTIONS ──────────────────────────────────────── */
  const SORT_MAP = {
    modding_score: { label: 'Modding Score', fn: (a, b) => (b.modding_score || 0) - (a.modding_score || 0) },
    name_az:       { label: 'Name A–Z',      fn: (a, b) => a.name.localeCompare(b.name, 'id') },
    year_new:      { label: 'Year Newest',   fn: (a, b) => (b.year || 0) - (a.year || 0) },
    ram_high:      { label: 'RAM Highest',   fn: (a, b) => Math.max(...(b.ram || [0])) - Math.max(...(a.ram || [0])) },
    camera_high:   { label: 'Camera MP',     fn: (a, b) => (b.camera_main || 0) - (a.camera_main || 0) },
  };

  function sortDevices(devices) {
    const sortFn = SORT_MAP[activeSort]?.fn || SORT_MAP.modding_score.fn;
    return [...devices].sort(sortFn);
  }

  /* ── FILTER ENGINE SETUP ─────────────────────────────────── */
  // Use the vendor FilterEngine if available, otherwise fallback
  let FE;
  if (typeof FilterEngine !== 'undefined') {
    FE = FilterEngine.create();
  } else {
    // Simple inline fallback
    FE = createInlineFilterEngine();
  }

  FE
    .define('brand',        { type: 'multi',     field: 'brand',        label: 'Brand' })
    .define('series',       { type: 'multi',     field: 'series',       label: 'Series',
      // Extract first word from series string for matching
      transform: v => v.split(' ')[0] })
    .define('chipset_brand',{ type: 'multi',     field: 'chipset_brand',label: 'Chipset' })
    .define('android_version',{ type: 'range_min', field: 'android_version', label: 'Android' })
    .define('ram',          { type: 'multi_any', field: 'ram',          label: 'RAM',
      transform: v => parseInt(v, 10) })
    .define('fiveg',        { type: 'boolean',   field: 'fiveg',        label: '5G' })
    .define('nfc',          { type: 'boolean',   field: 'nfc',          label: 'NFC' })
    .define('has_hyperos',  { type: 'boolean',   field: 'has_hyperos',  label: 'HyperOS' })
    .define('bootloader_unlockable', { type: 'boolean', field: 'bootloader_unlockable', label: 'UBL' })
    .define('status',       { type: 'multi',     field: 'status',       label: 'Status' });

  /* ── SEARCH ENGINE SETUP ─────────────────────────────────── */
  let SE;
  if (typeof SearchEngine !== 'undefined') {
    SE = SearchEngine.create({
      onResults: (results) => {
        const filtered = FE.apply(results);
        renderPage(sortDevices(filtered));
      },
      onEmpty: () => {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state__icon">🔍</div>
            <p class="empty-state__title">Tidak ditemukan</p>
            <p class="empty-state__text">Coba kata kunci lain atau <button onclick="resetAll()" style="color:var(--acid);background:none;border:none;cursor:pointer">reset filter</button></p>
          </div>`;
        updateResultsBar(0);
      },
    });
  }

  /* ── PAGINATOR SETUP ─────────────────────────────────────── */
  let PG;
  if (typeof Paginator !== 'undefined') {
    PG = Paginator.create({
      container:  grid,
      renderItem: device => {
        const card = DeviceCard.render(device, { showCompare: true });
        return card.outerHTML;
      },
      pageSize: 24,
      mode: 'button',
      onPageLoad: ({ shown, total, hasMore }) => {
        updateResultsBar(total, shown);
        if (btnLoadMore) btnLoadMore.hidden = !hasMore;
        updateProgress(shown, total);
        // Re-attach compare button events after Paginator renders HTML
        bindCompareButtons();
      },
    });
    if (btnLoadMore) PG.bindLoadMore(btnLoadMore);
  }

  /* ── RENDER PAGE (master render fn) ─────────────────────── */
  function renderPage(devices) {
    _startTime = _startTime || performance.now();

    if (PG) {
      PG.reset(devices);
    } else {
      // Fallback: direct render
      DeviceCard.renderGrid(grid, devices, { showCompare: true });
      updateResultsBar(devices.length, devices.length);
    }

    const elapsed = Math.round(performance.now() - _startTime);
    if (searchTime) searchTime.textContent = `${elapsed}ms`;
    _startTime = 0;

    updateActiveFilterTags();
    updateFilterSidebarCounts();
    State.dispatch('SET_FILTERED_DEVICES', devices);
  }

  /* ── RESULTS BAR ─────────────────────────────────────────── */
  function updateResultsBar(total, shown = total) {
    if (shownCount)    shownCount.textContent    = shown.toLocaleString('id-ID');
    if (totalCountBar) totalCountBar.textContent = total.toLocaleString('id-ID');
  }

  function updateProgress(shown, total) {
    if (!progressFill || !progressTxt) return;
    const pct = total > 0 ? Math.round((shown / total) * 100) : 100;
    progressFill.style.width = pct + '%';
    progressTxt.textContent  = `${shown} / ${total}`;
    const pw = $('progress-wrap');
    if (pw) pw.style.display = shown >= total ? 'none' : 'flex';
  }

  /* ── ACTIVE FILTER CHIPS ─────────────────────────────────── */
  function updateActiveFilterTags() {
    if (!afRow) return;
    const active = FE.getActive ? FE.getActive() : [];
    const searchQ = searchInput?.value.trim();

    let html = '';
    active.forEach(f => {
      html += `<span class="af-tag" data-filter-key="${f.key}" data-filter-val="${f.value}">
        ${f.label}: ${f.displayValue}
        <button aria-label="Remove filter ${f.label}" onclick="removeFilter('${f.key}','${f.value}')">✕</button>
      </span>`;
    });
    if (searchQ) {
      html += `<span class="af-tag">
        Search: "${searchQ}"
        <button aria-label="Clear search" onclick="clearSearch()">✕</button>
      </span>`;
    }
    if (active.length > 0 || searchQ) {
      html += `<button class="af-clear" onclick="resetAll()">✕ Clear All</button>`;
    }
    afRow.innerHTML = html;

    // Update mobile filter badge
    const count = active.length;
    if (filterActiveCount) {
      filterActiveCount.textContent = count > 0 ? ` (${count})` : '';
      filterActiveCount.style.display = count > 0 ? 'inline' : 'none';
    }
  }

  window.removeFilter = function(key, value) {
    const filterEl = document.querySelector(`[data-filter="${key}"][data-value="${value}"]`);
    if (filterEl) filterEl.classList.remove('active');
    if (FE.toggle) FE.toggle(key, value);
    else if (FE.clear) FE.clear(key);
    applyFilters();
  };

  window.clearSearch = function() {
    if (searchInput) { searchInput.value = ''; btnClearSearch?.classList.remove('visible'); }
    if (SE) SE.reset();
    applyFilters();
  };

  window.resetAll = function() {
    if (searchInput) { searchInput.value = ''; btnClearSearch?.classList.remove('visible'); }
    if (SE) SE.reset();
    if (FE.clearAll) FE.clearAll();
    $$('[data-filter]').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-checked', 'false');
    });
    applyFilters();
  };

  /* ── FILTER SIDEBAR COUNTS ───────────────────────────────── */
  function updateFilterSidebarCounts() {
    if (!FE.computeCounts) return;
    ['series', 'chipset_brand', 'status'].forEach(key => {
      const counts = FE.computeCounts(allDevices, key);
      counts.forEach((cnt, val) => {
        const el = document.querySelector(`[data-count="${key.replace('_brand','')}-${val}"]`);
        if (el) el.textContent = cnt;
      });
    });
  }

  /* ── APPLY FILTERS + SEARCH ──────────────────────────────── */
  function applyFilters() {
    _startTime = performance.now();
    let base = allDevices;

    // Apply search filter
    if (SE && SE.isActive && SE.isActive()) {
      base = SE.getResults ? SE.getResults() : allDevices;
    }

    // Apply dimension filters
    const filtered = FE.apply ? FE.apply(base) : base;
    renderPage(sortDevices(filtered));
  }

  /* ── FILTER SIDEBAR INTERACTIONS ────────────────────────── */
  function bindFilterOptions() {
    $$('[data-filter]').forEach(el => {
      el.addEventListener('click', () => toggleFilterOption(el));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFilterOption(el); }
      });
    });
  }

  function toggleFilterOption(el) {
    const key   = el.dataset.filter;
    const value = el.dataset.value;
    const type  = el.dataset.type || 'multi';

    if (type === 'boolean') {
      // Toggle boolean — if already active, clear it
      const wasActive = el.classList.contains('active');
      el.classList.toggle('active', !wasActive);
      el.setAttribute('aria-checked', String(!wasActive));
      FE.set(key, wasActive ? null : true);

    } else if (type === 'range_min') {
      // Radio behavior — only one active at a time
      $$(`[data-filter="${key}"]`).forEach(o => {
        o.classList.remove('active');
        o.setAttribute('aria-checked', 'false');
      });
      const wasActive = el.dataset.wasActive === 'true';
      if (!wasActive) {
        el.classList.add('active');
        el.setAttribute('aria-checked', 'true');
        el.dataset.wasActive = 'true';
        FE.set(key, parseInt(value, 10));
      } else {
        el.dataset.wasActive = 'false';
        FE.set(key, null);
      }

    } else {
      // multi / multi_any — toggle individual value
      const nowActive = el.classList.toggle('active');
      el.setAttribute('aria-checked', String(nowActive));
      if (FE.toggle) FE.toggle(key, type === 'multi_any' ? parseInt(value, 10) : value);
    }

    applyFilters();
  }

  /* ── FILTER GROUP ACCORDION ──────────────────────────────── */
  function bindFilterGroups() {
    $$('.fg-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const bodyId = btn.getAttribute('aria-controls');
        const body   = document.getElementById(bodyId);
        const arrow  = btn.querySelector('.fg-arrow');
        if (!body) return;
        const isOpen = body.classList.toggle('open');
        arrow?.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  /* ── SORT DROPDOWN ───────────────────────────────────────── */
  function bindSort() {
    if (!btnSort || !sortDd) return;

    btnSort.addEventListener('click', () => {
      const open = sortDd.classList.toggle('open');
      btnSort.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', e => {
      if (!btnSort.contains(e.target) && !sortDd.contains(e.target)) {
        sortDd.classList.remove('open');
        btnSort.setAttribute('aria-expanded', 'false');
      }
    });

    $$('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSort = btn.dataset.sort;
        if (sortLabel) sortLabel.textContent = SORT_MAP[activeSort]?.label || activeSort;
        $$('[data-sort]').forEach(b => {
          b.classList.toggle('active', b.dataset.sort === activeSort);
          b.setAttribute('aria-selected', String(b.dataset.sort === activeSort));
        });
        sortDd.classList.remove('open');
        btnSort.setAttribute('aria-expanded', 'false');
        applyFilters();
        // Sync URL
        if (typeof Router !== 'undefined') Router.setParam('sort', activeSort);
      });
    });

    // Set initial active
    const initialSort = $$(  '[data-sort]')[0];
    if (initialSort) { initialSort.classList.add('active'); initialSort.setAttribute('aria-selected', 'true'); }
  }

  /* ── VIEW TOGGLE (Grid / List) ───────────────────────────── */
  function bindViewToggle() {
    $('btn-grid-view')?.addEventListener('click', () => setView(false));
    $('btn-list-view')?.addEventListener('click', () => setView(true));
  }

  function setView(list) {
    isListView = list;
    grid.classList.toggle('list-view', list);
    $('btn-grid-view')?.classList.toggle('active', !list);
    $('btn-list-view')?.classList.toggle('active', list);
    $('btn-grid-view')?.setAttribute('aria-pressed', String(!list));
    $('btn-list-view')?.setAttribute('aria-pressed', String(list));
  }

  /* ── SEARCH INPUT ────────────────────────────────────────── */
  function bindSearch() {
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', e => {
      const q = e.target.value;
      btnClearSearch?.classList.toggle('visible', q.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        _startTime = performance.now();
        if (SE) {
          if (q.trim()) SE.query(q);
          else { SE.reset(); applyFilters(); }
        } else {
          applyFilters();
        }
        if (typeof Router !== 'undefined') Router.setParam('q', q || null);
      }, 200);
    });

    btnClearSearch?.addEventListener('click', () => {
      searchInput.value = '';
      btnClearSearch.classList.remove('visible');
      if (SE) SE.reset();
      applyFilters();
      if (typeof Router !== 'undefined') Router.removeParam('q');
    });
  }

  /* ── MOBILE FILTER SIDEBAR ───────────────────────────────── */
  function bindMobileFilter() {
    const sidebar  = $('filter-sidebar');
    const overlay  = $('filter-overlay');
    const btnOpen  = $('btn-open-filter');

    const openFilter = () => {
      sidebar?.classList.add('open');
      overlay?.classList.add('open');
      overlay?.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeFilter = () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('open');
      overlay?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    btnOpen?.addEventListener('click', openFilter);
    overlay?.addEventListener('click', closeFilter);
    $('btn-reset-filter')?.addEventListener('click', () => { window.resetAll(); });
  }

  /* ── COMPARE FEATURE ─────────────────────────────────────── */
  function bindCompareButtons() {
    // Re-bind after Paginator renders new cards
    $$('[data-compare-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.compareId;
        State.dispatch('COMPARE_TOGGLE', id);
        updateCompareBar();
      });
    });
  }

  function updateCompareBar() {
    const list = State.get('compareList') || [];
    if (compareCountEl) compareCountEl.textContent = list.length;
    compareBar?.classList.toggle('visible', list.length > 0);

    // Update all compare buttons visual state
    $$('[data-compare-id]').forEach(btn => {
      const inList = list.includes(btn.dataset.compareId);
      btn.classList.toggle('in-compare', inList);
      btn.textContent = inList ? '✕' : '⇄';
    });
  }

  $('btn-do-compare')?.addEventListener('click', () => {
    const list = State.get('compareList') || [];
    if (list.length >= 1) {
      const params = list.map((id, i) => `device${i + 1}=${id}`).join('&');
      window.location.href = `/compare.html?${params}`;
    }
  });

  $('btn-clear-compare')?.addEventListener('click', () => {
    State.dispatch('COMPARE_CLEAR');
    updateCompareBar();
  });

  State.subscribe('compareList', updateCompareBar);

  /* ── URL PARAM RESTORE ───────────────────────────────────── */
  function restoreFromUrl() {
    if (typeof Router === 'undefined') return;
    const params = Router.getParams();

    // Restore search query
    if (params.q && searchInput) {
      searchInput.value = params.q;
      btnClearSearch?.classList.add('visible');
      if (SE) SE.query(params.q);
    }

    // Restore sort
    if (params.sort && SORT_MAP[params.sort]) {
      activeSort = params.sort;
      if (sortLabel) sortLabel.textContent = SORT_MAP[activeSort].label;
    }

    // Restore series filter
    if (params.series) {
      const el = document.querySelector(`[data-filter="series"][data-value="${params.series}"]`);
      if (el) { el.classList.add('active'); el.setAttribute('aria-checked', 'true'); FE.toggle('series', params.series); }
    }

    // Restore tag filter
    if (params.tag) {
      // Match to our filter options if possible
      const el = document.querySelector(`[data-filter="tags"][data-value="${params.tag}"]`);
      if (el) { el.classList.add('active'); }
    }
  }

  /* ══════════════════════════════════════════════════════════
     MAIN INIT
     ══════════════════════════════════════════════════════════ */

  // 1. Bind all interactions immediately
  bindFilterOptions();
  bindFilterGroups();
  bindSort();
  bindViewToggle();
  bindSearch();
  bindMobileFilter();

  // 2. Show skeletons while data loads
  DeviceCard.renderSkeleton(12).forEach(s => grid.appendChild(s));

  // 3. Load data
  try {
    allDevices = await DataLoader.getDevices();

    // Update total count in header
    const tcEl = $('total-count');
    if (tcEl) tcEl.textContent = allDevices.length.toLocaleString('id-ID');
    if (totalCountBar) totalCountBar.textContent = allDevices.length.toLocaleString('id-ID');

    // Load into SearchEngine
    if (SE) SE.load(allDevices);

    // Update State
    State.dispatch('SET_DEVICES', allDevices);

    // Restore URL params (may trigger first filter)
    restoreFromUrl();

    // Initial render
    const initialData = FE.apply ? FE.apply(allDevices) : allDevices;
    renderPage(sortDevices(initialData));
    updateFilterSidebarCounts();

  } catch (err) {
    console.error('[devices.js] Failed to load devices:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">⚠</div>
        <p class="empty-state__title">Gagal memuat data</p>
        <p class="empty-state__text">Periksa koneksi internet dan refresh halaman.</p>
      </div>`;
  }

  /* ── INLINE FILTER ENGINE FALLBACK ──────────────────────── */
  function createInlineFilterEngine() {
    const dims = {};
    return {
      define(key, opts) {
        dims[key] = { type: opts.type || 'multi', field: opts.field || key, label: opts.label || key, value: opts.type === 'multi' || opts.type === 'multi_any' ? [] : null, transform: opts.transform || null };
        return this;
      },
      set(key, val) { if (dims[key]) dims[key].value = val; return this; },
      toggle(key, val) {
        const d = dims[key]; if (!d) return false;
        const arr = Array.isArray(d.value) ? [...d.value] : [];
        const idx = arr.indexOf(val);
        if (idx === -1) arr.push(val); else arr.splice(idx, 1);
        d.value = arr; return idx === -1;
      },
      clear(key) { if (dims[key]) dims[key].value = Array.isArray(dims[key].value) ? [] : null; return this; },
      clearAll() { Object.values(dims).forEach(d => { d.value = Array.isArray(d.value) ? [] : null; }); return this; },
      apply(items) {
        return items.filter(item => Object.entries(dims).every(([, d]) => {
          if (!d.value || (Array.isArray(d.value) && !d.value.length)) return true;
          const val = item[d.field];
          if (d.type === 'multi') return d.value.includes(d.transform ? d.transform(val) : val);
          if (d.type === 'multi_any') {
            const arr = Array.isArray(val) ? val : [val];
            return d.value.some(v => arr.includes(d.transform ? d.transform(v) : v));
          }
          if (d.type === 'boolean') return val === d.value;
          if (d.type === 'range_min') return typeof val === 'number' && val >= d.value;
          return true;
        }));
      },
      getActive() {
        const out = [];
        Object.entries(dims).forEach(([key, d]) => {
          if (!d.value || (Array.isArray(d.value) && !d.value.length)) return;
          if (Array.isArray(d.value)) d.value.forEach(v => out.push({ key, label: d.label, value: v, displayValue: String(v) }));
          else if (d.type === 'range_min') out.push({ key, label: d.label, value: d.value, displayValue: `Android ${d.value}+` });
          else if (d.type === 'boolean') out.push({ key, label: d.label, value: d.value, displayValue: d.label });
        });
        return out;
      },
      hasActive() { return this.getActive().length > 0; },
    };
  }

})();
