/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  tutorials.js — Xiaomi Basecamp Page Logic v1.0                ║
 * ║  Tutorial Center: category filter, difficulty, search, featured ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
'use strict';

(async function TutorialsPageInit() {

  Navbar.init('nav-root');

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const grid       = $('tut-grid');
  const searchInput = $('search-input');
  const btnClear   = $('btn-clear');
  const shownCount = $('shown-count');
  const totalCount = $('total-count');
  const catLabel   = $('cat-label');
  const btnLoadMore = $('btn-load-more');

  let allTuts  = [];
  let activeCat  = 'all';
  let activeDiff = null;

  const CAT_LABELS = {
    all: 'Semua Tutorial', bootloader: '🔓 Bootloader',
    recovery: '🛡 Recovery', root: '⚡ Root',
    flashing: '💾 Flashing', tips: '💡 Tips',
  };

  const DIFF_COLORS = {
    Pemula:   { bg: 'rgba(41,255,90,.1)',  color: '#29ff5a', border: 'rgba(41,255,90,.25)'  },
    Menengah: { bg: 'rgba(255,165,0,.1)',  color: '#ffa500', border: 'rgba(255,165,0,.25)'  },
    Mahir:    { bg: 'rgba(255,45,107,.1)', color: '#ff2d6b', border: 'rgba(255,45,107,.25)' },
  };

  const CAT_ICONS = { bootloader:'🔓', recovery:'🛡', root:'⚡', flashing:'💾', tips:'💡', modding:'🔩' };

  /* ── FILTER ────────────────────────────────────────────── */
  function applyFilters(data) {
    let r = data;
    if (activeCat !== 'all') r = r.filter(t => t.category === activeCat);
    if (activeDiff) r = r.filter(t => t.difficulty === activeDiff);
    return r;
  }

  /* ── RENDER FEATURED ────────────────────────────────────── */
  function renderFeatured(tutorials) {
    const fg = $('featured-grid');
    if (!fg) return;
    const featured = [...tutorials].sort((a,b) => (b.views||0) - (a.views||0)).slice(0, 3);
    const diff = t => DIFF_COLORS[t.difficulty] || DIFF_COLORS.Pemula;
    fg.innerHTML = featured.map(t => `
      <a href="/tutorial-detail.html?id=${t.id}" class="featured-card" aria-label="${t.title}">
        <div class="fc-thumb">
          ${t.thumbnail
            ? `<img src="${t.thumbnail}" alt="${t.title}" loading="lazy" decoding="async" onerror="this.parentElement.innerHTML='<div class=fc-thumb-placeholder>${CAT_ICONS[t.category]||'📖'}</div>'">`
            : `<div class="fc-thumb-placeholder">${CAT_ICONS[t.category]||'📖'}</div>`}
          <span class="fc-diff-badge diff-${(t.difficulty||'').toLowerCase()}"
                style="background:${diff(t).bg};color:${diff(t).color};border-color:${diff(t).border}">
            ${t.difficulty}
          </span>
          <span class="fc-cat-badge">${CAT_ICONS[t.category]||'📖'} ${t.category}</span>
        </div>
        <div class="fc-body">
          <h3 class="fc-title">${t.title}</h3>
          <div class="fc-meta">
            <span>⏱ ${t.estimated_time}</span>
            ${(t.steps||[]).length ? `<span>📋 ${t.steps.length} steps</span>` : ''}
          </div>
        </div>
        <div class="fc-footer">
          <span class="fc-views">👁 ${(t.views||0).toLocaleString('id-ID')}</span>
          <span class="fc-btn">▶ Mulai</span>
        </div>
      </a>`).join('');
  }

  /* ── RENDER GRID ─────────────────────────────────────────── */
  function renderGrid(data) {
    const filtered = applyFilters(data);
    if (catLabel) catLabel.textContent = CAT_LABELS[activeCat] || activeCat;
    if (shownCount) shownCount.textContent = filtered.length;
    if (totalCount) totalCount.textContent = filtered.length;

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📖</div><p class="empty-state__title">Tidak ada tutorial ditemukan</p></div>`;
      return;
    }
    TutorialCard.renderGrid(grid, filtered);
    if (btnLoadMore) btnLoadMore.hidden = true;
  }

  /* ── UPDATE STATS ────────────────────────────────────────── */
  function updateStats(tutorials) {
    const counts = { Pemula: 0, Menengah: 0, Mahir: 0 };
    tutorials.forEach(t => { if (counts[t.difficulty] !== undefined) counts[t.difficulty]++; });
    const sp = $('stat-pemula');   if (sp) sp.textContent = counts.Pemula;
    const sm = $('stat-menengah'); if (sm) sm.textContent = counts.Menengah;
    const sh = $('stat-mahir');    if (sh) sh.textContent = counts.Mahir;
    const st = $('stat-total');    if (st) st.textContent = tutorials.length;
  }

  /* ── CATEGORY CHIPS ──────────────────────────────────────── */
  $$('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      $$('[data-cat]').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCat));
      const base = SE?.isActive?.() ? (SE.getResults?.() || allTuts) : allTuts;
      renderGrid(base);
      if (typeof Router !== 'undefined') Router.setParam('cat', activeCat === 'all' ? null : activeCat);
    });
  });

  /* ── DIFFICULTY CHIPS ────────────────────────────────────── */
  $$('[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.diff;
      if (activeDiff === d) { activeDiff = null; btn.classList.remove('active'); }
      else { activeDiff = d; $$('[data-diff]').forEach(b => b.classList.toggle('active', b.dataset.diff === d)); }
      const base = SE?.isActive?.() ? (SE.getResults?.() || allTuts) : allTuts;
      renderGrid(base);
    });
  });

  /* ── SEARCH ──────────────────────────────────────────────── */
  let SE = null;
  if (typeof SearchEngine !== 'undefined') {
    SE = SearchEngine.create({
      onResults: results => renderGrid(results),
      onEmpty: () => { grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔍</div><p class="empty-state__title">Tidak ada tutorial</p></div>`; if (shownCount) shownCount.textContent = '0'; },
    });
  }

  let debTimer;
  searchInput?.addEventListener('input', e => {
    const q = e.target.value;
    btnClear?.classList.toggle('visible', q.length > 0);
    clearTimeout(debTimer);
    debTimer = setTimeout(() => {
      if (SE) { if (q.trim()) SE.query(q); else { SE.reset(); renderGrid(allTuts); } }
      else renderGrid(allTuts);
    }, 200);
  });
  btnClear?.addEventListener('click', () => {
    searchInput.value = ''; btnClear.classList.remove('visible');
    SE?.reset(); renderGrid(allTuts);
  });

  /* ── SKELETON ────────────────────────────────────────────── */
  TutorialCard.renderSkeleton(6).forEach(s => grid.appendChild(s));

  /* ── MAIN INIT ───────────────────────────────────────────── */
  try {
    allTuts = await DataLoader.getTutorials();
    SE?.load(allTuts);
    updateStats(allTuts);

    // Restore URL
    if (typeof Router !== 'undefined') {
      const p = Router.getParams();
      if (p.cat) { activeCat = p.cat; document.querySelector(`[data-cat="${p.cat}"]`)?.classList.add('active'); document.querySelector('[data-cat="all"]')?.classList.remove('active'); }
      if (p.diff) { activeDiff = p.diff; document.querySelector(`[data-diff="${p.diff}"]`)?.classList.add('active'); }
      if (p.q && searchInput) { searchInput.value = p.q; btnClear?.classList.add('visible'); SE?.query(p.q); return; }
    }

    renderFeatured(allTuts);
    renderGrid(allTuts);
  } catch(err) {
    console.error('[tutorials.js]', err);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">⚠</div><p class="empty-state__title">Gagal memuat tutorial</p></div>`;
  }
})();
