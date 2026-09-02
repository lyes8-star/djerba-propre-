/* DJERBA 2 · EAU PROPRE — monde ouvert GTA, campagne, marchés d'eau */
(() => {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const titleBg = document.getElementById("title-bg-canvas");
  const titleBgCtx = titleBg.getContext("2d");
  const mapCanvas = document.getElementById("map-canvas");
  const mapCtx = mapCanvas.getContext("2d");

  canvas.width = 320;
  canvas.height = 400;
  titleBg.width = 320;
  titleBg.height = 560;
  mapCanvas.width = 360;
  mapCanvas.height = 240;

  const ZOOM = 1.3;
  let cam = { x: 0, y: 0, vw: 0, vh: 0 };

  [ctx, titleBgCtx, mapCtx].forEach((c) => {
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

  let introPhase = "cine";
  let introStart = 0;
  let introAudio = false;

  function fitTitleBg() {
    const w = Math.max(280, Math.round((titleBg.clientWidth || 320) / 2));
    const h = Math.max(480, Math.round((titleBg.clientHeight || 560) / 2));
    if (titleBg.width !== w || titleBg.height !== h) {
      titleBg.width = w;
      titleBg.height = h;
      titleBgCtx.imageSmoothingEnabled = false;
    }
  }

  function setIntroPhase(phase) {
    introPhase = phase;
    const veil = document.getElementById("intro-veil");
    const studio = document.getElementById("intro-studio");
    const cineLogo = document.getElementById("intro-logo-cine");
    const skip = document.getElementById("intro-skip");
    const menu = document.getElementById("title-menu");
    const kicker = document.getElementById("intro-kicker");
    const presents = document.getElementById("intro-presents");
    if (phase === "cine") {
      introStart = performance.now();
      veil.className = "intro-veil";
      studio.classList.remove("hidden");
      cineLogo.classList.add("hidden");
      skip.classList.add("hidden");
      menu.classList.add("hidden");
      kicker.classList.remove("show");
      presents.classList.remove("show");
      titleBg.classList.remove("lit", "menu");
      void kicker.offsetWidth;
      kicker.classList.add("show");
    } else if (phase === "menu") {
      veil.className = "intro-veil gone";
      studio.classList.add("hidden");
      cineLogo.classList.add("hidden");
      skip.classList.add("hidden");
      menu.classList.remove("hidden");
      titleBg.classList.remove("lit");
      titleBg.classList.add("menu");
      AudioSys.setTheme("title");
      AudioSys.startMusic("title");
    }
  }

  function tickIntro(now) {
    if (introPhase !== "cine") return;
    const t = (now - introStart) / 1000;
    const kicker = document.getElementById("intro-kicker");
    const presents = document.getElementById("intro-presents");
    const studio = document.getElementById("intro-studio");
    const cineLogo = document.getElementById("intro-logo-cine");
    const skip = document.getElementById("intro-skip");
    const veil = document.getElementById("intro-veil");
    if (t > 0.15 && !kicker.classList.contains("show")) kicker.classList.add("show");
    if (t > 1.35) presents.classList.add("show");
    if (t > 2.2) skip.classList.remove("hidden");
    if (t > 3.05) {
      veil.classList.add("dim");
      titleBg.classList.add("lit");
    }
    if (t > 3.6) {
      studio.classList.add("hidden");
      cineLogo.classList.remove("hidden");
    }
    if (t > 7.2) setIntroPhase("menu");
  }

  function handleTitlePress(e) {
    if (e.target && e.target.id === "btn-quick") return;
    AudioSys.unlock();
    if (!introAudio) {
      introAudio = true;
      if (introPhase === "cine") {
        AudioSys.setTheme("intro");
        AudioSys.startMusic("intro");
      } else {
        AudioSys.setTheme("title");
        AudioSys.startMusic("title");
      }
    }
    if (introPhase === "cine") {
      const elapsed = (performance.now() - introStart) / 1000;
      if (elapsed > 1.1) setIntroPhase("menu");
      return;
    }
    if (introPhase === "menu") {
      AudioSys.sfx("click");
      launchOpenWorld();
    }
  }

  function drawTitleFrame(ts) {
    if (state !== "title") return;
    animTime = ts / 1000;
    fitTitleBg();
    tickIntro(ts);
    Sprites.drawCinematic(titleBgCtx, titleBg.width, titleBg.height, animTime);
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
      selectedMapId,
      player
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

  function launchOpenWorld() {
    AudioSys.unlock();
    beginMission(0);
  }

  function launchCampaignFromTitle() {
    launchOpenWorld();
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
    if (world.inside) {
      const r = world.inside.room;
      if (r === "mosque" || r === "synagogue" || r === "cemetery") return "holy";
      if (r === "cabaret") return "night";
      if (r === "hotel") return "resort";
      if (r === "workshop" || r === "kiln" || r === "mill" || r === "oven") return "folk";
      return "ville";
    }
    const z = Sprites.zoneAt(player.x, player.y);
    if (z === "sea") return "beach";
    const mt = world.theme;
    if (z === "beach" && (mt === "sunset" || mt === "festival" || mt === "resort" || mt === "lagoon")) {
      return mt;
    }
    return z;
  }

  function beginMission(id) {
    const mission = {
      id: 0,
      name: "Djerba 2",
      code: "LIBRE",
      theme: "beach",
      trash: 80,
      bagRatio: 0.3,
      bagTarget: 8,
      recycleTarget: 16,
      cleanTarget: 80,
      spawn: true,
    };

    currentMissionId = mission.id || id;
    FX.reset();
    cancelAnimationFrame(titleRaf);
    cancelAnimationFrame(mapRaf);

    const boosts = Progress.consumeBoostsOnStart();
    world = World.create(mission);
    player = Player.create(Progress.toolStats());
    Npc.spawn(world);
    if (typeof Traffic !== "undefined") Traffic.spawn(world);
    if (typeof Quests !== "undefined") Quests.spawn(world);
    window.__player = player;
    AudioSys.unlock();
    AudioSys.setTheme(playMusicTheme());
    AudioSys.startMusic(playMusicTheme());
    window.__world = world;
    window.__playerRefresh = () => {
      if (player) player.stats = Progress.toolStats();
    };
    timeLeft = 99999;
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
    if (missionLabel) missionLabel.textContent = "LIBRE";
    UI.updateHud(Progress.get(), world, timeLeft);
    UI.drawAvatar(0);
    UI.toggleObjectives(true);
    const wrap = document.getElementById("canvas-wrap");
    if (typeof Engine3D !== "undefined" && wrap && Engine3D.init(wrap)) {
      Engine3D.buildWorld(world);
      canvas.classList.add("hidden-2d");
    }
    lastTs = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function goTitle() {
    state = "title";
    if (typeof Engine3D !== "undefined") Engine3D.dispose();
    canvas.classList.remove("hidden-2d");
    quickPlay = false;
    introPhase = "menu";
    introAudio = true;
    setIntroPhase("menu");
    AudioSys.setTheme("title");
    AudioSys.startMusic("title");
    UI.refreshTitleStats();
    UI.showScreen("screen-title", true);
    startTitleLoop();
  }

  function endGame(reason) {
    state = "result";
    if (UI.hideTalk) UI.hideTalk();
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
  window.__getTool = () => selectedTool;
  window.__setTool = (id) => {
    if (id !== "pince" && id !== "balai") return;
    selectedTool = id;
    UI.setToolLabel(id === "balai" ? "BALAI" : "PINCE");
  };

  function doAction() {
    if (state !== "play" || !player) return;
    const res = Player.action(player, world, selectedTool);
    if (!res) return;
    if (res.type === "pickup") {
      if (res.rare) {
        AudioSys.sfx("super");
        FX.stars(res.item.x, res.item.y);
        FX.floatText(res.item.x, res.item.y - 10, res.name, "#ffd24a");
        UI.toast(`SUCCES !<br/>${res.name}<span class="bonus">plat rare tunisien +${res.points} pts</span>`, 2800);
        FX.hitShake(0.2);
        if (res.coins) Progress.addCoins(res.coins);
      } else {
        AudioSys.sfx("pickup");
        FX.pickup(res.item.x, res.item.y);
        FX.floatText(res.item.x, res.item.y - 6, `+${res.points}`);
        if (res.combo >= 2) UI.showCombo(res.combo);
      }
      if (typeof Quests !== "undefined") Quests.onTrash(world);
    } else if (res.type === "recycle") {
      AudioSys.sfx("recycle");
      const bin = res.bin || world.bin;
      FX.recycle(bin.x + 6, bin.y + 4);
      FX.floatText(bin.x, bin.y - 10, `+${res.pts}`, "#8dff9c");
      FX.hitShake(0.25);
      if (res.coins) {
        Progress.addCoins(res.coins);
        FX.floatText(bin.x + 12, bin.y - 22, `+$${res.coins}`, "#ffd24a");
      }
      UI.toast(`RECYCLE!<br/>+${res.pts} pts<span class="bonus">${res.count} objets · poubelle ville</span>`);
    } else if (res.type === "sweep") {
      AudioSys.sfx("sweep");
      FX.sweep(player.x + 8, player.y + 14);
      if (res.pts) FX.floatText(player.x, player.y - 6, `+${res.pts}`);
    } else if (res.type === "full") {
      UI.toast("SAC PLEIN!<br/>Va a une poubelle de ville");
      FX.hitShake(0.15);
    } else if (res.type === "talk") {
      AudioSys.sfx("click");
      UI.talkBox(res.who, res.text, res.more);
      if (res.coins) {
        Progress.addCoins(res.coins);
        FX.floatText(player.x, player.y - 8, `+$${res.coins}`, "#ffd24a");
      }
      if (res.quest === "start") {
        UI.toast(`QUETE<br/>${res.questTitle || ""}`, 2200);
        UI.toggleObjectives(true);
      } else if (res.quest === "step") {
        UI.toast((res.questTitle || "QUETE") + "<br/>etape suivante", 1800);
        UI.toggleObjectives(true);
      } else if (res.quest === "done") {
        AudioSys.sfx("super");
        FX.stars(player.x + 8, player.y);
        UI.toast(`QUETE OK!<br/>${res.questTitle || ""}`, 2600);
        UI.toggleObjectives(true);
      }
    } else if (res.type === "market") {
      AudioSys.sfx("click");
      UI.toast(`${res.title || "MARCHÉ"}<br/>${res.sub || "Eau propre"} · pénurie`);
    } else if (res.type === "interact") {
      AudioSys.sfx(res.thirst ? "splash" : "click");
      UI.toast(`${res.label || "ACTION"}<br/>${res.text || ""}`);
      if (res.coins) {
        Progress.addCoins(res.coins);
        FX.floatText(player.x, player.y - 8, `+$${res.coins}`, "#ffd24a");
      }
    } else if (res.type === "door") {
      AudioSys.sfx("click");
      if (res.dir === "in") UI.toast((res.title || "SALLE") + "<br/>Porte ouverte");
    } else if (res.type === "taxi-off") {
      AudioSys.sfx("click");
      UI.toast("A TERRE<br/>Tour termine");
      if (UI.hideTalk) UI.hideTalk();
    }
  }

  function checkObjectives() {}

  function render(t, dt) {
    fitGameCanvas();
    const inside = world.inside;
    if (!inside && typeof Engine3D !== "undefined" && Engine3D.active()) {
      canvas.classList.add("hidden-2d");
      const gl = document.getElementById("game-gl");
      if (gl) gl.style.display = "block";
      Engine3D.render(world, player, t, dt);
      return;
    }
    canvas.classList.remove("hidden-2d");
    const glHide = document.getElementById("game-gl");
    if (glHide) glHide.style.display = "none";
    const W = inside ? inside.w : world.W;
    const H = inside ? inside.h : world.H;
    const vw = canvas.width / ZOOM;
    const vh = canvas.height / ZOOM;
    let camX = player.x + 16 - vw / 2;
    let camY = player.y + 20 - vh / 2;
    camX = Math.max(0, Math.min(Math.max(0, W - vw), camX));
    camY = Math.max(0, Math.min(Math.max(0, H - vh), camY));
    cam = { x: camX, y: camY, vw, vh };

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    FX.applyShake(ctx);
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-camX, -camY);

    const gold = Progress.get().cosmetics.hat_gold;
    if (inside) {
      Sprites.drawInterior(ctx, inside, t);
      const actors = (world.npcs || []).filter((n) => n.indoor).map((n) => ({ n, y: n.y, player: false }));
      actors.push({ y: player.y, player: true });
      actors.sort((a, b) => a.y - b.y);
      for (const a of actors) {
        if (a.player) Sprites.drawPlayer(ctx, player, gold, t, null);
        else Sprites.drawNpc(ctx, a.n, t, null);
      }
    } else {
      Sprites.drawWorldBg(ctx, world.W, world.H, t, world.theme, cam);
      Sprites.drawDoors(ctx, player, cam, t);
      Sprites.drawFilth(ctx, world, t, cam);
      for (const tr of World.living(world)) Sprites.drawTrash(ctx, tr, t, cam);
      for (const r of World.livingRares(world)) Sprites.drawTrash(ctx, r, t, cam);
      for (const b of world.bins || [world.bin]) {
        if (b) Sprites.drawBin(ctx, b.x, b.y, t, cam);
      }
      if (typeof Market !== "undefined") Market.drawStalls(ctx, cam, t);
      if (typeof Interactions !== "undefined") {
        for (const s of Interactions.spots) {
          const sx = s.x - cam.x;
          const sy = s.y - cam.y;
          if (sx < -40 || sy < -40 || sx > cam.vw + 40 || sy > cam.vh + 40) continue;
          const pulse = 0.5 + Math.sin(t * 4 + s.x * 0.01) * 0.5;
          ctx.fillStyle = `rgba(72, 200, 120, ${0.35 + pulse * 0.35})`;
          ctx.beginPath();
          ctx.arc(sx, sy - 8, 5 + pulse * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      const actors = (world.npcs || []).filter((n) => !n.indoor).map((n) => ({ n, y: n.y, player: false }));
      for (const car of world.cars || []) actors.push({ car, y: car.y });
      actors.push({ y: player.y, player: true });
      actors.sort((a, b) => a.y - b.y);
      for (const a of actors) {
        if (a.car) Sprites.drawCar(ctx, a.car, t, cam);
        else if (a.player) Sprites.drawPlayer(ctx, player, gold, t, cam);
        else Sprites.drawNpc(ctx, a.n, t, cam);
      }
      Sprites.drawMinimap(ctx, world.W, world.H, World.living(world), player, t, cam, world.npcs, World.livingRares(world));
    }
    FX.draw(ctx);
    ctx.restore();
    FX.drawFlash(ctx, canvas.width, canvas.height);
  }

  function loop(ts) {
    if (state !== "play") return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    animTime = ts / 1000;

    if (typeof Traffic !== "undefined" && !world.inside) Traffic.update(world, dt, player);
    const wasSwim = player.swim;
    if (typeof WorldSim !== "undefined") WorldSim.tick(dt, player);
    if (typeof Interactions !== "undefined") Interactions.tick(dt, player);
    Player.update(player, dt, input, world);
    if (!wasSwim && player.swim) AudioSys.sfx("splash");
    Npc.update(world, dt, player, animTime);
    if (typeof Market !== "undefined" && !world.inside) {
      const thirstToast = Market.tick(dt, player, world);
      if (thirstToast) UI.toast(thirstToast.html, 2600);
    }
    if (world.qToast) {
      const t = world.qToast;
      world.qToast = null;
      UI.toast(t.html, 2000);
      if (t.kind === "step") AudioSys.sfx("click");
      UI.toggleObjectives(true);
    }
    if (world.taxiToast) {
      const tt = world.taxiToast;
      world.taxiToast = null;
      UI.toast(tt.html, 1800);
      AudioSys.sfx("click");
    }
    if (!world.inside) World.tickSpawn(world, dt);
    FX.update(dt);
    AudioSys.setTheme(playMusicTheme());
    if (!world.ride && !player.swim && Math.hypot(player.vx, player.vy) > 20 && Math.random() < 0.35) {
      FX.dust(player.x + 12, player.y + 34);
      if (Math.random() < 0.08) AudioSys.sfx("footstep");
    }
    if (player.swim && Math.hypot(player.vx, player.vy) > 12 && Math.random() < 0.35) {
      FX.glint(player.x + 8 + Math.random() * 12, player.y + 22);
    }
    if (Math.random() < 0.04) {
      FX.glint(player.x + Math.random() * 20, player.y + Math.random() * 16 - 8);
    }

    if (holdAction && selectedTool === "balai" && player.cooldown <= 0) doAction();

    window.__timeLeft = timeLeft;

    checkObjectives();
    if (state !== "play") return;
    render(animTime, dt);
    UI.updateHud(Progress.get(), world, timeLeft);
    const indoor = !!world.inside;
    const speaker = (world.npcs || []).find((n) => n.pages && (indoor ? n.indoor : !n.indoor));
    const rideTalk = world.ride && world.ride.pages;
    if (rideTalk) {
      /* keep taxi box */
    } else if (speaker && player) {
      const d = Math.hypot(speaker.x - player.x, speaker.y - player.y);
      if (d > 78) {
        speaker.pages = null;
        speaker.bubble = 0;
        if (UI.hideTalk) UI.hideTalk();
      }
    } else if (UI.hideTalk) UI.hideTalk();
    const door = Places.nearDoor(player, world);
    const nearNpc = Npc.nearest(world, player, 34);
    const taxiRange = (typeof Traffic !== "undefined" && Traffic.BOARD_RANGE) || 52;
    const nearTaxi = !world.inside && typeof Traffic !== "undefined" ? Traffic.nearestTaxi(world, player, taxiRange) : null;
    const taxiD = nearTaxi ? Math.hypot(nearTaxi.px - (player.x + 16), nearTaxi.py - (player.y + 20)) : 999;
    const npcD = nearNpc ? Math.hypot(nearNpc.x + 16 - (player.x + 16), nearNpc.y + 20 - (player.y + 20)) : 999;
    const qHere = nearNpc && nearNpc.qRole && typeof Quests !== "undefined" && Quests.mark(nearNpc) && npcD < 36;
    const nearBin = World.nearestBin(world, player, 40);
    const nearStall = !world.inside && typeof Market !== "undefined" ? Market.nearStall(player, world) : null;
    const nearSpot = !world.inside && typeof Interactions !== "undefined" ? Interactions.near(player, world) : null;
    if (world.ride) {
      const more = world.ride.pages && world.ride.page < world.ride.pages.length - 1;
      UI.setToolLabel(more ? "SUITE" : "SORTIR");
    } else if (door) UI.setToolLabel(world.inside ? "SORTIR" : "ENTRER");
    else if (nearStall && !player.swim) UI.setToolLabel("MARCHE");
    else if (nearSpot && !player.swim) UI.setToolLabel(nearSpot.label);
    else if (nearTaxi && !player.swim && taxiD < 40 && !qHere) UI.setToolLabel("TAXI");
    else if (nearTaxi && !player.swim && taxiD <= npcD + 6 && !qHere) UI.setToolLabel("TAXI");
    else if (nearBin && player.inventory.length > 0) UI.setToolLabel("VIDER");
    else if (nearNpc && selectedTool !== "balai") {
      const more = nearNpc.pages && nearNpc.page < nearNpc.pages.length - 1;
      UI.setToolLabel(more ? "SUITE" : "PARLER");
    } else UI.setToolLabel(selectedTool === "balai" ? "BALAI" : "PINCE");
    if ((ts / 200 | 0) % 2 === 0) UI.drawAvatar(animTime);
    raf = requestAnimationFrame(loop);
  }

  function setupKeys() {
    window.addEventListener("keydown", (e) => {
      input.keys[e.key.toLowerCase()] = true;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (state === "title" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        handleTitlePress({ target: document.getElementById("btn-play") });
        return;
      }
      if (state === "story" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        storyIndex += 1;
        showStoryLine();
        return;
      }
      if ((e.key === " " || k === "e") && !e.repeat) doAction();
      if (k === "q") toggleTool();
      if (e.key === "Escape") {
        if (typeof Market !== "undefined" && Market.isOpen()) {
          Market.closeMarket();
          return;
        }
        if (state === "play") pauseGame();
      }
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
    document.getElementById("screen-pause").classList.remove("active");
    UI.showScreen("screen-game");
    document.getElementById("screen-game").classList.add("active");
    state = "play";
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function bindUI() {
    document.getElementById("btn-play").addEventListener("click", (e) => {
      handleTitlePress(e);
    });
    document.getElementById("btn-quick").addEventListener("click", () => {
      AudioSys.sfx("click");
      launchOpenWorld();
    });
    document.getElementById("btn-story-next").addEventListener("click", () => {
      AudioSys.sfx("click");
      storyIndex += 1;
      showStoryLine();
    });
    document.getElementById("btn-map-back").addEventListener("click", () => {
      AudioSys.sfx("click");
      if (world && player) {
        UI.showScreen("screen-game", true);
        resumeGame();
      } else goTitle();
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
      AudioSys.sfx("click");
      if (world && player) {
        UI.showScreen("screen-game", true);
        resumeGame();
      } else launchOpenWorld();
    });
    mapCanvas.addEventListener("click", (e) => {
      const rect = mapCanvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (mapCanvas.width / rect.width);
      const sy = (e.clientY - rect.top) * (mapCanvas.height / rect.height);
      let best = null;
      let bestD = 24;
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
      launchOpenWorld();
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
    const btnMapPause = document.getElementById("btn-map-pause");
    if (btnMapPause) {
      btnMapPause.addEventListener("click", () => {
        AudioSys.sfx("click");
        document.getElementById("screen-pause").classList.remove("active");
        state = "map";
        UI.showScreen("screen-map", true);
        const z = player ? Island.zoneLabel(Sprites.zoneAt(player.x, player.y)) : "DJERBA";
        document.getElementById("map-level-name").textContent = z;
        document.getElementById("map-level-sub").textContent = "MONDE LIBRE";
        document.getElementById("map-level-desc").textContent = "Carte pixel = le vrai terrain. Triangle vert = toi. Toute l'ile est ouverte.";
        startMapLoop();
      });
    }
    document.getElementById("btn-quit").addEventListener("click", () => {
      AudioSys.sfx("click");
      document.getElementById("screen-pause").classList.remove("active");
      goTitle();
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
    let actionFromTouch = false;
    btnAction.addEventListener("click", (e) => {
      e.preventDefault();
      if (actionFromTouch) {
        actionFromTouch = false;
        return;
      }
      doAction();
    });
    btnAction.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        actionFromTouch = true;
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
      if (state === "title" && introPhase === "cine" && !introAudio) {
        introAudio = true;
        AudioSys.setTheme("intro");
        AudioSys.startMusic("intro");
      }
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("resize", fitGameCanvas);

    const btnMarketClose = document.getElementById("btn-market-close");
    if (btnMarketClose) {
      btnMarketClose.addEventListener("click", () => {
        AudioSys.sfx("click");
        if (typeof Market !== "undefined") Market.closeMarket();
      });
    }
  }

  function init() {
    Atlas.bake();
    if (typeof Textures !== "undefined") {
      Textures.loadAll().then(() => {
        Textures.injectAtlasTiles();
      }).catch(() => {});
    }
    UI.cache();
    UI.setupJoystick(input);
    const joy = document.getElementById("joystick");
    joy.addEventListener("touchstart", () => { input._joyActive = true; }, { passive: true });
    joy.addEventListener("touchend", () => { input._joyActive = false; }, { passive: true });
    setupKeys();
    bindUI();
    UI.refreshTitleStats();
    UI.showScreen("screen-title");
    setIntroPhase("cine");
    startTitleLoop();
  }

  init();
})();
