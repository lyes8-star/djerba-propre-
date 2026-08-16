/* DJERBA PROPRE — main game loop & state machine */
(() => {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const titleCanvas = document.getElementById("title-canvas");
  const titleCtx = titleCanvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  titleCtx.imageSmoothingEnabled = false;

  const input = { x: 0, y: 0, keys: {} };
  let state = "title"; // title | play | pause | result
  let world = null;
  let player = null;
  let timeLeft = 180;
  let lastTs = 0;
  let selectedTool = "pince"; // pince | balai
  let holdAction = false;
  let cleanToastShown = false;
  let raf = 0;

  function resizeCanvasDisplay() {
    // logical size fixed; CSS scales
    ctx.imageSmoothingEnabled = false;
  }

  function drawTitle() {
    Sprites.drawTitleScene(titleCtx);
  }

  function startGame() {
    AudioSys.unlock();
    AudioSys.startMusic();
    const boosts = Progress.consumeBoostsOnStart();
    const stats = Progress.toolStats();
    world = World.create(Progress.get().level);
    player = Player.create(stats);
    window.__world = world;
    window.__playerRefresh = () => {
      if (!player) return;
      player.stats = Progress.toolStats();
    };
    timeLeft = 180 + (boosts.time ? 30 : 0);
    window.__timeLeft = timeLeft;
    cleanToastShown = false;
    selectedTool = "pince";
    document.getElementById("btn-action").querySelector("span").textContent =
      selectedTool === "balai" ? "BALAI" : "PINCE";
    UI.closePanel();
    UI.showScreen("screen-game");
    state = "play";
    UI.updateHud(Progress.get(), world, timeLeft);
    lastTs = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function endGame(reason) {
    state = "result";
    const clean = World.cleanliness(world);
    const beachClean = clean >= 80;
    const stars = World.stars(world.score, clean);
    const baseXp = Math.floor(world.score / 20) + world.recycled * 5 + stars * 40;
    const baseCoins = Math.floor(world.score / 50) + stars * 30;

    Progress.recordRun({
      score: world.score,
      recycled: world.recycled,
      beachClean,
    });
    const xpRes = Progress.addXp(baseXp);
    Progress.addCoins(baseCoins);
    Progress.clearXpBoost();

    if (xpRes.leveled > 0) AudioSys.sfx("levelup");
    else if (stars >= 2) AudioSys.sfx("super");
    else if (reason === "time") AudioSys.sfx("fail");

    UI.showResult({
      score: world.score,
      stars,
      xp: xpRes.amount,
      coins: baseCoins,
      title:
        reason === "time"
          ? clean >= 80
            ? "Plage propre !"
            : "Temps écoulé"
          : "Plage terminée !",
    });
    UI.refreshTitleStats();
  }

  function doAction() {
    if (state !== "play" || !player) return;
    const res = Player.action(player, world, selectedTool);
    if (!res) return;
    if (res.type === "pickup") {
      AudioSys.sfx("pickup");
    } else if (res.type === "recycle") {
      AudioSys.sfx("recycle");
      UI.toast(`Recyclé ! +${res.pts} pts<br/><span class="bonus">${res.count} objets</span>`);
    } else if (res.type === "sweep") {
      AudioSys.sfx("pickup");
    } else if (res.type === "full") {
      UI.toast("Sac plein ! Va recycler");
    }
  }

  function checkObjectives() {
    const clean = World.cleanliness(world);
    if (!cleanToastShown && clean >= 80) {
      cleanToastShown = true;
      world.score += 500;
      timeLeft += 30;
      AudioSys.sfx("super");
      UI.toast(`SUPER!<br/>Plage propre! +500 pts<span class="bonus">+30s</span>`, 2200);
    }
    const objs = World.objectives(world);
    if (objs.every((o) => o.done) && player.inventory.length === 0) {
      endGame("clear");
    }
  }

  function render() {
    const W = world.W;
    const H = world.H;
    Sprites.drawWorldBg(ctx, W, H, 0);
    // trash
    for (const t of World.living(world)) {
      Sprites.drawTrash(ctx, t);
    }
    Sprites.drawBin(ctx, world.bin.x, world.bin.y);
    const goldHat = Progress.get().cosmetics.hat_gold;
    Sprites.drawPlayer(ctx, player, goldHat);

    // inventory pips
    ctx.fillStyle = "rgba(13,58,102,0.75)";
    ctx.fillRect(4, H - 14, 50, 10);
    ctx.fillStyle = "#f5c842";
    ctx.font = "6px monospace";
    ctx.fillText(`${player.inventory.length}/${player.stats.capacity}`, 6, H - 6);

    Sprites.drawMinimap(ctx, W, H, World.living(world), player);
  }

  function loop(ts) {
    if (state !== "play") return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    Player.update(player, dt, input, world);
    World.tickSpawn(world, dt);
    if (holdAction && selectedTool === "balai") {
      if (player.cooldown <= 0) doAction();
    }

    timeLeft -= dt;
    window.__timeLeft = timeLeft;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endGame("time");
      return;
    }

    checkObjectives();
    render();
    UI.updateHud(Progress.get(), world, timeLeft);
    raf = requestAnimationFrame(loop);
  }

  function setupKeys() {
    window.addEventListener("keydown", (e) => {
      input.keys[e.key.toLowerCase()] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase()) || e.key === " ") {
        e.preventDefault();
      }
      if (e.key === " " || e.key === "e" || e.key === "E") doAction();
      if (e.key === "q" || e.key === "Q") {
        selectedTool = selectedTool === "pince" ? "balai" : "pince";
        document.getElementById("btn-action").querySelector("span").textContent =
          selectedTool === "balai" ? "BALAI" : "PINCE";
        AudioSys.sfx("click");
      }
      if (e.key === "Escape" && state === "play") pauseGame();
      syncKeyInput();
    });
    window.addEventListener("keyup", (e) => {
      input.keys[e.key.toLowerCase()] = false;
      syncKeyInput();
    });
  }

  function syncKeyInput() {
    let x = 0;
    let y = 0;
    if (input.keys["arrowleft"] || input.keys["a"]) x -= 1;
    if (input.keys["arrowright"] || input.keys["d"]) x += 1;
    if (input.keys["arrowup"] || input.keys["w"]) y -= 1;
    if (input.keys["arrowdown"] || input.keys["s"]) y += 1;
    // don't override joystick if it's active (non-zero from touch) — merge lightly
    if (!input._joyActive) {
      input.x = x;
      input.y = y;
    } else if (x || y) {
      input.x = x;
      input.y = y;
    }
  }

  function pauseGame() {
    if (state !== "play") return;
    state = "pause";
    UI.showScreen("screen-pause");
    // keep game screen under? showScreen hides others — re-show game underneath via pause overlay only
    document.getElementById("screen-game").classList.add("active");
    document.getElementById("screen-pause").classList.add("active");
  }

  function resumeGame() {
    if (state !== "pause") return;
    document.getElementById("screen-pause").classList.remove("active");
    state = "play";
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function bindUI() {
    document.getElementById("btn-play").addEventListener("click", () => {
      AudioSys.sfx("click");
      startGame();
    });
    document.getElementById("btn-replay").addEventListener("click", () => {
      AudioSys.sfx("click");
      startGame();
    });
    document.getElementById("btn-menu").addEventListener("click", () => {
      AudioSys.sfx("click");
      state = "title";
      UI.refreshTitleStats();
      UI.showScreen("screen-title");
      drawTitle();
    });
    document.getElementById("btn-pause").addEventListener("click", pauseGame);
    document.getElementById("btn-resume").addEventListener("click", () => {
      AudioSys.sfx("click");
      resumeGame();
    });
    document.getElementById("btn-quit").addEventListener("click", () => {
      AudioSys.sfx("click");
      document.getElementById("screen-pause").classList.remove("active");
      state = "title";
      UI.refreshTitleStats();
      UI.showScreen("screen-title");
      drawTitle();
    });
    document.getElementById("btn-close-panel").addEventListener("click", () => {
      AudioSys.sfx("click");
      UI.closePanel();
      document.querySelectorAll(".bottom-tabs .tab").forEach((t) => t.classList.remove("active"));
      if (state === "menu") {
        state = "play";
        lastTs = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });

    document.querySelectorAll(".bottom-tabs .tab[data-panel]").forEach((tab) => {
      tab.addEventListener("click", () => {
        AudioSys.sfx("click");
        document.querySelectorAll(".bottom-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        // pause loop while browsing menus so upgrades are usable
        if (state === "play") {
          state = "menu";
        }
        UI.openPanel(tab.getAttribute("data-panel"));
      });
    });

    const btnAction = document.getElementById("btn-action");
    btnAction.addEventListener("click", (e) => {
      e.preventDefault();
      doAction();
    });
    btnAction.addEventListener("touchstart", (e) => {
      e.preventDefault();
      holdAction = true;
      doAction();
    }, { passive: false });
    btnAction.addEventListener("touchend", () => {
      holdAction = false;
    });
    btnAction.addEventListener("contextmenu", (e) => e.preventDefault());

    // double-tap area to switch tool: long press hint via title attribute
    let lastTap = 0;
    btnAction.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 280) {
        selectedTool = selectedTool === "pince" ? "balai" : "pince";
        btnAction.querySelector("span").textContent =
          selectedTool === "balai" ? "BALAI" : "PINCE";
        AudioSys.sfx("click");
      }
      lastTap = now;
    });

    // first interaction unlocks audio
    const unlock = () => {
      AudioSys.unlock();
      AudioSys.startMusic();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
  }

  function init() {
    UI.cache();
    UI.setupJoystick(input);
    // mark joy active when stick moves
    const joy = document.getElementById("joystick");
    joy.addEventListener(
      "touchstart",
      () => {
        input._joyActive = true;
      },
      { passive: true }
    );
    joy.addEventListener(
      "touchend",
      () => {
        input._joyActive = false;
      },
      { passive: true }
    );

    setupKeys();
    bindUI();
    resizeCanvasDisplay();
    drawTitle();
    UI.refreshTitleStats();
    UI.showScreen("screen-title");

    // animate title lightly
    setInterval(drawTitle, 800);
  }

  init();
})();
