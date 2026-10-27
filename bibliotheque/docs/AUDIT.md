# Audit du rendu V3 — passe de correction stricte

Périmètre : le livrable précédent (« V3 », commit `e09d86c`) relu contre le brief « outil d'aide à la vente LDC »
(sections 1 à 16) et la charte `LFVR_TERRITOIRE_ONBARDING.pdf`. Rien n'est supprimé sans justification ;
tout ce qui n'est pas dans une source fournie est remplacé par un emplacement `À VALIDER`.

Légende : **P0** bloquant (contredit le brief ou invente du contenu) · **P1** important (qualité d'usage / charte) · **P2** finition.

---

## A. Liste des écarts, par catégorie de la grille

### 1. Finalité commerciale

| # | Écart constaté dans V3 | Gravité |
|---|---|---|
| 1.1 | L'outil est un « parcours apprenant » (filtre par persona, « Mon parcours », étoiles « pour vous »). Aucun point d'entrée « besoin client », aucun mode pitch, aucune synthèse exploitable en rendez-vous. | P0 |
| 1.2 | Les 120 produits de `data.js` sont illustratifs et les « blocs France compétences » sont inventés (titres, pourcentages de couverture). Le catalogue 2027 réel (2 027 produits, 56 certifications, 215 lots) n'est pas utilisé. | P0 |
| 1.3 | La fiche produit n'a que deux onglets (« Fiche », « France compétences ») ; elle affiche un score de couverture fabriqué. Pas de « Pour quel besoin ? », « Notre réponse », « Compétences ROME 4 », « Argumentaire commercial ». | P0 |
| 1.4 | Le Code civil affiche des faits historiques non fournis (date de promulgation, nombre d'articles, nombre de rédacteurs, « édition originale de 1804 », page de titre « AN XII »). | P0 |
| 1.5 | Aucune expérience « vision / ADN » : le livre s'ouvre sur un texte historique, pas sur « De l'expertise éditoriale à l'action professionnelle » ni sur l'offre. | P0 |
| 1.6 | Les six champs commerciaux demandés (problème client, ce que le participant saura mieux faire, arguments, preuve, objection + réponse, produits complémentaires) n'existent nulle part. | P0 |

### 2. Équilibre des piliers (Droit / Édition / Chiffre)

| # | Écart | Gravité |
|---|---|---|
| 2.1 | Au centre de la Grande salle, seul le Code civil : lecture « droit + édition » en 10 secondes, le Chiffre n'apparaît qu'en arrivant à sa porte. | P0 |
| 2.2 | Les six portes sont des regroupements inventés (« Droit & Immobilier », « Management, Soft skills & Numérique ») qui ne correspondent pas aux 37 domaines FORMEO de la base. | P1 |
| 2.3 | Aucun élément visuel de l'Édition (la maison d'édition) hors le livre central. | P1 |

### 3. Transition de mondes

| # | Écart | Gravité |
|---|---|---|
| 3.1 | La porte déclenche une traversée de caméra de 2 s puis un voile « sable » de 0,55 s ; aucun récit (livre → ordinateur → feuille → Cognitio). | P0 |
| 3.2 | Après la porte, on retrouve une bibliothèque ancienne identique : aucun changement de monde. | P0 |
| 3.3 | Pas de version courte, pas de bouton « Passer », pas de comportement `prefers-reduced-motion`, pas de vidéo ni de poster prévus. | P0 |

### 4. Cognitio

| # | Écart | Gravité |
|---|---|---|
| 4.1 | Absent. Le seul guide est un « Bibliothécaire » textuel sans visage. Les sept visuels fournis ne sont pas utilisés. | P0 |
| 4.2 | Aucune architecture de dialogue scripté (aucun contenu externalisé, aucun point d'extension vers une future API). | P1 |

### 5. Charte

| # | Écart | Gravité |
|---|---|---|
| 5.1 | Typographie : Calibri / Georgia au lieu d'IBM Plex (Serif titres, Sans CTA, Mono catégories). | P0 |
| 5.2 | Palette : sable / bordeaux / **framboise #D6175F** / pêche, issue d'une lecture antérieure ; la charte PDF donne rouge (#D71635, #FF1E1E, #4B0000, #3B0000), clay, bleu et ocre en touches. La framboise n'existe pas dans la charte. | P0 |
| 5.3 | Logo : un « wordmark » recomposé en texte serif (LEFEBVRE DALLOZ COMPÉTENCES) sur couvertures, plaques et en-tête — ce n'est pas le logo. Aucun symbole JL, aucune forme récurrente. | P0 |
| 5.4 | Effets : halo additif permanent autour du Code civil, faisceaux, 12 bougies qui vacillent en continu, particules autour du livre ouvert — contraire à « pas de halos excessifs / d'effets permanents ». | P1 |
| 5.5 | Dégradés : aucun usage réservé aux écrans et transitions (la charte les limite aux interfaces / motion). | P2 |
| 5.6 | Pas de proportions de couleurs (rouge couleur de marque, clay en fond, bleu et ocre en touches) : l'interface est entièrement bordeaux/framboise. | P1 |

### 6. ROME 4

| # | Écart | Gravité |
|---|---|---|
| 6.1 | Aucun usage du référentiel ROME 4.0 fourni (19 582 compétences, 1 923 métiers). | P0 |
| 6.2 | Compétences « visées » des livres : textes libres inventés. | P0 |
| 6.3 | France compétences confondu avec les compétences : les « blocs » sont une grille de compétences inventée. Les vraies données FC (RS/RNCP, 56 certifications) sont dans la base produits et doivent rester séparées. | P0 |
| 6.4 | Aucun moteur de correspondance explicable. | P0 |

### 7. UX

| # | Écart | Gravité |
|---|---|---|
| 7.1 | Les étiquettes de livres sont des `div` cliquables : pas d'accès clavier aux produits, pas de focus visible, pas de rôle ARIA. | P0 |
| 7.2 | Aucune gestion de `prefers-reduced-motion` côté JS (tweens, flammes, particules). | P1 |
| 7.3 | Pas de repli sans WebGL : un simple message d'erreur. | P0 |
| 7.4 | « Mes rayons » (filtre) mélange métier, besoin et ouverture de portes : trop de choix avant d'entrer. | P1 |
| 7.5 | Contrastes : texte « muted » #85606A sur crème ≈ 4,3:1 (insuffisant pour du corps de texte). | P1 |
| 7.6 | Pas d'accès à « Retour Grande salle » depuis la fiche produit ; le fil d'Ariane n'inclut pas les panneaux. | P2 |
| 7.7 | Mobile : acceptable (rails, panneau en bas) mais le Code civil et la fiche se recouvrent. | P2 |

### 8. Technique

| # | Écart | Gravité |
|---|---|---|
| 8.1 | `app.js` : 500 lignes en une IIFE (navigation, panneaux, filtre, parcours, livre, boucle) — impossible d'ajouter les 6 lots sans le scinder. | P0 |
| 8.2 | Aucun pipeline de données ni de contrôle d'intégrité ; `data.js` écrit à la main. | P0 |
| 8.3 | Contenus éditoriaux en dur dans le JS (textes du Code civil, intitulés de portes). | P0 |
| 8.4 | Aucun test automatisé (lancement, réseau, console). | P1 |
| 8.5 | Objet `L.debug` exposé en production (accès à la scène et à l'état). | P2 |
| 8.6 | Textures canvas bien gérées (cache, `disposeOwned`) ; rendu net (pixel ratio, sRGB) : à conserver. | — |

---

## B. Corrections prioritaires

### P0 — avant toute démonstration
1. **Chaîne de données réelle** : `tools/build-data.py` → `data/catalogue.js` (produits, certifications, lots), `data/rome4-compact.js`, `content/content.bundle.js`. Contrôle d'intégrité bloquant (codes produits, identifiants ROME, libellés exacts).
2. **Supprimer le contenu inventé** : `data.js` (retiré), textes historiques du Code civil, blocs France compétences fabriqués, score de couverture.
3. **Charte** : IBM Plex local (woff2), palette PDF, forme récurrente, logo = emplacement `À VALIDER` (symbole approximé, jamais présenté comme officiel).
4. **Grande salle** : installation « Le Grand Livre du Chiffre / La table des décisions » à égalité visuelle avec le Code civil.
5. **Code civil** : expérience en 3 étapes pilotée par `content/vision-offre.json`, avec les quatre CTA.
6. **Transition narrative** (porte → livre → ordinateur → feuille → Cognitio), version courte, `Passer`, `prefers-reduced-motion`, vidéo optionnelle + poster + repli procédural.
7. **Six mondes contemporains** (matière, lumière et architecture différentes de la Grande salle), stations issues de `content/domaines.json`.
8. **ROME 4** : module `rome.js`, mapping validé uniquement, matching explicable pondéré dans `data/matching-config.js`.
9. **Fiche produit à 4 onglets**, champs commerciaux lus dans `content/produits-commercial.json` (vides → `À VALIDER`).
10. **Mode Pitch guidé + « Ma sélection client »** (copie, impression, persistance locale, réinitialisation).
11. **Cognitio** : composant scripté (`content/cognitio-script.json`), mascotte inchangée, accessoire par monde.
12. **Accès clavier** à toutes les actions de la 3D + repli sans WebGL.
13. **Scinder `app.js`** en modules ; retirer `L.debug` de la production (activable par `?debug`).

### P1
- Retirer halos permanents, flammes et particules ; réserver les dégradés aux écrans et transitions.
- Proportions de couleurs de la charte dans l'interface.
- Contrastes AA partout, focus visible, ARIA, `aria-live` pour Cognitio.
- Remplacer le filtre « Mes rayons » par l'entrée « Besoin client » (pitch) et conserver une recherche simple.
- Tests automatisés (Playwright) : lancement fichier, absence de requêtes réseau, console propre, six portes, retour, Cognitio, sélection, impression, mobile, clavier, reduced-motion, sans-WebGL.

### P2
- Fil d'Ariane étendu aux panneaux ; mobile : empilement panneau / Cognitio.
- Documentation (`README`, `PROMPT_CHATGPT.md`, architecture, liste des `À VALIDER`).
- Poster statique de la transition généré depuis la séquence procédurale.

---

## C. Plan fichier par fichier

| Fichier | Décision | Détail |
|---|---|---|
| `index.html` | refondu | Squelette : canvas, calque Cognitio, panneaux (vision, produit, sélection, pitch), transition, repli sans WebGL. |
| `style.css` | refondu | Jetons de charte, IBM Plex, formes récurrentes, composants, mobile, reduced-motion. |
| `data.js` | **supprimé** | Données illustratives inventées, remplacées par `data/catalogue.js`. |
| `textures.js` → `src/textures.js` | adapté | Palette charte ; couvertures sans wordmark inventé ; textes Code civil lus dans la config ; nouvelles matières contemporaines (microciment, bois clair, verre, écran). |
| `book.js` → `src/book.js` | conservé | Inchangé hors couleurs. |
| `scene.js` → `src/scene-hall.js` | scindé / adapté | Grande salle conservée (rotonde, portes) ; pupitre Code civil décalé ; ajout de la table des décisions ; bougies sans vacillement ; portes pilotées par `domaines.json`. Les rayons à travées sont retirés (remplacés par les mondes). |
| — | **nouveau** `src/scene-world.js` | Kit de monde contemporain + 6 installations ; rails de stations ; produits vitrines. |
| `app.js` | **scindé** | `src/app.js` (orchestrateur : caméra, rails, entrée, boucle) + `src/ui-*.js`. |
| — | **nouveau** `src/core.js` | Espace de noms, état, persistance, utilitaires, registre des `À VALIDER`. |
| — | **nouveau** `src/catalogue.js` | Index produits / domaines / mondes, sélection de vitrines, lots, certifications. |
| — | **nouveau** `src/rome.js` | Accès ROME 4, mapping validé, moteur de correspondance explicable. |
| — | **nouveau** `src/cognitio.js` | Présentateur scripté, fournisseur remplaçable. |
| — | **nouveau** `src/transition.js` | Séquence de transition (vidéo / procédural / courte / réduite). |
| — | **nouveau** `src/vision.js` | Expérience du Code civil en 3 étapes. |
| — | **nouveau** `src/sheet.js` | Fiche produit à 4 onglets. |
| — | **nouveau** `src/selection.js` | « Ma sélection client » + export. |
| — | **nouveau** `src/pitch.js` | Mode Pitch guidé (6 étapes). |
| — | **nouveau** `data/matching-config.js` | Pondérations du matching. |
| — | **nouveau** `content/cognitio-script.json`, `content/pitch-script.json` | Textes de guidage, marqués `À VALIDER`. |
| `tools/build-data.py` | créé | Génère les données, valide, échoue si une référence est fausse. |
| `tools/test/*.js` | **nouveau** | Tests Playwright. |
| `README.md`, `PROMPT_CHATGPT.md` | mis à jour | Nouvelle architecture et règles de contenu. |
| `docs/A_VALIDER.md` | **nouveau** | Tout ce qui attend une validation métier. |
