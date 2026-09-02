/* Musiques MP3 téléchargées — pas d'ambiance ni de synthèse procédurale */
const AudioSys = (() => {
  const MASTER_VOL = 0.64;
  const MUSIC_VOL = 0.48;
  const SFX_VOL = 0.48;
  const FADE_MS = 900;
  const SETTINGS_KEY = "djerba2-audio";

  const TRACKS = {
    intro: "audio/music/medina.mp3",
    title: "audio/music/medina.mp3",
    map: "audio/music/medina.mp3",
    story: "audio/music/medina.mp3",
    beach: "audio/music/beach.mp3",
    souk: "audio/music/medina.mp3",
    folk: "audio/music/medina.mp3",
    ville: "audio/music/medina.mp3",
    port: "audio/music/medina.mp3",
    lagoon: "audio/music/beach.mp3",
    sunset: "audio/music/beach.mp3",
    resort: "audio/music/beach.mp3",
    festival: "audio/music/medina.mp3",
    holy: "audio/music/medina.mp3",
    night: "audio/music/medina.mp3",
  };

  const ALIAS = {
    play: "beach",
    menu: "title",
    hotel: "resort",
    cabaret: "night",
    midounv: "souk",
    aghir: "beach",
    erriadh: "holy",
    elmay: "lagoon",
    mosque: "holy",
    synagogue: "holy",
    cemetery: "holy",
    holy: "holy",
    workshop: "folk",
    kiln: "folk",
    mill: "folk",
    oven: "folk",
    guellala: "folk",
    explore: "map",
    museum: "map",
    fort: "map",
    inside: "ville",
    plaza: "ville",
    airport: "port",
    graffiti: "festival",
    menzel: "ville",
    souk: "souk",
    ville: "ville",
    beach: "beach",
    port: "port",
    sea: "beach",
    cistern: "lagoon",
    lagoon: "lagoon",
  };

  const SFX_FILES = {
    splash: { path: "audio/sfx/splash.mp3", vol: 0.42 },
    footstep: { path: "audio/sfx/footstep.mp3", vol: 0.08 },
  };

  let ctx = null;
  let sfxGain = null;
  let unlocked = false;
  let theme = "title";
  let playing = false;
  let current = null;
  let fadeTimer = null;
  let fadeFrom = null;
  let musicEnabled = true;
  let sfxEnabled = true;
  const pool = {};
  const oneShots = {};

  (function loadAudioSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.music === "boolean") musicEnabled = s.music;
      if (typeof s.sfx === "boolean") sfxEnabled = s.sfx;
    } catch (_) {}
  })();

  function saveAudioSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ music: musicEnabled, sfx: sfxEnabled }));
    } catch (_) {}
  }

  function musicTargetVol() {
    return musicEnabled ? MUSIC_VOL * MASTER_VOL : 0;
  }

  function applyAudioSettings() {
    if (sfxGain) sfxGain.gain.value = sfxEnabled ? SFX_VOL * MASTER_VOL : 0;
    if (!musicEnabled) {
      clearFade();
      if (current) {
        current.pause();
        current.currentTime = 0;
        current.volume = 0;
      }
      if (fadeFrom) {
        fadeFrom.pause();
        fadeFrom.currentTime = 0;
        fadeFrom.volume = 0;
        fadeFrom = null;
      }
      return;
    }
    if (current && playing) current.volume = musicTargetVol();
  }

  function setMusicEnabled(on) {
    musicEnabled = !!on;
    saveAudioSettings();
    applyAudioSettings();
    if (musicEnabled && playing && current && current.paused) {
      current.play().catch(() => {});
    }
  }

  function setSfxEnabled(on) {
    sfxEnabled = !!on;
    saveAudioSettings();
    applyAudioSettings();
  }

  function isMusicEnabled() { return musicEnabled; }
  function isSfxEnabled() { return sfxEnabled; }

  function resolveTheme(name) {
    const key = ALIAS[name] || name;
    return TRACKS[key] ? key : "beach";
  }

  function trackPath(name) {
    return TRACKS[resolveTheme(name)];
  }

  function ensureSfx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxEnabled ? SFX_VOL * MASTER_VOL : 0;
    sfxGain.connect(ctx.destination);
    return true;
  }

  function getLoop(path) {
    if (!pool[path]) {
      const a = new Audio(path);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      pool[path] = a;
    }
    return pool[path];
  }

  function clearFade() {
    if (fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }

  function fadeTo(next) {
    if (!musicEnabled) {
      clearFade();
      if (current) {
        current.pause();
        current.currentTime = 0;
        current.volume = 0;
      }
      current = next;
      fadeFrom = null;
      return;
    }
    clearFade();
    if (current === next) {
      if (next && next.paused) next.play().catch(() => {});
      return;
    }
    fadeFrom = current;
    current = next;
    if (!next) {
      if (fadeFrom) fadeFrom.volume = 0;
      return;
    }
    next.volume = 0;
    next.play().catch(() => {});
    const start = performance.now();
    const fromStart = fadeFrom ? fadeFrom.volume : 0;
    const targetVol = musicTargetVol();
    fadeTimer = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / FADE_MS);
      if (fadeFrom) fadeFrom.volume = fromStart * (1 - t);
      next.volume = targetVol * t;
      if (t >= 1) {
        if (fadeFrom) {
          fadeFrom.pause();
          fadeFrom.currentTime = 0;
          fadeFrom.volume = 0;
        }
        clearFade();
        fadeFrom = null;
      }
    }, 32);
  }

  async function unlock() {
    unlocked = true;
    ensureSfx();
    if (ctx && ctx.state === "suspended") await ctx.resume();
  }

  function startMusic(newTheme) {
    unlock();
    if (newTheme) theme = resolveTheme(newTheme);
    if (!musicEnabled) {
      playing = true;
      return;
    }
    const path = trackPath(theme);
    if (playing && current === pool[path] && !current.paused) return;
    playing = true;
    fadeTo(getLoop(path));
  }

  function setTheme(name) {
    const next = resolveTheme(name);
    if (theme === next && playing && current === pool[trackPath(next)] && !current.paused) return;
    theme = next;
    if (!playing) {
      startMusic(next);
      return;
    }
    if (!musicEnabled) return;
    fadeTo(getLoop(trackPath(next)));
  }

  function stopMusic() {
    playing = false;
    clearFade();
    if (current) {
      current.pause();
      current.currentTime = 0;
      current.volume = 0;
    }
    current = null;
    fadeFrom = null;
  }

  function envGain(t, dur, vol, attack) {
    const g = ctx.createGain();
    const a = Math.max(0.004, attack || 0.008);
    const hold = Math.max(0.01, dur - a);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold);
    g.connect(sfxGain);
    return g;
  }

  function tone(f, at, dur, type, vol, slideTo) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, at + dur * 0.5);
    const g = envGain(at, dur, vol, 0.008);
    o.connect(g);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  function playFile(name) {
    if (!sfxEnabled) return;
    const spec = SFX_FILES[name];
    if (!spec) return;
    if (!oneShots[name]) oneShots[name] = new Audio(spec.path);
    const a = oneShots[name].cloneNode();
    a.volume = spec.vol * MASTER_VOL;
    a.play().catch(() => {});
  }

  function sfx(name) {
    if (!sfxEnabled) return;
    if (!ensureSfx()) return;
    unlock();
    const t = ctx.currentTime;
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
      case "jump":
        tone(320, t, 0.06, "triangle", 0.12, 480);
        break;
      case "splash":
        playFile("splash");
        break;
      case "footstep":
        playFile("footstep");
        break;
      default:
        break;
    }
  }

  return {
    unlock,
    startMusic,
    stopMusic,
    setTheme,
    sfx,
    ensure: ensureSfx,
    setMusicEnabled,
    setSfxEnabled,
    isMusicEnabled,
    isSfxEnabled,
  };
})();
