/* Campagne DJERBA PROPRE — niveaux + histoire */
const Campaign = (() => {
  const LEVELS = [
    {
      id: 1,
      code: "SIDI",
      name: "Sidi Mahrez",
      chapter: "Chapitre 1",
      subtitle: "Le premier matin",
      theme: "beach",
      time: 150,
      trash: 22,
      bagRatio: 0.25,
      bagTarget: 4,
      recycleTarget: 10,
      cleanTarget: 75,
      spawn: false,
      mapX: 72,
      mapY: 70,
      storyBefore: [
        { who: "MAIRIE", text: "Bienvenue, Nettoyeur ! Djerba a besoin de toi." },
        { who: "TOI", text: "Je suis pret. Par ou commencer ?" },
        { who: "MAIRIE", text: "Sidi Mahrez. Une belle plage... trop de dechets." },
        { who: "OBJECTIF", text: "Apprends a ramasser et recycler. 75% propre !" },
      ],
      storyAfter: [
        { who: "MAIRIE", text: "Bravo ! La plage respire deja mieux." },
        { who: "TOI", text: "Direction Houmt Souk ?" },
        { who: "MAIRIE", text: "Oui. Le marche laisse beaucoup de sacs..." },
      ],
    },
    {
      id: 2,
      code: "SOUK",
      name: "Houmt Souk",
      chapter: "Chapitre 2",
      subtitle: "Sacs du marche",
      theme: "souk",
      time: 160,
      trash: 28,
      bagRatio: 0.45,
      bagTarget: 8,
      recycleTarget: 14,
      cleanTarget: 80,
      spawn: true,
      mapX: 40,
      mapY: 110,
      storyBefore: [
        { who: "MARCHAND", text: "Les sacs plastiques volent jusqu'a la mer !" },
        { who: "TOI", text: "Je vais les attraper avec ma pince-scorpion." },
        { who: "OBJECTIF", text: "Collecte beaucoup de SACS, puis recycle." },
      ],
      storyAfter: [
        { who: "MARCHAND", text: "Merci ! Le souk est fier de toi." },
        { who: "MAIRIE", text: "Midoun t'attend. Les touristes arrivent..." },
      ],
    },
    {
      id: 3,
      code: "MIDOUN",
      name: "Plage Midoun",
      chapter: "Chapitre 3",
      subtitle: "Coup de vent",
      theme: "beach",
      time: 140,
      trash: 32,
      bagRatio: 0.3,
      bagTarget: 7,
      recycleTarget: 16,
      cleanTarget: 80,
      spawn: true,
      mapX: 150,
      mapY: 95,
      storyBefore: [
        { who: "GUIDE", text: "Le vent a etale les dechets partout !" },
        { who: "TOI", text: "Balai + pince. On accelere." },
        { who: "OBJECTIF", text: "Temps serre. Vise 80% et recycle vite." },
      ],
      storyAfter: [
        { who: "GUIDE", text: "Les visiteurs applaudissent !" },
        { who: "MAIRIE", text: "La lagune est fragile. Va-y delicatement." },
      ],
    },
    {
      id: 4,
      code: "LAGUNE",
      name: "Lagune Bin El Ouedian",
      chapter: "Chapitre 4",
      subtitle: "Eau sacree",
      theme: "lagoon",
      time: 170,
      trash: 30,
      bagRatio: 0.35,
      bagTarget: 8,
      recycleTarget: 15,
      cleanTarget: 85,
      spawn: true,
      mapX: 110,
      mapY: 150,
      storyBefore: [
        { who: "PECHEUR", text: "Les filets se coincent dans le plastique..." },
        { who: "TOI", text: "Je protege la lagune. Promis." },
        { who: "OBJECTIF", text: "85% propre. Capacité et recyclage critiques." },
      ],
      storyAfter: [
        { who: "PECHEUR", text: "Les flamants reviendront. Merci." },
        { who: "MAIRIE", text: "Le port d'Ajim est le prochain defi." },
      ],
    },
    {
      id: 5,
      code: "AJIM",
      name: "Port d'Ajim",
      chapter: "Chapitre 5",
      subtitle: "Traversier",
      theme: "port",
      time: 155,
      trash: 36,
      bagRatio: 0.28,
      bagTarget: 8,
      recycleTarget: 18,
      cleanTarget: 80,
      spawn: true,
      mapX: 28,
      mapY: 180,
      storyBefore: [
        { who: "CAPITAINE", text: "Le ferry laisse des traces a chaque traversee." },
        { who: "TOI", text: "Je nettoie le quai avant le prochain bateau." },
        { who: "OBJECTIF", text: "Beaucoup de canettes. Recycle sans deborder." },
      ],
      storyAfter: [
        { who: "CAPITAINE", text: "Tu as le coeur d'un vrai Djerbien." },
        { who: "MAIRIE", text: "Aghir au coucher du soleil... attention." },
      ],
    },
    {
      id: 6,
      code: "AGHIR",
      name: "Plage Aghir",
      chapter: "Chapitre 6",
      subtitle: "Crepuscule",
      theme: "sunset",
      time: 145,
      trash: 40,
      bagRatio: 0.33,
      bagTarget: 10,
      recycleTarget: 20,
      cleanTarget: 85,
      spawn: true,
      mapX: 180,
      mapY: 160,
      storyBefore: [
        { who: "ENFANT", text: "La plage brille... mais c'est du plastique !" },
        { who: "TOI", text: "Ce soir, elle brillera pour de vrai." },
        { who: "OBJECTIF", text: "Difficile. Combo et upgrades recommandes." },
      ],
      storyAfter: [
        { who: "ENFANT", text: "WAAW ! On peut rejouer au football ici." },
        { who: "MAIRIE", text: "Zone hoteliere : le plus gros chantier." },
      ],
    },
    {
      id: 7,
      code: "HOTEL",
      name: "Zone Hoteliere",
      chapter: "Chapitre 7",
      subtitle: "Maree touristique",
      theme: "resort",
      time: 135,
      trash: 46,
      bagRatio: 0.4,
      bagTarget: 12,
      recycleTarget: 22,
      cleanTarget: 85,
      spawn: true,
      mapX: 200,
      mapY: 70,
      storyBefore: [
        { who: "HOTELIER", text: "Les clients aiment Djerba propre. Aide-nous !" },
        { who: "TOI", text: "Upgrade ta brouette. Ca va charger." },
        { who: "OBJECTIF", text: "Vague de dechets. Ne laisse rien au timer." },
      ],
      storyAfter: [
        { who: "HOTELIER", text: "5 etoiles pour toi aussi !" },
        { who: "MAIRIE", text: "Derniere etape : la Grande Plage du Festival." },
      ],
    },
    {
      id: 8,
      code: "FESTIVAL",
      name: "Grande Plage Festival",
      chapter: "Finale",
      subtitle: "Djerba Rayonnante",
      theme: "festival",
      time: 180,
      trash: 55,
      bagRatio: 0.35,
      bagTarget: 14,
      recycleTarget: 28,
      cleanTarget: 90,
      spawn: true,
      mapX: 120,
      mapY: 40,
      storyBefore: [
        { who: "MAIRIE", text: "Le festival commence demain. Toute l'ile regarde." },
        { who: "TOI", text: "Pour Djerba. Pour la mer. Allons-y !" },
        { who: "OBJECTIF", text: "90% propre. Le challenge ultime." },
      ],
      storyAfter: [
        { who: "FOULE", text: "DJERBA PROPRE ! DJERBA PROPRE !" },
        { who: "MAIRIE", text: "Tu es le heros de l'ile. Merci, Nettoyeur." },
        { who: "TOI", text: "Ce n'est que le debut. On garde Djerba belle." },
      ],
    },
  ];

  const INTRO = [
    { who: "NARRATOR", text: "L'ile de Djerba brille sous le soleil..." },
    { who: "NARRATOR", text: "Mais plastique et canettes envahissent ses plages." },
    { who: "MAIRIE", text: "Nous cherchons un Nettoyeur courageux." },
    { who: "TOI", text: "Present ! Avec ma pince-scorpion, je m'en charge." },
    { who: "MAIRIE", text: "Huit lieux. Une ile a sauver. Es-tu pret ?" },
  ];

  const ENDING = [
    { who: "NARRATOR", text: "Le festival s'ouvre sur une plage immaculee." },
    { who: "MAIRIE", text: "Grace a toi, Djerba inspire le monde." },
    { who: "TOI", text: "Ensemble, on garde l'ile propre. Toujours." },
    { who: "NARRATOR", text: "FIN... pour l'instant. Rejoue pour 3 etoiles !" },
  ];

  function get(id) {
    return LEVELS.find((l) => l.id === id) || LEVELS[0];
  }

  function list() {
    return LEVELS;
  }

  function nextId(id) {
    const i = LEVELS.findIndex((l) => l.id === id);
    if (i < 0 || i >= LEVELS.length - 1) return null;
    return LEVELS[i + 1].id;
  }

  function isFinale(id) {
    return id === LEVELS[LEVELS.length - 1].id;
  }

  return { LEVELS, INTRO, ENDING, get, list, nextId, isFinale };
})();
