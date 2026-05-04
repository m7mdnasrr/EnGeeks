# ⚡ CircuitForge Pro — Electronics Design Studio

> **Professional interactive op-amp circuit synthesis platform**  
> Designed by: Eng. Mohamed Nasr · Faculty of Engineering

---

## 📁 File Structure

```
circuitforge-pro/
│
├── index.html        ← Main HTML shell — all views & layout
├── styles.css        ← Complete design system (dark theme, components)
├── engine.js         ← Canvas drawing engine + SI unit formatter
├── circuits.js       ← All 30+ circuit definitions (calc, draw, tips)
├── charts.js         ← Bode plot, transient sim, phasor, E-series picker
├── app.js            ← App controller (state, nav, AI advisor, export)
│
├── vercel.json       ← Vercel deployment config (static site, headers)
├── .gitignore        ← Git ignore rules
└── README.md         ← This file
```

### Module Dependency Order
Scripts **must** be loaded in this order (already correct in `index.html`):

```
engine.js  →  circuits.js  →  charts.js  →  app.js
```

---

## 🚀 Deploy to Vercel (3 Methods)

### Method 1 — Drag & Drop (Fastest, no account needed)

1. Go to **[vercel.com](https://vercel.com)** and sign up / log in
2. From your dashboard click **"Add New → Project"**
3. Click **"Import → Deploy without Git"** (or drag-and-drop)
4. Drag the entire **`circuitforge-pro/`** folder onto the upload area
5. Click **Deploy**
6. ✅ Live in ~30 seconds at `https://circuitforge-pro.vercel.app`

---

### Method 2 — GitHub + Vercel (Recommended for updates)

#### Step 1 — Push to GitHub

```bash
# 1. Create a new repo on github.com (name it: circuitforge-pro)
# 2. Then in your terminal:

cd circuitforge-pro
git init
git add .
git commit -m "Initial deploy: CircuitForge Pro v3.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/circuitforge-pro.git
git push -u origin main
```

#### Step 2 — Connect to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"**
3. Authorize GitHub and select **`circuitforge-pro`**
4. Framework Preset: select **"Other"** (it's a static site)
5. Root Directory: leave as **`./`** (default)
6. Build Command: leave **empty** (no build step needed)
7. Output Directory: leave **empty** (serves from root)
8. Click **Deploy**

#### Step 3 — Auto-deploy on every push

After initial setup, every `git push` automatically redeploys:

```bash
# Make a change, then:
git add .
git commit -m "Updated inverting amplifier drawing"
git push
# → Vercel auto-deploys in ~20 seconds
```

---

### Method 3 — Vercel CLI (Power users)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project folder
cd circuitforge-pro

# Login to Vercel
vercel login

# Deploy (first time — answers prompts)
vercel

# Deploy to production
vercel --prod
```

CLI output will show your live URL, e.g.:
```
✅  Production: https://circuitforge-pro.vercel.app  [28s]
```

---

## 🌐 Custom Domain (Optional)

After deploying on Vercel:

1. Go to **Project Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain e.g. `circuits.yourdomain.com`
4. Add the DNS records shown (CNAME or A record) at your DNS provider
5. Vercel auto-provisions HTTPS/SSL — free

---

## 🛠 Local Development

No build tools needed. Just open `index.html` directly in any browser:

```bash
# Option A — double-click index.html in your file manager

# Option B — use Python's built-in server
cd circuitforge-pro
python3 -m http.server 8080
# → open http://localhost:8080

# Option C — use VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

> **Note:** The AI Advisor feature calls the Anthropic API from the browser.
> This requires a valid API key injected server-side or via a proxy.
> The rest of the app works fully offline.

---

## ✨ Feature Overview

| Feature | Description |
|---|---|
| **30+ Circuits** | Amplifiers, filters, oscillators, comparators, converters, power |
| **Schematic Viewer** | Real-time canvas drawing with component labels and values |
| **Bode Plot** | Magnitude & phase vs frequency with key metrics |
| **Transient Sim** | Sine, square, triangle, step waveforms |
| **Phasor Diagram** | Input/output phase relationship |
| **AI Advisor** | Powered by Claude — design tips, troubleshooting, formulas |
| **E-Series Picker** | Find nearest E12/E24/E48/E96 resistor or capacitor value |
| **Ohm's Law Calc** | V, I, R, P calculator |
| **RC Calculator** | τ and fc from R and C values |
| **dB Converter** | dB ↔ linear (voltage and power ratio) |
| **Export PNG** | Download schematic as high-res image |
| **Export Report** | Full HTML design report with formulas and tips |
| **Design History** | Last 25 designs auto-saved, one-click restore |
| **Keyboard Shortcuts** | Ctrl+S, Ctrl+B, Ctrl+E, F5 |

---

## 📐 Circuit Categories

1. **Basic Amplifiers** — Inverting, Non-Inverting, Follower, Differential, Instrumentation, TIA
2. **Mathematical Ops** — Summer, Difference, Integrator, Differentiator, Log, Anti-Log, |x|
3. **Active Filters** — LPF, HPF, BPF, Notch, All-Pass, Butterworth
4. **Oscillators** — Wien Bridge, RC Phase Shift, Astable, Crystal, Colpitts
5. **Comparators** — Voltage Comparator, Schmitt Trigger, Window Comparator
6. **Non-Linear** — Precision Rectifier, Peak Detector, Clamper, Clipper
7. **Converters** — I-to-V, V-to-I, R-2R DAC, Flash ADC
8. **Power & References** — Linear Regulator, Precision Voltage Reference

---

## 🔧 Adding a New Circuit

In `circuits.js`, add an entry to `CIRCUIT_CATEGORIES` and define it in `ENGINE`:

```js
// 1. Register in sidebar
CIRCUIT_CATEGORIES['My Category'] = [
  { id: 'my_circuit', name: 'My New Circuit', icon: '🔬' }
];

// 2. Define the engine
ENGINE.my_circuit = {
  title:    'My New Circuit',
  subtitle: 'Short description',
  inputs: [
    { id: 'r1', label: 'Resistor R1', val: 10, unit: 'kΩ' },
  ],
  tips: ['Tip 1', 'Tip 2'],
  refs: 'Datasheet reference',
  calc(v, P) {
    P.results = [{ k: 'R1', val: fmtSI(v.r1 * 1e3, 'Ω'), cls: 'good' }];
    P.formula = `R1 = ${fmtSI(v.r1 * 1e3, 'Ω')}`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(500, 260);
    // ... draw your circuit
  }
};
```

---

## 📄 License

MIT License — free for educational and commercial use.  
Credit appreciated: **Eng. Mohamed Nasr, Faculty of Engineering**
