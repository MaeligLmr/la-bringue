// Carte affichée sur la page Actualités : une actualité.
export interface ActualiteCard {
  id: number
  nom: string
  description: string
  photo: string | null
  // Date de publication, déjà formatée ("12 octobre 2026"), vide si absente.
  date: string
}
