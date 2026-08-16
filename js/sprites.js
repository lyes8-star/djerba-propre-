/* High-detail animated pixel sprites (256×384 world) */
const Sprites = (() => {
  const C = {
    sky0: "#7ad4ff", sky1: "#4db3e8", sky2: "#2f92d0",
    sea0: "#4ec4f0", sea1: "#1a8bc8", sea2: "#0f6a9e", sea3: "#0a4f78",
    foam: "#e8f7ff",
    sand0: "#f3e2b8", sand1: "#e2c78a", sand2: "#c9a86c", sand3: "#a88850",
    white: "#f8fbff", wall: "#eef4fa", wallD: "#d5dde8",
    blue: "#2b7fd4", blueD: "#155a9e", blueL: "#6ec8ff",
    green: "#3ddc5a", greenD: "#1e9a35", greenL: "#8dff9c",
    wood: "#a86730", woodD: "#6e4018", woodL: "#c88848",
    skin: "#f0c8a0", skinD: "#d4a574",
    navy: "#0d3a66", gold: "#ffd24a", goldL: "#ffe9a0",
    red: "#ff5a55", redD: "#c03834",
    metal: "#d0d5dc", bag: "#4a4a52", bottle: "#3ecfc4",
    cloud: "#f2f8ff",
  };

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect((x | 0), (y | 0), w, h);
  }

  function dither(ctx, x, y, w, h, c1, c2) {
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        px(ctx, x + ix, y + iy, 1, 1, ((ix + iy) & 1) ? c1 : c2);
      }
    }
  }

  function drawCloud(ctx, x, y, t, seed) {
    const ox = Math.sin(t * 0.12 + seed) * 3;
    px(ctx, x + ox, y + 3, 18, 5, C.cloud);
    px(ctx, x + 4 + ox, y, 12, 5, C.cloud);
    px(ctx, x + 8 + ox, y + 4, 14, 4, C.cloud);
    px(ctx, x + 6 + ox, y + 2, 4, 2, "#ffffff");
  }

  function drawPalm(ctx, x, y, t, seed) {
    const sway = Math.sin(t * 2.4 + seed) * 2;
    // trunk
    px(ctx, x + 6, y + 14, 4, 22, C.woodD);
    px(ctx, x + 7, y + 14, 2, 22, C.wood);
    for (let i = 0; i < 5; i++) px(ctx, x + 6, y + 16 + i * 4, 4, 1, C.woodL);
    // fronds
    px(ctx, x + sway, y + 8, 16, 4, C.greenD);
    px(ctx, x - 4 + sway, y + 11, 10, 3, C.green);
    px(ctx, x + 10 + sway, y + 11, 10, 3, C.green);
    px(ctx, x + 2 + sway, y + 4, 8, 5, C.greenL);
    px(ctx, x + 8 + sway, y + 5, 7, 4, C.greenD);
    px(ctx, x - 2 + sway, y + 14, 6, 2, C.greenD);
    px(ctx, x + 12 + sway, y + 14, 6, 2, C.greenD);
    // coconuts
    px(ctx, x + 6, y + 12, 3, 3, C.woodD);
    px(ctx, x + 10, y + 13, 3, 3, C.woodD);
  }

  function drawHouse(ctx, x, y) {
    px(ctx, x, y + 12, 22, 16, C.white);
    px(ctx, x + 1, y + 13, 20, 2, C.wall);
    px(ctx, x, y + 26, 22, 2, C.wallD);
    // dome
    px(ctx, x + 6, y + 2, 10, 11, C.blueL);
    px(ctx, x + 7, y + 1, 8, 4, C.blue);
    px(ctx, x + 8, y + 4, 6, 6, C.blueD);
    px(ctx, x + 9, y + 5, 4, 2, C.blueL);
    // door / window
    px(ctx, x + 8, y + 18, 5, 10, C.woodD);
    px(ctx, x + 9, y + 20, 3, 2, C.gold);
    px(ctx, x + 15, y + 16, 5, 5, C.blueL);
    px(ctx, x + 16, y + 17, 3, 3, C.blueD);
    px(ctx, x + 2, y + 16, 4, 4, C.blueL);
  }

  function drawLighthouse(ctx, x, y, t) {
    px(ctx, x + 4, y + 10, 10, 30, C.white);
    px(ctx, x + 4, y + 14, 10, 5, C.red);
    px(ctx, x + 4, y + 24, 10, 5, C.red);
    px(ctx, x + 5, y + 11, 3, 28, C.wall);
    px(ctx, x + 2, y + 2, 14, 8, C.navy);
    px(ctx, x + 4, y + 3, 10, 5, C.blueD);
    const on = Math.sin(t * 5) > 0;
    px(ctx, x + 6, y + 4, 6, 4, on ? C.goldL : C.gold);
    if (on) {
      dither(ctx, x + 16, y + 5, 18, 2, "rgba(255,210,74,0.45)", "rgba(255,210,74,0.1)");
      dither(ctx, x - 16, y + 5, 18, 2, "rgba(255,210,74,0.35)", "rgba(255,210,74,0.08)");
    }
  }

  function drawBoat(ctx, x, y, t) {
    const bob = Math.sin(t * 2) * 1.5;
    const yy = y + bob;
    px(ctx, x, yy + 7, 20, 5, C.woodD);
    px(ctx, x + 2, yy + 5, 16, 4, C.wood);
    px(ctx, x + 3, yy + 6, 14, 1, C.woodL);
    px(ctx, x + 9, yy - 5, 2, 12, C.white);
    px(ctx, x + 11, yy - 3, 7, 5, C.red);
    px(ctx, x + 11, yy - 2, 5, 2, C.redD);
    px(ctx, x + 5, yy + 11, 4, 1, C.foam);
  }

  function drawSign(ctx, x, y) {
    px(ctx, x + 10, y + 8, 4, 28, C.woodD);
    px(ctx, x + 11, y + 10, 2, 24, C.woodL);
    px(ctx, x, y + 8, 22, 6, C.wood);
    px(ctx, x + 1, y + 15, 20, 5, C.wood);
    px(ctx, x + 1, y + 21, 18, 5, C.wood);
    ctx.fillStyle = C.white;
    ctx.font = "5px monospace";
    ctx.fillText("PLAGE", x + 4, y + 12);
    ctx.fillText("H.SOUK", x + 3, y + 19);
    ctx.fillText("MIDOUN", x + 3, y + 25);
  }

  function drawSeagull(ctx, x, y, t, seed) {
    const flap = Math.sin(t * 7 + seed) > 0 ? 1 : -1;
    const ox = x + Math.sin(t * 0.35 + seed) * 28;
    const oy = y + Math.cos(t * 0.5 + seed) * 4;
    px(ctx, ox, oy, 4, 2, C.white);
    px(ctx, ox - 4, oy - flap, 4, 1, C.white);
    px(ctx, ox + 4, oy - flap, 4, 1, C.white);
    px(ctx, ox + 1, oy + 1, 1, 1, C.navy);
  }

  function drawBin(ctx, x, y, t) {
    const wob = Math.sin(t * 10) * 0.4;
    px(ctx, x + wob, y + 4, 12, 14, C.green);
    px(ctx, x + 1 + wob, y + 5, 10, 3, C.greenL);
    px(ctx, x + 1 + wob, y, 10, 4, C.greenD);
    px(ctx, x + 3 + wob, y + 8, 6, 6, C.white);
    px(ctx, x + 4 + wob, y + 9, 4, 4, C.greenD);
    // recycle arrows hint
    px(ctx, x + 5 + wob, y + 10, 2, 2, C.green);
    px(ctx, x - 1 + wob, y + 16, 3, 3, C.navy);
    px(ctx, x + 10 + wob, y + 16, 3, 3, C.navy);
    px(ctx, x + wob, y + 18, 12, 2, "rgba(0,0,0,0.18)");
  }

  function drawTrash(ctx, item, t) {
    const { x, y, type } = item;
    const spark = Math.sin(t * 6 + x * 0.2) > 0.65;
    const bob = Math.sin(t * 3 + y) * 0.6;
    const yy = y + bob;
    px(ctx, x + 1, yy + 8, 6, 2, "rgba(0,0,0,0.16)");
    if (type === "can") {
      px(ctx, x, yy, 6, 8, C.metal);
      px(ctx, x + 1, yy + 1, 4, 3, C.red);
      px(ctx, x + 1, yy + 5, 4, 1, "#9aa");
      px(ctx, x, yy, 6, 1, C.white);
      if (spark) px(ctx, x + 5, yy, 1, 1, C.white);
    } else if (type === "bottle") {
      px(ctx, x + 1, yy + 2, 4, 9, C.bottle);
      px(ctx, x + 2, yy, 2, 3, C.white);
      px(ctx, x + 1, yy + 4, 4, 2, "rgba(255,255,255,0.25)");
      if (spark) px(ctx, x + 4, yy + 5, 1, 1, C.white);
    } else if (type === "bag") {
      px(ctx, x, yy + 2, 9, 8, C.bag);
      px(ctx, x + 1, yy, 7, 3, "#5a5a66");
      px(ctx, x + 2, yy + 4, 5, 3, "#2e2e36");
      px(ctx, x + 3, yy + 1, 1, 1, C.white);
      if (spark) px(ctx, x + 7, yy + 2, 1, 1, C.white);
    } else {
      px(ctx, x, yy, 6, 6, C.woodD);
    }
  }

  function drawPlayer(ctx, p, goldHat, t) {
    const x = p.x | 0;
    const y = p.y | 0;
    const moving = Math.hypot(p.vx || 0, p.vy || 0) > 5;
    const frame = moving ? (Math.floor(t * 12) % 4) : 0;
    const bob = moving ? (frame === 1 || frame === 3 ? -1 : 0) : Math.sin(t * 3) * 0.5;
    const yy = y + bob;
    const facing = p.facing || 1;

    px(ctx, x + 2, yy + 22, 14, 3, "rgba(0,0,0,0.2)");

    // legs 4-frame
    if (frame === 0 || frame === 2) {
      px(ctx, x + 5, yy + 16, 4, 7, "#3d5f95");
      px(ctx, x + 11, yy + 16, 4, 7, "#2f4f82");
    } else if (frame === 1) {
      px(ctx, x + 4, yy + 16, 4, 7, "#3d5f95");
      px(ctx, x + 12, yy + 17, 4, 6, "#2f4f82");
    } else {
      px(ctx, x + 4, yy + 17, 4, 6, "#2f4f82");
      px(ctx, x + 12, yy + 16, 4, 7, "#3d5f95");
    }
    px(ctx, x + 5, yy + 22, 4, 2, C.navy);
    px(ctx, x + 11, yy + 22, 4, 2, C.navy);

    // torso
    px(ctx, x + 4, yy + 8, 12, 10, C.green);
    px(ctx, x + 5, yy + 9, 10, 2, C.greenL);
    px(ctx, x + 7, yy + 11, 6, 5, C.white);
    px(ctx, x + 8, yy + 12, 4, 3, C.greenD);
    px(ctx, x + 8, yy + 12, 1, 1, C.greenL);
    px(ctx, x + 11, yy + 14, 1, 1, C.greenL);

    // head
    px(ctx, x + 6, yy + 3, 8, 6, C.skin);
    px(ctx, x + 7, yy + 4, 2, 1, C.skinD);
    const eyeX = facing > 0 ? x + 11 : x + 7;
    px(ctx, eyeX, yy + 5, 2, 2, C.navy);
    px(ctx, eyeX + (facing > 0 ? 0 : 1), yy + 5, 1, 1, C.white);

    // hat
    const hc = goldHat ? C.gold : C.greenD;
    const hc2 = goldHat ? C.goldL : C.green;
    px(ctx, x + 5, yy + 1, 10, 3, hc);
    px(ctx, x + 7, yy - 1, 6, 2, hc2);
    px(ctx, x + 4, yy + 3, 12, 1, hc);

    // gloves
    px(ctx, x + 2, yy + 12, 3, 3, C.white);
    px(ctx, x + 15, yy + 12, 3, 3, C.white);

    // scorpion claw
    const ax = facing > 0 ? x + 16 : x - 10;
    const ay = yy + 10;
    if (p.attacking) {
      const ext = facing > 0 ? 12 : -12;
      px(ctx, facing > 0 ? ax : ax + 2, ay, 12, 3, C.navy);
      px(ctx, ax + (facing > 0 ? 9 : -3), ay - 4, 6, 3, C.gold);
      px(ctx, ax + (facing > 0 ? 9 : -3), ay + 4, 6, 3, C.gold);
      px(ctx, ax + ext, ay, 5, 3, C.red);
      px(ctx, ax + ext + (facing > 0 ? 3 : -3), ay - 1, 2, 1, C.goldL);
    } else {
      px(ctx, facing > 0 ? ax : ax + 4, ay, 7, 3, C.navy);
      px(ctx, ax + (facing > 0 ? 4 : 0), ay - 3, 5, 2, C.gold);
      px(ctx, ax + (facing > 0 ? 4 : 0), ay + 4, 5, 2, C.gold);
      px(ctx, ax + (facing > 0 ? 7 : -1), ay, 3, 3, C.red);
    }
  }

  function drawWorldBg(ctx, W, H, t, theme = "beach") {
    const themes = {
      beach: { sky0: C.sky0, sky1: C.sky1, sky2: C.sky2, sea0: C.sea0, sea1: C.sea1, sea2: C.sea2, sand: C.sand1, sandTop: C.sand0, sun: true, moon: false },
      souk: { sky0: "#8fd0ff", sky1: "#5eb3e8", sky2: "#3a90c8", sea0: "#4eb8e0", sea1: "#1a7ab0", sea2: "#0f5a88", sand: "#e8d09a", sandTop: "#f2e2b0", sun: true, moon: false },
      lagoon: { sky0: "#9ae0ff", sky1: "#62c4e8", sky2: "#3aa8c8", sea0: "#5ee0d0", sea1: "#2ab8a8", sea2: "#1a8880", sand: "#d8e8c8", sandTop: "#e8f0d8", sun: true, moon: false },
      port: { sky0: "#7ec0e8", sky1: "#4a98c8", sky2: "#2a7098", sea0: "#3a90b8", sea1: "#1a6088", sea2: "#0a4060", sand: "#c8b898", sandTop: "#d8c8a8", sun: true, moon: false },
      sunset: { sky0: "#ffb068", sky1: "#f08050", sky2: "#c05070", sea0: "#e07060", sea1: "#884878", sea2: "#503868", sand: "#d8a878", sandTop: "#e8c098", sun: false, moon: false },
      resort: { sky0: "#90d8ff", sky1: "#58b8f0", sky2: "#3890d0", sea0: "#48c0f0", sea1: "#2090c8", sea2: "#106898", sand: "#f0e0b8", sandTop: "#fff0d0", sun: true, moon: false },
      festival: { sky0: "#b090ff", sky1: "#7860d8", sky2: "#4840a8", sea0: "#60a0e8", sea1: "#3070b8", sea2: "#184888", sand: "#e8d8a0", sandTop: "#f8e8b8", sun: false, moon: true },
    };
    const th = themes[theme] || themes.beach;

    px(ctx, 0, 0, W, 28, th.sky0);
    px(ctx, 0, 28, W, 28, th.sky1);
    px(ctx, 0, 56, W, 22, th.sky2);

    drawCloud(ctx, 18, 10, t, 0);
    drawCloud(ctx, 110, 6, t, 1.7);
    drawCloud(ctx, 190, 14, t, 3.2);

    if (th.sun) {
      px(ctx, W - 36, 10, 14, 14, C.goldL);
      px(ctx, W - 33, 13, 8, 8, C.gold);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.2;
        px(ctx, W - 29 + Math.cos(a) * 12, 17 + Math.sin(a) * 12, 2, 2, C.goldL);
      }
    }
    if (theme === "sunset") {
      px(ctx, W - 40, 20, 18, 18, "#ff9040");
      px(ctx, W - 36, 24, 10, 10, "#ffd24a");
    }
    if (th.moon) {
      px(ctx, W - 34, 12, 12, 12, C.goldL);
      px(ctx, W - 30, 14, 8, 8, th.sky1);
      // stars
      for (let i = 0; i < 12; i++) {
        if (Math.sin(t * 3 + i) > 0) px(ctx, 10 + i * 18, 8 + (i % 5) * 6, 2, 2, C.white);
      }
    }

    // sea
    px(ctx, 0, 74, W, 42, th.sea1);
    px(ctx, 0, 74, W, 8, th.sea0);
    px(ctx, 0, 104, W, 8, th.sea2);
    px(ctx, 0, 110, W, 6, C.sea3);
    const wave = Math.floor(t * 4) % 10;
    for (let i = -10; i < W; i += 10) {
      px(ctx, i + wave, 82, 5, 2, C.foam);
      px(ctx, i + (wave * 2) % 10, 92, 4, 1, th.sea0);
    }

    // sand / ground
    px(ctx, 0, 116, W, H - 116, th.sand);
    px(ctx, 0, 116, W, 5, th.sandTop);
    for (let i = 0; i < 90; i++) {
      const sx = (i * 47 + 19) % W;
      const sy = 126 + ((i * 73) % (H - 140));
      px(ctx, sx, sy, 1, 1, i % 4 === 0 ? C.sand2 : th.sandTop);
    }

    // theme props
    if (theme === "souk") {
      drawHouse(ctx, 8, 58);
      drawHouse(ctx, 40, 62);
      drawHouse(ctx, 200, 60);
      // market stalls
      px(ctx, 90, 100, 20, 12, C.red);
      px(ctx, 92, 102, 16, 4, C.gold);
      px(ctx, 120, 98, 18, 14, C.greenD);
      px(ctx, 122, 100, 14, 4, C.white);
    } else if (theme === "port") {
      drawLighthouse(ctx, 145, 34, t);
      drawBoat(ctx, 40, 96, t);
      drawBoat(ctx, 160, 100, t + 1);
      // dock
      px(ctx, 20, 112, 80, 6, C.woodD);
      px(ctx, 20, 112, 80, 2, C.wood);
      for (let i = 0; i < 6; i++) px(ctx, 28 + i * 12, 118, 3, 8, C.woodD);
    } else if (theme === "lagoon") {
      drawPalm(ctx, 30, 78, t, 0);
      drawPalm(ctx, 60, 82, t, 1);
      drawPalm(ctx, 200, 80, t, 2);
      // water patches
      px(ctx, 100, 140, 40, 10, th.sea0);
      px(ctx, 160, 180, 30, 8, th.sea1);
    } else if (theme === "resort") {
      drawHouse(ctx, 10, 55);
      drawHouse(ctx, 50, 58);
      drawHouse(ctx, 180, 55);
      // umbrella
      px(ctx, 100, 130, 20, 3, C.red);
      px(ctx, 108, 133, 2, 14, C.wood);
      px(ctx, 140, 150, 18, 3, C.blueL);
      px(ctx, 147, 153, 2, 12, C.wood);
    } else if (theme === "festival") {
      drawHouse(ctx, 20, 58);
      drawLighthouse(ctx, 145, 34, t);
      // banners
      for (let i = 0; i < 6; i++) {
        px(ctx, 40 + i * 30, 120, 16, 4, i % 2 ? C.gold : C.red);
        px(ctx, 46 + i * 30, 124, 2, 10, C.wood);
      }
    } else {
      drawHouse(ctx, 8, 58);
      drawHouse(ctx, 55, 62);
      drawHouse(ctx, 200, 60);
      drawLighthouse(ctx, 145, 34, t);
      drawBoat(ctx, 105, 96, t);
    }

    drawPalm(ctx, 35, 78, t, 0);
    drawPalm(ctx, 95, 74, t, 1.4);
    drawPalm(ctx, 220, 80, t, 2.8);
    drawSign(ctx, 6, 130);
    drawSeagull(ctx, 50, 40, t, 0);
    drawSeagull(ctx, 160, 28, t, 2.1);
  }

  function drawIslandMap(ctx, W, H, t, unlocked, starsMap, selectedId) {
    // water
    px(ctx, 0, 0, W, H, "#1a6bb5");
    for (let i = 0; i < 30; i++) {
      px(ctx, (i * 37) % W, 10 + (i * 19) % H, 2, 1, "#3aa0d8");
    }
    // island blob
    px(ctx, 30, 30, 180, 160, "#e8d4a8");
    px(ctx, 50, 20, 140, 30, "#e8d4a8");
    px(ctx, 40, 170, 150, 30, "#e8d4a8");
    px(ctx, 20, 60, 30, 80, "#e8d4a8");
    px(ctx, 190, 50, 40, 100, "#e8d4a8");
    // green patches
    px(ctx, 70, 80, 40, 20, "#3ddc5a");
    px(ctx, 130, 120, 35, 18, "#2db84a");

    Campaign.list().forEach((lv) => {
      const open = lv.id <= unlocked;
      const st = (starsMap && starsMap[String(lv.id)]) || 0;
      const sel = lv.id === selectedId;
      const pulse = sel && Math.sin(t * 6) > 0 ? 2 : 0;
      px(ctx, lv.mapX - 4 - pulse, lv.mapY - 4 - pulse, 12 + pulse * 2, 12 + pulse * 2, sel ? C.gold : "#000");
      px(ctx, lv.mapX - 2, lv.mapY - 2, 8, 8, open ? C.green : "#555");
      if (open) {
        ctx.fillStyle = C.white;
        ctx.font = "6px monospace";
        ctx.fillText(String(lv.id), lv.mapX, lv.mapY + 4);
        if (st > 0) {
          ctx.fillStyle = C.gold;
          ctx.fillText("*".repeat(st), lv.mapX - 4, lv.mapY + 14);
        }
      } else {
        px(ctx, lv.mapX, lv.mapY, 4, 4, "#222");
      }
    });

    ctx.fillStyle = C.white;
    ctx.font = "7px monospace";
    ctx.fillText("CARTE DE DJERBA", 60, 16);
  }

  function drawTitleScene(ctx, t) {
    const W = 224;
    const H = 120;
    // local cropped beach vibe
    px(ctx, 0, 0, W, 40, C.sky1);
    px(ctx, 0, 40, W, 28, C.sea1);
    const wave = Math.floor(t * 4) % 8;
    for (let i = 0; i < W; i += 8) px(ctx, i + wave, 48, 4, 2, C.foam);
    px(ctx, 0, 68, W, H, C.sand1);
    drawHouse(ctx, 10, 28);
    drawLighthouse(ctx, 150, 8, t);
    drawPalm(ctx, 70, 40, t, 0);
    drawPalm(ctx, 190, 44, t, 2);
    drawBoat(ctx, 100, 52, t);
    drawPlayer(ctx, { x: 95, y: 78, facing: 1, attacking: Math.sin(t * 2.5) > 0.8, vx: 30, vy: 0 }, false, t);
    drawBin(ctx, 125, 88, t);
    drawTrash(ctx, { x: 55, y: 95, type: "can" }, t);
    drawTrash(ctx, { x: 165, y: 92, type: "bottle" }, t);
    drawTrash(ctx, { x: 40, y: 100, type: "bag" }, t);
    drawSeagull(ctx, 30, 18, t, 1);
  }

  function drawTitleBackground(ctx, W, H, t) {
    drawWorldBg(ctx, W, H, t, "beach");
  }

  function drawAvatar(ctx, goldHat, t) {
    ctx.clearRect(0, 0, 32, 32);
    px(ctx, 0, 0, 32, 32, C.sky1);
    drawPlayer(ctx, { x: 6, y: 4, facing: 1, attacking: false, vx: 0, vy: 0 }, goldHat, t);
  }

  function drawMinimap(ctx, W, H, trash, player, t) {
    const mx = W - 40;
    const my = H - 40;
    ctx.fillStyle = "rgba(8,40,72,0.85)";
    ctx.fillRect(mx, my, 36, 36);
    ctx.strokeStyle = C.blueL;
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, 36, 36);
    // pulse border
    if (Math.sin(t * 4) > 0) {
      ctx.strokeStyle = C.gold;
      ctx.strokeRect(mx + 1, my + 1, 34, 34);
    }
    trash.forEach((tr) => {
      px(ctx, mx + 2 + (tr.x / W) * 32, my + 2 + (tr.y / H) * 32, 2, 2, C.red);
    });
    px(ctx, mx + 2 + (player.x / W) * 32, my + 2 + (player.y / H) * 32, 3, 3, C.green);
  }

  return {
    C,
    px,
    drawPalm,
    drawHouse,
    drawLighthouse,
    drawBoat,
    drawSign,
    drawBin,
    drawTrash,
    drawPlayer,
    drawWorldBg,
    drawTitleScene,
    drawTitleBackground,
    drawAvatar,
    drawMinimap,
    drawIslandMap,
  };
})();
