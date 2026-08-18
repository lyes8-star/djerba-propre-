/* Portes, intérieurs décorés, collision des bâtiments */
const Places = (() => {
  const ROOM = { w: 300, h: 220 };

  const KIND = {
    mosque: { w: 48, h: 56, doorX: 16, doorY: 36, doorW: 16, doorH: 18, room: "mosque", sprite: "mosque" },
    fort: { w: 72, h: 64, doorX: 26, doorY: 44, doorW: 20, doorH: 18, room: "fort", sprite: "fort" },
    museum: { w: 64, h: 56, doorX: 22, doorY: 38, doorW: 20, doorH: 16, room: "museum", sprite: "museum" },
    synagogue: { w: 56, h: 56, doorX: 18, doorY: 38, doorW: 20, doorH: 16, room: "synagogue", sprite: "synagogue" },
    menzel: { w: 56, h: 48, doorX: 18, doorY: 30, doorW: 20, doorH: 16, room: "menzel", sprite: "menzel" },
    kiln: { w: 40, h: 40, doorX: 12, doorY: 20, doorW: 16, doorH: 18, room: "kiln", sprite: "kiln" },
    mill: { w: 48, h: 48, doorX: 14, doorY: 30, doorW: 20, doorH: 16, room: "mill", sprite: "mill" },
    cistern: { w: 36, h: 32, doorX: 10, doorY: 14, doorW: 16, doorH: 16, room: "cistern", sprite: "cistern" },
    graffiti: { w: 48, h: 40, doorX: 14, doorY: 22, doorW: 20, doorH: 16, room: "graffiti", sprite: "graffiti" },
    cemetery: { w: 64, h: 40, doorX: 22, doorY: 22, doorW: 20, doorH: 16, room: "cemetery", sprite: "cemetery" },
    oven: { w: 32, h: 32, doorX: 8, doorY: 14, doorW: 16, doorH: 16, room: "oven", sprite: "oven" },
    foggara: { w: 48, h: 28, doorX: 14, doorY: 10, doorW: 20, doorH: 16, room: "cistern", sprite: "foggara" },
    artisan: { w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "workshop", sprite: "shop" },
    fish: { w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", sprite: "shop" },
  };

  function site(kind, x, y, title, short) {
    const k = KIND[kind];
    return {
      x, y, w: k.w, h: k.h,
      doorX: k.doorX, doorY: k.doorY, doorW: k.doorW, doorH: k.doorH,
      room: k.room, sprite: k.sprite, title, short: short || title,
    };
  }

  const TOWN = [
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

  const SITES = [
    /* Houmt Souk / port / médina */
    site("fort", 628, 300, "Borj El Kebir", "BORJ KEBIR"),
    site("fort", 540, 300, "Borj El Ghazi Mustapha", "BORJ GHAZI"),
    site("mosque", 688, 548, "Mosquee des Turcs", "TURCS"),
    site("mosque", 688, 648, "Jemaa El Ghorba", "GHORBA"),
    site("mosque", 40, 440, "Mosquee Sidi Yati", "SIDI YATI"),
    site("mosque", 16, 372, "Mosquee Sidi Jmour", "SIDI JMOUR"),
    site("menzel", 672, 748, "Medina Houmt Souk", "MEDINA"),
    site("fish", 352, 540, "Marche aux poissons", "POISSONS"),
    site("artisan", 144, 540, "Marche artisanal", "ARTISAN"),
    site("artisan", 144, 620, "Atelier de tissage", "TISSAGE"),
    site("artisan", 144, 710, "Atelier de bijoux", "BIJOUX"),
    site("artisan", 144, 790, "Paniers en alfa", "ALFA"),
    site("artisan", 352, 620, "Marche d'epices", "EPICES"),
    site("menzel", 352, 710, "Ancien menzel", "MENZEL"),

    /* Midoun */
    site("mosque", 1000, 548, "Mosquee Sidi Salem", "SIDI SALEM"),
    site("mosque", 1140, 548, "Mosquee El Bassi", "EL BASSI"),
    site("menzel", 1000, 640, "Village Midoun", "MIDOUN"),
    site("menzel", 1140, 640, "Houch djerbien", "HOUCH"),
    site("menzel", 1060, 740, "Menzel Midoun", "MENZEL"),
    site("oven", 1210, 740, "Four traditionnel", "FOUR"),

    /* Erriadh / Djerbahood / juif */
    site("graffiti", 40, 1232, "Djerbahood", "DJERBAHOOD"),
    site("graffiti", 100, 1232, "Mur Erriadh", "STREET ART"),
    site("graffiti", 280, 1232, "Djerbahood Est", "HOOD"),
    site("synagogue", 176, 1232, "Synagogue de la Ghriba", "GHRIBA"),
    site("mosque", 360, 1232, "Petite mosquee", "MOSQUEE"),
    site("menzel", 40, 1320, "Hara Sghira", "HARA SGHIRA"),
    site("menzel", 120, 1320, "Maison juive", "MAISON"),
    site("menzel", 200, 1320, "Maison de la communaute", "MAISON"),
    site("cemetery", 300, 1328, "Cimetiere juif", "CIMETIERE"),
    site("graffiti", 40, 1392, "Atelier Djerbahood", "ATELIER"),
    site("cistern", 400, 1400, "Citerne Erriadh", "CITERNE"),

    /* El May / Fadhloun */
    site("mosque", 600, 1232, "Mosquee Fadhloun", "FADHLOUN"),
    site("mosque", 760, 1232, "Mosquee Jamaa El May", "EL MAY"),
    site("mosque", 560, 1328, "Mosquee Sidi Brahim", "SIDI BRAHIM"),
    site("mosque", 800, 1328, "Mosquee Sidi Zayed", "SIDI ZAYED"),
    site("menzel", 640, 1328, "Menzel El May", "MENZEL"),
    site("menzel", 720, 1328, "Houch El May", "HOUCH"),
    site("cistern", 560, 1416, "Citerne traditionnelle", "CITERNE"),
    site("foggara", 640, 1420, "Foggara", "FOGGARA"),
    site("oven", 800, 1416, "Four du village", "FOUR"),
    site("mill", 720, 1408, "Huilerie traditionnelle", "HUILERIE"),

    /* Guellala */
    site("museum", 48, 1520, "Musee du patrimoine", "MUSEE"),
    site("kiln", 160, 1520, "Atelier de poterie", "POTERIE"),
    site("kiln", 220, 1520, "Four de potier", "FOUR"),
    site("kiln", 280, 1520, "Atelier Guellala", "POTERIE"),
    site("kiln", 160, 1592, "Atelier d'argile", "ARGILE"),
    site("oven", 360, 1520, "Four a pain", "FOUR"),
    site("menzel", 48, 1616, "Village Guellala", "GUELLALA"),
    site("menzel", 360, 1592, "Houch Guellala", "HOUCH"),
    site("mosque", 280, 1616, "Petite mosquee", "MOSQUEE"),
    site("cistern", 400, 1680, "Citerne Guellala", "CITERNE"),

    /* Djerba Explore */
    site("museum", 560, 1520, "Djerba Explore", "EXPLORE"),
    site("museum", 680, 1520, "Musee Lalla Hadria", "LALLA HADRIA"),
    site("artisan", 800, 1528, "Centre des arts et metiers", "ARTS"),
    site("mill", 560, 1616, "Ancienne huilerie", "HUILERIE"),
    site("menzel", 680, 1616, "Menzel Explore", "MENZEL"),
    site("foggara", 800, 1624, "Foggara Explore", "FOGGARA"),
    site("cistern", 880, 1616, "Citerne", "CITERNE"),

    /* Aghir / Mezraya / Sedouikech / Mahboubine */
    site("menzel", 1000, 1232, "Village Aghir", "AGHIR"),
    site("menzel", 1140, 1232, "Village Mezraya", "MEZRAYA"),
    site("cistern", 1000, 1320, "Citerne Aghir", "CITERNE"),
    site("foggara", 1140, 1328, "Foggara Mezraya", "FOGGARA"),
    site("mill", 1000, 1392, "Huilerie Aghir", "HUILERIE"),
    site("oven", 1160, 1400, "Four Mezraya", "FOUR"),
    site("menzel", 1000, 1520, "Village Sedouikech", "SEDOUIKECH"),
    site("menzel", 1140, 1520, "Village Mahboubine", "MAHBOUBINE"),
    site("mosque", 1060, 1600, "Petite mosquee", "MOSQUEE"),
    site("menzel", 1000, 1664, "Houch Sedouikech", "HOUCH"),
    site("menzel", 1140, 1664, "Ferme d'oliveraie", "FERME"),
    site("foggara", 1210, 1608, "Foggara sud", "FOGGARA"),

    /* Rural lagune */
    site("menzel", 400, 1088, "Menzel palmeraie", "MENZEL"),
    site("foggara", 480, 1120, "Foggara lagune", "FOGGARA"),
    site("cistern", 880, 1104, "Citerne hotel", "CITERNE"),
    site("oven", 360, 1040, "Four rural", "FOUR"),
  ];

  const BUILDINGS = TOWN.concat(SITES);

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
      elder: "Si Hedi", localM2: "Walid", kidM: "Yassine",
    };
    const holy = room === "mosque" || room === "synagogue" || room === "cemetery";
    const zoneOf = {
      mosque: "holy", synagogue: "holy", cemetery: "holy",
      graffiti: "erriadh", kiln: "guellala", oven: "guellala", workshop: "guellala",
      museum: "explore", menzel: "elmay", mill: "elmay", cistern: "elmay",
      fort: "port", shop: "souk", home: "ville", cafe: "ville",
      cabaret: "ville", hotel: "hotel", airport: "airport",
    };
    const add = (style, x, y, job) => {
      world.npcs.push({
        id: "in_" + style + "_" + x,
        zone: zoneOf[room] || (holy ? "holy" : "inside"),
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
    } else if (room === "mosque") {
      add("elder", 140, 80, "sit");
      add("localM", 40, 120, "sit");
      add("localM2", 210, 130, "stand");
    } else if (room === "synagogue") {
      add("elder", 140, 80, "sit");
      add("localM", 40, 120, "stand");
      add("localM2", 210, 120, "sit");
    } else if (room === "fort") {
      add("localM", 140, 80, "stand");
      add("tourM", 40, 120, "photo");
      add("elder", 210, 120, "sit");
    } else if (room === "museum") {
      add("merchM", 140, 70, "stand");
      add("tourF", 40, 120, "photo");
      add("tourM", 210, 120, "stand");
    } else if (room === "workshop" || room === "kiln" || room === "oven") {
      add("merchF", 140, 80, "stand");
      add("merchM", 40, 120, "stand");
    } else if (room === "mill") {
      add("merchM", 140, 80, "stand");
      add("localM2", 40, 120, "stand");
    } else if (room === "menzel") {
      add("elderF", 40, 90, "sit");
      add("cat", 180, 140, "sit");
      add("localM", 210, 100, "stand");
    } else if (room === "cistern") {
      add("localM", 140, 100, "stand");
    } else if (room === "cemetery") {
      add("elder", 140, 90, "sit");
    } else if (room === "graffiti") {
      add("tourF2", 140, 80, "photo");
      add("localM", 40, 120, "stand");
      add("kidM", 210, 120, "run");
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

  return { BUILDINGS, SITES, ROOM, nearDoor, tryDoor, collide, tick, doorRect };
})();
