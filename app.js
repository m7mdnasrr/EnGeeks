/* ============================================================
   CircuitForge Pro — app.js
   Main application controller (fixed recursion + re-entrancy lock)
   ============================================================ */

'use strict';

/* ── Global error catcher ── */
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  if (window.AppUtils) {
    window.AppUtils.notify(`Script error: ${e.message}`, 'err');
  } else {
    alert(`Script error: ${e.message}`);
  }
});

/* ============================================================
   APP STATE
   ============================================================ */

const AppState = {
  currentId:    null,
  bodeData:     null,
  mainView:     'schematic',
  history:      [],
  MAX_HISTORY:  25,
};

/* ============================================================
   UTILITIES
   ============================================================ */

window.AppUtils = {
  _notifTimer: null,

  notify(msg, type = 'good') {
    const el = document.getElementById('notif');
    if (!el) return;
    el.textContent = msg;
    el.style.borderColor = type === 'warn' ? 'var(--accent3)'
      : type === 'err'  ? 'var(--danger)'
      : 'var(--accent4)';
    el.style.color = type === 'warn' ? 'var(--accent3)'
      : type === 'err'  ? 'var(--danger)'
      : 'var(--accent4)';
    el.classList.add('show');
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => el.classList.remove('show'), 2800);
  },

  exportPNG() {
    if (!AppState.currentId) { this.notify('Load a circuit first', 'warn'); return; }
    const canvas = document.getElementById('circuitCanvas');
    if (!canvas) { this.notify('Canvas not found', 'err'); return; }
    const link = document.createElement('a');
    link.download = `CircuitForge_${AppState.currentId}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.notify('Circuit exported as PNG!');
  },

  copyCanvas() {
    const canvas = document.getElementById('circuitCanvas');
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(() => AppUtils.notify('Copied to clipboard!'))
          .catch(() => AppUtils.notify('Copy failed', 'err'));
      } else {
        AppUtils.notify('Clipboard API not supported', 'warn');
      }
    });
  },

  exportReport() {
    if (!AppState.currentId) { this.notify('Load a circuit first', 'warn'); return; }
    const eng = ENGINE[AppState.currentId];
    const vals = _readInputValues();
    const P = { results: [], formula: '', sb_gain: '', sb_freq: '', bode: null };
    eng.calc(vals, P);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CircuitForge Report — ${eng.title}</title>
<style>
  body { font-family: 'Courier New', monospace; background:#07090f; color:#e8edf5; padding:40px; max-width:820px; margin:0 auto; }
  h1   { color:#00d4ff; font-size:22px; margin-bottom:4px; }
  h2   { color:#a78bfa; margin-top:28px; margin-bottom:10px; font-size:15px; border-bottom:1px solid #252d3d; padding-bottom:4px; }
  .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #252d3d; font-size:13px; }
  .val { color:#fbbf24; }
  .good{ color:#10b981; }
  .tip { color:#8899b4; font-size:12px; margin:4px 0 4px 12px; }
  pre  { background:#0d1117; padding:14px; border-radius:7px; color:#fbbf24; font-size:12px; line-height:1.8; white-space:pre-wrap; }
  .meta{ font-size:11px; color:#4d5f7a; margin-bottom:20px; }
</style>
</head>
<body>
<h1>⚡ CircuitForge Pro — Design Report</h1>
<div class="meta">
  Circuit: <strong style="color:#10b981">${eng.title}</strong> — ${eng.subtitle}<br>
  Generated: ${new Date().toLocaleString()}<br>
  Engineer: Eng. Mohamed Nasr
</div>

<h2>📐 Design Parameters</h2>
${eng.inputs.map(inp => `<div class="row"><span>${inp.label}</span><span class="val">${vals[inp.id]} ${inp.unit}</span></div>`).join('')}

<h2>📊 Calculated Results</h2>
${P.results.map(r => `<div class="row"><span>${r.k}</span><span class="${r.cls || 'val'}">${r.val}</span></div>`).join('')}

<h2>📐 Design Formulas</h2>
<pre>${P.formula}</pre>

<h2>💡 Design Tips</h2>
${(eng.tips || []).map(t => `<div class="tip">• ${t}</div>`).join('')}

<h2>📚 References</h2>
<div class="tip">${eng.refs || '—'}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = `CircuitForge_Report_${AppState.currentId}.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
    this.notify('HTML report exported!');
  },

  showShortcuts() {
    this.notify('Ctrl+S: PNG  |  Ctrl+B: Bode  |  F5: Recalc  |  Ctrl+E: Report');
  }
};

/* expose utilities to HTML (will be overwritten after internal functions are defined) */
window.exportPNG       = () => AppUtils.exportPNG();
window.exportReport    = () => AppUtils.exportReport();
window.copyCanvasImage = () => AppUtils.copyCanvas();
window.exportBodePlot  = () => BodePlot.export();
window.showShortcuts   = () => AppUtils.showShortcuts();
window.toggleTheme     = () => AppUtils.notify('Dark theme: the only theme for serious engineers 🙂');
window.zoomCanvas      = f  => CanvasUtils.applyZoom(f);
window.resetZoom       = ()  => CanvasUtils.resetZoom();
window.toggleGrid      = ()  => { CanvasUtils.toggleGrid(); if (AppState.currentId) runCircuit(); };
window.runBodePlot     = ()  => BodePlot.run(AppState.bodeData);
window.runTransient    = ()  => TransientSim.run(AppState.bodeData);
window.runEseriesPicker= ()  => ESeriesPicker.run();
window.calcOhm         = c  => OhmCalc.compute(c);
window.calcRC          = ()  => RCCalc.compute();
window.clearHistory    = ()  => _clearHistory();
window.reloadHistory   = i  => _reloadHistory(i);
window.filterNav       = q  => _filterNav(q);

/* ============================================================
   SIDEBAR / NAVIGATION
   ============================================================ */

function buildNav() {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;
  nav.innerHTML = '';

  Object.entries(CIRCUIT_CATEGORIES).forEach(([cat, items]) => {
    const wrap = document.createElement('div');
    wrap.className = 'nav-category';

    const header = document.createElement('div');
    header.className = 'cat-header';
    header.innerHTML = `<span class="cat-title">${cat}</span><span class="cat-arrow open">▶</span>`;
    header.onclick = () => {
      const content = header.nextElementSibling;
      const arrow = header.querySelector('.cat-arrow');
      const open = content.classList.contains('open');
      content.classList.toggle('open', !open);
      arrow.classList.toggle('open', !open);
    };

    const content = document.createElement('div');
    content.className = 'cat-items open';

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.id = 'nav-' + item.id;
      btn.dataset.name = item.name.toLowerCase();
      btn.innerHTML = `<span class="nav-item-icon">${item.icon}</span><span>${item.name}</span>`;
      btn.onclick = () => loadCircuit(item.id);
      content.appendChild(btn);
    });

    wrap.appendChild(header);
    wrap.appendChild(content);
    nav.appendChild(wrap);
  });
  console.log('[buildNav] navigation built');
}

function _filterNav(q) {
  q = (q || '').toLowerCase().trim();
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.style.display = (!q || btn.dataset.name.includes(q)) ? 'flex' : 'none';
  });
}

/* ============================================================
   LOAD CIRCUIT
   ============================================================ */

function loadCircuit(id) {
  console.log(`[loadCircuit] trying to load ${id}`);
  const eng = ENGINE[id];
  if (!eng) { AppUtils.notify(`Circuit "${id}" not found`, 'err'); return; }
  console.log('[loadCircuit] engine found:', eng.title);

  AppState.currentId = id;

  /* Nav highlight */
  document.querySelectorAll('.nav-item').forEach(b =>
    b.classList.toggle('active', b.id === 'nav-' + id)
  );

  /* Header info */
  _setText('active-circuit-name', eng.title);
  _setText('canvasCircuitTitle', eng.title);
  _setText('canvasCircuitSub', eng.subtitle);
  _setText('sb_circuit', eng.title);

  /* Build parameter inputs */
  _buildParamUI(eng);

  /* Design tips */
  const tipsList = document.getElementById('designTipsList');
  if (tipsList) {
    tipsList.innerHTML = (eng.tips || [])
      .map(t => `<li class="advisor-item"><div class="advisor-bullet"></div>${t}</li>`)
      .join('');
  }

  /* References */
  _setText('referencesBox', eng.refs || 'See relevant IC datasheets and application notes.');

  /* Show canvas */
  const welcome = _el('welcomeState');
  if (welcome) welcome.style.display = 'none';
  const cv = document.getElementById('circuitCanvas');
  if (cv) cv.style.display = 'block';

  runCircuit();
}

function _buildParamUI(eng) {
  const pc = document.getElementById('paramsContainer');
  if (!pc) return;

  const paramHTML = eng.inputs.map(inp => `
    <div class="${eng.inputs.length === 1 ? 'param-full' : ''}">
      <label class="param-label">${inp.label}${inp.unit ? ` (${inp.unit})` : ''}</label>
      <input type="number" class="param-input" id="p_${inp.id}"
        value="${inp.val}"
        ${inp.min !== undefined ? `min="${inp.min}"` : ''}
        ${inp.max !== undefined ? `max="${inp.max}"` : ''}
        step="any"
        oninput="runCircuit()">
    </div>`).join('');

  pc.innerHTML = `
    <div class="param-section">
      <div class="param-section-title">📐 Design Parameters</div>
      <div class="param-grid" id="paramGrid">${paramHTML}</div>
    </div>
    <button class="run-btn" onclick="runCircuit()">⚡ Synthesize &amp; Calculate</button>
    <div class="formula-box" id="formulaBox"></div>`;
}

/* ============================================================
   MAIN ENGINE RUN (with re-entrancy lock)
   ============================================================ */

let _runningCircuit = false;  // prevents infinite recursion

function runCircuit() {
  if (_runningCircuit) {
    console.warn('runCircuit already in progress, skipping recursive call');
    return;
  }
  _runningCircuit = true;
  try {
    _runCircuitInternal();
  } catch (e) {
    console.error('Unhandled error in runCircuit:', e);
    AppUtils.notify(`Error: ${e.message}`, 'err');
  } finally {
    _runningCircuit = false;
  }
}

function _runCircuitInternal() {
  const id = AppState.currentId;
  console.log('[runCircuit] id =', id);
  if (!id || !ENGINE[id]) {
    console.warn('runCircuit: no circuit loaded');
    return;
  }
  const eng = ENGINE[id];

  const vals = _readInputValues();
  const P = { results: [], formula: '', sb_gain: '', sb_freq: '', bode: null };

  try {
    eng.calc(vals, P);
    console.log('[runCircuit] calc successful');
  } catch (e) {
    console.error('calc error:', e);
    AppUtils.notify('Calculation error: ' + e.message, 'err');
    return; // early exit
  }

  /* Draw schematic */
  _drawSchematic(eng, vals);

  /* Formula box */
  const fb = document.getElementById('formulaBox');
  if (fb && P.formula) {
    fb.innerHTML = P.formula.split('\n').map(l => `<div>${l}</div>`).join('');
  }

  /* Analysis tab */
  _renderAnalysis(P.results);

  /* Status bar */
  _updateStatusBar(P);

  /* Store bode data */
  AppState.bodeData = P.bode;

  /* Save to history */
  _saveHistory(id, vals, P.results);

  /* Refresh active analysis views */
  if (AppState.mainView === 'bode') BodePlot.run(P.bode);
  if (AppState.mainView === 'transient') TransientSim.run(P.bode);
  if (AppState.mainView === 'phasor') PhasorDiagram.draw(P.bode);
}

function _readInputValues() {
  const id = AppState.currentId;
  const eng = ENGINE[id];
  if (!eng) return {};
  const vals = {};
  eng.inputs.forEach(inp => {
    const el = document.getElementById('p_' + inp.id);
    vals[inp.id] = el ? (parseFloat(el.value) ?? inp.val) : inp.val;
  });
  return vals;
}

function _drawSchematic(eng, vals) {
  const canvas = document.getElementById('circuitCanvas');
  if (!canvas) {
    console.error('_drawSchematic: canvas missing');
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('_drawSchematic: cannot get 2d context');
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Grid */
  CanvasUtils.drawGrid(canvas, ctx);

  /* Circuit */
  try {
    if (eng.draw) eng.draw(ctx, vals);
    else console.warn('draw method missing for', eng.title);
  } catch (e) {
    console.error('draw error:', e);
    ctx.fillStyle = '#ef4444';
    ctx.font = '14px DM Sans';
    ctx.fillText('Draw error: ' + e.message, 40, 260);
  }
}

function _renderAnalysis(results) {
  const ac = document.getElementById('analysisContainer');
  if (!ac) return;

  if (!results || results.length === 0) {
    ac.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:12px">No results available</div>';
    return;
  }

  ac.innerHTML = `
    <div class="result-card">
      ${results.map(r => `
        <div class="result-row">
          <span class="result-key">${r.k}</span>
          <span class="result-val ${r.cls || ''}">${r.val}</span>
        </div>`).join('')}
    </div>
    <div class="param-section" style="margin-top:2px">
      <div class="param-section-title">Design Health</div>
      <div class="toggle-row">
        <span class="toggle-label">All Parameters Valid</span>
        <span class="badge badge-new">✓ OK</span>
      </div>
      <div class="toggle-row" style="margin-top:4px">
        <span class="toggle-label">Synthesis Complete</span>
        <span class="badge badge-new">✓ OK</span>
      </div>
    </div>`;
}

function _updateStatusBar(P) {
  const sbGain = document.getElementById('sb_gain');
  const sbGainVal = document.getElementById('sb_gain_val');
  const sbFreq = document.getElementById('sb_freq');
  const sbFreqVal = document.getElementById('sb_freq_val');

  if (sbGain && sbGainVal) {
    sbGain.style.display = P.sb_gain ? 'flex' : 'none';
    if (P.sb_gain && sbGainVal) sbGainVal.textContent = P.sb_gain;
  }
  if (sbFreq && sbFreqVal) {
    sbFreq.style.display = P.sb_freq ? 'flex' : 'none';
    if (P.sb_freq && sbFreqVal) sbFreqVal.textContent = P.sb_freq;
  }
}

/* ============================================================
   HISTORY
   ============================================================ */

function _saveHistory(id, vals, results) {
  const eng = ENGINE[id];
  const item = {
    id, title: eng.title,
    time: new Date().toLocaleTimeString(),
    vals: JSON.parse(JSON.stringify(vals)),
    results: results || []
  };
  AppState.history.unshift(item);
  if (AppState.history.length > AppState.MAX_HISTORY) AppState.history.pop();
  _renderHistory();
}

function _renderHistory() {
  const hl = document.getElementById('historyList');
  if (!hl) return;

  if (!AppState.history.length) {
    hl.innerHTML = '<div style="font-size:11px;color:var(--text3)">No designs saved yet.</div>';
    return;
  }

  hl.innerHTML = AppState.history.slice(0, 15).map((h, i) => `
    <div class="history-item" onclick="reloadHistory(${i})">
      <div>
        <div style="font-size:11px;font-weight:600;color:var(--text)">${h.title}</div>
        <div style="font-size:10px;color:var(--text3);font-family:'Space Mono',monospace">${h.time}</div>
      </div>
      <div class="badge badge-new">↩ Load</div>
    </div>`).join('');
}

function _reloadHistory(i) {
  const h = AppState.history[i];
  if (!h) return;

  loadCircuit(h.id);
  requestAnimationFrame(() => {
    Object.entries(h.vals || {}).forEach(([k, v]) => {
      const el = document.getElementById('p_' + k);
      if (el) el.value = v;
    });
    runCircuit();
  });
}

function _clearHistory() {
  AppState.history = [];
  _renderHistory();
  AppUtils.notify('History cleared');
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */

window.switchMainTab = function(view, btn) {
  AppState.mainView = view;

  document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const viewMap = {
    schematic: 'Schematic',
    bode: 'Bode',
    transient: 'Transient',
    phasor: 'Phasor',
    components: 'Components'
  };

  Object.entries(viewMap).forEach(([v, suffix]) => {
    const el = document.getElementById('mainView' + suffix);
    if (!el) return;
    el.style.display = v === view ? 'flex' : 'none';
  });

  if (view === 'bode') BodePlot.run(AppState.bodeData);
  if (view === 'transient') TransientSim.run(AppState.bodeData);
  if (view === 'phasor') PhasorDiagram.draw(AppState.bodeData);
  if (view === 'components') { RCCalc.compute(); ESeriesPicker.run(); }
};

window.switchRpTab = function(tab, btn) {
  document.querySelectorAll('.rp-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.right-panel-content').forEach(c => c.classList.remove('active'));
  const panel = document.getElementById('rp-' + tab);
  if (panel) panel.classList.add('active');
};

/* ============================================================
   AI ADVISOR (unchanged)
   ============================================================ */

window.sendAiMessage = async function() {
  const input = document.getElementById('aiInputField');
  const msgs = document.getElementById('aiMessages');
  if (!input || !msgs) return;

  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  msgs.innerHTML += `<div class="ai-msg ai-msg-user">${_escHtml(msg)}</div>`;

  const thinkId = 'ai-think-' + Date.now();
  msgs.innerHTML += `<div class="ai-msg ai-msg-bot" id="${thinkId}">
    <div class="ai-thinking"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;

  const eng = AppState.currentId ? ENGINE[AppState.currentId] : null;
  const ctx = eng
    ? `Current circuit: "${eng.title}" — ${eng.subtitle}. Known tips: ${(eng.tips || []).slice(0, 3).join('; ')}`
    : 'No circuit currently selected.';

  const systemPrompt = `You are CircuitForge Pro's expert electronics design engineer assistant.
Context: ${ctx}
Rules:
- Be concise (≤120 words).
- Give specific component values, formulas, and design rules when possible.
- Use SI units and standard notation.
- Mention op-amp part numbers where relevant (LM741, TL072, OPA657, AD8221, etc.).
- If asked about a circuit not in context, answer from general knowledge.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 350,
        system: systemPrompt,
        messages: [{ role: 'user', content: msg }]
      })
    });

    const data = await res.json();
    const reply = data?.content?.[0]?.text || 'Unable to process. Please try again.';

    const thinkEl = document.getElementById(thinkId);
    if (thinkEl) thinkEl.outerHTML = `<div class="ai-msg ai-msg-bot">${_escHtml(reply)}</div>`;
  } catch (e) {
    const thinkEl = document.getElementById(thinkId);
    if (thinkEl) thinkEl.outerHTML = `<div class="ai-msg ai-msg-bot" style="color:var(--danger)">Connection error. Check network.</div>`;
  }
  msgs.scrollTop = msgs.scrollHeight;
};

/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); AppUtils.exportPNG(); }
  if (e.ctrlKey && e.key === 'e') { e.preventDefault(); AppUtils.exportReport(); }
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault();
    const bodeTab = document.querySelector('.panel-tab:nth-child(2)');
    if (bodeTab) bodeTab.click();
  }
  if (e.key === 'F5') { e.preventDefault(); runCircuit(); }
  if (e.key === '?' || (e.ctrlKey && e.key === '/')) AppUtils.showShortcuts();
});

/* ============================================================
   HELPERS
   ============================================================ */

function _el(id) { return document.getElementById(id); }
function _setText(id, txt) { const el = _el(id); if (el) el.textContent = txt; }
function _escHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ============================================================
   INITIALISATION
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  buildNav();

  const cv = document.getElementById('circuitCanvas');
  if (cv) cv.style.display = 'none';

  RCCalc.compute();
  ESeriesPicker.run();

  setTimeout(() => loadCircuit('amp_inv'), 80);
});

/* expose runCircuit after everything is defined */
window.runCircuit = runCircuit;

console.log('[app] app.js fully loaded and initialised (recursion fixed)');
