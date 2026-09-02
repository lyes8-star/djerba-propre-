# DJERBA 2 · EAU PROPRE

Web app mobile **pixel art** — monde ouvert GTA sur l'île de Djerba : nettoie les plages, recycle, explore toute l'île, gère la **pénurie d'eau propre** aux **marchés d'eau**, améliore ta **pince scorpion** et monte de niveau.

## Lancer le jeu

Ouvre le fichier [`index.html`](index.html) dans un navigateur moderne (Chrome / Safari / Firefox), ou sers le dossier en local :

```bash
python3 -m http.server 8080
```

Puis va sur `http://localhost:8080`.

## Contrôles

| Mobile | Desktop |
|--------|---------|
| Joystick **MOVE** (gauche) | WASD |
| Joystick **CAM** (droite) | Flèches |
| Bouton PINCE / PARLER | Espace ou E |
| **OBJ** | Objectifs (pop-up) |
| **MENU** | Outils, upgrades, défis, shop |
| **||** | Pause |
| Double-tap bouton / Q | Bascule Pince / Balai |

## Gameplay

1. Ramasse canettes, bouteilles et sacs avec la **pince (scorpion)**.
2. Approche-toi de la **poubelle** et utilise l'action pour **recycler**.
3. Approche un habitant ou un touriste (point d'exclamation) et appuie sur **PARLER**.
4. **Soif** : ta jauge d'eau baisse en explorant l'île (plus vite à la plage). Approche un étal **EAU** marqué sur la carte et appuie sur **MARCHE** pour acheter des bouteilles.
5. Atteins **80 % plage propre** pour le bonus SUPER (+500 pts, +30s).
6. Dépense tes pièces dans **Améliorations** pour évoluer les outils.
7. Complète les **Défis du jour** pour une récompense.
8. Quête **EAU PROPRE** : parle à Salim au marché de Houmt Souk.

Progression sauvegardée dans `localStorage` (`djerba2-eau-propre-save`).

## Monde ouvert

- **Île entière** en pixel art détaillé : Houmt Souk, Midoun, Ajim, El May, Guellala, Aghir, Erriadh, zone hôtelière, aéroport…
- **9 étals d'eau** répartis sur la carte — prix variables selon la **pénurie du jour**
- Taxi, intérieurs, habitants, trafic, quêtes à étapes

## Campagne

8 niveaux sur l'ile de Djerba avec **histoire** (prologue, dialogues, epilogue) :

1. Sidi Mahrez · 2. Houmt Souk · 3. Midoun · 4. Lagune · 5. Port d'Ajim · 6. Aghir · 7. Zone Hoteliere · 8. Festival

Debloque les niveaux en gagnant des etoiles. Carte interactive + **monde libre** dispo.

## Polish

- UI pixel pro : police Press Start 2P, cadres, scanlines, scale entier
- Canvas **256×384** + themes par niveau
- FX : particules, combos, anneaux, shake
- Musiques titre / gameplay (Web Audio orientale retro)
- Habitants et touristes dans chaque quartier (plage, souk, ville, port) : parle-leur
- **Textures PBR réalistes** (CC0) : sable, herbe, pavé, routes, bâtiments, végétation — voir `textures/README.md`

## Stack

HTML / CSS / JS vanilla · Canvas 2D pixel art · Web Audio (musique orientale rétro)
