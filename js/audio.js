/* Oriental retro chiptune via Web Audio API */
const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let playing = false;
  let timers = [];
  let step = 0;

  // Hijaz-flavored motif (approx frequencies)
  const SCALE = [
    220.0, // A3
    233.08, // Bb
    277.18, // C#
    293.66, // D
    329.63, // E
    349.23, // F
    415.3, // Ab
    440.0, // A4
  ];

  const MELODY = [0, 2, 3, 2, 4, 3, 2, 0, 1, 2, 4, 5, 4, 3, 2, 0];
  const BASS = [0, 0, 3, 3, 4, 4, 0, 0];

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.28;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.45;
    sfxGain.connect(master);
    return true;
  }

  async function unlock() {
    if (!ensure()) return;
    if (ctx.state === "suspended") await ctx.resume();
  }

  function tone(freq, t, dur, type, gainNode, vol = 0.2) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(gainNode);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noiseHit(t, dur, vol = 0.15) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 600;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(sfxGain);
    src.start(t);
    src.stop(t + dur);
  }

  function scheduleBar(startTime) {
    const beat = 0.22;
    for (let i = 0; i < 16; i++) {
      const t = startTime + i * beat;
      const m = SCALE[MELODY[i % MELODY.length]];
      tone(m, t, beat * 0.85, "square", musicGain, 0.12);
      if (i % 2 === 0) {
        const b = SCALE[BASS[(i / 2) % BASS.length]] / 2;
        tone(b, t, beat * 1.5, "triangle", musicGain, 0.14);
      }
      // darbuka-like percussion
      if (i % 4 === 0) noiseHit(t, 0.08, 0.18);
      else if (i % 4 === 2) noiseHit(t, 0.05, 0.1);
      else if (i % 8 === 5) noiseHit(t, 0.04, 0.08);
    }
    return 16 * beat;
  }

  function loopMusic() {
    if (!playing || !ctx) return;
    const now = ctx.currentTime;
    const dur = scheduleBar(now + 0.05);
    const id = setTimeout(loopMusic, dur * 1000 - 30);
    timers.push(id);
    step += 1;
  }

  function startMusic() {
    if (!ensure()) return;
    unlock();
    if (playing) return;
    playing = true;
    loopMusic();
  }

  function stopMusic() {
    playing = false;
    timers.forEach(clearTimeout);
    timers = [];
  }

  function sfx(name) {
    if (!ensure()) return;
    unlock();
    const t = ctx.currentTime;
    switch (name) {
      case "pickup":
        tone(520, t, 0.06, "square", sfxGain, 0.2);
        tone(780, t + 0.05, 0.08, "square", sfxGain, 0.15);
        break;
      case "recycle":
        tone(330, t, 0.08, "triangle", sfxGain, 0.2);
        tone(440, t + 0.07, 0.08, "triangle", sfxGain, 0.18);
        tone(660, t + 0.14, 0.12, "triangle", sfxGain, 0.16);
        break;
      case "upgrade":
        tone(400, t, 0.1, "sawtooth", sfxGain, 0.12);
        tone(500, t + 0.1, 0.1, "sawtooth", sfxGain, 0.12);
        tone(650, t + 0.2, 0.15, "sawtooth", sfxGain, 0.12);
        break;
      case "levelup":
        [440, 554, 659, 880].forEach((f, i) =>
          tone(f, t + i * 0.09, 0.12, "square", sfxGain, 0.15)
        );
        break;
      case "super":
        tone(523, t, 0.1, "square", sfxGain, 0.18);
        tone(659, t + 0.1, 0.1, "square", sfxGain, 0.18);
        tone(784, t + 0.2, 0.2, "square", sfxGain, 0.2);
        break;
      case "tick":
        tone(880, t, 0.04, "square", sfxGain, 0.08);
        break;
      case "fail":
        tone(200, t, 0.2, "sawtooth", sfxGain, 0.15);
        tone(140, t + 0.15, 0.25, "sawtooth", sfxGain, 0.12);
        break;
      case "click":
        tone(600, t, 0.03, "square", sfxGain, 0.1);
        break;
      default:
        break;
    }
  }

  return { unlock, startMusic, stopMusic, sfx, ensure };
})();
