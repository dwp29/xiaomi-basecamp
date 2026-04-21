/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  navbar.js — Xiaomi Basecamp Component v1.0                    ║
 * ║  Sticky glassmorphism navbar with mega dropdown + mobile menu  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 *  USAGE:
 *    Navbar.init('nav-root');
 *
 *  FEATURES:
 *    - Glassmorphism sticky header with scroll shadow
 *    - Animated logo with blinking acid dot
 *    - Mega dropdown (hover desktop / click mobile)
 *    - Slide-in mobile menu with overlay
 *    - Active page detection from URL
 *    - Compare badge counter (reads from State)
 *    - Search shortcut icon
 *    - Inline CSS injected once (no external dep)
 */

'use strict';

const Navbar = (() => {

  /* ── CONFIG DEFAULTS ────────────────────────────────────── */
  const DEFAULT_CONFIG = {
    logoText: 'BASECAMP',
    logoAccent: 'XM',
    github: 'https://github.com/xiaomi-basecamp/portal',
    telegram: 'https://t.me/xiaomi_basecamp',
    links: [
      {
        label: 'Devices',
        href: '/devices.html',
        icon: '📱',
        dropdown: [
          { label: 'Xiaomi Series',  href: '/devices.html?series=Xiaomi' },
          { label: 'Redmi Series',   href: '/devices.html?series=Redmi' },
          { label: 'POCO Series',    href: '/devices.html?series=POCO' },
          { label: 'Mi Series',      href: '/devices.html?series=Mi' },
          { label: 'Semua Device',   href: '/devices.html' },
        ],
      },
      {
        label: 'Custom ROM',
        href: '/roms.html',
        icon: '💿',
        dropdown: [
          { label: 'AOSP Based',       href: '/roms.html?type=AOSP' },
          { label: 'HyperOS Based',    href: '/roms.html?type=HyperOS-based' },
          { label: 'MIUI Based',       href: '/roms.html?type=MIUI-based' },
          { label: 'Semua ROM',        href: '/roms.html' },
        ],
      },
      {
        label: 'Root & Tools',
        href: '/tools.html',
        icon: '🔧',
        dropdown: [
          { label: 'Root Tools',    href: '/tools.html?cat=root' },
          { label: 'Recovery',      href: '/tools.html?cat=recovery' },
          { label: 'Kernel',        href: '/tools.html?cat=kernel' },
          { label: 'Audio Mods',    href: '/tools.html?cat=audio' },
          { label: 'GCam',          href: '/tools.html?cat=camera' },
          { label: 'Semua Tools',   href: '/tools.html' },
        ],
      },
      {
        label: 'Tutorial',
        href: '/tutorials.html',
        icon: '📖',
        dropdown: [
          { label: 'Unlock Bootloader', href: '/tutorials.html?cat=bootloader' },
          { label: 'Install Recovery',  href: '/tutorials.html?cat=recovery' },
          { label: 'Root & Magisk',     href: '/tutorials.html?cat=root' },
          { label: 'Flash ROM',         href: '/tutorials.html?cat=flashing' },
          { label: 'ADB & Fastboot',    href: '/tutorials.html?cat=flashing' },
          { label: 'Semua Tutorial',    href: '/tutorials.html' },
        ],
      },
    ],
  };

  /* ── STATE ──────────────────────────────────────────────── */
  let _config = {};
  let _navEl = null;
  let _mobileOpen = false;
  let _activeDropdown = null;
  let _scrolled = false;
  let _compareCount = 0;
  let _styleInjected = false;

  /* ── STYLE INJECTION ────────────────────────────────────── */
  function injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;

    const css = `
/* ══ NAVBAR ══════════════════════════════════════════════ */
#xb-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px;
  z-index: 800;
  display: flex;
  align-items: center;
  background: rgba(3,6,15,0.88);
  border-bottom: 1px solid rgba(0,255,224,0.06);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  transition: border-color .25s, box-shadow .25s;
}
#xb-nav.scrolled {
  border-color: rgba(0,255,224,0.12);
  box-shadow: 0 4px 24px rgba(0,0,0,.5);
}
.xb-nav-inner {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* Logo */
.xb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.xb-logo-dot {
  width: 9px; height: 9px;
  background: #00ffe0;
  border-radius: 50%;
  box-shadow: 0 0 12px #00ffe0;
  animation: xb-blink 2s ease-in-out infinite;
  flex-shrink: 0;
}
.xb-logo-text {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #eef4ff;
}
.xb-logo-text span { color: #00ffe0; }
@keyframes xb-blink {
  0%,100% { opacity: 1; }
  50% { opacity: .25; }
}
/* Nav Links */
.xb-links {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  list-style: none;
}
.xb-link-item {
  position: relative;
}
.xb-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: .85rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #7a99c2;
  text-decoration: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color .2s, background .2s;
  white-space: nowrap;
  border: none;
  background: none;
}
.xb-link:hover,
.xb-link.active {
  color: #00ffe0;
  background: rgba(0,255,224,.06);
}
.xb-link.active { color: #00ffe0; }
.xb-chevron {
  font-size: .6rem;
  opacity: .6;
  transition: transform .2s;
}
.xb-link-item.open .xb-chevron { transform: rotate(180deg); }
/* Dropdown */
.xb-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(-6px);
  min-width: 200px;
  background: rgba(7,12,26,.96);
  border: 1px solid rgba(0,255,224,.12);
  border-radius: 12px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity .18s, transform .18s;
  z-index: 900;
  box-shadow: 0 16px 48px rgba(0,0,0,.5), 0 0 0 1px rgba(0,255,224,.05);
  list-style: none;
}
.xb-link-item:hover .xb-dropdown,
.xb-link-item.open .xb-dropdown {
  opacity: 1;
  pointer-events: all;
  transform: translateX(-50%) translateY(0);
}
.xb-dropdown a {
  display: block;
  padding: 8px 14px;
  font-family: 'Syne', sans-serif;
  font-size: .8rem;
  color: #7a99c2;
  border-radius: 8px;
  text-decoration: none;
  transition: color .15s, background .15s;
  white-space: nowrap;
}
.xb-dropdown a:hover { color: #00ffe0; background: rgba(0,255,224,.06); }
/* Right actions */
.xb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  flex-shrink: 0;
}
.xb-icon-btn {
  position: relative;
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,255,224,.05);
  border: 1px solid rgba(0,255,224,.1);
  border-radius: 8px;
  color: #7a99c2;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  transition: color .2s, border-color .2s, background .2s;
}
.xb-icon-btn:hover { color: #00ffe0; border-color: rgba(0,255,224,.35); background: rgba(0,255,224,.08); }
.xb-compare-badge {
  position: absolute;
  top: -5px; right: -5px;
  width: 16px; height: 16px;
  background: #ff2d6b;
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-size: .6rem;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #03060f;
  display: none;
}
.xb-compare-badge.visible { display: flex; }
/* Hamburger */
.xb-hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  width: 36px; height: 36px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
.xb-hamburger span {
  display: block;
  width: 22px; height: 2px;
  background: #7a99c2;
  border-radius: 2px;
  transition: all .25s;
}
.xb-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); background: #00ffe0; }
.xb-hamburger.open span:nth-child(2) { opacity: 0; }
.xb-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); background: #00ffe0; }
/* Mobile overlay */
.xb-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3,6,15,.7);
  backdrop-filter: blur(4px);
  z-index: 790;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s;
}
.xb-overlay.open { opacity: 1; pointer-events: all; }
/* Mobile drawer */
.xb-mobile-menu {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 280px;
  background: #070c1a;
  border-left: 1px solid rgba(0,255,224,.12);
  z-index: 850;
  transform: translateX(100%);
  transition: transform .28s cubic-bezier(.22,1,.36,1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 72px 0 24px;
}
.xb-mobile-menu.open { transform: translateX(0); }
.xb-mobile-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #7a99c2;
  text-decoration: none;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  transition: color .2s, background .2s;
}
.xb-mobile-link:hover,
.xb-mobile-link.active { color: #00ffe0; background: rgba(0,255,224,.05); }
.xb-mobile-submenu {
  display: none;
  background: rgba(0,0,0,.2);
  border-top: 1px solid rgba(0,255,224,.05);
}
.xb-mobile-submenu.open { display: block; }
.xb-mobile-submenu a {
  display: block;
  padding: 10px 36px;
  font-family: 'Syne', sans-serif;
  font-size: .82rem;
  color: #3d5578;
  text-decoration: none;
  transition: color .15s;
}
.xb-mobile-submenu a:hover { color: #00ffe0; }
.xb-mobile-footer {
  margin-top: auto;
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid rgba(0,255,224,.08);
}
.xb-mobile-footer a {
  font-family: 'Syne', sans-serif;
  font-size: .75rem;
  color: #3d5578;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.xb-mobile-footer a:hover { color: #00ffe0; }
/* Responsive */
@media (max-width: 900px) {
  .xb-links { display: none; }
  .xb-hamburger { display: flex; }
}
@media (min-width: 901px) {
  .xb-mobile-menu,
  .xb-overlay { display: none !important; }
}
    `;

    const style = document.createElement('style');
    style.id = 'xb-nav-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── HELPERS ────────────────────────────────────────────── */
  function getCurrentPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  function isActive(href) {
    const current = getCurrentPage();
    const target = href.split('/').pop().split('?')[0];
    return current === target || (current === '' && target === 'index.html');
  }

  function updateCompareBadge() {
    const badge = _navEl?.querySelector('.xb-compare-badge');
    if (!badge) return;
    const count = (typeof State !== 'undefined')
      ? (State.get('compareList') || []).length
      : _compareCount;
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function renderLinks(links) {
    return links.map(link => {
      const hasDropdown = link.dropdown && link.dropdown.length;
      const active = isActive(link.href) ? 'active' : '';

      const dropdownHTML = hasDropdown ? `
        <ul class="xb-dropdown" role="menu">
          ${link.dropdown.map(d => `
            <li role="menuitem">
              <a href="${d.href}">${d.label}</a>
            </li>
          `).join('')}
        </ul>
      ` : '';

      return `
        <li class="xb-link-item" role="none">
          ${hasDropdown
            ? `<button class="xb-link ${active}" aria-haspopup="true" aria-expanded="false" data-href="${link.href}">
                ${link.label}
                <span class="xb-chevron" aria-hidden="true">▾</span>
               </button>`
            : `<a class="xb-link ${active}" href="${link.href}">${link.label}</a>`
          }
          ${dropdownHTML}
        </li>
      `;
    }).join('');
  }

  function renderMobileLinks(links) {
    return links.map((link, i) => {
      const hasDropdown = link.dropdown && link.dropdown.length;
      const active = isActive(link.href) ? 'active' : '';

      return `
        <div>
          ${hasDropdown
            ? `<button class="xb-mobile-link ${active}" data-mobile-toggle="${i}" aria-expanded="false">
                ${link.icon || ''} ${link.label}
                <span aria-hidden="true">▾</span>
               </button>
               <div class="xb-mobile-submenu" id="xb-sub-${i}">
                 ${link.dropdown.map(d => `<a href="${d.href}">${d.label}</a>`).join('')}
               </div>`
            : `<a class="xb-mobile-link ${active}" href="${link.href}">${link.icon || ''} ${link.label}</a>`
          }
        </div>
      `;
    }).join('');
  }

  function render(container) {
    const { links, logoText, logoAccent, github, telegram } = _config;

    container.innerHTML = `
      <!-- AD PLACEHOLDER — POP-UNDER: insert pop-under script here -->

      <nav id="xb-nav" role="navigation" aria-label="Main navigation">
        <div class="xb-nav-inner">

          <!-- Logo -->
          <a href="/index.html" class="xb-logo" aria-label="Xiaomi Basecamp Home">
            <span class="xb-logo-dot" aria-hidden="true"></span>
            <span class="xb-logo-text">
              ${logoText}<span>${logoAccent}</span>
            </span>
          </a>

          <!-- Desktop nav links -->
          <ul class="xb-links" role="menubar">
            ${renderLinks(links)}
          </ul>

          <!-- Right actions -->
          <div class="xb-actions">
            <a href="/search.html" class="xb-icon-btn" aria-label="Search" title="Cari">
              🔍
            </a>
            <a href="/compare.html" class="xb-icon-btn" aria-label="Compare devices" title="Compare">
              ⇄
              <span class="xb-compare-badge" aria-live="polite" aria-label="Items to compare"></span>
            </a>
            <a href="${github}" target="_blank" rel="noopener noreferrer"
               class="xb-icon-btn hide-mobile" aria-label="GitHub repository">
              ⌨
            </a>
            <button class="xb-hamburger" id="xb-hamburger"
                    aria-label="Toggle mobile menu" aria-expanded="false" aria-controls="xb-mobile-menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Mobile overlay -->
      <div class="xb-overlay" id="xb-overlay" aria-hidden="true"></div>

      <!-- Mobile drawer -->
      <nav class="xb-mobile-menu" id="xb-mobile-menu"
           aria-label="Mobile navigation" aria-hidden="true">
        ${renderMobileLinks(links)}
        <div class="xb-mobile-footer">
          <a href="${telegram}" target="_blank" rel="noopener noreferrer">
            📢 Telegram
          </a>
          <a href="${github}" target="_blank" rel="noopener noreferrer">
            ⌨ GitHub
          </a>
        </div>
      </nav>
    `;
  }

  /* ── EVENT BINDING ──────────────────────────────────────── */
  function bindEvents() {
    const nav       = document.getElementById('xb-nav');
    const hamburger = document.getElementById('xb-hamburger');
    const overlay   = document.getElementById('xb-overlay');
    const mobileMenu = document.getElementById('xb-mobile-menu');

    if (!nav) return;

    /* Scroll shadow */
    const onScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== _scrolled) {
        _scrolled = scrolled;
        nav.classList.toggle('scrolled', scrolled);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on init

    /* Desktop dropdown — hover + keyboard */
    nav.querySelectorAll('.xb-link-item').forEach(item => {
      const btn = item.querySelector('button.xb-link');
      if (!btn) return;

      const open = () => {
        if (_activeDropdown && _activeDropdown !== item) {
          _activeDropdown.classList.remove('open');
          _activeDropdown.querySelector('button')?.setAttribute('aria-expanded', 'false');
        }
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        _activeDropdown = item;
      };
      const close = () => {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        if (_activeDropdown === item) _activeDropdown = null;
      };

      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', close);
      btn.addEventListener('click', () => {
        item.classList.contains('open') ? close() : open();
      });
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.classList.contains('open') ? close() : open();
        }
        if (e.key === 'Escape') close();
      });
    });

    /* Close dropdown on outside click */
    document.addEventListener('click', e => {
      if (_activeDropdown && !_activeDropdown.contains(e.target)) {
        _activeDropdown.classList.remove('open');
        _activeDropdown.querySelector('button')?.setAttribute('aria-expanded', 'false');
        _activeDropdown = null;
      }
    });

    /* Mobile hamburger */
    const toggleMobile = open => {
      _mobileOpen = open;
      hamburger?.classList.toggle('open', open);
      hamburger?.setAttribute('aria-expanded', String(open));
      overlay?.classList.toggle('open', open);
      mobileMenu?.classList.toggle('open', open);
      mobileMenu?.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    hamburger?.addEventListener('click', () => toggleMobile(!_mobileOpen));
    overlay?.addEventListener('click', () => toggleMobile(false));

    /* Mobile sub-menus */
    document.querySelectorAll('[data-mobile-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.mobileToggle;
        const sub = document.getElementById(`xb-sub-${idx}`);
        if (!sub) return;
        const isOpen = sub.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
      });
    });

    /* Close mobile on link click */
    mobileMenu?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => toggleMobile(false));
    });

    /* Escape key */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (_mobileOpen) toggleMobile(false);
        if (_activeDropdown) {
          _activeDropdown.classList.remove('open');
          _activeDropdown = null;
        }
      }
    });

    /* Compare badge — listen to State changes */
    if (typeof State !== 'undefined') {
      State.subscribe('compareList', updateCompareBadge);
    }
    updateCompareBadge();
  }

  /* ── PUBLIC API ─────────────────────────────────────────── */

  /**
   * Initialize and render navbar.
   * @param {string} containerId - ID of element to render navbar into
   * @param {Object} [config] - Optional config overrides
   */
  function init(containerId = 'nav-root', config = {}) {
    injectStyles();

    _config = Object.assign({}, DEFAULT_CONFIG, config);
    if (config.links) _config.links = config.links; // don't merge, replace

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[Navbar] Container #${containerId} not found`);
      return;
    }

    _navEl = container;
    render(container);
    bindEvents();

    // Add padding-top to body so content doesn't hide under fixed nav
    document.body.style.paddingTop = '60px';
  }

  return { init, updateCompareBadge };

})();

window.Navbar = Navbar;
