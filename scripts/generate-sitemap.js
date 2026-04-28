#!/usr/bin/env node
/**
 * generate-sitemap.js — Xiaomi Basecamp Build Script v1.0
 * Generates sitemap.xml and robots.txt
 * Run: node scripts/generate-sitemap.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

function readJSON(fp) { try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; } }
function log(msg)  { console.log(`  ✅ ${msg}`); }

// Read site config
const config   = readJSON(path.join(DATA, 'config.json')) || {};
const SITE_URL = config?.site?.url || 'https://xiaomi-basecamp.github.io';
const TODAY    = new Date().toISOString().split('T')[0];

console.log('\n╔══════════════════════════════════════╗');
console.log('║  Xiaomi Basecamp — generate-sitemap  ║');
console.log('╚══════════════════════════════════════╝\n');
console.log(`  Site URL: ${SITE_URL}\n`);

const urls = [];

/* ── Helper ── */
function addUrl(loc, priority = '0.7', changefreq = 'weekly') {
  urls.push({ loc: `${SITE_URL}${loc}`, priority, changefreq, lastmod: TODAY });
}

/* ── 1. STATIC PAGES ──────────────────────────────────────── */
addUrl('/',               '1.0', 'weekly');
addUrl('/devices.html',   '0.9', 'weekly');
addUrl('/roms.html',      '0.9', 'weekly');
addUrl('/tools.html',     '0.8', 'weekly');
addUrl('/tutorials.html', '0.8', 'weekly');
addUrl('/search.html',    '0.5', 'monthly');
addUrl('/compare.html',   '0.5', 'monthly');
log(`Static pages: ${urls.length}`);

/* ── 2. DYNAMIC DEVICE PAGES ──────────────────────────────── */
const devicesFile = path.join(DATA, 'xiaomi_devices_fixed.json');
let deviceSlugCount = 0;
if (fs.existsSync(devicesFile)) {
  const raw = readJSON(devicesFile);
  const items = Array.isArray(raw) ? raw : (raw?.devices || []);
  items.forEach(d => {
    // Generate slug (same logic as DataTransformer.generateSlug)
    const name = d.name || '';
    const slug = name.toLowerCase().trim()
      .replace(/\+/g, '-plus').replace(/&/g, '-and-')
      .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')
      .replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
    if (slug) {
      addUrl(`/device-detail.html?id=${slug}`, '0.7', 'monthly');
      deviceSlugCount++;
    }
  });
  log(`Device pages: ${deviceSlugCount}`);
}

/* ── 3. DYNAMIC ROM PAGES ─────────────────────────────────── */
const romsFile = path.join(DATA, 'roms', '_index.json');
let romSlugCount = 0;
if (fs.existsSync(romsFile)) {
  const raw = readJSON(romsFile);
  const items = raw?.items || [];
  items.forEach(r => {
    if (r.id || r.slug) {
      addUrl(`/rom-detail.html?id=${r.id || r.slug}`, '0.7', 'monthly');
      romSlugCount++;
    }
  });
  log(`ROM pages: ${romSlugCount}`);
}

/* ── 4. DYNAMIC TUTORIAL PAGES ────────────────────────────── */
const tutsFile = path.join(DATA, 'tutorials', '_index.json');
let tutSlugCount = 0;
if (fs.existsSync(tutsFile)) {
  const raw = readJSON(tutsFile);
  const items = raw?.items || [];
  items.forEach(t => {
    if (t.id) {
      addUrl(`/tutorial-detail.html?id=${t.id}`, '0.6', 'monthly');
      tutSlugCount++;
    }
  });
  log(`Tutorial pages: ${tutSlugCount}`);
}

/* ── 5. BUILD XML ─────────────────────────────────────────── */
const xmlLines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`),
  '</urlset>',
];
const xml = xmlLines.join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
log(`sitemap.xml → ${urls.length} URLs`);

/* ── 6. ROBOTS.TXT ────────────────────────────────────────── */
const robots = `User-agent: *
Allow: /
Disallow: /assets/js/vendor/
Disallow: /scripts/

Sitemap: ${SITE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf8');
log('robots.txt generated');

console.log(`\n  Total URLs in sitemap: ${urls.length}`);
console.log('  ✅ Done!\n');
