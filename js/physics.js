/* Moteur physique + collisions — capsule joueur, AABB bâtiments, eau */
const Physics = (() => {
  const PW = 32;
  const PH = 40;
  const CAP_R = 9;
  const CAP_H = 28;
  const GRAVITY = 420;
  const JUMP_V = 195;
  const WATER_DRAG = 4.2;
  const BUOYANCY = 280;

  function feet(p) {
    return { x: p.x + 8, y: p.y + 26, w: 16, h: 12 };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function capsuleBox(p) {
    return {
      x: p.x + 16 - CAP_R,
      y: p.y + PH - CAP_H,
      w: CAP_R * 2,
      h: CAP_H,
    };
  }

  function resolveAABB(box, solid) {
    if (!overlap(box, solid)) return false;
    const left = box.x + box.w - solid.x;
    const right = solid.x + solid.w - box.x;
    const top = box.y + box.h - solid.y;
    const bot = solid.y + solid.h - box.y;
    const ox = left < right ? left : -right;
    const oy = top < bot ? top : -bot;
    if (Math.abs(ox) < Math.abs(oy)) {
      box.x -= ox;
      return true;
    }
    box.y -= oy;
    return true;
  }

  function buildingSolids(world) {
    if (world.inside) return [];
    return (Places.BUILDINGS || []).map((b) => ({
      x: b.x + 6,
      y: b.y + 6,
      w: b.w - 12,
      h: Math.max(12, (b.doorY || 24) - 8),
    }));
  }

  function moveWithCollision(p, dt, world) {
    const solids = buildingSolids(world);
    const steps = Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy) * dt / 8));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      p.x += p.vx * sdt;
      p.y += p.vy * sdt;
      const box = capsuleBox(p);
      for (const s of solids) {
        if (resolveAABB(box, s)) {
          p.x = box.x + CAP_R - 16;
          p.y = box.y + CAP_H - PH;
          p.vx *= 0.15;
          p.vy *= 0.15;
        }
      }
    }
  }

  function groundState(p, world) {
    if (world.inside) return { swim: false, grounded: true, slope: 0 };
    const c = Island.clampPlay(p.x + 16, p.y + 28);
    const swim = !!c.swim;
    const tile = Island.tileAt(p.x + 16, p.y + 28);
    const grounded = !swim && (p.vz || 0) <= 2;
    return { swim, grounded, tile, c };
  }

  function move(p, dt, input, world) {
    if (world.ride) return false;
    if (!p.phys) {
      p.phys = { vz: 0, jumpCd: 0, walkPhase: 0, grounded: true };
    }
    const ph = p.phys;
    ph.jumpCd = Math.max(0, ph.jumpCd - dt);

    const loaded = p.inventory.length / Math.max(1, p.stats.capacity);
    const cafe = typeof Progress !== "undefined" ? Progress.cafeBonus() : 0;
    let maxSpeed = p.baseSpeed * (1 + p.stats.moveBonus + cafe) * (1 - loaded * 0.2);
    if (typeof Market !== "undefined") maxSpeed *= Market.speedPenalty();
    if (typeof WorldSim !== "undefined") maxSpeed *= WorldSim.moveFactor(p);

    const gs = groundState(p, world);
    p.swim = gs.swim;

    let ix = input.x;
    let iy = input.y;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    const accel = p.swim ? 240 : 380;
    const friction = p.swim ? WATER_DRAG : (ph.grounded ? 11 : 2.5);

    p.vx += ix * accel * dt;
    p.vy += iy * accel * dt;
    p.vx *= Math.exp(-friction * dt);
    p.vy *= Math.exp(-friction * dt);

    if (p.swim) {
      ph.vz = (ph.vz || 0) * 0.9;
      if (typeof WaterEngine !== "undefined") {
        const w = WaterEngine.sample(p.x + 16, p.y + 20, performance.now() / 1000);
        ph.vz += (w.height * 0.02 - (ph.vz || 0)) * dt * 3;
      }
      const sp = Math.hypot(p.vx, p.vy);
      const swimMax = maxSpeed * 0.58;
      if (sp > swimMax) {
        p.vx = (p.vx / sp) * swimMax;
        p.vy = (p.vy / sp) * swimMax;
      }
    } else {
      if (!ph.grounded) ph.vz = (ph.vz || 0) - GRAVITY * dt;
      else ph.vz = 0;

      const sp = Math.hypot(p.vx, p.vy);
      if (sp > maxSpeed) {
        p.vx = (p.vx / sp) * maxSpeed;
        p.vy = (p.vy / sp) * maxSpeed;
      }
    }

    if (ix > 0.1) p.facing = 1;
    if (ix < -0.1) p.facing = -1;

    moveWithCollision(p, dt, world);

    if (!world.inside) {
      const c = Island.clampPlay(p.x + 16, p.y + 28);
      p.x = c.x - 16;
      p.y = c.y - 28;
      p.swim = !!c.swim;
      p.x = Math.max(8, Math.min(world.W - PW, p.x));
      p.y = Math.max(8, Math.min(world.H - PH, p.y));
      if (!p.swim) Places.collide(p, world);
      ph.grounded = !p.swim && (ph.vz || 0) <= 0;
      if (ph.grounded) ph.vz = 0;
    } else {
      p.swim = false;
      Places.collide(p, world);
      ph.grounded = true;
      ph.vz = 0;
    }

    const moving = Math.hypot(p.vx, p.vy) > 12;
    if (moving) ph.walkPhase = (ph.walkPhase || 0) + dt * (p.swim ? 5 : 9);
    else ph.walkPhase = (ph.walkPhase || 0) * 0.85;

    p.animState = p.swim ? "swim" : (moving ? "walk" : "idle");
    if (p.attacking) p.animState = "action";
    return true;
  }

  function tryJump(p, input) {
    if (!p.phys || p.swim || !p.phys.grounded || p.phys.jumpCd > 0) return false;
    if (!input.keys || (!input.keys[" "] && !input.keys.space)) return false;
    p.phys.vz = JUMP_V;
    p.phys.grounded = false;
    p.phys.jumpCd = 0.35;
    if (typeof AudioSys !== "undefined") AudioSys.sfx("jump");
    return true;
  }

  function pushApart(p, other, minD) {
    const dx = (p.x + 16) - (other.x + 16);
    const dy = (p.y + 20) - (other.y + 20);
    const d = Math.hypot(dx, dy) || 1;
    if (d >= minD) return;
    const push = (minD - d) * 0.5;
    p.x += (dx / d) * push;
    p.y += (dy / d) * push;
  }

  return {
    move, tryJump, pushApart, feet, capsuleBox, CAP_R, CAP_H,
  };
})();
