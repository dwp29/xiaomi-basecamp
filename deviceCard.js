/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  deviceCard.js — Xiaomi Basecamp Component v1.0                ║
 * ║  Renders device cards for the grid. Cyberpunk glassmorphism.   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  USAGE:
 *    const card = DeviceCard.render(device, { showCompare: true });
 *    DeviceCard.renderGrid(containerEl, devices);
 *    DeviceCard.renderSkeleton(12).forEach(s => container.appendChild(s));
 *
 *  DEPENDS ON:
 *    - Router (for navigation)
 *    - State  (for compare toggle)
 */

'use strict';

const DeviceCard = (() => {

  /* ── STYLES ─────────────────────────────────────────────── */
  let _styleInjected = false;

  function injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;

    const css = `
/* ══ DEVICE CARD ═════════════════════════════════════════ */
.device-card {
  position: relative;
  background: rgba(7,12,26,0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0,255,224,0.08);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: border-color .25s, box-shadow .25s, transform .25s;
  text-decoration: none;
  color: inherit;
}
.device-card:hover {
  border-color: rgba(0,255,224,0.32);
  box-shadow: 0 12px 40px rgba(0,0,0,.5), 0 0 24px rgba(0,255,224,.12);
  transform: translateY(-5px);
}
/* Compact variant */
.device-card--compact .dc-img-wrap { aspect-ratio: 1; }
.device-card--compact .dc-name { font-size: 1rem; }

/* Image wrapper */
.dc-img-wrap {
  position: relative;
  aspect-ratio: 4/3;
  background: #0c1428;
  overflow: hidden;
  flex-shrink: 0;
}
.dc-img-wrap img {
  width: 100%; height: 100%;
  object-fit: contain;
  padding: 12px;
  transition: transform .4s cubic-bezier(.22,1,.36,1);
}
.device-card:hover .dc-img-wrap img { transform: scale(1.06); }

/* Status badge */
.dc-status {
  position: absolute;
  top: 10px; right: 10px;
  padding: 3px 10px;
  font-family: 'Syne', sans-serif;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  border-radius: 9999px;
  border: 1px solid;
  line-height: 1;
  display: flex; align-items: center; gap: 4px;
}
.dc-status::before {
  content: '';
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.dc-status-active { background: rgba(41,255,90,.12); color: #29ff5a; border-color: rgba(41,255,90,.3); }
.dc-status-legacy { background: rgba(255,165,0,.12); color: #ffa500; border-color: rgba(255,165,0,.3); }
.dc-status-discontinued { background: rgba(255,45,107,.12); color: #ff2d6b; border-color: rgba(255,45,107,.3); }

/* Modding score strip */
.dc-score-strip {
  height: 3px;
  background: #0c1428;
  flex-shrink: 0;
}
.dc-score-fill {
  height: 100%;
  border-radius: 0 2px 2px 0;
  transition: width .6s cubic-bezier(.22,1,.36,1);
}

/* Body */
.dc-body {
  padding: 14px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.dc-series {
  font-family: 'Syne', sans-serif;
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #00ffe0;
}
.dc-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #eef4ff;
  line-height: 1.2;
  margin: 0;
}
.dc-codename {
  font-family: 'DM Mono', monospace;
  font-size: .7rem;
  color: #3d5578;
  letter-spacing: .04em;
}
.dc-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}
.dc-badge {
  padding: 2px 8px;
  font-family: 'Syne', sans-serif;
  font-size: .62rem;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  border-radius: 9999px;
  border: 1px solid;
  white-space: nowrap;
}
.dc-badge-chip { background: rgba(0,255,224,.07); color: #00ffe0; border-color: rgba(0,255,224,.2); }
.dc-badge-5g   { background: rgba(184,0,255,.07); color: #b800ff; border-color: rgba(184,0,255,.25); }
.dc-badge-nfc  { background: rgba(41,255,90,.07); color: #29ff5a; border-color: rgba(41,255,90,.2); }
.dc-badge-hyperos { background: rgba(255,165,0,.07); color: #ffa500; border-color: rgba(255,165,0,.2); }

/* Footer */
.dc-footer {
  padding: 10px 16px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid rgba(0,255,224,.05);
}
.dc-specs {
  font-family: 'DM Mono', monospace;
  font-size: .68rem;
  color: #7a99c2;
  line-height: 1.5;
}
.dc-btn-detail {
  padding: 6px 14px;
  background: #00ffe0;
  color: #03060f;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background .2s, box-shadow .2s, transform .15s;
  flex-shrink: 0;
}
.dc-btn-detail:hover {
  background: #33ffed;
  box-shadow: 0 0 16px rgba(0,255,224,.4);
  transform: translateY(-1px);
}
.dc-btn-compare {
  padding: 6px 10px;
  background: transparent;
  color: #7a99c2;
  font-family: 'Syne', sans-serif;
  font-size: .7rem;
  font-weight: 600;
  border: 1px solid rgba(122,153,194,.25);
  border-radius: 6px;
  cursor: pointer;
  transition: color .2s, border-color .2s, background .2s;
  white-space: nowrap;
}
.dc-btn-compare:hover,
.dc-btn-compare.in-compare {
  color: #00ffe0;
  border-color: rgba(0,255,224,.4);
  background: rgba(0,255,224,.06);
}
.dc-btn-compare.in-compare { color: #ff2d6b; border-color: rgba(255,45,107,.4); }

/* Skeleton */
.dc-skeleton {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0,255,224,.04);
  background: #070c1a;
  display: flex; flex-direction: column;
}
.dc-sk-img { aspect-ratio: 4/3; background: linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation: dc-shimmer 1.5s ease-in-out infinite; }
.dc-sk-body { padding: 14px 16px; display:flex; flex-direction:column; gap:8px; }
.dc-sk-line { height:12px; border-radius:4px; background: linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:dc-shimmer 1.5s ease-in-out infinite; }
.dc-sk-line.w80 { width:80%; }
.dc-sk-line.w50 { width:50%; }
.dc-sk-line.w30 { width:30%; }
.dc-sk-footer { padding:10px 16px 14px; border-top:1px solid rgba(0,255,224,.04); display:flex; gap:8px; }
.dc-sk-btn { height:30px; border-radius:6px; flex:1; background: linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:dc-shimmer 1.5s ease-in-out infinite; }
@keyframes dc-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    `;

    const style = document.createElement('style');
    style.id = 'xb-device-card-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── HELPERS ────────────────────────────────────────────── */
  const STATUS_MAP = {
    active:       { label: 'Active',       cls: 'dc-status-active' },
    legacy:       { label: 'Legacy',       cls: 'dc-status-legacy' },
    discontinued: { label: 'EOL',          cls: 'dc-status-discontinued' },
  };

  function getScoreColor(score) {
    if (score >= 70) return '#29ff5a';
    if (score >= 40) return '#ffa500';
    return '#ff2d6b';
  }

  function isInCompare(deviceId) {
    if (typeof State === 'undefined') return false;
    return (State.get('compareList') || []).includes(deviceId);
  }

  /* ── RENDER SINGLE CARD ─────────────────────────────────── */
  /**
   * @param {Object} device - Normalized device from DataTransformer
   * @param {Object} [options]
   * @param {boolean} [options.compact=false]
   * @param {boolean} [options.showCompare=true]
   * @param {Function} [options.onClick]
   * @returns {HTMLElement}
   */
  function render(device, options = {}) {
    injectStyles();
    const { compact = false, showCompare = true, onClick } = options;

    const status  = STATUS_MAP[device.status] || STATUS_MAP.active;
    const inComp  = isInCompare(device.id);
    const score   = device.modding_score || 0;
    const scoreColor = getScoreColor(score);

    const badges = [];
    if (device.chipset_brand && device.chipset_brand !== 'Unknown')
      badges.push(`<span class="dc-badge dc-badge-chip">${device.chipset_brand}</span>`);
    if (device.fiveg)
      badges.push(`<span class="dc-badge dc-badge-5g">5G</span>`);
    if (device.nfc)
      badges.push(`<span class="dc-badge dc-badge-nfc">NFC</span>`);
    if (device.has_hyperos)
      badges.push(`<span class="dc-badge dc-badge-hyperos">HyperOS</span>`);

    const article = document.createElement('article');
    article.className = `device-card${compact ? ' device-card--compact' : ''}`;
    article.setAttribute('data-device-id', device.id);
    article.setAttribute('role', 'article');
    article.setAttribute('aria-label', device.name);
    article.tabIndex = 0;

    article.innerHTML = `
      <!-- Image -->
      <div class="dc-img-wrap">
        <img
          src="${device.thumbnail}"
          alt="${device.name}"
          loading="lazy"
          decoding="async"
          onerror="this.src='${device.thumbnail_fallback || '/assets/img/devices/placeholder.webp'}'"
        >
        <span class="dc-status ${status.cls}" aria-label="Status: ${status.label}">
          ${status.label}
        </span>
      </div>

      <!-- Modding score color strip -->
      <div class="dc-score-strip" title="Modding score: ${score}/100" aria-hidden="true">
        <div class="dc-score-fill" style="width:${score}%;background:${scoreColor}"></div>
      </div>

      <!-- Body -->
      <div class="dc-body">
        <p class="dc-series">${device.series || device.brand}</p>
        <h3 class="dc-name">${device.name}</h3>
        <p class="dc-codename">${device.codename ? `[${device.codename}]` : ''}</p>
        <div class="dc-badges" aria-label="Features">
          ${badges.join('')}
        </div>
      </div>

      <!-- Footer -->
      <div class="dc-footer">
        <div class="dc-specs">
          <div>${device.ram_display || 'N/A'} RAM</div>
          <div>${device.display_size ? `${device.display_size}"` : ''} ${device.refresh_rate ? `• ${device.refresh_rate}Hz` : ''}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <a
            href="/device-detail.html?id=${device.id}"
            class="dc-btn-detail"
            aria-label="Lihat detail ${device.name}"
            onclick="event.stopPropagation()"
          >Detail</a>
          ${showCompare ? `
            <button
              class="dc-btn-compare${inComp ? ' in-compare' : ''}"
              data-compare-id="${device.id}"
              aria-label="${inComp ? 'Hapus dari compare' : 'Tambah ke compare'} ${device.name}"
              aria-pressed="${inComp}"
              onclick="event.stopPropagation()"
            >${inComp ? '✕' : '⇄'}</button>
          ` : ''}
        </div>
      </div>
    `;

    /* Card-level click → navigate to detail */
    article.addEventListener('click', e => {
      if (e.target.closest('a, button')) return; // let links/buttons handle themselves
      if (onClick) { onClick(device); return; }
      window.location.href = `/device-detail.html?id=${device.id}`;
    });
    article.addEventListener('keydown', e => {
      if (e.key === 'Enter') article.click();
    });

    /* Compare button */
    const compareBtn = article.querySelector('.dc-btn-compare');
    if (compareBtn) {
      compareBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof State !== 'undefined') {
          State.dispatch('COMPARE_TOGGLE', device.id);
          const nowIn = isInCompare(device.id);
          compareBtn.classList.toggle('in-compare', nowIn);
          compareBtn.textContent = nowIn ? '✕' : '⇄';
          compareBtn.setAttribute('aria-pressed', String(nowIn));
          compareBtn.setAttribute('aria-label',
            `${nowIn ? 'Hapus dari compare' : 'Tambah ke compare'} ${device.name}`);
        }
      });
    }

    return article;
  }

  /* ── RENDER GRID ────────────────────────────────────────── */
  /**
   * Clear container and render all device cards.
   * @param {HTMLElement} container
   * @param {Object[]} devices
   * @param {Object} [options]
   */
  function renderGrid(container, devices, options = {}) {
    container.innerHTML = '';

    if (!devices || !devices.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">📱</div>
          <p class="empty-state__title">Tidak ada device ditemukan</p>
          <p class="empty-state__text">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    devices.forEach((device, i) => {
      const card = render(device, options);
      // Stagger animation
      card.style.setProperty('--stagger-delay', `${i * 40}ms`);
      card.classList.add('reveal');
      fragment.appendChild(card);
    });
    container.appendChild(fragment);

    // Trigger reveal animation via IntersectionObserver
    if (window.IntersectionObserver) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.08 });
      container.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    } else {
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    }
  }

  /* ── RENDER SKELETON ────────────────────────────────────── */
  /**
   * @param {number} [count=12]
   * @returns {HTMLElement[]}
   */
  function renderSkeleton(count = 12) {
    injectStyles();
    return Array.from({ length: count }, () => {
      const el = document.createElement('div');
      el.className = 'dc-skeleton';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="dc-sk-img"></div>
        <div class="dc-sk-body">
          <div class="dc-sk-line w30"></div>
          <div class="dc-sk-line w80"></div>
          <div class="dc-sk-line w50"></div>
        </div>
        <div class="dc-sk-footer">
          <div class="dc-sk-btn"></div>
          <div class="dc-sk-btn"></div>
        </div>
      `;
      return el;
    });
  }

  return { render, renderGrid, renderSkeleton };

})();

window.DeviceCard = DeviceCard;
