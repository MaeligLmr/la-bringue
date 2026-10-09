import type { SelectOption } from './select'

export interface FilterConfig {
  key: string
  label: string
  allLabel: string
  options: SelectOption[]
}

export type FilterValues = Record<string, string>

export interface FilterableItem {
  id: string | number
  nom: string
}
