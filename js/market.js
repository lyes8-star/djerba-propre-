/* Marché de l'eau — pénurie d'eau propre à Djerba (monde ouvert GTA) */
const Market = (() => {
  const SAVE_SHORTAGE_KEY = "djerba2-water-shortage-day";

  const BOTTLES = {
    b05: {
      id: "b05",
      name: "Bouteille 0,5 L",
      icon: "0.5",
      base: 48,
      thirst: 20,
      blurb: "Eau embouteillée — stock limité",
    },
    b15: {
      id: "b15",
      name: "Bouteille 1,5 L",
      icon: "1.5",
      base: 98,
      thirst: 45,
      blurb: "Format famille, très demandé",
    },
    bidon: {
      id: "bidon",
      name: "Bidon 5 L",
      icon: "5L",
      base: 235,
      thirst: 90,
      blurb: "Pour la maison, le camion ou le houch",
    },
    cistern: {
      id: "cistern",
      name: "Eau de citerne",
      icon: "CT",
      base: 22,
      thirst: 28,
      blurb: "Foggara / citerne — goût terre, prix doux",
    },
    premium: {
      id: "premium",
      name: "Eau premium",
      icon: "++",
      base: 185,
      thirst: 58,
      blurb: "Import — hôtel & aéroport",
    },
  };

  const STALLS = [
    {
      id: "souk",
      anchor: "houmt",
      dx: -880,
      dy: 88,
      w: 36,
      h: 28,
      name: "Marché de l'eau",
      sub: "Houmt Souk",
      zone: "souk",
      stock: ["b05", "b15", "bidon"],
      mult: 1.0,
    },
    {
      id: "midoun",
      anchor: "midoun",
      dx: 0,
      dy: -96,
      w: 32,
      h: 26,
      name: "Étal eau",
      sub: "Midoun",
      zone: "midounv",
      stock: ["b05", "b15", "cistern"],
      mult: 1.12,
    },
    {
      id: "ajim",
      anchor: "ajim",
      dx: -240,
      dy: 0,
      w: 32,
      h: 26,
      name: "Eau du port",
      sub: "Ajim",
      zone: "port",
      stock: ["b05", "b15", "bidon"],
      mult: 1.08,
    },
    {
      id: "elmay",
      anchor: "elmay",
      dx: -80,
      dy: 520,
      w: 32,
      h: 26,
      name: "Citerne El May",
      sub: "Foggara",
      zone: "elmay",
      stock: ["cistern", "b05", "b15"],
      mult: 0.82,
    },
    {
      id: "guellala",
      anchor: "guellala",
      dx: 240,
      dy: 80,
      w: 30,
      h: 26,
      name: "Eau potiers",
      sub: "Guellala",
      zone: "guellala",
      stock: ["cistern", "b05"],
      mult: 0.95,
    },
    {
      id: "sidi",
      anchor: "sidi",
      dx: 80,
      dy: 120,
      w: 30,
      h: 26,
      name: "Eau plage",
      sub: "Sidi Mahrez",
      zone: "beach",
      stock: ["b05", "b15", "premium"],
      mult: 1.35,
    },
    {
      id: "aghir",
      anchor: "aghir",
      dx: -80,
      dy: 80,
      w: 30,
      h: 26,
      name: "Étal sud",
      sub: "Aghir",
      zone: "aghir",
      stock: ["b05", "b15", "cistern"],
      mult: 1.18,
    },
    {
      id: "hotel",
      anchor: "hotel",
      dx: 120,
      dy: 80,
      w: 32,
      h: 26,
      name: "Boutique eau",
      sub: "Zone hôtelière",
      zone: "hotel",
      stock: ["premium", "b15", "bidon"],
      mult: 1.42,
    },
    {
      id: "airport",
      anchor: "airport",
      dx: 80,
      dy: 60,
      w: 32,
      h: 26,
      name: "Duty free eau",
      sub: "Aéroport DJE",
      zone: "airport",
      stock: ["premium", "b15", "b05"],
      mult: 1.55,
    },
  ];

  let stalls = [];
  let shortage = 78;
  let openStall = null;
  let thirstWarn = 0;

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function rollShortage() {
    try {
      const raw = localStorage.getItem(SAVE_SHORTAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.day === todayKey()) return parsed.level;
      }
    } catch { /* ignore */ }
    const level = 62 + Math.floor(Math.random() * 28);
    try {
      localStorage.setItem(SAVE_SHORTAGE_KEY, JSON.stringify({ day: todayKey(), level }));
    } catch { /* ignore */ }
    return level;
  }

  function init() {
    shortage = rollShortage();
    stalls = STALLS.map((s) => {
      const p = Island.xy(s.anchor);
      return {
        ...s,
        x: (p.x + s.dx) | 0,
        y: (p.y + s.dy) | 0,
      };
    });
  }

  function priceMult() {
    return 0.75 + (shortage / 100) * 0.85;
  }

  function price(id, stall) {
    const b = BOTTLES[id];
    if (!b) return 0;
    const sm = stall && stall.mult != null ? stall.mult : 1;
    return Math.max(8, Math.round(b.base * priceMult() * sm));
  }

  function shortageLabel() {
    if (shortage >= 85) return "CRITIQUE";
    if (shortage >= 70) return "FORTE";
    if (shortage >= 50) return "MODÉRÉE";
    return "SURVEILLÉE";
  }

  function feet(p) {
    return { x: p.x + 8, y: p.y + 26, w: 16, h: 12 };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function nearStall(p, world, range) {
    if (!p || p.swim || (world && world.inside)) return null;
    const f = feet(p);
    const pad = range != null ? range : 44;
    let best = null;
    let bestD = pad;
    for (const s of stalls) {
      const box = { x: s.x - 6, y: s.y - 4, w: s.w + 12, h: s.h + 28 };
      if (!overlap(f, box)) continue;
      const d = Math.hypot(s.x + s.w / 2 - (p.x + 16), s.y + s.h - (p.y + 20));
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  function openMarket(stall) {
    openStall = stall;
    if (typeof UI !== "undefined" && UI.openWaterMarket) UI.openWaterMarket(stall, catalog(stall));
  }

  function closeMarket() {
    openStall = null;
    if (typeof UI !== "undefined" && UI.closeWaterMarket) UI.closeWaterMarket();
  }

  function isOpen() {
    return !!openStall;
  }

  function catalog(stall) {
    return (stall.stock || []).map((id) => {
      const b = BOTTLES[id];
      return {
        ...b,
        cost: price(id, stall),
        owned: Progress.get().water.stock[id] || 0,
      };
    });
  }

  function buy(id) {
    if (!openStall) return { ok: false, reason: "Marché fermé" };
    const b = BOTTLES[id];
    if (!b) return { ok: false, reason: "Produit inconnu" };
    if (!(openStall.stock || []).includes(id)) return { ok: false, reason: "Rupture ici" };
    const cost = price(id, openStall);
    const res = Progress.buyWater(id, cost);
    if (!res.ok) return res;
    shortage = Math.max(48, shortage - 0.35);
    return { ok: true, cost, name: b.name, thirst: b.thirst };
  }

  function drink(id) {
    return Progress.drinkWater(id);
  }

  function drainRate(zone) {
    const z = zone || "ville";
    if (z === "beach" || z === "hotel" || z === "aghir") return 2.8;
    if (z === "port" || z === "airport") return 2.2;
    if (z === "elmay" || z === "lagoon") return 1.4;
    if (z === "souk" || z === "ville" || z === "plaza") return 1.6;
    return 2.0;
  }

  function tick(dt, player, world) {
    if (!player || world.inside || isOpen()) return null;
    const zone = Sprites.zoneAt(player.x, player.y);
    const res = Progress.tickThirst(dt, drainRate(zone));
    if (res && res.warn && thirstWarn <= 0) {
      thirstWarn = 8;
      return {
        html: "SOIF!<br/>Pénurie d'eau propre — cherche un étal MARCHE",
        kind: "thirst",
      };
    }
    if (thirstWarn > 0) thirstWarn -= dt;
    return null;
  }

  function speedPenalty() {
    return Progress.waterPenalty();
  }

  function drawStalls(ctx, cam, t) {
    if (!stalls.length) init();
    const C = Atlas.C || { blue: "#48b0e8", white: "#fcfcfc", gold: "#ffd24a", red: "#e83838" };
    for (const s of stalls) {
      const sx = s.x;
      const sy = s.y;
      if (cam && (sx + s.w < cam.x - 16 || sx > cam.x + cam.vw + 16 || sy + s.h < cam.y - 16 || sy > cam.y + cam.vh + 16)) {
        continue;
      }
      ctx.fillStyle = "#6ec8fc";
      ctx.fillRect(sx, sy + 8, s.w, s.h - 8);
      ctx.fillStyle = "#3a90c8";
      ctx.fillRect(sx + 2, sy + 10, s.w - 4, 4);
      ctx.fillStyle = "#d4e8fc";
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(sx + 6 + i * 10, sy + 2, 6, 10);
      }
      ctx.fillStyle = C.blue;
      ctx.fillRect(sx + 4, sy + 14, 8, 10);
      ctx.fillRect(sx + s.w - 12, sy + 14, 8, 10);
      const bob = Math.sin(t * 4 + sx * 0.01) * 0.5;
      ctx.fillStyle = shortage >= 80 ? C.red : C.gold;
      ctx.fillRect(sx + s.w / 2 - 5, sy - 4 + bob, 10, 8);
      ctx.fillStyle = "#0b2a4a";
      ctx.font = "5px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("EAU", sx + s.w / 2, sy - 6 + bob);
    }
  }

  function panelLines() {
    return {
      shortage,
      label: shortageLabel(),
      mult: priceMult(),
    };
  }

  init();

  return {
    BOTTLES,
    STALLS,
    stalls,
    init,
    nearStall,
    openMarket,
    closeMarket,
    isOpen,
    buy,
    drink,
    catalog,
    price,
    priceMult,
    shortageLabel,
    panelLines,
    tick,
    speedPenalty,
    drawStalls,
  };
})();
