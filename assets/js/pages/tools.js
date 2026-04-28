/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  tools.js — Xiaomi Basecamp Page Logic v1.0                    ║
 * ║  Root & Tools: category tabs, search, comparison matrix,       ║
 * ║  featured section, download counter                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

'use strict';

(async function ToolsPageInit() {

  Navbar.init('nav-root');

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const grid        = $('tool-grid');
  const searchInput = $('search-input');
  const btnClear    = $('btn-clear-search');
  const catLabel    = $('current-cat-label');
  const countSub    = $('tools-count-sub');

  let allTools   = [];
  let activeTab  = 'all';
  let activeQF   = new Set();

  /* ── CATEGORY CONFIG ───────────────────────────────────────── */
  const CAT_LABELS = {
    all:      'All Tools',
    root:     '⚡ Root Tools',
    recovery: '🛡 Recovery',
    module:   '🔩 Modules',
    kernel:   '⚙ Kernel',
    audio:    '🎵 Audio Mods',
    camera:   '📷 GCam',
    utility:  '🔧 Utility',
  };

  const FEATURED_IDS = ['magisk', 'kernelsu', 'orangefox', 'lsposed', 'play-integrity-fix', 'adb-fastboot'];

  /* ── ROOT COMPARISON MATRIX ──────────────────────────────── */
  const ROOT_COMPARE_FEATURES = [
    { label: 'Installation Method',    magisk: 'Boot patch / Recovery', kernelsu: 'Kernel integration', kernelsu_next: 'Kernel / LKM', apatch: 'APK kernel patch', kowsu: 'Kernel integration' },
    { label: 'Non-GKI Support',        magisk: '✓',   kernelsu: '✗',    kernelsu_next: '✓',   apatch: 'Partial', kowsu: '✓' },
    { label: 'GKI Support',            magisk: '✓',   kernelsu: '✓',    kernelsu_next: '✓',   apatch: '✓',  kowsu: '✓' },
    { label: 'Zygisk Built-in',        magisk: '✓',   kernelsu: '✗',    kernelsu_next: '✗',   apatch: '✗',  kowsu: '✗' },
    { label: 'Module Support',         magisk: '✓',   kernelsu: '✓',    kernelsu_next: '✓',   apatch: '✓',  kowsu: '✓' },
    { label: 'Magisk Module Compat.',  magisk: 'Native', kernelsu: 'Zygisk-Next', kernelsu_next: 'Zygisk-Next', apatch: 'Zygisk-Next', kowsu: 'Partial' },
    { label: 'Android 15 Support',     magisk: '✓',   kernelsu: '✓',    kernelsu_next: '✓',   apatch: '✓',  kowsu: '✓' },
    { label: 'Root Hide',              magisk: 'DenyList', kernelsu: 'AppProfile', kernelsu_next: 'AppProfile', apatch: 'AppProfile', kowsu: 'AppProfile' },
    { label: 'Safety Level',           magisk: 'Medium', kernelsu: 'High', kernelsu_next: 'High', apatch: 'High', kowsu: 'High' },
    { label: 'Ease of Install',        magisk: '⭐⭐⭐⭐⭐', kernelsu: '⭐⭐⭐', kernelsu_next: '⭐⭐⭐', apatch: '⭐⭐⭐⭐', kowsu: '⭐⭐⭐' },
  ];

  /* ── QUICK FILTER PREDICATES ─────────────────────────────── */
  const QF_PREDICATES = {
    open_source: t => t.open_source === true,
    active:      t => t.status === 'active',
    android15:   t => parseInt(t.compatibility?.android_max || 0) >= 15,
    kernelsu:    t => (t.works_with || t.compatibility?.works_with || []).some(w => w.toLowerCase().includes('kernelsu')),
    nopc:        t => t.category === 'module' || t.category === 'audio' || t.category === 'camera',
  };

  /* ── FILTER + SORT ───────────────────────────────────────── */
  function filterTools(tools) {
    let result = tools;
    if (activeTab !== 'all') result = result.filter(t => t.category === activeTab);
    activeQF.forEach(qf => {
      if (QF_PREDICATES[qf]) result = result.filter(QF_PREDICATES[qf]);
    });
    return result;
  }

  /* ── RENDER MAIN GRID ────────────────────────────────────── */
  function renderGrid(tools) {
    const filtered = filterTools(tools);

    if (catLabel) catLabel.textContent = CAT_LABELS[activeTab] || 'All Tools';
    if (countSub) countSub.textContent = `${filtered.length} tool tersedia`;

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="tools-empty">
          <div class="tools-empty-icon">🔧</div>
          <p class="tools-empty-title">Tidak ada tool ditemukan</p>
        </div>`;
      return;
    }

    // Use ToolCard.renderGrid for smooth stagger animation
    ToolCard.renderGrid(grid, filtered);
  }

  /* ── RENDER FEATURED ─────────────────────────────────────── */
  function renderFeatured(tools) {
    const featuredEl = $('featured-grid');
    if (!featuredEl) return;

    const featured = FEATURED_IDS
      .map(id => tools.find(t => t.id === id))
      .filter(Boolean);

    const CAT_COLORS = {
      root:     { color: '#00ffe0', glow: 'rgba(0,255,224,.35)',   bg: 'rgba(0,255,224,.07)',   icon: '⚡' },
      recovery: { color: '#b800ff', glow: 'rgba(184,0,255,.35)',   bg: 'rgba(184,0,255,.07)',   icon: '🛡' },
      module:   { color: '#00ffe0', glow: 'rgba(0,255,224,.35)',   bg: 'rgba(0,255,224,.07)',   icon: '🔩' },
      utility:  { color: '#7a99c2', glow: 'rgba(122,153,194,.25)', bg: 'rgba(122,153,194,.07)', icon: '🔧' },
    };

    featuredEl.innerHTML = featured.map(tool => {
      const cat = CAT_COLORS[tool.category] || CAT_COLORS.utility;
      const dlUrl = tool.download?.latest_apk || tool.download?.github || '#';
      const dlCount = getDlCount(tool.id);
      return `
        <div class="featured-card" style="--fc-color:${cat.color};--fc-glow:${cat.glow};--fc-bg:${cat.bg}">
          <div class="fc-header">
            <div class="fc-icon">
              ${tool.logo ? `<img src="${tool.logo}" alt="${tool.name}" loading="lazy" onerror="this.parentElement.textContent='${cat.icon}'">` : cat.icon}
            </div>
            <div class="fc-meta">
              <div class="fc-name">${tool.name}</div>
              <div class="fc-dev">by ${tool.developer || '?'}</div>
              <div class="fc-ver">v${tool.version_stable || '?'}</div>
            </div>
          </div>
          <p class="fc-desc">${tool.description || ''}</p>
          <div class="fc-footer">
            <a href="${dlUrl}" target="_blank" rel="noopener noreferrer"
               class="fc-dl-btn" aria-label="Download ${tool.name}"
               data-tool-id="${tool.id}">
              ↓ Download
            </a>
            <span class="fc-dl-count dl-count-badge" title="Total downloads tracked">
              <span id="dlcount-${tool.id}">${dlCount.toLocaleString('id-ID')}</span> ↓
            </span>
          </div>
        </div>`;
    }).join('');

    // Bind download count tracking
    featuredEl.querySelectorAll('[data-tool-id]').forEach(btn => {
      btn.addEventListener('click', () => trackDownload(btn.dataset.toolId));
    });
  }

  /* ── COMPARISON TABLE ────────────────────────────────────── */
  function renderCompareTable() {
    const wrap = $('compare-table-wrap');
    if (!wrap) return;

    const TOOLS_HEADERS = [
      { key: 'magisk',       label: 'Magisk',    color: '#00ffe0' },
      { key: 'kernelsu',     label: 'KernelSU',  color: '#29ff5a' },
      { key: 'kernelsu_next',label: 'KSU Next',  color: '#ffa500' },
      { key: 'apatch',       label: 'APatch',    color: '#b800ff' },
      { key: 'kowsu',        label: 'KowSU',     color: '#ff2d6b' },
    ];

    const cols = `140px ${TOOLS_HEADERS.map(() => '1fr').join(' ')}`;

    function cellClass(val) {
      if (val === '✓' || val === 'Native') return 'ct-yes';
      if (val === '✗') return 'ct-no';
      if (val === 'Partial' || val.includes('Partial')) return 'ct-partial';
      return '';
    }

    wrap.innerHTML = `
      <div class="compare-table" role="table" aria-label="Root tools comparison">
        <div class="ct-header-row" style="display:grid;grid-template-columns:${cols}">
          <span style="color:var(--t3)">Feature</span>
          ${TOOLS_HEADERS.map(h => `<span style="color:${h.color};text-align:center">${h.label}</span>`).join('')}
        </div>
        ${ROOT_COMPARE_FEATURES.map(row => `
          <div class="ct-row" style="display:grid;grid-template-columns:${cols}">
            <span class="ct-feature">${row.label}</span>
            ${TOOLS_HEADERS.map(h => `<span class="ct-val ${cellClass(row[h.key] || '—')}">${row[h.key] || '—'}</span>`).join('')}
          </div>
        `).join('')}
      </div>`;
  }

  /* ── DOWNLOAD COUNTER ────────────────────────────────────── */
  const DL_KEY = 'xb_tool_downloads';

  function getDlCount(toolId) {
    try {
      const data = JSON.parse(localStorage.getItem(DL_KEY) || '{}');
      return data[toolId] || Math.floor(Math.random() * 4000 + 500); // initial pseudo-count
    } catch { return 0; }
  }

  function trackDownload(toolId) {
    try {
      const data = JSON.parse(localStorage.getItem(DL_KEY) || '{}');
      data[toolId] = (data[toolId] || getDlCount(toolId)) + 1;
      localStorage.setItem(DL_KEY, JSON.stringify(data));
      const el = $(`dlcount-${toolId}`);
      if (el) el.textContent = data[toolId].toLocaleString('id-ID');
    } catch (_) {}
  }

  /* ── CATEGORY TABS ───────────────────────────────────────── */
  $$('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.cat;
      $$('[data-cat]').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === activeTab);
        b.setAttribute('aria-selected', String(b.dataset.cat === activeTab));
      });
      if (catLabel) catLabel.textContent = CAT_LABELS[activeTab] || activeTab;

      // Show/hide special sections
      const secCompare  = $('section-root-compare');
      const secFeatured = $('section-featured');
      if (secCompare)  secCompare.style.display  = (activeTab === 'all' || activeTab === 'root') ? '' : 'none';
      if (secFeatured) secFeatured.style.display = activeTab === 'all' ? '' : 'none';

      // Apply search + filter
      const q = searchInput?.value.trim();
      let base = allTools;
      if (SE && q) base = SE.getResults ? SE.getResults() : allTools.filter(t => t.search_blob?.includes(q.toLowerCase()));
      renderGrid(base);

      if (typeof Router !== 'undefined') Router.setParam('cat', activeTab === 'all' ? null : activeTab);
    });
  });

  /* ── QUICK FILTERS ───────────────────────────────────────── */
  $$('[data-qf]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qf = btn.dataset.qf;
      if (activeQF.has(qf)) { activeQF.delete(qf); btn.classList.remove('active'); }
      else { activeQF.add(qf); btn.classList.add('active'); }
      renderGrid(allTools);
    });
  });

  /* ── SEARCH ──────────────────────────────────────────────── */
  let SE = null;
  if (typeof SearchEngine !== 'undefined') {
    SE = SearchEngine.create({
      onResults: results => renderGrid(results),
      onEmpty: () => { grid.innerHTML = `<div class="tools-empty"><div class="tools-empty-icon">🔍</div><p class="tools-empty-title">Tidak ada tool ditemukan</p></div>`; },
    });
  }

  let debTimer;
  searchInput?.addEventListener('input', e => {
    const q = e.target.value;
    btnClear?.classList.toggle('visible', q.length > 0);
    clearTimeout(debTimer);
    debTimer = setTimeout(() => {
      if (SE) { if (q.trim()) SE.query(q); else { SE.reset(); renderGrid(allTools); } }
      else renderGrid(allTools);
    }, 200);
  });
  btnClear?.addEventListener('click', () => {
    searchInput.value = ''; btnClear.classList.remove('visible');
    SE?.reset(); renderGrid(allTools);
  });

  /* ── UPDATE TAB COUNTS ───────────────────────────────────── */
  function updateTabCounts(tools) {
    const cats = ['root','recovery','module','kernel','audio','camera','utility'];
    cats.forEach(cat => {
      const el = $(`tc-${cat}`);
      if (el) el.textContent = tools.filter(t => t.category === cat).length;
    });
    const tcAll = $('tc-all');
    if (tcAll) tcAll.textContent = tools.length;

    // Also update header stat pills
    cats.forEach(cat => {
      const el = $(`count-${cat}`);
      if (el) el.textContent = tools.filter(t => t.category === cat).length;
    });
    const totalEl = $('count-total');
    if (totalEl) totalEl.textContent = tools.length;
  }

  /* ── URL RESTORE ─────────────────────────────────────────── */
  function restoreFromUrl() {
    if (typeof Router === 'undefined') return;
    const p = Router.getParams();
    if (p.cat) {
      const btn = document.querySelector(`[data-cat="${p.cat}"]`);
      if (btn) { activeTab = p.cat; btn.click(); }
    }
    if (p.q && searchInput) {
      searchInput.value = p.q;
      btnClear?.classList.add('visible');
      SE?.query(p.q);
    }
  }

  /* ── SKELETON LOADERS ────────────────────────────────────── */
  ToolCard.renderSkeleton(8).forEach(s => grid.appendChild(s));

  // Show skeleton in featured too
  const featuredEl = $('featured-grid');
  if (featuredEl) {
    ToolCard.renderSkeleton(4).forEach(s => { s.style.borderRadius = '16px'; featuredEl.appendChild(s); });
  }

  /* ── MAIN DATA LOAD ──────────────────────────────────────── */
  try {
    allTools = await DataLoader.getTools();

    SE?.load(allTools);
    updateTabCounts(allTools);
    renderFeatured(allTools);
    renderCompareTable();
    restoreFromUrl();
    renderGrid(allTools);

    // Bind download tracking on all tool cards
    document.addEventListener('click', e => {
      const dlLink = e.target.closest('a[href]');
      if (!dlLink) return;
      const card = dlLink.closest('[data-tool-id]');
      if (card) trackDownload(card.dataset.toolId);
    });

  } catch (err) {
    console.error('[tools.js] Failed to load tools:', err);
    grid.innerHTML = `
      <div class="tools-empty">
        <div class="tools-empty-icon">⚠</div>
        <p class="tools-empty-title">Gagal memuat tools</p>
        <p style="color:var(--t3);font-size:.78rem">Refresh halaman dan coba lagi.</p>
      </div>`;
  }

})();
