/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  romCard.js — Xiaomi Basecamp Component v1.0                   ║
 * ║  Play Store style ROM card. Volt (purple) glow accent.         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  USAGE:
 *    const card = RomCard.render(rom);
 *    RomCard.renderGrid(containerEl, roms);
 *    RomCard.renderSkeleton(6).forEach(s => container.appendChild(s));
 */

'use strict';

const RomCard = (() => {

  let _styleInjected = false;

  function injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;

    const css = `
/* ══ ROM CARD ═══════════════════════════════════════════════ */
.rom-card {
  position: relative;
  background: rgba(7,12,26,0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(184,0,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: border-color .25s, box-shadow .25s, transform .25s;
}
.rom-card:hover {
  border-color: rgba(184,0,255,0.35);
  box-shadow: 0 12px 40px rgba(0,0,0,.5), 0 0 24px rgba(184,0,255,.12);
  transform: translateY(-5px);
}

/* Header row — logo + meta */
.rc-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 16px 10px;
}
.rc-logo-wrap {
  width: 72px; height: 72px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #0c1428;
  border: 1px solid rgba(184,0,255,.15);
  display: flex; align-items: center; justify-content: center;
}
.rc-logo-wrap img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .3s;
}
.rom-card:hover .rc-logo-wrap img { transform: scale(1.08); }
.rc-logo-fallback {
  font-size: 2rem;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  color: #b800ff;
  letter-spacing: -2px;
}

/* Meta */
.rc-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.rc-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #eef4ff;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rc-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.rc-badge {
  padding: 2px 8px;
  font-family: 'Syne', sans-serif;
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  border-radius: 9999px;
  border: 1px solid;
  white-space: nowrap;
  line-height: 1.4;
}
.rc-badge-android { background: rgba(41,255,90,.08); color: #29ff5a; border-color: rgba(41,255,90,.25); }
.rc-badge-aosp    { background: rgba(0,255,224,.08); color: #00ffe0; border-color: rgba(0,255,224,.25); }
.rc-badge-miui    { background: rgba(255,165,0,.08); color: #ffa500; border-color: rgba(255,165,0,.25); }
.rc-badge-hyper   { background: rgba(184,0,255,.08); color: #b800ff; border-color: rgba(184,0,255,.25); }

/* Status */
.rc-status {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  font-family: 'Syne', sans-serif;
  font-size: .6rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  border-radius: 9999px; border: 1px solid;
}
.rc-status::before {
  content: ''; width: 5px; height: 5px;
  border-radius: 50%; background: currentColor; flex-shrink: 0;
}
.rc-status-active     { background: rgba(41,255,90,.1); color:#29ff5a; border-color:rgba(41,255,90,.25); }
.rc-status-inactive   { background: rgba(255,165,0,.1); color:#ffa500; border-color:rgba(255,165,0,.25); }
.rc-status-abandoned  { background: rgba(255,45,107,.1); color:#ff2d6b; border-color:rgba(255,45,107,.25); }

/* Rating */
.rc-rating { display:flex; align-items:center; gap:3px; }
.rc-star { font-size:.75rem; color:#1e3050; line-height:1; }
.rc-star.filled { color:#ffa500; filter:drop-shadow(0 0 3px rgba(255,165,0,.5)); }
.rc-rating-val { font-family:'DM Mono',monospace; font-size:.65rem; color:#7a99c2; margin-left:4px; }

/* Features */
.rc-features {
  padding: 0 16px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.rc-feat-tag {
  padding: 2px 8px;
  background: rgba(184,0,255,.07);
  border: 1px solid rgba(184,0,255,.15);
  border-radius: 9999px;
  font-family: 'Syne', sans-serif;
  font-size: .62rem;
  color: #b800ff;
  white-space: nowrap;
}
.rc-feat-more {
  background: rgba(122,153,194,.08);
  border-color: rgba(122,153,194,.15);
  color: #7a99c2;
}

/* Divider */
.rc-divider {
  height: 1px;
  background: linear-gradient(90deg,transparent,rgba(184,0,255,.15),transparent);
  margin: 0 16px;
}

/* Footer */
.rc-footer {
  padding: 12px 16px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rc-devices-count {
  font-family: 'DM Mono', monospace;
  font-size: .68rem;
  color: #3d5578;
}
.rc-actions { display:flex; gap:6px; }

.rc-btn-download {
  padding: 6px 14px;
  background: #b800ff;
  color: #fff;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: .75rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  border: none; border-radius: 6px;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 4px;
  transition: background .2s, box-shadow .2s, transform .15s;
  flex-shrink: 0;
}
.rc-btn-download:hover {
  background: #cc00ff;
  box-shadow: 0 0 16px rgba(184,0,255,.45);
  transform: translateY(-1px);
}
.rc-btn-detail {
  padding: 6px 12px;
  background: transparent;
  color: #b800ff;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: .75rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  border: 1px solid rgba(184,0,255,.3);
  border-radius: 6px;
  cursor: pointer; text-decoration: none;
  transition: background .2s, border-color .2s;
}
.rc-btn-detail:hover {
  background: rgba(184,0,255,.08);
  border-color: rgba(184,0,255,.5);
}

/* Skeleton */
.rc-skeleton {
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(184,0,255,.04);
  background: #070c1a;
}
.rc-sk-header { display:flex; gap:14px; padding:16px; }
.rc-sk-logo { width:72px; height:72px; border-radius:14px; flex-shrink:0; background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:rc-shimmer 1.5s ease-in-out infinite; }
.rc-sk-meta { flex:1; display:flex;flex-direction:column;gap:8px; justify-content:center; }
.rc-sk-line { height:12px; border-radius:4px; background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:rc-shimmer 1.5s ease-in-out infinite; }
.rc-sk-line.w70{width:70%}.rc-sk-line.w40{width:40%}
.rc-sk-footer { padding:12px 16px 14px; display:flex; justify-content:flex-end; gap:8px; }
.rc-sk-btn { height:30px; border-radius:6px; background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:rc-shimmer 1.5s ease-in-out infinite; }
.rc-sk-btn.w80{width:80px}.rc-sk-btn.w60{width:60px}
@keyframes rc-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    `;
    const style = document.createElement('style');
    style.id = 'xb-rom-card-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── HELPERS ────────────────────────────────────────────── */
  function getBaseBadge(base, type) {
    const t = (type || base || '').toLowerCase();
    if (t.includes('hyperos')) return { label: 'HyperOS', cls: 'rc-badge-hyper' };
    if (t.includes('miui'))    return { label: 'MIUI',    cls: 'rc-badge-miui'  };
    return { label: 'AOSP', cls: 'rc-badge-aosp' };
  }

  function getStatusCls(status) {
    if (status === 'inactive')  return 'rc-status-inactive';
    if (status === 'abandoned') return 'rc-status-abandoned';
    return 'rc-status-active';
  }

  function renderStars(rating = 0) {
    const full  = Math.floor(rating);
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="rc-star${i < full ? ' filled' : ''}" aria-hidden="true">★</span>`
    ).join('');
    return `<div class="rc-rating" aria-label="Rating ${rating} dari 5">
      ${stars}
      <span class="rc-rating-val">${rating.toFixed(1)}</span>
    </div>`;
  }

  function getLogoInitials(name = '') {
    return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function avgRating(ratings = {}) {
    const vals = Object.values(ratings).filter(v => typeof v === 'number');
    if (!vals.length) return 0;
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  }

  function getDownloadUrl(rom) {
    if (!rom.download) return '#';
    return rom.download.sourceforge ||
           rom.download.github_releases ||
           rom.download.telegram_channel || '#';
  }

  /* ── RENDER SINGLE CARD ─────────────────────────────────── */
  /**
   * @param {Object} rom - ROM data object
   * @param {Object} [options]
   * @param {boolean} [options.compact=false]
   * @returns {HTMLElement}
   */
  function render(rom, options = {}) {
    injectStyles();
    const { compact = false } = options;

    const baseBadge   = getBaseBadge(rom.base, rom.type);
    const statusCls   = getStatusCls(rom.status);
    const rating      = avgRating(rom.ratings);
    const features    = rom.features || [];
    const visibleFeats = features.slice(0, 3);
    const extraCount  = features.length - visibleFeats.length;
    const deviceCount = (rom.supported_devices || []).length;
    const downloadUrl = getDownloadUrl(rom);

    const article = document.createElement('article');
    article.className = 'rom-card';
    article.setAttribute('data-rom-id', rom.id);
    article.setAttribute('aria-label', `${rom.name} ROM`);
    article.tabIndex = 0;

    article.innerHTML = `
      <!-- Header -->
      <div class="rc-header">
        <div class="rc-logo-wrap">
          ${rom.logo
            ? `<img src="${rom.logo}" alt="${rom.name} logo" loading="lazy" decoding="async"
                    onerror="this.parentElement.innerHTML='<span class=rc-logo-fallback>${getLogoInitials(rom.name)}</span>'">`
            : `<span class="rc-logo-fallback">${getLogoInitials(rom.name)}</span>`
          }
        </div>
        <div class="rc-meta">
          <h3 class="rc-name">${rom.name}</h3>
          <div class="rc-badges">
            <span class="rc-badge rc-badge-android">Android ${rom.android_version || '?'}</span>
            <span class="rc-badge ${baseBadge.cls}">${baseBadge.label}</span>
            <span class="rc-status ${statusCls}">
              ${rom.maintained ? 'Maintained' : (rom.status || 'Active')}
            </span>
          </div>
          ${renderStars(rating)}
        </div>
      </div>

      <!-- Feature tags -->
      <div class="rc-features">
        ${visibleFeats.map(f => `<span class="rc-feat-tag">${f}</span>`).join('')}
        ${extraCount > 0 ? `<span class="rc-feat-tag rc-feat-more">+${extraCount} more</span>` : ''}
      </div>

      <div class="rc-divider"></div>

      <!-- Footer -->
      <div class="rc-footer">
        <span class="rc-devices-count">
          ${deviceCount > 0 ? `${deviceCount} device` : 'Multi-device'}
        </span>
        <div class="rc-actions">
          <a
            href="/rom-detail.html?id=${rom.id}"
            class="rc-btn-detail"
            aria-label="Detail ${rom.name}"
            onclick="event.stopPropagation()"
          >Detail</a>
          <a
            href="${downloadUrl}"
            target="_blank" rel="noopener noreferrer"
            class="rc-btn-download"
            aria-label="Download ${rom.name}"
            onclick="event.stopPropagation()"
          >↓ Download</a>
        </div>
      </div>
    `;

    /* Card click → detail page */
    article.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      window.location.href = `/rom-detail.html?id=${rom.id}`;
    });
    article.addEventListener('keydown', e => {
      if (e.key === 'Enter') article.click();
    });

    return article;
  }

  /* ── RENDER GRID ────────────────────────────────────────── */
  function renderGrid(container, roms, options = {}) {
    container.innerHTML = '';

    if (!roms || !roms.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">💿</div>
          <p class="empty-state__title">Tidak ada ROM ditemukan</p>
          <p class="empty-state__text">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    roms.forEach((rom, i) => {
      const card = render(rom, options);
      card.style.setProperty('--stagger-delay', `${i * 40}ms`);
      card.classList.add('reveal');
      fragment.appendChild(card);
    });
    container.appendChild(fragment);

    if (window.IntersectionObserver) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); } });
      }, { threshold: 0.08 });
      container.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    } else {
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    }
  }

  /* ── RENDER SKELETON ────────────────────────────────────── */
  function renderSkeleton(count = 6) {
    injectStyles();
    return Array.from({ length: count }, () => {
      const el = document.createElement('div');
      el.className = 'rc-skeleton';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="rc-sk-header">
          <div class="rc-sk-logo"></div>
          <div class="rc-sk-meta">
            <div class="rc-sk-line w70"></div>
            <div class="rc-sk-line w40"></div>
            <div class="rc-sk-line w40"></div>
          </div>
        </div>
        <div class="rc-sk-footer">
          <div class="rc-sk-btn w60"></div>
          <div class="rc-sk-btn w80"></div>
        </div>
      `;
      return el;
    });
  }

  return { render, renderGrid, renderSkeleton };

})();

window.RomCard = RomCard;
