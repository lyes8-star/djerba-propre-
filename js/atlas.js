/* Offscreen NES/SNES-style pixel atlas — bake once, blit every frame */
const Atlas = (() => {
  const PW = 32;
  const PH = 40;

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
    road: "#3a3c48", roadL: "#5a5c68", roadD: "#24262e", roadY: "#fcbc14",
    cobbleA: "#c4a878", cobbleB: "#a88858", cobbleC: "#8c7048",
    terra: "#e88850", terraD: "#c06030", terraL: "#f4b078",
    awnR: "#d43030", awnW: "#fcfcfc", awnG: "#248024",
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

  function bakeBeach(v) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, v ? C.sandA : C.sandB);
    px(ctx, 0, 13, 16, 3, C.sandC);
    px(ctx, 0, 15, 16, 1, C.sandD);
    for (let i = 0; i < 4; i++) {
      p1(ctx, (i * 5 + v * 3) % 16, 3 + ((i + v) % 3), C.sandA);
      p1(ctx, (i * 4 + 2) % 16, 8, C.foamD);
    }
    p1(ctx, 4 + v * 7, 6, C.sandE);
    p1(ctx, 11 - v * 3, 10, C.white);
    p1(ctx, 7, 12, C.sandD);
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

  function bakeGrass(v) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, v ? C.sandC : C.sandB);
    const blades = v ? [1, 3, 6, 8, 11, 13, 15] : [2, 5, 7, 10, 12, 14];
    blades.forEach((x, i) => {
      const h = 5 + ((i + (v || 0)) % 3);
      const y = 15 - h;
      px(ctx, x, y, 1, h, i % 2 ? C.greenD : C.green);
      p1(ctx, x, y, C.greenL);
      if (i % 2 === 0) p1(ctx, x + 1, y + 2, C.greenH);
    });
    if (v) {
      p1(ctx, 5, 12, C.woodD);
      p1(ctx, 10, 14, C.greenX);
    }
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

  function bakeRoad(kind) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.road);
    px(ctx, 0, 0, 16, 1, C.roadL);
    px(ctx, 0, 15, 16, 1, C.roadD);
    for (let i = 0; i < 6; i++) p1(ctx, (i * 5 + kind) % 16, (i * 3 + 4) % 16, C.roadD);
    if (kind === "h") {
      px(ctx, 2, 7, 5, 2, C.roadY);
      px(ctx, 10, 7, 5, 2, C.roadY);
    } else if (kind === "v") {
      px(ctx, 7, 1, 2, 5, C.roadY);
      px(ctx, 7, 10, 2, 5, C.roadY);
    } else if (kind === "x") {
      px(ctx, 2, 7, 12, 2, C.roadY);
      px(ctx, 7, 2, 2, 12, C.roadY);
      px(ctx, 6, 6, 4, 4, C.road);
    }
    return c;
  }

  function bakeWhiteRoad(kind) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.wall);
    for (let i = 0; i < 7; i++) p1(ctx, (i * 5 + 2) % 16, (i * 3 + 4) % 16, C.white);
    if (kind === "h") {
      px(ctx, 0, 0, 16, 2, C.cobbleB);
      px(ctx, 0, 14, 16, 2, C.sandE);
      px(ctx, 0, 2, 16, 1, C.white);
      px(ctx, 0, 13, 16, 1, C.wallS);
      px(ctx, 2, 7, 5, 2, C.gold);
      px(ctx, 10, 7, 5, 2, C.gold);
    } else if (kind === "v") {
      px(ctx, 0, 0, 2, 16, C.cobbleB);
      px(ctx, 14, 0, 2, 16, C.sandE);
      px(ctx, 2, 0, 1, 16, C.white);
      px(ctx, 13, 0, 1, 16, C.wallS);
      px(ctx, 7, 2, 2, 5, C.gold);
      px(ctx, 7, 10, 2, 5, C.gold);
    } else if (kind === "x") {
      px(ctx, 0, 0, 16, 2, C.cobbleB);
      px(ctx, 0, 14, 16, 2, C.sandE);
      px(ctx, 0, 0, 2, 16, C.cobbleB);
      px(ctx, 14, 0, 2, 16, C.sandE);
      px(ctx, 2, 7, 12, 2, C.gold);
      px(ctx, 7, 2, 2, 12, C.gold);
      px(ctx, 6, 6, 4, 4, C.wall);
    } else {
      px(ctx, 0, 0, 16, 1, C.white);
      px(ctx, 0, 15, 16, 1, C.wallS);
      px(ctx, 0, 0, 1, 16, C.cobbleB);
      px(ctx, 15, 0, 1, 16, C.sandE);
    }
    return c;
  }

  function bakeCobble(v) {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.cobbleB);
    const cols = [C.cobbleA, C.cobbleB, C.cobbleC, C.sandD];
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 4) {
        const ox = ((y / 4) % 2) * 2;
        const col = cols[(x / 4 + y / 4 + v) % 4];
        px(ctx, x + ox, y, 3, 3, col);
        outlineRect(ctx, x + ox, y, 3, 3, C.sandF);
      }
    }
    return c;
  }

  function bakePlaza() {
    const { c, ctx } = make(16, 16);
    px(ctx, 0, 0, 16, 16, C.wall);
    px(ctx, 0, 0, 16, 1, C.white);
    px(ctx, 0, 15, 16, 1, C.wallS);
    outlineRect(ctx, 1, 1, 14, 14, C.wallD);
    p1(ctx, 4, 4, C.goldL);
    p1(ctx, 11, 10, C.wallS);
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

  function bakeButt() {
    const { c, ctx } = make(10, 8);
    stamp(ctx, 0, 1, [
      "kkkkkkkk",
      "kwwwrrfk",
      "kwwwrrfk",
      "kkkkkkkk",
      ".ssssss.",
    ], {
      k: C.ink, w: "#e8dcc8", r: C.redD, f: "#c4a070", s: "rgba(0,0,0,0.3)",
    });
    return c;
  }

  function bakeCup() {
    const { c, ctx } = make(12, 14);
    stamp(ctx, 0, 0, [
      ".kkkkkkkk.",
      "kwwwwwwwwk",
      "kwwrwwrwwk",
      ".kwwwwwwk.",
      ".kwwBBwwk.",
      ".kwwwwwwk.",
      ".kkkkkkkk.",
      "..ssssss..",
    ], {
      k: C.ink, w: C.white, r: C.red, B: C.blueL, s: "rgba(0,0,0,0.3)",
    });
    return c;
  }

  function bakePaper() {
    const { c, ctx } = make(14, 12);
    stamp(ctx, 0, 0, [
      "..kkkkkk....",
      ".kwwwwwwk...",
      "kwwkwwwwwk..",
      "kwwwwwkwwk..",
      ".kwwwwwwwk..",
      "..kkkkkkkk..",
      "...ssssss...",
    ], {
      k: C.ink, w: "#e8e0c8", s: "rgba(0,0,0,0.28)",
    });
    return c;
  }

  function bakePeel() {
    const { c, ctx } = make(14, 12);
    stamp(ctx, 0, 0, [
      "...kk.......",
      "..kggk.kk...",
      ".kgGGkggk...",
      "kggggggGk...",
      ".kkgggkk....",
      "...kkkk.....",
      "...ssss.....",
    ], {
      k: C.ink, g: "#d88818", G: "#f0b020", s: "rgba(0,0,0,0.3)",
    });
    return c;
  }

  function bakeBrik() {
    const { c, ctx } = make(16, 16);
    stamp(ctx, 0, 1, [
      "......kk......",
      ".....kGGk.....",
      "....kGgGGk....",
      "...kGGyyGGk...",
      "..kGGyyyyGGk..",
      ".kGGGyyyyGGGk.",
      "kGGGGGGGGGGGGk",
      ".kkkkkkkkkkkk.",
      "..ssssssssss..",
    ], { k: C.ink, G: C.gold, g: C.goldL, y: C.goldL, s: "rgba(0,0,0,0.25)" });
    px(ctx, 7, 5, 3, 2, C.goldL);
    p1(ctx, 8, 6, C.white);
    return c;
  }

  function bakeLablabi() {
    const { c, ctx } = make(16, 14);
    px(ctx, 2, 4, 12, 8, C.ink);
    px(ctx, 3, 5, 10, 6, C.woodD);
    px(ctx, 4, 6, 8, 4, C.sandC);
    px(ctx, 5, 7, 3, 2, C.red);
    px(ctx, 9, 7, 2, 2, C.greenD);
    px(ctx, 6, 4, 4, 2, C.sandA);
    return c;
  }

  function bakeCouscous() {
    const { c, ctx } = make(16, 14);
    px(ctx, 1, 6, 14, 6, C.ink);
    px(ctx, 2, 7, 12, 4, C.wall);
    px(ctx, 4, 4, 8, 6, C.sandB);
    px(ctx, 5, 3, 6, 2, C.sandA);
    p1(ctx, 6, 6, C.red);
    p1(ctx, 9, 7, C.green);
    p1(ctx, 8, 5, C.goldD);
    return c;
  }

  function bakeOjja() {
    const { c, ctx } = make(16, 14);
    px(ctx, 2, 5, 12, 7, C.ink);
    px(ctx, 3, 6, 10, 5, C.redD);
    px(ctx, 4, 7, 8, 3, C.red);
    px(ctx, 5, 7, 3, 2, C.goldL);
    px(ctx, 9, 8, 3, 2, C.gold);
    return c;
  }

  function bakeMakroud() {
    const { c, ctx } = make(16, 12);
    px(ctx, 3, 3, 10, 6, C.ink);
    px(ctx, 4, 4, 8, 4, C.goldD);
    px(ctx, 5, 5, 6, 2, C.gold);
    p1(ctx, 7, 5, C.woodD);
    return c;
  }

  function bakeMlawi() {
    const { c, ctx } = make(16, 12);
    px(ctx, 2, 3, 12, 3, C.ink);
    px(ctx, 3, 4, 10, 1, C.sandA);
    px(ctx, 2, 6, 12, 3, C.ink);
    px(ctx, 3, 7, 10, 1, C.sandB);
    return c;
  }

  function bakeThe() {
    const { c, ctx } = make(12, 16);
    px(ctx, 3, 4, 6, 9, C.ink);
    px(ctx, 4, 5, 4, 7, C.greenD);
    px(ctx, 4, 5, 4, 2, C.greenL);
    px(ctx, 9, 7, 2, 3, C.gold);
    p1(ctx, 5, 3, C.green);
    p1(ctx, 6, 2, C.greenL);
    return c;
  }

  function bakeFricasse() {
    const { c, ctx } = make(16, 12);
    px(ctx, 2, 3, 12, 7, C.ink);
    px(ctx, 3, 4, 10, 5, C.sandA);
    px(ctx, 4, 6, 8, 2, C.red);
    px(ctx, 5, 5, 6, 1, C.greenD);
    return c;
  }

  function bakeBambalouni() {
    const { c, ctx } = make(16, 14);
    px(ctx, 3, 3, 10, 8, C.ink);
    px(ctx, 4, 4, 8, 6, C.gold);
    px(ctx, 6, 6, 4, 2, C.sandF);
    px(ctx, 5, 4, 6, 1, C.goldL);
    return c;
  }

  function bakeHarissa() {
    const { c, ctx } = make(12, 16);
    px(ctx, 4, 2, 4, 3, C.ink);
    px(ctx, 3, 5, 6, 9, C.ink);
    px(ctx, 4, 6, 4, 7, C.red);
    px(ctx, 4, 6, 2, 3, C.redL);
    px(ctx, 5, 3, 2, 2, C.white);
    return c;
  }

  function bakeKaftaji() {
    const { c, ctx } = make(16, 14);
    px(ctx, 2, 5, 12, 7, C.ink);
    px(ctx, 3, 6, 10, 5, C.wood);
    px(ctx, 4, 7, 3, 2, C.goldD);
    px(ctx, 8, 7, 3, 2, C.greenD);
    px(ctx, 6, 8, 3, 2, C.red);
    return c;
  }

  function bakeMechouia() {
    const { c, ctx } = make(16, 14);
    px(ctx, 2, 4, 12, 8, C.ink);
    px(ctx, 3, 5, 10, 6, C.redD);
    px(ctx, 4, 6, 8, 4, C.greenD);
    px(ctx, 5, 7, 3, 2, C.red);
    px(ctx, 9, 8, 2, 1, C.gold);
    return c;
  }

  function bakeChorba() {
    const { c, ctx } = make(16, 14);
    px(ctx, 2, 5, 12, 7, C.ink);
    px(ctx, 3, 6, 10, 5, C.redD);
    px(ctx, 4, 7, 8, 3, C.terra);
    px(ctx, 5, 4, 6, 2, C.goldL);
    return c;
  }

  function bakeTajine() {
    const { c, ctx } = make(16, 14);
    px(ctx, 3, 3, 10, 9, C.ink);
    px(ctx, 4, 4, 8, 7, C.gold);
    px(ctx, 6, 6, 4, 3, C.goldL);
    p1(ctx, 7, 7, C.red);
    p1(ctx, 9, 8, C.greenD);
    return c;
  }

  function bakeKasra() {
    const { c, ctx } = make(16, 12);
    px(ctx, 3, 2, 10, 8, C.ink);
    px(ctx, 4, 3, 8, 6, C.sandC);
    px(ctx, 5, 4, 6, 4, C.sandA);
    p1(ctx, 7, 6, C.sandE);
    return c;
  }

  function bakeZlebia() {
    const { c, ctx } = make(16, 14);
    px(ctx, 4, 3, 8, 8, C.ink);
    px(ctx, 5, 4, 6, 6, C.gold);
    px(ctx, 6, 5, 4, 4, C.goldL);
    px(ctx, 7, 6, 2, 2, C.woodD);
    return c;
  }

  function bakeMerguez() {
    const { c, ctx } = make(16, 12);
    px(ctx, 2, 4, 12, 3, C.ink);
    px(ctx, 3, 5, 10, 1, C.red);
    px(ctx, 2, 8, 12, 3, C.ink);
    px(ctx, 3, 9, 10, 1, C.redD);
    return c;
  }

  function bakeBaklawa() {
    const { c, ctx } = make(16, 12);
    px(ctx, 3, 3, 10, 7, C.ink);
    px(ctx, 4, 4, 8, 2, C.goldL);
    px(ctx, 4, 6, 8, 2, C.greenD);
    px(ctx, 4, 8, 8, 1, C.gold);
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

  function bakeHouseWarm() {
    const { c, ctx } = make(48, 56);
    px(ctx, 4, 53, 40, 2, "rgba(0,0,0,0.25)");
    px(ctx, 4, 24, 40, 28, C.ink);
    px(ctx, 5, 25, 38, 26, C.terra);
    for (let y = 28; y < 50; y += 4) px(ctx, 6, y, 36, 1, C.terraD);
    px(ctx, 5, 48, 38, 3, C.terraD);
    px(ctx, 6, 26, 8, 4, C.terraL);
    px(ctx, 14, 6, 20, 20, C.ink);
    px(ctx, 15, 8, 18, 18, C.goldD);
    px(ctx, 17, 6, 14, 6, C.gold);
    px(ctx, 20, 12, 8, 4, C.goldL);
    p1(ctx, 23, 8, C.white);
    px(ctx, 18, 36, 12, 16, C.ink);
    px(ctx, 19, 37, 10, 14, C.woodX);
    px(ctx, 20, 38, 3, 12, C.wood);
    p1(ctx, 27, 45, C.goldL);
    function win(x, y) {
      px(ctx, x, y, 10, 10, C.ink);
      px(ctx, x + 1, y + 1, 8, 8, C.navyD);
      px(ctx, x + 1, y + 1, 8, 3, C.goldL);
      px(ctx, x + 5, y + 1, 1, 8, C.white);
      px(ctx, x + 1, y + 5, 8, 1, C.white);
    }
    win(7, 32);
    win(31, 32);
    return c;
  }

  function bakeShop() {
    const { c, ctx } = make(40, 40);
    px(ctx, 2, 37, 36, 2, "rgba(0,0,0,0.25)");
    px(ctx, 4, 16, 32, 22, C.ink);
    px(ctx, 5, 17, 30, 20, C.wood);
    px(ctx, 6, 18, 6, 16, C.woodL);
    const stripes = [C.awnR, C.awnW, C.awnG, C.awnW, C.awnR];
    for (let i = 0; i < 5; i++) {
      px(ctx, 2 + i * 7, 6, 8, 12, stripes[i]);
    }
    outlineRect(ctx, 2, 6, 36, 12, C.ink);
    px(ctx, 4, 16, 32, 2, C.ink);
    px(ctx, 12, 24, 16, 14, C.ink);
    px(ctx, 13, 25, 14, 12, C.woodX);
    px(ctx, 8, 22, 6, 6, C.gold);
    px(ctx, 26, 22, 6, 6, C.red);
    p1(ctx, 10, 24, C.goldL);
    return c;
  }

  function bakeStall() {
    const { c, ctx } = make(28, 28);
    px(ctx, 4, 26, 20, 2, "rgba(0,0,0,0.22)");
    px(ctx, 2, 8, 24, 8, C.ink);
    px(ctx, 3, 9, 7, 6, C.awnR);
    px(ctx, 10, 9, 7, 6, C.awnW);
    px(ctx, 17, 9, 8, 6, C.green);
    px(ctx, 4, 16, 20, 10, C.woodD);
    px(ctx, 5, 17, 18, 3, C.woodL);
    px(ctx, 6, 21, 5, 4, C.gold);
    px(ctx, 13, 21, 4, 4, C.red);
    px(ctx, 19, 21, 4, 4, C.bottle);
    outlineRect(ctx, 4, 16, 20, 10, C.ink);
    return c;
  }

  function bakeCabaret() {
    const { c, ctx } = make(56, 48);
    px(ctx, 2, 45, 52, 2, "rgba(0,0,0,0.3)");
    px(ctx, 4, 14, 48, 32, C.ink);
    px(ctx, 5, 15, 46, 30, "#2a1428");
    px(ctx, 6, 16, 8, 28, "#3c1c38");
    for (let i = 0; i < 7; i++) {
      px(ctx, 4 + i * 7, 4, 8, 12, i % 2 ? C.red : "#fc68a0");
    }
    outlineRect(ctx, 4, 4, 48, 12, C.ink);
    px(ctx, 18, 28, 20, 18, C.ink);
    px(ctx, 19, 29, 18, 16, "#140818");
    px(ctx, 20, 30, 4, 14, "#3c1830");
    p1(ctx, 32, 38, C.gold);
    function glow(x, y) {
      px(ctx, x, y, 8, 8, C.ink);
      px(ctx, x + 1, y + 1, 6, 6, C.redD);
      px(ctx, x + 1, y + 1, 6, 2, C.goldL);
    }
    glow(8, 20);
    glow(40, 20);
    px(ctx, 14, 8, 28, 5, C.ink);
    px(ctx, 15, 9, 26, 3, C.red);
    return c;
  }

  function bakeMinaret() {
    const { c, ctx } = make(20, 72);
    px(ctx, 4, 70, 12, 2, "rgba(0,0,0,0.25)");
    px(ctx, 6, 20, 8, 50, C.ink);
    px(ctx, 7, 21, 6, 48, C.white);
    px(ctx, 7, 21, 2, 48, C.wall);
    px(ctx, 7, 32, 6, 4, C.blue);
    px(ctx, 7, 48, 6, 4, C.blueD);
    px(ctx, 4, 8, 12, 14, C.ink);
    px(ctx, 5, 9, 10, 12, C.goldD);
    px(ctx, 7, 6, 6, 6, C.gold);
    px(ctx, 8, 4, 4, 4, C.goldL);
    p1(ctx, 9, 2, C.ink);
    p1(ctx, 9, 1, C.goldL);
    px(ctx, 8, 14, 4, 4, C.navyD);
    p1(ctx, 9, 15, C.goldL);
    return c;
  }

  function bakeLamp() {
    const { c, ctx } = make(10, 22);
    px(ctx, 4, 6, 2, 14, C.ink);
    px(ctx, 4, 6, 1, 14, C.metal);
    px(ctx, 2, 2, 6, 6, C.ink);
    px(ctx, 3, 3, 4, 4, C.goldL);
    p1(ctx, 4, 4, C.white);
    px(ctx, 3, 20, 4, 2, C.navyD);
    return c;
  }

  function bakeFountain() {
    const { c, ctx } = make(28, 22);
    px(ctx, 2, 20, 24, 2, "rgba(0,0,0,0.2)");
    px(ctx, 2, 12, 24, 8, C.ink);
    px(ctx, 3, 13, 22, 6, C.wall);
    px(ctx, 6, 14, 16, 4, C.blueL);
    px(ctx, 12, 4, 4, 10, C.wallS);
    px(ctx, 11, 2, 6, 4, C.blue);
    p1(ctx, 13, 1, C.foam);
    p1(ctx, 14, 6, C.foam);
    p1(ctx, 12, 8, C.blueL);
    return c;
  }

  function bakeBanner(label, bg) {
    const w = Math.max(48, 10 + String(label).length * 6);
    const { c, ctx } = make(w, 40);
    const mid = (w / 2) | 0;
    px(ctx, mid - 1, 18, 3, 20, C.woodX);
    px(ctx, mid, 18, 1, 20, C.woodL);
    px(ctx, mid - 5, 36, 11, 3, C.ink);
    px(ctx, mid - 4, 36, 9, 2, C.woodD);
    px(ctx, 1, 1, w - 2, 18, C.ink);
    px(ctx, 2, 2, w - 4, 16, bg);
    px(ctx, 3, 3, 3, 14, C.white);
    px(ctx, w - 6, 3, 2, 14, "rgba(255,255,255,0.25)");
    ctx.fillStyle = C.white;
    ctx.font = "8px monospace";
    ctx.fillText(label, 8, 13);
    return c;
  }

  function bakeHotel() {
    const { c, ctx } = make(88, 64);
    px(ctx, 4, 61, 80, 2, "rgba(0,0,0,0.28)");
    px(ctx, 6, 18, 76, 44, C.ink);
    px(ctx, 7, 19, 74, 42, C.wall);
    px(ctx, 7, 19, 8, 42, C.white);
    px(ctx, 7, 56, 74, 4, C.navy);
    px(ctx, 8, 10, 72, 10, C.ink);
    px(ctx, 9, 11, 70, 8, C.navy);
    px(ctx, 11, 12, 66, 6, C.navyL);
    ctx.fillStyle = C.goldL;
    ctx.font = "8px monospace";
    ctx.fillText("HOTEL", 28, 17);
    function win(x, y) {
      px(ctx, x, y, 10, 10, C.ink);
      px(ctx, x + 1, y + 1, 8, 8, C.blueX);
      px(ctx, x + 1, y + 1, 8, 3, C.blueL);
      px(ctx, x + 5, y + 1, 1, 8, C.white);
    }
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 5; i++) win(12 + i * 14, 24 + r * 14);
    }
    px(ctx, 36, 48, 16, 14, C.ink);
    px(ctx, 37, 49, 14, 12, C.woodD);
    px(ctx, 38, 50, 4, 10, C.woodL);
    p1(ctx, 48, 56, C.gold);
    return c;
  }

  function bakeAirport() {
    const { c, ctx } = make(88, 56);
    px(ctx, 4, 53, 80, 2, "rgba(0,0,0,0.28)");
    px(ctx, 8, 16, 72, 38, C.ink);
    px(ctx, 9, 17, 70, 36, C.metal);
    px(ctx, 9, 17, 70, 8, C.navy);
    px(ctx, 10, 18, 68, 6, C.navyL);
    ctx.fillStyle = C.white;
    ctx.font = "8px monospace";
    ctx.fillText("DJE", 36, 23);
    for (let i = 0; i < 4; i++) {
      px(ctx, 14 + i * 16, 28, 12, 10, C.ink);
      px(ctx, 15 + i * 16, 29, 10, 8, C.blueL);
      px(ctx, 15 + i * 16, 29, 10, 3, C.white);
    }
    px(ctx, 36, 40, 16, 14, C.ink);
    px(ctx, 37, 41, 14, 12, C.navyD);
    px(ctx, 38, 42, 4, 10, C.blueL);
    p1(ctx, 48, 48, C.gold);
    px(ctx, 68, 4, 12, 18, C.ink);
    px(ctx, 69, 5, 10, 16, C.white);
    px(ctx, 71, 0, 6, 8, C.red);
    px(ctx, 72, 8, 8, 4, C.navy);
    return c;
  }

  function bakePlane() {
    const { c, ctx } = make(48, 18);
    px(ctx, 4, 16, 40, 2, "rgba(0,0,0,0.2)");
    px(ctx, 8, 8, 32, 6, C.ink);
    px(ctx, 9, 9, 30, 4, C.white);
    px(ctx, 36, 6, 8, 8, C.ink);
    px(ctx, 37, 7, 6, 6, C.navy);
    px(ctx, 18, 4, 10, 4, C.ink);
    px(ctx, 19, 5, 8, 3, C.white);
    px(ctx, 18, 12, 10, 4, C.ink);
    px(ctx, 4, 9, 6, 4, C.red);
    p1(ctx, 14, 10, C.blue);
    p1(ctx, 20, 10, C.blue);
    p1(ctx, 26, 10, C.blue);
    return c;
  }

  function bakeLounge() {
    const { c, ctx } = make(20, 12);
    px(ctx, 2, 10, 16, 2, "rgba(0,0,0,0.22)");
    px(ctx, 2, 4, 16, 6, C.ink);
    px(ctx, 3, 5, 14, 4, C.white);
    px(ctx, 3, 2, 10, 4, C.ink);
    px(ctx, 4, 3, 8, 3, C.blueL);
    return c;
  }

  function bakeMosque() {
    const { c, ctx } = make(48, 56);
    px(ctx, 4, 53, 40, 2, "rgba(0,0,0,0.25)");
    px(ctx, 6, 22, 36, 32, C.ink);
    px(ctx, 7, 23, 34, 30, C.white);
    px(ctx, 7, 23, 6, 30, C.wall);
    px(ctx, 16, 6, 16, 18, C.ink);
    px(ctx, 17, 8, 14, 16, C.white);
    px(ctx, 19, 6, 10, 6, C.wall);
    px(ctx, 22, 2, 4, 6, C.gold);
    px(ctx, 38, 10, 6, 16, C.ink);
    px(ctx, 39, 11, 4, 14, C.white);
    px(ctx, 40, 6, 2, 6, C.gold);
    px(ctx, 18, 38, 12, 16, C.ink);
    px(ctx, 19, 39, 10, 14, C.woodD);
    px(ctx, 8, 28, 8, 8, C.blueX);
    px(ctx, 32, 28, 8, 8, C.blueX);
    px(ctx, 8, 28, 8, 3, C.blueL);
    px(ctx, 32, 28, 8, 3, C.blueL);
    return c;
  }

  function bakeFort() {
    const { c, ctx } = make(72, 64);
    px(ctx, 4, 61, 64, 2, "rgba(0,0,0,0.28)");
    px(ctx, 6, 18, 60, 44, C.ink);
    px(ctx, 7, 19, 58, 42, C.sandC);
    px(ctx, 7, 19, 58, 6, C.sandE);
    for (let i = 0; i < 6; i++) px(ctx, 8 + i * 10, 12, 8, 8, C.sandD);
    px(ctx, 8, 12, 8, 8, C.sandE);
    px(ctx, 56, 12, 8, 8, C.sandE);
    px(ctx, 12, 28, 10, 10, C.ink);
    px(ctx, 13, 29, 8, 8, C.navyD);
    px(ctx, 50, 28, 10, 10, C.ink);
    px(ctx, 51, 29, 8, 8, C.navyD);
    px(ctx, 28, 46, 16, 16, C.ink);
    px(ctx, 29, 47, 14, 14, C.woodX);
    px(ctx, 30, 48, 4, 12, C.wood);
    p1(ctx, 40, 54, C.gold);
    return c;
  }

  function bakeMuseum() {
    const { c, ctx } = make(64, 56);
    px(ctx, 4, 53, 56, 2, "rgba(0,0,0,0.25)");
    px(ctx, 6, 16, 52, 38, C.ink);
    px(ctx, 7, 17, 50, 36, C.wall);
    px(ctx, 7, 17, 50, 8, C.navy);
    px(ctx, 8, 18, 48, 6, C.navyL);
    px(ctx, 14, 28, 10, 10, C.goldD);
    px(ctx, 28, 28, 10, 10, C.terra);
    px(ctx, 42, 28, 10, 10, C.blue);
    px(ctx, 24, 40, 16, 14, C.ink);
    px(ctx, 25, 41, 14, 12, C.woodD);
    return c;
  }

  function bakeSynagogue() {
    const { c, ctx } = make(56, 56);
    px(ctx, 4, 53, 48, 2, "rgba(0,0,0,0.25)");
    px(ctx, 6, 18, 44, 36, C.ink);
    px(ctx, 7, 19, 42, 34, C.white);
    px(ctx, 7, 19, 42, 8, C.blue);
    px(ctx, 18, 6, 20, 14, C.ink);
    px(ctx, 19, 8, 18, 12, C.white);
    px(ctx, 24, 10, 8, 8, C.blue);
    px(ctx, 26, 12, 4, 4, C.gold);
    px(ctx, 12, 30, 8, 8, C.blueL);
    px(ctx, 36, 30, 8, 8, C.blueL);
    px(ctx, 20, 40, 16, 14, C.ink);
    px(ctx, 21, 41, 14, 12, C.wood);
    return c;
  }

  function bakeMenzel() {
    const { c, ctx } = make(56, 48);
    px(ctx, 4, 45, 48, 2, "rgba(0,0,0,0.25)");
    px(ctx, 6, 14, 44, 32, C.ink);
    px(ctx, 7, 15, 42, 30, C.sandB);
    px(ctx, 18, 18, 20, 16, C.sandD);
    px(ctx, 20, 20, 16, 12, C.greenX);
    px(ctx, 10, 20, 8, 8, C.blueX);
    px(ctx, 38, 20, 8, 8, C.blueX);
    px(ctx, 20, 32, 16, 14, C.ink);
    px(ctx, 21, 33, 14, 12, C.woodD);
    p1(ctx, 32, 40, C.gold);
    return c;
  }

  function bakeKiln() {
    const { c, ctx } = make(40, 40);
    px(ctx, 4, 37, 32, 2, "rgba(0,0,0,0.22)");
    px(ctx, 8, 10, 24, 26, C.ink);
    px(ctx, 9, 11, 22, 24, C.terra);
    px(ctx, 12, 6, 16, 8, C.terraD);
    px(ctx, 16, 22, 8, 14, C.ink);
    px(ctx, 17, 23, 6, 12, C.goldD);
    px(ctx, 18, 26, 4, 6, C.red);
    return c;
  }

  function bakeMill() {
    const { c, ctx } = make(48, 48);
    px(ctx, 4, 45, 40, 2, "rgba(0,0,0,0.22)");
    px(ctx, 8, 16, 32, 30, C.ink);
    px(ctx, 9, 17, 30, 28, C.wood);
    px(ctx, 16, 8, 16, 12, C.ink);
    px(ctx, 17, 9, 14, 10, C.woodD);
    px(ctx, 20, 4, 8, 6, C.goldD);
    px(ctx, 16, 32, 16, 14, C.ink);
    px(ctx, 17, 33, 14, 12, C.woodX);
    return c;
  }

  function bakeCistern() {
    const { c, ctx } = make(36, 32);
    px(ctx, 4, 29, 28, 2, "rgba(0,0,0,0.2)");
    px(ctx, 6, 10, 24, 20, C.ink);
    px(ctx, 7, 11, 22, 18, C.wallS);
    px(ctx, 12, 6, 12, 8, C.ink);
    px(ctx, 13, 7, 10, 6, C.wall);
    px(ctx, 14, 16, 8, 10, C.navyD);
    px(ctx, 15, 17, 6, 4, C.blueL);
    return c;
  }

  function bakeGraffiti() {
    const { c, ctx } = make(48, 40);
    px(ctx, 2, 37, 44, 2, "rgba(0,0,0,0.22)");
    px(ctx, 4, 8, 40, 30, C.ink);
    px(ctx, 5, 9, 38, 28, C.wall);
    px(ctx, 8, 12, 10, 14, C.red);
    px(ctx, 20, 10, 12, 16, C.blue);
    px(ctx, 34, 14, 8, 12, C.gold);
    px(ctx, 10, 26, 28, 6, C.green);
    px(ctx, 16, 24, 16, 14, C.ink);
    px(ctx, 17, 25, 14, 12, C.woodD);
    return c;
  }

  function bakeCemetery() {
    const { c, ctx } = make(64, 40);
    px(ctx, 4, 37, 56, 2, "rgba(0,0,0,0.18)");
    px(ctx, 4, 20, 56, 4, C.wallS);
    for (let i = 0; i < 5; i++) {
      px(ctx, 8 + i * 11, 24, 6, 12, C.wall);
      px(ctx, 9 + i * 11, 22, 4, 4, C.white);
    }
    px(ctx, 24, 8, 16, 16, C.ink);
    px(ctx, 25, 9, 14, 14, C.white);
    px(ctx, 28, 12, 8, 8, C.blue);
    return c;
  }

  function bakeOven() {
    const { c, ctx } = make(32, 32);
    px(ctx, 4, 29, 24, 2, "rgba(0,0,0,0.2)");
    px(ctx, 6, 10, 20, 20, C.ink);
    px(ctx, 7, 11, 18, 18, C.sandE);
    px(ctx, 10, 16, 12, 12, C.ink);
    px(ctx, 11, 18, 10, 8, C.redD);
    px(ctx, 13, 20, 6, 4, C.gold);
    return c;
  }

  function bakeFoggara() {
    const { c, ctx } = make(48, 28);
    px(ctx, 2, 25, 44, 2, "rgba(0,0,0,0.18)");
    px(ctx, 4, 12, 40, 12, C.ink);
    px(ctx, 5, 13, 38, 10, C.sandE);
    px(ctx, 8, 16, 32, 4, C.navyD);
    px(ctx, 10, 17, 28, 2, C.blue);
    px(ctx, 20, 6, 8, 10, C.wallS);
    px(ctx, 22, 8, 4, 6, C.blueL);
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

  function bakeCar(kind) {
    const { c, ctx } = make(40, 20);
    const pal = {
      taxi: { b: C.gold, l: C.goldL, d: C.goldD, roof: C.goldD },
      white: { b: C.white, l: C.wall, d: C.wallD, roof: C.wallS },
      blue: { b: C.blue, l: C.blueL, d: C.blueD, roof: C.blueX },
      red: { b: C.red, l: C.redL, d: C.redD, roof: C.redD },
      louage: { b: C.navy, l: C.navyL, d: C.navyD, roof: C.ink },
    }[kind] || { b: C.white, l: C.wall, d: C.wallD, roof: C.wallS };
    px(ctx, 4, 16, 32, 3, "rgba(20,12,28,0.28)");
    px(ctx, 6, 13, 7, 6, C.ink);
    px(ctx, 27, 13, 7, 6, C.ink);
    px(ctx, 7, 14, 5, 4, C.metalD);
    px(ctx, 28, 14, 5, 4, C.metalD);
    p1(ctx, 8, 15, C.metalL);
    p1(ctx, 29, 15, C.metalL);
    px(ctx, 2, 7, 36, 8, pal.b);
    px(ctx, 3, 6, 34, 2, pal.l);
    px(ctx, 2, 14, 36, 2, pal.d);
    px(ctx, 1, 9, 3, 5, pal.d);
    px(ctx, 36, 9, 3, 5, pal.d);
    px(ctx, 10, 2, 18, 7, pal.roof);
    px(ctx, 11, 3, 16, 5, C.blueX);
    px(ctx, 12, 4, 6, 3, C.blueL);
    px(ctx, 20, 4, 6, 3, C.navyD);
    p1(ctx, 13, 5, C.white);
    px(ctx, 1, 10, 2, 2, C.goldL);
    px(ctx, 37, 10, 2, 2, C.red);
    px(ctx, 0, 11, 2, 3, C.metal);
    px(ctx, 38, 11, 2, 3, C.metal);
    if (kind === "taxi") {
      px(ctx, 16, 0, 8, 3, C.goldL);
      outlineRect(ctx, 16, 0, 8, 3, C.ink);
      p1(ctx, 18, 1, C.ink);
      p1(ctx, 20, 1, C.ink);
      p1(ctx, 22, 1, C.ink);
    }
    if (kind === "louage") {
      px(ctx, 2, 10, 36, 2, C.red);
      px(ctx, 2, 11, 36, 1, C.white);
    }
    outlineRect(ctx, 2, 6, 36, 10, C.ink);
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

  function bakeFlag(kind, flutter) {
    const { c, ctx } = make(22, 28);
    px(ctx, 1, 26, 6, 2, "rgba(0,0,0,0.28)");
    px(ctx, 2, 1, 2, 25, C.woodX);
    px(ctx, 2, 0, 2, 2, C.gold);
    const ox = flutter ? 1 : 0;
    if (kind === "tn") {
      px(ctx, 4 + ox, 1, 16, 11, C.ink);
      px(ctx, 5 + ox, 2, 14, 9, C.red);
      px(ctx, 5 + ox, 2, 14, 2, C.redL);
      px(ctx, 9 + ox, 4, 6, 5, C.white);
      px(ctx, 10 + ox, 5, 4, 3, C.red);
      p1(ctx, 14 + ox, 5, C.red);
      p1(ctx, 15 + ox, 6, C.redL);
      p1(ctx, 14 + ox, 7, C.red);
    } else {
      px(ctx, 4 + ox, 1, 16, 11, C.ink);
      px(ctx, 5 + ox, 2, 14, 9, C.white);
      px(ctx, 5 + ox, 3, 14, 2, C.blueX);
      px(ctx, 5 + ox, 8, 14, 2, C.blueX);
      p1(ctx, 12 + ox, 5, C.blueX);
      p1(ctx, 11 + ox, 6, C.blueX);
      p1(ctx, 13 + ox, 6, C.blueX);
      p1(ctx, 10 + ox, 7, C.blueX);
      p1(ctx, 12 + ox, 7, C.blueX);
      p1(ctx, 14 + ox, 7, C.blueX);
      p1(ctx, 12 + ox, 8, C.blueX);
    }
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

  function bakeStray(kind, facing, walk) {
    const { c, ctx } = make(24, 16);
    const flip = facing < 0;
    function X(x) { return flip ? 23 - x : x; }
    function bar(x, y, w, h, col) {
      if (w <= 0 || h <= 0 || !col) return;
      if (!flip) px(ctx, x, y, w, h, col);
      else px(ctx, X(x + w - 1), y, w, h, col);
    }
    const step = walk === 1 || walk === 3;
    const bob = step ? 1 : 0;
    const lLeg = step ? 1 : 0;
    const rLeg = step ? 0 : 1;
    bar(4, 14, 16, 2, "rgba(0,0,0,0.28)");
    if (kind === "dog") {
      const fur = "#c48438";
      const furD = "#8c4c18";
      const furL = "#e0b070";
      bar(6, 7 + bob, 12, 6, C.ink);
      bar(7, 8 + bob, 10, 4, fur);
      bar(7, 8 + bob, 4, 2, furL);
      bar(8, 10 + bob, 8, 1, furD);
      bar(7, 12 + bob + lLeg, 3, 3, furD);
      bar(14, 12 + bob + rLeg, 3, 3, furD);
      bar(6, 13 + bob + lLeg, 3, 2, C.ink);
      bar(15, 13 + bob + rLeg, 3, 2, C.ink);
      bar(16, 6 + bob, 6, 6, C.ink);
      bar(17, 7 + bob, 4, 4, furL);
      bar(20, 8 + bob, 2, 2, C.ink);
      bar(18, 8 + bob, 1, 1, C.white);
      bar(21, 9 + bob, 2, 1, C.ink);
      bar(16, 4 + bob, 3, 4, furD);
      bar(17, 4 + bob, 2, 3, fur);
      bar(4, 8 + bob, 3, 2, furD);
      bar(3, 7 + bob, 3, 2, fur);
    } else {
      const fur = kind === "catGinger" ? "#d48840" : "#9098a8";
      const furD = kind === "catGinger" ? "#8c4c18" : "#585e70";
      const furL = kind === "catGinger" ? "#f0b878" : "#c8d0dc";
      bar(7, 8 + bob, 10, 5, C.ink);
      bar(8, 9 + bob, 8, 3, fur);
      bar(8, 9 + bob, 3, 2, furL);
      bar(8, 12 + bob + lLeg, 2, 3, furD);
      bar(14, 12 + bob + rLeg, 2, 3, furD);
      bar(8, 14 + bob + lLeg, 2, 1, C.ink);
      bar(14, 14 + bob + rLeg, 2, 1, C.ink);
      bar(16, 6 + bob, 6, 6, C.ink);
      bar(17, 7 + bob, 4, 4, furL);
      bar(19, 8 + bob, 1, 1, C.ink);
      bar(20, 8 + bob, 1, 1, C.white);
      bar(21, 9 + bob, 1, 1, C.ink);
      bar(17, 4 + bob, 2, 3, fur);
      bar(20, 4 + bob, 2, 3, fur);
      bar(17, 4 + bob, 1, 1, furL);
      bar(4, 7 + bob, 4, 2, fur);
      bar(3, 6 + bob, 2, 2, furD);
    }
    return c;
  }

  /* —— Personne 32x40 (joueur + PNJ), 3/4, deux yeux, tenues —— */
  function bakePerson(st, facing, walk, acting) {
    const { c, ctx } = make(PW, PH);
    const flip = facing < 0;
    function X(x) { return flip ? PW - 1 - x : x; }
    function bar(x, y, w, h, col) {
      if (w <= 0 || h <= 0 || !col) return;
      if (!flip) px(ctx, x, y, w, h, col);
      else px(ctx, X(x + w - 1), y, w, h, col);
    }
    function dot(x, y, col) { p1(ctx, X(x), y, col); }
    function eye(x, y) {
      bar(x, y, 4, 4, C.white);
      bar(x + 1, y + 1, 2, 2, st.sunglass ? C.ink : C.navy);
      if (!st.sunglass) {
        dot(x + 2, y + 2, C.ink);
        dot(x + 1, y + 1, C.white);
      }
      bar(x, y - 1, 4, 1, C.ink);
    }

    const woman = st.gender === "f";
    const kid = !!st.kid;
    const stride = walk === 1 || walk === 3;
    const bob = stride ? -1 : 0;
    const y0 = (kid ? 6 : 2) + bob;
    const lLeg = walk === 1 ? -3 : walk === 3 ? 2 : 0;
    const rLeg = walk === 1 ? 2 : walk === 3 ? -3 : 0;
    const smoke = st.tool === "smoke";
    const wave = !!acting && st.tool !== "pince" && !smoke;
    const lArm = wave ? -6 : walk === 1 ? 2 : walk === 3 ? -2 : 0;
    const rArm = smoke && acting ? -10 : wave ? -8 : -(walk === 1 ? 2 : walk === 3 ? -2 : 0);

    const skin = st.skin || C.skin;
    const skinL = st.skinL || C.skinL;
    const skinD = st.skinD || C.skinD;
    const skinM = st.skinM || C.skinM;
    const shirt = st.shirt || C.green;
    const shirtL = st.shirtL || C.greenL;
    const shirtD = st.shirtD || C.greenD;
    const pants = st.pants || C.navy;
    const pantsL = st.pantsL || C.navyL;
    const shoes = st.shoes || C.woodX;

    bar(7, 37, 18, 2, "rgba(0,0,0,0.28)");

    if (woman && st.dress) {
      const dh = st.short ? 12 : 18;
      bar(7, y0 + 16, 17, dh, C.ink);
      bar(8, y0 + 17, 15, dh - 2, shirtD);
      bar(8, y0 + 17, 15, 5, shirt);
      bar(9, y0 + 17, 5, 3, shirtL);
      if (st.short) {
        bar(9, y0 + 28 + lLeg, 5, 5, skin);
        bar(16, y0 + 28 + rLeg, 5, 5, skin);
      }
      bar(9, y0 + 30 + lLeg, 5, 4, shoes);
      bar(16, y0 + 30 + rLeg, 5, 4, shoes);
    } else {
      bar(8, y0 + 26 + lLeg, 6, 8, pants);
      bar(9, y0 + 27 + lLeg, 3, 5, pantsL);
      bar(8, y0 + 32 + lLeg, 7, 3, shoes);
      bar(16, y0 + 26 + rLeg, 6, 8, pants);
      bar(17, y0 + 27 + rLeg, 3, 5, pantsL);
      bar(16, y0 + 32 + rLeg, 7, 3, shoes);
      bar(8, y0 + 16, 15, 12, C.ink);
      bar(9, y0 + 17, 13, 10, shirtD);
      bar(9, y0 + 17, 13, 4, shirt);
      bar(10, y0 + 17, 4, 3, shirtL);
      bar(9, y0 + 25, 13, 2, pants);
    }

    if (st.apron) {
      bar(11, y0 + 18, 9, 10, C.white);
      bar(12, y0 + 19, 7, 2, C.red);
    }
    if (st.stripe) {
      bar(9, y0 + 20, 13, 2, C.white);
      bar(9, y0 + 24, 13, 2, C.white);
    }

    bar(4, y0 + 18 + lArm, 5, 5, shirtD);
    bar(3, y0 + 22 + lArm, 5, 5, st.gloves ? C.white : skin);
    bar(22, y0 + 18 + rArm, 5, 5, shirt);
    bar(23, y0 + 22 + rArm, 5, 5, st.gloves ? C.white : skin);

    bar(8, y0 + 6, 16, 12, C.ink);
    bar(9, y0 + 7, 14, 10, skin);
    bar(9, y0 + 7, 4, 4, skinL);
    bar(7, y0 + 11, 2, 4, skinD);
    bar(23, y0 + 11, 2, 4, skinD);
    if (woman && st.hair) {
      bar(6, y0 + 8, 3, 10, st.hair);
      bar(23, y0 + 8, 4, 12, st.hair);
      if (st.hat !== "scarf") bar(9, y0 + 5, 14, 4, st.hair);
    }
    eye(10, y0 + 9);
    eye(17, y0 + 9);
    if (st.sunglass) bar(10, y0 + 10, 11, 2, C.ink);
    bar(15, y0 + 12, 4, 3, skinM);
    bar(13, y0 + 16, 6, 1, C.redD);
    if (woman) bar(12, y0 + 13, 2, 1, C.redL);

    const hat = st.hat;
    if (hat === "green" || hat === "gold") {
      const hc = hat === "gold" ? C.gold : C.green;
      const hl = hat === "gold" ? C.goldL : C.greenL;
      bar(8, y0 + 5, 16, 3, C.ink);
      bar(9, y0 + 1, 13, 6, C.ink);
      bar(10, y0 + 2, 11, 4, hc);
      bar(11, y0 + 1, 8, 2, hl);
      bar(6, y0 + 6, 20, 2, hc);
      if (hat === "gold") bar(14, y0 + 3, 4, 3, C.goldL);
      else bar(13, y0 + 3, 5, 2, C.white);
    } else if (hat === "chechia") {
      bar(10, y0 + 0, 12, 7, C.ink);
      bar(11, y0 + 1, 10, 5, C.red);
      bar(12, y0 + 1, 8, 2, C.redL);
      bar(14, y0 + 0, 4, 1, C.redD);
    } else if (hat === "scarf") {
      const sc = st.scarf || C.terra;
      bar(7, y0 + 3, 18, 8, C.ink);
      bar(8, y0 + 4, 16, 6, sc);
      bar(6, y0 + 10, 5, 12, sc);
      bar(7, y0 + 10, 3, 12, st.scarfL || C.terraL);
    } else if (hat === "sun") {
      bar(4, y0 + 5, 24, 3, C.ink);
      bar(5, y0 + 5, 22, 2, C.sandB);
      bar(10, y0 + 1, 12, 6, C.ink);
      bar(11, y0 + 2, 10, 4, C.sandA);
    } else if (hat === "cap") {
      bar(8, y0 + 3, 16, 5, C.ink);
      bar(9, y0 + 4, 14, 3, st.hatCol || C.blue);
      bar(20, y0 + 6, 7, 2, st.hatCol || C.blueD);
    } else if (st.hair && !woman) {
      bar(9, y0 + 5, 14, 3, st.hair);
    }

    if (st.tool === "pince") {
      const ax = acting ? 20 : 18;
      const ay = y0 + (acting ? 14 : 20) + rArm;
      bar(ax, ay, acting ? 8 : 6, 3, C.navyD);
      if (acting) {
        bar(ax + 5, ay - 3, 6, 2, C.gold);
        bar(ax + 5, ay + 4, 6, 2, C.gold);
        bar(ax + 7, ay, 4, 3, C.red);
      } else {
        bar(ax + 4, ay - 2, 5, 2, C.gold);
        bar(ax + 5, ay, 4, 3, C.red);
      }
    } else if (st.tool === "bag") {
      bar(2, y0 + 24, 6, 8, C.bag);
      bar(3, y0 + 25, 4, 3, C.bagL);
    } else if (st.tool === "camera") {
      bar(24, y0 + 14 + rArm, 6, 5, C.ink);
      bar(25, y0 + 15 + rArm, 4, 3, C.metal);
    } else if (st.tool === "fish") {
      bar(24, y0 + 20, 7, 3, C.blueL);
      bar(30, y0 + 20, 2, 2, C.gold);
    } else if (st.tool === "smoke") {
      const cx = acting ? 19 : 23;
      const cy = y0 + (acting ? 11 : 21) + rArm;
      bar(cx, cy, 6, 2, "#e8dcc8");
      bar(cx + 5, cy, 2, 2, C.gold);
      bar(cx + 6, cy, 1, 2, acting ? C.red : C.goldD);
      if (acting) bar(cx + 7, cy - 1, 1, 1, C.redL);
    }

    return c;
  }

  function bakePlayer(facing, walk, attacking, goldHat) {
    return bakePerson({
      gender: "m",
      hat: goldHat ? "gold" : "green",
      shirt: C.green, shirtL: C.greenL, shirtD: C.greenD,
      pants: C.navy, pantsL: C.navyL,
      shoes: C.woodX,
      tool: "pince",
      gloves: true,
    }, facing, walk, attacking);
  }

  const NPC_STYLES = {
    localM: { gender: "m", hat: "chechia", shirt: C.white, shirtL: C.wall, shirtD: C.wallD, pants: C.navy, pantsL: C.navyL, shoes: C.woodX, hair: "#2a1c14" },
    localM2: { gender: "m", shirt: C.sandC, shirtL: C.sandA, shirtD: C.sandE, pants: C.woodD, pantsL: C.wood, shoes: C.woodX, hair: "#1a1010" },
    localF: { gender: "f", dress: true, hat: "scarf", scarf: C.terra, scarfL: C.terraL, shirt: C.terra, shirtL: C.terraL, shirtD: C.terraD, shoes: C.woodD, hair: "#1a1010", tool: "smoke" },
    localF2: { gender: "f", dress: true, hat: "scarf", scarf: C.blueD, scarfL: C.blueL, shirt: C.blue, shirtL: C.blueL, shirtD: C.blueD, shoes: C.navyD, hair: "#140c0c", tool: "smoke" },
    merchM: { gender: "m", hat: "chechia", shirt: C.wood, shirtL: C.woodL, shirtD: C.woodD, pants: C.navyD, pantsL: C.navy, apron: true, tool: "bag" },
    merchF: { gender: "f", dress: true, hat: "scarf", scarf: C.goldD, scarfL: C.gold, shirt: C.red, shirtL: C.redL, shirtD: C.redD, shoes: C.goldD, hair: "#2a1810", tool: "bag" },
    tourM: { gender: "m", hat: "cap", hatCol: C.blue, sunglass: true, shirt: C.blueL, shirtL: C.white, shirtD: C.blue, pants: C.sandC, pantsL: C.sandB, shoes: C.white, skin: "#fcd4b0", skinL: "#fff0d8", skinD: "#e0a878", skinM: "#f0b890", tool: "camera" },
    tourM2: { gender: "m", hat: "cap", hatCol: C.gold, sunglass: true, shirt: C.goldL, shirtL: C.white, shirtD: C.goldD, pants: C.navyL, pantsL: C.blueL, shoes: C.red, skin: "#fcd4b0", skinL: "#fff0d8", skinD: "#e0a878", skinM: "#f0b890" },
    tourF: { gender: "f", dress: true, hat: "sun", shirt: "#f878a0", shirtL: "#ffb0c8", shirtD: "#c04870", shoes: C.gold, hair: "#6a3c18", skin: "#fcd4b0", skinL: "#fff0d8", skinD: "#e0a878", skinM: "#f0b890", tool: "smoke" },
    tourF2: { gender: "f", dress: true, hat: "sun", shirt: "#40d090", shirtL: "#98f0c0", shirtD: "#1a9060", shoes: C.white, hair: "#c87828", skin: "#fcd4b0", skinL: "#fff0d8", skinD: "#e0a878", skinM: "#f0b890", tool: "camera" },
    fisher: { gender: "m", shirt: C.navyL, shirtL: C.white, shirtD: C.navy, pants: C.navyD, pantsL: C.navy, stripe: true, shoes: C.woodX, hair: "#1a1010", tool: "fish" },
    elder: { gender: "m", hat: "chechia", shirt: C.wall, shirtL: C.white, shirtD: C.wallS, pants: C.wallS, pantsL: C.wallD, shoes: C.woodD, hair: C.white, skin: "#d4a074", skinL: "#e8c098", skinD: "#b07848", skinM: "#c49060" },
    elderF: { gender: "f", dress: true, hat: "scarf", scarf: C.wall, scarfL: C.white, shirt: C.wallS, shirtL: C.wall, shirtD: C.woodD, shoes: C.woodD, hair: C.white, skin: "#d4a074", skinL: "#e8c098", skinD: "#b07848", skinM: "#c49060", tool: "smoke" },
    kidM: { gender: "m", kid: true, hat: "cap", hatCol: C.red, shirt: C.gold, shirtL: C.goldL, shirtD: C.goldD, pants: C.blue, pantsL: C.blueL, shoes: C.red, hair: "#2a1810" },
    kidF: { gender: "f", kid: true, dress: true, shirt: "#fc68a0", shirtL: "#ffb0d0", shirtD: "#c03870", shoes: C.red, hair: "#2a1010" },
    cafe: { gender: "m", shirt: C.white, shirtL: C.foam, shirtD: C.wallD, pants: C.ink, pantsL: C.navyD, shoes: C.ink, hair: "#1a1010", apron: true },
    escort: { gender: "f", dress: true, short: true, shirt: "#d43070", shirtL: "#fc88b8", shirtD: "#8c1848", shoes: C.red, hair: "#1a0808", tool: "smoke" },
    cabaret: { gender: "f", dress: true, short: true, shirt: C.gold, shirtL: C.goldL, shirtD: C.goldD, shoes: C.gold, hair: "#2a1018", tool: "smoke" },
  };

  function bake() {
    if (ready) return;
    tiles.sand0 = bakeSand(0);
    tiles.sand1 = bakeSand(1);
    tiles.sand2 = bakeSand(2);
    tiles.sand3 = bakeSand(3);
    tiles.sandCap = bakeSandCap();
    tiles.beach0 = bakeBeach(0);
    tiles.beach1 = bakeBeach(1);
    tiles.grass = bakeGrass(0);
    tiles.grass2 = bakeGrass(1);
    tiles.brick = bakeBrick();
    tiles.stone = bakeStone();
    tiles.road = bakeRoad("plain");
    tiles.roadH = bakeRoad("h");
    tiles.roadV = bakeRoad("v");
    tiles.roadX = bakeRoad("x");
    tiles.path = bakeWhiteRoad("plain");
    tiles.pathH = bakeWhiteRoad("h");
    tiles.pathV = bakeWhiteRoad("v");
    tiles.pathX = bakeWhiteRoad("x");
    tiles.cobble0 = bakeCobble(0);
    tiles.cobble1 = bakeCobble(1);
    tiles.plaza = bakePlaza();
    tiles.sea = [
      [bakeSea(0, 0), bakeSea(0, 1), bakeSea(0, 2)],
      [bakeSea(1, 0), bakeSea(1, 1), bakeSea(1, 2)],
      [bakeSea(2, 0), bakeSea(2, 1), bakeSea(2, 2)],
    ];
    tiles.foam = [bakeFoam(0), bakeFoam(1), bakeFoam(2)];

    frames.can = bakeCan();
    frames.bottle = bakeBottle();
    frames.bag = bakeBag();
    frames.butt = bakeButt();
    frames.cup = bakeCup();
    frames.paper = bakePaper();
    frames.peel = bakePeel();
    frames.brik = bakeBrik();
    frames.lablabi = bakeLablabi();
    frames.couscous = bakeCouscous();
    frames.ojja = bakeOjja();
    frames.makroud = bakeMakroud();
    frames.mlawi = bakeMlawi();
    frames.the = bakeThe();
    frames.fricasse = bakeFricasse();
    frames.bambalouni = bakeBambalouni();
    frames.harissa = bakeHarissa();
    frames.kaftaji = bakeKaftaji();
    frames.mechouia = bakeMechouia();
    frames.chorba = bakeChorba();
    frames.tajine = bakeTajine();
    frames.kasra = bakeKasra();
    frames.zlebia = bakeZlebia();
    frames.merguez = bakeMerguez();
    frames.baklawa = bakeBaklawa();
    frames.bin = bakeBin();
    frames.palm0 = bakePalm(0);
    frames.palm1 = bakePalm(2);
    frames.house = bakeHouse();
    frames.houseWarm = bakeHouseWarm();
    frames.shop = bakeShop();
    frames.stall = bakeStall();
    frames.cabaret = bakeCabaret();
    frames.hotel = bakeHotel();
    frames.airport = bakeAirport();
    frames.plane = bakePlane();
    frames.lounge = bakeLounge();
    frames.signCabaret = bakeBanner("CABARET", C.redD);
    frames.minaret = bakeMinaret();
    frames.lamp = bakeLamp();
    frames.fountain = bakeFountain();
    frames.signPlage = bakeBanner("PLAGE", C.blue);
    frames.signSouk = bakeBanner("SOUK", C.terraD);
    frames.signVille = bakeBanner("VILLE", C.navy);
    frames.signPort = bakeBanner("PORT", C.navyD);
    frames.signHotel = bakeBanner("HOTEL", C.navy);
    frames.signPool = bakeBanner("PISCINE", C.blue);
    frames.signAirport = bakeBanner("AEROPORT", C.navyD);
    frames.signHoumt = bakeBanner("HOUMT", C.navy);
    frames.signAjim = bakeBanner("AJIM", C.navyD);
    frames.signMidounV = bakeBanner("MIDOUN", C.navy);
    frames.signErriadh = bakeBanner("ERRIADH", C.blueD);
    frames.signGuellala = bakeBanner("GUELLALA", C.terraD);
    frames.signElMay = bakeBanner("EL MAY", C.greenD);
    frames.signExplore = bakeBanner("EXPLORE", C.goldD);
    frames.signAghir = bakeBanner("AGHIR", C.sandE);
    frames.signMezraya = bakeBanner("MEZRAYA", C.green);
    frames.signSedouik = bakeBanner("SEDOUIKECH", C.sandE);
    frames.signMahboub = bakeBanner("MAHBOUBINE", C.woodD);
    frames.mosque = bakeMosque();
    frames.fort = bakeFort();
    frames.museum = bakeMuseum();
    frames.synagogue = bakeSynagogue();
    frames.menzel = bakeMenzel();
    frames.kiln = bakeKiln();
    frames.mill = bakeMill();
    frames.cistern = bakeCistern();
    frames.graffiti = bakeGraffiti();
    frames.cemetery = bakeCemetery();
    frames.oven = bakeOven();
    frames.foggara = bakeFoggara();
    frames.lhOn = bakeLighthouse(true);
    frames.lhOff = bakeLighthouse(false);
    frames.boat = bakeBoat();
    frames.cloud = bakeCloud();
    frames.hill = bakeHill();
    frames.bush = bakeBush();
    frames.carTaxi = bakeCar("taxi");
    frames.carWhite = bakeCar("white");
    frames.carBlue = bakeCar("blue");
    frames.carRed = bakeCar("red");
    frames.carLouage = bakeCar("louage");
    frames.umbrella = bakeUmbrella();
    frames.rock = bakeRock();
    frames.sign = bakeSign();
    frames.flagTn0 = bakeFlag("tn", 0);
    frames.flagTn1 = bakeFlag("tn", 1);
    frames.flagIl0 = bakeFlag("il", 0);
    frames.flagIl1 = bakeFlag("il", 1);
    frames.gull0 = bakeSeagull(0);
    frames.gull1 = bakeSeagull(1);
    frames.sun = bakeSun();
    frames.stray = { dog: {}, cat: {}, catGinger: {} };
    for (const kind of ["dog", "cat", "catGinger"]) {
      for (const face of [1, -1]) {
        for (let w = 0; w < 4; w++) {
          frames.stray[kind][`${face}_${w}`] = bakeStray(kind, face, w);
        }
      }
    }

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
    frames.npc = {};
    for (const id of Object.keys(NPC_STYLES)) {
      frames.npc[id] = {};
      for (const face of [1, -1]) {
        for (let w = 0; w < 4; w++) {
          for (const act of [0, 1]) {
            frames.npc[id][`${face}_${w}_${act}`] = bakePerson(NPC_STYLES[id], face, w, !!act);
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

  return { C, tiles, frames, bake, blit, inView, ready: () => ready, PW, PH, NPC_STYLES };
})();
