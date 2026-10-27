# Prompt à fournir à ChatGPT : vision exacte du livrable « Bibliothèque des compétences » (version aide à la vente)

> Copiez tout ce qui suit dans ChatGPT. Les rubriques « À VALIDER » sont des manques réels : ne les comblez pas.

---

Tu vas m'aider à faire évoluer un livrable existant. Lis tout avant de répondre ; ne propose rien avant d'avoir confirmé en trois lignes ce que tu as compris.

## 1. Contexte
Lefebvre Dalloz Compétences (LDC) forme les professionnels (catalogue 2027 : 2 027 produits, 56 certifiants RS/RNCP, 215 lots) — site https://formation.lefebvre-dalloz.fr/ (ce n'est **pas** l'application Skilia). Le livrable est un **outil d'aide à la vente pour les commerciaux LDC** : raconter la vision du groupe, partir du besoin d'un client, explorer l'offre dans une expérience 3D, composer une **sélection client** exploitable. Ce n'est plus un parcours d'apprentissage.

## 2. Nature technique
Dossier `bibliotheque/` : HTML + CSS + JavaScript sans framework, Three.js r149 inclus. S'ouvre par double-clic sur `index.html`, **hors ligne** (aucun CDN, aucun appel réseau, pas de `fetch` ni de modules ES). Les données sont générées par `tools/build-data.py` (Python + openpyxl) à partir de la base produits (xlsx) et du référentiel ROME 4.0 (xlsx) vers `data/catalogue.js`, `data/rome4-compact.js` et `content/content.bundle.js`. Sans WebGL : version statique simplifiée. Navigation clavier, mouvement réduit, mobile.

## 3. Identité visuelle (charte LFVR_TERRITOIRE_ONBARDING.pdf = source de vérité)
- Rouge = couleur de marque (#D71635, #FF1E1E, #4B0000, #3B0000) ; clay (beiges #FAFAF5 #F2EEE1 #EBDCCD #E1C8B4 #CDB4A5) pour les fonds ; bleu (#1E87BE, #081F2C) et ocre (#FA914B, #CD5008) en touches seulement.
- IBM Plex : **Serif** pour titres et claims (italique pour l'emphase), **Sans** pour CTA et interface, **Mono** pour catégories et repères techniques.
- Forme graphique récurrente : rectangle arrondi à encoche haute droite (silhouette du symbole JL). Dégradés texturés réservés aux écrans et transitions. Matières tactiles, rapport humain / technologie.
- Mascotte **Cognitio** (feuille crème pliée, pli bordeaux) : le dessin ne change jamais ; seuls un ou deux accessoires légers varient par domaine (sept images fournies).
- **À VALIDER** : logo officiel et symbole JL en vectoriel (aujourd'hui : repère générique non officiel).

## 4. Deux mondes
- **Monde 1 — la Grande salle** : bibliothèque française ancienne (rotonde, galerie, six portes). Au centre, à égalité : *le premier Code civil* (Droit · Édition) et *Le Grand Livre du Chiffre* (« La table des décisions » : installation contemporaine symbolique, sans objet historique ni chiffre réel). En dix secondes, on comprend que LDC n'est pas seulement droit et éditorial.
- **Monde 2 — les six univers**, contemporains, chauds, tactiles : Droit (la chambre des sources), Chiffre (l'observatoire des décisions), RH-Paie-Social (la constellation des talents), QSE (la salle des risques et des impacts), Service public (la cartographie des missions), Management-Soft skills-Numérique (l'arène de situations). Chaque univers : installation d'accueil, puis une station par domaine FORMEO (en-tête + vitrine de 4 produits, BEST d'abord), liste complète.
- **Transition** porte → univers : séquence narrative (pages d'un livre → ordinateur → feuille → Cognitio → invitation). Vidéo locale si fournie (webm/mp4 + poster), sinon séquence procédurale ; version courte après la première visite ; bouton Passer ; image fixe en mouvement réduit.

## 5. Parcours
1. Écran d'accueil : *Explorer librement* ou *Pitch guidé (3 à 5 min)*.
2. Grande salle (carte du lieu en bas à droite, Cognitio en bas à gauche, fil d'Ariane, mode Exploration / Pitch en haut).
3. Code civil → panneau « De l'expertise éditoriale à l'action professionnelle » en 3 étapes (Notre origine / Notre vision / Notre offre) ; CTA : Découvrir notre approche · Explorer nos domaines · Construire une réponse client · Découvrir l'offre Droit.
4. Porte → transition → univers → stations → liste → **fiche produit à 4 onglets** : Pour quel besoin ? · Notre réponse · Compétences ROME 4 · Argumentaire commercial. Action principale : *Ajouter à la sélection client*.
5. **Ma sélection client** : besoin, produits retenus, durée cumulée, formats, compétences ROME 4, argument principal (texte libre), produits complémentaires ; copier, imprimer, réinitialiser ; conservée dans le navigateur ; aucune donnée sensible.
6. **Pitch guidé** : 1 ADN et vision → 2 besoin client (contexte, métier ROME, compétences ROME, univers, niveau, format, durée) → 3 domaine / situation → 4 compétences mobilisées → 5 sélection de produits classés par correspondance expliquée → 6 synthèse et prochaine étape.

## 6. Règles de contenu (non négociables)
- **Rien n'est inventé** : produits, durées, niveaux, formats, certifications viennent de la base ; compétences de ROME 4.0 (identifiants, libellés, types officiels). Aucune compétence déduite du titre d'un produit. France compétences (RS/RNCP) reste **séparé** de ROME 4.
- Donnée absente → encart **« À VALIDER »** (jamais un texte plausible). Liste dans `docs/A_VALIDER.md` : six champs commerciaux par produit (problème client, savoir-faire, arguments, preuve, objection + réponse, produits complémentaires) ; mapping validé produit → ROME 4 ; définition des « moments de vie » ; lien métier → compétences ; fiche de l'ouvrage Code civil (date, articles, imprimeur, provenance) ; textes validés origine / vision / offre ; accessoire Cognitio pour « Service public » ; logo et symbole ; vidéo de transition.
- Correspondance : déterministe, expliquée (pondérations dans `data/matching-config.js`) ; niveaux « forte / moyenne / partielle / cadre », jamais un score scientifique. Sans rattachement ROME validé, aucun produit n'est jamais « forte ».
- Cognitio est un guide scénarisé (pas de LLM), jamais un expert omniscient ; fournisseur remplaçable pour une API future.
- Interdits : musique, XP, quêtes, mini-carte, caméra libre, brouillard, zoom brutal, halos permanents, cyberpunk / néon violet / UI froide, tarifs et noms de collaborateurs dans le navigateur.

## 7. Historique des retours du client (à respecter)
Trop chargé, brouillon, flou → épuré, net. On se perdait / zoom trop fort → navigation sur rails, jamais de caméra libre. Couleurs hors charte → charte PDF. « J'ai beaucoup aimé que les portes s'ouvrent » → conservé. Le premier Code civil Napoléon, acquis récemment par le groupe, au centre de la salle → conservé, sans fait historique non validé.

## 8. Ta mission
Selon ce que je te demande ensuite : (a) relire le livrable avec un œil de commercial LDC et lister ce qui freine un rendez-vous client ; (b) rédiger les contenus « À VALIDER » **sous forme de propositions marquées comme telles**, jamais comme faits ; (c) proposer des scénarios de pitch par métier. Réponds en français, de façon concise, et signale toute hypothèse.
