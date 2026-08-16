/* Beach world: trash spawn, cleanliness, recycling */
const World = (() => {
  const TYPES = ["can", "bottle", "bag", "can", "bottle"];
  const POINTS = { can: 40, bottle: 50, bag: 80 };

  function create(level) {
    const W = 160;
    const H = 220;
    const count = Math.min(22 + level * 5, 50);
    const bagTarget = Math.min(20, 5 + Math.floor(level / 2));
    const recycleTarget = Math.min(25, 12 + level);
    const trash = [];
    for (let i = 0; i < count; i++) {
      trash.push(spawnOne(W, H, i, true));
    }
    const initial = trash.length;
    return {
      W,
      H,
      trash,
      initial,
      recycled: 0,
      bagsCollected: 0,
      score: 0,
      cleanBonusGiven: false,
      bagTarget,
      recycleTarget,
      spawnTimer: 0,
      bin: { x: 90, y: 150 },
    };
  }

  function spawnOne(W, H, seed, favorBags) {
    let type;
    if (favorBags && seed % 3 === 0) type = "bag";
    else type = TYPES[(seed + Math.floor(Math.random() * TYPES.length)) % TYPES.length];
    return {
      id: `${Date.now()}_${seed}_${Math.random()}`,
      type,
      x: 10 + Math.random() * (W - 24),
      y: 75 + Math.random() * (H - 100),
      alive: true,
    };
  }

  function tickSpawn(world, dt) {
    // keep beach dirty if player is fast — light respawn until initial cleanup goal
    if (cleanliness(world) >= 85) return;
    world.spawnTimer += dt;
    if (world.spawnTimer < 4.5) return;
    world.spawnTimer = 0;
    if (living(world).length >= world.initial) return;
    world.trash.push(spawnOne(world.W, world.H, world.trash.length, false));
  }

  function living(world) {
    return world.trash.filter((t) => t.alive);
  }

  function cleanliness(world) {
    if (world.initial === 0) return 100;
    const left = living(world).length;
    return Math.round(((world.initial - left) / world.initial) * 100);
  }

  function tryPickup(world, player, stats) {
    const range = stats.pinceRange;
    const list = living(world);
    let best = null;
    let bestD = Infinity;
    for (const t of list) {
      const cx = t.x + 2;
      const cy = t.y + 2;
      const dx = cx - (player.x + 6);
      const dy = cy - (player.y + 8);
      const d = Math.hypot(dx, dy);
      if (d < range && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    if (!best) return null;
    if (player.inventory.length >= stats.capacity) {
      return { full: true };
    }
    best.alive = false;
    player.inventory.push(best.type);
    if (best.type === "bag") world.bagsCollected += 1;
    return { item: best, points: Math.floor(POINTS[best.type] * 0.35) };
  }

  function trySweep(world, player, stats) {
    const r = stats.balaiRadius;
    let n = 0;
    let pts = 0;
    for (const t of living(world)) {
      const d = Math.hypot(t.x - player.x - 6, t.y - player.y - 8);
      if (d < r) {
        if (player.inventory.length >= stats.capacity) break;
        t.alive = false;
        player.inventory.push(t.type);
        if (t.type === "bag") world.bagsCollected += 1;
        n += 1;
        pts += Math.floor(POINTS[t.type] * 0.2 * stats.balaiEff);
      }
    }
    return { n, pts };
  }

  function tryRecycle(world, player, stats) {
    const dx = player.x - world.bin.x;
    const dy = player.y - world.bin.y;
    if (Math.hypot(dx, dy) > 18) return null;
    if (player.inventory.length === 0) return { empty: true };
    let pts = 0;
    let count = player.inventory.length;
    // resistance reduces accidental drop penalty (abstracted as bonus retention)
    const mult = 1 + stats.resistance;
    for (const type of player.inventory) {
      pts += Math.floor(POINTS[type] * mult);
    }
    player.inventory = [];
    world.recycled += count;
    world.score += pts;
    return { count, pts };
  }

  function followBin(world, player) {
    // bin trails behind player
    const tx = player.x - 8;
    const ty = player.y + 4;
    world.bin.x += (tx - world.bin.x) * 0.08;
    world.bin.y += (ty - world.bin.y) * 0.08;
  }

  function objectives(world) {
    const clean = cleanliness(world);
    const bt = world.bagTarget || 20;
    const rt = world.recycleTarget || 15;
    return [
      { id: "clean", label: `Plage propre`, value: `${clean}%`, done: clean >= 80, raw: clean },
      {
        id: "bags",
        label: `Collecter ${bt} sacs`,
        value: `${world.bagsCollected}/${bt}`,
        done: world.bagsCollected >= bt,
        raw: world.bagsCollected,
      },
      {
        id: "recycle",
        label: `Recycler ${rt} objets`,
        value: `${world.recycled}/${rt}`,
        done: world.recycled >= rt,
        raw: world.recycled,
      },
    ];
  }

  function stars(score, clean) {
    if (score >= 8000 && clean >= 90) return 3;
    if (score >= 4000 && clean >= 60) return 2;
    if (score >= 1500) return 1;
    return 0;
  }

  return {
    create,
    living,
    cleanliness,
    tryPickup,
    trySweep,
    tryRecycle,
    followBin,
    tickSpawn,
    objectives,
    stars,
    POINTS,
  };
})();
