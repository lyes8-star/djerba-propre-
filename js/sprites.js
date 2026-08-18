/* World renderer — NES/SNES tiles, animated sea, camera cull */
const Sprites = (() => {
  const TILE = 16;

  function tileFill(ctx, img, x, y, w, h, cam) {
    if (!img) return;
    const x0 = Math.max(0, x);
    const y0 = Math.max(0, y);
    const x1 = x + w;
    const y1 = y + h;
    let sx = x0;
    let sy = y0;
    if (cam) {
      sx = Math.max(x0, (cam.x / TILE | 0) * TILE - TILE);
      sy = Math.max(y0, (cam.y / TILE | 0) * TILE - TILE);
    }
    const ex = cam ? Math.min(x1, cam.x + cam.vw + TILE) : x1;
    const ey = cam ? Math.min(y1, cam.y + cam.vh + TILE) : y1;
    for (let ty = sy; ty < ey; ty += TILE) {
      for (let tx = sx; tx < ex; tx += TILE) {
        ctx.drawImage(img, tx, ty);
      }
    }
  }

  function seaFrame(depth, t) {
    const f = Math.floor(t * 7) % 3;
    return Atlas.tiles.sea[depth][f];
  }

  function drawPalm(ctx, x, y, t, seed, cam) {
    if (cam && !Atlas.inView(cam, x, y, 32, 48)) return;
    const img = Math.sin(t * 2.4 + seed) > 0 ? Atlas.frames.palm1 : Atlas.frames.palm0;
    Atlas.blit(ctx, img, x, y);
  }

  function drawHouse(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 48, 56)) return;
    Atlas.blit(ctx, Atlas.frames.house, x, y);
  }

  function drawShop(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 40, 40)) return;
    Atlas.blit(ctx, Atlas.frames.shop, x, y);
  }

  function drawCabaret(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 56, 48)) return;
    Atlas.blit(ctx, Atlas.frames.cabaret, x, y);
  }

  function drawPool(ctx, x, y, t, cam) {
    if (cam && !Atlas.inView(cam, x, y, 96, 56)) return;
    ctx.fillStyle = Atlas.C.ink;
    ctx.fillRect(x, y, 96, 56);
    ctx.fillStyle = Atlas.C.wall;
    ctx.fillRect(x + 2, y + 2, 92, 52);
    const water = seaFrame(1, t);
    for (let ty = y + 6; ty < y + 50; ty += 16) {
      for (let tx = x + 6; tx < x + 88; tx += 16) ctx.drawImage(water, tx, ty);
    }
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x + 10, y + 10 + Math.sin(t * 2) * 2, 28, 2);
    ctx.fillRect(x + 40, y + 28, 20, 2);
  }

  function drawDoors(ctx, player, cam, t) {
    if (!player || typeof Places === "undefined") return;
    const near = Places.nearDoor(player, { inside: null, npcs: [] });
    for (const b of Places.BUILDINGS) {
      const d = Places.doorRect(b);
      if (cam && !Atlas.inView(cam, d.x, d.y, d.w, d.h)) continue;
      const glow = near && near.x === b.x && near.y === b.y;
      ctx.fillStyle = glow ? "#fcbc14" : "rgba(20,8,8,0.85)";
      ctx.fillRect(d.x, d.y, d.w, 3);
      ctx.fillStyle = glow ? "#ffe46c" : "#140818";
      ctx.fillRect(d.x + 2, d.y + 3, d.w - 4, d.h - 5);
      if (glow && Math.sin(t * 8) > 0) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(d.x + d.w - 4, d.y + 8, 2, 2);
      }
    }
  }

  function drawInterior(ctx, inside, t) {
    const C = Atlas.C;
    const w = inside.w;
    const h = inside.h;
    const kind = inside.room;
    const title = inside.title || "";
    const seed = title.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const variant = seed % 3;
    ctx.fillStyle = "#08060c";
    ctx.fillRect(-48, -48, w + 96, h + 96);

    function rect(x, y, rw, rh, col) {
      ctx.fillStyle = col;
      ctx.fillRect(x | 0, y | 0, rw, rh);
    }
    function box(x, y, rw, rh, fill, edge) {
      rect(x, y, rw, rh, C.ink);
      rect(x + 1, y + 1, rw - 2, rh - 2, fill);
      if (edge) rect(x + 2, y + 2, rw - 4, 3, edge);
    }
    function floorTiles(tile, y0) {
      if (!tile) return;
      for (let y = y0; y < h - 4; y += 16) {
        for (let x = 4; x < w - 4; x += 16) ctx.drawImage(tile, x, y);
      }
    }
    function window_(x, y, night) {
      box(x, y, 22, 18, night ? C.navyD : C.blueX, night ? C.navyL : C.blueL);
      rect(x + 10, y + 2, 2, 14, C.white);
      rect(x + 2, y + 8, 18, 1, C.white);
    }
    function rug(x, y, rw, rh, a, b) {
      rect(x, y, rw, rh, C.ink);
      rect(x + 1, y + 1, rw - 2, rh - 2, a);
      for (let i = 0; i < rw - 4; i += 6) rect(x + 2 + i, y + 2, 3, rh - 4, b);
    }
    function pot(x, y) {
      rect(x + 2, y + 8, 10, 10, C.ink);
      rect(x + 3, y + 9, 8, 8, C.terra);
      rect(x + 4, y + 4, 6, 6, C.terraD);
      rect(x + 5, y + 2, 4, 4, C.terraL);
    }
    function lantern(x, y) {
      rect(x + 4, y, 4, 8, C.ink);
      rect(x + 2, y + 8, 8, 8, Math.sin(t * 7 + x) > 0 ? C.gold : C.goldD);
      rect(x + 3, y + 9, 6, 6, C.goldL);
    }
    function bench(x, y) {
      box(x, y, 40, 12, C.wood, C.woodL);
      rect(x + 2, y + 10, 4, 8, C.woodD);
      rect(x + 34, y + 10, 4, 8, C.woodD);
    }
    function table(x, y) {
      box(x, y, 32, 18, C.wood, C.woodL);
    }
    function bed(x, y, col) {
      box(x, y, 44, 24, col || C.navy, C.white);
      rect(x + 2, y + 2, 14, 20, C.white);
    }
    function desk(x, y, label, col) {
      box(x, y, 56, 20, col || C.woodD, C.woodL);
      ctx.fillStyle = C.goldL;
      ctx.font = "8px monospace";
      ctx.fillText(label, x + 8, y + 14);
    }
    function plant(x, y) {
      rect(x + 4, y + 16, 8, 10, C.terraD);
      rect(x + 2, y + 4, 12, 14, C.greenD);
      rect(x + 4, y, 8, 8, C.greenL);
    }
    function pillar(x, y) {
      rect(x, y, 10, 70, C.ink);
      rect(x + 1, y + 1, 8, 68, C.wall);
      rect(x + 1, y + 1, 8, 6, C.white);
      rect(x + 1, y + 62, 8, 6, C.wallS);
    }
    function graves(x, y) {
      box(x, y, 14, 22, C.wall, C.white);
      rect(x + 4, y + 4, 6, 6, C.gold);
    }

    const pal = {
      home: { wall: C.wall, wallD: C.wallS, night: false },
      shop: { wall: C.woodL, wallD: C.woodD, night: false },
      cafe: { wall: C.wall, wallD: C.navy, night: false },
      cabaret: { wall: "#3c1838", wallD: "#140818", night: true },
      hotel: { wall: C.white, wallD: C.navyL, night: false },
      airport: { wall: C.metal, wallD: C.metalD, night: false },
      mosque: { wall: C.white, wallD: C.goldD, night: false },
      synagogue: { wall: C.white, wallD: C.blue, night: false },
      fort: { wall: C.sandC, wallD: C.sandE, night: false },
      museum: { wall: C.wall, wallD: C.navy, night: false },
      workshop: { wall: C.woodL, wallD: C.woodX, night: false },
      kiln: { wall: C.terra, wallD: C.terraD, night: false },
      mill: { wall: C.wood, wallD: C.woodX, night: false },
      menzel: { wall: C.wall, wallD: C.sandE, night: false },
      cistern: { wall: C.sandE, wallD: C.sandF, night: true },
      cemetery: { wall: C.wall, wallD: C.wallS, night: false },
      graffiti: { wall: C.white, wallD: C.ink, night: false },
      oven: { wall: C.terraL, wallD: C.terraD, night: false },
    }[kind] || { wall: C.wall, wallD: C.wallS, night: false };

    rect(0, 0, w, 58, pal.wallD);
    rect(4, 4, w - 8, 50, pal.wall);
    rect(0, 56, w, h - 56, C.sandC);

    if (kind === "home") floorTiles(Atlas.tiles.sand1, 56);
    else if (kind === "shop" || kind === "workshop") floorTiles(Atlas.tiles.cobble0, 56);
    else if (kind === "cafe") floorTiles(Atlas.tiles.plaza, 56);
    else if (kind === "hotel") floorTiles(Atlas.tiles.plaza, 56);
    else if (kind === "airport") floorTiles(Atlas.tiles.stone, 56);
    else if (kind === "mosque" || kind === "synagogue") floorTiles(Atlas.tiles.cobble1, 56);
    else if (kind === "fort") floorTiles(Atlas.tiles.stone, 56);
    else if (kind === "museum") floorTiles(Atlas.tiles.plaza, 56);
    else if (kind === "kiln" || kind === "oven") floorTiles(Atlas.tiles.sand3, 56);
    else if (kind === "mill") floorTiles(Atlas.tiles.sand2, 56);
    else if (kind === "menzel") floorTiles(Atlas.tiles.sand0, 56);
    else if (kind === "cistern") floorTiles(Atlas.tiles.stone, 56);
    else if (kind === "cemetery") floorTiles(Atlas.tiles.grass, 56);
    else if (kind === "graffiti") floorTiles(Atlas.tiles.cobble0, 56);
    else if (kind === "cabaret") {
      rect(0, 56, w, h - 56, "#241028");
      for (let y = 56; y < h; y += 8) rect(0, y, w, 1, "#3c1838");
    } else floorTiles(Atlas.tiles.sand1, 56);

    rect(0, 0, w, 4, C.ink);
    rect(0, 0, 4, h, C.ink);
    rect(w - 4, 0, 4, h, C.ink);
    rect(0, h - 4, w, 4, C.ink);

    const low = title.toLowerCase();

    if (kind === "home") {
      window_(18, 14);
      window_(w - 46, 14);
      if (variant === 0) {
        bed(16, 70, C.navy);
        table(140, 88);
        plant(240, 80);
        if (Atlas.frames.the) Atlas.blit(ctx, Atlas.frames.the, 148, 80);
      } else if (variant === 1) {
        bed(200, 70, C.redD);
        bench(20, 90);
        plant(16, 130);
        table(120, 140);
      } else {
        rug(40, 80, 90, 50, C.redD, C.gold);
        bench(40, 140);
        bench(160, 140);
        plant(240, 80);
        table(160, 90);
      }
    } else if (kind === "shop") {
      window_(16, 14);
      window_(w - 46, 14);
      desk(118, 62, "CAISSE");
      if (low.indexOf("epice") >= 0 || low.indexOf("harissa") >= 0) {
        rug(16, 90, 80, 60, C.redD, C.gold);
        for (let i = 0; i < 6; i++) {
          rect(20 + (i % 3) * 22, 96 + ((i / 3) | 0) * 22, 16, 16, C.ink);
          rect(22 + (i % 3) * 22, 98 + ((i / 3) | 0) * 22, 12, 12, i % 2 ? C.red : C.terra);
        }
        if (Atlas.frames.harissa) Atlas.blit(ctx, Atlas.frames.harissa, 200, 100);
      } else if (low.indexOf("tapis") >= 0 || low.indexOf("tiss") >= 0) {
        rug(20, 80, 70, 90, C.red, C.navy);
        rug(100, 80, 70, 90, C.goldD, C.greenD);
        rug(180, 80, 70, 90, C.blue, C.gold);
      } else if (low.indexOf("the") >= 0) {
        table(24, 90);
        table(24, 130);
        table(200, 90);
        if (Atlas.frames.the) {
          Atlas.blit(ctx, Atlas.frames.the, 32, 82);
          Atlas.blit(ctx, Atlas.frames.the, 208, 82);
        }
        plant(250, 130);
      } else if (low.indexOf("poisson") >= 0 || low.indexOf("brik") >= 0) {
        box(20, 80, 90, 50, C.sea3, C.sea1);
        rect(28, 90, 20, 10, C.metal);
        rect(56, 88, 24, 12, C.white);
        if (Atlas.frames.brik) Atlas.blit(ctx, Atlas.frames.brik, 200, 90);
      } else if (low.indexOf("bijou") >= 0) {
        box(20, 80, 80, 40, C.navyD, C.gold);
        rect(28, 88, 12, 12, C.gold);
        rect(48, 90, 12, 8, C.red);
        rect(68, 88, 12, 12, C.metalL);
        desk(180, 120, "OR", C.navy);
      } else {
        box(18, 78, 72, 56, C.wood, C.woodL);
        rect(24, 86, 12, 12, C.gold);
        rect(42, 88, 12, 12, C.red);
        rect(60, 86, 12, 14, C.green);
        rect(24, 108, 10, 16, C.bottle);
        plant(240, 90);
      }
    } else if (kind === "cafe") {
      window_(20, 12);
      window_(80, 12);
      desk(120, 62, "DIRECT");
      rug(20, 100, 250, 16, C.navy, C.gold);
      table(24, 120);
      table(90, 150);
      table(170, 120);
      table(230, 150);
      if (Atlas.frames.the) Atlas.blit(ctx, Atlas.frames.the, 32, 112);
      if (Atlas.frames.bambalouni) Atlas.blit(ctx, Atlas.frames.bambalouni, 178, 112);
      plant(260, 70);
    } else if (kind === "cabaret") {
      rect(70, 8, 160, 40, C.redD);
      rect(80, 14, 140, 28, C.gold);
      ctx.fillStyle = C.ink;
      ctx.font = "8px monospace";
      ctx.fillText("CABARET", 118, 32);
      lantern(16, 12);
      lantern(w - 28, 12);
      lantern(50, 12);
      lantern(w - 62, 12);
      box(16, 70, 90, 28, C.woodX, C.wood);
      ctx.fillStyle = C.goldL;
      ctx.fillText("BAR", 46, 88);
      rect(200, 78, 18, 14, Math.sin(t * 9) > 0 ? C.red : C.gold);
      rect(228, 78, 18, 14, Math.sin(t * 9 + 1) > 0 ? C.blueL : C.gold);
      rect(200, 108, 18, 14, C.navy);
      rect(228, 108, 18, 14, C.navyL);
      rug(110, 120, 80, 40, C.redD, C.gold);
    } else if (kind === "hotel") {
      window_(16, 12);
      window_(52, 12);
      window_(w - 46, 12);
      desk(110, 62, "ACCUEIL", C.navy);
      box(16, 100, 70, 22, C.navyL, C.white);
      ctx.fillStyle = C.gold;
      ctx.font = "8px monospace";
      ctx.fillText("4 ETOILES", 22, 36);
      if (Atlas.frames.lounge) {
        Atlas.blit(ctx, Atlas.frames.lounge, 200, 110);
        Atlas.blit(ctx, Atlas.frames.lounge, 230, 114);
      }
      plant(260, 70);
      plant(16, 140);
      rug(110, 130, 70, 24, C.navy, C.gold);
    } else if (kind === "airport") {
      window_(12, 10);
      window_(42, 10);
      window_(72, 10);
      window_(w - 46, 10);
      desk(100, 62, "DJE", C.metalD);
      box(16, 96, 32, 16, C.white, C.navy);
      box(54, 96, 32, 16, C.white, C.navy);
      box(16, 120, 32, 16, C.white, C.navy);
      if (Atlas.frames.plane) Atlas.blit(ctx, Atlas.frames.plane, 196, 14);
      ctx.fillStyle = C.gold;
      ctx.font = "8px monospace";
      ctx.fillText("GATE A", 210, 100);
      ctx.fillText("TUNISAIR", 200, 130);
      rect(200, 140, 60, 8, C.navy);
    } else if (kind === "mosque") {
      pillar(20, 8);
      pillar(w - 30, 8);
      box(w / 2 - 22, 8, 44, 40, C.white, C.gold);
      rect(w / 2 - 6, 4, 12, 10, C.gold);
      rug(24, 80, 70, 90, C.greenD, C.gold);
      rug(110, 90, 70, 80, C.greenD, C.gold);
      rug(196, 80, 70, 90, C.greenD, C.gold);
      lantern(w / 2 - 6, 16);
    } else if (kind === "synagogue") {
      box(w / 2 - 24, 8, 48, 42, C.white, C.blue);
      rect(w / 2 - 8, 18, 16, 16, C.gold);
      rect(w / 2 - 2, 12, 4, 28, C.gold);
      rect(w / 2 - 10, 24, 20, 4, C.gold);
      window_(16, 14);
      window_(w - 46, 14);
      bench(24, 90);
      bench(24, 120);
      bench(210, 90);
      bench(210, 120);
      table(124, 110);
      rug(110, 150, 70, 20, C.blue, C.gold);
    } else if (kind === "fort") {
      window_(18, 14, true);
      window_(w - 48, 14, true);
      box(24, 70, 44, 70, C.sandE, C.sandC);
      box(220, 70, 44, 70, C.sandE, C.sandC);
      rect(32, 90, 28, 10, C.navyD);
      rect(228, 90, 28, 10, C.navyD);
      desk(110, 64, "BORJ", C.sandE);
      rect(130, 120, 40, 8, C.metalD);
      rect(138, 112, 24, 10, C.metal);
    } else if (kind === "museum") {
      window_(16, 12);
      window_(w - 46, 12);
      desk(110, 62, "MUSEE", C.navy);
      box(20, 88, 36, 40, C.goldD, C.gold);
      box(64, 88, 36, 40, C.terra, C.terraL);
      box(200, 88, 36, 40, C.blue, C.blueL);
      box(244, 88, 36, 40, C.greenD, C.greenL);
      ctx.fillStyle = C.white;
      ctx.font = "8px monospace";
      ctx.fillText("1", 34, 112);
      ctx.fillText("2", 78, 112);
      ctx.fillText("3", 214, 112);
    } else if (kind === "workshop") {
      window_(16, 14);
      desk(110, 62, low.indexOf("tiss") >= 0 ? "METIER" : "ATELIER");
      if (low.indexOf("tiss") >= 0) {
        box(20, 88, 80, 50, C.wood, C.woodL);
        rug(24, 94, 72, 16, C.red, C.gold);
        rug(24, 114, 72, 16, C.navy, C.white);
      } else if (low.indexOf("alfa") >= 0 || low.indexOf("panier") >= 0) {
        pot(24, 100);
        pot(48, 110);
        pot(72, 100);
        pot(40, 140);
      } else {
        box(20, 88, 70, 48, C.terra, C.terraL);
        rect(30, 100, 14, 14, C.goldD);
        rect(52, 96, 18, 18, C.sandE);
      }
      plant(250, 90);
    } else if (kind === "kiln" || kind === "oven") {
      box(108, 58, 84, 70, C.terraD, C.terra);
      rect(128, 88, 44, 28, Math.sin(t * 7) > 0 ? C.red : C.gold);
      rect(136, 96, 28, 12, C.goldL);
      pot(20, 80);
      pot(48, 100);
      pot(24, 130);
      pot(230, 90);
      pot(250, 120);
      desk(20, 64, kind === "oven" ? "PAIN" : "ARGILE", C.terraD);
    } else if (kind === "mill") {
      window_(18, 14);
      desk(110, 62, "HUILE", C.woodX);
      box(36, 90, 48, 48, C.woodD, C.woodL);
      box(200, 90, 48, 48, C.woodD, C.woodL);
      rect(48, 102, 24, 24, C.goldD);
      rect(212, 102, 24, 24, C.goldD);
      rect(120, 140, 60, 16, C.sandE);
    } else if (kind === "menzel") {
      window_(16, 14);
      window_(w - 46, 14);
      rect(80, 70, 140, 90, C.ink);
      for (let y = 74; y < 156; y += 16) {
        for (let x = 84; x < 216; x += 16) {
          if (Atlas.tiles.plaza) ctx.drawImage(Atlas.tiles.plaza, x, y);
        }
      }
      rect(80, 70, 140, 4, C.wallS);
      rect(80, 70, 4, 90, C.wallS);
      rect(216, 70, 4, 90, C.wallS);
      box(136, 100, 28, 20, C.cobbleB, C.wall);
      rect(140, 104, 20, 8, C.blueL);
      plant(90, 80);
      plant(190, 80);
      if (variant === 0) bed(16, 80, C.navy);
      else bench(16, 90);
      table(230, 150);
    } else if (kind === "cistern") {
      box(70, 64, 160, 90, C.navyD, C.sandE);
      const wave = 10 + Math.sin(t * 2) * 4;
      rect(78, 72 + wave, 144, 70 - wave, C.blue);
      rect(78, 72 + wave, 144, 6, C.blueL);
      rect(86, 88, 20, 4, C.white);
      ctx.fillStyle = C.white;
      ctx.font = "8px monospace";
      ctx.fillText("CITERNE", 118, 50);
    } else if (kind === "cemetery") {
      window_(16, 14);
      window_(w - 46, 14);
      graves(30, 80);
      graves(90, 80);
      graves(150, 80);
      graves(210, 80);
      graves(60, 130);
      graves(180, 130);
      plant(250, 90);
    } else if (kind === "graffiti") {
      const cols = [C.red, C.blue, C.gold, C.green, C.terra, C.navyL];
      for (let i = 0; i < 6; i++) {
        rect(10 + i * 46, 8, 42, 42, cols[i]);
        rect(14 + i * 46, 12, 34, 12, C.white);
      }
      desk(100, 70, "HOOD", C.navy);
      table(36, 130);
      plant(240, 120);
    }

    const dx = w / 2 - 10;
    const dy = h - 28;
    box(dx - 2, dy - 2, 24, 26, C.woodD, C.wood);
    rect(dx + 14, dy + 10, 2, 2, C.gold);
    ctx.fillStyle = C.white;
    ctx.font = "8px monospace";
    ctx.fillText(title || "SALLE", 12, 16);
    ctx.fillText("PORTE", dx - 4, dy - 6);
  }

  function drawStall(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 28, 28)) return;
    Atlas.blit(ctx, Atlas.frames.stall, x, y);
  }

  function drawMinaret(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 20, 72)) return;
    Atlas.blit(ctx, Atlas.frames.minaret, x, y);
  }

  function drawLamp(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 10, 22)) return;
    Atlas.blit(ctx, Atlas.frames.lamp, x, y);
  }

  function drawFountain(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 28, 22)) return;
    Atlas.blit(ctx, Atlas.frames.fountain, x, y);
  }

  function drawHouseWarm(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 48, 56)) return;
    Atlas.blit(ctx, Atlas.frames.houseWarm, x, y);
  }

  function hRoad(ctx, x, y, w, cam) {
    for (let tx = x; tx < x + w; tx += 16) {
      if (cam && (tx + 16 < cam.x || tx > cam.x + cam.vw)) continue;
      ctx.drawImage(Atlas.tiles.roadH, tx, y);
      ctx.drawImage(Atlas.tiles.roadH, tx, y + 16);
    }
  }

  function vRoad(ctx, x, y, h, cam) {
    for (let ty = y; ty < y + h; ty += 16) {
      if (cam && (ty + 16 < cam.y || ty > cam.y + cam.vh)) continue;
      ctx.drawImage(Atlas.tiles.roadV, x, ty);
      ctx.drawImage(Atlas.tiles.roadV, x + 16, ty);
    }
  }

  function cobbleFill(ctx, x, y, w, h, cam) {
    const x0 = cam ? Math.max(x, (cam.x / TILE | 0) * TILE) : x;
    const y0 = cam ? Math.max(y, (cam.y / TILE | 0) * TILE) : y;
    const x1 = cam ? Math.min(x + w, cam.x + cam.vw + TILE) : x + w;
    const y1 = cam ? Math.min(y + h, cam.y + cam.vh + TILE) : y + h;
    for (let ty = y0; ty < y1; ty += TILE) {
      for (let tx = x0; tx < x1; tx += TILE) {
        ctx.drawImage(((tx + ty) / 16 | 0) % 2 ? Atlas.tiles.cobble0 : Atlas.tiles.cobble1, tx, ty);
      }
    }
  }

  function drawLighthouse(ctx, x, y, t, cam) {
    if (cam && !Atlas.inView(cam, x, y, 24, 64)) return;
    const on = Math.sin(t * 5) > 0;
    Atlas.blit(ctx, on ? Atlas.frames.lhOn : Atlas.frames.lhOff, x, y);
  }

  function drawBoat(ctx, x, y, t, cam) {
    const bob = Math.sin(t * 2.2) * 2;
    if (cam && !Atlas.inView(cam, x, y + bob, 36, 20)) return;
    Atlas.blit(ctx, Atlas.frames.boat, x, y + bob);
  }

  function drawSign(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 24, 40)) return;
    Atlas.blit(ctx, Atlas.frames.sign, x, y);
  }

  function drawFlag(ctx, x, y, kind, t, cam) {
    if (cam && !Atlas.inView(cam, x, y, 22, 28)) return;
    const f = Math.sin(t * 6 + x) > 0 ? 1 : 0;
    const img = kind === "il"
      ? (f ? Atlas.frames.flagIl1 : Atlas.frames.flagIl0)
      : (f ? Atlas.frames.flagTn1 : Atlas.frames.flagTn0);
    Atlas.blit(ctx, img, x, y);
  }

  function drawBush(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 24, 16)) return;
    Atlas.blit(ctx, Atlas.frames.bush, x, y);
  }

  function drawRock(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 16, 12)) return;
    Atlas.blit(ctx, Atlas.frames.rock, x, y);
  }

  function drawTowel(ctx, x, y, cam, col) {
    if (cam && !Atlas.inView(cam, x, y, 12, 20)) return;
    ctx.fillStyle = Atlas.C.ink;
    ctx.fillRect(x, y, 12, 20);
    ctx.fillStyle = col || Atlas.C.red;
    ctx.fillRect(x + 1, y + 1, 10, 18);
    ctx.fillStyle = Atlas.C.white;
    ctx.fillRect(x + 2, y + 2, 8, 3);
  }

  function beachClub(ctx, origin, cam) {
    const cols = [Atlas.C.red, Atlas.C.blue, Atlas.C.gold, Atlas.C.green, Atlas.C.navyL];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const x = origin.x + c * 38 - 90;
        const y = origin.y + r * 30 + 8;
        drawUmbrella(ctx, x, y, cam);
        if ((c + r) % 2 === 0) drawTowel(ctx, x + 18, y + 14, cam, cols[(c + r) % cols.length]);
        if ((c + r) % 3 === 0 && Atlas.frames.lounge) {
          Atlas.blit(ctx, Atlas.frames.lounge, x + 6, y + 20);
        }
      }
    }
    [[-100, 70], [80, 78], [40, 96], [-40, 88]].forEach(([ox, oy]) => {
      drawRock(ctx, origin.x + ox, origin.y + oy, cam);
    });
  }

  function drawUmbrella(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 32, 32)) return;
    Atlas.blit(ctx, Atlas.frames.umbrella, x, y);
  }

  function drawSeagull(ctx, x, y, t, seed) {
    const ox = x + Math.sin(t * 0.35 + seed) * 48;
    const oy = y + Math.cos(t * 0.5 + seed) * 6;
    const img = Math.sin(t * 8 + seed) > 0 ? Atlas.frames.gull1 : Atlas.frames.gull0;
    Atlas.blit(ctx, img, ox, oy);
  }

  function drawBin(ctx, x, y, t, cam) {
    const wob = Math.sin(t * 10) * 0.4;
    if (cam && !Atlas.inView(cam, x, y, 20, 24)) return;
    Atlas.blit(ctx, Atlas.frames.bin, x + wob, y);
  }

  function drawTrash(ctx, item, t, cam) {
    if (cam && !Atlas.inView(cam, item.x - 4, item.y - 2, 22, 24)) return;
    const bob = item.rare && Math.sin(t * 6 + item.y) > 0 ? 0 : (item.rare ? -2 : 0);
    ctx.fillStyle = "rgba(32, 16, 8, 0.5)";
    ctx.fillRect(item.x + 1, item.y + 11 + bob, 14, 5);
    ctx.fillStyle = "rgba(12, 8, 4, 0.28)";
    ctx.fillRect(item.x + 3, item.y + 13 + bob, 10, 3);
    const img = Atlas.frames[item.type] || Atlas.frames.can;
    Atlas.blit(ctx, img, item.x, item.y + bob);
    if (item.type === "bag" || item.type === "peel") {
      const fx = item.x + 7 + Math.sin(t * 10 + item.x) * 5;
      const fy = item.y - 2 + Math.cos(t * 13 + item.y) * 3;
      ctx.fillStyle = "#140c1c";
      ctx.fillRect(fx, fy, 2, 1);
      ctx.fillRect(fx + 4 + Math.sin(t * 7), fy + 3, 1, 1);
    }
    if (item.rare) {
      ctx.fillStyle = "rgba(252,188,20,0.35)";
      ctx.fillRect(item.x - 1, item.y + bob + 10, 18, 3);
      if (Math.sin(t * 8 + item.x) > 0.2) {
        ctx.fillStyle = "#fcbc14";
        ctx.fillRect(item.x + 12, item.y + bob - 3, 2, 2);
        ctx.fillRect(item.x + 2, item.y + bob + 2, 1, 1);
      }
    }
  }

  function drawFilth(ctx, world, t, cam) {
    const dirty = 1 - World.cleanliness(world) / 100;
    if (dirty < 0.04) return;
    const x0 = cam ? cam.x - 8 : 0;
    const y0 = cam ? Math.max(320, cam.y - 8) : 320;
    const x1 = cam ? cam.x + cam.vw + 8 : world.W;
    const y1 = cam ? cam.y + cam.vh + 8 : world.H;
    const a = 0.12 + dirty * 0.42;

    for (const s of world.stains || []) {
      if (s.x > x1 || s.x + s.w < x0 || s.y > y1 || s.y + s.h < y0) continue;
      if (s.kind === 0) {
        ctx.fillStyle = `rgba(48, 28, 12, ${a})`;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = `rgba(20, 12, 8, ${a * 0.7})`;
        ctx.fillRect(s.x + 2, s.y + 1, Math.max(3, s.w - 4), Math.max(2, s.h - 3));
      } else if (s.kind === 1) {
        ctx.fillStyle = `rgba(16, 16, 12, ${a * 0.85})`;
        ctx.fillRect(s.x, s.y, s.w * 0.7, s.h);
        ctx.fillRect(s.x + 3, s.y + 2, s.w * 0.5, 2);
      } else if (s.kind === 2) {
        ctx.fillStyle = `rgba(72, 48, 24, ${a})`;
        ctx.fillRect(s.x, s.y, 3, 2);
        ctx.fillRect(s.x + 5, s.y + 3, 2, 2);
        ctx.fillRect(s.x + 2, s.y + 5, 4, 1);
      } else if (s.kind === 3) {
        ctx.fillStyle = `rgba(36, 40, 28, ${a * 0.75})`;
        ctx.fillRect(s.x, s.y, s.w, 3);
        ctx.fillRect(s.x + 1, s.y + 2, s.w - 3, 2);
      } else {
        ctx.fillStyle = `rgba(90, 40, 16, ${a * 0.6})`;
        ctx.fillRect(s.x, s.y, 5, 4);
        ctx.fillRect(s.x + 4, s.y + 1, 6, 3);
      }
    }

    const step = 16;
    const tx0 = (x0 / step | 0) * step;
    const ty0 = (y0 / step | 0) * step;
    for (let ty = ty0; ty < y1; ty += step) {
      for (let tx = tx0; tx < x1; tx += step) {
        const h = ((tx * 374761 + ty * 668265) >>> 0) % 11;
        if (h > dirty * 9) continue;
        ctx.fillStyle = `rgba(40, 22, 10, ${0.14 + dirty * 0.22})`;
        ctx.fillRect(tx + (h % 9), ty + ((h * 3) % 8), 2 + (h % 5), 1 + (h % 3));
        if (h < 2 && dirty > 0.35) {
          ctx.fillStyle = `rgba(12, 12, 10, ${0.2 + dirty * 0.2})`;
          ctx.fillRect(tx + 4, ty + 6, 6, 2);
        }
      }
    }

    const sandY = 320;
    if (!cam || cam.y < sandY + 20) {
      ctx.fillStyle = `rgba(20, 28, 24, ${0.2 + dirty * 0.35})`;
      for (let i = 0; i < 18; i++) {
        const sx = (i * 53 + 20) % world.W;
        if (cam && (sx < cam.x - 8 || sx > cam.x + cam.vw)) continue;
        ctx.fillRect(sx, sandY - 10 + (i % 3) * 3, 3 + (i % 4), 2);
      }
    }
  }

  function drawCar(ctx, car, t, cam) {
    if (!car) return;
    if (cam && !Atlas.inView(cam, car.x, car.y, 40, 20)) return;
    const img = Atlas.frames[car.sprite] || Atlas.frames.carWhite;
    if (!img) return;
    if ((car.facing || 1) < 0) {
      ctx.save();
      ctx.translate((car.x + 40) | 0, car.y | 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } else {
      Atlas.blit(ctx, img, car.x, car.y);
    }
    if (car.taxi && Math.sin(t * 9) > 0) {
      ctx.fillStyle = "#fff46c";
      ctx.fillRect((car.x + 18) | 0, (car.y - 1) | 0, 4, 2);
    }
  }

  function drawProps(ctx, t, cam) {
    if (typeof Island === "undefined" || !Island.props) return;
    const list = Island.props();
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.kind === "palm") drawPalm(ctx, p.x, p.y, t, p.seed || i, cam);
      else if (p.kind === "bush") drawBush(ctx, p.x, p.y, cam);
      else if (p.kind === "rock") drawRock(ctx, p.x, p.y, cam);
    }
  }

  function drawPlayer(ctx, p, goldHat, t, cam) {
    const moving = !p.ride && Math.hypot(p.vx || 0, p.vy || 0) > 8;
    const walk = moving ? Math.floor(t * 12) % 4 : (p.ride ? 0 : (Math.sin(t * 3) > 0.85 ? 2 : 0));
    const face = (p.facing || 1) >= 0 ? 1 : -1;
    const atk = p.attacking ? 1 : 0;
    const gold = goldHat ? 1 : 0;
    const key = `${face}_${walk}_${atk}_${gold}`;
    const img = Atlas.frames.player[key] || Atlas.frames.player["1_0_0_0"];
    if (cam && !Atlas.inView(cam, p.x, p.y, Atlas.PW, Atlas.PH)) return;
    Atlas.blit(ctx, img, p.x, p.y);
  }

  function drawNpc(ctx, n, t, cam) {
    const animal = n.style === "dog" || n.style === "cat" || n.style === "catGinger";
    const aw = animal ? 24 : Atlas.PW;
    const ah = animal ? 16 : Atlas.PH;
    if (cam && !Atlas.inView(cam, n.x, n.y, aw, ah)) return;
    const moving = Math.hypot(n.vx || 0, n.vy || 0) > 6;
    const idle = !moving && Math.sin(t * 3 + n.y) > 0.82 ? 2 : 0;
    const walk = moving ? Math.floor(t * 10) % 4 : idle;
    const face = (n.facing || 1) >= 0 ? 1 : -1;
    if (animal) {
      const pack = Atlas.frames.stray && Atlas.frames.stray[n.style];
      const img = pack && (pack[`${face}_${walk}`] || pack[`${face}_0`]);
      if (img) Atlas.blit(ctx, img, n.x, n.y);
    } else {
      const act = n.acting ? 1 : 0;
      const pack = Atlas.frames.npc && Atlas.frames.npc[n.style];
      const img = pack && (pack[`${face}_${walk}_${act}`] || pack[`${face}_0_0`]);
      if (img) Atlas.blit(ctx, img, n.x, n.y);
      const st = Atlas.NPC_STYLES && Atlas.NPC_STYLES[n.style];
      if (st && st.tool === "smoke" && !st.kid) {
        const puff = n.acting || Math.sin(t * 4 + n.y) > 0.55;
        if (puff) {
          const side = (n.facing || 1) >= 0 ? 1 : -1;
          const px = n.x + (side > 0 ? 26 : 4);
          const py = n.y + 8 - ((t * 18 + n.x) % 8);
          ctx.fillStyle = "rgba(220,220,220,0.7)";
          ctx.fillRect(px, py, 2, 2);
          ctx.fillRect(px + side, py - 3, 1, 1);
        }
      }
    }
    if (n.prompt && !(n.bubble > 0)) {
      const bx = n.x + (animal ? 8 : 12);
      const by = n.y - 12;
      ctx.fillStyle = "#140c1c";
      ctx.fillRect(bx, by, 9, 11);
      ctx.fillStyle = "#fcbc14";
      ctx.fillRect(bx + 1, by + 1, 7, 9);
      ctx.fillStyle = "#140c1c";
      ctx.fillRect(bx + 3, by + 2, 3, 4);
      ctx.fillRect(bx + 3, by + 7, 3, 2);
    }
  }

  function themeSky(theme) {
    const map = {
      beach: ["#5ec8fc", "#3aacfc", "#2090dc"],
      souk: ["#7ad0fc", "#48b0e8", "#2c90c8"],
      lagoon: ["#70e0fc", "#40c0e8", "#2098c8"],
      port: ["#68b8e8", "#3c90c8", "#206898"],
      sunset: ["#fcb068", "#f08050", "#c05070"],
      resort: ["#80d8fc", "#50b8f0", "#308fd0"],
      festival: ["#b090fc", "#7860d8", "#4840a8"],
    };
    return map[theme] || map.beach;
  }

  function drawHeritage(ctx, cam) {
    if (typeof Places === "undefined" || !Places.SITES) return;
    ctx.font = "6px monospace";
    for (const s of Places.SITES) {
      if (cam && !Atlas.inView(cam, s.x, s.y - 4, s.w, s.h + 12)) continue;
      const img = Atlas.frames[s.sprite];
      if (img) Atlas.blit(ctx, img, s.x, s.y);
      const label = s.short || s.title;
      ctx.fillStyle = "rgba(20,12,28,0.7)";
      ctx.fillRect(s.x, s.y + s.h + 1, Math.min(s.w, 4 + label.length * 4), 8);
      ctx.fillStyle = "#fce46c";
      ctx.fillText(label, s.x + 2, s.y + s.h + 7);
    }
  }

  function drawCoastFoam(ctx, t, cam) {
    const poly = Island.poly;
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, (len / 14) | 0);
      for (let k = 0; k < steps; k++) {
        const u = (k + 0.5) / steps;
        const x = a.x + (b.x - a.x) * u;
        const y = a.y + (b.y - a.y) * u;
        if (cam && !Atlas.inView(cam, x - 10, y - 10, 20, 20)) continue;
        const dx = x - Island.cx;
        const dy = y - Island.cy;
        const inv = 1 / (Math.hypot(dx, dy) || 1);
        const pulse = 5 + Math.sin(t * 5 + i * 0.7 + k * 0.45) * 4;
        const ox = x + dx * inv * pulse;
        const oy = y + dy * inv * pulse;
        const w = 4 + ((i + k) % 3);
        ctx.fillStyle = ((i + k + (t * 6 | 0)) & 1) ? Atlas.C.foam : Atlas.C.foamD;
        ctx.fillRect((ox - w / 2) | 0, (oy - 1) | 0, w, 2);
      }
    }
  }

  function drawFerry(ctx, t, cam) {
    const aj = Island.xy("ajim");
    const destX = 90;
    const destY = Island.H - 140;
    ctx.save();
    ctx.strokeStyle = Atlas.C.foam;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -((t * 14) % 14);
    ctx.beginPath();
    ctx.moveTo(aj.x - 70, aj.y + 36);
    ctx.lineTo(destX, destY);
    ctx.stroke();
    ctx.restore();
    const fx = destX + (aj.x - 70 - destX) * (0.35 + Math.sin(t * 0.35) * 0.2);
    const fy = destY + (aj.y + 36 - destY) * (0.35 + Math.sin(t * 0.35) * 0.2);
    drawBoat(ctx, fx - 16, fy - 8, t + 3.2, cam);
  }

  function drawWorldBg(ctx, W, H, t, theme = "beach", cam) {
    Atlas.bake();
    Island.bake();
    const sky = themeSky(theme);
    ctx.fillStyle = sky[2];
    if (cam) ctx.fillRect(cam.x - 8, cam.y - 8, cam.vw + 16, cam.vh + 16);
    else ctx.fillRect(0, 0, W, H);

    const seaA = seaFrame(1, t);
    const seaB = seaFrame(2, t + 0.5);
    const sx0 = cam ? Math.max(0, (cam.x / TILE | 0) * TILE - TILE) : 0;
    const sy0 = cam ? Math.max(0, (cam.y / TILE | 0) * TILE - TILE) : 0;
    const sx1 = cam ? Math.min(W, cam.x + cam.vw + TILE) : W;
    const sy1 = cam ? Math.min(H, cam.y + cam.vh + TILE) : H;
    for (let ty = sy0; ty < sy1; ty += TILE) {
      for (let tx = sx0; tx < sx1; tx += TILE) {
        ctx.drawImage(((tx + ty) >> 4) & 1 ? seaA : seaB, tx, ty);
      }
    }

    Island.drawGround(ctx, cam);
    drawProps(ctx, t, cam);
    drawCoastFoam(ctx, t, cam);
    drawFerry(ctx, t, cam);

    function blitSign(frame, name, ox, oy) {
      if (!frame) return;
      const p = Island.xy(name);
      Atlas.blit(ctx, frame, p.x + (ox || 0), p.y + (oy || -20));
    }
    blitSign(Atlas.frames.signHoumt, "houmt", -40, -50);
    blitSign(Atlas.frames.signVille, "houmt", 40, -50);
    blitSign(Atlas.frames.signSouk, "houmt", -220, -50);
    blitSign(Atlas.frames.signAjim, "ajim", -20, -40);
    blitSign(Atlas.frames.signPort, "portHoumt", 20, -40);
    blitSign(Atlas.frames.signPlage, "sidi", -20, -30);
    blitSign(Atlas.frames.signHotel, "hotel", 10, -30);
    blitSign(Atlas.frames.signPool, "hotel", 90, 50);
    blitSign(Atlas.frames.signAirport, "airport", 0, -30);
    blitSign(Atlas.frames.signMidounV, "midoun", -20, -50);
    blitSign(Atlas.frames.signErriadh, "erriadh", -40, -60);
    blitSign(Atlas.frames.signElMay, "elmay", -20, -50);
    blitSign(Atlas.frames.signGuellala, "guellala", -40, -60);
    blitSign(Atlas.frames.signExplore, "explore", -20, -50);
    blitSign(Atlas.frames.signAghir, "aghir", -20, -40);
    blitSign(Atlas.frames.signMezraya, "mezraya", -20, -40);
    blitSign(Atlas.frames.signSedouik, "sedouikech", -20, -40);
    blitSign(Atlas.frames.signMahboub, "mahboubine", -20, -40);

    if (typeof Places !== "undefined" && Places.TOWN) {
      Places.TOWN.forEach((b, i) => {
        if (cam && !Atlas.inView(cam, b.x, b.y, b.w, b.h)) return;
        if (b.room === "home" || b.room === "cafe") {
          if (i % 2) drawHouseWarm(ctx, b.x, b.y, cam);
          else drawHouse(ctx, b.x, b.y, cam);
        } else if (b.room === "shop") {
          if (b.w < 32) drawStall(ctx, b.x, b.y, cam);
          else drawShop(ctx, b.x, b.y, cam);
        } else if (b.room === "cabaret") {
          drawCabaret(ctx, b.x, b.y, cam);
          if (Atlas.frames.signCabaret) Atlas.blit(ctx, Atlas.frames.signCabaret, b.x + 4, b.y - 16);
        } else if (b.room === "hotel" && Atlas.frames.hotel) {
          Atlas.blit(ctx, Atlas.frames.hotel, b.x, b.y);
        } else if (b.room === "airport" && Atlas.frames.airport) {
          Atlas.blit(ctx, Atlas.frames.airport, b.x, b.y);
        }
      });
    }

    const hot = Island.xy("hotel");
    drawPool(ctx, hot.x + 80, hot.y + 50, t, cam);
    if (Atlas.frames.lounge) {
      Atlas.blit(ctx, Atlas.frames.lounge, hot.x + 70, hot.y + 100);
      Atlas.blit(ctx, Atlas.frames.lounge, hot.x + 140, hot.y + 104);
    }
    const air = Island.xy("airport");
    tileFill(ctx, Atlas.tiles.stone, air.x - 20, air.y + 50, 240, 28, cam);
    if (Atlas.frames.plane) Atlas.blit(ctx, Atlas.frames.plane, air.x + 40, air.y + 40);

    const ph = Island.xy("portHoumt");
    drawLighthouse(ctx, ph.x + 80, ph.y - 90, t, cam);
    drawBoat(ctx, ph.x + 20, ph.y - 50, t, cam);
    drawBoat(ctx, ph.x + 90, ph.y - 40, t + 1.1, cam);
    const aj = Island.xy("ajim");
    drawBoat(ctx, aj.x - 70, aj.y + 20, t + 0.4, cam);
    drawBoat(ctx, aj.x - 30, aj.y + 50, t + 2, cam);
    drawBoat(ctx, aj.x - 110, aj.y + 70, t + 2.8, cam);

    const sidi = Island.xy("sidi");
    beachClub(ctx, sidi, cam);
    const agh = Island.xy("aghir");
    beachClub(ctx, { x: agh.x, y: agh.y + 10 }, cam);
    beachClub(ctx, { x: hot.x + 40, y: hot.y + 30 }, cam);
    Island.poly.forEach((p, i) => {
      drawPalm(ctx, p.x - 16, p.y - 22, t, i, cam);
      if (i % 2 === 0) drawPalm(ctx, p.x + 10, p.y - 8, t, i + 7, cam);
    });
    [
      ["lagoon", -40, 20], ["lagoon", 30, 50], ["lagoon", -10, 80], ["lagoon", 70, 10],
      ["elmay", 50, 90], ["elmay", -70, 70], ["elmay", 20, 40],
      ["guellala", -80, 10], ["guellala", 90, 70], ["guellala", 40, 20],
      ["ajim", 40, 80], ["ajim", -40, 90],
      ["midoun", 40, 120], ["erriadh", -40, 90],
    ].forEach(([name, ox, oy], i) => {
      const p = Island.xy(name);
      drawPalm(ctx, p.x + ox, p.y + oy, t, i + 11, cam);
    });
    [
      ["lagoon", 10, 10], ["lagoon", 60, 40], ["lagoon", -30, 50],
      ["elmay", -20, 100], ["elmay", 80, 60],
      ["guellala", 20, 110], ["guellala", -50, 80], ["guellala", 70, 40],
    ].forEach(([name, ox, oy]) => {
      const p = Island.xy(name);
      drawBush(ctx, p.x + ox, p.y + oy, cam);
    });
    if (Atlas.frames.hill) {
      const lg = Island.xy("lagoon");
      Atlas.blit(ctx, Atlas.frames.hill, lg.x - 40, lg.y - 10);
      Atlas.blit(ctx, Atlas.frames.hill, lg.x + 80, lg.y + 40);
      const em = Island.xy("elmay");
      Atlas.blit(ctx, Atlas.frames.hill, em.x - 90, em.y + 20);
      Atlas.blit(ctx, Atlas.frames.hill, em.x + 70, em.y - 30);
      const gu = Island.xy("guellala");
      Atlas.blit(ctx, Atlas.frames.hill, gu.x - 70, gu.y - 40);
      const md = Island.xy("midoun");
      Atlas.blit(ctx, Atlas.frames.hill, md.x - 110, md.y + 90);
    }
    const houmt = Island.xy("houmt");
    [[-60, 40], [40, 40], [120, 10], [-140, 10], [200, 80], [-200, 40], [80, 100], [-40, 120]].forEach(([ox, oy]) => {
      drawLamp(ctx, houmt.x + ox, houmt.y + oy, cam);
    });
    const mid = Island.xy("midoun");
    drawLamp(ctx, mid.x - 30, mid.y + 20, cam);
    drawLamp(ctx, mid.x + 50, mid.y + 20, cam);
    drawLamp(ctx, mid.x + 10, mid.y + 80, cam);
    drawLamp(ctx, aj.x + 10, aj.y - 10, cam);
    drawLamp(ctx, aj.x + 70, aj.y + 40, cam);
    Island.loopPts().forEach((p, i) => {
      if (i % 3) return;
      drawLamp(ctx, p.x - 18, p.y - 6, cam);
    });
    const em = Island.xy("elmay");
    drawLamp(ctx, em.x - 24, em.y + 16, cam);
    drawLamp(ctx, em.x + 40, em.y + 28, cam);
    const gu = Island.xy("guellala");
    drawLamp(ctx, gu.x - 20, gu.y + 10, cam);
    drawLamp(ctx, gu.x + 48, gu.y + 24, cam);
    const er = Island.xy("erriadh");
    drawLamp(ctx, er.x - 16, er.y + 20, cam);
    drawLamp(ctx, er.x + 36, er.y + 8, cam);
    drawStall(ctx, mid.x - 50, mid.y + 50, cam);
    drawStall(ctx, mid.x + 20, mid.y + 50, cam);
    tileFill(ctx, Atlas.tiles.stone, aj.x - 90, aj.y + 28, 80, 16, cam);
    drawFountain(ctx, Island.xy("plaza").x - 16, Island.xy("plaza").y, cam);
    drawMinaret(ctx, Island.xy("houmt").x + 200, Island.xy("houmt").y - 80, cam);
    drawFlag(ctx, sidi.x, sidi.y - 20, "tn", t, cam);
    drawFlag(ctx, ph.x, ph.y, "tn", t, cam);
    drawFlag(ctx, aj.x + 20, aj.y - 20, "tn", t, cam);
    drawFlag(ctx, hot.x + 90, hot.y, "il", t, cam);

    drawHeritage(ctx, cam);
    drawSeagull(ctx, sidi.x, sidi.y - 80, t, 0);
    drawSeagull(ctx, ph.x + 40, ph.y - 60, t, 2.1);
    drawSeagull(ctx, aj.x, aj.y - 40, t, 4.2);
  }

  function drawTitleScene(ctx, t) {
    Atlas.bake();
    const W = 280;
    const H = 150;
    ctx.fillStyle = "#3aacfc";
    ctx.fillRect(0, 0, W, 50);
    Atlas.blit(ctx, Atlas.frames.hill, -10, 28);
    Atlas.blit(ctx, Atlas.frames.cloud, 20, 8);
    Atlas.blit(ctx, Atlas.frames.sun, 230, 2);
    tileFill(ctx, seaFrame(1, t), 0, 48, W, 32);
    tileFill(ctx, Atlas.tiles.foam[Math.floor(t * 6) % 3], 0, 72, W, 16);
    tileFill(ctx, Atlas.tiles.sand0, 0, 84, W, H);
    Atlas.blit(ctx, Atlas.frames.house, 4, 40);
    Atlas.blit(ctx, Math.sin(t * 5) > 0 ? Atlas.frames.lhOn : Atlas.frames.lhOff, 232, 20);
    Atlas.blit(ctx, Math.sin(t * 2) > 0 ? Atlas.frames.palm1 : Atlas.frames.palm0, 90, 36);
    Atlas.blit(ctx, Atlas.frames.boat, 150, 62);
    Atlas.blit(ctx, Atlas.frames.umbrella, 200, 88);
    const walk = Math.floor(t * 10) % 4;
    const atk = Math.sin(t * 2.5) > 0.7 ? 1 : 0;
    Atlas.blit(ctx, Atlas.frames.player[`1_${walk}_${atk}_0`], 118, 92);
    const npcPack = Atlas.frames.npc || {};
    const nWalk = Math.floor(t * 8) % 4;
    if (npcPack.tourF) Atlas.blit(ctx, npcPack.tourF[`-1_${nWalk}_0`], 40, 96);
    if (npcPack.localM) Atlas.blit(ctx, npcPack.localM[`1_${nWalk}_0`], 188, 98);
    if (npcPack.kidM) Atlas.blit(ctx, npcPack.kidM[`1_${Math.floor(t * 14) % 4}_0`], 78, 108);
    Atlas.blit(ctx, Atlas.frames.bin, 150, 102);
    Atlas.blit(ctx, Atlas.frames.can, 50, 118);
    Atlas.blit(ctx, Atlas.frames.bottle, 210, 108);
    Atlas.blit(ctx, Atlas.frames.bag, 30, 120);
    Atlas.blit(ctx, Atlas.frames.gull0, 70 + Math.sin(t) * 8, 18);
  }

  function drawTitleBackground(ctx, W, H, t) {
    const p = Island.xy("houmt");
    const cam = { x: p.x - W / 2, y: p.y - H / 3, vw: W, vh: H };
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    drawWorldBg(ctx, Island.W, Island.H, t, "beach", cam);
    ctx.restore();
  }

  function drawCinematic(ctx, vw, vh, t) {
    Atlas.bake();
    const p = Island.xy("sidi");
    const WW = Island.W;
    const WH = Island.H;
    const zoom = 1.32;
    const camW = vw / zoom;
    const camH = vh / zoom;
    const camX = Math.max(0, Math.min(WW - camW, p.x - 80 + (t * 18) % 220));
    const camY = Math.max(0, Math.min(WH - camH, p.y - 40 + Math.sin(t * 0.16) * 28));
    const cam = { x: camX, y: camY, vw: camW, vh: camH };
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);
    drawWorldBg(ctx, WW, WH, t, "sunset", cam);
    const walk = Math.floor(t * 9) % 4;
    const nWalk = Math.floor(t * 8) % 4;
    const pack = Atlas.frames.npc || {};
    const px = p.x - 40 + (t * 20) % 180;
    Atlas.blit(ctx, Atlas.frames.player[`1_${walk}_1_0`], px, p.y + 20);
    Atlas.blit(ctx, Atlas.frames.bin, px + 34, p.y + 32);
    if (pack.tourF) Atlas.blit(ctx, pack.tourF[`-1_${nWalk}_0`], p.x - 80, p.y + 40);
    if (pack.localM) Atlas.blit(ctx, pack.localM[`1_${nWalk}_0`], p.x + 40, p.y + 28);
    if (pack.kidM) Atlas.blit(ctx, pack.kidM[`1_${Math.floor(t * 14) % 4}_0`], p.x - 20, p.y + 50);
    if (pack.tourM) Atlas.blit(ctx, pack.tourM[`1_0_1`], p.x + 120, p.y);
    if (pack.elder) Atlas.blit(ctx, pack.elder[`-1_0_0`], p.x + 80, p.y + 20);
    Atlas.blit(ctx, Atlas.frames.can, p.x - 40, p.y + 60);
    Atlas.blit(ctx, Atlas.frames.bottle, p.x + 30, p.y + 48);
    Atlas.blit(ctx, Atlas.frames.bag, p.x + 90, p.y + 56);
    Atlas.blit(ctx, Atlas.frames.gull0, p.x - 80 + Math.sin(t) * 46, p.y - 160);
    Atlas.blit(ctx, Atlas.frames.gull1 || Atlas.frames.gull0, p.x + 80 + Math.cos(t * 0.7) * 40, p.y - 180);
    ctx.restore();
  }

  function drawAvatar(ctx, goldHat, t) {
    Atlas.bake();
    ctx.clearRect(0, 0, 40, 40);
    ctx.fillStyle = "#3aacfc";
    ctx.fillRect(0, 0, 40, 40);
    ctx.drawImage(Atlas.tiles.sand1, 0, 24);
    ctx.drawImage(Atlas.tiles.sand1, 16, 24);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const gold = goldHat ? 1 : 0;
    const walk = Math.floor((t || 0) * 8) % 4;
    Atlas.blit(ctx, Atlas.frames.player[`1_${walk}_0_${gold}`], 4, 0);
    ctx.restore();
  }

  function drawMinimap(ctx, W, H, trash, player, t, cam, npcs, rares) {
    const mw = 44;
    const mh = 44;
    const mx = (cam && cam.x != null ? cam.x : 0) + (cam && cam.vw ? cam.vw : W) - mw - 8;
    const my = (cam && cam.y != null ? cam.y : 0) + 36;
    ctx.fillStyle = Atlas.C.sea3;
    ctx.fillRect(mx, my, mw, mh);
    const g = Island.groundCanvas();
    if (g) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(g, mx, my, mw, mh);
    }
    ctx.strokeStyle = "rgba(110, 200, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    trash.forEach((tr) => {
      ctx.fillStyle = "#d43030";
      ctx.fillRect(mx + 3 + (tr.x / W) * (mw - 6), my + 3 + (tr.y / H) * (mh - 6), 2, 2);
    });
    (rares || []).forEach((r) => {
      ctx.fillStyle = "#fcbc14";
      ctx.fillRect(mx + 3 + (r.x / W) * (mw - 6), my + 3 + (r.y / H) * (mh - 6), 2, 2);
    });
    (npcs || []).forEach((n) => {
      ctx.fillStyle = n.style && n.style.startsWith("tour") ? "#70c8fc" : "#fce46c";
      ctx.fillRect(mx + 3 + (n.x / W) * (mw - 6), my + 3 + (n.y / H) * (mh - 6), 1, 1);
    });
    ctx.fillStyle = "#3cbc3c";
    ctx.fillRect(mx + 3 + (player.x / W) * (mw - 6), my + 3 + (player.y / H) * (mh - 6), 3, 3);
  }

  function drawIslandMap(ctx, W, H, t, unlocked, starsMap, selectedId, player) {
    Atlas.bake();
    Island.bake();
    const C = Atlas.C;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = C.sea1;
    ctx.fillRect(0, 0, W, H);
    tileFill(ctx, seaFrame(1, t), 0, 0, W, H);
    const g = Island.groundCanvas();
    const mw = Math.round(Math.min(W - 8, (H - 8) * (Island.W / Island.H)));
    const mh = Math.round(mw * (Island.H / Island.W));
    const ox = ((W - mw) / 2) | 0;
    const oy = ((H - mh) / 2) | 0;
    if (g) ctx.drawImage(g, ox, oy, mw, mh);

    function mx(x) { return ox + (x / Island.W) * mw; }
    function my(y) { return oy + (y / Island.H) * mh; }

    const n = Island.poly.length;
    ctx.fillStyle = C.foam;
    for (let i = 0; i < n; i++) {
      const a = Island.poly[i];
      if (Math.sin(t * 6 + i) > 0) ctx.fillRect(mx(a.x) | 0, my(a.y) | 0, 2, 2);
    }

    const aj = Island.xy("ajim");
    ctx.save();
    ctx.strokeStyle = C.foam;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.lineDashOffset = -((t * 10) % 6);
    ctx.beginPath();
    ctx.moveTo(mx(aj.x - 40), my(aj.y + 20));
    ctx.lineTo(ox + 8, oy + mh - 18);
    ctx.stroke();
    ctx.restore();

    function pin(x, y, col) {
      ctx.fillStyle = C.ink;
      ctx.fillRect((x - 3) | 0, (y - 3) | 0, 7, 7);
      ctx.fillStyle = col;
      ctx.fillRect((x - 2) | 0, (y - 2) | 0, 5, 5);
    }
    function dome(x, y) {
      ctx.fillStyle = C.ink;
      ctx.fillRect((x - 4) | 0, (y - 2) | 0, 9, 6);
      ctx.fillStyle = C.white;
      ctx.fillRect((x - 3) | 0, (y - 1) | 0, 7, 4);
      ctx.fillStyle = C.blueL;
      ctx.fillRect((x - 2) | 0, (y - 4) | 0, 5, 3);
    }

    (Island.MAP_ICONS || []).forEach(([name, kind]) => {
      const p = Island.xy(name);
      const x = mx(p.x);
      const y = my(p.y);
      if (kind === "ville") dome(x, y);
      else if (kind === "fort") pin(x, y, C.sandC);
      else if (kind === "market") pin(x, y, C.red);
      else if (kind === "holy") pin(x, y, C.blue);
      else if (kind === "beach") pin(x, y, C.gold);
      else if (kind === "pottery") pin(x, y, C.terra);
      else if (kind === "port") pin(x, y, C.navyL);
    });

    ctx.font = "6px monospace";
    ctx.textAlign = "left";
    (Island.MAP_LABELS || []).forEach(([name, label]) => {
      const p = Island.xy(name);
      const x = mx(p.x) + 6;
      const y = my(p.y) - 4;
      ctx.fillStyle = "rgba(20,12,28,0.75)";
      ctx.fillRect((x - 2) | 0, (y - 7) | 0, 4 + label.length * 4, 8);
      ctx.fillStyle = "#fce46c";
      ctx.fillText(label, x, y - 1);
    });

    const cx = W - 28;
    const cy = 22;
    ctx.fillStyle = "rgba(20,12,28,0.55)";
    ctx.fillRect(cx - 16, cy - 16, 32, 32);
    ctx.strokeStyle = C.gold;
    ctx.strokeRect(cx - 16, cy - 16, 32, 32);
    ctx.fillStyle = C.goldL;
    ctx.fillText("N", cx - 2, cy - 8);
    ctx.fillText("S", cx - 2, cy + 14);
    ctx.fillText("E", cx + 8, cy + 2);
    ctx.fillText("O", cx - 14, cy + 2);
    ctx.fillStyle = C.gold;
    ctx.fillRect(cx - 1, cy - 6, 2, 12);
    ctx.fillRect(cx - 6, cy - 1, 12, 2);

    const lx = 8;
    const ly = H - 52;
    ctx.fillStyle = "rgba(20,12,28,0.72)";
    ctx.fillRect(lx, ly, 118, 46);
    ctx.strokeStyle = C.goldD;
    ctx.strokeRect(lx, ly, 118, 46);
    ctx.fillStyle = C.goldL;
    ctx.fillText("LEGENDE", lx + 4, ly + 9);
    const legend = [
      [C.white, "VILLE"],
      [C.sandC, "FORT"],
      [C.red, "MARCHE"],
      [C.gold, "PLAGE"],
      [C.terra, "POTERIE"],
      [C.navyL, "PORT / BAC"],
    ];
    legend.forEach((row, i) => {
      const x = lx + 4 + (i % 2) * 58;
      const y = ly + 16 + ((i / 2) | 0) * 10;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, y - 5, 6, 6);
      ctx.fillStyle = row[0];
      ctx.fillRect(x + 1, y - 4, 4, 4);
      ctx.fillStyle = C.white;
      ctx.fillText(row[1], x + 8, y);
    });

    if (player) {
      const px = mx(player.x);
      const py = my(player.y);
      ctx.fillStyle = "#140c1c";
      ctx.beginPath();
      ctx.moveTo(px, py - 9);
      ctx.lineTo(px + 7, py + 6);
      ctx.lineTo(px - 7, py + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = Math.sin(t * 8) > 0 ? "#3cbc3c" : "#fff";
      ctx.beginPath();
      ctx.moveTo(px, py - 7);
      ctx.lineTo(px + 5, py + 4);
      ctx.lineTo(px - 5, py + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(20,12,28,0.8)";
      ctx.fillRect((px + 8) | 0, (py - 12) | 0, 52, 9);
      ctx.fillStyle = "#fff";
      ctx.fillText("TU ES ICI", px + 10, py - 5);
    }
  }

  function zoneAt(x, y) {
    return Island.zoneAt(x, y);
  }

  return {
    drawPalm, drawHouse, drawLighthouse, drawBoat, drawSign, drawCar,
    drawBin, drawTrash, drawFilth, drawPlayer, drawNpc, drawWorldBg, drawTitleScene,
    drawTitleBackground, drawCinematic, drawAvatar, drawMinimap, drawIslandMap, zoneAt,
    drawInterior, drawDoors, drawPool,
  };
})();
