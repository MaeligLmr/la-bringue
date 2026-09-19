// Matches the Figma "Button" component spec. Success and Warn are
// documented there too but have no color tokens in Figma yet, so they're
// intentionally left out here. "danger" has no Figma tokens either — see
// the hand-authored --button-danger-* block in src/styles/tokens/theme.css.
export const BUTTON_COLORS = ['primary', 'secondary', 'info', 'danger'] as const
export type ButtonColor = (typeof BUTTON_COLORS)[number]

export const BUTTON_VARIANTS = ['full', 'outlined', 'ghost'] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

export const BUTTON_SIZES = ['medium', 'large'] as const
export type ButtonSize = (typeof BUTTON_SIZES)[number]
