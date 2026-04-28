/**
 * compare.js — Xiaomi Basecamp v1.0
 * Side-by-side device comparison with winner highlights
 */
'use strict';

(async function ComparePageInit() {
  Navbar.init('nav-root');

  const $ = id => document.getElementById(id);

  let allDevices = [];
  let selected   = [null, null]; // [device1, device2]

  const COMPARE_ROWS = [
    { section: '📱 Display' },
    { label: 'Ukuran',        field: 'display_size',    fmt: v => v ? `${v}"` : '—',            win: 'none'    },
    { label: 'Tipe',          field: 'display_type',    fmt: v => v || '—',                       win: 'none'    },
    { label: 'Refresh Rate',  field: 'refresh_rate',    fmt: v => v ? `${v} Hz` : '—',           win: 'higher'  },
    { section: '⚡ Processor' },
    { label: 'Chipset',       field: 'chipset',         fmt: v => v || '—',                       win: 'none'    },
    { label: 'Chipset Brand', field: 'chipset_brand',   fmt: v => v || '—',                       win: 'none'    },
    { section: '💾 Memory' },
    { label: 'RAM',           field: 'ram',             fmt: v => (v||[]).length ? `${Math.max(...v)} GB` : '—', win: 'higher_num' },
    { label: 'Storage',       field: 'storage',         fmt: v => (v||[]).length ? `${Math.max(...v)} GB` : '—', win: 'higher_num' },
    { section: '📷 Camera' },
    { label: 'Main Camera',   field: 'camera_main',     fmt: v => v ? `${v} MP` : '—',           win: 'higher'  },
    { label: 'Front Camera',  field: 'camera_front',    fmt: v => v ? `${v} MP` : '—',           win: 'higher'  },
    { section: '🔋 Battery' },
    { label: 'Kapasitas',     field: 'battery_mah',     fmt: v => v ? `${v} mAh` : '—',         win: 'higher'  },
    { label: 'Fast Charge',   field: 'fast_charge_w',   fmt: v => v ? `${v}W` : '—',            win: 'higher'  },
    { label: 'Wireless',      field: 'wireless_charge', fmt: v => v ? '✓' : '✗',                win: 'bool'    },
    { section: '📡 Connectivity' },
    { label: '5G',            field: 'fiveg',           fmt: v => v ? '✓' : '✗',                win: 'bool'    },
    { label: 'NFC',           field: 'nfc',             fmt: v => v ? '✓' : '✗',                win: 'bool'    },
    { section: '🤖 OS & Modding' },
    { label: 'Android',       field: 'android_version', fmt: v => v ? `Android ${v}` : '—',     win: 'higher'  },
    { label: 'HyperOS',       field: 'has_hyperos',     fmt: v => v ? '✓' : '✗',                win: 'bool'    },
    { label: 'UBL Support',   field: 'bootloader_unlockable', fmt: v => v ? '✓' : '✗',          win: 'bool'    },
    { label: 'Modding Score', field: 'modding_score',   fmt: null,                                win: 'higher', special: 'score' },
    { label: 'Recovery',      field: 'recovery_options',fmt: v => (v||[]).join(', ') || '—',     win: 'none'    },
    { label: 'Root Options',  field: 'root_options',    fmt: v => (v||[]).join(', ') || '—',     win: 'none'    },
  ];

  function getVal(device, field) {
    if (field === 'ram' || field === 'storage') {
      const arr = device[field] || [];
      return arr.length ? Math.max(...arr) : 0;
    }
    return device[field];
  }

  function isWinner(a, b, row) {
    if (row.win === 'none') return [false, false];
    const va = getVal(a, row.field);
    const vb = getVal(b, row.field);
    if (row.win === 'higher' || row.win === 'higher_num') {
      if (va > vb) return [true, false];
      if (vb > va) return [false, true];
    }
    if (row.win === 'bool') {
      if (va && !vb) return [true, false];
      if (vb && !va) return [false, true];
    }
    return [false, false];
  }

  /* ── RENDER COMPARE TABLE ────────────────────────────────── */
  function renderCompare(d1, d2) {
    const out = $('compare-output');
    if (!out) return;

    let html = `<div class="cmp-table">`;

    // Device header
    html += `
      <div class="cmp-device-header" role="row">
        <div class="label-col" style="font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:2px;text-transform:uppercase;color:var(--t3)">Spec</div>
        ${[d1, d2].map(d => `
          <div class="cmp-device-col">
            <img class="cmp-device-img" src="${d.thumbnail||'/assets/img/devices/placeholder.webp'}" alt="${d.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="cmp-device-name">${d.name}</div>
            <div class="cmp-device-codename">[${d.codename||'?'}] · ${d.year||''}</div>
          </div>`).join('')}
      </div>`;

    COMPARE_ROWS.forEach(row => {
      if (row.section) {
        html += `
          <div class="cmp-section-row" role="rowgroup">
            <div class="cmp-section-label" style="grid-column:1/-1">${row.section}</div>
          </div>`;
        return;
      }

      const [w1, w2] = isWinner(d1, d2, row);

      if (row.special === 'score') {
        const s1 = d1.modding_score || 0, s2 = d2.modding_score || 0;
        const c1 = s1 >= 70 ? '#29ff5a' : s1 >= 40 ? '#ffa500' : '#ff2d6b';
        const c2 = s2 >= 70 ? '#29ff5a' : s2 >= 40 ? '#ffa500' : '#ff2d6b';
        html += `
          <div class="cmp-row" role="row">
            <div class="cmp-row-label" role="cell">${row.label}</div>
            ${[{s:s1,c:c1,w:w1},{s:s2,c:c2,w:w2}].map(({s,c,w}) => `
              <div class="cmp-row-val${w?' winner':''}" role="cell">
                <div class="cmp-score-wrap">
                  <div class="cmp-score-track"><div class="cmp-score-fill" style="width:${s}%;background:${c};box-shadow:0 0 8px ${c}"></div></div>
                  <span class="cmp-score-num" style="color:${c}">${s}/100</span>
                </div>
              </div>`).join('')}
          </div>`;
        return;
      }

      const v1 = row.fmt(getVal(d1, row.field));
      const v2 = row.fmt(getVal(d2, row.field));

      const valClass = v => v === '✓' ? 'cmp-yes' : v === '✗' ? 'cmp-no' : '';

      html += `
        <div class="cmp-row" role="row">
          <div class="cmp-row-label" role="cell">${row.label}</div>
          <div class="cmp-row-val${w1?' winner':''} ${valClass(v1)}" role="cell">${v1}</div>
          <div class="cmp-row-val${w2?' winner':''} ${valClass(v2)}" role="cell">${v2}</div>
        </div>`;
    });

    html += `</div>`;
    out.innerHTML = html;

    // Animate score bars
    setTimeout(() => {
      out.querySelectorAll('.cmp-score-fill').forEach(el => {
        const w = el.style.width; el.style.width = '0%';
        setTimeout(() => { el.style.width = w; }, 100);
      });
    }, 50);

    // Update URL
    if (typeof Router !== 'undefined') {
      Router.setParams({ device1: d1.id, device2: d2.id });
    }
  }

  /* ── DEVICE PICKER ───────────────────────────────────────── */
  function buildPicker(slotIdx) {
    const input = $(`picker-${slotIdx + 1}`);
    const dd    = $(`dd-${slotIdx + 1}`);
    const slot  = $(`slot-${slotIdx + 1}`);
    if (!input || !dd) return;

    let debTimer;
    input.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      clearTimeout(debTimer);
      debTimer = setTimeout(() => showDropdown(q, dd, slotIdx), 180);
    });
    input.addEventListener('focus', () => showDropdown(input.value.toLowerCase(), dd, slotIdx));
    document.addEventListener('click', e => {
      if (!slot.contains(e.target)) dd.classList.remove('open');
    });
  }

  function showDropdown(q, dd, slotIdx) {
    const matches = q
      ? allDevices.filter(d => (d.name + ' ' + d.codename + ' ' + d.series).toLowerCase().includes(q)).slice(0, 8)
      : allDevices.slice(0, 8);

    dd.innerHTML = matches.map(d => `
      <div class="picker-option" data-id="${d.id}" data-slot="${slotIdx}" role="option" tabindex="0">
        <div>${d.name}</div>
        <div class="picker-option-sub">[${d.codename||'?'}] · ${d.chipset||''}</div>
      </div>`).join('');

    dd.classList.toggle('open', matches.length > 0);

    dd.querySelectorAll('.picker-option').forEach(opt => {
      opt.addEventListener('click', () => selectDevice(opt.dataset.id, parseInt(opt.dataset.slot)));
      opt.addEventListener('keydown', e => { if (e.key === 'Enter') selectDevice(opt.dataset.id, parseInt(opt.dataset.slot)); });
    });
  }

  function selectDevice(id, slotIdx) {
    const device = allDevices.find(d => d.id === id);
    if (!device) return;
    selected[slotIdx] = device;

    const input = $(`picker-${slotIdx + 1}`);
    const dd    = $(`dd-${slotIdx + 1}`);
    const slot  = $(`slot-${slotIdx + 1}`);

    if (input) input.value = device.name;
    dd?.classList.remove('open');

    // Show selected state
    if (slot) {
      slot.classList.add('filled');
      const removeBtn = slot.querySelector('.picker-remove') || createRemoveBtn(slot, slotIdx);
      if (!slot.querySelector('.picker-selected')) {
        const sel = document.createElement('div');
        sel.className = 'picker-selected';
        sel.innerHTML = `
          <div>
            <div class="picker-selected-name">${device.name}</div>
            <div class="picker-selected-sub">[${device.codename||'?'}] · ${device.chipset||''}</div>
          </div>`;
        slot.insertBefore(sel, slot.querySelector('.picker-search-wrap'));
      }
    }

    if (selected[0] && selected[1]) renderCompare(selected[0], selected[1]);
    else $('cmp-prompt')?.style && ($('cmp-prompt').style.display = '');
  }

  function createRemoveBtn(slot, slotIdx) {
    const btn = document.createElement('button');
    btn.className = 'picker-remove'; btn.textContent = '✕ Remove';
    btn.addEventListener('click', () => {
      selected[slotIdx] = null;
      slot.classList.remove('filled');
      slot.querySelector('.picker-selected')?.remove();
      btn.remove();
      const input = $(`picker-${slotIdx+1}`);
      if (input) input.value = '';
      $('compare-output').innerHTML = `<div class="cmp-state" id="cmp-prompt"><div class="cmp-state-icon">⇄</div><p class="cmp-state-text">Pilih 2 device untuk membandingkan</p></div>`;
      if (typeof Router !== 'undefined') Router.setParams({ device1: null, device2: null });
    });
    slot.appendChild(btn);
    return btn;
  }

  /* ── SHARE ───────────────────────────────────────────────── */
  $('btn-share')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const btn = $('btn-share');
      if (btn) { const orig = btn.textContent; btn.textContent = '✓ Link Tersalin!'; setTimeout(() => { btn.textContent = orig; }, 2000); }
    } catch(_) {}
  });

  /* ── LOAD DATA & INIT ────────────────────────────────────── */
  try {
    allDevices = await DataLoader.getDevices();
    buildPicker(0); buildPicker(1);

    // Restore from URL
    const params = new URLSearchParams(window.location.search);
    const d1id = params.get('device1') || params.get('d1');
    const d2id = params.get('device2') || params.get('d2');
    if (d1id) selectDevice(d1id, 0);
    if (d2id) selectDevice(d2id, 1);

    // Also restore from State compareList
    const compareList = typeof State !== 'undefined' ? (State.get('compareList') || []) : [];
    if (!d1id && compareList[0]) selectDevice(compareList[0], 0);
    if (!d2id && compareList[1]) selectDevice(compareList[1], 1);

  } catch(err) { console.error('[compare.js]', err); }
})();
