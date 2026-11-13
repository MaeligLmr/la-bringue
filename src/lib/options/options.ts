import type { SelectOption } from '../../types/ui/select'

export function toOptions(values: (string | null | undefined)[], { sorted = false } = {}): SelectOption[] {
  const uniques = [...new Set(values.filter((value): value is string => !!value))]
  if (sorted) uniques.sort((a, b) => a.localeCompare(b))
  return uniques.map((value) => ({ value, label: value }))
}
