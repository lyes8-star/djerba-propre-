# Musiques — DJERBA 2 · EAU PROPRE

Musiques de fond en **MP3 téléchargés** (pas de synthèse procédurale, pas d'ambiances océan/pluie/vent).

## Fichiers

| Fichier | Usage |
|---------|--------|
| `music/beach.mp3` | Plage, mer, lagune, coucher de soleil, zone hôtelière |
| `music/medina.mp3` | Médina, souk, ville, port, intro, titre, histoire, festival |

## Ajouter une piste

1. Dépose un `.mp3` dans `audio/music/`.
2. Mappe le thème dans `js/audio.js` → objet `TRACKS`.
3. Les alias de zone restent dans `ALIAS` (ex. `aghir → beach`).

## Effets sonores

| Fichier | Usage |
|---------|--------|
| `sfx/splash.mp3` | Nage, boire de l'eau |
| `sfx/footstep.mp3` | Pas sur le sol |

Les autres SFX (pickup, recycle, clic…) restent des bips légers générés en Web Audio.
