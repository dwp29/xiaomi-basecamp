'use strict';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  dataTransformer.js — Xiaomi Basecamp Core Engine           ║
 * ║  Adapts raw xiaomi_devices_fixed.json schema →              ║
 * ║  UI-ready normalized device objects.                        ║
 * ║  Also normalizes ROM, Tool, Tutorial data.                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  WHY THIS FILE EXISTS:
 *    The raw JSON (xiaomi_devices_fixed.json) uses a flat schema
 *    with numeric IDs and nested sub-objects. The UI needs:
 *      - String slugs as IDs (for URL routing)
 *      - Flat fields (no nested .display.size_inch, just .display_size)
 *      - Auto-generated search_blob for SearchEngine
 *      - Auto-generated tags for FilterEngine
 *      - Derived fields: chipset_brand, android_version, has_hyperos
 *      - Modding score (0-100) for sorting
 *
 *  USAGE:
 *    const device = DataTransformer.normalizeDevice(rawDevice);
 *    const devices = DataTransformer.normalizeDevices(rawArray);
 */

const DataTransformer = (() => {

  /* ── CHIPSET BRAND DETECTION MAP ───────────────────────── */
  const CHIPSET_BRAND_MAP = [
    { keywords: ['snapdragon', 'sm8', 'sm7', 'sm6', 'sm4'],  brand: 'Qualcomm'   },
    { keywords: ['dimensity', 'helio', 'mt6'],                brand: 'MediaTek'   },
    { keywords: ['exynos'],                                   brand: 'Samsung'    },
    { keywords: ['kirin'],                                    brand: 'HiSilicon'  },
    { keywords: ['apple', 'bionic'],                          brand: 'Apple'      },
    { keywords: ['unisoc', 'tiger'],                          brand: 'Unisoc'     },
  ];

  /* ── TAG GENERATION THRESHOLDS ──────────────────────────── */
  const TAG_RULES = {
    fiveg:        { field: 'fiveg',           value: true,  tag: '5g'           },
    nfc:          { field: 'nfc',             value: true,  tag: 'nfc'          },
    hyperos:      { field: 'has_hyperos',     value: true,  tag: 'hyperos'      },
    wireless:     { field: 'wireless_charge', value: true,  tag: 'wireless-charging' },
    high_refresh: { field: 'refresh_rate',    min: 90,      tag: 'high-refresh' },
    high_camera:  { field: 'camera_main',     min: 100,     tag: 'high-camera'  },
    fast_charge:  { field: 'fast_charge_w',   min: 65,      tag: 'fast-charge'  },
    flagship:     { field: 'fast_charge_w',   min: 100,     tag: 'flagship'     },
    large_bat:    { field: 'battery_mah',     min: 5000,    tag: 'big-battery'  },
    amoled:       { field: 'display_type',    contains: 'AMOLED', tag: 'amoled' },
    ubl:          { field: 'bootloader_unlockable', value: true, tag: 'ubl-supported' },
  };

  /* ── MODDING SCORE WEIGHTS ──────────────────────────────── */
  // Total max = 100
  const MODDING_WEIGHTS = {
    bootloader_unlockable: 30,  // Can you even unlock?
    ubl_official:          10,  // Official method = safer
    has_twrp:              20,  // TWRP available
    has_orangefox:         10,  // OrangeFox available
    has_pbrp:               5,  // PBRP available
    has_magisk:            15,  // Magisk root
    has_kernelsu:          10,  // KernelSU root
  };

  /* ══════════════════════════════════════════════════════════
     PRIVATE HELPERS
     ══════════════════════════════════════════════════════════ */

  /**
   * Convert any device name to a URL-safe slug.
   * "Redmi Note 13 Pro+" → "redmi-note-13-pro-plus"
   * @param {string} name
   * @returns {string}
   */
  function generateSlug(name) {
    if (!name || typeof name !== 'string') return 'unknown-device';
    return name
      .toLowerCase()
      .replace(/\+/g, '-plus')
      .replace(/\s+/g, '-')           // spaces → dashes
      .replace(/[^a-z0-9-]/g, '')     // remove non-alphanumeric (except dash)
      .replace(/-{2,}/g, '-')         // collapse multiple dashes
      .replace(/^-|-$/g, '');         // trim leading/trailing dashes
  }

  /**
   * Detect chipset manufacturer from chipset name string.
   * "Snapdragon 8 Gen 3" → "Qualcomm"
   * "Dimensity 7200 Ultra" → "MediaTek"
   * @param {string} chipsetName
   * @returns {string}
   */
  function extractChipsetBrand(chipsetName) {
    if (!chipsetName) return 'Unknown';
    const lower = chipsetName.toLowerCase();
    for (const entry of CHIPSET_BRAND_MAP) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        return entry.brand;
      }
    }
    return 'Unknown';
  }

  /**
   * Extract highest Android version number from OS strings.
   * "HyperOS / Android 14" → 14
   * "MIUI 14 / Android 13" → 13
   * Checks both launch and upgradable_to, returns the higher.
   * @param {...string} osStrings
   * @returns {number}
   */
  function extractAndroidVersion(...osStrings) {
    let highest = 0;
    const combined = osStrings.filter(Boolean).join(' ');
    // Match "Android N" or "Android NN"
    const matches = combined.match(/android\s+(\d+)/gi) || [];
    for (const m of matches) {
      const ver = parseInt(m.replace(/android\s+/i, ''), 10);
      if (!isNaN(ver) && ver > highest) highest = ver;
    }
    return highest || 0;
  }

  /**
   * Check if any OS string mentions HyperOS.
   * @param {...string} osStrings
   * @returns {boolean}
   */
  function detectHyperos(...osStrings) {
    return osStrings.filter(Boolean).some(s =>
      s.toLowerCase().includes('hyperos')
    );
  }

  /**
   * Extract unique sorted RAM values from memory array.
   * [{ ram_gb: 8 }, { ram_gb: 12 }, { ram_gb: 8 }] → [8, 12]
   * @param {Array} memoryArr
   * @returns {number[]}
   */
  function extractRam(memoryArr) {
    if (!Array.isArray(memoryArr)) return [];
    return [...new Set(memoryArr.map(m => m.ram_gb).filter(Boolean))].sort((a, b) => a - b);
  }

  /**
   * Extract unique sorted storage values from memory array.
   * @param {Array} memoryArr
   * @returns {number[]}
   */
  function extractStorage(memoryArr) {
    if (!Array.isArray(memoryArr)) return [];
    return [...new Set(memoryArr.map(m => m.storage_gb).filter(Boolean))].sort((a, b) => a - b);
  }

  /**
   * Format array of numbers as human-readable display string.
   * [8, 12] → "8/12GB"
   * [256, 512] → "256/512GB"
   * @param {number[]} arr
   * @param {string} unit
   * @returns {string}
   */
  function formatOptions(arr, unit = 'GB') {
    if (!arr.length) return 'N/A';
    return arr.join('/') + unit;
  }

  /**
   * Extract year from "YYYY-MM" or "YYYY" string.
   * "2023-09" → 2023
   * @param {string} dateStr
   * @returns {number}
   */
  function extractYear(dateStr) {
    if (!dateStr) return 0;
    const match = String(dateStr).match(/^(\d{4})/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Determine device status based on year and other signals.
   * < 2019 → "discontinued"
   * < 2021 → "legacy"
   * else   → "active"
   * @param {number} year
   * @param {Object} rawDevice
   * @returns {string}
   */
  function determineStatus(year, rawDevice) {
    if (rawDevice.status) return rawDevice.status; // respect explicit status
    if (!year || year < 2019) return 'discontinued';
    if (year < 2021) return 'legacy';
    return 'active';
  }

  /**
   * Check if a recovery option exists in the options array.
   * Case-insensitive partial match.
   * @param {string[]} options
   * @param {string} name
   * @returns {boolean}
   */
  function hasRecovery(options, name) {
    if (!Array.isArray(options)) return false;
    return options.some(o => o.toLowerCase().includes(name.toLowerCase()));
  }

  /**
   * Calculate modding-friendliness score (0–100).
   * Higher = more moddable device.
   * @param {Object} normalized - Already normalized device
   * @returns {number}
   */
  function calculateModdingScore(normalized) {
    let score = 0;
    if (normalized.bootloader_unlockable) {
      score += MODDING_WEIGHTS.bootloader_unlockable;
    }
    if (normalized.ubl_method === 'official') {
      score += MODDING_WEIGHTS.ubl_official;
    }
    if (hasRecovery(normalized.recovery_options, 'TWRP')) {
      score += MODDING_WEIGHTS.has_twrp;
    }
    if (hasRecovery(normalized.recovery_options, 'OrangeFox')) {
      score += MODDING_WEIGHTS.has_orangefox;
    }
    if (hasRecovery(normalized.recovery_options, 'PBRP')) {
      score += MODDING_WEIGHTS.has_pbrp;
    }
    if (hasRecovery(normalized.root_options, 'Magisk')) {
      score += MODDING_WEIGHTS.has_magisk;
    }
    if (hasRecovery(normalized.root_options, 'KernelSU')) {
      score += MODDING_WEIGHTS.has_kernelsu;
    }
    return Math.min(100, score);
  }

  /**
   * Auto-generate tags from normalized device fields.
   * @param {Object} normalized
   * @returns {string[]}
   */
  function generateTags(normalized) {
    const tags = [];

    for (const [, rule] of Object.entries(TAG_RULES)) {
      const val = normalized[rule.field];

      if (rule.value !== undefined && val === rule.value) {
        tags.push(rule.tag);
        continue;
      }
      if (rule.min !== undefined && typeof val === 'number' && val >= rule.min) {
        tags.push(rule.tag);
        continue;
      }
      if (rule.contains !== undefined && typeof val === 'string' &&
          val.toUpperCase().includes(rule.contains.toUpperCase())) {
        tags.push(rule.tag);
        continue;
      }
    }

    // Series-based tags
    const series = (normalized.series || '').toLowerCase();
    if (series.includes('poco')) tags.push('poco');
    if (series.includes('redmi')) tags.push('redmi');
    if (series.includes('xiaomi')) tags.push('xiaomi');

    // Chipset brand tag
    const cb = (normalized.chipset_brand || '').toLowerCase();
    if (cb === 'qualcomm') tags.push('snapdragon');
    if (cb === 'mediatek') tags.push('mediatek');

    // Android version tag
    if (normalized.android_version >= 14) tags.push('android-14');
    if (normalized.android_version >= 15) tags.push('android-15');

    return [...new Set(tags)]; // deduplicate
  }

  /**
   * Build search_blob — a single lowercase string joining all
   * searchable fields. Required by SearchEngine.
   * @param {Object} normalized
   * @returns {string}
   */
  function generateSearchBlob(normalized) {
    const parts = [
      normalized.name,
      normalized.brand,
      normalized.series,
      normalized.codename,
      normalized.chipset,
      normalized.chipset_brand,
      normalized.cpu,
      normalized.gpu,
      normalized.os_launch,
      normalized.os_latest,
      normalized.display_type,
      normalized.wifi,
      normalized.usb,
      normalized.bluetooth,
      ...(normalized.tags || []),
      ...(normalized.ram || []).map(r => r + 'GB'),
      ...(normalized.storage || []).map(s => s + 'GB'),
      normalized.year ? String(normalized.year) : '',
      normalized.android_version ? 'android ' + normalized.android_version : '',
      normalized.fiveg ? '5g' : '',
      normalized.nfc ? 'nfc' : '',
      normalized.has_hyperos ? 'hyperos' : '',
      normalized.bootloader_unlockable ? 'ubl unlock bootloader' : '',
      ...(normalized.recovery_options || []),
      ...(normalized.root_options || []),
      // Common search synonyms
      normalized.brand === 'Redmi' ? 'xiaomi redmi' : '',
      normalized.brand === 'POCO' ? 'xiaomi poco' : '',
    ];

    return parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════════ */

  /**
   * Normalize a single raw device from xiaomi_devices_fixed.json
   * to the UI-ready format.
   *
   * @param {Object} raw - Raw device object from JSON
   * @returns {Object} Normalized device
   */
  function normalizeDevice(raw) {
    if (!raw || typeof raw !== 'object') {
      console.warn('[DataTransformer] normalizeDevice: invalid input', raw);
      return null;
    }

    // ── Extract raw sub-fields safely ────────────────────── //
    const disp  = raw.display     || {};
    const proc  = raw.processor   || {};
    const mem   = raw.memory      || [];
    const cam   = raw.camera      || {};
    const bat   = raw.battery     || {};
    const conn  = raw.connectivity || {};
    const os    = raw.os          || {};
    const mod   = raw.modding     || {};
    const comm  = raw.community   || {};

    // ── Derived values ───────────────────────────────────── //
    const year          = extractYear(raw.released || raw.announced);
    const ram           = extractRam(mem);
    const storage       = extractStorage(mem);
    const chipset       = proc.chipset || '';
    const chipset_brand = extractChipsetBrand(chipset);
    const android_ver   = extractAndroidVersion(os.launch, os.upgradable_to);
    const has_hyperos   = detectHyperos(os.launch, os.upgradable_to);
    const wireless      = bat.wireless_charge_w != null && bat.wireless_charge_w > 0;

    // ── Build normalized object ──────────────────────────── //
    const normalized = {
      // Identity
      id:          generateSlug(raw.name),
      numeric_id:  raw.id,
      brand:       raw.brand       || 'Xiaomi',
      series:      raw.series      || '',
      name:        raw.name        || 'Unknown Device',
      codename:    raw.codename    || '',
      year,
      announced:   raw.announced   || null,
      released:    raw.released    || null,

      // Processor
      chipset,
      chipset_brand,
      cpu:         proc.cpu        || '',
      gpu:         proc.gpu        || '',
      process_nm:  proc.node_nm    || null,

      // Memory
      ram,
      storage,
      ram_display:     formatOptions(ram),
      storage_display: formatOptions(storage),

      // Display
      display_size: disp.size_inch     || null,
      display_type: disp.type          || '',
      resolution:   disp.resolution    || '',
      refresh_rate: disp.refresh_rate_hz || 60,
      ppi:          disp.ppi           || null,
      brightness:   disp.brightness_nits || null,

      // Camera
      camera_main:      cam.main_mp       || null,
      camera_ultrawide: cam.ultrawide_mp  || null,
      camera_macro:     cam.macro_mp      || null,
      camera_front:     cam.front_mp      || null,
      camera_aperture:  cam.aperture_main || null,
      camera_video:     cam.video_max     || null,

      // Battery
      battery_mah:    bat.capacity_mah      || null,
      fast_charge_w:  bat.fast_charge_w     || null,
      wireless_charge: wireless,
      wireless_charge_w: bat.wireless_charge_w || null,

      // Connectivity
      fiveg:     conn['5g']     ?? false,
      nfc:       conn.nfc       ?? false,
      wifi:      conn.wifi      || '',
      bluetooth: conn.bluetooth || '',
      usb:       conn.usb       || '',

      // OS
      os_launch:       os.launch       || '',
      os_latest:       os.upgradable_to || os.launch || '',
      android_version: android_ver,
      has_hyperos,

      // Modding
      bootloader_unlockable: mod.bootloader_unlockable ?? true,
      ubl_method:            mod.ubl_method            || 'official',
      ubl_wait_days:         mod.ubl_wait_days          || 168,
      treble_support:        mod.treble_support          ?? true,
      gsi_compatible:        mod.gsi_compatible          ?? true,
      ab_partition:          mod.ab_partition            ?? true,
      recovery_options:      mod.recovery_options        || [],
      root_options:          mod.root_options            || ['Magisk'],
      kernel_source:         mod.kernel_source           || null,

      // Community
      xda_thread:     comm.xda_thread    || null,
      telegram_group: comm.telegram_group || null,

      // Assets (placeholder until real images added)
      thumbnail: `/assets/img/devices/${generateSlug(raw.name)}.webp`,
      thumbnail_fallback: '/assets/img/devices/placeholder.webp',

      // Status
      status: determineStatus(year, raw),

      // Will be filled next
      tags:          [],
      search_blob:   '',
      modding_score: 0,
    };

    // ── Derived computed fields (need normalized object) ─── //
    normalized.tags          = generateTags(normalized);
    normalized.search_blob   = generateSearchBlob(normalized);
    normalized.modding_score = calculateModdingScore(normalized);

    return normalized;
  }

  /**
   * Normalize an array of raw devices.
   * Filters out null results (malformed entries).
   *
   * @param {Object[]} rawDevices
   * @returns {Object[]}
   */
  function normalizeDevices(rawDevices) {
    if (!Array.isArray(rawDevices)) {
      console.error('[DataTransformer] normalizeDevices: expected array, got', typeof rawDevices);
      return [];
    }
    return rawDevices
      .map(raw => {
        try {
          return normalizeDevice(raw);
        } catch (err) {
          console.warn('[DataTransformer] Failed to normalize device:', raw?.name, err.message);
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Normalize a ROM entry — adds search_blob if missing.
   * ROM data is already close to the right shape,
   * but needs search_blob for SearchEngine.
   *
   * @param {Object} raw - Raw ROM from roms/_index.json
   * @returns {Object}
   */
  function normalizeRom(raw) {
    if (!raw) return null;

    const normalized = {
      ...raw,
      // Ensure slug/id consistency
      id:   raw.id   || generateSlug(raw.name),
      slug: raw.slug || generateSlug(raw.name),
    };

    // Generate search_blob if not present
    if (!normalized.search_blob) {
      normalized.search_blob = [
        normalized.name,
        normalized.short_name,
        normalized.base,
        normalized.type,
        normalized.android_version ? 'android ' + normalized.android_version : '',
        ...(normalized.features || []),
        ...(normalized.tags || []),
        normalized.status,
      ].filter(Boolean).join(' ').toLowerCase();
    }

    return normalized;
  }

  /**
   * Normalize an array of ROMs.
   * @param {Object[]} rawRoms
   * @returns {Object[]}
   */
  function normalizeRoms(rawRoms) {
    if (!Array.isArray(rawRoms)) return [];
    return rawRoms.map(normalizeRom).filter(Boolean);
  }

  /**
   * Normalize a Tool entry — adds search_blob.
   * @param {Object} raw - Raw tool from tools/_index.json
   * @returns {Object}
   */
  function normalizeTool(raw) {
    if (!raw) return null;

    const normalized = {
      ...raw,
      id:   raw.id   || generateSlug(raw.name),
      slug: raw.slug || generateSlug(raw.name),
    };

    if (!normalized.search_blob) {
      normalized.search_blob = [
        normalized.name,
        normalized.developer,
        normalized.category,
        normalized.subcategory,
        normalized.version_stable,
        ...(normalized.features   || []),
        ...(normalized.tags       || []),
        normalized.status,
        normalized.license,
      ].filter(Boolean).join(' ').toLowerCase();
    }

    return normalized;
  }

  /**
   * Normalize an array of Tools.
   * @param {Object[]} rawTools
   * @returns {Object[]}
   */
  function normalizeTools(rawTools) {
    if (!Array.isArray(rawTools)) return [];
    return rawTools.map(normalizeTool).filter(Boolean);
  }

  /**
   * Normalize a Tutorial entry — adds search_blob.
   * @param {Object} raw - Raw tutorial from tutorials/_index.json
   * @returns {Object}
   */
  function normalizeTutorial(raw) {
    if (!raw) return null;

    const normalized = {
      ...raw,
      id:   raw.id   || generateSlug(raw.title),
      slug: raw.slug || generateSlug(raw.title),
    };

    if (!normalized.search_blob) {
      normalized.search_blob = [
        normalized.title,
        normalized.category,
        normalized.subcategory,
        normalized.difficulty,
        ...(normalized.tags || []),
        ...(normalized.requirements || []),
      ].filter(Boolean).join(' ').toLowerCase();
    }

    return normalized;
  }

  /**
   * Normalize an array of Tutorials.
   * @param {Object[]} rawTutorials
   * @returns {Object[]}
   */
  function normalizeTutorials(rawTutorials) {
    if (!Array.isArray(rawTutorials)) return [];
    return rawTutorials.map(normalizeTutorial).filter(Boolean);
  }

  /* ── PUBLIC INTERFACE ───────────────────────────────────── */
  return {
    // Device
    normalizeDevice,
    normalizeDevices,
    // ROM
    normalizeRom,
    normalizeRoms,
    // Tool
    normalizeTool,
    normalizeTools,
    // Tutorial
    normalizeTutorial,
    normalizeTutorials,
    // Utilities (exposed for testing / reuse)
    generateSlug,
    extractChipsetBrand,
    extractAndroidVersion,
    generateTags,
    generateSearchBlob,
    calculateModdingScore,
  };

})();

// Make available globally
window.DataTransformer = DataTransformer;
