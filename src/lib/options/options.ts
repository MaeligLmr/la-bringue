import type { SelectOption } from '../../types/ui/select'

export function toOptions(values: (string | null | undefined)[], { sorted = false } = {}): SelectOption[] {
  const uniques = [...new Set(values.filter((value): value is string => !!value))]
  if (sorted) uniques.sort((a, b) => a.localeCompare(b))
  return uniques.map((value) => ({ value, label: value }))
}

// Tri alphabétique par nom (artistes, intervenantes proposées dans un menu),
// sans modifier la liste reçue.
export function byNom<T extends { nom: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''))
}
