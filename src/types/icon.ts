// The set of icons available through <Icon name="..." />, lazy-loaded
// from the raw SVGs in src/assets/icons/ (see Icon.vue's FILENAME_BY_ICON
// for the name -> file mapping, needed since filenames don't all match
// these names one-to-one).
export const ICON_NAMES = [
  'user',
  'heart',
  'heart-filled',
  'share',
  'menu',
  'check',
  'ticket',
  'instagram',
  'facebook',
  'whatsapp',
  'tiktok',
  'arrow-right',
  'arrow-left',
  'eye',
  'eye-off',
  'settings',
  'map',
  'edit',
  'ban',
  'cart',
  'plus',
  'minus',
  'search',
  'filter',
  'filter-filled',
  // Not part of the Figma export (no chevron/close in the "Icons" page) —
  // added for UI affordances. "close" reuses the "plus" glyph rotated 45°
  // (a perfect X, since plus.svg is a symmetric cross) rather than a new
  // hand-drawn SVG — see Icon.vue.
  'chevron-down',
  'close',
] as const

export type IconName = (typeof ICON_NAMES)[number]

export const ICON_SIZES = ['small', 'medium', 'large'] as const
export type IconSize = (typeof ICON_SIZES)[number]
