/* Offscreen pixel atlas — bake once, blit every frame */
const Atlas = (() => {
  const C = {
    sky0: "#8ad8ff", sky1: "#52b4ec", sky2: "#2e90d0",
    sea0: "#5ecaf4", sea1: "#1d8cc8", sea2: "#0e6a9c", sea3: "#094f76",
    foam: "#eef8ff",
    sand0: "#f6e6c0", sand1: "#e4cb90", sand2: "#c9a66a", sand3: "#a07e48", sand4: "#7e5e32",
    white: "#f7fbff", wall: "#e8eef6", wallD: "#c9d2de",
    blue: "#2b7fd4", blueD: "#155a9e", blueL: "#7ad0ff",
    green: "#3ddc5a", greenD: "#1c8f32", greenL: "#8dff9c", greenX: "#146624",
    wood: "#b06e34", woodD: "#6a3c16", woodL: "#d09050", woodX: "#4a280e",
    skin: "#f2cba6", skinD: "#d4a074", skinL: "#ffe0c0",
    navy: "#0c355e", gold: "#ffd24a", goldL: "#fff0a8", goldD: "#c99214",
    red: "#ff5550", redD: "#b03030",
    metal: "#d4dae2", metalD: "#8a949e", metalL: "#f4f7fa",
    bag: "#4c4c56", bagL: "#6a6a76", bottle: "#3ecfc4", bottleD: "#1a8a82",
    cloud: "#f4f9ff", ink: "#071828",
  };

  const tiles = {};
  const frames = {};
  let ready = false;

  function make(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return { c, ctx, w, h };
  }

  function px(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, w, h);
  }

  function p1(ctx, x, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, 1, 1);
  }

  function outlineRect(ctx, x, y, w, h, col) {
    px(ctx, x, y, w, 1, col);
    px(ctx, x, y + h - 1, w, 1, col);
    px(ctx, x, y, 1, h, col);
    px(ctx, x + w - 1, y, 1, h, col);
  }

  /* —— TILES 16x16 —— */
  function bakeSand(seed) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.sand1);
    for (let i = 0; i < 28; i++) {
      const x = (seed * 13 + i * 7) % 16;
      const y = (seed * 9 + i * 11) % 16;
      p1(ctx, x, y, i % 3 === 0 ? C.sand2 : C.sand0);
    }
    p1(ctx, (3 + seed) % 16, (5 + seed) % 16, C.sand3);
    p1(ctx, (10 + seed) % 16, (12 + seed) % 16, C.sand0);
    return c;
  }

  function bakeSea(row) {
    const { c, ctx } = make(16, 16);
    const cols = [C.sea0, C.sea1, C.sea2, C.sea3];
    px(ctx, 0, 0, 16, 16, cols[row % 4]);
    for (let x = 0; x < 16; x++) {
      if ((x + row) % 5 === 0) p1(ctx, x, 3, C.foam);
      if ((x + row * 2) % 7 === 0) p1(ctx, x, 9, cols[(row + 1) % 4]);
    }
    return c;
  }

  function bakeFoam() {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.sea1);
    px(ctx, 0, 6, 16, 3, C.foam);
    px(ctx, 2, 5, 4, 1, C.white);
    px(ctx, 9, 8, 5, 1, C.white);
    p1(ctx, 1, 7, C.sea0);
    p1(ctx, 14, 6, C.sea0);
    return c;
  }

  function bakeGrass() {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.sand1);
    for (let i = 0; i < 10; i++) {
      const x = (i * 3) % 16;
      px(ctx, x, 8 + (i % 4), 1, 5, i % 2 ? C.greenD : C.green);
      p1(ctx, x, 7 + (i % 4), C.greenL);
    }
    return c;
  }

  /* —— TRASH —— */
  function bakeCan() {
    const { c, ctx } = make(22, 28);
    px(ctx, 4, 24, 14, 3, "rgba(0,0,0,0.22)");
    px(ctx, 6, 4, 10, 20, C.metalD);
    px(ctx, 7, 5, 8, 18, C.metal);
    px(ctx, 8, 6, 2, 16, C.metalL);
    px(ctx, 7, 8, 8, 6, C.red);
    px(ctx, 8, 9, 6, 2, C.redD);
    px(ctx, 8, 10, 3, 1, C.goldL);
    outlineRect(ctx, 6, 4, 10, 20, C.ink);
    px(ctx, 7, 4, 8, 2, C.metalL);
    p1(ctx, 14, 6, C.white);
    p1(ctx, 13, 7, C.white);
    return c;
  }

  function bakeBottle() {
    const { c, ctx } = make(18, 32);
    px(ctx, 3, 29, 12, 2, "rgba(0,0,0,0.2)");
    px(ctx, 7, 1, 4, 6, C.white);
    px(ctx, 8, 0, 2, 2, C.metalL);
    px(ctx, 6, 7, 6, 20, C.bottleD);
    px(ctx, 7, 8, 4, 18, C.bottle);
    px(ctx, 8, 9, 1, 16, C.white);
    px(ctx, 7, 14, 4, 4, "rgba(255,255,255,0.25)");
    outlineRect(ctx, 6, 7, 6, 20, C.ink);
    p1(ctx, 10, 10, C.white);
    return c;
  }

  function bakeBag() {
    const { c, ctx } = make(24, 26);
    px(ctx, 3, 23, 18, 2, "rgba(0,0,0,0.2)");
    px(ctx, 4, 6, 16, 16, C.bag);
    px(ctx, 5, 7, 14, 4, C.bagL);
    px(ctx, 6, 12, 12, 8, "#2c2c34");
    px(ctx, 7, 4, 10, 4, C.bagL);
    px(ctx, 8, 2, 3, 4, C.bag);
    px(ctx, 13, 2, 3, 4, C.bag);
    outlineRect(ctx, 4, 6, 16, 16, C.ink);
    p1(ctx, 17, 8, C.white);
    p1(ctx, 6, 9, "#222");
    return c;
  }

  /* —— BIN —— */
  function bakeBin() {
    const { c, ctx } = make(28, 36);
    px(ctx, 2, 32, 24, 3, "rgba(0,0,0,0.25)");
    px(ctx, 4, 8, 20, 24, C.greenX);
    px(ctx, 5, 9, 18, 22, C.greenD);
    px(ctx, 6, 10, 16, 8, C.green);
    px(ctx, 7, 11, 14, 2, C.greenL);
    px(ctx, 8, 16, 12, 12, C.white);
    px(ctx, 10, 18, 8, 8, C.greenD);
    // recycle arrows
    px(ctx, 11, 19, 2, 2, C.greenL);
    px(ctx, 14, 19, 2, 2, C.greenL);
    px(ctx, 12, 22, 4, 1, C.greenL);
    px(ctx, 5, 6, 18, 4, C.greenX);
    px(ctx, 6, 5, 16, 2, C.greenD);
    px(ctx, 1, 28, 6, 6, C.navy);
    px(ctx, 21, 28, 6, 6, C.navy);
    p1(ctx, 3, 30, C.metal);
    p1(ctx, 23, 30, C.metal);
    outlineRect(ctx, 4, 8, 20, 24, C.ink);
    return c;
  }

  /* —— PALM two frames —— */
  function bakePalm(sway) {
    const { c, ctx } = make(48, 72);
    px(ctx, 20, 68, 12, 3, "rgba(0,0,0,0.2)");
    // trunk rings
    for (let i = 0; i < 14; i++) {
      const y = 24 + i * 3;
      px(ctx, 20, y, 8, 3, i % 2 ? C.woodD : C.wood);
      px(ctx, 21, y, 2, 3, C.woodL);
      p1(ctx, 26, y + 1, C.woodX);
    }
    outlineRect(ctx, 20, 24, 8, 44, C.ink);
    const s = sway;
    function frond(x, y, w, h, col) {
      px(ctx, x, y, w, h, col);
    }
    frond(8 + s, 10, 32, 5, C.greenX);
    frond(4 + s, 14, 18, 4, C.greenD);
    frond(26 + s, 14, 18, 4, C.greenD);
    frond(10 + s, 6, 16, 6, C.green);
    frond(22 + s, 7, 14, 5, C.greenD);
    frond(14 + s, 4, 10, 4, C.greenL);
    // leaflets 1px
    for (let i = 0; i < 8; i++) {
      p1(ctx, 6 + s + i * 2, 16, C.green);
      p1(ctx, 28 + s + i * 2, 16, C.greenL);
    }
    px(ctx, 20, 20, 4, 4, C.woodX);
    px(ctx, 25, 22, 4, 4, C.woodD);
    p1(ctx, 21, 21, C.woodL);
    return c;
  }

  /* —— HOUSE —— */
  function bakeHouse() {
    const { c, ctx } = make(56, 64);
    px(ctx, 4, 60, 48, 3, "rgba(0,0,0,0.18)");
    px(ctx, 4, 28, 48, 32, C.white);
    // wall tiles
    for (let y = 30; y < 58; y += 4) {
      px(ctx, 5, y, 46, 1, C.wall);
    }
    px(ctx, 4, 58, 48, 3, C.wallD);
    outlineRect(ctx, 4, 28, 48, 32, C.ink);
    // dome
    px(ctx, 16, 8, 24, 22, C.blueL);
    px(ctx, 18, 6, 20, 8, C.blue);
    px(ctx, 20, 10, 16, 14, C.blueD);
    px(ctx, 22, 12, 12, 4, C.blueL);
    p1(ctx, 27, 8, C.white);
    outlineRect(ctx, 16, 8, 24, 22, C.navy);
    // door
    px(ctx, 22, 40, 12, 20, C.woodD);
    px(ctx, 23, 41, 10, 18, C.wood);
    px(ctx, 24, 42, 2, 16, C.woodL);
    p1(ctx, 31, 50, C.gold);
    outlineRect(ctx, 22, 40, 12, 20, C.ink);
    // windows
    function win(x, y) {
      px(ctx, x, y, 10, 10, C.blueL);
      px(ctx, x + 1, y + 1, 8, 8, C.blueD);
      px(ctx, x + 4, y, 1, 10, C.white);
      px(ctx, x, y + 4, 10, 1, C.white);
      outlineRect(ctx, x, y, 10, 10, C.navy);
    }
    win(8, 36);
    win(38, 36);
    return c;
  }

  /* —— LIGHTHOUSE —— */
  function bakeLighthouse(on) {
    const { c, ctx } = make(36, 80);
    px(ctx, 8, 76, 20, 3, "rgba(0,0,0,0.2)");
    px(ctx, 10, 20, 16, 56, C.white);
    px(ctx, 11, 22, 4, 52, C.wall);
    px(ctx, 10, 28, 16, 8, C.red);
    px(ctx, 10, 44, 16, 8, C.red);
    px(ctx, 10, 60, 16, 8, C.redD);
    outlineRect(ctx, 10, 20, 16, 56, C.ink);
    px(ctx, 6, 4, 24, 16, C.navy);
    px(ctx, 8, 6, 20, 12, C.blueD);
    px(ctx, 12, 8, 12, 8, on ? C.goldL : C.gold);
    if (on) {
      px(ctx, 24, 10, 10, 2, "rgba(255,220,80,0.5)");
      px(ctx, 2, 10, 8, 2, "rgba(255,220,80,0.35)");
    }
    outlineRect(ctx, 6, 4, 24, 16, C.ink);
    return c;
  }

  /* —— BOAT —— */
  function bakeBoat() {
    const { c, ctx } = make(44, 28);
    px(ctx, 4, 24, 36, 3, "rgba(0,0,0,0.15)");
    px(ctx, 2, 14, 40, 8, C.woodX);
    px(ctx, 4, 12, 36, 8, C.woodD);
    px(ctx, 6, 13, 32, 4, C.wood);
    px(ctx, 8, 14, 20, 1, C.woodL);
    outlineRect(ctx, 2, 14, 40, 8, C.ink);
    px(ctx, 20, 2, 3, 14, C.white);
    px(ctx, 23, 4, 12, 8, C.red);
    px(ctx, 24, 5, 10, 3, C.redD);
    p1(ctx, 21, 2, C.gold);
    px(ctx, 10, 21, 6, 2, C.foam);
    return c;
  }

  /* —— CLOUD —— */
  function bakeCloud() {
    const { c, ctx } = make(48, 20);
    px(ctx, 8, 8, 32, 8, C.cloud);
    px(ctx, 14, 4, 22, 8, C.cloud);
    px(ctx, 20, 2, 14, 6, C.white);
    px(ctx, 6, 10, 10, 6, C.cloud);
    px(ctx, 34, 10, 10, 6, C.cloud);
    p1(ctx, 18, 5, C.white);
    return c;
  }

  /* —— SIGN —— */
  function bakeSign() {
    const { c, ctx } = make(40, 56);
    px(ctx, 18, 8, 5, 46, C.woodX);
    px(ctx, 19, 10, 3, 42, C.woodL);
    function plank(y, w, txt) {
      px(ctx, 4, y, w, 10, C.woodD);
      px(ctx, 5, y + 1, w - 2, 8, C.wood);
      outlineRect(ctx, 4, y, w, 10, C.ink);
      ctx.fillStyle = C.white;
      ctx.font = "8px monospace";
      ctx.fillText(txt, 7, y + 8);
    }
    plank(10, 32, "PLAGE");
    plank(22, 30, "H.SOUK");
    plank(34, 28, "MIDOUN");
    return c;
  }

  /* —— PLAYER 80x96 —— */
  function bakePlayer(facing, walk, attacking, goldHat) {
    const { c, ctx } = make(80, 96);
    const flip = facing < 0;
    const ox = flip ? 80 : 0;
    const dir = flip ? -1 : 1;
    function X(x) { return flip ? ox - x - 1 : x; }
    function bar(x, y, w, h, col) {
      if (!flip) px(ctx, x, y, w, h, col);
      else px(ctx, X(x + w - 1), y, w, h, col);
    }
    function dot(x, y, col) {
      p1(ctx, X(x), y, col);
    }

    const bob = walk === 1 || walk === 3 ? -1 : 0;
    const y0 = 8 + bob;

    // shadow
    bar(18, 90, 44, 4, "rgba(0,0,0,0.22)");

    // legs
    const lOff = walk === 1 ? -3 : walk === 3 ? 3 : 0;
    const rOff = -lOff;
    bar(26, y0 + 58 + lOff, 10, 24, "#3a5c92");
    bar(44, y0 + 58 + rOff, 10, 24, "#2c4c80");
    bar(26, y0 + 80 + lOff, 10, 4, C.navy);
    bar(44, y0 + 80 + rOff, 10, 4, C.navy);
    bar(27, y0 + 60 + lOff, 2, 20, "#5a7cb0");
    bar(45, y0 + 60 + rOff, 2, 20, "#4a6ca0");

    // torso
    bar(22, y0 + 32, 36, 28, C.greenX);
    bar(23, y0 + 33, 34, 26, C.greenD);
    bar(24, y0 + 34, 32, 10, C.green);
    bar(26, y0 + 35, 28, 3, C.greenL);
    // white recycle panel
    bar(30, y0 + 42, 20, 14, C.white);
    outlineRect(ctx, flip ? X(49) : 30, y0 + 42, 20, 14, C.ink);
    // recycle arrows (3 small chevrons)
    bar(34, y0 + 45, 4, 2, C.greenD);
    bar(42, y0 + 45, 4, 2, C.greenD);
    bar(36, y0 + 50, 8, 2, C.green);
    bar(38, y0 + 48, 4, 2, C.greenL);

    // head
    bar(30, y0 + 14, 20, 18, C.skinD);
    bar(31, y0 + 15, 18, 16, C.skin);
    bar(32, y0 + 16, 4, 4, C.skinL);
    const eye = facing > 0 ? 42 : 34;
    bar(eye, y0 + 20, 5, 5, C.navy);
    dot(eye + (facing > 0 ? 1 : 3), y0 + 21, C.white);
    bar(36, y0 + 26, 8, 2, C.skinD);

    // hat
    const hc = goldHat ? C.gold : C.greenD;
    const hc2 = goldHat ? C.goldL : C.green;
    bar(28, y0 + 10, 24, 6, hc);
    bar(32, y0 + 6, 16, 5, hc2);
    bar(26, y0 + 14, 28, 2, hc);
    outlineRect(ctx, flip ? X(51) : 28, y0 + 10, 24, 6, C.ink);
    if (goldHat) {
      dot(36, y0 + 8, C.goldL);
      dot(44, y0 + 8, C.goldD);
    }

    // gloves
    bar(16, y0 + 44, 8, 8, C.white);
    bar(56, y0 + 44, 8, 8, C.white);
    outlineRect(ctx, flip ? X(23) : 16, y0 + 44, 8, 8, C.ink);
    outlineRect(ctx, flip ? X(63) : 56, y0 + 44, 8, 8, C.ink);

    // scorpion pince
    const ax = facing > 0 ? 62 : 2;
    const ay = y0 + 40;
    if (attacking) {
      bar(ax, ay, 16, 5, C.navy);
      bar(ax + (facing > 0 ? 10 : -2), ay - 7, 12, 4, C.gold);
      bar(ax + (facing > 0 ? 10 : -2), ay + 8, 12, 4, C.gold);
      bar(ax + (facing > 0 ? 14 : -6), ay, 10, 5, C.red);
      dot(ax + (facing > 0 ? 22 : 2), ay + 1, C.goldL);
      dot(ax + (facing > 0 ? 12 : 8), ay - 6, C.goldL);
    } else {
      bar(ax, ay, 12, 5, C.navy);
      bar(ax + (facing > 0 ? 6 : 0), ay - 6, 10, 3, C.gold);
      bar(ax + (facing > 0 ? 6 : 0), ay + 8, 10, 3, C.gold);
      bar(ax + (facing > 0 ? 10 : -2), ay, 6, 5, C.red);
    }

    return c;
  }

  function bake() {
    if (ready) return;
    tiles.sand0 = bakeSand(1);
    tiles.sand1 = bakeSand(4);
    tiles.sand2 = bakeSand(9);
    tiles.sea0 = bakeSea(0);
    tiles.sea1 = bakeSea(1);
    tiles.sea2 = bakeSea(2);
    tiles.foam = bakeFoam();
    tiles.grass = bakeGrass();

    frames.can = bakeCan();
    frames.bottle = bakeBottle();
    frames.bag = bakeBag();
    frames.bin = bakeBin();
    frames.palm0 = bakePalm(0);
    frames.palm1 = bakePalm(3);
    frames.house = bakeHouse();
    frames.lhOn = bakeLighthouse(true);
    frames.lhOff = bakeLighthouse(false);
    frames.boat = bakeBoat();
    frames.cloud = bakeCloud();
    frames.sign = bakeSign();

    frames.player = {};
    for (const face of [1, -1]) {
      for (let w = 0; w < 4; w++) {
        for (const atk of [0, 1]) {
          for (const gold of [0, 1]) {
            const key = `${face}_${w}_${atk}_${gold}`;
            frames.player[key] = bakePlayer(face, w, !!atk, !!gold);
          }
        }
      }
    }
    ready = true;
  }

  function blit(ctx, img, x, y) {
    if (!img) return;
    ctx.drawImage(img, x | 0, y | 0);
  }

  function inView(cam, x, y, w, h) {
    if (!cam) return true;
    return x + w > cam.x && x < cam.x + cam.vw && y + h > cam.y && y < cam.y + cam.vh;
  }

  return { C, tiles, frames, bake, blit, inView, ready: () => ready };
})();
