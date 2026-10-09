export interface Conference {
  id_conference: number
  created_at: string
  titre: string | null
  photo: string | null
  theme: string | null
  description: string | null
  jour: string | null
  heure_debut: string | null
  heure_fin: string | null
}
