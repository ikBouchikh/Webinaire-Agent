# Bibliothèque des compétences — Lefebvre Dalloz Compétences

Outil d'aide à la vente pour les commerciaux LDC : raconter la vision, partir du besoin d'un client, explorer l'offre 2027 dans une expérience 3D immersive, composer une **sélection client** exploitable.

**Lancement** : double-cliquer sur `index.html` (Chrome, Edge, Firefox récents). Aucun serveur, aucun CDN, aucun appel réseau. Sans WebGL, une version statique simplifiée prend le relais.

## Parcours

1. **Grande salle** (monde 1, bibliothèque française ancienne) : au centre, à égalité, *le premier Code civil* (Droit, Édition) et *Le Grand Livre du Chiffre* (la table des décisions). Six portes, une par univers.
2. **Code civil** → expérience en trois temps *Notre origine · Notre vision · Notre offre* — « De l'expertise éditoriale à l'action professionnelle » — avec quatre actions : Découvrir notre approche · Explorer nos domaines · Construire une réponse client · Découvrir l'offre Droit.
3. **Une porte** → transition narrative (livre → ordinateur → feuille → Cognitio) puis **monde 2** : salle contemporaine, installation d'accueil de l'univers, une station par domaine (en-tête + vitrine de quatre produits), liste complète, fiche produit.
4. **Fiche produit** à quatre onglets : *Pour quel besoin ? · Notre réponse · Compétences ROME 4 · Argumentaire commercial*. Action principale : *Ajouter à la sélection client*.
5. **Ma sélection client** : besoin, produits retenus, durée, formats, compétences ROME 4, argument principal, produits complémentaires ; copier, imprimer, réinitialiser ; conservée dans le navigateur.
6. **Pitch guidé** (3 à 5 min) : ADN → besoin client → domaine → compétences → sélection → prochaine étape.

**Cognitio** (la mascotte) guide la visite avec des répliques scénarisées. Ce n'est pas un modèle de langage ; le fournisseur est remplaçable (`LDC.cognitio.provider`) pour brancher une API plus tard.

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
  book.js             livre 3D qui s'ouvre (Code civil, Grand Livre)
  scene-hall.js       monde 1 : Grande salle, portes, Code civil, Grand Livre du Chiffre
  scene-world.js      monde 2 : kit de salle contemporaine + six installations
  cognitio.js         guide scénarisé
  transition.js       séquence porte → univers (vidéo locale / procédurale / courte / réduite)
  vision.js           expérience du Code civil en trois temps
  sheet.js            liste d'une station + fiche produit à quatre onglets
  selection.js        « Ma sélection client »
  pitch.js            Pitch guidé en six étapes
  app.js              orchestrateur : caméra, rails, entrée, clavier, boucle de rendu
content/*.json        textes et configuration éditables (domaines, vision, Cognitio, pitch, transition, marque, ROME, commercial)
content/content.bundle.js   agrégat généré (file:// ne sait pas lire du JSON)
data/                 catalogue.js, rome4-compact.js/.json (générés), matching-config.js (pondérations)
assets/               fonts (IBM Plex, OFL), cognitio (7 variantes), brand/ et transition/ (emplacements)
tools/build-data.py   génère data/ et content.bundle.js, contrôle l'intégrité
tests/                tests Playwright (voir docs/TESTS.md)
docs/                 AUDIT.md, A_VALIDER.md, ARCHITECTURE.md, TESTS.md
vendor/three.min.js   Three.js r149 (inclus)
```

## Mettre à jour les données

```
python3 tools/build-data.py --produits Base_produits_2027_*.xlsx --rome ROME4_*_Vue_Consolidee.xlsx
```

(les fichiers peuvent aussi être déposés dans `sources/`, non versionné). Le script échoue si un identifiant ROME, un libellé ou un code produit cité dans `content/` n'existe pas ou diffère du référentiel. Il détecte aussi le logo, le symbole et la vidéo de transition s'ils sont déposés dans `assets/`.

## Navigation

Souris / tactile : glisser pour passer d'une porte ou d'une station à l'autre, cliquer pour ouvrir. Clavier : `←` `→` pour les rails, `Tab` pour atteindre les éléments de la scène (portes, produits), `Entrée` pour ouvrir, `Échap` pour fermer / revenir. Mouvement réduit : les animations deviennent des fondus brefs.

## Mode débogage

`index.html?debug=1` expose `LDC.debug` (tests) ; `&fast=5` accélère les animations ; `&go=explore` ou `&go=pitch` saute l'écran d'accueil ; `?nogl` force la version statique ; `?reduce` simule le mouvement réduit.
