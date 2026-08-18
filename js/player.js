/* Player — 32x40 sprite on the enlarged island */
const Player = (() => {
  const PW = 32;
  const PH = 40;

  function create(stats) {
    const start = Island.xy("sidi");
    return {
      x: start.x,
      y: start.y,
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
    if (world.ride) {
      p.vx = 0;
      p.vy = 0;
      p.ride = true;
      p.facing = world.ride.facing || p.facing;
      if (p.attackTimer > 0) {
        p.attackTimer -= dt;
        if (p.attackTimer <= 0) p.attacking = false;
      }
      if (p.cooldown > 0) p.cooldown -= dt;
      Places.tick(world, p, dt);
      return;
    }
    p.ride = false;
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

    if (world.inside) {
      Places.collide(p, world);
    } else {
      const c = Island.clamp(p.x + 16, p.y + 28);
      p.x = c.x - 16;
      p.y = c.y - 28;
      p.x = Math.max(8, Math.min(world.W - PW, p.x));
      p.y = Math.max(8, Math.min(world.H - PH, p.y));
      Places.collide(p, world);
    }
    Places.tick(world, p, dt);

    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) p.attacking = false;
    }
    if (p.cooldown > 0) p.cooldown -= dt;

    if (!world.inside) World.followBin(world, p);
  }

  function action(p, world, mode) {
    if (p.cooldown > 0) return null;
    if (world.ride) {
      const more = Traffic.talkNext(world.ride);
      if (more) return more;
      return Traffic.hopOff(world, p);
    }
    const door = Places.tryDoor(p, world);
    if (door) {
      p.attacking = false;
      return door;
    }
    if (!world.inside && typeof Traffic !== "undefined") {
      const taxi = Traffic.nearestTaxi(world, p, 36);
      if (taxi) {
        const td = Math.hypot(taxi.px - (p.x + 16), taxi.py - (p.y + 20));
        const npc = Npc.nearest(world, p, 36);
        const nd = npc
          ? Math.hypot(npc.x + 16 - (p.x + 16), npc.y + 20 - (p.y + 20))
          : 999;
        const qHere = npc && npc.qRole && typeof Quests !== "undefined" && Quests.mark(npc) && nd < 36;
        if (td < 36 && td <= nd + 6 && !qHere) {
          p.cooldown = 0.35;
          return Traffic.board(world, p, taxi);
        }
      }
    }
    p.cooldown = 0.3 / p.stats.pinceSpeed;
    p.attacking = true;
    p.attackTimer = 0.22;

    if (world.inside) {
      const inn = Npc.nearest(world, p, 40);
      if (inn && mode !== "balai") {
        p.attacking = false;
        p.attackTimer = 0;
        return Npc.talk(inn, p);
      }
      return { type: "miss" };
    }

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
