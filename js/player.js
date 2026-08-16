/* Player — larger sprite footprint */
const Player = (() => {
  function create(stats) {
    return {
      x: 170,
      y: 290,
      vx: 0,
      vy: 0,
      facing: 1,
      attacking: false,
      attackTimer: 0,
      cooldown: 0,
      inventory: [],
      baseSpeed: 78,
      stats,
    };
  }

  function update(p, dt, input, world) {
    const loaded = p.inventory.length / Math.max(1, p.stats.capacity);
    const speed = p.baseSpeed * (1 + p.stats.moveBonus) * (1 - loaded * 0.2);

    let ix = input.x;
    let iy = input.y;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    p.vx = ix * speed;
    p.vy = iy * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (ix > 0.1) p.facing = 1;
    if (ix < -0.1) p.facing = -1;

    p.x = Math.max(8, Math.min(world.W - 36, p.x));
    p.y = Math.max(170, Math.min(world.H - 40, p.y));

    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) p.attacking = false;
    }
    if (p.cooldown > 0) p.cooldown -= dt;

    World.followBin(world, p);
  }

  function action(p, world, mode) {
    if (p.cooldown > 0) return null;
    p.cooldown = 0.3 / p.stats.pinceSpeed;
    p.attacking = true;
    p.attackTimer = 0.22;

    if (mode === "balai") {
      const r = World.trySweep(world, p, p.stats);
      if (r.n > 0) {
        world.score += r.pts;
        return { type: "sweep", ...r };
      }
    }

    const rec = World.tryRecycle(world, p, p.stats);
    if (rec && !rec.empty) return { type: "recycle", ...rec };

    const pick = World.tryPickup(world, p, p.stats);
    if (pick && pick.full) return { type: "full" };
    if (pick && pick.item) {
      world.score += pick.points;
      return { type: "pickup", ...pick };
    }
    return { type: "miss" };
  }

  return { create, update, action };
})();
