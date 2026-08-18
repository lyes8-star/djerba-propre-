/* Progress, save/load, tools, XP, daily challenges */
const Progress = (() => {
  const SAVE_KEY = "djerba-propre-save";

  const TOOL_DEFS = {
    pince: {
      id: "pince",
      name: "Pince (Scorpion)",
      icon: "P",
      cost: 500,
      maxLevel: 5,
      equip: true,
      desc: (lv) => `Portee ${40 + lv * 8}px · action x${(1 + lv * 0.25).toFixed(2)}`,
      range: (lv) => 40 + lv * 8,
      speed: (lv) => 1 + lv * 0.25,
    },
    sac: {
      id: "sac",
      name: "Sac",
      icon: "S",
      cost: 700,
      maxLevel: 5,
      equip: false,
      desc: (lv) => `Capacite ${8 + lv * 4} · tri +${Math.round(0.05 * lv * 100)}%`,
      capacity: (lv) => 8 + lv * 4,
      resistance: (lv) => 0.05 * lv,
    },
    balai: {
      id: "balai",
      name: "Balai",
      icon: "B",
      cost: 300,
      maxLevel: 5,
      equip: true,
      desc: (lv) => `Rayon ${28 + lv * 8}px · balayage x${(0.5 + lv * 0.25).toFixed(2)}`,
      radius: (lv) => 28 + lv * 8,
      efficiency: (lv) => 0.5 + lv * 0.25,
    },
    brouette: {
      id: "brouette",
      name: "Brouette",
      icon: "R",
      cost: 600,
      maxLevel: 5,
      equip: false,
      desc: (lv) => `+${5 + lv * 5} places · marche +${Math.round(0.1 * lv * 100)}%`,
      capacity: (lv) => 5 + lv * 5,
      speedBonus: (lv) => 0.1 * lv,
    },
  };

  const SHOP_ITEMS = [
    { id: "hat_gold", name: "Casquette or", icon: "H", cost: 400, blurb: "Chapeau dore, tout de suite" },
    { id: "boost_xp", name: "XP x2 (5 gains)", icon: "X", cost: 200, blurb: "Double les 5 prochains XP" },
    { id: "cafe", name: "Cafe serre 90s", icon: "C", cost: 180, blurb: "+25% vitesse pendant 90s" },
  ];

  const defaultState = () => ({
    level: 1,
    xp: 0,
    xpToNext: 100,
    coins: 350,
    highScore: 0,
    tools: { pince: 1, sac: 1, balai: 1, brouette: 1 },
    cosmetics: { hat_gold: false },
    boosts: { xpCharges: 0, cafeUntil: 0 },
    daily: {
      day: todayKey(),
      pick: 0,
      recycle: 0,
      quests: 0,
      claimed: false,
      targets: { pick: 40, recycle: 15, quests: 1 },
    },
    totalRecycled: 0,
    campaign: {
      unlocked: 1,
      introSeen: false,
      endingSeen: false,
      stars: {},
      bestScore: {},
    },
    quests: {},
    qFlags: {},
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
      if (parsed.boosts && parsed.boosts.xp === true && !state.boosts.xpCharges) {
        state.boosts.xpCharges = 5;
      }
      delete state.boosts.xp;
      delete state.boosts.time;
      state.campaign = {
        ...defaultState().campaign,
        ...(parsed.campaign || {}),
        stars: { ...(parsed.campaign && parsed.campaign.stars) },
        bestScore: { ...(parsed.campaign && parsed.campaign.bestScore) },
      };
      state.quests = { ...(parsed.quests || {}) };
      state.qFlags = { ...(parsed.qFlags || {}) };
      if (!parsed.daily || parsed.daily.day !== todayKey() || parsed.daily.pick == null) {
        state.daily = defaultState().daily;
      } else {
        state.daily = {
          ...defaultState().daily,
          ...parsed.daily,
          targets: { ...defaultState().daily.targets, ...(parsed.daily.targets || {}) },
        };
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
    if ((state.boosts.xpCharges || 0) > 0) {
      amount = Math.floor(amount * 2);
      state.boosts.xpCharges -= 1;
    }
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
    if (id === "boost_xp") state.boosts.xpCharges = (state.boosts.xpCharges || 0) + 5;
    if (id === "cafe") state.boosts.cafeUntil = Date.now() + 90000;
    if (id === "hat_gold") state.cosmetics.hat_gold = true;
    save();
    return { ok: true };
  }

  function consumeBoostsOnStart() {
    return { time: false, xp: (state.boosts.xpCharges || 0) > 0 };
  }

  function clearXpBoost() {
    state.boosts.xpCharges = 0;
    save();
  }

  function cafeBonus() {
    return Date.now() < (state.boosts.cafeUntil || 0) ? 0.25 : 0;
  }

  function cafeLeft() {
    const left = (state.boosts.cafeUntil || 0) - Date.now();
    return left > 0 ? left : 0;
  }

  function dailyList() {
    const d = state.daily;
    const t = d.targets;
    return [
      { id: "pick", label: "Ramasser 40 dechets", cur: d.pick || 0, need: t.pick },
      { id: "recycle", label: "Recycler 15 sacs", cur: d.recycle || 0, need: t.recycle },
      { id: "quests", label: "Finir 1 quete", cur: d.quests || 0, need: t.quests },
    ];
  }

  function bumpDaily(key, n) {
    if (state.daily.day !== todayKey() || state.daily.pick == null) {
      state.daily = defaultState().daily;
    }
    state.daily[key] = (state.daily[key] || 0) + n;
    save();
  }

  function notePickup(n) {
    if (n > 0) bumpDaily("pick", n);
  }

  function noteRecycle(n) {
    if (n > 0) {
      state.totalRecycled += n;
      bumpDaily("recycle", n);
    }
  }

  function noteQuest() {
    bumpDaily("quests", 1);
  }

  function questsDone() {
    return Object.values(state.quests || {}).filter((v) => v === "done").length;
  }

  function recordRun({ score }) {
    if (score > state.highScore) state.highScore = score;
    save();
  }

  function isUnlocked(missionId) {
    return missionId <= (state.campaign.unlocked || 1);
  }

  function markIntroSeen() {
    state.campaign.introSeen = true;
    save();
  }

  function markEndingSeen() {
    state.campaign.endingSeen = true;
    save();
  }

  function totalStars() {
    return Object.values(state.campaign.stars || {}).reduce((a, b) => a + (b || 0), 0);
  }

  function canClaimDaily() {
    const d = state.daily;
    const t = d && d.targets;
    if (!t) return false;
    return !d.claimed && (d.pick || 0) >= t.pick && (d.recycle || 0) >= t.recycle && (d.quests || 0) >= t.quests;
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
    cafeBonus,
    cafeLeft,
    dailyList,
    notePickup,
    noteRecycle,
    noteQuest,
    questsDone,
    recordRun,
    canClaimDaily,
    claimDaily,
    toolStats,
    xpNeeded,
    isUnlocked,
    markIntroSeen,
    markEndingSeen,
    totalStars,
  };
})();
