import type { LikeTarget } from './like'

// Un artiste ou une conférence likés, affichés sur la page Mon programme.
// `lieu` : la scène d'un concert, ou les conférencières d'une conférence.
// `scene` : `value` de SCENES pour un concert, vide pour une conférence.
// `conflits` : noms des autres éléments likés dont l'horaire chevauche celui-ci.
export interface ProgrammeItem {
  key: string
  target: LikeTarget
  nom: string
  photo: string | null
  heure: string
  heureFin: string
  lieu: string
  scene: string
  categorie: string
  conflits: string[]
}

// `jour` reprend les `value` de JOURS (voir programmation.ts), vide si la
// date n'est pas encore connue.
export interface ProgrammeJour {
  jour: string
  label: string
  items: ProgrammeItem[]
}

// Position d'un élément dans sa colonne de la frise, en minutes depuis le
// début de la frise. Deux éléments d'une même colonne qui se chevauchent
// (deux conférences par exemple) sont répartis côte à côte : `piste` (à
// partir de 0) parmi `pistes`.
// `finInconnue` : sans heure de fin en base, le bloc prend une durée par défaut.
export interface FriseBloc {
  item: ProgrammeItem
  debut: number
  duree: number
  piste: number
  pistes: number
  finInconnue: boolean
}

// Une colonne par scène (ou pour les conférences), dans l'ordre de SCENES.
export interface FriseColonne {
  id: string
  label: string
  blocs: FriseBloc[]
}

// `heures` : minutes (depuis le début de la frise) de chaque graduation, avec
// leur libellé ("16h"). `sansHoraire` : éléments impossibles à placer.
export interface Frise {
  duree: number
  heures: { position: number; label: string }[]
  colonnes: FriseColonne[]
  sansHoraire: ProgrammeItem[]
}
