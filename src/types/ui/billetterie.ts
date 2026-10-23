// Promotion en cours sur une formule, prête à afficher (ex. « Early bird »).
export interface FormulePromo {
  // Nom de la promotion tel que saisi en base (« Early bird »), « Promotion » à défaut.
  nom: string
  // Réduction en pourcentage (20 pour −20 %).
  reduction: number
  // Date limite formatée (« 15 juin »), absente si la promotion n'a pas de fin.
  jusquAu: string | null
  // Jours restants avant la date limite (0 = dernier jour), absent sans date limite.
  joursRestants: number | null
  // Date limite proche : mise en avant renforcée.
  urgente: boolean
}

// Une formule de la grille de billetterie, formatée pour l'affichage.
export interface FormuleCard {
  id: number
  titre: string
  description: string
  // « 1 jour », « 3 jours »… (champ nb_jours de la base).
  duree: string | null
  // « 28 août », « du 28 au 30 août ».
  dates: string | null
  // Prix à payer maintenant (promotion déduite) et prix barré s'il y a une promotion.
  prix: string | null
  prixInitial: string | null
  promo: FormulePromo | null
  complet: boolean
  // Renseigné seulement quand il reste peu de places.
  placesRestantes: number | null
  lienShotgun: string | null
}
