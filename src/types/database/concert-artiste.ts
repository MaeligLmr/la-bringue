export interface ConcertArtiste {
  id_artiste: number
  id_concert: number
  created_at: string
  artiste_annonce: boolean | null
  featuring: boolean | null
}
