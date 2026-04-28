/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  tutorialDetail.js — Xiaomi Basecamp Page Logic v1.0           ║
 * ║  Full tutorial reading: TOC, steps, checklist, code copy,      ║
 * ║  reading progress bar, FAQ accordion, related tutorials         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
'use strict';

(async function TutorialDetailInit() {

  Navbar.init('nav-root');

  const params = new URLSearchParams(window.location.search);
  const tutId  = params.get('id');
  if (!tutId) { showNotFound(); return; }

  let tutorial;
  try { tutorial = await DataLoader.getTutorial(tutId); } catch(e) { console.error('[tutDetail]', e); }
  if (!tutorial) { showNotFound(); return; }

  // Update meta
  document.title = `${tutorial.title} — Xiaomi Basecamp`;
  document.getElementById('og-title')?.setAttribute('content', tutorial.title + ' | Xiaomi Basecamp');

  document.getElementById('td-loading').hidden = true;
  document.getElementById('td-content').hidden = false;

  buildHeader(tutorial);
  buildWarnings(tutorial);
  buildRequirements(tutorial);
  buildSteps(tutorial);
  buildTOC(tutorial);
  buildFAQ(tutorial);
  buildRelated(tutorial);
  initReadingProgress();
  initTOCScroll();

  /* ── DIFF COLORS ─────────────────────────────────────────── */
  const DIFF_COLORS = {
    Pemula:   { bg:'rgba(41,255,90,.1)',  color:'#29ff5a', border:'rgba(41,255,90,.25)'  },
    Menengah: { bg:'rgba(255,165,0,.1)',  color:'#ffa500', border:'rgba(255,165,0,.25)'  },
    Mahir:    { bg:'rgba(255,45,107,.1)', color:'#ff2d6b', border:'rgba(255,45,107,.25)' },
  };
  const dc = t => DIFF_COLORS[t.difficulty] || DIFF_COLORS.Pemula;

  /* ── HEADER ──────────────────────────────────────────────── */
  function buildHeader(t) {
    const bc = document.getElementById('bc-title');
    if (bc) bc.textContent = t.title.length > 40 ? t.title.slice(0, 40) + '...' : t.title;

    const titleEl = document.getElementById('tut-title');
    if (titleEl) titleEl.textContent = t.title;

    const metaEl = document.getElementById('tut-meta');
    if (metaEl) {
      const d = dc(t);
      metaEl.innerHTML = `
        <span class="td-badge" style="background:${d.bg};color:${d.color};border-color:${d.border}">${t.difficulty}</span>
        <span class="td-badge" style="background:rgba(0,255,224,.06);color:var(--acid);border-color:rgba(0,255,224,.2)">⏱ ${t.estimated_time}</span>
        <span class="td-badge" style="background:rgba(122,153,194,.06);color:var(--t2);border-color:rgba(122,153,194,.15)">📁 ${t.category}</span>
        <span class="td-badge" style="background:rgba(122,153,194,.06);color:var(--t3);border-color:rgba(122,153,194,.1)">👁 ${(t.views||0).toLocaleString('id-ID')} views</span>
        <span class="td-badge" style="background:rgba(122,153,194,.06);color:var(--t3);border-color:rgba(122,153,194,.1)">🗓 ${formatDate(t.updated_at)}</span>
      `;
    }

    const tagsEl = document.getElementById('tut-tags');
    if (tagsEl && t.tags) {
      tagsEl.innerHTML = t.tags.map(tag => `<span class="td-tag">${tag}</span>`).join('');
    }

    const compatEl = document.getElementById('tut-compat');
    if (compatEl) {
      const compat = t.compatibility || {};
      const parts = [];
      if (compat.devices?.[0]) parts.push(`<span class="td-compat-item">📱 <span>Device:</span> ${compat.devices[0] === 'all-xiaomi' ? 'Semua Xiaomi/Redmi/POCO' : compat.devices.join(', ')}</span>`);
      if (compat.os_pc) parts.push(`<span class="td-compat-item">💻 <span>PC OS:</span> ${compat.os_pc.join(', ')}</span>`);
      if (compat.android_min) parts.push(`<span class="td-compat-item">🤖 <span>Android:</span> ${compat.android_min}+</span>`);
      compatEl.innerHTML = parts.join('');
    }
  }

  /* ── WARNINGS ────────────────────────────────────────────── */
  function buildWarnings(t) {
    const el = document.getElementById('warnings-container');
    const section = document.getElementById('section-warnings');
    if (!el) return;
    const warns = t.warnings || [];
    if (!warns.length) { section.hidden = true; return; }
    const icons = { danger:'🚨', warning:'⚠️', info:'ℹ️' };
    const cls   = { danger:'td-warning-danger', warning:'td-warning-warning', info:'td-warning-info' };
    el.innerHTML = warns.map(w => `
      <div class="td-warning ${cls[w.level]||'td-warning-info'}" role="alert">
        <span class="td-warning-icon" aria-hidden="true">${icons[w.level]||'ℹ️'}</span>
        <span>${w.text}</span>
      </div>`).join('');
  }

  /* ── REQUIREMENTS ────────────────────────────────────────── */
  function buildRequirements(t) {
    const el = document.getElementById('requirements-list');
    if (!el) return;
    const reqs = t.requirements || [];
    const KEY  = `xb_tut_check_${t.id}`;
    let checked;
    try { checked = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { checked = new Set(); }

    el.innerHTML = reqs.map((req, i) => {
      const isChecked = checked.has(i);
      const hasDl = req.toLowerCase().includes('download') && t.steps?.find(s => s.download_link && s.step === i + 1);
      return `
        <div class="td-check-item${isChecked ? ' checked' : ''}" data-req="${i}" role="checkbox" aria-checked="${isChecked}" tabindex="0">
          <div class="td-check-box" aria-hidden="true">${isChecked ? '✓' : ''}</div>
          <span>${req}</span>
          ${hasDl ? `<a href="${hasDl.download_link.url}" target="_blank" rel="noopener" class="td-dl-link">↓ Download</a>` : ''}
        </div>`;
    }).join('');

    el.querySelectorAll('.td-check-item').forEach(item => {
      const toggle = () => {
        const idx = parseInt(item.dataset.req);
        const nowChecked = item.classList.toggle('checked');
        item.setAttribute('aria-checked', String(nowChecked));
        item.querySelector('.td-check-box').textContent = nowChecked ? '✓' : '';
        if (nowChecked) checked.add(idx); else checked.delete(idx);
        try { localStorage.setItem(KEY, JSON.stringify([...checked])); } catch(_) {}
      };
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }

  /* ── STEPS ───────────────────────────────────────────────── */
  function buildSteps(t) {
    const el = document.getElementById('steps-container');
    if (!el) return;
    const steps = t.steps || [];
    el.innerHTML = steps.map(s => `
      <article class="td-step" id="step-${s.step}" aria-labelledby="step-title-${s.step}">
        <div class="td-step-header">
          <div class="td-step-num" aria-hidden="true">${String(s.step).padStart(2,'0')}</div>
          <div>
            <h3 class="td-step-title" id="step-title-${s.step}">${s.title}</h3>
          </div>
        </div>
        <p class="td-step-content">${renderContent(s.content)}</p>
        ${s.code ? `
          <div class="td-code-block" role="region" aria-label="Code block step ${s.step}">
            <div class="td-code-header">
              <span class="td-code-lang">terminal</span>
              <button class="td-code-copy" data-code="${escHtml(s.code)}" aria-label="Copy code">Copy</button>
            </div>
            <pre><code>${escHtml(s.code)}</code></pre>
          </div>` : ''}
        ${s.tip ? `
          <div class="td-tip" role="note">
            <span class="td-tip-icon" aria-hidden="true">💡</span>
            <span>${s.tip}</span>
          </div>` : ''}
        ${s.download_link ? `
          <a href="${s.download_link.url}" target="_blank" rel="noopener noreferrer" class="td-step-dl" aria-label="${s.download_link.label}">
            ↓ ${s.download_link.label}
          </a>` : ''}
      </article>`).join('');

    // Bind copy buttons
    el.querySelectorAll('.td-code-copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.code;
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
        } catch {
          btn.textContent = 'Error';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        }
      });
    });
  }

  /* ── TABLE OF CONTENTS ───────────────────────────────────── */
  function buildTOC(t) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    const steps = t.steps || [];
    tocList.innerHTML = steps.map(s => `
      <li class="toc-item" id="toc-item-${s.step}">
        <a href="#step-${s.step}" aria-label="Langkah ${s.step}: ${s.title}">
          <span class="toc-num">${String(s.step).padStart(2,'0')}</span>
          <span>${s.title}</span>
        </a>
      </li>`).join('');

    // Smooth scroll on TOC click
    tocList.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── TOC ACTIVE ON SCROLL ────────────────────────────────── */
  function initTOCScroll() {
    if (!window.IntersectionObserver) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const id = e.target.id.replace('step-', '');
        const tocItem = document.getElementById(`toc-item-${id}`);
        if (tocItem) tocItem.classList.toggle('active', e.isIntersecting);
      });
    }, { rootMargin: '-60px 0px -70% 0px', threshold: 0 });
    document.querySelectorAll('.td-step').forEach(s => obs.observe(s));
  }

  /* ── READING PROGRESS ────────────────────────────────────── */
  function initReadingProgress() {
    const fill = document.getElementById('progress-fill');
    if (!fill) return;
    const update = () => {
      const total  = document.body.scrollHeight - window.innerHeight;
      const pct    = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0;
      fill.style.width = pct + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── FAQ ─────────────────────────────────────────────────── */
  function buildFAQ(t) {
    const el  = document.getElementById('faq-container');
    const sec = document.getElementById('section-faq');
    if (!el) return;
    const faqs = t.faq || [];
    if (!faqs.length) { sec?.remove(); return; }
    el.innerHTML = faqs.map((f, i) => `
      <div class="td-faq-item" id="faq-${i}">
        <button class="td-faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
          ${f.q}
          <span class="td-faq-arrow" aria-hidden="true">▾</span>
        </button>
        <div class="td-faq-a" id="faq-a-${i}" role="region">
          <p>${f.a}</p>
        </div>
      </div>`).join('');

    el.querySelectorAll('.td-faq-item').forEach(item => {
      item.querySelector('.td-faq-q').addEventListener('click', () => {
        const open = item.classList.toggle('open');
        item.querySelector('.td-faq-q').setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ── RELATED TUTORIALS ───────────────────────────────────── */
  async function buildRelated(t) {
    const grid = document.getElementById('related-grid');
    if (!grid) return;
    const ids = t.related_tutorials || [];
    if (!ids.length) { grid.parentElement?.remove(); return; }
    try {
      const allTuts = await DataLoader.getTutorials();
      const related = ids.map(id => allTuts.find(tu => tu.id === id)).filter(Boolean).slice(0, 3);
      if (!related.length) { grid.parentElement?.remove(); return; }
      TutorialCard.renderGrid(grid, related);
    } catch { grid.parentElement?.remove(); }
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  function renderContent(text) {
    if (!text) return '';
    return escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="font-family:var(--f-mono);background:rgba(0,255,224,.08);color:var(--acid);padding:1px 5px;border-radius:3px">$1</code>')
      .replace(/\n/g, '<br>');
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' }); }
    catch { return d; }
  }

  function showNotFound() {
    document.getElementById('td-loading').hidden  = true;
    document.getElementById('td-not-found').hidden = false;
    document.title = 'Tutorial Tidak Ditemukan — Xiaomi Basecamp';
  }

})();
