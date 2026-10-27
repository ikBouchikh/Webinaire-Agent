# Éléments « À VALIDER »

Règle appliquée partout : quand une donnée approuvée n'est pas disponible, un emplacement explicite est créé,
centralisé dans un fichier de configuration, marqué **À VALIDER** à l'écran et dans le fichier. Rien n'est transformé en contenu définitif.

## 1. Données manquantes (aucune valeur inventée)

| # | Donnée attendue | Où la renseigner | Comportement actuel |
|---|---|---|---|
| 1 | Six champs commerciaux par produit : problème client traité ; ce que le participant saura mieux faire ; arguments de vente ; preuve ou différenciateur ; objection fréquente + réponse ; produits complémentaires | `content/produits-commercial.json` (schéma dans le fichier), puis `python3 tools/build-data.py` | Chaque rubrique de la fiche affiche un encart « À VALIDER ». Seuls les « produits associés dans les lots du catalogue » (factuels, base produits) sont affichés. |
| 2 | Rattachement validé produit → compétences ROME 4.0 (id, libellé exact, importance cœur/support, explication) | `content/mapping-produits-rome.json` (`statut: "VALIDE"`, `validePar`, `date`) | Onglet « Compétences ROME 4 » vide avec encart « Rattachement ROME 4 à valider ». La correspondance ne porte alors que sur le cadre (univers, niveau, format, durée). |
| 3 | Définition des « Moments de Vie » (id, libellé, compétences ROME) | `content/moments-de-vie.json` | Étape 2 du pitch : encart « Moments de vie À VALIDER », aucun moment inventé. |
| 4 | Lien métier ROME → compétences (la vue consolidée fournie ne contient que des compteurs, pas la table de liens) | `content/mapping-produits-rome.json` (champ `metiers` par produit) | Le métier est saisi et restitué dans la synthèse, sans effet sur le calcul. |
| 5 | Textes validés « origine / vision / offre » | `content/vision-offre.json` | Textes provisoires : charte (pages 8, 11, 23) et brief ; chaque bloc porte sa source et le statut `A_VALIDER`. |
| 6 | Fiche de l'ouvrage Code civil : date de promulgation, nombre d'articles, imprimeur / mention d'édition, provenance et date d'acquisition, photographies | `content/vision-offre.json` → `codeCivil` | Seuls la désignation et l'acquisition communiquées par le client sont affichées. Aucun fait historique n'est inscrit sur le livre 3D. |
| 7 | Intitulé définitif de l'installation « Le Grand Livre du Chiffre / La table des décisions » | `content/vision-offre.json` → `chiffre` | Intitulé provisoire signalé à l'écran. L'installation est symbolique : aucun chiffre réel, aucun objet historique. |
| 8 | Accessoire Cognitio pour « Service public » (aucun visuel fourni) | `content/domaines.json` → `accessoire` | Variante « neutre » (mascotte inchangée). |
| 9 | Logo officiel et symbole JL en vectoriel | `assets/brand/logo-ldc.svg`, `assets/brand/symbole-jl.svg` | Repère générique à la forme récurrente de la charte (non officiel) + nom en texte. Détection automatique après `build-data.py`. |
| 10 | Séquence vidéo de transition (webm + mp4 + poster) | `assets/transition/book-laptop-cognitio.*` | Séquence procédurale HTML/CSS/SVG équivalente. Détection automatique après `build-data.py`. |
| 11 | Regroupement des 37 domaines FORMEO en six univers et intitulés d'univers | `content/domaines.json` | Proposition de travail ; intitulés configurables. |
| 12 | Pondérations du moteur de correspondance | `data/matching-config.js` | Proposition de travail. |
| 13 | Textes de guidage de Cognitio, déroulé du pitch, prochaines étapes proposées | `content/cognitio-script.json`, `content/pitch-script.json` | Micro-copie provisoire, sans donnée commerciale. |

## 2. Interprétations à confirmer

- Colonne « VENDU SEUL = NON » : produit exclu des **vitrines** (il reste dans la liste complète).
- Colonne « BEST = OUI » : affichée « BEST » telle quelle (jamais « meilleure vente »). Les vitrines affichent d'abord ces produits.
- Colonne « ELIGIBLE CPF » : affichée « Éligible CPF (catalogue) ».
- Tarifs et noms de collaborateurs : volontairement exclus des données chargées dans le navigateur.
- Certifications : issues de l'onglet PRODUITS CERTIFIANTS (RS / RNCP), affichées comme référentiel **France compétences**, distinct de ROME 4.0.
- Lots : la composition (onglet LOTS) sert de « produits associés » factuels ; 480 références de lots pointent vers des codes absents de la base PRODUITS et sont ignorées.

## 3. Éléments volontairement absents

Pas de musique, d'XP, de quêtes, de mini-carte, de caméra libre, de brouillard, de zoom brutal. Pas d'appel réseau, pas de CDN, pas de SQLite dans le navigateur.
