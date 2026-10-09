export interface Conferenciere {
  id_conferenciere: number
  created_at: string
  nom: string | null
  description: string | null
  // Colonne ajoutée par supabase/add_photo_conferenciere.sql.
  photo: string | null
}
