# Compte rendu — passe de correction stricte

Entrée : le brief « outil d'aide à la vente LDC » + la consigne « audite ton propre rendu, corrige, n'invente rien, utilise À VALIDER ».
Sorties : A écarts · B priorités · C plan fichier par fichier → `docs/AUDIT.md` ; D patchs → commits de la branche ; E tests → `docs/TESTS.md` et ci-dessous.

## 1. Fichiers

**Créés** : `tools/build-data.py`, `tools/make-artifact.py`, `data/catalogue.js`, `data/rome4-compact.js/.json`, `data/matching-config.js`, `content/{domaines,vision-offre,cognitio-script,pitch-script,transition,brand,produits-commercial,mapping-produits-rome,moments-de-vie}.json`, `content/content.bundle.js`, `src/{core,catalogue,rome,cognitio,transition,vision,sheet,selection,pitch,scene-world}.js`, `assets/fonts/*` (IBM Plex, OFL), `assets/cognitio/*` (7 variantes), `assets/{brand,transition}/README.md`, `tests/*`, `docs/{AUDIT,A_VALIDER,ARCHITECTURE,TESTS,RAPPORT}.md`.
**Réécrits** : `index.html`, `style.css`, `src/{app,textures,scene-hall}.js`. **Adapté** : `src/book.js` (couleurs). **Mis à jour** : `README.md`, `PROMPT_CHATGPT.md`.
**Supprimé** : `data.js` (120 produits illustratifs et blocs France compétences inventés).

## 2. Décisions de design

- **Équilibre Droit / Édition / Chiffre** : le Code civil et *Le Grand Livre du Chiffre* sont placés symétriquement (x = ∓ 2,35 m) sous les portes Droit et Chiffre, qui encadrent l'axe central de la rotonde. Le Chiffre est une installation symbolique contemporaine (livre-journal sur table inclinée, trois disques de verre gravés d'une courbe) : aucun objet historique, aucun chiffre réel.
- **Deux mondes réellement différents** : bibliothèque ancienne (bois sombre, bronze, marbre) ↔ salles contemporaines (microciment, bois clair, plâtre clay, mur-écran en dégradé tone sur tone). Même gabarit pour les six univers pour rester lisible en rendez-vous ; une installation d'accueil propre à chacun.
- **Caméra sur rails** : poses discrètes, trajets en arc de cercle autour des pièces centrales, de biais pour les portes, aucune caméra libre, aucun brouillard, aucun zoom brutal, aucune ombre portée (lecture nette, rendu plus léger).
- **Charte** : rouge par défaut, clay en fonds, bleu et ocre en touches ; nuances profondes pour les textes (`accentCfg.text`) afin de tenir le contraste AA ; IBM Plex Serif / Sans / Mono ; forme récurrente (rectangle arrondi à encoche) pour les en-têtes de stations, carnets-produits, icônes ; dégradés uniquement sur les écrans et la transition.
- **Accessibilité 3D** : chaque élément cliquable de la scène a un bouton jumeau atteignable au clavier, projeté sur l'image.
- **Cognitio** : l'image ne change jamais ; seule la variante d'accessoire change. Textes en JSON, fournisseur remplaçable.
- **Correspondance** : niveaux qualitatifs, raisons affichées ; sans rattachement ROME validé, jamais « forte ».

## 3. Limites connues

1. **Aucun mapping ROME ni champ commercial n'a été fourni** : l'onglet « Compétences ROME 4 » et l'argumentaire sont des encarts « À VALIDER » ; la correspondance ne travaille que sur le cadre (univers, niveau, format, durée). Le moteur est testé avec un mapping de test, hors livraison.
2. **Lien métier → compétences absent** de la vue ROME consolidée : le métier est noté sans effet sur le calcul.
3. **Fluidité à confirmer** : le bac à sable n'a pas de GPU (≈ 2 images/s en rendu logiciel). La scène est conçue légère (pas d'ombres, textures créées à la demande, 15 stations max.), mais les 60 images/s ne sont pas mesurés ici.
4. **Vidéo de transition** non fournie : séquence procédurale à la place.
5. **Logo / symbole officiels** non fournis : repère générique (non officiel).
6. **Impression** : fonctionne en `file://` ; indisponible dans la version publiée en ligne (le bouton y est retiré).
7. Les installations d'accueil sont des maquettes soignées mais volontairement sobres ; un habillage par un 3D artist reste possible.

## 4. Placeholders à valider et données manquantes

Voir `docs/A_VALIDER.md` (13 lignes) : champs commerciaux, mapping ROME, moments de vie, lien métier, textes origine / vision / offre, fiche du Code civil (date, articles, imprimeur, provenance), intitulé du Grand Livre, accessoire Service public, logo / symbole, vidéo, regroupement des six univers, pondérations, micro-copie de Cognitio.

## 5. Dette technique

Voir `docs/ARCHITECTURE.md` (§ Dette technique). Principale : `app.js` (≈ 430 lignes) à scinder si l'application grossit ; pas de comparaison automatique d'images.
