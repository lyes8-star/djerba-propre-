/* Île NES : biomes en tiles 16px, routes, villes, plages, masque marchable */
const Island = (() => {
  const W = 2560;
  const H = 1920;
  const TS = 16;
  const TW = W / TS;
  const TH = H / TS;
  const MW = 640;
  const MH = 480;
  const SX = W / MW;
  const SY = H / MH;
  const BOX = { x: 160, y: 100, w: 2240, h: 1720 };

  const WATER = 0;
  const SAND = 1;
  const GRASS = 2;
  const BEACH = 3;
  const COBBLE = 4;
  const PLAZA = 5;
  const ROAD = 6;
  const DIRT = 7;
  const STONE = 8;

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
      if (x < p.x - 40) return "souk";
      if (x < p.x + 40 && y < p.y + 30) return "plaza";
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
    return [
      [h.x, h.y, m.x, m.y],
      [h.x, h.y, a.x, a.y],
      [h.x, h.y, g.x, g.y],
      [m.x, m.y, ag.x, ag.y],
      [s.x, s.y, h.x, h.y],
      [s.x, s.y, m.x, m.y],
      [e.x, e.y, h.x, h.y],
      [e.x, e.y, g.x, g.y],
      [e.x, e.y, m.x, m.y],
      [e.x, e.y, a.x, a.y],
      [a.x, a.y, g.x, g.y],
      [m.x, m.y, r.x, r.y],
      [r.x, r.y, x.x, x.y],
      [ag.x, ag.y, g.x, g.y],
    ];
  }

  function loopPts() {
    return poly.map((p) => ({
      x: p.x + (cx - p.x) * 0.18,
      y: p.y + (cy - p.y) * 0.18,
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

  function paintSeg(x0, y0, x1, y1, thick, v) {
    const n = Math.max(2, (Math.hypot(x1 - x0, y1 - y0) / 8) | 0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const tx = (x / TS) | 0;
      const ty = (y / TS) | 0;
      for (let oy = -thick; oy <= thick; oy++) {
        for (let ox = -thick; ox <= thick; ox++) {
          if (Math.abs(ox) + Math.abs(oy) > thick + 1) continue;
          gset(tx + ox, ty + oy, v);
        }
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
        const mx = tx * 4;
        const my = ty * 4;
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
          Math.hypot(wx - sidi.x, wy - sidi.y) < 180 ||
          Math.hypot(wx - hotel.x, wy - hotel.y) < 140 ||
          Math.hypot(wx - aghir.x, wy - aghir.y) < 150;
        if (wet || nearBeach) grid[i] = BEACH;
        if (Math.hypot(wx - lagoon.x, wy - lagoon.y) < 90 && (tx + ty) % 2) grid[i] = GRASS;
      }
    }

    discTiles((xy("lagoon").x / TS) | 0, (xy("lagoon").y / TS) | 0, 8, GRASS);
    discTiles((xy("elmay").x / TS) | 0 - 6, (xy("elmay").y / TS) | 0 + 4, 6, GRASS);
    discTiles((xy("elmay").x / TS) | 0 - 2, (xy("elmay").y / TS) | 0 - 8, 5, GRASS);

    const towns = [
      ["houmt", 9, 4],
      ["plaza", 4, 3],
      ["midoun", 7, 3],
      ["ajim", 6, 3],
      ["elmay", 5, 3],
      ["erriadh", 5, 3],
      ["guellala", 6, 2],
      ["explore", 5, 3],
    ];
    towns.forEach(([name, r, pr]) => {
      const p = xy(name);
      discTiles((p.x / TS) | 0, (p.y / TS) | 0, r, COBBLE);
      discTiles((p.x / TS) | 0, (p.y / TS) | 0, pr, PLAZA);
    });
    discTiles((aghir.x / TS) | 0, (aghir.y / TS) | 0, 5, BEACH);
    const air = xy("airport");
    discTiles((air.x / TS) | 0, (air.y / TS) | 0, 5, STONE);
    paintSeg(air.x - 20, air.y + 58, air.x + 220, air.y + 58, 1, STONE);

    const loop = loopPts();
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      paintSeg(a.x, a.y, b.x, b.y, 1, ROAD);
    }
    roads().forEach(([x1, y1, x2, y2]) => paintSeg(x1, y1, x2, y2, 1, ROAD));

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

    mini = document.createElement("canvas");
    mini.width = TW;
    mini.height = TH;
    const mg = mini.getContext("2d");
    mg.imageSmoothingEnabled = false;
    const colOf = [
      null, C.sandB, C.green, C.sandA, C.cobbleA, C.wall, C.road, C.sandC, C.cobbleB,
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

  function tileImage(tx, ty) {
    if (!grid) return null;
    const k = grid[ty * TW + tx];
    const tiles = (typeof Atlas !== "undefined" && Atlas.tiles) ? Atlas.tiles : null;
    if (!tiles || !k) return null;
    if (k === SAND) return [tiles.sand0, tiles.sand1, tiles.sand2, tiles.sand3][(tx + ty * 3) & 3];
    if (k === GRASS) return tiles.grass;
    if (k === BEACH) return (tx + ty) & 1 ? (tiles.beach1 || tiles.sand0) : (tiles.beach0 || tiles.sand1);
    if (k === COBBLE) return (tx + ty) & 1 ? tiles.cobble0 : tiles.cobble1;
    if (k === PLAZA) return tiles.plaza;
    if (k === STONE) return tiles.stone;
    if (k === DIRT) return tiles.sand3;
        if (k === ROAD) return tiles.path || tiles.plaza;
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
    W, H, BOX, poly, contains, xy, uv, worldToMap, clamp, randLand, path, box,
    zoneAt, zoneLabel, roads, loopPts, ANCHORS, MAP_LABELS, MAP_ICONS, bake, drawGround,
    groundCanvas: () => mini,
    mapCanvas: () => mini,
    MW: TW, MH: TH, cx, cy, TS,
  };
})();
