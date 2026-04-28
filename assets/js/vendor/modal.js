/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  modal.js  — MIUI Nexus Core Engine v1.0                    ║
 * ║  Lazy-load detail modal with cache + hover prefetch.        ║
 * ║  Accessibility: focus trap, aria, keyboard nav.             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  FEATURES:
 *    - Lazy loads detail data from DataLoader on open
 *    - Memory + localStorage cache (same TTL as DataLoader)
 *    - Hover prefetch: start fetching 200ms after mouseenter
 *    - Skeleton shown while data loads
 *    - Focus trap + ARIA for accessibility
 *    - Keyboard: Esc to close, Tab cycles within modal
 *    - Custom render function per entity type (device, ROM, tool)
 *    - Download gate integration hook
 *    - Stacking: supports modal-within-modal (download gate)
 *
 *  USAGE:
 *    const M = Modal.create({
 *      overlayId:  'modal-overlay',    // ID of the veil element
 *      modalId:    'modal',            // ID of the modal box
 *      loader:     DataLoader.getDevice,  // (id) => Promise<Object>
 *      renderer:   renderDeviceModal,  // (item) => HTML string
 *      skeleton:   renderSkeleton,     // () => HTML string (optional)
 *      onOpen:     (id, item) => {},
 *      onClose:    () => {},
 *    });
 *
 *    // Programmatic open
 *    M.open('redmi-note-13-pro');
 *
 *    // Bind card element (click to open, hover to prefetch)
 *    M.bindCard(cardEl, 'redmi-note-13-pro');
 *
 *    // Bind all cards in a container
 *    M.bindAll(gridEl, el => el.dataset.deviceId);
 *
 *    // Close programmatically
 *    M.close();
 *
 *    // Preload specific IDs
 *    M.prefetch(['redmi-note-13-pro', 'poco-x6-pro']);
 */

'use strict';

const Modal = (() => {

  /* ── CONSTANTS ─────────────────────────────────────────── */
  const PREFETCH_DELAY_MS = 200;    // Hover → prefetch delay
  const CACHE_TTL_MS      = 3600e3; // 1 hour detail cache

  /* ── FOCUS TRAP ────────────────────────────────────────── */
  const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

  function trapFocus(modalEl) {
    const focusable = [...modalEl.querySelectorAll(FOCUSABLE)];
    if (!focusable.length) return () => {};

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first.focus();

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }

    modalEl.addEventListener('keydown', handler);
    return () => modalEl.removeEventListener('keydown', handler);
  }

  /* ── LOCK / UNLOCK SCROLL ──────────────────────────────── */
  let _scrollLockCount = 0;
  let _savedScrollY    = 0;

  function lockScroll() {
    if (_scrollLockCount++ === 0) {
      _savedScrollY = window.scrollY;
      document.body.style.cssText +=
        `overflow:hidden;position:fixed;top:-${_savedScrollY}px;width:100%;`;
    }
  }

  function unlockScroll() {
    if (--_scrollLockCount <= 0) {
      _scrollLockCount = 0;
      const top = _savedScrollY;
      document.body.style.cssText = document.body.style.cssText
        .replace(/overflow:[^;]+;/, '')
        .replace(/position:[^;]+;/, '')
        .replace(/top:[^;]+;/, '')
        .replace(/width:[^;]+;/, '');
      window.scrollTo(0, top);
    }
  }

  /* ── DEFAULT SKELETON ──────────────────────────────────── */
  function defaultSkeleton() {
    const bar = (w = '100%', h = '12px', mt = '8px') =>
      `<div style="height:${h};width:${w};border-radius:6px;
         background:linear-gradient(90deg,#0c1428 25%,rgba(255,255,255,.05) 50%,#0c1428 75%);
         background-size:200% 100%;animation:skShimmer 1.4s infinite;margin-top:${mt}"></div>`;

    return `
      <style>@keyframes skShimmer{from{background-position:200% 0}to{background-position:-200% 0}}</style>
      <div style="padding:24px">
        ${bar('100%', '140px', '0')}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px">
          ${Array(9).fill(bar('100%','56px','0')).join('')}
        </div>
        ${bar('60%','10px','20px')}
        ${bar('100%','56px','8px')}
        ${bar('100%','56px','8px')}
      </div>`;
  }

  /* ── FACTORY ───────────────────────────────────────────── */
  function create(opts = {}) {

    /* ── Required options ── */
    const _overlayEl  = typeof opts.overlayId === 'string'
      ? document.getElementById(opts.overlayId)
      : opts.overlayEl;
    const _modalEl    = typeof opts.modalId === 'string'
      ? document.getElementById(opts.modalId)
      : opts.modalEl;
    const _loader     = opts.loader;     // async (id) => detail object
    const _renderer   = opts.renderer;   // (item) => HTML string
    const _skeleton   = opts.skeleton   || defaultSkeleton;
    const _onOpen     = opts.onOpen     || (() => {});
    const _onClose    = opts.onClose    || (() => {});
    const _bodyEl     = _modalEl?.querySelector('[data-modal-body]') || _modalEl;

    if (!_overlayEl) throw new Error('[Modal] overlayEl/overlayId is required');
    if (!_modalEl)   throw new Error('[Modal] modalEl/modalId is required');

    /* ── Instance state ── */
    const _cache          = new Map();  // id → { data, ts }
    let   _activeId       = null;
    let   _isOpen         = false;
    let   _prefetchTimers = new Map();  // id → timeoutId
    let   _releaseFocus   = null;       // Focus trap cleanup fn
    let   _escHandler     = null;
    let   _currentData    = null;

    /* ── Cache helpers ── */
    function _cacheGet(id) {
      const entry = _cache.get(id);
      if (!entry) return null;
      if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(id); return null; }
      return entry.data;
    }

    function _cacheSet(id, data) {
      _cache.set(id, { data, ts: Date.now() });
    }

    /* ── Show skeleton while loading ── */
    function _showSkeleton() {
      _bodyEl.innerHTML = _skeleton();
    }

    /* ── Render loaded data ── */
    function _showData(data) {
      const html = _renderer(data);
      _bodyEl.innerHTML = html;

      // Re-trap focus after content change
      if (_releaseFocus) _releaseFocus();
      _releaseFocus = trapFocus(_modalEl);
    }

    /* ── Open overlay ── */
    function _openOverlay() {
      _overlayEl.classList.add('open');
      _overlayEl.setAttribute('aria-hidden', 'false');
      _modalEl.setAttribute('aria-modal', 'true');
      lockScroll();
    }

    /* ── Close overlay ── */
    function _closeOverlay() {
      _overlayEl.classList.remove('open');
      _overlayEl.setAttribute('aria-hidden', 'true');
      if (_releaseFocus) { _releaseFocus(); _releaseFocus = null; }
      unlockScroll();
      _isOpen     = false;
      _activeId   = null;
      _currentData = null;
    }

    /* ── ESC key handler ── */
    function _attachEsc() {
      _escHandler = (e) => { if (e.key === 'Escape' && _isOpen) close(); };
      document.addEventListener('keydown', _escHandler);
    }

    function _detachEsc() {
      if (_escHandler) document.removeEventListener('keydown', _escHandler);
    }

    /* ── Overlay backdrop click ── */
    _overlayEl.addEventListener('click', (e) => {
      if (e.target === _overlayEl) close();
    });

    /* ── Close button (inside modal) ── */
    _modalEl.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', close);
    });

    /* ── Public close ── */
    function close() {
      if (!_isOpen) return;
      _closeOverlay();
      _detachEsc();
      _onClose();
    }

    /* ── Public open ── */
    async function open(id) {
      if (_isOpen && _activeId === id) return; // Same item already open
      if (_isOpen) close();

      _activeId = id;
      _isOpen   = true;

      _openOverlay();
      _attachEsc();
      _showSkeleton();

      // Check cache first
      const cached = _cacheGet(id);
      if (cached) {
        _currentData = cached;
        _showData(cached);
        _onOpen(id, cached);
        return;
      }

      // Load from DataLoader
      try {
        const data = await _loader(id);
        if (_activeId !== id) return; // User closed before load finished

        _cacheSet(id, data);
        _currentData = data;
        _showData(data);
        _onOpen(id, data);
      } catch (err) {
        console.error('[Modal] Load failed:', err);
        _bodyEl.innerHTML = `
          <div style="padding:40px;text-align:center;color:#3d5578">
            <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
            <div style="font-family:var(--f-co,monospace);font-size:.8rem">
              Failed to load device data.<br>
              <button onclick="Modal.open('${id}')"
                style="margin-top:12px;padding:8px 16px;background:none;
                  border:1px solid #3d5578;border-radius:8px;color:#7a99c2;cursor:pointer">
                Retry
              </button>
            </div>
          </div>`;
      }
    }

    /* ── Public API ── */
    const api = {

      /**
       * Open the modal for a given ID.
       * Shows skeleton → lazy loads → renders.
       *
       * @param {string} id
       */
      open,

      /**
       * Close the modal.
       */
      close,

      /**
       * Prefetch (load + cache) an item without opening the modal.
       * Call on hover to make subsequent open() instant.
       *
       * @param {string} id
       */
      async prefetch(id) {
        if (_cacheGet(id) || !_loader) return;
        try {
          const data = await _loader(id);
          _cacheSet(id, data);
        } catch { /* Silent — prefetch is best-effort */ }
      },

      /**
       * Prefetch a list of IDs in series (low priority).
       * Use for initial viewport items after first render.
       *
       * @param {string[]} ids
       * @param {number}   [delayBetween=300] ms between each fetch
       */
      async prefetchList(ids, delayBetween = 300) {
        for (const id of ids) {
          if (_cacheGet(id)) continue;
          await this.prefetch(id);
          await new Promise(r => setTimeout(r, delayBetween));
        }
      },

      /**
       * Bind a card element: click → open, hover → prefetch.
       *
       * @param {HTMLElement} el
       * @param {string}      id
       */
      bindCard(el, id) {
        el.addEventListener('click', () => open(id));

        // Hover prefetch: start after PREFETCH_DELAY_MS
        el.addEventListener('mouseenter', () => {
          if (_cacheGet(id)) return; // Already cached
          const timer = setTimeout(() => {
            this.prefetch(id);
            _prefetchTimers.delete(id);
          }, PREFETCH_DELAY_MS);
          _prefetchTimers.set(id, timer);
        });

        // Cancel if mouse leaves before delay
        el.addEventListener('mouseleave', () => {
          const timer = _prefetchTimers.get(id);
          if (timer) { clearTimeout(timer); _prefetchTimers.delete(id); }
        });

        return this;
      },

      /**
       * Bind all card elements in a container.
       * Calls idFn(element) to get the ID for each card.
       *
       * @param {HTMLElement} container
       * @param {Function}    idFn       - (el) => string id
       * @param {string}      [selector] - Card selector (default: '.device-card')
       */
      bindAll(container, idFn, selector = '.device-card') {
        container.querySelectorAll(selector).forEach(el => {
          const id = idFn(el);
          if (id) this.bindCard(el, id);
        });
        return this;
      },

      /**
       * Use event delegation on a container.
       * More efficient than bindAll for large grids.
       * Cards need data-id attribute.
       *
       * @param {HTMLElement} container
       * @param {string}      cardSelector  e.g. '.device-card'
       * @param {string}      [idAttr]      data attribute holding the ID
       */
      bindDelegated(container, cardSelector, idAttr = 'data-id') {
        container.addEventListener('click', (e) => {
          const card = e.target.closest(cardSelector);
          if (card) {
            const id = card.getAttribute(idAttr);
            if (id) open(id);
          }
        });

        container.addEventListener('mouseover', throttledHover(cardSelector, idAttr, this));
        return this;
      },

      /**
       * Manually set content (bypass loader).
       * Use when data is already in memory.
       *
       * @param {string} id
       * @param {Object} data
       */
      setContent(id, data) {
        _cacheSet(id, data);
        if (_isOpen && _activeId === id) _showData(data);
        return this;
      },

      /**
       * Get currently loaded data.
       */
      getCurrentData() { return _currentData; },

      /**
       * Get current open item ID.
       */
      getActiveId() { return _activeId; },

      /**
       * Whether modal is currently open.
       */
      isOpen() { return _isOpen; },

      /**
       * Cache statistics.
       */
      getCacheStats() {
        return {
          count:  _cache.size,
          ids:    [..._cache.keys()],
          sizes:  [..._cache.entries()].map(([k, v]) => ({
            id:      k,
            bytes:   JSON.stringify(v.data).length,
            age_s:   Math.round((Date.now() - v.ts) / 1000),
          })),
        };
      },

      /**
       * Clear the detail cache.
       */
      clearCache() {
        _cache.clear();
        return this;
      },

      /**
       * Cleanup all resources.
       */
      destroy() {
        _detachEsc();
        if (_releaseFocus) _releaseFocus();
        _prefetchTimers.forEach(t => clearTimeout(t));
        _prefetchTimers.clear();
        _cache.clear();
      },
    };

    return api;
  }

  /* ── Throttled hover helper (for delegated binding) ── */
  function throttledHover(selector, idAttr, modalInstance) {
    let last = '', timer;
    return (e) => {
      const card = e.target.closest(selector);
      if (!card) return;
      const id = card.getAttribute(idAttr);
      if (!id || id === last) return;
      last = id;
      clearTimeout(timer);
      timer = setTimeout(() => modalInstance.prefetch(id), PREFETCH_DELAY_MS);
    };
  }

  /* ── DOWNLOAD GATE ─────────────────────────────────────── */

  /**
   * Create a download gate modal (timer → shortlink).
   * Secondary modal that stacks on top of device detail.
   *
   * @param {Object} opts
   * @param {number} opts.countdown    - Seconds before download activates (default 7)
   * @param {string} opts.overlayId   - Overlay element ID
   * @param {string} opts.timerId     - Countdown display element ID
   * @param {string} opts.barId       - Progress bar fill element ID
   * @param {string} opts.btnId       - Download button element ID
   * @param {string} opts.titleId     - Title element ID
   */
  function createDownloadGate(opts = {}) {
    const COUNTDOWN = opts.countdown ?? 7;

    const overlayEl = document.getElementById(opts.overlayId ?? 'dl-overlay');
    const timerEl   = document.getElementById(opts.timerId   ?? 'dl-timer');
    const barEl     = document.getElementById(opts.barId     ?? 'dl-bar');
    const btnEl     = document.getElementById(opts.btnId     ?? 'dl-btn');
    const titleEl   = document.getElementById(opts.titleId   ?? 'dl-title');
    const subEl     = document.getElementById(opts.subId     ?? 'dl-sub');

    let _interval = null;
    let _link     = '#';

    function _startCountdown() {
      let remaining = COUNTDOWN;

      if (timerEl) timerEl.textContent = remaining;
      if (barEl)   barEl.style.width   = '0%';
      if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Preparing...'; }

      _interval = setInterval(() => {
        remaining--;
        const pct = ((COUNTDOWN - remaining) / COUNTDOWN * 100).toFixed(1);

        if (timerEl) timerEl.textContent = remaining;
        if (barEl)   barEl.style.width   = pct + '%';

        if (remaining <= 0) {
          clearInterval(_interval);
          if (timerEl) { timerEl.textContent = '✓'; timerEl.style.color = 'var(--lime, #29ff5a)'; }
          if (btnEl)   { btnEl.disabled = false; btnEl.textContent = '⬇ Download Now'; }
        }
      }, 1000);
    }

    function closeGate() {
      clearInterval(_interval);
      if (overlayEl) overlayEl.classList.remove('open');
      if (timerEl)   timerEl.style.color = '';
      unlockScroll();
    }

    if (overlayEl) {
      overlayEl.addEventListener('click', (e) => {
        if (e.target === overlayEl) closeGate();
      });
    }

    if (btnEl) {
      btnEl.addEventListener('click', () => {
        window.open(_link, '_blank', 'noopener,noreferrer');
        closeGate();
      });
    }

    return {
      /**
       * Open the download gate for a file.
       *
       * @param {string} name  - Display name
       * @param {string} size  - File size string e.g. "6.2GB"
       * @param {string} link  - Actual download/shortlink URL
       */
      open(name, size, link) {
        _link = link;
        if (titleEl) titleEl.textContent = name;
        if (subEl)   subEl.textContent   = size ? `File size: ${size}` : 'Connecting to download server...';
        if (overlayEl) overlayEl.classList.add('open');
        lockScroll();
        _startCountdown();
      },
      close: closeGate,
    };
  }

  return { create, createDownloadGate };

})();

if (typeof module !== 'undefined') module.exports = Modal;
