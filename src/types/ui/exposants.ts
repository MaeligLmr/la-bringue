// Carte affichée sur la page Exposants : un exposant.
// `categorie` reprend une valeur de l'enum `categories_exposants` pour le filtre.
export interface ExposantCard {
  id: number
  nom: string
  photo: string | null
  categorie: string
}
