/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  tutorialCard.js — Xiaomi Basecamp Component v1.0              ║
 * ║  Tutorial cards with difficulty color badges + category chips.  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  DIFFICULTY → COLOR:
 *    Pemula   → lime  (#29ff5a)
 *    Menengah → amber (#ffa500)
 *    Mahir    → blaze (#ff2d6b)
 *
 *  USAGE:
 *    const card = TutorialCard.render(tutorial);
 *    TutorialCard.renderGrid(containerEl, tutorials);
 *    TutorialCard.renderSkeleton(6).forEach(s => container.appendChild(s));
 */

'use strict';

const TutorialCard = (() => {

  let _styleInjected = false;

  /* ── DIFFICULTY CONFIG ──────────────────────────────────── */
  const DIFFICULTY_MAP = {
    'Pemula':   { color: '#29ff5a', bg: 'rgba(41,255,90,.10)',  border: 'rgba(41,255,90,.28)',  label: 'Pemula'   },
    'Menengah': { color: '#ffa500', bg: 'rgba(255,165,0,.10)',  border: 'rgba(255,165,0,.28)',  label: 'Menengah' },
    'Mahir':    { color: '#ff2d6b', bg: 'rgba(255,45,107,.10)', border: 'rgba(255,45,107,.28)', label: 'Mahir'    },
  };

  /* ── CATEGORY ICONS ─────────────────────────────────────── */
  const CATEGORY_ICONS = {
    bootloader: '🔓', recovery: '🛡', root: '⚡',
    flashing: '💾', modding: '🔩', tips: '💡',
    kernel: '⚙', unbrick: '🔧',
  };

  function getDifficulty(d) {
    return DIFFICULTY_MAP[d] || DIFFICULTY_MAP['Pemula'];
  }

  function getCatIcon(cat = '') {
    return CATEGORY_ICONS[cat.toLowerCase()] || '📖';
  }

  function injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;

    const css = `
/* ══ TUTORIAL CARD ═══════════════════════════════════════════ */
.tut-card {
  position: relative;
  background: rgba(7,12,26,0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0,255,224,0.07);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: border-color .25s, box-shadow .25s, transform .25s;
}
.tut-card:hover {
  border-color: rgba(0,255,224,.28);
  box-shadow: 0 10px 36px rgba(0,0,0,.5), 0 0 20px rgba(0,255,224,.08);
  transform: translateY(-4px);
}

/* Thumbnail */
.tc2-thumb {
  position: relative;
  aspect-ratio: 16/9;
  background: #0c1428;
  overflow: hidden;
  flex-shrink: 0;
}
.tc2-thumb img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .4s cubic-bezier(.22,1,.36,1);
  opacity: .85;
}
.tut-card:hover .tc2-thumb img { transform: scale(1.05); opacity: 1; }
.tc2-thumb-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem;
  background: linear-gradient(135deg, #0c1428, #132034);
}

/* Overlay badges on thumb */
.tc2-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px;
  pointer-events: none;
}
.tc2-diff {
  padding: 3px 10px;
  border-radius: 9999px; border: 1px solid;
  font-family: 'Syne', sans-serif;
  font-size: .62rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  line-height: 1.4;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.tc2-cat-chip {
  padding: 3px 10px;
  background: rgba(3,6,15,.7);
  border: 1px solid rgba(0,255,224,.15);
  border-radius: 9999px;
  font-family: 'Syne', sans-serif;
  font-size: .62rem;
  color: #00ffe0;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; gap: 4px;
}

/* Body */
.tc2-body { padding: 14px 16px 10px; flex: 1; display: flex; flex-direction: column; gap: 7px; }
.tc2-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.05rem; font-weight: 700;
  color: #eef4ff; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.tc2-meta {
  display: flex; align-items: center; gap: 12px;
  font-family: 'DM Mono', monospace;
  font-size: .68rem; color: #3d5578;
}
.tc2-meta-item { display: flex; align-items: center; gap: 4px; }
.tc2-meta-dot { font-size: .5rem; }

/* Tags */
.tc2-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tc2-tag {
  padding: 2px 8px;
  background: rgba(0,255,224,.06);
  border: 1px solid rgba(0,255,224,.13);
  border-radius: 9999px;
  font-family: 'Syne', sans-serif;
  font-size: .6rem; color: #7a99c2;
  white-space: nowrap;
}

/* Footer */
.tc2-footer {
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(0,255,224,.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tc2-views {
  font-family: 'DM Mono', monospace;
  font-size: .65rem; color: #1e3050;
}
.tc2-btn {
  padding: 6px 14px;
  background: #00ffe0;
  color: #03060f;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: .75rem; font-weight: 700;
  letter-spacing: .07em; text-transform: uppercase;
  border: none; border-radius: 6px;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 5px;
  transition: background .2s, box-shadow .2s, transform .15s;
  white-space: nowrap;
}
.tc2-btn:hover {
  background: #33ffed;
  box-shadow: 0 0 16px rgba(0,255,224,.4);
  transform: translateY(-1px);
}

/* Skeleton */
.tut-skeleton {
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(0,255,224,.04);
  background: #070c1a;
}
.tut-sk-thumb { aspect-ratio:16/9; background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:tut-shimmer 1.5s ease-in-out infinite; }
.tut-sk-body { padding:14px 16px 10px; display:flex; flex-direction:column; gap:8px; }
.tut-sk-line { height:11px; border-radius:4px; background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:tut-shimmer 1.5s ease-in-out infinite; }
.tut-sk-line.w90{width:90%}.tut-sk-line.w60{width:60%}.tut-sk-line.w40{width:40%}
.tut-sk-footer { padding:10px 16px 14px; display:flex; justify-content:flex-end; }
.tut-sk-btn { height:30px; width:120px; border-radius:6px; background:linear-gradient(90deg,#070c1a 25%,#132034 50%,#070c1a 75%); background-size:200% 100%; animation:tut-shimmer 1.5s ease-in-out infinite; }
@keyframes tut-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    `;
    const style = document.createElement('style');
    style.id = 'xb-tut-card-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── HELPERS ────────────────────────────────────────────── */
  function formatViews(n = 0) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K views';
    return n + ' views';
  }

  function countSteps(tutorial) {
    return (tutorial.steps || []).length || 0;
  }

  /* ── RENDER SINGLE CARD ─────────────────────────────────── */
  /**
   * @param {Object} tutorial - Tutorial data object
   * @param {Object} [options]
   * @returns {HTMLElement}
   */
  function render(tutorial, options = {}) {
    injectStyles();
    const diff    = getDifficulty(tutorial.difficulty);
    const catIcon = getCatIcon(tutorial.category);
    const steps   = countSteps(tutorial);
    const tags    = (tutorial.tags || []).slice(0, 3);

    const thumbHTML = tutorial.thumbnail
      ? `<img src="${tutorial.thumbnail}" alt="${tutorial.title}" loading="lazy" decoding="async"
              onerror="this.parentElement.innerHTML='<div class=tc2-thumb-placeholder>${catIcon}</div>'">`
      : `<div class="tc2-thumb-placeholder" aria-hidden="true">${catIcon}</div>`;

    const article = document.createElement('article');
    article.className = 'tut-card';
    article.setAttribute('data-tutorial-id', tutorial.id);
    article.setAttribute('aria-label', tutorial.title);
    article.tabIndex = 0;

    article.innerHTML = `
      <!-- Thumbnail -->
      <div class="tc2-thumb">
        ${thumbHTML}
        <div class="tc2-overlay" aria-hidden="true">
          <span class="tc2-diff" style="background:${diff.bg};border-color:${diff.border};color:${diff.color}">
            ${diff.label}
          </span>
          <span class="tc2-cat-chip">
            ${catIcon} ${tutorial.category || 'Tutorial'}
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="tc2-body">
        <h3 class="tc2-title">${tutorial.title}</h3>
        <div class="tc2-meta">
          <span class="tc2-meta-item">⏱ ${tutorial.estimated_time || '?'}</span>
          ${steps > 0 ? `<span class="tc2-meta-dot">·</span>
          <span class="tc2-meta-item">📋 ${steps} steps</span>` : ''}
        </div>
        ${tags.length ? `
          <div class="tc2-tags">
            ${tags.map(t => `<span class="tc2-tag">${t}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="tc2-footer">
        <span class="tc2-views" aria-label="${tutorial.views || 0} views">
          👁 ${formatViews(tutorial.views || 0)}
        </span>
        <a
          href="/tutorial-detail.html?id=${tutorial.id}"
          class="tc2-btn"
          aria-label="Buka tutorial: ${tutorial.title}"
          onclick="event.stopPropagation()"
        >▶ Mulai</a>
      </div>
    `;

    /* Card click */
    article.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      window.location.href = `/tutorial-detail.html?id=${tutorial.id}`;
    });
    article.addEventListener('keydown', e => {
      if (e.key === 'Enter') article.click();
    });

    return article;
  }

  /* ── RENDER GRID ────────────────────────────────────────── */
  function renderGrid(container, tutorials, options = {}) {
    container.innerHTML = '';

    if (!tutorials || !tutorials.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">📖</div>
          <p class="empty-state__title">Tidak ada tutorial ditemukan</p>
          <p class="empty-state__text">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    tutorials.forEach((tutorial, i) => {
      const card = render(tutorial, options);
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
      el.className = 'tut-skeleton';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `
        <div class="tut-sk-thumb"></div>
        <div class="tut-sk-body">
          <div class="tut-sk-line w90"></div>
          <div class="tut-sk-line w60"></div>
          <div class="tut-sk-line w40"></div>
        </div>
        <div class="tut-sk-footer">
          <div class="tut-sk-btn"></div>
        </div>
      `;
      return el;
    });
  }

  return { render, renderGrid, renderSkeleton };

})();

window.TutorialCard = TutorialCard;
