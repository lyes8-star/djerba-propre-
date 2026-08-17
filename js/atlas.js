/* Offscreen NES/SNES-style pixel atlas — bake once, blit every frame */
const Atlas = (() => {
  const PW = 32;
  const PH = 32;

  const C = {
    ink: "#140c1c",
    sky0: "#5ec8fc", sky1: "#3aacfc", sky2: "#2090dc",
    sea0: "#80d8fc", sea1: "#38a4e8", sea2: "#1c7cc0", sea3: "#0c588c", sea4: "#084068",
    foam: "#f4fcfc", foamD: "#b8e4f4",
    sandA: "#ffe8b0", sandB: "#f0cc84", sandC: "#d4a85c", sandD: "#b88840", sandE: "#8c6428", sandF: "#5c4018",
    white: "#fcfcfc", wall: "#ece4d4", wallD: "#c8bca8", wallS: "#a09078",
    blue: "#2484d4", blueD: "#1860a4", blueL: "#70c8fc", blueX: "#0c3c78",
    green: "#3cbc3c", greenD: "#248024", greenL: "#80e040", greenX: "#145014", greenH: "#58d848",
    wood: "#c4742c", woodD: "#8c4c18", woodL: "#e09448", woodX: "#5c3010",
    skin: "#fcbc84", skinD: "#d48854", skinL: "#fcd4a4", skinM: "#e8a068",
    navy: "#1c3c7c", navyL: "#3c64b0", navyD: "#0c2460",
    gold: "#fcbc14", goldL: "#fce46c", goldD: "#c48408",
    red: "#d43030", redD: "#8c1818", redL: "#fc6868",
    metal: "#d0d4dc", metalD: "#808890", metalL: "#f0f4f8",
    bag: "#484850", bagL: "#686870", bagD: "#282830",
    bottle: "#28b8b0", bottleD: "#147874", bottleL: "#80ece4",
    cloud: "#fcfcfc", cloudD: "#d0e8fc", cloudK: "#80b8e0",
    hill: "#48a030", hillD: "#2c701c", hillL: "#70d048", hillK: "#184810",
    bush: "#249024",
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
    if (!col || w <= 0 || h <= 0) return;
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, w, h);
  }

  function p1(ctx, x, y, col) {
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, 1, 1);
  }

  function stamp(ctx, ox, oy, rows, pal) {
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) p1(ctx, ox + x, oy + y, col);
      }
    }
  }

  function outlineRect(ctx, x, y, w, h, col) {
    px(ctx, x, y, w, 1, col);
    px(ctx, x, y + h - 1, w, 1, col);
    px(ctx, x, y, 1, h, col);
    px(ctx, x + w - 1, y, 1, h, col);
  }

  /* —— 16x16 TILES (SMB ground language: cap + body + shadow) —— */
  function bakeSand(variant) {
    const { c, ctx } = make(16, 16);
    const pal = {
      a: C.sandA, b: C.sandB, c: C.sandC, d: C.sandD, e: C.sandE, f: C.sandF, k: C.ink, p: C.sandA, s: C.sandD,
    };
    const rows = [
      "aaaaabbaaaaaabba",
      "abbbbbbbbbbbbbbc",
      "bbbcbbpbbbscbbbd",
      "bbbbbbbbbbbbbbbd",
      "bcbbbcsbbbbpbbbd",
      "bbbbbbbbbbbbbbbd",
      "bbpbbbbbcbbbbcbd",
      "bbbbbbbbbbbbbbbd",
      "bbcbbbspbbbbbbbd",
      "bbbbbbbbbbpbbbbd",
      "bbcsbbbbbbcbbbbd",
      "bbbbbbbbbbbbbbbd",
      "bbpbbbcbbbbcsbbd",
      "bbbbbbbbbbbbbbbe",
      "cdddddddddddddde",
      "deeeeeeeeeeeeeef",
    ];
    // shuffle pebbles by variant
    stamp(ctx, 0, 0, rows, pal);
    if (variant === 1) {
      p1(ctx, 4, 5, C.sandA);
      p1(ctx, 11, 9, C.sandE);
      p1(ctx, 7, 12, C.sandA);
    } else if (variant === 2) {
      p1(ctx, 2, 8, C.sandE);
      p1(ctx, 13, 4, C.sandA);
      p1(ctx, 9, 11, C.sandD);
    } else if (variant === 3) {
      p1(ctx, 6, 6, C.sandA);
      p1(ctx, 12, 13, C.sandE);
      p1(ctx, 3, 10, C.woodL);
    }
    return c;
  }

  function bakeSandCap() {
    const { c, ctx } = make(16, 16);
    stamp(ctx, 0, 0, [
      "................",
      "................",
      "aaaaaaeeaaaaaaaa",
      "abbbbbbbbbbbbbbc",
      "bbbcbbpbbbscbbbd",
      "bbbbbbbbbbbbbbbd",
      "bcbbbcsbbbbpbbbd",
      "bbbbbbbbbbbbbbbd",
      "bbpbbbbbcbbbbcbd",
      "bbbbbbbbbbbbbbbd",
      "bbcbbbspbbbbbbbd",
      "bbbbbbbbbbpbbbbd",
      "bbcsbbbbbbcbbbbd",
      "bbbbbbbbbbbbbbbe",
      "cdddddddddddddde",
      "deeeeeeeeeeeeeef",
    ], {
      a: C.sandA, b: C.sandB, c: C.sandC, d: C.sandD, e: C.sandE, f: C.sandF, p: C.foam, s: C.sandD,
    });
    return c;
  }

  function bakeSea(depth, phase) {
    const { c, ctx } = make(16, 16);
    const base = [C.sea0, C.sea1, C.sea2, C.sea3][depth] || C.sea2;
    const dark = [C.sea1, C.sea2, C.sea3, C.sea4][depth] || C.sea3;
    const lite = [C.foam, C.sea0, C.sea1, C.sea2][depth] || C.sea1;
    px(ctx, 0, 0, 16, 16, base);
    for (let x = 0; x < 16; x++) {
      const y1 = (2 + Math.sin((x + phase * 3) * 0.7) * 1.4 + depth) | 0;
      const y2 = (8 + Math.sin((x + phase * 5 + 4) * 0.55) * 1.6) | 0;
      p1(ctx, x, ((y1 % 16) + 16) % 16, lite);
      p1(ctx, x, ((y2 % 16) + 16) % 16, dark);
      if ((x + phase * 2 + depth) % 6 === 0) p1(ctx, x, 5 + (phase % 3), C.foamD);
    }
    if (depth === 0) {
      px(ctx, 0, 0, 16, 1, C.foamD);
      for (let x = phase; x < 16; x += 4) p1(ctx, x, 1, C.foam);
    }
    return c;
  }

  function bakeFoam(phase) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.sea1);
    const y = 6 + (phase % 2);
    px(ctx, 0, y, 16, 3, C.foam);
    px(ctx, 0, y + 3, 16, 1, C.foamD);
    for (let x = 0; x < 16; x++) {
      if ((x + phase * 3) % 5 === 0) p1(ctx, x, y - 1, C.white);
      if ((x + phase) % 4 === 0) p1(ctx, x, y + 4, C.sea0);
    }
    px(ctx, 0, 12, 16, 4, C.sandB);
    px(ctx, 0, 12, 16, 1, C.sandA);
    return c;
  }

  function bakeGrass() {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.sandB);
    const blades = [2, 5, 7, 10, 12, 14];
    blades.forEach((x, i) => {
      const h = 5 + (i % 3);
      const y = 15 - h;
      px(ctx, x, y, 1, h, i % 2 ? C.greenD : C.green);
      p1(ctx, x, y, C.greenL);
      if (i % 2 === 0) p1(ctx, x + 1, y + 2, C.greenH);
    });
    p1(ctx, 4, 14, C.sandD);
    p1(ctx, 11, 13, C.sandA);
    return c;
  }

  function bakeBrick() {
    const { c, ctx } = make(16, 16);
    stamp(ctx, 0, 0, [
      "kkkkkkkkkkkkkkkk",
      "kRRRRrRRRRkBBBbk",
      "kRRRRrRRRRkBBBbk",
      "krrrrrRRRRkbbbbk",
      "kkkkkkkkkkkkkkkk",
      "kBBBbkRRRRrRRRRk",
      "kBBBbkRRRRrRRRRk",
      "kbbbbkrrrrrRRRRk",
      "kkkkkkkkkkkkkkkk",
      "kRRRRrRRRRkBBBbk",
      "kRRRRrRRRRkBBBbk",
      "krrrrrRRRRkbbbbk",
      "kkkkkkkkkkkkkkkk",
      "kBBBbkRRRRrRRRRk",
      "kBBBbkRRRRrRRRRk",
      "kkkkkkkkkkkkkkkk",
    ], {
      k: C.ink, R: C.woodL, r: C.wood, B: C.sandC, b: C.sandD,
    });
    return c;
  }

  function bakeStone() {
    const { c, ctx } = make(16, 16);
    stamp(ctx, 0, 0, [
      "aaaaaaabbbbbcccc",
      "abbbbbbbbbbbcccd",
      "bbbbbcbbbbbccckd",
      "bbkbbbbbbbcbbbdd",
      "bbbbbbbbbbbbbbbd",
      "bbcbbbckbbbbbbbd",
      "bbbbbbbbbbbbccbd",
      "bbbbbbbbbbbbbbbd",
      "bccbbbbbbbbbbkbd",
      "bbbbbbbbbcbbbbbd",
      "bbbbckbbbbbbbbdd",
      "bbcbbbbbbbbbbbdd",
      "bbbbbbbbbbccbbde",
      "cdddddddddddddde",
      "ddddddddddddddee",
      "deeeeeeeeeeeeeek",
    ], {
      a: C.wall, b: C.wallD, c: C.wallS, d: C.sandE, e: C.sandF, k: C.ink,
    });
    return c;
  }

  /* —— COLLECTIBLES (SMB coin energy, 16px) —— */
  function bakeCan() {
    const { c, ctx } = make(16, 20);
    stamp(ctx, 0, 2, [
      "..kkkkkkkkkk..",
      ".kmmMMMMMMmmk.",
      "kmmMMLMMMMmmmk",
      "kmrrrRRRRrrrmk",
      "kmrrrRRRRrrrmk",
      "kmmMMLMMMMmmmk",
      "kmmMMMMMMMMmmk",
      "kmmMMMMMMMMmmk",
      "kmmMMMMMMMMmmk",
      "kmmmmMMMMMmmmk",
      ".kmmmmmmmmmmk.",
      "..kkkkkkkkkk..",
      "...ssssssss...",
    ], {
      k: C.ink, m: C.metalD, M: C.metal, L: C.metalL, r: C.redD, R: C.red, s: "rgba(0,0,0,0.25)",
    });
    p1(ctx, 9, 5, C.goldL);
    return c;
  }

  function bakeBottle() {
    const { c, ctx } = make(12, 22);
    stamp(ctx, 1, 0, [
      "..kkk..",
      ".kmmmk.",
      ".kmmmk.",
      ".kkkkk.",
      ".kbbbk.",
      "kbbbbbk",
      "kbBBlbk",
      "kbBBbbk",
      "kbBBlbk",
      "kbBBbbk",
      "kbBBlbk",
      "kbbbbbk",
      ".kbbbk.",
      "..kkk..",
      "..sss..",
    ], {
      k: C.ink, m: C.metal, b: C.bottleD, B: C.bottle, l: C.bottleL, s: "rgba(0,0,0,0.25)",
    });
    return c;
  }

  function bakeBag() {
    const { c, ctx } = make(16, 18);
    stamp(ctx, 0, 0, [
      "...kk..kk.....",
      "...kBkkBk.....",
      "...kBBBBk.....",
      "..kkkkkkkk....",
      ".kBBBBBBBBk...",
      "kBBBbbbBBBBk..",
      "kBBbbbbbbBBk..",
      "kBbbbkkbbBBk..",
      "kBbbbbbbbBBk..",
      "kBBBbbbbBBBk..",
      ".kBBBBBBBBk...",
      "..kkkkkkkk....",
      "...ssssss.....",
    ], {
      k: C.ink, B: C.bagL, b: C.bag, s: "rgba(0,0,0,0.25)",
    });
    return c;
  }

  function bakeBin() {
    const { c, ctx } = make(20, 24);
    stamp(ctx, 0, 0, [
      "...kkkkkkkkkkkk...",
      "..kGGGGGGGGGGGGk..",
      ".kGGggggggggggGGk.",
      "kGGggggggggggggGGk",
      "kGgkwwwwwwwwkggGk",
      "kGgkwgwwgwwgkwgGk",
      "kGgkwwgwwgwwkwgGk",
      "kGgkwgwwgwwgkwgGk",
      "kGgkwwwwwwwwkggGk",
      "kGGggggggggggggGGk",
      "kGGggggggggggggGGk",
      "kGGGggggggggggGGGk",
      "kGGGGGGGGGGGGGGGGk",
      ".kGGGGGGGGGGGGGGk.",
      ".knk..........knk.",
      "kmmk..........kmmk",
      ".kk............kk.",
      "...ssssssssssss...",
    ], {
      k: C.ink, G: C.greenX, g: C.greenD, w: C.white, n: C.navy, m: C.navyL, s: "rgba(0,0,0,0.25)",
    });
    return c;
  }

  /* —— PALM (SMB3 tree language, 32x48, 2 frames) —— */
  function bakePalm(sway) {
    const { c, ctx } = make(32, 48);
    const s = sway;
    // shadow
    px(ctx, 10, 45, 12, 2, "rgba(0,0,0,0.28)");
    // trunk
    for (let i = 0; i < 22; i++) {
      const y = 22 + i;
      const w = 6 - (i > 16 ? 1 : 0);
      px(ctx, 13, y, w, 1, i % 2 ? C.woodD : C.wood);
      p1(ctx, 13, y, C.woodX);
      p1(ctx, 13 + w - 1, y, C.ink);
      if (i % 3 === 0) p1(ctx, 15, y, C.woodL);
    }
    px(ctx, 12, 22, 8, 22, null);
    outlineRect(ctx, 13, 22, 6, 23, C.ink);
    // crown
    function leaf(x, y, w, h, col) {
      px(ctx, x, y, w, h, col);
      p1(ctx, x, y, C.ink);
      p1(ctx, x + w - 1, y, C.ink);
    }
    leaf(4 + s, 10, 24, 4, C.greenX);
    leaf(2 + s, 13, 14, 4, C.greenD);
    leaf(16 + s, 13, 14, 4, C.greenD);
    leaf(8 + s, 7, 16, 5, C.green);
    leaf(6 + s, 5, 10, 4, C.greenH);
    leaf(16 + s, 6, 10, 3, C.greenL);
    // leaflets
    for (let i = 0; i < 7; i++) {
      p1(ctx, 3 + s + i * 2, 16, C.greenL);
      p1(ctx, 18 + s + i * 2, 16, C.greenH);
      p1(ctx, 4 + s + i * 3, 8, C.greenX);
    }
    px(ctx, 13, 18, 6, 5, C.woodD);
    p1(ctx, 14, 19, C.woodL);
    outlineRect(ctx, 4 + s, 5, 24, 14, C.ink);
    return c;
  }

  /* —— HOUSE (Djerba + SMB3 building) —— */
  function bakeHouse() {
    const { c, ctx } = make(48, 56);
    px(ctx, 4, 53, 40, 2, "rgba(0,0,0,0.25)");
    // walls
    px(ctx, 4, 24, 40, 28, C.ink);
    px(ctx, 5, 25, 38, 26, C.wall);
    for (let y = 27; y < 50; y += 3) px(ctx, 6, y, 36, 1, C.wallD);
    px(ctx, 5, 48, 38, 3, C.wallS);
    // dome
    px(ctx, 14, 6, 20, 20, C.ink);
    px(ctx, 15, 8, 18, 18, C.blue);
    px(ctx, 17, 6, 14, 6, C.blueL);
    px(ctx, 18, 10, 12, 12, C.blueD);
    px(ctx, 20, 12, 8, 4, C.blueL);
    p1(ctx, 23, 8, C.white);
    p1(ctx, 24, 7, C.white);
    // door
    px(ctx, 18, 36, 12, 16, C.ink);
    px(ctx, 19, 37, 10, 14, C.woodD);
    px(ctx, 20, 38, 3, 12, C.woodL);
    p1(ctx, 27, 45, C.gold);
    // windows
    function win(x, y) {
      px(ctx, x, y, 10, 10, C.ink);
      px(ctx, x + 1, y + 1, 8, 8, C.blueX);
      px(ctx, x + 1, y + 1, 8, 3, C.blueL);
      px(ctx, x + 5, y + 1, 1, 8, C.white);
      px(ctx, x + 1, y + 5, 8, 1, C.white);
    }
    win(7, 32);
    win(31, 32);
    return c;
  }

  function bakeLighthouse(on) {
    const { c, ctx } = make(24, 64);
    px(ctx, 4, 61, 16, 2, "rgba(0,0,0,0.25)");
    px(ctx, 7, 16, 10, 46, C.ink);
    px(ctx, 8, 17, 8, 44, C.white);
    px(ctx, 8, 17, 2, 44, C.wall);
    [[24, 8], [36, 8], [48, 8]].forEach(([y, h]) => {
      px(ctx, 8, y, 8, h, C.red);
      px(ctx, 8, y, 2, h, C.redL);
    });
    // lantern
    px(ctx, 4, 4, 16, 14, C.ink);
    px(ctx, 5, 5, 14, 12, C.navyD);
    px(ctx, 8, 7, 8, 8, on ? C.goldL : C.goldD);
    if (on) {
      px(ctx, 16, 9, 8, 2, C.gold);
      px(ctx, 0, 9, 6, 2, C.goldD);
      p1(ctx, 11, 8, C.white);
    }
    px(ctx, 9, 2, 6, 4, C.redD);
    p1(ctx, 11, 1, C.ink);
    return c;
  }

  function bakeBoat() {
    const { c, ctx } = make(36, 20);
    stamp(ctx, 0, 2, [
      "..............k................",
      "..............k..rrrr..........",
      "..............k.rRRRRr.........",
      "..............k.rRRRRr.........",
      "..............k..rrrr..........",
      "..kkkkkkkkkkkkkkkkkkkkkkkkk....",
      ".kwwwwwwwwwwwwwwwwwwwwwwwwwk...",
      "kWWwwwwwwwwwwwwwwwwwwwwwwwWWk..",
      "kWWWWWWWWWWWWWWWWWWWWWWWWWWWk..",
      ".kkkkkkkkkkkkkkkkkkkkkkkkkkk...",
      "...sssssssssssssssssssss.......",
    ], {
      k: C.ink, w: C.wood, W: C.woodD, r: C.redD, R: C.red, s: "rgba(0,0,0,0.2)",
    });
    p1(ctx, 16, 2, C.gold);
    return c;
  }

  function bakeCloud() {
    const { c, ctx } = make(48, 20);
    stamp(ctx, 0, 2, [
      "........kkkkkkkk................",
      "......kkwwwwwwwwkk..............",
      "....kkwWWWWwwwwwwwkk............",
      "..kkwWWWWWWWWWWWWWwkk...........",
      ".kkwWWWWWWWWWWWWWWWwkkk.........",
      "kkwWWWWWWWWWWWWWWWWWWwwkk.......",
      "kkwwwwwwwwwwwwwwwwwwwwwwk.......",
      ".kkkkkkkkkkkkkkkkkkkkkkkk.......",
    ], {
      k: C.cloudK, w: C.cloud, W: C.white,
    });
    return c;
  }

  function bakeHill() {
    const { c, ctx } = make(80, 32);
    for (let y = 0; y < 32; y++) {
      const t = y / 31;
      const inset = ((1 - t) * (1 - t) * 28) | 0;
      px(ctx, inset, y, 80 - inset * 2, 1, C.hillK);
      px(ctx, inset + 1, y, 80 - inset * 2 - 2, 1, y < 6 ? C.hillL : C.hill);
      if (y > 4) px(ctx, inset + 1, y, 6, 1, C.hillD);
    }
    p1(ctx, 22, 8, C.hillL);
    p1(ctx, 24, 10, C.white);
    return c;
  }

  function bakeBush() {
    const { c, ctx } = make(24, 16);
    stamp(ctx, 0, 0, [
      "......kkkkkk........",
      "....kkgGGGGGkk......",
      "..kkgGGGGGGGGGkk....",
      ".kgGGGgGGGgGGGGgk...",
      "kgGGgGGGGGGGGGgGGk..",
      "kGGGGGGGGGGGGGGGGk..",
      "kgGGGgGGGgGGGgGGGk..",
      ".kkkkkkkkkkkkkkkk...",
      "....ssssssssss......",
    ], {
      k: C.ink, G: C.green, g: C.greenD, s: "rgba(0,0,0,0.2)",
    });
    p1(ctx, 8, 3, C.greenL);
    p1(ctx, 14, 5, C.greenH);
    return c;
  }

  function bakeUmbrella() {
    const { c, ctx } = make(32, 32);
    px(ctx, 15, 12, 2, 18, C.woodX);
    px(ctx, 15, 12, 1, 18, C.woodL);
    p1(ctx, 15, 30, C.ink);
    const cols = [C.red, C.white, C.blue, C.white, C.red];
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 6;
      px(ctx, x, 6, 6, 8, cols[i]);
      px(ctx, x + 1, 4, 4, 3, cols[i]);
    }
    px(ctx, 4, 5, 24, 1, C.ink);
    px(ctx, 2, 13, 28, 1, C.ink);
    p1(ctx, 15, 3, C.gold);
    outlineRect(ctx, 2, 4, 28, 10, C.ink);
    return c;
  }

  function bakeRock() {
    const { c, ctx } = make(16, 12);
    stamp(ctx, 0, 0, [
      "...kkkkkk.....",
      "..kggGGggk....",
      ".kgGGGGGGgk...",
      "kggGGGGGGGgk..",
      "kgGGGgGGGGgk..",
      ".kkkkkkkkkk...",
      "..ssssssss....",
    ], {
      k: C.ink, g: C.wallS, G: C.wallD, s: "rgba(0,0,0,0.25)",
    });
    p1(ctx, 6, 2, C.wall);
    return c;
  }

  function bakeSign() {
    const { c, ctx } = make(24, 40);
    px(ctx, 11, 8, 3, 30, C.woodX);
    px(ctx, 12, 8, 1, 30, C.woodL);
    function plank(y, w, txt) {
      px(ctx, 2, y, w, 9, C.ink);
      px(ctx, 3, y + 1, w - 2, 7, C.wood);
      px(ctx, 3, y + 1, 2, 7, C.woodL);
      ctx.fillStyle = C.white;
      ctx.font = "6px monospace";
      ctx.fillText(txt, 5, y + 7);
    }
    plank(6, 20, "PLAGE");
    plank(16, 18, "SOUK");
    plank(26, 16, "PORT");
    return c;
  }

  function bakeSeagull(frame) {
    const { c, ctx } = make(20, 10);
    const f = frame ? 1 : 0;
    stamp(ctx, 0, f ? 0 : 2, f ? [
      "kk....kk..........",
      ".kwwwwk...........",
      "..kWWek...........",
      "...kkkk...........",
    ] : [
      "....kk............",
      "..kkwkk...........",
      "kkwWWewkk.........",
      "..kkkkkk..........",
    ], { k: C.ink, w: C.white, W: C.cloudD, e: C.navy });
    return c;
  }

  function bakeSun() {
    const { c, ctx } = make(32, 32);
    px(ctx, 8, 8, 16, 16, C.gold);
    px(ctx, 10, 6, 12, 20, C.gold);
    px(ctx, 6, 10, 20, 12, C.gold);
    px(ctx, 11, 9, 10, 10, C.goldL);
    p1(ctx, 13, 11, C.white);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      px(ctx, 15 + Math.cos(a) * 13, 15 + Math.sin(a) * 13, 3, 2, C.goldL);
    }
    outlineRect(ctx, 8, 8, 16, 16, C.goldD);
    return c;
  }

  /* —— PLAYER 24x32, SMB Super Mario language (hat, 3 shades, 1px ink) —— */
  function bakePlayer(facing, walk, attacking, goldHat) {
    const { c, ctx } = make(PW, PH);
    const flip = facing < 0;
    function X(x) { return flip ? PW - 1 - x : x; }
    function bar(x, y, w, h, col) {
      if (w <= 0 || h <= 0 || !col) return;
      if (!flip) px(ctx, x, y, w, h, col);
      else px(ctx, X(x + w - 1), y, w, h, col);
    }
    function dot(x, y, col) { p1(ctx, X(x), y, col); }

    const stride = walk === 1 || walk === 3;
    const bob = stride ? -1 : 0;
    const y0 = 1 + bob;
    const lLeg = walk === 1 ? -3 : walk === 3 ? 2 : 0;
    const rLeg = walk === 1 ? 2 : walk === 3 ? -3 : 0;
    const lArm = walk === 1 ? 2 : walk === 3 ? -2 : 0;
    const rArm = -lArm;

    const hat = goldHat ? C.gold : C.green;
    const hatL = goldHat ? C.goldL : C.greenL;
    const hatD = goldHat ? C.goldD : C.greenD;

    // shadow
    bar(5, 30, 14, 2, "rgba(0,0,0,0.28)");

    // shoes + legs
    bar(6, y0 + 22 + lLeg, 5, 7, C.navy);
    bar(7, y0 + 23 + lLeg, 3, 5, C.navyL);
    bar(6, y0 + 28 + lLeg, 6, 3, C.woodX);
    bar(7, y0 + 28 + lLeg, 4, 1, C.wood);
    bar(13, y0 + 22 + rLeg, 5, 7, C.navyD);
    bar(14, y0 + 23 + rLeg, 3, 5, C.navy);
    bar(13, y0 + 28 + rLeg, 6, 3, C.woodX);
    bar(14, y0 + 28 + rLeg, 4, 1, C.woodL);
    // ink shoes
    bar(6, y0 + 28 + lLeg, 6, 1, C.ink);
    bar(13, y0 + 28 + rLeg, 6, 1, C.ink);

    // torso (overalls + shirt)
    bar(6, y0 + 13, 12, 11, C.ink);
    bar(7, y0 + 14, 10, 9, C.greenD);
    bar(7, y0 + 14, 10, 4, C.green);
    bar(8, y0 + 14, 3, 3, C.greenL);
    // straps
    bar(8, y0 + 13, 2, 5, hatD);
    bar(14, y0 + 13, 2, 5, hatD);
    // chest badge
    bar(10, y0 + 18, 4, 3, C.white);
    bar(11, y0 + 19, 2, 1, C.greenD);

    // back arm
    bar(3, y0 + 15 + lArm, 4, 4, C.greenD);
    bar(2, y0 + 18 + lArm, 4, 4, C.white);
    bar(2, y0 + 18 + lArm, 4, 1, C.ink);

    // head
    bar(7, y0 + 5, 11, 9, C.ink);
    bar(8, y0 + 6, 9, 7, C.skin);
    bar(8, y0 + 6, 3, 3, C.skinL);
    bar(9, y0 + 11, 7, 2, C.skinD);
    // nose
    bar(facing > 0 ? 14 : 7, y0 + 9, 3, 3, C.skinM);
    dot(facing > 0 ? 16 : 7, y0 + 10, C.skinD);
    // eyes
    const ex = facing > 0 ? 13 : 9;
    bar(ex, y0 + 7, 3, 3, C.white);
    dot(ex + (facing > 0 ? 1 : 0), y0 + 8, C.ink);
    dot(ex + (facing > 0 ? 1 : 1), y0 + 7, C.navy);
    // smile
    bar(10, y0 + 12, 4, 1, C.redD);

    // hat (Mario brim)
    bar(6, y0 + 4, 13, 3, C.ink);
    bar(7, y0 + 1, 10, 5, C.ink);
    bar(8, y0 + 2, 8, 3, hat);
    bar(9, y0 + 1, 6, 2, hatL);
    bar(7, y0 + 4, 12, 2, hatD);
    bar(5, y0 + 5, 15, 2, hat);
    bar(5, y0 + 5, 15, 1, C.ink);
    if (goldHat) {
      dot(11, y0 + 3, C.goldL);
      dot(13, y0 + 3, C.white);
    } else {
      bar(11, y0 + 3, 3, 2, C.white);
    }

    // front glove
    bar(17, y0 + 15 + rArm, 4, 4, C.green);
    bar(18, y0 + 18 + rArm, 4, 4, C.white);
    bar(18, y0 + 18 + rArm, 4, 1, C.ink);
    dot(20, y0 + 20 + rArm, C.cloudD);

    // scorpion pince
    const ax = attacking ? 18 : 16;
    const ay = y0 + (attacking ? 12 : 16) + rArm;
    bar(ax, ay, attacking ? 7 : 5, 3, C.navyD);
    bar(ax + 1, ay, 3, 3, C.navyL);
    if (attacking) {
      bar(ax + 4, ay - 3, 5, 2, C.gold);
      bar(ax + 4, ay + 4, 5, 2, C.gold);
      bar(ax + 6, ay, 4, 3, C.red);
      dot(ax + 9, ay + 1, C.goldL);
    } else {
      bar(ax + 3, ay - 2, 4, 2, C.gold);
      bar(ax + 3, ay + 3, 4, 2, C.goldD);
      bar(ax + 4, ay, 3, 3, C.red);
    }

    return c;
  }

  function bake() {
    if (ready) return;
    tiles.sand0 = bakeSand(0);
    tiles.sand1 = bakeSand(1);
    tiles.sand2 = bakeSand(2);
    tiles.sand3 = bakeSand(3);
    tiles.sandCap = bakeSandCap();
    tiles.grass = bakeGrass();
    tiles.brick = bakeBrick();
    tiles.stone = bakeStone();
    tiles.sea = [
      [bakeSea(0, 0), bakeSea(0, 1), bakeSea(0, 2)],
      [bakeSea(1, 0), bakeSea(1, 1), bakeSea(1, 2)],
      [bakeSea(2, 0), bakeSea(2, 1), bakeSea(2, 2)],
    ];
    tiles.foam = [bakeFoam(0), bakeFoam(1), bakeFoam(2)];

    frames.can = bakeCan();
    frames.bottle = bakeBottle();
    frames.bag = bakeBag();
    frames.bin = bakeBin();
    frames.palm0 = bakePalm(0);
    frames.palm1 = bakePalm(2);
    frames.house = bakeHouse();
    frames.lhOn = bakeLighthouse(true);
    frames.lhOff = bakeLighthouse(false);
    frames.boat = bakeBoat();
    frames.cloud = bakeCloud();
    frames.hill = bakeHill();
    frames.bush = bakeBush();
    frames.umbrella = bakeUmbrella();
    frames.rock = bakeRock();
    frames.sign = bakeSign();
    frames.gull0 = bakeSeagull(0);
    frames.gull1 = bakeSeagull(1);
    frames.sun = bakeSun();

    frames.player = {};
    for (const face of [1, -1]) {
      for (let w = 0; w < 4; w++) {
        for (const atk of [0, 1]) {
          for (const gold of [0, 1]) {
            frames.player[`${face}_${w}_${atk}_${gold}`] = bakePlayer(face, w, !!atk, !!gold);
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

  return { C, tiles, frames, bake, blit, inView, ready: () => ready, PW, PH };
})();
