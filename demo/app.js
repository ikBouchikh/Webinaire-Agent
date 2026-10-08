/* Le Copilote du Manager — démo SCÉNARISÉE (aucun appel réseau, aucune IA en temps réel).
   Chaque mission rejoue un scénario préparé : étapes de l'agent, livrable, validation humaine.
   Données entièrement fictives. */

const $ = (s) => document.querySelector(s);
let speed = 1; // 1 = normal, 0.35 = rapide
const sleep = (ms) => new Promise((r) => setTimeout(r, ms * speed));
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---------- Contenu des missions ---------- */

const MISSIONS = {
  journee: {
    name: 'Ma journée', sub: 'Agenda, mails et Teams en 30 secondes',
    connectors: ['Agenda', 'Messagerie', 'Teams'],
    scenarios: [
      {
        chip: 'Jeudi 15 octobre',
        input: `Jeudi 15 octobre 2026 — 7 h 55.
Vous demandez : « Prépare ma journée. »

Accès accordés à l'agent :
• Agenda : lecture seule
• Messagerie : lecture seule
• Teams : lecture seule

Aucune action n'est exécutée sans votre validation.`,
        steps: [
          ['connecter_agenda()', 'Connexion à l\'agenda (lecture seule) : 6 rendez-vous aujourd\'hui', 1200, '', 'Agenda'],
          ['connecter_messagerie()', 'Connexion à la messagerie (lecture seule) : 12 mails non lus analysés', 1200, '', 'Messagerie'],
          ['connecter_teams()', 'Connexion à Teams (lecture seule) : 7 messages non lus analysés', 1100, '', 'Teams'],
          ['croiser_sources()', 'Rapprochement des rendez-vous avec les mails et les messages', 1400],
          ['detecter_conflits()', '1 conflit d\'agenda : comité 14 h / point Atlas 14 h 30', 1000, 'warn'],
          ['evaluer_urgence()', 'Tri : 2 mails urgents et 2 messages Teams urgents retenus', 1200],
          ['preparer_rdv()', '4 rendez-vous à préparer : fiches générées', 1500],
          ['verifier_perimetre()', 'Lecture seule respectée : 2 actions proposées, en attente de votre accord', 900, 'warn'],
        ],
        gate: {
          title: 'Appliquer 2 actions proposées ?',
          body: 'Décaler le point Atlas à 15 h 15 et répondre à Marc sur Teams. Rien ne part sans votre accord : jusqu\'ici, l\'agent n\'a fait que lire.',
        },
        blocks: () => [
          `<h3>Votre journée en bref</h3><div class="stats">
            <div class="stat"><b>6</b><span>rendez-vous</span></div>
            <div class="stat"><b>4</b><span>à préparer</span></div>
            <div class="stat"><b>1</b><span>conflit d'agenda</span></div>
            <div class="stat"><b>2</b><span>mails urgents</span></div>
            <div class="stat"><b>2</b><span>messages Teams urgents</span></div>
          </div><p class="muted">Environ 1 h de préparation au total. Vous avez 2 h de libre entre 12 h et 14 h.</p>`,
          `<h3>Dans cet ordre</h3><ol>
            <li><b>09 h 30</b> (20 min) : préparer l'entretien de Camille.</li>
            <li><b>10 h 50</b> (10 min) : répondre à la direction financière sur le budget, et décider votre position avant l'appel Delmas.</li>
            <li><b>12 h 15</b> (25 min) : relire la note de cadrage de Sofia, puis préparer le comité de 14 h.</li>
            <li><b>15 h 45</b> (10 min) : préparer le point RH de 16 h.</li>
          </ol>`,
          `<h3>Votre agenda</h3>
          <div class="rdv"><span class="h">09:00</span><div><span class="rt">Point hebdo de l'équipe</span> <span class="tag">Routine</span><p class="muted">Rien à préparer. Pensez à annoncer le comité de 14 h.</p></div></div>
          <div class="rdv"><span class="h">10:00</span><div><span class="rt">Entretien annuel : Camille</span> <span class="tag hi">À préparer</span><ul><li>Guide prêt : +12 % d'objectifs à valoriser, reporting à traiter sans en faire le centre.</li><li>Le créneau est de 45 min, pas 1 h : réduisez le bilan à 10 minutes.</li><li>Aucune promesse de promotion sans validation RH.</li></ul></div></div>
          <div class="rdv"><span class="h">11:30</span><div><span class="rt">Appel fournisseur Delmas</span> <span class="tag hi">À préparer</span><ul><li>Mail de 6 h 40 : nouvelle grille tarifaire à +4 %, signature prévue vendredi.</li><li>Décidez votre position avant l'appel : accepter, négocier ou comparer.</li></ul></div></div>
          <div class="rdv"><span class="h">14:00</span><div><span class="rt">Comité de pilotage « Nouveau parcours client »</span> <span class="tag hi">À préparer</span><ul><li>Le budget n'est pas validé par la direction : réponse attendue avant 12 h.</li><li>La note de cadrage de Sofia est prête et attend votre relecture avant 13 h.</li><li>Prévoyez un plan B si le budget n'est pas validé : pilote réduit ou décalage. Vous décidez.</li></ul></div></div>
          <div class="rdv conflict"><span class="h">14:30</span><div><span class="rt">Point client Atlas</span> <span class="tag chk">Conflit</span><p class="muted">Chevauche le comité. Proposition : décaler à 15 h 15, créneau libre. Brouillon d'invitation prêt, en attente de votre accord.</p></div></div>
          <div class="rdv"><span class="h">16:00</span><div><span class="rt">Point RH : absentéisme</span> <span class="tag hi">À préparer</span><ul><li>Données de l'enquête prêtes : charge de travail 2,9 sur 5, absentéisme de 3,1 % à 4,8 %.</li><li>Échantillon de 12 personnes : ce sont des pistes à vérifier, pas des preuves.</li></ul></div></div>`,
          `<h3>Mails à traiter (2 urgents)</h3>
          <div class="urg"><small>Direction financière · 7 h 12 · <b>Urgent</b></small><br><b>Budget « Nouveau parcours client » : décision avant 12 h</b><br><span class="muted">Conditionne le comité de 14 h.</span></div>
          <div class="urg"><small>Delmas · 6 h 40 · <b>Urgent</b></small><br><b>Nouvelle grille tarifaire : signature vendredi</b><br><span class="muted">À trancher avant l'appel de 11 h 30.</span></div>
          <div class="urg mid"><small>Ressources humaines · hier · Cette semaine</small><br><b>Entretiens annuels : saisie avant vendredi 16/10</b><br><span class="muted">À saisir après l'entretien de Camille.</span></div>
          <p class="muted">9 autres mails (newsletters, informations) classés sans urgence.</p>`,
          `<h3>Teams (2 urgents)</h3>
          <div class="urg"><small>Marc · 7 h 48 · <b>Urgent</b></small><br>« Le budget n'est toujours pas validé, on maintient le comité de 14 h ? »</div>
          <div class="urg"><small>Sofia · 7 h 31 · <b>Urgent</b></small><br>« La note de cadrage est prête, tu peux la relire avant 13 h ? »</div>
          <div class="urg mid"><small>Karim · hier 18 h 02 · Aujourd'hui</small><br>« L'une des deux agences pilotes demande de reporter la visite. »</div>
          <p class="muted">4 autres messages classés sans urgence.</p>`,
          `<h3>Actions proposées (brouillons)</h3><div class="mail" id="mail"><span class="subj">1. Invitation à Atlas : décalage du point</span>Bonjour, un imprévu m'oblige à décaler notre point de 14 h 30 à 15 h 15 (même durée). Ce créneau vous convient-il ?

<span class="subj">2. Teams à Marc</span>Je relance la direction financière ce matin. On maintient le comité à 14 h, je te confirme avant 12 h.</div>`,
          `<div class="callout"><b>Périmètre de l'agent.</b> Il a lu votre agenda, vos mails et vos messages Teams, sans rien modifier. Il n'a pas ouvert les mails personnels ni les contenus RH sensibles : seul l'objet a été lu. Vous décidez de chaque réponse.</div>`,
        ],
        after: {
          ok: ['ok', '<b>Validé par vous.</b> Point Atlas décalé à 15 h 15 et réponse envoyée à Marc. <i>(Simulation : rien n\'a réellement été modifié ni envoyé.)</i>'],
          edit: ['ok', '<b>Version modifiée par vous, puis validée.</b> Actions appliquées. <i>(Simulation : rien n\'a réellement été modifié ni envoyé.)</i>'],
          no: ['', '<b>Actions refusées.</b> L\'agenda et Teams n\'ont pas été modifiés : les brouillons restent à votre disposition.'],
        },
      },
    ],
  },

  preparer: {
    name: 'Préparer', sub: 'Un entretien ou une annonce délicate',
    scenarios: [
      {
        chip: 'Entretien annuel',
        input: `Entretien annuel de Camille, chargée de clientèle (3 ans d'ancienneté).
• A dépassé ses objectifs de 12 % cette année.
• Souhaite évoluer vers un poste de responsable de portefeuille.
• Reporting mensuel rendu en retard 4 fois sur 6.
• Tension signalée avec un collègue du service facturation.
Durée prévue : 1 heure.`,
        steps: [
          ['lire_contexte()', 'Lecture de la situation et extraction des faits (4 éléments)', 1100],
          ['consulter_referentiel("entretien_annuel")', 'Récupération du modèle de déroulé d\'entretien (référentiel fictif)', 1200],
          ['identifier_enjeux()', 'Performance forte · ambition d\'évolution · point de vigilance sur le reporting', 1300],
          ['rediger_guide()', 'Rédaction du guide de préparation', 1500],
          ['verifier_cadre()', 'Contrôle : aucune promesse engageante, points à valider par un humain', 1000, 'warn'],
        ],
        blocks: () => [
          `<h3>Objectif de l'entretien</h3><p>Reconnaître la performance, clarifier les conditions d'une évolution et traiter le reporting <b>sans en faire le centre</b> de l'échange.</p>`,
          `<h3>Déroulé proposé (1 h)</h3><ol><li><b>Cadrage</b> — 5 min</li><li><b>Bilan de l'année</b> — 15 min</li><li><b>Point d'amélioration : le reporting</b> — 10 min</li><li><b>Projet d'évolution</b> — 20 min</li><li><b>Plan d'action et clôture</b> — 10 min</li></ol>`,
          `<h3>À valoriser</h3><ul><li>+12 % par rapport aux objectifs : citer deux résultats précis, pas seulement le chiffre.</li><li>L'envie d'évoluer : la présenter comme un atout, pas comme une revendication.</li></ul>`,
          `<h3>Point de vigilance</h3><p>4 retards sur 6 : rester <b>factuel</b>, chercher la cause (charge, outil, priorités) avant de conclure, puis fixer un jalon mesurable.</p>`,
          `<h3>Questions à poser</h3><ul><li>« Qu'est-ce qui a le mieux fonctionné cette année, selon vous ? »</li><li>« Qu'est-ce qui rend le reporting difficile à tenir à date ? »</li><li>« Quel serait le premier pas vers un rôle de responsable de portefeuille ? »</li><li>« Comment décririez-vous la collaboration avec la facturation ? »</li></ul>`,
          `<h3>Objections probables</h3><ul><li><b>« Je dépasse mes objectifs, le reporting est secondaire. »</b> → Reconnaître, puis relier le reporting à l'impact collectif et aux critères d'évolution.</li><li><b>« Je veux une promotion maintenant. »</b> → Ne rien promettre : exposer les critères et le calendrier, convenir d'un point à 3 mois.</li></ul>`,
          `<h3>Phrase d'ouverture</h3><p><i>« Camille, je voudrais qu'on prenne le temps de faire le point sur votre année : d'abord ce qui a bien fonctionné, ensuite vos envies d'évolution. »</i></p>`,
          `<div class="callout"><b>À vérifier par le manager.</b> Ne pas s'engager sur une augmentation ou une promotion sans validation RH : l'agent n'a pas accès à la politique salariale réelle. Relisez et adaptez ce guide avant l'entretien.</div>`,
        ],
      },
      {
        chip: 'Annonce de réorganisation',
        input: `Annonce de la fusion de deux services à une équipe de 8 personnes.
• Annonce prévue lundi, en réunion d'équipe.
• Inquiétudes pressenties : postes, locaux, nouveau responsable.
• Encore incertain : calendrier précis, organigramme final.`,
        steps: [
          ['lire_contexte()', 'Lecture de la situation et des zones d\'incertitude', 1100],
          ['consulter_referentiel("conduite_du_changement")', 'Récupération d\'un cadre de communication de changement (fictif)', 1200],
          ['anticiper_reactions()', 'Simulation des questions probables de l\'équipe', 1400],
          ['rediger_plan()', 'Rédaction du message clé et du calendrier', 1500],
          ['verifier_cadre()', 'Contrôle : rien d\'affirmé sur des points non validés', 1000, 'warn'],
        ],
        blocks: () => [
          `<h3>Message clé</h3><p><i>« Deux services vont se rapprocher. Je vous dis aujourd'hui ce que je sais, ce que je ne sais pas encore, et quand vous aurez la suite. »</i></p>`,
          `<h3>Transparence : ce que je sais / ne sais pas</h3><ul><li><b>Je sais :</b> la décision de rapprochement est prise, l'équipe est concernée dans son ensemble.</li><li><b>Je ne sais pas encore :</b> le calendrier précis et l'organigramme final. Je m'engage à vous informer dès que c'est validé.</li></ul>`,
          `<h3>Questions probables</h3><ul><li><b>« Mon poste est-il menacé ? »</b> → Ne répondre que sur ce qui est confirmé ; sinon dire quand la réponse viendra.</li><li><b>« Qui sera mon responsable ? »</b> → Dire ce qui est décidé, et la date de l'annonce.</li><li><b>« Pourquoi maintenant ? »</b> → Donner la raison de fond, sans la minimiser.</li></ul>`,
          `<h3>Calendrier de communication</h3><ol><li><b>J-1</b> : prévenir les RH et son propre responsable.</li><li><b>Jour J</b> : annonce en réunion (30 min), puis 1-to-1 proposés dans la journée.</li><li><b>J+7</b> : point d'étape avec l'équipe.</li></ol>`,
          `<div class="callout"><b>À vérifier par le manager.</b> Selon l'entreprise, une information ou consultation des représentants du personnel peut être nécessaire avant l'annonce : à confirmer avec les RH ou le juridique. L'agent ne peut pas le trancher.</div>`,
        ],
      },
    ],
  },

  analyser: {
    name: 'Analyser', sub: 'Une enquête d\'équipe',
    scenarios: [
      {
        chip: 'Enquête d\'équipe',
        input: `Enquête d'équipe (fictive) — 12 répondants. Notes de 1 à 5 :
• Charge de travail : 2,9
• Clarté des priorités : 3,4
• Reconnaissance : 3,1
• Collaboration : 4,2
• Autonomie : 4,0
Reconnaissance : moins de 1 an d'ancienneté 2,6 · plus de 3 ans 3,8
Absentéisme du trimestre : 4,8 % (trimestre précédent : 3,1 %)
Verbatims : « Les fins de mois sont ingérables », « On ne sait plus qui décide ».`,
        steps: [
          ['charger_donnees()', '12 réponses, 5 critères, 2 trimestres d\'absentéisme chargés', 1000],
          ['calculer_moyennes()', 'Moyennes et écarts par critère', 1100],
          ['segmenter("anciennete")', 'Comparaison moins de 1 an / plus de 3 ans', 1300],
          ['detecter_signaux()', '3 signaux faibles repérés', 1400],
          ['croiser_verbatims()', 'Rapprochement avec les commentaires libres', 1200],
          ['rediger_synthese()', 'Rédaction de la synthèse et des pistes d\'action', 1400],
          ['verifier_limites()', 'Rappel des limites : échantillon de 12, corrélation ≠ causalité', 900, 'warn'],
        ],
        blocks: () => {
          const data = [['Collaboration', 4.2], ['Autonomie', 4.0], ['Clarté des priorités', 3.4], ['Reconnaissance', 3.1], ['Charge de travail', 2.9]];
          const bars = data.map(([l, v], i) => {
            const y = 14 + i * 40, w = (v / 5) * 300, low = v < 3.2;
            return `<text x="12" y="${y + 17}">${l}</text>
              <rect x="170" y="${y}" width="300" height="24" rx="6" fill="#efe6d6"/>
              <rect x="170" y="${y}" width="${w}" height="24" rx="6" fill="${low ? '#ff0000' : '#f9a66c'}"/>
              <text class="val" x="${170 + w + 8}" y="${y + 17}">${v.toFixed(1).replace('.', ',')}</text>`;
          }).join('');
          return [
            `<h3>Vue d'ensemble</h3><svg class="chart" viewBox="0 0 540 220" role="img" aria-label="Notes moyennes par critère">${bars}</svg><p class="muted">En rouge : critères sous 3,2 sur 5.</p>`,
            `<h3>3 signaux faibles</h3><ol><li><b>Charge de travail (2,9)</b> : le critère le plus bas, confirmé par « les fins de mois sont ingérables ».</li><li><b>Écart de reconnaissance selon l'ancienneté</b> : 2,6 pour les moins d'un an contre 3,8 pour les plus de 3 ans.</li><li><b>Absentéisme</b> : de 3,1 % à 4,8 %, soit <b>+1,7 point</b> en un trimestre.</li></ol>`,
            `<h3>Pistes d'action</h3><ul><li>Cartographier la charge de fin de mois et lisser deux échéances.</li><li>Clarifier qui décide de quoi : un rappel de 15 minutes en réunion d'équipe.</li><li>Prévoir un point de reconnaissance spécifique pour les nouveaux arrivants.</li></ul>`,
            `<div class="callout"><b>Ce que l'agent ne conclut pas.</b> Avec 12 répondants, ces écarts sont des <b>pistes à vérifier</b>, pas des preuves. Rien ne dit que la charge explique l'absentéisme : à discuter avec l'équipe et les RH, sans identifier de personne.</div>`,
          ];
        },
      },
    ],
  },

  suivre: {
    name: 'Suivre', sub: 'Du compte rendu aux actions',
    scenarios: [
      {
        chip: 'Compte rendu de réunion',
        input: `Réunion projet « Nouveau parcours client » — lundi 12/10.
Participants : Léa, Marc, Sofia, Karim, Julie.
• Le lancement d'un pilote sur 2 agences est validé.
• Marc finalise le budget avant la fin de la semaine.
• Sofia prépare la note de cadrage pour le comité du 21.
• Karim contacte les deux agences pilotes.
• Julie voit avec l'IT l'accès aux données.
• Point d'étape à refaire le 30.
• Attention : budget pas encore validé par la direction, risque de décalage.`,
        steps: [
          ['lire_compte_rendu()', 'Lecture du compte rendu : 5 participants, 6 points', 1000],
          ['extraire_actions()', '5 actions identifiées, avec responsable et échéance', 1400],
          ['detecter_zones_floues()', '1 responsable non précisé, 1 risque signalé', 1100, 'warn'],
          ['rediger_mail()', 'Rédaction du mail de suivi', 1500],
          ['preparer_envoi()', 'Envoi prêt — en attente de votre validation', 800],
        ],
        gate: {
          title: 'Envoyer ce compte rendu à 5 personnes ?',
          body: 'L\'agent a rédigé un mail destiné à Léa, Marc, Sofia, Karim et Julie. Rien ne part sans votre accord. Un responsable est à confirmer.',
        },
        blocks: () => [
          `<h3>Plan d'actions</h3><table class="t"><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th><th></th></tr></thead><tbody>
            <tr><td>Finaliser le budget</td><td>Marc</td><td>ven. 16/10</td><td><span class="tag hi">Haute</span></td></tr>
            <tr><td>Note de cadrage pour le comité</td><td>Sofia</td><td>mer. 21/10</td><td><span class="tag hi">Haute</span></td></tr>
            <tr><td>Contacter les 2 agences pilotes</td><td>Karim</td><td>ven. 23/10</td><td><span class="tag">Moyenne</span></td></tr>
            <tr><td>Obtenir l'accès aux données (IT)</td><td>Julie</td><td>ven. 23/10</td><td><span class="tag">Moyenne</span></td></tr>
            <tr><td>Point d'étape</td><td>Non précisé</td><td>ven. 30/10</td><td><span class="tag chk">À confirmer</span></td></tr>
          </tbody></table>`,
          `<div class="callout"><b>Risque à surveiller.</b> Le budget n'est pas encore validé par la direction : si la validation tarde, la note de cadrage du 21/10 risque d'être décalée.</div>`,
          `<h3>Mail de suivi (brouillon)</h3><div class="mail" id="mail"><span class="subj">Objet : Compte rendu — Nouveau parcours client (réunion du 12/10)</span>Bonjour à tous,

Merci pour la réunion de ce matin. Le lancement d'un pilote sur 2 agences est validé.

Prochaines étapes :
• Marc — finaliser le budget, d'ici vendredi 16/10
• Sofia — note de cadrage pour le comité, pour le mercredi 21/10
• Karim — contacter les deux agences pilotes, d'ici vendredi 23/10
• Julie — obtenir l'accès aux données auprès de l'IT, d'ici vendredi 23/10

Point d'étape le vendredi 30/10. Merci de me dire qui l'organise.

Point d'attention : le budget doit encore être validé par la direction.

Bonne semaine,
[Votre prénom]</div>`,
        ],
        after: {
          ok: ['ok', '<b>Validé par vous.</b> Mail marqué comme envoyé à 5 personnes et actions ajoutées au plan de suivi. <i>(Simulation : rien n\'a réellement été envoyé.)</i>'],
          edit: ['ok', '<b>Version modifiée par vous, puis validée.</b> Mail marqué comme envoyé. <i>(Simulation : rien n\'a réellement été envoyé.)</i>'],
          no: ['', '<b>Envoi refusé.</b> Rien n\'a été envoyé : le brouillon reste à votre disposition. C\'est l\'intérêt de garder l\'humain dans la boucle.'],
        },
      },
    ],
  },
};

/* ---------- État et interface ---------- */

let current = 'preparer', scen = 0, running = false;

function renderMissions() {
  const nav = $('#missions');
  nav.innerHTML = '';
  Object.entries(MISSIONS).forEach(([key, m], i) => {
    const b = document.createElement('button');
    b.className = 'mission' + (key === current ? ' active' : '');
    b.innerHTML = `<span class="num">0${i + 1}</span><span><span class="m-title">${m.name}</span><span class="m-sub">${m.sub}</span></span>`;
    b.onclick = () => select(key);
    nav.appendChild(b);
  });
}

function renderInput() {
  const m = MISSIONS[current];
  const chips = $('#chips');
  chips.innerHTML = '';
  if (m.scenarios.length > 1) {
    m.scenarios.forEach((s, i) => {
      const c = document.createElement('button');
      c.className = 'chip' + (i === scen ? ' active' : '');
      c.textContent = s.chip;
      c.onclick = () => { if (!running) { scen = i; reset(); } };
      chips.appendChild(c);
    });
  }
  $('#inputText').textContent = m.scenarios[scen].input;
  const cn = $('#connectors');
  cn.innerHTML = '';
  (m.connectors || []).forEach((name) => {
    const s = document.createElement('span');
    s.className = 'conn';
    s.dataset.name = name;
    s.textContent = name;
    cn.appendChild(s);
  });
}

function reset() {
  if (running) return;
  $('#steps').innerHTML = '';
  $('#stepsEmpty').hidden = false;
  setStatus('en attente', '');
  $('#result').innerHTML = '<p class="muted">Lancez l\'agent : le livrable apparaîtra ici.</p>';
  $('#printBtn').hidden = true;
  renderMissions();
  renderInput();
}

function select(key) {
  if (running) return;
  current = key; scen = 0;
  showApp();
  reset();
}

function showApp() {
  $('#landing').hidden = true;
  $('#app').hidden = false;
  window.scrollTo(0, 0);
}

function showLanding() {
  if (running) return;
  $('#app').hidden = true;
  $('#landing').hidden = false;
  window.scrollTo(0, 0);
}

function renderLanding() {
  const box = $('#lcards');
  box.innerHTML = '';
  Object.entries(MISSIONS).forEach(([key, m], i) => {
    const b = document.createElement('button');
    b.className = 'lcard';
    b.innerHTML = `<span class="ln">0${i + 1}</span><span class="lt">${m.name}</span><span class="ls">${m.sub}</span><span class="go"></span>`;
    b.onclick = () => select(key);
    box.appendChild(b);
  });
}

function setStatus(text, cls) {
  const s = $('#status');
  s.textContent = text;
  s.className = 'status ' + cls;
}

function gate({ title, body }) {
  return new Promise((resolve) => {
    $('#gateTitle').textContent = title;
    $('#gateBody').textContent = body;
    const g = $('#gate');
    g.hidden = false;
    const done = (choice) => {
      g.hidden = true;
      g.querySelectorAll('button').forEach((b) => (b.onclick = null));
      document.removeEventListener('keydown', onKey);
      resolve(choice);
    };
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'v') done('ok'); else if (k === 'm') done('edit'); else if (k === 'r') done('no');
    };
    g.querySelectorAll('button').forEach((b) => (b.onclick = () => done(b.dataset.choice)));
    document.addEventListener('keydown', onKey);
  });
}

async function run() {
  if (running) return;
  running = true;
  $('#runBtn').disabled = true;
  const sc = MISSIONS[current].scenarios[scen];
  const stepsEl = $('#steps');
  stepsEl.innerHTML = '';
  $('#stepsEmpty').hidden = true;
  $('#result').innerHTML = '';
  $('#printBtn').hidden = true;
  setStatus('en cours…', 'run');

  for (const [tool, desc, ms, kind, conn] of sc.steps) {
    const li = document.createElement('li');
    li.className = 'step' + (kind === 'warn' ? ' warn' : '');
    li.innerHTML = `<span class="ico"></span><div class="body"><span class="tool">${esc(tool)}</span><span class="desc">${esc(desc)}</span></div><time></time>`;
    stepsEl.appendChild(li);
    li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const t0 = performance.now();
    await sleep(ms);
    li.classList.add('done');
    if (conn) document.querySelectorAll('.conn').forEach((c) => { if (c.dataset.name === conn) c.classList.add('on'); });
    li.querySelector('time').textContent = ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s';
  }

  // Livrable, bloc par bloc
  const res = $('#result');
  for (const html of sc.blocks()) {
    const d = document.createElement('div');
    d.className = 'blk';
    d.innerHTML = html;
    res.appendChild(d);
    await sleep(450);
  }

  // Validation humaine
  if (sc.gate) {
    setStatus('en attente de validation', 'run');
    const choice = await gate(sc.gate);
    let finalChoice = choice;
    if (choice === 'edit') {
      const mail = $('#mail');
      mail.contentEditable = 'true';
      mail.focus();
      const bar = document.createElement('div');
      bar.className = 'blk';
      bar.innerHTML = '<p class="muted">Modifiez le mail directement, puis validez.</p><button class="btn btn-primary" id="okEdit">Valider ma version</button>';
      res.appendChild(bar);
      bar.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      await new Promise((r) => ($('#okEdit').onclick = r));
      mail.contentEditable = 'false';
      bar.remove();
    }
    const [cls, msg] = sc.after[finalChoice];
    const c = document.createElement('div');
    c.className = 'callout blk ' + cls;
    c.innerHTML = msg;
    res.appendChild(c);
    c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  setStatus('terminé', 'done');
  $('#printBtn').hidden = false;
  $('#runBtn').disabled = false;
  running = false;
}

/* ---------- Événements ---------- */

$('#runBtn').onclick = run;
$('#resetBtn').onclick = reset;
$('#printBtn').onclick = () => window.print();
$('#backBtn').onclick = showLanding;

document.addEventListener('keydown', (e) => {
  if ($('#gate').hidden === false || e.target.isContentEditable) return;
  const keys = Object.keys(MISSIONS);
  if (['1', '2', '3', '4'].includes(e.key)) select(keys[Number(e.key) - 1]);
  else if (!$('#landing').hidden) return;
  else if (e.key === 'Enter') run();
  else if (e.key.toLowerCase() === 'h') showLanding();
  else if (e.key === 'Escape') reset();
  else if (e.key.toLowerCase() === 'f') {
    speed = speed === 1 ? 0.35 : 1;
    document.title = 'Le Copilote du Manager' + (speed < 1 ? ' (rapide)' : '');
  }
});

renderLanding();
renderMissions();
renderInput();
