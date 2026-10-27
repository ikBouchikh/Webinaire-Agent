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
| `tests/e2e-core.js` | Lancement `file://`, catalogue chargé, Grande salle, Cognitio, accès clavier aux deux pièces, Code civil (3 étapes, 4 CTA), Grand Livre du Chiffre, six portes, première transition, rail de stations, liste complète, recherche, fiche à 4 onglets, « À VALIDER », ajout à la sélection, synthèse, version imprimable, persistance après rechargement, réinitialisation. |
| `tests/e2e-pitch.js` | Pitch guidé : six étapes, saisie du besoin (métier et compétences ROME), navigation vers l'univers choisi, étape 4 (ROME « À VALIDER »), classement expliqué, sélection, synthèse exportée, retour au mode Exploration. |
| `tests/e2e-modes.js` | `prefers-reduced-motion`, bouton « Passer », version courte, retour par Échap, **version statique sans WebGL** (univers, liste, fiche, sélection, pitch, Cognitio). |
| `tests/e2e-mobile.js` | 390 × 844 tactile : pas de défilement horizontal, panneaux et carte du lieu dans l'écran, cibles tactiles. |

## Remarques de méthode

- Le bac à sable n'a pas de GPU : le rendu logiciel tourne à ≈ 2 images/s. Les tests enregistrent donc la transition avec un `MutationObserver` (au lieu de la scruter) et interrogent par intervalle.
- La **fluidité réelle** (60 images/s) ne peut pas être mesurée ici ; elle est à confirmer sur un poste commercial type.
- Les captures d'écran sont écrites dans le dossier `OUT` : elles servent à la relecture visuelle, il n'y a pas de comparaison d'images automatique.
- Le **mapping ROME de test** n'existe que dans la copie temporaire : aucun rattachement n'est livré tant que l'offre n'a pas validé les siens.

## Résultats de la dernière exécution (2026-10-27, Chromium + rendu WebGL logiciel, file://)

| Suite | Résultat |
|---|---|
| Données : contrôle d'intégrité (`rome_fixture.py`) | 6 / 6 |
| Moteur ROME 4 (`rome-match.js`, copie avec mapping de test) | 16 / 16 + console propre |
| Parcours principal (`e2e-core.js`) | 32 / 32 |
| Pitch guidé (`e2e-pitch.js`) | 21 / 21 |
| Mouvement réduit, Passer, version courte, Échap (`e2e-modes.js`, parties 1 et 2) | 5 / 5 et 12 / 12 |
| Version statique sans WebGL (`e2e-modes.js`, partie 3) | 20 / 20 |
| Mobile 390 × 844 tactile (`e2e-mobile.js`) | 9 / 9 |

Dans chaque suite : console sans erreur et **aucune requête réseau**.

Ce qui n'est **pas** couvert : fluidité sur GPU réel, lecteurs d'écran (les rôles et noms accessibles sont posés, pas écoutés), Safari et Firefox (seul Chromium est piloté), vidéo de transition réelle (fichiers non fournis : le chemin « vidéo » n'est pas exécuté), impression papier (seule la feuille imprimable est vérifiée).
