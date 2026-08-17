# DJERBA PROPRE

Web app mobile **pixel art** — nettoie les plages de Djerba, recycle, améliore ta **pince scorpion** et monte de niveau.

## Lancer le jeu

Ouvre le fichier [`index.html`](index.html) dans un navigateur moderne (Chrome / Safari / Firefox), ou sers le dossier en local :

```bash
python3 -m http.server 8080
```

Puis va sur `http://localhost:8080`.

## Contrôles

| Mobile | Desktop |
|--------|---------|
| Joystick gauche (transparent) | WASD / flèches |
| Bouton PINCE | Espace ou E |
| **OBJ** | Objectifs (pop-up) |
| **MENU** | Outils, upgrades, défis, shop |
| **||** | Pause |
| Double-tap bouton / Q | Bascule Pince / Balai |

## Gameplay

1. Ramasse canettes, bouteilles et sacs avec la **pince (scorpion)**.
2. Approche-toi de la **poubelle** et utilise l’action pour **recycler**.
3. Approche un habitant ou un touriste (point d’exclamation) et appuie sur **PARLER**.
4. Atteins **80 % plage propre** pour le bonus SUPER (+500 pts, +30s).
5. Dépense tes pièces dans **Améliorations** pour évoluer les outils.
6. Complète les **Défis du jour** pour une récompense.

Progression sauvegardée dans `localStorage` (`djerba-propre-save`).

## Campagne

8 niveaux sur l'ile de Djerba avec **histoire** (prologue, dialogues, epilogue) :

1. Sidi Mahrez · 2. Houmt Souk · 3. Midoun · 4. Lagune · 5. Port d'Ajim · 6. Aghir · 7. Zone Hoteliere · 8. Festival

Debloque les niveaux en gagnant des etoiles. Carte interactive + partie rapide dispo.

## Polish

- UI pixel pro : police Press Start 2P, cadres, scanlines, scale entier
- Canvas **256×384** + themes par niveau
- FX : particules, combos, anneaux, shake
- Musiques titre / gameplay (Web Audio orientale retro)
- Habitants et touristes dans chaque quartier (plage, souk, ville, port) : parle-leur

## Stack

HTML / CSS / JS vanilla · Canvas 2D pixel art · Web Audio (musique orientale rétro)
