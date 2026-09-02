/* Player — 32x40 sprite on the enlarged island */
const Player = (() => {
  const PW = 32;
  const PH = 40;
  const FEET_OFF = 32;

  function create(stats) {
    const start = Island.xy("sidi");
    return {
      x: start.x + 140,
      y: start.y + 95,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      pitch: 0,
      swim: false,
      ride: false,
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

    const camX = input.camX || 0;
    const camY = input.camY || 0;
    if (Math.abs(camX) > 0.04 || Math.abs(camY) > 0.04) {
      p.angle = (p.angle != null ? p.angle : -Math.PI / 2) + camX * 2.6 * dt;
      p.pitch = Math.max(-0.45, Math.min(0.45, (p.pitch || 0) + camY * 1.4 * dt));
    }

    if (typeof Interactions !== "undefined" && Interactions.isSitting()) {
      p.vx *= Math.exp(-10 * dt);
      p.vy *= Math.exp(-10 * dt);
      p.animState = "idle";
      if (p.attackTimer > 0) {
        p.attackTimer -= dt;
        if (p.attackTimer <= 0) p.attacking = false;
      }
      if (p.cooldown > 0) p.cooldown -= dt;
      Places.tick(world, p, dt);
      return;
    }

    let mx = input.moveX != null ? input.moveX : input.x;
    let my = input.moveY != null ? input.moveY : input.y;
    const joyMag = Math.hypot(mx, my);
    if (joyMag > 1) {
      mx /= joyMag;
      my /= joyMag;
    }
    const ang = p.angle != null ? p.angle : -Math.PI / 2;
    const fwd = -my;
    const str = mx;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    input.x = cos * fwd - sin * str;
    input.y = sin * fwd + cos * str;

    if (typeof Physics !== "undefined") {
      Physics.tryJump(p, input);
      Physics.move(p, dt, input, world);
    } else {
      const loaded = p.inventory.length / Math.max(1, p.stats.capacity);
      const cafe = typeof Progress !== "undefined" ? Progress.cafeBonus() : 0;
      let speed = p.baseSpeed * (1 + p.stats.moveBonus + cafe) * (1 - loaded * 0.2);
      if (typeof Market !== "undefined") speed *= Market.speedPenalty();
      if (p.swim) speed *= 0.52;

      p.vx = input.x * speed;
      p.vy = input.y * speed;

      if (world.inside) {
        p.swim = false;
        const nx = p.x + p.vx * dt;
        p.x = nx;
        Places.collide(p, world);
        const ny = p.y + p.vy * dt;
        p.y = ny;
        Places.collide(p, world);
      } else {
        const nx = p.x + p.vx * dt;
        p.x = nx;
        if (!p.swim) Places.collide(p, world);
        const ny = p.y + p.vy * dt;
        p.y = ny;
        const c = Island.clampPlay(p.x + 16, p.y + FEET_OFF);
        p.x = c.x - 16;
        p.y = c.y - FEET_OFF;
        p.swim = !!c.swim;
        p.x = Math.max(8, Math.min(world.W - PW, p.x));
        p.y = Math.max(8, Math.min(world.H - PH, p.y));
        if (!p.swim) Places.collide(p, world);
      }
    }

    if (Math.abs(p.vx) > 0.1) p.facing = p.vx >= 0 ? 1 : -1;
    Places.tick(world, p, dt);

    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) p.attacking = false;
    }
    if (p.cooldown > 0) p.cooldown -= dt;
  }

  function action(p, world, mode) {
    if (p.cooldown > 0) return null;
    if (world.ride) {
      const more = Traffic.talkNext(world.ride);
      if (more) return more;
      if (world.ride.boardLock > 0) return null;
      return Traffic.hopOff(world, p);
    }
    if (typeof Market !== "undefined" && Market.isOpen()) {
      p.attacking = false;
      return null;
    }
    const spot = typeof Interactions !== "undefined" ? Interactions.near(p, world) : null;
    if (spot && !world.inside && !p.swim) {
      p.attacking = false;
      p.attackTimer = 0;
      p.cooldown = 0.35;
      return Interactions.use(spot, p, world);
    }
    const stall = typeof Market !== "undefined" ? Market.nearStall(p, world) : null;
    if (stall && !world.inside) {
      p.attacking = false;
      p.attackTimer = 0;
      Market.openMarket(stall);
      return { type: "market", title: stall.name, sub: stall.sub };
    }
    const atDoor = Places.nearDoor(p, world);
    if (atDoor) {
      const door = Places.tryDoor(p, world);
      if (door) {
        p.attacking = false;
        return door;
      }
    }
    if (!world.inside && typeof Traffic !== "undefined" && !p.swim) {
      const taxi = Traffic.nearestTaxi(world, p, Traffic.BOARD_RANGE || 52);
      if (taxi) {
        const td = Math.hypot(taxi.px - (p.x + 16), taxi.py - (p.y + 20));
        const facingTaxi = World.inFront(p, taxi.px, taxi.py, 56, 1.6);
        const npc = Npc.nearest(world, p, 36);
        const nd = npc
          ? Math.hypot(npc.x + 16 - (p.x + 16), npc.y + 20 - (p.y + 20))
          : 999;
        const qHere = npc && npc.qRole && typeof Quests !== "undefined" && Quests.mark(npc) && nd < 36;
        if (td < 40 && !qHere && facingTaxi) {
          p.cooldown = 0.4;
          return Traffic.board(world, p, taxi);
        }
        if (td < 52 && td <= nd + 6 && !qHere && facingTaxi) {
          p.cooldown = 0.4;
          return Traffic.board(world, p, taxi);
        }
      }
    }
    const door = Places.tryDoor(p, world);
    if (door) {
      p.attacking = false;
      return door;
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

    const glued = World.nearestBin(world, p, 40);
    if (glued && p.inventory.length > 0) {
      const dump = World.tryRecycle(world, p, p.stats);
      if (dump && !dump.empty) return { type: "recycle", ...dump };
    }

    const npc = Npc.nearest(world, p, 36);
    if (npc && mode !== "balai") {
      const nd = Math.hypot(npc.x - p.x, npc.y - p.y);
      let trashD = Infinity;
      for (const t of World.living(world)) {
        const d = Math.hypot(t.x + 8 - (p.x + 16), t.y + 10 - (p.y + 20));
        if (d < trashD) trashD = d;
      }
      for (const t of World.livingRares(world)) {
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

    const rec = World.tryRecycle(world, p, p.stats);
    if (rec && !rec.empty) return { type: "recycle", ...rec };

    if (npc && mode !== "balai") {
      p.attacking = false;
      p.attackTimer = 0;
      return Npc.talk(npc, p);
    }
    return { type: "miss" };
  }

  return { create, update, action };
})();
