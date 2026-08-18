/* Circulation NES + taxis : tour de l'île sur la boucle côtière */
const Traffic = (() => {
  const CW = 40;
  const CH = 20;
  const DRIVERS = ["Lotfi", "Sami", "Hedi", "Nabil", "Walid", "Anis"];

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
    return out;
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
    const raw = String(text || "").trim();
    if (!raw) return [""];
    const parts = raw.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
    const pages = [];
    for (const p of parts) {
      if (pages.length && (p.length < 18 || pages[pages.length - 1].length < 32)) {
        pages[pages.length - 1] += " " + p;
      } else pages.push(p);
    }
    return pages.length ? pages : [raw];
  }

  function syncSprite(car) {
    car.x = car.px - CW / 2;
    car.y = car.py - CH / 2;
  }

  function makeCar(opts) {
    const car = {
      kind: opts.kind || "white",
      sprite: opts.sprite || "carWhite",
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
    };
    syncSprite(car);
    return car;
  }

  function spawn(world) {
    Island.bake();
    const loop = densify(Island.loopPts(), 42, true);
    const spurs = Island.roads().map(([x1, y1, x2, y2]) =>
      densify([{ x: x1, y: y1 }, { x: x2, y: y2 }], 48, false)
    ).filter((p) => p.length > 4);
    const cars = [];
    const kinds = [
      ["white", "carWhite", false],
      ["blue", "carBlue", false],
      ["red", "carRed", false],
      ["louage", "carLouage", false],
      ["white", "carWhite", false],
      ["blue", "carBlue", false],
      ["taxi", "carTaxi", true],
      ["taxi", "carTaxi", true],
      ["taxi", "carTaxi", true],
    ];
    kinds.forEach((row, i) => {
      const [kind, sprite, taxi] = row;
      const useLoop = i < 7 || !spurs.length;
      const path = useLoop ? loop : spurs[i % spurs.length];
      const pi = ((i * 11 + 3) * (path.length / kinds.length)) | 0;
      const pt = path[pi % path.length];
      cars.push(makeCar({
        kind, sprite, taxi,
        parked: false,
        loop: useLoop,
        path,
        pi: pi % path.length,
        dir: i % 2 ? 1 : -1,
        px: pt.x,
        py: pt.y,
        speed: taxi ? 88 + Math.random() * 18 : 64 + Math.random() * 42,
        driver: DRIVERS[i % DRIVERS.length],
      }));
    });

    const ranks = [
      ["sidi", -30, 40],
      ["houmt", 90, 30],
      ["midoun", -40, 36],
      ["ajim", 50, 24],
      ["guellala", 30, 20],
    ];
    ranks.forEach(([name, ox, oy], i) => {
      const p = Island.xy(name);
      cars.push(makeCar({
        kind: "taxi",
        sprite: "carTaxi",
        taxi: true,
        parked: true,
        loop: true,
        path: loop,
        pi: nearestIdx(loop, p.x + ox, p.y + oy),
        px: p.x + ox,
        py: p.y + oy,
        facing: i % 2 ? 1 : -1,
        speed: 96,
        driver: DRIVERS[(i + 2) % DRIVERS.length],
      }));
    });

    const parked = [
      ["houmt", -80, 50, "white"],
      ["houmt", 140, 70, "blue"],
      ["midoun", 60, 40, "red"],
      ["ajim", -20, 36, "louage"],
      ["elmay", 40, 24, "white"],
      ["erriadh", -30, 40, "blue"],
      ["airport", 80, 20, "white"],
      ["aghir", -20, 30, "red"],
      ["sidi", 70, 50, "louage"],
      ["guellala", -50, 30, "white"],
    ];
    parked.forEach(([name, ox, oy, kind], i) => {
      const p = Island.xy(name);
      const sprite = {
        white: "carWhite", blue: "carBlue", red: "carRed", louage: "carLouage", taxi: "carTaxi",
      }[kind] || "carWhite";
      cars.push(makeCar({
        kind,
        sprite,
        taxi: false,
        parked: true,
        loop: false,
        path: [],
        px: p.x + ox,
        py: p.y + oy,
        facing: i % 2 ? 1 : -1,
        speed: 0,
      }));
    });

    world.cars = cars;
    world.ride = null;
  }

  function stepCar(car, dt, world) {
    if (car.parked) return;
    const pts = car.path;
    if (!pts || pts.length < 2) return;
    const tgt = pts[car.pi];
    if (!tgt) {
      car.pi = 0;
      return;
    }
    const dx = tgt.x - car.px;
    const dy = tgt.y - car.py;
    const mag = Math.hypot(dx, dy) || 1;
    const spd = car.speed * (world.ride === car ? 1.18 : 1);
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
    } else {
      car.px += (dx / mag) * spd * dt;
      car.py += (dy / mag) * spd * dt;
      if (dx > 3) car.facing = 1;
      if (dx < -3) car.facing = -1;
    }
    syncSprite(car);
  }

  function seatPlayer(car, player) {
    player.x = car.px - 16;
    player.y = car.py - 28;
    player.facing = car.facing;
    player.vx = 0;
    player.vy = 0;
    player.ride = true;
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
    car.bubble = 8;
    return car.pages.length > 1;
  }

  function update(world, dt, player) {
    if (world.inside) return;
    const cars = world.cars || [];
    for (const car of cars) {
      if (car.bubble > 0) car.bubble -= dt;
      stepCar(car, dt, world);
      if (!car.parked && player && !world.ride) {
        car.horn -= dt;
        const d = Math.hypot(car.px - (player.x + 16), car.py - (player.y + 20));
        if (car.horn <= 0 && d < 70) {
          car.horn = 6 + Math.random() * 10;
          if (typeof AudioSys !== "undefined") AudioSys.sfx("horn");
        }
      }
    }
    if (world.ride && player) seatPlayer(world.ride, player);
  }

  function nearestTaxi(world, player, range) {
    if (!player || world.inside) return null;
    let best = null;
    let bestD = range;
    for (const car of world.cars || []) {
      if (!car.taxi) continue;
      const d = Math.hypot(car.px - (player.x + 16), car.py - (player.y + 20));
      if (d < bestD) {
        best = car;
        bestD = d;
      }
    }
    return best;
  }

  function board(world, player, car) {
    if (!car || !player) return null;
    const loop = densify(Island.loopPts(), 42, true);
    if (car.parked || !car.path || car.path.length < 4) {
      car.path = loop;
      car.loop = true;
      car.parked = false;
      car.pi = nearestIdx(loop, car.px, car.py);
      car.dir = 1;
      car.speed = car.speed || 96;
    }
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
    car.bubble = 7;
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
    player.x = car.x + (car.facing > 0 ? -10 : 28);
    player.y = car.y + 4;
    player.ride = false;
    player.cooldown = 0.45;
    car.bubble = 0;
    car.pages = null;
    world.ride = null;
    const c = Island.clamp(player.x + 16, player.y + 28);
    player.x = c.x - 16;
    player.y = c.y - 28;
    return { type: "taxi-off" };
  }

  return { spawn, update, nearestTaxi, board, talkNext, hopOff };
})();
