import type { Promotion } from '../../types/database/promotion'

export type PromotionStatus = 'en-cours' | 'a-venir' | 'terminee'

type Periode = Pick<Promotion, 'date_debut' | 'date_fin'>

// Mêmes règles que la billetterie publique (lib/billetterie) : les dates sont des
// « timestamp without time zone », lues à l'heure locale comme elles ont été saisies.
// Une borne absente est ouverte (pas de début = déjà commencée, pas de fin = sans limite).
export function promotionStatus({ date_debut, date_fin }: Periode, now = new Date()): PromotionStatus {
  if (date_debut && new Date(date_debut) > now) return 'a-venir'
  if (date_fin && new Date(date_fin) < now) return 'terminee'
  return 'en-cours'
}

const DATE_HEURE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// « 1 juin 2026, 00:00 → 15 juin 2026, 23:59 », avec « … » pour une borne absente.
export function formatPeriode({ date_debut, date_fin }: Periode): string {
  if (!date_debut && !date_fin) return '—'
  const format = (date: string | null) => (date ? DATE_HEURE.format(new Date(date)) : '…')
  return `${format(date_debut)} → ${format(date_fin)}`
}
