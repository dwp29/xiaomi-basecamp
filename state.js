'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  state.js — Xiaomi Basecamp Core Engine                     ║
 * ║  Lightweight global state manager with pub/sub pattern.     ║
 * ║  No framework. No dependencies. Pure vanilla JS.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  PATTERN: Pub/Sub + Immutable updates
 *    - State is read-only externally (via State.get)
 *    - Mutations happen via State.set or State.dispatch
 *    - Subscribers are notified synchronously after each change
 *    - Wildcards supported: subscribe('*', cb) → all changes
 *
 *  USAGE:
 *    // Read
 *    const devices = State.get('devices');
 *
 *    // Write
 *    State.set('searchQuery', 'poco x6');
 *
 *    // Subscribe
 *    const unsub = State.subscribe('filteredDevices', (newVal) => {
 *      renderGrid(newVal);
 *    });
 *    unsub(); // stop listening
 *
 *    // Actions
 *    State.dispatch('FILTER_DEVICES', { series: ['Redmi'] });
 *    State.dispatch('BOOKMARK_TOGGLE', 'redmi-note-13-pro-plus');
 *    State.dispatch('COMPARE_TOGGLE', 'poco-f6-pro');
 *
 *    // Bookmark/Compare shortcuts
 *    State.bookmarkToggle('redmi-note-13-pro-plus');
 *    State.compareToggle('poco-f6-pro');
 *    State.isBookmarked('poco-f6-pro'); // → boolean
 *    State.isInCompare('poco-f6-pro');  // → boolean
 *
 *  REQUIRES: Nothing (fully standalone)
 */

const State = (() => {

  /* ── LOCALSTORAGE KEYS ──────────────────────────────────── */
  const LS_KEYS = {
    bookmarks:    'xbc_bookmarks',      // xbc = xiaomi-basecamp
    compareList:  'xbc_compare',
    recentViewed: 'xbc_recent',
    preferences:  'xbc_prefs',
  };

  /* ── INITIAL STATE SHAPE ────────────────────────────────── */
  /**
   * @typedef {Object} AppState
   */
  const initialState = {
    // Data arrays (populated by DataLoader)
    devices:   [],
    roms:      [],
    tools:     [],
    tutorials: [],

    // Filtered subsets (after filter/search applied)
    filteredDevices:   [],
    filteredRoms:      [],
    filteredTools:     [],
    filteredTutorials: [],

    // Search & filter
    activeFilters: {},        // { series: ['Redmi'], chipset: 'Qualcomm' }
    searchQuery:   '',        // current search string
    sortBy: {
      devices:   'name-asc',
      roms:      'rating-desc',
      tools:     'name-asc',
      tutorials: 'name-asc',
    },

    // Pagination (current page per type)
    currentPage: {
      devices:   1,
      roms:      1,
      tools:     1,
      tutorials: 1,
    },

    // Loading states (set by DataLoader callbacks)
    loading: {
      devices:   false,
      roms:      false,
      tools:     false,
      tutorials: false,
    },

    // Persisted (restored from localStorage on init)
    bookmarks:    [],   // array of device id strings
    compareList:  [],   // max 2 device id strings
    recentViewed: [],   // array of { id, name, timestamp }

    // UI state
    filterSidebarOpen: false,
    mobilNavOpen:      false,
    activeModal:       null,      // id of open modal, or null

    // Site config (loaded from data/config.json)
    siteConfig: null,

    // Meta
    lastUpdated:   null,
    initialized:   false,
  };

  /* ── PRIVATE STATE (deep clone of initialState) ─────────── */
  /** @type {AppState} */
  let _state = JSON.parse(JSON.stringify(initialState));

  /**
   * Subscriber registry.
   * key → Set of callback functions
   * '*' key → wildcard subscribers (notified on any change)
   * @type {Map<string, Set<Function>>}
   */
  const _subscribers = new Map();

  /* ══════════════════════════════════════════════════════════
     PRIVATE HELPERS
     ══════════════════════════════════════════════════════════ */

  /**
   * Notify all subscribers for a given key + wildcard subscribers.
   * @param {string} key
   * @param {any} newValue
   * @param {any} oldValue
   */
  function _notify(key, newValue, oldValue) {
    // Key-specific subscribers
    if (_subscribers.has(key)) {
      _subscribers.get(key).forEach(cb => {
        try {
          cb(newValue, oldValue, key);
        } catch (err) {
          console.error(`[State] Subscriber error for "${key}":`, err);
        }
      });
    }
    // Wildcard subscribers
    if (_subscribers.has('*')) {
      _subscribers.get('*').forEach(cb => {
        try {
          cb(newValue, oldValue, key);
        } catch (err) {
          console.error('[State] Wildcard subscriber error:', err);
        }
      });
    }
  }

  /**
   * Safely read from localStorage. Returns null on failure.
   * @param {string} key
   * @returns {any}
   */
  function _lsGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Safely write to localStorage. Fails silently.
   * @param {string} key
   * @param {any} value
   */
  function _lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('[State] localStorage write failed:', err.message);
    }
  }

  /**
   * Restore persisted values from localStorage on init.
   */
  function _restoreFromStorage() {
    const bookmarks    = _lsGet(LS_KEYS.bookmarks)    || [];
    const compareList  = _lsGet(LS_KEYS.compareList)  || [];
    const recentViewed = _lsGet(LS_KEYS.recentViewed) || [];

    _state.bookmarks    = Array.isArray(bookmarks)    ? bookmarks    : [];
    _state.compareList  = Array.isArray(compareList)  ? compareList  : [];
    _state.recentViewed = Array.isArray(recentViewed) ? recentViewed : [];
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — CORE
     ══════════════════════════════════════════════════════════ */

  /**
   * Get a top-level state value by key.
   * Returns a shallow copy for arrays/objects to prevent
   * accidental mutation of state internals.
   *
   * @param {string} key
   * @returns {any}
   */
  function get(key) {
    const val = _state[key];
    if (Array.isArray(val)) return [...val];
    if (val !== null && typeof val === 'object') return { ...val };
    return val;
  }

  /**
   * Set a top-level state value.
   * Triggers subscribers after the update.
   *
   * @param {string} key
   * @param {any} value
   */
  function set(key, value) {
    if (!(key in _state) && key !== 'siteConfig') {
      console.warn(`[State] set: unknown key "${key}"`);
    }

    const oldValue = _state[key];
    _state[key] = value;
    _state.lastUpdated = Date.now();

    _notify(key, value, oldValue);
  }

  /**
   * Subscribe to state changes for a specific key.
   * Use '*' to subscribe to all changes.
   *
   * @param {string} key - State key to watch, or '*' for all
   * @param {Function} callback - fn(newValue, oldValue, key)
   * @returns {Function} Unsubscribe function
   */
  function subscribe(key, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('[State] subscribe: callback must be a function');
    }

    if (!_subscribers.has(key)) {
      _subscribers.set(key, new Set());
    }
    _subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = _subscribers.get(key);
      if (subs) subs.delete(callback);
    };
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — ACTIONS (dispatch)
     ══════════════════════════════════════════════════════════ */

  /**
   * Predefined action dispatcher.
   * Encapsulates complex multi-key state updates.
   *
   * @param {string} action
   * @param {any} payload
   */
  function dispatch(action, payload) {
    switch (action) {

      // ── Data loaded ─────────────────────────────────────── //
      case 'SET_DEVICES':
        set('devices', payload);
        set('filteredDevices', payload);
        break;

      case 'SET_ROMS':
        set('roms', payload);
        set('filteredRoms', payload);
        break;

      case 'SET_TOOLS':
        set('tools', payload);
        set('filteredTools', payload);
        break;

      case 'SET_TUTORIALS':
        set('tutorials', payload);
        set('filteredTutorials', payload);
        break;

      // ── Filter / Search ──────────────────────────────────── //
      case 'SET_FILTERED_DEVICES':
        set('filteredDevices', payload);
        set('currentPage', { ..._state.currentPage, devices: 1 });
        break;

      case 'SET_FILTERED_ROMS':
        set('filteredRoms', payload);
        set('currentPage', { ..._state.currentPage, roms: 1 });
        break;

      case 'SET_SEARCH_QUERY':
        set('searchQuery', payload);
        break;

      case 'SET_FILTERS':
        set('activeFilters', { ..._state.activeFilters, ...payload });
        break;

      case 'CLEAR_FILTERS':
        set('activeFilters', {});
        set('searchQuery', '');
        break;

      // ── Sort ────────────────────────────────────────────── //
      case 'SET_SORT':
        // payload: { type: 'devices', value: 'name-asc' }
        set('sortBy', { ..._state.sortBy, [payload.type]: payload.value });
        break;

      // ── Loading state ────────────────────────────────────── //
      case 'SET_LOADING':
        // payload: { type: 'devices', value: true }
        set('loading', { ..._state.loading, [payload.type]: payload.value });
        break;

      // ── Pagination ───────────────────────────────────────── //
      case 'NEXT_PAGE':
        // payload: 'devices' | 'roms' | 'tools' | 'tutorials'
        set('currentPage', {
          ..._state.currentPage,
          [payload]: _state.currentPage[payload] + 1
        });
        break;

      case 'RESET_PAGE':
        set('currentPage', { ..._state.currentPage, [payload]: 1 });
        break;

      // ── Bookmarks ────────────────────────────────────────── //
      case 'BOOKMARK_TOGGLE':
        bookmarkToggle(payload);
        break;

      case 'BOOKMARK_CLEAR':
        _state.bookmarks = [];
        _lsSet(LS_KEYS.bookmarks, []);
        _notify('bookmarks', [], null);
        break;

      // ── Compare ──────────────────────────────────────────── //
      case 'COMPARE_TOGGLE':
        compareToggle(payload);
        break;

      case 'COMPARE_CLEAR':
        _state.compareList = [];
        _lsSet(LS_KEYS.compareList, []);
        _notify('compareList', [], null);
        break;

      // ── Recent viewed ────────────────────────────────────── //
      case 'ADD_RECENT':
        addRecentViewed(payload);
        break;

      // ── UI state ─────────────────────────────────────────── //
      case 'TOGGLE_FILTER_SIDEBAR':
        set('filterSidebarOpen', !_state.filterSidebarOpen);
        break;

      case 'CLOSE_FILTER_SIDEBAR':
        set('filterSidebarOpen', false);
        break;

      case 'TOGGLE_MOBILE_NAV':
        set('mobilNavOpen', !_state.mobilNavOpen);
        break;

      case 'CLOSE_MOBILE_NAV':
        set('mobilNavOpen', false);
        break;

      case 'SET_MODAL':
        set('activeModal', payload);
        break;

      case 'CLOSE_MODAL':
        set('activeModal', null);
        break;

      default:
        console.warn(`[State] dispatch: unknown action "${action}"`);
    }
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — BOOKMARKS
     ══════════════════════════════════════════════════════════ */

  /**
   * Add or remove a device from bookmarks.
   * Persists to localStorage.
   *
   * @param {string} deviceId
   */
  function bookmarkToggle(deviceId) {
    if (!deviceId) return;

    const bookmarks = [..._state.bookmarks];
    const idx = bookmarks.indexOf(deviceId);

    if (idx === -1) {
      bookmarks.push(deviceId);
    } else {
      bookmarks.splice(idx, 1);
    }

    _state.bookmarks = bookmarks;
    _lsSet(LS_KEYS.bookmarks, bookmarks);
    _notify('bookmarks', bookmarks, null);
  }

  /**
   * Check if a device is bookmarked.
   * @param {string} deviceId
   * @returns {boolean}
   */
  function isBookmarked(deviceId) {
    return _state.bookmarks.includes(deviceId);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — COMPARE
     ══════════════════════════════════════════════════════════ */

  /**
   * Add or remove a device from the compare list.
   * Max 2 devices. Shows toast if limit exceeded.
   * Persists to localStorage.
   *
   * @param {string} deviceId
   * @returns {'added'|'removed'|'limit'}
   */
  function compareToggle(deviceId) {
    if (!deviceId) return;

    const list = [..._state.compareList];
    const idx = list.indexOf(deviceId);

    if (idx !== -1) {
      // Already in list → remove
      list.splice(idx, 1);
      _state.compareList = list;
      _lsSet(LS_KEYS.compareList, list);
      _notify('compareList', list, null);
      return 'removed';
    }

    if (list.length >= 2) {
      // Limit reached
      console.info('[State] Compare limit reached (max 2)');
      return 'limit';
    }

    // Add to list
    list.push(deviceId);
    _state.compareList = list;
    _lsSet(LS_KEYS.compareList, list);
    _notify('compareList', list, null);
    return 'added';
  }

  /**
   * Check if a device is in the compare list.
   * @param {string} deviceId
   * @returns {boolean}
   */
  function isInCompare(deviceId) {
    return _state.compareList.includes(deviceId);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — RECENT VIEWED
     ══════════════════════════════════════════════════════════ */

  /**
   * Add a device to the recently viewed list.
   * Keeps max 10, deduplicates, most recent first.
   *
   * @param {{ id: string, name: string, thumbnail?: string }} device
   */
  function addRecentViewed(device) {
    if (!device?.id) return;

    const recent = [..._state.recentViewed];

    // Remove if already present
    const existingIdx = recent.findIndex(r => r.id === device.id);
    if (existingIdx !== -1) recent.splice(existingIdx, 1);

    // Add to front
    recent.unshift({
      id:        device.id,
      name:      device.name,
      thumbnail: device.thumbnail,
      timestamp: Date.now(),
    });

    // Cap at 10
    const trimmed = recent.slice(0, 10);

    _state.recentViewed = trimmed;
    _lsSet(LS_KEYS.recentViewed, trimmed);
    _notify('recentViewed', trimmed, null);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API — UTILITIES
     ══════════════════════════════════════════════════════════ */

  /**
   * Reset state to initial values (except persisted fields).
   */
  function reset() {
    const persisted = {
      bookmarks:    _state.bookmarks,
      compareList:  _state.compareList,
      recentViewed: _state.recentViewed,
    };
    _state = { ...JSON.parse(JSON.stringify(initialState)), ...persisted };
    _notify('*', _state, null);
    console.info('[State] State reset');
  }

  /**
   * Get full state snapshot (for debugging only).
   * @returns {Object}
   */
  function snapshot() {
    return JSON.parse(JSON.stringify(_state));
  }

  /**
   * Get subscriber count per key (for debugging).
   * @returns {Object}
   */
  function getSubscriberCount() {
    const counts = {};
    for (const [key, subs] of _subscribers.entries()) {
      counts[key] = subs.size;
    }
    return counts;
  }

  /* ── INIT: restore persisted state from localStorage ─────── */
  _restoreFromStorage();
  _state.initialized = true;

  /* ── PUBLIC INTERFACE ───────────────────────────────────── */
  return {
    // Core
    get,
    set,
    subscribe,
    dispatch,
    reset,
    // Bookmarks
    bookmarkToggle,
    isBookmarked,
    // Compare
    compareToggle,
    isInCompare,
    // Recent viewed
    addRecentViewed,
    // Debug
    snapshot,
    getSubscriberCount,
  };

})();

// Make available globally
window.State = State;
