// Éléments liés à un concert ou une conférence (tables de liaison), tels
// qu'édités dans le back office avec AdminLinks.

// `id` : identifiant de l'élément lié (artiste, intervenante).
export interface LinkEntry {
  id: number
  nom: string
}

// Artiste du line-up d'un concert (ConcertArtiste).
export interface LineupEntry extends LinkEntry {
  artiste_annonce: boolean
  featuring: boolean
}

// Intervenante d'une conférence (Participation). `id_participation` : déjà
// enregistrée en base.
export interface IntervenanteEntry extends LinkEntry {
  id_participation?: number
}

export interface LinkChanges<T> {
  added: T[]
  updated: T[]
  removed: T[]
}

// Ce qu'il faut envoyer en base pour passer des liens enregistrés (`saved`)
// à ceux du formulaire (`current`). `changed` repère un lien gardé mais
// modifié (cases du line-up) ; sans lui, rien n'est jamais « modifié ».
export function diffLinks<T extends LinkEntry>(
  saved: T[],
  current: T[],
  changed: (before: T, after: T) => boolean = () => false
): LinkChanges<T> {
  const savedById = new Map(saved.map((entry) => [entry.id, entry]))
  const currentIds = new Set(current.map((entry) => entry.id))

  return {
    added: current.filter((entry) => !savedById.has(entry.id)),
    updated: current.filter((entry) => {
      const before = savedById.get(entry.id)
      return !!before && changed(before, entry)
    }),
    removed: saved.filter((entry) => !currentIds.has(entry.id)),
  }
}
