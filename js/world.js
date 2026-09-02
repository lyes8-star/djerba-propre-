/* Beach world — mission-driven */
const World = (() => {
  const TYPES = ["can", "bottle", "bag", "butt", "cup", "paper", "peel", "can", "bottle", "bag"];
  const POINTS = {
    can: 40, bottle: 55, bag: 90, butt: 22, cup: 35, paper: 30, peel: 45,
    brik: 420, lablabi: 400, couscous: 520, ojja: 380, makroud: 340,
    mlawi: 320, the: 300, fricasse: 360, bambalouni: 330, harissa: 280,
    kaftaji: 370, mechouia: 350,
    chorba: 390, tajine: 410, kasra: 300, zlebia: 340, merguez: 360, baklawa: 380,
  };
  const RARES = [
    { type: "brik", name: "BRIK A L'OEUF" },
    { type: "lablabi", name: "LABLABI" },
    { type: "couscous", name: "COUSCOUS TUNISIEN" },
    { type: "ojja", name: "OJJA MERGUEZ" },
    { type: "makroud", name: "MAKROUD" },
    { type: "mlawi", name: "MLAWI" },
    { type: "the", name: "THE A LA MENTHE" },
    { type: "fricasse", name: "FRICASSE" },
    { type: "bambalouni", name: "BAMBALOUNI" },
    { type: "harissa", name: "POT DE HARISSA" },
    { type: "kaftaji", name: "KAFTAJI" },
    { type: "mechouia", name: "SALADE MECHOUIA" },
    { type: "chorba", name: "CHORBA" },
    { type: "tajine", name: "TAJINE TUNISIEN" },
    { type: "kasra", name: "KASRA" },
    { type: "zlebia", name: "ZLEBIA" },
    { type: "merguez", name: "MERGUEZ" },
    { type: "baklawa", name: "BAKLAWA" },
  ];

  function create(mission) {
    const m = mission || {};
    const W = Island.W;
    const H = Island.H;
    const count = Math.round((m.trash || 70) * 1.4);
    const bagTarget = m.bagTarget || 5;
    const recycleTarget = m.recycleTarget || 12;
    const cleanTarget = m.cleanTarget || 80;
    const bagRatio = m.bagRatio != null ? m.bagRatio : 0.3;
    const trash = spawnClustered(W, H, count, bagRatio);
    const rares = spawnRares(W, H);
    const stains = makeStains(W, H, 90 + count);
    const bins = makeBins();
    return {
      W,
      H,
      trash,
      rares,
      initial: trash.length,
      recycled: 0,
      bagsCollected: 0,
      foundRares: 0,
      rareTarget: rares.length,
      score: 0,
      bagTarget,
      recycleTarget,
      cleanTarget,
      spawnEnabled: m.spawn !== false,
      spawnTimer: 0,
      stains,
      combo: 0,
      comboTimer: 0,
      theme: m.theme || "beach",
      missionId: m.id || 1,
      missionName: m.name || "Plage",
      bins,
      bin: bins[0],
      npcs: [],
      inside: null,
      doorCd: 0,
    };
  }

  function makeBins() {
    const spots = [
      { town: "sidi", dx: 56, dy: 28 },
      { town: "plaza", dx: 48, dy: 20 },
      { town: "midoun", dx: 56, dy: 44 },
      { town: "ajim", dx: 40, dy: 28 },
      { town: "elmay", dx: 48, dy: 36 },
      { town: "aghir", dx: 48, dy: 28 },
    ];
    return spots.map((s) => {
      const p = Island.xy(s.town);
      const c = Island.clamp(p.x + s.dx, p.y + s.dy);
      return { x: c.x, y: c.y, town: s.town };
    });
  }

  function nearestBin(world, player, maxD) {
    const px = player.x + 16;
    const py = player.y + 20;
    const lim = maxD != null ? maxD : Infinity;
    let best = null;
    let bestD = lim;
    let fallback = null;
    let fallbackD = lim;
    for (const b of world.bins || []) {
      const d = Math.hypot(b.x + 6 - px, b.y + 8 - py);
      if (d < fallbackD) {
        fallback = b;
        fallbackD = d;
      }
      if (d <= lim && inFront(player, b.x + 10, b.y + 18, lim + 10, 1.35) && d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best || fallback;
  }

  function clampPos(W, H, x, y) {
    const c = Island.clamp(x, y);
    return {
      x: Math.max(18, Math.min(W - 28, c.x)),
      y: Math.max(18, Math.min(H - 28, c.y)),
    };
  }

  function spawnOne(W, H, seed, bagRatio, x, y) {
    let type;
    const r = Math.random();
    if (r < bagRatio) type = "bag";
    else type = TYPES[(seed + (Math.random() * TYPES.length) | 0) % TYPES.length];
    const p = x != null ? clampPos(W, H, x, y) : (() => {
      const r = Island.randLand();
      return clampPos(W, H, r.x, r.y);
    })();
    return {
      id: `${Date.now()}_${seed}_${Math.random()}`,
      type,
      x: p.x,
      y: p.y,
      alive: true,
    };
  }

  function spawnClustered(W, H, count, bagRatio) {
    const nCl = Math.max(8, Math.round(count / 5));
    const centers = [];
    for (let i = 0; i < nCl; i++) {
      const r = Island.randLand();
      centers.push({ x: r.x, y: r.y });
    }
    const trash = [];
    for (let i = 0; i < count; i++) {
      const c = centers[i % nCl];
      const ang = Math.random() * Math.PI * 2;
      const rad = 4 + Math.random() * 34;
      trash.push(spawnOne(W, H, i, bagRatio, c.x + Math.cos(ang) * rad, c.y + Math.sin(ang) * rad * 0.65));
    }
    return trash;
  }

  function makeStains(W, H, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({
        x: 16 + Math.random() * (W - 40),
        y: 16 + Math.random() * (H - 40),
        w: 8 + ((i * 13) % 26),
        h: 4 + ((i * 7) % 14),
        kind: i % 5,
        seed: i * 97,
      });
    }
    return out;
  }

  function spawnRares(W, H) {
    const pool = RARES.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    const n = 9 + ((Math.random() * 3) | 0);
    const out = [];
    for (let i = 0; i < n && i < pool.length; i++) {
      const d = pool[i];
      const r = Island.randLand();
      out.push({
        id: `rare_${d.type}_${i}`,
        type: d.type,
        name: d.name,
        rare: true,
        x: r.x,
        y: r.y,
        alive: true,
      });
    }
    return out;
  }

  function tickSpawn(world, dt) {
    world.comboTimer = Math.max(0, world.comboTimer - dt);
    if (world.comboTimer <= 0) world.combo = 0;
    if (!world.spawnEnabled) return;
    if (cleanliness(world) >= 88) return;
    world.spawnTimer += dt;
    if (world.spawnTimer < 2.4) return;
    world.spawnTimer = 0;
    if (living(world).length >= world.initial + 10) return;
    const near = living(world)[0];
    if (near && Math.random() < 0.55) {
      world.trash.push(spawnOne(world.W, world.H, world.trash.length, 0.35, near.x + (Math.random() * 40 - 20), near.y + (Math.random() * 24 - 12)));
    } else {
      world.trash.push(spawnOne(world.W, world.H, world.trash.length, 0.35));
    }
    if (world.trash.length > world.initial + 24) {
      world.trash = world.trash.filter((t) => t.alive);
    }
  }

  function living(world) {
    return world.trash.filter((t) => t.alive);
  }

  function livingRares(world) {
    return (world.rares || []).filter((t) => t.alive);
  }

  function cleanliness(world) {
    if (world.initial === 0) return 100;
    const left = living(world).length;
    const cleaned = Math.max(0, world.initial - left);
    return Math.min(100, Math.round((cleaned / world.initial) * 100));
  }

  function inFront(player, tx, ty, range, fov) {
    const px = player.x + 16;
    const py = player.y + 20;
    const dx = tx - px;
    const dy = ty - py;
    const d = Math.hypot(dx, dy);
    if (d > (range != null ? range : 48)) return false;
    if (player.angle == null) return true;
    const a = Math.atan2(dy, dx);
    let diff = a - player.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) < (fov != null ? fov : 0.9);
  }

  function tryPickup(world, player, stats) {
    const range = stats.pinceRange;
    let best = null;
    let bestD = Infinity;
    for (const t of livingRares(world)) {
      const d = Math.hypot(t.x + 8 - (player.x + 16), t.y + 10 - (player.y + 20));
      if (d < range && d < bestD && inFront(player, t.x + 8, t.y + 10, range + 8)) {
        best = t;
        bestD = d;
      }
    }
    if (!best) {
      for (const t of living(world)) {
        const d = Math.hypot(t.x + 8 - (player.x + 16), t.y + 10 - (player.y + 20));
        if (d < range && d < bestD && inFront(player, t.x + 8, t.y + 10, range + 8)) {
          best = t;
          bestD = d;
        }
      }
    }
    if (!best) return null;
    if (best.rare) {
      best.alive = false;
      world.foundRares = (world.foundRares || 0) + 1;
      const pts = POINTS[best.type] || 300;
      world.score += pts;
      world.combo += 1;
      world.comboTimer = 2.2;
      if (typeof Progress !== "undefined") Progress.notePickup(1);
      return { item: best, points: pts, combo: world.combo, rare: true, name: best.name, coins: 35 };
    }
    if (player.inventory.length >= stats.capacity) return { full: true };
    best.alive = false;
    player.inventory.push(best.type);
    if (best.type === "bag") world.bagsCollected += 1;
    world.combo += 1;
    world.comboTimer = 2.2;
    const mult = 1 + Math.min(4, world.combo - 1) * 0.15;
    if (typeof Progress !== "undefined") Progress.notePickup(1);
    return { item: best, points: Math.floor((POINTS[best.type] || 40) * 0.4 * mult), combo: world.combo };
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
        pts += Math.floor((POINTS[t.type] || 40) * 0.22 * stats.balaiEff);
      }
    }
    if (n > 0) {
      world.combo += n;
      world.comboTimer = 2.2;
      if (typeof Progress !== "undefined") Progress.notePickup(n);
    }
    return { n, pts };
  }

  function tryRecycle(world, player, stats) {
    const bin = nearestBin(world, player, 40);
    if (!bin) return null;
    if (player.inventory.length === 0) return { empty: true, bin };
    let pts = 0;
    const count = player.inventory.length;
    const mult = 1 + stats.resistance;
    for (const type of player.inventory) pts += Math.floor((POINTS[type] || 40) * mult);
    player.inventory = [];
    world.recycled += count;
    world.score += pts;
    const coins = count * 2;
    if (typeof Progress !== "undefined") Progress.noteRecycle(count);
    return { count, pts, coins, bin };
  }

  function followBin() {}

  function objectives() {
    if (typeof Progress === "undefined") return [];
    return Progress.dailyList().map((o) => ({
      id: o.id,
      label: o.label,
      value: `${Math.min(o.cur, o.need)}/${o.need}`,
      done: o.cur >= o.need,
      raw: o.cur,
    }));
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
    create, living, livingRares, cleanliness, tryPickup, trySweep, tryRecycle,
    nearestBin, followBin, tickSpawn, objectives, stars, POINTS, RARES, inFront,
  };
})();
