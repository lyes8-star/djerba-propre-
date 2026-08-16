/* Progress, save/load, tools, XP, daily challenges */
const Progress = (() => {
  const SAVE_KEY = "djerba-propre-save";

  const TOOL_DEFS = {
    pince: {
      id: "pince",
      name: "Pince (Scorpion)",
      icon: "🦂",
      cost: 500,
      maxLevel: 5,
      desc: (lv) => `+Portée · +Vitesse  Lv.${lv}`,
      range: (lv) => 12 + lv * 3,
      speed: (lv) => 1 + lv * 0.25,
    },
    sac: {
      id: "sac",
      name: "Sac",
      icon: "🛍️",
      cost: 700,
      maxLevel: 5,
      desc: (lv) => `+Capacité · +Résistance  Lv.${lv}`,
      capacity: (lv) => 8 + lv * 4,
      resistance: (lv) => 0.05 * lv,
    },
    balai: {
      id: "balai",
      name: "Balai",
      icon: "🧹",
      cost: 300,
      maxLevel: 5,
      desc: (lv) => `+Efficacité  Lv.${lv}`,
      radius: (lv) => 8 + lv * 4,
      efficiency: (lv) => 0.5 + lv * 0.25,
    },
    brouette: {
      id: "brouette",
      name: "Brouette",
      icon: "🛒",
      cost: 600,
      maxLevel: 5,
      desc: (lv) => `+Capacité · +Vitesse  Lv.${lv}`,
      capacity: (lv) => 5 + lv * 5,
      speedBonus: (lv) => 0.1 * lv,
    },
  };

  const SHOP_ITEMS = [
    { id: "boost_xp", name: "Boost XP ×2 (1 partie)", icon: "⭐", cost: 200 },
    { id: "boost_time", name: "+30s départ", icon: "⏱️", cost: 150 },
    { id: "hat_gold", name: "Casquette dorée", icon: "🧢", cost: 400 },
  ];

  const defaultState = () => ({
    level: 1,
    xp: 0,
    xpToNext: 100,
    coins: 350,
    highScore: 0,
    tools: { pince: 1, sac: 1, balai: 1, brouette: 1 },
    cosmetics: { hat_gold: false },
    boosts: { xp: false, time: false },
    daily: {
      day: todayKey(),
      cleanBeaches: 0,
      collectObjects: 0,
      claimed: false,
      targets: { beaches: 3, objects: 50 },
    },
    totalRecycled: 0,
  });

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  let state = defaultState();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        state = defaultState();
        return state;
      }
      const parsed = JSON.parse(raw);
      state = { ...defaultState(), ...parsed };
      state.tools = { ...defaultState().tools, ...(parsed.tools || {}) };
      state.cosmetics = { ...defaultState().cosmetics, ...(parsed.cosmetics || {}) };
      state.boosts = { ...defaultState().boosts, ...(parsed.boosts || {}) };
      if (!parsed.daily || parsed.daily.day !== todayKey()) {
        state.daily = defaultState().daily;
      } else {
        state.daily = { ...defaultState().daily, ...parsed.daily };
      }
    } catch {
      state = defaultState();
    }
    return state;
  }

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function get() {
    return state;
  }

  function xpNeeded(level) {
    return 80 + level * 40 + Math.floor(level * level * 8);
  }

  function addXp(amount) {
    if (state.boosts.xp) amount = Math.floor(amount * 2);
    state.xp += amount;
    let leveled = 0;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level += 1;
      state.xpToNext = xpNeeded(state.level);
      leveled += 1;
      state.coins += 50 + state.level * 10;
    }
    save();
    return { amount, leveled };
  }

  function addCoins(n) {
    state.coins += n;
    save();
  }

  function spendCoins(n) {
    if (state.coins < n) return false;
    state.coins -= n;
    save();
    return true;
  }

  function upgradeTool(id) {
    const def = TOOL_DEFS[id];
    if (!def) return { ok: false, reason: "Outil inconnu" };
    const lv = state.tools[id] || 1;
    if (lv >= def.maxLevel) return { ok: false, reason: "Niveau max" };
    const cost = def.cost * lv;
    if (!spendCoins(cost)) return { ok: false, reason: "Pas assez de pièces" };
    state.tools[id] = lv + 1;
    save();
    return { ok: true, level: state.tools[id], cost };
  }

  function buyShopItem(id) {
    const item = SHOP_ITEMS.find((x) => x.id === id);
    if (!item) return { ok: false, reason: "Introuvable" };
    if (id === "hat_gold" && state.cosmetics.hat_gold) {
      return { ok: false, reason: "Déjà acheté" };
    }
    if (!spendCoins(item.cost)) return { ok: false, reason: "Pas assez de pièces" };
    if (id === "boost_xp") state.boosts.xp = true;
    if (id === "boost_time") state.boosts.time = true;
    if (id === "hat_gold") state.cosmetics.hat_gold = true;
    save();
    return { ok: true };
  }

  function consumeBoostsOnStart() {
    const used = { time: state.boosts.time, xp: state.boosts.xp };
    // XP boost lasts one full run; cleared after result. Time boost applied once at start.
    state.boosts.time = false;
    save();
    return used;
  }

  function clearXpBoost() {
    state.boosts.xp = false;
    save();
  }

  function recordRun({ score, recycled, beachClean }) {
    if (score > state.highScore) state.highScore = score;
    state.totalRecycled += recycled;
    state.daily.collectObjects += recycled;
    if (beachClean) state.daily.cleanBeaches += 1;
    save();
  }

  function canClaimDaily() {
    const d = state.daily;
    return (
      !d.claimed &&
      d.cleanBeaches >= d.targets.beaches &&
      d.collectObjects >= d.targets.objects
    );
  }

  function claimDaily() {
    if (!canClaimDaily()) return { ok: false };
    state.daily.claimed = true;
    state.coins += 500;
    addXp(200);
    save();
    return { ok: true, coins: 500, xp: 200 };
  }

  function toolStats() {
    const t = state.tools;
    return {
      pinceRange: TOOL_DEFS.pince.range(t.pince),
      pinceSpeed: TOOL_DEFS.pince.speed(t.pince),
      capacity: TOOL_DEFS.sac.capacity(t.sac) + TOOL_DEFS.brouette.capacity(t.brouette),
      resistance: TOOL_DEFS.sac.resistance(t.sac),
      balaiRadius: TOOL_DEFS.balai.radius(t.balai),
      balaiEff: TOOL_DEFS.balai.efficiency(t.balai),
      moveBonus: TOOL_DEFS.brouette.speedBonus(t.brouette),
      levels: { ...t },
    };
  }

  load();

  return {
    TOOL_DEFS,
    SHOP_ITEMS,
    load,
    save,
    get,
    addXp,
    addCoins,
    spendCoins,
    upgradeTool,
    buyShopItem,
    consumeBoostsOnStart,
    clearXpBoost,
    recordRun,
    canClaimDaily,
    claimDaily,
    toolStats,
    xpNeeded,
  };
})();
