/* Musique tunisienne procédurale — malouf, mezoued, gasba, darbuka, quarts de ton */
const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let drumGain = null;
  let leadGain = null;
  let echo = null;
  let sfxGain = null;
  let playing = false;
  let theme = "title";
  let timers = [];
  let barCount = 0;
  let noiseBuf = null;

  /* Quart de ton (50 cents) : le grain maghrébin, pas du do-ré-mi occidental */
  const QT = Math.pow(2, -50 / 1200);
  function midi(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
  function deg(list) {
    return list.map(([m, q]) => midi(m) * (q ? QT : 1));
  }

  /* Maqams tunisiens / andalous (Hz). Sikah et rast à E/B un quart bas. */
  const MAQ = {
    hijaz: deg([[62, 0], [63, 0], [66, 0], [67, 0], [69, 0], [70, 0], [73, 0], [74, 0]]),
    rast: deg([[60, 0], [62, 0], [64, 1], [65, 0], [67, 0], [69, 0], [71, 1], [72, 0]]),
    bayati: deg([[62, 0], [64, 1], [65, 0], [67, 0], [69, 0], [70, 0], [72, 0], [74, 0]]),
    saba: deg([[62, 0], [64, 1], [65, 0], [66, 0], [69, 0], [70, 0], [72, 0], [74, 0]]),
    sikah: deg([[64, 1], [65, 0], [67, 0], [69, 0], [70, 0], [72, 0], [74, 0], [76, 1]]),
    nahawand: deg([[60, 0], [62, 0], [63, 0], [65, 0], [67, 0], [68, 0], [71, 0], [72, 0]]),
    husayni: deg([[62, 0], [64, 1], [65, 0], [67, 0], [69, 0], [71, 1], [72, 0], [74, 0]]),
  };

  /* Rythmes : 0 rest, 1 doum, 2 tek, 3 ka, 4 krakeb */
  const RHY = {
    samai: [1, 0, 0, 2, 0, 1, 0, 2, 0, 0],
    wahda: [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 2, 0],
    maqsoum: [1, 0, 2, 0, 0, 2, 2, 0, 1, 0, 2, 0, 0, 2, 2, 0],
    baladi: [1, 0, 1, 0, 2, 0, 0, 2, 1, 0, 1, 0, 2, 0, 0, 2],
    saidi: [1, 0, 2, 0, 1, 1, 2, 0, 1, 0, 2, 0, 1, 1, 2, 0],
    mezoued: [1, 2, 0, 2, 1, 0, 2, 4, 1, 2, 0, 2, 1, 4, 2, 4],
    waltz6: [1, 0, 2, 1, 0, 2, 1, 0, 2, 4, 2, 0],
    festa6: [1, 2, 4, 1, 2, 4, 1, 2, 4, 1, 4, 4],
    wave: [1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 2],
    riqq: [2, 0, 3, 0, 2, 3, 0, 2, 2, 0, 3, 0, 2, 0, 4, 2],
    none: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };

  /*
    Pièces originales, inspirées (sans copier) :
    malouf / nuba (sikah, samai 10/8), mezoued de mariage,
    gasba côtière, saidi de port, saba de lagune.
  */
  const THEMES = {
    intro: {
      maqam: "sikah", beat: 0.3, vol: 0.2, lead: "nay", echo: 0.28,
      rhythm: "none", steps: 10, taqsim: 99, ornament: true, slide: true,
      melodyA: [0, 0, 0, 1, 2, 2, 1, 0, -1, -1],
      melodyB: [3, 3, 2, 1, 0, 0, -1, 2, 1, 0],
      bass: [0, -1, -1, -1, 4, -1, -1, -1, 0, -1],
      drone: 0.04,
    },
    title: {
      maqam: "sikah", beat: 0.2, vol: 0.22, lead: "nay", second: "oud", echo: 0.22,
      rhythm: "samai", steps: 10, taqsim: 1, ornament: true, slide: true,
      melodyA: [0, 0, 1, 2, 2, 3, 2, 1, 0, -1],
      melodyB: [4, 4, 3, 2, 1, 0, 1, 2, 1, 0],
      melodyC: [2, 3, 4, 4, 3, 2, 0, 1, 0, 0],
      bass: [0, -1, -1, 3, -1, 0, -1, 4, -1, -1],
      drone: 0.035,
    },
    map: {
      maqam: "rast", beat: 0.18, vol: 0.18, lead: "oud", echo: 0.1,
      rhythm: "riqq", steps: 16, taqsim: 0, ornament: false, slide: false,
      melodyA: [0, 2, 3, 2, 0, 4, 5, 4, 3, 2, 0, 2, 3, 2, -1, 0],
      melodyB: [4, 3, 2, 0, 2, 3, 4, 7, 5, 4, 3, 2, 0, 2, 0, -1],
      bass: [0, -1, 4, -1, 0, -1, 5, -1, 0, -1, 4, -1, 3, -1, 0, -1],
      drone: 0.02,
    },
    story: {
      maqam: "hijaz", beat: 0.34, vol: 0.16, lead: "nay", echo: 0.32,
      rhythm: "none", steps: 16, taqsim: 99, ornament: true, slide: true,
      melodyA: [0, 0, -1, 2, 4, 4, -1, 3, 2, -1, -1, 0, 4, 2, -1, 0],
      melodyB: [4, -1, 2, -1, 0, -1, -1, 2, 3, 2, 0, -1, -1, -1, -1, 0],
      bass: [0, -1, -1, -1, 0, -1, -1, 4, 0, -1, -1, -1, 3, -1, -1, -1],
      drone: 0.045,
    },
    beach: {
      maqam: "hijaz", beat: 0.26, vol: 0.2, lead: "nay", echo: 0.2,
      rhythm: "wave", steps: 16, taqsim: 1, ornament: true, slide: true,
      melodyA: [7, 5, 4, -1, 4, 2, 0, -1, 2, 4, 5, 4, 2, 0, -1, -1],
      melodyB: [4, 4, 5, 7, 5, 4, 2, 0, -1, 2, 4, -1, 3, 2, 0, 0],
      melodyC: [0, -1, 4, 5, 4, 2, 0, 2, 4, -1, 7, 5, 4, 2, 0, -1],
      bass: [0, -1, -1, 4, 0, -1, 3, -1, 0, -1, -1, 5, 0, -1, 4, -1],
      drone: 0.03,
    },
    souk: {
      maqam: "bayati", beat: 0.12, vol: 0.26, lead: "mizmar", second: "oud", echo: 0.08,
      rhythm: "waltz6", steps: 12, taqsim: 0, ornament: true, slide: false,
      melodyA: [0, 4, 5, 4, 7, 5, 4, 0, 2, 4, 5, 0],
      melodyB: [4, 5, 7, 7, 5, 4, 2, 0, 4, 5, 4, 0],
      melodyC: [7, 5, 4, 2, 0, 2, 4, 5, 7, 4, 0, 4],
      bass: [0, -1, 0, 4, -1, 4, 0, -1, 5, 0, 4, 0],
      drone: 0.015,
    },
    folk: {
      maqam: "bayati", beat: 0.2, vol: 0.2, lead: "nay", second: "oud", echo: 0.14,
      rhythm: "baladi", steps: 16, taqsim: 1, ornament: true, slide: true,
      melodyA: [0, 1, 2, 2, 3, 2, 0, -1, 4, 3, 2, 1, 0, 2, 0, -1],
      melodyB: [4, 4, 3, 2, 0, 2, 3, 4, 5, 4, 2, 0, 1, 2, 0, 0],
      bass: [0, -1, 0, 3, 0, -1, 4, -1, 0, -1, 2, -1, 0, 4, 0, -1],
      drone: 0.028,
    },
    ville: {
      maqam: "rast", beat: 0.22, vol: 0.2, lead: "oud", second: "qanun", echo: 0.12,
      rhythm: "maqsoum", steps: 16, taqsim: 1, ornament: true, slide: false,
      melodyA: [0, -1, 2, 3, 4, 4, 3, 2, 0, 2, 4, 5, 4, 3, 2, -1],
      melodyB: [4, 5, 4, 3, 2, 0, 2, 3, 4, -1, 7, 5, 4, 2, 0, 0],
      melodyC: [3, 2, 0, 2, 4, 3, 2, 0, -1, 4, 5, 4, 3, 2, 0, -1],
      bass: [0, -1, 0, 4, 0, -1, 5, -1, 0, -1, 4, -1, 3, 2, 0, -1],
      drone: 0.025,
    },
    port: {
      maqam: "nahawand", beat: 0.2, vol: 0.21, lead: "oud", second: "mizmar", echo: 0.1,
      rhythm: "saidi", steps: 16, taqsim: 0, ornament: false, slide: false,
      melodyA: [0, 0, 4, 4, 3, 2, 0, 0, 5, 4, 2, 0, 4, 2, 0, -1],
      melodyB: [4, 2, 0, 2, 4, 5, 4, 0, 3, 2, 0, 0, 4, 5, 4, 0],
      bass: [0, -1, 0, -1, 4, -1, 0, -1, 0, -1, 5, -1, 4, -1, 0, -1],
      drone: 0.02,
    },
    lagoon: {
      maqam: "saba", beat: 0.36, vol: 0.16, lead: "nay", echo: 0.38,
      rhythm: "none", steps: 16, taqsim: 99, ornament: true, slide: true,
      melodyA: [0, -1, -1, 1, 2, 2, -1, 1, 0, -1, 3, 2, 1, 0, -1, -1],
      melodyB: [2, 1, 0, -1, -1, 4, 3, 2, 1, 0, -1, -1, 2, 1, 0, 0],
      bass: [0, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, 4, 0, -1, -1, -1],
      drone: 0.05,
    },
    sunset: {
      maqam: "husayni", beat: 0.3, vol: 0.18, lead: "nay", echo: 0.26,
      rhythm: "wahda", steps: 16, taqsim: 1, ornament: true, slide: true,
      melodyA: [4, 3, 2, 0, 2, 3, 4, -1, 5, 4, 2, 0, 3, 2, 0, -1],
      melodyB: [0, 2, 4, 5, 4, 3, 2, 0, -1, 4, 3, 2, 1, 0, -1, 0],
      bass: [0, -1, -1, 4, 0, -1, 3, -1, 0, -1, -1, 5, 0, -1, 4, -1],
      drone: 0.04,
    },
    resort: {
      maqam: "rast", beat: 0.16, vol: 0.2, lead: "qanun", second: "nay", echo: 0.12,
      rhythm: "baladi", steps: 16, taqsim: 0, ornament: false, slide: false,
      melodyA: [0, 2, 4, 5, 4, 7, 5, 4, 2, 4, 5, 4, 2, 0, 2, 0],
      melodyB: [4, 5, 7, 5, 4, 2, 0, 2, 3, 4, 5, 7, 5, 4, 2, 4],
      bass: [0, 4, 0, 5, 0, 4, 2, 0, 0, 4, 0, 5, 0, 3, 0, 4],
      drone: 0.018,
    },
    festival: {
      maqam: "hijaz", beat: 0.1, vol: 0.28, lead: "mizmar", second: "qanun", echo: 0.06,
      rhythm: "festa6", steps: 12, taqsim: 0, ornament: true, slide: false,
      melodyA: [0, 4, 5, 7, 5, 4, 7, 8, 7, 5, 4, 0],
      melodyB: [4, 5, 7, 8, 7, 5, 4, 2, 4, 5, 7, 4],
      melodyC: [7, 5, 4, 0, 4, 5, 7, 5, 4, 2, 0, 4],
      bass: [0, 0, 4, 0, 5, 4, 0, 4, 0, 7, 4, 0],
      drone: 0.012,
    },
    holy: {
      maqam: "rast", beat: 0.38, vol: 0.14, lead: "nay", echo: 0.3,
      rhythm: "none", steps: 16, taqsim: 99, ornament: true, slide: true,
      melodyA: [0, 0, 2, 2, 3, 2, 0, -1, 4, 3, 2, 0, -1, -1, -1, 0],
      melodyB: [3, 2, 0, -1, 2, 3, 4, 4, 3, 2, 0, -1, -1, 2, 0, 0],
      bass: [0, -1, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, 4, -1, -1, -1],
      drone: 0.055,
    },
    night: {
      maqam: "hijaz", beat: 0.17, vol: 0.2, lead: "oud", second: "mizmar", echo: 0.16,
      rhythm: "mezoued", steps: 16, taqsim: 0, ornament: true, slide: true,
      melodyA: [0, 1, 2, 4, 3, 2, 0, -1, 4, 5, 4, 2, 3, 2, 0, 0],
      melodyB: [4, 2, 0, 2, 4, 7, 5, 4, 2, 0, 2, 4, 3, 2, 0, -1],
      bass: [0, -1, 0, 4, 0, -1, 3, -1, 0, -1, 5, 4, 0, 2, 0, -1],
      drone: 0.022,
    },
  };

  const ALIAS = {
    play: "beach", menu: "title", hotel: "resort", cabaret: "night",
    midounv: "souk", aghir: "beach", erriadh: "holy", elmay: "lagoon",
    mosque: "holy", synagogue: "holy", cemetery: "holy", holy: "holy",
    workshop: "folk", kiln: "folk", mill: "folk", oven: "folk",
    guellala: "folk", explore: "map", museum: "map", fort: "map",
    inside: "ville", plaza: "ville", airport: "port", graffiti: "festival",
    menzel: "ville", souk: "souk", ville: "ville", beach: "beach",
    port: "port", sea: "beach", cistern: "lagoon", lagoon: "lagoon",
  };

  function scaleOf(th) {
    return MAQ[th.maqam] || MAQ.hijaz;
  }

  function freq(scale, idx) {
    if (idx == null || idx < 0) return null;
    const n = scale.length;
    const oct = Math.floor(idx / n);
    const i = ((idx % n) + n) % n;
    return scale[i] * Math.pow(2, oct);
  }

  function makeNoise(seconds) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.64;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(master);
    drumGain = ctx.createGain();
    drumGain.gain.value = 1;
    drumGain.connect(musicGain);
    leadGain = ctx.createGain();
    leadGain.gain.value = 1;
    leadGain.connect(musicGain);
    echo = ctx.createDelay(0.55);
    echo.delayTime.value = 0.24;
    const fb = ctx.createGain();
    fb.gain.value = 0.24;
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    leadGain.connect(echo);
    echo.connect(wet);
    wet.connect(musicGain);
    echo.connect(fb);
    fb.connect(echo);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.48;
    sfxGain.connect(master);
    noiseBuf = makeNoise(1.2);
    return true;
  }

  async function unlock() {
    if (!ensure()) return;
    if (ctx.state === "suspended") await ctx.resume();
  }

  function envGain(t, dur, vol, attack, dest) {
    const g = ctx.createGain();
    const a = Math.max(0.004, attack || 0.012);
    const hold = Math.max(0.01, dur - a);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.00012, vol * 0.72), t + a + hold * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    return g;
  }

  function osc(type, f, t, dur, g, slideTo, vib, detune) {
    if (!f) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t + dur * 0.28);
    if (vib) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.setValueAtTime(vib.hz || 5.1, t);
      lg.gain.setValueAtTime(f * (vib.cents || 0.007), t);
      lfo.connect(lg);
      lg.connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noiseHit(t, dur, vol, freqHz, dest, type) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = type || "bandpass";
    f.frequency.setValueAtTime(freqHz, t);
    f.Q.value = type === "lowpass" ? 0.7 : 3.2;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest || drumGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /* Nay (gasba) : souffle, vibrato, attaque lente */
  function nay(f, t, dur, vol, slide) {
    if (!f) return;
    const g = envGain(t, dur, vol, 0.07, leadGain);
    const start = slide ? f * 0.94 : f;
    osc("sine", start, t, dur, g, f * 1.01, { hz: 5.3, cents: 0.009 });
    osc("sine", f * 2.02, t, dur * 0.85, g, null, { hz: 5.1, cents: 0.006 }, 6);
    noiseHit(t, dur * 0.9, vol * 0.045, 1400, leadGain, "bandpass");
  }

  /* Oud : corde pincée, corps grave */
  function oud(f, t, dur, vol) {
    if (!f) return;
    const d = Math.min(dur, 0.55);
    const g = envGain(t, d, vol, 0.006, leadGain);
    osc("triangle", f, t, d, g, f * 0.995);
    osc("sawtooth", f, t, d * 0.35, g, null, null, -8);
    const body = ctx.createBiquadFilter();
    body.type = "bandpass";
    body.frequency.value = 220;
    body.Q.value = 2.4;
    const bg = envGain(t, d * 0.5, vol * 0.35, 0.004, leadGain);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(f / 2, t);
    o.connect(body);
    body.connect(bg);
    o.start(t);
    o.stop(t + d * 0.5);
  }

  /* Mizmar / mezoued : anche nasale */
  function mizmar(f, t, dur, vol, slide) {
    if (!f) return;
    const mix = envGain(t, dur, vol, 0.016, leadGain);
    const start = slide ? f * 0.95 : f;
    osc("square", start, t, dur, mix, f * 1.008, { hz: 6.1, cents: 0.005 });
    osc("sawtooth", f * 1.007, t, dur, mix, null, { hz: 5.4, cents: 0.004 }, 8);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1180;
    bp.Q.value = 2.6;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(f, t);
    o.connect(bp);
    bp.connect(mix);
    o.start(t);
    o.stop(t + dur + 0.04);
  }

  /* Qanun : zéryab, notes pincées brillantes */
  function qanun(f, t, dur, vol) {
    if (!f) return;
    const d = Math.min(dur, 0.28);
    const g = envGain(t, d, vol, 0.004, leadGain);
    osc("triangle", f, t, d, g);
    osc("sine", f * 2, t, d * 0.7, g, null, null, 4);
    osc("sine", f * 3, t, d * 0.35, g);
  }

  function leadPlay(kind, f, t, dur, vol, slide) {
    if (kind === "nay") nay(f, t, dur, vol, slide);
    else if (kind === "oud") oud(f, t, dur, vol);
    else if (kind === "qanun") qanun(f, t, dur, vol);
    else mizmar(f, t, dur, vol, slide);
  }

  function doum(t, vol) {
    const g = envGain(t, 0.16, vol, 0.004, drumGain);
    osc("sine", 78, t, 0.16, g, 62);
    osc("sine", 118, t, 0.08, g);
    noiseHit(t, 0.09, vol * 0.45, 240, drumGain, "lowpass");
  }

  function tek(t, vol) {
    noiseHit(t, 0.04, vol, 2400, drumGain, "bandpass");
    const g = envGain(t, 0.03, vol * 0.4, 0.002, drumGain);
    osc("sine", 1750, t, 0.03, g);
  }

  function ka(t, vol) {
    noiseHit(t, 0.03, vol * 0.7, 1100, drumGain, "bandpass");
  }

  function krakeb(t, vol) {
    noiseHit(t, 0.035, vol, 4200, drumGain, "highpass");
    const g = envGain(t, 0.04, vol * 0.5, 0.002, drumGain);
    osc("sine", 2650, t, 0.035, g);
    osc("sine", 3900, t + 0.012, 0.025, g);
  }

  function drum(step, t) {
    if (step === 1) doum(t, 0.22);
    else if (step === 2) tek(t, 0.14);
    else if (step === 3) ka(t, 0.1);
    else if (step === 4) krakeb(t, 0.16);
  }

  function resolveTheme(name) {
    const n = ALIAS[name] || name;
    return THEMES[n] ? n : "beach";
  }

  function pickMelody(th) {
    const pack = [th.melodyA, th.melodyB, th.melodyC].filter(Boolean);
    if (pack.length === 3) {
      const k = barCount % 6;
      if (k < 2) return pack[0];
      if (k < 4) return pack[1];
      return pack[2];
    }
    return barCount % 4 < 2 ? pack[0] : (pack[1] || pack[0]);
  }

  function scheduleBar(startTime) {
    const th = THEMES[theme] || THEMES.beach;
    const scale = scaleOf(th);
    musicGain.gain.setTargetAtTime(th.vol, startTime, 0.08);
    if (echo) echo.delayTime.setTargetAtTime(th.echo || 0.12, startTime, 0.05);
    const beat = th.beat;
    const steps = th.steps || 16;
    const melody = pickMelody(th);
    const rhy = RHY[th.rhythm] || RHY.none;
    const drumsOn = barCount >= (th.taqsim || 0);
    const secondOn = th.second && barCount % 4 >= 2;

    if (th.drone && scale[0]) {
      const g = envGain(startTime, beat * steps, th.drone, 0.08, musicGain);
      osc("sine", scale[0] / 2, startTime, beat * steps, g);
      osc("sine", scale[0] / 4, startTime, beat * steps, g);
    }

    for (let i = 0; i < steps; i++) {
      const t = startTime + i * beat;
      const mi = melody[i % melody.length];
      const f = freq(scale, mi);
      if (f) {
        const dur = beat * (th.lead === "oud" || th.lead === "qanun" ? 0.72 : 0.9);
        const vol = th.lead === "mizmar" ? 0.09 : 0.08;
        if (th.ornament && i % 4 === 0) {
          const g = freq(scale, mi + 1) || f * 1.05;
          leadPlay(th.lead, g, t, beat * 0.14, vol * 0.55, false);
          leadPlay(th.lead, f, t + beat * 0.14, dur * 0.82, vol, th.slide);
        } else {
          leadPlay(th.lead, f, t, dur, vol, th.slide && i % 3 === 0);
        }
        if (secondOn && i % 2 === 0) {
          const s = freq(scale, Math.max(0, mi - 2));
          if (s) leadPlay(th.second, s, t + beat * 0.04, beat * 0.55, 0.035, false);
        }
      }
      if (th.bass && i % 2 === 0) {
        const b = freq(scale, th.bass[(i / 2) % th.bass.length]);
        if (b) {
          const g = envGain(t, beat * 1.6, 0.09, 0.02, musicGain);
          osc("triangle", b / 2, t, beat * 1.6, g);
        }
      }
      if (drumsOn) drum(rhy[i % rhy.length], t);
      if (drumsOn && barCount % 4 === 3 && i === steps - 1) krakeb(t, 0.12);
    }
    barCount += 1;
    return steps * beat;
  }

  function loopMusic() {
    if (!playing || !ctx) return;
    const now = ctx.currentTime;
    const dur = scheduleBar(now + 0.05);
    const id = setTimeout(loopMusic, Math.max(80, dur * 1000 - 50));
    timers.push(id);
  }

  function stopTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function startMusic(newTheme) {
    if (!ensure()) return;
    unlock();
    if (newTheme) theme = resolveTheme(newTheme);
    if (playing) return;
    playing = true;
    barCount = 0;
    loopMusic();
  }

  function setTheme(name) {
    const next = resolveTheme(name);
    if (theme === next) {
      if (!playing) startMusic(next);
      return;
    }
    theme = next;
    barCount = 0;
    if (!playing) startMusic(next);
    else {
      stopTimers();
      if (musicGain && ctx) {
        const now = ctx.currentTime;
        musicGain.gain.setTargetAtTime(0.04, now, 0.05);
      }
      loopMusic();
    }
  }

  function stopMusic() {
    playing = false;
    stopTimers();
  }

  function sfx(name) {
    if (!ensure()) return;
    unlock();
    const t = ctx.currentTime;
    const tone = (f, at, dur, type, vol, slideTo) => {
      const g = envGain(at, dur, vol, 0.008, sfxGain);
      osc(type, f, at, dur, g, slideTo);
    };
    switch (name) {
      case "pickup":
        tone(560, t, 0.05, "square", 0.18);
        tone(820, t + 0.04, 0.07, "square", 0.14);
        break;
      case "recycle":
        tone(330, t, 0.07, "triangle", 0.2);
        tone(415, t + 0.06, 0.07, "triangle", 0.18);
        tone(554, t + 0.12, 0.08, "triangle", 0.16);
        tone(660, t + 0.2, 0.12, "triangle", 0.14);
        break;
      case "sweep":
        tone(200, t, 0.08, "sawtooth", 0.08, 400);
        noiseHit(t, 0.1, 0.1, 400, sfxGain, "lowpass");
        break;
      case "upgrade":
        tone(400, t, 0.08, "sawtooth", 0.12);
        tone(500, t + 0.08, 0.08, "sawtooth", 0.12);
        tone(650, t + 0.16, 0.14, "sawtooth", 0.12);
        break;
      case "levelup":
        [440, 554, 659, 880].forEach((f, i) => tone(f, t + i * 0.08, 0.12, "square", 0.15));
        break;
      case "super":
        tone(523, t, 0.1, "square", 0.18);
        tone(659, t + 0.1, 0.1, "square", 0.18);
        tone(784, t + 0.2, 0.18, "square", 0.2);
        tone(1046, t + 0.35, 0.2, "triangle", 0.12);
        break;
      case "tick":
        tone(990, t, 0.035, "square", 0.07);
        break;
      case "fail":
        tone(220, t, 0.18, "sawtooth", 0.14, 140);
        tone(140, t + 0.16, 0.28, "sawtooth", 0.12);
        break;
      case "click":
        tone(700, t, 0.025, "square", 0.09);
        break;
      case "horn":
        tone(420, t, 0.09, "square", 0.16);
        tone(280, t + 0.1, 0.14, "square", 0.14);
        break;
      default:
        break;
    }
  }

  return { unlock, startMusic, stopMusic, setTheme, sfx, ensure };
})();
