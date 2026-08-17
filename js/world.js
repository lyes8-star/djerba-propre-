/* Beach world — mission-driven */
const World = (() => {
  const TYPES = ["can", "bottle", "bag", "can", "bottle", "bag"];
  const POINTS = { can: 40, bottle: 55, bag: 90 };

  function create(mission) {
    const m = mission || {};
    const W = 960;
    const H = 1200;
    const count = m.trash || 24;
    const bagTarget = m.bagTarget || 5;
    const recycleTarget = m.recycleTarget || 12;
    const cleanTarget = m.cleanTarget || 80;
    const bagRatio = m.bagRatio != null ? m.bagRatio : 0.3;
    const trash = [];
    for (let i = 0; i < count; i++) {
      trash.push(spawnOne(W, H, i, bagRatio));
    }
    return {
      W,
      H,
      trash,
      initial: trash.length,
      recycled: 0,
      bagsCollected: 0,
      score: 0,
      bagTarget,
      recycleTarget,
      cleanTarget,
      spawnEnabled: !!m.spawn,
      spawnTimer: 0,
      combo: 0,
      comboTimer: 0,
      theme: m.theme || "beach",
      missionId: m.id || 1,
      missionName: m.name || "Plage",
      bin: { x: 430, y: 448 },
      npcs: [],
    };
  }

  function spawnOne(W, H, seed, bagRatio) {
    const type = Math.random() < bagRatio ? "bag" : TYPES[(seed + (Math.random() * 4) | 0) % TYPES.length];
    return {
      id: `${Date.now()}_${seed}_${Math.random()}`,
      type,
      x: 30 + Math.random() * (W - 80),
      y: 340 + Math.random() * (H - 420),
      alive: true,
    };
  }

  function tickSpawn(world, dt) {
    world.comboTimer = Math.max(0, world.comboTimer - dt);
    if (world.comboTimer <= 0) world.combo = 0;
    if (!world.spawnEnabled) return;
    if (cleanliness(world) >= 88) return;
    world.spawnTimer += dt;
    if (world.spawnTimer < 3.8) return;
    world.spawnTimer = 0;
    if (living(world).length >= world.initial + 6) return;
    world.trash.push(spawnOne(world.W, world.H, world.trash.length, 0.3));
  }

  function living(world) {
    return world.trash.filter((t) => t.alive);
  }

  function cleanliness(world) {
    if (world.initial === 0) return 100;
    const left = living(world).length;
    const cleaned = Math.max(0, world.initial - left);
    return Math.min(100, Math.round((cleaned / world.initial) * 100));
  }

  function tryPickup(world, player, stats) {
    const range = stats.pinceRange;
    let best = null;
    let bestD = Infinity;
    for (const t of living(world)) {
      const d = Math.hypot(t.x + 8 - (player.x + 16), t.y + 10 - (player.y + 20));
      if (d < range && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    if (!best) return null;
    if (player.inventory.length >= stats.capacity) return { full: true };
    best.alive = false;
    player.inventory.push(best.type);
    if (best.type === "bag") world.bagsCollected += 1;
    world.combo += 1;
    world.comboTimer = 2.2;
    const mult = 1 + Math.min(4, world.combo - 1) * 0.15;
    return { item: best, points: Math.floor(POINTS[best.type] * 0.4 * mult), combo: world.combo };
  }

  function trySweep(world, player, stats) {
    const r = stats.balaiRadius;
    let n = 0;
    let pts = 0;
    for (const t of living(world)) {
      const d = Math.hypot(t.x - player.x - 16, t.y - player.y - 20);
      if (d < r) {
        if (player.inventory.length >= stats.capacity) break;
        t.alive = false;
        player.inventory.push(t.type);
        if (t.type === "bag") world.bagsCollected += 1;
        n += 1;
        pts += Math.floor(POINTS[t.type] * 0.22 * stats.balaiEff);
      }
    }
    if (n > 0) {
      world.combo += n;
      world.comboTimer = 2.2;
    }
    return { n, pts };
  }

  function tryRecycle(world, player, stats) {
    if (Math.hypot(player.x - world.bin.x, player.y - world.bin.y) > 40) return null;
    if (player.inventory.length === 0) return { empty: true };
    let pts = 0;
    const count = player.inventory.length;
    const mult = 1 + stats.resistance;
    for (const type of player.inventory) pts += Math.floor(POINTS[type] * mult);
    player.inventory = [];
    world.recycled += count;
    world.score += pts;
    return { count, pts };
  }

  function followBin(world, player) {
    world.bin.x += (player.x - 18 - world.bin.x) * 0.12;
    world.bin.y += (player.y + 8 - world.bin.y) * 0.12;
  }

  function objectives(world) {
    const clean = cleanliness(world);
    const ct = world.cleanTarget || 80;
    const bt = world.bagTarget || 5;
    const rt = world.recycleTarget || 12;
    return [
      { id: "clean", label: "Proprete", value: `${clean}%/${ct}%`, done: clean >= ct, raw: clean },
      { id: "bags", label: "Sacs", value: `${world.bagsCollected}/${bt}`, done: world.bagsCollected >= bt, raw: world.bagsCollected },
      { id: "recycle", label: "Recycle", value: `${world.recycled}/${rt}`, done: world.recycled >= rt, raw: world.recycled },
    ];
  }

  function stars(score, clean, world) {
    const ct = (world && world.cleanTarget) || 80;
    let s = 0;
    if (score >= 1200) s = 1;
    if (score >= 3500 && clean >= Math.min(ct, 70)) s = 2;
    if (score >= 7000 && clean >= ct) s = 3;
    return s;
  }

  return {
    create, living, cleanliness, tryPickup, trySweep, tryRecycle,
    followBin, tickSpawn, objectives, stars, POINTS,
  };
})();
