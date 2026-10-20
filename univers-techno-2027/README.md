# Univers Techno Numérique 2027

Exploration 3D du catalogue Technologies Numériques 2027 de Lefebvre Dalloz Compétences.
Deux façons de l’ouvrir, sans installation ni serveur : `univers-techno-numerique-2027.html` (fichier autonome, fonctionne sans réseau) ou `index.html` (version éditable, avec `vendor/` en secours).

## Parcours

| Niveau | Ce que l’on voit | Comment y entrer |
|---|---|---|
| Univers | 7 galaxies, une par domaine, autour d’un noyau central | bouton « Entrer dans l’univers » |
| Galaxie | les métiers du domaine, en planètes sur orbite | clic sur une galaxie, touche `1` à `7`, molette |
| Planète | un métier : ses modules (lunes) et ses compétences | clic sur une planète |
| Lune | un module : durée, référence, compétences travaillées, lien catalogue | clic sur une lune ou sur une carte |

## Mission diagnostic

Bouton « Lancer le diagnostic » (accueil) ou « Diagnostic » (barre du haut). Un quiz en jeu qui fait traverser les galaxies une à une :

1. **Briefing** : choix des galaxies à traverser (les 7 par défaut, environ 5 min).
2. **Choix des planètes** : dans chaque galaxie, 3 planètes au plus parmi les métiers, en cliquant sur la scène ou sur la liste (touches `1` à `6`).
3. **Défi en situation** : une mise en situation professionnelle par planète, quatre réponses (touches `1` à `4`), puis le bon réflexe expliqué.
4. **Bilan de galaxie** : étoiles, niveau par planète, point fort et zone à explorer.
5. **Carte des compétences** : radar par galaxie, 3 priorités, parcours de modules conseillé avec durée totale, badges. Le parcours se copie en texte, et chaque module ouvre sa fiche.

Il n'y a pas de note éliminatoire : chaque réponse est un niveau (Terrain neuf, À consolider, Bon début, Réflexe expert), avec des XP, des séries et des rangs pour le côté jeu. Les sons sont discrets et se coupent d’un clic.

Les 42 situations (une par métier, dans l’ordre des planètes) sont dans l’objet `QUIZ` du script. Format : `[situation, niveau 3, niveau 2, niveau 1, niveau 0, à retenir]`. Le dernier bilan est mémorisé dans le navigateur.

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
