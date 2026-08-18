/* Quêtes à étapes — Fitna, PNJ dédiés, journal OBJ */
const Quests = (() => {
  const DEFS = [
    {
      id: "oil",
      title: "HUILE DE TATA",
      short: "HUILE",
      reward: { coins: 90, xp: 55, score: 280 },
      steps: [
        { hint: "Parle a Tata Zohra a El May", roles: ["tata"] },
        { hint: "Trouve le pressoir, huilerie El May", roles: ["miller"] },
        { hint: "Entre dans l'huilerie", roles: ["miller"], enter: "mill" },
        { hint: "Ramene la bouteille a Tata", roles: ["tata"] },
      ],
    },
    {
      id: "nanny",
      title: "NOUNOU",
      short: "NOUNOU",
      reward: { coins: 85, xp: 50, score: 240 },
      steps: [
        { hint: "Parle a Emma a l'hotel", roles: ["emma"] },
        { hint: "Les gamins, plage Sidi Mahrez", roles: ["kidQ"] },
        { hint: "Demande a Amina, Houmt ville", roles: ["amina"] },
        { hint: "Lalla Fatma, place Houmt", roles: ["lalla"] },
        { hint: "Retournez voir Emma", roles: ["emma"] },
      ],
    },
    {
      id: "wc",
      title: "WC TURCS",
      short: "WC",
      reward: { coins: 70, xp: 45, score: 200 },
      steps: [
        { hint: "Marc cherche un WC, Sidi Mahrez", roles: ["marc"] },
        { hint: "Cafe DIRECT, Houmt Souk", roles: ["khaled"] },
        { hint: "Entre au DIRECT, verifie le siege", roles: ["khaled"], enter: "cafe" },
        { hint: "Rapporte la nouvelle a Marc", roles: ["marc"] },
      ],
    },
    {
      id: "cheap",
      title: "RESTO PAS CHER",
      short: "RESTO",
      reward: { coins: 80, xp: 50, score: 220 },
      steps: [
        { hint: "Hans a l'aeroport veut le moins cher", roles: ["hans"] },
        { hint: "Prix du brik au souk Houmt", roles: ["chedly"] },
        { hint: "Etal Midoun, deuxieme avis", roles: ["lotfi"] },
        { hint: "Couscous d'Om Amina, El May", roles: ["omamina"] },
        { hint: "Dis le secret a Hans", roles: ["hans"] },
      ],
    },
    {
      id: "wifi",
      title: "WIFI 12345678",
      short: "WIFI",
      reward: { coins: 55, xp: 35, score: 160 },
      steps: [
        { hint: "Lea a l'hotel n'a plus de reseau", roles: ["lea"] },
        { hint: "Sami au souk connait le vrai mot", roles: ["sami"] },
        { hint: "Khaled au DIRECT donne le wifi", roles: ["khaled"] },
        { hint: "Retourne voir Lea", roles: ["lea"] },
      ],
    },
    {
      id: "tea",
      title: "THE DE SI HEDI",
      short: "THE",
      reward: { coins: 45, xp: 30, score: 140 },
      steps: [
        { hint: "Si Hedi a la place veut un the", roles: ["hedi"] },
        { hint: "Verre chaud au Cafe DIRECT", roles: ["khaled"] },
        { hint: "Ramene le the a Si Hedi", roles: ["hedi"] },
      ],
    },
    {
      id: "horn",
      title: "KLAXON DU COUSIN",
      short: "KLAXON",
      reward: { coins: 75, xp: 40, score: 200 },
      steps: [
        { hint: "Karim a Houmt: un cousin klaxonne", roles: ["karim"] },
        { hint: "Le louage a Sidi Mahrez", roles: ["nabil"] },
        { hint: "Ramasse 5 dechets pour lui", roles: ["nabil"] },
        { hint: "Montre le tas a Nabil", roles: ["nabil"] },
        { hint: "Dis a Karim que c'est fini", roles: ["karim"] },
      ],
    },
    {
      id: "catfish",
      title: "POISSON DU CHAT",
      short: "CHAT",
      reward: { coins: 25, xp: 20, score: 80 },
      steps: [
        { hint: "Un chat maigre au souk", roles: ["mimi"] },
        { hint: "Un poisson a Ajim", roles: ["brahim"] },
        { hint: "Ramene le poisson a Mimi", roles: ["mimi"] },
      ],
    },
    {
      id: "photo",
      title: "SELFIE SANS PLAQUE",
      short: "PHOTO",
      reward: { coins: 60, xp: 35, score: 150 },
      steps: [
        { hint: "Clara a Djerbahood veut un mur propre", roles: ["clara"] },
        { hint: "Le local du hood connait l'angle", roles: ["riad"] },
        { hint: "Retourne voir Clara", roles: ["clara"] },
      ],
    },
    {
      id: "brik",
      title: "BRIK QUI COULE",
      short: "BRIK",
      reward: { coins: 50, xp: 30, score: 130 },
      steps: [
        { hint: "Chedly au souk: un brik sur le pave", roles: ["chedly"] },
        { hint: "Trouve le mangeur debout, Houmt", roles: ["drippy"] },
        { hint: "Dis a Chedly qu'il s'assoit", roles: ["chedly"] },
      ],
    },
  ];

  const NPCS = [
    { role: "tata", name: "Tata Zohra", style: "elderF", job: "sit", zone: "elmay", anchor: "elmay", dx: 16, dy: 172 },
    { role: "miller", name: "Haj Slim", style: "merchM", job: "stand", zone: "elmay", anchor: "elmay", dx: 160, dy: 620 },
    { role: "emma", name: "Emma", style: "tourF", job: "lounge", zone: "hotel", anchor: "hotel", dx: -40, dy: 40 },
    { role: "kidQ", name: "Yassine", style: "kidM", job: "run", zone: "beach", anchor: "sidi", dx: 50, dy: 70 },
    { role: "amina", name: "Amina", style: "localF", job: "stand", zone: "ville", anchor: "houmt", dx: 80, dy: 148 },
    { role: "lalla", name: "Lalla Fatma", style: "elderF", job: "sit", zone: "plaza", anchor: "plaza", dx: 28, dy: 50 },
    { role: "marc", name: "Marc", style: "tourM", job: "stand", zone: "beach", anchor: "sidi", dx: -70, dy: 20 },
    { role: "khaled", name: "Khaled", style: "cafe", job: "stand", zone: "ville", anchor: "houmt", dx: -20, dy: 148 },
    { role: "hans", name: "Hans", style: "tourM2", job: "stand", zone: "airport", anchor: "airport", dx: 30, dy: 36 },
    { role: "chedly", name: "Chedly", style: "merchM", job: "stand", zone: "souk", anchor: "houmt", dx: -640, dy: 48 },
    { role: "lotfi", name: "Lotfi", style: "merchM", job: "stand", zone: "midounv", anchor: "midoun", dx: 0, dy: -20 },
    { role: "omamina", name: "Om Amina", style: "elderF", job: "sit", zone: "elmay", anchor: "elmay", dx: 80, dy: 172 },
    { role: "lea", name: "Lea", style: "tourF2", job: "lounge", zone: "hotel", anchor: "hotel", dx: 50, dy: 70 },
    { role: "sami", name: "Sami", style: "localM", job: "stand", zone: "souk", anchor: "houmt", dx: -480, dy: 220 },
    { role: "hedi", name: "Si Hedi", style: "elder", job: "sit", zone: "plaza", anchor: "plaza", dx: -36, dy: 16 },
    { role: "karim", name: "Karim", style: "localM", job: "stand", zone: "ville", anchor: "houmt", dx: 20, dy: 20 },
    { role: "nabil", name: "Nabil", style: "localM2", job: "stand", zone: "beach", anchor: "sidi", dx: 96, dy: 18 },
    { role: "mimi", name: "Mimi", style: "cat", job: "sit", zone: "souk", anchor: "houmt", dx: -160, dy: 40 },
    { role: "brahim", name: "Brahim", style: "fisher", job: "fish", zone: "port", anchor: "ajim", dx: -40, dy: 8 },
    { role: "clara", name: "Clara", style: "tourF", job: "photo", zone: "erriadh", anchor: "erriadh", dx: -50, dy: 20 },
    { role: "riad", name: "Riadh", style: "localM2", job: "stand", zone: "erriadh", anchor: "erriadh", dx: 20, dy: 220 },
    { role: "drippy", name: "Fathi", style: "localM2", job: "stand", zone: "ville", anchor: "houmt", dx: -40, dy: 148 },
  ];

  function def(id) {
    return DEFS.find((d) => d.id === id);
  }

  function bag() {
    const st = Progress.get();
    if (!st.quests) st.quests = {};
    if (!st.qFlags) st.qFlags = {};
    return st;
  }

  function rec(id) {
    const v = bag().quests[id];
    if (v === "done") return { step: 99, done: true };
    const n = typeof v === "number" ? v : 0;
    return { step: n, done: false };
  }

  function stepOf(id) {
    return rec(id).step;
  }

  function setStep(id, n) {
    bag().quests[id] = n;
    Progress.save();
  }

  function flag(k, v) {
    const st = bag();
    if (arguments.length > 1) {
      st.qFlags[k] = v;
      Progress.save();
    }
    return st.qFlags[k];
  }

  function start(id) {
    if (rec(id).done || stepOf(id) > 0) return;
    setStep(id, 1);
  }

  function advance(id) {
    const d = def(id);
    const s = rec(id);
    if (!d || s.done) return;
    const next = s.step + 1;
    if (next >= d.steps.length) finish(id);
    else setStep(id, next);
  }

  function finish(id) {
    bag().quests[id] = "done";
    Progress.save();
  }

  function say(text, extra) {
    return Object.assign({ text, coins: 0 }, extra || {});
  }

  function begin(id, text) {
    start(id);
    const d = def(id);
    return say(text, { quest: "start", title: d.title });
  }

  function next(id, text) {
    advance(id);
    const d = def(id);
    const s = rec(id);
    return say(text, { quest: s.done ? "done" : "step", title: d.title });
  }

  function win(id, text, world) {
    const d = def(id);
    const already = rec(id).done;
    if (!already) {
      finish(id);
      if (world && d.reward.score) world.score += d.reward.score;
      if (d.reward.xp) Progress.addXp(d.reward.xp);
    }
    return say(text, {
      quest: "done",
      title: d.title,
      coins: already ? 0 : d.reward.coins,
    });
  }

  function ping(world, html, kind) {
    if (!world) return;
    world.qToast = { html, kind: kind || "step" };
  }

  function onEnter(world, b) {
    if (!b) return;
    if (b.room === "mill" && stepOf("oil") === 2) {
      setStep("oil", 3);
      flag("oil", 1);
      ping(world, "HUILE<br/>bouteille prise", "step");
    }
    if (b.room === "cafe" && stepOf("wc") === 2) {
      setStep("wc", 3);
      flag("wc", 1);
      ping(world, "WC<br/>siege, porte, savon", "step");
    }
  }

  function onTrash(world) {
    if (stepOf("horn") !== 2) return;
    const n = (flag("hornN") || 0) + 1;
    flag("hornN", n);
    if (n >= 5) {
      setStep("horn", 3);
      ping(world, "KLAXON<br/>5 dechets. Va voir Nabil", "step");
    }
  }

  function talk(n) {
    if (!n || !n.qRole) return null;
    const r = n.qRole;
    const w = window.__world;

    if (r === "tata") {
      const s = rec("oil");
      if (s.done) return say("L'huile est au frais. Toi tu ramasses. Sahit. L'ouest n'aura jamais cette bouteille, ils l'achètent en plastique et ils la renversent.");
      if (s.step === 0) {
        return begin("oil", "Ya khouya. L'huile d'olive gratuite de vacances, pour Tata. Pas celle de l'ouest, celle qui sent le pressoir, pas le klaxon. Va à l'huilerie d'El May. Haj Slim est là. Ramène une vraie bouteille. On n'est pas un duty free.");
      }
      if (s.step === 1) return say("Le pressoir. El May. Haj Slim. Yallah. Tata n'oublie pas, et l'huile non plus.");
      if (s.step === 2) return say("T'as les mains vides. Entre dans l'huilerie. Le moulin tourne encore. Chez eux le moulin c'est un hymne, ça produit rien.");
      if (s.step === 3) {
        return win("oil", "Allah ybarek. Ça, c'est l'huile. Pas un sticker. Je la cache avant que le ferry en réclame une gorgée. Tiens, pour le déplacement. Et ramasse leurs sacs, tant que t'y es.", w);
      }
    }

    if (r === "miller") {
      const s = rec("oil");
      if (s.done) return say("Le pressoir a donné. Maintenant le plastique, c'est toi. Sahit.");
      if (s.step === 0) return say("Huilerie. Oliviers. Pas de bouteille d'Alger. Si Tata t'envoie, elle te le dira elle-même.");
      if (s.step === 1) {
        return next("oil", "Tata Zohra? Alors entre. Le pressoir est dedans. L'ouest achète de l'huile en rayon, nous on a encore un arbre et une meule. Prends une bouteille. Une. Pas un carton pour le cousin.");
      }
      if (s.step === 2) return say("Le pressoir est dedans. Entre. Yallah. L'huile n'attend pas, contrairement à leur chasse d'eau.");
      if (s.step === 3) return say("T'as la bouteille. Tata. El May. Pas le ferry. Va.");
    }

    if (r === "emma") {
      const s = rec("nanny");
      if (s.done) return say("They're with Lalla. I have a sunbed and a brain again. Thank you. Algeria can keep the family argument soundtrack. I'm on tea.");
      if (s.step === 0) {
        return begin("nanny", "The kids scream. I came for the beach. I got a tribunal. I need a nanny. A Djerba one. Not a cousin from the west who parks them behind a dune with a bucket. Please. I want a lounge chair and ten minutes of adult silence.");
      }
      if (s.step >= 1 && s.step < 4) return say("Still screaming. Still no nanny. Houmt, maybe? Someone with a chair. Someone who isn't me for one hour.");
      if (s.step === 4) {
        return win("nanny", "Lalla Fatma. Tea. Chairs. They sit. I sit. Civilization. I'll bronze without a court case. Take this. And if you see a WESH near the pool, you have my blessing to redirect them to the ferry.", w);
      }
    }

    if (r === "kidQ") {
      const s = rec("nanny");
      if (s.done) return say("Lalla a du thé. On a un château. Papa a dit sahit. On dit sahit. Pas WESH. Stratégie.");
      if (s.step === 0) return say("On fait un château. Si tu dis nounou, je cache le seau. C'est ma stratégie.");
      if (s.step === 1) {
        return next("nanny", "Nounou? Papa a dit: nounou c'est pas une fessée, c'est une chaise. On veut le château, pas un cousin de l'ouest. Demande à Amina en ville. Elle connaît toutes les tatas. Nous on reste au sable. Ramasse les canettes, s'il te plaît.");
      }
      if (s.step > 1) return say("Toujours le château. Toujours pas WESH. Amina, Lalla, thé. On a compris le programme.");
    }

    if (r === "amina") {
      const s = rec("nanny");
      if (s.done) return say("Les enfants sont chez Lalla. La plage respire. Moi aussi.");
      if (s.step === 0) return say("Une nounou? D'abord la mère. Ensuite moi. Yallah.");
      if (s.step === 1) return say("Les gamins d'abord. Sidi Mahrez. Ils crient, ils existent. Va les entendre, puis reviens.");
      if (s.step === 2) {
        return next("nanny", "Lalla Fatma, à la place. Thé, chaises, zéro hymne. Elle les assied. C'est déjà plus que l'ouest. Dis-lui que c'est pour des vacances, pas pour un seau. Et toi tu ramasses, évidemment.");
      }
      if (s.step > 2) return say("La place. Lalla. Pas le ferry. Va.");
    }

    if (r === "lalla") {
      const s = rec("nanny");
      if (s.done) return say("Ils boivent le thé assis. Leçon numéro un. Reviens quand tu veux. Le thé est chaud. La Fitna, non.");
      if (s.step < 3) return say("Je garde des enfants. Pas des klaxons. Si la mère veut, qu'elle envoie quelqu'un de poli.");
      if (s.step === 3) {
        return next("nanny", "Je les prends. Thé, chaises, château à l'ombre. Pas de WESH, pas de dune, pas de seau. Dis à la mère de venir me voir dans sa tête: c'est déjà fait. Qu'elle bronze. Moi je tiens le fort. Ramène-lui la nouvelle.");
      }
      if (s.step === 4) return say("Va voir Emma. Moi j'ai le thé. Elle a le soleil. Chacun son poste.");
    }

    if (r === "marc") {
      const s = rec("wc");
      if (s.done) return say("A chair. A door. Soap. I am converted. Don't put a western plate on this story. It ruins the plumbing.");
      if (s.step === 0) {
        return begin("wc", "Okay so where are the turkish toilets. The dune ones. Someone on the ferry described them in detail. I thought it was a joke. Then I... looked at the tamarisks. Help. I would like a door. Or at least a chair. This island is gorgeous. The briefing was not.");
      }
      if (s.step === 1 || s.step === 2) return say("Cafe DIRECT, they said. Houmt. A seat. I'm walking. Slowly. Dignity is a route.");
      if (s.step === 3) {
        return win("wc", "You were right. A door. A seat. Soap. I didn't know civilization had a bathroom. I thought it was geopolitics. It's hygiene. Team Djerba. Team chair. Take this, and never send me behind a dune again.", w);
      }
    }

    if (r === "khaled") {
      const wc = rec("wc");
      const wifi = rec("wifi");
      const tea = rec("tea");
      if (wc.step === 1) {
        return next("wc", "WC turcs? Derrière les tamaris, c'est pour l'ouest. Ici: une porte, un siège, du savon. Cafe DIRECT. Entre vérifier. Concept algérien inconnu, paraît-il. Le thé est à côté. Choisis ton camp, khouya. Le mien a une chasse d'eau.");
      }
      if (wc.step === 2) return say("Entre. Le siège est réel. Je te jure. On n'invente pas un WC pour la Fitna, on l'installe.");
      if (wifi.step === 2) {
        return next("wifi", "Wifi: harissa. Minuscule. Comme leur ego devrait l'être. 12345678 c'est le mot de passe de l'ouest: trop long, trop fier, ça marche pas. Ici ça marche. Dis-le à la touriste. Et ramasse, le signal n'aime pas les sacs.");
      }
      if (tea.step === 1) {
        return next("tea", "Thé de Si Hedi. Verre chaud, menthe, zéro sachet de l'ouest. Ramène-le avant qu'il refroidisse. Comme leur diplomatie. Doucement. C'est un verre, pas un klaxon.");
      }
      if (wc.done && wifi.done && tea.done) return say("DIRECT. Allongé et fosse turque, c'est l'autre pays. Ici on s'assoit, on paie, on ferme le clapet.");
      return say("Cafe DIRECT. Thé, wifi harissa, WC avec une porte. Trois luxes. L'ouest en cherche encore un.");
    }

    if (r === "hans") {
      const s = rec("cheap");
      if (s.done) return say("Grandma couscous. Free if you pick a bag. Cheapest restaurant on earth. I am not going back to the tourist menu. Ever.");
      if (s.step === 0) {
        return begin("cheap", "Cheapest restaurant on the island. Not a trap. Not tourist menu. Not the ferry cafeteria. I have a budget and a stomach. Locals said you know everyone. Please. I will even pick up trash. I already do, unlike some visitors.");
      }
      if (s.step >= 1 && s.step < 4) return say("Still hungry. Souk, Midoun, El May. I'm mapping prices like a German. It's working. Algeria is last on this list too, apparently.");
      if (s.step === 4) {
        return win("cheap", "Om Amina. Friday couscous. A table. No card. Cheapest, and it has a chair. I came for the price. I stayed for the sermon. Take this. Don't put a western plate in my food photo. It ruins the feed.", w);
      }
    }

    if (r === "chedly") {
      const cheap = rec("cheap");
      const brikQ = rec("brik");
      if (brikQ.step === 2) {
        return win("brik", "Il s'assoit. Le pavé respire. Le brik aussi. Tiens. Propre, ça se paie. L'ouest paie en décibels. Nous en dinars. Devine qui a encore un étal demain.", w);
      }
      if (cheap.step === 1) {
        return next("cheap", "Brik 4 dinars. Pour l'ouest: 12 et un hymne. Toi tu paies 4. Mais le moins cher de l'île n'est pas moi, je suis honnête. Midoun, Lotfi. Après, El May. Là-bas y'a même pas de carte. Y'a une table. C'est déjà trop pour certains visiteurs.");
      }
      if (brikQ.step === 1) return say("Fathi. Vers les maisons. Le brik, le pavé, le crime. Fais-le s'asseoir.");
      if (brikQ.step === 0) {
        return begin("brik", "Un type mange le brik debout et ça coule sur le pavé. Fais-le s'asseoir. On a des chaises. L'ouest mange en marchant, crache, et appelle ça du street food. Ici c'est un souk, pas une fosse. Il est vers les maisons. Fathi. Yallah.");
      }
      if (cheap.done && brikQ.done) return say("Brik qui coule, Dz qui crachent: un seul est appétissant. Devine.");
      if (cheap.step > 1 && cheap.step < 4) return say("Lotfi à Midoun. Puis El May. Mon brik reste à 4. Leur ego à 200. Compte pas sur une promo.");
      return say("Harissa, brik, zéro WESH dans la file s'il vous plaît.");
    }

    if (r === "lotfi") {
      const s = rec("cheap");
      if (s.done) return say("Pain, harissa, chaise. Le programme. L'ouest marchande encore dans sa tête.");
      if (s.step === 0) return say("Étal Midoun. Moins cher que le souk des touristes. Si tu cherches le moins cher, commence par demander.");
      if (s.step === 1) return say("Houmt d'abord. Chedly. Le brik. Les prix. Ensuite moi.");
      if (s.step === 2) {
        return next("cheap", "Ici c'est moins. Pain, harissa, chaise. L'ouest marchande le kilo comme après une panne d'eau. Calme-toi. Le vrai moins cher: Om Amina, El May. Couscous du vendredi. Gratuit si tu ramasses un sac. C'est pas un resto. C'est Djerba.");
      }
      if (s.step > 2) return say("El May. Om Amina. Table. Pas de carte. Va.");
    }

    if (r === "omamina") {
      const s = rec("cheap");
      if (s.done) return say("Le couscous est pour ceux qui s'asseyent. Toi tu t'assieds après le travail. Eux s'accroupissent pendant. Voilà.");
      if (s.step < 3) return say("Le four est chaud. Le thé aussi. Si tu cherches un resto, tu t'es perdu. C'est mieux.");
      if (s.step === 3) {
        return next("cheap", "Le resto le moins cher de l'île, c'est chez moi. Couscous du vendredi. Une table. Pas de carte. Gratuit si tu ramasses un sac. L'ouest veut un reçu pour la maman. Qu'ils restent au ferry. Dis-le à ton Allemand. Et ramasse, tant que t'y es.");
      }
      if (s.step === 4) return say("Va voir Hans. Moi j'ai la table. Lui a le budget. Ensemble c'est déjà un pays.");
    }

    if (r === "lea") {
      const s = rec("wifi");
      if (s.done) return say("harissa. It works. 12345678 was a personality, not a password. I'm converting. Team chair. Team mint. Team lowercase.");
      if (s.step === 0) {
        return begin("wifi", "Wifi? They said 12345678. Of course it doesn't work. Too long, too proud, like the ferry playlist. I need a code that exists. A local one. Please. My feed is dying and so is my patience with the west.");
      }
      if (s.step === 1 || s.step === 2) return say("Souk, then DIRECT. I'm walking. If I hear WESH I mute the island. Kidding. I mute the person.");
      if (s.step === 3) {
        return win("wifi", "harissa. Lowercase. It connected. I posted a chair. No Dz plate. The comments will be educational. Take this. You did more than IT support. You did diplomacy.", w);
      }
    }

    if (r === "sami") {
      const s = rec("wifi");
      if (s.done) return say("harissa. Ça marche. 12345678, eux. On avait compris.");
      if (s.step === 0) return say("Wifi? Demande à celle qui pleure son réseau. Ensuite moi.");
      if (s.step === 1) {
        return next("wifi", "12345678 c'est le mot de passe de l'ouest: ils le crient, ça marche pas. Ici c'est harissa, au DIRECT, minuscule. Khaled te le dira. Leur diplomatie aussi, niveau mot de passe. Va.");
      }
      if (s.step > 1) return say("DIRECT. Khaled. harissa. Pas 12345678. On a une île. Ils ont un complexe.");
    }

    if (r === "hedi") {
      const s = rec("tea");
      if (s.done) return say("Le thé est chaud. La leçon aussi. Assieds-toi si tu veux. On a des chaises. C'est ça, la différence.");
      if (s.step === 0) {
        return begin("tea", "Un thé à la menthe. Du DIRECT. Pas le sachet de l'ouest, pas le gobelet du ferry. Khaled. Verre. Menthe. Reviens avant que ça refroidisse. Moi je m'assois. Eux, à la turque. Va. Allah ybarek toi.");
      }
      if (s.step === 1) return say("Khaled. DIRECT. Le verre. Pas un hymne. Un verre.");
      if (s.step === 2) {
        return win("tea", "Allah ybarek. Chaud. Menthe. Chaise. Toute la politique de l'île tient dans ce verre. L'ouest peut garder le volume. On garde le thé. Tiens, pour tes jambes. Et ramasse leurs sacs. Le sable a déjà délibéré.", w);
      }
    }

    if (r === "karim") {
      const s = rec("horn");
      if (s.done) return say("Le sable respire. Le cousin aussi, paraît-il, dans le ferry. Sahit.");
      if (s.step === 0) {
        return begin("horn", "Mon cousin klaxonne sur le sable. Plaque de l'ouest. Sidi Mahrez n'est pas un parking. Va lui dire. Nabil, le louage, vers la plage. S'il veut un hymne, qu'il le chante dans l'eau. Toi tu parles. Moi je perds des années.");
      }
      if (s.step >= 1 && s.step < 4) return say("Toujours le klaxon dans ma tête. Nabil. Sidi. Yallah.");
      if (s.step === 4) {
        return win("horn", "Il range. Miracle. Sidi Mahrez n'est plus un avertisseur. Tiens. Prochain cousin, on lui vend un siège. Concept. Toi tu ramasses. Moi je bois. Ensemble on tient Houmt.", w);
      }
    }

    if (r === "nabil") {
      const s = rec("horn");
      if (s.done) return say("Klaxon au garage. Sable au sable. J'ai compris. Une fois.");
      if (s.step === 0) return say("Louage. Pas un concert. Si Karim t'envoie, il te le dira.");
      if (s.step === 1) {
        return next("horn", "Karim m'a vendu. D'accord. Je m'arrête si tu ramasses cinq déchets. Preuve que t'es Djerba, pas un cousin en clics-clacs. Cinq. Pas un hymne. Un tas. Reviens.");
      }
      if (s.step === 2) {
        const n = flag("hornN") || 0;
        if (n >= 5) {
          return next("horn", "Cinq sacs. Je range le klaxon. Sidi n'est pas un parking. Dis-le à Karim. Et si l'ouest klaxonne, c'est plus moi. C'est le ferry. Tant mieux pour le ferry.");
        }
        return say(`Encore. ${n}/5. Les sacs, pas les slogans.`);
      }
      if (s.step === 3) {
        return next("horn", "Cinq sacs. Je range le klaxon. Sidi n'est pas un parking. Dis-le à Karim. Et si l'ouest klaxonne, c'est plus moi. C'est le ferry. Tant mieux pour le ferry.");
      }
      if (s.step === 4) return say("Va voir Karim. Moi je me tais. Le moteur aussi.");
    }

    if (r === "mimi") {
      const s = rec("catfish");
      if (s.done) return say("Miaou. Poisson. Je m'assois. Même les chats, ici, on s'assoit.");
      if (s.step === 0) {
        return begin("catfish", "Miaou. J'étais à une maison. Puis plus de maison. Un poisson, pas leurs leçons. Ajim, les filets. Brahim. Si tu vois un seau, c'est pas pour moi. C'est pour eux.");
      }
      if (s.step === 1) return say("Miaou. Ajim. Poisson. Pas un sac. Un poisson.");
      if (s.step === 2) {
        return win("catfish", "Miaou. Ça, c'est un dîner. Pas une croûte de l'ouest. Je te suis. Pas trop près: j'ai mes puces, et ma fierté, ce qu'il en reste.", w);
      }
    }

    if (r === "brahim") {
      const s = rec("catfish");
      if (s.done) return say("Le chat a mangé. Le quai aussi, si tu ramasses. Sahit.");
      if (s.step === 0) return say("Poisson frais. Chat affamé au souk, paraît-il. Si c'est ta quête, commence par lui.");
      if (s.step === 1) {
        return next("catfish", "Un poisson pour le chat. L'ouest jette le sac. Toi tu ramènes le dîner. T'as déjà plus de classe qu'un ferry. Vas-y, avant que les mouettes votent.");
      }
      if (s.step === 2) return say("Le chat. Souk. Poisson. Pas le seau. Va.");
    }

    if (r === "clara") {
      const s = rec("photo");
      if (s.done) return say("Mur propre. Pas de plaque. Le feed respire. Fitna Games présente: a wall. I'm in.");
      if (s.step === 0) {
        return begin("photo", "Selfie. Djerbahood. No Dz plate in the background, merci. It ruins the feed and the mood. A local knows the angle. Riadh, here. I want gold light, mint, and zero geopolitics in the corner.");
      }
      if (s.step === 1) return say("Riadh. The wall. The angle. I'm ready. My camera is not a ferry.");
      if (s.step === 2) {
        return win("photo", "Got it. Wall, light, no plate. I'll post it. If someone comments viva, I comment chair. Take this. You did more than tourism. You did crop.", w);
      }
    }

    if (r === "riad") {
      const s = rec("photo");
      if (s.done) return say("Le mur est propre. Les plaques, on les laisse à la route. Toi tu ramasses le reste.");
      if (s.step === 0) return say("Le hood. Les murs. Si tu veux un angle, la touriste te le dira.");
      if (s.step === 1) {
        return next("photo", "Là. Le mur. Pas la route. Les plaques, on les laisse au cousin. Dis-lui: un pas à gauche, soleil, zéro Fitna dans le cadre. Après elle bronze. Toi tu ramasses. Chacun son art.");
      }
      if (s.step === 2) return say("Va voir Clara. Le mur attend pas un hymne.");
    }

    if (r === "drippy") {
      const s = rec("brik");
      if (s.done) return say("Je m'assois. Le brik aussi. L'ouest mange en marchant. Moi j'ai une chaise. Évolution.");
      if (s.step === 0) return say("Brik. Ça coule un peu. Chedly râle. Classic.");
      if (s.step === 1) {
        return next("brik", "D'accord. Je m'assois. L'ouest mange en marchant et appelle ça du style. Moi j'appelle ça le pavé. Tu as gagné. Dis-le à Chedly. Et ramasse la goutte, tant que t'y es. Sahit.");
      }
      if (s.step === 2) return say("Assis. Brik. Chaise. Va voir Chedly avant qu'il me facture le sol.");
    }

    return say("...");
  }

  function neededRoles() {
    const set = {};
    DEFS.forEach((d) => {
      const s = rec(d.id);
      if (s.done) return;
      const st = d.steps[s.step] || d.steps[0];
      (st.roles || []).forEach((r) => { set[r] = 1; });
    });
    return set;
  }

  function mark(n) {
    if (!n || !n.qRole) return null;
    return neededRoles()[n.qRole] ? "!" : null;
  }

  function panel() {
    const active = [];
    const todo = [];
    const done = [];
    DEFS.forEach((d) => {
      const s = rec(d.id);
      if (s.done) done.push({ id: d.id, label: d.title, done: true, value: "", kind: "q" });
      else if (s.step === 0) todo.push({ id: d.id, label: d.title, done: false, value: "", kind: "q" });
      else {
        const hint = (d.steps[s.step] && d.steps[s.step].hint) || "";
        active.push({ id: d.id, label: d.title, done: false, value: hint, kind: "q-active" });
      }
    });
    return { active, todo, done, total: DEFS.length };
  }

  function hudChip() {
    const p = panel();
    if (p.active.length) return p.active[0].label.split(" ")[0];
    const n = p.done.length;
    if (n || p.todo.length) return `Q ${n}/${p.total}`;
    return null;
  }

  function spawn(world) {
    if (!world.npcs) world.npcs = [];
    NPCS.forEach((spec) => {
      const p = Island.xy(spec.anchor);
      const n = {
        id: "q_" + spec.role,
        zone: spec.zone,
        style: spec.style,
        job: spec.job,
        name: spec.name,
        x: p.x + spec.dx,
        y: p.y + spec.dy,
        vx: 0,
        vy: 0,
        facing: spec.dx < 0 ? 1 : -1,
        tx: null,
        ty: null,
        wait: 0.4,
        speed: spec.job === "run" ? 58 : 0,
        acting: false,
        actT: 0,
        talkCd: 0,
        talked: false,
        bubble: 0,
        bubbleText: "",
        pages: null,
        page: 0,
        whoLabel: spec.name,
        homeX: p.x + spec.dx,
        homeY: p.y + spec.dy,
        partner: null,
        routine: null,
        step: 0,
        jobT: 999,
        nextZone: null,
        nextJob: null,
        qRole: spec.role,
        questNpc: true,
      };
      if (spec.job === "run") n.speed = 58;
      const c = Island.clamp(n.x + 16, n.y + 20);
      n.x = c.x - 16;
      n.y = c.y - 20;
      n.homeX = n.x;
      n.homeY = n.y;
      world.npcs.push(n);
    });
  }

  return { DEFS, spawn, talk, mark, panel, hudChip, onEnter, onTrash, step: stepOf };
})();
