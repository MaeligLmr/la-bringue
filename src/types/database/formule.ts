export interface Formule {
  id_formule: number
  created_at: string
  titre: string | null
  description: string | null
  jour_debut: string | null
  jour_fin: string | null
  lien_shotgun: string | null
  nbr_places: number | null
  nb_jours: string | null
}
