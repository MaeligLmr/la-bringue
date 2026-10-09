// Type de contenu d'une fiche. Les identifiants ne sont uniques que par table
// (artiste 1, conférence 1 et exposant 1 coexistent) : le type fait donc
// partie de l'URL /:type/fiche/:id.
export type FicheType = 'artiste' | 'conference' | 'exposant'
