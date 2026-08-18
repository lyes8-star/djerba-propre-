/* Portes, intérieurs décorés, collision des bâtiments */
const Places = (() => {
  const ROOM = { w: 300, h: 220 };

  const BUILDINGS = [
    { x: 560, y: 548, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 624, y: 556, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 800, y: 548, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 864, y: 552, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 560, y: 640, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 624, y: 648, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "cafe", title: "Cafe DIRECT" },
    { x: 800, y: 640, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 864, y: 644, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 560, y: 740, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 624, y: 748, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 864, y: 744, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: "home", title: "Maison" },
    { x: 16, y: 540, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "Boutique" },
    { x: 80, y: 540, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "Harissa" },
    { x: 224, y: 540, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "The" },
    { x: 288, y: 540, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "Brik" },
    { x: 16, y: 620, w: 28, h: 28, doorX: 8, doorY: 16, doorW: 12, doorH: 12, room: "shop", title: "Etal" },
    { x: 224, y: 620, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "Souk" },
    { x: 16, y: 710, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "Epices" },
    { x: 288, y: 716, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title: "Tapis" },
    { x: 868, y: 348, w: 56, h: 48, doorX: 18, doorY: 28, doorW: 20, doorH: 18, room: "cabaret", title: "Cabaret" },
    { x: 792, y: 728, w: 56, h: 48, doorX: 18, doorY: 28, doorW: 20, doorH: 18, room: "cabaret", title: "Cabaret" },
    { x: 620, y: 910, w: 88, h: 64, doorX: 36, doorY: 48, doorW: 16, doorH: 14, room: "hotel", title: "Hotel" },
    { x: 32, y: 1000, w: 88, h: 56, doorX: 36, doorY: 40, doorW: 16, doorH: 14, room: "airport", title: "Aeroport DJE" },
  ];

  function doorRect(b) {
    return { x: b.x + b.doorX, y: b.y + b.doorY, w: b.doorW, h: b.doorH };
  }

  function feet(p) {
    return { x: p.x + 8, y: p.y + 26, w: 16, h: 12 };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function nearDoor(p, world) {
    if (world.inside) {
      const exit = { x: ROOM.w / 2 - 10, y: ROOM.h - 28, w: 20, h: 24 };
      return overlap(feet(p), exit) ? { exit: true, title: "Sortir" } : null;
    }
    const f = feet(p);
    for (const b of BUILDINGS) {
      if (overlap(f, doorRect(b))) return b;
    }
    return null;
  }

  function spawnIndoor(world, room) {
    (world.npcs || []).forEach((n) => { if (n.indoor) n.dead = true; });
    world.npcs = (world.npcs || []).filter((n) => !n.indoor);
    const names = {
      elderF: "Lalla Fatma", cat: "Mimi", merchM: "Haj Ali", merchF: "Zohra",
      localF: "Amina", localM: "Karim", cabaret: "Dalila", escort: "Sondes",
      cafe: "Khaled", tourF: "Emma", tourM: "Marc", tourF2: "Mia",
    };
    const add = (style, x, y, job) => {
      world.npcs.push({
        id: "in_" + style + "_" + x,
        zone: "inside",
        style,
        job: job || "stand",
        name: names[style] || "Hote",
        x, y, vx: 0, vy: 0, facing: 1,
        tx: null, ty: null, wait: 1, speed: 18,
        acting: false, actT: 0, talkCd: 0, talked: false,
        bubble: 0, bubbleText: "", pages: null, page: 0, whoLabel: "",
        homeX: x, homeY: y, partner: null, indoor: true,
      });
    };
    if (room === "home") {
      add("elderF", 40, 90, "sit");
      add("cat", 180, 140, "sit");
    } else if (room === "shop") {
      add("merchM", 150, 80, "stand");
      add("localF", 40, 120, "stand");
    } else if (room === "cabaret") {
      add("cabaret", 160, 70, "stand");
      add("escort", 50, 110, "stand");
      add("escort", 210, 120, "stand");
    } else if (room === "cafe") {
      add("cafe", 140, 80, "stand");
      add("localM", 40, 120, "sit");
    } else if (room === "hotel") {
      add("merchF", 140, 70, "stand");
      add("tourF", 40, 120, "sit");
      add("tourM", 210, 130, "stand");
    } else if (room === "airport") {
      add("tourM", 40, 110, "stand");
      add("tourF2", 200, 100, "stand");
      add("localM", 140, 70, "stand");
    }
  }

  function enter(world, player, b) {
    world.inside = {
      room: b.room,
      title: b.title,
      outX: b.x + b.doorX - 8,
      outY: b.y + b.h + 2,
      w: ROOM.w,
      h: ROOM.h,
    };
    world.doorCd = 0.7;
    player.x = ROOM.w / 2 - 16;
    player.y = ROOM.h - 70;
    player.vx = 0;
    player.vy = 0;
    spawnIndoor(world, b.room);
  }

  function exit(world, player) {
    const d = world.inside;
    world.npcs = (world.npcs || []).filter((n) => !n.indoor);
    player.x = d.outX;
    player.y = d.outY;
    player.vx = 0;
    player.vy = 0;
    world.inside = null;
    world.doorCd = 0.8;
  }

  function tryDoor(player, world) {
    if (world.doorCd > 0) return null;
    const n = nearDoor(player, world);
    if (!n) return null;
    if (world.inside || n.exit) {
      exit(world, player);
      return { type: "door", dir: "out" };
    }
    enter(world, player, n);
    return { type: "door", dir: "in", title: n.title };
  }

  function collide(p, world) {
    if (world.inside) {
      p.x = Math.max(12, Math.min(ROOM.w - 36, p.x));
      p.y = Math.max(40, Math.min(ROOM.h - 42, p.y));
      return;
    }
    const f = feet(p);
    for (const b of BUILDINGS) {
      const body = { x: b.x + 4, y: b.y + 8, w: b.w - 8, h: b.h - 10 };
      const door = doorRect(b);
      if (!overlap(f, body)) continue;
      if (overlap(f, door)) continue;
      p.y = b.y + b.h - 6;
      p.vy = 0;
    }
  }

  function tick(world, player, dt) {
    if (world.doorCd > 0) world.doorCd -= dt;
    if (world.doorCd > 0) return;
    const n = nearDoor(player, world);
    if (!n) return;
    if (world.inside || n.exit) {
      if (player.vy > 12) tryDoor(player, world);
    } else if (player.vy < -8) {
      tryDoor(player, world);
    }
  }

  return { BUILDINGS, ROOM, nearDoor, tryDoor, collide, tick, doorRect };
})();
