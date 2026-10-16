export interface Formule {
  id_formule: number
  created_at: string
  titre: string | null
  description: string | null
  jour_debut: string | null
  jour_fin: string | null
  lien_shotgun: string | null
  nbr_places_total: number | null
  nbr_places_restantes: number | null
  homepage: boolean
  nb_jours: string | null
}
