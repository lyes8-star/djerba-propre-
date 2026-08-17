/* HUD, panels, joystick, toasts — pixel UI */
const UI = (() => {
  const els = {};

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
    els.combo = document.getElementById("combo");
    els.panelOverlay = document.getElementById("panel-overlay");
    els.panelContent = document.getElementById("panel-content");
    els.titleStats = document.getElementById("title-stats");
    els.joyStick = document.getElementById("joy-stick");
    els.btnAction = document.getElementById("btn-action");
    els.actionLabel = document.getElementById("btn-action-label");
    els.avatar = document.getElementById("hud-avatar");
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
    els.timer.textContent = formatTime(timeLeft);
    if (els.timerBox) els.timerBox.classList.toggle("urgent", timeLeft <= 10);
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

    els.objList.innerHTML = World.objectives(world)
      .map((o) => `<li class="${o.done ? "done" : ""}">${o.done ? "[OK] " : "[  ] "}${o.label} ${o.value}</li>`)
      .join("");
  }

  function toast(html, ms = 1800) {
    els.toast.innerHTML = html;
    els.toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.add("hidden"), ms);
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
    els.titleStats.innerHTML = `NV.${s.level} · $*${s.coins}<br>CAMPAGNE ${s.campaign.unlocked}/8<br>ETOILES ${Progress.totalStars()}/24`;
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
      html = `<h3>OUTILS</h3>`;
      for (const id of ["pince", "sac", "balai", "brouette"]) {
        const d = tools[id];
        html += `<div class="tool-row">
          <div class="tool-icon">${d.icon}</div>
          <div class="tool-info"><strong>${d.name}</strong><span>${d.desc(s.tools[id])}</span></div>
        </div>`;
      }
      html += `<p style="font-size:6px;opacity:.8;margin:8px 0 0;line-height:1.6">PINCE = ramasser<br>Pres poubelle = recycler<br>Q / bouton = balai</p>`;
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
      html = `<h3>DEFIS DU JOUR</h3>
        <div class="daily-row"><div class="tool-info">
          <strong>Nettoyer ${d.targets.beaches} plages</strong>
          <span>${d.cleanBeaches}/${d.targets.beaches}</span>
        </div></div>
        <div class="daily-row"><div class="tool-info">
          <strong>Collecter ${d.targets.objects} objets</strong>
          <span>${d.collectObjects}/${d.targets.objects}</span>
        </div></div>
        <button class="btn-claim" id="btn-claim-daily" ${Progress.canClaimDaily() ? "" : "disabled"}>
          ${d.claimed ? "DEJA PRIS" : "RECUPERER"}
        </button>`;
    }

    if (name === "boutique") {
      html = `<h3>SHOP</h3>`;
      for (const item of Progress.SHOP_ITEMS) {
        let owned = false;
        if (item.id === "hat_gold") owned = s.cosmetics.hat_gold;
        if (item.id === "boost_xp") owned = s.boosts.xp;
        if (item.id === "boost_time") owned = s.boosts.time;
        html += `<div class="shop-row">
          <div class="tool-icon">${item.icon}</div>
          <div class="tool-info"><strong>${item.name}</strong><span>$${item.cost}</span></div>
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
          toast(`UPGRADE!<br/>${tools[id].name} LV.${res.level}`);
          if (window.__playerRefresh) window.__playerRefresh();
          openPanel("ameliorations");
          if (window.__world) updateHud(Progress.get(), window.__world, window.__timeLeft || 0);
          els.coins.textContent = `$${Progress.get().coins}`;
        } else toast(res.reason || "Impossible");
      });
    });

    els.panelContent.querySelectorAll("[data-shop]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-shop");
        const res = Progress.buyShopItem(id);
        if (res.ok) {
          AudioSys.sfx("upgrade");
          toast("ACHAT OK!");
          openPanel("boutique");
          els.coins.textContent = `$${Progress.get().coins}`;
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
        }
      });
    }
  }

  function closePanel() {
    els.panelOverlay.classList.add("hidden");
  }

  function setupJoystick(input) {
    const root = document.getElementById("joystick");
    const stick = els.joyStick;
    let active = false;
    let pid = null;

    function setStick(dx, dy) {
      const max = 30;
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
    showCombo,
    refreshTitleStats,
    openPanel,
    closePanel,
    setupJoystick,
    showResult,
    drawAvatar,
    setToolLabel,
    formatTime,
    starString,
  };
})();
