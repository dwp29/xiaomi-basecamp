/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  romDetail.js — Xiaomi Basecamp Page Logic v1.0                ║
 * ║  Loads ROM by ?id= URL param, populates all detail sections    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

'use strict';

(async function RomDetailInit() {

  Navbar.init('nav-root');

  const params = new URLSearchParams(window.location.search);
  const romId  = params.get('id');

  if (!romId) { showNotFound(); return; }

  let rom;
  try { rom = await DataLoader.getRom(romId); } catch (e) { console.error('[romDetail]', e); }
  if (!rom) { showNotFound(); return; }

  // Update meta
  document.title = `${rom.name} — Custom ROM — Xiaomi Basecamp`;
  document.getElementById('og-title')?.setAttribute('content', `${rom.name} | Xiaomi Basecamp`);
  document.getElementById('og-desc')?.setAttribute('content', rom.description || `Download ${rom.name} untuk device Xiaomi`);

  document.getElementById('rd-loading').hidden = true;
  document.getElementById('rd-content').hidden = false;

  populateHero(rom);
  populateDescFeatures(rom);
  populateRatings(rom);
  populateRequirements(rom);
  await populateDevices(rom);

  /* ── HERO ────────────────────────────────────────────────── */
  function populateHero(r) {
    document.getElementById('bc-rom-name').textContent = r.name;
    document.getElementById('rom-name').textContent    = r.name;

    // Logo
    const logoWrap = document.getElementById('rom-logo-wrap');
    const logoFallback = document.getElementById('rom-logo-fallback');
    if (r.logo) {
      const img = document.createElement('img');
      img.src = r.logo; img.alt = r.name + ' logo'; img.loading = 'lazy';
      img.onerror = () => { img.remove(); if (logoFallback) { logoFallback.textContent = getInitials(r.name); logoFallback.style.display = 'flex'; } };
      logoWrap?.appendChild(img);
      if (logoFallback) logoFallback.style.display = 'none';
    } else {
      if (logoFallback) logoFallback.textContent = getInitials(r.name);
    }

    // Badges
    const badgesEl = document.getElementById('rom-badges');
    if (badgesEl) {
      const statusColors = {
        active:   { bg: 'rgba(41,255,90,.1)',   color: '#29ff5a', border: 'rgba(41,255,90,.25)'   },
        inactive: { bg: 'rgba(255,165,0,.1)',   color: '#ffa500', border: 'rgba(255,165,0,.25)'   },
        abandoned:{ bg: 'rgba(255,45,107,.1)',  color: '#ff2d6b', border: 'rgba(255,45,107,.25)'  },
      };
      const typeColors = {
        'AOSP':          { bg: 'rgba(0,255,224,.08)',  color: '#00ffe0', border: 'rgba(0,255,224,.25)'  },
        'HyperOS-based': { bg: 'rgba(184,0,255,.08)', color: '#b800ff', border: 'rgba(184,0,255,.25)' },
        'MIUI-based':    { bg: 'rgba(255,165,0,.08)', color: '#ffa500', border: 'rgba(255,165,0,.25)'  },
      };
      const sc = statusColors[r.status] || statusColors.active;
      const tc = typeColors[r.type]     || typeColors['AOSP'];

      badgesEl.innerHTML = `
        <span class="rd-badge" style="background:${tc.bg};color:${tc.color};border-color:${tc.border}">${r.type}</span>
        <span class="rd-badge" style="background:rgba(41,255,90,.08);color:#29ff5a;border-color:rgba(41,255,90,.2)">Android ${r.android_version}</span>
        <span class="rd-badge" style="background:${sc.bg};color:${sc.color};border-color:${sc.border}">
          ${r.status === 'active' ? '● ' : '○ '}${r.maintained ? 'Maintained' : r.status}
        </span>
        <span class="rd-badge" style="background:rgba(122,153,194,.08);color:#7a99c2;border-color:rgba(122,153,194,.15)">v${r.version}</span>
      `;
    }

    // Feature tags (first 6)
    const tagsEl = document.getElementById('rom-feature-tags');
    if (tagsEl && r.features) {
      const visible = r.features.slice(0, 6);
      const more = r.features.length - visible.length;
      tagsEl.innerHTML = visible.map(f => `<span class="rd-feature-tag">${f}</span>`).join('') +
        (more > 0 ? `<span class="rd-feature-tag" style="background:rgba(122,153,194,.06);color:var(--t2);border-color:rgba(122,153,194,.12)">+${more} more</span>` : '');
    }

    // Download buttons
    const dlEl = document.getElementById('rom-downloads');
    if (dlEl) {
      const dl = r.download || {};
      const buttons = [
        { label: '↓ SourceForge', url: dl.sourceforge,       primary: true  },
        { label: '⌨ GitHub',      url: dl.github_releases,   primary: false },
        { label: '📢 Telegram',   url: dl.telegram_channel,  primary: false },
      ];
      dlEl.innerHTML = buttons.map(b => `
        <a href="${b.url || '#'}"
           class="rd-dl-btn ${b.url ? (b.primary ? 'rd-dl-primary' : 'rd-dl-ghost') : 'rd-dl-disabled'}"
           ${b.url ? 'target="_blank" rel="noopener noreferrer"' : ''}
           aria-label="${b.label}${!b.url ? ' (tidak tersedia)' : ''}">
          ${b.label}
        </a>`).join('');
    }
  }

  /* ── DESC + FEATURES + PROS/CONS ────────────────────────── */
  function populateDescFeatures(r) {
    const descEl = document.getElementById('rom-desc');
    if (descEl) descEl.textContent = r.description || '';

    const featEl = document.getElementById('rom-features-list');
    if (featEl && r.features) {
      featEl.innerHTML = r.features.map(f => `
        <div class="rd-feature-item">
          <span class="rd-feature-dot" aria-hidden="true"></span>
          ${f}
        </div>`).join('');
    }

    const pcEl = document.getElementById('rom-pros-cons');
    if (pcEl) {
      const pros = (r.pros || []).map(p => `<div class="rd-pc-item">${p}</div>`).join('');
      const cons = (r.cons || []).map(c => `<div class="rd-pc-item">${c}</div>`).join('');
      pcEl.innerHTML = `
        <div class="rd-pros">
          <p class="rd-pros-title">✓ Kelebihan</p>
          ${pros || '<div class="rd-pc-item" style="opacity:.4">Tidak ada data</div>'}
        </div>
        <div class="rd-cons">
          <p class="rd-cons-title">✗ Kekurangan</p>
          ${cons || '<div class="rd-pc-item" style="opacity:.4">Tidak ada data</div>'}
        </div>`;
    }
  }

  /* ── RATINGS ─────────────────────────────────────────────── */
  function populateRatings(r) {
    const el = document.getElementById('rom-ratings');
    if (!el || !r.ratings) return;

    const labels = {
      stability:   'Stabilitas',
      performance: 'Performa',
      battery:     'Baterai',
      features:    'Fitur',
      community:   'Komunitas',
    };

    const rows = Object.entries(r.ratings).map(([key, val], i) => `
      <div class="rd-rating-row">
        <span class="rd-rating-label">${labels[key] || key}</span>
        <div class="rd-rating-track">
          <div class="rd-rating-fill"
               style="width:0%;transition-delay:${i * 80}ms"
               data-target="${(val / 5) * 100}"></div>
        </div>
        <span class="rd-rating-val">${val.toFixed(1)}</span>
      </div>`).join('');

    el.innerHTML = rows;

    // Animate bars after render
    setTimeout(() => {
      el.querySelectorAll('.rd-rating-fill').forEach(fill => {
        fill.style.width = fill.dataset.target + '%';
      });
    }, 100);
  }

  /* ── REQUIREMENTS ────────────────────────────────────────── */
  function populateRequirements(r) {
    const el   = document.getElementById('rom-requirements');
    const info = document.getElementById('rom-recovery-info');
    if (!el) return;

    const req = r.requirements || {};
    const items = [
      { label: 'Unlocked Bootloader', pass: req.unlocked_bootloader, icon: req.unlocked_bootloader ? '🔓' : '🔒' },
      { label: 'Custom Recovery',     pass: req.custom_recovery,     icon: req.custom_recovery     ? '🛡' : '⚠' },
      { label: 'Vendor Partition',    pass: req.vendor_required,     icon: req.vendor_required     ? '✓' : '✗' },
    ];

    el.innerHTML = items.map(item => `
      <div class="rd-check-item ${item.pass ? 'pass' : 'fail'}">
        <span class="rd-check-icon">${item.icon}</span>
        <span class="rd-check-text">${item.label}</span>
      </div>`).join('');

    if (info) {
      const recoveries = req.recommended_recovery || [];
      const root = req.root_support || 'Magisk';
      info.innerHTML = `
        ${recoveries.length ? `
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <span style="font-family:'DM Mono',monospace;font-size:.65rem;color:var(--t3);letter-spacing:2px;text-transform:uppercase">Recommended Recovery:</span>
            ${recoveries.map(r => `<span class="rd-feature-tag">${r}</span>`).join('')}
          </div>` : ''}
        <div style="font-family:'Syne',sans-serif;font-size:.8rem;color:var(--t2)">
          Root Support: <strong style="color:var(--volt)">${root}</strong>
        </div>`;
    }
  }

  /* ── SUPPORTED DEVICES ───────────────────────────────────── */
  async function populateDevices(r) {
    const grid    = document.getElementById('rom-devices-grid');
    const badge   = document.getElementById('device-count-badge');
    if (!grid) return;

    const deviceIds = r.supported_devices || [];
    if (badge) badge.textContent = `(${deviceIds.length})`;

    if (!deviceIds.length) {
      grid.innerHTML = `<p style="color:var(--t3);font-family:'DM Mono',monospace;font-size:.78rem">Belum ada device terdaftar.</p>`;
      return;
    }

    try {
      const allDevices = await DataLoader.getDevices();
      const matched = allDevices.filter(d =>
        deviceIds.includes(d.id) || deviceIds.includes(d.numeric_id?.toString())
      ).slice(0, 9);

      if (!matched.length) {
        grid.innerHTML = `<p style="color:var(--t3);font-size:.78rem">${deviceIds.length} device didukung — data detail belum tersedia.</p>`;
        return;
      }
      DeviceCard.renderGrid(grid, matched, { compact: true, showCompare: false });
    } catch (e) {
      grid.innerHTML = `<p style="color:var(--t3);font-size:.78rem">Gagal memuat device.</p>`;
    }
  }

  function getInitials(name = '') {
    return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function showNotFound() {
    document.getElementById('rd-loading').hidden  = true;
    document.getElementById('rd-not-found').hidden = false;
    document.title = 'ROM Tidak Ditemukan — Xiaomi Basecamp';
  }

})();
