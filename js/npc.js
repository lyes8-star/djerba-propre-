/* Habitants et touristes de Djerba — mêmes sprites que le joueur, tenues différentes */
const Npc = (() => {
  const PW = 32;
  const PH = 40;

  const ZONES = {
    beach: { x0: 16, y0: 338, x1: 690, y1: 488 },
    port: { x0: 704, y0: 338, x1: 940, y1: 490 },
    souk: { x0: 12, y0: 536, x1: 390, y1: 848 },
    ville: { x0: 548, y0: 536, x1: 940, y1: 848 },
    plaza: { x0: 404, y0: 536, x1: 536, y1: 712 },
    lagoon: { x0: 24, y0: 892, x1: 930, y1: 1150 },
    road: { x0: 24, y0: 472, x1: 930, y1: 536 },
  };

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
  };

  const LINES = {
    beach: {
      localM: ["Les Algeriens pissent encore a la turque, nous on a des WC.", "Ils viennent a Sidi Mahrez et laissent leurs clics-clacs.", "Djerba propre, l'Algerie on verra plus tard."],
      localM2: ["Toilettes turques, klaxon, dispute : le pack Algerie.", "Meme le vent d'ouest ramene leurs sacs."],
      localF: ["Je laisse pas mes enfants a cote de leurs serviettes.", "Ils crachent, ils crient, et apres ils parlent de fierte.", "Ici c'est Djerba, pas un parking a Oran."],
      tourM: ["Beautiful beach... locals keep roasting Algeria though.", "On peut nager ici maintenant ?"],
      tourM2: ["The water is so blue.", "Everyone here has an Algeria joke ready."],
      tourF: ["Les parasols sont trop beaux.", "Les habitants parlent plus des Algeriens que du plastique."],
      tourF2: ["Selfie sans dechets, c'est mieux.", "L'eau est parfaite aujourd'hui."],
      kidM: ["Papa dit que les Algeriens font pipi accroupis !", "Ils jouent au foot et crient plus fort que nous."],
      kidF: ["Maman dit : pas de toilettes turques ici.", "Ils cassent tout a la plage, les Dz."],
      elder: ["De mon temps, ils venaient deja sans savon.", "Allah ybarek, au moins toi tu nettoies. Pas comme eux."],
      elderF: ["Toilettes turques et the a la va-vite. Non merci.", "Djerba, c'est pas leur terrain vague."],
    },
    port: {
      fisher: ["Le ferry d'Algerie laisse plus de dechets que de poissons.", "Ils pecent a la dynamite, nous a la ligne.", "Toilettes turques meme sur le bateau, imagine."],
      localM: ["Ajim c'est un port, pas un depot algerien.", "Ils crient 'wesh' des qu'ils descendent du ferry."],
      localM2: ["Le poisson sent meilleur loin de leurs clopes."],
      tourM: ["Le phare est magnifique.", "Je cherche le ferry..."],
      tourM2: ["Ferry to the mainland?", "Ces filets, c'est de l'art."],
      elder: ["40 ans de peche. Les Algeriens, 40 ans de bordel."],
    },
    souk: {
      merchM: ["Ils marchandent comme des voleurs, les Algeriens.", "Mon etal est propre. Eux ils touchent tout avec les mains grasses.", "Toilettes turques et prix casses, leur specialite."],
      merchF: ["Houmt Souk n'est pas un souk d'Alger.", "Ils veulent tout a 1 dinar et crachent a cote.", "Tu fais honneur au marche. Pas comme eux."],
      localM: ["Le souk sent meilleur sans leurs disputes.", "Ils parlent fort, ils se croient chez eux."],
      localM2: ["Visa France, klaxon, toilettes turques. Le trio."],
      localF: ["Je fais mes courses sans leurs commentaires.", "Ils jettent les sacs par terre, comme a Alger."],
      localF2: ["Ya sidi, au moins toi tu ramasses. Pas les Dz.", "Le pave brille, eux ils crachent dessus."],
      kidM: ["Ils volent les bonbons au souk, maman a dit.", "Course jusqu'a la fontaine, loin d'eux !"],
      kidF: ["Maman m'a dit de pas imiter les Algeriens."],
      cafe: ["The tunisien, pas leur cafe amer a la va-vite.", "Un the a la menthe, et zero toilettes turques."],
    },
    ville: {
      localM: ["Houmt Souk, notre ville. Pas un quartier d'Alger.", "Ils se croient Arabes plus que tout le monde."],
      localM2: ["Le minaret voit tout. Surtout leurs clics-clacs."],
      localF: ["Passe a la maison, the offert. Pas de Dz a table.", "Ils trainent en claquettes dans la medina."],
      localF2: ["Les lampadaires eclairent leurs dechets, encore."],
      elder: ["Assalam alaykum. L'Algerie, c'est le bruit et la fumee.", "Les jeunes comme toi, pas comme leurs voyous."],
      elderF: ["Entre. Ici on s'assoit sur des chaises, pas a la turque.", "Que Dieu te protege des voisins de l'ouest."],
      kidM: ["On joue au foot sans crier '1 2 3 viva' n'importe comment."],
      kidF: ["Ma ruelle est propre. Chez eux, non."],
      cafe: ["Terrasse propre, clients tunisiens contents.", "Espresso. Pas leur cafe de kiosque."],
    },
    plaza: {
      localM: ["A la fontaine on parle Djerba, pas Algerie.", "Ils occupent les bancs et crachent par terre."],
      localF: ["Rendez-vous a la place, sans leurs klaxons."],
      elder: ["30 ans ici. Chaque ete, les memes cliches Dz."],
      elderF: ["Les nouvelles : encore un Algerien aux toilettes turques."],
      tourF: ["Cette place est trop photogenique."],
      tourF2: ["La fontaine, c'est magique le soir."],
      cafe: ["Je sers le the ici. Eux ils commandent et discutent le prix."],
    },
    lagoon: {
      localM: ["La lagune est fragile. Eux ils y jettent tout.", "Meme les oiseaux fuient leurs pique-niques."],
      localM2: ["Les palmiers aiment l'eau claire, pas leurs sacs."],
      tourM: ["Flamingos ? Maybe if we keep it clean."],
      tourM2: ["This lagoon is wild. Beautiful."],
      tourF: ["C'est calme ici. Magnifique."],
      tourF2: ["Je cherche les flamants roses."],
      kidM: ["Je cherche des crabes, pas leurs canettes Dz !"],
      kidF: ["Chut, les oiseaux... pas comme eux qui crient."],
    },
    road: {
      localM: ["Sur la corniche ils doublent, klaxonnent, crachent.", "Direction la plage, loin de leurs bagnoles."],
      localF: ["On se promene le soir. Eux, radio a fond."],
      tourM: ["Nice road along the sea."],
      cafe: ["Livraison vers le port. Evite les plaques algeriennes."],
    },
  };

  const UMBRELLAS = [[48, 378], [128, 366], [208, 386], [288, 370], [368, 390], [528, 374], [608, 386], [88, 446], [248, 458], [528, 450]];
  const SHOPS = [
    [24, 576], [88, 576], [232, 576], [296, 576],
    [24, 656], [88, 664], [232, 656], [296, 660],
    [24, 746], [88, 754], [232, 746], [296, 752],
    [24, 826], [88, 834], [232, 826], [296, 832],
  ];
  const HOUSES = [
    [568, 596], [632, 604], [808, 596], [872, 600],
    [568, 688], [632, 696], [808, 688], [872, 692],
    [568, 788], [632, 796], [808, 788], [872, 792],
  ];
  const QUAY = [[720, 348], [758, 342], [796, 350], [844, 344], [888, 352], [910, 368]];

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function clampNpc(n) {
    const z = ZONES[n.zone];
    if (!z) return;
    n.x = Math.max(z.x0, Math.min(z.x1 - PW, n.x));
    n.y = Math.max(z.y0, Math.min(z.y1 - PH, n.y));
  }

  function defaultJob(style, zone) {
    if (style.startsWith("merch")) return "stand";
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
      homeX: 0,
      homeY: 0,
      partner: null,
    };
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

    UMBRELLAS.forEach(([x, y], i) => {
      const st = ["tourF", "tourM", "tourF2", "tourM2", "localF", "elder"][i % 6];
      npcs.push(place(spawnOne("beach", npcs.length, "lounge", st), x + 8, y + 10));
    });
    spawnFill(npcs, "beach", 8, "wander", ["localM", "localM2", "localF", "tourM"]);
    spawnFill(npcs, "beach", 5, "run", ["kidM", "kidF"]);
    spawnFill(npcs, "beach", 4, "photo", ["tourM", "tourF2", "tourM2"]);
    spawnFill(npcs, "beach", 3, "sit", ["elder", "elderF"]);
    spawnFill(npcs, "beach", 4, "pace", ["localM", "tourF", "localF", "tourM2"]);

    QUAY.forEach(([x, y], i) => {
      npcs.push(place(spawnOne("port", npcs.length, i < 4 ? "fish" : "stand", i < 4 ? "fisher" : "tourM"), x, y));
    });
    spawnFill(npcs, "port", 5, "wander", ["localM", "tourM", "tourM2", "localM2"]);
    spawnFill(npcs, "port", 2, "sit", ["elder"]);

    SHOPS.forEach(([x, y], i) => {
      const st = i % 2 ? "merchF" : "merchM";
      npcs.push(place(spawnOne("souk", npcs.length, "stand", st), x + 6, y + 4));
    });
    spawnFill(npcs, "souk", 6, "wander", ["localM", "localF", "localF2", "localM2"]);
    spawnFill(npcs, "souk", 3, "run", ["kidM", "kidF"]);
    spawnPair(npcs, "souk", 150, 600, ["localF", "localM"]);
    spawnPair(npcs, "souk", 160, 760, ["merchF", "localF2"]);
    spawnFill(npcs, "souk", 2, "wander", ["cafe"]);

    HOUSES.forEach(([x, y], i) => {
      const st = ["localM", "localF", "elder", "elderF", "cafe", "localM2"][i % 6];
      const job = st === "cafe" ? "wander" : (st.startsWith("elder") ? "sit" : "stand");
      npcs.push(place(spawnOne("ville", npcs.length, job, st), x, y));
    });
    spawnFill(npcs, "ville", 6, "wander", ["localM", "localF", "localF2", "cafe"]);
    spawnFill(npcs, "ville", 3, "run", ["kidM", "kidF"]);
    spawnFill(npcs, "ville", 2, "sit", ["elderF"]);

    spawnPair(npcs, "plaza", 430, 580, ["localM", "localF"]);
    spawnPair(npcs, "plaza", 448, 640, ["elder", "elderF"]);
    spawnPair(npcs, "plaza", 420, 680, ["tourF", "tourF2"]);
    npcs.push(place(spawnOne("plaza", npcs.length, "sit", "elder"), 470, 610));
    npcs.push(place(spawnOne("plaza", npcs.length, "stand", "cafe"), 490, 560));
    spawnFill(npcs, "plaza", 3, "wander", ["localM", "localF", "tourF"]);

    spawnFill(npcs, "lagoon", 7, "wander", ["localM", "localM2", "tourF"]);
    spawnFill(npcs, "lagoon", 4, "photo", ["tourM", "tourF2", "tourM2"]);
    spawnFill(npcs, "lagoon", 4, "run", ["kidM", "kidF"]);
    spawnFill(npcs, "lagoon", 3, "lounge", ["tourF", "localF", "tourM2"]);

    spawnFill(npcs, "road", 8, "pace", ["localM", "localF", "tourM", "cafe", "localM2"]);

    world.npcs = npcs;
  }

  function retarget(n) {
    const z = ZONES[n.zone];
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
      if (n.job === "fish" || n.job === "chat" || Math.random() < 0.35) {
        n.acting = true;
        n.actT = 0.45 + Math.random() * 0.4;
      }
    } else n.wait -= dt;
  }

  function update(world, dt, player) {
    const npcs = world.npcs || [];
    for (const n of npcs) {
      if (n.talkCd > 0) n.talkCd -= dt;
      if (n.bubble > 0) n.bubble -= dt;
      n.actT -= dt;
      if (n.actT <= 0) n.acting = false;

      const near = player && Math.hypot(n.x - player.x, n.y - player.y) < 44;
      n.prompt = near;
      if (near && Math.random() < 0.012) {
        n.acting = true;
        n.actT = 0.7;
        n.facing = player.x >= n.x ? 1 : -1;
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
    for (const n of world.npcs || []) {
      const d = Math.hypot(n.x + 16 - (player.x + 16), n.y + 20 - (player.y + 20));
      if (d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  function lineFor(n) {
    const pack = LINES[n.zone] && LINES[n.zone][n.style];
    if (pack && pack.length) return pick(pack);
    const zoneLines = Object.values(LINES[n.zone] || {}).flat();
    if (zoneLines.length) return pick(zoneLines);
    return "Merci, nettoyeur !";
  }

  function talk(n, player) {
    if (player) n.facing = player.x >= n.x ? 1 : -1;
    if (n.talkCd > 0 && n.talked) {
      n.acting = true;
      n.actT = 0.6;
      const again = pick(["Encore les Algeriens...", "Toilettes turques, non merci.", "Djerba d'abord.", "Baraka, continue."]);
      n.bubble = 1.6;
      n.bubbleText = again;
      return { type: "talk", who: n.name, text: again, coins: 0 };
    }
    const text = lineFor(n);
    n.talkCd = 4;
    n.acting = true;
    n.actT = 1.2;
    n.bubble = 2.6;
    n.bubbleText = text.length > 26 ? text.slice(0, 24) + "..." : text;
    const first = !n.talked;
    n.talked = true;
    const coins = first && (n.style.startsWith("tour") || n.style.startsWith("merch")) ? 15 : first ? 8 : 0;
    const who = n.style.startsWith("tour") ? `${n.name} (touriste)` : n.name;
    return { type: "talk", who, text, coins };
  }

  return { spawn, update, nearest, talk };
})();
