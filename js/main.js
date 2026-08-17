/* DJERBA PROPRE — campagne, histoire, niveaux */
(() => {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const titleCanvas = document.getElementById("title-canvas");
  const titleCtx = titleCanvas.getContext("2d");
  const titleBg = document.getElementById("title-bg-canvas");
  const titleBgCtx = titleBg.getContext("2d");
  const mapCanvas = document.getElementById("map-canvas");
  const mapCtx = mapCanvas.getContext("2d");

  canvas.width = 320;
  canvas.height = 400;
  titleCanvas.width = 280;
  titleCanvas.height = 150;
  titleBg.width = 320;
  titleBg.height = 520;
  mapCanvas.width = 280;
  mapCanvas.height = 250;

  const ZOOM = 1.3;
  let cam = { x: 0, y: 0, vw: 0, vh: 0 };

  [ctx, titleCtx, titleBgCtx, mapCtx].forEach((c) => {
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
  let mapRaf = 0;
  let animTime = 0;
  let lastTickSecond = 999;

  let currentMissionId = 1;
  let selectedMapId = 1;
  let storyQueue = [];
  let storyIndex = 0;
  let storyMode = "intro"; // intro | before | after | ending
  let quickPlay = false;

  function fitGameCanvas() {
    const wrap = canvas.parentElement;
    const w = (wrap && wrap.clientWidth) || window.innerWidth || 320;
    const h = (wrap && wrap.clientHeight) || window.innerHeight || 400;
    const px = Math.max(2, Math.min(3, Math.floor(Math.min(w / 260, h / 340)) || 2));
    const nw = Math.max(260, Math.round(w / px));
    const nh = Math.max(340, Math.round(h / px));
    if (canvas.width !== nw || canvas.height !== nh) {
      canvas.width = nw;
      canvas.height = nh;
    }
    ctx.imageSmoothingEnabled = false;
  }

  function drawTitleFrame(ts) {
    if (state !== "title") return;
    animTime = ts / 1000;
    Sprites.drawTitleBackground(titleBgCtx, titleBg.width, titleBg.height, animTime);
    titleCtx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
    Sprites.drawTitleScene(titleCtx, animTime);
    titleRaf = requestAnimationFrame(drawTitleFrame);
  }

  function startTitleLoop() {
    cancelAnimationFrame(titleRaf);
    cancelAnimationFrame(mapRaf);
    titleRaf = requestAnimationFrame(drawTitleFrame);
  }

  function drawMapFrame(ts) {
    if (state !== "map") return;
    animTime = ts / 1000;
    const camp = Progress.get().campaign;
    Sprites.drawIslandMap(
      mapCtx,
      mapCanvas.width,
      mapCanvas.height,
      animTime,
      camp.unlocked || 1,
      camp.stars || {},
      selectedMapId
    );
    mapRaf = requestAnimationFrame(drawMapFrame);
  }

  function startMapLoop() {
    cancelAnimationFrame(titleRaf);
    cancelAnimationFrame(mapRaf);
    mapRaf = requestAnimationFrame(drawMapFrame);
  }

  function refreshMapInfo() {
    const m = Campaign.get(selectedMapId);
    const camp = Progress.get().campaign;
    const st = (camp.stars && camp.stars[String(m.id)]) || 0;
    const unlocked = Progress.isUnlocked(m.id);
    document.getElementById("map-level-name").textContent = unlocked ? m.name : "???";
    document.getElementById("map-level-sub").textContent = unlocked ? m.chapter : "VERROUILLE";
    document.getElementById("map-level-desc").textContent = unlocked
      ? `${m.subtitle} · ${m.time}s · ${m.trash} dechets`
      : "Gagne 1 etoile au niveau precedent";
    document.getElementById("map-level-stars").textContent = unlocked
      ? `ETOILES ${"*".repeat(st)}${".".repeat(3 - st)}`
      : "---";
    document.getElementById("map-stars-total").textContent = `ETOILES ${Progress.totalStars()}/24`;
    document.getElementById("btn-map-play").disabled = !unlocked;
  }

  function openMap(selectId) {
    quickPlay = false;
    selectedMapId = selectId || Progress.get().campaign.unlocked || 1;
    selectedMapId = Math.min(8, Math.max(1, selectedMapId));
    state = "map";
    AudioSys.setTheme("map");
    UI.showScreen("screen-map", true);
    refreshMapInfo();
    startMapLoop();
  }

  function startStory(lines, mode, chapterLabel) {
    storyQueue = lines || [];
    storyIndex = 0;
    storyMode = mode;
    state = "story";
    cancelAnimationFrame(mapRaf);
    cancelAnimationFrame(titleRaf);
    document.getElementById("story-chapter").textContent = chapterLabel || "HISTOIRE";
    AudioSys.setTheme("story");
    UI.showScreen("screen-story", true);
    showStoryLine();
  }

  function showStoryLine() {
    const line = storyQueue[storyIndex];
    if (!line) {
      onStoryDone();
      return;
    }
    document.getElementById("story-who").textContent = line.who;
    document.getElementById("story-text").textContent = line.text;
  }

  function onStoryDone() {
    if (storyMode === "intro") {
      Progress.markIntroSeen();
      openMap(1);
    } else if (storyMode === "before") {
      beginMission(currentMissionId);
    } else if (storyMode === "after") {
      const next = Campaign.nextId(currentMissionId);
      if (next) openMap(next);
      else openMap(currentMissionId);
    } else if (storyMode === "ending") {
      Progress.markEndingSeen();
      openMap(8);
    } else {
      openMap(currentMissionId);
    }
  }

  function launchCampaignFromTitle() {
    quickPlay = false;
    AudioSys.unlock();
    AudioSys.setTheme("title");
    AudioSys.startMusic("title");
    if (!Progress.get().campaign.introSeen) {
      startStory(Campaign.INTRO, "intro", "PROLOGUE");
    } else {
      openMap(Progress.get().campaign.unlocked || 1);
    }
  }

  function startMissionFlow(id) {
    currentMissionId = id;
    const m = Campaign.get(id);
    if (quickPlay) {
      beginMission(id);
      return;
    }
    startStory(m.storyBefore, "before", `${m.chapter} · ${m.name}`);
  }

  function playMusicTheme() {
    if (!world || !player) return (world && world.theme) || "beach";
    const z = Sprites.zoneAt(player.x, player.y);
    const mt = world.theme;
    if (z === "beach" && (mt === "sunset" || mt === "festival" || mt === "resort" || mt === "lagoon")) {
      return mt;
    }
    if (z === "port" && mt === "port") return "port";
    return z;
  }

  function beginMission(id) {
    const mission = quickPlay
      ? {
          id: 0,
          name: "Partie Rapide",
          theme: "beach",
          time: 150,
          trash: 28,
          bagRatio: 0.3,
          bagTarget: 6,
          recycleTarget: 14,
          cleanTarget: 80,
          spawn: true,
        }
      : Campaign.get(id);

    currentMissionId = mission.id || id;
    FX.reset();
    cancelAnimationFrame(titleRaf);
    cancelAnimationFrame(mapRaf);

    const boosts = Progress.consumeBoostsOnStart();
    world = World.create(mission);
    player = Player.create(Progress.toolStats());
    Npc.spawn(world);
    window.__player = player;
    AudioSys.unlock();
    AudioSys.setTheme(playMusicTheme());
    AudioSys.startMusic(playMusicTheme());
    window.__world = world;
    window.__playerRefresh = () => {
      if (player) player.stats = Progress.toolStats();
    };
    timeLeft = (mission.time || 150) + (boosts.time ? 30 : 0);
    window.__timeLeft = timeLeft;
    cleanToastShown = false;
    lastTickSecond = 999;
    selectedTool = "pince";
    UI.setToolLabel("PINCE");
    UI.closePanel();
    UI.showScreen("screen-game", true);
    state = "play";
    fitGameCanvas();
    const missionLabel = document.getElementById("hud-mission");
    if (missionLabel) missionLabel.textContent = (mission.code || mission.name || "RUN").slice(0, 10);
    UI.updateHud(Progress.get(), world, timeLeft);
    UI.drawAvatar(0);
    UI.toggleObjectives(true);
    lastTs = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function goTitle() {
    state = "title";
    quickPlay = false;
    AudioSys.setTheme("title");
    AudioSys.startMusic("title");
    UI.refreshTitleStats();
    UI.showScreen("screen-title", true);
    startTitleLoop();
  }

  function endGame(reason) {
    state = "result";
    AudioSys.setTheme("map");
    const clean = World.cleanliness(world);
    const beachClean = clean >= (world.cleanTarget || 80);
    const stars = World.stars(world.score, clean, world);
    const baseXp = Math.floor(world.score / 18) + world.recycled * 5 + stars * 50;
    const baseCoins = Math.floor(world.score / 45) + stars * 40;

    Progress.recordRun({
      score: world.score,
      recycled: world.recycled,
      beachClean,
      missionId: quickPlay ? null : currentMissionId,
      starsEarned: stars,
    });
    const xpRes = Progress.addXp(baseXp);
    Progress.addCoins(baseCoins);
    Progress.clearXpBoost();

    if (xpRes.leveled > 0) {
      AudioSys.sfx("levelup");
      FX.stars(player.x + 8, player.y);
    } else if (stars >= 2) AudioSys.sfx("super");
    else if (reason === "time") AudioSys.sfx("fail");

    const mission = Campaign.get(currentMissionId);
    const next = Campaign.nextId(currentMissionId);
    const nextBtn = document.getElementById("btn-next-level");
    if (nextBtn) {
      nextBtn.style.display = !quickPlay && next && Progress.isUnlocked(next) ? "" : "none";
    }
    document.getElementById("result-banner").textContent = quickPlay
      ? "RAPIDE"
      : mission.chapter || "MISSION";

    UI.showResult({
      score: world.score,
      stars,
      xp: xpRes.amount,
      coins: baseCoins,
      title: beachClean
        ? `${mission.name || "Plage"} OK!`
        : reason === "time"
          ? "Temps ecoule"
          : "Mission finie",
    });
    UI.refreshTitleStats();
  }

  function afterResultContinue() {
    if (quickPlay) {
      openMap(1);
      return;
    }
    const mission = Campaign.get(currentMissionId);
    if (Campaign.isFinale(currentMissionId) && !Progress.get().campaign.endingSeen) {
      startStory(Campaign.ENDING, "ending", "EPILOGUE");
      return;
    }
    if (mission.storyAfter && mission.storyAfter.length) {
      startStory(mission.storyAfter, "after", `${mission.chapter} · FIN`);
    } else {
      openMap(Campaign.nextId(currentMissionId) || currentMissionId);
    }
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
    } else if (res.type === "talk") {
      AudioSys.sfx("click");
      UI.toast(`${res.who}<br/>${res.text}`, 2600);
      if (res.coins) {
        Progress.addCoins(res.coins);
        FX.floatText(player.x, player.y - 8, `+$${res.coins}`, "#ffd24a");
      }
    }
  }

  function checkObjectives() {
    const clean = World.cleanliness(world);
    const ct = world.cleanTarget || 80;
    if (!cleanToastShown && clean >= ct) {
      cleanToastShown = true;
      world.score += 500;
      timeLeft += 25;
      AudioSys.sfx("super");
      FX.stars(player.x + 8, player.y);
      FX.hitShake(0.35);
      UI.toast(`SUPER!<br/>Objectif propre! +500<span class="bonus">+25s</span>`, 2200);
    }
    if (World.objectives(world).every((o) => o.done) && player.inventory.length === 0) {
      endGame("clear");
    }
  }

  function render(t) {
    fitGameCanvas();
    const W = world.W;
    const H = world.H;
    const vw = canvas.width / ZOOM;
    const vh = canvas.height / ZOOM;
    let camX = player.x + 16 - vw / 2;
    let camY = player.y + 20 - vh / 2;
    camX = Math.max(0, Math.min(W - vw, camX));
    camY = Math.max(0, Math.min(H - vh, camY));
    cam = { x: camX, y: camY, vw, vh };

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    FX.applyShake(ctx);
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-camX, -camY);

    Sprites.drawWorldBg(ctx, W, H, t, world.theme, cam);
    for (const tr of World.living(world)) Sprites.drawTrash(ctx, tr, t, cam);
    Sprites.drawBin(ctx, world.bin.x, world.bin.y, t, cam);
    const gold = Progress.get().cosmetics.hat_gold;
    const actors = (world.npcs || []).map((n) => ({ n, y: n.y, player: false }));
    actors.push({ y: player.y, player: true });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) {
      if (a.player) Sprites.drawPlayer(ctx, player, gold, t, cam);
      else Sprites.drawNpc(ctx, a.n, t, cam);
    }
    FX.draw(ctx);

    Sprites.drawMinimap(ctx, W, H, World.living(world), player, t, cam, world.npcs);
    ctx.restore();
    FX.drawFlash(ctx, canvas.width, canvas.height);
  }

  function loop(ts) {
    if (state !== "play") return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    animTime = ts / 1000;

    Player.update(player, dt, input, world);
    Npc.update(world, dt, player, animTime);
    World.tickSpawn(world, dt);
    FX.update(dt);
    AudioSys.setTheme(playMusicTheme());
    if (Math.hypot(player.vx, player.vy) > 20 && Math.random() < 0.35) {
      FX.dust(player.x + 12, player.y + 34);
    }
    if (Math.random() < 0.04) {
      FX.glint(player.x + Math.random() * 20, player.y + Math.random() * 16 - 8);
    }

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
    const nearNpc = Npc.nearest(world, player, 34);
    if (nearNpc && selectedTool !== "balai") UI.setToolLabel("PARLER");
    else UI.setToolLabel(selectedTool === "balai" ? "BALAI" : "PINCE");
    if ((ts / 200 | 0) % 2 === 0) UI.drawAvatar(animTime);
    raf = requestAnimationFrame(loop);
  }

  function setupKeys() {
    window.addEventListener("keydown", (e) => {
      input.keys[e.key.toLowerCase()] = true;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (state === "story" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        storyIndex += 1;
        showStoryLine();
        return;
      }
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
      launchCampaignFromTitle();
    });
    document.getElementById("btn-quick").addEventListener("click", () => {
      AudioSys.sfx("click");
      quickPlay = true;
      beginMission(1);
    });
    document.getElementById("btn-story-next").addEventListener("click", () => {
      AudioSys.sfx("click");
      storyIndex += 1;
      showStoryLine();
    });
    document.getElementById("btn-map-back").addEventListener("click", () => {
      AudioSys.sfx("click");
      goTitle();
    });
    document.getElementById("btn-map-prev").addEventListener("click", () => {
      AudioSys.sfx("click");
      selectedMapId = Math.max(1, selectedMapId - 1);
      refreshMapInfo();
    });
    document.getElementById("btn-map-next").addEventListener("click", () => {
      AudioSys.sfx("click");
      selectedMapId = Math.min(8, selectedMapId + 1);
      refreshMapInfo();
    });
    document.getElementById("btn-map-play").addEventListener("click", () => {
      if (!Progress.isUnlocked(selectedMapId)) return;
      AudioSys.sfx("click");
      startMissionFlow(selectedMapId);
    });
    mapCanvas.addEventListener("click", (e) => {
      const rect = mapCanvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (mapCanvas.width / rect.width);
      const sy = (e.clientY - rect.top) * (mapCanvas.height / rect.height);
      let best = null;
      let bestD = 20;
      Campaign.list().forEach((lv) => {
        const d = Math.hypot(lv.mapX - sx, lv.mapY - sy);
        if (d < bestD) {
          bestD = d;
          best = lv.id;
        }
      });
      if (best) {
        selectedMapId = best;
        refreshMapInfo();
        AudioSys.sfx("click");
      }
    });

    document.getElementById("btn-replay").addEventListener("click", () => {
      AudioSys.sfx("click");
      if (quickPlay) beginMission(1);
      else startMissionFlow(currentMissionId);
    });
    document.getElementById("btn-next-level").addEventListener("click", () => {
      AudioSys.sfx("click");
      const next = Campaign.nextId(currentMissionId);
      if (next) startMissionFlow(next);
      else afterResultContinue();
    });
    document.getElementById("btn-menu").addEventListener("click", () => {
      AudioSys.sfx("click");
      afterResultContinue();
    });
    document.getElementById("btn-pause").addEventListener("click", pauseGame);
    document.getElementById("btn-resume").addEventListener("click", () => {
      AudioSys.sfx("click");
      resumeGame();
    });
    document.getElementById("btn-quit").addEventListener("click", () => {
      AudioSys.sfx("click");
      document.getElementById("screen-pause").classList.remove("active");
      openMap(currentMissionId || 1);
    });
    document.getElementById("btn-close-panel").addEventListener("click", () => {
      AudioSys.sfx("click");
      UI.closePanel();
      document.querySelectorAll("#bottom-tabs .tab").forEach((t) => t.classList.remove("active"));
      if (state === "menu") {
        state = "play";
        lastTs = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });

    document.querySelectorAll("#bottom-tabs .tab[data-panel]").forEach((tab) => {
      tab.addEventListener("click", () => {
        AudioSys.sfx("click");
        document.querySelectorAll("#bottom-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        if (state === "play") state = "menu";
        UI.openPanel(tab.getAttribute("data-panel"));
      });
    });

    const btnMenu = document.getElementById("btn-menu-hud");
    if (btnMenu) {
      btnMenu.addEventListener("click", () => {
        AudioSys.sfx("click");
        const first = document.querySelector("#bottom-tabs .tab[data-panel]");
        document.querySelectorAll("#bottom-tabs .tab").forEach((t) => t.classList.remove("active"));
        if (first) first.classList.add("active");
        if (state === "play") state = "menu";
        UI.openPanel(first ? first.getAttribute("data-panel") : "outils");
      });
    }

    const btnObj = document.getElementById("btn-obj");
    if (btnObj) {
      btnObj.addEventListener("click", (e) => {
        e.preventDefault();
        AudioSys.sfx("click");
        UI.toggleObjectives();
      });
    }

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
    Atlas.bake();
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
