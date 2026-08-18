/* Forme réelle de Djerba (nord en haut) + ancres des villages */
const Island = (() => {
  const W = 2560;
  const H = 1920;
  const BOX = { x: 200, y: 140, w: 2160, h: 1640 };

  /* Contour UV de l'île : baie de Houmt au nord, Ajim à l'ouest, Aghir au sud-est */
  const UV = [
    [0.16, 0.18], [0.24, 0.13], [0.34, 0.16], [0.42, 0.11],
    [0.52, 0.09], [0.64, 0.08], [0.76, 0.10], [0.86, 0.14],
    [0.92, 0.20], [0.94, 0.30], [0.95, 0.40], [0.93, 0.52],
    [0.94, 0.64], [0.97, 0.74], [0.90, 0.82], [0.78, 0.88],
    [0.64, 0.91], [0.50, 0.92], [0.36, 0.88], [0.26, 0.82],
    [0.16, 0.74], [0.08, 0.66], [0.05, 0.58], [0.08, 0.48],
    [0.11, 0.38], [0.13, 0.28],
  ];

  const ANCHORS = {
    houmt: [0.42, 0.20],
    portHoumt: [0.42, 0.13],
    sidi: [0.74, 0.14],
    hotel: [0.80, 0.17],
    midoun: [0.86, 0.40],
    erriadh: [0.62, 0.46],
    elmay: [0.50, 0.52],
    explore: [0.70, 0.60],
    guellala: [0.48, 0.82],
    aghir: [0.88, 0.78],
    mezraya: [0.80, 0.68],
    mahboubine: [0.78, 0.76],
    sedouikech: [0.70, 0.74],
    ajim: [0.12, 0.58],
    airport: [0.20, 0.36],
    lagoon: [0.30, 0.70],
    plaza: [0.42, 0.22],
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

  const poly = UV.map(([u, v]) => ({ x: BOX.x + u * BOX.w, y: BOX.y + v * BOX.h }));

  let cx = 0;
  let cy = 0;
  poly.forEach((p) => { cx += p.x; cy += p.y; });
  cx /= poly.length;
  cy /= poly.length;

  function contains(x, y) {
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

  function xy(name) {
    const a = ANCHORS[name] || ANCHORS.houmt;
    return { x: (BOX.x + a[0] * BOX.w) | 0, y: (BOX.y + a[1] * BOX.h) | 0 };
  }

  function uv(x, y) {
    return {
      u: (x - BOX.x) / BOX.w,
      v: (y - BOX.y) / BOX.h,
    };
  }

  function worldToMap(x, y, mw, mh) {
    const p = uv(x, y);
    return {
      x: 52 + p.u * (mw - 104),
      y: 30 + p.v * (mh - 58),
    };
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
    return [
      [h.x, h.y, m.x, m.y],
      [h.x, h.y, a.x, a.y],
      [h.x, h.y, g.x, g.y],
      [m.x, m.y, ag.x, ag.y],
      [s.x, s.y, h.x, h.y],
      [e.x, e.y, h.x, h.y],
      [e.x, e.y, g.x, g.y],
      [a.x, a.y, g.x, g.y],
    ];
  }

  return {
    W, H, BOX, poly, contains, xy, uv, worldToMap, clamp, randLand, path, box,
    zoneAt, zoneLabel, roads, ANCHORS,
  };
})();
