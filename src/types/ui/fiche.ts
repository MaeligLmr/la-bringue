import type { RouteLocationRaw } from 'vue-router'
import type { LikeTarget } from './like'

// Type de contenu d'une fiche. Les identifiants ne sont uniques que par table
// (artiste 1, conférence 1 et exposant 1 coexistent) : le type fait donc
// partie de l'URL /:type/fiche/:id.
export type FicheType = 'artiste' | 'conference' | 'exposant'

// Tag de la fiche. Avec `to`, il est cliquable et mène à la page liste
// filtrée sur sa valeur (jour, scène, thème, catégorie).
export interface FicheTag {
  label: string
  to?: RouteLocationRaw
}

// Bloc commun aux trois types de fiche (FichePresentation). Les champs absents
// sont masqués : un exposant n'a ni date, ni heure, ni scène, ni like.
export interface Fiche {
  nom: string
  photo: string | null
  description: string | null
  // Format ISO "YYYY-MM-DD".
  jour?: string
  // Format "18h00", ou "18h00 – 19h30" quand l'heure de fin est connue.
  heure?: string
  // `value` de SCENES : choisit les stickers autour de la photo.
  scene?: string
  // Badge de catégorie (catégorie d'artiste ou d'exposant, thème de conférence),
  // cliquable quand la page liste sait filtrer dessus.
  categorie?: FicheTag
  tags: FicheTag[]
  likeTarget?: LikeTarget
}

// Conférencière présentée sous le bloc commun d'une fiche conférence.
export interface FicheIntervenante {
  id: number
  nom: string
  photo: string | null
  description: string | null
}

// Carte « Ça peut aussi vous intéresser » : les props de ContentCard, plus la
// fiche vers laquelle elle mène.
export interface FicheSuggestion {
  id: number
  nom: string
  photo: string | null
  scene?: string
  date?: string
  categorie?: string
  target?: LikeTarget
  to: RouteLocationRaw
}

export interface FicheData {
  fiche: Fiche
  intervenantes: FicheIntervenante[]
  suggestions: FicheSuggestion[]
}
