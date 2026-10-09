// Carte affichée sur la page Conférences : une conférence.
// `date` reprend les `value` de JOURS (voir programmation.ts) pour le filtre.
export interface ConferenceCard {
  id: number
  nom: string
  photo: string | null
  date: string
  heure: string
  conferencieres: string
  theme: string
}
