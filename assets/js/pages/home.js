/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  home.js — Xiaomi Basecamp Page Logic v1.0                     ║
 * ║  Homepage: trending devices, latest ROMs, stats counter,       ║
 * ║  hero search + tag chips.                                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  DEPENDS ON (must load before this file):
 *    - dataTransformer.js
 *    - dataLoader.js
 *    - state.js
 *    - router.js
 *    - navbar.js
 *    - deviceCard.js
 *    - romCard.js
 *    - tutorialCard.js
 *
 *  HTML HOOKS (IDs expected in index.html):
 *    #nav-root           → navbar container
 *    #hero-search        → hero search input
 *    #hero-search-btn    → hero search submit button
 *    #hero-tag-chips     → container of tag chip buttons
 *    #stats-devices      → animated counter
 *    #stats-roms         → animated counter
 *    #stats-tools        → animated counter
 *    #stats-tutorials    → animated counter
 *    #trending-grid      → device grid container
 *    #latest-roms-grid   → ROM grid container
 *    #latest-tut-grid    → tutorial grid container (optional)
 */

'use strict';

(async function HomePageInit() {

  /* ══════════════════════════════════════════════════════════
     § 1  NAVBAR
     ══════════════════════════════════════════════════════════ */
  if (typeof Navbar !== 'undefined') {
    Navbar.init('nav-root');
  }

  /* ══════════════════════════════════════════════════════════
     § 2  HERO SEARCH
     ══════════════════════════════════════════════════════════ */
  function initHeroSearch() {
    const input = document.getElementById('hero-search');
    const btn   = document.getElementById('hero-search-btn');
    if (!input) return;

    const doSearch = () => {
      const q = input.value.trim();
      if (!q) return;
      window.location.href = `/devices.html?q=${encodeURIComponent(q)}`;
    };

    btn?.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });

    // Focus glow effect
    input.addEventListener('focus', () => {
      input.closest('.hero-search-wrap')?.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.closest('.hero-search-wrap')?.classList.remove('focused');
    });
  }

  /* ══════════════════════════════════════════════════════════
     § 3  HERO TAG CHIPS
     ══════════════════════════════════════════════════════════ */
  function initHeroTags() {
    const container = document.getElementById('hero-tag-chips');
    if (!container) return;

    // Click on tag chip → navigate to devices page with that filter
    container.querySelectorAll('[data-tag]').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        const type = chip.dataset.type || 'tag';
        if (type === 'tag') {
          window.location.href = `/devices.html?tag=${encodeURIComponent(tag)}`;
        } else if (type === 'os') {
          window.location.href = `/devices.html?os=${encodeURIComponent(tag)}`;
        } else if (type === 'rom') {
          window.location.href = `/roms.html?q=${encodeURIComponent(tag)}`;
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     § 4  STATS COUNTER ANIMATION
     ══════════════════════════════════════════════════════════ */
  function animateCounter(el, target, duration = 1800) {
    if (!el) return;
    const start    = performance.now();
    const startVal = 0;

    const tick = now => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current.toLocaleString('id-ID');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initStatsCounters(config) {
    const targets = {
      'stats-devices':   config?.stats?.total_devices   || 207,
      'stats-roms':      config?.stats?.total_roms       || 25,
      'stats-tools':     config?.stats?.total_tools      || 28,
      'stats-tutorials': config?.stats?.total_tutorials  || 20,
    };

    // Use IntersectionObserver so counters animate when scrolled into view
    const statEls = Object.entries(targets).map(([id, val]) => ({
      el: document.getElementById(id), val
    })).filter(s => s.el);

    if (!statEls.length) return;

    if (!window.IntersectionObserver) {
      statEls.forEach(({ el, val }) => animateCounter(el, val));
      return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id   = entry.target.id;
        const val  = targets[id];
        if (val !== undefined) animateCounter(entry.target, val);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    statEls.forEach(({ el }) => obs.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     § 5  TRENDING DEVICES (top 8 by modding_score)
     ══════════════════════════════════════════════════════════ */
  function renderTrendingDevices(devices) {
    const grid = document.getElementById('trending-grid');
    if (!grid) return;

    // Show skeletons while loading
    DeviceCard.renderSkeleton(8).forEach(s => grid.appendChild(s));

    if (!devices || !devices.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">📱</div>
          <p class="empty-state__title">Gagal memuat device</p>
        </div>`;
      return;
    }

    // Sort by modding_score DESC, take top 8
    const trending = [...devices]
      .sort((a, b) => (b.modding_score || 0) - (a.modding_score || 0))
      .slice(0, 8);

    DeviceCard.renderGrid(grid, trending, { showCompare: false });
  }

  /* ══════════════════════════════════════════════════════════
     § 6  LATEST ROMs (top 6 by updated_at)
     ══════════════════════════════════════════════════════════ */
  function renderLatestRoms(roms) {
    const grid = document.getElementById('latest-roms-grid');
    if (!grid) return;

    // Skeletons while loading
    RomCard.renderSkeleton(6).forEach(s => grid.appendChild(s));

    if (!roms || !roms.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">💿</div>
          <p class="empty-state__title">Gagal memuat ROM</p>
        </div>`;
      return;
    }

    // Sort by updated_at DESC, take top 6
    const latest = [...roms]
      .sort((a, b) => {
        const da = new Date(a.updated_at || 0);
        const db = new Date(b.updated_at || 0);
        return db - da;
      })
      .slice(0, 6);

    RomCard.renderGrid(grid, latest);
  }

  /* ══════════════════════════════════════════════════════════
     § 7  LATEST TUTORIALS (optional section)
     ══════════════════════════════════════════════════════════ */
  function renderLatestTutorials(tutorials) {
    const grid = document.getElementById('latest-tut-grid');
    if (!grid) return;

    TutorialCard.renderSkeleton(3).forEach(s => grid.appendChild(s));

    if (!tutorials || !tutorials.length) return;

    const latest = [...tutorials]
      .filter(t => t.status === 'published')
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 3);

    TutorialCard.renderGrid(grid, latest);
  }

  /* ══════════════════════════════════════════════════════════
     § 8  HERO PARTICLES (purely visual, CSS-driven fallback)
     ══════════════════════════════════════════════════════════ */
  function initParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W, H, particles = [], animId;

    const COLORS = ['#00ffe0', '#b800ff', '#ff2d6b', '#ffa500', '#29ff5a'];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      return {
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    Math.random() * 1.5 + 0.5,
        vx:   (Math.random() - 0.5) * 0.4,
        vy:   (Math.random() - 0.5) * 0.4 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life:  Math.random() * 300 + 100,
        age:   0,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: 60 }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        p.age++;
        p.x += p.vx;
        p.y += p.vy;
        const life = Math.min(p.age / 30, 1) * Math.max(1 - p.age / p.life, 0);
        ctx.globalAlpha = p.alpha * life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.age >= p.life || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          particles[i] = createParticle();
        }
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    init();
    draw();

    window.addEventListener('resize', () => {
      cancelAnimationFrame(animId);
      init();
      draw();
    });

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animId);
      else draw();
    });
  }

  /* ══════════════════════════════════════════════════════════
     § 9  HERO BUTTON NAV
     ══════════════════════════════════════════════════════════ */
  function initHeroButtons() {
    const btns = document.querySelectorAll('[data-hero-nav]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.heroNav;
        window.location.href = target;
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     § 10  SCROLL REVEAL (any .reveal elements on homepage)
     ══════════════════════════════════════════════════════════ */
  function initReveal() {
    if (!window.IntersectionObserver) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     § 11  MAIN INIT
     ══════════════════════════════════════════════════════════ */
  // Run synchronous UI setup immediately
  initHeroSearch();
  initHeroTags();
  initHeroButtons();
  initParticles();
  initReveal();

  // Async data loading
  try {
    // Load config for stats
    const config = await DataLoader.getConfig().catch(() => null);
    initStatsCounters(config);

    // Preload devices + roms in parallel
    const [devices, roms, tutorials] = await Promise.all([
      DataLoader.getDevices().catch(() => []),
      DataLoader.getRoms().catch(() => []),
      DataLoader.getTutorials().catch(() => []),
    ]);

    // Store in state
    if (typeof State !== 'undefined') {
      State.dispatch('SET_DEVICES', devices);
      State.dispatch('SET_ROMS', roms);
      State.dispatch('SET_TUTORIALS', tutorials);
    }

    // Render sections
    renderTrendingDevices(devices);
    renderLatestRoms(roms);
    renderLatestTutorials(tutorials);

  } catch (err) {
    console.error('[home.js] Data loading failed:', err);
  }

})();
