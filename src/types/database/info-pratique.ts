export interface InfoPratiquePoint {
  label: string
  detail: string
}

export interface InfoPratique {
  id_info: number
  created_at: string
  titre: string | null
  intro: string | null
  points: InfoPratiquePoint[]
}
