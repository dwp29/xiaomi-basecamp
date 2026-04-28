#!/usr/bin/env node
/**
 * build-check.js — Xiaomi Basecamp Step 13 v1.0
 * Pre-deploy checklist: HTML meta, internal links, JSON validity, image refs
 * Run: node scripts/build-check.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let errors = 0, warnings = 0, passed = 0;

const ok   = m => { console.log(`  ✅ ${m}`); passed++; };
const fail = m => { console.error(`  ❌ ${m}`); errors++; };
const warn = m => { console.warn(`  ⚠️  ${m}`); warnings++; };

function readFile(fp) { try { return fs.readFileSync(fp, 'utf8'); } catch { return ''; } }
function readJSON(fp) { try { return JSON.parse(readFile(fp)); } catch { return null; } }

console.log('\n╔══════════════════════════════════════╗');
console.log('║   Xiaomi Basecamp — build-check      ║');
console.log('╚══════════════════════════════════════╝\n');

/* ── 1. HTML FILES CHECK ─────────────────────────────────── */
console.log('§ HTML Files');
const HTML_PAGES = [
  'index.html','devices.html','device-detail.html',
  'roms.html','rom-detail.html','tools.html',
  'tutorials.html','tutorial-detail.html',
  'search.html','compare.html','404.html',
];

const REQUIRED_CSS = [
  '/assets/css/variables.css', '/assets/css/reset.css',
  '/assets/css/typography.css', '/assets/css/animations.css',
  '/assets/css/components.css',
];
const REQUIRED_CORE_JS = [
  '/assets/js/core/dataTransformer.js', '/assets/js/core/dataLoader.js',
  '/assets/js/core/state.js', '/assets/js/core/router.js',
  '/assets/js/components/navbar.js',
];

HTML_PAGES.forEach(page => {
  const fp = path.join(ROOT, page);
  if (!fs.existsSync(fp)) { fail(`${page} — FILE MISSING`); return; }
  const html = readFile(fp);

  // Check title
  if (!html.includes('<title>')) fail(`${page} — missing <title>`);
  else if (html.includes('[PAGE TITLE]')) warn(`${page} — placeholder title not replaced`);

  // Check meta description
  if (!html.includes('name="description"')) warn(`${page} — missing meta description`);

  // Check canonical
  if (!html.includes('rel="canonical"') && page !== 'template.html') warn(`${page} — missing canonical`);

  // Check lang attribute
  if (!html.includes('lang="id"')) warn(`${page} — missing lang="id" on <html>`);

  // Check CSS includes
  REQUIRED_CSS.forEach(css => {
    if (!html.includes(css)) warn(`${page} — missing CSS: ${css}`);
  });

  // Check core JS (except 404 which is minimal)
  if (page !== '404.html') {
    REQUIRED_CORE_JS.forEach(js => {
      if (!html.includes(js)) warn(`${page} — missing JS: ${path.basename(js)}`);
    });
  }

  // Check skip link
  if (!html.includes('skip-link') && page !== '404.html') warn(`${page} — missing skip link`);

  // Check nav-root
  if (!html.includes('id="nav-root"') && page !== '404.html') warn(`${page} — missing nav-root div`);

  ok(`${page} — basic checks passed`);
});

/* ── 2. CSS FILES CHECK ──────────────────────────────────── */
console.log('\n§ CSS Files');
const CSS_FILES = ['variables.css','reset.css','typography.css','animations.css','components.css'];
CSS_FILES.forEach(f => {
  const fp = path.join(ROOT, 'assets', 'css', f);
  if (!fs.existsSync(fp)) { fail(`assets/css/${f} — MISSING`); return; }
  const size = fs.statSync(fp).size;
  if (size < 1000) warn(`assets/css/${f} — suspiciously small (${size} bytes)`);
  ok(`assets/css/${f} — ${Math.round(size/1024)}KB`);
});

/* ── 3. VENDOR JS CHECK ──────────────────────────────────── */
console.log('\n§ Vendor JS');
const VENDOR_JS = ['filter-engine.js','search-engine.js','modal.js','paginator.js'];
VENDOR_JS.forEach(f => {
  const fp = path.join(ROOT, 'assets', 'js', 'vendor', f);
  if (!fs.existsSync(fp)) { fail(`vendor/${f} — MISSING`); return; }
  ok(`vendor/${f} — ${Math.round(fs.statSync(fp).size/1024)}KB`);
});

/* ── 4. CORE + COMPONENT + PAGE JS ──────────────────────── */
console.log('\n§ Core & Page JS');
const JS_FILES = [
  'core/dataTransformer.js','core/dataLoader.js','core/state.js','core/router.js',
  'components/navbar.js','components/deviceCard.js','components/romCard.js',
  'components/toolCard.js','components/tutorialCard.js',
  'pages/home.js','pages/devices.js','pages/deviceDetail.js',
  'pages/roms.js','pages/romDetail.js','pages/tools.js',
  'pages/tutorials.js','pages/tutorialDetail.js',
  'pages/search.js','pages/compare.js',
];
JS_FILES.forEach(f => {
  const fp = path.join(ROOT, 'assets', 'js', f);
  if (!fs.existsSync(fp)) { fail(`js/${f} — MISSING`); return; }
  const size = fs.statSync(fp).size;
  ok(`js/${f} — ${Math.round(size/1024)}KB`);
});

/* ── 5. DATA JSON CHECK ──────────────────────────────────── */
console.log('\n§ Data JSON');
const DATA_FILES = [
  'data/xiaomi_devices_fixed.json',
  'data/roms/_index.json',
  'data/tools/_index.json',
  'data/tutorials/_index.json',
  'data/config.json',
];
DATA_FILES.forEach(f => {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) { fail(`${f} — MISSING`); return; }
  const parsed = readJSON(fp);
  if (!parsed) { fail(`${f} — INVALID JSON`); return; }
  // Check item counts
  if (f.includes('roms') && (!parsed.items || parsed.items.length < 5)) warn(`${f} — fewer than 5 ROMs`);
  if (f.includes('tools') && (!parsed.items || parsed.items.length < 5)) warn(`${f} — fewer than 5 tools`);
  if (f.includes('tutorials') && (!parsed.items || parsed.items.length < 5)) warn(`${f} — fewer than 5 tutorials`);
  ok(`${f} — valid JSON`);
});

/* ── 6. DEPLOYMENT FILES ─────────────────────────────────── */
console.log('\n§ Deployment Files');
const DEPLOY_FILES = [
  '.github/workflows/deploy.yml', 'vercel.json', 'robots.txt',
  'sitemap.xml', '_redirects', '.gitignore', 'README.md',
];
DEPLOY_FILES.forEach(f => {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) { fail(`${f} — MISSING`); return; }
  ok(`${f} — exists`);
});

/* ── 7. INTERNAL LINK CHECK ──────────────────────────────── */
console.log('\n§ Internal Links');
const VALID_PAGES = new Set([
  '/', '/index.html', '/devices.html', '/device-detail.html',
  '/roms.html', '/rom-detail.html', '/tools.html',
  '/tutorials.html', '/tutorial-detail.html',
  '/search.html', '/compare.html', '/404.html',
]);
let brokenLinks = 0;
HTML_PAGES.forEach(page => {
  const html = readFile(path.join(ROOT, page));
  const hrefs = [...html.matchAll(/href="(\/[^"?#]+\.html)"/g)].map(m => m[1]);
  hrefs.forEach(href => {
    if (!VALID_PAGES.has(href)) {
      const fp = path.join(ROOT, href.slice(1));
      if (!fs.existsSync(fp)) { warn(`${page} → broken link: ${href}`); brokenLinks++; }
    }
  });
});
if (brokenLinks === 0) ok('All internal HTML links valid');

/* ── 8. SCRIPTS CHECK ────────────────────────────────────── */
console.log('\n§ Build Scripts');
['generate-index.js','generate-sitemap.js','validate-data.js','build-check.js'].forEach(s => {
  const fp = path.join(ROOT, 'scripts', s);
  if (!fs.existsSync(fp)) { fail(`scripts/${s} — MISSING`); return; }
  ok(`scripts/${s} — exists`);
});

/* ── FINAL REPORT ────────────────────────────────────────── */
console.log('\n══════════════════════════════════════════');
console.log('  BUILD CHECK REPORT');
console.log('══════════════════════════════════════════');
console.log(`  ✅ Passed:   ${passed}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log(`  ❌ Errors:   ${errors}`);
console.log('──────────────────────────────────────────');

if (errors === 0 && warnings === 0) {
  console.log('  🎉 PERFECT! Ready to deploy.\n');
  process.exit(0);
} else if (errors === 0) {
  console.log('  ✅ No errors. Fix warnings for best results.\n');
  process.exit(0);
} else {
  console.log('  ❌ Fix errors before deploying!\n');
  process.exit(1);
}
