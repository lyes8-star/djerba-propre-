/* Pixel-art drawing helpers & sprites */
const Sprites = (() => {
  const P = {
    skin: "#f0c8a0",
    hair: "#3a2a18",
    green: "#2db84a",
    greenD: "#1a8a32",
    white: "#f8fbff",
    blue: "#1a6bb5",
    blueL: "#5eb3f0",
    sand: "#e8d4a8",
    sandD: "#c9a86c",
    sea: "#1a7ab8",
    seaL: "#3aa0d8",
    wood: "#8b5a2b",
    woodD: "#5c3a1a",
    trashC: "#c0c0c0",
    bottle: "#4ecdc4",
    bag: "#555",
    gold: "#f5c842",
    navy: "#0d3a66",
    red: "#e85a4a",
  };

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawPalm(ctx, x, y) {
    px(ctx, x + 3, y + 8, 2, 14, P.wood);
    px(ctx, x, y + 4, 8, 3, P.greenD);
    px(ctx, x - 2, y + 6, 4, 2, P.green);
    px(ctx, x + 6, y + 6, 4, 2, P.green);
    px(ctx, x + 2, y, 4, 4, P.green);
  }

  function drawHouse(ctx, x, y) {
    px(ctx, x, y + 6, 14, 10, P.white);
    px(ctx, x + 4, y, 6, 6, P.blueL);
    px(ctx, x + 5, y + 1, 4, 4, P.blue);
    px(ctx, x + 5, y + 10, 3, 6, P.wood);
    px(ctx, x + 10, y + 9, 3, 3, P.blueL);
  }

  function drawLighthouse(ctx, x, y) {
    px(ctx, x + 2, y + 4, 6, 18, P.white);
    px(ctx, x + 2, y + 8, 6, 3, P.red);
    px(ctx, x + 2, y + 14, 6, 3, P.red);
    px(ctx, x + 1, y, 8, 4, P.navy);
    px(ctx, x + 4, y + 1, 2, 2, P.gold);
  }

  function drawBoat(ctx, x, y) {
    px(ctx, x, y + 4, 12, 3, P.woodD);
    px(ctx, x + 2, y + 3, 8, 2, P.wood);
    px(ctx, x + 5, y - 2, 2, 6, P.white);
  }

  function drawSign(ctx, x, y) {
    px(ctx, x + 6, y + 4, 2, 16, P.woodD);
    px(ctx, x, y + 4, 14, 4, P.wood);
    px(ctx, x + 1, y + 9, 12, 3, P.wood);
    px(ctx, x + 1, y + 13, 10, 3, P.wood);
    ctx.fillStyle = P.white;
    ctx.font = "4px monospace";
    ctx.fillText("Plage", x + 2, y + 7);
    ctx.fillText("H.Souk", x + 1, y + 11);
    ctx.fillText("Midoun", x + 1, y + 15);
  }

  function drawBin(ctx, x, y) {
    px(ctx, x, y + 2, 8, 8, P.green);
    px(ctx, x + 1, y, 6, 2, P.greenD);
    px(ctx, x + 2, y + 4, 4, 3, P.white);
    px(ctx, x - 1, y + 9, 2, 2, P.navy);
    px(ctx, x + 7, y + 9, 2, 2, P.navy);
  }

  function drawTrash(ctx, item) {
    const { x, y, type } = item;
    if (type === "can") {
      px(ctx, x, y, 4, 5, P.trashC);
      px(ctx, x + 1, y + 1, 2, 2, P.red);
    } else if (type === "bottle") {
      px(ctx, x + 1, y, 2, 6, P.bottle);
      px(ctx, x + 1, y - 1, 2, 2, P.white);
    } else if (type === "bag") {
      px(ctx, x, y, 6, 5, P.bag);
      px(ctx, x + 1, y - 1, 4, 2, "#777");
    } else {
      px(ctx, x, y, 4, 4, "#8b4513");
    }
  }

  function drawPlayer(ctx, p, goldHat) {
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    // shadow
    px(ctx, x + 1, y + 14, 10, 2, "rgba(0,0,0,0.2)");
    // legs
    px(ctx, x + 3, y + 11, 3, 4, "#3a5a8a");
    px(ctx, x + 8, y + 11, 3, 4, "#3a5a8a");
    // body
    px(ctx, x + 2, y + 5, 10, 7, P.green);
    px(ctx, x + 5, y + 6, 4, 4, P.white);
    px(ctx, x + 6, y + 7, 2, 2, P.greenD);
    // head
    px(ctx, x + 4, y + 1, 6, 5, P.skin);
    // hat
    px(ctx, x + 3, y - 1, 8, 3, goldHat ? P.gold : P.greenD);
    px(ctx, x + 5, y - 2, 4, 2, goldHat ? "#ffe08a" : P.green);
    // gloves
    px(ctx, x + 1, y + 8, 2, 2, P.white);
    px(ctx, x + 11, y + 8, 2, 2, P.white);

    // scorpion pince (claw tool)
    const facing = p.facing || 1;
    const ax = facing > 0 ? x + 12 : x - 6;
    const ay = y + 6;
    if (p.attacking) {
      // extended claw
      px(ctx, ax, ay, 8, 2, P.navy);
      px(ctx, ax + (facing > 0 ? 6 : -2), ay - 2, 4, 2, P.gold);
      px(ctx, ax + (facing > 0 ? 6 : -2), ay + 2, 4, 2, P.gold);
      px(ctx, ax + (facing > 0 ? 8 : -4), ay, 3, 2, P.red);
    } else {
      px(ctx, ax, ay, 5, 2, P.navy);
      px(ctx, ax + (facing > 0 ? 3 : -1), ay - 1, 3, 1, P.gold);
      px(ctx, ax + (facing > 0 ? 3 : -1), ay + 2, 3, 1, P.gold);
    }
  }

  function drawWorldBg(ctx, W, H, cameraY) {
    // sky
    px(ctx, 0, 0, W, 40, "#4db3e8");
    // sea
    px(ctx, 0, 36, W, 28, P.sea);
    px(ctx, 0, 40, W, 4, P.seaL);
    px(ctx, 0, 50, W, 3, P.seaL);
    // sand
    px(ctx, 0, 62, W, H, P.sand);
    for (let i = 0; i < 40; i++) {
      const sx = (i * 37 + 11) % W;
      const sy = 70 + ((i * 53) % (H - 80));
      px(ctx, sx, sy, 1, 1, P.sandD);
    }
    // distant shore props (parallax-ish fixed)
    drawHouse(ctx, 10, 28);
    drawHouse(ctx, 50, 30);
    drawLighthouse(ctx, 120, 18);
    drawPalm(ctx, 30, 42);
    drawPalm(ctx, 95, 40);
    drawPalm(ctx, 140, 44);
    drawBoat(ctx, 70, 52);
    drawSign(ctx, 4, 68);
  }

  function drawTitleScene(ctx) {
    const W = 160;
    const H = 90;
    px(ctx, 0, 0, W, 50, "#4db3e8");
    px(ctx, 0, 48, W, 20, P.sea);
    px(ctx, 0, 64, W, 26, P.sand);
    drawHouse(ctx, 20, 30);
    drawLighthouse(ctx, 100, 18);
    drawPalm(ctx, 55, 40);
    drawPalm(ctx, 130, 42);
    drawBoat(ctx, 70, 54);
    drawPlayer(ctx, { x: 72, y: 68, facing: 1, attacking: false }, false);
    drawBin(ctx, 90, 74);
    drawTrash(ctx, { x: 50, y: 78, type: "can" });
    drawTrash(ctx, { x: 110, y: 76, type: "bottle" });
    drawTrash(ctx, { x: 40, y: 82, type: "bag" });
  }

  function drawMinimap(ctx, W, H, trash, player) {
    const mx = W - 28;
    const my = H - 28;
    ctx.fillStyle = "rgba(13,58,102,0.7)";
    ctx.beginPath();
    ctx.arc(mx + 12, my + 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5eb3f0";
    ctx.lineWidth = 1;
    ctx.stroke();
    trash.forEach((t) => {
      px(ctx, mx + (t.x / W) * 20 + 2, my + (t.y / H) * 20 + 2, 1, 1, "#e85a4a");
    });
    px(ctx, mx + (player.x / W) * 20 + 2, my + (player.y / H) * 20 + 2, 2, 2, "#2db84a");
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
