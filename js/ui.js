/* HUD, panels, joystick, toasts — pixel UI */
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
    els.objList = document.getElementById("obj-list");
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
    els.avatar = document.getElementById("hud-avatar");
    els.bag = document.getElementById("hud-bag");
    els.objPopup = document.getElementById("hud-objectives");
    els.water = document.getElementById("hud-water");
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
    els.level.textContent = `NV.${st.level}`;
    els.xpFill.style.width = `${Math.min(100, (st.xp / st.xpToNext) * 100)}%`;
    if (els.xpLabel) els.xpLabel.textContent = `${st.xp}/${st.xpToNext}`;
    const zone = window.__player ? Island.zoneLabel(Sprites.zoneAt(window.__player.x, window.__player.y)) : "DJERBA";
    els.timer.textContent = zone;
    if (els.timerBox) els.timerBox.classList.remove("urgent");
    const scoreTxt = world.score.toLocaleString("fr-FR");
    if (els.score.textContent !== scoreTxt) {
      els.score.textContent = scoreTxt;
      els.score.classList.remove("bump");
      void els.score.offsetWidth;
      els.score.classList.add("bump");
    }
    const clean = World.cleanliness(world);
    els.stars.textContent = starString(World.stars(world.score, clean));
    els.coins.textContent = `$${st.coins}`;
    if (els.bag && window.__player) {
      const p = window.__player;
      let bagTxt = `BAG ${p.inventory.length}/${p.stats.capacity}`;
      const cafeMs = Progress.cafeLeft();
      if (cafeMs > 0) bagTxt += ` · CAFE ${Math.ceil(cafeMs / 1000)}s`;
      els.bag.textContent = bagTxt;
    }
    if (els.water) {
      const thirst = Math.round((st.water && st.water.thirst) || 100);
      const bottles = Progress.waterStockTotal();
      els.water.textContent = `💧${thirst}`;
      els.water.title = `Soif ${thirst}% · ${bottles} bouteille(s)`;
      els.water.classList.toggle("low", thirst <= 25);
      els.water.classList.toggle("crit", thirst <= 10);
    }

    const missionLabel = document.getElementById("hud-mission");
    if (missionLabel && typeof Quests !== "undefined") {
      missionLabel.textContent = Quests.hudChip() || "LIBRE";
    }

    const qPanel = typeof Quests !== "undefined" ? Quests.panel() : { active: [], todo: [], done: [], total: 0 };
    const dailies = Progress.dailyList();
    const qHtml = []
      .concat(qPanel.active.map((o) => `<li class="q-active">[>] ${o.label}<span class="q-hint">${o.value}</span></li>`))
      .concat(qPanel.todo.map((o) => `<li class="q">[  ] ${o.label}</li>`))
      .concat(qPanel.done.length ? [`<li class="done">[OK] ${qPanel.done.length}/${qPanel.total} quetes</li>`] : [])
      .concat(dailies.map((o) => {
        const done = o.cur >= o.need;
        return `<li class="${done ? "done" : ""}">${done ? "[OK] " : "[  ] "}${o.label} ${Math.min(o.cur, o.need)}/${o.need}</li>`;
      }))
      .join("");
    els.objList.innerHTML = qHtml;
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
    const bottles = Progress.waterStockTotal();
    els.titleStats.innerHTML = `NV.${s.level} · $${s.coins}<br>QUETES ${qn}/11 · 💧${bottles}`;
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
        <button class="btn-buy" data-water="${item.id}" ${s.coins < item.cost ? "disabled" : ""}>BUY</button>
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

  function openPanel(name) {
    const s = Progress.get();
    const tools = Progress.TOOL_DEFS;
    let html = "";

    if (name === "outils") {
      const equipped = window.__getTool ? window.__getTool() : "pince";
      const bagNow = window.__player ? window.__player.inventory.length : 0;
      const stats = Progress.toolStats();
      html = `<h3>OUTILS</h3>`;
      for (const id of ["pince", "sac", "balai", "brouette"]) {
        const d = tools[id];
        const on = d.equip && equipped === id;
        html += `<div class="tool-row${on ? " equipped" : ""}">
          <div class="tool-icon">${d.icon}</div>
          <div class="tool-info"><strong>${d.name}${on ? " · EQUIPE" : ""}</strong><span>${d.desc(s.tools[id])}</span></div>
          ${d.equip
            ? `<button class="btn-buy" data-equip="${id}" ${on ? "disabled" : ""}>${on ? "OK" : "EQUIPER"}</button>`
            : `<span class="tool-passive">PASSIF</span>`}
        </div>`;
      }
      html += `<p style="font-size:6px;opacity:.8;margin:8px 0 0;line-height:1.6">BAG ${bagNow}/${stats.capacity} · marche +${Math.round(stats.moveBonus * 100)}%<br>Pince ramasse · Balai balaye · Vider a une poubelle de ville</p>`;
    }

    if (name === "ameliorations") {
      html = `<h3>UPGRADES</h3>`;
      for (const id of ["pince", "sac", "balai", "brouette"]) {
        const d = tools[id];
        const lv = s.tools[id];
        const cost = d.cost * lv;
        const max = lv >= d.maxLevel;
        html += `<div class="tool-row">
          <div class="tool-icon">${d.icon}</div>
          <div class="tool-info"><strong>${d.name} LV.${lv}</strong><span>${d.desc(lv)}</span></div>
          <button class="btn-buy" data-upgrade="${id}" ${max || s.coins < cost ? "disabled" : ""}>
            ${max ? "MAX" : "$" + cost}
          </button>
        </div>`;
      }
    }

    if (name === "defis") {
      const d = s.daily;
      html = `<h3>DEFIS DU JOUR</h3>`;
      for (const row of Progress.dailyList()) {
        const ok = row.cur >= row.need;
        html += `<div class="daily-row"><div class="tool-info">
          <strong>${row.label}</strong>
          <span>${Math.min(row.cur, row.need)}/${row.need}${ok ? " · OK" : ""}</span>
        </div></div>`;
      }
      html += `<button class="btn-claim" id="btn-claim-daily" ${Progress.canClaimDaily() ? "" : "disabled"}>
          ${d.claimed ? "DEJA PRIS" : "RECUPERER"}
        </button>`;
    }

    if (name === "boutique") {
      html = `<h3>SHOP</h3>`;
      const cafeMs = Progress.cafeLeft();
      for (const item of Progress.SHOP_ITEMS) {
        let extra = item.blurb || "";
        let owned = false;
        if (item.id === "hat_gold") owned = s.cosmetics.hat_gold;
        if (item.id === "boost_xp" && s.boosts.xpCharges > 0) extra = `${s.boosts.xpCharges} gains restants`;
        if (item.id === "cafe" && cafeMs > 0) extra = `Encore ${Math.ceil(cafeMs / 1000)}s`;
        html += `<div class="shop-row">
          <div class="tool-icon">${item.icon}</div>
          <div class="tool-info"><strong>${item.name}</strong><span>$${item.cost} · ${extra}</span></div>
          <button class="btn-buy" data-shop="${item.id}" ${owned || s.coins < item.cost ? "disabled" : ""}>
            ${owned ? "OK" : "BUY"}
          </button>
        </div>`;
      }
    }

    els.panelContent.innerHTML = html;
    els.panelOverlay.classList.remove("hidden");

    els.panelContent.querySelectorAll("[data-upgrade]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-upgrade");
        const res = Progress.upgradeTool(id);
        if (res.ok) {
          AudioSys.sfx("upgrade");
          toast(`UPGRADE!<br/>${tools[id].name} LV.${res.level}<span class="bonus">${tools[id].desc(res.level)}</span>`, 2200);
          if (window.__playerRefresh) window.__playerRefresh();
          openPanel("ameliorations");
          if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
          els.coins.textContent = `$${Progress.get().coins}`;
        } else toast(res.reason || "Impossible");
      });
    });

    els.panelContent.querySelectorAll("[data-equip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-equip");
        if (window.__setTool) window.__setTool(id);
        AudioSys.sfx("click");
        openPanel("outils");
      });
    });

    els.panelContent.querySelectorAll("[data-shop]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-shop");
        const res = Progress.buyShopItem(id);
        if (res.ok) {
          AudioSys.sfx("upgrade");
          if (id === "hat_gold") toast("CASQUETTE OR<br/>equipee");
          else if (id === "boost_xp") toast("XP x2<br/>5 prochains gains");
          else if (id === "cafe") toast("CAFE SERRE<br/>+25% vitesse 90s");
          else toast("ACHAT OK!");
          openPanel("boutique");
          els.coins.textContent = `$${Progress.get().coins}`;
          if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
        } else toast(res.reason || "Impossible");
      });
    });

    const claim = document.getElementById("btn-claim-daily");
    if (claim) {
      claim.addEventListener("click", () => {
        const res = Progress.claimDaily();
        if (res.ok) {
          AudioSys.sfx("levelup");
          toast(`RECOMPENSE!<br/>+$${res.coins} +${res.xp} XP`);
          openPanel("defis");
          els.coins.textContent = `$${Progress.get().coins}`;
          if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
        }
      });
    }
  }

  function closePanel() {
    els.panelOverlay.classList.add("hidden");
  }

  function toggleObjectives(forceOn) {
    if (!els.objPopup) return;
    if (forceOn) els.objPopup.classList.remove("hidden");
    else els.objPopup.classList.toggle("hidden");
    if (!els.objPopup.classList.contains("hidden")) {
      clearTimeout(toggleObjectives._t);
      toggleObjectives._t = setTimeout(() => els.objPopup.classList.add("hidden"), 7000);
    }
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
