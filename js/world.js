/* Beach world 256×384 */
const World = (() => {
  const TYPES = ["can", "bottle", "bag", "can", "bottle", "bag"];
  const POINTS = { can: 40, bottle: 55, bag: 90 };

  function create(level) {
    const W = 256;
    const H = 384;
    const count = Math.min(28 + level * 5, 60);
    const bagTarget = Math.min(20, 5 + Math.floor(level / 2));
    const recycleTarget = Math.min(28, 12 + level);
    const trash = [];
    for (let i = 0; i < count; i++) trash.push(spawnOne(W, H, i, true));
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
      spawnTimer: 0,
      combo: 0,
      comboTimer: 0,
      bin: { x: 140, y: 250 },
    };
  }

  function spawnOne(W, H, seed, favorBags) {
    let type;
    if (favorBags && seed % 3 === 0) type = "bag";
    else type = TYPES[(seed + (Math.random() * TYPES.length) | 0) % TYPES.length];
    return {
      id: `${Date.now()}_${seed}_${Math.random()}`,
      type,
      x: 14 + Math.random() * (W - 36),
      y: 130 + Math.random() * (H - 160),
      alive: true,
    };
  }

  function tickSpawn(world, dt) {
    world.comboTimer = Math.max(0, world.comboTimer - dt);
    if (world.comboTimer <= 0) world.combo = 0;
    if (cleanliness(world) >= 85) return;
    world.spawnTimer += dt;
    if (world.spawnTimer < 4) return;
    world.spawnTimer = 0;
    if (living(world).length >= world.initial) return;
    world.trash.push(spawnOne(world.W, world.H, world.trash.length, false));
  }

  function living(world) {
    return world.trash.filter((t) => t.alive);
  }

  function cleanliness(world) {
    if (world.initial === 0) return 100;
    return Math.round(((world.initial - living(world).length) / world.initial) * 100);
  }

  function tryPickup(world, player, stats) {
    const range = stats.pinceRange;
    let best = null;
    let bestD = Infinity;
    for (const t of living(world)) {
      const d = Math.hypot(t.x + 3 - (player.x + 8), t.y + 3 - (player.y + 10));
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
      const d = Math.hypot(t.x - player.x - 8, t.y - player.y - 10);
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
    if (Math.hypot(player.x - world.bin.x, player.y - world.bin.y) > 26) return null;
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
    world.bin.x += (player.x - 12 - world.bin.x) * 0.1;
    world.bin.y += (player.y + 6 - world.bin.y) * 0.1;
  }

  function objectives(world) {
    const clean = cleanliness(world);
    const bt = world.bagTarget || 20;
    const rt = world.recycleTarget || 15;
    return [
      { id: "clean", label: "Plage propre", value: `${clean}%`, done: clean >= 80, raw: clean },
      { id: "bags", label: `Sacs ${bt}`, value: `${world.bagsCollected}/${bt}`, done: world.bagsCollected >= bt, raw: world.bagsCollected },
      { id: "recycle", label: `Recycle ${rt}`, value: `${world.recycled}/${rt}`, done: world.recycled >= rt, raw: world.recycled },
    ];
  }

  function stars(score, clean) {
    if (score >= 9000 && clean >= 90) return 3;
    if (score >= 4500 && clean >= 60) return 2;
    if (score >= 1800) return 1;
    return 0;
  }

  return {
    create, living, cleanliness, tryPickup, trySweep, tryRecycle,
    followBin, tickSpawn, objectives, stars, POINTS,
  };
})();
