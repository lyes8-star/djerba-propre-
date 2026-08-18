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

  function at(anchor, dx, dy) {
    const p = Island.xy(anchor);
    return { x: (p.x + dx) | 0, y: (p.y + dy) | 0 };
  }

  function site(kind, anchor, dx, dy, title, short) {
    const k = KIND[kind];
    const p = at(anchor, dx, dy);
    return {
      x: p.x, y: p.y, w: k.w, h: k.h,
      doorX: k.doorX, doorY: k.doorY, doorW: k.doorW, doorH: k.doorH,
      room: k.room, sprite: k.sprite, title, short: short || title,
    };
  }

  function house(anchor, dx, dy, room, title) {
    const p = at(anchor, dx, dy);
    return { x: p.x, y: p.y, w: 48, h: 56, doorX: 18, doorY: 36, doorW: 12, doorH: 16, room: room || "home", title: title || "Maison" };
  }

  function shop(anchor, dx, dy, title, stall) {
    const p = at(anchor, dx, dy);
    if (stall) return { x: p.x, y: p.y, w: 28, h: 28, doorX: 8, doorY: 16, doorW: 12, doorH: 12, room: "shop", title };
    return { x: p.x, y: p.y, w: 40, h: 40, doorX: 12, doorY: 24, doorW: 16, doorH: 14, room: "shop", title };
  }

  function block(anchor, ox, oy, cols, rows, title) {
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push(house(anchor, ox + c * 64, oy + r * 72, "home", title || "Maison"));
      }
    }
    return out;
  }

  const hHotel = Island.xy("hotel");
  const hAir = Island.xy("airport");
  const hAjim = Island.xy("ajim");
  const hHoumt = Island.xy("houmt");

  const TOWN = [
    house("houmt", -90, -20), house("houmt", -26, -12), house("houmt", 150, -20), house("houmt", 214, -16),
    house("houmt", -90, 72), house("houmt", -26, 80, "cafe", "Cafe DIRECT"), house("houmt", 150, 72), house("houmt", 214, 76),
    house("houmt", -90, 172), house("houmt", -26, 180), house("houmt", 214, 176),
    shop("houmt", -220, -20, "Boutique"), shop("houmt", -156, -20, "Harissa"),
    shop("houmt", -220, 60, "The"), shop("houmt", -156, 60, "Brik"),
    shop("houmt", -220, 140, "Etal", true), shop("houmt", -156, 140, "Souk"),
    shop("houmt", -220, 220, "Epices"), shop("houmt", -156, 220, "Tapis"),
    shop("houmt", -90, 252, "Etal", true),
    ...block("midoun", -110, 90, 2, 2, "Maison Midoun"),
    house("midoun", 160, 20), house("midoun", 224, 20), house("midoun", 160, 92),
    shop("midoun", -110, 20, "Marche"), shop("midoun", -50, 20, "Etal", true),
    shop("midoun", 10, 20, "Harissa"),
    ...block("ajim", 80, -90, 2, 2, "Maison Ajim"),
    shop("ajim", -90, 10, "Poisson"), shop("ajim", -90, 70, "Etal", true),
    ...block("guellala", -150, 40, 2, 2, "Maison potier"),
    house("elmay", -150, 90), house("elmay", -86, 90), house("elmay", 190, 90),
    house("elmay", 190, 162),
    house("aghir", 90, 20, "home", "Maison plage"),
    house("aghir", 154, 20, "home", "Maison plage"),
    house("aghir", 90, 92, "home", "Maison plage"),
    house("erriadh", -140, 50, "home", "Maison Erriadh"),
    house("erriadh", 220, 130, "home", "Maison Erriadh"),
    { x: hAjim.x + 40, y: hAjim.y - 20, w: 56, h: 48, doorX: 18, doorY: 28, doorW: 20, doorH: 18, room: "cabaret", title: "Cabaret" },
    { x: hHoumt.x + 170, y: hHoumt.y + 160, w: 56, h: 48, doorX: 18, doorY: 28, doorW: 20, doorH: 18, room: "cabaret", title: "Cabaret" },
    { x: hHotel.x - 20, y: hHotel.y - 10, w: 88, h: 64, doorX: 36, doorY: 48, doorW: 16, doorH: 14, room: "hotel", title: "Hotel" },
    { x: hAir.x - 20, y: hAir.y - 10, w: 88, h: 56, doorX: 36, doorY: 40, doorW: 16, doorH: 14, room: "airport", title: "Aeroport DJE" },
  ];

  const SITES = [
    site("fort", "portHoumt", -20, -30, "Borj El Kebir", "BORJ KEBIR"),
    site("fort", "portHoumt", -110, -20, "Borj El Ghazi Mustapha", "BORJ GHAZI"),
    site("mosque", "houmt", 80, -10, "Mosquee des Turcs", "TURCS"),
    site("mosque", "houmt", 80, 90, "Jemaa El Ghorba", "GHORBA"),
    site("mosque", "sidi", -120, 40, "Mosquee Sidi Yati", "SIDI YATI"),
    site("mosque", "ajim", -40, -80, "Mosquee Sidi Jmour", "SIDI JMOUR"),
    site("menzel", "houmt", 90, 180, "Medina Houmt Souk", "MEDINA"),
    site("fish", "portHoumt", 70, 40, "Marche aux poissons", "POISSONS"),
    site("artisan", "houmt", -280, -20, "Marche artisanal", "ARTISAN"),
    site("artisan", "houmt", -280, 60, "Atelier de tissage", "TISSAGE"),
    site("artisan", "houmt", -280, 140, "Atelier de bijoux", "BIJOUX"),
    site("artisan", "houmt", -280, 220, "Paniers en alfa", "ALFA"),
    site("artisan", "houmt", -90, 220, "Marche d'epices", "EPICES"),
    site("menzel", "houmt", 20, 220, "Ancien menzel", "MENZEL"),

    site("mosque", "midoun", -40, -40, "Mosquee Sidi Salem", "SIDI SALEM"),
    site("mosque", "midoun", 80, -40, "Mosquee El Bassi", "EL BASSI"),
    site("menzel", "midoun", -40, 50, "Village Midoun", "MIDOUN"),
    site("menzel", "midoun", 80, 50, "Houch djerbien", "HOUCH"),
    site("menzel", "midoun", 20, 140, "Menzel Midoun", "MENZEL"),
    site("oven", "midoun", 140, 140, "Four traditionnel", "FOUR"),

    site("graffiti", "erriadh", -80, -40, "Djerbahood", "DJERBAHOOD"),
    site("graffiti", "erriadh", -20, -40, "Mur Erriadh", "STREET ART"),
    site("graffiti", "erriadh", 100, -40, "Djerbahood Est", "HOOD"),
    site("synagogue", "erriadh", 20, -40, "Synagogue de la Ghriba", "GHRIBA"),
    site("mosque", "erriadh", 170, -40, "Petite mosquee", "MOSQUEE"),
    site("menzel", "erriadh", -80, 50, "Hara Sghira", "HARA SGHIRA"),
    site("menzel", "erriadh", 0, 50, "Maison juive", "MAISON"),
    site("menzel", "erriadh", 80, 50, "Maison de la communaute", "MAISON"),
    site("cemetery", "erriadh", 160, 50, "Cimetiere juif", "CIMETIERE"),
    site("graffiti", "erriadh", -80, 130, "Atelier Djerbahood", "ATELIER"),
    site("cistern", "erriadh", 160, 140, "Citerne Erriadh", "CITERNE"),

    site("mosque", "elmay", -40, -40, "Mosquee Fadhloun", "FADHLOUN"),
    site("mosque", "elmay", 80, -40, "Mosquee Jamaa El May", "EL MAY"),
    site("mosque", "elmay", -80, 50, "Mosquee Sidi Brahim", "SIDI BRAHIM"),
    site("mosque", "elmay", 120, 50, "Mosquee Sidi Zayed", "SIDI ZAYED"),
    site("menzel", "elmay", 0, 50, "Menzel El May", "MENZEL"),
    site("menzel", "elmay", 60, 50, "Houch El May", "HOUCH"),
    site("cistern", "elmay", -80, 140, "Citerne traditionnelle", "CITERNE"),
    site("foggara", "elmay", 0, 148, "Foggara", "FOGGARA"),
    site("oven", "elmay", 120, 140, "Four du village", "FOUR"),
    site("mill", "elmay", 50, 130, "Huilerie traditionnelle", "HUILERIE"),

    site("museum", "guellala", -80, -40, "Musee du patrimoine", "MUSEE"),
    site("kiln", "guellala", 20, -40, "Atelier de poterie", "POTERIE"),
    site("kiln", "guellala", 80, -40, "Four de potier", "FOUR"),
    site("kiln", "guellala", 140, -40, "Atelier Guellala", "POTERIE"),
    site("kiln", "guellala", 20, 40, "Atelier d'argile", "ARGILE"),
    site("oven", "guellala", 160, -40, "Four a pain", "FOUR"),
    site("menzel", "guellala", -80, 50, "Village Guellala", "GUELLALA"),
    site("menzel", "guellala", 160, 40, "Houch Guellala", "HOUCH"),
    site("mosque", "guellala", 80, 50, "Petite mosquee", "MOSQUEE"),
    site("cistern", "guellala", 180, 130, "Citerne Guellala", "CITERNE"),

    site("museum", "explore", -40, -30, "Djerba Explore", "EXPLORE"),
    site("museum", "explore", 80, -30, "Musee Lalla Hadria", "LALLA HADRIA"),
    site("artisan", "explore", 180, -22, "Centre des arts et metiers", "ARTS"),
    site("mill", "explore", -40, 70, "Ancienne huilerie", "HUILERIE"),
    site("menzel", "explore", 80, 70, "Menzel Explore", "MENZEL"),
    site("foggara", "explore", 180, 80, "Foggara Explore", "FOGGARA"),
    site("cistern", "explore", 240, 70, "Citerne", "CITERNE"),

    site("menzel", "aghir", -20, -20, "Village Aghir", "AGHIR"),
    site("menzel", "mezraya", -20, -20, "Village Mezraya", "MEZRAYA"),
    site("cistern", "aghir", -20, 70, "Citerne Aghir", "CITERNE"),
    site("foggara", "mezraya", -20, 70, "Foggara Mezraya", "FOGGARA"),
    site("mill", "aghir", -20, 140, "Huilerie Aghir", "HUILERIE"),
    site("oven", "mezraya", 40, 140, "Four Mezraya", "FOUR"),
    site("menzel", "sedouikech", -20, -20, "Village Sedouikech", "SEDOUIKECH"),
    site("menzel", "mahboubine", -20, -20, "Village Mahboubine", "MAHBOUBINE"),
    site("mosque", "sedouikech", 60, 70, "Petite mosquee", "MOSQUEE"),
    site("menzel", "sedouikech", -20, 140, "Houch Sedouikech", "HOUCH"),
    site("menzel", "mahboubine", -20, 140, "Ferme d'oliveraie", "FERME"),
    site("foggara", "mahboubine", 80, 80, "Foggara sud", "FOGGARA"),

    site("menzel", "lagoon", -20, -20, "Menzel palmeraie", "MENZEL"),
    site("foggara", "lagoon", 60, 20, "Foggara lagune", "FOGGARA"),
    site("cistern", "hotel", 80, 80, "Citerne hotel", "CITERNE"),
    site("oven", "lagoon", -80, -40, "Four rural", "FOUR"),
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
    if (p && p.swim) return null;
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
    if (typeof Quests !== "undefined") Quests.onEnter(world, b);
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

  return { BUILDINGS, TOWN, SITES, ROOM, nearDoor, tryDoor, collide, tick, doorRect };
})();
