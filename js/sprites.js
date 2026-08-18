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
    ctx.fillStyle = "#0a0810";
    ctx.fillRect(-40, -40, w + 80, h + 80);
    const pal = {
      home: { wall: "#c8bca8", wallD: "#a09078", floor: "#d4a85c" },
      shop: { wall: "#c4742c", wallD: "#8c4c18", floor: "#c4a878" },
      cafe: { wall: "#ece4d4", wallD: "#c8bca8", floor: "#8c7048" },
      cabaret: { wall: "#2a1428", wallD: "#140818", floor: "#3c1c38" },
      hotel: { wall: "#ece4d4", wallD: "#c8bca8", floor: "#d0d4dc" },
      airport: { wall: "#d0d4dc", wallD: "#808890", floor: "#3a3c48" },
      mosque: { wall: "#ece8dc", wallD: "#c8bca8", floor: "#c4a070" },
      synagogue: { wall: "#e8eef4", wallD: "#90a4b8", floor: "#d8c8a0" },
      fort: { wall: "#d4a85c", wallD: "#8c6428", floor: "#c4a878" },
      museum: { wall: "#ece4d4", wallD: "#3c64b0", floor: "#d0d4dc" },
      workshop: { wall: "#c4742c", wallD: "#8c4c18", floor: "#c4a878" },
      kiln: { wall: "#c4742c", wallD: "#8c4c18", floor: "#8c6428" },
      mill: { wall: "#c4742c", wallD: "#5c3010", floor: "#8c7048" },
      menzel: { wall: "#ece4d4", wallD: "#c8bca8", floor: "#d4a85c" },
      cistern: { wall: "#a09078", wallD: "#5c4018", floor: "#8c7048" },
      cemetery: { wall: "#ece8dc", wallD: "#a09078", floor: "#c8bca8" },
      graffiti: { wall: "#ece4d4", wallD: "#2484d4", floor: "#c4a878" },
      oven: { wall: "#c4742c", wallD: "#8c4c18", floor: "#8c6428" },
    }[kind] || { wall: "#c8bca8", wallD: "#a09078", floor: "#d4a85c" };
    ctx.fillStyle = pal.wallD;
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = pal.wall;
    ctx.fillRect(4, 4, w - 8, 44);
    ctx.fillStyle = pal.floor;
    ctx.fillRect(0, 52, w, h - 52);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 52; y < h; y += 16) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, w, 4);
    ctx.fillRect(0, 0, 4, h);
    ctx.fillRect(w - 4, 0, 4, h);
    ctx.fillRect(0, h - 4, w, 4);

    function window_(x, y) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, y, 22, 18);
      ctx.fillStyle = C.blueL;
      ctx.fillRect(x + 2, y + 2, 18, 14);
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 2, y + 2, 18, 4);
      ctx.fillRect(x + 10, y + 2, 2, 14);
    }
    function table(x, y) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, y, 28, 16);
      ctx.fillStyle = C.wood;
      ctx.fillRect(x + 1, y + 1, 26, 14);
      ctx.fillStyle = C.woodL;
      ctx.fillRect(x + 2, y + 2, 10, 4);
    }
    function bed(x, y) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, y, 36, 22);
      ctx.fillStyle = C.navy;
      ctx.fillRect(x + 1, y + 1, 34, 20);
      ctx.fillStyle = C.white;
      ctx.fillRect(x + 2, y + 2, 12, 16);
    }
    function desk(x, y, label) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, y, 48, 18);
      ctx.fillStyle = C.woodD;
      ctx.fillRect(x + 1, y + 1, 46, 16);
      ctx.fillStyle = C.goldL;
      ctx.font = "8px monospace";
      ctx.fillText(label, x + 6, y + 12);
    }

    if (kind === "home") {
      window_(20, 16);
      window_(w - 50, 16);
      bed(20, 70);
      table(120, 90);
      if (Atlas.frames.the) Atlas.blit(ctx, Atlas.frames.the, 128, 82);
      ctx.fillStyle = C.green;
      ctx.fillRect(220, 80, 10, 28);
      ctx.fillStyle = C.greenL;
      ctx.fillRect(216, 70, 18, 12);
    } else if (kind === "shop") {
      window_(18, 16);
      desk(110, 64, "CAISSE");
      ctx.fillStyle = C.ink;
      ctx.fillRect(18, 70, 70, 50);
      ctx.fillStyle = C.wood;
      ctx.fillRect(20, 72, 66, 46);
      ctx.fillStyle = C.gold;
      ctx.fillRect(24, 78, 10, 10);
      ctx.fillStyle = C.red;
      ctx.fillRect(40, 80, 10, 10);
      ctx.fillStyle = C.green;
      ctx.fillRect(56, 78, 10, 12);
      ctx.fillStyle = C.bottle;
      ctx.fillRect(24, 96, 8, 14);
    } else if (kind === "cafe") {
      window_(24, 16);
      desk(120, 64, "DIRECT");
      table(30, 100);
      table(90, 130);
      table(180, 100);
      if (Atlas.frames.the) Atlas.blit(ctx, Atlas.frames.the, 38, 92);
    } else if (kind === "cabaret") {
      ctx.fillStyle = C.redD;
      ctx.fillRect(80, 16, 140, 28);
      ctx.fillStyle = C.gold;
      ctx.fillRect(90, 22, 120, 16);
      ctx.fillStyle = C.ink;
      ctx.font = "8px monospace";
      ctx.fillText("CABARET", 118, 34);
      ctx.fillStyle = Math.sin(t * 8) > 0 ? C.red : C.gold;
      ctx.fillRect(20, 20, 8, 8);
      ctx.fillRect(w - 28, 20, 8, 8);
      desk(20, 80, "BAR");
      ctx.fillStyle = C.ink;
      ctx.fillRect(200, 80, 16, 12);
      ctx.fillRect(230, 80, 16, 12);
      ctx.fillRect(200, 110, 16, 12);
    } else if (kind === "hotel") {
      window_(20, 14);
      window_(w - 48, 14);
      desk(110, 62, "ACCUEIL");
      ctx.fillStyle = C.navy;
      ctx.fillRect(20, 100, 40, 18);
      ctx.fillStyle = C.navyL;
      ctx.fillRect(22, 102, 36, 6);
      ctx.fillStyle = C.greenL;
      ctx.fillRect(240, 80, 16, 10);
      ctx.fillStyle = C.green;
      ctx.fillRect(244, 90, 8, 20);
      ctx.fillStyle = C.gold;
      ctx.font = "8px monospace";
      ctx.fillText("4*", 24, 36);
    } else if (kind === "airport") {
      window_(16, 14);
      window_(50, 14);
      window_(w - 48, 14);
      desk(100, 62, "DJE");
      ctx.fillStyle = C.ink;
      ctx.fillRect(20, 100, 28, 12);
      ctx.fillRect(52, 100, 28, 12);
      ctx.fillRect(20, 120, 28, 12);
      ctx.fillStyle = C.white;
      ctx.fillRect(22, 102, 24, 8);
      ctx.fillRect(54, 102, 24, 8);
      if (Atlas.frames.plane) Atlas.blit(ctx, Atlas.frames.plane, 200, 18);
      ctx.fillStyle = C.gold;
      ctx.font = "8px monospace";
      ctx.fillText("GATE A", 210, 100);
    } else if (kind === "mosque") {
      ctx.fillStyle = C.gold;
      ctx.fillRect(w / 2 - 16, 12, 32, 28);
      ctx.fillStyle = C.white;
      ctx.fillRect(w / 2 - 12, 16, 24, 22);
      ctx.fillStyle = C.goldD;
      ctx.fillRect(w / 2 - 4, 8, 8, 8);
      ctx.fillStyle = C.greenD;
      ctx.fillRect(24, 70, 70, 28);
      ctx.fillRect(110, 90, 70, 28);
      ctx.fillRect(196, 70, 70, 28);
      ctx.fillStyle = C.green;
      ctx.fillRect(28, 74, 62, 8);
      ctx.fillRect(114, 94, 62, 8);
      window_(20, 16);
      window_(w - 50, 16);
    } else if (kind === "synagogue") {
      ctx.fillStyle = C.blue;
      ctx.fillRect(w / 2 - 18, 10, 36, 30);
      ctx.fillStyle = C.gold;
      ctx.fillRect(w / 2 - 6, 18, 12, 12);
      ctx.fillRect(w / 2 - 2, 14, 4, 20);
      ctx.fillRect(w / 2 - 8, 22, 16, 4);
      window_(18, 16);
      window_(w - 48, 16);
      ctx.fillStyle = C.blueD;
      ctx.fillRect(30, 80, 50, 16);
      ctx.fillRect(220, 80, 50, 16);
      table(120, 110);
    } else if (kind === "fort") {
      window_(20, 16);
      window_(w - 50, 16);
      ctx.fillStyle = C.ink;
      ctx.fillRect(40, 70, 40, 50);
      ctx.fillRect(220, 70, 40, 50);
      ctx.fillStyle = C.navyD;
      ctx.fillRect(42, 72, 36, 46);
      ctx.fillRect(222, 72, 36, 46);
      desk(110, 64, "BORJ");
    } else if (kind === "museum") {
      window_(20, 14);
      window_(w - 48, 14);
      desk(110, 62, "MUSEE");
      ctx.fillStyle = C.ink;
      ctx.fillRect(24, 90, 28, 28);
      ctx.fillRect(64, 90, 28, 28);
      ctx.fillRect(210, 90, 28, 28);
      ctx.fillStyle = C.gold;
      ctx.fillRect(28, 94, 20, 20);
      ctx.fillStyle = C.terra;
      ctx.fillRect(68, 94, 20, 20);
      ctx.fillStyle = C.blue;
      ctx.fillRect(214, 94, 20, 20);
    } else if (kind === "workshop") {
      window_(18, 16);
      desk(110, 64, "ATELIER");
      ctx.fillStyle = C.ink;
      ctx.fillRect(20, 80, 60, 40);
      ctx.fillStyle = C.terra;
      ctx.fillRect(22, 82, 56, 36);
      ctx.fillStyle = C.goldD;
      ctx.fillRect(30, 90, 12, 12);
      ctx.fillRect(48, 88, 16, 16);
    } else if (kind === "kiln" || kind === "oven") {
      ctx.fillStyle = C.ink;
      ctx.fillRect(110, 60, 70, 50);
      ctx.fillStyle = C.terraD;
      ctx.fillRect(114, 64, 62, 42);
      ctx.fillStyle = Math.sin(t * 6) > 0 ? C.red : C.gold;
      ctx.fillRect(130, 84, 28, 16);
      desk(20, 70, "FOUR");
    } else if (kind === "mill") {
      window_(20, 16);
      desk(110, 64, "HUILE");
      ctx.fillStyle = C.woodD;
      ctx.fillRect(40, 90, 36, 36);
      ctx.fillRect(200, 90, 36, 36);
      ctx.fillStyle = C.goldD;
      ctx.fillRect(48, 98, 20, 20);
    } else if (kind === "menzel") {
      window_(20, 16);
      window_(w - 50, 16);
      bed(20, 70);
      table(120, 100);
      ctx.fillStyle = C.green;
      ctx.fillRect(220, 80, 16, 28);
      ctx.fillStyle = C.greenL;
      ctx.fillRect(214, 70, 28, 12);
    } else if (kind === "cistern") {
      ctx.fillStyle = C.ink;
      ctx.fillRect(80, 70, 140, 70);
      ctx.fillStyle = C.navyD;
      ctx.fillRect(86, 76, 128, 58);
      ctx.fillStyle = C.blueL;
      ctx.fillRect(90, 80, 120, 20);
      ctx.fillStyle = C.white;
      ctx.font = "8px monospace";
      ctx.fillText("EAU", 136, 120);
    } else if (kind === "cemetery") {
      window_(20, 16);
      ctx.fillStyle = C.wall;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(30 + i * 60, 80, 16, 28);
        ctx.fillStyle = C.white;
        ctx.fillRect(32 + i * 60, 84, 12, 8);
        ctx.fillStyle = C.wall;
      }
    } else if (kind === "graffiti") {
      ctx.fillStyle = C.red;
      ctx.fillRect(20, 12, 40, 28);
      ctx.fillStyle = C.blue;
      ctx.fillRect(80, 10, 50, 32);
      ctx.fillStyle = C.gold;
      ctx.fillRect(160, 14, 36, 24);
      ctx.fillStyle = C.green;
      ctx.fillRect(220, 12, 50, 28);
      desk(100, 70, "HOOD");
      table(40, 120);
    }

    const dx = w / 2 - 10;
    const dy = h - 28;
    ctx.fillStyle = C.ink;
    ctx.fillRect(dx - 2, dy - 2, 24, 26);
    ctx.fillStyle = C.woodD;
    ctx.fillRect(dx, dy, 20, 22);
    ctx.fillStyle = C.gold;
    ctx.fillRect(dx + 14, dy + 10, 2, 2);
    ctx.fillStyle = C.white;
    ctx.font = "8px monospace";
    ctx.fillText(inside.title || "SALLE", 12, 16);
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

  function drawPlayer(ctx, p, goldHat, t, cam) {
    const moving = Math.hypot(p.vx || 0, p.vy || 0) > 8;
    const walk = moving ? Math.floor(t * 12) % 4 : (Math.sin(t * 3) > 0.85 ? 2 : 0);
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

  function drawWorldBg(ctx, W, H, t, theme = "beach", cam) {
    Atlas.bake();
    const sky = themeSky(theme);
    const seaY = 208;
    const sandY = 320;

    ctx.fillStyle = sky[0];
    ctx.fillRect(0, 0, W, 90);
    ctx.fillStyle = sky[1];
    ctx.fillRect(0, 90, W, 70);
    ctx.fillStyle = sky[2];
    ctx.fillRect(0, 160, W, seaY - 160);

    // sun
    if (theme === "festival") {
      ctx.fillStyle = "#fff0a8";
      ctx.fillRect(W - 86, 18, 18, 18);
      ctx.fillStyle = sky[1];
      ctx.fillRect(W - 80, 22, 12, 12);
      for (let i = 0; i < 18; i++) {
        if (Math.sin(t * 3 + i) > 0) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(20 + i * 48, 12 + (i % 5) * 10, 2, 2);
        }
      }
    } else if (theme === "sunset") {
      Atlas.blit(ctx, Atlas.frames.sun, W - 120, 40);
    } else {
      Atlas.blit(ctx, Atlas.frames.sun, W - 110, 8);
    }

    // SMB hills behind the water
    if (!cam || Atlas.inView(cam, 40, seaY - 28, 80, 32)) Atlas.blit(ctx, Atlas.frames.hill, 40, seaY - 28);
    if (!cam || Atlas.inView(cam, 280, seaY - 36, 80, 32)) Atlas.blit(ctx, Atlas.frames.hill, 280, seaY - 36);
    if (!cam || Atlas.inView(cam, 620, seaY - 24, 80, 32)) Atlas.blit(ctx, Atlas.frames.hill, 620, seaY - 24);
    if (!cam || Atlas.inView(cam, 820, seaY - 32, 80, 32)) Atlas.blit(ctx, Atlas.frames.hill, 820, seaY - 32);
    if (!cam || Atlas.inView(cam, 1040, seaY - 28, 80, 32)) Atlas.blit(ctx, Atlas.frames.hill, 1040, seaY - 28);
    if (!cam || Atlas.inView(cam, 1180, seaY - 34, 80, 32)) Atlas.blit(ctx, Atlas.frames.hill, 1180, seaY - 34);

    // clouds (slow drift)
    const cx = [30, 180, 360, 540, 720, 860, 1020, 1180];
    cx.forEach((x, i) => {
      const ox = x + Math.sin(t * 0.15 + i) * 10 + (t * (4 + i % 3)) % 20;
      const oy = 12 + (i % 4) * 10;
      if (!cam || Atlas.inView(cam, ox, oy, 48, 20)) Atlas.blit(ctx, Atlas.frames.cloud, ox, oy);
    });

    // animated sea bands
    tileFill(ctx, seaFrame(0, t), 0, seaY, W, 32, cam);
    tileFill(ctx, Atlas.tiles.foam[Math.floor(t * 6) % 3], 0, seaY + 28, W, 16, cam);
    tileFill(ctx, seaFrame(1, t + 0.4), 0, seaY + 40, W, 32, cam);
    tileFill(ctx, seaFrame(2, t + 0.8), 0, seaY + 72, W, 24, cam);
    tileFill(ctx, Atlas.tiles.foam[Math.floor(t * 6 + 1) % 3], 0, sandY - 16, W, 16, cam);

    // sun reflection
    const rx = W - 86;
    for (let k = 0; k < 10; k++) {
      const rw = 4 + (k % 3) * 3 + Math.sin(t * 4 + k) * 2;
      ctx.fillStyle = theme === "festival" ? "#c8d8ff" : "#ffe9a0";
      ctx.fillRect(rx - rw / 2 + Math.sin(t * 2 + k) * 3, seaY + 10 + k * 8, rw, 2);
    }

    // sand body (plage + palmeraie)
    const sands = [Atlas.tiles.sand0, Atlas.tiles.sand1, Atlas.tiles.sand2, Atlas.tiles.sand3];
    const x0 = cam ? Math.max(0, (cam.x / TILE | 0) * TILE) : 0;
    const y0 = cam ? Math.max(sandY, (cam.y / TILE | 0) * TILE) : sandY;
    const x1 = cam ? Math.min(W, cam.x + cam.vw + TILE) : W;
    const y1 = cam ? Math.min(H, cam.y + cam.vh + TILE) : H;
    for (let ty = y0; ty < y1; ty += TILE) {
      for (let tx = x0; tx < x1; tx += TILE) {
        ctx.drawImage(sands[((tx / 16 | 0) + (ty / 16 | 0) * 3) % 4], tx, ty);
      }
    }
    tileFill(ctx, Atlas.tiles.sandCap, 0, sandY, W, 16, cam);

    const ROAD_N = 496;
    const TOWN_Y = 528;
    const ROAD_S = 864;
    const SOUK_W = 400;
    const VILLE_X = 544;

    cobbleFill(ctx, 0, TOWN_Y, SOUK_W, ROAD_S - TOWN_Y, cam);
    tileFill(ctx, Atlas.tiles.plaza, 400, TOWN_Y, 144, 192, cam);
    cobbleFill(ctx, VILLE_X, TOWN_Y, W - VILLE_X, ROAD_S - TOWN_Y, cam);
    tileFill(ctx, Atlas.tiles.brick, 720, 256, 240, 64, cam);

    hRoad(ctx, 0, ROAD_N, W, cam);
    hRoad(ctx, 0, ROAD_S, W, cam);
    hRoad(ctx, 0, 1184, W, cam);
    hRoad(ctx, 0, 1472, W, cam);
    vRoad(ctx, 448, ROAD_N, H - ROAD_N, cam);
    vRoad(ctx, 160, TOWN_Y, ROAD_S - TOWN_Y, cam);
    vRoad(ctx, 736, TOWN_Y, ROAD_S - TOWN_Y, cam);
    vRoad(ctx, 960, ROAD_N, H - ROAD_N, cam);
    if (!cam || Atlas.inView(cam, 448, ROAD_N, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 448, ROAD_N);
    if (!cam || Atlas.inView(cam, 448, ROAD_S, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 448, ROAD_S);
    if (!cam || Atlas.inView(cam, 960, ROAD_N, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 960, ROAD_N);
    if (!cam || Atlas.inView(cam, 960, ROAD_S, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 960, ROAD_S);
    if (!cam || Atlas.inView(cam, 448, 1184, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 448, 1184);
    if (!cam || Atlas.inView(cam, 960, 1184, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 960, 1184);
    if (!cam || Atlas.inView(cam, 448, 1472, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 448, 1472);
    if (!cam || Atlas.inView(cam, 960, 1472, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 960, 1472);
    drawFlag(ctx, 200, 468, "tn", t, cam);
    drawFlag(ctx, 700, 468, "il", t, cam);

    // PORT
    drawLighthouse(ctx, 820, 196, t, cam);
    drawBoat(ctx, 740, 268, t, cam);
    drawBoat(ctx, 820, 278, t + 1.1, cam);
    if (theme === "port") {
      drawBoat(ctx, 700, 258, t + 0.4, cam);
      drawBoat(ctx, 880, 270, t + 2, cam);
    }
    Atlas.blit(ctx, Atlas.frames.signPort, 748, 318);
    if (Atlas.frames.signAjim) Atlas.blit(ctx, Atlas.frames.signAjim, 688, 318);
    drawCabaret(ctx, 868, 348, cam);
    if (Atlas.frames.signCabaret) Atlas.blit(ctx, Atlas.frames.signCabaret, 874, 332);
    drawFlag(ctx, 788, 292, "tn", t, cam);
    drawFlag(ctx, 900, 300, "il", t, cam);

    // PLAGE
    const umbrellas = [[40, 360], [120, 348], [200, 368], [280, 352], [360, 372], [520, 356], [600, 368], [80, 428], [240, 440], [520, 432]];
    if (theme === "resort" || theme === "festival") {
      umbrellas.push([160, 400], [320, 412], [560, 400]);
    }
    for (const [ux, uy] of umbrellas) drawUmbrella(ctx, ux, uy, cam);
    [[48, 272, 0], [200, 264, 1.4], [340, 276, 0.7], [560, 268, 2.1], [640, 280, 3]].forEach(([px, py, s]) => drawPalm(ctx, px, py, t, s, cam));
    drawRock(ctx, 250, 420, cam);
    drawRock(ctx, 90, 400, cam);
    drawRock(ctx, 400, 450, cam);
    tileFill(ctx, Atlas.tiles.grass, 400, 400, 48, 32, cam);
    Atlas.blit(ctx, Atlas.frames.signPlage, 20, 328);
    drawFlag(ctx, 70, 328, "tn", t, cam);
    drawFlag(ctx, 620, 336, "tn", t, cam);
    drawFlag(ctx, 580, 340, "il", t, cam);

    // SOUK
    const shops = [
      [16, 540], [80, 540], [224, 540], [288, 540],
      [16, 620], [80, 628], [224, 620], [288, 624],
      [16, 710], [80, 718], [224, 710], [288, 716],
      [16, 790], [80, 798], [224, 790], [288, 796],
    ];
    shops.forEach(([sx, sy], i) => (i % 3 === 0 ? drawStall(ctx, sx, sy, cam) : drawShop(ctx, sx, sy, cam)));
    Atlas.blit(ctx, Atlas.frames.signSouk, 18, 534);
    drawFlag(ctx, 80, 500, "tn", t, cam);
    drawFlag(ctx, 350, 504, "il", t, cam);
    drawLamp(ctx, 140, 560, cam);
    drawLamp(ctx, 140, 680, cam);
    drawLamp(ctx, 140, 800, cam);
    drawBush(ctx, 340, 580, cam);
    drawBush(ctx, 348, 760, cam);

    // PLACE
    drawFountain(ctx, 452, 600, cam);
    drawLamp(ctx, 420, 560, cam);
    drawLamp(ctx, 500, 560, cam);
    drawLamp(ctx, 420, 680, cam);
    drawLamp(ctx, 500, 680, cam);
    tileFill(ctx, Atlas.tiles.plaza, 416, 592, 80, 48, cam);
    drawFlag(ctx, 428, 548, "tn", t, cam);
    drawFlag(ctx, 508, 548, "il", t, cam);

    // VILLE
    drawMinaret(ctx, 800, 500, cam);
    drawHouse(ctx, 560, 548, cam);
    drawHouseWarm(ctx, 624, 556, cam);
    drawHouse(ctx, 800, 548, cam);
    drawHouseWarm(ctx, 864, 552, cam);
    drawHouseWarm(ctx, 560, 640, cam);
    drawHouse(ctx, 624, 648, cam);
    drawHouse(ctx, 800, 640, cam);
    drawHouseWarm(ctx, 864, 644, cam);
    drawHouse(ctx, 560, 740, cam);
    drawCabaret(ctx, 792, 728, cam);
    if (Atlas.frames.signCabaret) Atlas.blit(ctx, Atlas.frames.signCabaret, 792, 714);
    drawHouseWarm(ctx, 624, 748, cam);
    drawHouseWarm(ctx, 864, 744, cam);
    Atlas.blit(ctx, Atlas.frames.signVille, 548, 534);
    if (Atlas.frames.signHoumt) Atlas.blit(ctx, Atlas.frames.signHoumt, 548, 500);
    drawFlag(ctx, 616, 500, "tn", t, cam);
    drawFlag(ctx, 890, 504, "il", t, cam);
    drawLamp(ctx, 716, 560, cam);
    drawLamp(ctx, 716, 680, cam);
    drawLamp(ctx, 716, 800, cam);

    // SUD: lagune, hotel, piscine, aeroport
    tileFill(ctx, Atlas.tiles.grass, 160, 1000, 64, 48, cam);
    tileFill(ctx, Atlas.tiles.grass, 360, 980, 96, 48, cam);
    [[64, 920, 1.9], [180, 960, 0.6], [300, 940, 2.2], [400, 1040, 2.8]].forEach(([px, py, s]) => drawPalm(ctx, px, py, t, s, cam));
    drawBush(ctx, 100, 980, cam);
    drawFlag(ctx, 48, 910, "tn", t, cam);
    if (theme === "lagoon") tileFill(ctx, seaFrame(0, t), 320, 1000, 112, 40, cam);

    if (Atlas.frames.hotel) Atlas.blit(ctx, Atlas.frames.hotel, 620, 910);
    if (Atlas.frames.signHotel) Atlas.blit(ctx, Atlas.frames.signHotel, 640, 896);
    drawPool(ctx, 740, 988, t, cam);
    if (Atlas.frames.signPool) Atlas.blit(ctx, Atlas.frames.signPool, 760, 972);
    if (Atlas.frames.lounge) {
      Atlas.blit(ctx, Atlas.frames.lounge, 724, 1044);
      Atlas.blit(ctx, Atlas.frames.lounge, 812, 1046);
      Atlas.blit(ctx, Atlas.frames.lounge, 748, 1052);
    }
    drawUmbrella(ctx, 700, 1020, cam);
    drawPalm(ctx, 880, 980, t, 1.1, cam);
    drawFlag(ctx, 860, 930, "il", t, cam);

    if (Atlas.frames.airport) Atlas.blit(ctx, Atlas.frames.airport, 32, 1000);
    if (Atlas.frames.signAirport) Atlas.blit(ctx, Atlas.frames.signAirport, 40, 986);
    tileFill(ctx, Atlas.tiles.stone, 24, 1064, 240, 28, cam);
    ctx.fillStyle = Atlas.C.gold;
    for (let x = 36; x < 250; x += 18) ctx.fillRect(x, 1076, 10, 2);
    if (Atlas.frames.plane) Atlas.blit(ctx, Atlas.frames.plane, 90, 1056);
    drawFlag(ctx, 128, 992, "tn", t, cam);

    if (theme === "festival") {
      drawLamp(ctx, 100, 360, cam);
      drawLamp(ctx, 300, 360, cam);
      drawLamp(ctx, 500, 360, cam);
    }

    cobbleFill(ctx, 16, 1216, 464, 248, cam);
    cobbleFill(ctx, 528, 1216, 416, 248, cam);
    cobbleFill(ctx, 16, 1504, 464, 264, cam);
    cobbleFill(ctx, 528, 1504, 416, 264, cam);
    cobbleFill(ctx, 976, 1216, 288, 552, cam);
    hRoad(ctx, 0, 1184, W, cam);
    hRoad(ctx, 0, 1472, W, cam);
    vRoad(ctx, 448, 1184, H - 1184, cam);
    vRoad(ctx, 960, 1184, H - 1184, cam);
    if (!cam || Atlas.inView(cam, 448, 1184, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 448, 1184);
    if (!cam || Atlas.inView(cam, 960, 1184, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 960, 1184);
    if (!cam || Atlas.inView(cam, 448, 1472, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 448, 1472);
    if (!cam || Atlas.inView(cam, 960, 1472, 32, 32)) ctx.drawImage(Atlas.tiles.roadX, 960, 1472);
    tileFill(ctx, Atlas.tiles.grass, 180, 1288, 96, 64, cam);
    tileFill(ctx, Atlas.tiles.grass, 600, 1360, 128, 80, cam);
    tileFill(ctx, Atlas.tiles.grass, 200, 1640, 112, 64, cam);
    tileFill(ctx, Atlas.tiles.grass, 640, 1680, 144, 72, cam);
    tileFill(ctx, Atlas.tiles.grass, 1040, 1360, 96, 64, cam);
    tileFill(ctx, Atlas.tiles.grass, 1080, 1688, 112, 56, cam);
    [[80, 1296, 0.4], [240, 1360, 1.2], [620, 1300, 2.1], [840, 1380, 0.8],
      [120, 1660, 1.6], [700, 1700, 2.4], [1100, 1280, 0.2], [1180, 1700, 3]].forEach(([px, py, s]) => {
      drawPalm(ctx, px, py, t, s, cam);
    });
    drawBush(ctx, 200, 1400, cam);
    drawBush(ctx, 680, 1420, cam);
    drawBush(ctx, 1080, 1440, cam);
    drawLamp(ctx, 80, 1240, cam);
    drawLamp(ctx, 600, 1240, cam);
    drawLamp(ctx, 80, 1528, cam);
    drawLamp(ctx, 600, 1528, cam);
    drawLamp(ctx, 1000, 1240, cam);
    if (Atlas.frames.signErriadh) Atlas.blit(ctx, Atlas.frames.signErriadh, 24, 1190);
    if (Atlas.frames.signElMay) Atlas.blit(ctx, Atlas.frames.signElMay, 540, 1190);
    if (Atlas.frames.signMidounV) Atlas.blit(ctx, Atlas.frames.signMidounV, 980, 518);
    if (Atlas.frames.signGuellala) Atlas.blit(ctx, Atlas.frames.signGuellala, 24, 1480);
    if (Atlas.frames.signExplore) Atlas.blit(ctx, Atlas.frames.signExplore, 540, 1480);
    if (Atlas.frames.signAghir) Atlas.blit(ctx, Atlas.frames.signAghir, 980, 1190);
    if (Atlas.frames.signMezraya) Atlas.blit(ctx, Atlas.frames.signMezraya, 1140, 1190);
    if (Atlas.frames.signSedouik) Atlas.blit(ctx, Atlas.frames.signSedouik, 980, 1480);
    if (Atlas.frames.signMahboub) Atlas.blit(ctx, Atlas.frames.signMahboub, 1140, 1480);
    drawFlag(ctx, 100, 1190, "tn", t, cam);
    drawFlag(ctx, 620, 1190, "tn", t, cam);
    drawFlag(ctx, 100, 1480, "il", t, cam);
    drawFlag(ctx, 700, 1480, "tn", t, cam);

    drawHeritage(ctx, cam);

    drawSeagull(ctx, 120, 70, t, 0);
    drawSeagull(ctx, 480, 50, t, 2.1);
    drawSeagull(ctx, 760, 80, t, 4.2);
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
    drawWorldBg(ctx, W, H, t, "beach", null);
  }

  function drawCinematic(ctx, vw, vh, t) {
    Atlas.bake();
    const WW = 960;
    const WH = 1200;
    const zoom = 1.32;
    const camW = vw / zoom;
    const camH = vh / zoom;
    const camX = Math.max(0, Math.min(WW - camW, 30 + (t * 26) % 640));
    const camY = Math.max(0, Math.min(WH - camH, 236 + Math.sin(t * 0.16) * 28));
    const cam = { x: camX, y: camY, vw: camW, vh: camH };
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);
    drawWorldBg(ctx, WW, WH, t, "sunset", cam);
    const walk = Math.floor(t * 9) % 4;
    const nWalk = Math.floor(t * 8) % 4;
    const pack = Atlas.frames.npc || {};
    const px = 90 + (t * 20) % 380;
    Atlas.blit(ctx, Atlas.frames.player[`1_${walk}_1_0`], px, 398);
    Atlas.blit(ctx, Atlas.frames.bin, px + 34, 410);
    if (pack.tourF) Atlas.blit(ctx, pack.tourF[`-1_${nWalk}_0`], 70, 428);
    if (pack.localM) Atlas.blit(ctx, pack.localM[`1_${nWalk}_0`], 250, 414);
    if (pack.kidM) Atlas.blit(ctx, pack.kidM[`1_${Math.floor(t * 14) % 4}_0`], 188, 438);
    if (pack.tourM) Atlas.blit(ctx, pack.tourM[`1_0_1`], 500, 372);
    if (pack.elder) Atlas.blit(ctx, pack.elder[`-1_0_0`], 340, 408);
    Atlas.blit(ctx, Atlas.frames.can, 160, 448);
    Atlas.blit(ctx, Atlas.frames.bottle, 310, 436);
    Atlas.blit(ctx, Atlas.frames.bag, 430, 444);
    Atlas.blit(ctx, Atlas.frames.gull0, 130 + Math.sin(t) * 46, 228);
    Atlas.blit(ctx, Atlas.frames.gull1 || Atlas.frames.gull0, 420 + Math.cos(t * 0.7) * 40, 210);
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
    ctx.fillStyle = "rgba(8,40,72,0.4)";
    ctx.fillRect(mx, my, mw, mh);
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

  const islandArt = new Image();
  islandArt.src = "img/djerba-map.jpg?v=24";

  function drawIslandMap(ctx, W, H, t, unlocked, starsMap, selectedId) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#7ec8e0";
    ctx.fillRect(0, 0, W, H);
    if (islandArt.complete && islandArt.naturalWidth) {
      ctx.drawImage(islandArt, 0, 0, W, H);
    }

    Campaign.list().forEach((lv) => {
      const open = lv.id <= unlocked;
      const st = (starsMap && starsMap[String(lv.id)]) || 0;
      const sel = lv.id === selectedId;
      const pulse = sel && Math.sin(t * 6) > 0 ? 1 : 0;
      const r = 8 + pulse;
      ctx.beginPath();
      ctx.arc(lv.mapX, lv.mapY, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = sel ? "#fcbc14" : "#140c1c";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lv.mapX, lv.mapY, r, 0, Math.PI * 2);
      ctx.fillStyle = open ? "#2a9c3c" : "#5a5a5a";
      ctx.fill();
      if (open) {
        ctx.fillStyle = "#fff";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(lv.id), lv.mapX, lv.mapY + 3);
        if (st > 0) {
          ctx.fillStyle = "#fcbc14";
          ctx.font = "7px monospace";
          ctx.fillText("*".repeat(st), lv.mapX, lv.mapY + r + 10);
        }
      }
    });
    ctx.textAlign = "left";
  }

  function zoneAt(x, y) {
    if (y < 496) return x >= 700 ? "port" : "beach";
    if (y < 864) return x >= 960 ? "midounv" : (x < 400 ? "souk" : (x < 544 ? "plaza" : "ville"));
    if (x < 340 && y > 970 && y < 1200) return "airport";
    if (x > 520 && x < 960 && y > 880 && y < 1200) return "hotel";
    if (y < 1184) return "lagoon";
    if (y < 1490) {
      if (x < 500) return "erriadh";
      if (x < 960) return "elmay";
      return "aghir";
    }
    if (x < 500) return "guellala";
    if (x < 960) return "explore";
    return "aghir";
  }

  return {
    drawPalm, drawHouse, drawLighthouse, drawBoat, drawSign,
    drawBin, drawTrash, drawFilth, drawPlayer, drawNpc, drawWorldBg, drawTitleScene,
    drawTitleBackground, drawCinematic, drawAvatar, drawMinimap, drawIslandMap, zoneAt,
    drawInterior, drawDoors, drawPool,
  };
})();
