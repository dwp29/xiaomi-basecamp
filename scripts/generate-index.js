#!/usr/bin/env node
/**
 * generate-index.js — Xiaomi Basecamp Build Script v1.0
 * Scans data/ JSON files and updates config.json stats + master-index.json
 * Run: node scripts/generate-index.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

function log(msg)  { console.log(`  ✅ ${msg}`); }
function warn(msg) { console.warn(`  ⚠️  ${msg}`); }
function readJSON(fp) { try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; } }
function writeJSON(fp, data) { fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8'); }

console.log('\n╔══════════════════════════════════════╗');
console.log('║  Xiaomi Basecamp — generate-index    ║');
console.log('╚══════════════════════════════════════╝\n');

/* ── 1. COUNT DEVICES ─────────────────────────────────────── */
let deviceCount = 0;
const devicesFile = path.join(DATA, 'xiaomi_devices_fixed.json');
if (fs.existsSync(devicesFile)) {
  const raw = readJSON(devicesFile);
  if (Array.isArray(raw)) deviceCount = raw.length;
  else if (raw && Array.isArray(raw.devices)) deviceCount = raw.devices.length;
  log(`Devices: ${deviceCount} entries`);
} else { warn('xiaomi_devices_fixed.json not found'); }

/* ── 2. COUNT & INDEX ROMs ────────────────────────────────── */
let romCount = 0;
const romsIndex = path.join(DATA, 'roms', '_index.json');
if (fs.existsSync(romsIndex)) {
  const raw = readJSON(romsIndex);
  const items = raw?.items || [];
  romCount = items.length;
  // Build lightweight index
  const light = items.map(r => ({
    id: r.id, name: r.name, type: r.type, android_version: r.android_version,
    status: r.status, maintained: r.maintained, logo: r.logo,
    tags: r.tags, updated_at: r.updated_at,
    supported_count: (r.supported_devices || []).length
  }));
  writeJSON(path.join(DATA, 'roms', '_index_light.json'), { total: romCount, items: light });
  log(`ROMs: ${romCount} entries → _index_light.json`);
} else { warn('roms/_index.json not found'); }

/* ── 3. COUNT & INDEX TOOLS ───────────────────────────────── */
let toolCount = 0;
const toolsIndex = path.join(DATA, 'tools', '_index.json');
if (fs.existsSync(toolsIndex)) {
  const raw = readJSON(toolsIndex);
  const items = raw?.items || [];
  toolCount = items.length;
  const light = items.map(t => ({
    id: t.id, name: t.name, category: t.category,
    developer: t.developer, version_stable: t.version_stable,
    status: t.status, open_source: t.open_source,
    logo: t.logo, tags: t.tags, updated_at: t.updated_at
  }));
  writeJSON(path.join(DATA, 'tools', '_index_light.json'), { total: toolCount, items: light });
  log(`Tools: ${toolCount} entries → _index_light.json`);
} else { warn('tools/_index.json not found'); }

/* ── 4. COUNT & INDEX TUTORIALS ───────────────────────────── */
let tutCount = 0;
const tutsIndex = path.join(DATA, 'tutorials', '_index.json');
if (fs.existsSync(tutsIndex)) {
  const raw = readJSON(tutsIndex);
  const items = raw?.items || [];
  tutCount = items.length;
  const light = items.map(t => ({
    id: t.id, title: t.title, category: t.category,
    difficulty: t.difficulty, estimated_time: t.estimated_time,
    status: t.status, thumbnail: t.thumbnail,
    views: t.views, tags: t.tags,
    step_count: (t.steps || []).length,
    updated_at: t.updated_at
  }));
  writeJSON(path.join(DATA, 'tutorials', '_index_light.json'), { total: tutCount, items: light });
  log(`Tutorials: ${tutCount} entries → _index_light.json`);
} else { warn('tutorials/_index.json not found'); }

/* ── 5. UPDATE config.json ────────────────────────────────── */
const configPath = path.join(DATA, 'config.json');
if (fs.existsSync(configPath)) {
  const config = readJSON(configPath);
  if (config) {
    config.stats.total_devices   = deviceCount;
    config.stats.total_roms      = romCount;
    config.stats.total_tools     = toolCount;
    config.stats.total_tutorials = tutCount;
    config.stats.last_updated    = new Date().toISOString().split('T')[0];
    writeJSON(configPath, config);
    log('config.json stats updated');
  }
}

/* ── 6. GENERATE master-index.json ───────────────────────── */
const masterIndex = {
  generated_at: new Date().toISOString(),
  devices:   deviceCount,
  roms:      romCount,
  tools:     toolCount,
  tutorials: tutCount,
  total:     deviceCount + romCount + toolCount + tutCount,
};
writeJSON(path.join(DATA, 'master-index.json'), masterIndex);
log(`master-index.json generated`);

console.log('\n─────────────────────────────────────');
console.log(`  📊 SUMMARY`);
console.log(`     Devices:   ${deviceCount}`);
console.log(`     ROMs:      ${romCount}`);
console.log(`     Tools:     ${toolCount}`);
console.log(`     Tutorials: ${tutCount}`);
console.log(`     Total:     ${masterIndex.total}`);
console.log('─────────────────────────────────────\n');
console.log('  ✅ Done! Run generate-sitemap.js next.\n');
