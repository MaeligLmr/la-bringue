// The set of icons available through <Icon name="..." />, matching the
// Figma "Icons" component page. Generic UI icons are rendered via
// @lucide/vue; the four social/brand icons have no equivalent in that
// library (Lucide dropped brand logos) and are hand-authored SVGs under
// ./brand-icons/.
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
] as const

export type IconName = (typeof ICON_NAMES)[number]

export const ICON_SIZES = ['small', 'medium', 'large'] as const
export type IconSize = (typeof ICON_SIZES)[number]
