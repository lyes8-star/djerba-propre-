/* Simulation monde — cycle jour/nuit, météo, vent */
const WorldSim = (() => {
  const DAY_SEC = 600;
  const WEATHER_CYCLE = 180;

  let clock = 9.25;
  let weather = "clear";
  let weatherT = 0;
  let wind = { x: 0.2, y: 0.05 };
  let rainIntensity = 0;
  let sandIntensity = 0;
  let cloudCover = 0.2;

  function hour() {
    return clock % 24;
  }

  function dayFactor() {
    const h = hour();
    const sun = Math.sin(((h - 6) / 24) * Math.PI * 2);
    return Math.max(0.05, Math.min(1, sun * 0.5 + 0.5));
  }

  function lerpColor(night, day, twilight, d, tw) {
    const base = night + (day - night) * d;
    if (tw > 0) return base * (1 - tw * 0.35) + twilight * tw * 0.35;
    return base;
  }

  function sunPosition() {
    const h = hour();
    const a = ((h - 6) / 12) * Math.PI;
    return {
      x: Math.cos(a) * 0.8,
      y: Math.max(-0.15, Math.sin(a)),
      z: 0.45,
      intensity: dayFactor(),
    };
  }

  function skyColors() {
    const d = dayFactor();
    const h = hour();
    const dawn = h > 5 && h < 7 ? 1 - Math.abs(h - 6) : 0;
    const dusk = h > 18 && h < 20 ? 1 - Math.abs(h - 19) : 0;
    const tw = dawn + dusk;
    return {
      top: lerpColor(0x020818, 0x5eb8ff, 0xff9860, d, tw),
      mid: lerpColor(0x0a1830, 0xb8e8ff, 0xffc090, d, tw),
      horizon: lerpColor(0x1a2848, 0xfff0c8, 0xff8060, d, tw),
      fog: lerpColor(0x0a1830, 0xb8e0f8, 0xd8b0a0, d * (1 - cloudCover * 0.3), tw),
      ambient: 0.12 + d * 0.38,
      sun: 0.15 + d * 1.05,
    };
  }

  function pickWeather() {
    const zone = window.__player && typeof Sprites !== "undefined"
      ? Sprites.zoneAt(window.__player.x, window.__player.y) : "beach";
    const roll = Math.random();
    if ((zone === "beach" || zone === "aghir") && roll < 0.15) return "sandstorm";
    if (roll < 0.25) return "rain";
    if (roll < 0.5) return "cloudy";
    if (roll < 0.65) return "windy";
    return "clear";
  }

  function tick(dt, player) {
    clock += (dt / DAY_SEC) * 24;
    if (clock >= 24) clock -= 24;
    weatherT += dt;
    if (weatherT > WEATHER_CYCLE) {
      weatherT = 0;
      weather = pickWeather();
    }
    rainIntensity = weather === "rain" ? 0.55 + Math.sin(weatherT * 0.4) * 0.2 : rainIntensity * 0.92;
    sandIntensity = weather === "sandstorm" ? 0.7 : sandIntensity * 0.9;
    cloudCover = weather === "clear" ? 0.15 : weather === "cloudy" ? 0.55 : weather === "rain" ? 0.75 : 0.35;
  }

  function moveFactor(p) {
    let f = 1;
    if (weather === "windy" || weather === "sandstorm") f *= 0.92;
    if (weather === "rain") f *= 0.96;
    if (p && p.swim) f *= 1.02;
    return f;
  }

  function state() {
    return {
      clock, hour: hour(), weather, wind, rainIntensity, sandIntensity, cloudCover,
      dayFactor: dayFactor(), sun: sunPosition(), sky: skyColors(),
    };
  }

  function label() {
    const h = Math.floor(hour());
    const m = Math.floor((hour() % 1) * 60);
    const w = { clear: "☀", cloudy: "☁", windy: "💨", rain: "🌧", sandstorm: "🌪" }[weather] || "";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${w}`;
  }

  return { tick, state, label, hour, dayFactor, sunPosition, skyColors, moveFactor };
})();
