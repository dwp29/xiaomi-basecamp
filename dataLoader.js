'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  dataLoader.js — Xiaomi Basecamp Core Engine                ║
 * ║  JSON fetch manager with in-memory cache + queue dedup.     ║
 * ║  Auto-transforms device data via DataTransformer.           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  FEATURES:
 *    - In-memory Map cache with 5-minute TTL
 *    - Queue deduplication: 10 simultaneous calls for same
 *      resource → 1 actual fetch, all 10 receive the result
 *    - Auto-transform: devices run through DataTransformer
 *    - Graceful error handling (returns null, logs context)
 *    - Loading state tracking per data type
 *
 *  USAGE:
 *    const devices    = await DataLoader.getDevices();
 *    const device     = await DataLoader.getDevice('redmi-note-13-pro-plus');
 *    const roms       = await DataLoader.getRoms();
 *    const tools      = await DataLoader.getTools();
 *    const tutorials  = await DataLoader.getTutorials();
 *    await DataLoader.preload(['devices', 'roms']);
 *    DataLoader.clearCache();
 *    DataLoader.isLoading('devices'); // → boolean
 *
 *  REQUIRES: DataTransformer (must be loaded before this file)
 */

const DataLoader = (() => {

  /* ── CONFIG ─────────────────────────────────────────────── */
  const CACHE_TTL_MS    = 5 * 60 * 1000;  // 5 minutes
  const BASE_DATA_PATH  = '/data';

  const DATA_PATHS = {
    devices:   '/data/xiaomi_devices_fixed.json',   // raw 207 devices
    roms:      `${BASE_DATA_PATH}/roms/_index.json`,
    tools:     `${BASE_DATA_PATH}/tools/_index.json`,
    tutorials: `${BASE_DATA_PATH}/tutorials/_index.json`,
    config:    `${BASE_DATA_PATH}/config.json`,
  };

  /* ── INTERNAL STATE ─────────────────────────────────────── */

  /** @type {Map<string, { data: any, timestamp: number }>} */
  const cache = new Map();

  /**
   * In-flight fetch promises — prevents duplicate network requests.
   * key → Promise
   * @type {Map<string, Promise<any>>}
   */
  const inFlight = new Map();

  /**
   * Loading state flags per type.
   * @type {Object<string, boolean>}
   */
  const loadingState = {
    devices:   false,
    roms:      false,
    tools:     false,
    tutorials: false,
    config:    false,
  };

  /* ══════════════════════════════════════════════════════════
     PRIVATE HELPERS
     ══════════════════════════════════════════════════════════ */

  /**
   * Check if a cached entry is still valid (within TTL).
   * @param {string} key
   * @returns {boolean}
   */
  function isCacheValid(key) {
    const entry = cache.get(key);
    if (!entry) return false;
    return (Date.now() - entry.timestamp) < CACHE_TTL_MS;
  }

  /**
   * Store data in cache with current timestamp.
   * @param {string} key
   * @param {any} data
   */
  function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Core fetch with dedup + cache.
   * If a fetch for this key is already in-flight, returns the
   * same promise rather than starting a new request.
   *
   * @param {string} cacheKey  - Unique cache key (usually the URL)
   * @param {string} url       - URL to fetch
   * @param {string} [type]    - Data type name (for loading state)
   * @returns {Promise<any|null>}
   */
  async function fetchWithCache(cacheKey, url, type = null) {
    // 1. Return cached data if still fresh
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey).data;
    }

    // 2. Return existing in-flight promise (dedup)
    if (inFlight.has(cacheKey)) {
      return inFlight.get(cacheKey);
    }

    // 3. Start new fetch
    if (type) loadingState[type] = true;

    const fetchPromise = (async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          // Use no-cache to respect TTL ourselves
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} — ${url}`);
        }

        const json = await response.json();
        setCache(cacheKey, json);
        return json;

      } catch (err) {
        console.error(`[DataLoader] Failed to fetch "${url}":`, err.message);
        return null;

      } finally {
        inFlight.delete(cacheKey);
        if (type) loadingState[type] = false;
      }
    })();

    inFlight.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /* ══════════════════════════════════════════════════════════
     DEVICES
     ══════════════════════════════════════════════════════════ */

  /**
   * Load and return all devices (normalized).
   * Fetches from xiaomi_devices_fixed.json and transforms each entry.
   *
   * @returns {Promise<Object[]>} Array of normalized device objects
   */
  async function getDevices() {
    const CACHE_KEY = 'normalized_devices';

    // Return cached normalized devices if valid
    if (isCacheValid(CACHE_KEY)) {
      return cache.get(CACHE_KEY).data;
    }

    // Fetch raw JSON
    const raw = await fetchWithCache('raw_devices', DATA_PATHS.devices, 'devices');
    if (!raw) return [];

    // The JSON has a "devices" array at root
    const rawArray = Array.isArray(raw) ? raw : (raw.devices || []);

    // Transform via DataTransformer
    const normalized = DataTransformer.normalizeDevices(rawArray);

    // Cache the normalized result separately (longer TTL okay — it's derived)
    setCache(CACHE_KEY, normalized);

    console.info(`[DataLoader] Loaded ${normalized.length} devices`);
    return normalized;
  }

  /**
   * Get a single device by ID, slug, or numeric ID.
   * Loads all devices if not already cached, then finds by match.
   *
   * @param {string|number} id - slug, string id, or numeric id
   * @returns {Promise<Object|null>}
   */
  async function getDevice(id) {
    if (id == null) return null;

    const devices = await getDevices();
    if (!devices.length) return null;

    const strId = String(id).toLowerCase();

    return devices.find(d =>
      d.id          === strId          ||
      d.slug        === strId          ||
      String(d.numeric_id) === strId   ||
      d.codename?.toLowerCase() === strId
    ) || null;
  }

  /* ══════════════════════════════════════════════════════════
     ROMS
     ══════════════════════════════════════════════════════════ */

  /**
   * Load and return all ROMs (normalized).
   * @returns {Promise<Object[]>}
   */
  async function getRoms() {
    const raw = await fetchWithCache('roms', DATA_PATHS.roms, 'roms');
    if (!raw) return [];

    const rawArray = Array.isArray(raw) ? raw : (raw.items || raw.roms || []);
    const normalized = DataTransformer.normalizeRoms(rawArray);

    console.info(`[DataLoader] Loaded ${normalized.length} ROMs`);
    return normalized;
  }

  /**
   * Get a single ROM by id or slug.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async function getRom(id) {
    if (!id) return null;
    const roms = await getRoms();
    const strId = String(id).toLowerCase();
    return roms.find(r =>
      r.id === strId || r.slug === strId
    ) || null;
  }

  /* ══════════════════════════════════════════════════════════
     TOOLS
     ══════════════════════════════════════════════════════════ */

  /**
   * Load and return all tools (normalized).
   * @returns {Promise<Object[]>}
   */
  async function getTools() {
    const raw = await fetchWithCache('tools', DATA_PATHS.tools, 'tools');
    if (!raw) return [];

    const rawArray = Array.isArray(raw) ? raw : (raw.items || raw.tools || []);
    const normalized = DataTransformer.normalizeTools(rawArray);

    console.info(`[DataLoader] Loaded ${normalized.length} tools`);
    return normalized;
  }

  /**
   * Get a single tool by id or slug.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async function getTool(id) {
    if (!id) return null;
    const tools = await getTools();
    const strId = String(id).toLowerCase();
    return tools.find(t =>
      t.id === strId || t.slug === strId
    ) || null;
  }

  /* ══════════════════════════════════════════════════════════
     TUTORIALS
     ══════════════════════════════════════════════════════════ */

  /**
   * Load and return all tutorials (normalized).
   * @returns {Promise<Object[]>}
   */
  async function getTutorials() {
    const raw = await fetchWithCache('tutorials', DATA_PATHS.tutorials, 'tutorials');
    if (!raw) return [];

    const rawArray = Array.isArray(raw) ? raw : (raw.items || raw.tutorials || []);
    const normalized = DataTransformer.normalizeTutorials(rawArray);

    console.info(`[DataLoader] Loaded ${normalized.length} tutorials`);
    return normalized;
  }

  /**
   * Get a single tutorial by id or slug.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async function getTutorial(id) {
    if (!id) return null;
    const tutorials = await getTutorials();
    const strId = String(id).toLowerCase();
    return tutorials.find(t =>
      t.id === strId || t.slug === strId
    ) || null;
  }

  /* ══════════════════════════════════════════════════════════
     CONFIG
     ══════════════════════════════════════════════════════════ */

  /**
   * Load global site config.
   * @returns {Promise<Object|null>}
   */
  async function getConfig() {
    return fetchWithCache('config', DATA_PATHS.config, 'config');
  }

  /* ══════════════════════════════════════════════════════════
     PRELOAD
     ══════════════════════════════════════════════════════════ */

  /**
   * Preload multiple data types in parallel.
   * Call this early (e.g., on homepage) to warm the cache
   * before the user navigates to sub-pages.
   *
   * @param {string[]} types - e.g. ['devices', 'roms', 'tools']
   * @returns {Promise<void>}
   */
  async function preload(types = []) {
    const loaders = {
      devices:   getDevices,
      roms:      getRoms,
      tools:     getTools,
      tutorials: getTutorials,
      config:    getConfig,
    };

    const promises = types
      .filter(t => loaders[t])
      .map(t => loaders[t]().catch(err => {
        console.warn(`[DataLoader] preload failed for "${t}":`, err.message);
      }));

    await Promise.all(promises);
    console.info(`[DataLoader] Preloaded: ${types.join(', ')}`);
  }

  /* ══════════════════════════════════════════════════════════
     UTILITIES
     ══════════════════════════════════════════════════════════ */

  /**
   * Check if a specific data type is currently being fetched.
   * @param {string} type - 'devices' | 'roms' | 'tools' | 'tutorials'
   * @returns {boolean}
   */
  function isLoading(type) {
    return loadingState[type] === true;
  }

  /**
   * Clear all cached data.
   * Useful after a data update or for testing.
   */
  function clearCache() {
    cache.clear();
    inFlight.clear();
    Object.keys(loadingState).forEach(k => { loadingState[k] = false; });
    console.info('[DataLoader] Cache cleared');
  }

  /**
   * Clear cache for a specific type only.
   * @param {string} type - 'devices' | 'roms' | 'tools' | 'tutorials'
   */
  function clearTypeCache(type) {
    const keys = {
      devices:   ['raw_devices', 'normalized_devices'],
      roms:      ['roms'],
      tools:     ['tools'],
      tutorials: ['tutorials'],
      config:    ['config'],
    };
    (keys[type] || []).forEach(k => cache.delete(k));
    console.info(`[DataLoader] Cache cleared for "${type}"`);
  }

  /**
   * Get cache status (for debugging).
   * @returns {Object}
   */
  function getCacheStatus() {
    const status = {};
    for (const [key, entry] of cache.entries()) {
      const ageMs = Date.now() - entry.timestamp;
      status[key] = {
        age: `${Math.round(ageMs / 1000)}s`,
        valid: ageMs < CACHE_TTL_MS,
        items: Array.isArray(entry.data)
          ? entry.data.length
          : (entry.data?.devices?.length || 'non-array'),
      };
    }
    return status;
  }

  /* ── PUBLIC INTERFACE ───────────────────────────────────── */
  return {
    // Data getters
    getDevices,
    getDevice,
    getRoms,
    getRom,
    getTools,
    getTool,
    getTutorials,
    getTutorial,
    getConfig,
    // Utilities
    preload,
    isLoading,
    clearCache,
    clearTypeCache,
    getCacheStatus,
  };

})();

// Make available globally
window.DataLoader = DataLoader;
