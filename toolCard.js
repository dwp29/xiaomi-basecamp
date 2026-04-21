/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  toolCard.js — Xiaomi Basecamp Component v1.0                  ║
 * ║  Tool cards with category-based neon glow accents.             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  CATEGORY → COLOR MAPPING:
 *    root      → acid cyan   (#00ffe0)
 *    recovery  → volt purple (#b800ff)
 *    kernel    → amber       (#ffa500)
 *    audio     → blaze pink  (#ff2d6b)
 *    camera    → lime green  (#29ff5a)
 *    module    → acid cyan   (#00ffe0)
 *    utility   → t2 blue     (#7a99c2)
 *
 *  USAGE:
 *    const card = ToolCard.render(tool);
 *    ToolCard.renderGrid(containerEl, tools);
 *    ToolCard.renderSkeleton(8).forEach(s => container.appendChild(s));
 */

'use strict';

const ToolCard = (() => {

  let _styleInjected = false;

  /* ── CATEGORY CONFIG ────────────────────────────────────── */
  const CATEGORY_MAP = {
    root:     { color: '#00ffe0', glow: 'rgba(0,255,224,.35)',   bg: 'rgba(0,255,224,.07)',   label: 'Root',     icon: '⚡' },
    recovery: { color: '#b800ff', glow: 'rgba(184,0,255,.35)',   bg: 'rgba(184,0,255,.07)',   label: 'Recovery', icon: '🛡' },
    kernel:   { color: '#ffa500', glow: 'rgba(255,165,0,.35)',   bg: 'rgba(255,165,0,.07)',   label: 'Kernel',   icon: '⚙' },
    audio:    { color: '#ff2d6b', glow: 'rgba(255,45,107,.35)',  bg: 'rgba(255,45,107,.07)',  label: 'Audio',    icon: '🎵' },
    camera:   { color: '#29ff5a', glow: 'rgba(41,255,90,.35)',   bg: 'rgba(41,255,90,.07)',   label: 'Camera',   icon: '📷' },
    module:   { color: '#00ffe0', glow: 'rgba(0,255,224,.35)',   bg: 'rgba(0,255,224,.07)',   label: 'Module',   icon: '🔩' },
    utility:  { color: '#7a99c2', glow: 'rgba(122,153,194,.25)', bg: 'rgba(122,153,194,.07)', label: 'Utility',  icon: '🔧' },
    flashing: { color: '#ffa500', glow: 'rgba(255,165,0,.35)',   bg: 'rgba(255,165,0,.07)',   label: 'Flashing', icon: '💾' },
  };

  function getCat(category = 'utility') {
    return CATEGORY_MAP[category.toLowerCase()] || CATEGORY_MAP.utility;
  }

  function injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;

    const css = `
/* ══ TOOL CARD ════════════════════════════════════════════════ */
.tool-card {
  position: relative;
  background: rgba(7,12,26,0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--tc-border, rgba(0,255,224,0.08));
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color .25s, box-shadow .25s, transform .25s;
  cursor: default;
}
.tool-card:hover {
  border-color: var(--tc-color-alpha, rgba(0,255,224,0.32));
  box-shadow: 0 10px 36px rgba(0,0,0,.5), 0 0 20px var(--tc-glow, rgba(0,255,224,.12));
  transform: translateY(-4px);
}

/* Top accent line */
.tc-accent-line {
  height: 2px;
  background: var(--tc-color, #00ffe0);
  box-shadow: 0 0 10px var(--tc-color, #00ffe0);
  flex-shrink: 0;
}

/* Header */
.tc-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 8px;
}
.tc-icon-wrap {
  width: 48px; height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--tc-bg, rgba(0,255,224,.07));
  border: 1px solid var(--tc-border, rgba(0,255,224,.15));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
  overflow: hidden;
}
.tc-icon-wrap img {
  width: 100%; height: 100%;
  object-fit: contain; padding: 6px;
}
.tc-header-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.tc-cat-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  background: var(--tc-bg, rgba(0,255,224,.07));
  border: 1px solid var(--tc-border, rgba(0,255,224,.2));
  border-radius: 9999px;
  font-family: 'Syne', sans-serif;
  font-size: .6rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--tc-color, #00ffe0);
  width: fit-content;
}
.tc-version {
  font-family: 'DM Mono', monospace;
  font-size: .7rem;
  color: var(--tc-color, #00ffe0);
}
.tc-beta { color: #ffa500; margin-left: 4px; font-size:.6rem; }
.tc-status-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--tc-color, #00ffe0);
  box-shadow: 0 0 6px var(--tc-color, #00ffe0);
  animation: xb-blink 2.5s ease-in-out infinite;
}

/* Body */
.tc-body { padding: 4px 16px 10px; flex: 1; }
.tc-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.05rem; font-weight: 700;
  color: #eef4ff;
  margin-bottom: 3px;
}
.tc-developer {
  font-family: 'Syne', sans-serif;
  font-size: .72rem;
  color: #3d5578;
  margin-bottom: 6px;
}
.tc-desc {
  font-family: 'Syne', sans-serif;
  font-size: .78rem;
  color: #7a99c2;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Compat badges */
.tc-compat {
  display: flex; flex-wrap: wrap; gap: 4px;
  padding: 0 16px 10px;
}
.tc-compat-badge {
  padding: 2px 7px;
  background: rgba(122,153,194,.07);
  border: 1px solid rgba(122,153,194,.15);
  border-radius: 9999px;
  font-family: 'DM Mono', monospace;
  font-size: .6rem;
  color: #7a99c2;
}
.tc-open-source {
  background: rgba(41,255,90,.06);
  border-color: rgba(41,255,90,.15);
  color: #29ff5a;
}

/* Footer */
.tc-footer {
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(255,255,255,.04);
  display: flex;
  align-items: center;
  gap: 8px;
}
.tc-btn-download {
  flex: 1;
  padding: 7px 12px;
  background: var(--tc-color, #00ffe0);
  color: #03060f;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: .78rem; font-weight: 700;
  letter-spacing: .07em; text-transform: uppercase;
  border: none; border-radius: 7px;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  transition: filter .2s, box-shadow .2s, transform .15s;
}
.tc-btn-download:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 18px var(--tc-glow, rgba(0,255,224,.4));
  transform: translateY(-1px);
}
.tc-btn-gh {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(122,153,194,.08);
  border: 1px solid rgba(122,153,194,.18);
  border-radius: 7px;
  color: #7a99c2;
  font-size: .9rem;
  text-decoration: none;
  transition: color .2s, border-color .2s, background .2s;
  flex-shrink: 0;
}
.tc-btn-gh:hover { color: #eef4ff; border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.06); }

/* Skeleton */
.tc-skeleton {
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(0,255,224,.04);
  background: #070c1a;
}
.tc-sk-line { height: 2px; width: 100%; background: linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:tc-shimmer 1.5s ease-in-out infinite; }
.tc-sk-header { display:flex; gap:12px; padding:14px 16px 8px; }
.tc-sk-icon { width:48px;height:48px;border-radius:10px;flex-shrink:0;background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%);background-size:200% 100%;animation:tc-shimmer 1.5s ease-in-out infinite; }
.tc-sk-meta { flex:1;display:flex;flex-direction:column;gap:8px;justify-content:center; }
.tc-sk-text { height:10px;border-radius:4px;background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%);background-size:200% 100%;animation:tc-shimmer 1.5s ease-in-out infinite; }
.tc-sk-text.w60{width:60%}.tc-sk-text.w80{width:80%}
.tc-sk-body { padding:4px 16px 10px;display:flex;flex-direction:column;gap:6px; }
.tc-sk-footer { padding:10px 16px 14px;display:flex;gap:8px; }
.tc-sk-btn { height:32px;border-radius:7px;flex:1;background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%);background-size:200% 100%;animation:tc-shimmer 1.5s ease-in-out infinite; }
.tc-sk-btn-sm { width:34px;flex:none; }
@keyframes tc-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    `;
    const style = document.createElement('style');
    style.id = 'xb-tool-card-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── RENDER SINGLE CARD ─────────────────────────────────── */
  /**
   * @param {Object} tool - Tool data object
   * @param {Object} [options]
   * @returns {HTMLElement}
   */
  function render(tool, options = {}) {
    injectStyles();
    const cat = getCat(tool.category);
    const compat = tool.compatibility || {};
    const ghUrl = tool.download?.github || null;
    const dlUrl = tool.download?.latest_apk || tool.download?.github || '#';

    const article = document.createElement('article');
    article.className = 'tool-card';
    article.setAttribute('data-tool-id', tool.id);
    article.setAttribute('aria-label', `${tool.name} — ${cat.label}`);

    // Set CSS variables for category theming
    article.style.setProperty('--tc-color',       cat.color);
    article.style.setProperty('--tc-glow',        cat.glow);
    article.style.setProperty('--tc-bg',          cat.bg);
    article.style.setProperty('--tc-border',      cat.color.replace(')', ', .15)').replace('rgb', 'rgba'));
    article.style.setProperty('--tc-color-alpha', cat.color.replace(')', ', .32)').replace('rgb', 'rgba'));

    // Build compat badge list
    const compatBadges = [];
    if (compat.android_min) compatBadges.push(`Android ${compat.android_min}+`);
    if (compat.android_max) compatBadges.push(`≤ ${compat.android_max}`);
    if (tool.open_source)   compatBadges.push('Open Source');
    if (compat.ab_device)   compatBadges.push('A/B Device');

    const logoHTML = tool.logo
      ? `<img src="${tool.logo}" alt="${tool.name} logo" loading="lazy" onerror="this.parentElement.textContent='${cat.icon}'">`
      : cat.icon;

    article.innerHTML = `
      <div class="tc-accent-line" aria-hidden="true"></div>

      <div class="tc-header">
        <div class="tc-icon-wrap" aria-hidden="true">${logoHTML}</div>
        <div class="tc-header-meta">
          <span class="tc-cat-badge">${cat.icon} ${cat.label}</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="tc-status-dot" aria-hidden="true"></span>
            <span class="tc-version">v${tool.version_stable || '?'}</span>
            ${tool.version_beta ? `<span class="tc-beta">β ${tool.version_beta}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="tc-body">
        <h3 class="tc-name">${tool.name}</h3>
        <p class="tc-developer">by ${tool.developer || 'Unknown'}</p>
        <p class="tc-desc">${tool.description || ''}</p>
      </div>

      ${compatBadges.length ? `
        <div class="tc-compat">
          ${compatBadges.map((b, i) =>
            `<span class="tc-compat-badge${i === compatBadges.length - 1 && tool.open_source ? ' tc-open-source' : ''}">${b}</span>`
          ).join('')}
        </div>
      ` : ''}

      <div class="tc-footer">
        <a
          href="${dlUrl}"
          target="_blank" rel="noopener noreferrer"
          class="tc-btn-download"
          aria-label="Download ${tool.name}"
        >↓ Download</a>
        ${ghUrl ? `
          <a
            href="${ghUrl}"
            target="_blank" rel="noopener noreferrer"
            class="tc-btn-gh"
            aria-label="${tool.name} GitHub repository"
          >⌨</a>
        ` : ''}
      </div>
    `;

    return article;
  }

  /* ── RENDER GRID ────────────────────────────────────────── */
  function renderGrid(container, tools, options = {}) {
    container.innerHTML = '';

    if (!tools || !tools.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🔧</div>
          <p class="empty-state__title">Tidak ada tool ditemukan</p>
          <p class="empty-state__text">Coba ubah filter atau kategori.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    tools.forEach((tool, i) => {
      const card = render(tool, options);
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
  function renderSkeleton(count = 8) {
    injectStyles();
    return Array.from({ length: count }, () => {
      const el = document.createElement('div');
      el.className = 'tc-skeleton';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="tc-sk-line"></div>
        <div class="tc-sk-header">
          <div class="tc-sk-icon"></div>
          <div class="tc-sk-meta">
            <div class="tc-sk-text w60"></div>
            <div class="tc-sk-text w80"></div>
          </div>
        </div>
        <div class="tc-sk-body">
          <div class="tc-sk-text w80"></div>
          <div class="tc-sk-text w60"></div>
        </div>
        <div class="tc-sk-footer">
          <div class="tc-sk-btn"></div>
          <div class="tc-sk-btn tc-sk-btn-sm"></div>
        </div>
      `;
      return el;
    });
  }

  /**
   * Get the accent color for a category.
   * @param {string} category
   * @returns {string} CSS hex color
   */
  function getCategoryColor(category) {
    return getCat(category).color;
  }

  return { render, renderGrid, renderSkeleton, getCategoryColor };

})();

window.ToolCard = ToolCard;
