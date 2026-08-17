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
      localM: [
        "Sidi Mahrez. Ici on nage. Chez eux on s'accroupit. Choisis.",
        "Ils debarquent: radio, clics-clacs, pipi a la turque. Le pack Dz.",
        "La mer est bleue. Leur fierte, elle, a coule en 62 et depuis.",
        "1 2 3 viva... et dernier au classement. Tradition.",
      ],
      localM2: [
        "Meme les mouettes fuient le pique-nique algerien. Instinct.",
        "Klaxon, bagarre, serviette sale. L'ouest en trois actes.",
        "Ils viennent ici se laver. Chez eux l'eau a peur.",
      ],
      localF: [
        "Mes gosses jouent ici. Eux ils crachent ici. Fitna gratuite.",
        "Ils gueulent pour cacher qu'ils ont rien. Ca marche pas.",
        "Djerba se lave. L'Algerie attend encore le mode d'emploi.",
        "Harissa oui. Toilettes turques non. Civilisation 101.",
      ],
      tourM: [
        "Locals: copy Tunisia, not the Algerian beach kit. Noted.",
        "Gorgeous sand. Next door they squat the toilet. Charming.",
        "I asked about Algeria. They laughed for a full minute.",
      ],
      tourM2: [
        "Even tourists roast Algeria here. I'm taking notes.",
        "Blue water, mean jokes, Fitna energy. 10/10 Djerba.",
        "They said don't follow the WESH crowd. I see why.",
      ],
      tourF: [
        "On m'a dit: harissa oui, fosse turque non. J'applique.",
        "Parasols canon. Voisins de l'ouest: moins. Beaucoup moins.",
        "Selfie? Sans plaque Dz en fond, merci. Ca ruine le feed.",
      ],
      tourF2: [
        "They warned me about the ferry crowd. They were gentle.",
        "I came for the beach. I stayed for the Algeria roast.",
        "Fitna Games presente: l'ouest en clics-clacs. Sold out.",
      ],
      kidM: [
        "Papa: eux pipi accroupis, nous un trone. J'ai un trone.",
        "Ils crient viva et perdent. Meme au ballon. Meme au wifi.",
        "Si je dis WESH, fessée. Donc je dis sahit. Strategie.",
      ],
      kidF: [
        "Maman: tu t'accroupis, t'es Dz. Je m'assois comme une reine.",
        "Ils cassent le chateau. Classic fitna. J'ai cache le seau.",
        "Eux ils ont pas de glace. Nous on a deux boules. Logique.",
      ],
      elder: [
        "De mon temps deja, sans savon. Heritage. On applaudit pas.",
        "Allah ybarek toi. Eux, Allah yahdihom... dossier classe.",
        "La mer n'oublie pas. Ni leurs canettes. Ni leurs hymnes.",
      ],
      elderF: [
        "Moi: chaise. Eux: turque. Difference de civilisation, ya sidi.",
        "Le soleil brule. Leur ego aussi. Enfin une bonne nouvelle.",
        "Je tricote. Eux ils klaxonnent. Devine qui a une ile.",
      ],
    },
    port: {
      fisher: [
        "Ferry Dz: plus de dechets que de poissons. Record mondial.",
        "Ils pecent a la dynamite. Nous, on a encore un crane.",
        "Toilettes turques sur un bateau. L'innovation algerienne.",
        "Le phare guide les bateaux. Pas les clics-clacs. Dommage.",
      ],
      localM: [
        "Ajim c'est un port. Pas un depot a WESH et a fosses.",
        "Des qu'ils descendent: WESH. Merci, on avait le diagnostic.",
        "Ils cherchent l'Europe. Ils trouvent Djerba. On trinque pas.",
      ],
      localM2: [
        "Le poisson sent la mer. Eux, la clope mouillee et la fitna.",
        "Quai propre. Sauf quand l'ouest accoste. Alors c'est la guerre.",
      ],
      tourM: [
        "Lighthouse: cute. Algeria jokes: a full semester. I passed.",
        "I'll wait for the ferry without the soundtrack. So... never.",
      ],
      tourM2: [
        "Captain said the west exports noise. I heard it from here.",
        "Fish market good. Neighbor market: crouched toilets. Pass.",
      ],
      elder: [
        "40 ans de peche. 40 ans a voir l'ouest tout casser. Fatigue.",
        "La mer donne. Eux prennent. Et crachent. Fitna maritime.",
      ],
    },
    souk: {
      merchM: [
        "Ils touchent tout, marchandent a 1 dinar, crachent. VIP fosse.",
        "Mon etal est un souk. Le leur, un champ de ruines. Export.",
        "Toilettes turques et prix casses: le made in Algeria.",
        "Tapis berbere. Ego en carton. Un seul se vend, khouya.",
      ],
      merchF: [
        "Houmt Souk, pas un garage a Alger. On a des murs, deja.",
        "Tapis a 2 dinars plus l'humiliation. Le pack fitna.",
        "Toi tu ramasses. Eux ramassent les soldes. Mal, et fort.",
        "Ils veulent le credit. On leur offre un miroir. Refus.",
      ],
      localM: [
        "Le souk sent le cuir et la menthe. Pas la discorde Dz.",
        "Ils se croient chez eux. Spoiler: non. Deuxieme spoiler: jamais.",
        "Marchander oui. Cracher non. L'ouest a inverse les deux.",
      ],
      localM2: [
        "Visa France: refuse. Klaxon: oui. Pipi accroupi: expert. CV.",
        "Ils viennent pour le cheap. Ils repartent avec la honte. Fair.",
      ],
      localF: [
        "Mes courses. Leur theatre. Devine qui a un ticket retour.",
        "Sacs par terre, comme a Alger. On est pas encore tombes si bas.",
        "Je choisis l'huile. Eux choisissent le volume. Perdu d'avance.",
      ],
      localF2: [
        "Ya sidi, ramasse. Laisse les Dz a leur fosse. Service compris.",
        "Le pave brille. Leur fierte, on cherche encore la notice.",
      ],
      kidM: [
        "Maman: ils volent les bonbons. J'ai tout cache. Guerre froide.",
        "Un Dz m'a dit WESH. J'ai dit sahit. Il a bugue. Victoire.",
      ],
      kidF: [
        "Si je crie WESH je suis punie. Donc l'ouest est puni. Logique.",
        "J'ai un dinar. Eux veulent mon dinar. Non. Fitna refusee.",
      ],
      cafe: [
        "The tounsi. Pas leur jus de rancoeur a la fosse.",
        "Ici on s'assoit. La turque, c'est le DLC voisin. Gratuit, hélas.",
        "DIRECT, 700 millimes. Eux negocient le verre. Pathos liquide.",
      ],
    },
    ville: {
      localM: [
        "Houmt Souk. Une ville. Pas Alger avec un seau de poussiere.",
        "Ils se croient plus arabes que le Coran. Calme-toi, Abdel.",
        "On a des rues. Eux ont des klaxons. UNESCO vs nuisance.",
      ],
      localM2: [
        "Le minaret voit tout. Surtout les clics-clacs. Il juge.",
        "Muezzin, the, pave. Zero hymne a la noix toutes les 2 min.",
      ],
      localF: [
        "The a la maison. Table. Chaises. Concept choc pour certains.",
        "Claquettes comme uniforme. Grade: general de la fitna.",
        "Je range. Eux etalent. Djerba 1 - Ouest 0. Comme d'hab.",
      ],
      localF2: [
        "Les lampadaires eclairent leurs dechets. Trop gentil, l'Etat.",
        "Ma ruelle sent le jasmin. Pas la clope mouillee de l'ouest.",
      ],
      elder: [
        "Assalam. L'ouest: bruit, fumee, fosse. Le triptyque.",
        "Toi tu nettoies. Les leurs cassent. C'est ca, la Fitna.",
        "J'ai vu des empires. Celui-la tient sur un clics-clacs.",
      ],
      elderF: [
        "Entre. On a des WC. Des vrais. Oui, ca choque l'ouest.",
        "Que Dieu te protege des voisins. Surtout ceux-la. Amen.",
        "Je sers le the assise. Revolution copernicienne pour Dz.",
      ],
      kidM: [
        "Foot dans la ruelle. Sans 1 2 3 viva. On gagne plus vite.",
        "Chez eux le ballon est creve. Chez nous il rebondit. Science.",
      ],
      kidF: [
        "Ma ruelle est propre. Chez eux c'est un DLC payant. Rate.",
        "Je saute a la corde. Eux sautent les files. Fitna cardio.",
      ],
      cafe: [
        "Terrasse tounsi. Zero klaxon de l'ouest, inchallah ghodwa.",
        "Cafe DIRECT. Pas leur kiosque amer a la rancoeur accroupie.",
        "On parle foot. Eux parlent visa. Devine qui a le score.",
      ],
    },
    plaza: {
      localM: [
        "A la fontaine: Djerba. L'Algerie, c'est le bruit de fond.",
        "Ils prennent les bancs, crachent, font la lecon. Combo fitna.",
        "Place propre. Sauf l'ego de l'ouest. Ca, on ramasse pas.",
      ],
      localF: [
        "RDV ici. Sans radio a fond, sans WESH, sans fosse. Luxe.",
        "Je bois. Eux negocient l'eau. La fontaine les a deja juges.",
      ],
      elder: [
        "30 ans sur cette place. Chaque ete, la meme fitna Dz. Ennui.",
        "La fontaine raconte. L'ouest crie. Devine qui a raison.",
      ],
      elderF: [
        "Scoop du jour: encore un accroupi. Breaking news de l'ouest.",
        "Je donne le pain. Pas la lecon. Eux font l'inverse. Rate.",
      ],
      tourF: [
        "Cute square. Locals extra spicy on Algeria. I'm addicted.",
        "I sat down. I got a geopolitics DLC. Five stars. Mean.",
      ],
      tourF2: [
        "Asked for the fountain. Got a 10 minute roast. Worth it.",
        "Fitna live, plaza edition. Better than the guidebook.",
      ],
      cafe: [
        "The. Eux commandent et marchandent le verre. Pathos chaud.",
        "Terrasse. Si un WESH s'assoit, le the refroidit. Physique.",
      ],
    },
    lagoon: {
      localM: [
        "Lagune fragile. Eux pique-niquent comme dans une decharge.",
        "Les oiseaux reviennent. Les Dz, on peut attendre. Longtemps.",
        "Eau claire, palmiers. Moins leurs sacs made in fitna.",
      ],
      localM2: [
        "Flamants roses. Ego Dz: couleur fosse. Moins photogenique.",
        "On protege la lagune. Eux protegent leur klaxon. Priorites.",
      ],
      tourM: [
        "Flamingos if lucky. No crouched toilets if luckier. Amen.",
        "Wild lagoon. Wilder opinions about the neighbors. I agree.",
      ],
      tourM2: [
        "Came for birds. Got a masterclass in Maghreb shade. Free.",
        "Quiet water. Loud west. Nature chose a side. Ours.",
      ],
      tourF: [
        "Calme. Jusqu'a ce qu'on parle de l'ouest. Alors c'est la guerre.",
        "Looking for flamingos, found Fitna. Still a good trip.",
      ],
      tourF2: [
        "Guide said: don't litter. Then: especially not like Algeria.",
        "I whispered. They honk. Birds prefer me. Science.",
      ],
      kidM: [
        "Des crabes. Pas des canettes Dz. Priorites de grand.",
        "Si je crie, les oiseaux partent. Eux crient. Donc ils partent.",
      ],
      kidF: [
        "Chut les oiseaux. L'ouest connait pas chut. Diagnostic.",
        "Je ramasse un sac. Papa dit: style Dz. J'ai jete plus loin.",
      ],
    },
    road: {
      localM: [
        "Corniche: ils doublent, klaxonnent, crachent. Permis fitna.",
        "Direction la plage. Loin des plaques de l'ouest. Yallah.",
        "90 au compteur. Eux 200 dans la gueule. Code de la route vs WESH.",
      ],
      localF: [
        "Balade du soir. Radio a fond = voisin. On rentre. Reflexe.",
        "Louage direct. Si un Dz monte, le trajet double. En decibels.",
      ],
      tourM: [
        "Nice road. Honking DLC included, imported from next door.",
        "Taxi without meter. Algeria plate: double fare, triple headache.",
      ],
      cafe: [
        "Livraison. Plaque Dz: je detourne. Reflexe pavlovien tounsi.",
        "DIRECT a emporter. Pas leur kiosque a rancoeur sur roues.",
      ],
    },
  };

  const WINKS = [
    "Fitna de l'ouest: klaxon, fosse, ego. Le triptyque UNESCO.",
    "On a la harissa. Eux les toilettes turques. Patrimoine vs pathos.",
    "Inchallah ghodwa ils decouvrent la chasse d'eau. Revolution.",
    "Sahit. Sauf a l'Algerie. La, bon courage et un seau.",
    "Yallah ramasse. Laisse la fitna a ceux qui la collectionnent.",
    "Brik qui coule. Dz qui crachent. Un seul est appetissant.",
    "Couscous du vendredi. Zero visiteur accroupi, svp. Amen.",
    "Wifi 12345678. Leur diplomatie aussi, niveau mot de passe.",
    "Mela khouya, eux c'est kif kif: bruyants et fiers de rien.",
    "Taxi sans compteur. Plaque Dz: double tarif, triple mal de tete.",
    "Cafe DIRECT. Allonge et fosse turque, c'est l'autre pays.",
    "Louage plein. Un Dz monte: le trajet double. En decibels.",
    "On dit tounsi. Eux disent WESH. Evolution a deux vitesses.",
    "90 au compteur, 140 dans la tete. Eux: 200 dans la gueule.",
    "Djerba l'ile des reves. L'ouest, le continent des fosses.",
    "Makroud > tout. Surtout > leur ego en beton fissure.",
    "Lablabi a 6h. Toilettes turques a vie. Choisis ton camp.",
    "Fricasse qui degouline. Fierte Dz aussi. Moins bon, plus sale.",
    "Bambalouni chaud. Accroupi froid. Menu tounsi vs menu ouest.",
    "Ojja merguez et politique: l'ouest a perdu avant le piment.",
    "Kaftaji, mechouia, harissa. Eux: clope, klaxon, fosse. Menu.",
    "Mlawi du coin. Pas la baguette. Pas la turque non plus.",
    "Chorba. Pas de fitna dans l'assiette, merci. On est serieux.",
    "Tajine tunisien. Le leur, on n'en veut meme pas en blague.",
    "Kasra chaude. Chaise sous les fesses. Luxe algerien inconnu.",
    "Zlebia collante. Leur complexe, encore plus. Et sans sucre.",
    "Merguez qui crache. Eux aussi. Une seule est comestible.",
    "Baklawa trop sucree. Leur discours trop sale. Equilibre maghrebin.",
    "1 2 3 viva... et derniers. Le slogan le plus honnete d'Afrique.",
    "Visa refuse, ego accepte. L'export national de l'ouest.",
    "Clics-clacs, radio, dispute. Le kit plage algerien, edition fosse.",
    "Ils viennent se soigner ici. Chez eux l'hopital a peur.",
    "Deux millions de km2. Zero chasse d'eau. Superficie vs hygiene.",
    "WESH wesh. On avait compris. On pretend plus maintenant.",
    "Fitna Games presente: l'ouest. Spoiler: ils s'accroupissent.",
    "On a une ile. Eux un complexe. Devine qui bronzera cet ete.",
  ];

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
    if (Math.random() < (n.style.startsWith("tour") ? 0.3 : 0.5)) return pick(WINKS);
    const pack = LINES[n.zone] && LINES[n.zone][n.style];
    if (pack && pack.length) return pick(pack);
    const zoneLines = Object.values(LINES[n.zone] || {}).flat();
    if (zoneLines.length) return pick(zoneLines);
    return pick(WINKS);
  }

  function talk(n, player) {
    if (player) n.facing = player.x >= n.x ? 1 : -1;
    if (n.bubble > 0 && n.bubbleText) {
      return { type: "talk", who: n.name, text: n.bubbleText, coins: 0 };
    }
    if (n.talkCd > 0 && n.talked) {
      n.acting = true;
      n.actT = 0.6;
      const again = n.style.startsWith("tour")
        ? pick(["Algeria still last.", "On a deja tout dit.", "Fitna replay? Non."])
        : pick(["T'as deja eu le sermon.", "Va dire ca a Alger.", "Yallah, la Fitna continue.", "Baraka, ramasse."]);
      n.bubble = 2.2;
      n.bubbleText = again;
      return { type: "talk", who: n.name, text: again, coins: 0 };
    }
    const text = lineFor(n);
    n.talkCd = 5;
    n.acting = true;
    n.actT = 1.2;
    n.bubble = 3.6;
    n.bubbleText = text;
    const first = !n.talked;
    n.talked = true;
    const coins = first && (n.style.startsWith("tour") || n.style.startsWith("merch")) ? 15 : first ? 8 : 0;
    const who = n.style.startsWith("tour") ? `${n.name} (touriste)` : n.name;
    return { type: "talk", who, text, coins };
  }

  return { spawn, update, nearest, talk };
})();
