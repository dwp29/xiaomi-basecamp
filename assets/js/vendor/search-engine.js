/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  search-engine.js  — MIUI Nexus Core Engine v1.0            ║
 * ║  Tokenized search over pre-built search_blob field.         ║
 * ║  Zero dependencies. Runs in <1ms for 200+ entries.          ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *  CONTRACT:
 *    Every item in the dataset MUST have a `search_blob` string:
 *    A pre-joined lowercase string of all searchable fields.
 *    Built once at data-load time, never rebuilt on each search.
 *
 *    Example item shape:
 *    {
 *      id: "redmi-note-13-pro",
 *      name: "Redmi Note 13 Pro",
 *      codename: "sepang",
 *      search_blob: "redmi note 13 pro sepang snapdragon 7s gen 2 qualcomm hyperos 5g nfc"
 *    }
 *
 *  USAGE:
 *    const SE = SearchEngine.create({ onResults, onEmpty, highlightClass });
 *    SE.load(devices);                    // one-time index build
 *    SE.bindInput(document.getElementById('search'));
 *    SE.query('poco x6');                 // manual trigger
 *    SE.reset();                          // clear + show all
 *    const results = SE.getResults();     // current result set
 */

'use strict';

const SearchEngine = (() => {

  /* ── CONSTANTS ─────────────────────────────────────────── */
  const DEBOUNCE_MS      = 200;   // Input debounce window
  const MIN_QUERY_LEN    = 1;     // Minimum chars before search fires
  const MAX_TOKENS       = 8;     // Max query tokens to process
  const HIGHLIGHT_CLASS  = 'se-match';

  /* ── INTERNAL TOKENIZER ────────────────────────────────── */

  /**
   * Normalize and split a query string into tokens.
   * Strips punctuation, lowercases, deduplicates, limits count.
   *
   * "Redmi Note 13 Pro+" → ["redmi", "note", "13", "pro"]
   */
  function tokenize(str) {
    return [...new Set(
      str.toLowerCase()
         .replace(/[^\w\s]/g, ' ')   // strip punctuation
         .split(/\s+/)
         .filter(t => t.length >= 1)
         .slice(0, MAX_TOKENS)
    )];
  }

  /**
   * Build a search_blob for a device object if it doesn't have one.
   * In production, blob is pre-generated in the JSON.
   */
  function buildBlob(item) {
    if (item.search_blob) return item.search_blob;

    return [
      item.name        || '',
      item.codename    || '',
      item.brand       || '',
      item.series      || '',
      item.chipset_short || item.chipset?.name || '',
      item.chipset_brand || item.chipset?.brand || '',
      ...(item.os    || []),
      ...(item.tags  || []),
      item.android   != null ? 'android ' + item.android : '',
      item.fiveg  ? '5g'  : '',
      item.nfc    ? 'nfc' : '',
      item.status || '',
    ].join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* ── HIGHLIGHT HELPER ──────────────────────────────────── */

  /**
   * Wrap matching substrings in a <mark> element.
   * Safe: escapes HTML before inserting.
   *
   * @param {string} text    - Raw text to highlight
   * @param {string[]} tokens - Query tokens to match
   * @param {string} cls     - CSS class applied to <mark>
   * @returns {string} HTML string
   */
  function highlightText(text, tokens, cls = HIGHLIGHT_CLASS) {
    if (!tokens.length) return escapeHtml(text);

    const escaped = escapeHtml(text);
    const pattern = tokens
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))  // escape regex special chars
      .join('|');

    try {
      const re = new RegExp(`(${pattern})`, 'gi');
      return escaped.replace(re, `<mark class="${cls}">$1</mark>`);
    } catch {
      return escaped;  // If regex fails, return plain text
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── DEBOUNCE UTILITY ──────────────────────────────────── */
  function debounce(fn, ms) {
    let timer;
    const debounced = function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
    debounced.flush = function (...args) {
      clearTimeout(timer);
      fn.apply(this, args);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }

  /* ── FACTORY ───────────────────────────────────────────── */

  /**
   * Create a SearchEngine instance.
   *
   * @param {Object} opts
   * @param {Function} opts.onResults   - Called with (results, tokens, query) on match
   * @param {Function} opts.onEmpty     - Called with (query) when no results
   * @param {Function} opts.onReset     - Called with (allItems) when query cleared
   * @param {number}   opts.debounceMs  - Override debounce (default 200)
   * @param {string}   opts.highlightClass - CSS class for <mark> tags
   * @param {boolean}  opts.andMode     - true = ALL tokens must match (default); false = ANY
   */
  function create(opts = {}) {

    /* ── Instance state ── */
    let _data       = [];    // Original dataset (never mutated)
    let _results    = [];    // Current result set
    let _tokens     = [];    // Current parsed tokens
    let _query      = '';    // Current raw query string
    let _inputEl    = null;  // Bound <input> element
    let _inputListener = null;

    const _debounceMs     = opts.debounceMs     ?? DEBOUNCE_MS;
    const _highlightClass = opts.highlightClass ?? HIGHLIGHT_CLASS;
    const _andMode        = opts.andMode        ?? true;

    const _onResults = opts.onResults || (() => {});
    const _onEmpty   = opts.onEmpty   || (() => {});
    const _onReset   = opts.onReset   || (() => {});

    /* ── Core search function ── */
    function _search(rawQuery) {
      _query  = rawQuery.trim();
      _tokens = tokenize(_query);

      // Empty query → reset
      if (_query.length < MIN_QUERY_LEN) {
        _results = _data;
        _onReset(_data);
        return;
      }

      const t0 = performance.now();

      // Single-pass filter over pre-built blobs
      _results = _data.filter(item => {
        const blob = item._blob; // pre-built at load time
        if (_andMode) {
          // ALL tokens must appear in blob
          return _tokens.every(tok => blob.includes(tok));
        } else {
          // ANY token must appear
          return _tokens.some(tok => blob.includes(tok));
        }
      });

      const ms = (performance.now() - t0).toFixed(2);

      if (_results.length > 0) {
        _onResults(_results, _tokens, _query, ms);
      } else {
        _onEmpty(_query, ms);
      }
    }

    const _debouncedSearch = debounce(_search, _debounceMs);

    /* ── Public API ── */
    return {

      /**
       * Load dataset and build internal blobs.
       * Call once after data fetch.
       *
       * @param {Array} items
       */
      load(items) {
        _data = items.map(item => ({
          ...item,
          _blob: buildBlob(item)  // Attach blob once; never recalculated
        }));
        _results = _data;
        return this;
      },

      /**
       * Bind a text <input> element.
       * Handles input event with debounce + clear button logic.
       *
       * @param {HTMLInputElement} inputEl
       * @param {HTMLElement}      clearBtn  - Optional clear button element
       */
      bindInput(inputEl, clearBtn = null) {
        if (_inputEl) {
          _inputEl.removeEventListener('input', _inputListener);
        }

        _inputEl = inputEl;

        _inputListener = (e) => {
          const val = e.target.value;

          // Show/hide clear button
          if (clearBtn) {
            clearBtn.style.opacity = val.length ? '1' : '0';
            clearBtn.style.pointerEvents = val.length ? 'all' : 'none';
          }

          _debouncedSearch(val);
        };

        _inputEl.addEventListener('input', _inputListener);

        // Clear button handler
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            _inputEl.value = '';
            clearBtn.style.opacity = '0';
            clearBtn.style.pointerEvents = 'none';
            _inputEl.focus();
            _debouncedSearch.flush('');
          });
        }

        return this;
      },

      /**
       * Manually trigger a search query.
       * Fires immediately (no debounce).
       *
       * @param {string} query
       */
      query(q) {
        _debouncedSearch.flush(q);
        return this;
      },

      /**
       * Reset to full dataset immediately.
       */
      reset() {
        _query   = '';
        _tokens  = [];
        _results = _data;
        if (_inputEl) _inputEl.value = '';
        _onReset(_data);
        return this;
      },

      /**
       * Highlight matching tokens in a text string.
       * Call from card renderer: SE.highlight(device.name)
       *
       * @param {string} text
       * @returns {string} HTML with <mark> tags
       */
      highlight(text) {
        return highlightText(text, _tokens, _highlightClass);
      },

      /** Current active result array */
      getResults()  { return _results; },

      /** Current parsed query tokens */
      getTokens()   { return _tokens; },

      /** Current raw query string */
      getQuery()    { return _query; },

      /** Whether a query is active */
      isActive()    { return _query.length >= MIN_QUERY_LEN; },

      /** Total items in dataset */
      getTotalCount() { return _data.length; },

      /**
       * Build a search_blob for a single item (utility for data prep).
       * Use when generating index.json entries.
       */
      buildBlob,

      /** Flush debounce immediately (useful on form submit) */
      flush() {
        if (_inputEl) _debouncedSearch.flush(_inputEl.value);
        return this;
      },

      /** Cleanup — remove event listeners */
      destroy() {
        if (_inputEl && _inputListener) {
          _inputEl.removeEventListener('input', _inputListener);
        }
        _debouncedSearch.cancel();
        _data = []; _results = []; _tokens = [];
      },
    };
  }

  /* ── Static helpers exposed on namespace ── */
  return { create, buildBlob, highlightText, tokenize, escapeHtml };

})();

// Export for module systems (optional — works as plain script too)
if (typeof module !== 'undefined') module.exports = SearchEngine;
