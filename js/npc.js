/* Habitants et touristes de Djerba — mêmes sprites que le joueur, tenues différentes */
const Npc = (() => {
  const PW = 32;
  const PH = 40;

  function makeZones() {
    const b = Island.box.bind(Island);
    return {
      beach: b("sidi", 420, 200),
      port: b("ajim", 300, 220),
      souk: b("houmt", 340, 280, -160, 80),
      ville: b("houmt", 340, 280, 80, 80),
      plaza: b("plaza", 180, 160),
      lagoon: b("lagoon", 280, 220),
      road: b("elmay", 400, 160),
      hotel: b("hotel", 320, 220),
      airport: b("airport", 280, 200),
      midounv: b("midoun", 300, 240),
      erriadh: b("erriadh", 320, 240),
      elmay: b("elmay", 300, 240),
      guellala: b("guellala", 320, 240),
      explore: b("explore", 300, 220),
      aghir: b("aghir", 280, 200),
      inside: { x0: 12, y0: 40, x1: 288, y1: 210 },
      holy: { x0: 12, y0: 40, x1: 288, y1: 210 },
    };
  }
  const ZONES = makeZones();

  const NAMES = {
    localM: ["Karim", "Sami", "Hedi", "Nabil", "Youssef", "Tarek", "Anis", "Mehdi"],
    localM2: ["Riadh", "Fathi", "Walid", "Sofiene"],
    localF: ["Amina", "Sana", "Leila", "Fatma", "Nour", "Ines"],
    localF2: ["Rim", "Hela", "Salma", "Olfa", "Dorsaf"],
    merchM: ["Haj Ali", "Mohsen", "Lotfi", "Chedly"],
    merchF: ["Zohra", "Mouna", "Saloua", "Najet"],
    tourM: ["Marc", "Tom", "Lars", "Pietro"],
    tourM2: ["Hans", "Alex", "Paul", "Luca"],
    tourF: ["Emma", "Clara", "Sofia", "Julie"],
    tourF2: ["Mia", "Lea", "Anna", "Nina"],
    fisher: ["Amor", "Brahim", "Salah", "Hedi"],
    elder: ["Si Hedi", "Haj Amor", "Si Ali", "Haj Slim"],
    elderF: ["Lalla Fatma", "Om Amina", "Lalla Zohra"],
    kidM: ["Yassine", "Adam", "Rayan", "Anis", "Malek"],
    kidF: ["Yasmine", "Lina", "Sara", "Nour"],
    cafe: ["Khaled", "Bilel", "Fares"],
    escort: ["Sondes", "Rania", "Lilia", "Marwa", "Nesrine", "Yosra", "Emna"],
    cabaret: ["Dalila", "Wafa", "Houda", "Samia", "Imen", "Olfa", "Chiraz"],
    dog: ["Khamis", "Boby", "Max", "Sultan", "Pacha", "Rex"],
    cat: ["Mimi", "Zgougou", "Minouche", "Luna", "Tigresse"],
    catGinger: ["Roujina", "Mishmish", "Sfar", "Caramel"],
  };

  const LINES = NpcTalk.LINES;
  const WINKS = NpcTalk.WINKS;

  const UMBRELLAS = [];
  const SHOPS = [];
  const HOUSES = [];
  const QUAY = [];

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function clampNpc(n) {
    if (n.job === "commute") {
      if (!n.indoor) {
        const c = Island.clamp(n.x + 16, n.y + 20);
        n.x = c.x - 16;
        n.y = c.y - 20;
      }
      return;
    }
    const z = n.indoor ? ZONES.inside : ZONES[n.zone];
    if (!z) return;
    n.x = Math.max(z.x0, Math.min(z.x1 - PW, n.x));
    n.y = Math.max(z.y0, Math.min(z.y1 - PH, n.y));
    if (!n.indoor) {
      const c = Island.clamp(n.x + 16, n.y + 20);
      n.x = c.x - 16;
      n.y = c.y - 20;
    }
  }

  function defaultJob(style, zone) {
    if (style.startsWith("merch")) return "stand";
    if (style === "escort" || style === "cabaret") return "stand";
    if (style === "dog") return Math.random() < 0.45 ? "run" : "wander";
    if (style === "cat" || style === "catGinger") return Math.random() < 0.5 ? "sit" : "wander";
    if (style === "fisher") return "fish";
    if (style === "elder" || style === "elderF") return "sit";
    if (style.startsWith("kid")) return "run";
    if (style.startsWith("tour") && (zone === "beach" || zone === "lagoon")) return Math.random() < 0.45 ? "lounge" : "photo";
    if (style === "cafe") return "wander";
    return "wander";
  }

  function spawnOne(zone, i, job, style) {
    const z = ZONES[zone];
    const pool = {
      beach: ["tourM", "tourF", "tourM2", "tourF2", "localM", "localF", "kidM", "kidF", "elder", "elderF", "localM2"],
      port: ["fisher", "tourM", "localM", "elder", "localM2", "tourM2"],
      souk: ["merchM", "merchF", "localM", "localF", "localF2", "kidM", "kidF", "localM2", "cafe"],
      ville: ["localM", "localF", "localF2", "elder", "elderF", "kidM", "kidF", "cafe", "localM2"],
      plaza: ["localM", "localF", "elder", "elderF", "tourF", "tourF2", "cafe"],
      lagoon: ["localM", "tourM", "tourF", "tourF2", "kidM", "kidF", "localM2", "tourM2"],
      road: ["localM", "localF", "tourM", "cafe", "localM2"],
      hotel: ["tourM", "tourF", "tourF2", "tourM2", "localF", "merchF"],
      airport: ["tourM", "tourF", "tourM2", "localM", "localM2"],
      midounv: ["localM", "localF", "elder", "elderF", "kidM", "merchM"],
      erriadh: ["localM", "localF", "tourF", "tourM", "elder", "kidF"],
      elmay: ["elder", "elderF", "localM", "localM2", "kidM"],
      guellala: ["merchM", "merchF", "localF", "localM", "elder"],
      explore: ["tourM", "tourF", "tourF2", "merchM", "localF"],
      aghir: ["localM", "localM2", "elder", "elderF", "kidF"],
      inside: ["localM"],
      holy: ["elder", "elderF", "localM"],
    }[zone] || ["localM"];
    style = style || pick(pool);
    const names = NAMES[style] || ["Djerbien"];
    const chosenJob = job || defaultJob(style, zone);
    const speed = chosenJob === "run" ? 55 + Math.random() * 28 : 20 + Math.random() * 26;
    return {
      id: `${zone}_${i}`,
      zone,
      style,
      job: chosenJob,
      name: names[i % names.length],
      x: z.x0 + Math.random() * Math.max(8, z.x1 - z.x0 - PW),
      y: z.y0 + Math.random() * Math.max(8, z.y1 - z.y0 - PH),
      vx: 0,
      vy: 0,
      facing: Math.random() < 0.5 ? 1 : -1,
      tx: null,
      ty: null,
      wait: Math.random() * 1.6,
      speed,
      acting: false,
      actT: 0,
      talkCd: 0,
      talked: false,
      bubble: 0,
      bubbleText: "",
      pages: null,
      page: 0,
      whoLabel: "",
      homeX: 0,
      homeY: 0,
      partner: null,
      routine: null,
      step: 0,
      jobT: 0,
      nextZone: null,
      nextJob: null,
    };
  }

  const ROUTINES = {
    merchM: [["souk", "stand", 24], ["ville", "wander", 14], ["plaza", "stand", 10], ["souk", "stand", 22]],
    merchF: [["souk", "stand", 26], ["ville", "wander", 12], ["souk", "stand", 20]],
    localM: [["ville", "wander", 16], ["souk", "wander", 14], ["plaza", "sit", 12], ["ville", "wander", 18]],
    localM2: [["ville", "wander", 14], ["port", "wander", 16], ["souk", "wander", 12], ["ville", "wander", 16]],
    localF: [["ville", "wander", 16], ["souk", "wander", 14], ["plaza", "wander", 10], ["ville", "sit", 12]],
    localF2: [["ville", "wander", 14], ["souk", "wander", 16], ["midounv", "wander", 14]],
    tourM: [["beach", "lounge", 18], ["hotel", "wander", 12], ["souk", "wander", 12], ["explore", "photo", 14], ["beach", "photo", 16]],
    tourM2: [["hotel", "lounge", 16], ["beach", "photo", 14], ["midounv", "wander", 12], ["airport", "wander", 10]],
    tourF: [["beach", "lounge", 20], ["hotel", "lounge", 12], ["souk", "wander", 12], ["erriadh", "photo", 14]],
    tourF2: [["beach", "photo", 16], ["explore", "wander", 14], ["souk", "wander", 12], ["hotel", "wander", 12]],
    fisher: [["port", "fish", 28], ["souk", "wander", 12], ["port", "fish", 22]],
    elder: [["plaza", "sit", 22], ["ville", "sit", 16], ["souk", "sit", 12], ["plaza", "sit", 18]],
    elderF: [["ville", "sit", 20], ["plaza", "sit", 16], ["souk", "sit", 12]],
    cafe: [["ville", "wander", 14], ["plaza", "stand", 12], ["souk", "wander", 14], ["ville", "wander", 16]],
  };

  const STAY = {
    kidM: 1, kidF: 1, escort: 1, cabaret: 1, dog: 1, cat: 1, catGinger: 1,
  };

  function attachRoutine(n) {
    if (n.questNpc || n.routine || n.indoor || n.partner || STAY[n.style] || n.zone === "holy" || n.zone === "inside") return;
    const r = ROUTINES[n.style];
    if (!r) return;
    n.routine = r;
    n.step = (Math.random() * r.length) | 0;
    n.jobT = 6 + Math.random() * 14;
  }

  function zoneCenter(zone) {
    const z = ZONES[zone];
    if (!z) return null;
    return { x: (z.x0 + z.x1) / 2 - PW / 2, y: (z.y0 + z.y1) / 2 - PH / 2 };
  }

  function beginCommute(n) {
    if (!n.routine || !n.routine.length) return;
    n.step = (n.step + 1) % n.routine.length;
    const [zone, job] = n.routine[n.step];
    const c = zoneCenter(zone);
    if (!c) {
      n.jobT = 8;
      return;
    }
    n.nextZone = zone;
    n.nextJob = job;
    n.job = "commute";
    n.tx = c.x + (Math.random() * 40 - 20);
    n.ty = c.y + (Math.random() * 30 - 15);
    n.wait = 0;
    n.speed = 36 + Math.random() * 22;
  }

  function place(n, x, y) {
    n.x = x;
    n.y = y;
    n.homeX = x;
    n.homeY = y;
    clampNpc(n);
    n.homeX = n.x;
    n.homeY = n.y;
    return n;
  }

  function spawnFill(npcs, zone, count, job, styles) {
    for (let i = 0; i < count; i++) {
      const st = styles ? styles[i % styles.length] : undefined;
      const n = spawnOne(zone, npcs.length, job, st);
      n.homeX = n.x;
      n.homeY = n.y;
      npcs.push(n);
    }
  }

  function spawnPair(npcs, zone, x, y, styles) {
    const a = spawnOne(zone, npcs.length, "chat", styles[0]);
    const b = spawnOne(zone, npcs.length + 1, "chat", styles[1]);
    place(a, x, y);
    place(b, x + 26, y);
    a.facing = 1;
    b.facing = -1;
    a.partner = b;
    b.partner = a;
    npcs.push(a, b);
  }

  function spawn(world) {
    const npcs = [];
    const sidi = Island.xy("sidi");
    const ajim = Island.xy("ajim");
    const port = Island.xy("portHoumt");
    const hv = Island.xy("houmt");
    const umbrellas = [[-80, 30], [-20, 18], [40, 34], [100, 20], [160, 38], [-50, 80], [80, 90], [20, 50]];
    const shops = (Places.TOWN || []).filter((b) => b.room === "shop").map((b) => [b.x + 8, b.y + 36]);
    const houses = (Places.TOWN || []).filter((b) => b.room === "home" || b.room === "cafe").map((b) => [b.x + 8, b.y + 48]);
    const quay = [[ajim.x - 20, ajim.y + 10], [ajim.x + 20, ajim.y + 16], [port.x + 30, port.y + 10], [port.x + 70, port.y + 6]];

    umbrellas.forEach(([ox, oy], i) => {
      const st = ["tourF", "tourM", "tourF2", "tourM2", "localF", "elder"][i % 6];
      npcs.push(place(spawnOne("beach", npcs.length, "lounge", st), sidi.x + ox, sidi.y + oy));
    });
    spawnFill(npcs, "beach", 8, "wander", ["localM", "localM2", "localF", "tourM"]);
    spawnFill(npcs, "beach", 5, "run", ["kidM", "kidF"]);
    spawnFill(npcs, "beach", 4, "photo", ["tourM", "tourF2", "tourM2"]);
    spawnFill(npcs, "beach", 3, "sit", ["elder", "elderF"]);
    spawnFill(npcs, "beach", 4, "pace", ["localM", "tourF", "localF", "tourM2"]);
    spawnFill(npcs, "beach", 5, "sit", ["localF", "tourF", "localF2", "tourF2", "localF"]);

    quay.forEach(([x, y], i) => {
      npcs.push(place(spawnOne("port", npcs.length, i < 4 ? "fish" : "stand", i < 4 ? "fisher" : "tourM"), x, y));
    });
    spawnFill(npcs, "port", 5, "wander", ["localM", "tourM", "tourM2", "localM2"]);
    spawnFill(npcs, "port", 2, "sit", ["elder"]);
    npcs.push(place(spawnOne("port", npcs.length, "stand", "escort"), ajim.x + 50, ajim.y + 20));
    npcs.push(place(spawnOne("port", npcs.length, "stand", "cabaret"), ajim.x + 74, ajim.y + 16));
    npcs.push(place(spawnOne("port", npcs.length, "stand", "escort"), ajim.x + 26, ajim.y + 28));

    shops.forEach(([x, y], i) => {
      const st = i % 2 ? "merchF" : "merchM";
      npcs.push(place(spawnOne("souk", npcs.length, "stand", st), x + 6, y + 4));
    });
    spawnFill(npcs, "souk", 6, "wander", ["localM", "localF", "localF2", "localM2"]);
    spawnFill(npcs, "souk", 3, "run", ["kidM", "kidF"]);
    spawnPair(npcs, "souk", hv.x - 180, hv.y + 40, ["localF", "localM"]);
    spawnPair(npcs, "souk", hv.x - 160, hv.y + 160, ["merchF", "localF2"]);
    spawnFill(npcs, "souk", 2, "wander", ["cafe"]);

    houses.forEach(([x, y], i) => {
      const st = ["localM", "localF", "elder", "elderF", "cafe", "localM2"][i % 6];
      const job = st === "cafe" ? "wander" : (st.startsWith("elder") ? "sit" : "stand");
      npcs.push(place(spawnOne("ville", npcs.length, job, st), x, y));
    });
    spawnFill(npcs, "ville", 6, "wander", ["localM", "localF", "localF2", "cafe"]);
    spawnFill(npcs, "ville", 3, "run", ["kidM", "kidF"]);
    spawnFill(npcs, "ville", 2, "sit", ["elderF"]);
    spawnFill(npcs, "ville", 5, "sit", ["localF", "localF2", "tourF", "localF", "localF2"]);
    npcs.push(place(spawnOne("ville", npcs.length, "stand", "escort"), hv.x + 170, hv.y + 200));
    npcs.push(place(spawnOne("ville", npcs.length, "stand", "cabaret"), hv.x + 194, hv.y + 196));
    npcs.push(place(spawnOne("ville", npcs.length, "stand", "escort"), hv.x + 146, hv.y + 208));

    const pl = Island.xy("plaza");
    spawnPair(npcs, "plaza", pl.x - 20, pl.y - 10, ["localM", "localF"]);
    spawnPair(npcs, "plaza", pl.x + 8, pl.y + 40, ["elder", "elderF"]);
    spawnPair(npcs, "plaza", pl.x - 30, pl.y + 80, ["tourF", "tourF2"]);
    npcs.push(place(spawnOne("plaza", npcs.length, "sit", "elder"), pl.x + 20, pl.y + 20));
    npcs.push(place(spawnOne("plaza", npcs.length, "stand", "cafe"), pl.x + 40, pl.y - 20));
    spawnFill(npcs, "plaza", 3, "wander", ["localM", "localF", "tourF"]);
    spawnFill(npcs, "plaza", 4, "sit", ["localF", "localF2", "tourF", "tourF2"]);

    const hot = Island.xy("hotel");
    const mid = Island.xy("midoun");
    const air = Island.xy("airport");
    [
      ["beach", sidi.x - 8, sidi.y + 22, "sit", "localF"],
      ["beach", sidi.x + 20, sidi.y + 26, "sit", "tourF"],
      ["beach", sidi.x + 72, sidi.y + 14, "lounge", "localF2"],
      ["ville", hv.x + 28, hv.y + 48, "sit", "localF"],
      ["ville", hv.x + 54, hv.y + 50, "sit", "localF2"],
      ["ville", hv.x - 36, hv.y + 96, "stand", "localF"],
      ["plaza", pl.x + 52, pl.y + 6, "sit", "tourF"],
      ["plaza", pl.x + 78, pl.y + 8, "sit", "localF2"],
      ["hotel", hot.x + 18, hot.y + 78, "lounge", "tourF"],
      ["hotel", hot.x + 46, hot.y + 82, "sit", "localF"],
      ["midounv", mid.x + 8, mid.y + 38, "sit", "localF"],
      ["midounv", mid.x + 34, mid.y + 40, "sit", "localF2"],
      ["airport", air.x + 36, air.y + 28, "sit", "tourF"],
      ["port", ajim.x + 6, ajim.y + 38, "sit", "localF"],
      ["port", ajim.x + 32, ajim.y + 42, "sit", "tourF"],
    ].forEach(([zone, x, y, job, st]) => {
      npcs.push(place(spawnOne(zone, npcs.length, job, st), x, y));
    });

    spawnFill(npcs, "lagoon", 4, "wander", ["localM", "localM2", "tourF"]);
    spawnFill(npcs, "lagoon", 2, "photo", ["tourM", "tourF2"]);
    spawnFill(npcs, "lagoon", 2, "run", ["kidM", "kidF"]);

    spawnFill(npcs, "hotel", 4, "lounge", ["tourF", "tourM2", "localF"]);
    spawnFill(npcs, "hotel", 3, "wander", ["tourM", "tourF2", "merchF"]);
    spawnFill(npcs, "airport", 4, "wander", ["tourM", "tourF", "localM", "tourM2"]);
    spawnFill(npcs, "airport", 2, "stand", ["localM2", "tourF2"]);

    spawnFill(npcs, "midounv", 4, "wander", ["localM", "localF", "merchM"]);
    spawnFill(npcs, "midounv", 2, "sit", ["elder", "elderF"]);
    spawnFill(npcs, "erriadh", 4, "wander", ["localM", "localF", "tourF"]);
    spawnFill(npcs, "erriadh", 2, "photo", ["tourM", "tourF2"]);
    spawnFill(npcs, "erriadh", 1, "sit", ["elder"]);
    spawnFill(npcs, "elmay", 3, "wander", ["localM", "localM2"]);
    spawnFill(npcs, "elmay", 2, "sit", ["elder", "elderF"]);
    spawnFill(npcs, "guellala", 3, "stand", ["merchM", "merchF"]);
    spawnFill(npcs, "guellala", 2, "wander", ["localF", "localM"]);
    spawnFill(npcs, "explore", 3, "wander", ["tourM", "tourF", "tourF2"]);
    spawnFill(npcs, "explore", 2, "stand", ["merchM", "localF"]);
    spawnFill(npcs, "aghir", 3, "wander", ["localM", "localM2", "elder"]);
    spawnFill(npcs, "aghir", 2, "sit", ["elderF", "kidF"]);

    spawnFill(npcs, "road", 4, "pace", ["localM", "localF", "tourM", "cafe"]);

    spawnFill(npcs, "beach", 3, "wander", ["dog"]);
    spawnFill(npcs, "beach", 2, "sit", ["cat"]);
    spawnFill(npcs, "souk", 2, "wander", ["dog"]);
    spawnFill(npcs, "souk", 3, "sit", ["cat", "catGinger"]);
    spawnFill(npcs, "ville", 2, "wander", ["dog"]);
    spawnFill(npcs, "ville", 2, "sit", ["cat"]);
    spawnFill(npcs, "port", 2, "wander", ["dog", "cat"]);
    spawnFill(npcs, "road", 2, "pace", ["dog"]);
    spawnFill(npcs, "lagoon", 2, "wander", ["cat", "catGinger"]);
    spawnFill(npcs, "plaza", 1, "sit", ["cat"]);
    npcs.push(place(spawnOne("road", npcs.length, "wander", "dog"), 200, 500));
    npcs.push(place(spawnOne("beach", npcs.length, "sit", "catGinger"), 160, 430));
    npcs.push(place(spawnOne("souk", npcs.length, "sit", "cat"), 140, 640));

    [
      [["ville", "wander", 10], ["midounv", "wander", 12], ["aghir", "wander", 10], ["guellala", "wander", 10], ["port", "wander", 12]],
      [["beach", "wander", 12], ["hotel", "lounge", 10], ["midounv", "wander", 10], ["erriadh", "photo", 12], ["souk", "wander", 10]],
      [["airport", "stand", 10], ["ville", "wander", 14], ["souk", "wander", 10], ["plaza", "sit", 8], ["port", "wander", 12]],
      [["guellala", "stand", 12], ["elmay", "wander", 12], ["ville", "wander", 10], ["port", "wander", 14]],
      [["explore", "photo", 12], ["erriadh", "wander", 10], ["midounv", "wander", 12], ["beach", "lounge", 12]],
    ].forEach((route, i) => {
      const st = ["localM", "tourM", "localM2", "localF", "tourF"][i];
      const n = spawnOne(route[0][0] === "ajim" ? "port" : route[0][0], npcs.length, route[0][1], st);
      const c = zoneCenter(n.zone);
      if (c) place(n, c.x, c.y);
      n.routine = route;
      n.step = 0;
      n.jobT = 3 + i * 2;
      npcs.push(n);
    });

    npcs.forEach(attachRoutine);
    world.npcs = npcs;
  }

  function retarget(n) {
    const z = n.indoor ? ZONES.inside : ZONES[n.zone];
    if (!z) return;
    if (n.job === "pace") {
      n.tx = z.x0 + Math.random() * (z.x1 - z.x0 - PW);
      n.ty = n.homeY || n.y;
      n.wait = 0;
      return;
    }
    if ((n.job === "photo" || n.job === "run") && n.homeX) {
      n.tx = n.homeX + (Math.random() * 90 - 45);
      n.ty = n.homeY + (Math.random() * 50 - 25);
    } else {
      n.tx = z.x0 + Math.random() * (z.x1 - z.x0 - PW);
      n.ty = z.y0 + Math.random() * (z.y1 - z.y0 - PH);
    }
    n.wait = 0;
  }

  function isSmoker(n) {
    const st = typeof Atlas !== "undefined" && Atlas.NPC_STYLES && Atlas.NPC_STYLES[n.style];
    if (!st || st.kid || st.tool !== "smoke") return false;
    if (n.zone === "holy") return false;
    return true;
  }

  function stayHome(n, dt) {
    n.vx = 0;
    n.vy = 0;
    if (n.homeX) {
      n.x += (n.homeX - n.x) * Math.min(1, dt * 2);
      n.y += (n.homeY - n.y) * Math.min(1, dt * 2);
    }
    if (n.partner) n.facing = n.partner.x >= n.x ? 1 : -1;
    if (n.wait <= 0) {
      if (!n.partner) n.facing = Math.random() < 0.5 ? 1 : -1;
      n.wait = 1.4 + Math.random() * 2.8;
      const smoker = isSmoker(n);
      if (n.job === "fish" || n.job === "chat" || smoker || Math.random() < 0.35) {
        n.acting = true;
        n.actT = smoker ? 1.2 + Math.random() * 0.9 : 0.45 + Math.random() * 0.4;
      }
    } else n.wait -= dt;
  }

  function update(world, dt, player) {
    const npcs = world.npcs || [];
    for (const n of npcs) {
      if (world.inside ? !n.indoor : n.indoor) continue;
      if (n.talkCd > 0) n.talkCd -= dt;
      if (n.bubble > 0) n.bubble -= dt;
      n.actT -= dt;
      if (n.actT <= 0) n.acting = false;

      if (n.routine && n.job !== "commute" && !n.questNpc) {
        n.jobT -= dt;
        if (n.jobT <= 0) beginCommute(n);
      }

      const near = player && Math.hypot(n.x - player.x, n.y - player.y) < 44;
      n.prompt = near;
      const smoker = isSmoker(n);
      if (near && Math.random() < 0.012) {
        n.acting = true;
        n.actT = smoker ? 1.3 : 0.7;
        n.facing = player.x >= n.x ? 1 : -1;
      } else if (smoker && !n.acting && Math.random() < 0.035) {
        n.acting = true;
        n.actT = 1.1 + Math.random() * 0.8;
      }

      if (n.job === "commute") {
        if (n.wait > 0) {
          n.wait -= dt;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        if (n.tx == null) {
          beginCommute(n);
          continue;
        }
        const dx = n.tx - n.x;
        const dy = n.ty - n.y;
        const mag = Math.hypot(dx, dy) || 1;
        if (mag < 18) {
          n.zone = n.nextZone || n.zone;
          n.job = n.nextJob || "wander";
          n.homeX = n.x;
          n.homeY = n.y;
          n.tx = null;
          n.ty = null;
          n.vx = 0;
          n.vy = 0;
          const step = n.routine && n.routine[n.step];
          n.jobT = (step && step[2]) || 14;
          n.wait = 0.4 + Math.random() * 0.8;
          continue;
        }
        n.vx = (dx / mag) * n.speed;
        n.vy = (dy / mag) * n.speed;
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.vx > 4) n.facing = 1;
        if (n.vx < -4) n.facing = -1;
        clampNpc(n);
        continue;
      }

      if (n.job === "stand" || n.job === "sit" || n.job === "lounge" || n.job === "fish" || n.job === "chat") {
        stayHome(n, dt);
        if (n.job === "fish") n.facing = -1;
        continue;
      }

      if (n.wait > 0) {
        n.wait -= dt;
        n.vx = 0;
        n.vy = 0;
        if (n.job === "photo" && n.wait < 0.4) {
          n.acting = true;
          n.actT = 0.5;
        }
        continue;
      }

      if (n.tx == null || Math.hypot(n.x - n.tx, n.y - n.ty) < 8) {
        n.wait = n.job === "run" ? 0.2 + Math.random() * 0.5 : 0.7 + Math.random() * 2.2;
        if (n.job === "photo") n.wait = 1.1 + Math.random();
        retarget(n);
        continue;
      }

      const dx = n.tx - n.x;
      const dy = n.ty - n.y;
      const mag = Math.hypot(dx, dy) || 1;
      n.vx = (dx / mag) * n.speed;
      n.vy = (dy / mag) * n.speed;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.vx > 4) n.facing = 1;
      if (n.vx < -4) n.facing = -1;
      clampNpc(n);
    }
  }

  function nearest(world, player, range) {
    let best = null;
    let bestD = range;
    const indoor = !!(world && world.inside);
    for (const n of world.npcs || []) {
      if (indoor !== !!n.indoor) continue;
      const d = Math.hypot(n.x + 16 - (player.x + 16), n.y + 20 - (player.y + 20));
      if (d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  function paginate(text) {
    if (typeof NpcTalk !== "undefined" && NpcTalk.paginate) return NpcTalk.paginate(text, 96);
    const raw = String(text || "").trim();
    return raw ? [raw] : [""];
  }

  function whoFor(n) {
    if (n.style.startsWith("tour")) return `${n.name} (touriste)`;
    if (n.style.startsWith("merch")) return `${n.name} (souk)`;
    if (n.style === "fisher") return `${n.name} (pecheur)`;
    if (n.style.startsWith("kid")) return `${n.name} (gamin)`;
    if (n.style === "elder" || n.style === "elderF") return `${n.name} (ancien)`;
    if (n.style === "escort") return `${n.name} (escorte)`;
    if (n.style === "cabaret") return `${n.name} (cabaret)`;
    if (n.style === "dog") return `${n.name} (chien)`;
    if (n.style === "cat" || n.style === "catGinger") return `${n.name} (chat)`;
    return n.name;
  }

  function startSpeech(n, text, who) {
    n.pages = paginate(text);
    n.page = 0;
    n.bubbleText = n.pages[0];
    n.bubble = 24;
    n.whoLabel = who;
    n.acting = true;
    n.actT = 1.2;
    return n.pages.length > 1;
  }

  function lineFor(n) {
    if (n.zone === "holy") {
      const pack = LINES.holy && LINES.holy[n.style];
      if (pack && pack.length) return pick(pack);
      const any = Object.values(LINES.holy || {}).flat();
      if (any.length) return pick(any);
    }
    if (n.style === "dog" || n.style === "cat" || n.style === "catGinger") {
      const pack = LINES[n.zone] && LINES[n.zone][n.style === "catGinger" ? "cat" : n.style];
      if (pack && pack.length) return pick(pack);
      const extra = [];
      Object.keys(LINES).forEach((zk) => {
        const p = LINES[zk][n.style === "catGinger" ? "cat" : n.style];
        if (p) extra.push.apply(extra, p);
      });
      if (extra.length) return pick(extra);
    }
    if (n.style === "escort" || n.style === "cabaret") {
      const pack = LINES[n.zone] && LINES[n.zone][n.style];
      if (pack && pack.length) return pick(pack);
      const extra = [];
      Object.keys(LINES).forEach((zk) => {
        const p = LINES[zk][n.style];
        if (p) extra.push.apply(extra, p);
      });
      if (extra.length) return pick(extra);
    }
    if (n.talked && Math.random() < 0.08) return pick(WINKS);
    const pack = LINES[n.zone] && LINES[n.zone][n.style];
    if (pack && pack.length) return pick(pack);
    const zoneLines = Object.values(LINES[n.zone] || {}).flat();
    if (zoneLines.length) return pick(zoneLines);
    return pick(WINKS);
  }

  function talk(n, player) {
    if (player) n.facing = player.x >= n.x ? 1 : -1;
    const who = n.whoLabel || whoFor(n);

    if (n.pages && n.page < n.pages.length - 1) {
      n.page += 1;
      n.bubbleText = n.pages[n.page];
      n.bubble = 24;
      n.acting = true;
      n.actT = 1.1;
      return { type: "talk", who, text: n.bubbleText, coins: 0, more: n.page < n.pages.length - 1 };
    }

    if (n.bubble > 0) {
      return { type: "talk", who, text: n.bubbleText, coins: 0, more: false };
    }

    if (typeof Quests !== "undefined" && n.qRole) {
      const q = Quests.talk(n, player, window.__world);
      if (q && q.text) {
        const qWho = q.who || `${n.name}`;
        const more = startSpeech(n, q.text, qWho);
        n.talkCd = 2;
        n.talked = true;
        return {
          type: "talk",
          who: qWho,
          text: n.bubbleText,
          coins: q.coins || 0,
          more,
          quest: q.quest,
          questTitle: q.title,
        };
      }
    }

    if (n.talkCd > 0 && n.talked) {
      const animal = n.style === "dog" || n.style === "cat" || n.style === "catGinger";
      const again = animal
        ? pick([
            n.style === "dog" ? "Wouf. Toujours faim." : "Miaou. Toujours faim.",
            "Il te regarde, maigre, et n'ajoute rien.",
            "Un coup de langue. Puis il retourne aux sacs.",
          ])
        : n.style.startsWith("tour")
        ? pick([
            "I've already said it. Algeria still last.",
            "On a deja tout dit. Fitna replay? Non.",
          ])
        : pick([
            "T'as deja eu le sermon.",
            "Va le raconter a Alger, ou ramasse.",
            "Yallah, la Fitna continue sans moi.",
          ]);
      const more = startSpeech(n, again, who);
      return { type: "talk", who, text: n.bubbleText, coins: 0, more };
    }

    const text = lineFor(n);
    n.talkCd = 6;
    const more = startSpeech(n, text, whoFor(n));
    const first = !n.talked;
    n.talked = true;
    const coins = first && (n.style === "dog" || n.style === "cat" || n.style === "catGinger")
      ? 0
      : first && (n.style.startsWith("tour") || n.style.startsWith("merch")) ? 15 : first ? 8 : 0;
    return { type: "talk", who: n.whoLabel, text: n.bubbleText, coins, more };
  }

  return { spawn, update, nearest, talk };
})();
