import type { IconName } from '../types/ui/icon.ts'

export interface Social {
  icon: IconName
  label: string
  url: string
}

// Source unique des réseaux sociaux de La Bringue : navbar, footer et page À propos.
export const SOCIALS: Social[] = [
  { icon: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/bringue_party/' },
  { icon: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@la.bringue' },
]
