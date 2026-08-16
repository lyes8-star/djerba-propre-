/* Particles, floating text, screen shake */
const FX = (() => {
  let particles = [];
  let texts = [];
  let shake = 0;
  let flash = 0;

  function reset() {
    particles = [];
    texts = [];
    shake = 0;
    flash = 0;
  }

  function burst(x, y, color, n = 10, speed = 40) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 20,
        life: 0.35 + Math.random() * 0.45,
        max: 0.8,
        size: 1 + Math.floor(Math.random() * 2),
        color,
        gravity: 60,
      });
    }
  }

  function stars(x, y) {
    burst(x, y, "#f5c842", 14, 55);
    burst(x, y, "#ffffff", 8, 35);
  }

  function recycle(x, y) {
    burst(x, y, "#2db84a", 12, 45);
    burst(x, y, "#7dff8a", 8, 30);
    flash = 0.18;
  }

  function pickup(x, y) {
    burst(x, y, "#5eb3f0", 6, 35);
  }

  function sweep(x, y) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + 4,
        vx: (Math.random() - 0.5) * 30,
        vy: -10 - Math.random() * 25,
        life: 0.3 + Math.random() * 0.3,
        max: 0.6,
        size: 1,
        color: "#e8d4a8",
        gravity: 40,
      });
    }
  }

  function floatText(x, y, text, color = "#f5c842") {
    texts.push({ x, y, text, color, life: 0.9, max: 0.9, vy: -28 });
  }

  function hitShake(amount = 0.25) {
    shake = Math.max(shake, amount);
  }

  function update(dt) {
    shake = Math.max(0, shake - dt * 1.8);
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
  }

  function applyShake(ctx) {
    if (shake <= 0) return;
    const mag = shake * 3;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  function draw(ctx) {
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const t of texts) {
      const a = Math.max(0, t.life / t.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = t.color;
      ctx.font = "bold 8px monospace";
      ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
    }
    ctx.globalAlpha = 1;
    if (flash > 0) {
      ctx.fillStyle = `rgba(125,255,138,${flash * 0.35})`;
      ctx.fillRect(0, 0, 400, 400);
    }
  }

  return {
    reset,
    burst,
    stars,
    recycle,
    pickup,
    sweep,
    floatText,
    hitShake,
    update,
    applyShake,
    draw,
  };
})();
