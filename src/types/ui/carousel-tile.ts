import type { IconName } from './icon'

// Purely aesthetic variants (see Figma "Carrousel Tile" — 2 options d'affichage).
export const CAROUSEL_TILE_VARIANTS = ['pink', 'blue'] as const
export type CarouselTileVariant = (typeof CAROUSEL_TILE_VARIANTS)[number]

// Forme consommée par <Carousel :tiles="..."> — reflète les props de
// CarouselTile.vue, pour typer les listes de tiles fournies par les pages
// consommatrices (voir Figma "Carrousel" : props modifiables par section).
export interface CarouselTileData {
  title: string
  content: string
  variant?: CarouselTileVariant
  icon?: IconName
  ctaLabel?: string
  to?: string
}
