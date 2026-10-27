/* Pondérations du moteur de correspondance « besoin client → produits ».
   Le calcul est déterministe et explicable : chaque point attribué est rattaché à une raison affichée à l'écran.
   Ce n'est pas un score scientifique : le résultat est un niveau qualitatif (forte / moyenne / partielle / cadre).
   Statut : À VALIDER — les poids sont une proposition de travail, à arbitrer par l'offre. */
window.LDC_MATCHING = {
  statut: 'A_VALIDER',
  /* Ordre de priorité du brief : identifiants ROME validés > moments de vie > métier / profil > niveau > format / contraintes */
  poids: {
    romeValide: 40,   // compétences ROME 4 du besoin couvertes par le mapping VALIDÉ du produit
    momentDeVie: 25,  // compétences du moment de vie couvertes (ou moment rattaché explicitement au produit)
    metier: 15,       // métier ROME du client présent dans le mapping validé du produit
    niveau: 10,       // niveau demandé = niveau du catalogue
    format: 6,        // format demandé = format du catalogue
    duree: 4          // durée du produit ≤ durée maximale demandée
  },
  /* importance d'une compétence dans le mapping validé d'un produit */
  importance: { coeur: 1, support: 0.5 },
  /* seuils sur le total (0–100) ; sans critère « de fond » (ROME, moment, métier), le résultat est « cadre » */
  seuils: { forte: 60, moyenne: 30, partielle: 1 },
  libelles: {
    forte: 'Correspondance forte',
    moyenne: 'Correspondance moyenne',
    partielle: 'Correspondance partielle',
    cadre: 'Correspond au cadre demandé (domaine, niveau, format, durée)'
  },
  /* nombre maximal de produits proposés par défaut */
  limite: 12
};
