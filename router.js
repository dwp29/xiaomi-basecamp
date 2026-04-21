'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  router.js — Xiaomi Basecamp Core Engine                    ║
 * ║  URL / query string manager for SPA-like navigation.        ║
 * ║  Uses History API (pushState) for clean URL updates.        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  FEATURES:
 *    - Read/write URL query params without page reloads
 *    - Navigate between pages with optional transition animation
 *    - Build URLs with param objects
 *    - Listen to browser back/forward (popstate)
 *    - Detect current page from pathname
 *
 *  USAGE:
 *    // Read params
 *    Router.getParam('id');              // → "redmi-note-13-pro-plus"
 *    Router.getParams();                 // → { id: "...", series: "Redmi" }
 *
 *    // Write params (no page reload)
 *    Router.setParam('series', 'POCO');
 *    Router.setParams({ series: 'Redmi', chipset: 'Qualcomm' });
 *    Router.removeParam('series');
 *
 *    // Navigate
 *    Router.navigate('/devices.html');
 *    Router.navigate('/device-detail.html', { id: 'poco-f6-pro' });
 *
 *    // Build URL strings
 *    Router.buildUrl('/devices.html', { series: 'Redmi' });
 *    // → "/devices.html?series=Redmi"
 *
 *    // Listen to browser back/forward
 *    Router.onPopState(() => {
 *      const id = Router.getParam('id');
 *      loadDevice(id);
 *    });
 *
 *    // Get current page name
 *    Router.getCurrentPage(); // → "devices" | "device-detail" | "home" | ...
 *
 *  REQUIRES: Nothing (fully standalone)
 */

const Router = (() => {

  /* ── PAGE MAP (pathname → logical name) ─────────────────── */
  const PAGE_MAP = {
    '/':                    'home',
    '/index.html':          'home',
    '/devices.html':        'devices',
    '/device-detail.html':  'device-detail',
    '/roms.html':           'roms',
    '/rom-detail.html':     'rom-detail',
    '/tools.html':          'tools',
    '/tutorials.html':      'tutorials',
    '/tutorial-detail.html':'tutorial-detail',
    '/compare.html':        'compare',
    '/search.html':         'search',
    '/404.html':            '404',
  };

  /* ── TRANSITION CONFIG ──────────────────────────────────── */
  const TRANSITION_DURATION = 200; // ms — must match CSS .page-transition-exit

  /* ── POP STATE LISTENERS ────────────────────────────────── */
  /** @type {Set<Function>} */
  const _popStateListeners = new Set();

  /* ══════════════════════════════════════════════════════════
     PRIVATE HELPERS
     ══════════════════════════════════════════════════════════ */

  /**
   * Get the current URLSearchParams object.
   * @returns {URLSearchParams}
   */
  function _getSearchParams() {
    return new URLSearchParams(window.location.search);
  }

  /**
   * Apply URLSearchParams to the current URL via pushState.
   * Does NOT cause a page reload.
   *
   * @param {URLSearchParams} params
   * @param {boolean} [replace=false] - Use replaceState instead of pushState
   */
  function _applyParams(params, replace = false) {
    const paramStr = params.toString();
    const newUrl = paramStr
      ? `${window.location.pathname}?${paramStr}`
      : window.location.pathname;

    if (replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  /**
   * Show page exit animation, then navigate.
   * @param {string} url
   */
  function _transitionTo(url) {
    const main = document.querySelector('main, .page-main, #main-content');
    if (main) {
      main.classList.add('page-transition-exit');
      setTimeout(() => {
        window.location.href = url;
      }, TRANSITION_DURATION);
    } else {
      window.location.href = url;
    }
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — READ PARAMS
     ══════════════════════════════════════════════════════════ */

  /**
   * Get a single URL query param by name.
   *
   * @param {string} name
   * @returns {string|null}
   *
   * @example
   * // URL: /device-detail.html?id=poco-f6-pro
   * Router.getParam('id'); // → "poco-f6-pro"
   */
  function getParam(name) {
    return _getSearchParams().get(name);
  }

  /**
   * Get all URL query params as a plain object.
   *
   * @returns {Object<string, string>}
   *
   * @example
   * // URL: /devices.html?series=Redmi&chipset=Qualcomm
   * Router.getParams(); // → { series: "Redmi", chipset: "Qualcomm" }
   */
  function getParams() {
    const params = {};
    for (const [key, value] of _getSearchParams().entries()) {
      params[key] = value;
    }
    return params;
  }

  /**
   * Get a param parsed as an array (comma-separated values).
   * Useful for multi-select filters stored in URL.
   *
   * @param {string} name
   * @returns {string[]}
   *
   * @example
   * // URL: /devices.html?series=Redmi,POCO
   * Router.getParamArray('series'); // → ["Redmi", "POCO"]
   */
  function getParamArray(name) {
    const val = getParam(name);
    if (!val) return [];
    return val.split(',').map(v => v.trim()).filter(Boolean);
  }

  /**
   * Check if a param exists (even if empty string).
   * @param {string} name
   * @returns {boolean}
   */
  function hasParam(name) {
    return _getSearchParams().has(name);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — WRITE PARAMS
     ══════════════════════════════════════════════════════════ */

  /**
   * Set a single URL query param.
   * Does NOT reload the page.
   *
   * @param {string} name
   * @param {string|number|null} value - null removes the param
   * @param {boolean} [replace=false]
   */
  function setParam(name, value, replace = false) {
    const params = _getSearchParams();
    if (value === null || value === undefined || value === '') {
      params.delete(name);
    } else {
      params.set(name, String(value));
    }
    _applyParams(params, replace);
  }

  /**
   * Set multiple URL query params at once.
   * Merges with existing params.
   * Does NOT reload the page.
   *
   * @param {Object<string, string|number|null>} obj
   * @param {boolean} [replace=false]
   *
   * @example
   * Router.setParams({ series: 'Redmi', chipset: 'Qualcomm', fiveg: 1 });
   */
  function setParams(obj, replace = false) {
    const params = _getSearchParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    _applyParams(params, replace);
  }

  /**
   * Set params from an object, clearing ALL existing params first.
   * Use this when you want the URL to exactly reflect current filter state.
   *
   * @param {Object<string, string|number|null>} obj
   */
  function replaceAllParams(obj) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    }
    _applyParams(params, true); // use replaceState so back button works sanely
  }

  /**
   * Remove a single URL query param.
   * @param {string} name
   */
  function removeParam(name) {
    const params = _getSearchParams();
    params.delete(name);
    _applyParams(params, true);
  }

  /**
   * Remove all URL query params.
   */
  function clearParams() {
    window.history.replaceState({}, '', window.location.pathname);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — NAVIGATION
     ══════════════════════════════════════════════════════════ */

  /**
   * Navigate to a URL with an optional page transition animation.
   *
   * @param {string} path            - e.g. '/devices.html' or '/device-detail.html'
   * @param {Object} [params]        - Query params to append
   * @param {boolean} [transition=true] - Use exit animation
   *
   * @example
   * Router.navigate('/device-detail.html', { id: 'poco-f6-pro' });
   * // → navigates to /device-detail.html?id=poco-f6-pro
   */
  function navigate(path, params = null, transition = true) {
    const url = params ? buildUrl(path, params) : path;

    if (transition) {
      _transitionTo(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Navigate to a device detail page.
   * @param {string} deviceId
   */
  function goToDevice(deviceId) {
    navigate('/device-detail.html', { id: deviceId });
  }

  /**
   * Navigate to a ROM detail page.
   * @param {string} romId
   */
  function goToRom(romId) {
    navigate('/rom-detail.html', { id: romId });
  }

  /**
   * Navigate to a tutorial detail page.
   * @param {string} tutorialId
   */
  function goToTutorial(tutorialId) {
    navigate('/tutorial-detail.html', { id: tutorialId });
  }

  /**
   * Navigate to compare page with two device IDs.
   * @param {string} device1Id
   * @param {string} device2Id
   */
  function goToCompare(device1Id, device2Id) {
    navigate('/compare.html', { device1: device1Id, device2: device2Id });
  }

  /**
   * Navigate to search results page with a query.
   * @param {string} query
   */
  function goToSearch(query) {
    navigate('/search.html', { q: query });
  }

  /**
   * Go back in browser history.
   */
  function back() {
    window.history.back();
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — URL BUILDING
     ══════════════════════════════════════════════════════════ */

  /**
   * Build a full URL string from a path and params object.
   * Does NOT navigate — just returns the string.
   *
   * @param {string} base - e.g. '/devices.html'
   * @param {Object} [params] - Query params
   * @returns {string}
   *
   * @example
   * Router.buildUrl('/devices.html', { series: 'Redmi', fiveg: 1 });
   * // → "/devices.html?series=Redmi&fiveg=1"
   */
  function buildUrl(base, params = {}) {
    if (!params || !Object.keys(params).length) return base;

    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        qs.set(key, String(value));
      }
    }

    const qsStr = qs.toString();
    return qsStr ? `${base}?${qsStr}` : base;
  }

  /**
   * Get the current page's full URL (with params).
   * @returns {string}
   */
  function getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Get the current page's URL without params.
   * @returns {string}
   */
  function getCurrentPath() {
    return window.location.pathname;
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — PAGE DETECTION
     ══════════════════════════════════════════════════════════ */

  /**
   * Get the logical name of the current page.
   * Derived from the pathname.
   *
   * @returns {string} e.g. 'home' | 'devices' | 'device-detail' | 'roms' | ...
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    return PAGE_MAP[path] || 'unknown';
  }

  /**
   * Check if currently on a specific page.
   * @param {string} pageName - Logical name from PAGE_MAP
   * @returns {boolean}
   */
  function isPage(pageName) {
    return getCurrentPage() === pageName;
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — POP STATE
     ══════════════════════════════════════════════════════════ */

  /**
   * Register a callback to run when the browser navigates
   * back or forward (popstate event).
   *
   * @param {Function} callback - Receives the PopStateEvent
   * @returns {Function} Unsubscribe / remove listener
   */
  function onPopState(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('[Router] onPopState: callback must be a function');
    }
    _popStateListeners.add(callback);
    return () => _popStateListeners.delete(callback);
  }

  /* ── SHARE ──────────────────────────────────────────────── */

  /**
   * Copy current URL to clipboard.
   * @returns {Promise<boolean>} true if successful
   */
  async function copyCurrentUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch {
      // Fallback for older browsers
      try {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        return true;
      } catch {
        return false;
      }
    }
  }

  /* ── ANCHOR LINK SMOOTH SCROLL ──────────────────────────── */

  /**
   * Scroll to an element by ID with offset for sticky navbar.
   * @param {string} elementId
   * @param {number} [offset=80]
   */
  function scrollTo(elementId, offset = 80) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /* ── POPSTATE LISTENER SETUP ────────────────────────────── */
  window.addEventListener('popstate', (e) => {
    _popStateListeners.forEach(cb => {
      try {
        cb(e);
      } catch (err) {
        console.error('[Router] popstate listener error:', err);
      }
    });
  });

  /* ── PUBLIC INTERFACE ───────────────────────────────────── */
  return {
    // Read params
    getParam,
    getParams,
    getParamArray,
    hasParam,
    // Write params
    setParam,
    setParams,
    replaceAllParams,
    removeParam,
    clearParams,
    // Navigate
    navigate,
    goToDevice,
    goToRom,
    goToTutorial,
    goToCompare,
    goToSearch,
    back,
    // URL building
    buildUrl,
    getCurrentUrl,
    getCurrentPath,
    // Page detection
    getCurrentPage,
    isPage,
    // Events
    onPopState,
    // Utilities
    copyCurrentUrl,
    scrollTo,
  };

})();

// Make available globally
window.Router = Router;
