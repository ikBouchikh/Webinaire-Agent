# Bibliothèque des compétences — Lefebvre Dalloz Compétences

Outil d'aide à la vente pour les commerciaux LDC : présenter l'offre de formation 2027, raconter la vision, explorer l'offre dans une expérience 3D immersive, composer une **sélection client** exploitable. (Version V5, lot A : l'entrée. La suite est décrite dans `docs/PROPOSITION_V5.md`.)

**Lancement** : double-cliquer sur `index.html` (Chrome, Edge, Firefox récents). Aucun serveur, aucun CDN, aucun appel réseau. Sans WebGL, une version statique simplifiée prend le relais.

## Parcours

1. **Grande salle** (monde 1, bibliothèque française ancienne, l'ancien monde éditorial) : l'application s'ouvre directement ici, sans écran d'introduction. Au centre, *le premier Code civil* (Droit, Édition) sur son pupitre. Six portes alignées sur les domaines du site : **I Droit · II Chiffre · III Gestion RH · IV Technologies numériques · V Soft Skills · VI QSE**. Le Chiffre passe dans le décor : chiffres romains et nombre de produits sur les plaques, frise de registre, tomes numérotés, cadran de bronze gradué, poussière de chiffres, numéros d'articles dans les marges du Code civil. **L'échelle des six portes** reste en bas de l'écran, dans la Grande salle comme dans chaque univers, pour changer de porte d'un clic.
2. **Code civil** → expérience en trois temps *Notre origine · Notre vision · Notre offre* — « De l'expertise éditoriale à l'action professionnelle » — avec quatre actions : Découvrir notre approche · Explorer les portes · Découvrir l'offre Droit · Découvrir l'offre Chiffre.
3. **Une porte** → transition narrative (livre → ordinateur → feuille → Cognitio ; à refaire au lot C) puis **monde 2** (provisoire, refait au lot D en « Studio Cognitio ») : salle contemporaine, installation d'accueil de l'univers, une station par domaine (en-tête + vitrine de quatre produits), liste complète, fiche produit.
4. **Fiche produit** à quatre onglets : *Pour quel besoin ? · Notre réponse · Compétences ROME 4 · Argumentaire commercial*. Action principale : *Ajouter à la sélection client*.
5. **Ma sélection client** : besoin, produits retenus, durée, formats, compétences ROME 4, argument principal, produits complémentaires ; copier, imprimer, réinitialiser ; conservée dans le navigateur.
Le Pitch guidé et l'écran d'introduction ont été retirés (V5). La **charte** privilégie le bleu (rouge réduit à un accent) et le logo officiel (`assets/brand/`) remplace le repère générique.

**Cognitio** (la mascotte) n'apparaît qu'après la porte et guide la visite avec des répliques scénarisées. Ce n'est pas un modèle de langage ; le fournisseur est remplaçable (`LDC.cognitio.provider`) pour brancher une API plus tard.

## Règles de contenu

- **Rien n'est inventé.** Produits, durées, niveaux, formats, certifications : base produits 2027. Compétences : ROME 4.0 (identifiants, libellés, types officiels, jamais déduits d'un titre). France compétences (RS / RNCP) reste séparé de ROME 4.
- **Donnée manquante → emplacement « À VALIDER »**, centralisé dans `content/` (voir `docs/A_VALIDER.md`).
- Tarifs et noms de collaborateurs ne sont jamais chargés dans le navigateur.

## Arborescence

```
index.html            squelette, panneaux, transition, repli sans WebGL
style.css             charte (jetons, IBM Plex, composants, mobile, impression, mouvement réduit)
src/                  modules (scripts classiques, compatibles file://)
  core.js             espace de noms, état local, panneaux, utilitaires
  catalogue.js        index produits, six mondes, stations, vitrines, lots, certifications
  rome.js             ROME 4.0 : accès, recherche, rattachements validés, correspondance explicable
  textures.js         matières et visuels dessinés en canvas (aucune image)
  book.js             livre 3D qui s'ouvre (Code civil, grand livre de l'univers Chiffre)
  scene-hall.js       monde 1 : Grande salle, six portes, Code civil central, touches de Chiffre (frise, cadran, poussière)
  scene-world.js      monde 2 : kit de salle contemporaine + six installations
  cognitio.js         guide scénarisé
  transition.js       séquence porte → univers (vidéo locale / procédurale / courte / réduite)
  vision.js           expérience du Code civil en trois temps
  sheet.js            liste d'une station + fiche produit à quatre onglets
  selection.js        « Ma sélection client »
  app.js              orchestrateur : caméra, échelle des portes, rails, clavier, boucle de rendu
content/*.json        textes et configuration éditables (domaines, vision, Cognitio, transition, marque, ROME, commercial)
content/content.bundle.js   agrégat généré (file:// ne sait pas lire du JSON)
data/                 catalogue.js, rome4-compact.js/.json (générés), matching-config.js (pondérations)
assets/               fonts (IBM Plex, OFL), cognitio (7 variantes), brand/ (logo et symbole JL officiels), transition/ (emplacement vidéo)
tools/build-data.py   génère data/ et content.bundle.js, contrôle l'intégrité
tests/                tests Playwright (voir docs/TESTS.md)
docs/                 AUDIT.md, A_VALIDER.md, ARCHITECTURE.md, TESTS.md
vendor/three.min.js   Three.js r149 (inclus)
```

## Mettre à jour les données

```
python3 tools/build-data.py --produits Base_produits_2027_*.xlsx --rome ROME4_*_Vue_Consolidee.xlsx
```

(les fichiers peuvent aussi être déposés dans `sources/`, non versionné). Le script échoue si un identifiant ROME, un libellé ou un code produit cité dans `content/` n'existe pas ou diffère du référentiel. Il détecte aussi la vidéo de transition si elle est déposée dans `assets/transition/`.

## Navigation

Souris / tactile : glisser pour passer d'une porte ou d'une station à l'autre, cliquer pour ouvrir. Clavier : `←` `→` pour les rails, `Tab` pour atteindre les éléments de la scène (portes, produits), `Entrée` pour ouvrir, `Échap` pour fermer / revenir. Mouvement réduit : les animations deviennent des fondus brefs.

## Mode débogage

`index.html?debug=1` expose `LDC.debug` (tests) ; `&fast=5` accélère les animations ; `?nogl` force la version statique ; `?reduce` simule le mouvement réduit.
