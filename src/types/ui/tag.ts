export const TAG_VARIANTS = ['pink', 'pink-bright', 'violet', 'blue'] as const
export type TagVariant = (typeof TAG_VARIANTS)[number]
