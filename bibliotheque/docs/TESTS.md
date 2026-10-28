# Tests

Tous les tests s'exécutent contre le dossier tel qu'il est livré, ouvert en **`file://`** (comme un double-clic), avec Chromium piloté par Playwright. Le moindre appel hors `file:` / `data:` / `blob:` fait échouer le test, de même qu'une erreur console.

```
export LDC_PRODUITS=/chemin/Base_produits_2027_2.xlsx
export LDC_ROME=/chemin/ROME4_V62_26M10_Vue_Consolidee.xlsx
NODE_PATH=<node_modules de playwright> bash tests/run-all.sh
```

| Fichier | Ce qui est vérifié |
|---|---|
| `tests/rome_fixture.py` | Copie du projet + **mapping ROME de test** (jamais dans `content/`) ; le contrôle d'intégrité accepte un mapping valide, **refuse** un identifiant ROME inexistant, un libellé différent, un statut VALIDE sans signataire, un code produit inconnu. |
| `tests/rome-match.js` | Moteur ROME 4 sur la copie : libellé et type exacts, produit sans mapping = aucune compétence déduite, classement `forte/moyenne/partielle/cadre`, moment de vie (rattachement explicite > couverture), synthèse, recherche de compétences et de métiers, France compétences séparé, onglet ROME de la fiche. |
| `tests/e2e-core.js` | Lancement `file://`, **démarrage direct dans la Grande salle** (aucun écran d'introduction, aucun Pitch, aucune bascule de mode), Code civil seul au centre, **échelle des six portes I à VI** alignées sur le site, logo officiel, Cognitio absente de la salle, charte bleue (action principale en `#1773A0`), **touches de Chiffre** (frise, cadran, six plaques, poussière), accès clavier au Code civil, Code civil (3 étapes, 4 CTA, comptages par porte 495 / 599 / 325 / 197 / 251 / 160), six clics sur l'échelle, première transition, Cognitio après la porte, échelle dans l'univers, rail, liste complète, recherche, fiche à 4 onglets, « À VALIDER », sélection, synthèse, version imprimable, **changement de porte depuis un univers**, persistance, réinitialisation. |
| `tests/e2e-modes.js` | `prefers-reduced-motion`, bouton « Passer », version courte, retour par Échap, **version statique sans WebGL** (univers, liste, fiche, sélection, Code civil, absence de Pitch). |
| `tests/e2e-mobile.js` | 390 × 844 tactile : pas de défilement horizontal, carte du lieu et échelle des portes dans l'écran (cibles ≥ 40 px), Cognitio absente de la salle, panneaux dans l'écran. |

## Remarques de méthode

- Le bac à sable n'a pas de GPU : le rendu logiciel tourne à ≈ 2 images/s. Les tests enregistrent donc la transition avec un `MutationObserver` (au lieu de la scruter) et interrogent par intervalle.
- La **fluidité réelle** (60 images/s) ne peut pas être mesurée ici ; elle est à confirmer sur un poste commercial type.
- Les captures d'écran sont écrites dans le dossier `OUT` : elles servent à la relecture visuelle, il n'y a pas de comparaison d'images automatique.
- Le **mapping ROME de test** n'existe que dans la copie temporaire : aucun rattachement n'est livré tant que l'offre n'a pas validé les siens.

## Résultats de la dernière exécution (2026-10-28, lot A de la V5 ; Chromium + rendu WebGL logiciel, file://)

| Suite | Résultat |
|---|---|
| Données : contrôle d'intégrité (`rome_fixture.py`) | 6 / 6 |
| Moteur ROME 4 (`rome-match.js`, copie avec mapping de test) | 16 / 16 + console propre |
| Parcours principal (`e2e-core.js`) | 42 / 42 |
| Mouvement réduit, Passer, version courte, Échap (`e2e-modes.js`, parties 1 et 2) | 5 / 5 et 12 / 12 |
| Version statique sans WebGL (`e2e-modes.js`, partie 3) | 20 / 20 |
| Mobile 390 × 844 tactile (`e2e-mobile.js`) | 10 / 10 |

Dans chaque suite : console sans erreur et **aucune requête réseau**. La suite `e2e-pitch.js` a été supprimée avec le Pitch guidé.

Ce qui n'est **pas** couvert : fluidité sur GPU réel, lecteurs d'écran, Safari et Firefox, vidéo de transition réelle (lot C), impression papier. Les touches de Chiffre portées par des textures (tomes numérotés, graduations de la rosace, numéros d'articles) ne sont vérifiées qu'à l'œil sur captures ; seuls les objets de scène (frise, cadran, plaques, poussière) sont comptés par les tests.
