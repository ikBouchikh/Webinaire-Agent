# Prompt à fournir à ChatGPT : vision exacte du livrable « Bibliothèque des compétences »

Copiez tout ce qui suit dans ChatGPT. Complétez la dernière section (« Ta mission »).

---

Tu es un expert en produit digital, expérience 3D web et communication éditoriale. Je vais te décrire avec précision un livrable déjà réalisé. Lis tout avant de répondre, puis fais ce qui est demandé dans la section « Ta mission ». Ne rien inventer : si une information manque, pose la question.

## 1. Contexte

- Client : **Lefebvre Dalloz Compétences** (organisme de formation du groupe Lefebvre Dalloz, éditeur juridique et fiscal). Site concerné : https://formation.lefebvre-dalloz.fr/ (catalogue de plus de 1 500 formations, 36 domaines d'expertise regroupés en 6 grands domaines). Ce n'est **pas** un projet Skilia.
- Livrable : une **expérience web immersive en 3D** pour explorer tout le catalogue 2027, appelée **« Bibliothèque des compétences »**.
- Idée directrice : une **bibliothèque française très ancienne et authentique**, qui fait hommage à la marque éditoriale (livres, reliures, Code civil) tout en restant **propre, nette, moderne et facile à naviguer**. Un esprit « Poudlard » discret (portes qui s'ouvrent, livres qui s'ouvrent dans la lumière, bougies flottantes), jamais kitsch ni « casino ».
- Correspondance avec le catalogue : **domaine = porte et rayon**, **thématique = travée**, **produit de formation = grand livre**, avec un lien avec les blocs de compétences de **France compétences**.

## 2. Nature technique

- Page web autonome : HTML, CSS, JavaScript sans framework, rendu 3D avec Three.js r149 (fichier embarqué, aucun réseau requis). Elle s'ouvre par double-clic sur `index.html` et fonctionne hors ligne.
- Aucune image : couvertures de livres, marbre, parquet, plaques, vitraux sont dessinés en canvas.
- Fichiers : `index.html`, `style.css`, `data.js` (catalogue), `textures.js` (matières et couvertures), `book.js` (le livre qui s'ouvre), `scene.js` (Grande salle et rayons), `app.js` (navigation, filtre, fiches, parcours), `vendor/three.min.js`.
- Lien de démonstration (privé, compte du propriétaire) : https://claude.ai/artifact/SP2CGpv5N3PpBhtZachDvt
- Code : dépôt GitHub `ikBouchikh/Webinaire-Agent`, branche `claude/bibliotheque-3d-formations-1tvjsx`, dossier `bibliotheque/`.

## 3. Identité visuelle (obligatoire)

- Palette strictement limitée à la charte fournie par le client (valeurs relevées à l'œil sur ses visuels, à confirmer) : sable `#F4ECE4`, crème `#FBF7F2`, encre bordeaux foncé `#4A0A22`, bordeaux `#680D2D`, framboise `#D6175F`, pêche `#F2B48C`, rose `#F3DDE3`, bleu `#2F5DA8` (accent rare). Boiseries en acajou bordeaux, pierre sable, or pour les dorures.
- Un accent par domaine, tous dans la charte : Chiffre = framboise `#D6175F` ; Droit = bordeaux `#680D2D` ; Équipes (RH) = pêche soutenu `#E3875A` ; Prévention (QSE) = bleu `#2F5DA8` ; Service public = mauve rosé `#A8416B` ; Humain (management) = or sable `#B58A4A`.
- Typographie : interface en sans-serif humaniste type Calibri ; textes gravés dans la 3D (couvertures, plaques) en serif type Georgia.
- Marque : mot-symbole textuel « LEFEBVRE DALLOZ / COMPÉTENCES » (serif capitales + sans espacée). Pas de logo Skilia.
- Rendu : net et lumineux, sans brouillard ni halo excessif, sans tonemapping, ombres douces. Pas de musique, pas de points d'expérience, pas de quêtes, pas de mini-plan (tout cela a été retiré à la demande du client car « trop chargé »).

## 4. Parcours, écran par écran

**A. Écran d'entrée (aussi réutilisé comme filtre « Mes rayons »)**
Carte sable à gauche, la Grande salle tourne lentement à droite. Trois blocs :
1. « Votre métier » : 10 profils (Direction financière · DAF ; Comptable · Expert-comptable ; Juriste · Direction juridique ; Avocat · Notaire ; RH · Paie · Social ; QSE · HSE ; Banque · Assurance ; Immobilier · Construction ; Secteur public ; Manager · Toutes fonctions). Chaque profil ouvre les bons rayons. Cette liste est une proposition à valider avec le client.
2. « Un besoin précis ? » : saisie libre (ex. paie, bail commercial, IA, document unique), recherche avec synonymes et sans accents ; ouvre les rayons pertinents et marque les livres repérés d'une étoile ★ ; cliquer un résultat emmène directement au livre.
3. « Vos rayons » : 6 cartes (une par domaine) à ouvrir ou fermer, avec compteur de formations. L'aperçu est en direct : les portes des rayons ouverts s'entrouvrent, celles des rayons fermés se ferment avec un cadenas.
Bouton « Entrer ».

**B. Grande salle, vue d'accueil**
Rotonde française (11 m de rayon) : sol en damier de marbre sable et bordeaux avec rosace gravée « LEFEBVRE DALLOZ COMPÉTENCES · CATALOGUE 2027 », murs de bibliothèques sur deux niveaux, galerie à balustres et rambarde laiton, six hautes fenêtres cintrées, dôme à caissons crème et or avec oculus, douze bougies flottantes.
**Au centre, un pupitre** (estrade en pierre et acajou, colonne, pupitre incliné) porte un grand livre ouvert qui flotte légèrement, avec un faisceau de lumière doux : **le premier Code civil de 1804** (voir section 7). La caméra le regarde en face, une porte de chaque côté. En bas, une carte « À LA UNE · Le premier Code civil » avec deux boutons : « Découvrir l'ouvrage » et « Explorer les rayons → ».

**C. Grande salle, vue des portes**
La caméra se place de côté : une porte au centre de l'écran, le pupitre visible sur un côté. Chaque porte : encadrement en pierre à arc, deux vantaux en acajou à panneaux, vitrail demi-cercle teinté de la couleur du domaine avec son symbole (€, §, RH, QSE, ★, ✦), plaque « RAYON · nom ». Carte en bas : nom du domaine, nombre de thématiques et de formations, ★ nombre de livres repérés, bouton « Entrer dans le rayon » (ou « Rouvrir ce rayon » si filtré). Sept points de repère : un losange doré (le Code civil) puis six points colorés.

**D. Passage dans un rayon**
Les vantaux s'ouvrent en grand, la caméra avance dans la lumière, un voile sable fait la transition.

**E. Rayon (une longue galerie)**
Un rayon par domaine, cinq travées côte à côte le long d'un mur de bibliothèques à deux niveaux (galerie en hauteur, échelles roulantes, plafond à caissons, fenêtres en face, tapis aux couleurs du domaine, parquet). Chaque travée : meuble bas, vitrine en velours, plaque dorée « TRAVÉE n SUR 5 · nom de la thématique », **quatre grands livres** exposés face visible (couverture cuir du domaine, cadres dorés, médaillon, titre, format, durée, signet coloré selon le format), des centaines de dos de livres au-dessus. Sous chaque livre, une **étiquette HTML nette** (titre sur deux lignes, pastille du format, durée, ★ si recommandé). Barre du bas : « ← Grande salle » et cinq onglets numérotés pour les travées.

**F. Livre ouvert**
Un clic sur un livre de la travée centrée : il quitte l'étagère, vient devant la caméra (taille modérée), la salle s'assombrit, la couverture s'ouvre (feuillets qui tournent, page de garde à gauche, page de titre à droite), halo doré et quelques étincelles. À droite, une fiche avec deux onglets :
- **Fiche** : format (Instant Learning, Workshop, Masterclass, Formation, Certificat), durée, niveau, objectifs, public, bouton « Ajouter à mon parcours ».
- **France compétences** : certification visée (RNCP niveau n ou répertoire spécifique), bloc de compétences, jauge de couverture en %, liste des compétences du bloc cochées ou « à compléter », et suggestions de livres de la même travée pour couvrir le reste du bloc.
Fermer (✕, Échap ou clic dans le vide) : le livre retourne sur son présentoir.

**G. Mon parcours** (tiroir à droite)
Liste des formations retenues, durée totale estimée, couverture de chaque bloc France compétences en barres, boutons « Copier le parcours » et « Vider ». Mémorisé dans le navigateur (localStorage).

## 5. Navigation (point crucial)

- **Pas de marche libre** : la caméra suit des rails, pour ne jamais perdre l'utilisateur.
- Glisser (souris ou doigt), flèches ‹ › à l'écran, touches ← →, molette : passer du Code civil aux six portes, puis d'une porte à l'autre ; dans un rayon, d'une travée à l'autre.
- Un clic **centre** d'abord l'élément (porte, travée), un second clic l'ouvre : aucun zoom brutal.
- Échap ou « ← Grande salle » : revenir en arrière. Fil d'Ariane cliquable en haut. Boutons du haut : « Mes rayons » (filtre) et « Mon parcours ».
- Adapté aux téléphones : fiche en volet du bas, caméra plus reculée en portrait.

## 6. Données et logique

- 6 domaines : Comptabilité, Finance & Fiscalité (« Du Chiffre ») ; Droit & Immobilier (« Du Droit ») ; RH, Paie & Social (« Des Équipes ») ; Qualité, Santé, Sécurité, Environnement (« De la Prévention ») ; Secteur public (« Du Service Public ») ; Management, Soft skills & Numérique (« De l'Humain »).
- Chaque domaine : 5 thématiques ; chaque thématique : 4 produits ; soit **30 thématiques et 120 produits**. Ces contenus sont **illustratifs** (écrits pour la démonstration), à remplacer par le catalogue 2027 dans `data.js`.
- Chaque thématique porte : 5 compétences, une cible France compétences (type RNCP ou RS, intitulé, niveau, bloc, 4 compétences du bloc reliées aux compétences de la thématique). Chaque produit : titre, format, durée, niveau, compétences travaillées.
- Le **score de correspondance est calculé** : part des compétences du bloc couvertes par le produit. Les rattachements RNCP / RS sont **indicatifs**, sans numéro de fiche.

## 7. Le premier Code civil (pièce maîtresse)

Au centre de la Grande salle, le livre ouvert représente **le premier Code civil (1804, dit « Code Napoléon »), récemment acquis par le groupe Lefebvre Dalloz** (information fournie par le client, à ne pas enrichir sans source). Page gauche : « CODE CIVIL DES FRANÇAIS · ÉDITION ORIGINALE et seule officielle · À PARIS, DE L'IMPRIMERIE DE LA RÉPUBLIQUE · AN XII — 1804 » (libellé de la page de titre, à vérifier sur l'exemplaire réel). Page droite : « TITRE PRÉLIMINAIRE » et « LIVRE PREMIER · Des personnes », avec un texte simulé par des lignes.
Au clic, la caméra s'approche et une fiche s'ouvre : promulgué le 21 mars 1804 ; 2 281 articles ; rédigé par une commission de 4 juristes ; rebaptisé « Code Napoléon » en 1807 ; socle du droit civil ; pièce rare des collections du groupe ; bouton « Découvrir les formations en droit » qui mène à la porte Droit & Immobilier. Les textes de présentation sont à valider avec l'éditorial et peuvent être complétés par des photos de l'exemplaire. Rôle : mettre en valeur l'image éditoriale de Lefebvre Dalloz (effet « tribunal », côté avocat et éditeur).

## 8. Historique des retours du client (à respecter)

Une première version a été rejetée : « trop chargée, floue, pas professionnelle, on est perdu, on ne peut pas bouger, le clic zoome trop, couleurs hors charte ». D'où : navigation guidée sur rails, rendu net, palette stricte, suppression des effets superflus. Ce que le client a aimé et veut garder : les **portes qui s'ouvrent**, le **filtre à l'entrée** (métier, besoin précis, rayons), le **sol propre** de la nouvelle version, et surtout **la table centrale avec le grand livre** (désormais le Code civil de 1804).

## 9. Limites et points à valider

- Contenu du catalogue fictif ; correspondance France compétences indicative.
- Liste des métiers ciblés à confirmer ; couleurs exactes de la charte à confirmer (codes hex officiels).
- Informations sur le Code civil (acquisition, libellé de la page de titre) à valider.
- Le site https://formation.lefebvre-dalloz.fr/ n'a pas pu être consulté pendant la conception : l'organisation des domaines vient d'informations publiques générales.

## 10. Ta mission

[À COMPLÉTER. Exemples : rédiger le cahier des charges fonctionnel ; écrire le texte de présentation destiné aux équipes marketing ; préparer un plan de branchement sur le vrai catalogue 2027 et l'API France compétences ; proposer des améliorations de l'expérience ; rédiger un brief pour un prestataire 3D ; préparer un script de démonstration de 3 minutes.]

Règles de réponse : réponds en français, de façon structurée et concrète ; commence par reformuler en 5 lignes ta compréhension du livrable pour que je la valide ; distingue ce qui est fait, ce qui est illustratif et ce qui reste à décider ; n'invente aucun fait sur le Code civil, sur Lefebvre Dalloz ou sur France compétences ; signale toute incohérence ou information manquante avant de produire le livrable demandé.
