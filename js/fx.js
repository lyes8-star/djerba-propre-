/* Particles, floating text, screen shake, rings */
const FX = (() => {
  let particles = [];
  let texts = [];
  let rings = [];
  let shake = 0;
  let flash = 0;
  const MAX_PARTICLES = 96;
  const MAX_TEXTS = 20;
  const MAX_RINGS = 14;

  function trim() {
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    if (texts.length > MAX_TEXTS) texts.splice(0, texts.length - MAX_TEXTS);
    if (rings.length > MAX_RINGS) rings.splice(0, rings.length - MAX_RINGS);
  }

  function reset() {
    particles = [];
    texts = [];
    rings = [];
    shake = 0;
    flash = 0;
  }

  function burst(x, y, color, n = 12, speed = 50) {
    trim();
    const room = MAX_PARTICLES - particles.length;
    if (room <= 0) return;
    const count = Math.min(n, room);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 25,
        life: 0.4 + Math.random() * 0.5,
        max: 0.9,
        size: 1 + (Math.random() * 3) | 0,
        color,
        gravity: 70,
      });
    }
  }

  function stars(x, y) {
    burst(x, y, "#ffd24a", 16, 60);
    burst(x, y, "#ffffff", 10, 40);
    if (rings.length < MAX_RINGS) rings.push({ x, y, r: 2, max: 28, life: 0.45 });
  }

  function recycle(x, y) {
    burst(x, y, "#3ddc5a", 14, 50);
    burst(x, y, "#8dff9c", 10, 35);
    flash = 0.22;
    if (rings.length < MAX_RINGS) rings.push({ x, y, r: 2, max: 34, life: 0.5, color: "#3ddc5a" });
  }

  function pickup(x, y) {
    burst(x, y, "#6ec8ff", 8, 40);
    if (rings.length < MAX_RINGS) rings.push({ x, y, r: 1, max: 16, life: 0.28, color: "#6ec8ff" });
  }

  function sweep(x, y) {
    trim();
    const room = MAX_PARTICLES - particles.length;
    if (room <= 0) return;
    const count = Math.min(12, room);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + 4,
        vx: (Math.random() - 0.5) * 40,
        vy: -15 - Math.random() * 30,
        life: 0.35 + Math.random() * 0.3,
        max: 0.65,
        size: 1 + (Math.random() * 2) | 0,
        color: "#e2c78a",
        gravity: 45,
      });
    }
  }

  function dust(x, y) {
    if (particles.length >= MAX_PARTICLES) return;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + 30,
      vx: (Math.random() - 0.5) * 12,
      vy: -8 - Math.random() * 10,
      life: 0.25 + Math.random() * 0.2,
      max: 0.45,
      size: 1 + (Math.random() * 2) | 0,
      color: "#d8c090",
      gravity: 20,
    });
  }

  function glint(x, y) {
    if (particles.length >= MAX_PARTICLES - 3) return;
    burst(x, y, "#ffe9a0", 3, 18);
  }

  function floatText(x, y, text, color = "#ffd24a") {
    if (texts.length >= MAX_TEXTS) texts.shift();
    texts.push({ x, y, text, color, life: 1, max: 1, vy: -32 });
  }

  function hitShake(amount = 0.28) {
    shake = Math.max(shake, amount);
    if (typeof Engine3D !== "undefined" && Engine3D.active()) Engine3D.hitShake(amount);
  }

  function update(dt) {
    shake = Math.max(0, shake - dt * 2);
    flash = Math.max(0, flash - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      r.r += dt * 55;
      if (r.life <= 0) rings.splice(i, 1);
    }
  }

  function applyShake(ctx) {
    if (shake <= 0) return;
    const mag = shake * 4;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  function draw(ctx) {
    for (const r of rings) {
      const a = Math.max(0, r.life / 0.5);
      ctx.strokeStyle = r.color || "#ffd24a";
      ctx.globalAlpha = a;
      ctx.lineWidth = 2;
      ctx.strokeRect((r.x - r.r) | 0, (r.y - r.r) | 0, (r.r * 2) | 0, (r.r * 2) | 0);
    }
    ctx.globalAlpha = 1;
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.max);
      ctx.fillStyle = "#000";
      ctx.font = "bold 9px monospace";
      ctx.fillText(t.text, (t.x + 1) | 0, (t.y + 1) | 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x | 0, t.y | 0);
    }
    ctx.globalAlpha = 1;
  }

  function drawFlash(ctx, w, h) {
    if (flash <= 0) return;
    ctx.fillStyle = `rgba(141,255,156,${flash * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  }

  return {
    reset, burst, stars, recycle, pickup, sweep, dust, glint, floatText,
    hitShake, update, applyShake, draw, drawFlash,
  };
})();
