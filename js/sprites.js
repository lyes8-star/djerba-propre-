/* Pixel-art drawing — detailed animated sprites */
const Sprites = (() => {
  const P = {
    skin: "#f0c8a0",
    skinD: "#d4a574",
    hair: "#3a2a18",
    green: "#2db84a",
    greenD: "#1a8a32",
    greenL: "#7dff8a",
    white: "#f8fbff",
    blue: "#1a6bb5",
    blueL: "#5eb3f0",
    blueD: "#0d3a66",
    sand: "#e8d4a8",
    sandD: "#c9a86c",
    sandL: "#f5e6c4",
    sea: "#1a7ab8",
    seaL: "#3aa0d8",
    seaD: "#0f5a8a",
    foam: "#d8f0ff",
    wood: "#8b5a2b",
    woodD: "#5c3a1a",
    woodL: "#b87840",
    trashC: "#c0c0c0",
    bottle: "#4ecdc4",
    bag: "#4a4a4a",
    gold: "#f5c842",
    goldL: "#ffe08a",
    navy: "#0d3a66",
    red: "#e85a4a",
    redD: "#b03830",
    cloud: "#eef6ff",
    palm: "#2a9a45",
    palmD: "#1a7030",
  };

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawCloud(ctx, x, y, t, seed) {
    const ox = Math.sin(t * 0.15 + seed) * 2;
    px(ctx, x + ox, y + 2, 14, 4, P.cloud);
    px(ctx, x + 3 + ox, y, 10, 4, P.cloud);
    px(ctx, x + 6 + ox, y + 3, 12, 3, P.cloud);
  }

  function drawPalm(ctx, x, y, t, seed = 0) {
    const sway = Math.sin(t * 2.2 + seed) * 1.5;
    px(ctx, x + 4, y + 10, 3, 18, P.wood);
    px(ctx, x + 5, y + 12, 1, 14, P.woodL);
    // fronds
    px(ctx, x + 2 + sway, y + 4, 10, 3, P.palmD);
    px(ctx, x - 2 + sway, y + 7, 8, 2, P.palm);
    px(ctx, x + 8 + sway, y + 7, 8, 2, P.palm);
    px(ctx, x + 1 + sway, y + 1, 6, 4, P.palm);
    px(ctx, x + 7 + sway, y + 2, 5, 3, P.palmD);
    px(ctx, x + 4 + sway, y, 4, 3, P.greenL);
    // coconuts
    px(ctx, x + 4, y + 8, 2, 2, P.woodD);
    px(ctx, x + 7, y + 9, 2, 2, P.woodD);
  }

  function drawHouse(ctx, x, y) {
    px(ctx, x, y + 8, 18, 12, P.white);
    px(ctx, x + 1, y + 9, 16, 1, "#e8eef5");
    // blue dome
    px(ctx, x + 5, y + 1, 8, 8, P.blueL);
    px(ctx, x + 6, y, 6, 3, P.blue);
    px(ctx, x + 7, y + 2, 4, 4, P.blueD);
    // door & window
    px(ctx, x + 7, y + 12, 4, 8, P.wood);
    px(ctx, x + 8, y + 14, 2, 2, P.gold);
    px(ctx, x + 13, y + 11, 4, 4, P.blueL);
    px(ctx, x + 14, y + 12, 2, 2, P.blueD);
    // base shadow
    px(ctx, x, y + 19, 18, 1, "rgba(0,0,0,0.12)");
  }

  function drawLighthouse(ctx, x, y, t) {
    px(ctx, x + 3, y + 6, 8, 24, P.white);
    px(ctx, x + 3, y + 10, 8, 4, P.red);
    px(ctx, x + 3, y + 18, 8, 4, P.red);
    px(ctx, x + 4, y + 7, 2, 22, "#f0f4f8");
    px(ctx, x + 2, y, 10, 6, P.navy);
    px(ctx, x + 4, y + 1, 6, 3, P.blueD);
    const blink = Math.sin(t * 4) > 0.2;
    px(ctx, x + 5, y + 2, 4, 3, blink ? P.goldL : P.gold);
    if (blink) {
      px(ctx, x + 12, y + 3, 10, 1, "rgba(245,200,66,0.35)");
      px(ctx, x - 8, y + 3, 10, 1, "rgba(245,200,66,0.25)");
    }
  }

  function drawBoat(ctx, x, y, t) {
    const bob = Math.sin(t * 1.8) * 1.2;
    const yy = y + bob;
    px(ctx, x, yy + 5, 16, 4, P.woodD);
    px(ctx, x + 2, yy + 3, 12, 3, P.wood);
    px(ctx, x + 1, yy + 4, 14, 1, P.woodL);
    px(ctx, x + 7, yy - 4, 2, 9, P.white);
    px(ctx, x + 9, yy - 2, 5, 4, P.red);
    px(ctx, x + 4, yy + 8, 3, 1, P.foam);
  }

  function drawSign(ctx, x, y) {
    px(ctx, x + 8, y + 6, 3, 22, P.woodD);
    px(ctx, x + 9, y + 8, 1, 18, P.woodL);
    px(ctx, x, y + 6, 18, 5, P.wood);
    px(ctx, x + 1, y + 12, 16, 4, P.wood);
    px(ctx, x + 1, y + 17, 14, 4, P.wood);
    ctx.fillStyle = P.white;
    ctx.font = "5px monospace";
    ctx.fillText("Plage", x + 3, y + 10);
    ctx.fillText("H.Souk", x + 2, y + 15);
    ctx.fillText("Midoun", x + 2, y + 20);
  }

  function drawSeagull(ctx, x, y, t, seed) {
    const flap = Math.sin(t * 6 + seed) > 0 ? 1 : 0;
    const ox = x + Math.sin(t * 0.4 + seed) * 20;
    const oy = y + Math.sin(t * 0.7 + seed) * 3;
    px(ctx, ox, oy, 3, 1, P.white);
    px(ctx, ox - 3, oy - flap, 3, 1, P.white);
    px(ctx, ox + 3, oy - flap, 3, 1, P.white);
  }

  function drawBin(ctx, x, y, t) {
    const wob = Math.sin(t * 8) * 0.3;
    px(ctx, x + wob, y + 3, 10, 10, P.green);
    px(ctx, x + 1 + wob, y + 4, 8, 2, P.greenL);
    px(ctx, x + 1 + wob, y, 8, 3, P.greenD);
    px(ctx, x + 3 + wob, y + 5, 4, 4, P.white);
    px(ctx, x + 4 + wob, y + 6, 2, 2, P.greenD);
    px(ctx, x - 1 + wob, y + 12, 3, 3, P.navy);
    px(ctx, x + 8 + wob, y + 12, 3, 3, P.navy);
    px(ctx, x + wob, y + 13, 10, 1, "rgba(0,0,0,0.15)");
  }

  function drawTrash(ctx, item, t) {
    const spark = Math.sin(t * 5 + item.x) > 0.7;
    const { x, y, type } = item;
    px(ctx, x + 1, y + 6, 5, 1, "rgba(0,0,0,0.15)");
    if (type === "can") {
      px(ctx, x, y, 5, 6, P.trashC);
      px(ctx, x + 1, y + 1, 3, 2, P.red);
      px(ctx, x + 1, y + 4, 3, 1, "#888");
      if (spark) px(ctx, x + 4, y, 1, 1, P.white);
    } else if (type === "bottle") {
      px(ctx, x + 1, y + 1, 3, 7, P.bottle);
      px(ctx, x + 1, y, 3, 2, P.white);
      px(ctx, x + 2, y - 1, 1, 2, P.foam);
      if (spark) px(ctx, x + 3, y + 3, 1, 1, P.white);
    } else if (type === "bag") {
      px(ctx, x, y + 1, 7, 6, P.bag);
      px(ctx, x + 1, y, 5, 2, "#666");
      px(ctx, x + 2, y + 3, 3, 2, "#333");
      if (spark) px(ctx, x + 5, y + 1, 1, 1, P.white);
    } else {
      px(ctx, x, y, 5, 5, "#8b4513");
    }
  }

  function drawPlayer(ctx, p, goldHat, t) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    const moving = Math.hypot(p.vx || 0, p.vy || 0) > 4;
    const walk = moving ? Math.floor(t * 10) % 2 : 0;
    const bob = moving ? 0 : Math.sin(t * 3) * 0.5;
    const yy = y + bob;

    px(ctx, x + 2, yy + 16, 12, 2, "rgba(0,0,0,0.18)");

    // legs
    if (walk === 0) {
      px(ctx, x + 4, yy + 12, 3, 5, "#3a5a8a");
      px(ctx, x + 9, yy + 13, 3, 4, "#2a4a7a");
    } else {
      px(ctx, x + 4, yy + 13, 3, 4, "#2a4a7a");
      px(ctx, x + 9, yy + 12, 3, 5, "#3a5a8a");
    }
    px(ctx, x + 4, yy + 16, 3, 1, P.navy);
    px(ctx, x + 9, yy + 16, 3, 1, P.navy);

    // body
    px(ctx, x + 3, yy + 6, 11, 8, P.green);
    px(ctx, x + 4, yy + 7, 9, 1, P.greenL);
    px(ctx, x + 6, yy + 8, 5, 4, P.white);
    px(ctx, x + 7, yy + 9, 3, 2, P.greenD);
    // arrows recycle
    px(ctx, x + 7, yy + 9, 1, 1, P.green);
    px(ctx, x + 9, yy + 10, 1, 1, P.green);

    // head
    px(ctx, x + 5, yy + 2, 7, 5, P.skin);
    px(ctx, x + 6, yy + 3, 2, 1, P.skinD);
    px(ctx, x + 10, yy + 3, 1, 1, P.navy); // eye

    // hat
    const hc = goldHat ? P.gold : P.greenD;
    const hc2 = goldHat ? P.goldL : P.green;
    px(ctx, x + 4, yy, 9, 3, hc);
    px(ctx, x + 6, yy - 2, 5, 2, hc2);
    px(ctx, x + 3, yy + 2, 11, 1, hc);

    // gloves
    px(ctx, x + 1, yy + 9, 3, 3, P.white);
    px(ctx, x + 13, yy + 9, 3, 3, P.white);

    // scorpion pince
    const facing = p.facing || 1;
    const ax = facing > 0 ? x + 14 : x - 8;
    const ay = yy + 7;
    if (p.attacking) {
      const reach = facing > 0 ? 10 : -10;
      px(ctx, ax, ay, facing > 0 ? 10 : 10, 2, P.navy);
      px(ctx, ax + (facing > 0 ? 8 : -2), ay - 3, 5, 2, P.gold);
      px(ctx, ax + (facing > 0 ? 8 : -2), ay + 3, 5, 2, P.gold);
      px(ctx, ax + reach, ay, 4, 2, P.red);
      px(ctx, ax + reach + (facing > 0 ? 2 : -2), ay - 1, 2, 1, P.goldL);
    } else {
      px(ctx, ax, ay, 6, 2, P.navy);
      px(ctx, ax + (facing > 0 ? 4 : -1), ay - 2, 4, 2, P.gold);
      px(ctx, ax + (facing > 0 ? 4 : -1), ay + 2, 4, 2, P.gold);
      px(ctx, ax + (facing > 0 ? 6 : -3), ay, 2, 2, P.red);
    }
  }

  function drawWorldBg(ctx, W, H, t) {
    // sky gradient bands
    px(ctx, 0, 0, W, 20, "#6ec4f0");
    px(ctx, 0, 20, W, 20, "#4db3e8");
    px(ctx, 0, 40, W, 16, "#3aa0d8");

    drawCloud(ctx, 20, 8, t, 0);
    drawCloud(ctx, 90, 4, t, 2);
    drawCloud(ctx, 150, 12, t, 4);

    // sea
    px(ctx, 0, 52, W, 36, P.sea);
    px(ctx, 0, 52, W, 6, P.seaL);
    const wave = Math.floor(t * 3) % 8;
    for (let i = 0; i < W; i += 8) {
      px(ctx, i + wave, 58, 4, 2, P.foam);
      px(ctx, i + (wave + 4) % 8, 66, 3, 1, P.seaL);
    }
    px(ctx, 0, 78, W, 4, P.seaD);

    // sand
    px(ctx, 0, 82, W, H - 82, P.sand);
    px(ctx, 0, 82, W, 3, P.sandL);
    for (let i = 0; i < 55; i++) {
      const sx = (i * 41 + 13) % W;
      const sy = 90 + ((i * 59) % (H - 100));
      px(ctx, sx, sy, 1, 1, i % 3 === 0 ? P.sandD : P.sandL);
    }

    // shore props
    drawHouse(ctx, 8, 38);
    drawHouse(ctx, 48, 42);
    drawHouse(ctx, 155, 40);
    drawLighthouse(ctx, 115, 22, t);
    drawPalm(ctx, 28, 55, t, 0);
    drawPalm(ctx, 78, 52, t, 1.5);
    drawPalm(ctx, 168, 56, t, 3);
    drawBoat(ctx, 85, 68, t);
    drawSign(ctx, 4, 95);
    drawSeagull(ctx, 40, 30, t, 0);
    drawSeagull(ctx, 130, 22, t, 2);

    // sun
    px(ctx, W - 28, 8, 10, 10, P.goldL);
    px(ctx, W - 26, 10, 6, 6, P.gold);
  }

  function drawTitleScene(ctx, t) {
    const W = 192;
    const H = 108;
    drawWorldBg(ctx, W, H + 40, t);
    // crop feel — draw character center
    drawPlayer(ctx, { x: 88, y: 78, facing: 1, attacking: Math.sin(t * 2) > 0.85, vx: 20, vy: 0 }, false, t);
    drawBin(ctx, 112, 86, t);
    drawTrash(ctx, { x: 60, y: 92, type: "can" }, t);
    drawTrash(ctx, { x: 140, y: 88, type: "bottle" }, t);
    drawTrash(ctx, { x: 50, y: 98, type: "bag" }, t);
    // sparkles
    if (Math.sin(t * 5) > 0.5) px(ctx, 100, 70, 2, 2, P.goldL);
  }

  function drawMinimap(ctx, W, H, trash, player) {
    const mx = W - 34;
    const my = H - 34;
    ctx.fillStyle = "rgba(13,58,102,0.75)";
    ctx.beginPath();
    ctx.arc(mx + 14, my + 14, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5eb3f0";
    ctx.lineWidth = 2;
    ctx.stroke();
    trash.forEach((tr) => {
      px(ctx, mx + (tr.x / W) * 24 + 2, my + (tr.y / H) * 24 + 2, 2, 2, "#e85a4a");
    });
    px(ctx, mx + (player.x / W) * 24 + 2, my + (player.y / H) * 24 + 2, 3, 3, "#2db84a");
  }

  return {
    P,
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
    drawMinimap,
  };
})();
