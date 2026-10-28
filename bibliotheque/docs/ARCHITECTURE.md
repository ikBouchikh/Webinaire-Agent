# Architecture (phase 2, mise à jour V5 lot A)

## Principes

1. **Ouvrir par double-clic** : uniquement des scripts classiques (`<script src>`), pas de modules ES ni de `fetch` (bloqués sur `file://`). Les JSON d'édition sont agrégés par `tools/build-data.py` en fichiers `.js` (`window.LDC_*`).
2. **Séparation contenu / code** : aucun texte commercial, aucun libellé produit dans le JavaScript. Tout vient de `data/` (généré depuis les sources) ou de `content/` (édité).
3. **Une seule source de vérité par donnée** : produits → `data/catalogue.js` ; compétences → `data/rome4-compact.js` ; textes → `content/*.json` ; pondérations → `data/matching-config.js`.
4. **Un module = une responsabilité** (pas de découpage gratuit : 14 fichiers dans `src/`, chacun avec une raison d'être).
5. **Dégradation contrôlée** : sans WebGL → version statique ; sans vidéo → séquence procédurale ; sans mapping ROME → encart « À VALIDER » ; stockage local indisponible → mémoire.

## Flux de données

```
Base_produits_2027.xlsx ─┐
ROME4_V62_Vue_Consolidee.xlsx ─┤  tools/build-data.py  ──►  data/catalogue.js      (window.LDC_CATALOGUE)
content/*.json ─────────────────┘   (validation bloquante)    data/rome4-compact.js   (window.LDC_ROME4)
                                                              content/content.bundle.js (window.LDC_CONTENT)

navigateur : catalogue.js (index, mondes, stations) ─► scene-*.js (3D) ─► app.js (orchestration)
             rome.js (compétences, mapping validé, correspondance) ─► sheet.js · selection.js
             core.js (état local, panneaux)  ·  cognitio.js (guide)  ·  transition.js  ·  vision.js
```

## Modèle de scène

- **Monde 1 – Grande salle** (`scene-hall.js`) : rotonde R = 11 m, galerie, dôme, six portes aux angles `DOOR0 − k·π/3` avec `DOOR0 = π` (la porte I, Droit, est au fond de la salle, derrière le Code civil ; les autres suivent vers la droite), le Code civil seul au centre (x = 0). Touches de Chiffre repérées par `userData.cue` : `frise` (papier réglé sous la galerie), `cadran` (couronne de bronze graduée au pied du pupitre), `plaque` (chiffre romain + nombre de produits, ×6), `poussiere` (chiffres dorés, ×6), plus des textures : tomes numérotés (`T.bookwall`), graduations de la rosace, numéros d'articles (`T.codePage`). Caméra sur rails : pose d'accueil (le Code civil) et poses de porte (de biais, du même côté que la porte, trajet en arc de cercle autour du Code civil).
- **Monde 2 – Univers** (`scene-world.js`) : une salle en longueur par univers. Position de rail 0 = accueil (installation d'univers), puis une position par station. Les textures d'en-têtes et de carnets sont créées à la demande autour de la caméra et libérées plus loin (mémoire bornée même pour 15 stations).
- **Caméra** : jamais libre. Positions discrètes, interpolation `ease`, parallaxe de 2 % désactivée en mouvement réduit.

## Entrée et échelle des portes (V5)

- Pas d'écran d'introduction : `boot()` construit la Grande salle et glisse la caméra du fond de la salle jusqu'au Code civil (ou saute directement en mouvement réduit).
- `body.in-hall` masque Cognitio : l'ancien monde n'a pas de mascotte, elle apparaît après la porte.
- L'échelle (`ladder()` dans `app.js`) affiche la case d'origine (Code civil, ou Grande salle dans un univers) puis les six portes I à VI (`court` dans `content/domaines.json`). Dans la Grande salle un clic fait tourner la caméra vers la porte ; dans un univers (`switchWorld`) on repasse par le seuil de la salle puis on franchit la porte choisie.
- Les six portes suivent les domaines du site : Droit, Chiffre, Gestion RH, Technologies numériques, Soft Skills, QSE. Marchés publics et Secteur public (41 produits) restent rattachés au Droit (`domainesProvisoires`) jusqu'à l'entrée « un métier » du Studio Cognitio (lot D).

## Accessibilité

- Chaque élément cliquable de la 3D a un **bouton jumeau** (`#hotspots`) positionné par projection : atteignable au `Tab`, nom accessible, `Entrée` pour activer.
- Panneaux : rôle `dialog`, focus à l'ouverture, retour du focus à la fermeture, `Échap`. Onglets de la fiche : `role=tablist`, flèches.
- `prefers-reduced-motion` : transitions courtes (fondu), pas de rotation, pas de parallaxe, séquence remplacée par une image fixe de Cognitio.
- Contrastes AA : nuances profondes (`accentCfg.text`) pour les textes de teinte bleue ou ocre.
- Impression : feuille dédiée (`@media print`).

## Extensions prévues

| Besoin | Point d'extension |
|---|---|
| Brancher une API pour Cognitio | `LDC.cognitio.provider = { reply({ event, vars }) → Promise<string[]> }` |
| Nouveau mapping ROME | `content/mapping-produits-rome.json` + `build-data.py` (validation) |
| Nouvel univers / regroupement | `content/domaines.json` (+ une installation dans `HERO` de `scene-world.js`) |
| Vidéo de transition | déposer les fichiers dans `assets/transition/`, relancer `build-data.py` |
| Logo / symbole officiels (fournis, PNG) | remplacer dans `assets/brand/` (le chemin est dans `content/brand.json`) |

## Dette technique connue

- Les installations d'accueil des six univers sont paramétriques mais construites à la main (≈ 15 lignes chacune) ; pas de bibliothèque d'objets partagée.
- `app.js` reste volumineux (≈ 450 lignes) : le dock, les hotspots et la caméra pourraient devenir des modules si l'application grossit.
- Le matching par métier est inactif tant que le lien métier → compétences n'est pas fourni (la vue ROME consolidée ne contient que des compteurs).
- Tests visuels manuels (captures) : pas de comparaison automatique d'images.
