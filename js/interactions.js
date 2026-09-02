/* Interactions monde ouvert — fontaines, bancs, abris, pêche, douche */
const Interactions = (() => {
  const POINTS = [
    { id: "fountain_houmt", anchor: "houmt", dx: -40, dy: 200, r: 36, type: "fountain", label: "FONTAINE", action: "drink" },
    { id: "bench_sidi", anchor: "sidi", dx: -30, dy: 60, r: 32, type: "bench", label: "BANC", action: "sit" },
    { id: "bench_plaza", anchor: "plaza", dx: 0, dy: 40, r: 32, type: "bench", label: "BANC", action: "sit" },
    { id: "shower_aghir", anchor: "aghir", dx: 40, dy: 100, r: 34, type: "shower", label: "DOUCHE", action: "shower" },
    { id: "well_elmay", anchor: "elmay", dx: 0, dy: 520, r: 38, type: "well", label: "PUITS", action: "well" },
    { id: "fish_ajim", anchor: "ajim", dx: -60, dy: 20, r: 40, type: "fish", label: "PECHE", action: "fish" },
    { id: "lookout_sidi", anchor: "sidi", dx: 120, dy: -20, r: 36, type: "lookout", label: "VUE", action: "lookout" },
    { id: "shelter_hotel", anchor: "hotel", dx: -60, dy: 40, r: 42, type: "shelter", label: "ABRI", action: "shelter" },
    { id: "cafe_terrace", anchor: "houmt", dx: -20, dy: 148, r: 38, type: "terrace", label: "TERRASSE", action: "terrace" },
    { id: "photo_erriadh", anchor: "erriadh", dx: 0, dy: 0, r: 40, type: "photo", label: "PHOTO", action: "photo" },
    { id: "umbrella_beach", anchor: "sidi", dx: 60, dy: 90, r: 34, type: "umbrella", label: "PARASOL", action: "shade" },
    { id: "boat_lagoon", anchor: "lagoon", dx: 120, dy: 80, r: 44, type: "boat", label: "BARQUE", action: "boat" },
  ];

  let spots = [];
  let sitting = false;
  let sitTimer = 0;

  function init() {
    spots = POINTS.map((p) => {
      const xy = Island.xy(p.anchor);
      return { ...p, x: xy.x + p.dx, y: xy.y + p.dy };
    });
  }

  function near(p, world, range) {
    if (!p || world.inside || p.swim) return null;
    let best = null;
    let bestD = range || 40;
    const px = p.x + 16;
    const py = p.y + 20;
    for (const s of spots) {
      const d = Math.hypot(s.x - px, s.y - py);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  function use(spot, p, world) {
    if (!spot) return null;
    const st = Progress.get();
    switch (spot.action) {
      case "drink":
      case "well":
        if (st.water) st.water.thirst = Math.min(100, (st.water.thirst || 0) + 35);
        Progress.save();
        return { type: "interact", label: spot.label, text: "Eau fraîche de la citerne. +35 soif", thirst: true };
      case "shower":
        if (st.water) st.water.thirst = Math.min(100, (st.water.thirst || 0) + 20);
        Progress.save();
        return { type: "interact", label: spot.label, text: "Douche de plage. Propre et frais.", thirst: true };
      case "sit":
      case "terrace":
      case "shade":
        sitting = true;
        sitTimer = 4;
        p.vx = 0;
        p.vy = 0;
        return { type: "interact", label: spot.label, text: "Tu t'assois. Le thé peut attendre. Sahit." };
      case "fish":
        Progress.addCoins(12);
        return { type: "interact", label: spot.label, text: "Un poisson ! +$12", coins: 12 };
      case "lookout":
        return { type: "interact", label: spot.label, text: "Vue sur toute l'île. Djerba 2 en monde ouvert." };
      case "shelter":
        if (typeof WorldSim !== "undefined") sitTimer = 3;
        return { type: "interact", label: spot.label, text: "À l'abri du vent et de la pluie." };
      case "photo":
        Progress.addCoins(8);
        world.score += 40;
        return { type: "interact", label: spot.label, text: "Selfie réussi. +$8 · +40 pts", coins: 8 };
      case "boat":
        return { type: "interact", label: spot.label, text: "La barque tangue. La lagune est calme aujourd'hui." };
      default:
        return { type: "interact", label: spot.label, text: "..." };
    }
  }

  function tick(dt, p) {
    if (sitting) {
      sitTimer -= dt;
      if (sitTimer <= 0) sitting = false;
      if (p) { p.vx *= 0.5; p.vy *= 0.5; }
    }
  }

  function isSitting() {
    return sitting;
  }

  init();

  return { near, use, tick, isSitting, spots, POINTS };
})();
