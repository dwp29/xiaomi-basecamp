/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  filter-engine.js  — MIUI Nexus Core Engine v1.0            ║
 * ║  Generic multi-dimension filter system.                     ║
 * ║  Reusable across Devices, ROMs, Tools, Tutorials.           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  FILTER TYPES SUPPORTED:
 *    exact       — field === value
 *    multi       — field included in values[] (OR logic within group, AND across groups)
 *    multi_any   — item's array field has ANY match with values[]
 *    multi_all   — item's array field has ALL matches with values[]
 *    boolean     — field === true/false
 *    range       — value >= min && value <= max
 *    range_min   — value >= min (one-sided)
 *    range_max   — value <= max (one-sided)
 *    includes    — item's array includes value (scalar check)
 *    fn          — custom predicate (item) => boolean
 *
 *  USAGE:
 *    const FE = FilterEngine.create();
 *
 *    // Define dimensions (done once, can be reconfigured)
 *    FE.define('series',  { type: 'multi',   field: 'series' })
 *      .define('chipset', { type: 'multi',   field: 'chipset_brand' })
 *      .define('ram',     { type: 'multi_any', field: 'ram', transform: v => parseInt(v) })
 *      .define('android', { type: 'range_min', field: 'android' })
 *      .define('fiveg',   { type: 'boolean', field: 'fiveg' })
 *      .define('nfc',     { type: 'boolean', field: 'nfc' })
 *      .define('os',      { type: 'multi_any', field: 'os' });
 *
 *    // Set filter values
 *    FE.set('series',  ['Redmi', 'POCO']);
 *    FE.set('android', { min: 12 });
 *    FE.set('fiveg',   true);
 *
 *    // Apply to data
 *    const filtered = FE.apply(devices);
 *
 *    // Get active summary (for UI tags)
 *    const active = FE.getActive();
 *
 *    // Clear one dimension
 *    FE.clear('series');
 *
 *    // Clear all
 *    FE.clearAll();
 *
 *    // Bind a DOM filter option
 *    FE.bindOption(el, 'series', 'Redmi', onFilterChange);
 *
 *    // Compute option counts from a dataset
 *    const counts = FE.computeCounts(devices, 'series');
 */

'use strict';

const FilterEngine = (() => {

  /* ── FILTER TYPE PREDICATES ────────────────────────────── */

  const PREDICATES = {

    /**
     * exact: item[field] === value (strict equality)
     */
    exact(item, field, value) {
      return item[field] === value;
    },

    /**
     * multi: item[field] is IN the selected values array.
     * Empty values[] = no constraint (pass-through).
     * Logic across groups: AND. Within group: OR.
     */
    multi(item, field, values) {
      if (!values.length) return true;
      return values.includes(item[field]);
    },

    /**
     * multi_any: item's ARRAY field has at least ONE match with values[].
     * Use when item[field] is an array (e.g. ram: [8, 12], os: ["MIUI 14", "HyperOS"])
     */
    multi_any(item, field, values, transform) {
      if (!values.length) return true;
      const arr = item[field];
      if (!Array.isArray(arr)) return values.includes(
        transform ? transform(item[field]) : item[field]
      );
      return arr.some(v => values.includes(transform ? transform(v) : v));
    },

    /**
     * multi_all: item's ARRAY field has ALL values present.
     * Use for "must have ALL selected features".
     */
    multi_all(item, field, values, transform) {
      if (!values.length) return true;
      const arr = item[field];
      if (!Array.isArray(arr)) return false;
      return values.every(v => arr.some(av => (transform ? transform(av) : av) === v));
    },

    /**
     * boolean: item[field] === true/false.
     * null means "no constraint".
     */
    boolean(item, field, value) {
      if (value === null || value === undefined) return true;
      return !!item[field] === !!value;
    },

    /**
     * range: min <= item[field] <= max
     * Pass { min, max } as value. Either can be omitted.
     */
    range(item, field, value) {
      const v = item[field];
      if (value.min !== undefined && v < value.min) return false;
      if (value.max !== undefined && v > value.max) return false;
      return true;
    },

    /**
     * range_min: item[field] >= min
     * Shorthand for one-sided range (common: Android version).
     */
    range_min(item, field, value) {
      if (value === null || value === undefined) return true;
      return item[field] >= value;
    },

    /**
     * range_max: item[field] <= max
     */
    range_max(item, field, value) {
      if (value === null || value === undefined) return true;
      return item[field] <= value;
    },

    /**
     * includes: item's ARRAY field includes scalar value.
     * E.g. tags includes 'gaming'.
     */
    includes(item, field, value) {
      if (value === null) return true;
      const arr = item[field];
      return Array.isArray(arr) && arr.includes(value);
    },

    /**
     * fn: fully custom predicate function.
     * value must be a (item) => boolean function.
     */
    fn(item, _field, predicateFn) {
      return predicateFn(item);
    },
  };

  /* ── EMPTY VALUE CHECKERS ──────────────────────────────── */

  function isEmpty(type, value) {
    if (value === null || value === undefined) return true;
    if (type === 'multi' || type === 'multi_any' || type === 'multi_all') {
      return !Array.isArray(value) || value.length === 0;
    }
    if (type === 'range') {
      return value.min === undefined && value.max === undefined;
    }
    if (type === 'range_min' || type === 'range_max') {
      return value === null || value === undefined;
    }
    if (type === 'boolean') {
      return value === null || value === undefined;
    }
    return false;
  }

  /* ── DEFAULT VALUE BY TYPE ─────────────────────────────── */

  function defaultValue(type) {
    if (type === 'multi' || type === 'multi_any' || type === 'multi_all') return [];
    if (type === 'range') return {};
    if (type === 'boolean') return null;
    if (type === 'range_min' || type === 'range_max') return null;
    return null;
  }

  /* ── FACTORY ───────────────────────────────────────────── */

  function create() {

    /* Instance state */
    const _dimensions = new Map();  // key → { type, field, value, transform, label }
    let   _onChange   = null;       // External change callback

    /* ── Helper: evaluate one dimension against one item ── */
    function _test(item, key) {
      const dim = _dimensions.get(key);
      if (!dim || isEmpty(dim.type, dim.value)) return true; // No constraint

      const pred = PREDICATES[dim.type];
      if (!pred) {
        console.warn(`[FilterEngine] Unknown type: ${dim.type}`);
        return true;
      }

      return pred(item, dim.field, dim.value, dim.transform);
    }

    return {

      /* ────────────────────────────────────────────────────
         CONFIGURATION
         ──────────────────────────────────────────────────── */

      /**
       * Define a filter dimension.
       *
       * @param {string} key       - Unique dimension name (e.g. 'series')
       * @param {Object} opts
       * @param {string} opts.type - Filter type (see PREDICATES keys)
       * @param {string} opts.field - Item property to filter on
       * @param {string} [opts.label] - Human-readable label for UI
       * @param {Function} [opts.transform] - Transform item field value before comparison
       * @param {*} [opts.defaultValue] - Override default empty value
       */
      define(key, opts) {
        _dimensions.set(key, {
          type:      opts.type  || 'multi',
          field:     opts.field || key,
          label:     opts.label || key,
          transform: opts.transform || null,
          value:     opts.defaultValue !== undefined
                       ? opts.defaultValue
                       : defaultValue(opts.type || 'multi'),
        });
        return this; // Chainable
      },

      /**
       * Set the value for a dimension.
       * Triggers onChange if bound.
       *
       * @param {string} key
       * @param {*}      value  - Type depends on dimension type:
       *   multi/*:    string[] e.g. ['Redmi','POCO']
       *   boolean:    true|false|null
       *   range:      { min?, max? }
       *   range_min:  number|null
       *   fn:         (item) => boolean
       */
      set(key, value) {
        const dim = _dimensions.get(key);
        if (!dim) {
          console.warn(`[FilterEngine] Dimension "${key}" not defined. Call define() first.`);
          return this;
        }
        dim.value = value;
        if (_onChange) _onChange(this.getActive(), key, value);
        return this;
      },

      /**
       * Toggle a value in a multi-select dimension.
       * Adds if not present, removes if present.
       *
       * @param {string} key
       * @param {*}      value  - Single value to toggle
       * @returns {boolean} Whether value is now active
       */
      toggle(key, value) {
        const dim = _dimensions.get(key);
        if (!dim) return false;

        if (!['multi','multi_any','multi_all'].includes(dim.type)) {
          console.warn(`[FilterEngine] toggle() only works on multi types`);
          return false;
        }

        const arr   = Array.isArray(dim.value) ? [...dim.value] : [];
        const idx   = arr.indexOf(value);
        const isNow = idx === -1;

        if (isNow) arr.push(value);
        else arr.splice(idx, 1);

        dim.value = arr;
        if (_onChange) _onChange(this.getActive(), key, value);
        return isNow;
      },

      /**
       * Check if a value is active in a dimension.
       *
       * @param {string} key
       * @param {*}      value  - Value to check
       * @returns {boolean}
       */
      isActive(key, value) {
        const dim = _dimensions.get(key);
        if (!dim) return false;
        if (['multi','multi_any','multi_all'].includes(dim.type)) {
          return Array.isArray(dim.value) && dim.value.includes(value);
        }
        return dim.value === value;
      },

      /**
       * Clear one dimension (reset to empty).
       */
      clear(key) {
        const dim = _dimensions.get(key);
        if (dim) {
          dim.value = defaultValue(dim.type);
          if (_onChange) _onChange(this.getActive(), key, null);
        }
        return this;
      },

      /**
       * Clear ALL dimensions.
       */
      clearAll() {
        for (const [key, dim] of _dimensions) {
          dim.value = defaultValue(dim.type);
        }
        if (_onChange) _onChange([], null, null);
        return this;
      },

      /* ────────────────────────────────────────────────────
         APPLY
         ──────────────────────────────────────────────────── */

      /**
       * Apply all active filters to a dataset.
       * Short-circuits per-item as soon as one dimension fails.
       *
       * @param {Array}    items
       * @param {string[]} [only]  - Optional: limit to these dimension keys only
       * @returns {Array}
       */
      apply(items, only = null) {
        const keys = only
          ? [..._dimensions.keys()].filter(k => only.includes(k))
          : [..._dimensions.keys()];

        // Fast path: no active filters
        const hasActive = keys.some(k => {
          const dim = _dimensions.get(k);
          return !isEmpty(dim.type, dim.value);
        });
        if (!hasActive) return items;

        return items.filter(item =>
          keys.every(key => _test(item, key))
        );
      },

      /**
       * Apply filters and get timing info.
       * @param {Array} items
       * @returns {{ results: Array, ms: string, total: number }}
       */
      applyTimed(items) {
        const t0 = performance.now();
        const results = this.apply(items);
        return {
          results,
          ms:    (performance.now() - t0).toFixed(2),
          total: items.length,
        };
      },

      /* ────────────────────────────────────────────────────
         INTROSPECTION
         ──────────────────────────────────────────────────── */

      /**
       * Get array of active filter descriptors for UI tags.
       * @returns {Array<{ key, label, value, displayValue }>}
       */
      getActive() {
        const active = [];
        for (const [key, dim] of _dimensions) {
          if (isEmpty(dim.type, dim.value)) continue;

          let displayValue;
          if (['multi','multi_any','multi_all'].includes(dim.type)) {
            dim.value.forEach(v => {
              active.push({ key, field: dim.field, label: dim.label, value: v, displayValue: String(v) });
            });
            continue;
          } else if (dim.type === 'range') {
            const parts = [];
            if (dim.value.min !== undefined) parts.push(`≥ ${dim.value.min}`);
            if (dim.value.max !== undefined) parts.push(`≤ ${dim.value.max}`);
            displayValue = parts.join(' ');
          } else if (dim.type === 'range_min') {
            displayValue = `≥ ${dim.value}`;
          } else if (dim.type === 'range_max') {
            displayValue = `≤ ${dim.value}`;
          } else if (dim.type === 'boolean') {
            displayValue = dim.value ? dim.label : `No ${dim.label}`;
          } else if (dim.type === 'fn') {
            displayValue = dim.label;
          } else {
            displayValue = String(dim.value);
          }

          active.push({ key, field: dim.field, label: dim.label, value: dim.value, displayValue });
        }
        return active;
      },

      /**
       * Check if any filter is active.
       */
      hasActive() {
        return this.getActive().length > 0;
      },

      /**
       * Get raw dimension definition.
       */
      getDimension(key) {
        return _dimensions.get(key) || null;
      },

      /**
       * Get all dimension keys.
       */
      getKeys() {
        return [..._dimensions.keys()];
      },

      /* ────────────────────────────────────────────────────
         COUNT HELPERS
         ──────────────────────────────────────────────────── */

      /**
       * Compute value counts for a dimension, given a dataset.
       * Useful for rendering filter option counts in the sidebar.
       *
       * @param {Array}  items
       * @param {string} key   - Dimension key
       * @returns {Map<value, count>}
       */
      computeCounts(items, key) {
        const dim = _dimensions.get(key);
        if (!dim) return new Map();

        const counts = new Map();
        const field  = dim.field;

        items.forEach(item => {
          const raw = item[field];
          // Handle both scalar and array fields
          const vals = Array.isArray(raw) ? raw : [raw];
          vals.forEach(v => {
            if (v != null) counts.set(v, (counts.get(v) || 0) + 1);
          });
        });

        return counts;
      },

      /**
       * Compute counts for ALL dimensions at once.
       * More efficient than calling computeCounts() per dimension.
       *
       * @param {Array} items
       * @returns {Object<key, Map<value, count>>}
       */
      computeAllCounts(items) {
        const all = {};
        for (const key of _dimensions.keys()) {
          all[key] = this.computeCounts(items, key);
        }
        return all;
      },

      /* ────────────────────────────────────────────────────
         DOM BINDING
         ──────────────────────────────────────────────────── */

      /**
       * Bind a filter option element (checkbox, chip button, etc.)
       * to toggle a multi-select dimension value.
       *
       * Adds/removes 'active' class and aria-checked attribute.
       * Call the provided onChange to re-apply filters in parent.
       *
       * @param {HTMLElement} el
       * @param {string}      key     - Dimension key
       * @param {*}           value   - Value to toggle
       * @param {Function}    onChange - () => void — called after toggle
       */
      bindOption(el, key, value, onChange) {
        const update = () => {
          const active = this.isActive(key, value);
          el.classList.toggle('active', active);
          el.setAttribute('aria-checked', active);
        };

        update(); // Set initial state

        el.addEventListener('click', () => {
          this.toggle(key, value);
          update();
          onChange?.();
        });

        return { update }; // Return handle for external state sync
      },

      /**
       * Bind a range input element to a range_min/range/range_max dimension.
       *
       * @param {HTMLInputElement} el
       * @param {string}           key
       * @param {'min'|'max'|'value'} side  - Which side of range to update
       * @param {Function}         onChange
       */
      bindRange(el, key, side = 'value', onChange) {
        el.addEventListener('input', () => {
          const numVal = parseFloat(el.value);
          const dim = _dimensions.get(key);
          if (!dim) return;

          if (dim.type === 'range_min' || dim.type === 'range_max') {
            this.set(key, numVal);
          } else if (dim.type === 'range') {
            const current = dim.value || {};
            this.set(key, { ...current, [side]: numVal });
          }

          onChange?.();
        });
      },

      /* ────────────────────────────────────────────────────
         CHANGE OBSERVER
         ──────────────────────────────────────────────────── */

      /**
       * Register a callback fired whenever any dimension changes.
       * @param {Function} fn  - (activeFilters, changedKey, changedValue) => void
       */
      onChange(fn) {
        _onChange = fn;
        return this;
      },

      /* ────────────────────────────────────────────────────
         SERIALIZATION
         ──────────────────────────────────────────────────── */

      /**
       * Serialize active filters to URL search params string.
       * Enables shareable filter URLs.
       *
       * @returns {string}  e.g. "series=Redmi&series=POCO&android=12"
       */
      toURLParams() {
        const params = new URLSearchParams();
        for (const { key, value } of this.getActive()) {
          params.append(key, value);
        }
        return params.toString();
      },

      /**
       * Restore filters from URL search params.
       *
       * @param {string|URLSearchParams} params
       */
      fromURLParams(params) {
        const sp = typeof params === 'string' ? new URLSearchParams(params) : params;

        for (const key of _dimensions.keys()) {
          const dim = _dimensions.get(key);
          const vals = sp.getAll(key);
          if (!vals.length) continue;

          if (['multi','multi_any','multi_all'].includes(dim.type)) {
            this.set(key, vals);
          } else if (dim.type === 'range_min') {
            this.set(key, parseFloat(vals[0]));
          } else if (dim.type === 'boolean') {
            this.set(key, vals[0] === 'true');
          }
        }

        return this;
      },

    };
  }

  return { create, PREDICATES };

})();

if (typeof module !== 'undefined') module.exports = FilterEngine;
