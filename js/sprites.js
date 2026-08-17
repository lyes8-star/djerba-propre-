/* World renderer — tiled atlas blit, camera cull */
const Sprites = (() => {
  const TILE = 16;

  function tileFill(ctx, img, x, y, w, h, cam) {
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

  function drawPalm(ctx, x, y, t, seed, cam) {
    if (cam && !Atlas.inView(cam, x, y, 48, 72)) return;
    const img = Math.sin(t * 2.2 + seed) > 0 ? Atlas.frames.palm1 : Atlas.frames.palm0;
    Atlas.blit(ctx, img, x, y);
  }

  function drawHouse(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 56, 64)) return;
    Atlas.blit(ctx, Atlas.frames.house, x, y);
  }

  function drawLighthouse(ctx, x, y, t, cam) {
    if (cam && !Atlas.inView(cam, x, y, 36, 80)) return;
    const on = Math.sin(t * 5) > 0;
    Atlas.blit(ctx, on ? Atlas.frames.lhOn : Atlas.frames.lhOff, x, y);
  }

  function drawBoat(ctx, x, y, t, cam) {
    const bob = Math.sin(t * 2) * 2;
    if (cam && !Atlas.inView(cam, x, y + bob, 44, 28)) return;
    Atlas.blit(ctx, Atlas.frames.boat, x, y + bob);
  }

  function drawSign(ctx, x, y, cam) {
    if (cam && !Atlas.inView(cam, x, y, 40, 56)) return;
    Atlas.blit(ctx, Atlas.frames.sign, x, y);
  }

  function drawSeagull(ctx, x, y, t, seed) {
    const flap = Math.sin(t * 7 + seed) > 0 ? 2 : -2;
    const ox = x + Math.sin(t * 0.35 + seed) * 48;
    const oy = y + Math.cos(t * 0.5 + seed) * 6;
    const ctxf = ctx;
    ctxf.fillStyle = "#f7fbff";
    ctxf.fillRect(ox | 0, oy | 0, 8, 3);
    ctxf.fillRect((ox - 7) | 0, (oy - flap) | 0, 7, 2);
    ctxf.fillRect((ox + 8) | 0, (oy - flap) | 0, 7, 2);
    ctxf.fillStyle = "#0c355e";
    ctxf.fillRect((ox + 3) | 0, (oy + 1) | 0, 2, 2);
  }

  function drawBin(ctx, x, y, t, cam) {
    const wob = Math.sin(t * 10) * 0.4;
    if (cam && !Atlas.inView(cam, x, y, 28, 36)) return;
    Atlas.blit(ctx, Atlas.frames.bin, x + wob, y);
  }

  function drawTrash(ctx, item, t, cam) {
    const bob = Math.sin(t * 3 + item.y) * 0.8;
    const img = Atlas.frames[item.type] || Atlas.frames.can;
    if (cam && !Atlas.inView(cam, item.x, item.y, 24, 32)) return;
    Atlas.blit(ctx, img, item.x, item.y + bob);
  }

  function drawPlayer(ctx, p, goldHat, t, cam) {
    const moving = Math.hypot(p.vx || 0, p.vy || 0) > 8;
    const walk = moving ? Math.floor(t * 10) % 4 : 0;
    const face = (p.facing || 1) >= 0 ? 1 : -1;
    const atk = p.attacking ? 1 : 0;
    const gold = goldHat ? 1 : 0;
    const key = `${face}_${walk}_${atk}_${gold}`;
    const img = Atlas.frames.player[key] || Atlas.frames.player["1_0_0_0"];
    if (cam && !Atlas.inView(cam, p.x, p.y, 80, 96)) return;
    Atlas.blit(ctx, img, p.x, p.y);
  }

  function themeSky(theme) {
    const map = {
      beach: ["#8ad8ff", "#52b4ec", "#2e90d0"],
      souk: ["#9ad4ff", "#5eb3e8", "#3a90c8"],
      lagoon: ["#9ae0ff", "#62c4e8", "#3aa8c8"],
      port: ["#7ec0e8", "#4a98c8", "#2a7098"],
      sunset: ["#ffb068", "#f08050", "#c05070"],
      resort: ["#90d8ff", "#58b8f0", "#3890d0"],
      festival: ["#b090ff", "#7860d8", "#4840a8"],
    };
    return map[theme] || map.beach;
  }

  function drawWorldBg(ctx, W, H, t, theme = "beach", cam) {
    Atlas.bake();
    const sky = themeSky(theme);
    const seaY = 210;
    const sandY = 320;

    ctx.fillStyle = sky[0];
    ctx.fillRect(0, 0, W, 80);
    ctx.fillStyle = sky[1];
    ctx.fillRect(0, 80, W, 80);
    ctx.fillStyle = sky[2];
    ctx.fillRect(0, 160, W, seaY - 160);

    // clouds
    const cx = [40, 280, 620, 820];
    cx.forEach((x, i) => {
      const ox = x + Math.sin(t * 0.12 + i) * 8;
      if (!cam || Atlas.inView(cam, ox, 20 + i * 8, 48, 20)) {
        Atlas.blit(ctx, Atlas.frames.cloud, ox, 20 + (i % 3) * 10);
      }
    });

    // sun / moon
    if (theme === "festival") {
      ctx.fillStyle = "#fff0a8";
      ctx.fillRect(W - 90, 24, 22, 22);
      ctx.fillStyle = sky[1];
      ctx.fillRect(W - 82, 28, 14, 14);
      for (let i = 0; i < 18; i++) {
        if (Math.sin(t * 3 + i) > 0) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(20 + i * 48, 12 + (i % 5) * 10, 2, 2);
        }
      }
    } else if (theme === "sunset") {
      ctx.fillStyle = "#ff9040";
      ctx.fillRect(W - 110, 50, 36, 36);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(W - 100, 60, 16, 16);
    } else {
      ctx.fillStyle = "#fff0a8";
      ctx.fillRect(W - 100, 22, 28, 28);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(W - 94, 28, 16, 16);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.2;
        ctx.fillStyle = "#fff0a8";
        ctx.fillRect(W - 86 + Math.cos(a) * 22, 36 + Math.sin(a) * 22, 3, 3);
      }
    }

    // sea tiles
    tileFill(ctx, Atlas.tiles.sea0, 0, seaY, W, 48, cam);
    tileFill(ctx, Atlas.tiles.foam, 0, seaY + 32, W, 16, cam);
    tileFill(ctx, Atlas.tiles.sea1, 0, seaY + 48, W, 32, cam);
    tileFill(ctx, Atlas.tiles.sea2, 0, seaY + 80, W, 16, cam);

    // sun reflection
    const rx = W - 86;
    for (let k = 0; k < 12; k++) {
      const rw = 5 + (k % 3) * 4 + Math.sin(t * 3 + k) * 2;
      ctx.fillStyle = theme === "festival" ? "#c8d8ff" : "#ffe9a0";
      ctx.fillRect(rx - rw / 2 + Math.sin(t * 2 + k) * 3, seaY + 8 + k * 8, rw, 2);
    }

    // sand tiles
    const sands = [Atlas.tiles.sand0, Atlas.tiles.sand1, Atlas.tiles.sand2];
    const x0 = cam ? Math.max(0, (cam.x / TILE | 0) * TILE) : 0;
    const y0 = cam ? Math.max(sandY, (cam.y / TILE | 0) * TILE) : sandY;
    const x1 = cam ? Math.min(W, cam.x + cam.vw + TILE) : W;
    const y1 = cam ? Math.min(H, cam.y + cam.vh + TILE) : H;
    for (let ty = y0; ty < y1; ty += TILE) {
      for (let tx = x0; tx < x1; tx += TILE) {
        const img = sands[((tx / 16 | 0) + (ty / 16 | 0) * 3) % 3];
        ctx.drawImage(img, tx, ty);
      }
    }
    // foam shoreline
    tileFill(ctx, Atlas.tiles.foam, 0, sandY - 8, W, 16, cam);

    // props
    if (theme === "souk") {
      drawHouse(ctx, 20, 170, cam);
      drawHouse(ctx, 90, 178, cam);
      drawHouse(ctx, 700, 172, cam);
      tileFill(ctx, Atlas.tiles.grass, 400, 360, 96, 48, cam);
    } else if (theme === "port") {
      drawLighthouse(ctx, 520, 140, t, cam);
      drawBoat(ctx, 80, 270, t, cam);
      drawBoat(ctx, 400, 278, t + 1, cam);
    } else if (theme === "lagoon") {
      drawPalm(ctx, 60, 230, t, 0, cam);
      drawPalm(ctx, 140, 240, t, 1, cam);
      tileFill(ctx, Atlas.tiles.sea0, 380, 500, 120, 32, cam);
    } else if (theme === "resort") {
      drawHouse(ctx, 24, 165, cam);
      drawHouse(ctx, 100, 172, cam);
      drawHouse(ctx, 640, 168, cam);
    } else if (theme === "festival") {
      drawHouse(ctx, 40, 175, cam);
      drawLighthouse(ctx, 520, 140, t, cam);
    } else {
      drawHouse(ctx, 24, 175, cam);
      drawHouse(ctx, 100, 182, cam);
      drawHouse(ctx, 700, 178, cam);
      drawLighthouse(ctx, 520, 140, t, cam);
      drawBoat(ctx, 300, 272, t, cam);
    }

    drawPalm(ctx, 70, 230, t, 0, cam);
    drawPalm(ctx, 220, 220, t, 1.4, cam);
    drawPalm(ctx, 800, 235, t, 2.8, cam);
    drawSign(ctx, 16, 340, cam);
    drawSeagull(ctx, 120, 90, t, 0);
    drawSeagull(ctx, 480, 70, t, 2.1);
  }

  function drawTitleScene(ctx, t) {
    Atlas.bake();
    const W = 280;
    const H = 150;
    ctx.fillStyle = "#52b4ec";
    ctx.fillRect(0, 0, W, 50);
    tileFill(ctx, Atlas.tiles.sea1, 0, 48, W, 32);
    tileFill(ctx, Atlas.tiles.foam, 0, 72, W, 16);
    tileFill(ctx, Atlas.tiles.sand0, 0, 84, W, H);
    Atlas.blit(ctx, Atlas.frames.house, 4, 20);
    Atlas.blit(ctx, Math.sin(t * 5) > 0 ? Atlas.frames.lhOn : Atlas.frames.lhOff, 200, -10);
    Atlas.blit(ctx, Math.sin(t * 2) > 0 ? Atlas.frames.palm1 : Atlas.frames.palm0, 90, 20);
    Atlas.blit(ctx, Atlas.frames.boat, 140, 55);
    const walk = Math.floor(t * 8) % 4;
    const atk = Math.sin(t * 2.5) > 0.7 ? 1 : 0;
    Atlas.blit(ctx, Atlas.frames.player[`1_${walk}_${atk}_0`], 90, 55);
    Atlas.blit(ctx, Atlas.frames.bin, 165, 90);
    Atlas.blit(ctx, Atlas.frames.can, 50, 110);
    Atlas.blit(ctx, Atlas.frames.bottle, 210, 100);
    Atlas.blit(ctx, Atlas.frames.bag, 30, 115);
  }

  function drawTitleBackground(ctx, W, H, t) {
    drawWorldBg(ctx, W, H, t, "beach", null);
  }

  function drawAvatar(ctx, goldHat, t) {
    Atlas.bake();
    ctx.clearRect(0, 0, 40, 40);
    ctx.fillStyle = "#52b4ec";
    ctx.fillRect(0, 0, 40, 40);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(0.42, 0.42);
    const gold = goldHat ? 1 : 0;
    Atlas.blit(ctx, Atlas.frames.player[`1_0_0_${gold}`], 4, 0);
    ctx.restore();
  }

  function drawMinimap(ctx, W, H, trash, player, t, cam) {
    const mw = 56;
    const mh = 56;
    const mx = (cam && cam.x != null ? cam.x : 0) + (cam && cam.vw ? cam.vw : W) - mw - 8;
    const my = (cam && cam.y != null ? cam.y : 0) + 8;
    ctx.fillStyle = "rgba(8,40,72,0.88)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = Math.sin(t * 4) > 0 ? "#ffd24a" : "#7ad0ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);
    trash.forEach((tr) => {
      ctx.fillStyle = "#ff5550";
      ctx.fillRect(mx + 3 + (tr.x / W) * (mw - 6), my + 3 + (tr.y / H) * (mh - 6), 2, 2);
    });
    ctx.fillStyle = "#3ddc5a";
    ctx.fillRect(mx + 3 + (player.x / W) * (mw - 6), my + 3 + (player.y / H) * (mh - 6), 4, 4);
  }

  function drawIslandMap(ctx, W, H, t, unlocked, starsMap, selectedId) {
    ctx.fillStyle = "#1a6bb5";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = "#3aa0d8";
      ctx.fillRect((i * 37) % W, 10 + (i * 19) % H, 3, 2);
    }
    // stepped island
    ctx.fillStyle = "#e8d4a8";
    for (let y = 28; y < 210; y += 2) {
      const inset = Math.abs(y - 118) / 8 | 0;
      ctx.fillRect(24 + inset, y, W - 48 - inset * 2, 2);
    }
    ctx.fillStyle = "#3ddc5a";
    ctx.fillRect(80, 90, 50, 28);
    ctx.fillRect(140, 130, 44, 22);

    Campaign.list().forEach((lv) => {
      const open = lv.id <= unlocked;
      const st = (starsMap && starsMap[String(lv.id)]) || 0;
      const sel = lv.id === selectedId;
      const pulse = sel && Math.sin(t * 6) > 0 ? 2 : 0;
      ctx.fillStyle = sel ? "#ffd24a" : "#000";
      ctx.fillRect(lv.mapX - 6 - pulse, lv.mapY - 6 - pulse, 18 + pulse * 2, 18 + pulse * 2);
      ctx.fillStyle = open ? "#3ddc5a" : "#555";
      ctx.fillRect(lv.mapX - 4, lv.mapY - 4, 14, 14);
      if (open) {
        ctx.fillStyle = "#fff";
        ctx.font = "8px monospace";
        ctx.fillText(String(lv.id), lv.mapX, lv.mapY + 6);
        if (st > 0) {
          ctx.fillStyle = "#ffd24a";
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
