/* Big detailed pixel sprites + themed worlds */
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
    ctx.fillRect(x | 0, y | 0, w, h);
  }

  function dither(ctx, x, y, w, h, c1, c2) {
    for (let iy = 0; iy < h; iy++) {
      for (let ix = 0; ix < w; ix++) {
        if (((ix + iy) & 1) === 0) px(ctx, x + ix, y + iy, 1, 1, c1);
        else px(ctx, x + ix, y + iy, 1, 1, c2);
      }
    }
  }

  function drawCloud(ctx, x, y, t, seed) {
    const ox = Math.sin(t * 0.12 + seed) * 4;
    px(ctx, x + ox, y + 4, 28, 8, C.cloud);
    px(ctx, x + 6 + ox, y, 18, 8, C.cloud);
    px(ctx, x + 12 + ox, y + 5, 20, 6, C.cloud);
    px(ctx, x + 10 + ox, y + 2, 6, 3, "#fff");
  }

  function drawPalm(ctx, x, y, t, seed) {
    const sway = Math.sin(t * 2.2 + seed) * 3;
    px(ctx, x + 10, y + 22, 6, 34, C.woodD);
    px(ctx, x + 11, y + 22, 3, 34, C.wood);
    for (let i = 0; i < 7; i++) px(ctx, x + 10, y + 24 + i * 5, 6, 2, C.woodL);
    px(ctx, x + sway, y + 12, 26, 6, C.greenD);
    px(ctx, x - 8 + sway, y + 16, 16, 5, C.green);
    px(ctx, x + 16 + sway, y + 16, 16, 5, C.green);
    px(ctx, x + 4 + sway, y + 4, 14, 8, C.greenL);
    px(ctx, x + 14 + sway, y + 6, 12, 6, C.greenD);
    px(ctx, x - 4 + sway, y + 20, 10, 3, C.greenD);
    px(ctx, x + 18 + sway, y + 20, 10, 3, C.greenD);
    px(ctx, x + 10, y + 18, 4, 4, C.woodD);
    px(ctx, x + 16, y + 20, 4, 4, C.woodD);
  }

  function drawHouse(ctx, x, y) {
    px(ctx, x, y + 18, 34, 24, C.white);
    px(ctx, x + 2, y + 20, 30, 3, C.wall);
    px(ctx, x, y + 40, 34, 3, C.wallD);
    px(ctx, x + 8, y + 2, 18, 18, C.blueL);
    px(ctx, x + 10, y, 14, 6, C.blue);
    px(ctx, x + 12, y + 6, 10, 10, C.blueD);
    px(ctx, x + 14, y + 8, 6, 3, C.blueL);
    px(ctx, x + 13, y + 28, 8, 14, C.woodD);
    px(ctx, x + 15, y + 32, 4, 3, C.gold);
    px(ctx, x + 24, y + 24, 8, 8, C.blueL);
    px(ctx, x + 26, y + 26, 4, 4, C.blueD);
    px(ctx, x + 3, y + 24, 7, 7, C.blueL);
  }

  function drawLighthouse(ctx, x, y, t) {
    px(ctx, x + 6, y + 16, 14, 44, C.white);
    px(ctx, x + 6, y + 22, 14, 7, C.red);
    px(ctx, x + 6, y + 36, 14, 7, C.red);
    px(ctx, x + 8, y + 18, 4, 40, C.wall);
    px(ctx, x + 2, y + 2, 22, 14, C.navy);
    px(ctx, x + 5, y + 4, 16, 8, C.blueD);
    const on = Math.sin(t * 5) > 0;
    px(ctx, x + 8, y + 6, 10, 6, on ? C.goldL : C.gold);
    if (on) {
      dither(ctx, x + 24, y + 8, 28, 3, "rgba(255,210,74,0.5)", "rgba(255,210,74,0.1)");
      dither(ctx, x - 24, y + 8, 28, 3, "rgba(255,210,74,0.4)", "rgba(255,210,74,0.08)");
    }
  }

  function drawBoat(ctx, x, y, t) {
    const bob = Math.sin(t * 2) * 2;
    const yy = y + bob;
    px(ctx, x, yy + 10, 30, 7, C.woodD);
    px(ctx, x + 3, yy + 7, 24, 6, C.wood);
    px(ctx, x + 4, yy + 8, 22, 2, C.woodL);
    px(ctx, x + 14, yy - 8, 3, 18, C.white);
    px(ctx, x + 17, yy - 5, 10, 7, C.red);
    px(ctx, x + 17, yy - 3, 8, 3, C.redD);
    px(ctx, x + 8, yy + 16, 6, 2, C.foam);
  }

  function drawSign(ctx, x, y) {
    px(ctx, x + 14, y + 10, 5, 40, C.woodD);
    px(ctx, x + 15, y + 12, 3, 36, C.woodL);
    px(ctx, x, y + 10, 32, 8, C.wood);
    px(ctx, x + 2, y + 20, 28, 7, C.wood);
    px(ctx, x + 2, y + 29, 26, 7, C.wood);
    ctx.fillStyle = C.white;
    ctx.font = "8px monospace";
    ctx.fillText("PLAGE", x + 5, y + 16);
    ctx.fillText("H.SOUK", x + 4, y + 25);
    ctx.fillText("MIDOUN", x + 4, y + 34);
  }

  function drawSeagull(ctx, x, y, t, seed) {
    const flap = Math.sin(t * 7 + seed) > 0 ? 2 : -2;
    const ox = x + Math.sin(t * 0.35 + seed) * 36;
    const oy = y + Math.cos(t * 0.5 + seed) * 5;
    px(ctx, ox, oy, 6, 3, C.white);
    px(ctx, ox - 6, oy - flap, 6, 2, C.white);
    px(ctx, ox + 6, oy - flap, 6, 2, C.white);
    px(ctx, ox + 2, oy + 1, 2, 2, C.navy);
  }

  function drawBin(ctx, x, y, t) {
    const wob = Math.sin(t * 10) * 0.5;
    px(ctx, x + wob, y + 6, 18, 20, C.green);
    px(ctx, x + 2 + wob, y + 8, 14, 4, C.greenL);
    px(ctx, x + 2 + wob, y, 14, 6, C.greenD);
    px(ctx, x + 5 + wob, y + 12, 8, 8, C.white);
    px(ctx, x + 7 + wob, y + 14, 4, 4, C.greenD);
    px(ctx, x - 2 + wob, y + 24, 5, 5, C.navy);
    px(ctx, x + 15 + wob, y + 24, 5, 5, C.navy);
    px(ctx, x + wob, y + 28, 18, 3, "rgba(0,0,0,0.2)");
  }

  function drawTrash(ctx, item, t) {
    const { x, y, type } = item;
    const spark = Math.sin(t * 6 + x * 0.2) > 0.55;
    const bob = Math.sin(t * 3 + y) * 0.8;
    const yy = y + bob;
    px(ctx, x + 2, yy + 12, 10, 3, "rgba(0,0,0,0.18)");
    if (type === "can") {
      px(ctx, x, yy, 10, 12, C.metal);
      px(ctx, x + 2, yy + 2, 6, 4, C.red);
      px(ctx, x + 2, yy + 8, 6, 2, "#9aa");
      px(ctx, x, yy, 10, 2, C.white);
      if (spark) px(ctx, x + 8, yy + 1, 2, 2, C.white);
    } else if (type === "bottle") {
      px(ctx, x + 2, yy + 3, 6, 14, C.bottle);
      px(ctx, x + 3, yy, 4, 4, C.white);
      px(ctx, x + 2, yy + 6, 6, 3, "rgba(255,255,255,0.3)");
      if (spark) px(ctx, x + 6, yy + 8, 2, 2, C.white);
    } else if (type === "bag") {
      px(ctx, x, yy + 3, 14, 12, C.bag);
      px(ctx, x + 2, yy, 10, 4, "#5a5a66");
      px(ctx, x + 3, yy + 6, 8, 5, "#2e2e36");
      if (spark) px(ctx, x + 11, yy + 3, 2, 2, C.white);
    } else {
      px(ctx, x, yy, 10, 10, C.woodD);
    }
  }

  function drawPlayer(ctx, p, goldHat, t) {
    const x = p.x | 0;
    const y = p.y | 0;
    const moving = Math.hypot(p.vx || 0, p.vy || 0) > 5;
    const frame = moving ? Math.floor(t * 12) % 4 : 0;
    const bob = moving ? (frame === 1 || frame === 3 ? -1 : 0) : Math.sin(t * 3) * 0.6;
    const yy = y + bob;
    const facing = p.facing || 1;

    px(ctx, x + 4, yy + 34, 22, 4, "rgba(0,0,0,0.22)");

    // legs
    if (frame === 0 || frame === 2) {
      px(ctx, x + 8, yy + 24, 6, 11, "#3d5f95");
      px(ctx, x + 18, yy + 24, 6, 11, "#2f4f82");
    } else if (frame === 1) {
      px(ctx, x + 6, yy + 24, 6, 11, "#3d5f95");
      px(ctx, x + 20, yy + 26, 6, 9, "#2f4f82");
    } else {
      px(ctx, x + 6, yy + 26, 6, 9, "#2f4f82");
      px(ctx, x + 20, yy + 24, 6, 11, "#3d5f95");
    }
    px(ctx, x + 8, yy + 33, 6, 3, C.navy);
    px(ctx, x + 18, yy + 33, 6, 3, C.navy);

    // torso + recycle logo
    px(ctx, x + 6, yy + 12, 20, 14, C.green);
    px(ctx, x + 8, yy + 13, 16, 3, C.greenL);
    px(ctx, x + 11, yy + 16, 10, 8, C.white);
    px(ctx, x + 13, yy + 17, 6, 6, C.greenD);
    px(ctx, x + 14, yy + 18, 2, 2, C.greenL);
    px(ctx, x + 17, yy + 18, 2, 2, C.greenL);
    px(ctx, x + 14, yy + 21, 4, 1, C.greenL);
    px(ctx, x + 18, yy + 20, 1, 2, C.green);

    // head
    px(ctx, x + 10, yy + 4, 12, 9, C.skin);
    px(ctx, x + 11, yy + 5, 3, 2, C.skinD);
    const eyeX = facing > 0 ? x + 17 : x + 11;
    px(ctx, eyeX, yy + 7, 3, 3, C.navy);
    px(ctx, eyeX + (facing > 0 ? 0 : 1), yy + 7, 1, 1, C.white);

    // hat
    const hc = goldHat ? C.gold : C.greenD;
    const hc2 = goldHat ? C.goldL : C.green;
    px(ctx, x + 8, yy + 1, 16, 4, hc);
    px(ctx, x + 11, yy - 2, 10, 3, hc2);
    px(ctx, x + 6, yy + 4, 20, 2, hc);

    // gloves
    px(ctx, x + 2, yy + 18, 5, 5, C.white);
    px(ctx, x + 25, yy + 18, 5, 5, C.white);

    // scorpion claw - big and readable
    const ax = facing > 0 ? x + 28 : x - 18;
    const ay = yy + 16;
    if (p.attacking) {
      const ext = facing > 0 ? 18 : -18;
      px(ctx, facing > 0 ? ax : ax + 4, ay, 18, 4, C.navy);
      px(ctx, ax + (facing > 0 ? 12 : -6), ay - 6, 10, 4, C.gold);
      px(ctx, ax + (facing > 0 ? 12 : -6), ay + 6, 10, 4, C.gold);
      px(ctx, ax + ext, ay, 8, 4, C.red);
      px(ctx, ax + ext + (facing > 0 ? 4 : -4), ay - 2, 3, 2, C.goldL);
    } else {
      px(ctx, facing > 0 ? ax : ax + 6, ay, 12, 4, C.navy);
      px(ctx, ax + (facing > 0 ? 6 : 0), ay - 5, 8, 3, C.gold);
      px(ctx, ax + (facing > 0 ? 6 : 0), ay + 6, 8, 3, C.gold);
      px(ctx, ax + (facing > 0 ? 10 : -2), ay, 5, 4, C.red);
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

    px(ctx, 0, 0, W, 40, th.sky0);
    px(ctx, 0, 40, W, 40, th.sky1);
    px(ctx, 0, 80, W, 30, th.sky2);

    drawCloud(ctx, 20, 12, t, 0);
    drawCloud(ctx, 140, 8, t, 1.7);
    drawCloud(ctx, 260, 18, t, 3.2);

    if (th.sun) {
      px(ctx, W - 50, 12, 22, 22, C.goldL);
      px(ctx, W - 45, 17, 12, 12, C.gold);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.2;
        px(ctx, W - 39 + Math.cos(a) * 18, 23 + Math.sin(a) * 18, 3, 3, C.goldL);
      }
    }
    if (theme === "sunset") {
      px(ctx, W - 55, 28, 26, 26, "#ff9040");
      px(ctx, W - 49, 34, 14, 14, "#ffd24a");
    }
    if (th.moon) {
      px(ctx, W - 48, 14, 18, 18, C.goldL);
      px(ctx, W - 42, 16, 12, 12, th.sky1);
      for (let i = 0; i < 16; i++) {
        if (Math.sin(t * 3 + i) > 0) px(ctx, 12 + i * 22, 10 + (i % 5) * 8, 2, 2, C.white);
      }
    }

    px(ctx, 0, 105, W, 55, th.sea1);
    px(ctx, 0, 105, W, 12, th.sea0);
    px(ctx, 0, 145, W, 10, th.sea2);
    px(ctx, 0, 152, W, 8, C.sea3);
    const wave = Math.floor(t * 4) % 12;
    for (let i = -12; i < W; i += 12) {
      px(ctx, i + wave, 118, 7, 3, C.foam);
      px(ctx, i + (wave * 2) % 12, 132, 6, 2, th.sea0);
    }
    // sun / moon reflection on water
    const rx = th.moon ? W - 40 : W - 40;
    for (let k = 0; k < 8; k++) {
      const rw = 4 + (k % 3) * 3 + Math.sin(t * 3 + k) * 2;
      px(ctx, rx - rw / 2 + Math.sin(t * 2 + k) * 2, 110 + k * 6, rw, 2, th.moon ? C.goldL : "#ffe9a0");
    }
    if (Math.sin(t * 8) > 0.3) {
      px(ctx, rx + 8, 122, 2, 2, C.foam);
      px(ctx, rx - 10, 136, 2, 2, C.foam);
    }

    px(ctx, 0, 160, W, H - 160, th.sand);
    px(ctx, 0, 160, W, 8, th.sandTop);
    for (let i = 0; i < 140; i++) {
      const sx = (i * 53 + 17) % W;
      const sy = 175 + ((i * 79) % (H - 190));
      px(ctx, sx, sy, 2, 2, i % 4 === 0 ? C.sand2 : th.sandTop);
    }

    if (theme === "souk") {
      drawHouse(ctx, 10, 85);
      drawHouse(ctx, 55, 90);
      drawHouse(ctx, 280, 88);
      px(ctx, 130, 145, 30, 16, C.red);
      px(ctx, 134, 148, 22, 5, C.gold);
      px(ctx, 175, 142, 28, 18, C.greenD);
    } else if (theme === "port") {
      drawLighthouse(ctx, 210, 50, t);
      drawBoat(ctx, 50, 138, t);
      drawBoat(ctx, 220, 142, t + 1);
      px(ctx, 30, 155, 110, 8, C.woodD);
      for (let i = 0; i < 8; i++) px(ctx, 40 + i * 14, 163, 4, 12, C.woodD);
    } else if (theme === "lagoon") {
      drawPalm(ctx, 40, 115, t, 0);
      drawPalm(ctx, 90, 120, t, 1);
      drawPalm(ctx, 290, 118, t, 2);
      px(ctx, 150, 200, 60, 14, th.sea0);
      px(ctx, 230, 250, 45, 12, th.sea1);
    } else if (theme === "resort") {
      drawHouse(ctx, 12, 82);
      drawHouse(ctx, 70, 86);
      drawHouse(ctx, 260, 84);
      px(ctx, 150, 190, 28, 4, C.red);
      px(ctx, 162, 194, 3, 20, C.wood);
      px(ctx, 200, 220, 26, 4, C.blueL);
      px(ctx, 211, 224, 3, 18, C.wood);
    } else if (theme === "festival") {
      drawHouse(ctx, 30, 88);
      drawLighthouse(ctx, 210, 50, t);
      for (let i = 0; i < 7; i++) {
        px(ctx, 50 + i * 40, 175, 22, 5, i % 2 ? C.gold : C.red);
        px(ctx, 58 + i * 40, 180, 3, 14, C.wood);
      }
    } else {
      drawHouse(ctx, 12, 88);
      drawHouse(ctx, 70, 92);
      drawHouse(ctx, 280, 90);
      drawLighthouse(ctx, 210, 50, t);
      drawBoat(ctx, 150, 138, t);
    }

    drawPalm(ctx, 45, 115, t, 0);
    drawPalm(ctx, 130, 110, t, 1.4);
    drawPalm(ctx, 310, 118, t, 2.8);
    drawSign(ctx, 8, 185);
    drawSeagull(ctx, 60, 55, t, 0);
    drawSeagull(ctx, 220, 40, t, 2.1);
  }

  function drawTitleScene(ctx, t) {
    const W = 280;
    const H = 150;
    px(ctx, 0, 0, W, 50, C.sky1);
    px(ctx, 0, 50, W, 35, C.sea1);
    const wave = Math.floor(t * 4) % 8;
    for (let i = 0; i < W; i += 8) px(ctx, i + wave, 58, 5, 2, C.foam);
    px(ctx, 0, 85, W, H, C.sand1);
    drawHouse(ctx, 10, 35);
    drawLighthouse(ctx, 190, 8, t);
    drawPalm(ctx, 90, 50, t, 0);
    drawPalm(ctx, 230, 55, t, 2);
    drawBoat(ctx, 130, 65, t);
    drawPlayer(ctx, { x: 115, y: 95, facing: 1, attacking: Math.sin(t * 2.5) > 0.8, vx: 30, vy: 0 }, false, t);
    drawBin(ctx, 155, 108, t);
    drawTrash(ctx, { x: 70, y: 118, type: "can" }, t);
    drawTrash(ctx, { x: 210, y: 112, type: "bottle" }, t);
    drawTrash(ctx, { x: 50, y: 125, type: "bag" }, t);
  }

  function drawTitleBackground(ctx, W, H, t) {
    drawWorldBg(ctx, W, H, t, "beach");
  }

  function drawAvatar(ctx, goldHat, t) {
    ctx.clearRect(0, 0, 40, 40);
    px(ctx, 0, 0, 40, 40, C.sky1);
    ctx.save();
    ctx.translate(-4, -4);
    ctx.scale(0.85, 0.85);
    drawPlayer(ctx, { x: 6, y: 4, facing: 1, attacking: false, vx: 0, vy: 0 }, goldHat, t);
    ctx.restore();
  }

  function drawMinimap(ctx, W, H, trash, player, t, cam) {
    const mw = 52;
    const mh = 52;
    const mx = (cam && cam.x != null ? cam.x : 0) + (cam && cam.vw ? cam.vw : W) - mw - 6;
    const my = (cam && cam.y != null ? cam.y : 0) + 6;
    ctx.fillStyle = "rgba(8,40,72,0.85)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = Math.sin(t * 4) > 0 ? C.gold : C.blueL;
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);
    trash.forEach((tr) => {
      px(ctx, mx + 3 + (tr.x / W) * (mw - 6), my + 3 + (tr.y / H) * (mh - 6), 2, 2, C.red);
    });
    px(ctx, mx + 3 + (player.x / W) * (mw - 6), my + 3 + (player.y / H) * (mh - 6), 4, 4, C.green);
  }

  function drawIslandMap(ctx, W, H, t, unlocked, starsMap, selectedId) {
    px(ctx, 0, 0, W, H, "#1a6bb5");
    for (let i = 0; i < 40; i++) px(ctx, (i * 37) % W, 10 + (i * 19) % H, 3, 2, "#3aa0d8");
    px(ctx, 28, 28, 190, 170, "#e8d4a8");
    px(ctx, 48, 18, 150, 35, "#e8d4a8");
    px(ctx, 38, 180, 160, 35, "#e8d4a8");
    px(ctx, 70, 80, 45, 24, "#3ddc5a");
    px(ctx, 130, 120, 40, 20, "#2db84a");

    Campaign.list().forEach((lv) => {
      const open = lv.id <= unlocked;
      const st = (starsMap && starsMap[String(lv.id)]) || 0;
      const sel = lv.id === selectedId;
      const pulse = sel && Math.sin(t * 6) > 0 ? 3 : 0;
      px(ctx, lv.mapX - 5 - pulse, lv.mapY - 5 - pulse, 16 + pulse * 2, 16 + pulse * 2, sel ? C.gold : "#000");
      px(ctx, lv.mapX - 3, lv.mapY - 3, 12, 12, open ? C.green : "#555");
      if (open) {
        ctx.fillStyle = C.white;
        ctx.font = "8px monospace";
        ctx.fillText(String(lv.id), lv.mapX, lv.mapY + 5);
        if (st > 0) {
          ctx.fillStyle = C.gold;
          ctx.fillText("*".repeat(st), lv.mapX - 4, lv.mapY + 18);
        }
      }
    });
    ctx.fillStyle = C.white;
    ctx.font = "9px monospace";
    ctx.fillText("CARTE DE DJERBA", 55, 18);
  }

  return {
    C, px, drawPalm, drawHouse, drawLighthouse, drawBoat, drawSign,
    drawBin, drawTrash, drawPlayer, drawWorldBg, drawTitleScene,
    drawTitleBackground, drawAvatar, drawMinimap, drawIslandMap,
  };
})();
