# Le Copilote du Manager — démo du webinaire (15/10/2026)

Démo **100 % locale et scénarisée** pour le webinaire *« Agents IA : comment les intégrer concrètement dans votre quotidien ? »*
(Lefebvre Dalloz Compétences).

## Lancer
Double-cliquez sur `index.html` (dossier `demo/`) (aucune installation, aucun réseau, aucune clé API).
Passez le navigateur en plein écran (F11) avant de partager votre écran.

## Important : à dire à l'audience
Ce n'est **pas** une IA en temps réel : chaque mission rejoue un scénario préparé, avec des données fictives.
Le badge « Démo scénarisée » reste affiché à l'écran. Une phrase suffit :
> « Cette démo est préparée pour illustrer le fonctionnement d'un agent : les étapes, les outils et la validation humaine sont réels dans leur logique, les données sont fictives. »

Cela reste honnête vis-à-vis des participants et renforce votre message sur la supervision humaine.

## Raccourcis (pratique en direct)
| Touche | Action |
|---|---|
| `1` `2` `3` `4` | Choisir la mission |
| `Entrée` | Lancer l'agent |
| `V` `M` `R` | Valider / Modifier / Refuser (fenêtre de validation) |
| `F` | Mode rapide (×3) en cas de manque de temps |
| `Échap` | Réinitialiser |

## Déroulé conseillé (≈ 10 min)
0. **Ma journée (2 min), l'ouverture.** « Prépare ma journée. » Regardez les trois connecteurs passer au vert (agenda, messagerie, Teams, en lecture seule). L'agent repère un conflit d'agenda, trie l'urgent, prépare les rendez-vous et propose 2 actions. La fenêtre de validation arrive : vous décidez.
1. **Préparer (3 min).** « Camille, entretien annuel. » Lancez, commentez les étapes (*l'agent lit, consulte un référentiel, identifie les enjeux, rédige, puis vérifie*). Montrez l'encadré orange : l'agent signale ce qu'il ne peut pas décider.
2. **Analyser (2 min).** Le graphique apparaît. Insistez sur la dernière étape : *« L'agent ne conclut pas à la place du manager »* (échantillon de 12, corrélation ≠ causalité).
3. **Suivre (3 min).** Le moment fort : la fenêtre rouge **« Validation humaine requise »**. Faites voter la salle : valider, modifier ou refuser. Montrez le refus pour prouver que rien ne part sans vous.

Variante : le second scénario de « Préparer » (annonce de réorganisation) peut servir de rappel.

## Conseils
- Testez la veille sur la machine de présentation, avec le même navigateur et la même résolution.
- Fermez les notifications. Zoom navigateur à 100 % ou 110 % pour la lisibilité.
- Plan B : les captures du déroulé sont faciles à refaire, et la démo fonctionne hors ligne.
- `Exporter en PDF` (après une mission) génère le livrable via l'impression du navigateur.

## Aller plus loin (idée)
Brancher un vrai modèle (API Anthropic) en mode « live » : possible plus tard, mais payant à l'usage et dépendant du réseau, donc plus risqué en direct.

## Fichiers
- `index.html` : structure
- `style.css` : charte (crème, rouge, bordeaux, pêche, serif)
- `app.js` : scénarios et moteur d'animation (tout le contenu textuel s'y modifie facilement)
