/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  paginator.js  — MIUI Nexus Core Engine v1.0                ║
 * ║  Append-only pagination using DocumentFragment.             ║
 * ║  IntersectionObserver for auto-load + lazy render guard.    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  DESIGN DECISIONS:
 *    - NEVER re-render the full grid (append only).
 *      Re-render only on data change (new search/filter result).
 *    - DocumentFragment: batch DOM insertions → single reflow.
 *    - IntersectionObserver: auto-load next page when sentinel
 *      enters viewport (infinite scroll mode).
 *    - Virtual guard: cards entering viewport trigger
 *      IntersectionObserver to set visible class (CSS animations).
 *    - No jQuery, no framework, zero deps.
 *
 *  USAGE:
 *    const P = Paginator.create({
 *      container:   document.getElementById('grid'),
 *      renderItem:  (device) => '<div class="device-card">...</div>',
 *      pageSize:    24,
 *      onPageLoad:  ({ shown, total, hasMore, page }) => updateUI(),
 *      mode:        'button',  // 'button' | 'infinite' | 'manual'
 *    });
 *
 *    P.load(devices);           // Set dataset + render first page
 *    P.next();                  // Append next page
 *    P.reset(newDevices);       // Clear grid + reload (filter/search change)
 *    P.getState();              // { shown, total, page, hasMore, progress }
 *    P.destroy();               // Cleanup observers
 */

'use strict';

const Paginator = (() => {

  /* ── THROTTLE (for scroll events) ─────────────────────── */
  function throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  }

  /* ── FACTORY ───────────────────────────────────────────── */
  function create(opts = {}) {

    /* ── Config ── */
    const PAGE_SIZE      = opts.pageSize    ?? 24;
    const MODE           = opts.mode        ?? 'button';     // 'button' | 'infinite' | 'manual'
    const SENTINEL_MARGIN = opts.sentinelMargin ?? '300px';  // How far before bottom to trigger
    const ANIM_DELAY_MS  = opts.animDelay   ?? 40;           // Stagger delay per card (ms)

    const _container  = opts.container;     // Grid container element (required)
    const _renderItem = opts.renderItem;    // (item, index) => HTML string (required)
    const _onPageLoad = opts.onPageLoad || (() => {});
    const _onEmpty    = opts.onEmpty    || (() => {});
    const _onReset    = opts.onReset    || (() => {});

    if (!_container) throw new Error('[Paginator] opts.container is required');
    if (!_renderItem) throw new Error('[Paginator] opts.renderItem is required');

    /* ── Instance state ── */
    let _data        = [];
    let _cursor      = 0;
    let _page        = 0;
    let _isLoading   = false;
    let _sentinel    = null;   // IO sentinel element
    let _sentinelIO  = null;   // IntersectionObserver for auto-load
    let _cardIO      = null;   // IntersectionObserver for card reveal animations
    let _loadBtn     = null;   // External load-more button reference

    /* ── Card reveal IntersectionObserver ── */
    function _initCardReveal() {
      if (_cardIO) _cardIO.disconnect();

      _cardIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pg-visible');
            _cardIO.unobserve(entry.target);  // Observe once
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    }

    function _observeCards(fragment) {
      // Observe all .pg-card elements in the fragment's parent after insertion
      // Must be called AFTER fragment is appended to DOM
      if (!_cardIO) return;
      _container.querySelectorAll('.pg-card:not(.pg-visible)').forEach(el => {
        _cardIO.observe(el);
      });
    }

    /* ── Sentinel IntersectionObserver (infinite scroll) ── */
    function _initSentinel() {
      if (_sentinelIO) _sentinelIO.disconnect();
      if (_sentinel) _sentinel.remove();

      _sentinel = document.createElement('div');
      _sentinel.className = 'pg-sentinel';
      _sentinel.style.cssText = 'height:1px;pointer-events:none;';
      _container.after(_sentinel);

      _sentinelIO = new IntersectionObserver(
        throttle((entries) => {
          if (entries[0].isIntersecting && !_isLoading && _cursor < _data.length) {
            _appendPage();
          }
        }, 300),
        { rootMargin: SENTINEL_MARGIN }
      );

      _sentinelIO.observe(_sentinel);
    }

    /* ── Core: append one page of items ── */
    function _appendPage() {
      if (_isLoading || _cursor >= _data.length) return;
      _isLoading = true;

      const slice = _data.slice(_cursor, _cursor + PAGE_SIZE);
      if (!slice.length) { _isLoading = false; return; }

      // Build HTML strings
      const htmlParts = slice.map((item, i) => {
        const absIdx  = _cursor + i;  // Global index in dataset
        const pageIdx = i;            // Position in this page (for stagger)
        return _renderItem(item, absIdx, pageIdx);
      });

      // Parse into real DOM via DocumentFragment
      const frag   = document.createDocumentFragment();
      const tmpDiv = document.createElement('div');
      tmpDiv.innerHTML = htmlParts.join('');

      // Move children into fragment + add stagger delays
      let childIdx = 0;
      while (tmpDiv.firstChild) {
        const child = tmpDiv.firstChild;
        if (child.nodeType === Node.ELEMENT_NODE) {
          // Add pg-card class for reveal observer
          child.classList.add('pg-card');
          // CSS animation stagger via custom property
          child.style.setProperty('--pg-delay', `${childIdx * ANIM_DELAY_MS}ms`);
          childIdx++;
        }
        frag.appendChild(child);
      }

      // Single reflow: append whole fragment at once
      _container.appendChild(frag);

      // Observe newly added cards for reveal animation
      _observeCards();

      _cursor += slice.length;
      _page   += 1;
      _isLoading = false;

      const state = _getState();
      _onPageLoad(state);

      // Update external load button
      if (_loadBtn) {
        _loadBtn.hidden = !state.hasMore;
        const labelEl = _loadBtn.querySelector('[data-pg-label]');
        if (labelEl) {
          const remaining = Math.min(PAGE_SIZE, _data.length - _cursor);
          labelEl.textContent = `Load ${remaining} More`;
        }
      }
    }

    /* ── State getter ── */
    function _getState() {
      return {
        shown:    _cursor,
        total:    _data.length,
        page:     _page,
        hasMore:  _cursor < _data.length,
        progress: _data.length ? _cursor / _data.length : 1,
        isEmpty:  _data.length === 0,
      };
    }

    /* ── Clear the container efficiently ── */
    function _clearContainer() {
      // Faster than innerHTML = '' — avoids repeated style recalc
      while (_container.firstChild) {
        _container.removeChild(_container.firstChild);
      }
    }

    /* ── Public API ── */
    return {

      /**
       * Load a dataset and render the first page immediately.
       * Does NOT clear existing content — call reset() for that.
       *
       * @param {Array} data
       */
      load(data) {
        _data   = data;
        _cursor = 0;
        _page   = 0;

        _initCardReveal();

        if (MODE === 'infinite') {
          _initSentinel();
        }

        if (!data.length) {
          _onEmpty();
          return this;
        }

        _appendPage();
        _onReset(_getState());

        return this;
      },

      /**
       * Reset: clear grid + reload with new (or same) data.
       * Use when search/filter changes the dataset.
       *
       * @param {Array} [data]  - New dataset (uses existing if omitted)
       */
      reset(data) {
        if (data !== undefined) _data = data;
        _cursor = 0;
        _page   = 0;

        _clearContainer();

        if (!_data.length) {
          _onEmpty();
          if (_loadBtn) _loadBtn.hidden = true;
          return this;
        }

        _appendPage();
        return this;
      },

      /**
       * Append next page of items.
       * Call from "Load More" button click handler.
       */
      next() {
        _appendPage();
        return this;
      },

      /**
       * Replace the entire dataset without clearing the DOM.
       * Only appends items beyond current cursor.
       * Use for: "show more after filter relaxed".
       */
      extend(data) {
        _data = data;
        if (_cursor < _data.length) _appendPage();
        return this;
      },

      /**
       * Bind a "Load More" button element.
       * Handles click, shows/hides automatically.
       *
       * @param {HTMLElement} btn
       */
      bindLoadMore(btn) {
        _loadBtn = btn;
        btn.addEventListener('click', () => this.next());
        btn.hidden = false;
        return this;
      },

      /**
       * Current pagination state.
       * @returns {{ shown, total, page, hasMore, progress, isEmpty }}
       */
      getState() { return _getState(); },

      /**
       * Number of items currently rendered.
       */
      getShown()  { return _cursor; },

      /**
       * Whether more items can be loaded.
       */
      hasMore()   { return _cursor < _data.length; },

      /**
       * Scroll to the top of the container.
       * Call after reset() to restore scroll position.
       */
      scrollToTop(offset = 0) {
        const top = _container.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        return this;
      },

      /**
       * Programmatically trigger card reveal for all visible cards.
       * Useful after a non-scroll layout change.
       */
      revealVisible() {
        _observeCards();
        return this;
      },

      /**
       * Cleanup all IntersectionObservers and DOM artifacts.
       * Call when navigating away from the page.
       */
      destroy() {
        _sentinelIO?.disconnect();
        _cardIO?.disconnect();
        _sentinel?.remove();
        _sentinel = null;
        _loadBtn  = null;
      },
    };
  }

  /* ── PROGRESS BAR HELPER ───────────────────────────────── */

  /**
   * Create a managed progress bar component.
   * Pass to onPageLoad for easy progress rendering.
   *
   * @param {HTMLElement} fillEl  - The fill bar element (e.g. .lp-fill)
   * @param {HTMLElement} textEl  - Optional text label element
   */
  function createProgressBar(fillEl, textEl = null) {
    return {
      update({ shown, total, progress }) {
        if (fillEl) fillEl.style.width = (progress * 100).toFixed(1) + '%';
        if (textEl) textEl.textContent  = `Showing ${shown} of ${total}`;
      },
      hide() {
        if (fillEl?.parentElement) fillEl.parentElement.style.visibility = 'hidden';
      },
      show() {
        if (fillEl?.parentElement) fillEl.parentElement.style.visibility = 'visible';
      },
    };
  }

  return { create, createProgressBar };

})();

if (typeof module !== 'undefined') module.exports = Paginator;
