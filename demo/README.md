# Le Copilote du Manager — démo du webinaire (15/10/2026)

Démo **100 % locale et scénarisée** pour le webinaire *« Agents IA : comment les intégrer concrètement dans votre quotidien ? »*
(Lefebvre Dalloz Compétences, Sabrine Bendimerad et Ikram Bouchikh). Elle suit le fil rouge des slides : **Claire, manager d'une équipe de 8 personnes**.

## Lancer
Double-cliquez sur `index.html` (dossier `demo/`). Aucune installation, aucun réseau, aucune clé API.
Passez le navigateur en plein écran (F11) avant de partager votre écran.

## À dire à l'audience
Ce n'est **pas** une IA en temps réel : chaque étape rejoue un scénario préparé, avec des données fictives.
Le badge « Démo scénarisée » reste affiché. Une phrase suffit :
> « Cette démo est préparée pour illustrer la logique d'un agent : les étapes, les outils, le contrôle et la validation humaine. Les données sont fictives. »

## Quatre étapes, calées sur vos slides

| Étape | Ce que le public voit | Où l'utiliser dans le deck |
|---|---|---|
| **01 Choisir** | 6 missions notées sur les 4 critères (fréquent, vérifiable, peu risqué, simple à cadrer). Le point d'équipe du lundi ressort comme « premier agent ennuyeux ». Les entretiens et annonces difficiles restent humains. | Slides 26 et 30 (poser la limite, par où commencer), 40 |
| **02 Déléguer** | **Le moment de démonstration de la slide 25.** La mission est cadrée en 6 points (mission, périmètre, limites, validation, livrable, trace). L'agent ouvre les sources, repère les retards, rédige l'ordre du jour, **échoue au contrôle puis recommence seul**, et signale ce qui manque. Livré : 5 points, 12 actions, 2 « MANQUANT », 3 zones d'ombre. Validation humaine avant l'envoi des relances. | Slides 24 à 25, 29 |
| **03 Encadrer** | Le **curseur d'autonomie N1 à N4** sur la même mission. À N1 et N2, vous gardez la main. À N3 et N4, une simulation montre ce qui arrive : *une mauvaise action a déjà produit ses effets*. Tableau des 4 règles pour garder la main et des 3 risques (il invente, il tourne en rond, il obéit à ce qu'il lit). | Slides 27, 33 à 36 |
| **04 Déployer** | La méthode en 4 étapes (identifier, cadrer, tester, mesurer), la mission-type partageable, les indicateurs, « acheter, assembler, construire », l'annonce à l'équipe avec validation, et la question finale « Et lundi matin ? » | Slides 39 à 44 |

Un **bonus** (touche 5, ou lien sur l'accueil) : *Ma journée*, avec agenda, mails et Teams simulés en lecture seule.

## Suggestion de déroulé
- **Si vous ne montrez qu'un seul moment (slide 25) :** étape **02 Déléguer**, 3 minutes. Phrase de la slide : *« L'agent n'a pas seulement produit un texte. Il a réalisé une mission. »*
- **Pour illustrer le curseur (slide 27) :** étape **03 Encadrer**. Lancez N2 (tout va bien), puis N3 ou N4 pour montrer le risque. C'est le moment le plus marquant.
- Les étapes 01 et 04 peuvent servir d'illustration ou de pont vers les slides 30 et 44.

## Raccourcis
| Touche | Action |
|---|---|
| `1` `2` `3` `4` | Choisir l'étape (`5` : bonus) |
| `Entrée` | Lancer l'agent |
| `←` `→` | Changer de niveau d'autonomie (étape 03) |
| `V` `M` `R` | Valider / Modifier / Refuser (fenêtre de validation) |
| `H` | Retour à l'accueil |
| `F` | Mode rapide (×3) |
| `Échap` | Réinitialiser |

Chaque étape propose un bouton pour enchaîner sur la suivante.

## Conseils
- Répétez sur la machine de présentation, avec le même navigateur et la même résolution.
- Zoom à 100 % ou 110 %, notifications coupées. La démo fonctionne hors ligne.
- Dans l'étape 02, laissez la salle choisir : valider, modifier (retirer la relance à Léa) ou refuser.

## Fichiers
- `index.html` : structure
- `style.css` : charte (crème, rouge, bordeaux, pêche, serif)
- `app.js` : scénarios et moteur d'animation. Tout le texte s'y modifie facilement.

## Pour aller plus loin
Brancher un vrai modèle (API Anthropic) en mode « live » est possible, mais payant à l'usage et dépendant du réseau, donc plus risqué en direct.
