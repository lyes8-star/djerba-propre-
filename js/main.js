/* DJERBA PROPRE — main loop, integer pixel scale, animated title */
(() => {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const titleCanvas = document.getElementById("title-canvas");
  const titleCtx = titleCanvas.getContext("2d");
  const titleBg = document.getElementById("title-bg-canvas");
  const titleBgCtx = titleBg.getContext("2d");

  canvas.width = 256;
  canvas.height = 384;
  titleCanvas.width = 224;
  titleCanvas.height = 120;
  titleBg.width = 256;
  titleBg.height = 448;

  [ctx, titleCtx, titleBgCtx].forEach((c) => {
    c.imageSmoothingEnabled = false;
  });

  const input = { x: 0, y: 0, keys: {}, _joyActive: false };
  let state = "title";
  let world = null;
  let player = null;
  let timeLeft = 180;
  let lastTs = 0;
  let selectedTool = "pince";
  let holdAction = false;
  let cleanToastShown = false;
  let raf = 0;
  let titleRaf = 0;
  let animTime = 0;
  let lastTickSecond = 999;

  function fitGameCanvas() {
    const wrap = canvas.parentElement;
    if (!wrap) return;
    const scale = Math.max(
      1,
      Math.floor(Math.min(wrap.clientWidth / canvas.width, wrap.clientHeight / canvas.height))
    );
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    ctx.imageSmoothingEnabled = false;
  }

  function drawTitleFrame(ts) {
    if (state !== "title") return;
    animTime = ts / 1000;
    titleBgCtx.imageSmoothingEnabled = false;
    titleCtx.imageSmoothingEnabled = false;
    Sprites.drawTitleBackground(titleBgCtx, titleBg.width, titleBg.height, animTime);
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
    world = World.create(Progress.get().level);
    player = Player.create(Progress.toolStats());
    window.__world = world;
    window.__playerRefresh = () => {
      if (player) player.stats = Progress.toolStats();
    };
    timeLeft = 180 + (boosts.time ? 30 : 0);
    window.__timeLeft = timeLeft;
    cleanToastShown = false;
    lastTickSecond = 999;
    selectedTool = "pince";
    UI.setToolLabel("PINCE");
    UI.closePanel();
    UI.showScreen("screen-game", true);
    state = "play";
    fitGameCanvas();
    UI.updateHud(Progress.get(), world, timeLeft);
    UI.drawAvatar(0);
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
    const stars = World.stars(world.score, clean);
    const baseXp = Math.floor(world.score / 20) + world.recycled * 5 + stars * 40;
    const baseCoins = Math.floor(world.score / 50) + stars * 30;

    Progress.recordRun({
      score: world.score,
      recycled: world.recycled,
      beachClean: clean >= 80,
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
            : "Temps ecoule"
          : "Plage terminee !",
    });
    UI.refreshTitleStats();
  }

  function toggleTool() {
    selectedTool = selectedTool === "pince" ? "balai" : "pince";
    UI.setToolLabel(selectedTool === "balai" ? "BALAI" : "PINCE");
    AudioSys.sfx("click");
  }

  function doAction() {
    if (state !== "play" || !player) return;
    const res = Player.action(player, world, selectedTool);
    if (!res) return;
    if (res.type === "pickup") {
      AudioSys.sfx("pickup");
      FX.pickup(res.item.x, res.item.y);
      FX.floatText(res.item.x, res.item.y - 6, `+${res.points}`);
      if (res.combo >= 2) UI.showCombo(res.combo);
    } else if (res.type === "recycle") {
      AudioSys.sfx("recycle");
      FX.recycle(world.bin.x + 6, world.bin.y + 4);
      FX.floatText(world.bin.x, world.bin.y - 10, `+${res.pts}`, "#8dff9c");
      FX.hitShake(0.25);
      UI.toast(`RECYCLE!<br/>+${res.pts} pts<span class="bonus">${res.count} objets</span>`);
    } else if (res.type === "sweep") {
      AudioSys.sfx("sweep");
      FX.sweep(player.x + 8, player.y + 14);
      if (res.pts) FX.floatText(player.x, player.y - 6, `+${res.pts}`);
    } else if (res.type === "full") {
      UI.toast("SAC PLEIN!<br/>Va recycler");
      FX.hitShake(0.15);
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
      FX.hitShake(0.35);
      UI.toast(`SUPER!<br/>Plage propre! +500<span class="bonus">+30s</span>`, 2200);
    }
    if (World.objectives(world).every((o) => o.done) && player.inventory.length === 0) {
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
    for (const tr of World.living(world)) Sprites.drawTrash(ctx, tr, t);
    Sprites.drawBin(ctx, world.bin.x, world.bin.y, t);
    Sprites.drawPlayer(ctx, player, Progress.get().cosmetics.hat_gold, t);
    FX.draw(ctx);

    // inventory bar
    ctx.fillStyle = "rgba(8,40,72,0.9)";
    ctx.fillRect(6, H - 20, 70, 14);
    ctx.strokeStyle = "#6ec8ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(6, H - 20, 70, 14);
    ctx.fillStyle = "#ffd24a";
    ctx.font = "8px monospace";
    ctx.fillText(`BAG ${player.inventory.length}/${player.stats.capacity}`, 10, H - 9);

    Sprites.drawMinimap(ctx, W, H, World.living(world), player, t);
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

    if (holdAction && selectedTool === "balai" && player.cooldown <= 0) doAction();

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
    if ((ts / 200 | 0) % 2 === 0) UI.drawAvatar(animTime);
    raf = requestAnimationFrame(loop);
  }

  function setupKeys() {
    window.addEventListener("keydown", (e) => {
      input.keys[e.key.toLowerCase()] = true;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (e.key === " " || k === "e") doAction();
      if (k === "q") toggleTool();
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
    if (input.keys.arrowleft || input.keys.a) x -= 1;
    if (input.keys.arrowright || input.keys.d) x += 1;
    if (input.keys.arrowup || input.keys.w) y -= 1;
    if (input.keys.arrowdown || input.keys.s) y += 1;
    if (!input._joyActive || x || y) {
      if (!input._joyActive) {
        input.x = x;
        input.y = y;
      } else if (x || y) {
        input.x = x;
        input.y = y;
      }
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

    document.getElementById("btn-tool").addEventListener("click", (e) => {
      e.preventDefault();
      toggleTool();
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

    const unlock = () => {
      AudioSys.unlock();
      AudioSys.setTheme("title");
      AudioSys.startMusic("title");
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("resize", fitGameCanvas);
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
