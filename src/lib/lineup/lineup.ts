// Une artiste du line-up d'un concert, telle qu'éditée dans le back office.
export interface LineupEntry {
  id_artiste: number
  nom: string
  artiste_annonce: boolean
  featuring: boolean
}

export interface LineupChanges {
  added: LineupEntry[]
  updated: LineupEntry[]
  removed: LineupEntry[]
}

// Ce qu'il faut envoyer en base pour passer du line-up enregistré (`saved`)
// au line-up du formulaire (`current`).
export function diffLineup(saved: LineupEntry[], current: LineupEntry[]): LineupChanges {
  const savedById = new Map(saved.map((entry) => [entry.id_artiste, entry]))
  const currentIds = new Set(current.map((entry) => entry.id_artiste))

  return {
    added: current.filter((entry) => !savedById.has(entry.id_artiste)),
    updated: current.filter((entry) => {
      const before = savedById.get(entry.id_artiste)
      return before && (before.artiste_annonce !== entry.artiste_annonce || before.featuring !== entry.featuring)
    }),
    removed: saved.filter((entry) => !currentIds.has(entry.id_artiste)),
  }
}
