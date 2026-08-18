/* Île NES : biomes en tiles 16px, routes, villes, plages, masque marchable */
const Island = (() => {
  const W = 3840;
  const H = 2880;
  const TS = 16;
  const TW = W / TS;
  const TH = H / TS;
  const MW = 960;
  const MH = 720;
  const SX = W / MW;
  const SY = H / MH;
  const BOX = { x: 240, y: 180, w: 3360, h: 2520 };

  const WATER = 0;
  const SAND = 1;
  const GRASS = 2;
  const BEACH = 3;
  const COBBLE = 4;
  const PLAZA = 5;
  const ROAD = 6;
  const DIRT = 7;
  const STONE = 8;
  const SHORE = 9;

  const UV = [
    [0.18, 0.22], [0.28, 0.13], [0.40, 0.08], [0.52, 0.06], [0.64, 0.08],
    [0.76, 0.10], [0.88, 0.13], [0.95, 0.20], [0.97, 0.30],
    [0.95, 0.40], [0.92, 0.50], [0.93, 0.62], [0.96, 0.74],
    [0.90, 0.84], [0.78, 0.91], [0.62, 0.94], [0.46, 0.93],
    [0.32, 0.88], [0.20, 0.80], [0.10, 0.70], [0.03, 0.60],
    [0.04, 0.50], [0.10, 0.38], [0.14, 0.28],
  ];

  const ANCHORS = {
    houmt: [0.48, 0.18],
    portHoumt: [0.48, 0.10],
    sidi: [0.86, 0.16],
    hotel: [0.88, 0.22],
    midoun: [0.86, 0.40],
    erriadh: [0.70, 0.52],
    elmay: [0.50, 0.50],
    explore: [0.68, 0.60],
    guellala: [0.48, 0.84],
    aghir: [0.88, 0.78],
    mezraya: [0.78, 0.68],
    mahboubine: [0.76, 0.76],
    sedouikech: [0.66, 0.74],
    ajim: [0.10, 0.58],
    airport: [0.22, 0.28],
    lagoon: [0.28, 0.68],
    plaza: [0.48, 0.21],
  };

  const ZONE_MUSIC = {
    houmt: "ville", portHoumt: "port", sidi: "beach", hotel: "hotel",
    midoun: "midounv", erriadh: "erriadh", elmay: "elmay", explore: "explore",
    guellala: "guellala", aghir: "aghir", mezraya: "aghir", mahboubine: "aghir",
    sedouikech: "aghir", ajim: "port", airport: "airport", lagoon: "lagoon",
    plaza: "ville",
  };

  const ZONE_LABEL = {
    ville: "HOUMT SOUK", souk: "SOUK", beach: "SIDI MAHREZ", port: "AJIM",
    hotel: "HOTELS", midounv: "MIDOUN", erriadh: "ERRIADH", elmay: "EL MAY",
    explore: "EXPLORE", guellala: "GUELLALA", aghir: "AGHIR", airport: "AEROPORT",
    lagoon: "LAGUNE", plaza: "PLACE", sea: "MER",
  };

  const MAP_LABELS = [
    ["houmt", "HOUMT SOUK"],
    ["midoun", "MIDOUN"],
    ["ajim", "AJIM"],
    ["guellala", "GUELLALA"],
    ["aghir", "AGHIR"],
    ["sidi", "SIDI MAHREZ"],
    ["erriadh", "GHRIBA"],
    ["elmay", "EL MAY"],
  ];

  const MAP_ICONS = [
    ["houmt", "ville"],
    ["portHoumt", "fort"],
    ["midoun", "market"],
    ["erriadh", "holy"],
    ["aghir", "beach"],
    ["sidi", "beach"],
    ["guellala", "pottery"],
    ["ajim", "port"],
  ];

  const poly = UV.map(([u, v]) => ({ x: BOX.x + u * BOX.w, y: BOX.y + v * BOX.h }));
  let cx = 0;
  let cy = 0;
  poly.forEach((p) => { cx += p.x; cy += p.y; });
  cx /= poly.length;
  cy /= poly.length;

  let mask = null;
  let grid = null;
  let roadDir = null;
  let mini = null;
  let baked = false;
  let deco = [];

  function colors() {
    return (typeof Atlas !== "undefined" && Atlas.C) ? Atlas.C : {
      sandB: "#f0cc84", sandC: "#d4a85c", sandA: "#ffe8b0", sandD: "#b88840",
      green: "#3cbc3c", greenD: "#248024", greenH: "#58d848",
      cobbleA: "#c4a878", cobbleB: "#a88858",
      road: "#3a3c48", roadY: "#fcbc14", roadD: "#24262e", wall: "#ece4d4",
      sandE: "#8c6428", white: "#fcfcfc", stone: "#808890",
    };
  }

  function polyHit(x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x;
      const yi = poly[i].y;
      const xj = poly[j].x;
      const yj = poly[j].y;
      const hit = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-6) + xi);
      if (hit) inside = !inside;
    }
    return inside;
  }

  function contains(x, y) {
    if (!baked) bake();
    if (mask) {
      const px = Math.max(0, Math.min(MW - 1, (x / SX) | 0));
      const py = Math.max(0, Math.min(MH - 1, (y / SY) | 0));
      return mask[py * MW + px] === 1;
    }
    return polyHit(x, y);
  }

  function xy(name) {
    const a = ANCHORS[name] || ANCHORS.houmt;
    return { x: (BOX.x + a[0] * BOX.w) | 0, y: (BOX.y + a[1] * BOX.h) | 0 };
  }

  function uv(x, y) {
    return { u: (x - BOX.x) / BOX.w, v: (y - BOX.y) / BOX.h };
  }

  function worldToMap(x, y, mw, mh) {
    return { x: (x / W) * mw, y: (y / H) * mh };
  }

  function clamp(x, y) {
    if (contains(x, y)) return { x, y };
    let nx = x;
    let ny = y;
    for (let i = 0; i < 48; i++) {
      nx += (cx - nx) * 0.18;
      ny += (cy - ny) * 0.18;
      if (contains(nx, ny)) return { x: nx, y: ny };
    }
    return { x: cx, y: cy };
  }

  const SWIM = 340;

  function clampPlay(x, y) {
    if (contains(x, y)) return { x, y, swim: false };
    const land = clamp(x, y);
    const dx = x - land.x;
    const dy = y - land.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d <= SWIM) return { x, y, swim: true };
    return { x: land.x + (dx / d) * SWIM, y: land.y + (dy / d) * SWIM, swim: true };
  }

  function snapRoad(x, y) {
    if (!baked) bake();
    if (!grid) return { x, y };
    const tx0 = (x / TS) | 0;
    const ty0 = (y / TS) | 0;
    let best = null;
    let bestD = 1e9;
    for (let r = 0; r <= 14; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (r && Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = tx0 + dx;
          const ty = ty0 + dy;
          if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) continue;
          if (grid[ty * TW + tx] !== ROAD) continue;
          const px = tx * TS + 8;
          const py = ty * TS + 8;
          const dd = (px - x) * (px - x) + (py - y) * (py - y);
          if (dd < bestD) {
            bestD = dd;
            best = { x: px, y: py };
          }
        }
      }
      if (best) return best;
    }
    return { x, y };
  }

  function randLand() {
    for (let i = 0; i < 50; i++) {
      const x = BOX.x + 50 + Math.random() * (BOX.w - 100);
      const y = BOX.y + 50 + Math.random() * (BOX.h - 100);
      if (contains(x, y)) return { x, y };
    }
    return xy("houmt");
  }

  function path(ctx) {
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
  }

  function box(name, w, h, ox, oy) {
    const p = xy(name);
    const x = p.x + (ox || 0);
    const y = p.y + (oy || 0);
    return { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
  }

  function zoneAt(x, y) {
    if (!contains(x, y)) return "sea";
    let best = "houmt";
    let bestD = 1e9;
    Object.keys(ANCHORS).forEach((name) => {
      const p = xy(name);
      const dd = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y);
      if (dd < bestD) {
        bestD = dd;
        best = name;
      }
    });
    if (best === "houmt") {
      const p = xy("houmt");
      if (x < p.x - 140) return "souk";
      if (x < p.x + 140 && y < p.y + 100) return "plaza";
      return "ville";
    }
    return ZONE_MUSIC[best] || "ville";
  }

  function zoneLabel(z) {
    return ZONE_LABEL[z] || (z || "DJERBA").toUpperCase();
  }

  function roads() {
    const h = xy("houmt");
    const m = xy("midoun");
    const a = xy("ajim");
    const g = xy("guellala");
    const s = xy("sidi");
    const ag = xy("aghir");
    const e = xy("elmay");
    const r = xy("erriadh");
    const x = xy("explore");
    const hot = xy("hotel");
    const air = xy("airport");
    const pl = xy("plaza");
    return [
      [h.x, h.y, m.x, m.y],
      [h.x, h.y, a.x, a.y],
      [h.x, h.y, g.x, g.y],
      [m.x, m.y, ag.x, ag.y],
      [s.x, s.y, h.x, h.y],
      [s.x, s.y, m.x, m.y],
      [s.x, s.y, hot.x, hot.y],
      [e.x, e.y, h.x, h.y],
      [e.x, e.y, g.x, g.y],
      [e.x, e.y, m.x, m.y],
      [e.x, e.y, a.x, a.y],
      [a.x, a.y, g.x, g.y],
      [m.x, m.y, r.x, r.y],
      [r.x, r.y, x.x, x.y],
      [ag.x, ag.y, g.x, g.y],
      [h.x, h.y, air.x, air.y],
      [h.x - 500, h.y + 48, h.x + 720, h.y + 48],
      [h.x + 48, h.y - 140, h.x + 48, h.y + 500],
      [h.x + 320, h.y - 60, h.x + 320, h.y + 520],
      [h.x - 352, h.y - 40, h.x - 352, h.y + 420],
      [m.x - 180, m.y + 20, m.x + 420, m.y + 20],
      [m.x + 20, m.y - 100, m.x + 20, m.y + 540],
      [a.x - 80, a.y + 36, a.x + 420, a.y + 36],
      [a.x + 128, a.y - 60, a.x + 128, a.y + 420],
      [g.x - 200, g.y + 36, g.x + 280, g.y + 36],
      [e.x - 200, e.y + 36, e.x + 420, e.y + 36],
      [r.x - 200, r.y + 48, r.x + 360, r.y + 48],
      [r.x - 180, r.y - 220, r.x + 320, r.y - 220],
      [pl.x - 100, pl.y, pl.x + 100, pl.y],
    ];
  }

  function loopPts() {
    return poly.map((p) => ({
      x: p.x + (cx - p.x) * 0.09,
      y: p.y + (cy - p.y) * 0.09,
    }));
  }

  function hash(px, py) {
    return ((px * 1103515245 + py * 12345) >>> 0);
  }

  function landMask(px, py) {
    if (px < 0 || py < 0 || px >= MW || py >= MH) return false;
    return mask[py * MW + px] === 1;
  }

  function gset(tx, ty, v) {
    if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return;
    if (grid[ty * TW + tx] === WATER) return;
    grid[ty * TW + tx] = v;
  }

  function discTiles(tx, ty, r, v) {
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        gset(tx + dx, ty + dy, v);
      }
    }
  }

  function rectTiles(tx, ty, w, h, v) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) gset(tx + x, ty + y, v);
    }
  }

  function townBlock(name, bw, bh) {
    const p = xy(name);
    const tx = ((p.x / TS) | 0) - (bw >> 1);
    const ty = ((p.y / TS) | 0) - (bh >> 1);
    rectTiles(tx, ty, bw, bh, COBBLE);
    rectTiles(tx, ty + (bh >> 1) - 1, bw, 2, PLAZA);
    rectTiles(tx + (bw >> 1) - 1, ty, 2, bh, PLAZA);
  }

  function townPad(name, ox, oy, bw, bh) {
    const p = xy(name);
    const tx = (((p.x + ox) / TS) | 0) - (bw >> 1);
    const ty = (((p.y + oy) / TS) | 0) - (bh >> 1);
    rectTiles(tx, ty, bw, bh, COBBLE);
  }

  function paintSeg(x0, y0, x1, y1, half, v) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const n = Math.max(2, (len / 4) | 0);
    const hw = half == null ? 14 : half;
    const kind = v == null ? ROAD : v;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + dx * t;
      const y = y0 + dy * t;
      for (let s = -hw; s <= hw; s += 5) {
        gset(((x + nx * s) / TS) | 0, ((y + ny * s) / TS) | 0, kind);
      }
    }
  }

  function bake() {
    if (baked) return;
    baked = true;
    if (typeof Atlas !== "undefined" && Atlas.bake) Atlas.bake();
    const C = colors();
    mask = new Uint8Array(MW * MH);
    grid = new Uint8Array(TW * TH);
    roadDir = new Uint8Array(TW * TH);

    for (let py = 0; py < MH; py++) {
      for (let px = 0; px < MW; px++) {
        if (polyHit((px + 0.5) * SX, (py + 0.5) * SY)) mask[py * MW + px] = 1;
      }
    }

    for (let ty = 0; ty < TH; ty++) {
      for (let tx = 0; tx < TW; tx++) {
        const mx = Math.max(0, Math.min(MW - 1, ((tx * TS + 8) / SX) | 0));
        const my = Math.max(0, Math.min(MH - 1, ((ty * TS + 8) / SY) | 0));
        let n = 0;
        for (let oy = 0; oy < 4; oy++) {
          for (let ox = 0; ox < 4; ox++) {
            if (landMask(mx + ox, my + oy)) n++;
          }
        }
        if (n < 5) continue;
        const wx = tx * TS + 8;
        const wy = ty * TS + 8;
        const u = (wx - BOX.x) / BOX.w;
        const v = (wy - BOX.y) / BOX.h;
        const westGreen = u < 0.40 || (u < 0.56 && v > 0.26 && v < 0.80);
        let kind = SAND;
        if (westGreen) kind = GRASS;
        if (v < 0.22 && u > 0.50) kind = SAND;
        if (u > 0.76 && v > 0.66) kind = SAND;
        if (westGreen && (hash(tx, ty) % 17) === 0) kind = DIRT;
        grid[ty * TW + tx] = kind;
      }
    }

    const sidi = xy("sidi");
    const hotel = xy("hotel");
    const aghir = xy("aghir");
    const lagoon = xy("lagoon");
    for (let ty = 1; ty < TH - 1; ty++) {
      for (let tx = 1; tx < TW - 1; tx++) {
        const i = ty * TW + tx;
        if (!grid[i]) continue;
        const wet = !grid[i - 1] || !grid[i + 1] || !grid[i - TW] || !grid[i + TW];
        const wx = tx * TS + 8;
        const wy = ty * TS + 8;
        const nearBeach =
          Math.hypot(wx - sidi.x, wy - sidi.y) < 260 ||
          Math.hypot(wx - hotel.x, wy - hotel.y) < 200 ||
          Math.hypot(wx - aghir.x, wy - aghir.y) < 220;
        if (wet || nearBeach) grid[i] = BEACH;
        if (Math.hypot(wx - lagoon.x, wy - lagoon.y) < 130 && (tx + ty) % 2) grid[i] = GRASS;
      }
    }

    discTiles((xy("lagoon").x / TS) | 0, (xy("lagoon").y / TS) | 0, 12, GRASS);
    discTiles((xy("elmay").x / TS) | 0 - 8, (xy("elmay").y / TS) | 0 + 6, 8, GRASS);
    discTiles((xy("elmay").x / TS) | 0 - 2, (xy("elmay").y / TS) | 0 - 10, 7, GRASS);

    const towns = [
      ["houmt", 56, 40],
      ["plaza", 22, 16],
      ["midoun", 48, 40],
      ["ajim", 36, 32],
      ["elmay", 40, 28],
      ["erriadh", 44, 32],
      ["guellala", 40, 28],
      ["explore", 20, 16],
      ["aghir", 32, 24],
    ];
    towns.forEach(([name, bw, bh]) => townBlock(name, bw, bh));
    townPad("houmt", 400, 180, 52, 42);
    townPad("houmt", -360, 140, 44, 36);
    townPad("midoun", 80, 260, 48, 36);
    townPad("ajim", 256, 120, 36, 32);
    townPad("elmay", 80, 160, 40, 28);
    townPad("erriadh", 40, -240, 44, 28);
    townPad("guellala", 40, 160, 36, 26);
    townPad("aghir", 256, 120, 32, 22);
    discTiles((aghir.x / TS) | 0, (aghir.y / TS) | 0, 10, BEACH);
    const air = xy("airport");
    rectTiles(((air.x / TS) | 0) - 8, ((air.y / TS) | 0) - 5, 22, 10, STONE);
    paintSeg(air.x - 30, air.y + 70, air.x + 280, air.y + 70, 10, STONE);

    function paintTownGrid(name, ox, oy, cols, rows, px, py) {
      const a = xy(name);
      const x0 = a.x + ox - 40;
      const y0 = a.y + oy - 40;
      const x1 = a.x + ox + cols * px + 24;
      const y1 = a.y + oy + rows * py + 24;
      for (let r = 0; r <= rows; r++) {
        const y = a.y + oy + r * py - 32;
        paintSeg(x0, y, x1, y, 10, ROAD);
      }
      for (let c = 0; c <= cols; c++) {
        const x = a.x + ox + c * px - 32;
        paintSeg(x, y0, x, y1, 10, ROAD);
      }
    }
    paintTownGrid("houmt", 192, -40, 4, 4, 128, 136);
    paintTownGrid("houmt", -480, -20, 3, 3, 128, 136);
    paintTownGrid("midoun", -128, 136, 4, 3, 128, 136);
    paintTownGrid("ajim", 128, -40, 3, 3, 128, 136);
    paintTownGrid("guellala", -192, 80, 3, 2, 128, 136);
    paintTownGrid("elmay", -192, 80, 3, 2, 128, 136);
    paintTownGrid("erriadh", -160, -356, 4, 2, 128, 136);
    paintTownGrid("aghir", 128, 20, 3, 2, 128, 136);

    const loop = loopPts();
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      paintSeg(a.x, a.y, b.x, b.y, 18, ROAD);
    }
    roads().forEach(([x1, y1, x2, y2]) => paintSeg(x1, y1, x2, y2, 16, ROAD));

    const isRoad = (tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return false;
      return grid[ty * TW + tx] === ROAD;
    };
    for (let ty = 0; ty < TH; ty++) {
      for (let tx = 0; tx < TW; tx++) {
        if (!isRoad(tx, ty)) continue;
        const h = isRoad(tx - 1, ty) || isRoad(tx + 1, ty);
        const v = isRoad(tx, ty - 1) || isRoad(tx, ty + 1);
        roadDir[ty * TW + tx] = h && v ? 3 : v && !h ? 2 : 1;
      }
    }

    for (let ty = 1; ty < TH - 1; ty++) {
      for (let tx = 1; tx < TW - 1; tx++) {
        const i = ty * TW + tx;
        const k = grid[i];
        if (k !== BEACH && k !== SAND) continue;
        if (!grid[i - 1] || !grid[i + 1] || !grid[i - TW] || !grid[i + TW]) grid[i] = SHORE;
      }
    }

    const ferryTx = 5;
    const ferryTy = TH - 9;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -5; dx <= 4; dx++) {
        if (dx * dx + dy * dy > 22) continue;
        const tx = ferryTx + dx;
        const ty = ferryTy + dy;
        if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) continue;
        grid[ty * TW + tx] = dx * dx + dy * dy > 12 ? SAND : BEACH;
      }
    }

    scatterProps();

    mini = document.createElement("canvas");
    mini.width = TW;
    mini.height = TH;
    const mg = mini.getContext("2d");
    mg.imageSmoothingEnabled = false;
    const colOf = [
      null, C.sandB, C.green, C.sandA, C.cobbleA, C.wall, C.white, C.sandC, C.cobbleB, C.sandD,
    ];
    for (let ty = 0; ty < TH; ty++) {
      for (let tx = 0; tx < TW; tx++) {
        const k = grid[ty * TW + tx];
        if (!k) continue;
        mg.fillStyle = colOf[k] || C.sandB;
        mg.fillRect(tx, ty, 1, 1);
        if (k === ROAD) {
          mg.fillStyle = C.white;
          mg.fillRect(tx, ty, 1, 1);
        }
        if (k === BEACH && ((tx + ty) & 3) === 0) {
          mg.fillStyle = C.sandA;
          mg.fillRect(tx, ty, 1, 1);
        }
      }
    }
  }

  function scatterProps() {
    deco = [];
    for (let ty = 3; ty < TH - 3; ty += 2) {
      for (let tx = 3; tx < TW - 3; tx += 2) {
        const k = grid[ty * TW + tx];
        if (!k || k === ROAD || k === COBBLE || k === PLAZA || k === STONE) continue;
        const h = hash(tx * 7 + 3, ty * 13 + 11);
        const x = tx * TS + (h % 7) - 3;
        const y = ty * TS + ((h >> 4) % 7) - 3;
        if (k === GRASS || k === DIRT) {
          const r = h % 23;
          if (r === 0) deco.push({ kind: "palm", x, y: y - 18, seed: h });
          else if (r === 1 || r === 2) deco.push({ kind: "bush", x, y: y + 4, seed: h });
        } else if (k === BEACH) {
          const r = h % 29;
          if (r === 0) deco.push({ kind: "rock", x, y: y + 6, seed: h });
          else if (r === 1) deco.push({ kind: "palm", x, y: y - 16, seed: h });
          else if (r === 2) deco.push({ kind: "bush", x, y: y + 2, seed: h });
        } else if (k === SAND) {
          const r = h % 31;
          if (r === 0) deco.push({ kind: "bush", x, y: y + 4, seed: h });
          else if (r === 1) deco.push({ kind: "rock", x, y: y + 6, seed: h });
        }
      }
    }
  }

  function props() {
    if (!baked) bake();
    return deco;
  }

  function tileAt(wx, wy) {
    if (!baked) bake();
    if (!grid) return 0;
    const tx = (wx / TS) | 0;
    const ty = (wy / TS) | 0;
    if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return 0;
    return grid[ty * TW + tx];
  }

  function tileImage(tx, ty) {
    if (!grid) return null;
    const k = grid[ty * TW + tx];
    const tiles = (typeof Atlas !== "undefined" && Atlas.tiles) ? Atlas.tiles : null;
    if (!tiles || !k) return null;
    if (k === SAND) return [tiles.sand0, tiles.sand1, tiles.sand2, tiles.sand3][(tx + ty * 3) & 3];
    if (k === GRASS) return (tx + ty) & 1 ? (tiles.grass2 || tiles.grass) : tiles.grass;
    if (k === BEACH) return (tx + ty) & 1 ? (tiles.beach1 || tiles.sand0) : (tiles.beach0 || tiles.sand1);
    if (k === SHORE) return tiles.sandCap || tiles.beach0 || tiles.sand1;
    if (k === COBBLE) return (tx + ty) & 1 ? tiles.cobble0 : tiles.cobble1;
    if (k === PLAZA) return tiles.plaza;
    if (k === STONE) return tiles.stone;
    if (k === DIRT) return tiles.sand3;
    if (k === ROAD) {
      const d = roadDir[ty * TW + tx];
      if (d === 3) return tiles.pathX || tiles.roadX;
      if (d === 2) return tiles.pathV || tiles.roadV;
      if (d === 1) return tiles.pathH || tiles.roadH;
      return tiles.path || tiles.plaza;
    }
    return null;
  }

  function drawGround(ctx, cam) {
    if (!baked) bake();
    const x0 = cam ? Math.max(0, (cam.x / TS | 0) - 1) : 0;
    const y0 = cam ? Math.max(0, (cam.y / TS | 0) - 1) : 0;
    const x1 = cam ? Math.min(TW, ((cam.x + cam.vw) / TS | 0) + 2) : TW;
    const y1 = cam ? Math.min(TH, ((cam.y + cam.vh) / TS | 0) + 2) : TH;
    ctx.imageSmoothingEnabled = false;
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        const img = tileImage(tx, ty);
        if (img) ctx.drawImage(img, tx * TS, ty * TS);
      }
    }
  }

  return {
    W, H, BOX, poly, contains, xy, uv, worldToMap, clamp, clampPlay, snapRoad, randLand, path, box,
    zoneAt, zoneLabel, roads, loopPts, ANCHORS, MAP_LABELS, MAP_ICONS, bake, drawGround,
    props, tileAt,
    groundCanvas: () => mini,
    mapCanvas: () => mini,
    MW: TW, MH: TH, cx, cy, TS,
  };
})();
