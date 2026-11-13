import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calendarDays, formatDisplay, joinValue, splitValue, toIso } from './date-picker'

describe('date-picker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 28, 12))
  })
  afterEach(() => vi.useRealTimers())

  describe('splitValue', () => {
    it('ignore les secondes renvoyées par la base', () => {
      expect(splitValue('21:00:00', 'time')).toEqual({ date: '', time: '21:00' })
    })

    it('sépare une date et une heure', () => {
      expect(splitValue('2026-08-28T16:30', 'datetime')).toEqual({ date: '2026-08-28', time: '16:30' })
      expect(splitValue('2026-08-28', 'date')).toEqual({ date: '2026-08-28', time: '' })
    })

    it('renvoie des champs vides pour une valeur invalide ou vide', () => {
      expect(splitValue('', 'datetime')).toEqual({ date: '', time: '' })
      expect(splitValue('pas une date', 'date')).toEqual({ date: '', time: '' })
    })
  })

  describe('joinValue', () => {
    it('recompose selon le mode', () => {
      expect(joinValue('2026-08-28', '16:30', 'datetime')).toBe('2026-08-28T16:30')
      expect(joinValue('2026-08-28', '16:30', 'date')).toBe('2026-08-28')
      expect(joinValue('', '16:30', 'time')).toBe('16:30')
    })

    it('complète la partie manquante : aujourd’hui et 00:00', () => {
      expect(joinValue('', '', 'datetime')).toBe('2026-08-28T00:00')
      expect(joinValue('', '', 'time')).toBe('00:00')
    })
  })

  describe('formatDisplay', () => {
    it('met une date en français avec le jour de la semaine', () => {
      expect(formatDisplay('2026-08-28', 'date')).toBe('vendredi 28 août 2026')
    })

    it('affiche l’heure seule, et date + heure', () => {
      expect(formatDisplay('21:00:00', 'time')).toBe('21:00')
      expect(formatDisplay('2026-08-28T16:30', 'datetime')).toBe('28 août 2026, 16:30')
    })

    it('renvoie une chaîne vide sans valeur', () => {
      expect(formatDisplay('', 'date')).toBe('')
    })
  })

  describe('calendarDays', () => {
    it('renvoie 6 semaines pleines commençant un lundi', () => {
      // 1er août 2026 = samedi : la grille commence le lundi 27 juillet.
      const days = calendarDays(2026, 7, '')

      expect(days).toHaveLength(42)
      expect(days[0].iso).toBe('2026-07-27')
      expect(days[0].outside).toBe(true)
      expect(days[5].iso).toBe('2026-08-01')
      expect(days[5].outside).toBe(false)
    })

    it('marque le jour sélectionné et aujourd’hui', () => {
      const days = calendarDays(2026, 7, '2026-08-15')

      expect(days.filter((day) => day.selected).map((day) => day.iso)).toEqual(['2026-08-15'])
      expect(days.filter((day) => day.today).map((day) => day.iso)).toEqual(['2026-08-28'])
    })

    it('gère le passage d’année', () => {
      expect(toIso(2026, 12, 1)).toBe('2027-01-01')
      expect(calendarDays(2026, 11, '').some((day) => day.iso === '2027-01-03')).toBe(true)
    })
  })
})
