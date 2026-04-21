# 🚀 Xiaomi Basecamp — PROJECT BRIEF & CLAUDE AI PROMPTS
> Dokumen ini berisi: Analisis File, Konflik, Tujuan Proyek, Instruksi, Pengetahuan, dan 13 Prompt Step-by-Step siap pakai untuk Claude AI.

---

## ═══════════════════════════════════════════
## 📊 BAGIAN A — ANALISIS FILE YANG DIUPLOAD
## ═══════════════════════════════════════════

### ✅ File yang Sudah Ada & Status

| File | Status | Keterangan |
|------|--------|------------|
| `xiaomi-portal.html` | ✅ Versi awal homepage | Cyberpunk dengan Orbitron/Rajdhani font, cyan palette |
| `xiaomi-basecamp-homepage.html` | ✅ **Versi FINAL homepage** | Homepage paling lengkap — Barlow+Syne+DM Mono, animasi hero penuh, partikel, parallax |
| `devices-v2.html` | ✅ **Versi FINAL devices page** | Grid 207 device, filter sidebar, search, pagination UI sudah jadi |
| `filter-engine.js` | ✅ **Production ready** | Multi-dimension filter, 9 tipe filter, zero-dependency |
| `search-engine.js` | ✅ **Production ready** | Tokenized search, debounce, highlight, <1ms untuk 200+ item |
| `modal.js` | ✅ **Production ready** | Lazy load + cache + hover prefetch + focus trap + ARIA |
| `paginator.js` | ✅ **Production ready** | IntersectionObserver, append-only, DocumentFragment |
| `xiaomi_devices_fixed.json` | ✅ **207 devices** | Data lengkap, TAPI schema berbeda dari json-schemas.md |
| `xiaomi-portal-master-prompt.md` | ✅ Blueprint arsitektur | Folder structure, component guide, deployment |
| `json-schemas.md` | ✅ Schema referensi | 4 schema: Device, ROM, Tools, Tutorial |
| `design-rules.md` | ✅ Design system | Color system, typography, spacing, komponen standar |

---

### ⚠️ KONFLIK YANG DITEMUKAN & RESOLUSI

#### KONFLIK 1 — Brand Name
| | Nilai |
|--|-------|
| `master-prompt.md` | "XiaomiID Portal" |
| `xiaomi-basecamp-homepage.html` | **"Xiaomi Basecamp"** |
| **RESOLUSI ✅** | **Gunakan "Xiaomi Basecamp"** — Homepage sudah production-ready dengan branding ini. Lebih kuat secara visual. |

---

#### KONFLIK 2 — Color System (KRITIS)
| | Primary Color | Palette |
|--|--------------|---------|
| `design-rules.md` | `#FF6900` Xiaomi Orange | Orange-based |
| `xiaomi-basecamp-homepage.html` | `#00ffe0` Neon Cyan | Cyan + Volt + Blaze |
| `xiaomi-portal.html` | `#00f5ff` Neon Cyan | Cyan + Purple + Pink |
| **RESOLUSI ✅** | **Gunakan Cyan-based dari HTML** | Homepage sudah lengkap dengan sistem ini. `design-rules.md` adalah dokumen planning lama yang belum diimplementasi. |

**Token warna FINAL yang digunakan (dari xiaomi-basecamp-homepage.html):**
```css
--ink-0: #03060f;    /* Background utama */
--ink-1: #070c1a;    /* Card background */
--ink-2: #0c1428;    /* Elevated surface */
--acid:  #00ffe0;    /* Cyan — PRIMARY CTA */
--volt:  #b800ff;    /* Electric Violet */
--blaze: #ff2d6b;    /* Hot Pink */
--amber: #ffa500;    /* Warm Accent */
--lime:  #29ff5a;    /* Status Green */
```

---

#### KONFLIK 3 — Typography
| | Display Font | UI Font | Mono Font |
|--|-------------|---------|-----------|
| `design-rules.md` | Rajdhani | IBM Plex Sans | JetBrains Mono |
| `xiaomi-basecamp-homepage.html` | **Barlow Condensed** | **Syne** | **DM Mono** |
| **RESOLUSI ✅** | **Gunakan font dari HTML** | Sudah diimplementasi dan terlihat lebih impactful untuk cyberpunk style. |

---

#### KONFLIK 4 — JSON Schema Device (KRITIS)
| | Schema |
|--|--------|
| `json-schemas.md` | id sebagai string-slug, field `specs.chipset`, `modding`, `roms_available` |
| `xiaomi_devices_fixed.json` | id sebagai number (1-207), field `processor.chipset`, `connectivity`, tidak ada `modding` |
| **RESOLUSI ✅** | **Buat Data Transformer/Adapter** di `assets/js/core/dataTransformer.js` yang otomatis memetakan schema lama ke format UI. Tambahkan `search_blob` saat load. |

---

#### KONFLIK 5 — search_blob Field
`search-engine.js` **WAJIB** ada field `search_blob` di setiap item, tapi `xiaomi_devices_fixed.json` tidak punya field ini.

**RESOLUSI ✅** Transformer otomatis generate `search_blob`:
```javascript
search_blob: [
  device.name, device.codename, device.brand, device.series,
  device.processor?.chipset, device.os?.launch
].filter(Boolean).join(' ').toLowerCase()
```

---

### 📋 HALAMAN YANG BELUM DIBUAT

| Halaman | Priority | Complexity |
|---------|----------|------------|
| `device-detail.html` | 🔴 High | Medium |
| `roms.html` | 🔴 High | Medium |
| `rom-detail.html` | 🔴 High | Medium |
| `tools.html` | 🟡 Medium | Medium |
| `tutorials.html` | 🟡 Medium | Medium |
| `tutorial-detail.html` | 🟡 Medium | High |
| `compare.html` | 🟢 Low | High |
| `search.html` | 🟢 Low | Low |
| `404.html` | 🟢 Low | Low |

### 📋 FILE JS/CSS YANG BELUM DIBUAT

| File | Tipe | Keterangan |
|------|------|------------|
| `assets/js/core/dataLoader.js` | Core | Fetch + cache manager |
| `assets/js/core/dataTransformer.js` | Core | **BARU** — Schema adapter |
| `assets/js/core/router.js` | Core | URL params manager |
| `assets/js/core/state.js` | Core | Global state |
| `assets/js/components/navbar.js` | Component | Standalone navbar |
| `assets/js/components/deviceCard.js` | Component | Card renderer |
| `assets/js/components/romCard.js` | Component | ROM card renderer |
| `assets/js/components/toolCard.js` | Component | Tool card renderer |
| `assets/css/variables.css` | Style | CSS tokens (extracted) |
| `assets/css/components.css` | Style | Reusable components |
| `scripts/generate-index.js` | Build | Index generator |
| `scripts/generate-sitemap.js` | Build | Sitemap generator |
| `data/roms/_index.json` | Data | ROM data |
| `data/tools/_index.json` | Data | Tools data |
| `data/tutorials/_index.json` | Data | Tutorial data |

---

## ═══════════════════════════════════════════
## 🎯 BAGIAN B — TUJUAN PROYEK
## ═══════════════════════════════════════════

### Tujuan Utama
Membangun **portal web statis berbahasa Indonesia** bernama **Xiaomi Basecamp** yang menjadi pusat referensi terpercaya bagi komunitas pengguna Xiaomi — khususnya untuk kebutuhan firmware, custom ROM, root, recovery, dan tutorial teknis — tanpa backend atau biaya hosting.

### Tujuan Spesifik

| # | Tujuan | Target |
|---|--------|--------|
| 1 | Device Database | 200+ device Xiaomi dengan spesifikasi lengkap dan link download |
| 2 | ROM Directory | 100+ Custom ROM dengan info kompatibilitas dan download |
| 3 | Root & Tools Hub | Magisk, KernelSU, TWRP, OrangeFox, kernel, GCam, audio mod |
| 4 | Tutorial Center | 65+ tutorial step-by-step dalam Bahasa Indonesia |
| 5 | Tanpa Backend | JSON-driven, deploy ke GitHub Pages / Vercel gratis |
| 6 | SEO Optimal | Lighthouse ≥ 90 semua kategori |
| 7 | Scalable | Tambah device = tambah JSON file saja |

### Bukan Tujuan Proyek
- ❌ Bukan toko / marketplace
- ❌ Bukan forum (komunitas ke Telegram / XDA)
- ❌ Bukan download host ROM (link ke SourceForge/GitHub resmi)
- ❌ Bukan sistem yang butuh login / akun

---

## ═══════════════════════════════════════════
## 📋 BAGIAN C — INSTRUKSI PROYEK
## ═══════════════════════════════════════════

### Stack Teknologi
- **HTML5** — Semantic, tanpa framework
- **CSS3** — Custom properties, tanpa Tailwind/Bootstrap
- **Vanilla JavaScript** — ES6+, tanpa jQuery/React
- **JSON** — Semua data, fetched via Fetch API
- **GitHub Pages / Vercel** — Deployment gratis

### Aturan Wajib
1. **TIDAK ADA** backend, database, atau server-side code
2. **TIDAK ADA** framework CSS (Bootstrap, Tailwind, dsb.)
3. **TIDAK ADA** framework JS (React, Vue, jQuery, dsb.)
4. Semua gambar pakai **lazy loading** + format **WebP**
5. Semua komponen harus **reusable** via JavaScript
6. Semua data dari **JSON files** yang di-fetch saat runtime
7. Navigasi antar halaman via **query string** (`?id=...`)
8. **Mobile-first** responsive design
9. Kode harus **modular** — setiap komponen file sendiri
10. Setiap halaman harus punya **SEO meta tags** lengkap

### Konvensi Penamaan
- CSS class: `kebab-case` (`.device-card`, `.btn-primary`)
- JS variable/function: `camelCase` (`renderDeviceCard`)
- File JS: `camelCase.js` (`dataLoader.js`)
- File CSS: `kebab-case.css` (`variables.css`)
- JSON key: `snake_case` (`release_date`, `chipset_brand`)
- File JSON: `kebab-case.json` (`redmi-note-13-pro.json`)

### Design System (Final)
- **Font Display**: Barlow Condensed (judul, hero)
- **Font UI**: Syne (body, UI)
- **Font Mono**: DM Mono (kode, codename)
- **Primary**: `#00ffe0` (Neon Cyan)
- **Secondary**: `#b800ff` (Electric Violet)
- **Accent**: `#ff2d6b` (Hot Pink)
- **Success**: `#29ff5a` (Neon Green)
- **Warning**: `#ffa500` (Amber)
- **Background**: `#03060f` (Near Black)

---

## ═══════════════════════════════════════════
## 🧠 BAGIAN D — PENGETAHUAN PROYEK
## ═══════════════════════════════════════════

### Engine yang Sudah Ada (JANGAN Dibuat Ulang)

#### 1. SearchEngine (`search-engine.js`)
```javascript
// Cara pakai:
const SE = SearchEngine.create({ onResults, onEmpty });
SE.load(devices);                    // Build index
SE.bindInput(document.getElementById('search')); // Bind input
SE.query('poco x6');                 // Manual search
SE.reset();                          // Clear
```
**PENTING**: Setiap item WAJIB punya field `search_blob` (string gabungan semua field yang bisa dicari).

#### 2. FilterEngine (`filter-engine.js`)
```javascript
const FE = FilterEngine.create();
FE.define('series', { type: 'multi', field: 'series' })
  .define('chipset', { type: 'multi', field: 'chipset_brand' })
  .define('fiveg',   { type: 'boolean', field: 'fiveg' });
FE.set('series', ['Redmi', 'POCO']);
const filtered = FE.apply(devices);
```

#### 3. Paginator (`paginator.js`)
```javascript
const P = Paginator.create({
  container: document.getElementById('grid'),
  renderItem: (device) => `<div class="card">...</div>`,
  pageSize: 24,
  mode: 'button', // 'button' | 'infinite'
});
P.load(devices);  // Set data + render page 1
P.next();         // Append next page
P.reset(newData); // Full reset (after filter/search)
```

#### 4. Modal (`modal.js`)
```javascript
const M = Modal.create({
  overlayId: 'modal-overlay',
  modalId: 'modal',
  loader: DataLoader.getDevice,
  renderer: renderDeviceModal,
});
M.open('redmi-note-13-pro'); // Open by ID
M.bindAll(gridEl, el => el.dataset.deviceId);
```

### Schema Data yang Digunakan

#### Device (dari `xiaomi_devices_fixed.json` setelah transform)
```javascript
// Format setelah DataTransformer.normalizeDevice()
{
  id: "redmi-note-13-pro-plus",        // auto-generated slug
  numeric_id: 1,                        // original numeric id
  brand: "Redmi",
  series: "Redmi Note",
  name: "Redmi Note 13 Pro+",
  codename: "zircon",
  chipset: "Dimensity 7200 Ultra",
  chipset_brand: "MediaTek",           // extracted dari chipset name
  ram: [8, 12],                        // array angka GB
  storage: [256, 512],
  display_size: 6.67,
  refresh_rate: 120,
  fiveg: true,
  nfc: true,
  battery_mah: 5000,
  fast_charge_w: 120,
  os_launch: "MIUI 14 / Android 13",
  os_latest: "HyperOS / Android 14",
  android_version: 14,                 // extracted angka
  status: "active",
  search_blob: "redmi note 13 pro+ zircon dimensity 7200 ..."
}
```

### Struktur Folder Final Project
```
xiaomi-basecamp/
├── index.html                  ← Homepage (SUDAH ADA: xiaomi-basecamp-homepage.html)
├── devices.html                ← Device Center (SUDAH ADA: devices-v2.html)
├── device-detail.html          ← [DIBUAT di Step 4]
├── roms.html                   ← [DIBUAT di Step 5]
├── rom-detail.html             ← [DIBUAT di Step 5]
├── tools.html                  ← [DIBUAT di Step 6]
├── tutorials.html              ← [DIBUAT di Step 7]
├── tutorial-detail.html        ← [DIBUAT di Step 7]
├── search.html                 ← [DIBUAT di Step 8]
├── compare.html                ← [DIBUAT di Step 8]
├── 404.html                    ← [DIBUAT di Step 8]
│
├── assets/
│   ├── css/
│   │   ├── variables.css       ← [DIBUAT di Step 1]
│   │   ├── reset.css           ← [DIBUAT di Step 1]
│   │   ├── typography.css      ← [DIBUAT di Step 1]
│   │   ├── animations.css      ← [DIBUAT di Step 1]
│   │   ├── components.css      ← [DIBUAT di Step 1]
│   │   └── responsive.css      ← [DIBUAT di Step 1]
│   │
│   └── js/
│       ├── core/
│       │   ├── dataLoader.js       ← [DIBUAT di Step 2]
│       │   ├── dataTransformer.js  ← [DIBUAT di Step 2] ★ BARU
│       │   ├── router.js           ← [DIBUAT di Step 2]
│       │   └── state.js            ← [DIBUAT di Step 2]
│       │
│       ├── components/
│       │   ├── navbar.js           ← [DIBUAT di Step 3]
│       │   ├── deviceCard.js       ← [DIBUAT di Step 3]
│       │   ├── romCard.js          ← [DIBUAT di Step 3]
│       │   ├── toolCard.js         ← [DIBUAT di Step 3]
│       │   └── tutorialCard.js     ← [DIBUAT di Step 3]
│       │
│       ├── pages/
│       │   ├── home.js             ← [DIBUAT di Step 3]
│       │   ├── devices.js          ← [DIBUAT di Step 4]
│       │   ├── deviceDetail.js     ← [DIBUAT di Step 4]
│       │   ├── roms.js             ← [DIBUAT di Step 5]
│       │   ├── tools.js            ← [DIBUAT di Step 6]
│       │   └── tutorials.js        ← [DIBUAT di Step 7]
│       │
│       └── vendor/
│           ├── filter-engine.js    ← SUDAH ADA
│           ├── search-engine.js    ← SUDAH ADA
│           ├── modal.js            ← SUDAH ADA
│           └── paginator.js        ← SUDAH ADA
│
├── data/
│   ├── devices/
│   │   └── _index.json         ← [DIBUAT di Step 9]
│   ├── roms/
│   │   └── _index.json         ← [DIBUAT di Step 9]
│   ├── tools/
│   │   └── _index.json         ← [DIBUAT di Step 9]
│   └── tutorials/
│       └── _index.json         ← [DIBUAT di Step 9]
│
├── scripts/
│   ├── generate-index.js       ← [DIBUAT di Step 10]
│   └── generate-sitemap.js     ← [DIBUAT di Step 10]
│
├── .github/workflows/deploy.yml ← [DIBUAT di Step 11]
├── sitemap.xml                  ← [DIBUAT di Step 11]
├── robots.txt                   ← [DIBUAT di Step 11]
└── vercel.json                  ← [DIBUAT di Step 11]
```

---

## ═══════════════════════════════════════════
## 📝 BAGIAN E — STEP-BY-STEP PROMPTS
## ═══════════════════════════════════════════

> **CARA PAKAI**: Copy setiap prompt di bawah ini, paste ke Claude AI dalam percakapan baru (atau lanjutan).
> Ikuti urutan STEP 1 → STEP 13. Jangan skip langkah.
> Setiap step menghasilkan file yang dibutuhkan step berikutnya.

---

## ════════════════════════════════════
## STEP 1 — CSS FOUNDATION (variables + reset + animations)
## ════════════════════════════════════

```
You are a senior frontend engineer building "Xiaomi Basecamp" — a cyberpunk-themed Xiaomi firmware portal.
Static website only. No frameworks. Pure HTML/CSS/JS.

Create 5 CSS files for the project. Use this EXACT design system (do not change colors or fonts):

DESIGN TOKENS:
--ink-0: #03060f    /* deepest background */
--ink-1: #070c1a    /* card background */
--ink-2: #0c1428    /* elevated surface */
--ink-3: #132034    /* border-adjacent surface */
--acid:  #00ffe0    /* neon cyan — primary CTA */
--volt:  #b800ff    /* electric violet */
--blaze: #ff2d6b    /* hot pink */
--amber: #ffa500    /* warm accent */
--lime:  #29ff5a    /* status green */
--t1: #eef4ff       /* primary text */
--t2: #7a99c2       /* secondary text */
--t3: #3d5578       /* muted text */
--t4: #1e3050       /* disabled text */
--glass-fill:   rgba(7, 12, 26, 0.72)
--glass-border: rgba(0, 255, 224, 0.10)
--glass-hover:  rgba(0, 255, 224, 0.05)
--glow-acid:  0 0 32px rgba(0,255,224,0.35)
--glow-volt:  0 0 32px rgba(184,0,255,0.35)
--glow-blaze: 0 0 32px rgba(255,45,107,0.35)
--f-display: 'Barlow Condensed', sans-serif
--f-ui:      'Syne', sans-serif
--f-mono:    'DM Mono', monospace
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)

Spacing scale: 4px base, variables: --s1(4) --s2(8) --s3(12) --s4(16) --s5(20) --s6(24) --s8(32) --s10(40) --s12(48) --s16(64) --s20(80)
Border radius: --r-xs(4) --r-sm(6) --r-md(12) --r-lg(20) --r-xl(28) --r-full(9999px)
Container: max-width 1440px

OUTPUT — Create these 5 files:

1. assets/css/variables.css
   - All CSS custom properties (tokens above)
   - Glassmorphism mixins as CSS variables
   - Glow effect variables
   - Grid cyberpunk background pattern (body::before)
   - Custom scrollbar styling (3px, acid color)
   - Text selection styling
   - Custom cursor variables (dot + ring)

2. assets/css/reset.css
   - Modern CSS reset
   - box-sizing: border-box
   - Smooth scroll
   - No outline for mouse users, preserve for keyboard (focus-visible)
   - Image responsive defaults
   - Remove list styles where needed

3. assets/css/typography.css
   - Google Fonts import: Barlow Condensed 400/700/900, Syne 400/600/700/800, DM Mono 300/400/500
   - Font scale: Hero (clamp 2.5rem–5rem Barlow 900), Section (clamp 1.5rem–2.25rem Barlow 700), Card title (1.25rem Barlow 700), Body (1rem Syne 400), Label (0.875rem Syne 500), Badge (0.75rem Syne 600), Mono (0.875rem DM Mono)
   - Line heights and letter spacing
   - .text-glow class (acid glow)
   - Utility classes: .font-display, .font-ui, .font-mono

4. assets/css/animations.css
   - @keyframes: fadeInUp, fadeInDown, fadeIn, scaleIn, glowPulse, scanline, float, particleDrift, gridShift, neonFlicker
   - Animation utility classes: .animate-in, .animate-fade, .animate-scale
   - Stagger animation helper (--stagger-delay CSS variable)
   - Page transition styles
   - Hover lift utility: .hover-lift
   - Skeleton loading animation
   - Intersection Observer animation trigger class: .reveal (opacity 0 → 1 when in viewport)
   - Respect prefers-reduced-motion

5. assets/css/components.css
   - .btn (base), .btn-primary (acid bg), .btn-ghost (acid border), .btn-volt, .btn-sm, .btn-lg
   - .badge (base), .badge-success (lime), .badge-warning (amber), .badge-danger (blaze), .badge-info (acid), .badge-muted
   - .chip / .tag (pill shape)
   - .card (glassmorphism base), .card:hover (acid border glow)
   - .grid-cards (auto-fill minmax 260px)
   - .container (max-width 1440px, centered)
   - .section (padding top/bottom)
   - .empty-state (icon + message)
   - .skeleton (loading placeholder animation)
   - .toast notification styles
   - Cyberpunk divider (.divider-neon)
   - Rating stars component (.rating-stars)
   - .code-block (DM Mono, dark bg, acid border)
   - .warning-box (level: danger/warning/info — matching blaze/amber/acid colors)
   - .sticky-header behavior
   - Responsive: mobile-first, breakpoints at 640/768/1024/1280/1536px

All files must be production-quality, well-commented, and follow mobile-first approach.
```

---

## ════════════════════════════════════
## STEP 2 — CORE JS ENGINE
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp" cyberpunk Xiaomi portal.
Static website. Pure vanilla JS ES6+. Zero dependencies.

The project already has these engines (do NOT recreate):
- filter-engine.js — multi-dimension filter
- search-engine.js — tokenized search (needs search_blob field per item)
- modal.js — lazy load modal with cache
- paginator.js — IntersectionObserver pagination

Create 4 core JavaScript files:

---

FILE 1: assets/js/core/dataTransformer.js
This is the MOST IMPORTANT file. It adapts our raw JSON data to UI-ready format.

The raw device data (xiaomi_devices_fixed.json) has this schema:
{
  "id": 1,                              // numeric — must convert to slug
  "brand": "Redmi",
  "series": "Redmi Note",
  "name": "Redmi Note 13 Pro+",
  "codename": "zircon",
  "announced": "2023-09",
  "released": "2023-10",
  "display": { "size_inch": 6.67, "type": "AMOLED", "resolution": "1220x2712", "ppi": 446, "refresh_rate_hz": 120, "brightness_nits": 1800 },
  "processor": { "chipset": "Dimensity 7200 Ultra", "cpu": "Octa-core 2.8GHz", "gpu": "Mali-G610 MC4", "node_nm": 4 },
  "memory": [{ "ram_gb": 8, "storage_gb": 256 }, { "ram_gb": 12, "storage_gb": 256 }],
  "camera": { "main_mp": 200, "ultrawide_mp": 8, "front_mp": 16, "video_max": "4K@30fps" },
  "battery": { "capacity_mah": 5000, "fast_charge_w": 120, "wireless_charge_w": null },
  "os": { "launch": "MIUI 14 / Android 13", "upgradable_to": "HyperOS / Android 14" },
  "connectivity": { "5g": true, "wifi": "Wi-Fi 6E", "bluetooth": "5.3", "nfc": true, "usb": "USB 2.0 Type-C" },
  "modding": { "bootloader_unlockable": true, "ubl_method": "official", "recovery_options": ["TWRP","OrangeFox"], "root_options": ["Magisk","KernelSU"] },
  "community": { "xda_thread": null, "telegram_group": null }
}

Transform to UI-ready format:
{
  id: "redmi-note-13-pro-plus",        // slug from name
  numeric_id: 1,
  brand: "Redmi",
  series: "Redmi Note",
  name: "Redmi Note 13 Pro+",
  codename: "zircon",
  year: 2023,
  chipset: "Dimensity 7200 Ultra",
  chipset_brand: "MediaTek",           // extract: contains "Dimensity"→MediaTek, "Snapdragon"→Qualcomm, "Exynos"→Samsung, "Helio"→MediaTek, "Kirin"→HiSilicon
  cpu: "Octa-core 2.8GHz",
  gpu: "Mali-G610 MC4",
  ram: [8, 12],                        // unique sorted array of ram_gb values
  storage: [256, 512],                 // unique sorted array of storage_gb
  ram_display: "8/12GB",              // human readable
  storage_display: "256/512GB",
  display_size: 6.67,
  display_type: "AMOLED",
  resolution: "1220x2712",
  refresh_rate: 120,
  camera_main: 200,
  camera_front: 16,
  battery_mah: 5000,
  fast_charge_w: 120,
  wireless_charge: false,
  fiveg: true,
  nfc: true,
  wifi: "Wi-Fi 6E",
  bluetooth: "5.3",
  usb: "USB 2.0 Type-C",
  os_launch: "MIUI 14 / Android 13",
  os_latest: "HyperOS / Android 14",
  android_version: 14,                 // extract highest number from os strings
  has_hyperos: true,                   // detect if upgradable_to contains "HyperOS"
  bootloader_unlockable: true,
  ubl_method: "official",
  recovery_options: ["TWRP","OrangeFox"],
  root_options: ["Magisk","KernelSU"],
  xda_thread: null,
  telegram_group: null,
  thumbnail: "/assets/img/devices/placeholder.webp",  // default until real images
  status: "active",                    // always "active" unless year < 2020 → "legacy"
  tags: [],                            // auto-generate: ["5g","nfc","hyperos","high-camera","fast-charge"]
  search_blob: "...",                  // JOIN all text fields lowercase
  modding_score: 0,                    // 0-100 score based on: ubl+recovery+root options
}

Functions to export:
- DataTransformer.normalizeDevice(rawDevice) → transformed device
- DataTransformer.normalizeDevices(rawDevices[]) → array of transformed devices
- DataTransformer.generateSlug(name) → "redmi-note-13-pro-plus"
- DataTransformer.extractChipsetBrand(chipsetName) → "MediaTek"
- DataTransformer.extractAndroidVersion(osString) → 14
- DataTransformer.generateTags(device) → ["5g","nfc","hyperos"]
- DataTransformer.generateSearchBlob(device) → lowercase string
- DataTransformer.calculateModdingScore(device) → 0-100

---

FILE 2: assets/js/core/dataLoader.js

Features:
- Fetch JSON files via Fetch API
- In-memory cache (Map) with 5-minute TTL
- Queue deduplication (multiple calls for same resource = one fetch)
- Auto-transform devices via DataTransformer
- Methods:
  - DataLoader.getDevices() → Promise<Device[]>  (loads /data/devices/_index.json then transforms)
  - DataLoader.getDevice(id) → Promise<Device>   (find by id/numeric_id/slug)
  - DataLoader.getRoms() → Promise<Rom[]>
  - DataLoader.getRom(id) → Promise<Rom>
  - DataLoader.getTools() → Promise<Tool[]>
  - DataLoader.getTool(id) → Promise<Tool>
  - DataLoader.getTutorials() → Promise<Tutorial[]>
  - DataLoader.getTutorial(id) → Promise<Tutorial>
  - DataLoader.preload(types[]) → preload multiple types in parallel
  - DataLoader.clearCache() → clear all cached data
- Error handling: return null on failure, log to console with context
- Loading state: DataLoader.isLoading(type) → boolean

---

FILE 3: assets/js/core/state.js

Global state manager (no framework, pure vanilla):
- State shape:
  {
    devices: [], roms: [], tools: [], tutorials: [],
    filteredDevices: [], filteredRoms: [],
    activeFilters: {},
    searchQuery: '',
    currentPage: { devices: 1, roms: 1, tools: 1, tutorials: 1 },
    loading: { devices: false, roms: false, tools: false, tutorials: false },
    bookmarks: [],  // from localStorage
    compareList: [],  // max 2 devices
    lastUpdated: null,
  }
- Methods:
  - State.get(key) → value
  - State.set(key, value) → triggers subscribers
  - State.subscribe(key, callback) → unsubscribe function
  - State.dispatch(action, payload) → predefined actions
  - State.bookmarkToggle(deviceId) → add/remove from localStorage
  - State.compareToggle(deviceId) → add/remove, max 2

---

FILE 4: assets/js/core/router.js

URL/query string manager for SPA-like navigation:
- Router.getParam(name) → string|null  (from URL ?id=xyz)
- Router.getParams() → { key: value } object of all params
- Router.setParam(name, value) → update URL without page reload (pushState)
- Router.setParams(object) → set multiple params
- Router.removeParam(name) → remove from URL
- Router.navigate(url) → go to page (with smooth transition)
- Router.onPopState(callback) → listen to browser back/forward
- Router.buildUrl(base, params) → build URL string
```

---

## ════════════════════════════════════
## STEP 3 — NAVBAR, FOOTER & CARD COMPONENTS
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp" cyberpunk Xiaomi portal.
Static website. Pure vanilla JS. Design: dark cyberpunk, Barlow Condensed + Syne + DM Mono fonts, cyan (#00ffe0) as primary.

Create these component files:

---

FILE 1: assets/js/components/navbar.js

Renders a sticky cyberpunk navbar into a target element.
Design: same as existing pages (glassmorphism dark, acid cyan logo dot, mega dropdown).

HTML structure to inject:
- Logo: "BASECAMP◉XM" with blinking acid dot (◉ = animated)
- Nav links with dropdown: Devices (Xiaomi/Redmi/POCO/All), Custom ROM (AOSP/HyperOS-based/MIUI-based/All), Root & Tools, Tutorial
- Right side: Search icon, Compare button (shows count badge), Hamburger (mobile)
- Mobile: Slide-in menu from right, overlay
- Active state: highlights current page link based on URL
- Dropdown: shows on hover (desktop), click (mobile)
- Sticky: stays at top, backdrop-blur on scroll

Export:
- Navbar.init(containerId, config) → renders and attaches events
- config: { logoText, links[], github, telegram }

---

FILE 2: assets/js/components/deviceCard.js

Renders a device card for the grid.

Card HTML:
- Top: device thumbnail image (lazy loading) with status badge (active/legacy/discontinued)
- Body: series label, device name (Barlow Condensed bold), codename (DM Mono small), chip badges (chipset_brand, fiveg, nfc)
- Footer: RAM/storage display, "Detail" button (acid), "Compare" ghost button
- Hover: lift + acid border glow
- Click anywhere → opens device detail page (?id=slug)

Exports:
- DeviceCard.render(device, options) → HTMLElement
  - options: { compact, showCompare, onClick }
- DeviceCard.renderGrid(container, devices, options) → void
- DeviceCard.renderSkeleton(count) → HTMLElement[] (loading placeholders)

Status badge colors:
- active → lime (#29ff5a)
- legacy → amber (#ffa500)
- discontinued → blaze (#ff2d6b)

---

FILE 3: assets/js/components/romCard.js

Renders a Custom ROM card (Play Store style).

Card HTML:
- Logo image (square, rounded, 80x80) — left side
- Right: ROM name (bold), Android version badge, Base type badge (AOSP/MIUI-based/HyperOS-based)
- Status chip (Active/Maintained/Abandoned)
- Feature tags (max 3 visible + "+N more" if more)
- Star rating (visual: 5 stars using CSS)
- Footer: "Download" primary button, "Detail" ghost button
- Hover: lift + volt border glow

Exports:
- RomCard.render(rom, options) → HTMLElement
- RomCard.renderGrid(container, roms, options) → void
- RomCard.renderSkeleton(count) → HTMLElement[]

---

FILE 4: assets/js/components/toolCard.js

Renders a tool card for Root & Tools page.

Card design varies by category:
- root: acid glow (cyan)
- recovery: volt glow (purple)
- kernel: amber glow
- utility: blaze glow

Card HTML:
- Top: icon/logo, category badge, version badge
- Body: tool name (bold), developer name, short description (2 lines max, truncated)
- Compatibility badges: Android version range
- Footer: "Download" primary button, GitHub icon link

Exports:
- ToolCard.render(tool, options) → HTMLElement
- ToolCard.renderGrid(container, tools, options) → void
- ToolCard.renderSkeleton(count) → HTMLElement[]
- ToolCard.getCategoryColor(category) → CSS color var

---

FILE 5: assets/js/components/tutorialCard.js

Renders a tutorial card.

Card HTML:
- Top: thumbnail image, difficulty badge (Pemula=lime/Menengah=amber/Mahir=blaze), category chip
- Body: tutorial title (Barlow Condensed), estimated time + steps count
- Tags: max 3
- Footer: "Mulai Tutorial" button

Exports:
- TutorialCard.render(tutorial, options) → HTMLElement
- TutorialCard.renderGrid(container, tutorials, options) → void
- TutorialCard.renderSkeleton(count) → HTMLElement[]

---

FILE 6: assets/js/pages/home.js

Homepage logic:
- On DOMContentLoaded: preload devices + roms data
- Render "Trending Devices" section: show top 8 devices by modding_score
- Render "Latest ROM" section: show top 6 roms by updated_at
- Stats counter animation: count up numbers in stats section (212 Devices, 108 ROMs, etc.)
- Initialize hero search bar: bind to SearchEngine, on submit go to devices.html?q=query
- Hero tag chips: click → navigate to devices.html?filter=tag

All components must be self-contained, export-ready, well-documented.
DO NOT use any CSS framework. Write all styles as inline classes or reference variables.css tokens.
```

---

## ════════════════════════════════════
## STEP 4 — DEVICE CENTER PAGES
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp". 

I already have:
- devices-v2.html (existing device list page — KEEP THIS AS REFERENCE for the exact design style)
- xiaomi_devices_fixed.json (207 devices raw data)
- DataTransformer, DataLoader, FilterEngine, SearchEngine, Paginator, DeviceCard (all built in previous steps)

The existing devices-v2.html already has the correct visual design. Now I need to:

TASK 1: Refactor devices.html
Take the existing devices-v2.html and refactor it to use our modular JS system instead of inline JavaScript.

The page should:
- Include: variables.css, reset.css, typography.css, animations.css, components.css
- Load scripts: filter-engine.js, search-engine.js, paginator.js, modal.js (vendor), then core/, then components/, then pages/devices.js
- Use navbar.js component for navigation
- The grid, filter sidebar, search bar visual design: KEEP EXACTLY as in devices-v2.html
- Remove all inline JS logic — move to assets/js/pages/devices.js

TASK 2: Create assets/js/pages/devices.js

Full devices page logic:
1. On load: DataLoader.getDevices() → transform → load into SearchEngine + FilterEngine + Paginator
2. Show loading skeletons (DeviceCard.renderSkeleton(12)) while loading
3. Filter sidebar:
   - Series: Redmi | POCO | Xiaomi | Mi (multi-select chips)
   - Chipset: Qualcomm | MediaTek | All (radio)
   - Android: 12 | 13 | 14 | 15 (min version, radio)
   - 5G: toggle
   - NFC: toggle
   - RAM: 4GB | 6GB | 8GB | 12GB | 16GB (multi-select)
   - UBL: Supported | Official Only | Any (radio)
4. Filter chips bar: shows active filters as dismissible chips above grid
5. Search bar: live search via SearchEngine (200ms debounce)
6. Results count: "Menampilkan X dari 207 device"
7. Sort options: Name A-Z, Year Newest, Modding Score, RAM
8. Paginator: "Load More" button mode, 24 per page
9. URL sync: filters reflected in URL params for shareable links
10. Filter reset button: clear all active filters
11. Compare feature: max 2 devices, floating compare bar appears when 2 selected

TASK 3: Create device-detail.html + assets/js/pages/deviceDetail.js

device-detail.html is a template page — loads data based on ?id= URL param.

Layout (single column wide layout):
SECTION 1 — Hero
- Breadcrumb: Home > Devices > [Device Name]
- Device name (huge, Barlow Condensed)
- Codename badge (DM Mono)
- Status badge + year + series badge
- Quick specs bar: chipset | RAM | display | battery
- Action buttons: Firmware Download, Custom ROM, Root Guide, Tutorial
- Device image (right side, large)

SECTION 2 — Full Specs Table
Glassmorphism table with sections:
- Display: size, type, resolution, refresh rate, brightness
- Processor: chipset, cpu, gpu, process node
- Memory: all RAM/storage variants
- Camera: main, ultrawide, telephoto, front, video
- Battery: capacity, wired charging, wireless
- Connectivity: 5G, WiFi, BT, NFC, USB
- OS: launch, upgradable to, Android version

SECTION 3 — Modding Status
- Modding score bar (0-100 visual)
- UBL status card (method, wait days)
- Available recoveries (cards: TWRP, OrangeFox, PBRP)
- Root options (Magisk, KernelSU badges)
- Treble/A/B partition info

SECTION 4 — Downloads Grid
- Custom ROMs available for this device (mini ROM cards, 3 columns)
- "View All ROMs →" link

SECTION 5 — Community
- XDA Thread button
- Telegram Group button
- "Contribute Data" GitHub link

deviceDetail.js:
- Get ?id= from URL
- DataLoader.getDevice(id) — match by slug or numeric_id
- Populate all sections dynamically
- If device not found: show 404 state with "Back to Devices" button
- Update page <title> and meta tags dynamically
- Track recently viewed in localStorage
```

---

## ════════════════════════════════════
## STEP 5 — CUSTOM ROM PAGES
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

Design style: same cyberpunk dark theme (--ink-0 background, acid/volt/blaze glow, Barlow Condensed + Syne + DM Mono).

TASK 1: Create data/roms/_index.json

Create a complete ROM index with 25 Custom ROMs. Each entry MUST include all fields.
Use this schema exactly:

{
  "id": "evolution-x",
  "slug": "evolution-x",
  "name": "Evolution X",
  "short_name": "EvoX",
  "version": "9.2",
  "android_version": "15",
  "base": "AOSP",
  "type": "AOSP",
  "status": "active",
  "maintained": true,
  "description": "ROM AOSP kencang berbasis Android 15 dengan fitur Pixel penuh dan customisasi mendalam.",
  "features": ["Pixel Launcher", "System-wide Theming", "Gaming Mode", "DoT OS kernels", "Face Unlock"],
  "pros": ["Performa mulus", "Update rutin", "Komunitas besar"],
  "cons": ["Butuh GApps terpisah untuk beberapa device", "Setup awal lebih rumit"],
  "supported_devices": ["redmi-note-13-pro-plus", "poco-f6-pro", "xiaomi-14"],
  "download": {
    "sourceforge": "https://sourceforge.net/projects/evolution-x/",
    "github_releases": "https://github.com/Evolution-X/OTA",
    "telegram_channel": "https://t.me/EvolutionXOfficial"
  },
  "requirements": {
    "unlocked_bootloader": true,
    "custom_recovery": true,
    "recommended_recovery": ["OrangeFox", "TWRP"],
    "vendor_required": true,
    "root_support": "Magisk / KernelSU"
  },
  "ratings": { "stability": 4.5, "performance": 4.8, "battery": 4.2, "features": 4.9, "community": 4.7 },
  "logo": "/assets/img/roms/evolution-x-logo.webp",
  "tags": ["aosp", "pixel", "android-15", "active", "performance"],
  "updated_at": "2025-04-10"
}

Include these 25 ROMs (fill all data accurately):
1. Evolution X (AOSP, Android 15)
2. LineageOS 22 (AOSP, Android 15)
3. crDroid 11 (AOSP, Android 15)
4. Pixel Experience Plus (AOSP, Android 14)
5. DerpFest (AOSP, Android 15)
6. ArrowOS Extended (AOSP, Android 14)
7. Project Elixir (AOSP, Android 14)
8. RisingOS (AOSP, Android 15)
9. Superior OS (AOSP, Android 14)
10. Paranoid Android (AOSP, Android 14)
11. Nameless AOSP (AOSP, Android 15)
12. PixelOS (AOSP, Android 14)
13. NusantaraProject (AOSP, Android 14)
14. Crdroid Stable (AOSP, Android 14)
15. AOSP Extended (AOSP, Android 13 — legacy)
16. HavocOS (AOSP, Android 13 — legacy)
17. Resurrection Remix (AOSP, Android 13 — inactive)
18. MIUI EU Rom (MIUI-based, MIUI 14)
19. MIUI Taiwan (MIUI-based, MIUI 14)
20. HyperOS EU (HyperOS-based, Android 14)
21. HyperOS Global Beta (HyperOS-based, Android 15)
22. Xiaomi.eu Weekly (MIUI-based, HyperOS hybrid)
23. Project Matrixx (AOSP, Android 15)
24. GrapheneOS Xiaomi Port (AOSP, Android 15 — niche)
25. KernelSU Supported LineageOS Micro (AOSP, Android 15)

TASK 2: Create roms.html

Play Store grid layout for browsing ROMs.

Layout:
- Page header: "Custom ROM Database" with subtitle and ROM count
- Filter sidebar (left on desktop, slide-in on mobile):
  - ROM Type: AOSP | HyperOS-based | MIUI-based (multi-select)
  - Android Version: 13 | 14 | 15 (multi-select)
  - Status: Active | Inactive | Abandoned (multi-select)
  - Has Maintained: Yes/No toggle
  - Tags: performance | battery | camera | stability (chip multi-select)
- Main area:
  - Search bar
  - Sort: Rating | Latest | Name A-Z
  - Filter chips bar (active filters as dismissible chips)
  - Results count
  - ROM grid (RomCard components, 3 col desktop, 2 tablet, 1 mobile)
  - Load more button
- Tab navigation above grid: All | AOSP | HyperOS-based | MIUI-based

TASK 3: Create rom-detail.html + assets/js/pages/romDetail.js

Layout:
SECTION 1 — Hero
- Breadcrumb
- ROM logo (large) + name + version badge + android version badge
- Status badge, base type badge
- Feature tags row
- 3 download buttons (SourceForge, GitHub, Telegram Channel) with icons

SECTION 2 — Description & Features
- Description paragraph
- Feature list (icon bullets with glowing acid dots)
- Pros (lime) and Cons (blaze) columns

SECTION 3 — Ratings
- 5 rating categories with visual bars (acid glow fill)

SECTION 4 — Requirements
- Checklist: unlocked bootloader, custom recovery, vendor
- Recommended recovery badges
- Root support info

SECTION 5 — Supported Devices
- Grid of mini device cards (compact mode, link to device-detail)
- "X device supported" count

SECTION 6 — Installation Guide Quick Link
- Card linking to tutorial: "Cara Install Custom ROM →"

romDetail.js:
- Load ROM by ?id= param
- Populate all sections
- Cross-link: load supported devices from DataLoader
- Update title + meta tags
```

---

## ════════════════════════════════════
## STEP 6 — ROOT & TOOLS PAGE
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

TASK 1: Create data/tools/_index.json

Create a complete tools index with ALL items below. Each entry must be accurate and complete.

SCHEMA per tool:
{
  "id": "magisk",
  "name": "Magisk",
  "category": "root",           // root | recovery | kernel | audio | camera | module | utility
  "subcategory": "systemless-root",
  "developer": "topjohnwu",
  "version_stable": "27.0",
  "version_beta": "28.0-beta",
  "status": "active",
  "open_source": true,
  "license": "GPL-3.0",
  "description": "Root systemless paling populer dengan sistem modul.",
  "features": ["Systemless root", "MagiskHide", "Modul manager", "SafetyNet bypass"],
  "compatibility": {
    "android_min": "6.0",
    "android_max": "15",
    "arch": ["arm64-v8a", "armeabi-v7a", "x86", "x86_64"],
    "ab_device": true,
    "vab_device": true
  },
  "download": {
    "github": "https://github.com/topjohnwu/Magisk",
    "latest_apk": "https://github.com/topjohnwu/Magisk/releases/latest",
    "mirror": null
  },
  "logo": "/assets/img/tools/magisk.webp",
  "tags": ["root", "systemless", "modules", "safetynet"],
  "updated_at": "2025-03-01"
}

Include these tools (research accurate data for each):

ROOT TOOLS:
- Magisk (all stable versions listed)
- KernelSU
- KernelSU Next
- KowSU
- APatch

RECOVERY:
- TWRP (Team Win Recovery Project)
- OrangeFox Recovery
- PBRP (PitchBlack Recovery)
- SHRP (Skyhawk Recovery)

ROOT MODULES:
- LSposed Framework
- Zygisk Next
- Play Integrity Fix (chiteroman)
- Shamiko (Magisk Hide alternative)
- Riru (legacy)
- KSU WebUI Module
- Magisk Delta (HuskyDG fork)

KERNEL TOOLS (listing popular kernels):
- ShadowStrike Kernel
- Sultan Kernel
- Crdroid Kernel
- KVM Kernel

AUDIO MODS:
- Dolby Atmos (generic flashable)
- Viper4Android FX
- ViPER4AndroidFX Repackaged
- Hi-Res Audio Enabler

CAMERA:
- GCam Hub (aggregator)
- GCam by BSG
- GCam by Shamim
- GCam MGC
- Nikita GCam

UTILITY / TOOLS:
- MiFlash Tool (Windows)
- ADB & Fastboot Platform Tools
- Mi Unlock Tool (official)
- TWRP App (companion)
- Bugjaeger (ADB over WiFi)

TASK 2: Create tools.html

Page layout:
- Page header with stats
- Category Tab Bar (sticky): All | Root | Recovery | Kernel | Audio | Camera | Modules | Utility
- Filter bar: Android version, Status (Active/Deprecated), Open Source toggle
- Search bar
- Main content:
  - Featured section (top 4 most used tools) — larger cards
  - Full grid by current category tab
  - Each category section has its own subheader

Special sections:
- "ROOT TOOLS" section: Magisk + KernelSU + KernelSU Next + KowSU + APatch — side-by-side comparison table (feature matrix)
- "RECOVERY" section: TWRP + OrangeFox + PBRP cards with supported device count
- "MODULE SPOTLIGHT": top modules with install count
- "LATEST AUDIO MODS", "GCAM BUILDS"

TASK 3: Create assets/js/pages/tools.js

Logic:
- DataLoader.getTools() on load
- Tab switching: filter by category, re-render grid
- Search via SearchEngine
- Feature comparison table for root tools (render matrix from data)
- Each tool card links to download URL directly (direct download gate)
- "Verified Download" badge on official links
- Track download click count in localStorage (static counter)
```

---

## ════════════════════════════════════
## STEP 7 — TUTORIAL PAGES
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

TASK 1: Create data/tutorials/_index.json

Create 20 tutorials. Schema:
{
  "id": "cara-unlock-bootloader",
  "title": "Cara Unlock Bootloader (UBL) Xiaomi 2025 — Panduan Lengkap",
  "category": "bootloader",
  "difficulty": "Pemula",
  "estimated_time": "30 menit + 7 hari tunggu",
  "status": "published",
  "compatibility": { "devices": ["all-xiaomi"], "os_pc": ["Windows 10", "Windows 11"] },
  "warnings": [{ "level": "danger", "text": "UBL akan menghapus semua data di HP. Backup terlebih dahulu!" }],
  "requirements": ["Baterai minimal 50%", "Kabel USB original/data", "PC/Laptop Windows", "Mi Account yang sudah di-bind 7+ hari", "Mi Unlock Tool (download di bawah)"],
  "tags": ["bootloader", "pemula", "wajib-pertama"],
  "thumbnail": "/assets/img/tutorials/ubl-thumbnail.webp",
  "views": 15420,
  "published_at": "2024-01-15",
  "updated_at": "2025-03-20"
}

20 tutorials (dengan step lengkap masing-masing):
1. Cara Unlock Bootloader (UBL) Xiaomi 2025
2. Cara Install TWRP via Fastboot
3. Cara Install OrangeFox Recovery
4. Cara Root dengan Magisk (via Recovery)
5. Cara Root dengan Magisk (Patch Boot Image)
6. Cara Install KernelSU
7. Cara Install Custom ROM via Recovery
8. Cara Flash Firmware Fastboot via MiFlash
9. Cara Flash ROM via TWRP (Zip)
10. Cara Setup ADB & Fastboot di Windows
11. Cara Unbrick Xiaomi (EDL Mode / 9008)
12. Cara Fix Bootloop setelah Flash ROM
13. Cara Install LSposed Framework
14. Cara Install Dolby Atmos Mod
15. Cara Flash Recovery via Fastboot
16. Cara Verify Integrity Pass (Play Integrity Fix)
17. Cara Pasang GCam di Xiaomi
18. Cara Update ROM tanpa Full Wipe (Dirty Flash)
19. Cara Backup & Restore dengan TWRP
20. Cara Enable Developer Options & USB Debugging

For each tutorial, write FULL step-by-step data (minimum 5 steps, max 15).
Each step must have: step number, title, content (detailed instruction), tip, download_link (if relevant).

TASK 2: Create tutorials.html

Layout:
- Hero section: "Tutorial Center" dengan subtitle
- Quick Category Filter: All | Bootloader | Recovery | Root | Flashing | Tools | Tips
- Difficulty Filter: Pemula | Menengah | Mahir
- Search bar
- Featured tutorials (top 3, large cards with thumbnail)
- Full grid (TutorialCard components)
- Pagination (load more)

TASK 3: Create tutorial-detail.html + assets/js/pages/tutorialDetail.js

This is a full tutorial reading page.

Layout:
SECTION 1 — Header
- Breadcrumb
- Tutorial title (large)
- Meta bar: difficulty badge | estimated time | category | views count | last updated
- Tags row
- Compatibility info (device types, PC OS needed)
- Table of Contents (auto-generated from steps, sticky on desktop)

SECTION 2 — Warnings
- Danger boxes (red glassmorphism)
- Warning boxes (amber glassmorphism)
- Info boxes (acid glassmorphism)

SECTION 3 — Requirements Checklist
- Interactive checklist (click to check off)
- Download links for required files

SECTION 4 — Steps
Each step:
- Step number (large, acid colored)
- Step title
- Content (supports **bold**, code inline, newlines)
- Code block (if step has commands — styled with DM Mono, copy button)
- Tip box (if exists — subtle glassmorphism)
- Download link button (if exists)
- Step image placeholder (if exists)

SECTION 5 — FAQ
- Accordion style (click to expand)

SECTION 6 — Related Tutorials
- 3 mini tutorial cards

tutorialDetail.js:
- Load by ?id= param
- Build Table of Contents from steps
- Checklist interactivity (localStorage to remember checked state)
- Copy button for code blocks
- Smooth scroll for TOC links
- Progress bar (reading progress at top of page)
- Dynamic meta tags
```

---

## ════════════════════════════════════
## STEP 8 — UTILITY PAGES (Search, Compare, 404)
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

Create 3 utility pages:

---

PAGE 1: search.html + assets/js/pages/search.js

Full-page search results.

Features:
- Reads ?q= from URL (from hero search bar on homepage)
- Searches across: devices, ROMs, tools, tutorials simultaneously
- Results grouped by type with count badges
- "No results" state with suggestions
- Search suggestions as user types (debounced)
- Filter results by type: All | Devices | ROMs | Tools | Tutorials
- Highlighted matching text in results (SearchEngine highlight feature)
- Search stats: "Ditemukan 24 hasil untuk 'poco x6' dalam 0.3ms"

---

PAGE 2: compare.html + assets/js/pages/compare.js

Device comparison page (max 2 devices side by side).

Layout:
- Reads ?device1= and ?device2= from URL
- Two-column layout (each column = one device)
- Comparison rows (same fields as device specs):
  - Device image + name + series
  - Chipset (highlight winner in acid/lime)
  - RAM options
  - Storage options
  - Display: size, type, refresh rate
  - Camera: main MP
  - Battery: capacity + fast charge
  - 5G / NFC (✓/✗)
  - Android version
  - Modding score (bar chart)
  - UBL support
  - Recovery options
  - Root options
- "Winner" indicator per row (acid glow on better spec)
- Mobile: swipe between devices (tab layout instead of side-by-side)
- Share button: copies URL to clipboard
- "Add to Compare" selector: search + add different device

If ?device1 or ?device2 not set: show device picker UI (search + select 2 devices).

---

PAGE 3: 404.html

Custom 404 error page.

Design: full-screen cyberpunk glitch effect.
Content:
- Giant "404" with glitch animation (CSS-only)
- "SIGNAL LOST" subtitle
- "Halaman tidak ditemukan di database kami." message
- Animated grid background
- Quick links: Home | Devices | Tutorial
- Search bar to find what they were looking for
- Easter egg: typing "NEXUS" shows a secret animation

---

IMPORTANT FOR ALL 3 PAGES:
- Include all CSS files (variables, reset, typography, animations, components)
- Use navbar.js component
- Mobile responsive
- Same design system: dark, glassmorphism, acid glow
```

---

## ════════════════════════════════════
## STEP 9 — DATA JSON FILES
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

The main device data is in xiaomi_devices_fixed.json (207 devices, already built).
The DataTransformer will handle the schema conversion at runtime.

TASK 1: Create data/devices/_index.json

This is a LIGHTWEIGHT index — only fields needed for the grid list (NOT full specs).
The DataTransformer will be used at runtime to convert xiaomi_devices_fixed.json.

Instead of creating a separate _index.json, create this adapter approach:
Create data/devices/source.json that is a COPY of xiaomi_devices_fixed.json structure
but with one wrapper:
{
  "source": "xiaomi_devices_fixed",
  "transform_version": "2.1",
  "file": "/data/xiaomi_devices_fixed.json"
}

And update DataLoader.getDevices() to:
1. Fetch /data/xiaomi_devices_fixed.json
2. Apply DataTransformer.normalizeDevices() on the array
3. Cache result

TASK 2: Create data/roms/_index.json (25 ROMs)
(Full data as specified in Step 5 — create the actual JSON file here)

Include all 25 ROMs with complete accurate data. Focus on:
- All download links pointing to real sources (GitHub, SourceForge)
- Accurate android_version per ROM
- Real feature lists (minimum 8 per ROM)
- Accurate supported_devices linking to device slugs from our database

TASK 3: Create data/tools/_index.json (all tools)
(Full data as specified in Step 6 — create the actual JSON file)

Include all tools with:
- Real download links (GitHub releases)
- Accurate version numbers
- Complete compatibility info
- Real changelog snippets for latest version

TASK 4: Create data/tutorials/_index.json (20 tutorials)
(Full data as specified in Step 7 — create the actual JSON file)

Each tutorial must include the FULL steps array (not just metadata).
This is a large file — use minified JSON.

TASK 5: Create data/config.json
{
  "site": {
    "name": "Xiaomi Basecamp",
    "tagline": "Pusat Firmware, ROM & Modding Xiaomi Indonesia",
    "description": "Database lengkap firmware, custom ROM, root tools, dan tutorial untuk semua device Xiaomi.",
    "url": "https://xiaomi-basecamp.github.io",
    "locale": "id-ID",
    "og_image": "/assets/img/ui/og-image.webp",
    "favicon": "/assets/img/ui/favicon.ico",
    "language": "id"
  },
  "stats": {
    "total_devices": 207,
    "total_roms": 25,
    "total_tools": 28,
    "total_tutorials": 20
  },
  "social": {
    "telegram": "https://t.me/xiaomi_basecamp",
    "github": "https://github.com/xiaomi-basecamp/portal",
    "youtube": null
  },
  "ads": {
    "enabled": false,
    "popunder": false,
    "banner": false
  },
  "features": {
    "compare": true,
    "bookmarks": true,
    "search": true,
    "pagination_per_page": 24
  }
}

TASK 6: Create data/categories/
Create 3 category files:
- device-series.json (Redmi, POCO, Xiaomi, Mi with descriptions and device counts)
- rom-types.json (AOSP, MIUI-based, HyperOS-based with descriptions)
- android-versions.json (Android 11-15 with release info)
```

---

## ════════════════════════════════════
## STEP 10 — BUILD SCRIPTS
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

Create Node.js build scripts (no npm dependencies — use built-in fs, path only):

---

FILE 1: scripts/generate-index.js

Purpose: Scans all JSON files in data/ and generates _index.json files.

What it does:
1. Reads all device JSONs from data/devices/ (except _index.json)
2. Creates data/devices/_index.json with lightweight fields only (id, name, series, brand, codename, status, tags, thumbnail, updated_at)
3. Same for data/roms/, data/tools/, data/tutorials/
4. Updates data/config.json stats (total counts)
5. Generates data/master-index.json: { devices: N, roms: N, tools: N, tutorials: N, generated_at: ISO_DATE }

Run: node scripts/generate-index.js
Output: Console log of what was generated.

---

FILE 2: scripts/generate-sitemap.js

Purpose: Generates sitemap.xml and robots.txt.

Config reads from data/config.json for site URL.

Sitemap includes:
- Static pages: /, /devices.html, /roms.html, /tools.html, /tutorials.html, /compare.html, /search.html
- Dynamic device pages: /device-detail.html?id={slug} for all 207 devices
- Dynamic ROM pages: /rom-detail.html?id={slug} for all ROMs
- Dynamic tutorial pages: /tutorial-detail.html?id={slug}

Priority levels:
- Homepage: 1.0
- Main section pages: 0.9
- Device/ROM detail pages: 0.7
- Tutorial detail: 0.6

Change frequency: weekly

robots.txt:
User-agent: *
Allow: /
Disallow: /assets/js/vendor/
Sitemap: {site_url}/sitemap.xml

---

FILE 3: scripts/validate-data.js

Purpose: Validates all JSON files against schemas.

Checks:
- Required fields present
- Enum values valid (status, category, difficulty, etc.)
- No trailing commas (JSON.parse will catch)
- No duplicate IDs
- All linked device IDs in roms exist in devices
- search_blob would generate correctly
- Image paths follow pattern /assets/img/...

Output: 
- ✅ PASS or ❌ FAIL per file
- Summary: X files checked, Y errors found
- Detailed error messages with file + field

Run: node scripts/validate-data.js
```

---

## ════════════════════════════════════
## STEP 11 — DEPLOYMENT CONFIG
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

Create all deployment configuration files:

---

FILE 1: .github/workflows/deploy.yml

GitHub Actions for auto-deploy to GitHub Pages:
- Trigger: push to main branch + manual dispatch
- Steps:
  1. Checkout code
  2. Setup Node.js 20
  3. Run validate-data.js (fail fast if errors)
  4. Run generate-index.js (update _index.json files)
  5. Run generate-sitemap.js (update sitemap + robots.txt)
  6. Upload artifact (entire repo minus .github/)
  7. Deploy to GitHub Pages
- Set proper permissions (pages write, id-token write)
- Environment: github-pages

---

FILE 2: vercel.json

Vercel deployment config:
- No build step (static site)
- Rewrites: /device/* → /device-detail.html, /rom/* → /rom-detail.html, etc.
- Headers: Cache-Control for assets (1 year for CSS/JS, 1 hour for HTML, 5min for JSON)
- Trailing slash: false
- Clean URLs: map .html files to clean paths

---

FILE 3: sitemap.xml (initial template)

Static sitemap for main pages only (dynamic entries added by generate-sitemap.js):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url><loc>https://xiaomi-basecamp.github.io/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <!-- Device/ROM/Tool/Tutorial pages generated by script -->
</urlset>
```

---

FILE 4: robots.txt
Complete robots.txt with Sitemap reference.

---

FILE 5: README.md

Professional README with:
- Project description + screenshot placeholder
- Tech stack
- Live demo link placeholder
- Folder structure (simplified)
- How to add new device (step by step)
- How to add new ROM
- How to run build scripts
- How to deploy (GitHub Pages + Vercel)
- Contributing guide
- License (MIT)

---

FILE 6: .gitignore
Standard ignore: node_modules, .DS_Store, *.log, .env, dist/, temp/

---

FILE 7: _redirects (Netlify)
/device/* /device-detail.html 200
/rom/* /rom-detail.html 200
/tutorial/* /tutorial-detail.html 200
/search /search.html 200
/* /404.html 404
```

---

## ════════════════════════════════════
## STEP 12 — SEO & PERFORMANCE OPTIMIZATION
## ════════════════════════════════════

```
Continue building "Xiaomi Basecamp".

Add complete SEO and performance optimization to ALL HTML pages.

For each HTML page (index.html, devices.html, device-detail.html, roms.html, rom-detail.html, tools.html, tutorials.html, tutorial-detail.html, search.html, compare.html, 404.html):

SEO Meta Tags (add to every page <head>):
1. Basic meta: charset, viewport, robots (index,follow), author
2. Title: "[Page] | Xiaomi Basecamp — Firmware & ROM Xiaomi Indonesia"
3. Meta description (unique per page, 150-160 chars)
4. Open Graph: og:title, og:description, og:image, og:url, og:type, og:locale (id_ID)
5. Twitter Card: summary_large_image
6. Canonical URL
7. Language: hreflang="id"

Schema.org JSON-LD (per page type):
- index.html: WebSite schema + SiteNavigationElement
- devices.html: ItemList schema
- device-detail.html: Product schema (injected dynamically by JS)
- tutorials.html: ItemList schema
- tutorial-detail.html: HowTo schema (injected dynamically by JS)
- tools.html: ItemList schema

Performance Optimizations:
1. Preload critical fonts (Barlow Condensed, Syne, DM Mono)
2. Preload hero image on index.html
3. DNS prefetch for external resources (fonts.googleapis.com)
4. All images: loading="lazy" decoding="async"
5. CSS: critical CSS inline in <head> (first 200 lines of variables.css + minimal layout)
6. JS: defer non-critical scripts, async where appropriate
7. Resource hints: <link rel="preconnect"> for Google Fonts

Ad Placeholders (comment-only, no actual ad code):
Add these HTML comments in appropriate locations on each page:

<!-- 
  ╔══════════════════════════════════════╗
  ║  AD PLACEHOLDER — POP-UNDER         ║
  ║  Position: Page load                 ║
  ║  Script: Replace this comment with  ║
  ║  your pop-under script tag          ║
  ╚══════════════════════════════════════╝
-->

<!-- AD PLACEHOLDER — BANNER TOP (728x90 desktop / 320x50 mobile) -->
<div class="ad-container ad-banner-top" aria-hidden="true">
  <!-- Insert banner ad code here -->
</div>

<!-- AD PLACEHOLDER — NATIVE CARD (In-Feed) -->
<div class="ad-container ad-native" aria-hidden="true">
  <!-- Insert native ad card code here -->
</div>

<!-- AD PLACEHOLDER — CLICK-UNDER -->
<!-- Install click-under script tag here, before </body> -->

Add .ad-container CSS that hides the div when empty (content: '' → display: none via :empty selector).

Lighthouse checklist:
- Add lang="id" on <html>
- All images have alt text
- All buttons have aria-label
- All links have descriptive text (no "click here")
- Color contrast meets WCAG AA
- Tab order is logical
- Skip to main content link (visually hidden, accessible)
```

---

## ════════════════════════════════════
## STEP 13 — INTEGRATION & FINAL ASSEMBLY
## ════════════════════════════════════

```
This is the final integration step for "Xiaomi Basecamp".

All individual files have been created in Steps 1-12. Now integrate everything into a cohesive final build.

TASK 1: Update index.html (Final Homepage)
Take xiaomi-basecamp-homepage.html as the base and:
1. Replace all inline CSS with <link> to our CSS files (variables.css, reset.css, typography.css, animations.css, components.css)
2. Replace inline navbar HTML with a container div for navbar.js to render into
3. Remove any placeholder/hardcoded data — connect to DataLoader + home.js
4. Add all SEO meta tags from Step 12
5. Add ad placeholders from Step 12
6. Add Schema.org WebSite JSON-LD
7. Ensure all script tags load in correct order:
   - Vendor: filter-engine.js, search-engine.js, paginator.js, modal.js
   - Core: dataTransformer.js, dataLoader.js, state.js, router.js
   - Components: navbar.js, deviceCard.js, romCard.js, toolCard.js, tutorialCard.js
   - Pages: home.js
8. Keep all animations: hero particles, glow lines, floating cards, parallax

TASK 2: Update devices.html (Final)
Take devices-v2.html as base and:
1. Apply same CSS/JS modular structure
2. Ensure FilterEngine + SearchEngine + Paginator + DeviceCard all wire up correctly via devices.js
3. Add SEO meta + ad placeholders
4. Verify URL params sync (filter state in URL)
5. Ensure compare feature works (connects to state.js + compare.html)

TASK 3: Final Cross-Page Navigation Check
Verify all page links are correct:
- Device cards → device-detail.html?id={slug}
- ROM cards → rom-detail.html?id={slug}
- Tool cards → tools.html#{tool-id}
- Tutorial cards → tutorial-detail.html?id={slug}
- Compare button → compare.html?device1={id}&device2={id}
- Search bar → search.html?q={query}
- Nav brand logo → index.html

TASK 4: Create a master HTML template (template.html)
A blank page template with all includes already set up.
Developers use this to create new pages:
- All CSS links
- Navbar container
- Main content wrapper with skip-link
- Footer
- All JS in correct order
- SEO placeholder meta tags
- Ad placeholder comments

TASK 5: Performance Final Check — create scripts/build-check.js
Script that checks:
- All HTML files have title, description, canonical
- All HTML files include all required CSS/JS files
- No broken internal links (href pointing to non-existent files)
- JSON files are valid (parseable)
- All images referenced in JSON exist in assets/img/
- Print pass/fail report

TASK 6: Final File Count Verification
Output a tree of the complete project with file sizes.
Expected final count:
- 11 HTML pages
- 6 CSS files (assets/css/)
- 4 Core JS files (assets/js/core/)
- 5 Component JS files (assets/js/components/)
- 5 Page JS files (assets/js/pages/)
- 4 Vendor JS files (assets/js/vendor/)
- 4 Data directories with JSON
- 3 Build scripts
- 4 Deployment config files
- 1 README
```

---

## ═══════════════════════════════════════════
## 📌 BAGIAN F — TIPS PENGGUNAAN PROMPT
## ═══════════════════════════════════════════

### Cara Terbaik Menggunakan Prompt Ini

1. **Buat percakapan baru** untuk setiap STEP besar
2. **Upload file yang relevan** di awal percakapan:
   - Step 1-3: Upload `design-rules.md`
   - Step 4-5: Upload `devices-v2.html` + `xiaomi_devices_fixed.json`
   - Step 6-7: Upload `json-schemas.md`
   - Step 8+: Upload hasil dari step sebelumnya jika relevan

3. **Perintah tambahan yang berguna** (tambahkan di akhir setiap prompt):
   ```
   - Output setiap file secara terpisah (satu code block per file)
   - Tambahkan komentar yang jelas di setiap fungsi
   - Gunakan strict mode ('use strict') di semua JS
   - Semua error harus di-handle dengan try/catch
   ```

4. **Jika output terpotong**, lanjutkan dengan:
   ```
   Lanjutkan dari [nama file] bagian [section yang terputus].
   Jangan ulangi apa yang sudah ada, langsung lanjutkan.
   ```

5. **Urutan upload file ke repo**:
   ```
   STEP 1 → commit: "feat: CSS foundation system"
   STEP 2 → commit: "feat: core JS engines"
   STEP 3 → commit: "feat: UI components"
   STEP 4 → commit: "feat: device center pages"
   STEP 5 → commit: "feat: ROM pages"
   STEP 6 → commit: "feat: tools page"
   STEP 7 → commit: "feat: tutorial pages"
   STEP 8 → commit: "feat: utility pages"
   STEP 9 → commit: "data: JSON content"
   STEP 10 → commit: "build: scripts"
   STEP 11 → commit: "deploy: GitHub + Vercel config"
   STEP 12 → commit: "seo: meta tags + performance"
   STEP 13 → commit: "feat: final integration"
   ```

---

### Checklist Sebelum Deploy

- [ ] Semua 11 HTML pages ada dan bisa diakses
- [ ] `node scripts/validate-data.js` → 0 errors
- [ ] `node scripts/generate-index.js` → sukses
- [ ] `node scripts/generate-sitemap.js` → sitemap.xml terupdate
- [ ] Test di mobile (Chrome DevTools, 375px)
- [ ] Test semua filter di devices.html
- [ ] Test search bar dari homepage
- [ ] Test device-detail dengan beberapa device ID berbeda
- [ ] Test compare dengan 2 device
- [ ] Test 404 page (buka URL yang tidak ada)
- [ ] Lighthouse score: Performance ≥ 85, SEO ≥ 95, Accessibility ≥ 80
- [ ] GitHub Actions workflow berjalan tanpa error

---

*Xiaomi Basecamp — Project Brief v2.0 | Generated by Analysis of 11 Uploaded Files*
*Konflik: 5 ditemukan & diselesaikan | Halaman baru: 9 | JS modules: 13 | CSS files: 5*
