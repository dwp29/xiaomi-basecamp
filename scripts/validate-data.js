#!/usr/bin/env node
/**
 * validate-data.js — Xiaomi Basecamp Build Script v1.0
 * Validates all JSON files against expected schemas
 * Run: node scripts/validate-data.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data');

let errors = 0; let checked = 0;

function ok(msg)   { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.error(`  ❌ ${msg}`); errors++; }
function info(msg) { console.log(`  ℹ️  ${msg}`); }

function readJSON(fp) {
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch(e) { fail(`JSON parse error in ${path.basename(fp)}: ${e.message}`); return null; }
}

function check(condition, msg) { if (!condition) { fail(msg); return false; } return true; }

console.log('\n╔══════════════════════════════════════╗');
console.log('║  Xiaomi Basecamp — validate-data     ║');
console.log('╚══════════════════════════════════════╝\n');

/* ── ROMs ─────────────────────────────────────────────────── */
info('Validating ROMs...');
const romsData = readJSON(path.join(DATA, 'roms', '_index.json'));
if (romsData) {
  checked++;
  const items = romsData.items || [];
  const seenIds = new Set();
  items.forEach((r, i) => {
    const ctx = `ROM[${i}] "${r.name || r.id}"`;
    check(r.id,              `${ctx}: missing id`);
    check(r.name,            `${ctx}: missing name`);
    check(r.android_version, `${ctx}: missing android_version`);
    check(r.type,            `${ctx}: missing type`);
    check(['AOSP','MIUI-based','HyperOS-based'].includes(r.type), `${ctx}: invalid type "${r.type}"`);
    check(['active','inactive','abandoned'].includes(r.status), `${ctx}: invalid status "${r.status}"`);
    check(Array.isArray(r.features) && r.features.length >= 3, `${ctx}: need ≥3 features`);
    check(r.download?.github_releases || r.download?.sourceforge, `${ctx}: missing download link`);
    if (r.id && seenIds.has(r.id)) fail(`${ctx}: duplicate id "${r.id}"`);
    if (r.id) seenIds.add(r.id);
  });
  ok(`ROMs: ${items.length} validated`);
}

/* ── TOOLS ────────────────────────────────────────────────── */
info('Validating Tools...');
const toolsData = readJSON(path.join(DATA, 'tools', '_index.json'));
if (toolsData) {
  checked++;
  const items = toolsData.items || [];
  const validCats = ['root','recovery','kernel','audio','camera','module','utility','flashing'];
  const seenIds = new Set();
  items.forEach((t, i) => {
    const ctx = `Tool[${i}] "${t.name || t.id}"`;
    check(t.id,              `${ctx}: missing id`);
    check(t.name,            `${ctx}: missing name`);
    check(validCats.includes(t.category), `${ctx}: invalid category "${t.category}"`);
    check(t.developer,       `${ctx}: missing developer`);
    check(t.description,     `${ctx}: missing description`);
    check(t.download?.github || t.download?.latest_apk, `${ctx}: missing download link`);
    if (t.id && seenIds.has(t.id)) fail(`${ctx}: duplicate id`);
    if (t.id) seenIds.add(t.id);
  });
  ok(`Tools: ${items.length} validated`);
}

/* ── TUTORIALS ────────────────────────────────────────────── */
info('Validating Tutorials...');
const tutsData = readJSON(path.join(DATA, 'tutorials', '_index.json'));
if (tutsData) {
  checked++;
  const items = tutsData.items || [];
  const validDiff = ['Pemula','Menengah','Mahir'];
  const seenIds = new Set();
  items.forEach((t, i) => {
    const ctx = `Tutorial[${i}] "${t.title?.slice(0,30) || t.id}"`;
    check(t.id,              `${ctx}: missing id`);
    check(t.title,           `${ctx}: missing title`);
    check(t.category,        `${ctx}: missing category`);
    check(validDiff.includes(t.difficulty), `${ctx}: invalid difficulty "${t.difficulty}"`);
    check(Array.isArray(t.steps) && t.steps.length >= 2, `${ctx}: need ≥2 steps`);
    check(t.requirements?.length >= 1, `${ctx}: need ≥1 requirement`);
    if (t.id && seenIds.has(t.id)) fail(`${ctx}: duplicate id`);
    if (t.id) seenIds.add(t.id);
  });
  ok(`Tutorials: ${items.length} validated (${items.reduce((s,t)=>s+(t.steps||[]).length,0)} total steps)`);
}

/* ── CONFIG ───────────────────────────────────────────────── */
info('Validating config.json...');
const cfg = readJSON(path.join(DATA, 'config.json'));
if (cfg) {
  checked++;
  check(cfg.site?.name,  'config: missing site.name');
  check(cfg.site?.url,   'config: missing site.url');
  check(cfg.stats,       'config: missing stats');
  ok('config.json validated');
}

/* ── REPORT ───────────────────────────────────────────────── */
console.log('\n─────────────────────────────────────');
console.log(`  Files checked: ${checked}`);
console.log(`  Errors found:  ${errors}`);
console.log('─────────────────────────────────────');
if (errors === 0) { console.log('  🎉 All data is VALID!\n'); process.exit(0); }
else { console.error(`  ❌ ${errors} error(s) found. Fix before deploy.\n`); process.exit(1); }
