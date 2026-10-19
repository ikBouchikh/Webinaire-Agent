# Univers Techno Numérique 2027

Exploration 3D du catalogue Technologies Numériques 2027 de Lefebvre Dalloz Compétences.
Un seul fichier à ouvrir : `index.html` (aucune installation, aucun serveur).

## Parcours

| Niveau | Ce que l’on voit | Comment y entrer |
|---|---|---|
| Univers | 7 galaxies, une par domaine, autour d’un noyau central | bouton « Entrer dans l’univers » |
| Galaxie | les métiers du domaine, en planètes sur orbite | clic sur une galaxie, touche `1` à `7`, molette |
| Planète | un métier : ses modules (lunes) et ses compétences | clic sur une planète |
| Lune | un module : durée, référence, compétences travaillées, lien catalogue | clic sur une lune ou sur une carte |

## Commandes

- Clic : entrer. `Échap`, fil d’Ariane ou molette arrière : remonter.
- Glisser : orbiter autour de la scène.
- `Ctrl K` (`⌘ K` sur Mac) : recherche par métier, compétence, outil ou formation.
- Touches `1` à `7` : aller directement à une galaxie.

## Charte

Bordeaux `#98000D` et beige `#F5F0E5`. Typographies Fraunces (titres) et Manrope (texte), chargées depuis Google Fonts avec repli sur les polices du système.

## Modifier le contenu

Les domaines, métiers, compétences et formations sont dans l’objet `domains` du script, dans `index.html`. Ajouter un métier ou un module suffit : les planètes, les lunes, les compteurs et la recherche se mettent à jour seuls. La couleur et la forme de chaque galaxie se règlent dans le tableau `GAL`.

## Technique

- three.js r128 (WebGL). Chargé depuis cdnjs, avec une copie locale dans `vendor/three.min.js` utilisée si le réseau manque.
- Galaxies en particules GPU, nébuleuse précalculée, lueur et grain en post-traitement maison.
- Qualité adaptative : si l’image saccade, la résolution puis la lueur sont réduites automatiquement.
- Respecte `prefers-reduced-motion` (pas de saut ni de dérive).
