import { describe, expect, it } from 'vitest'
import { formatPeriode, promotionStatus } from './promotion'

// Heure locale : les dates des promotions sont des « timestamp without time zone ».
const NOW = new Date(2026, 5, 10, 12, 0)

describe('promotionStatus', () => {
  it('est « en cours » entre le début et la fin', () => {
    expect(promotionStatus({ date_debut: '2026-06-01T00:00:00', date_fin: '2026-06-15T23:59:00' }, NOW)).toBe('en-cours')
  })

  it('est « à venir » avant le début', () => {
    expect(promotionStatus({ date_debut: '2026-06-11T00:00:00', date_fin: '2026-06-30T00:00:00' }, NOW)).toBe('a-venir')
  })

  it('est « terminée » après la fin', () => {
    expect(promotionStatus({ date_debut: '2026-05-01T00:00:00', date_fin: '2026-06-09T23:59:00' }, NOW)).toBe('terminee')
  })

  it('traite une borne absente comme ouverte', () => {
    expect(promotionStatus({ date_debut: null, date_fin: '2026-06-30T00:00:00' }, NOW)).toBe('en-cours')
    expect(promotionStatus({ date_debut: '2026-06-01T00:00:00', date_fin: null }, NOW)).toBe('en-cours')
    expect(promotionStatus({ date_debut: null, date_fin: null }, NOW)).toBe('en-cours')
  })

  it('utilise l’heure courante par défaut', () => {
    expect(promotionStatus({ date_debut: '2000-01-01T00:00:00', date_fin: '2000-02-01T00:00:00' })).toBe('terminee')
    expect(promotionStatus({ date_debut: '2999-01-01T00:00:00', date_fin: '2999-02-01T00:00:00' })).toBe('a-venir')
  })
})

describe('formatPeriode', () => {
  it('affiche le début et la fin avec l’heure', () => {
    const texte = formatPeriode({ date_debut: '2026-06-01T09:30:00', date_fin: '2026-06-15T23:59:00' })

    expect(texte).toContain('1 juin 2026')
    expect(texte).toContain('09:30')
    expect(texte).toContain('→')
    expect(texte).toContain('15 juin 2026')
    expect(texte).toContain('23:59')
  })

  it('marque une borne absente par « … » et l’absence totale par un tiret', () => {
    expect(formatPeriode({ date_debut: null, date_fin: '2026-06-15T23:59:00' }).startsWith('… → ')).toBe(true)
    expect(formatPeriode({ date_debut: '2026-06-01T09:30:00', date_fin: null }).endsWith(' → …')).toBe(true)
    expect(formatPeriode({ date_debut: null, date_fin: null })).toBe('—')
  })
})
