/* La Bibliothèque des Compétences — catalogue.
   Données ILLUSTRATIVES : 6 domaines, 30 thématiques, 120 produits de formation.
   À remplacer par l'export du catalogue 2027 : tout le reste (rayons, travées, livres, passerelle
   France compétences) se reconstruit automatiquement depuis ce fichier.

   Structure d'une thématique :
     T(nom, [compétences visées], { fc : certification / bloc France compétences cible },
       [ [titre, format, durée, niveau, [indices des compétences travaillées]], … ])
   Le « match » France compétences se calcule : part des compétences du bloc couvertes par le produit. */

window.LDC = window.LDC || {};

(function () {
  const L = window.LDC;

  L.FORMATS = {
    IL: { nom: 'Instant Learning', col: '#F2B48C', desc: 'Format court et percutant pour faire le point sur un sujet précis.' },
    WS: { nom: 'Workshop', col: '#E6C48A', desc: 'Un atelier pratique : vous travaillez sur vos propres cas et repartez avec des outils.' },
    MC: { nom: 'Masterclass', col: '#E29AB6', desc: 'Un expert décrypte les points sensibles et partage ses retours d\'expérience.' },
    FO: { nom: 'Formation', col: '#D6175F', desc: 'Une formation complète : apports, cas pratiques et mises en situation.' },
    CE: { nom: 'Certificat', col: '#7FA3DD', desc: 'Un parcours certifiant : modules progressifs, évaluation finale, reconnaissance.' },
  };

  const T = (nom, comps, fc, livres) => ({ nom, comps, fc, livres });
  const FC = (rep, titre, niveau, bloc, c) => ({ rep, titre, niveau, bloc, c });

  L.DOMAINES = [
    {
      id: 'chiffre', nom: 'Comptabilité, Finance & Fiscalité', court: 'Du Chiffre', glyph: '€',
      couleur: '#D6175F', lueur: '#F06C9B', cuir: '#8B0F3E', public: 'Comptables, DAF, contrôleurs de gestion, fiscalistes, banque et assurance',
      accroche: 'Chiffres, normes et fiscalité : maîtriser ce qui compte.',
      themes: [
        T('Fiscalité des entreprises',
          ['Déterminer le résultat fiscal', 'Appliquer correctement la TVA', 'Sécuriser ses positions fiscales', 'Préparer et gérer un contrôle fiscal', 'Suivre l\'actualité fiscale'],
          FC('RNCP', 'Responsable comptable et fiscal', 6, 'Piloter la fonction fiscale de l\'entreprise',
            [['Calculer et déclarer l\'impôt sur les sociétés', [0]], ['Gérer la TVA et les taxes assimilées', [1]], ['Sécuriser les positions fiscales et gérer les contrôles', [2, 3]], ['Assurer une veille réglementaire', [4]]]),
          [['Actualité fiscale des entreprises', 'IL', '1h30', 'Tous niveaux', [4]],
           ['IS : du résultat comptable au résultat fiscal', 'FO', '2 jours', 'Confirmé', [0, 2]],
           ['TVA : maîtriser les opérations complexes', 'WS', '1 jour', 'Confirmé', [1, 2]],
           ['Contrôle fiscal : anticiper et se défendre', 'MC', '1 jour', 'Expert', [2, 3]]]),
        T('Comptabilité et clôture des comptes',
          ['Enregistrer les opérations courantes', 'Réaliser les écritures de clôture', 'Établir les comptes annuels', 'Contrôler et justifier les comptes', 'Appliquer les normes comptables'],
          FC('RNCP', 'Responsable comptable', 6, 'Produire l\'information comptable et financière',
            [['Tenir la comptabilité courante', [0]], ['Réaliser les travaux de clôture', [1, 3]], ['Établir les états financiers annuels', [2]], ['Appliquer le référentiel comptable', [4]]]),
          [['Comptabilité : les fondamentaux', 'FO', '3 jours', 'Fondamental', [0, 4]],
           ['Clôture des comptes : check-list et pièges', 'WS', '1 jour', 'Confirmé', [1, 3]],
           ['Établir les comptes annuels', 'FO', '2 jours', 'Confirmé', [1, 2, 4]],
           ['Certificat Comptabilité et reporting', 'CE', '12 jours', 'Parcours certifiant', [0, 1, 2, 3, 4]]]),
        T('Finance et contrôle de gestion',
          ['Analyser la performance financière', 'Construire un budget', 'Piloter la trésorerie', 'Bâtir un tableau de bord', 'Évaluer un investissement'],
          FC('RNCP', 'Contrôleur de gestion', 6, 'Piloter la performance de l\'entreprise',
            [['Analyser les résultats et la structure financière', [0]], ['Élaborer et suivre les budgets', [1]], ['Gérer la trésorerie et le financement', [2]], ['Concevoir des outils de pilotage', [3, 4]]]),
          [['Analyse financière en 90 minutes', 'IL', '1h30', 'Fondamental', [0]],
           ['Budget et prévisionnel : pas à pas', 'FO', '2 jours', 'Confirmé', [1, 3]],
           ['Trésorerie : sécuriser le cash', 'WS', '1 jour', 'Confirmé', [2]],
           ['Tableaux de bord et choix d\'investissement', 'MC', '1 jour', 'Expert', [3, 4]]]),
        T('Banque et assurance',
          ['Connaître le cadre réglementaire', 'Analyser un risque de crédit', 'Prévenir blanchiment et fraude', 'Respecter le devoir de conseil', 'Appliquer les règles prudentielles'],
          FC('RS', 'Conformité bancaire et assurance', null, 'Maîtriser les exigences réglementaires',
            [['Appliquer la réglementation bancaire et assurantielle', [0, 4]], ['Évaluer et suivre les risques de crédit', [1]], ['Mettre en œuvre la lutte anti-blanchiment', [2]], ['Conseiller dans le respect du devoir de conseil', [3]]]),
          [['LCB-FT : les obligations en pratique', 'IL', '1h30', 'Tous niveaux', [2]],
           ['Crédit aux entreprises : analyser le risque', 'FO', '2 jours', 'Confirmé', [1]],
           ['Assurance : devoir de conseil et distribution', 'WS', '1 jour', 'Confirmé', [3, 0]],
           ['Réglementation prudentielle : l\'essentiel', 'MC', '3h', 'Expert', [0, 4]]]),
        T('Fiscalité patrimoniale et internationale',
          ['Optimiser la fiscalité du dirigeant', 'Structurer une transmission', 'Maîtriser les prix de transfert', 'Appliquer les conventions fiscales', 'Conseiller en gestion de patrimoine'],
          FC('RNCP', 'Conseiller en gestion de patrimoine', 6, 'Conseiller sur la fiscalité patrimoniale et internationale',
            [['Analyser la situation fiscale d\'un dirigeant', [0, 4]], ['Préparer une transmission', [1]], ['Sécuriser les flux intragroupe', [2]], ['Appliquer les conventions internationales', [3]]]),
          [['Rémunération du dirigeant : les arbitrages', 'FO', '2 jours', 'Confirmé', [0, 4]],
           ['Transmission d\'entreprise : les bons réflexes', 'WS', '1 jour', 'Confirmé', [1]],
           ['Prix de transfert : documenter et défendre', 'MC', '1 jour', 'Expert', [2]],
           ['Fiscalité internationale et conventions', 'FO', '2 jours', 'Expert', [3]]]),
      ],
    },
    {
      id: 'droit', nom: 'Droit & Immobilier', court: 'Du Droit', glyph: '§',
      couleur: '#680D2D', lueur: '#B54368', cuir: '#5A0B27', public: 'Juristes, avocats, notaires, directions juridiques, professionnels de l\'immobilier',
      accroche: 'Sécuriser, rédiger, conseiller : le droit au service de vos décisions.',
      themes: [
        T('Droit des sociétés',
          ['Organiser la gouvernance et les assemblées', 'Rédiger un pacte d\'associés', 'Réaliser une cession de titres', 'Conduire une restructuration', 'Sécuriser les décisions collectives'],
          FC('RNCP', 'Juriste d\'entreprise', 7, 'Sécuriser la vie juridique de la société',
            [['Organiser les assemblées et décisions collectives', [0, 4]], ['Rédiger les actes statutaires et les pactes', [1]], ['Conduire les opérations de cession', [2]], ['Piloter une restructuration', [3]]]),
          [['Assemblées générales : le mode d\'emploi', 'IL', '1h30', 'Fondamental', [0, 4]],
           ['Pacte d\'associés : les clauses clés', 'WS', '1 jour', 'Confirmé', [1]],
           ['Cession de titres : de la LOI au closing', 'FO', '2 jours', 'Confirmé', [2]],
           ['Restructurations de groupes', 'MC', '1 jour', 'Expert', [3]]]),
        T('Contrats et droit des affaires',
          ['Rédiger un contrat sécurisé', 'Négocier les clauses sensibles', 'Gérer un litige commercial', 'Protéger la propriété intellectuelle', 'Maîtriser les conditions générales'],
          FC('RNCP', 'Juriste d\'entreprise', 7, 'Concevoir et sécuriser les contrats',
            [['Rédiger et relire les contrats', [0, 4]], ['Négocier les clauses à risque', [1]], ['Prévenir et gérer le contentieux', [2]], ['Protéger les actifs immatériels', [3]]]),
          [['Rédiger un contrat : les 10 réflexes', 'IL', '1h30', 'Fondamental', [0]],
           ['Clauses sensibles : négocier sans se fâcher', 'WS', '1 jour', 'Confirmé', [1, 4]],
           ['Contentieux commercial : stratégie et preuves', 'FO', '2 jours', 'Confirmé', [2]],
           ['Propriété intellectuelle de l\'entreprise', 'MC', '3h', 'Tous niveaux', [3]]]),
        T('Immobilier et construction',
          ['Négocier un bail commercial', 'Gérer une copropriété', 'Maîtriser le droit de la construction', 'Appliquer le droit de l\'urbanisme', 'Intégrer la fiscalité immobilière'],
          FC('RNCP', 'Responsable de patrimoine immobilier', 6, 'Gérer un patrimoine immobilier',
            [['Gérer les baux et la relation locataire', [0]], ['Administrer une copropriété', [1]], ['Encadrer une opération de construction', [2, 3]], ['Intégrer la fiscalité dans les décisions', [4]]]),
          [['Baux commerciaux : actualité et jurisprudence', 'IL', '1h30', 'Tous niveaux', [0]],
           ['Copropriété : gérer au quotidien', 'FO', '2 jours', 'Confirmé', [1]],
           ['Droit de la construction : responsabilités', 'FO', '2 jours', 'Confirmé', [2]],
           ['Urbanisme : sécuriser son projet', 'WS', '1 jour', 'Expert', [3, 4]]]),
        T('Conformité et données',
          ['Mettre en conformité RGPD', 'Déployer un dispositif anticorruption', 'Cartographier les risques', 'Anticiper le règlement européen sur l\'IA', 'Piloter le devoir de vigilance'],
          FC('RNCP', 'Délégué à la protection des données', 6, 'Déployer un programme de conformité',
            [['Mettre en œuvre la protection des données', [0]], ['Prévenir la corruption et les conflits d\'intérêts', [1]], ['Cartographier et hiérarchiser les risques', [2, 4]], ['Anticiper les nouvelles régulations numériques', [3]]]),
          [['RGPD : les fondamentaux', 'IL', '1h30', 'Fondamental', [0]],
           ['Sapin II : bâtir son dispositif anticorruption', 'FO', '2 jours', 'Confirmé', [1, 2]],
           ['AI Act : ce qu\'il faut anticiper', 'MC', '3h', 'Tous niveaux', [3]],
           ['Devoir de vigilance : cartographier et agir', 'WS', '1 jour', 'Expert', [2, 4]]]),
        T('Droit des personnes et patrimoine',
          ['Conseiller en droit de la famille', 'Organiser une succession', 'Choisir un régime matrimonial', 'Rédiger des actes patrimoniaux', 'Optimiser la transmission'],
          FC('RNCP', 'Collaborateur de notaire', 5, 'Conseiller les particuliers en droit patrimonial',
            [['Analyser la situation familiale et patrimoniale', [0, 2]], ['Organiser et régler une succession', [1]], ['Rédiger les actes', [3]], ['Optimiser la transmission', [4]]]),
          [['Régimes matrimoniaux : choisir et changer', 'IL', '1h30', 'Fondamental', [2]],
           ['Successions : du décès au partage', 'FO', '2 jours', 'Confirmé', [1, 3]],
           ['Libéralités et transmission anticipée', 'WS', '1 jour', 'Confirmé', [4, 3]],
           ['Certificat Droit patrimonial de la famille', 'CE', '10 jours', 'Parcours certifiant', [0, 1, 2, 3, 4]]]),
      ],
    },
    {
      id: 'rh', nom: 'RH, Paie & Social', court: 'Des Équipes', glyph: 'RH',
      couleur: '#E3875A', lueur: '#F2B48C', cuir: '#7E3326', public: 'DRH, gestionnaires de paie, responsables formation, élus du CSE',
      accroche: 'Paie, droit social, dialogue : faire grandir les équipes.',
      themes: [
        T('Paie',
          ['Établir un bulletin de paie', 'Traiter absences et congés', 'Fiabiliser la DSN', 'Calculer les cotisations', 'Intégrer l\'actualité sociale'],
          FC('RNCP', 'Gestionnaire de paie', 5, 'Réaliser la paie et les déclarations sociales',
            [['Établir les bulletins de paie', [0, 1]], ['Calculer cotisations et charges', [3]], ['Produire la DSN', [2]], ['Appliquer les évolutions légales', [4]]]),
          [['Paie : les fondamentaux', 'FO', '3 jours', 'Fondamental', [0, 3]],
           ['DSN : fiabiliser ses déclarations', 'WS', '1 jour', 'Confirmé', [2]],
           ['Absences, maladie, congés : cas pratiques', 'FO', '1 jour', 'Confirmé', [1]],
           ['Actualité de la paie', 'IL', '1h30', 'Tous niveaux', [4]]]),
        T('Droit social',
          ['Rédiger un contrat de travail', 'Conduire une rupture du contrat', 'Gérer le temps de travail', 'Prévenir le contentieux prud\'homal', 'Appliquer la convention collective'],
          FC('RNCP', 'Responsable des ressources humaines', 7, 'Sécuriser les relations individuelles de travail',
            [['Contractualiser la relation de travail', [0, 4]], ['Conduire les ruptures dans le respect du droit', [1]], ['Organiser le temps de travail', [2]], ['Prévenir et traiter les contentieux', [3]]]),
          [['Contrat de travail : clauses et pièges', 'IL', '1h30', 'Fondamental', [0, 4]],
           ['Licenciement : sécuriser la procédure', 'FO', '2 jours', 'Confirmé', [1, 3]],
           ['Temps de travail : forfaits, heures sup, astreintes', 'WS', '1 jour', 'Confirmé', [2]],
           ['Contentieux prud\'homal : anticiper', 'MC', '3h', 'Expert', [3]]]),
        T('CSE et dialogue social',
          ['Faire fonctionner le CSE', 'Conduire une négociation collective', 'Conduire les consultations', 'Animer le dialogue social', 'Prévenir les conflits collectifs'],
          FC('RS', 'Pratique du dialogue social', null, 'Faire vivre les instances représentatives',
            [['Organiser le fonctionnement du CSE', [0]], ['Conduire les consultations obligatoires', [2]], ['Négocier les accords collectifs', [1]], ['Animer un dialogue social constructif', [3, 4]]]),
          [['CSE : fonctionnement et attributions', 'IL', '1h30', 'Fondamental', [0]],
           ['Consultations du CSE : calendrier et pièges', 'WS', '1 jour', 'Confirmé', [2]],
           ['Négocier un accord collectif', 'FO', '2 jours', 'Confirmé', [1]],
           ['Dialogue social : désamorcer les tensions', 'MC', '1 jour', 'Expert', [3, 4]]]),
        T('Développement RH',
          ['Recruter et intégrer', 'Piloter la GPEC', 'Conduire les entretiens professionnels', 'Déployer un SIRH', 'Construire la marque employeur'],
          FC('RNCP', 'Responsable des ressources humaines', 7, 'Développer les talents et les compétences',
            [['Recruter et intégrer les talents', [0, 4]], ['Planifier les emplois et les compétences', [1]], ['Conduire entretiens et mobilité', [2]], ['Outiller la fonction RH', [3]]]),
          [['Recrutement : cadrer, sourcer, décider', 'FO', '2 jours', 'Confirmé', [0, 4]],
           ['GPEC : cartographier les compétences', 'WS', '1 jour', 'Confirmé', [1]],
           ['Entretien professionnel : réussir le bilan à 6 ans', 'IL', '1h30', 'Tous niveaux', [2]],
           ['Choisir et déployer un SIRH', 'MC', '1 jour', 'Expert', [3]]]),
        T('Formation professionnelle',
          ['Maîtriser le cadre de la formation', 'Bâtir le plan de développement des compétences', 'Concevoir une action pédagogique', 'Se préparer à Qualiopi', 'Financer et mesurer la formation'],
          FC('RNCP', 'Responsable de formation', 6, 'Piloter la politique de formation',
            [['Maîtriser le cadre légal et financier', [0, 4]], ['Bâtir le plan de développement des compétences', [1]], ['Concevoir l\'ingénierie pédagogique', [2]], ['Conduire la démarche qualité', [3]]]),
          [['Réforme de la formation : ce qui change', 'IL', '1h30', 'Tous niveaux', [0]],
           ['Plan de développement des compétences, de A à Z', 'FO', '2 jours', 'Confirmé', [1, 4]],
           ['Ingénierie pédagogique : concevoir un parcours', 'WS', '1 jour', 'Confirmé', [2]],
           ['Certificat Responsable de formation', 'CE', '12 jours', 'Parcours certifiant', [0, 1, 2, 3, 4]]]),
      ],
    },
    {
      id: 'qse', nom: 'Qualité, Santé, Sécurité, Environnement', court: 'De la Prévention', glyph: 'QSE',
      couleur: '#2F5DA8', lueur: '#7FA3DD', cuir: '#1F427A', public: 'Responsables QSE, préventeurs, HSE, dirigeants, référents sécurité',
      accroche: 'Prévenir, certifier, durer : la performance responsable.',
      themes: [
        T('Santé et sécurité au travail',
          ['Évaluer les risques professionnels', 'Rédiger le document unique', 'Animer une démarche de prévention', 'Gérer un accident du travail', 'Habiliter son personnel'],
          FC('RNCP', 'Responsable QHSE', 6, 'Prévenir les risques professionnels',
            [['Évaluer les risques et rédiger le DUERP', [0, 1]], ['Construire le plan de prévention', [2]], ['Traiter accidents et incidents', [3]], ['Habiliter et former les équipes', [4]]]),
          [['Document unique : méthode et mise à jour', 'FO', '1 jour', 'Fondamental', [0, 1]],
           ['Habilitation électrique : l\'essentiel', 'IL', '1h30', 'Tous niveaux', [4]],
           ['Accident du travail : réagir et analyser', 'WS', '1 jour', 'Confirmé', [3]],
           ['Bâtir un plan de prévention', 'MC', '3h', 'Confirmé', [2]]]),
        T('Environnement et RSE',
          ['Piloter le reporting de durabilité', 'Réaliser un bilan carbone', 'Maîtriser la réglementation ICPE', 'Gérer les déchets', 'Construire une stratégie RSE'],
          FC('RNCP', 'Responsable RSE', 7, 'Conduire la transition environnementale',
            [['Produire le reporting extra-financier', [0]], ['Mesurer l\'empreinte carbone', [1]], ['Respecter la réglementation environnementale', [2, 3]], ['Définir la stratégie RSE', [4]]]),
          [['CSRD : premiers pas du reporting de durabilité', 'IL', '1h30', 'Tous niveaux', [0]],
           ['Bilan carbone : méthode et plan d\'action', 'FO', '2 jours', 'Confirmé', [1, 4]],
           ['ICPE : obligations et contrôles', 'WS', '1 jour', 'Confirmé', [2]],
           ['Déchets : filières et traçabilité', 'FO', '1 jour', 'Fondamental', [3]]]),
        T('Qualité et management',
          ['Déployer un système ISO 9001', 'Conduire un audit interne', 'Animer l\'amélioration continue', 'Traiter les non-conformités', 'Intégrer un système QSE'],
          FC('RNCP', 'Responsable qualité', 6, 'Piloter le système de management',
            [['Construire et maintenir le système qualité', [0, 4]], ['Auditer les processus', [1]], ['Traiter les non-conformités', [3]], ['Conduire l\'amélioration continue', [2]]]),
          [['ISO 9001 : mode d\'emploi de la norme', 'FO', '2 jours', 'Fondamental', [0]],
           ['Audit interne : mener un audit utile', 'WS', '1 jour', 'Confirmé', [1, 3]],
           ['Lean et amélioration continue', 'FO', '2 jours', 'Confirmé', [2]],
           ['Système de management intégré QSE', 'MC', '1 jour', 'Expert', [4, 0]]]),
        T('Risques et continuité',
          ['Cartographier les risques', 'Construire un plan de continuité', 'Préparer un plan d\'urgence', 'Gérer une crise', 'Assurer la sûreté des sites'],
          FC('RS', 'Gestion de crise et continuité d\'activité', null, 'Anticiper et gérer les situations critiques',
            [['Analyser les risques majeurs', [0]], ['Bâtir la continuité d\'activité', [1]], ['Organiser la réponse d\'urgence', [2, 4]], ['Piloter une cellule de crise', [3]]]),
          [['Cartographie des risques en 90 minutes', 'IL', '1h30', 'Fondamental', [0]],
           ['PCA : continuer quoi qu\'il arrive', 'WS', '1 jour', 'Confirmé', [1]],
           ['Exercice de crise : simulation grandeur nature', 'MC', '1 jour', 'Confirmé', [3, 2]],
           ['Plan d\'urgence et sûreté des sites', 'FO', '2 jours', 'Confirmé', [2, 4]]]),
        T('Santé et qualité de vie au travail',
          ['Prévenir les risques psychosociaux', 'Améliorer l\'ergonomie des postes', 'Déployer une démarche QVCT', 'Prévenir les TMS', 'Favoriser le maintien dans l\'emploi'],
          FC('RNCP', 'Préventeur en santé au travail', 6, 'Promouvoir la santé et le bien-être au travail',
            [['Repérer et prévenir les risques psychosociaux', [0]], ['Adapter les postes et prévenir les TMS', [1, 3]], ['Mettre en place une démarche QVCT', [2]], ['Faciliter le maintien dans l\'emploi', [4]]]),
          [['RPS : repérer les signaux faibles', 'IL', '1h30', 'Tous niveaux', [0]],
           ['Ergonomie et TMS : agir sur les postes', 'FO', '2 jours', 'Confirmé', [1, 3]],
           ['QVCT : lancer une démarche concertée', 'WS', '1 jour', 'Confirmé', [2]],
           ['Maintien dans l\'emploi : les bons réflexes', 'MC', '3h', 'Confirmé', [4]]]),
      ],
    },
    {
      id: 'public', nom: 'Secteur public', court: 'Du Service Public', glyph: '★',
      couleur: '#A8416B', lueur: '#E29AB6', cuir: '#7D2B52', public: 'Agents des collectivités, acheteurs publics, DGS, établissements publics',
      accroche: 'Commande publique, finances locales, aménagement : servir l\'intérêt général.',
      themes: [
        T('Marchés publics',
          ['Définir le besoin et choisir la procédure', 'Rédiger un dossier de consultation', 'Analyser les offres', 'Exécuter et suivre un marché', 'Intégrer l\'achat responsable'],
          FC('RNCP', 'Responsable de la commande publique', 6, 'Conduire la passation et l\'exécution des marchés',
            [['Planifier et choisir la procédure', [0]], ['Rédiger les pièces du marché', [1]], ['Analyser les offres et attribuer', [2]], ['Suivre l\'exécution et l\'achat durable', [3, 4]]]),
          [['Commande publique : cadre et seuils', 'IL', '1h30', 'Fondamental', [0]],
           ['Rédiger son DCE sans erreur', 'FO', '2 jours', 'Confirmé', [1]],
           ['Analyse des offres : méthode et motivation', 'WS', '1 jour', 'Confirmé', [2]],
           ['Achats responsables et exécution des marchés', 'FO', '2 jours', 'Confirmé', [3, 4]]]),
        T('Finances locales',
          ['Construire le budget d\'une collectivité', 'Maîtriser l\'instruction M57', 'Piloter dette et trésorerie', 'Analyser les dotations', 'Suivre les engagements comptables'],
          FC('RNCP', 'Gestionnaire des finances publiques locales', 6, 'Piloter les finances locales',
            [['Préparer et voter le budget', [0, 3]], ['Appliquer le référentiel M57', [1, 4]], ['Gérer la dette et la trésorerie', [2]], ['Analyser la situation financière', [3]]]),
          [['M57 : passer au nouveau référentiel', 'FO', '2 jours', 'Confirmé', [1, 4]],
           ['Budget local : préparer et voter', 'WS', '1 jour', 'Confirmé', [0, 3]],
           ['Dotations et fiscalité locale : actualité', 'IL', '1h30', 'Tous niveaux', [3]],
           ['Dette et trésorerie des collectivités', 'MC', '3h', 'Expert', [2]]]),
        T('Fonction publique et carrières',
          ['Appliquer le statut des agents', 'Gérer la rémunération', 'Piloter les carrières', 'Conduire l\'entretien professionnel', 'Maîtriser le temps de travail'],
          FC('RNCP', 'Gestionnaire RH de la fonction publique', 6, 'Administrer les ressources humaines publiques',
            [['Appliquer le statut', [0, 4]], ['Gérer paie et rémunération des agents', [1]], ['Accompagner les carrières', [2, 3]], ['Sécuriser les procédures RH', [0]]]),
          [['Statut de la fonction publique : repères', 'IL', '1h30', 'Fondamental', [0]],
           ['Rémunération des agents : cas pratiques', 'FO', '2 jours', 'Confirmé', [1]],
           ['Carrières : avancements et promotions', 'WS', '1 jour', 'Confirmé', [2]],
           ['L\'entretien professionnel dans le public', 'FO', '1 jour', 'Confirmé', [3, 4]]]),
        T('Urbanisme et aménagement',
          ['Instruire une autorisation d\'urbanisme', 'Lire et appliquer le PLU', 'Maîtriser le foncier', 'Prévenir le contentieux', 'Concerter avec le public'],
          FC('RNCP', 'Chargé de projet en urbanisme', 6, 'Instruire et sécuriser les projets d\'aménagement',
            [['Instruire les demandes d\'autorisation', [0]], ['Appliquer les règles du PLU', [1]], ['Maîtriser les opérations foncières', [2]], ['Sécuriser juridiquement les décisions', [3, 4]]]),
          [['Permis de construire : instruire en sécurité', 'FO', '2 jours', 'Confirmé', [0, 3]],
           ['PLU : lire et appliquer le règlement', 'WS', '1 jour', 'Confirmé', [1]],
           ['Foncier : acquisitions et préemption', 'FO', '2 jours', 'Expert', [2]],
           ['Concertation publique : réussir sa réunion', 'IL', '1h30', 'Tous niveaux', [4]]]),
        T('Action publique et numérique',
          ['Conduire la transformation numérique', 'Ouvrir et partager les données', 'Garantir l\'accessibilité', 'Protéger les données des usagers', 'Utiliser l\'IA dans le service public'],
          FC('RS', 'Numérique et service public', null, 'Conduire la transformation numérique d\'une administration',
            [['Piloter les projets numériques', [0]], ['Ouvrir les données publiques', [1]], ['Garantir l\'accessibilité et l\'inclusion', [2]], ['Sécuriser données et usages de l\'IA', [3, 4]]]),
          [['Open data : ouvrir ses données', 'IL', '1h30', 'Tous niveaux', [1]],
           ['Accessibilité numérique : le RGAA en pratique', 'WS', '1 jour', 'Confirmé', [2]],
           ['IA et service public : cadre et cas d\'usage', 'MC', '3h', 'Tous niveaux', [4, 3]],
           ['Conduire la transformation numérique d\'un service', 'FO', '2 jours', 'Confirmé', [0, 3]]]),
      ],
    },
    {
      id: 'mgmt', nom: 'Management, Soft skills & Numérique', court: 'De l\'Humain', glyph: '✦',
      couleur: '#B58A4A', lueur: '#E6C48A', cuir: '#8A6224', public: 'Managers, chefs de projet, assistants, toutes fonctions',
      accroche: 'Manager, convaincre, s\'organiser, adopter l\'IA : les compétences qui servent partout.',
      themes: [
        T('Management d\'équipe',
          ['Prendre son poste de manager', 'Déléguer efficacement', 'Conduire un entretien difficile', 'Manager à distance', 'Motiver et fidéliser'],
          FC('RNCP', 'Responsable d\'unité opérationnelle', 6, 'Encadrer et animer une équipe',
            [['Organiser et déléguer', [0, 1]], ['Animer l\'équipe au quotidien', [4]], ['Conduire les entretiens', [2]], ['Piloter une équipe à distance', [3]]]),
          [['Premier poste de manager : les 100 jours', 'FO', '2 jours', 'Fondamental', [0]],
           ['Déléguer sans perdre le contrôle', 'WS', '1 jour', 'Confirmé', [1]],
           ['Entretiens difficiles : dire sans blesser', 'WS', '1 jour', 'Confirmé', [2]],
           ['Manager à distance et en hybride', 'IL', '1h30', 'Tous niveaux', [3, 4]]]),
        T('Communication et prise de parole',
          ['Prendre la parole avec impact', 'Structurer sa pensée à l\'écrit', 'Négocier avec méthode', 'Construire une présentation', 'Gérer les situations tendues'],
          FC('RS', 'Communication professionnelle', null, 'Communiquer avec efficacité en contexte professionnel',
            [['S\'exprimer à l\'oral avec aisance', [0]], ['Rédiger des écrits professionnels clairs', [1]], ['Négocier et convaincre', [2, 4]], ['Concevoir des supports de présentation', [3]]]),
          [['Prise de parole : trouver sa voix', 'FO', '2 jours', 'Fondamental', [0, 3]],
           ['Écrits professionnels : clair, court, convaincant', 'WS', '1 jour', 'Confirmé', [1]],
           ['Négociation : la méthode en 5 temps', 'FO', '2 jours', 'Confirmé', [2, 4]],
           ['Pitch en 3 minutes', 'IL', '1h30', 'Tous niveaux', [0, 3]]]),
        T('Efficacité personnelle',
          ['Organiser son temps', 'Gérer son stress', 'Prioriser ses objectifs', 'Mémoriser et apprendre', 'Poser ses limites'],
          FC('RS', 'Efficacité professionnelle', null, 'Organiser son activité et préserver son énergie',
            [['Planifier et prioriser', [0, 2]], ['Gérer sa charge et son stress', [1, 4]], ['Apprendre en continu', [3]], ['Tenir ses objectifs', [2]]]),
          [['Gestion du temps : reprendre la main', 'IL', '1h30', 'Fondamental', [0, 2]],
           ['Gérer son stress au quotidien', 'WS', '1 jour', 'Tous niveaux', [1, 4]],
           ['Mémoriser plus, apprendre mieux', 'FO', '1 jour', 'Tous niveaux', [3]],
           ['Savoir dire non : poser ses limites', 'MC', '3h', 'Confirmé', [4]]]),
        T('IA et numérique au quotidien',
          ['Maîtriser l\'IA générative', 'Rédiger des prompts efficaces', 'Déléguer une mission à un agent IA', 'Encadrer les risques de l\'IA', 'Automatiser avec Excel et le no-code'],
          FC('RS', 'Usage professionnel de l\'IA générative', null, 'Intégrer l\'IA dans ses pratiques professionnelles',
            [['Comprendre les capacités et les limites de l\'IA', [0]], ['Formuler des consignes efficaces', [1]], ['Déléguer et superviser un agent IA', [2]], ['Maîtriser les risques et la conformité', [3]], ['Automatiser les tâches répétitives', [4]]]),
          [['IA générative : comprendre pour mieux utiliser', 'IL', '1h30', 'Tous niveaux', [0]],
           ['Prompting : l\'art de bien demander', 'WS', '1 jour', 'Confirmé', [1, 0]],
           ['Agents IA : déléguer une mission à son équipe', 'MC', '1 jour', 'Confirmé', [2, 3]],
           ['Excel avancé et automatisation', 'FO', '2 jours', 'Confirmé', [4]]]),
        T('Leadership et transformation',
          ['Conduire le changement', 'Développer l\'intelligence collective', 'Affirmer sa posture de leader', 'Animer des réunions utiles', 'Donner du sens'],
          FC('RS', 'Leadership et conduite du changement', null, 'Accompagner la transformation d\'une organisation',
            [['Piloter un projet de changement', [0]], ['Mobiliser l\'intelligence collective', [1, 3]], ['Incarner son leadership', [2]], ['Porter une vision', [4]]]),
          [['Conduite du changement : les 5 leviers', 'FO', '2 jours', 'Confirmé', [0, 4]],
           ['Intelligence collective : animer des ateliers', 'WS', '1 jour', 'Confirmé', [1, 3]],
           ['Posture de leader : se révéler', 'MC', '1 jour', 'Expert', [2]],
           ['Réunions : stop au temps perdu', 'IL', '1h30', 'Tous niveaux', [3]]]),
      ],
    },
  ];

  /* Métiers : pré-sélectionnent des rayons et orientent la recommandation.
     Liste de départ calquée sur les grands segments du catalogue public (directions financières et fiscales,
     directions juridiques, banque et assurance, immobilier, RH et social, QSE, secteur public, management).
     À valider ou remplacer par vos cibles réelles. */
  L.PERSONAS = [
    { id: 'daf', nom: 'Direction financière · DAF', domaines: ['chiffre', 'droit'], q: 'fiscalité trésorerie budget clôture comptes' },
    { id: 'compta', nom: 'Comptable · Expert-comptable', domaines: ['chiffre'], q: 'comptabilité clôture comptes tva consolidation' },
    { id: 'juriste', nom: 'Juriste · Direction juridique', domaines: ['droit'], q: 'contrat sociétés conformité contentieux rgpd' },
    { id: 'avocat', nom: 'Avocat · Notaire', domaines: ['droit', 'chiffre'], q: 'successions patrimoine sociétés cession' },
    { id: 'rh', nom: 'RH · Paie · Social', domaines: ['rh', 'droit'], q: 'paie cse licenciement recrutement formation' },
    { id: 'qse', nom: 'QSE · HSE', domaines: ['qse'], q: 'document unique iso risques carbone csrd' },
    { id: 'banque', nom: 'Banque · Assurance', domaines: ['chiffre', 'droit'], q: 'banque assurance crédit lcb prudentielle' },
    { id: 'immo', nom: 'Immobilier · Construction', domaines: ['droit', 'chiffre'], q: 'bail copropriété construction urbanisme' },
    { id: 'public', nom: 'Secteur public', domaines: ['public', 'droit'], q: 'marchés publics budget collectivités urbanisme' },
    { id: 'manager', nom: 'Manager · Toutes fonctions', domaines: ['mgmt', 'rh'], q: 'manager déléguer équipe ia prise de parole' },
  ];

  /* Synonymes : un mot cherché peut en appeler d'autres. */
  const SYN = {
    ia: ['intelligence', 'agent', 'agents', 'prompt', 'prompting', 'ia', 'generative'],
    ai: ['ia', 'agent', 'intelligence'],
    paie: ['paie', 'bulletin', 'dsn', 'cotisations'],
    cse: ['cse', 'dialogue', 'social', 'elus'],
    tva: ['tva', 'fiscal', 'fiscalite'],
    impot: ['is', 'fiscal', 'fiscalite'],
    compta: ['comptabilite', 'comptable', 'cloture'],
    bail: ['bail', 'baux', 'immobilier'],
    rgpd: ['rgpd', 'donnees', 'conformite'],
    carbone: ['carbone', 'rse', 'csrd', 'environnement'],
    securite: ['securite', 'prevention', 'risques', 'document'],
    chef: ['manager', 'management', 'equipe'],
    manager: ['manager', 'management', 'equipe', 'deleguer'],
    marche: ['marches', 'commande', 'dce'],
    marches: ['marches', 'commande', 'dce'],
    stress: ['stress', 'rps', 'qvct', 'temps'],
    parole: ['parole', 'pitch', 'communication'],
  };

  const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
  L.fold = fold;

  const dureeHeures = (d) => {
    const j = /(\d+)\s*jour/.exec(d); if (j) return (+j[1]) * 7;
    const h = /(\d+)h(\d+)?/.exec(d); if (h) return (+h[1]) + (h[2] ? +h[2] / 60 : 0);
    return 0;
  };
  L.dureeHeures = dureeHeures;
  L.formatHeures = (h) => (h >= 7 ? (Math.round(h / 7 * 2) / 2).toString().replace('.', ',') + ' j' : (Math.round(h * 2) / 2).toString().replace('.', ',') + ' h');

  /* Normalisation : identifiants, rattachement au domaine / thème, match France compétences. */
  L.livres = [];
  L.byId = {};
  L.domById = {};
  L.DOMAINES.forEach((d, di) => {
    d.index = di;
    L.domById[d.id] = d;
    d.nbLivres = 0;
    d.themes.forEach((t, ti) => {
      t.index = ti; t.dom = d;
      t.livres = t.livres.map((r, li) => {
        const [titre, fmt, duree, niveau, idx] = r;
        const fc = t.fc;
        const couverts = fc.c.map(([, via]) => via.some((v) => idx.includes(v)));
        const livre = {
          id: `${d.id}-${ti}-${li}`, titre, fmt, duree, niveau, dom: d, theme: t, slot: li,
          comps: idx.map((i) => t.comps[i]), compIdx: idx,
          objectifs: idx.map((i) => 'Savoir ' + t.comps[i].replace(/^./, (c) => c.toLowerCase())),
          fc: { couverts, nb: couverts.filter(Boolean).length, total: fc.c.length, score: Math.round(100 * couverts.filter(Boolean).length / fc.c.length) },
          heures: dureeHeures(duree),
          texte: fold([titre, t.nom, d.nom, d.court, t.comps.join(' '), fc.titre].join(' ')),
        };
        L.livres.push(livre); L.byId[livre.id] = livre; d.nbLivres++;
        return livre;
      });
    });
  });

  /* Recherche : score par produit, puis par domaine. */
  L.tokens = (q) => {
    const out = new Set();
    fold(q).split(/[^a-z0-9]+/).filter((w) => w.length > 1).forEach((w) => {
      out.add(w); (SYN[w] || []).forEach((s) => out.add(s));
    });
    return [...out];
  };
  L.search = (q) => {
    const toks = L.tokens(q);
    if (!toks.length) return [];
    return L.livres.map((l) => {
      let s = 0;
      const titre = fold(l.titre), theme = fold(l.theme.nom);
      toks.forEach((w) => {
        if (titre.includes(w)) s += 5;
        if (theme.includes(w)) s += 3;
        if (l.texte.includes(w)) s += 1;
      });
      return { livre: l, score: s };
    }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  };

  /* Étiquette lisible du référentiel France compétences. */
  L.fcLabel = (fc) => (fc.rep === 'RNCP' ? 'RNCP' : 'Répertoire spécifique') + (fc.niveau ? ' · niveau ' + fc.niveau : '');
})();
