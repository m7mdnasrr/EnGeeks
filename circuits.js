/* ============================================================
   CircuitForge Pro — circuits.js
   All circuit definitions: inputs, calc, draw, tips, refs
   ============================================================ */

'use strict';

/* ── Circuit category registry ── */
window.CIRCUIT_CATEGORIES = {
  'Basic Amplifiers': [
    { id:'amp_inv',    name:'Inverting Amplifier',        icon:'🔀' },
    { id:'amp_noninv', name:'Non-Inverting Amplifier',    icon:'🔼' },
    { id:'amp_follow', name:'Voltage Follower (Buffer)',   icon:'⏩' },
    { id:'amp_diff',   name:'Differential Amplifier',     icon:'±' },
    { id:'amp_inst',   name:'Instrumentation Amplifier',  icon:'🎚' },
    { id:'amp_trans',  name:'Transimpedance (TIA)',        icon:'📡' },
  ],
  'Mathematical Ops': [
    { id:'math_sum',     name:'Summing Amplifier',    icon:'∑' },
    { id:'math_diff',    name:'Difference Amplifier', icon:'−' },
    { id:'math_int',     name:'Integrator',           icon:'∫' },
    { id:'math_deriv',   name:'Differentiator',       icon:'∂' },
    { id:'math_log',     name:'Log Amplifier',        icon:'㏒' },
    { id:'math_antilog', name:'Anti-Log Amplifier',   icon:'eˣ' },
    { id:'math_abs',     name:'Absolute Value',       icon:'|x|' },
  ],
  'Active Filters': [
    { id:'filt_lpf',    name:'Low-Pass (Sallen-Key)',    icon:'⬇' },
    { id:'filt_hpf',    name:'High-Pass (Sallen-Key)',   icon:'⬆' },
    { id:'filt_bpf',    name:'Band-Pass (MFB)',          icon:'🎯' },
    { id:'filt_notch',  name:'Notch Filter (Twin-T)',    icon:'🔕' },
    { id:'filt_allpass',name:'All-Pass Phase Shifter',   icon:'↻' },
    { id:'filt_butter', name:'Butterworth 2nd-Order',    icon:'🔵' },
  ],
  'Oscillators': [
    { id:'osc_wien',     name:'Wien Bridge Oscillator', icon:'〜' },
    { id:'osc_rc',       name:'RC Phase Shift Osc.',    icon:'🌀' },
    { id:'osc_astable',  name:'Astable Multivibrator',  icon:'⬜' },
    { id:'osc_crystal',  name:'Crystal Oscillator',     icon:'💎' },
    { id:'osc_colpitts', name:'Colpitts LC Oscillator', icon:'📐' },
  ],
  'Comparators': [
    { id:'nl_comp',   name:'Voltage Comparator',  icon:'⚖' },
    { id:'nl_schmitt',name:'Schmitt Trigger',      icon:'⚡' },
    { id:'nl_window', name:'Window Comparator',   icon:'🪟' },
  ],
  'Non-Linear': [
    { id:'nl_rect', name:'Precision Rectifier', icon:'⎍' },
    { id:'nl_peak', name:'Peak Detector',        icon:'⛰' },
    { id:'nl_clamp',name:'Precision Clamper',    icon:'📌' },
    { id:'nl_clip', name:'Precision Clipper',    icon:'✂' },
  ],
  'Converters': [
    { id:'conv_itov', name:'I-to-V (Transimpedance)', icon:'⟶' },
    { id:'conv_vtoi', name:'V-to-I Converter',        icon:'⟵' },
    { id:'conv_dac',  name:'R-2R Ladder DAC',         icon:'🔢' },
    { id:'conv_adc',  name:'Flash ADC (3-bit)',        icon:'📊' },
  ],
  'Power & References': [
    { id:'pwr_reg', name:'Linear Regulator',      icon:'🔋' },
    { id:'pwr_ref', name:'Precision Voltage Ref', icon:'🎯' },
  ],
};

/* ── Master ENGINE object ── */
window.ENGINE = {};

/* helper shorthand */
const f = window.fmtSI;
const d = window.drawCtx;

/* ============================================================
   BASIC AMPLIFIERS
   ============================================================ */

ENGINE.amp_inv = {
  title: 'Inverting Amplifier',
  subtitle: 'Classic Op-Amp Inverting Configuration',
  inputs: [
    { id:'gain', label:'Gain Magnitude |Av|', val:10, unit:'', min:1 },
    { id:'rin',  label:'Input Resistor Rin',  val:10, unit:'kΩ', min:0.1 },
  ],
  tips: [
    'Keep Rin ≥ 1kΩ to avoid overloading source impedance',
    'Add 0.1μF bypass caps on ±Vcc supply pins for stability',
    'Compensating resistor Rc = Rin‖Rf minimises DC offset error',
    'Use metal-film resistors (0.1%) for precision designs',
    'GBW of op-amp must exceed |Av| × maximum signal frequency',
    'Virtual ground at inverting pin — input sees only Rin',
  ],
  refs: 'TI SLOA049; Horowitz & Hill "Art of Electronics" Ch.4; AD MT-040',
  calc(v, P) {
    const Rf = v.gain * v.rin * 1e3;
    const Rc = (v.rin * 1e3 * Rf) / (v.rin * 1e3 + Rf);
    P.results = [
      { k:'Feedback Resistor Rf', val:f(Rf,'Ω'), cls:'good' },
      { k:'Compensating Resistor Rc', val:f(Rc,'Ω'), cls:'info' },
      { k:'Voltage Gain Av', val:`−${v.gain}`, cls:'good' },
      { k:'Input Impedance Zin', val:f(v.rin*1e3,'Ω'), cls:'info' },
      { k:'Phase Shift', val:'180°', cls:'warn' },
      { k:'Rf/Rin Ratio', val:`${v.gain}:1`, cls:'info' },
    ];
    P.formula = `Av = −Rf/Rin = −${v.gain}\nRf = |Av|×Rin = ${f(Rf,'Ω')}\nRc = Rin‖Rf = ${f(Rc,'Ω')}`;
    P.sb_gain = `−${v.gain}×`;
    P.bode = { type:'amp', gain_lin:-v.gain, gain_db:20*Math.log10(v.gain), fc:null };
    return { Rf, Rc, gain:-v.gain, rin:v.rin*1e3 };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rf } = ENGINE.amp_inv.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(520, 260);
    D.wire(100,240,200,240); D.portLabel(60,245,'Vin');
    D.resistor(230,240,'Rin',f(v.rin*1e3,'Ω'));
    D.wire(270,240,480,240); D.node(360,240);
    D.wire(480,280,450,280); D.ground(450,280);
    D.wire(360,240,360,140); D.wire(360,140,430,140);
    D.resistor(465,140,'Rf',f(Rf,'Ω'));
    D.wire(505,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
  },
};

ENGINE.amp_noninv = {
  title: 'Non-Inverting Amplifier',
  subtitle: 'High-Impedance Input, In-Phase Output',
  inputs: [
    { id:'gain', label:'Voltage Gain Av', val:11, unit:'', min:1 },
    { id:'r1',   label:'Ground Resistor R1', val:10, unit:'kΩ', min:0.1 },
  ],
  tips: [
    'Gain ≥ 1 — cannot produce negative gain in this topology',
    'Input impedance is very high — ideal for sensor interfaces',
    'Rf = R1×(Av−1). For Av=1, short output to inverting pin',
    'Common-mode rejection is excellent in this topology',
    'Output impedance is very low due to deep negative feedback',
    'Add small cap across Rf to limit bandwidth and reduce noise',
  ],
  refs: 'TI SLOA049; AD AN-20; Sergio Franco "Design with Op-Amps" Ch.2',
  calc(v, P) {
    const Rf = v.r1 * 1e3 * (v.gain - 1);
    P.results = [
      { k:'Feedback Resistor Rf', val:f(Rf,'Ω'), cls:'good' },
      { k:'Ground Resistor R1',   val:f(v.r1*1e3,'Ω'), cls:'info' },
      { k:'Voltage Gain Av',      val:`+${v.gain}`, cls:'good' },
      { k:'Phase Shift',          val:'0°', cls:'good' },
      { k:'Input Impedance',      val:'Very High (∞ ideal)', cls:'info' },
      { k:'Gain Formula',         val:'1 + Rf/R1', cls:'info' },
    ];
    P.formula = `Av = 1 + Rf/R1 = ${v.gain}\nRf = R1×(Av−1) = ${f(Rf,'Ω')}`;
    P.sb_gain = `+${v.gain}×`;
    P.bode = { type:'amp', gain_lin:v.gain, gain_db:20*Math.log10(v.gain), fc:null };
    return { Rf, r1:v.r1*1e3 };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rf } = ENGINE.amp_noninv.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(500,260);
    D.wire(300,280,460,280); D.portLabel(260,285,'Vin');
    D.wire(460,240,380,240); D.node(380,240);
    D.wire(380,240,380,330); D.resistor(380,360,'R1',f(v.r1*1e3,'Ω'),true); D.ground(380,390);
    D.wire(380,240,380,140); D.wire(380,140,440,140);
    D.resistor(475,140,'Rf',f(Rf,'Ω'));
    D.wire(515,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
  },
};

ENGINE.amp_follow = {
  title: 'Voltage Follower (Unity Buffer)',
  subtitle: 'Impedance Transformer — Av = 1',
  inputs: [
    { id:'vin', label:'Input Voltage Vin', val:5, unit:'V' },
  ],
  tips: [
    'Gain = exactly 1 (unity) — perfect impedance matching',
    'Input impedance ≈ open circuit; output impedance ≈ 0 Ω',
    'Isolates high-impedance sources from low-impedance loads',
    'Use between sensor/filter and ADC to prevent loading',
    'Choose rail-to-rail op-amp for full swing near supplies',
    'No resistors needed — direct short feedback connection',
  ],
  refs: 'TI SLOA031; Microchip AN726; National Semi LM324 Datasheet',
  calc(v, P) {
    P.results = [
      { k:'Voltage Gain',       val:'1.000 (unity)', cls:'good' },
      { k:'Output Voltage',     val:f(v.vin,'V'),    cls:'good' },
      { k:'Phase Shift',        val:'0°',            cls:'good' },
      { k:'Input Impedance',    val:'∞ Ω (ideal)',   cls:'info' },
      { k:'Output Impedance',   val:'≈ 0 Ω',         cls:'info' },
      { k:'Bandwidth',          val:'Full GBW',       cls:'info' },
    ];
    P.formula = `Vout = Vin = ${v.vin} V\nGain = 1 (unity)\nNo feedback resistors required`;
    P.sb_gain = '1× (unity)';
    P.bode = { type:'amp', gain_lin:1, gain_db:0, fc:null };
    return {};
  },
  draw(ctx) {
    const D = drawCtx(ctx);
    D.opamp(500,260);
    D.wire(280,280,460,280); D.portLabel(240,285,'Vin');
    D.wire(460,240,360,240);
    D.wire(360,240,360,150); D.wire(360,150,580,150);
    D.wire(580,150,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
    D.labelSmall(370,185,'Direct feedback (Av = 1)', D.clrDim);
  },
};

ENGINE.amp_diff = {
  title: 'Differential Amplifier',
  subtitle: 'CMRR-Dependent Subtractor Circuit',
  inputs: [
    { id:'gain', label:'Differential Gain Ad', val:10,  unit:'' },
    { id:'r1',   label:'Input Resistors R1=R2', val:10, unit:'kΩ' },
  ],
  tips: [
    'CMRR depends critically on resistor matching — use 0.1% parts',
    'With matched R1=R2 and Rf=Rg: CMRR → ∞ (ideal)',
    'Gain: Ad = Rf/R1 when Rf=Rg and R1=R2',
    'Input impedance is relatively low — may load source impedance',
    'For high CMRR with high Zin, use instrumentation amplifier',
    'Resistor networks (e.g. RN55) provide excellent matching',
  ],
  refs: 'TI INA128 Datasheet; AD8221 App Note; Sergio Franco Ch.3',
  calc(v, P) {
    const Rf = v.gain * v.r1 * 1e3;
    P.results = [
      { k:'Feedback Rf = Rg', val:f(Rf,'Ω'),       cls:'good' },
      { k:'Input R1 = R2',    val:f(v.r1*1e3,'Ω'), cls:'info' },
      { k:'Differential Gain',val:`${v.gain}×`,     cls:'good' },
      { k:'CMRR (ideal)',     val:'∞ dB',           cls:'good' },
      { k:'Formula',          val:'Ad = Rf/R1',     cls:'info' },
      { k:'Rf/R1 Ratio',      val:`${v.gain}:1`,    cls:'info' },
    ];
    P.formula = `Ad = Rf/R1 = ${v.gain}\nRf = Ad×R1 = ${f(Rf,'Ω')}\nCMRR → ∞ with matched resistors`;
    P.sb_gain = `Ad=${v.gain}×`;
    P.bode = { type:'amp', gain_lin:v.gain, gain_db:20*Math.log10(v.gain), fc:null };
    return { Rf, r1:v.r1*1e3 };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rf } = ENGINE.amp_diff.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(530,260);
    D.wire(100,240,180,240); D.portLabel(60,245,'V1 (−)');
    D.resistor(210,240,'R1',f(v.r1*1e3,'Ω')); D.wire(250,240,490,240); D.node(370,240);
    D.wire(370,240,370,140); D.wire(370,140,440,140);
    D.resistor(472,140,'Rf',f(Rf,'Ω'));
    D.wire(512,140,590,140); D.wire(590,140,590,260); D.node(590,260);
    D.wire(100,280,180,280); D.portLabel(60,285,'V2 (+)');
    D.resistor(210,280,'R2',f(v.r1*1e3,'Ω')); D.wire(250,280,490,280); D.node(410,280);
    D.wire(410,280,410,340); D.resistor(410,368,'Rg',f(Rf,'Ω'),true); D.ground(410,396);
    D.wire(570,260,670,260); D.portLabel(690,265,'Vout');
  },
};

ENGINE.amp_inst = {
  title: 'Instrumentation Amplifier',
  subtitle: '3 Op-Amp Precision Differential Amplifier',
  inputs: [
    { id:'gain',  label:'Total Differential Gain', val:100, unit:'', min:2 },
    { id:'rfeed', label:'Feedback R2 = R3',        val:10,  unit:'kΩ' },
  ],
  tips: [
    'Gain set by a single Rgain — extremely precise and stable',
    'Input impedance is extremely high on both terminals',
    'Typical CMRR >100 dB (e.g. INA128, AD8221)',
    'Use dedicated INA ICs for best performance',
    'Keep Rgain traces short to minimise stray inductance',
    'For Av=1 on IC INA: leave Rgain pin open',
  ],
  refs: 'TI INA128 Datasheet; AD8221 Datasheet; Bonnie Baker TI App Note',
  calc(v, P) {
    const Rf = v.rfeed * 1e3;
    const Rg = 2 * Rf / (v.gain - 1);
    P.results = [
      { k:'Gain Resistor Rgain', val:f(Rg,'Ω'),    cls:'good' },
      { k:'Feedback R2 = R3',   val:f(Rf,'Ω'),     cls:'info' },
      { k:'Total Gain',         val:`${v.gain}×`,   cls:'good' },
      { k:'Stage-1 Gain',       val:`${(1+2*Rf/Rg).toFixed(2)}×`, cls:'info' },
      { k:'Stage-2 Gain',       val:'1× (diff)',   cls:'info' },
      { k:'Formula',            val:'1 + 2Rf/Rg',  cls:'info' },
    ];
    P.formula = `Av = 1 + 2×Rf/Rg = ${v.gain}\nRgain = 2×Rf/(Av−1) = ${f(Rg,'Ω')}`;
    P.sb_gain = `Ad=${v.gain}×`;
    P.bode = { type:'amp', gain_lin:v.gain, gain_db:20*Math.log10(v.gain), fc:null };
    return { Rf, Rg };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rf, Rg } = ENGINE.amp_inst.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(220,150,'U1'); D.opamp(220,390,'U2'); D.opamp(580,270,'U3');
    D.wire(60,170,180,170); D.portLabel(30,175,'V1−');
    D.wire(60,410,180,410); D.portLabel(30,415,'V2+');
    D.wire(180,130,140,130); D.wire(140,130,140,200);
    D.wire(180,370,140,370); D.wire(140,370,140,310);
    D.resistor(140,255,'Rg',f(Rg,'Ω'),true);
    D.wire(180,130,180,90);  D.wire(180,90,220,90);
    D.resistor(250,90,'R2',f(Rf,'Ω'));  D.wire(290,90,350,90);  D.wire(350,90,350,150); D.node(350,150); D.wire(260,150,430,150);
    D.wire(180,370,180,430); D.wire(180,430,220,430);
    D.resistor(250,430,'R3',f(Rf,'Ω')); D.wire(290,430,350,430); D.wire(350,430,350,390); D.node(350,390); D.wire(260,390,430,390);
    D.resistor(462,150,'R',f(10000,'Ω')); D.wire(502,150,540,150);
    D.resistor(462,390,'R',f(10000,'Ω')); D.wire(502,390,540,390);
    D.wire(540,390,540,450); D.resistor(540,475,'R',f(10000,'Ω'),true); D.ground(540,505);
    D.wire(540,150,540,100); D.wire(540,100,558,100);
    D.resistor(590,100,'R',f(10000,'Ω')); D.wire(630,100,640,100); D.wire(640,100,640,270); D.node(640,270);
    D.wire(620,270,730,270); D.portLabel(750,275,'Vout');
  },
};

ENGINE.amp_trans = {
  title: 'Transimpedance Amplifier (TIA)',
  subtitle: 'Current-to-Voltage with Photodiode',
  inputs: [
    { id:'ip',  label:'Max Photocurrent Ip', val:50, unit:'μA' },
    { id:'vout',label:'Desired Max Vout',    val:5,  unit:'V' },
    { id:'cf',  label:'Feedback Cap Cf',     val:10, unit:'pF' },
  ],
  tips: [
    'Rf = Vout/Imax — transimpedance gain in Ω (V/A)',
    'Cf prevents oscillation from photodiode capacitance',
    'Optimal Cf: sqrt(Cd / (2π×Rf×GBW))',
    'Lower Rf = wider bandwidth but lower sensitivity',
    'Use FET-input op-amps (OPA657, AD8065) for low noise',
    'Reverse-bias photodiode to reduce junction capacitance',
  ],
  refs: 'TI SBOA035; OPA657 Datasheet; Analog Devices CN-0326',
  calc(v, P) {
    const Rf = v.vout / (v.ip * 1e-6);
    const bw = 1 / (2 * Math.PI * Rf * (v.cf * 1e-12));
    P.results = [
      { k:'Feedback Resistor Rf', val:f(Rf,'Ω'),        cls:'good' },
      { k:'Transimpedance',       val:f(Rf,'Ω')+'(V/A)',cls:'good' },
      { k:'Signal BW (−3dB)',     val:f(bw,'Hz'),        cls:'info' },
      { k:'Vout @ Ip',            val:f(v.vout,'V'),     cls:'good' },
      { k:'Feedback Cap Cf',      val:f(v.cf*1e-12,'F'), cls:'info' },
      { k:'Noise BW',             val:f(bw*1.57,'Hz'),   cls:'warn' },
    ];
    P.formula = `Rf = Vout/Ip = ${f(Rf,'Ω')}\nBW = 1/(2π×Rf×Cf) = ${f(bw,'Hz')}`;
    P.sb_gain = `Zt=${f(Rf,'Ω/A')}`;
    P.bode = { type:'lpf', fc:bw, gain_db:20*Math.log10(Rf), gain_lin:Rf };
    return { Rf, bw };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rf } = ENGINE.amp_trans.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(520,260);
    D.diode(310,240,true);
    D.wire(180,240,292,240); D.portLabel(140,245,'Ip ↓');
    D.wire(328,240,480,240); D.node(400,240);
    D.wire(310,258,310,290); D.ground(310,290);
    D.wire(480,280,450,280); D.ground(450,280);
    D.wire(400,240,400,140); D.wire(400,140,460,140);
    D.resistor(490,140,'Rf',f(Rf,'Ω'));
    D.wire(530,140,600,140); D.wire(600,140,600,260); D.node(600,260);
    // Cf parallel with Rf
    D.wire(400,140,400,100); D.wire(400,100,468,100);
    D.capacitor(498,100,'Cf',f(v.cf*1e-12,'F'));
    D.wire(528,100,600,100);
    D.wire(580,260,670,260); D.portLabel(690,265,'Vout');
  },
};

/* ============================================================
   MATHEMATICAL OPS
   ============================================================ */

ENGINE.math_sum = {
  title: 'Summing Amplifier',
  subtitle: 'Inverting Multi-Input Adder',
  inputs: [
    { id:'v1',  label:'Input V1', val:1,  unit:'V' },
    { id:'v2',  label:'Input V2', val:2,  unit:'V' },
    { id:'v3',  label:'Input V3', val:0.5,unit:'V' },
    { id:'rin', label:'Input Resistors Rin', val:10, unit:'kΩ' },
    { id:'rf',  label:'Feedback Rf', val:10, unit:'kΩ' },
  ],
  tips: [
    'Virtual ground at summing node — each input is independent',
    'Individual gain: Ai = −Rf/Ri; for equal weights use equal Ri',
    'For a weighted mixer, scale each Ri independently',
    'Compensating resistor = Rf ‖ (R1‖R2‖R3) for DC accuracy',
    'Op-amp output must source sum of all input currents',
    'Audio mixer application: scale Ri for individual channel gain',
  ],
  refs: 'TI SLOA049; AD AN-31; Graeme "Applications of Op-Amps"',
  calc(v, P) {
    const k = v.rf / v.rin;
    const vout = -(k*v.v1 + k*v.v2 + k*v.v3);
    P.results = [
      { k:'Output Voltage Vout', val:f(vout,'V'),         cls:'good' },
      { k:'Each Gain (−Rf/Rin)', val:`−${k.toFixed(2)}×`, cls:'info' },
      { k:'V1 contribution',     val:f(-k*v.v1,'V'),      cls:'info' },
      { k:'V2 contribution',     val:f(-k*v.v2,'V'),      cls:'info' },
      { k:'V3 contribution',     val:f(-k*v.v3,'V'),      cls:'info' },
      { k:'Feedback Rf',         val:f(v.rf*1e3,'Ω'),     cls:'info' },
    ];
    P.formula = `Vout = −(Rf/R)×(V1+V2+V3)\n     = −${k}×(${v.v1}+${v.v2}+${v.v3}) = ${vout.toFixed(3)} V`;
    P.sb_gain = `Vout=${f(vout,'V')}`;
    return { vout, k };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { vout } = ENGINE.math_sum.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(580,270);
    D.node(440,250); D.wire(440,250,500,250);
    const rows = [[160,'V1'],[220,'V2'],[280,'V3']];
    rows.forEach(([y, lbl]) => {
      D.wire(100,y,150,y); D.portLabel(60,y+5,lbl);
      D.resistor(180,y,'Rin',f(v.rin*1e3,'Ω')); D.wire(220,y,440,y); D.wire(440,y,440,250);
    });
    D.wire(500,290,470,290); D.ground(470,290);
    D.wire(440,250,440,130); D.wire(440,130,510,130);
    D.resistor(543,130,'Rf',f(v.rf*1e3,'Ω'));
    D.wire(583,130,640,130); D.wire(640,130,640,270); D.node(640,270);
    D.wire(620,270,720,270); D.portLabel(740,275,'Vout='+f(vout,'V'));
  },
};

ENGINE.math_diff = {
  title: 'Difference Amplifier',
  subtitle: 'Analog Subtractor (V2 − V1)',
  inputs: [
    { id:'v1',  label:'Input V1', val:2,  unit:'V' },
    { id:'v2',  label:'Input V2', val:5,  unit:'V' },
    { id:'rin', label:'Input Resistors R1', val:10, unit:'kΩ' },
    { id:'rf',  label:'Feedback R2', val:10, unit:'kΩ' },
  ],
  tips: [
    'Vout = (Rf/R1)×(V2−V1) when resistors are matched',
    'Use 0.1% resistors for good CMRR performance',
    'Resistor networks (RN55) provide excellent matching',
    'For audio, removes common-mode hum effectively',
    'CMRR = 20log(2×Rf/ΔR) where ΔR is mismatch',
    'Input impedance asymmetric — can unbalance differential sources',
  ],
  refs: 'TI INA132; AD628; Sedra/Smith "Microelectronics Circuits"',
  calc(v, P) {
    const gain = v.rf / v.rin;
    const vout = gain * (v.v2 - v.v1);
    P.results = [
      { k:'Output Voltage Vout', val:f(vout,'V'),          cls:'good' },
      { k:'Gain (Rf/R1)',        val:`${gain.toFixed(2)}×`, cls:'info' },
      { k:'V2 − V1',             val:f(v.v2-v.v1,'V'),     cls:'info' },
      { k:'Feedback Rf',         val:f(v.rf*1e3,'Ω'),      cls:'info' },
      { k:'Formula',             val:'(Rf/R1)×(V2−V1)',    cls:'info' },
      { k:'CMRR',                val:'Depends on matching', cls:'warn' },
    ];
    P.formula = `Vout = (Rf/R1)×(V2−V1)\n     = ${gain}×${v.v2-v.v1} = ${vout.toFixed(3)} V`;
    P.sb_gain = `Vout=${f(vout,'V')}`;
    return { gain, vout };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { vout } = ENGINE.math_diff.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(520,260);
    D.wire(100,240,170,240); D.portLabel(60,245,'V1');
    D.resistor(200,240,'R1',f(v.rin*1e3,'Ω')); D.wire(240,240,480,240); D.node(350,240);
    D.wire(350,240,350,140); D.wire(350,140,420,140);
    D.resistor(452,140,'Rf',f(v.rf*1e3,'Ω'));
    D.wire(492,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(100,280,170,280); D.portLabel(60,285,'V2');
    D.resistor(200,280,'R2',f(v.rin*1e3,'Ω')); D.wire(240,280,480,280); D.node(400,280);
    D.wire(400,280,400,340); D.resistor(400,368,'Rg',f(v.rf*1e3,'Ω'),true); D.ground(400,396);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout='+f(vout,'V'));
  },
};

ENGINE.math_int = {
  title: 'Integrator (Miller)',
  subtitle: 'Op-Amp RC Integration Circuit',
  inputs: [
    { id:'rin', label:'Input Resistor Rin', val:10,  unit:'kΩ' },
    { id:'c',   label:'Feedback Cap C',     val:100, unit:'nF' },
  ],
  tips: [
    'Vout = −1/(RC) × ∫Vin dt — output is integral of input',
    'DC offset saturates output — add parallel Rf (10×Rin) to limit DC gain',
    'Time constant τ = R×C controls integration rate',
    'Square wave in → Triangle wave out',
    'Sine in → Sine out (−90° phase shift, attenuated at higher f)',
    'Cutoff frequency: fc = 1/(2π×RC)',
  ],
  refs: 'TI SLOA049; Sergio Franco Ch.5; Graeme "Optimizing Op-Amp Performance"',
  calc(v, P) {
    const tau = v.rin * 1e3 * v.c * 1e-9;
    const fc = 1 / (2 * Math.PI * tau);
    P.results = [
      { k:'Time Constant τ = RC', val:f(tau,'s'),   cls:'good' },
      { k:'Cutoff Frequency fc',  val:f(fc,'Hz'),   cls:'info' },
      { k:'DC Gain',              val:'Saturates (add Rf)', cls:'warn' },
      { k:'Phase at fc',          val:'−90° (lag)', cls:'info' },
      { k:'Roll-off',             val:'−20dB/decade', cls:'info' },
      { k:'Recommended Rf',       val:f(v.rin*1e4,'Ω'), cls:'info' },
    ];
    P.formula = `τ = R×C = ${f(tau,'s')}\nfc = 1/(2πτ) = ${f(fc,'Hz')}\nVout = −(1/RC)∫Vin dt`;
    P.sb_freq = `fc=${f(fc,'Hz')}`;
    P.bode = { type:'int', fc, gain_db:0, gain_lin:1 };
    return { tau, fc };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { tau, fc } = ENGINE.math_int.calc(v, { results:[], formula:'', sb_gain:'', bode:{} });
    D.opamp(520,260);
    D.wire(120,240,180,240); D.portLabel(80,245,'Vin');
    D.resistor(210,240,'Rin',f(v.rin*1e3,'Ω')); D.wire(250,240,480,240); D.node(360,240);
    D.wire(480,280,450,280); D.ground(450,280);
    D.wire(360,240,360,140); D.wire(360,140,432,140);
    D.capacitor(462,140,'C',f(v.c*1e-9,'F'));
    D.wire(492,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
    D.labelSmall(300,370,'τ='+f(tau,'s')+'   fc='+f(fc,'Hz'), D.clrDim);
  },
};

ENGINE.math_deriv = {
  title: 'Differentiator',
  subtitle: 'Op-Amp RC Differentiation Circuit',
  inputs: [
    { id:'cin', label:'Input Capacitor Cin', val:100, unit:'nF' },
    { id:'rf',  label:'Feedback Resistor Rf', val:10, unit:'kΩ' },
  ],
  tips: [
    'Vout = −Rf×C × d(Vin)/dt',
    'Prone to HF noise amplification — add series Rin = Rf/10',
    'Triangle in → Square out; Sine in → Cosine (+90° lead)',
    'Unity-gain frequency: fu = 1/(2π×Rf×C)',
    'Add Cf in parallel with Rf to limit HF gain',
    'Practical differentiator: Rin limits gain to Rf/Rin at HF',
  ],
  refs: 'TI SLOA049; Op-Amp Applications Handbook Ch.6',
  calc(v, P) {
    const tau = v.rf * 1e3 * v.cin * 1e-9;
    const fu = 1 / (2 * Math.PI * tau);
    P.results = [
      { k:'Time Constant τ',     val:f(tau,'s'),          cls:'good' },
      { k:'Unity-Gain Freq fu',  val:f(fu,'Hz'),           cls:'info' },
      { k:'Phase',               val:'+90° (lead)',        cls:'info' },
      { k:'HF Noise Issue',      val:'Add series Rin',    cls:'warn' },
      { k:'Recommended Rin',     val:f(v.rf*1e3/10,'Ω'),  cls:'info' },
      { k:'Roll-off (above fu)', val:'+20dB/decade',      cls:'info' },
    ];
    P.formula = `τ = Rf×C = ${f(tau,'s')}\nVout = −Rf×C×dVin/dt\nfu = ${f(fu,'Hz')}`;
    P.sb_freq = `fu=${f(fu,'Hz')}`;
    return { tau, fu };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(520,260);
    D.wire(120,240,180,240); D.portLabel(80,245,'Vin');
    D.capacitor(210,240,'C',f(v.cin*1e-9,'F'));
    D.wire(245,240,480,240); D.node(360,240);
    D.wire(480,280,450,280); D.ground(450,280);
    D.wire(360,240,360,140); D.wire(360,140,432,140);
    D.resistor(462,140,'Rf',f(v.rf*1e3,'Ω'));
    D.wire(502,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
  },
};

ENGINE.math_log = {
  title: 'Logarithmic Amplifier',
  subtitle: 'Log Amp Using PN Junction Diode',
  inputs: [{ id:'rin', label:'Input Resistor Rin', val:10, unit:'kΩ' }],
  tips: [
    'Vout = −VT×ln(Vin/(Is×Rin)) where VT≈26mV @ 25°C',
    'Output is temperature-sensitive — use matched BJT pair for compensation',
    'Input must be strictly positive (Vin > 0)',
    'Dynamic range: 5+ decades possible (μA to V)',
    'Use BJT in diode config (collector–base short) for better Is',
    'Temperature compensation circuit needed for precision apps',
  ],
  refs: 'AD8304 Datasheet; LOG104 TI Datasheet; AD AN-311',
  calc(v, P) {
    P.results = [
      { k:'Rin',            val:f(v.rin*1e3,'Ω'),   cls:'info' },
      { k:'VT @ 25°C',      val:'26 mV',             cls:'info' },
      { k:'Formula',        val:'Vout=−VT×ln(Vin/IsR)',cls:'info' },
      { k:'Input Range',    val:'Vin > 0 only',      cls:'warn' },
      { k:'Dynamic Range',  val:'5+ decades',        cls:'good' },
      { k:'Temp Sensitivity',val:'−2mV/°C (Is)',     cls:'warn' },
    ];
    P.formula = `Vout = −VT × ln(Vin / (Is×Rin))\nVT = kT/q ≈ 26mV @ 300K`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(520,260);
    D.wire(120,240,180,240); D.portLabel(80,245,'Vin (>0)');
    D.resistor(210,240,'Rin',f(v.rin*1e3,'Ω')); D.wire(250,240,480,240); D.node(360,240);
    D.wire(480,280,450,280); D.ground(450,280);
    D.wire(360,240,360,140); D.wire(360,140,432,140);
    D.diode(460,140,false); D.labelSmall(450,120,'D1',D.clrText2);
    D.wire(490,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
  },
};

ENGINE.math_antilog = {
  title: 'Anti-Logarithmic Amplifier',
  subtitle: 'Exponential Transfer Function',
  inputs: [{ id:'rf', label:'Feedback Resistor Rf', val:10, unit:'kΩ' }],
  tips: [
    'Vout = −Is×Rf×e^(Vin/VT) — exponential response',
    'Diode at input, resistor in feedback (inverse of log amp)',
    'Output current exponentially depends on input voltage',
    'Used for companding, dB-to-linear conversion',
    'Very temperature-sensitive — requires temp compensation',
    'Combine with log amp for analog multiplication/division',
  ],
  refs: 'AD8310 Datasheet; TI LOG-ANTILOG App Note',
  calc(v, P) {
    P.results = [
      { k:'Feedback Rf',  val:f(v.rf*1e3,'Ω'),         cls:'info' },
      { k:'Formula',      val:'Vout=−Is×Rf×e^(Vin/VT)',cls:'info' },
      { k:'VT',           val:'26 mV @ 25°C',           cls:'info' },
      { k:'Input Range',  val:'±0.6V typical',          cls:'warn' },
    ];
    P.formula = `Vout = −Is×Rf×e^(Vin/VT)`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(520,260);
    D.wire(120,240,190,240); D.portLabel(80,245,'Vin');
    D.diode(218,240,false);
    D.wire(248,240,480,240); D.node(360,240);
    D.wire(480,280,450,280); D.ground(450,280);
    D.wire(360,240,360,140); D.wire(360,140,432,140);
    D.resistor(462,140,'Rf',f(v.rf*1e3,'Ω'));
    D.wire(502,140,580,140); D.wire(580,140,580,260); D.node(580,260);
    D.wire(560,260,660,260); D.portLabel(680,265,'Vout');
  },
};

ENGINE.math_abs = {
  title: 'Absolute Value Circuit',
  subtitle: 'Precision |Vin| — Full-Wave Rectifier',
  inputs: [{ id:'r', label:'All Resistors R', val:10, unit:'kΩ' }],
  tips: [
    'Vout = |Vin| for both positive and negative inputs',
    'Two op-amp, two diode topology',
    'For Vin>0: passes through; For Vin<0: inverts',
    'Accuracy limited by op-amp offset and diode matching',
    'Used for RMS-to-DC conversion and signal rectification',
    'Second op-amp provides inverting gain of −2 for negative input',
  ],
  refs: 'TI SLOA049; AD Op-Amp Applications Ch.6',
  calc(v, P) {
    P.results = [
      { k:'Gain (+Vin)', val:'+1×',      cls:'good' },
      { k:'Gain (−Vin)', val:'+1× (inv)',cls:'good' },
      { k:'Output',      val:'|Vin|',    cls:'good' },
      { k:'Resistors R', val:f(v.r*1e3,'Ω'), cls:'info' },
    ];
    P.formula = `Vout = |Vin|\nFor Vin>0: Vout = Vin\nFor Vin<0: Vout = −Vin`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(300,220,'U1'); D.opamp(580,280,'U2');
    D.wire(80,200,260,200); D.portLabel(40,205,'Vin');
    D.wire(80,200,80,300); D.wire(80,300,260,300);
    D.wire(340,220,380,220); D.diode(400,220,false); D.wire(420,220,460,220);
    D.wire(340,300,380,300); D.diode(400,300,false); D.wire(420,300,460,300);
    D.resistor(490,220,'R',f(v.r*1e3,'Ω')); D.wire(530,220,540,220);
    D.resistor(490,300,'R',f(v.r*1e3,'Ω')); D.wire(530,300,540,280);
    D.wire(540,260,540,330); D.resistor(540,358,'R',f(v.r*1e3,'Ω'),true); D.ground(540,386);
    D.wire(620,280,710,280); D.portLabel(730,285,'|Vout|');
  },
};

/* ============================================================
   ACTIVE FILTERS
   ============================================================ */

ENGINE.filt_lpf = {
  title: 'Active Low-Pass Filter (Sallen-Key)',
  subtitle: '2nd-Order Unity-Gain Low-Pass',
  inputs: [
    { id:'fc', label:'Cutoff Frequency fc', val:1000,  unit:'Hz' },
    { id:'c',  label:'Capacitors C1=C2',    val:10,    unit:'nF' },
    { id:'q',  label:'Q Factor',             val:0.707, unit:'' },
  ],
  tips: [
    'Butterworth: Q=0.7071 — maximally flat passband, −3dB at fc',
    'Chebyshev: Q>0.7071 — sharper rolloff with passband ripple',
    '2nd order gives −40dB/decade rolloff above fc',
    'Use 1% resistors and 5% capacitors for predictable response',
    'Stack two sections for 4th-order (−80dB/decade)',
    'Low component sensitivity — excellent for audio applications',
  ],
  refs: 'TI SLOA049; Analog Devices Filter Design Guide; Zverev "Filter Handbook"',
  calc(v, P) {
    const R = 1 / (2 * Math.PI * v.fc * v.c * 1e-9);
    P.results = [
      { k:'R1 = R2',      val:f(R,'Ω'),         cls:'good' },
      { k:'C1 = C2',      val:f(v.c*1e-9,'F'),  cls:'info' },
      { k:'Cutoff fc',    val:f(v.fc,'Hz'),      cls:'info' },
      { k:'Q Factor',     val:v.q.toFixed(3),    cls:'info' },
      { k:'Roll-off',     val:'−40dB/decade',    cls:'good' },
      { k:'Pass-band gain',val:'0dB (unity)',     cls:'info' },
    ];
    P.formula = `R = 1/(2π×fc×C) = ${f(R,'Ω')}\nQ = ${v.q}`;
    P.sb_freq = `fc=${f(v.fc,'Hz')}`;
    P.bode = { type:'lpf2', fc:v.fc, q:v.q, gain_db:0, gain_lin:1 };
    return { R };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R } = ENGINE.filt_lpf.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(580,260);
    D.wire(80,270,140,270); D.portLabel(40,275,'Vin');
    D.resistor(168,270,'R1',f(R,'Ω')); D.wire(208,270,268,270); D.node(248,270);
    D.resistor(296,270,'R2',f(R,'Ω')); D.wire(336,270,540,270); D.node(418,270);
    D.wire(540,240,540,185); D.wire(540,185,645,185); D.wire(645,185,645,260); D.node(645,260);
    D.wire(625,260,720,260); D.portLabel(740,265,'Vout');
    D.wire(248,270,248,200); D.wire(248,200,358,200);
    D.capacitor(388,200,'C1',f(v.c*1e-9,'F')); D.wire(418,200,645,200); D.node(645,200);
    D.wire(418,270,418,320); D.capacitor(418,348,'C2',f(v.c*1e-9,'F'),true); D.ground(418,376);
  },
};

ENGINE.filt_hpf = {
  title: 'Active High-Pass Filter (Sallen-Key)',
  subtitle: '2nd-Order Unity-Gain High-Pass',
  inputs: [
    { id:'fc', label:'Cutoff Frequency fc', val:1000,  unit:'Hz' },
    { id:'c',  label:'Capacitors C1=C2',    val:10,    unit:'nF' },
    { id:'q',  label:'Q Factor',             val:0.707, unit:'' },
  ],
  tips: [
    'Capacitors and resistors swap positions vs LPF',
    '−40dB/decade rolloff below fc (high-pass behavior)',
    'Same Q design choices: 0.7071=Butterworth',
    'Useful for AC coupling with defined rolloff',
    'Blocks DC while passing audio/signal frequencies',
    'Cascade with LPF section for bandpass filter',
  ],
  refs: 'TI SLOA049; Analog Devices Filter Handbook Ch.8',
  calc(v, P) {
    const R = 1 / (2 * Math.PI * v.fc * v.c * 1e-9);
    P.results = [
      { k:'R1 = R2',     val:f(R,'Ω'),        cls:'good' },
      { k:'C1 = C2',     val:f(v.c*1e-9,'F'), cls:'info' },
      { k:'Cutoff fc',   val:f(v.fc,'Hz'),     cls:'info' },
      { k:'Q Factor',    val:v.q.toFixed(3),   cls:'info' },
      { k:'Roll-off (below fc)', val:'−40dB/decade', cls:'good' },
      { k:'Pass-band gain',      val:'0dB',          cls:'info' },
    ];
    P.formula = `R = 1/(2π×fc×C) = ${f(R,'Ω')}`;
    P.sb_freq = `fc=${f(v.fc,'Hz')}`;
    P.bode = { type:'hpf2', fc:v.fc, q:v.q, gain_db:0, gain_lin:1 };
    return { R };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R } = ENGINE.filt_hpf.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(580,260);
    D.wire(80,270,140,270); D.portLabel(40,275,'Vin');
    D.capacitor(168,270,'C1',f(v.c*1e-9,'F')); D.wire(203,270,258,270); D.node(240,270);
    D.capacitor(286,270,'C2',f(v.c*1e-9,'F')); D.wire(321,270,540,270); D.node(418,270);
    D.wire(540,240,540,185); D.wire(540,185,645,185); D.wire(645,185,645,260); D.node(645,260);
    D.wire(625,260,720,260); D.portLabel(740,265,'Vout');
    D.wire(240,270,240,200); D.wire(240,200,358,200);
    D.resistor(388,200,'R1',f(R,'Ω')); D.wire(428,200,645,200); D.node(645,200);
    D.wire(418,270,418,320); D.resistor(418,348,'R2',f(R,'Ω'),true); D.ground(418,376);
  },
};

ENGINE.filt_bpf = {
  title: 'Band-Pass Filter (MFB)',
  subtitle: 'Multiple Feedback Band-Pass Topology',
  inputs: [
    { id:'f0', label:'Center Frequency f0', val:1000, unit:'Hz' },
    { id:'bw', label:'Bandwidth BW',        val:200,  unit:'Hz' },
    { id:'c',  label:'Capacitors C1=C2',    val:10,   unit:'nF' },
  ],
  tips: [
    'Q = f0/BW — controls selectivity',
    'Higher Q → more selective but component-sensitive',
    'Peak gain = −2Q² (inverting)',
    'For Q > 10, use state-variable filter instead',
    'Component sensitivity increases with Q — use 0.1% for Q>5',
    'Practical BW limit: min BW ≈ f0/10 with standard parts',
  ],
  refs: 'TI SLOA049; UAF42 State-Variable Datasheet; Williams "Filter Design"',
  calc(v, P) {
    const Q = v.f0 / v.bw;
    const C = v.c * 1e-9;
    const R2 = Q / (Math.PI * v.f0 * C);
    const R1 = R2 / (2 * Q * Q);
    const gp = 2 * Q * Q;
    P.results = [
      { k:'Q Factor',    val:Q.toFixed(2),                    cls:'good' },
      { k:'R1 (input)',  val:f(R1,'Ω'),                      cls:'good' },
      { k:'R2 (feedback)',val:f(R2,'Ω'),                     cls:'good' },
      { k:'Peak Gain',   val:`${gp.toFixed(1)}× (${(20*Math.log10(gp)).toFixed(1)}dB)`, cls:'info' },
      { k:'Center f0',   val:f(v.f0,'Hz'),                   cls:'info' },
      { k:'Bandwidth BW',val:f(v.bw,'Hz'),                   cls:'info' },
    ];
    P.formula = `Q = f0/BW = ${Q.toFixed(2)}\nR2 = Q/(π×f0×C) = ${f(R2,'Ω')}\nR1 = R2/(2Q²) = ${f(R1,'Ω')}`;
    P.sb_freq = `f0=${f(v.f0,'Hz')} Q=${Q.toFixed(1)}`;
    P.bode = { type:'bpf', f0:v.f0, Q, gain_db:20*Math.log10(gp), gain_lin:gp };
    return { Q, R1, R2 };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R1, R2 } = ENGINE.filt_bpf.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(580,260);
    D.wire(540,280,510,280); D.ground(510,280);
    D.wire(80,240,140,240); D.portLabel(40,245,'Vin');
    D.resistor(168,240,'R1',f(R1,'Ω')); D.wire(208,240,290,240); D.node(268,240);
    D.capacitor(318,240,'C1',f(v.c*1e-9,'F')); D.wire(353,240,540,240); D.node(448,240);
    D.wire(268,240,268,310); D.capacitor(268,338,'C2',f(v.c*1e-9,'F'),true); D.ground(268,366);
    D.wire(448,240,448,150); D.wire(448,150,518,150);
    D.resistor(550,150,'R2',f(R2,'Ω'));
    D.wire(590,150,645,150); D.wire(645,150,645,260); D.node(645,260);
    D.wire(625,260,730,260); D.portLabel(750,265,'Vout');
  },
};

ENGINE.filt_notch = {
  title: 'Notch Filter (Twin-T)',
  subtitle: 'Active Band-Stop — Deep Null at f0',
  inputs: [
    { id:'f0', label:'Notch Frequency f0', val:50,  unit:'Hz' },
    { id:'c',  label:'Capacitor C',        val:100, unit:'nF' },
  ],
  tips: [
    'Twin-T network provides theoretically infinite attenuation at f0',
    'Practical notch depth depends on component precision',
    'Active buffering with positive feedback improves depth >40dB',
    'Use 0.1% parts for deep notch performance',
    'Classic application: 50/60Hz power-line hum rejection',
    'Q depends on positive feedback ratio — adjust for sharpness',
  ],
  refs: 'TI SLOA049; AD AN-649; Maxim App Note 733',
  calc(v, P) {
    const C = v.c * 1e-9;
    const R = 1 / (2 * Math.PI * v.f0 * C);
    P.results = [
      { k:'R (×3 matched)',     val:f(R,'Ω'),     cls:'good' },
      { k:'C (×2 matched)',     val:f(C,'F'),     cls:'info' },
      { k:'2C (center shunt)',  val:f(2*C,'F'),   cls:'info' },
      { k:'R/2 (center shunt)', val:f(R/2,'Ω'),  cls:'info' },
      { k:'Notch at f0',        val:f(v.f0,'Hz'), cls:'warn' },
      { k:'Theoretical depth',  val:'−∞ dB (ideal)',cls:'good' },
    ];
    P.formula = `f0 = 1/(2π×R×C)\nR = 1/(2π×f0×C) = ${f(R,'Ω')}`;
    P.sb_freq = `f_notch=${f(v.f0,'Hz')}`;
    P.bode = { type:'notch', f0:v.f0, Q:0.5, gain_db:0, gain_lin:1 };
    return { R, C };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R, C } = ENGINE.filt_notch.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(660,260);
    D.wire(80,260,140,260); D.portLabel(40,265,'Vin');
    D.wire(140,260,140,180); D.wire(140,260,140,340);
    D.wire(140,180,190,180); D.resistor(218,180,'R',f(R,'Ω')); D.wire(258,180,320,180); D.node(300,180);
    D.resistor(348,180,'R',f(R,'Ω')); D.wire(388,180,550,180);
    D.wire(300,180,300,228); D.capacitor(300,256,'2C',f(2*C,'F'),true); D.ground(300,284);
    D.wire(140,340,190,340); D.capacitor(218,340,'C',f(C,'F')); D.wire(253,340,320,340); D.node(300,340);
    D.capacitor(348,340,'C',f(C,'F')); D.wire(383,340,550,340);
    D.wire(300,340,300,380); D.resistor(300,408,'R/2',f(R/2,'Ω'),true); D.ground(300,436);
    D.wire(550,180,550,280); D.wire(550,340,550,280); D.wire(550,280,620,280);
    D.wire(620,240,580,240); D.wire(580,240,580,160); D.wire(580,160,722,160); D.wire(722,160,722,260); D.node(722,260);
    D.wire(700,260,800,260); D.portLabel(820,265,'Vout');
  },
};

ENGINE.filt_allpass = {
  title: 'All-Pass Filter (Phase Shifter)',
  subtitle: 'Flat Magnitude, Frequency-Dependent Phase',
  inputs: [
    { id:'f0', label:'Phase-Shift Freq f0', val:1000, unit:'Hz' },
    { id:'r',  label:'Resistor R',          val:10,   unit:'kΩ' },
  ],
  tips: [
    'All frequencies pass with equal gain (0dB) — only phase changes',
    'Phase shifts −180° as frequency goes from 0 to ∞',
    'At f0: phase = −90°',
    'Used for phase equalization and group delay correction',
    'Cascade multiple stages to build analog delay lines',
    'Combine with direct signal path for FIR-like responses',
  ],
  refs: 'TI SLOA049; Williams "Active Filter Design" Ch.9',
  calc(v, P) {
    const C = 1 / (2 * Math.PI * v.f0 * v.r * 1e3);
    P.results = [
      { k:'Resistor R',          val:f(v.r*1e3,'Ω'), cls:'info' },
      { k:'Capacitor C',         val:f(C,'F'),        cls:'good' },
      { k:'f0 (−90° phase)',     val:f(v.f0,'Hz'),    cls:'info' },
      { k:'Gain (all freqs)',    val:'1.000 (0dB)',   cls:'good' },
      { k:'Phase @ f << f0',    val:'≈ 0°',           cls:'info' },
      { k:'Phase @ f >> f0',    val:'≈ −180°',        cls:'info' },
    ];
    P.formula = `C = 1/(2π×f0×R) = ${f(C,'F')}\nPhase = −2×arctan(f/f0)`;
    P.sb_freq = `f0=${f(v.f0,'Hz')}`;
    P.bode = { type:'allpass', f0:v.f0 };
    return { C };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { C } = ENGINE.filt_allpass.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(520,260);
    D.wire(80,260,180,260); D.portLabel(40,265,'Vin');
    D.wire(180,260,180,180); D.wire(180,260,180,340);
    D.resistor(208,180,'R',f(v.r*1e3,'Ω')); D.wire(248,180,350,180); D.wire(350,180,350,218);
    D.capacitor(350,246,'C',f(C,'F'),true); D.ground(350,274);
    D.wire(350,180,480,180); D.wire(480,180,480,270);
    D.wire(180,340,230,340); D.resistor(258,340,'R',f(v.r*1e3,'Ω')); D.wire(298,340,358,340); D.node(340,340);
    D.wire(340,340,340,240); D.wire(340,240,480,240);
    D.wire(340,340,340,400); D.resistor(340,428,'R',f(v.r*1e3,'Ω'),true); D.ground(340,456);
    D.wire(560,260,640,260); D.wire(640,260,640,340); D.wire(640,340,340,340); D.node(640,260);
    D.wire(560,260,730,260); D.portLabel(750,265,'Vout');
  },
};

ENGINE.filt_butter = {
  title: 'Butterworth 2nd-Order LPF',
  subtitle: 'Maximally Flat Magnitude Response',
  inputs: [
    { id:'fc',   label:'−3dB Frequency',  val:1000, unit:'Hz' },
    { id:'c',    label:'Capacitor C',     val:10,   unit:'nF' },
    { id:'gain', label:'Pass-Band Gain',  val:1,    unit:'', min:1 },
  ],
  tips: [
    'Butterworth: maximally flat — no passband ripple',
    'Q = 0.7071 for perfect Butterworth response',
    '−3dB at exactly fc',
    '−40dB/decade beyond fc',
    'Avoid gain > 3 — creates Chebyshev-like overshoot',
    'For gain > 1, resistor divider sets non-unity gain at buffer stage',
  ],
  refs: 'AD Filter Design Guide; TI SLOA049; Zverev "Handbook of Filter Synthesis"',
  calc(v, P) {
    const R = 1 / (2 * Math.PI * v.fc * v.c * 1e-9);
    const Rf = v.gain > 1 ? (v.gain - 1) * R : 0;
    P.results = [
      { k:'R1 = R2',        val:f(R,'Ω'),            cls:'good' },
      { k:'C1 = C2',        val:f(v.c*1e-9,'F'),     cls:'info' },
      { k:'Q (Butterworth)',val:'0.7071',             cls:'good' },
      { k:'Pass-band Gain', val:`${v.gain}×`,         cls:'info' },
      { k:'−3dB at fc',     val:f(v.fc,'Hz'),         cls:'info' },
      { k:'Feedback Rf',    val:v.gain>1?f(Rf,'Ω'):'Short (unity)', cls:'info' },
    ];
    P.formula = `Q = 0.7071 (Butterworth)\nR = 1/(2π×fc×C) = ${f(R,'Ω')}`;
    P.sb_freq = `fc=${f(v.fc,'Hz')}`;
    P.bode = { type:'lpf2', fc:v.fc, q:0.7071, gain_db:20*Math.log10(v.gain), gain_lin:v.gain };
    return { R, Rf };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R, Rf } = ENGINE.filt_butter.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(580,260);
    D.wire(80,270,140,270); D.portLabel(40,275,'Vin');
    D.resistor(168,270,'R1',f(R,'Ω')); D.wire(208,270,268,270); D.node(248,270);
    D.resistor(296,270,'R2',f(R,'Ω')); D.wire(336,270,540,270); D.node(418,270);
    D.wire(248,270,248,200); D.wire(248,200,358,200);
    D.capacitor(388,200,'C1',f(v.c*1e-9,'F')); D.wire(418,200,645,200); D.node(645,200);
    D.wire(418,270,418,320); D.capacitor(418,348,'C2',f(v.c*1e-9,'F'),true); D.ground(418,376);
    if (v.gain > 1) {
      D.wire(540,240,500,240); D.wire(500,240,500,310); D.resistor(500,338,'Rg',f(R,'Ω'),true); D.ground(500,366);
      D.wire(500,240,500,185); D.resistor(530,185,'Rf',f(Rf,'Ω')); D.wire(570,185,645,185); D.node(645,185);
    } else {
      D.wire(540,240,540,185); D.wire(540,185,645,185);
    }
    D.wire(645,185,645,200); D.wire(645,200,645,260); D.node(645,260);
    D.wire(625,260,720,260); D.portLabel(740,265,'Vout');
  },
};

/* ============================================================
   OSCILLATORS
   ============================================================ */

ENGINE.osc_wien = {
  title: 'Wien Bridge Oscillator',
  subtitle: 'Low-Distortion Sine Wave Generator',
  inputs: [
    { id:'f', label:'Oscillation Frequency', val:1000, unit:'Hz' },
    { id:'c', label:'Capacitors C',          val:10,   unit:'nF' },
  ],
  tips: [
    'Gain must be exactly 3 for sustained oscillation (Av=1+Rf/R1=3)',
    'Rf=2×R1; use thermistor/lamp for automatic gain control (AGC)',
    'AGC lamp provides excellent amplitude stability via thermal lag',
    'f = 1/(2π×R×C) — keep R and C matched for accuracy',
    'Use precision resistors and capacitors for best frequency accuracy',
    'Original HP-200A (1939 Hewlett) used this topology',
  ],
  refs: 'HP Journal 1939; TI SLOA049; Electronic Design App Note',
  calc(v, P) {
    const C = v.c * 1e-9;
    const R = 1 / (2 * Math.PI * v.f * C);
    P.results = [
      { k:'Frequency R',     val:f(R,'Ω'),       cls:'good' },
      { k:'Frequency C',     val:f(C,'F'),       cls:'info' },
      { k:'Gain Av (must=3)',val:'3×',           cls:'good' },
      { k:'Rf = 2×R1',       val:f(20000,'Ω'),  cls:'info' },
      { k:'R1',              val:f(10000,'Ω'),  cls:'info' },
      { k:'Formula',         val:'f=1/(2πRC)',  cls:'info' },
    ];
    P.formula = `f = 1/(2π×R×C)\nR = ${f(R,'Ω')}\nAv = 3 (Rf=2R1)`;
    P.sb_freq = `f=${f(v.f,'Hz')}`;
    return { R, C };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R, C } = ENGINE.osc_wien.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(480,260);
    D.wire(520,260,630,260); D.portLabel(650,265,'Vout'); D.node(600,260);
    D.wire(600,260,600,160); D.wire(600,160,510,160);
    D.resistor(478,160,'Rf',f(20000,'Ω')); D.wire(448,160,380,160);
    D.wire(380,160,380,240); D.node(380,240); D.wire(380,240,440,240);
    D.wire(380,240,340,240); D.resistor(308,240,'R1',f(10000,'Ω')); D.wire(278,240,260,240); D.ground(260,240);
    D.wire(600,260,600,360); D.wire(600,360,524,360);
    D.capacitor(494,360,'C',f(C,'F')); D.resistor(434,360,'R',f(R,'Ω')); D.wire(404,360,360,360); D.wire(360,360,360,280); D.node(360,280); D.wire(360,280,440,280);
    D.wire(360,280,300,280); D.node(300,280);
    D.wire(300,280,300,330); D.capacitor(300,358,'C',f(C,'F'),true);
    D.wire(300,280,240,280); D.resistor(240,310,'R',f(R,'Ω'),true); D.wire(240,340,240,370); D.wire(240,370,300,370); D.ground(270,370);
  },
};

ENGINE.osc_rc = {
  title: 'RC Phase Shift Oscillator',
  subtitle: '3-Stage RC Ladder, 60° Phase Shift Each',
  inputs: [
    { id:'f', label:'Target Frequency', val:1000, unit:'Hz' },
    { id:'c', label:'Capacitor C/stage', val:10, unit:'nF' },
  ],
  tips: [
    'Each RC stage provides 60° phase shift; 3 stages = 180°',
    '180° from RC + 180° from inverting amp = 360° loop phase',
    'Gain must be ≥ 29 for oscillation (Rf ≥ 29×R)',
    'f = 1/(2π×R×C×√6)',
    'Frequency accuracy limited by component tolerance',
    'Add AGC (automatic gain control) for stable sine amplitude',
  ],
  refs: 'Sedra/Smith "Microelectronics Circuits" Ch.10; TI SLOA049',
  calc(v, P) {
    const C = v.c * 1e-9;
    const R = 1 / (2 * Math.PI * v.f * C * Math.sqrt(6));
    const Rf = 29 * R;
    P.results = [
      { k:'RC Stage Resistor R', val:f(R,'Ω'),       cls:'good' },
      { k:'RC Stage Cap C',      val:f(C,'F'),        cls:'info' },
      { k:'Feedback Rf (≥29R)', val:f(Rf,'Ω'),       cls:'good' },
      { k:'Minimum Gain',        val:'29× (29dB)',    cls:'warn' },
      { k:'Phase/Stage',         val:'60° (3 stages)',cls:'info' },
      { k:'Loop Phase',          val:'360°',          cls:'info' },
    ];
    P.formula = `f = 1/(2π×R×C×√6)\nR = ${f(R,'Ω')}\nRf = 29×R = ${f(Rf,'Ω')}`;
    P.sb_freq = `f=${f(v.f,'Hz')}`;
    return { R, Rf, C };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R, Rf, C } = ENGINE.osc_rc.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(610,260);
    D.wire(550,280,520,280); D.ground(520,280);
    D.wire(650,260,740,260); D.portLabel(760,265,'Vout'); D.node(700,260);
    D.wire(700,260,700,120); D.wire(700,120,80,120); D.wire(80,120,80,240);
    [120,260,400].forEach(x => {
      D.capacitor(x,240,'C',f(C,'F')); D.wire(x+38,240,x+100,240); D.node(x+80,240);
      D.wire(x+80,240,x+80,290); D.resistor(x+80,318,'R',f(R,'Ω'),true); D.ground(x+80,346);
    });
    D.resistor(510,240,'R',f(R,'Ω')); D.wire(550,240,570,240); D.node(550,240);
    D.wire(550,240,550,170); D.resistor(575,170,'Rf',f(Rf,'Ω')); D.wire(615,170,700,170);
  },
};

ENGINE.osc_astable = {
  title: 'Astable Multivibrator',
  subtitle: 'Op-Amp Square Wave Relaxation Oscillator',
  inputs: [
    { id:'f', label:'Frequency',        val:500,  unit:'Hz' },
    { id:'c', label:'Timing Capacitor', val:100, unit:'nF' },
  ],
  tips: [
    'f ≈ 1/(2.2×R×C) when R1=R2 (50% duty cycle)',
    'Duty cycle adjustable by changing R1/R2 ratio',
    'Output swings between ±Vsat of op-amp supply',
    'Use comparator (LM393) for clean rail-to-rail output',
    'Triangle wave available at capacitor node',
    'Add 1kΩ output resistor to protect op-amp output stage',
  ],
  refs: 'TI SLOA049; LM741 App Note; Sedra/Smith Ch.13',
  calc(v, P) {
    const C = v.c * 1e-9;
    const R = 1 / (2.2 * v.f * C);
    P.results = [
      { k:'Timing Resistor R', val:f(R,'Ω'),     cls:'good' },
      { k:'Timing Cap C',      val:f(C,'F'),      cls:'info' },
      { k:'Frequency',         val:f(v.f,'Hz'),   cls:'info' },
      { k:'Duty Cycle',        val:'50% (R1=R2)', cls:'info' },
      { k:'Divider R1=R2',     val:'10kΩ each',   cls:'info' },
      { k:'Output Waveform',   val:'Square Wave', cls:'good' },
    ];
    P.formula = `f ≈ 1/(2.2×R×C)\nR = ${f(R,'Ω')}`;
    P.sb_freq = `f=${f(v.f,'Hz')}`;
    return { R, C };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R, C } = ENGINE.osc_astable.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(480,260);
    D.wire(520,260,630,260); D.portLabel(650,265,'Vout_SQ'); D.node(590,260);
    D.wire(590,260,590,160); D.wire(590,160,465,160);
    D.resistor(432,160,'R',f(R,'Ω')); D.wire(402,160,360,160); D.wire(360,160,360,240); D.node(360,240); D.wire(360,240,440,240);
    D.wire(360,240,318,240); D.capacitor(318,268,'C',f(C,'F'),true); D.ground(318,296);
    D.wire(590,260,590,360); D.wire(590,360,513,360);
    D.resistor(480,360,'R2',f(10000,'Ω')); D.wire(450,360,410,360); D.wire(410,360,410,280); D.node(410,280); D.wire(410,280,440,280);
    D.wire(410,280,360,280); D.resistor(360,308,'R1',f(10000,'Ω'),true); D.ground(360,336);
  },
};

ENGINE.osc_crystal = {
  title: 'Crystal Oscillator',
  subtitle: 'Piezoelectric Resonator — Ultra-Stable',
  inputs: [
    { id:'fxtal', label:'Crystal Frequency', val:8000000, unit:'Hz' },
    { id:'cl',    label:'Load Caps CL',      val:18,      unit:'pF' },
  ],
  tips: [
    'Crystal Q: 10,000–1,000,000 (vs ~100 for LC)',
    'Load capacitors CL tune the resonance frequency',
    'Feedback resistor Rf ≈ 1MΩ biases inverter in linear region',
    'Use CMOS inverter (74HC04) as amplifier',
    'Keep traces short — stray capacitance shifts frequency',
    'Series resistance Rs limits drive level to prevent aging',
  ],
  refs: 'Epson AN-835; TI SCHA002; Abracon Crystal Oscillator Design Guide',
  calc(v, P) {
    P.results = [
      { k:'Crystal Frequency', val:f(v.fxtal,'Hz'),      cls:'good' },
      { k:'Load Caps CL',      val:f(v.cl*1e-12,'F')+' ea',cls:'info' },
      { k:'Feedback Rf',       val:'1 MΩ (bias)',        cls:'info' },
      { k:'Stability',         val:'±50ppm typical',     cls:'good' },
      { k:'Q Factor',          val:'10k–1M',             cls:'good' },
      { k:'Mode',              val:'Parallel resonance', cls:'info' },
    ];
    P.formula = `f_osc ≈ f_series×(1 + Cm/(2C0))\nLoad tuning: ΔCL → Δf`;
    P.sb_freq = `f=${f(v.fxtal,'Hz')}`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    // Crystal symbol
    const drawXtal = (x, y) => {
      const c = D.ctx;
      c.save(); c.translate(x, y);
      c.strokeStyle = D.clrComp; c.lineWidth = 2; c.setLineDash([]);
      c.beginPath(); c.moveTo(-22,0); c.lineTo(-8,0); c.stroke();
      c.beginPath(); c.rect(-8,-12,6,24); c.fillStyle=D.clrComp; c.fill(); c.stroke();
      c.beginPath(); c.rect(2,-16,6,32); c.fillStyle='transparent'; c.stroke();
      c.beginPath(); c.moveTo(8,0); c.lineTo(22,0); c.stroke();
      c.restore();
      D.labelSmall(x-14,y-24,'XTAL',D.clrText2);
    };
    // Inverter triangle
    const c = D.ctx;
    c.strokeStyle=D.clrComp; c.lineWidth=2; c.setLineDash([]);
    c.beginPath(); c.moveTo(240,238); c.lineTo(290,258); c.lineTo(240,278); c.closePath(); c.stroke();
    c.beginPath(); c.arc(294,258,4,0,Math.PI*2); c.stroke();
    D.portLabel(245,262,'INV',D.clrText2);
    D.wire(180,258,240,258); D.wire(298,258,380,258); D.node(350,258);
    D.wire(350,258,350,178); D.wire(350,178,216,178); D.wire(216,178,216,258);
    drawXtal(283,178);
    D.wire(216,258,180,258); D.wire(180,258,180,318); D.capacitor(180,346,'CL',f(v.cl*1e-12,'F'),true); D.ground(180,374);
    D.wire(350,258,350,318); D.capacitor(350,346,'CL',f(v.cl*1e-12,'F'),true); D.ground(350,374);
    D.wire(216,178,216,138); D.resistor(248,138,'Rf',f(1e6,'Ω')); D.wire(288,138,350,138); D.wire(350,138,350,178);
    D.wire(380,258,500,258); D.portLabel(520,263,'f='+f(v.fxtal,'Hz'));
  },
};

ENGINE.osc_colpitts = {
  title: 'Colpitts LC Oscillator',
  subtitle: 'Capacitive Voltage Divider Feedback',
  inputs: [
    { id:'l',  label:'Inductance L',  val:100, unit:'μH' },
    { id:'c1', label:'Capacitor C1',  val:100, unit:'pF' },
    { id:'c2', label:'Capacitor C2',  val:100, unit:'pF' },
  ],
  tips: [
    'f = 1/(2π√(L×Ceq)), Ceq = C1×C2/(C1+C2)',
    'Voltage divider C1/C2 feeds back portion of output',
    'Gain ≥ C2/C1 needed for oscillation to start',
    'Air-core coils for RF; ferrite core for sub-MHz',
    'Q of LC tank determines phase noise',
    'Replace C2 with varactor for VCO (voltage-controlled oscillator)',
  ],
  refs: 'ARRL Handbook; Bahl "RF & Microwave Transistor Amplifiers"',
  calc(v, P) {
    const L = v.l * 1e-6, C1 = v.c1 * 1e-12, C2 = v.c2 * 1e-12;
    const Ceq = (C1 * C2) / (C1 + C2);
    const fo = 1 / (2 * Math.PI * Math.sqrt(L * Ceq));
    P.results = [
      { k:'Frequency',   val:f(fo,'Hz'),                 cls:'good' },
      { k:'Ceq (C1‖C2)', val:f(Ceq,'F'),                 cls:'info' },
      { k:'Inductance L',val:f(L,'H'),                   cls:'info' },
      { k:'Min Gain',    val:`C2/C1=${(v.c2/v.c1).toFixed(2)}×`,cls:'warn' },
      { k:'Formula',     val:'f=1/(2π√(L×Ceq))',        cls:'info' },
      { k:'Tank Q',      val:'Depends on coil',          cls:'info' },
    ];
    P.formula = `Ceq = C1×C2/(C1+C2) = ${f(Ceq,'F')}\nf = 1/(2π√(L×Ceq)) = ${f(fo,'Hz')}`;
    P.sb_freq = `f=${f(fo,'Hz')}`;
    return { fo, Ceq };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { fo } = ENGINE.osc_colpitts.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(400,260,'A1');
    D.wire(440,260,560,260); D.node(520,260);
    D.portLabel(580,265,'Vout='+f(fo,'Hz'));
    D.wire(520,260,520,160);
    D.inductor(520,160,'L',f(v.l*1e-6,'H'));
    D.wire(470,160,390,160); D.wire(390,160,390,240); D.node(390,240); D.wire(390,240,360,240);
    D.wire(300,240,268,240);
    D.capacitor(268,268,'C1',f(v.c1*1e-12,'F'),true); D.wire(268,296,268,328); D.node(268,328);
    D.capacitor(268,356,'C2',f(v.c2*1e-12,'F'),true); D.ground(268,384);
    D.wire(268,328,330,328); D.wire(330,328,330,280); D.wire(330,280,360,280);
  },
};

/* ============================================================
   COMPARATORS
   ============================================================ */

ENGINE.nl_comp = {
  title: 'Voltage Comparator',
  subtitle: 'Open-Loop — No Feedback, Full Swing Output',
  inputs: [
    { id:'vref', label:'Reference Voltage Vref', val:2.5, unit:'V' },
    { id:'vcc',  label:'Supply ±Vcc',            val:15,  unit:'V' },
  ],
  tips: [
    'Open-loop — output saturates fully at ±Vsat',
    'Use dedicated comparators (LM393, LT1011) not general op-amps',
    'Comparators have faster slew rate and logic-compatible outputs',
    'Always add hysteresis to prevent chattering on noisy signals',
    'LM393 open-collector output: needs pull-up resistor',
    'Response time: LM393=1.3μs; LT1011=100ns; TLV3201=7ns',
  ],
  refs: 'LM393 Datasheet TI; LT1011 Datasheet; Horowitz "Art of Electronics" Ch.9',
  calc(v, P) {
    P.results = [
      { k:'Threshold Vref',     val:f(v.vref,'V'),              cls:'info' },
      { k:'Vout if Vin > Vref', val:`+${v.vcc}V (sat)`,        cls:'good' },
      { k:'Vout if Vin < Vref', val:`−${v.vcc}V (sat)`,        cls:'warn' },
      { k:'Output Swing',       val:f(2*v.vcc,'V'),             cls:'info' },
      { k:'Hysteresis',         val:'None (see Schmitt Trigger)',cls:'warn' },
      { k:'Response Time',      val:'< 1μs typical',            cls:'good' },
    ];
    P.formula = `If Vin > Vref → Vout ≈ +${v.vcc}V\nIf Vin < Vref → Vout ≈ −${v.vcc}V`;
    P.sb_gain = `Vref=${v.vref}V`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(480,260);
    D.wire(320,240,440,240); D.portLabel(280,245,'Vin');
    D.wire(320,280,380,280); D.portLabel(250,285,`Vref=${v.vref}V`); D.wire(380,280,440,280);
    D.wire(480,210,480,174); D.portLabel(458,168,`+${v.vcc}V`,'#ef4444');
    D.wire(480,310,480,346); D.portLabel(458,360,`−${v.vcc}V`,'#38bdf8');
    D.wire(520,260,620,260); D.portLabel(640,265,'Vout');
  },
};

ENGINE.nl_schmitt = {
  title: 'Schmitt Trigger (Inverting)',
  subtitle: 'Comparator with Precision Hysteresis',
  inputs: [
    { id:'vcc', label:'Supply ±Vcc',        val:15,  unit:'V' },
    { id:'vth', label:'Threshold ±Vth',     val:3,   unit:'V' },
    { id:'r1',  label:'Feedback R1',        val:100, unit:'kΩ' },
  ],
  tips: [
    'Hysteresis prevents chattering on noisy signals',
    'UTP = +Vth, LTP = −Vth — hysteresis band = 2×Vth',
    'R2 = R1×Vth/(Vcc−Vth)',
    'Non-inverting variant: swap Vin and Vref connections',
    'Use for clean digital recovery from noisy analog signals',
    'CMOS Schmitt trigger ICs (74HC14) available for simplicity',
  ],
  refs: 'TI SLOA049; LM741 Schmitt Trigger App Note; Sedra/Smith Ch.14',
  calc(v, P) {
    const R2 = (v.vth * v.r1 * 1e3) / (v.vcc - v.vth);
    P.results = [
      { k:'R2 (to ground)',  val:f(R2,'Ω'),       cls:'good' },
      { k:'R1 (feedback)',   val:f(v.r1*1e3,'Ω'), cls:'info' },
      { k:'UTP',             val:`+${v.vth}V`,    cls:'info' },
      { k:'LTP',             val:`−${v.vth}V`,    cls:'info' },
      { k:'Hysteresis Band', val:f(2*v.vth,'V'),  cls:'good' },
      { k:'Formula',         val:'R2=R1×Vth/(Vcc−Vth)',cls:'info' },
    ];
    P.formula = `R2 = R1×Vth/(Vcc−Vth) = ${f(R2,'Ω')}\nHysteresis = 2×Vth = ${2*v.vth}V`;
    P.sb_gain = `Hyst=${2*v.vth}V`;
    return { R2 };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { R2 } = ENGINE.nl_schmitt.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(480,260);
    D.wire(320,240,440,240); D.portLabel(280,245,'Vin');
    D.wire(440,280,390,280); D.node(390,280); D.wire(390,280,390,345);
    D.resistor(390,373,'R2',f(R2,'Ω'),true); D.ground(390,401);
    D.wire(390,280,390,178); D.wire(390,178,444,178);
    D.resistor(476,178,'R1',f(v.r1*1e3,'Ω')); D.wire(516,178,573,178); D.wire(573,178,573,260); D.node(573,260);
    D.wire(520,260,640,260); D.portLabel(660,265,'Vout');
  },
};

ENGINE.nl_window = {
  title: 'Window Comparator',
  subtitle: 'Signal-In-Range Detector',
  inputs: [
    { id:'vhi', label:'Upper Threshold VH', val:4, unit:'V' },
    { id:'vlo', label:'Lower Threshold VL', val:2, unit:'V' },
  ],
  tips: [
    'Output HIGH when VL < Vin < VH (inside window)',
    'Two comparators; outputs combined via diodes (wire-OR)',
    'Use LM393 (dual comparator) for compact design',
    'Pull-up resistor required on open-collector output',
    'Classic application: battery level monitoring',
    'Add individual hysteresis to each comparator for noise immunity',
  ],
  refs: 'LM393 App Note; TI SLOA049; Maxim App Note 3616',
  calc(v, P) {
    P.results = [
      { k:'Upper Threshold VH', val:f(v.vhi,'V'),       cls:'info' },
      { k:'Lower Threshold VL', val:f(v.vlo,'V'),       cls:'info' },
      { k:'Window Width',       val:f(v.vhi-v.vlo,'V'), cls:'good' },
      { k:'Midpoint',           val:f((v.vhi+v.vlo)/2,'V'),cls:'info' },
      { k:'Output HIGH when',   val:`${v.vlo}V < Vin < ${v.vhi}V`,cls:'good' },
      { k:'Comparators needed', val:'2× (e.g. LM393)', cls:'info' },
    ];
    P.formula = `Window = VH − VL = ${v.vhi-v.vlo}V\nOutput = HIGH when VL < Vin < VH`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(360,180,'U1'); D.opamp(360,360,'U2');
    D.wire(80,160,320,160); D.portLabel(40,165,'Vin');
    D.wire(80,160,80,340); D.wire(80,340,320,340);
    D.wire(320,200,275,200); D.portLabel(195,205,`VH=${v.vhi}V`); D.wire(275,200,320,200);
    D.wire(320,380,275,380); D.portLabel(195,385,`VL=${v.vlo}V`); D.wire(275,380,320,380);
    D.wire(400,180,440,180); D.diode(458,180,false); D.wire(478,180,520,180); D.node(520,180);
    D.wire(400,360,440,360); D.diode(458,360,false); D.wire(478,360,520,360); D.wire(520,360,520,180);
    D.wire(520,180,570,180); D.wire(570,180,570,136); D.resistor(570,108,'Rp',f(10000,'Ω'),true); D.portLabel(596,96,'+5V','#ef4444');
    D.wire(570,180,650,180); D.portLabel(670,185,'Vout');
  },
};

/* ============================================================
   NON-LINEAR
   ============================================================ */

ENGINE.nl_rect = {
  title: 'Precision Half-Wave Rectifier',
  subtitle: 'Eliminates 0.7V Diode Forward Drop',
  inputs: [
    { id:'rin', label:'Input Resistor Rin', val:10, unit:'kΩ' },
    { id:'rf',  label:'Feedback Rf',        val:10, unit:'kΩ' },
  ],
  tips: [
    'Eliminates the 0.6–0.7V forward drop of standard diodes',
    'Output follows input precisely for positive half-cycle only',
    'For full-wave rectifier, add an inverting summing stage',
    'Gain = Rf/Rin for the active half-cycle',
    'Use fast-recovery op-amp for signals above 1kHz',
    'Op-amp corrects for diode drop via negative feedback',
  ],
  refs: 'Horowitz "Art of Electronics" Ch.4; TI SLOA049; AD Op-Amp Apps Ch.6',
  calc(v, P) {
    const gain = v.rf / v.rin;
    P.results = [
      { k:'Active-Cycle Gain', val:`−${gain.toFixed(2)}×`, cls:'good' },
      { k:'Threshold',         val:'0.000 V (precise)',    cls:'good' },
      { k:'Rin',               val:f(v.rin*1e3,'Ω'),      cls:'info' },
      { k:'Rf',                val:f(v.rf*1e3,'Ω'),       cls:'info' },
      { k:'Key Advantage',     val:'No diode drop error', cls:'good' },
      { k:'HF note',           val:'Use fast op-amp',     cls:'warn' },
    ];
    P.formula = `Vout = −(Rf/Rin)×Vin for Vin > 0\nVout = 0 for Vin < 0`;
    return { gain };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(490,260);
    D.wire(180,240,250,240); D.portLabel(140,245,'Vin');
    D.resistor(278,240,'Rin',f(v.rin*1e3,'Ω')); D.wire(318,240,450,240); D.node(368,240);
    D.wire(450,280,420,280); D.ground(420,280);
    D.wire(368,240,368,155); D.wire(368,155,442,155);
    D.diode(468,155,false); D.labelSmall(450,136,'D1',D.clrText2);
    D.wire(498,155,558,155); D.wire(558,155,558,260); D.node(558,260);
    D.wire(368,155,368,100); D.wire(368,100,438,100);
    D.resistor(468,100,'Rf',f(v.rf*1e3,'Ω')); D.wire(508,100,628,100); D.node(628,100);
    D.wire(628,100,628,260); D.node(628,260);
    D.diode(600,260,false); D.labelSmall(580,244,'D2',D.clrText2);
    D.wire(548,260,584,260);
    D.wire(628,260,720,260); D.portLabel(740,265,'Vout');
  },
};

ENGINE.nl_peak = {
  title: 'Peak Detector',
  subtitle: 'Track-and-Hold Peak Signal Amplitude',
  inputs: [
    { id:'c',   label:'Hold Capacitor C',  val:100, unit:'nF' },
    { id:'rin', label:'Input Resistor Rin',val:1,   unit:'kΩ' },
  ],
  tips: [
    'Captures and holds the peak amplitude of a waveform',
    'Larger C → slower droop but slower peak tracking speed',
    'Droop rate ≈ I_leakage / C (use low-leakage cap)',
    'Add MOSFET switch to reset hold capacitor on command',
    'Buffer op-amp prevents capacitor discharge into load',
    'Two-op-amp version eliminates diode drop error',
  ],
  refs: 'TI SLOA049; Maxim App Note 1490; AD Op-Amp Applications Ch.6',
  calc(v, P) {
    const tau = v.rin * 1e3 * v.c * 1e-9;
    P.results = [
      { k:'Hold Capacitor',  val:f(v.c*1e-9,'F'),  cls:'info' },
      { k:'Charge τ = RC',   val:f(tau,'s'),        cls:'info' },
      { k:'Droop Rate',      val:'I_leak/C',        cls:'warn' },
      { k:'Hold Time (90%)', val:f(2.3*tau,'s'),    cls:'info' },
      { k:'Buffer',          val:'Prevents discharge',cls:'good' },
      { k:'Reset',           val:'Add MOSFET switch',cls:'info' },
    ];
    P.formula = `τ = R×C = ${f(tau,'s')}\nDroop = I_leak/C`;
    return { tau };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(290,240,'U1'); D.opamp(590,270,'U2');
    D.wire(80,220,250,220); D.portLabel(40,225,'Vin');
    D.wire(330,240,378,240); D.diode(400,240,false); D.labelSmall(385,222,'D1',D.clrText2);
    D.wire(422,240,480,240); D.node(480,240); D.wire(480,240,550,240);
    D.wire(480,240,480,305); D.capacitor(480,333,'C',f(v.c*1e-9,'F'),true); D.ground(480,361);
    D.wire(250,260,210,260); D.wire(210,260,210,325); D.wire(210,325,480,325); D.node(480,325);
    D.wire(480,325,480,305);
    D.wire(550,260,550,195); D.wire(550,195,650,195); D.wire(650,195,650,270); D.node(650,270);
    D.wire(630,270,730,270); D.portLabel(750,275,'Vpeak');
  },
};

ENGINE.nl_clamp = {
  title: 'Precision Voltage Clamper',
  subtitle: 'Op-Amp Precision Clamp Circuit',
  inputs: [
    { id:'vclamp', label:'Clamp Voltage', val:3,  unit:'V' },
    { id:'r',      label:'Series Resistor', val:10, unit:'kΩ' },
  ],
  tips: [
    'Precision clamping: no diode voltage drop error',
    'Output follows input until clamp level is reached',
    'At and above clamp level: output locked to Vclamp',
    'Protect sensitive inputs from overvoltage',
    'Add dual clampers for bidirectional protection',
    'Set Vclamp via voltage divider from precision reference',
  ],
  refs: 'TI SLOA049; Analog Devices MT-210',
  calc(v, P) {
    P.results = [
      { k:'Clamp Level',   val:f(v.vclamp,'V'),            cls:'info' },
      { k:'Pass Region',   val:`Vin < ${v.vclamp}V`,       cls:'good' },
      { k:'Clamped Region',val:`Vin ≥ ${v.vclamp}V → Vout=${v.vclamp}V`,cls:'info' },
      { k:'Accuracy',      val:'Precision (no drop)',       cls:'good' },
      { k:'Input R',       val:f(v.r*1e3,'Ω'),             cls:'info' },
    ];
    P.formula = `Vout = Vin if Vin < ${v.vclamp}V\nVout = ${v.vclamp}V if Vin ≥ ${v.vclamp}V`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(440,260);
    D.wire(80,270,170,270); D.portLabel(40,275,'Vin');
    D.resistor(198,270,'R',f(v.r*1e3,'Ω')); D.wire(238,270,400,270); D.node(355,270);
    D.wire(355,270,355,200); D.wire(355,200,416,200);
    D.diode(444,200,false); D.wire(464,200,520,200); D.wire(520,200,520,260); D.node(520,260);
    D.wire(400,280,345,280); D.portLabel(265,285,`Vclamp=${v.vclamp}V`); D.wire(345,280,400,280);
    D.wire(480,260,580,260); D.portLabel(600,265,'Vout');
  },
};

ENGINE.nl_clip = {
  title: 'Precision Clipper',
  subtitle: 'Hard Clip at Precise Positive and Negative Levels',
  inputs: [
    { id:'vhi', label:'Upper Clip Level',  val:5,  unit:'V' },
    { id:'vlo', label:'Lower Clip Level',  val:-5, unit:'V' },
  ],
  tips: [
    'Clips waveform at precise levels, ignoring diode drop',
    'Two-diode version clips both positive and negative swings',
    'Set clip levels via precision voltage references',
    'Useful for output limiting of amplifier stages',
    'Protects downstream ADC or circuit from overvoltage',
    'Common in audio limiters and signal conditioning',
  ],
  refs: 'TI SLOA049; AD Op-Amp Applications; Horowitz Ch.4',
  calc(v, P) {
    P.results = [
      { k:'Upper Clip VH',  val:f(v.vhi,'V'),          cls:'info' },
      { k:'Lower Clip VL',  val:f(v.vlo,'V'),          cls:'info' },
      { k:'Linear Range',   val:`${v.vlo}V to ${v.vhi}V`,cls:'good' },
      { k:'Clip Width',     val:f(v.vhi-v.vlo,'V'),    cls:'info' },
      { k:'Method',         val:'Precision diode clip', cls:'good' },
    ];
    P.formula = `Vout = VH if Vin > VH\nVout = VL if Vin < VL\nVout = Vin otherwise`;
    return {};
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    D.opamp(470,260);
    D.wire(80,240,450,240); D.portLabel(40,245,'Vin');
    D.wire(450,280,410,280); D.node(410,280);
    D.wire(410,280,410,340); D.wire(410,280,410,200);
    D.diode(410,355,true); D.portLabel(445,378,`VL=${v.vlo}V`,'#38bdf8');
    D.diode(410,185,false); D.portLabel(445,172,`VH=${v.vhi}V`,'#ef4444');
    D.wire(510,260,620,260); D.portLabel(640,265,'Vout');
  },
};

/* ============================================================
   CONVERTERS
   ============================================================ */

ENGINE.conv_itov = {
  title: 'Current-to-Voltage (TIA)',
  subtitle: 'Transimpedance Amplifier — I to V',
  inputs: [
    { id:'ip',   label:'Input Current Ip',  val:50, unit:'μA' },
    { id:'vout', label:'Desired Max Vout',  val:5,  unit:'V' },
  ],
  tips: [
    'Rf = Vout/Iin — sets transimpedance gain in Ω (V/A)',
    'Virtual ground at inverting input: zero voltage drop across source',
    'Used with photodiodes, Hall effect sensors, ionisation chambers',
    'Bandwidth limited by Rf×Cf product',
    'Higher Rf → more sensitivity but narrower bandwidth and more noise',
    'Noise: En² = 4kT×Rf (Johnson noise from Rf)',
  ],
  refs: 'TI SBOA035; OPA657 TIA Design; Analog Devices MT-047',
  calc(v, P) {
    const Rf = v.vout / (v.ip * 1e-6);
    P.results = [
      { k:'Feedback Rf',       val:f(Rf,'Ω'),       cls:'good' },
      { k:'Transimpedance',    val:f(Rf,'Ω/A'),     cls:'good' },
      { k:'Vout @ Ip',         val:f(v.vout,'V'),   cls:'info' },
      { k:'Input Impedance',   val:'≈ 0Ω (virt gnd)',cls:'good' },
      { k:'Phase (low-f)',     val:'180°',           cls:'info' },
      { k:'Sensitivity',       val:f(Rf/1e3,'mV/μA'),cls:'info'},
    ];
    P.formula = `Rf = Vout/Ip = ${f(Rf,'Ω')}\nVout = −Ip×Rf = ${f(-v.vout,'V')}`;
    P.sb_gain = `Zt=${f(Rf,'Ω/A')}`;
    return { Rf };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rf } = ENGINE.conv_itov.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(510,260);
    // Current source circle
    const c = D.ctx;
    c.strokeStyle=D.clrComp; c.lineWidth=2; c.beginPath(); c.arc(308,240,18,0,Math.PI*2); c.stroke();
    c.fillStyle=D.clrText2; c.font='11px DM Sans'; c.fillText('I',302,245);
    D.wire(180,240,290,240); D.portLabel(140,245,'Source');
    D.wire(326,240,470,240); D.node(385,240);
    D.wire(308,258,308,290); D.ground(308,290);
    D.wire(470,280,440,280); D.ground(440,280);
    D.wire(385,240,385,140); D.wire(385,140,456,140);
    D.resistor(486,140,'Rf',f(Rf,'Ω'));
    D.wire(526,140,585,140); D.wire(585,140,585,260); D.node(585,260);
    D.wire(550,260,660,260); D.portLabel(680,265,'Vout');
  },
};

ENGINE.conv_vtoi = {
  title: 'Voltage-to-Current Converter',
  subtitle: 'Floating Load — Howland Topology',
  inputs: [
    { id:'vin',    label:'Control Voltage Vin', val:5,   unit:'V' },
    { id:'rsense', label:'Sense Resistor Rs',   val:250, unit:'Ω' },
  ],
  tips: [
    'Iout = Vin/Rs — independent of load resistance',
    'Load must be floating (not grounded) in basic topology',
    'Howland pump variant allows grounded load — use 4 matched resistors',
    'Current compliance: Iout×Rload < Vcc−Vsat',
    'Use precision Rs (0.1%) for accurate current control',
    'Max current limited by op-amp output current capability',
  ],
  refs: 'TI SLOA049; Howland Current Pump App Note; AD Op-Amp Applications',
  calc(v, P) {
    const iout = v.vin / v.rsense;
    P.results = [
      { k:'Output Current',  val:f(iout,'A'),        cls:'good' },
      { k:'Sense Resistor',  val:f(v.rsense,'Ω'),    cls:'info' },
      { k:'Control Voltage', val:f(v.vin,'V'),        cls:'info' },
      { k:'Formula',         val:'Iout = Vin/Rs',    cls:'info' },
      { k:'Load Type',       val:'Floating only',    cls:'warn' },
      { k:'Compliance',      val:'Iout×RL < Vcc',    cls:'warn' },
    ];
    P.formula = `Iout = Vin/Rs = ${v.vin}/${v.rsense} = ${f(iout,'A')}`;
    P.sb_gain = `I=${f(iout,'A')}`;
    return { iout };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { iout } = ENGINE.conv_vtoi.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(470,260);
    D.wire(320,270,430,270); D.portLabel(280,275,'Vin');
    D.wire(510,260,580,260); D.resistor(608,260,'RL',f(1000,'Ω')); D.wire(648,260,710,260);
    D.wire(710,260,710,148); D.wire(710,148,390,148); D.wire(390,148,390,240); D.node(390,240); D.wire(390,240,430,240);
    D.wire(390,240,350,240); D.resistor(318,240,'Rs',f(v.rsense,'Ω')); D.wire(288,240,268,240); D.ground(268,240);
    D.currentArrow(530,240,`I=${f(iout,'A')}`);
  },
};

ENGINE.conv_dac = {
  title: 'R-2R Ladder DAC',
  subtitle: 'Digital-to-Analog R-2R Network',
  inputs: [
    { id:'bits', label:'Number of Bits',      val:4, unit:'', min:2, max:8 },
    { id:'vref', label:'Reference Voltage',   val:5, unit:'V' },
    { id:'code', label:'Digital Input Code',  val:8, unit:'' },
  ],
  tips: [
    'Only 2 resistor values needed (R and 2R)',
    'Resolution = Vref / 2^N per LSB',
    'Max Vout = Vref×(2^N−1)/2^N',
    'MSB has greatest weight; LSB has weight 1/2^N',
    'Op-amp buffer provides low output impedance',
    'Use 0.01% matched resistor network (RN5x) for precision',
  ],
  refs: 'TI SLAA652; Maxim MAX5302; AD5420 Datasheet',
  calc(v, P) {
    const maxCode = Math.pow(2, v.bits) - 1;
    const lsb = v.vref / Math.pow(2, v.bits);
    const code = Math.min(Math.floor(v.code), maxCode);
    const vout = (code / Math.pow(2, v.bits)) * v.vref;
    P.results = [
      { k:'Bits',         val:`${v.bits}-bit`,                                cls:'info' },
      { k:'Resolution LSB',val:f(lsb,'V'),                                   cls:'good' },
      { k:'Input Code',   val:`${code} (0x${code.toString(16).toUpperCase()})`,cls:'info' },
      { k:'Output Vout',  val:f(vout,'V'),                                   cls:'good' },
      { k:'Max Code',     val:maxCode,                                        cls:'info' },
      { k:'Max Vout',     val:f((maxCode/Math.pow(2,v.bits))*v.vref,'V'),   cls:'info' },
    ];
    P.formula = `Vout = (Code/2^N)×Vref = ${f(vout,'V')}\nLSB = ${f(lsb,'V')}`;
    P.sb_gain = `Vout=${f(vout,'V')}`;
    return { vout, lsb, code, maxCode };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { vout } = ENGINE.conv_dac.calc(v, { results:[], formula:'', bode:{} });
    const bits = Math.min(Math.floor(v.bits), 4);
    for (let i = 0; i < bits; i++) {
      const x = 100 + i * 150, y = 260;
      D.wire(x, y - 45, x, y);
      D.portLabel(x - 18, y - 60, `D${bits-1-i}`);
      D.resistor(x, y, '2R', f(20000,'Ω'), true);
      D.wire(x, y + 32, x, y + 60); D.node(x, y + 60);
      if (i > 0) D.wire(x - 150 + 32, y + 60, x, y + 60);
      if (i < bits - 1) D.resistor(x + 32, y + 60, 'R', f(10000,'Ω'));
    }
    const lx = 100 + (bits - 1) * 150;
    D.wire(lx, 260 + 60, lx + 60, 260 + 60);
    D.opamp(lx + 130, 260 + 60);
    D.wire(lx + 52, 260 + 60, lx + 52, 260 + 18); D.ground(lx + 52, 260 + 18);
    D.wire(lx + 90, 260 + 60 - 22, lx + 90, 260 + 60 - 62);
    D.wire(lx + 90, 260 + 60 - 62, lx + 170, 260 + 60 - 62);
    D.wire(lx + 170, 260 + 60 - 62, lx + 170, 260 + 60); D.node(lx + 170, 260 + 60);
    D.wire(lx + 150, 260 + 60, lx + 240, 260 + 60);
    D.portLabel(lx + 250, 260 + 66, 'Vout=' + f(vout, 'V'));
  },
};

ENGINE.conv_adc = {
  title: 'Flash ADC (3-bit)',
  subtitle: 'Parallel Comparator ADC Architecture',
  inputs: [
    { id:'vin',  label:'Analog Input Vin', val:3.5, unit:'V' },
    { id:'vref', label:'Reference Vref',  val:5,   unit:'V' },
  ],
  tips: [
    'Flash ADC is fastest — converts in single clock cycle',
    'Requires 2^N − 1 comparators for N-bit resolution',
    '3-bit: 7 comparators; 8-bit: 255 comparators',
    'Priority encoder converts thermometer code to binary',
    'Power and area scale exponentially with bits',
    'Used in oscilloscopes, video digitizers, radar',
  ],
  refs: 'Razavi "Data Conversion System Design"; TI ADS5400; AD9680 Datasheet',
  calc(v, P) {
    const lsb = v.vref / 8;
    const code = Math.min(7, Math.floor(v.vin / lsb));
    const binary = code.toString(2).padStart(3, '0');
    P.results = [
      { k:'Analog Input',    val:f(v.vin,'V'),      cls:'info' },
      { k:'Reference Vref',  val:f(v.vref,'V'),     cls:'info' },
      { k:'LSB',             val:f(lsb,'V'),        cls:'info' },
      { k:'Output Code',     val:`${code} (${binary})`, cls:'good' },
      { k:'Comparators',     val:'7 (for 3-bit)',   cls:'info' },
      { k:'Resolution',      val:`${(100/8).toFixed(1)}%`,cls:'info' },
    ];
    P.formula = `LSB = Vref/8 = ${f(lsb,'V')}\nCode = floor(Vin/LSB) = ${code} (${binary})`;
    P.sb_gain = `D_out=${binary}`;
    return { code, binary, lsb };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { binary, code } = ENGINE.conv_adc.calc(v, { results:[], formula:'', bode:{} });
    const lsb = v.vref / 8;
    for (let i = 0; i < 7; i++) {
      const y = 50 + i * 60;
      const vth = v.vref - (i + 1) * lsb;
      const active = v.vin > vth ? 1 : 0;
      const c = D.ctx;
      c.strokeStyle = D.clrComp; c.lineWidth = 2; c.setLineDash([]);
      c.beginPath(); c.moveTo(240,y-10); c.lineTo(290,y+10); c.lineTo(240,y+30); c.closePath(); c.stroke();
      D.wire(180, y + 10, 240, y + 10); D.portLabel(130, y + 15, 'Vin');
      D.wire(222, y - 2, 200, y - 2); D.portLabel(120, y + 3, f(vth,'V'), '#fbbf24');
      const col = active ? '#10b981' : '#4d5f7a';
      c.fillStyle = col; c.beginPath(); c.arc(308, y + 10, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = D.clrText2; c.font = '10px Space Mono';
      c.fillText(`C${7-i}=${active}`, 324, y + 14);
    }
    D.portLabel(460, 220, `→ Priority Encoder`, D.clrText2);
    D.portLabel(460, 260, `→ D = ${binary}₂ = ${code}`, '#10b981');
    D.portLabel(460, 300, `Vout (3-bit binary)`, '#00d4ff');
  },
};

/* ============================================================
   POWER & REFERENCES
   ============================================================ */

ENGINE.pwr_reg = {
  title: 'Linear Voltage Regulator',
  subtitle: 'Op-Amp + Pass Transistor — Adjustable',
  inputs: [
    { id:'vout', label:'Output Voltage Vout', val:5,   unit:'V' },
    { id:'vin',  label:'Input Voltage Vin',   val:12,  unit:'V' },
    { id:'iout', label:'Output Current',      val:500, unit:'mA' },
  ],
  tips: [
    'Output voltage set by R1/R2 voltage divider on feedback',
    'Use LM317/LM337 for easy adjustable linear regulation',
    'Dropout voltage: Vin − Vout ≥ 1.5V (LDO: ≥ 0.1V)',
    'Power dissipation = (Vin−Vout) × Iout — must add heatsink!',
    'Add 10μF ceramic input cap + 100μF electrolytic output cap',
    'Efficiency = Vout/Vin; low at high Vin — consider switching if η < 70%',
  ],
  refs: 'LM317 Datasheet TI; LDO Design Guide TI SLVA071; Zetex ZR431',
  calc(v, P) {
    const pdiss = (v.vin - v.vout) * (v.iout / 1000);
    const dropout = v.vin - v.vout;
    const r1 = 240;
    const r2 = r1 * (v.vout / 1.25 - 1);
    const eff = (v.vout / v.vin) * 100;
    P.results = [
      { k:'Output Voltage',   val:f(v.vout,'V'),   cls:'good' },
      { k:'Dropout Voltage',  val:f(dropout,'V'),  cls:dropout<1.5?'warn':'info' },
      { k:'Power Dissipation',val:f(pdiss,'W'),     cls:pdiss>1?'warn':'good' },
      { k:'R1 (ADJ pin)',     val:f(r1,'Ω'),        cls:'info' },
      { k:'R2 (voltage set)', val:f(r2,'Ω'),        cls:'good' },
      { k:'Efficiency',       val:`${eff.toFixed(1)}%`, cls:eff<70?'warn':'good' },
    ];
    P.formula = `Vout = 1.25×(1 + R2/R1)\nPdiss = (${v.vin}−${v.vout})×${v.iout/1000} = ${pdiss.toFixed(2)}W`;
    P.sb_gain = `η=${eff.toFixed(0)}%`;
    return { pdiss, r1, r2, eff };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { pdiss, r1, r2 } = ENGINE.pwr_reg.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(340,200,'EA');
    // BJT pass transistor
    const c = D.ctx;
    c.strokeStyle=D.clrComp; c.lineWidth=2; c.setLineDash([]);
    c.beginPath(); c.arc(520,200,22,0,Math.PI*2); c.stroke();
    c.beginPath(); c.moveTo(498,200); c.lineTo(510,200); c.stroke();
    c.beginPath(); c.moveTo(510,190); c.lineTo(542,174); c.stroke();
    c.beginPath(); c.moveTo(510,210); c.lineTo(542,226); c.stroke();
    c.fillStyle=D.clrText; c.font='bold 11px DM Sans'; c.fillText('Q1',526,206);
    D.wire(380,200,498,200);
    D.wire(542,174,600,174); D.portLabel(565,164,`Vin=${v.vin}V`,'#ef4444');
    D.wire(542,226,600,226); D.node(578,226);
    D.wire(578,226,578,300); D.portLabel(600,305,`Vout=${v.vout}V`,'#10b981');
    D.wire(578,300,578,360); D.resistor(578,388,'R2',f(r2,'Ω'),true);
    D.wire(578,420,578,460); D.resistor(578,488,'R1',f(r1,'Ω'),true); D.ground(578,516);
    D.wire(578,420,480,420); D.wire(480,420,480,290); D.wire(480,290,320,290);
    D.wire(280,220,240,220); D.portLabel(180,225,'Vref=1.25V');
    D.labelSmall(380,350,`Pdiss=${pdiss.toFixed(2)}W — heatsink required!`, D.clrWarn);
  },
};

ENGINE.pwr_ref = {
  title: 'Precision Voltage Reference',
  subtitle: 'Op-Amp Buffered Zener Reference',
  inputs: [
    { id:'vz',  label:'Zener Voltage', val:5.1, unit:'V' },
    { id:'vin', label:'Input Voltage', val:12,  unit:'V' },
    { id:'iz',  label:'Zener Current', val:5,   unit:'mA' },
  ],
  tips: [
    'Buffer prevents loading of zener with output current',
    'Rs = (Vin − Vz) / Iz — correct bias for low temperature coefficient',
    'Buried zener (LM399) ≈ 1ppm/°C temperature stability',
    'LM399, LTZ1000 for ultra-stable ≤ 2ppm/°C references',
    'TL431 for a programmable precision shunt reference',
    'Output impedance ≈ 0Ω due to op-amp unity feedback',
  ],
  refs: 'LM399 Datasheet; LTZ1000 App Note; AD580 Datasheet; TL431 TI',
  calc(v, P) {
    const Rs = (v.vin - v.vz) / (v.iz / 1000);
    const pRs = (v.vin - v.vz) * (v.iz / 1000);
    P.results = [
      { k:'Series Resistor Rs', val:f(Rs,'Ω'),     cls:'good' },
      { k:'Zener Current Iz',   val:f(v.iz/1000,'A'),cls:'info' },
      { k:'Output Voltage',     val:f(v.vz,'V'),   cls:'good' },
      { k:'Power in Rs',        val:f(pRs,'W'),    cls:'info' },
      { k:'Output Impedance',   val:'≈ 0Ω',        cls:'good' },
      { k:'Stability',          val:'Depends on Vz TC',cls:'info' },
    ];
    P.formula = `Rs = (Vin−Vz)/Iz = ${f(Rs,'Ω')}\nVout = Vz = ${v.vz}V`;
    return { Rs };
  },
  draw(ctx, v) {
    const D = drawCtx(ctx);
    const { Rs } = ENGINE.pwr_ref.calc(v, { results:[], formula:'', bode:{} });
    D.opamp(460,260);
    D.wire(80,260,140,260); D.portLabel(40,265,`Vin=${v.vin}V`,'#ef4444');
    D.resistor(168,260,'Rs',f(Rs,'Ω')); D.wire(208,260,290,260); D.node(290,260);
    D.zener(290,290);
    D.wire(290,315,290,350); D.ground(290,350);
    D.portLabel(312,294,`Vz=${v.vz}V`);
    D.wire(290,260,420,260);
    D.wire(420,240,360,240); D.wire(360,240,360,165); D.wire(360,165,550,165); D.wire(550,165,550,260); D.node(550,260);
    D.wire(500,260,630,260); D.portLabel(650,265,'Vref='+f(v.vz,'V'),'#10b981');
  },
};
