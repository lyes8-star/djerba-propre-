/* DJERBA PROPRE — main game loop & state machine */
(() => {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const titleCanvas = document.getElementById("title-canvas");
  const titleCtx = titleCanvas.getContext("2d");

  canvas.width = 192;
  canvas.height = 288;
  titleCanvas.width = 192;
  titleCanvas.height = 108;

  ctx.imageSmoothingEnabled = false;
  titleCtx.imageSmoothingEnabled = false;

  const input = { x: 0, y: 0, keys: {} };
  let state = "title"; // title | play | pause | menu | result
  let world = null;
  let player = null;
  let timeLeft = 180;
  let lastTs = 0;
  let selectedTool = "pince";
  let holdAction = false;
  let cleanToastShown = false;
  let raf = 0;
  let animTime = 0;
  let lastTickSecond = 999;
  let titleRaf = 0;

  function drawTitleFrame(ts) {
    if (state !== "title") return;
    animTime = ts / 1000;
    titleCtx.imageSmoothingEnabled = false;
    titleCtx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
    Sprites.drawTitleScene(titleCtx, animTime);
    titleRaf = requestAnimationFrame(drawTitleFrame);
  }

  function startTitleLoop() {
    cancelAnimationFrame(titleRaf);
    titleRaf = requestAnimationFrame(drawTitleFrame);
  }

  function startGame() {
    AudioSys.unlock();
    AudioSys.setTheme("play");
    AudioSys.startMusic("play");
    FX.reset();
    cancelAnimationFrame(titleRaf);

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
    lastTickSecond = 999;
    selectedTool = "pince";
    document.getElementById("btn-action").querySelector("span").textContent = "PINCE";
    UI.closePanel();
    UI.showScreen("screen-game", true);
    state = "play";
    UI.updateHud(Progress.get(), world, timeLeft);
    lastTs = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function goTitle() {
    state = "title";
    AudioSys.setTheme("title");
    AudioSys.startMusic("title");
    UI.refreshTitleStats();
    UI.showScreen("screen-title", true);
    startTitleLoop();
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

    if (xpRes.leveled > 0) {
      AudioSys.sfx("levelup");
      FX.stars(player.x + 8, player.y);
    } else if (stars >= 2) AudioSys.sfx("super");
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
      FX.pickup(res.item.x, res.item.y);
      FX.floatText(res.item.x, res.item.y - 4, `+${res.points}`);
    } else if (res.type === "recycle") {
      AudioSys.sfx("recycle");
      FX.recycle(world.bin.x + 4, world.bin.y);
      FX.floatText(world.bin.x, world.bin.y - 8, `+${res.pts}`, "#7dff8a");
      FX.hitShake(0.2);
      UI.toast(`Recyclé ! +${res.pts} pts<br/><span class="bonus">${res.count} objets</span>`);
    } else if (res.type === "sweep") {
      AudioSys.sfx("sweep");
      FX.sweep(player.x + 6, player.y + 10);
      if (res.pts) FX.floatText(player.x, player.y - 4, `+${res.pts}`);
    } else if (res.type === "full") {
      UI.toast("Sac plein ! Va recycler");
      FX.hitShake(0.12);
    }
  }

  function checkObjectives() {
    const clean = World.cleanliness(world);
    if (!cleanToastShown && clean >= 80) {
      cleanToastShown = true;
      world.score += 500;
      timeLeft += 30;
      AudioSys.sfx("super");
      FX.stars(player.x + 8, player.y);
      FX.hitShake(0.3);
      UI.toast(`SUPER!<br/>Plage propre! +500 pts<span class="bonus">+30s</span>`, 2200);
    }
    const objs = World.objectives(world);
    if (objs.every((o) => o.done) && player.inventory.length === 0) {
      endGame("clear");
    }
  }

  function render(t) {
    const W = world.W;
    const H = world.H;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    FX.applyShake(ctx);
    Sprites.drawWorldBg(ctx, W, H, t);
    for (const tr of World.living(world)) {
      Sprites.drawTrash(ctx, tr, t);
    }
    Sprites.drawBin(ctx, world.bin.x, world.bin.y, t);
    const goldHat = Progress.get().cosmetics.hat_gold;
    Sprites.drawPlayer(ctx, player, goldHat, t);
    FX.draw(ctx);

    ctx.fillStyle = "rgba(13,58,102,0.8)";
    ctx.fillRect(4, H - 16, 56, 12);
    ctx.strokeStyle = "#5eb3f0";
    ctx.strokeRect(4, H - 16, 56, 12);
    ctx.fillStyle = "#f5c842";
    ctx.font = "7px monospace";
    ctx.fillText(`${player.inventory.length}/${player.stats.capacity}`, 8, H - 7);

    Sprites.drawMinimap(ctx, W, H, World.living(world), player);
    ctx.restore();
  }

  function loop(ts) {
    if (state !== "play") return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    animTime = ts / 1000;

    Player.update(player, dt, input, world);
    World.tickSpawn(world, dt);
    FX.update(dt);

    if (holdAction && selectedTool === "balai") {
      if (player.cooldown <= 0) doAction();
    }

    timeLeft -= dt;
    window.__timeLeft = timeLeft;
    const sec = Math.ceil(timeLeft);
    if (sec <= 10 && sec !== lastTickSecond && sec > 0) {
      lastTickSecond = sec;
      AudioSys.sfx("tick");
    }
    if (timeLeft <= 0) {
      timeLeft = 0;
      endGame("time");
      return;
    }

    checkObjectives();
    if (state !== "play") return;
    render(animTime);
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
      goTitle();
    });
    document.getElementById("btn-pause").addEventListener("click", pauseGame);
    document.getElementById("btn-resume").addEventListener("click", () => {
      AudioSys.sfx("click");
      resumeGame();
    });
    document.getElementById("btn-quit").addEventListener("click", () => {
      AudioSys.sfx("click");
      document.getElementById("screen-pause").classList.remove("active");
      goTitle();
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
        if (state === "play") state = "menu";
        UI.openPanel(tab.getAttribute("data-panel"));
      });
    });

    const btnAction = document.getElementById("btn-action");
    btnAction.addEventListener("click", (e) => {
      e.preventDefault();
      doAction();
    });
    btnAction.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        holdAction = true;
        doAction();
      },
      { passive: false }
    );
    btnAction.addEventListener("touchend", () => {
      holdAction = false;
    });
    btnAction.addEventListener("contextmenu", (e) => e.preventDefault());

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

    const unlock = () => {
      AudioSys.unlock();
      AudioSys.setTheme("title");
      AudioSys.startMusic("title");
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
  }

  function init() {
    UI.cache();
    UI.setupJoystick(input);
    const joy = document.getElementById("joystick");
    joy.addEventListener("touchstart", () => { input._joyActive = true; }, { passive: true });
    joy.addEventListener("touchend", () => { input._joyActive = false; }, { passive: true });

    setupKeys();
    bindUI();
    UI.refreshTitleStats();
    UI.showScreen("screen-title");
    startTitleLoop();
  }

  init();
})();
