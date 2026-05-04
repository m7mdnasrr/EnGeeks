/* ============================================================
   CircuitForge Pro — engine.js
   Drawing engine, SI formatting, canvas utilities
   ============================================================ */

'use strict';

/* ── SI formatter ── */
window.fmtSI = function(v, u) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const av = Math.abs(v);
  if (av === 0) return `0 ${u}`;
  if (av >= 1e9)  return `${(v/1e9).toPrecision(4)} G${u}`;
  if (av >= 1e6)  return `${(v/1e6).toPrecision(4)} M${u}`;
  if (av >= 1e3)  return `${(v/1e3).toPrecision(4)} k${u}`;
  if (av >= 1)    return `${v.toPrecision(4)} ${u}`;
  if (av >= 1e-3) return `${(v*1e3).toPrecision(4)} m${u}`;
  if (av >= 1e-6) return `${(v*1e6).toPrecision(4)} μ${u}`;
  if (av >= 1e-9) return `${(v*1e9).toPrecision(4)} n${u}`;
  return `${(v*1e12).toPrecision(4)} p${u}`;
};

/* ── Canvas draw context factory ── */
window.drawCtx = function(ctx) {
  const c = ctx;
  const clrWire = '#00d4ff';
  const clrComp = '#94a3b8';
  const clrNode = '#00d4ff';
  const clrText = '#e8edf5';
  const clrText2 = '#8899b4';
  const clrDim = '#4d5f7a';
  const clrWarn = '#f59e0b';
  const clrGood = '#10b981';
  const clrVal = '#fbbf24';

  function wire(x1, y1, x2, y2) {
    c.strokeStyle = clrWire; c.lineWidth = 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }

  function node(x, y) {
    c.fillStyle = clrNode;
    c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
  }

  function ground(x, y) {
    wire(x, y, x, y + 12);
    c.strokeStyle = clrComp; c.lineWidth = 2;
    [[0, 0, 20],[0, 6, 14],[0, 11, 8]].forEach(([, dy, w]) => {
      c.beginPath(); c.moveTo(x - w/2, y + 12 + dy); c.lineTo(x + w/2, y + 12 + dy); c.stroke();
    });
  }

  function resistor(x, y, label, val, isV = false) {
    c.save(); c.translate(x, y);
    if (isV) c.rotate(Math.PI / 2);
    c.strokeStyle = clrComp; c.lineWidth = 2; c.setLineDash([]);
    c.beginPath();
    c.moveTo(-28, 0); c.lineTo(-22, -9); c.lineTo(-12, 9);
    c.lineTo(-2, -9); c.lineTo(8, 9); c.lineTo(18, -9); c.lineTo(28, 0);
    c.stroke();
    c.restore();
    c.setLineDash([]);
    if (isV) {
      c.fillStyle = clrText; c.font = '11px DM Sans'; c.fillText(label, x + 12, y - 2);
      c.fillStyle = clrVal; c.font = 'bold 10px Space Mono'; c.fillText(val, x + 12, y + 12);
    } else {
      c.fillStyle = clrText; c.font = '11px DM Sans'; c.fillText(label, x - 14, y - 14);
      c.fillStyle = clrVal; c.font = 'bold 10px Space Mono'; c.fillText(val, x - 14, y + 23);
    }
  }

  function capacitor(x, y, label, val, isV = false) {
    c.save(); c.translate(x, y);
    if (isV) c.rotate(Math.PI / 2);
    c.strokeStyle = clrComp; c.lineWidth = 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(-5, 0); c.stroke();
    c.beginPath(); c.moveTo(5, 0); c.lineTo(15, 0); c.stroke();
    c.beginPath(); c.moveTo(-5, -11); c.lineTo(-5, 11); c.stroke();
    c.beginPath(); c.moveTo(5, -11); c.lineTo(5, 11); c.stroke();
    c.restore();
    c.setLineDash([]);
    if (isV) {
      c.fillStyle = clrText; c.font = '11px DM Sans'; c.fillText(label, x + 12, y - 2);
      c.fillStyle = clrVal; c.font = 'bold 10px Space Mono'; c.fillText(val, x + 12, y + 12);
    } else {
      c.fillStyle = clrText; c.font = '11px DM Sans'; c.fillText(label, x - 14, y - 16);
      c.fillStyle = clrVal; c.font = 'bold 10px Space Mono'; c.fillText(val, x - 14, y + 23);
    }
  }

  function inductor(x, y, label, val) {
    c.strokeStyle = clrComp; c.lineWidth = 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x - 30, y);
    for (let i = 0; i < 4; i++) c.arc(x - 15 + i * 10, y, 5, Math.PI, 0, false);
    c.moveTo(x + 25, y); c.lineTo(x + 30, y); c.stroke();
    c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x - 30, y); c.stroke();
    // lead wires
    wire(x - 45, y, x - 30, y); wire(x + 30, y, x + 45, y);
    c.fillStyle = clrText; c.font = '11px DM Sans'; c.fillText(label, x - 14, y - 16);
    c.fillStyle = clrVal; c.font = 'bold 10px Space Mono'; c.fillText(val, x - 14, y + 23);
  }

  function diode(x, y, reversed = false) {
    c.save(); c.translate(x, y);
    if (reversed) c.rotate(Math.PI);
    c.strokeStyle = clrComp; c.lineWidth = 2; c.fillStyle = clrComp; c.setLineDash([]);
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(-5, 0); c.stroke();
    c.beginPath(); c.moveTo(5, 0); c.lineTo(15, 0); c.stroke();
    c.beginPath(); c.moveTo(-5, -10); c.lineTo(-5, 10); c.stroke();
    c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 10); c.lineTo(5, -10); c.closePath(); c.fill();
    c.restore();
  }

  function zener(x, y) {
    c.save(); c.translate(x, y);
    c.strokeStyle = clrComp; c.lineWidth = 2; c.fillStyle = clrComp; c.setLineDash([]);
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(-5, 0); c.stroke();
    c.beginPath(); c.moveTo(5, 0); c.lineTo(15, 0); c.stroke();
    c.beginPath(); c.moveTo(-5, -10); c.lineTo(-5, 10);
    c.moveTo(-8, -10); c.lineTo(-5, -10);
    c.moveTo(5, 10); c.lineTo(8, 10); c.stroke();
    c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 10); c.lineTo(5, -10); c.closePath(); c.fill();
    c.restore();
  }

  function opamp(x, y, lbl = '') {
    c.strokeStyle = clrComp; c.lineWidth = 2; c.setLineDash([]);
    c.save(); c.translate(x, y);
    c.beginPath(); c.moveTo(-40, -40); c.lineTo(40, 0); c.lineTo(-40, 40); c.closePath();
    c.strokeStyle = clrComp; c.stroke();
    c.fillStyle = 'rgba(22,27,39,0.9)'; c.fill();
    c.fillStyle = '#e8edf5'; c.font = 'bold 14px DM Sans';
    c.fillText('−', -25, -10); c.fillText('+', -25, 20);
    if (lbl) { c.font = 'bold 10px Space Mono'; c.fillStyle = '#a78bfa'; c.fillText(lbl, -6, 4); }
    c.restore();
    wire(x - 80, y - 20, x - 40, y - 20);
    wire(x - 80, y + 20, x - 40, y + 20);
    wire(x + 40, y, x + 60, y);
  }

  function portLabel(x, y, text, color = clrText) {
    c.fillStyle = color; c.font = 'bold 12px DM Sans'; c.fillText(text, x, y);
  }

  function labelSmall(x, y, text, color = clrDim) {
    c.fillStyle = color; c.font = '10px Space Mono'; c.fillText(text, x, y);
  }

  function currentArrow(x, y, label, color = clrWarn) {
    c.strokeStyle = color; c.lineWidth = 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20, y);
    c.lineTo(x + 14, y - 5); c.moveTo(x + 20, y); c.lineTo(x + 14, y + 5); c.stroke();
    c.fillStyle = color; c.font = 'bold 10px Space Mono';
    c.fillText(label, x, y - 8);
  }

  return {
    ctx: c,
    wire, node, ground, resistor, capacitor, inductor, diode, zener, opamp,
    portLabel, labelSmall, currentArrow,
    clrWire, clrComp, clrNode, clrText, clrText2, clrDim, clrWarn, clrGood, clrVal
  };
};

/* ── Canvas utilities ── */
window.CanvasUtils = {
  zoom: 1,
  showGrid: true,

  drawGrid(canvas, ctx) {
    if (!this.showGrid) return;
    ctx.strokeStyle = 'rgba(0,212,255,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  },

  applyZoom(f) {
    this.zoom = Math.max(0.3, Math.min(3, this.zoom * f));
    const canvas = document.getElementById('circuitCanvas');
    canvas.style.transform = `scale(${this.zoom})`;
    canvas.style.transformOrigin = 'center center';
  },

  resetZoom() {
    this.zoom = 1;
    const canvas = document.getElementById('circuitCanvas');
    canvas.style.transform = 'scale(1)';
  },

  toggleGrid() {
    this.showGrid = !this.showGrid;
  }
};
