/* Île pixel NES : biomes de la carte, boucle de routes, masque marchable */
const Island = (() => {
  const W = 2560;
  const H = 1920;
  const MW = 640;
  const MH = 480;
  const SX = W / MW;
  const SY = H / MH;
  const BOX = { x: 160, y: 100, w: 2240, h: 1720 };

  const UV = [
    [0.18, 0.16], [0.28, 0.12], [0.38, 0.14], [0.46, 0.10],
    [0.56, 0.08], [0.68, 0.09], [0.80, 0.12], [0.90, 0.16],
    [0.94, 0.24], [0.95, 0.34], [0.94, 0.44], [0.92, 0.54],
    [0.94, 0.66], [0.96, 0.76], [0.88, 0.84], [0.76, 0.88],
    [0.62, 0.91], [0.48, 0.92], [0.34, 0.88], [0.24, 0.82],
    [0.14, 0.74], [0.06, 0.64], [0.05, 0.54], [0.08, 0.44],
    [0.12, 0.32], [0.14, 0.22],
  ];

  const ANCHORS = {
    houmt: [0.44, 0.18],
    portHoumt: [0.44, 0.12],
    sidi: [0.78, 0.14],
    hotel: [0.84, 0.18],
    midoun: [0.84, 0.40],
    erriadh: [0.62, 0.50],
    elmay: [0.50, 0.48],
    explore: [0.70, 0.58],
    guellala: [0.46, 0.84],
    aghir: [0.86, 0.78],
    mezraya: [0.78, 0.68],
    mahboubine: [0.76, 0.76],
    sedouikech: [0.68, 0.74],
    ajim: [0.12, 0.60],
    airport: [0.22, 0.34],
    lagoon: [0.28, 0.70],
    plaza: [0.44, 0.20],
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

  const poly = UV.map(([u, v]) => ({ x: BOX.x + u * BOX.w, y: BOX.y + v * BOX.h }));
  let cx = 0;
  let cy = 0;
  poly.forEach((p) => { cx += p.x; cy += p.y; });
  cx /= poly.length;
  cy /= poly.length;

  let ground = null;
  let mask = null;
  let baked = false;

  function colors() {
    return (typeof Atlas !== "undefined" && Atlas.C) ? Atlas.C : {
      sandB: "#f0cc84", sandC: "#d4a85c", sandA: "#ffe8b0", sandD: "#b88840",
      green: "#3cbc3c", greenD: "#248024", greenH: "#58d848", greenX: "#145014",
      cobbleA: "#c4a878", cobbleB: "#a88858", plaza: "#ece4d4",
      road: "#3a3c48", roadY: "#fcbc14", roadD: "#24262e", wall: "#ece4d4",
      sandE: "#8c6428", terra: "#e88850", white: "#fcfcfc", ink: "#140c1c",
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
      const d = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y);
      if (d < bestD) {
        bestD = d;
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

  function pset(ctx, x, y, col) {
    const px = x | 0;
    const py = y | 0;
    if (px < 0 || py < 0 || px >= MW || py >= MH) return;
    ctx.fillStyle = col;
    ctx.fillRect(px, py, 1, 1);
  }

  function landAt(px, py) {
    if (px < 0 || py < 0 || px >= MW || py >= MH) return false;
    return mask[py * MW + px] === 1;
  }

  function psetLand(ctx, x, y, col) {
    const px = x | 0;
    const py = y | 0;
    if (!landAt(px, py)) return;
    ctx.fillStyle = col;
    ctx.fillRect(px, py, 1, 1);
  }

  function disc(ctx, x, y, r, col, maskOn) {
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const px = (x + dx) | 0;
        const py = (y + dy) | 0;
        if (maskOn) {
          if (px < 0 || py < 0 || px >= MW || py >= MH) continue;
          mask[py * MW + px] = 1;
          pset(ctx, px, py, col);
        } else {
          psetLand(ctx, px, py, col);
        }
      }
    }
  }

  function line(ctx, x0, y0, x1, y1, col, w, onLand) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const n = Math.max(2, Math.hypot(dx, dy) | 0);
    const hw = w || 1;
    const put = onLand ? psetLand : pset;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + dx * t;
      const y = y0 + dy * t;
      for (let oy = -hw; oy <= hw; oy++) {
        for (let ox = -hw; ox <= hw; ox++) {
          if (ox * ox + oy * oy > hw * hw + 1) continue;
          put(ctx, x + ox, y + oy, col);
        }
      }
    }
  }

  function hash(px, py) {
    return ((px * 1103515245 + py * 12345) >>> 0);
  }

  function bake() {
    if (baked) return;
    baked = true;
    const C = colors();
    const c = document.createElement("canvas");
    c.width = MW;
    c.height = MH;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    mask = new Uint8Array(MW * MH);

    for (let py = 0; py < MH; py++) {
      for (let px = 0; px < MW; px++) {
        const wx = (px + 0.5) * SX;
        const wy = (py + 0.5) * SY;
        if (!polyHit(wx, wy)) continue;
        mask[py * MW + px] = 1;
        const u = (wx - BOX.x) / BOX.w;
        const v = (wy - BOX.y) / BOX.h;
        const n = hash(px, py) & 7;
        let col;
        const westGreen = u < 0.36 || (u < 0.50 && v > 0.30 && v < 0.80);
        if (westGreen) {
          col = n < 2 ? C.greenH : n < 5 ? C.green : C.greenD;
        } else {
          col = n < 3 ? C.sandA : n < 6 ? C.sandB : C.sandC;
        }
        if (v < 0.22 && u > 0.52) col = n < 4 ? C.sandA : C.sandB;
        if (u > 0.78 && v > 0.68) col = n < 4 ? C.sandA : C.sandC;
        pset(g, px, py, col);
      }
    }

    for (let py = 1; py < MH - 1; py++) {
      for (let px = 1; px < MW - 1; px++) {
        if (!landAt(px, py)) continue;
        const shore = !landAt(px - 1, py) || !landAt(px + 1, py) || !landAt(px, py - 1) || !landAt(px, py + 1);
        if (!shore) continue;
        pset(g, px, py, (px + py) & 1 ? C.sandC : C.sandD);
      }
    }

    for (let py = 0; py < MH; py++) {
      for (let px = 0; px < MW; px++) {
        if (!landAt(px, py)) continue;
        const wx = (px + 0.5) * SX;
        const u = (wx - BOX.x) / BOX.w;
        if (u >= 0.36 && !(u < 0.50)) continue;
        if ((hash(px, py + 9) % 41) !== 0) continue;
        psetLand(g, px, py, C.greenX);
        psetLand(g, px, py - 1, C.greenH);
      }
    }

    const towns = [
      ["houmt", 18, C.wall],
      ["plaza", 10, C.cobbleA],
      ["midoun", 14, C.wall],
      ["ajim", 12, C.wall],
      ["guellala", 12, C.sandE],
      ["elmay", 10, C.cobbleA],
      ["aghir", 10, C.sandC],
      ["erriadh", 9, C.cobbleB],
      ["sidi", 8, C.sandA],
      ["hotel", 8, C.wall],
      ["airport", 8, C.cobbleB],
    ];
    towns.forEach(([name, r, col]) => {
      const p = xy(name);
      disc(g, p.x / SX, p.y / SY, r, col, false);
    });

    disc(g, xy("guellala").x / SX + 4, xy("guellala").y / SY + 2, 3, C.terra, false);

    const loop = loopPts();
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      line(g, a.x / SX, a.y / SY, b.x / SX, b.y / SY, C.roadD, 2, true);
      line(g, a.x / SX, a.y / SY, b.x / SX, b.y / SY, C.wall, 1, true);
    }
    roads().forEach(([x1, y1, x2, y2]) => {
      line(g, x1 / SX, y1 / SY, x2 / SX, y2 / SY, C.roadD, 2, true);
      line(g, x1 / SX, y1 / SY, x2 / SX, y2 / SY, C.wall, 1, true);
    });

    const aj = xy("ajim");
    const ferryX = 22;
    const ferryY = MH - 36;
    for (let dy = -11; dy <= 11; dy++) {
      for (let dx = -11; dx <= 11; dx++) {
        if (dx * dx + dy * dy > 121) continue;
        pset(g, ferryX + dx, ferryY + dy, (dx + dy) & 1 ? C.sandC : C.sandB);
      }
    }
    const nDash = 18;
    for (let i = 0; i < nDash; i++) {
      if (i % 2) continue;
      const t0 = i / nDash;
      const t1 = (i + 0.55) / nDash;
      line(
        g,
        aj.x / SX - 8 + (ferryX - aj.x / SX) * t0,
        aj.y / SY + 6 + (ferryY - aj.y / SY) * t0,
        aj.x / SX - 8 + (ferryX - aj.x / SX) * t1,
        aj.y / SY + 6 + (ferryY - aj.y / SY) * t1,
        C.white,
        0,
        false
      );
    }

    for (let i = 0; i < poly.length; i++) {
      if (i % 2) continue;
      const p = poly[i];
      const dx = p.x - cx;
      const dy = p.y - cy;
      const inv = 1 / (Math.hypot(dx, dy) || 1);
      const rx = (p.x / SX) + dx * inv * 3;
      const ry = (p.y / SY) + dy * inv * 3;
      pset(g, rx, ry, C.sandE);
      pset(g, rx + 1, ry, C.sandD);
    }

    ground = c;
  }

  function drawGround(ctx, cam) {
    if (!baked) bake();
    if (!ground) return;
    ctx.imageSmoothingEnabled = false;
    if (!cam) {
      ctx.drawImage(ground, 0, 0, W, H);
      return;
    }
    const sx = Math.max(0, (cam.x / SX | 0) - 1);
    const sy = Math.max(0, (cam.y / SY | 0) - 1);
    const sw = Math.min(MW - sx, ((cam.vw / SX) | 0) + 3);
    const sh = Math.min(MH - sy, ((cam.vh / SY) | 0) + 3);
    if (sw <= 0 || sh <= 0) return;
    ctx.drawImage(ground, sx, sy, sw, sh, sx * SX, sy * SY, sw * SX, sh * SY);
  }

  return {
    W, H, BOX, poly, contains, xy, uv, worldToMap, clamp, randLand, path, box,
    zoneAt, zoneLabel, roads, loopPts, ANCHORS, MAP_LABELS, bake, drawGround,
    groundCanvas: () => ground,
    MW, MH, cx, cy,
  };
})();
