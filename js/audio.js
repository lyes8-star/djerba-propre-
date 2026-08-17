/* Soundtracks tunisiennes procédurales — malouf, mezoued, hijaz, darbuka */
const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let playing = false;
  let theme = "title";
  let timers = [];
  let barCount = 0;

  /* Maqams (Hz) — hijaz, bayati, rast, saba */
  const MAQ = {
    hijaz: [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 554.37, 587.33],
    bayati: [293.66, 311.13, 349.23, 392.0, 440.0, 466.16, 523.25, 587.33],
    rast: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25],
    saba: [293.66, 311.13, 349.23, 369.99, 440.0, 466.16, 523.25, 587.33],
  };

  /* 16-step darbuka: 0 rest, 1 doum, 2 tek, 3 ka, 4 krakeb/clap */
  const RHY = {
    malouf: [1, 0, 0, 2, 0, 2, 1, 0, 0, 2, 0, 2, 1, 0, 2, 0],
    baladi: [1, 0, 2, 0, 1, 1, 2, 0, 1, 0, 2, 0, 0, 2, 2, 0],
    saidi: [1, 0, 1, 2, 0, 2, 1, 2, 1, 0, 1, 2, 0, 2, 1, 2],
    folklor: [1, 0, 2, 1, 2, 0, 1, 0, 2, 1, 2, 0, 1, 2, 0, 2],
    slow: [1, 0, 0, 0, 2, 0, 0, 2, 1, 0, 0, 0, 2, 0, 2, 0],
    wave: [1, 0, 0, 2, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0],
    festa: [1, 2, 1, 4, 2, 1, 2, 4, 1, 2, 1, 4, 2, 4, 2, 4],
  };

  const THEMES = {
    intro: {
      maqam: "hijaz", beat: 0.4, vol: 0.16, lead: "nay",
      rhythm: "slow",
      melodyA: [0, -1, -1, 2, -1, 4, -1, 3, 2, -1, 0, -1, 4, 5, 4, 0],
      melodyB: [4, -1, 2, -1, 0, -1, 2, 4, 5, 4, 2, 0, 3, 2, -1, 0],
      bass: [0, 0, 0, 4, 0, 0, 3, 0],
      counter: [7, -1, 5, -1, 4, -1, 2, 0],
    },
    title: {
      maqam: "hijaz", beat: 0.3, vol: 0.2, lead: "nay",
      rhythm: "malouf",
      melodyA: [0, -1, 2, 3, 2, -1, 4, 3, 2, 0, 1, 2, 4, 5, 4, 0],
      melodyB: [4, 5, 7, 5, 4, 3, 2, 4, 3, 2, 0, 2, 3, 2, 0, 0],
      bass: [0, 0, 3, 3, 4, 4, 0, 0],
      counter: [7, 5, 4, 5, 3, 2, 3, 0],
    },
    map: {
      maqam: "rast", beat: 0.26, vol: 0.2, lead: "oud",
      rhythm: "baladi",
      melodyA: [0, 2, 4, 2, 5, 4, 2, 0, 3, 4, 5, 4, 2, 0, 2, 0],
      melodyB: [4, 5, 7, 4, 5, 2, 4, 0, 2, 4, 5, 7, 5, 4, 2, 0],
      bass: [0, 0, 4, 4, 3, 3, 0, 4],
      counter: [4, 2, 0, 2, 5, 4, 2, 0],
    },
    story: {
      maqam: "hijaz", beat: 0.36, vol: 0.16, lead: "nay",
      rhythm: "slow",
      melodyA: [0, -1, -1, 2, -1, 3, -1, 2, 0, -1, 4, -1, 3, 2, -1, 0],
      melodyB: [4, -1, 2, -1, 0, -1, 2, 3, 2, -1, -1, 0, -1, -1, -1, 0],
      bass: [0, 0, 0, 4, 0, 0, 3, 0],
      counter: [7, -1, 5, -1, 4, -1, 2, 0],
    },
    beach: {
      maqam: "hijaz", beat: 0.24, vol: 0.22, lead: "nay",
      rhythm: "wave",
      melodyA: [0, 2, 4, 5, 4, 2, 3, 4, 5, 7, 5, 4, 3, 2, 0, 2],
      melodyB: [4, 4, 5, 7, 5, 4, 2, 0, 3, 2, 4, 5, 4, 2, 0, 0],
      bass: [0, 0, 4, 4, 3, 3, 0, 5],
      counter: [5, 4, 2, 0, 2, 4, 5, 7],
    },
    souk: {
      maqam: "bayati", beat: 0.16, vol: 0.26, lead: "mizmar",
      rhythm: "folklor",
      melodyA: [0, 2, 3, 4, 3, 2, 0, 2, 4, 5, 4, 3, 2, 3, 4, 0],
      melodyB: [4, 5, 7, 5, 4, 3, 4, 2, 0, 2, 3, 4, 5, 4, 2, 0],
      bass: [0, 0, 3, 3, 4, 4, 0, 2],
      counter: [4, 3, 2, 0, 2, 3, 4, 5],
    },
    ville: {
      maqam: "rast", beat: 0.22, vol: 0.22, lead: "oud",
      rhythm: "malouf",
      melodyA: [0, 2, 4, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 4, 0, 0],
      melodyB: [4, 5, 7, 4, 2, 0, 2, 4, 5, 4, 2, 0, 4, 5, 4, 0],
      bass: [0, 0, 4, 4, 5, 5, 0, 2],
      counter: [7, 5, 4, 2, 4, 5, 7, 4],
    },
    port: {
      maqam: "hijaz", beat: 0.26, vol: 0.22, lead: "oud",
      rhythm: "saidi",
      melodyA: [0, 0, 2, 4, 3, 2, 0, 0, 4, 5, 4, 2, 0, 2, 0, 0],
      melodyB: [4, 2, 0, 2, 4, 5, 4, 0, 3, 2, 0, 2, 4, 2, 0, 0],
      bass: [0, 0, 0, 4, 0, 0, 3, 0],
      counter: [4, 0, 2, 0, 5, 4, 0, 2],
    },
    lagoon: {
      maqam: "saba", beat: 0.3, vol: 0.18, lead: "nay",
      rhythm: "slow",
      melodyA: [0, -1, 2, 3, -1, 2, 0, -1, 4, 3, 2, -1, 0, 2, -1, 0],
      melodyB: [3, 2, 0, -1, 2, 4, 3, 2, 0, -1, -1, 2, 0, -1, -1, 0],
      bass: [0, 0, 2, 2, 0, 4, 0, 0],
      counter: [7, -1, 4, -1, 3, 2, -1, 0],
    },
    sunset: {
      maqam: "bayati", beat: 0.28, vol: 0.2, lead: "nay",
      rhythm: "slow",
      melodyA: [4, 3, 2, 0, 2, 3, 4, 5, 4, 2, 0, 2, 3, 2, 0, 0],
      melodyB: [0, 2, 4, 5, 7, 5, 4, 3, 2, 0, 2, 4, 3, 2, 0, 0],
      bass: [0, 0, 4, 4, 3, 3, 0, 5],
      counter: [7, 5, 4, 2, 4, 3, 2, 0],
    },
    resort: {
      maqam: "rast", beat: 0.2, vol: 0.22, lead: "mizmar",
      rhythm: "baladi",
      melodyA: [0, 2, 4, 5, 4, 7, 5, 4, 2, 4, 5, 4, 2, 0, 2, 0],
      melodyB: [4, 5, 7, 4, 5, 2, 4, 0, 2, 4, 5, 7, 5, 4, 2, 4],
      bass: [0, 4, 0, 5, 0, 4, 2, 0],
      counter: [4, 5, 7, 5, 4, 2, 0, 2],
    },
    festival: {
      maqam: "hijaz", beat: 0.15, vol: 0.28, lead: "mizmar",
      rhythm: "festa",
      melodyA: [0, 2, 4, 5, 4, 2, 4, 7, 5, 4, 2, 0, 2, 4, 5, 4],
      melodyB: [4, 5, 7, 8, 7, 5, 4, 2, 4, 5, 7, 5, 4, 2, 0, 4],
      bass: [0, 0, 4, 4, 0, 5, 0, 4],
      counter: [7, 5, 4, 7, 5, 4, 2, 4],
    },
  };

  const ALIAS = { play: "beach", menu: "title" };

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

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.62;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.22;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.48;
    sfxGain.connect(master);
    return true;
  }

  async function unlock() {
    if (!ensure()) return;
    if (ctx.state === "suspended") await ctx.resume();
  }

  function tone(f, t, dur, type, gainNode, vol = 0.2, slideTo = null) {
    if (!f || vol <= 0) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t + dur * 0.85);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(gainNode);
    o.start(t);
    o.stop(t + dur + 0.04);
  }

  /* Nay : flute douce + leger vibrato */
  function nay(f, t, dur, vol) {
    if (!f) return;
    tone(f, t, dur, "sine", musicGain, vol, f * 1.015);
    tone(f * 2.01, t, dur * 0.7, "sine", musicGain, vol * 0.18);
  }

  /* Oud : attaque pincee */
  function oud(f, t, dur, vol) {
    if (!f) return;
    tone(f, t, dur * 0.55, "triangle", musicGain, vol);
    tone(f * 2, t, dur * 0.25, "triangle", musicGain, vol * 0.22);
  }

  /* Mizmar / mezoued : timbre nasal */
  function mizmar(f, t, dur, vol) {
    if (!f) return;
    tone(f, t, dur, "square", musicGain, vol * 0.85, f * 1.01);
    tone(f * 1.5, t, dur * 0.5, "square", musicGain, vol * 0.12);
  }

  function leadPlay(kind, f, t, dur, vol) {
    if (kind === "nay") nay(f, t, dur, vol);
    else if (kind === "oud") oud(f, t, dur, vol);
    else mizmar(f, t, dur, vol);
  }

  function noiseHit(t, dur, vol, freq = 600) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(musicGain);
    src.start(t);
    src.stop(t + dur);
  }

  function drum(step, t) {
    if (step === 1) noiseHit(t, 0.1, 0.2, 170);
    else if (step === 2) noiseHit(t, 0.045, 0.12, 980);
    else if (step === 3) noiseHit(t, 0.035, 0.08, 720);
    else if (step === 4) noiseHit(t, 0.04, 0.14, 1800);
  }

  function resolveTheme(name) {
    const n = ALIAS[name] || name;
    return THEMES[n] ? n : "beach";
  }

  function scheduleBar(startTime) {
    const th = THEMES[theme] || THEMES.beach;
    const scale = scaleOf(th);
    musicGain.gain.setTargetAtTime(th.vol, startTime, 0.06);
    const beat = th.beat;
    const useB = Math.floor(barCount / 2) % 2 === 1;
    const melody = useB ? th.melodyB : th.melodyA;
    const rhy = RHY[th.rhythm] || RHY.baladi;

    for (let i = 0; i < 16; i++) {
      const t = startTime + i * beat;
      const mi = melody[i % melody.length];
      const f = freq(scale, mi);
      if (f) {
        leadPlay(th.lead, f, t, beat * (th.lead === "oud" ? 0.7 : 0.82), th.lead === "mizmar" ? 0.1 : 0.09);
        if (i % 4 === 3 && mi >= 0) {
          const o = freq(scale, mi + 2);
          leadPlay(th.lead, o, t + beat * 0.55, beat * 0.22, 0.05);
        }
      }
      if (i % 2 === 1) {
        const c = freq(scale, th.counter[(i >> 1) % th.counter.length]);
        if (c) tone(c * 2, t, beat * 0.45, "triangle", musicGain, 0.035);
      }
      if (i % 2 === 0) {
        const b = freq(scale, th.bass[(i / 2) % th.bass.length]);
        if (b) tone(b / 2, t, beat * 1.55, "triangle", musicGain, 0.11);
      }
      drum(rhy[i % 16], t);
      if (barCount % 4 === 3 && i === 15) noiseHit(t, 0.14, 0.15, 220);
      if (i === 0) tone(scale[0] / 4, t, beat * 16, "sine", musicGain, 0.028);
    }
    barCount += 1;
    return 16 * beat;
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
        musicGain.gain.setTargetAtTime(0.05, now, 0.04);
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
    switch (name) {
      case "pickup":
        tone(560, t, 0.05, "square", sfxGain, 0.18);
        tone(820, t + 0.04, 0.07, "square", sfxGain, 0.14);
        break;
      case "recycle":
        tone(330, t, 0.07, "triangle", sfxGain, 0.2);
        tone(415, t + 0.06, 0.07, "triangle", sfxGain, 0.18);
        tone(554, t + 0.12, 0.08, "triangle", sfxGain, 0.16);
        tone(660, t + 0.2, 0.12, "triangle", sfxGain, 0.14);
        break;
      case "sweep":
        tone(200, t, 0.08, "sawtooth", sfxGain, 0.08, 400);
        noiseHit(t, 0.1, 0.1, 400);
        break;
      case "upgrade":
        tone(400, t, 0.08, "sawtooth", sfxGain, 0.12);
        tone(500, t + 0.08, 0.08, "sawtooth", sfxGain, 0.12);
        tone(650, t + 0.16, 0.14, "sawtooth", sfxGain, 0.12);
        break;
      case "levelup":
        [440, 554, 659, 880].forEach((f, i) =>
          tone(f, t + i * 0.08, 0.12, "square", sfxGain, 0.15)
        );
        break;
      case "super":
        tone(523, t, 0.1, "square", sfxGain, 0.18);
        tone(659, t + 0.1, 0.1, "square", sfxGain, 0.18);
        tone(784, t + 0.2, 0.18, "square", sfxGain, 0.2);
        tone(1046, t + 0.35, 0.2, "triangle", sfxGain, 0.12);
        break;
      case "tick":
        tone(990, t, 0.035, "square", sfxGain, 0.07);
        break;
      case "fail":
        tone(220, t, 0.18, "sawtooth", sfxGain, 0.14, 140);
        tone(140, t + 0.16, 0.28, "sawtooth", sfxGain, 0.12);
        break;
      case "click":
        tone(700, t, 0.025, "square", sfxGain, 0.09);
        break;
      default:
        break;
    }
  }

  return { unlock, startMusic, stopMusic, setTheme, sfx, ensure };
})();
