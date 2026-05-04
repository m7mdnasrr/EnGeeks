/* ============================================================
   CircuitForge Pro — charts.js
   Bode plot, transient simulator, phasor diagram,
   E-series picker, Ohm's law, RC calculator
   ============================================================ */

'use strict';

/* ── Chart instances (module-level singletons) ── */
let _bodeChartMag   = null;
let _bodeChartPhase = null;
let _transientChart = null;

/* ── Shared Chart.js default config ── */
function chartDefaults() {
  return {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#8899b4', font: { family: 'Space Mono', size: 10 } }
      },
      tooltip: {
        backgroundColor: '#161b27',
        borderColor: '#252d3d',
        borderWidth: 1,
        titleColor: '#e8edf5',
        bodyColor: '#8899b4',
        bodyFont: { family: 'Space Mono', size: 10 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(37,45,61,0.8)' },
        ticks: { color: '#8899b4', font: { family: 'Space Mono', size: 9 }, maxTicksLimit: 8 }
      },
      y: {
        grid: { color: 'rgba(37,45,61,0.8)' },
        ticks: { color: '#8899b4', font: { family: 'Space Mono', size: 9 } }
      }
    }
  };
}

/* ── Helper: destroy and recreate a chart ── */
function makeChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  return new Chart(canvas, config);
}

/* ── Frequency label formatter ── */
function fLabel(f) {
  if (f >= 1e6) return (f / 1e6).toFixed(2) + 'M';
  if (f >= 1e3) return (f / 1e3).toFixed(1) + 'k';
  return f.toFixed(1);
}

/* ============================================================
   BODE PLOT
   ============================================================ */

window.BodePlot = {

  /**
   * Run / refresh the Bode magnitude + phase charts.
   * @param {object} bodeData  – { type, fc, f0, Q, q, gain_lin, gain_db }
   */
  run(bodeData) {
    if (!bodeData) {
      bodeData = { type: 'amp', gain_lin: 1, gain_db: 0, fc: null };
    }

    const N = 300;
    const fMin = 0.1, fMax = 10e6;
    const freqs = Array.from({ length: N }, (_, i) =>
      fMin * Math.pow(fMax / fMin, i / (N - 1))
    );

    const type    = bodeData.type    || 'amp';
    const fc      = bodeData.fc      || 1000;
    const f0      = bodeData.f0      || fc;
    const q       = bodeData.q       || bodeData.Q || 0.707;
    const G       = bodeData.gain_lin || 1;
    const G_db    = bodeData.gain_db  || 0;

    const mags   = [];
    const phases = [];

    freqs.forEach(f => {
      let mag = 1, ph = 0;

      switch (type) {
        case 'amp':
          mag = Math.abs(G);
          ph  = G < 0 ? 180 : 0;
          break;

        case 'lpf':
        case 'lpf1': {
          const w = f / fc;
          mag = 1 / Math.sqrt(1 + w * w);
          ph  = -Math.atan(w) * 180 / Math.PI;
          break;
        }

        case 'lpf2': {
          const w = f / fc;
          const denom = Math.sqrt(
            Math.pow(1 - w * w, 2) + Math.pow(w / q, 2)
          );
          mag = Math.abs(G) / denom;
          ph  = -Math.atan2(w / q, 1 - w * w) * 180 / Math.PI;
          break;
        }

        case 'hpf1': {
          const w = fc / f;
          mag = 1 / Math.sqrt(1 + w * w);
          ph  = 90 - Math.atan(1 / w) * 180 / Math.PI;
          break;
        }

        case 'hpf2': {
          const w = fc / f;
          const denom = Math.sqrt(
            Math.pow(1 - w * w, 2) + Math.pow(w / q, 2)
          );
          mag = Math.abs(G) / denom;
          ph  = 180 - Math.atan2(w / q, 1 - w * w) * 180 / Math.PI;
          break;
        }

        case 'bpf': {
          const w  = f / f0;
          const Qv = q;
          mag = Math.abs(G) / Math.sqrt(1 + Math.pow(Qv * (w - 1 / w), 2));
          ph  = -Math.atan(Qv * (w - 1 / w)) * 180 / Math.PI;
          break;
        }

        case 'notch': {
          const w   = f / f0;
          const re  = 1 - w * w;
          const im  = w / 0.5;
          const num = Math.sqrt(re * re);
          const den = Math.sqrt(re * re + im * im);
          mag = num / Math.max(den, 1e-10);
          ph  = 0;
          break;
        }

        case 'int': {
          mag = fc / (2 * Math.PI * f * (fc / (2 * Math.PI)));
          mag = 1 / (f / fc);
          ph  = -90;
          break;
        }

        case 'allpass': {
          mag = 1;
          ph  = -2 * Math.atan(f / f0) * 180 / Math.PI;
          break;
        }

        case 'osc': {
          const diff = Math.abs(f - f0) / f0;
          mag = diff < 0.005 ? 100 : 0.01;
          ph  = 0;
          break;
        }

        default:
          mag = Math.abs(G);
          ph  = 0;
      }

      mags.push(20 * Math.log10(Math.max(1e-12, mag)));
      phases.push(ph);
    });

    const labels = freqs.map(f => fLabel(f) + 'Hz');

    /* destroy old charts */
    if (_bodeChartMag)   { _bodeChartMag.destroy();   _bodeChartMag   = null; }
    if (_bodeChartPhase) { _bodeChartPhase.destroy();  _bodeChartPhase = null; }

    const baseConfig = chartDefaults();

    /* Magnitude chart */
    _bodeChartMag = makeChart('bodeChartMag', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Magnitude (dB)',
          data: mags,
          borderColor: '#00d4ff',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(0,212,255,0.06)'
        }]
      },
      options: {
        ...baseConfig,
        scales: {
          x: { ...baseConfig.scales.x, title: { display: true, text: 'Frequency (Hz)', color: '#4d5f7a', font: { size: 9, family: 'Space Mono' } } },
          y: { ...baseConfig.scales.y, title: { display: true, text: 'Magnitude (dB)', color: '#4d5f7a', font: { size: 9, family: 'Space Mono' } } }
        }
      }
    });

    /* Phase chart */
    _bodeChartPhase = makeChart('bodeChartPhase', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Phase (°)',
          data: phases,
          borderColor: '#a78bfa',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: true,
          backgroundColor: 'rgba(167,139,250,0.06)'
        }]
      },
      options: {
        ...baseConfig,
        scales: {
          x: { ...baseConfig.scales.x, title: { display: true, text: 'Frequency (Hz)', color: '#4d5f7a', font: { size: 9, family: 'Space Mono' } } },
          y: { ...baseConfig.scales.y, title: { display: true, text: 'Phase (°)', color: '#4d5f7a', font: { size: 9, family: 'Space Mono' } } }
        }
      }
    });

    /* Update metric tiles */
    this._updateMetrics(mags, phases, freqs, bodeData, q);
  },

  _updateMetrics(mags, phases, freqs, bodeData, q) {
    const dcGain  = mags[0];
    const type    = bodeData.type || 'amp';

    /* find −3dB frequency */
    let fc3db = null;
    for (let i = 1; i < mags.length; i++) {
      if (mags[i] <= dcGain - 3) { fc3db = freqs[i]; break; }
    }

    /* find gain crossover (0dB) */
    let fgc = null;
    for (let i = 1; i < mags.length; i++) {
      if (mags[i - 1] >= 0 && mags[i] < 0) { fgc = freqs[i]; break; }
    }

    /* phase margin at gain crossover */
    let pm = null;
    if (fgc) {
      const idx = freqs.findIndex(f => f >= fgc);
      if (idx >= 0) pm = phases[idx] + 180;
    }

    const slope = (type.includes('2') || type === 'bpf') ? '−40' : '−20';

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('bm_fc',    fc3db ? fmtSI(fc3db, 'Hz') : '—');
    set('bm_bw',    fc3db ? fmtSI(fc3db, 'Hz') : '—');
    set('bm_gain',  dcGain.toFixed(1));
    set('bm_q',     q ? q.toFixed(3) : '—');
    set('bm_pm',    pm ? pm.toFixed(1) + '°' : '—');
    set('bm_slope', slope + ' dB/oct');
  },

  export() {
    const canvas = document.getElementById('bodeChartMag');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'CircuitForge_Bode.png';
    link.href = canvas.toDataURL();
    link.click();
    AppUtils.notify('Bode plot exported!');
  }
};

/* ============================================================
   TRANSIENT SIMULATOR
   ============================================================ */

window.TransientSim = {

  run(bodeData, engineResult) {
    const waveType = document.getElementById('transientWaveType')?.value || 'Sine';

    /* Determine gain and phase from bode data */
    const type     = bodeData?.type || 'amp';
    const G        = bodeData?.gain_lin || 1;
    const fc       = bodeData?.fc || bodeData?.f0 || 1000;
    const absGain  = Math.abs(G);
    const inverted = G < 0 || type === 'amp' && G < 0;

    /* Phase shift mapping */
    const phaseMap = {
      'int': -90, 'allpass': -90,
      'lpf2': -90, 'hpf2': 90,
      'amp': G < 0 ? 180 : 0,
    };
    const phaseShift = phaseMap[type] || 0;

    const N = 300;
    const f0 = fc || 1000;
    const T  = 1 / f0;
    const periods = 4;
    const dt = T * periods / N;

    const times = Array.from({ length: N }, (_, i) => i * dt);
    const phaseRad = phaseShift * Math.PI / 180;

    const genWave = (t, type) => {
      const ph = 2 * Math.PI * f0 * t;
      switch (type) {
        case 'Sine':     return Math.sin(ph);
        case 'Square':   return Math.sign(Math.sin(ph));
        case 'Triangle': return (2 / Math.PI) * Math.asin(Math.sin(ph));
        case 'Step':     return t > T * 0.5 ? 1 : 0;
        default:         return Math.sin(ph);
      }
    };

    const vin  = times.map(t => genWave(t, waveType));
    const vout = times.map(t => {
      const raw = genWave(t - phaseRad / (2 * Math.PI * f0), waveType);
      return absGain * raw * (inverted ? -1 : 1);
    });

    /* destroy old chart */
    if (_transientChart) { _transientChart.destroy(); _transientChart = null; }

    const canvas = document.getElementById('transientChart');
    if (!canvas) return;

    const timeLabels = times.map(t => fmtSI(t, 's'));

    _transientChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [
          {
            label: 'Vin',
            data: vin,
            borderColor: '#00d4ff',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: 'Vout',
            data: vout,
            borderColor: '#10b981',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
          }
        ]
      },
      options: {
        ...chartDefaults(),
        scales: {
          x: { ...chartDefaults().scales.x, title: { display: true, text: 'Time', color: '#4d5f7a', font: { size: 9, family: 'Space Mono' } } },
          y: { ...chartDefaults().scales.y, title: { display: true, text: 'Amplitude (V)', color: '#4d5f7a', font: { size: 9, family: 'Space Mono' } } }
        }
      }
    });

    /* Metrics */
    const vinPeak  = Math.max(...vin.map(Math.abs));
    const voutPeak = Math.max(...vout.map(Math.abs));
    const mGain    = vinPeak > 0 ? voutPeak / vinPeak : 0;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('tm_vin',   vinPeak.toFixed(3));
    set('tm_vout',  voutPeak.toFixed(3));
    set('tm_gain',  mGain.toFixed(3));
    set('tm_phase', phaseShift.toFixed(0));
  }
};

/* ============================================================
   PHASOR DIAGRAM
   ============================================================ */

window.PhasorDiagram = {

  draw(bodeData) {
    const canvas = document.getElementById('phasorCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2, r = 150;

    /* Background grid circles */
    [0.33, 0.66, 1].forEach(s => {
      ctx.strokeStyle = 'rgba(0,212,255,0.07)';
      ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cx, cy, r * s, 0, Math.PI * 2); ctx.stroke();
    });

    /* Axes */
    ctx.strokeStyle = 'rgba(0,212,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - r - 20, cy); ctx.lineTo(cx + r + 20, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r - 20); ctx.lineTo(cx, cy + r + 20); ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = '#4d5f7a'; ctx.font = '10px Space Mono';
    ctx.fillText('0°',  cx + r + 4,  cy + 4);
    ctx.fillText('90°', cx + 4,       cy - r - 6);
    ctx.fillText('180°',cx - r - 30,  cy + 4);
    ctx.fillText('−90°',cx + 4,       cy + r + 14);

    /* ── Draw a phasor ── */
    const drawPhasor = (mag, angleDeg, color, label) => {
      const rad = angleDeg * Math.PI / 180;
      const ex  = cx + mag * r * Math.cos(rad);
      const ey  = cy - mag * r * Math.sin(rad);

      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();

      /* arrowhead */
      const aLen = 12;
      const aAng = Math.atan2(cy - ey, ex - cx);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - aLen * Math.cos(aAng - 0.4), ey + aLen * Math.sin(aAng - 0.4));
      ctx.lineTo(ex - aLen * Math.cos(aAng + 0.4), ey + aLen * Math.sin(aAng + 0.4));
      ctx.closePath(); ctx.fill();

      /* label */
      ctx.fillStyle = color; ctx.font = 'bold 12px DM Sans';
      ctx.fillText(label, ex + 8, ey + 4);
    };

    /* Determine phase shift from bode data */
    const type = bodeData?.type || 'amp';
    const G    = bodeData?.gain_lin || 1;
    const phaseMap = {
      int:      -90,
      allpass:  -90,
      lpf2:     -90,
      hpf2:      90,
      bpf:        0,
    };
    const inputPhase  = 0;
    const outputPhase = (type === 'amp' && G < 0) ? 180 : (phaseMap[type] || 0);
    const outputMag   = Math.min(Math.abs(G), 3) / 3;

    drawPhasor(1,          inputPhase,  '#00d4ff', 'Vin');
    drawPhasor(outputMag,  outputPhase, '#10b981', 'Vout');

    /* Update phasor metrics */
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('ph_mag',   outputMag.toFixed(3));
    set('ph_phase', outputPhase.toFixed(0));
  }
};

/* ============================================================
   E-SERIES COMPONENT PICKER
   ============================================================ */

window.ESeriesPicker = {

  SERIES: {
    E12:  [1.0,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2],
    E24:  [1.0,1.1,1.2,1.3,1.5,1.6,1.8,2.0,2.2,2.4,2.7,3.0,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1],
    E48:  [1.00,1.05,1.10,1.15,1.21,1.27,1.33,1.40,1.47,1.54,1.62,1.69,1.78,1.87,1.96,2.05,2.15,2.26,2.37,2.49,
           2.61,2.74,2.87,3.01,3.16,3.32,3.48,3.65,3.83,4.02,4.22,4.42,4.64,4.87,5.11,5.36,5.62,5.90,6.19,6.49,
           6.81,7.15,7.50,7.87,8.25,8.66,9.09,9.53],
    E96:  [1.00,1.02,1.05,1.07,1.10,1.13,1.15,1.18,1.21,1.24,1.27,1.30,1.33,1.37,1.40,1.43,1.47,1.50,1.54,1.58,
           1.62,1.65,1.69,1.74,1.78,1.82,1.87,1.91,1.96,2.00,2.05,2.10,2.15,2.21,2.26,2.32,2.37,2.43,2.49,2.55,
           2.61,2.67,2.74,2.80,2.87,2.94,3.01,3.09,3.16,3.24,3.32,3.40,3.48,3.57,3.65,3.74,3.83,3.92,4.02,4.12,
           4.22,4.32,4.42,4.53,4.64,4.75,4.87,4.99,5.11,5.23,5.36,5.49,5.62,5.76,5.90,6.04,6.19,6.34,6.49,6.65,
           6.81,6.98,7.15,7.32,7.50,7.68,7.87,8.06,8.25,8.45,8.66,8.87,9.09,9.31,9.53,9.76]
  },

  run() {
    const target  = parseFloat(document.getElementById('eSeriesTarget')?.value) || 10000;
    const series  = document.getElementById('eSeriesType')?.value  || 'E24';
    const comp    = document.getElementById('eSeriesComp')?.value   || 'R';
    const unit    = comp === 'R' ? 'Ω' : 'F';
    const vals    = this.SERIES[series] || this.SERIES.E24;

    /* Decades to search */
    const decades = comp === 'R'
      ? [1, 10, 100, 1e3, 1e4, 1e5, 1e6]
      : [1e-12, 1e-11, 1e-10, 1e-9, 1e-8, 1e-7, 1e-6];

    let best = null, bestErr = Infinity, bestDecade = 1;

    decades.forEach(d => {
      vals.forEach(v => {
        const actual = v * d;
        const err = Math.abs(actual - target) / target;
        if (err < bestErr) { bestErr = err; best = actual; bestDecade = d; }
      });
    });

    /* Also compute next higher and next lower standard values */
    const nearVals = [];
    decades.forEach(d => {
      vals.forEach(v => nearVals.push({ v: v * d, err: Math.abs(v * d - target) / target }));
    });
    nearVals.sort((a, b) => a.v - b.v);
    const idx   = nearVals.findIndex(x => x.v >= best);
    const lower = nearVals[idx - 1];
    const upper = nearVals[idx + 1];

    const errPct = (bestErr * 100).toFixed(3);
    const el     = document.getElementById('eSeriesResult');
    if (!el) return;

    el.innerHTML = `
      <div class="result-card">
        <div class="result-row"><span class="result-key">Target Value</span>
          <span class="result-val">${fmtSI(target, unit)}</span></div>
        <div class="result-row"><span class="result-key">Nearest ${series} Value</span>
          <span class="result-val good">${fmtSI(best, unit)}</span></div>
        <div class="result-row"><span class="result-key">Error</span>
          <span class="result-val ${parseFloat(errPct) < 1 ? 'good' : 'warn'}">${errPct}%</span></div>
        <div class="result-row"><span class="result-key">Difference</span>
          <span class="result-val">${fmtSI(best - target, unit)}</span></div>
        ${lower ? `<div class="result-row"><span class="result-key">Next Lower</span>
          <span class="result-val info">${fmtSI(lower.v, unit)} (${(lower.err*100).toFixed(2)}% off)</span></div>` : ''}
        ${upper ? `<div class="result-row"><span class="result-key">Next Higher</span>
          <span class="result-val info">${fmtSI(upper.v, unit)} (${(upper.err*100).toFixed(2)}% off)</span></div>` : ''}
      </div>`;
  }
};

/* ============================================================
   OHM'S LAW CALCULATOR
   ============================================================ */

window.OhmCalc = {
  compute(changed) {
    const get = id => parseFloat(document.getElementById(id)?.value) || 0;
    const set = (id, v) => { const el = document.getElementById(id); if (el && !isNaN(v) && isFinite(v)) el.value = v.toFixed(5); };

    let V = get('ohm_v');
    let I = get('ohm_i') / 1000;   /* mA → A */
    let R = get('ohm_r') * 1000;   /* kΩ → Ω */

    switch (changed) {
      case 'v':
        if (R) { I = V / R; set('ohm_i', I * 1000); }
        break;
      case 'i':
        if (R) { V = I * R; set('ohm_v', V); }
        break;
      case 'r':
        if (V) { I = V / R; set('ohm_i', I * 1000); }
        break;
    }

    const P = V * I * 1000; /* mW */
    set('ohm_p', P);
  }
};

/* ============================================================
   RC CALCULATOR
   ============================================================ */

window.RCCalc = {
  compute() {
    const R   = (parseFloat(document.getElementById('rc_r')?.value) || 0) * 1e3;
    const C   = (parseFloat(document.getElementById('rc_c')?.value) || 0) * 1e-9;
    const tau = R * C;
    const fc  = tau > 0 ? 1 / (2 * Math.PI * tau) : 0;
    const el  = document.getElementById('rc_result');
    if (el) {
      el.innerHTML = `τ = ${fmtSI(tau, 's')} &nbsp;|&nbsp; f<sub>c</sub> = ${fmtSI(fc, 'Hz')}`;
    }
  }
};
