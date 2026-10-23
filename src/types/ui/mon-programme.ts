import type { LikeTarget } from './like'

// Un artiste ou une conférence likés, affichés sur la page Mon programme.
// `lieu` : la scène d'un concert, ou les conférencières d'une conférence.
export interface ProgrammeItem {
  key: string
  target: LikeTarget
  nom: string
  photo: string | null
  heure: string
  lieu: string
  categorie: string
}

// `jour` reprend les `value` de JOURS (voir programmation.ts), vide si la
// date n'est pas encore connue.
export interface ProgrammeJour {
  jour: string
  label: string
  items: ProgrammeItem[]
}
