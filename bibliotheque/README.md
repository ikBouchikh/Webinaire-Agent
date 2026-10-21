# Bibliothèque des compétences · Lefebvre Dalloz Compétences

Exploration 3D du catalogue de formation : une grande bibliothèque française ancienne (rotonde à galerie, marbre, acajou, reliures cuir et or), claire et nette. **100 % locale** : double-cliquez sur `index.html` (Chrome, Edge ou Firefox récents). Three.js est embarqué dans `vendor/`, aucun réseau n'est nécessaire.

## Le premier Code civil au centre de la Grande salle
Au cœur de la rotonde, un pupitre sur son estrade porte le **premier Code civil (1804)**, ouvert sur sa page de titre (« Code civil des Français, édition originale et seule officielle, à Paris, de l'imprimerie de la République, an XII ») : c'est la vue d'accueil de la bibliothèque, et on le retrouve de côté quand on passe de porte en porte. Un clic ouvre une fiche (promulgation du 21 mars 1804, 2 281 articles, rédaction par quatre juristes, rebaptisé « Code Napoléon » en 1807, exemplaire récemment entré dans les collections du groupe) avec un bouton vers les formations en droit. Les textes de présentation sont dans `app.js` (fonction `showCode`) et les pages dans `textures.js` (`codeTitle`, `codePage`, `codeCover`) : à valider avec l'éditorial et à compléter avec les photos de l'exemplaire.

## Parcours
| Catalogue | Dans la bibliothèque |
|---|---|
| **Domaine** (6) | une **porte** de la Grande salle ; elle s'ouvre, on entre dans le rayon |
| **Thématique** (5 par domaine) | une **travée** (vitrine, plaque dorée) |
| **Produit de formation** (4 par travée) | un **grand livre** : on l'ouvre, il s'ouvre dans la lumière et sa fiche s'affiche |
| **France compétences** | onglet du même nom dans la fiche : certification visée, bloc de compétences, % couvert, livres à ajouter pour compléter le bloc |

## Navigation (volontairement simple)
Pas de marche libre : la caméra suit des rails.
- **Glisser** (souris ou doigt), **flèches ‹ ›** à l'écran, **← →** au clavier ou **molette** : passer du Code civil aux six portes, puis d'une porte à l'autre, d'une travée à l'autre.
- **Clic** sur une porte ou un livre : on le centre d'abord, un second clic l'ouvre. Aucun zoom brutal.
- **Échap** ou le bouton « ← Grande salle » : on revient en arrière.
- **Mes rayons** (en haut) : rouvrir le filtre à tout moment. **Mon parcours** : formations retenues, durée totale, couverture des blocs France compétences, copie du parcours.

## Filtrer dès l'entrée
1. **Votre métier** : 10 profils (liste à valider, voir plus bas) qui ouvrent les bons rayons.
2. **Un besoin précis** : saisie libre (« paie », « bail », « IA »…) ; les rayons utiles s'ouvrent, les livres repérés portent une étoile.
3. **Vos rayons** : ouvrir ou fermer chaque domaine ; les portes se referment ou s'entrouvrent en direct.

## Brancher le vrai catalogue
Tout part de **`data.js`** : domaines → thématiques → produits, avec la cible France compétences de chaque thématique. Rayons, travées, livres et « match » se reconstruisent seuls. Le contenu actuel (6 domaines, 30 thématiques, 120 produits) est **illustratif**, et les rattachements RNCP / RS sont **indicatifs** (pas de numéros de fiche).

```js
T('Paie', ['Établir un bulletin de paie', …],                                   // compétences de la thématique
  FC('RNCP', 'Gestionnaire de paie', 5, 'Réaliser la paie et les déclarations sociales',
     [['Établir les bulletins de paie', [0, 1]], …]),                           // bloc : compétence ↔ indices ci-dessus
  [['Paie : les fondamentaux', 'FO', '3 jours', 'Fondamental', [0, 3]], …])     // produits : titre, format, durée, niveau, compétences
```
Les **métiers** de départ sont dans `L.PERSONAS` (même fichier) : ils reprennent les grands segments du catalogue public (directions financières et fiscales, directions juridiques, banque et assurance, immobilier, RH et social, QSE, secteur public, management). À remplacer par vos cibles réelles.

## Charte
Variables en tête de `style.css` (sable, bordeaux, framboise, pêche) et de `textures.js` (`C`), couleurs des domaines dans `data.js`. Les valeurs sont relevées sur les visuels de charte transmis ; pour les figer, remplacez-les par les codes exacts. Couvertures, plaques et marbres sont dessinés en canvas : aucun fichier image.

## Fichiers
`index.html` · `style.css` · `data.js` (catalogue) · `textures.js` (matières, couvertures) · `book.js` (le livre) · `scene.js` (Grande salle, rayons) · `app.js` (navigation, filtre, fiche, parcours) · `vendor/three.min.js` (Three.js r149, MIT).
