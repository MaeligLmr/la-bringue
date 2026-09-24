import type { Artiste } from '../types/programmation'

export interface DayLineup {
  headliner?: Artiste
  others: Artiste[]
}

// Affiche d'un jour pour la home (même principe que rockenseine.com) : la
// tête d'affiche est le dernier concert de la scène Chrome, suivie des
// `count` autres concerts les plus tardifs du jour. Les heures sont toutes
// au format "HHhMM", la comparaison de chaînes suffit.
export function getDayLineup(artistes: Artiste[], date: string, count = 4): DayLineup {
  const latestFirst = artistes
    .filter((artiste) => artiste.date === date)
    .sort((a, b) => b.heure.localeCompare(a.heure))

  const headliner = latestFirst.find((artiste) => artiste.scene === 'chrome')
  const others = latestFirst.filter((artiste) => artiste !== headliner).slice(0, count)

  return { headliner, others }
}
