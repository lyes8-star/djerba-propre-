/* Oriental retro chiptune — title & play themes */
const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let playing = false;
  let theme = "title";
  let timers = [];
  let barCount = 0;

  // Hijaz-ish scale around A
  const SCALE = [220.0, 233.08, 277.18, 293.66, 329.63, 349.23, 415.3, 440.0, 554.37, 587.33];

  const THEMES = {
    title: {
      beat: 0.28,
      melodyA: [0, 2, 3, 2, 4, 3, 2, 0, 1, 2, 4, 5, 4, 3, 2, 0],
      melodyB: [4, 5, 7, 5, 4, 3, 2, 4, 3, 2, 0, 2, 3, 2, 0, 0],
      bass: [0, 0, 3, 3, 4, 4, 0, 0],
      counter: [7, 5, 4, 5, 3, 2, 3, 0],
      musicVol: 0.22,
    },
    play: {
      beat: 0.2,
      melodyA: [0, 2, 4, 5, 4, 2, 3, 4, 5, 7, 5, 4, 3, 2, 0, 2],
      melodyB: [4, 4, 5, 7, 8, 7, 5, 4, 3, 2, 4, 5, 4, 2, 0, 0],
      bass: [0, 0, 4, 4, 3, 3, 0, 5],
      counter: [5, 4, 2, 0, 2, 4, 5, 7],
      musicVol: 0.26,
    },
  };

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.26;
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

  function tone(freq, t, dur, type, gainNode, vol = 0.2, slideTo = null) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t + dur * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(gainNode);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noiseHit(t, dur, vol, freq = 600) {
    const len = Math.floor(ctx.sampleRate * dur);
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

  function scheduleBar(startTime) {
    const th = THEMES[theme] || THEMES.play;
    musicGain.gain.setTargetAtTime(th.musicVol, startTime, 0.05);
    const beat = th.beat;
    const useB = Math.floor(barCount / 2) % 2 === 1;
    const melody = useB ? th.melodyB : th.melodyA;

    for (let i = 0; i < 16; i++) {
      const t = startTime + i * beat;
      const m = SCALE[melody[i % melody.length]];
      tone(m, t, beat * 0.8, "square", musicGain, 0.1);
      // soft counter every other
      if (i % 2 === 1) {
        const c = SCALE[th.counter[(i >> 1) % th.counter.length]] * 2;
        tone(c, t, beat * 0.5, "triangle", musicGain, 0.04);
      }
      if (i % 2 === 0) {
        const b = SCALE[th.bass[(i / 2) % th.bass.length]] / 2;
        tone(b, t, beat * 1.6, "triangle", musicGain, 0.12);
      }
      // darbuka pattern
      if (i % 8 === 0) noiseHit(t, 0.09, 0.2, 180); // doum
      else if (i % 8 === 3 || i % 8 === 6) noiseHit(t, 0.05, 0.12, 900); // tek
      else if (i % 8 === 2 || i % 8 === 5) noiseHit(t, 0.04, 0.08, 700);
      // drone pulse
      if (i === 0) tone(SCALE[0] / 4, t, beat * 16, "sine", musicGain, 0.03);
    }
    barCount += 1;
    return 16 * beat;
  }

  function loopMusic() {
    if (!playing || !ctx) return;
    const now = ctx.currentTime;
    const dur = scheduleBar(now + 0.05);
    const id = setTimeout(loopMusic, dur * 1000 - 40);
    timers.push(id);
  }

  function stopTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function startMusic(newTheme) {
    if (!ensure()) return;
    unlock();
    if (newTheme) theme = newTheme;
    if (playing) return;
    playing = true;
    barCount = 0;
    loopMusic();
  }

  function setTheme(name) {
    if (theme === name) return;
    theme = name;
    barCount = 0;
    if (!playing) startMusic(name);
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
