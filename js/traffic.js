/* Circulation NES + gares de taxi : embarquement stable, hors de la voie */
const Traffic = (() => {
  const CW = 48;
  const CH = 24;
  const DRIVERS = ["Lotfi", "Sami", "Hedi", "Nabil", "Walid", "Anis"];
  const BOARD_RANGE = 52;
  const HALT_RANGE = 40;
  const HAIL_RANGE = 54;

  const STANDS = [
    { id: "sidi", label: "SIDI MAHREZ", ox: 8, oy: 120, side: "s" },
    { id: "houmt", label: "HOUMT SOUK", ox: 48, oy: 500, side: "s" },
    { id: "midoun", label: "MIDOUN", ox: 20, oy: 540, side: "s" },
    { id: "ajim", label: "AJIM", ox: 16, oy: 380, side: "s" },
    { id: "guellala", label: "GUELLALA", ox: 80, oy: 360, side: "s" },
    { id: "elmay", label: "EL MAY", ox: 40, oy: 360, side: "s" },
    { id: "aghir", label: "AGHIR", ox: -80, oy: 280, side: "s" },
    { id: "airport", label: "AEROPORT", ox: 108, oy: 90, side: "s" },
    { id: "erriadh", label: "ERRIADH", ox: 40, oy: 200, side: "s" },
  ];

  function densify(pts, step, closed) {
    const out = [];
    const n = pts.length;
    if (n < 2) return pts.slice();
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const segs = Math.max(1, (len / step) | 0);
      for (let s = 0; s < segs; s++) {
        const t = s / segs;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out.map((p) => Island.snapRoad(p.x, p.y));
  }

  function nearestIdx(pts, x, y) {
    let best = 0;
    let bestD = 1e9;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - x, pts[i].y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function paginate(text) {
    if (typeof NpcTalk !== "undefined" && NpcTalk.paginate) return NpcTalk.paginate(text, 96);
    const raw = String(text || "").trim();
    return raw ? [raw] : [""];
  }

  function syncSprite(car) {
    car.x = car.px - CW / 2;
    car.y = car.py - CH / 2;
  }

  function loopPath() {
    return densify(Island.loopPts(), 36, true);
  }

  function besideRoad(x, y, side) {
    const r = Island.snapRoad(x, y);
    const ox = side === "e" ? 34 : side === "w" ? -34 : side === "s" ? 6 : 0;
    const oy = side === "n" ? -30 : side === "s" ? 32 : 10;
    return { x: r.x + ox, y: r.y + oy };
  }

  function makeCar(opts) {
    const car = {
      kind: opts.kind || "blue",
      sprite: opts.sprite || "carBlue",
      taxi: !!opts.taxi,
      parked: !!opts.parked,
      loop: opts.loop !== false,
      path: opts.path || [],
      pi: opts.pi || 0,
      dir: opts.dir || 1,
      px: opts.px || 0,
      py: opts.py || 0,
      x: 0,
      y: 0,
      facing: opts.facing || 1,
      speed: opts.speed || (70 + Math.random() * 36),
      horn: 2 + Math.random() * 8,
      driver: opts.driver || pick(DRIVERS),
      pages: null,
      page: 0,
      bubble: 0,
      bubbleText: "",
      whoLabel: "",
      halt: 0,
      boardLock: 0,
      standId: opts.standId || null,
      homeX: opts.homeX || 0,
      homeY: opts.homeY || 0,
      goingHome: false,
      lastStand: opts.standId || null,
    };
    syncSprite(car);
    return car;
  }

  function makeStands() {
    return STANDS.map((s) => {
      const a = Island.xy(s.id);
      const p = besideRoad(a.x + s.ox, a.y + s.oy, s.side);
      return { id: s.id, label: s.label, x: p.x, y: p.y };
    });
  }

  function spawn(world) {
    Island.bake();
    const loop = loopPath();
    world.loopPath = loop;
    world.taxiStands = makeStands();
    const spurs = Island.roads().map(([x1, y1, x2, y2]) =>
      densify([{ x: x1, y: y1 }, { x: x2, y: y2 }], 36, false)
    ).filter((p) => p.length > 4);
    const cars = [];
    const palette = [
      ["taxi", "carTaxi", true],
      ["blue", "carBlue", false],
      ["red", "carRed", false],
      ["louage", "carLouage", false],
      ["white", "carWhite", false],
      ["blue", "carBlue", false],
      ["red", "carRed", false],
      ["louage", "carLouage", false],
      ["blue", "carBlue", false],
      ["red", "carRed", false],
    ];
    palette.forEach((row, i) => {
      const [kind, sprite, taxi] = row;
      const path = loop.length > 4 ? loop : (spurs[0] || []);
      if (path.length < 4) return;
      const pi = ((i * 13 + 5) % path.length);
      const pt = path[pi];
      cars.push(makeCar({
        kind, sprite, taxi,
        parked: false,
        loop: true,
        path,
        pi,
        dir: i % 2 ? 1 : -1,
        px: pt.x,
        py: pt.y,
        speed: taxi ? 92 + Math.random() * 16 : 68 + Math.random() * 40,
        driver: DRIVERS[i % DRIVERS.length],
      }));
    });

    spurs.forEach((path, si) => {
      const row = palette[(si + 1) % palette.length];
      const pi = (si * 7) % path.length;
      const pt = path[pi];
      cars.push(makeCar({
        kind: row[0],
        sprite: row[1],
        taxi: false,
        parked: false,
        loop: false,
        path,
        pi,
        dir: 1,
        px: pt.x,
        py: pt.y,
        speed: 74 + (si % 5) * 8,
        driver: DRIVERS[si % DRIVERS.length],
      }));
    });

    const sidi = Island.xy("sidi");
    const sidiRoads = Island.roads().filter((r) =>
      Math.hypot(r[0] - sidi.x, r[1] - sidi.y) < 40 || Math.hypot(r[2] - sidi.x, r[3] - sidi.y) < 40
    );
    sidiRoads.forEach((seg, i) => {
      const path = densify([{ x: seg[0], y: seg[1] }, { x: seg[2], y: seg[3] }], 32, false);
      if (path.length < 4) return;
      const kinds = [["red", "carRed", false], ["blue", "carBlue", false]];
      const k = kinds[i % kinds.length];
      const pi = Math.min(path.length - 1, 2 + i * 2);
      cars.push(makeCar({
        kind: k[0], sprite: k[1], taxi: false,
        parked: false,
        loop: false,
        path,
        pi,
        dir: 1,
        px: path[pi].x,
        py: path[pi].y,
        speed: 80,
        driver: DRIVERS[i % DRIVERS.length],
      }));
    });

    world.taxiStands.forEach((stand, si) => {
      for (let slot = 0; slot < 2; slot++) {
        const hx = stand.x + (slot ? 18 : -16);
        const hy = stand.y + (slot ? 8 : 6);
        cars.push(makeCar({
          kind: "taxi",
          sprite: "carTaxi",
          taxi: true,
          parked: true,
          loop: true,
          path: loop,
          pi: nearestIdx(loop, hx, hy),
          px: hx,
          py: hy,
          facing: slot ? -1 : 1,
          speed: 96,
          driver: DRIVERS[(si + slot + 2) % DRIVERS.length],
          standId: stand.id,
          homeX: hx,
          homeY: hy,
        }));
      }
    });

    const parked = [
      ["sidi", -48, 70, "red"],
      ["sidi", 96, 58, "blue"],
      ["sidi", 132, 78, "louage"],
      ["houmt", -80, 160, "white"],
      ["houmt", 80, 160, "blue"],
      ["midoun", 60, -20, "red"],
      ["ajim", -20, 48, "louage"],
      ["elmay", 40, -10, "white"],
      ["erriadh", -30, 40, "blue"],
      ["airport", 80, 20, "white"],
      ["aghir", -40, 20, "red"],
      ["guellala", -40, 20, "white"],
    ];
    parked.forEach(([name, ox, oy, kind], i) => {
      const p = Island.xy(name);
      const off = besideRoad(p.x + ox, p.y + oy, "s");
      const sprite = {
        white: "carWhite", blue: "carBlue", red: "carRed", louage: "carLouage", taxi: "carTaxi",
      }[kind] || "carBlue";
      cars.push(makeCar({
        kind,
        sprite,
        taxi: false,
        parked: true,
        loop: false,
        path: [],
        px: off.x,
        py: off.y,
        facing: i % 2 ? 1 : -1,
        speed: 0,
      }));
    });

    world.cars = cars;
    world.ride = null;
  }

  function distPlayer(car, player) {
    return Math.hypot(car.px - (player.x + 16), car.py - (player.y + 20));
  }

  function canBoard(car) {
    if (!car || !car.taxi) return false;
    if (car.parked) return true;
    if (car.halt > 0) return true;
    return false;
  }

  function moveToward(car, tx, ty, spd, dt) {
    const dx = tx - car.px;
    const dy = ty - car.py;
    const mag = Math.hypot(dx, dy) || 1;
    if (mag < 8) return mag;
    car.px += (dx / mag) * spd * dt;
    car.py += (dy / mag) * spd * dt;
    if (dx > 3) car.facing = 1;
    if (dx < -3) car.facing = -1;
    return mag;
  }

  function stepCar(car, dt, world) {
    if (car.boardLock > 0) car.boardLock -= dt;
    if (car.halt > 0) {
      car.halt -= dt;
      syncSprite(car);
      return;
    }
    if (car.parked) return;

    if (car.goingHome && car.standId) {
      const hd = Math.hypot((car.homeX || 0) - car.px, (car.homeY || 0) - car.py);
      if (hd < 56) {
        moveToward(car, car.homeX, car.homeY, Math.max(60, car.speed * 0.7), dt);
        if (Math.hypot((car.homeX || 0) - car.px, (car.homeY || 0) - car.py) < 8) {
          car.px = car.homeX;
          car.py = car.homeY;
          car.parked = true;
          car.goingHome = false;
          car.halt = 0;
        }
        syncSprite(car);
        return;
      }
    }

    const pts = car.path;
    if (!pts || pts.length < 2) return;
    const tgt = pts[car.pi];
    if (!tgt) {
      car.pi = 0;
      return;
    }
    const mag = moveToward(car, tgt.x, tgt.y, car.speed * (world.ride === car ? 1.18 : 1), dt);
    if (mag < 8) {
      if (car.loop) {
        car.pi = (car.pi + car.dir + pts.length) % pts.length;
      } else {
        let ni = car.pi + car.dir;
        if (ni < 0 || ni >= pts.length) {
          car.dir = -car.dir;
          ni = car.pi + car.dir;
        }
        car.pi = Math.max(0, Math.min(pts.length - 1, ni));
      }
    }
    syncSprite(car);
  }

  function nearestStand(world, x, y, range) {
    let best = null;
    let bestD = range;
    for (const stand of world.taxiStands || []) {
      const d = Math.hypot(stand.x - x, stand.y - y);
      if (d < bestD) {
        best = stand;
        bestD = d;
      }
    }
    return best;
  }

  function checkGareStop(car, world) {
    if (world.ride !== car) return;
    const stand = nearestStand(world, car.px, car.py, 50);
    if (!stand) return;
    if (car.lastStand === stand.id) return;
    car.lastStand = stand.id;
    car.halt = 2.6;
    world.taxiToast = { html: `GARE ${stand.label}<br/>E pour descendre` };
  }

  function seatPlayer(car, player) {
    player.x = car.px - 16;
    player.y = car.py - 28;
    player.facing = car.facing;
    player.vx = 0;
    player.vy = 0;
    player.ride = true;
    player.swim = false;
  }

  function lineFor(car) {
    const pack = (typeof NpcTalk !== "undefined" && NpcTalk.LINES && NpcTalk.LINES.taxi) || [];
    if (pack.length) return pick(pack);
    return "Monte. Tour de l'ile. E pour descendre.";
  }

  function startSpeech(car, text) {
    car.whoLabel = `${car.driver} (taxi)`;
    car.pages = paginate(text);
    car.page = 0;
    car.bubbleText = car.pages[0];
    car.bubble = 24;
    return car.pages.length > 1;
  }

  function hail(car, player, world) {
    if (!car.taxi || car.parked || car.goingHome || world.ride) return;
    if (car.halt > 0) return;
    const d = distPlayer(car, player);
    const spd = Math.hypot(player.vx || 0, player.vy || 0);
    if (d < HAIL_RANGE && spd < 42) car.halt = 2.2;
  }

  function update(world, dt, player) {
    if (world.inside) return;
    const cars = world.cars || [];
    for (const car of cars) {
      if (car.bubble > 0) car.bubble -= dt;
      if (player && !world.ride) hail(car, player, world);
      stepCar(car, dt, world);
      if (world.ride === car) checkGareStop(car, world);
      if (!car.parked && !car.taxi && player && !world.ride && car.halt <= 0) {
        car.horn -= dt;
        const d = distPlayer(car, player);
        if (car.horn <= 0 && d < 32) {
          car.horn = 6 + Math.random() * 10;
          if (typeof AudioSys !== "undefined") AudioSys.sfx("horn");
        }
      }
    }
    if (world.ride && player) seatPlayer(world.ride, player);
  }

  function nearestTaxi(world, player, range) {
    if (!player || world.inside) return null;
    const lim = range == null ? BOARD_RANGE : range;
    let best = null;
    let bestD = lim;
    for (const car of world.cars || []) {
      if (!canBoard(car)) continue;
      const d = distPlayer(car, player);
      const max = car.parked ? lim : Math.min(lim, HALT_RANGE);
      if (d < max && d < bestD) {
        best = car;
        bestD = d;
      }
    }
    return best;
  }

  function board(world, player, car) {
    if (!car || !player || !canBoard(car)) return null;
    const loop = world.loopPath && world.loopPath.length > 4 ? world.loopPath : loopPath();
    if (car.parked || !car.path || car.path.length < 4) {
      car.path = loop;
      car.loop = true;
      car.pi = nearestIdx(loop, car.px, car.py);
      car.dir = 1;
      car.speed = car.speed || 96;
    }
    car.parked = false;
    car.goingHome = false;
    car.halt = 0;
    car.boardLock = 0.85;
    car.lastStand = car.standId || (nearestStand(world, car.px, car.py, 60) || {}).id || null;
    world.ride = car;
    seatPlayer(car, player);
    const more = startSpeech(car, lineFor(car));
    if (typeof AudioSys !== "undefined") AudioSys.sfx("horn");
    return {
      type: "talk",
      who: car.whoLabel,
      text: car.bubbleText,
      coins: 0,
      more,
    };
  }

  function talkNext(car) {
    if (!car || !car.pages || car.page >= car.pages.length - 1) return null;
    car.page += 1;
    car.bubbleText = car.pages[car.page];
    car.bubble = 24;
    return {
      type: "talk",
      who: car.whoLabel,
      text: car.bubbleText,
      coins: 0,
      more: car.page < car.pages.length - 1,
    };
  }

  function hopOff(world, player) {
    const car = world.ride;
    if (!car || !player) return { type: "taxi-off" };
    if (car.boardLock > 0) return null;
    player.x = car.x + (car.facing > 0 ? -12 : 30);
    player.y = car.y + 8;
    player.ride = false;
    player.cooldown = 0.55;
    car.bubble = 0;
    car.pages = null;
    car.halt = 0.4;
    if (car.standId) {
      car.goingHome = true;
      car.parked = false;
      if (!car.path || car.path.length < 4) {
        car.path = world.loopPath && world.loopPath.length > 4 ? world.loopPath : loopPath();
        car.loop = true;
        car.pi = nearestIdx(car.path, car.px, car.py);
      }
    }
    world.ride = null;
    const c = Island.clampPlay(player.x + 16, player.y + 28);
    player.x = c.x - 16;
    player.y = c.y - 28;
    player.swim = !!c.swim;
    return { type: "taxi-off" };
  }

  return { spawn, update, nearestTaxi, board, talkNext, hopOff, canBoard, BOARD_RANGE };
})();
