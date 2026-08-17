/* Player — 24x32 SMB-sized sprite on 960x1200 world */
const Player = (() => {
  const PW = 32;
  const PH = 40;

  function create(stats) {
    return {
      x: 448,
      y: 430,
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

    p.x = Math.max(8, Math.min(world.W - PW, p.x));
    p.y = Math.max(330, Math.min(world.H - PH, p.y));

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

    const npc = Npc.nearest(world, p, 36);
    if (npc && mode !== "balai") {
      const nd = Math.hypot(npc.x - p.x, npc.y - p.y);
      let trashD = Infinity;
      for (const t of World.living(world)) {
        const d = Math.hypot(t.x + 8 - (p.x + 16), t.y + 10 - (p.y + 20));
        if (d < trashD) trashD = d;
      }
      if (nd < 34 && nd <= trashD + 6) {
        p.attacking = false;
        p.attackTimer = 0;
        return Npc.talk(npc, p);
      }
    }

    const pick = World.tryPickup(world, p, p.stats);
    if (pick && pick.full) return { type: "full" };
    if (pick && pick.item) {
      world.score += pick.points;
      return { type: "pickup", ...pick };
    }
    if (npc) {
      p.attacking = false;
      p.attackTimer = 0;
      return Npc.talk(npc, p);
    }
    return { type: "miss" };
  }

  return { create, update, action };
})();
