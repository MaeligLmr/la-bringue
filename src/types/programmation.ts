import type { SelectOption } from './select'

export const JOURS: SelectOption[] = [
  { value: '2026-08-28', label: 'Vendredi 28 août' },
  { value: '2026-08-29', label: 'Samedi 29 août' },
  { value: '2026-08-30', label: 'Dimanche 30 août' },
]

export const SCENES: SelectOption[] = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'soft', label: 'Soft' },
  { value: '2000', label: '2000’' },
  { value: 'summer', label: 'Summer' },
]

export interface Artiste {
  id: string
  nom: string
  photo: string
  date: string
  heure: string
  scene: string
  categorie: string
}
