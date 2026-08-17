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
    const bob = (Math.sin(t * 6 + item.y) > 0 ? 0 : -2);
    const img = Atlas.frames[item.type] || Atlas.frames.can;
    if (cam && !Atlas.inView(cam, item.x, item.y, 16, 22)) return;
    Atlas.blit(ctx, img, item.x, item.y + bob);
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

    // clouds (slow drift)
    const cx = [30, 180, 360, 540, 720, 860];
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

    // sand body
    const sands = [Atlas.tiles.sand0, Atlas.tiles.sand1, Atlas.tiles.sand2, Atlas.tiles.sand3];
    const x0 = cam ? Math.max(0, (cam.x / TILE | 0) * TILE) : 0;
    const y0 = cam ? Math.max(sandY, (cam.y / TILE | 0) * TILE) : sandY;
    const x1 = cam ? Math.min(W, cam.x + cam.vw + TILE) : W;
    const y1 = cam ? Math.min(H, cam.y + cam.vh + TILE) : H;
    for (let ty = y0; ty < y1; ty += TILE) {
      for (let tx = x0; tx < x1; tx += TILE) {
        const img = sands[((tx / 16 | 0) + (ty / 16 | 0) * 3) % 4];
        ctx.drawImage(img, tx, ty);
      }
    }
    // shoreline cap row
    tileFill(ctx, Atlas.tiles.sandCap, 0, sandY, W, 16, cam);

    // stone path down the beach
    for (let ty = sandY + 32; ty < H; ty += TILE) {
      if (cam && (ty + 16 < cam.y || ty > cam.y + cam.vh)) continue;
      ctx.drawImage(Atlas.tiles.stone, 448, ty);
      ctx.drawImage(Atlas.tiles.stone, 464, ty);
    }

    // theme buildings
    if (theme === "souk") {
      drawHouse(ctx, 24, 266, cam);
      drawHouse(ctx, 80, 274, cam);
      drawHouse(ctx, 300, 262, cam);
      drawHouse(ctx, 700, 270, cam);
      tileFill(ctx, Atlas.tiles.brick, 400, 360, 64, 32, cam);
    } else if (theme === "port") {
      drawLighthouse(ctx, 520, 196, t, cam);
      drawBoat(ctx, 80, 276, t, cam);
      drawBoat(ctx, 400, 282, t + 1, cam);
      drawBoat(ctx, 620, 270, t + 0.6, cam);
    } else if (theme === "lagoon") {
      drawPalm(ctx, 60, 268, t, 0, cam);
      drawPalm(ctx, 140, 276, t, 1, cam);
      tileFill(ctx, seaFrame(0, t), 380, 500, 96, 32, cam);
    } else if (theme === "resort") {
      drawHouse(ctx, 24, 266, cam);
      drawHouse(ctx, 88, 274, cam);
      drawHouse(ctx, 320, 262, cam);
      drawHouse(ctx, 640, 270, cam);
      drawUmbrella(ctx, 200, 340, cam);
      drawUmbrella(ctx, 560, 348, cam);
    } else if (theme === "festival") {
      drawHouse(ctx, 40, 270, cam);
      drawHouse(ctx, 300, 262, cam);
      drawLighthouse(ctx, 520, 196, t, cam);
    } else {
      drawHouse(ctx, 24, 266, cam);
      drawHouse(ctx, 80, 274, cam);
      drawHouse(ctx, 300, 262, cam);
      drawHouse(ctx, 700, 270, cam);
      drawLighthouse(ctx, 520, 196, t, cam);
      drawBoat(ctx, 360, 276, t, cam);
    }

    const palms = [
      [48, 272, 0], [200, 264, 1.4], [340, 276, 0.7], [560, 268, 2.1],
      [800, 272, 2.8], [140, 500, 3.3], [620, 520, 0.4], [64, 680, 1.9],
      [480, 660, 2.5], [820, 720, 0.9], [220, 880, 1.1], [700, 900, 3.6],
    ];
    for (const [px, py, seed] of palms) drawPalm(ctx, px, py, t, seed, cam);

    drawUmbrella(ctx, 180, 360, cam);
    drawUmbrella(ctx, 600, 380, cam);
    drawUmbrella(ctx, 760, 640, cam);
    drawBush(ctx, 430, 400, cam);
    drawBush(ctx, 200, 640, cam);
    drawBush(ctx, 760, 560, cam);
    drawBush(ctx, 100, 800, cam);
    drawRock(ctx, 250, 420, cam);
    drawRock(ctx, 520, 480, cam);
    drawRock(ctx, 840, 520, cam);
    drawRock(ctx, 300, 720, cam);
    tileFill(ctx, Atlas.tiles.grass, 400, 400, 48, 32, cam);
    tileFill(ctx, Atlas.tiles.grass, 160, 640, 32, 32, cam);
    tileFill(ctx, Atlas.tiles.grass, 720, 560, 32, 32, cam);
    drawSign(ctx, 16, 332, cam);
    drawSign(ctx, 900, 348, cam);
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
    Atlas.blit(ctx, Atlas.frames.bin, 150, 102);
    Atlas.blit(ctx, Atlas.frames.can, 50, 118);
    Atlas.blit(ctx, Atlas.frames.bottle, 210, 108);
    Atlas.blit(ctx, Atlas.frames.bag, 30, 120);
    Atlas.blit(ctx, Atlas.frames.gull0, 70 + Math.sin(t) * 8, 18);
  }

  function drawTitleBackground(ctx, W, H, t) {
    drawWorldBg(ctx, W, H, t, "beach", null);
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
    Atlas.blit(ctx, Atlas.frames.player[`1_${walk}_0_${gold}`], 8, 6);
    ctx.restore();
  }

  function drawMinimap(ctx, W, H, trash, player, t, cam) {
    const mw = 56;
    const mh = 56;
    const mx = (cam && cam.x != null ? cam.x : 0) + (cam && cam.vw ? cam.vw : W) - mw - 8;
    const my = (cam && cam.y != null ? cam.y : 0) + 8;
    ctx.fillStyle = "rgba(8,40,72,0.88)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = Math.sin(t * 4) > 0 ? "#fcbc14" : "#70c8fc";
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);
    trash.forEach((tr) => {
      ctx.fillStyle = "#d43030";
      ctx.fillRect(mx + 3 + (tr.x / W) * (mw - 6), my + 3 + (tr.y / H) * (mh - 6), 2, 2);
    });
    ctx.fillStyle = "#3cbc3c";
    ctx.fillRect(mx + 3 + (player.x / W) * (mw - 6), my + 3 + (player.y / H) * (mh - 6), 3, 3);
  }

  function drawIslandMap(ctx, W, H, t, unlocked, starsMap, selectedId) {
    ctx.fillStyle = "#1c7cc0";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "#38a4e8";
      ctx.fillRect((i * 37) % W, 10 + (i * 19) % H, 3, 2);
    }
    Atlas.blit(ctx, Atlas.frames.cloud, 16, 8);
    Atlas.blit(ctx, Atlas.frames.cloud, 200, 20);
    ctx.fillStyle = "#f0cc84";
    for (let y = 28; y < 210; y += 2) {
      const inset = Math.abs(y - 118) / 8 | 0;
      ctx.fillRect(24 + inset, y, W - 48 - inset * 2, 2);
    }
    ctx.fillStyle = "#3cbc3c";
    ctx.fillRect(80, 90, 50, 28);
    ctx.fillRect(140, 130, 44, 22);
    Atlas.blit(ctx, Atlas.frames.hill, 40, 70);

    Campaign.list().forEach((lv) => {
      const open = lv.id <= unlocked;
      const st = (starsMap && starsMap[String(lv.id)]) || 0;
      const sel = lv.id === selectedId;
      const pulse = sel && Math.sin(t * 6) > 0 ? 2 : 0;
      ctx.fillStyle = sel ? "#fcbc14" : "#140c1c";
      ctx.fillRect(lv.mapX - 6 - pulse, lv.mapY - 6 - pulse, 18 + pulse * 2, 18 + pulse * 2);
      ctx.fillStyle = open ? "#3cbc3c" : "#555";
      ctx.fillRect(lv.mapX - 4, lv.mapY - 4, 14, 14);
      if (open) {
        ctx.fillStyle = "#fff";
        ctx.font = "8px monospace";
        ctx.fillText(String(lv.id), lv.mapX, lv.mapY + 6);
        if (st > 0) {
          ctx.fillStyle = "#fcbc14";
          ctx.fillText("*".repeat(st), lv.mapX - 4, lv.mapY + 20);
        }
      }
    });
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.fillText("CARTE DE DJERBA", 55, 18);
  }

  return {
    drawPalm, drawHouse, drawLighthouse, drawBoat, drawSign,
    drawBin, drawTrash, drawPlayer, drawWorldBg, drawTitleScene,
    drawTitleBackground, drawAvatar, drawMinimap, drawIslandMap,
  };
})();
