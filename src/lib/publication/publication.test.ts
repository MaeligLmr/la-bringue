import { describe, expect, it } from 'vitest'
import { isPublished } from './publication'

const NOW = new Date('2026-11-13T12:00:00Z').getTime()

describe('isPublished', () => {
  it('est vrai quand la date de publication est passée ou égale à maintenant', () => {
    expect(isPublished('2026-11-12T08:00:00+00:00', NOW)).toBe(true)
    expect(isPublished('2026-11-13T12:00:00Z', NOW)).toBe(true)
  })

  it('traite une date seule (sans heure) comme minuit : publiée dès le jour J', () => {
    expect(isPublished('2026-11-13', NOW)).toBe(true)
    expect(isPublished('2026-11-14', NOW)).toBe(false)
  })

  it('est faux pour une date future', () => {
    expect(isPublished('2026-11-13T12:00:01Z', NOW)).toBe(false)
    expect(isPublished('2999-01-01', NOW)).toBe(false)
  })

  it('est faux sans date : une actualité sans date n’est jamais visible', () => {
    expect(isPublished(null, NOW)).toBe(false)
  })

  it('utilise l’heure courante par défaut', () => {
    expect(isPublished('2000-01-01')).toBe(true)
    expect(isPublished('2999-01-01')).toBe(false)
  })
})
