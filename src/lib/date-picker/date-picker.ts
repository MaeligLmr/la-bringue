import type { DatePickerMode } from '../../types/ui/date-picker'

// Lundi en premier.
export const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const pad = (n: number) => String(n).padStart(2, '0')

export function toIso(year: number, monthIndex: number, day: number) {
  // Passe par UTC : pas de décalage de fuseau, et un mois ou jour hors bornes se normalise.
  const date = new Date(Date.UTC(year, monthIndex, day))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function todayIso() {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth(), now.getDate())
}

// Sépare une valeur en date « YYYY-MM-DD » et heure « HH:mm » (secondes ignorées :
// la base renvoie « 21:00:00 »). Une valeur invalide donne des champs vides.
export function splitValue(value: string, mode: DatePickerMode) {
  const clean = (value ?? '').trim()
  if (mode === 'time') return { date: '', time: /^\d{2}:\d{2}/.test(clean) ? clean.slice(0, 5) : '' }

  const [date = '', time = ''] = clean.split(/[T ]/)
  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    time: mode === 'datetime' && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : '',
  }
}

// Recompose la valeur émise ; une partie manquante prend un défaut (aujourd'hui, 00:00).
export function joinValue(date: string, time: string, mode: DatePickerMode) {
  if (mode === 'time') return time || '00:00'
  if (mode === 'date') return date || todayIso()
  return `${date || todayIso()}T${time || '00:00'}`
}

export function formatDisplay(value: string, mode: DatePickerMode) {
  const { date, time } = splitValue(value, mode)
  if (mode === 'time') return time

  if (!date) return ''
  const [year, month, day] = date.split('-').map(Number)
  const text = new Intl.DateTimeFormat('fr-FR', {
    weekday: mode === 'date' ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return mode === 'datetime' && time ? `${text}, ${time}` : text
}

export interface CalendarDay {
  iso: string
  day: number
  outside: boolean
  today: boolean
  selected: boolean
  label: string
}

// 6 semaines pleines (42 jours) pour que la grille garde la même hauteur d'un mois à l'autre.
export function calendarDays(year: number, monthIndex: number, selected: string): CalendarDay[] {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const month = first.getUTCMonth()
  const today = todayIso()
  const label = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' })

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(Date.UTC(year, monthIndex, 1 - offset + index))
    const iso = toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    return {
      iso,
      day: date.getUTCDate(),
      outside: date.getUTCMonth() !== month,
      today: iso === today,
      selected: iso === selected,
      label: label.format(date),
    }
  })
}
