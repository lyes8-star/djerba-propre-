/* HUD, panels, joystick — UI open-world réaliste */
const UI = (() => {
  const els = {};
  let currentMarketStall = null;

  function cache() {
    els.level = document.getElementById("hud-level");
    els.xpFill = document.getElementById("hud-xp-fill");
    els.xpLabel = document.getElementById("hud-xp-label");
    els.timer = document.getElementById("hud-timer");
    els.timerBox = document.querySelector(".hud-timer");
    els.score = document.getElementById("hud-score");
    els.stars = document.getElementById("hud-stars");
    els.coins = document.getElementById("hud-coins");
    els.objList = null;
    els.toast = document.getElementById("toast");
    els.talkBox = document.getElementById("hud-talk");
    els.talkWho = document.getElementById("talk-who");
    els.talkText = document.getElementById("talk-text");
    els.talkHint = document.getElementById("talk-hint");
    els.combo = document.getElementById("combo");
    els.panelOverlay = document.getElementById("panel-overlay");
    els.panelContent = document.getElementById("panel-content");
    els.titleStats = document.getElementById("title-stats");
    els.joyStick = document.getElementById("joy-stick");
    els.btnAction = document.getElementById("btn-action");
    els.actionLabel = document.getElementById("btn-action-label");
    els.avatar = null;
    els.bag = null;
    els.objPopup = null;
    els.water = document.getElementById("hud-water");
    els.weather = document.getElementById("hud-weather");
    els.marketOverlay = document.getElementById("market-overlay");
    els.marketTitle = document.getElementById("market-title");
    els.marketSub = document.getElementById("market-sub");
    els.marketCrisis = document.getElementById("market-crisis");
    els.marketStock = document.getElementById("market-stock");
    els.marketList = document.getElementById("market-list");
    els.marketDrinkRow = document.getElementById("market-drink-row");
  }

  function showScreen(id, fade = false) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("active");
    if (fade) {
      el.classList.remove("fade-in");
      void el.offsetWidth;
      el.classList.add("fade-in");
    }
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function starString(n) {
    return "*".repeat(n) + ".".repeat(3 - n);
  }

    function updateHud(progress, world, timeLeft) {
    const st = progress;
    if (els.level) els.level.textContent = `NV.${st.level}`;
    if (els.xpFill) els.xpFill.style.width = `${Math.min(100, (st.xp / st.xpToNext) * 100)}%`;
    const zone = window.__player ? Island.zoneLabel(Sprites.zoneAt(window.__player.x, window.__player.y)) : "DJERBA";
    if (els.timer) els.timer.textContent = zone;
    if (els.timerBox) els.timerBox.classList.remove("urgent");
    if (els.coins) els.coins.textContent = `$${st.coins}`;
    if (els.water) {
      const thirst = Math.round((st.water && st.water.thirst) || 100);
      const bottles = Progress.waterStockTotal();
      els.water.textContent = `💧${thirst}`;
      els.water.title = `Soif ${thirst}% · ${bottles} bouteille(s)`;
      els.water.classList.toggle("low", thirst <= 25);
      els.water.classList.toggle("crit", thirst <= 10);
    }

    const missionLabel = document.getElementById("hud-mission");
    const questBar = document.getElementById("hud-quest-bar");
    if (missionLabel && typeof Quests !== "undefined") {
      const qPanel = Quests.panel();
      let questText = "Explore l'île";
      if (qPanel.active.length) {
        const q = qPanel.active[0];
        questText = q.value ? `${q.label} — ${q.value}` : q.label;
      } else if (qPanel.done.length) {
        questText = `Quêtes ${qPanel.done.length}/${qPanel.total} terminées`;
      }
      missionLabel.textContent = questText;
      if (questBar) questBar.classList.remove("hidden");
    }
  }

  function toast(html, ms = 1800) {
    els.toast.innerHTML = html;
    els.toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.add("hidden"), ms);
  }

  function talkBox(who, text, more) {
    if (!els.talkBox) return;
    els.talkWho.textContent = who || "";
    els.talkText.textContent = text || "";
    if (els.talkHint) {
      els.talkHint.textContent = more ? "SUITE  ·  E / PARLER" : "";
      els.talkHint.classList.toggle("hidden", !more);
    }
    els.talkBox.classList.remove("hidden");
    els.talkBox.scrollTop = 0;
    clearTimeout(talkBox._t);
  }

  function hideTalk() {
    if (!els.talkBox) return;
    els.talkBox.classList.add("hidden");
    clearTimeout(talkBox._t);
  }

  function showCombo(n) {
    if (!els.combo || n < 2) return;
    els.combo.textContent = `COMBO x${n}`;
    els.combo.classList.remove("hidden");
    clearTimeout(showCombo._t);
    showCombo._t = setTimeout(() => els.combo.classList.add("hidden"), 700);
  }

  function refreshTitleStats() {
    const s = Progress.get();
    const qn = Progress.questsDone();
    els.titleStats.innerHTML = `NV.${s.level} · $${s.coins} · ${qn}/11 quêtes`;
  }

  function renderMarketDrink() {
    if (!els.marketDrinkRow) return;
    const stock = Progress.get().water.stock || {};
    const ids = ["b05", "b15", "bidon", "cistern", "premium"];
    const labels = { b05: "0.5L", b15: "1.5L", bidon: "5L", cistern: "CT", premium: "++" };
    els.marketDrinkRow.innerHTML = ids
      .filter((id) => (stock[id] || 0) > 0)
      .map((id) => `<button class="btn-buy btn-drink" data-drink="${id}">${labels[id]} x${stock[id]}</button>`)
      .join("") || `<span class="market-empty">Aucune bouteille — achète ci-dessus</span>`;
    els.marketDrinkRow.querySelectorAll("[data-drink]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-drink");
        const res = Market.drink(id);
        if (res.ok) {
          AudioSys.sfx("pickup");
          toast(`EAU!<br/>+${res.gain} soif · ${Math.round(res.thirst)}%`);
          refreshWaterMarket(currentMarketStall);
          if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
        } else toast(res.reason || "Impossible");
      });
    });
  }

  function refreshWaterMarket(stall) {
    if (!stall || !els.marketList) return;
    const info = Market.panelLines();
    const items = Market.catalog(stall);
    const stock = Progress.get().water.stock || {};
    const total = Progress.waterStockTotal();
    const coins = Progress.get().coins;
    if (els.marketTitle) els.marketTitle.textContent = stall.name.toUpperCase();
    if (els.marketSub) els.marketSub.textContent = `${stall.sub} · Monde ouvert Djerba 2`;
    if (els.marketCrisis) {
      els.marketCrisis.textContent = `Pénurie ${info.label} — prix x${info.mult.toFixed(2)} (${info.shortage}%)`;
      els.marketCrisis.classList.toggle("crit", info.shortage >= 80);
    }
    if (els.marketStock) els.marketStock.textContent = `Sac à eau : ${total} bouteille(s) · Soif ${Math.round((Progress.get().water.thirst) || 100)}%`;
    els.marketList.innerHTML = items.map((item) => {
      const owned = stock[item.id] || 0;
      return `<div class="shop-row market-row">
        <div class="tool-icon">${item.icon}</div>
        <div class="tool-info"><strong>${item.name}</strong><span>$${item.cost} · ${item.blurb}${owned ? ` · x${owned}` : ""}</span></div>
        <button class="btn-buy" data-water="${item.id}" ${coins < item.cost ? "disabled" : ""}>Acheter</button>
      </div>`;
    }).join("");
    els.marketList.querySelectorAll("[data-water]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-water");
        const res = Market.buy(id);
        if (res.ok) {
          AudioSys.sfx("upgrade");
          toast(`ACHAT!<br/>${res.name}<span class="bonus">+$${res.cost} · +${res.thirst} soif si bu</span>`);
          if (typeof Quests !== "undefined") Quests.onWaterBuy(window.__world);
          refreshWaterMarket(stall);
          els.coins.textContent = `$${Progress.get().coins}`;
          if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
        } else toast(res.reason || "Impossible");
      });
    });
    renderMarketDrink();
  }

  function openWaterMarket(stall) {
    if (!els.marketOverlay) return;
    currentMarketStall = stall;
    refreshWaterMarket(stall);
    els.marketOverlay.classList.remove("hidden");
  }

  function closeWaterMarket() {
    if (!els.marketOverlay) return;
    els.marketOverlay.classList.add("hidden");
    currentMarketStall = null;
  }

  function drawAvatar(t) {
    if (!els.avatar) return;
    const ctx = els.avatar.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    Sprites.drawAvatar(ctx, Progress.get().cosmetics.hat_gold, t || 0);
  }

  function openPanel() {
    const s = Progress.get();
    const tools = Progress.TOOL_DEFS;
    const equipped = window.__getTool ? window.__getTool() : "pince";
    const qPanel = typeof Quests !== "undefined" ? Quests.panel() : { active: [], todo: [], done: [], total: 0 };

    let html = `<div class="menu-section"><h3>Quête</h3>`;
    if (qPanel.active.length) {
      const q = qPanel.active[0];
      html += `<div class="quest-active">
        <strong>${q.label}</strong>
        <span>${q.value || "Parle aux habitants avec !"}</span>
      </div>`;
    } else {
      html += `<p class="menu-hint">Parle aux habitants marqués ! pour découvrir des quêtes.</p>`;
    }
    if (qPanel.done.length || qPanel.todo.length) {
      html += `<p class="menu-meta">${qPanel.done.length}/${qPanel.total} quêtes terminées</p>`;
    }
    html += `</div>`;

    html += `<div class="menu-section"><h3>Outil</h3><div class="tool-toggle">`;
    for (const id of ["pince", "balai"]) {
      const d = tools[id];
      const on = equipped === id;
      html += `<button class="tool-btn${on ? " on" : ""}" data-equip="${id}">${d.icon} ${d.name}</button>`;
    }
    html += `</div>`;
    if (window.__player) {
      const p = window.__player;
      html += `<p class="menu-meta">Sac ${p.inventory.length}/${p.stats.capacity}</p>`;
    }
    html += `</div>`;

    els.panelContent.innerHTML = html;
    els.panelOverlay.classList.remove("hidden");

    els.panelContent.querySelectorAll("[data-equip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-equip");
        if (window.__setTool) window.__setTool(id);
        AudioSys.sfx("click");
        openPanel();
      });
    });
  }

  function closePanel() {
    els.panelOverlay.classList.add("hidden");
  }

  function toggleObjectives() {
    if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
  }

  function setupJoystick(input) {
    const root = document.getElementById("joystick");
    const stick = els.joyStick;
    let active = false;
    let pid = null;

    function setStick(dx, dy) {
      const max = 36;
      const m = Math.hypot(dx, dy) || 1;
      const cl = Math.min(1, Math.hypot(dx, dy) / max);
      const nx = (dx / m) * cl * max;
      const ny = (dy / m) * cl * max;
      stick.style.transform = `translate(${nx}px, ${ny}px)`;
      input.x = (dx / m) * cl;
      input.y = (dy / m) * cl;
      if (Math.hypot(dx, dy) < 6) {
        input.x = 0;
        input.y = 0;
        stick.style.transform = "translate(0,0)";
      }
    }

    function onStart(e) {
      e.preventDefault();
      active = true;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      pid = t.identifier ?? "mouse";
      const rect = root.getBoundingClientRect();
      setStick(t.clientX - (rect.left + rect.width / 2), t.clientY - (rect.top + rect.height / 2));
    }
    function onMove(e) {
      if (!active) return;
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      const t = touches.find((x) => (x.identifier ?? "mouse") === pid) || touches[0];
      if (!t) return;
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      setStick(t.clientX - (rect.left + rect.width / 2), t.clientY - (rect.top + rect.height / 2));
    }
    function onEnd(e) {
      if (!active) return;
      if (e.changedTouches && !Array.from(e.changedTouches).some((x) => x.identifier === pid)) return;
      active = false;
      pid = null;
      input.x = 0;
      input.y = 0;
      stick.style.transform = "translate(0,0)";
    }

    root.addEventListener("touchstart", onStart, { passive: false });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd);
    root.addEventListener("touchcancel", onEnd);
    root.addEventListener("mousedown", onStart);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
  }

  function showResult({ score, stars, xp, coins, title }) {
    document.getElementById("result-title").textContent = title;
    const starsEl = document.getElementById("result-stars");
    starsEl.textContent = starString(stars);
    starsEl.classList.remove("pop");
    void starsEl.offsetWidth;
    starsEl.classList.add("pop");
    document.getElementById("result-score").textContent = score.toLocaleString("fr-FR");
    document.getElementById("result-xp").textContent = `+${xp} XP`;
    document.getElementById("result-coins").textContent = `+$${coins}`;
    showScreen("screen-result", true);
  }

  function setToolLabel(name) {
    if (els.actionLabel) els.actionLabel.textContent = name;
  }

  return {
    cache,
    showScreen,
    updateHud,
    toast,
    talkBox,
    hideTalk,
    showCombo,
    refreshTitleStats,
    openPanel,
    closePanel,
    toggleObjectives,
    setupJoystick,
    showResult,
    drawAvatar,
    setToolLabel,
    formatTime,
    starString,
    openWaterMarket,
    closeWaterMarket,
    refreshWaterMarket,
  };
})();
