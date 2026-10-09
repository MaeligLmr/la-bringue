export interface Promotion {
  id_promotion: number
  created_at: string
  id_formule: number | null
  description: string | null
  reduction_prc: number | null
  date_debut: string | null
  date_fin: string | null
}
