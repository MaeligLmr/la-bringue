// Purely aesthetic variants (see Figma "Carrousel Tile" — 2 options d'affichage).
export const CAROUSEL_TILE_VARIANTS = ['pink', 'blue'] as const
export type CarouselTileVariant = (typeof CAROUSEL_TILE_VARIANTS)[number]
