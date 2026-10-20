# La Bibliothèque des Compétences : explorer tout le catalogue en 3D

Expérience immersive **100 % locale** (aucune installation, aucun réseau, aucune clé) : une bibliothèque ancienne façon *Poudlard*, bougies flottantes, livres volants, rayonnages à perte de vue, aux couleurs **Skilia par Lefebvre Dalloz Compétences** (bordeaux, framboise, crème, lueurs pêche et or).

## Lancer
Double-cliquez sur `index.html` (Chrome, Edge ou Firefox récents, accélération matérielle activée). Plein écran (F11) avant de partager l'écran. Three.js est embarqué dans `vendor/` : tout fonctionne hors ligne.

## Le parcours
| Niveau du catalogue | Dans la bibliothèque |
|---|---|
| **Domaine** (6) | une **porte** de la Grande Nef, une **salle-rayon** derrière |
| **Thématique** (5 par domaine) | une **travée** (vitrine, plaque dorée) |
| **Produit de formation** (4 par travée) | un **grand livre** exposé : on l'ouvre, il vient devant vous, s'ouvre dans la lumière |
| **France compétences** | bouton « Relier à France compétences » : pont animé entre les compétences du livre et le bloc de compétences visé, jauge de couverture, suggestions pour compléter le bloc |

On referme le livre, il retourne sur son présentoir ; on sort par la porte du fond ou la touche `Échap`.

### Filtrer dès le départ (le « Bibliothécaire »)
Trois façons, qui se combinent, avec aperçu en direct (les portes des rayons fermés se couvrent d'une grille) :
1. **Qui êtes-vous ?** 7 profils (dirigeant, DAF, juriste, DRH, QSE, agent public, manager) ouvrent les bons rayons.
2. **Un besoin précis ?** saisie libre (« paie », « bail », « IA »…) : ouvre les rayons pertinents et **repère les livres** par une étoile ★ (touche `N` : livre recommandé suivant).
3. **Vos rayons** : ouvrir ou fermer chaque domaine à la main.
Le filtre se rouvre à tout moment (touche `F`, ou clic sur le grand livre du lutrin). La barre de recherche en bas téléporte jusqu'au livre voulu.

### Gamification
Grades (de *Lecteur curieux* à *Grand Maître des savoirs*), 7 quêtes, **un livre doré caché par rayon**, et un **parcours** à composer (durée totale, couverture des blocs France compétences, copie ou impression).
La progression est enregistrée dans le navigateur (`localStorage`), nulle part ailleurs.

## Commandes
Regarder : glisser. Marcher : `Z Q S D` ou flèches, `Maj` pour courir, molette pour avancer. Cliquer une porte, une travée ou un livre pour s'y rendre. `F` rayons · `P` parcours · `J` carnet · `N` livre recommandé · `M` son · `H` aide · `Échap` fermer ou sortir. Sur tactile : joystick à l'écran. Le mini-plan (en bas à gauche) est cliquable.

## Brancher le vrai catalogue 2027
Tout part de **`data.js`** : domaines → thématiques → produits. Chaque thématique porte sa cible France compétences :

```js
T('Paie',
  ['Établir un bulletin de paie', 'Traiter absences et congés', …],              // compétences de la thématique
  FC('RNCP', 'Gestionnaire de paie', 5, 'Réaliser la paie et les déclarations sociales',
     [['Établir les bulletins de paie', [0, 1]], …]),                              // bloc : compétences ↔ indices ci-dessus
  [['Paie : les fondamentaux', 'FO', '3 jours', 'Fondamental', [0, 3]], …])        // produits : titre, format, durée, niveau, compétences
```
Le score de « match » est **calculé** (part des compétences du bloc couvertes par le produit). Le contenu actuel est **illustratif** (120 produits, 30 thématiques) et les rattachements RNCP / RS sont **indicatifs** : renseignez les vrais intitulés et numéros de fiche, ou branchez l'API France compétences.

## Charte
Variables en tête de `style.css` (`--framboise`, `--bordeaux`, `--cream`, `--peach`…) et `BRAND` en tête de `textures.js` ; couleurs des domaines dans `data.js`. Les couvertures de livres, plaques et bannières sont dessinées en canvas : rien à exporter.

## Fichiers
`index.html` · `style.css` (interface) · `data.js` (catalogue) · `textures.js` (matières et couvertures) · `book.js` (le livre magique) · `world.js` (Grande Nef, rayons) · `ui.js` (filtre, fiche, parcours, quêtes) · `main.js` (moteur, déplacement, transitions, son) · `vendor/three.min.js` (Three.js r149, licence MIT).
