/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  deviceDetail.js — Xiaomi Basecamp Page Logic v1.0             ║
 * ║  Loads device by ?id= URL param, populates all detail sections ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

'use strict';

(async function DeviceDetailInit() {

  /* ── NAVBAR ─────────────────────────────────────────────── */
  Navbar.init('nav-root');

  /* ── GET DEVICE ID FROM URL ──────────────────────────────── */
  const params = new URLSearchParams(window.location.search);
  const deviceId = params.get('id');

  if (!deviceId) {
    showNotFound();
    return;
  }

  /* ── LOAD DEVICE DATA ────────────────────────────────────── */
  let device;
  try {
    device = await DataLoader.getDevice(deviceId);
  } catch (e) {
    console.error('[deviceDetail.js] Load error:', e);
  }

  if (!device) {
    showNotFound();
    return;
  }

  /* ── TRACK RECENTLY VIEWED ───────────────────────────────── */
  try {
    const recent = JSON.parse(localStorage.getItem('xb_recent_devices') || '[]');
    const filtered = recent.filter(id => id !== device.id).slice(0, 9);
    filtered.unshift(device.id);
    localStorage.setItem('xb_recent_devices', JSON.stringify(filtered));
    State.dispatch('ADD_RECENT', device.id);
  } catch (_) {}

  /* ── UPDATE SEO META ─────────────────────────────────────── */
  document.title = `${device.name} — Xiaomi Basecamp`;
  const ogTitle = document.getElementById('og-title');
  const ogDesc  = document.getElementById('og-desc');
  if (ogTitle) ogTitle.setAttribute('content', `${device.name} | Xiaomi Basecamp`);
  if (ogDesc)  ogDesc.setAttribute('content',  `Spesifikasi ${device.name}: ${device.chipset}, ${device.ram_display} RAM, Android ${device.android_version}`);

  /* ── SHOW CONTENT ────────────────────────────────────────── */
  document.getElementById('dd-loading').hidden = true;
  document.getElementById('dd-content').hidden = false;

  /* ══════════════════════════════════════════════════════════
     § 1  HERO SECTION
     ══════════════════════════════════════════════════════════ */
  populateHero(device);

  /* ══════════════════════════════════════════════════════════
     § 2  SPECS TABLE
     ══════════════════════════════════════════════════════════ */
  populateSpecs(device);

  /* ══════════════════════════════════════════════════════════
     § 3  MODDING STATUS
     ══════════════════════════════════════════════════════════ */
  populateModding(device);

  /* ══════════════════════════════════════════════════════════
     § 4  AVAILABLE ROMs
     ══════════════════════════════════════════════════════════ */
  populateRoms(device);

  /* ══════════════════════════════════════════════════════════
     § 5  COMMUNITY LINKS
     ══════════════════════════════════════════════════════════ */
  populateCommunity(device);

  /* ════════════════════════════════════════════════════════════
     SECTION POPULATORS
     ════════════════════════════════════════════════════════════ */

  function populateHero(d) {
    // Breadcrumb
    const bcEl = document.getElementById('bc-device-name');
    if (bcEl) bcEl.textContent = d.name;

    // Series + name
    const seriesEl = document.getElementById('device-series');
    const nameEl   = document.getElementById('device-name');
    if (seriesEl) seriesEl.textContent = d.series || d.brand;
    if (nameEl)   nameEl.textContent   = d.name;

    // Badges
    const badgesEl = document.getElementById('device-badges');
    if (badgesEl) {
      const statusColors = {
        active: { bg: 'rgba(41,255,90,.1)', color: '#29ff5a', border: 'rgba(41,255,90,.25)' },
        legacy: { bg: 'rgba(255,165,0,.1)', color: '#ffa500', border: 'rgba(255,165,0,.25)' },
        discontinued: { bg: 'rgba(255,45,107,.1)', color: '#ff2d6b', border: 'rgba(255,45,107,.25)' },
      };
      const sc = statusColors[d.status] || statusColors.active;

      badgesEl.innerHTML = `
        <span style="font-family:'DM Mono',monospace;font-size:.72rem;padding:3px 10px;
          background:${sc.bg};border:1px solid ${sc.border};color:${sc.color};
          border-radius:6px">
          ${d.status === 'active' ? '● Active' : d.status === 'legacy' ? '◐ Legacy' : '○ EOL'}
        </span>
        ${d.codename ? `<span class="dd-codename">[${d.codename}]</span>` : ''}
        ${d.year     ? `<span style="font-family:'DM Mono',monospace;font-size:.72rem;color:var(--t3)">${d.year}</span>` : ''}
        ${d.has_hyperos ? `<span class="dd-codename" style="color:var(--amber);border-color:rgba(255,165,0,.2);background:rgba(255,165,0,.07)">HyperOS</span>` : ''}
      `;
    }

    // Quick specs
    const qsEl = document.getElementById('device-quick-specs');
    if (qsEl) {
      const pills = [
        d.chipset             ? { icon: '⚡', label: 'Chipset', val: d.chipset }        : null,
        d.ram_display         ? { icon: '💾', label: 'RAM',     val: d.ram_display }     : null,
        d.display_size        ? { icon: '📱', label: 'Display', val: `${d.display_size}" ${d.refresh_rate}Hz` } : null,
        d.battery_mah         ? { icon: '🔋', label: 'Battery', val: `${d.battery_mah}mAh` + (d.fast_charge_w ? ` • ${d.fast_charge_w}W` : '') } : null,
        d.android_version     ? { icon: '🤖', label: 'Android', val: `Android ${d.android_version}` } : null,
      ].filter(Boolean);

      qsEl.innerHTML = pills.map(p => `
        <div class="dd-spec-pill">
          <span aria-hidden="true">${p.icon}</span>
          <span style="color:var(--t3);font-size:.6rem">${p.label}</span>
          <span>${p.val}</span>
        </div>
      `).join('');
    }

    // Action buttons
    const actionsEl = document.getElementById('device-actions');
    if (actionsEl) {
      actionsEl.innerHTML = `
        <a href="/tools.html?cat=flashing" class="dd-btn-primary" aria-label="Download firmware ${d.name}">
          💾 Firmware
        </a>
        <a href="/roms.html?device=${d.id}" class="dd-btn-ghost" aria-label="Custom ROM untuk ${d.name}">
          💿 Custom ROM
        </a>
        <a href="/tools.html?cat=root" class="dd-btn-ghost" aria-label="Root tools">
          ⚡ Root Guide
        </a>
        <a href="/tutorials.html" class="dd-btn-ghost" aria-label="Tutorial">
          📖 Tutorial
        </a>
      `;
    }

    // Device image
    const imgEl = document.getElementById('device-img');
    if (imgEl) {
      imgEl.src = d.thumbnail || d.thumbnail_fallback || '/assets/img/devices/placeholder.webp';
      imgEl.alt = d.name;
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        imgEl.parentElement.innerHTML = '<div class="dd-img-placeholder" aria-hidden="true">📱</div>';
      };
    }

    // Modding score bar
    const score      = d.modding_score || 0;
    const scoreFill  = document.getElementById('score-fill');
    const scoreValue = document.getElementById('score-value');
    const scoreColor = score >= 70 ? '#29ff5a' : score >= 40 ? '#ffa500' : '#ff2d6b';

    if (scoreFill) {
      scoreFill.style.background = scoreColor;
      scoreFill.style.boxShadow  = `0 0 8px ${scoreColor}`;
      setTimeout(() => { scoreFill.style.width = score + '%'; }, 300);
    }
    if (scoreValue) {
      scoreValue.textContent = score + '/100';
      scoreValue.style.color = scoreColor;
    }
  }

  /* ── SPECS TABLE ─────────────────────────────────────────── */
  function populateSpecs(d) {
    const table = document.getElementById('specs-table');
    if (!table) return;

    const groups = [
      {
        title: '📱 Display',
        rows: [
          ['Ukuran',       d.display_size   ? `${d.display_size} inch`    : null],
          ['Tipe',         d.display_type   || null],
          ['Resolusi',     d.resolution     || null],
          ['Refresh Rate', d.refresh_rate   ? `${d.refresh_rate} Hz`      : null],
          ['Kecerahan',    d.brightness     ? `${d.brightness} nits`      : null],
          ['PPI',          d.ppi            ? `${d.ppi} ppi`              : null],
        ],
      },
      {
        title: '⚡ Processor',
        rows: [
          ['Chipset',    d.chipset      || null],
          ['Brand',      d.chipset_brand || null],
          ['CPU',        d.cpu          || null],
          ['GPU',        d.gpu          || null],
          ['Proses',     d.process_nm   ? `${d.process_nm}nm`            : null],
        ],
      },
      {
        title: '💾 Memory',
        rows: [
          ['RAM',     d.ram_display     || null],
          ['Storage', d.storage_display || null],
        ],
      },
      {
        title: '📷 Camera',
        rows: [
          ['Main',       d.camera_main      ? `${d.camera_main} MP`      : null],
          ['Ultrawide',  d.camera_ultrawide ? `${d.camera_ultrawide} MP` : null],
          ['Macro',      d.camera_macro     ? `${d.camera_macro} MP`     : null],
          ['Front',      d.camera_front     ? `${d.camera_front} MP`     : null],
          ['Aperture',   d.camera_aperture  || null],
          ['Video',      d.camera_video     || null],
        ],
      },
      {
        title: '🔋 Battery',
        rows: [
          ['Kapasitas',       d.battery_mah       ? `${d.battery_mah} mAh` : null],
          ['Charging Kabel',  d.fast_charge_w     ? `${d.fast_charge_w}W`  : null],
          ['Wireless Charge', d.wireless_charge   ? (d.wireless_charge_w ? `${d.wireless_charge_w}W` : 'Ya') : 'Tidak'],
        ],
      },
      {
        title: '📡 Connectivity',
        rows: [
          ['5G',        d.fiveg    ? '✓ Ya' : '✗ Tidak'],
          ['NFC',       d.nfc      ? '✓ Ya' : '✗ Tidak'],
          ['WiFi',      d.wifi     || null],
          ['Bluetooth', d.bluetooth ? `BT ${d.bluetooth}` : null],
          ['USB',       d.usb      || null],
        ],
      },
      {
        title: '🤖 OS',
        rows: [
          ['OS Launch',     d.os_launch     || null],
          ['OS Terbaru',    d.os_latest     || null],
          ['Android',       d.android_version ? `Android ${d.android_version}` : null],
          ['HyperOS',       d.has_hyperos   ? '✓ Supported' : '—'],
        ],
      },
    ];

    table.innerHTML = groups.map(g => {
      const validRows = g.rows.filter(([, v]) => v !== null && v !== undefined);
      if (!validRows.length) return '';
      return `
        <div class="spec-group-header" role="rowgroup">${g.title}</div>
        ${validRows.map(([k, v]) => `
          <div class="spec-row" role="row">
            <span class="spec-key" role="cell">${k}</span>
            <span class="spec-val ${v && (v.includes('✓') || v === 'Ya') ? 'highlight' : ''}" role="cell">${v}</span>
          </div>
        `).join('')}
      `;
    }).join('');
  }

  /* ── MODDING CARDS ───────────────────────────────────────── */
  function populateModding(d) {
    const grid = document.getElementById('modding-grid');
    if (!grid) return;

    const ublClass = d.bootloader_unlockable
      ? (d.ubl_method === 'official' ? 'good' : 'warn')
      : 'bad';
    const ublText  = d.bootloader_unlockable
      ? (d.ubl_method === 'official' ? 'Official (168hr)' : d.ubl_method)
      : 'Tidak Supported';

    const recoveries = (d.recovery_options || []).join(', ') || 'Tidak ada';
    const roots      = (d.root_options     || []).join(', ') || 'Tidak ada';

    grid.innerHTML = `
      <div class="modding-card">
        <p class="modding-card-title">Bootloader Unlock</p>
        <p class="modding-card-value ${ublClass}">${ublText}</p>
        ${d.bootloader_unlockable ? `
          <div class="modding-tags">
            <span class="modding-tag modding-tag-acid">${d.ubl_method}</span>
            ${d.ubl_wait_days ? `<span class="modding-tag modding-tag-volt">${d.ubl_wait_days} hari</span>` : ''}
          </div>` : ''}
      </div>

      <div class="modding-card">
        <p class="modding-card-title">Custom Recovery</p>
        <p class="modding-card-value ${d.recovery_options?.length ? 'good' : 'bad'}">${recoveries}</p>
        ${d.recovery_options?.length ? `
          <div class="modding-tags">
            ${d.recovery_options.map(r => `<span class="modding-tag modding-tag-volt">${r}</span>`).join('')}
          </div>` : ''}
      </div>

      <div class="modding-card">
        <p class="modding-card-title">Root Options</p>
        <p class="modding-card-value ${d.root_options?.length ? 'good' : 'bad'}">${roots}</p>
        ${d.root_options?.length ? `
          <div class="modding-tags">
            ${d.root_options.map(r => `<span class="modding-tag modding-tag-acid">${r}</span>`).join('')}
          </div>` : ''}
      </div>

      <div class="modding-card">
        <p class="modding-card-title">Partition</p>
        <p class="modding-card-value">
          ${d.ab_partition ? 'A/B' : 'A-only'}
          ${d.treble_support ? ' • Treble' : ''}
        </p>
        <div class="modding-tags">
          ${d.treble_support  ? '<span class="modding-tag modding-tag-acid">Treble</span>' : ''}
          ${d.gsi_compatible  ? '<span class="modding-tag modding-tag-volt">GSI</span>'    : ''}
          ${d.ab_partition    ? '<span class="modding-tag modding-tag-acid">A/B</span>'    : ''}
        </div>
      </div>

      <div class="modding-card">
        <p class="modding-card-title">Kernel Source</p>
        <p class="modding-card-value ${d.kernel_source ? 'good' : 'warn'}">
          ${d.kernel_source ? 'Tersedia' : 'Tidak Tersedia'}
        </p>
        ${d.kernel_source ? `
          <div class="modding-tags">
            <a href="${d.kernel_source}" target="_blank" rel="noopener"
               class="modding-tag modding-tag-acid" style="text-decoration:none">
              ⌨ GitHub →
            </a>
          </div>` : ''}
      </div>

      <div class="modding-card">
        <p class="modding-card-title">Modding Score</p>
        <p class="modding-card-value ${d.modding_score >= 70 ? 'good' : d.modding_score >= 40 ? 'warn' : 'bad'}">
          ${d.modding_score || 0} / 100
        </p>
        <div class="modding-tags">
          <span class="modding-tag ${d.modding_score >= 60 ? 'modding-tag-acid' : 'modding-tag-volt'}">
            ${d.modding_score >= 80 ? 'Sangat Baik' : d.modding_score >= 60 ? 'Baik' : d.modding_score >= 40 ? 'Cukup' : 'Terbatas'}
          </span>
        </div>
      </div>
    `;
  }

  /* ── AVAILABLE ROMs ──────────────────────────────────────── */
  async function populateRoms(d) {
    const romsGrid = document.getElementById('device-roms-grid');
    if (!romsGrid) return;

    try {
      const allRoms = await DataLoader.getRoms();
      const deviceRoms = allRoms
        .filter(rom => (rom.supported_devices || []).includes(d.id))
        .slice(0, 6);

      if (!deviceRoms.length) {
        romsGrid.innerHTML = `
          <p style="color:var(--t3);font-family:'DM Mono',monospace;font-size:.78rem;padding:16px 0">
            Belum ada ROM yang terdaftar untuk device ini. 
            <a href="/roms.html" style="color:var(--acid)">Lihat semua ROM →</a>
          </p>`;
        return;
      }

      RomCard.renderGrid(romsGrid, deviceRoms, { compact: true });
    } catch (e) {
      romsGrid.innerHTML = `<p style="color:var(--t3);font-size:.78rem">Gagal memuat ROM.</p>`;
    }
  }

  /* ── COMMUNITY LINKS ─────────────────────────────────────── */
  function populateCommunity(d) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const links = [
      {
        label: 'XDA Thread',
        icon: '💬',
        url: d.xda_thread,
        hint: 'Diskusi di XDA Developers',
      },
      {
        label: 'Telegram Group',
        icon: '📢',
        url: d.telegram_group,
        hint: 'Komunitas Telegram',
      },
      {
        label: 'Contribute Data',
        icon: '⌨',
        url: `https://github.com/xiaomi-basecamp/portal/issues/new?title=Data+Update:+${encodeURIComponent(d.name)}`,
        hint: 'Perbaiki / tambah data via GitHub',
        alwaysEnabled: true,
      },
    ];

    grid.innerHTML = links.map(l => `
      <a
        href="${l.url || '#'}"
        class="community-btn${l.url || l.alwaysEnabled ? '' : ' disabled'}"
        ${l.url || l.alwaysEnabled ? 'target="_blank" rel="noopener noreferrer"' : ''}
        aria-label="${l.label}${!l.url && !l.alwaysEnabled ? ' (tidak tersedia)' : ''}"
        title="${l.hint}"
      >
        <span aria-hidden="true">${l.icon}</span>
        ${l.label}
        ${!l.url && !l.alwaysEnabled ? '<span style="font-size:.65rem;color:var(--t4)"> • N/A</span>' : ''}
      </a>
    `).join('');
  }

  /* ── NOT FOUND ───────────────────────────────────────────── */
  function showNotFound() {
    document.getElementById('dd-loading').hidden  = true;
    document.getElementById('dd-not-found').hidden = false;
    document.title = 'Device Tidak Ditemukan — Xiaomi Basecamp';
  }

})();
