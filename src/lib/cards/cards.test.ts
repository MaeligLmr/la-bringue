import { describe, it, expect } from 'vitest'
import { formatHeure, formatHoraire } from './cards'

describe('formatHeure', () => {
  it('passe de "22:15:00" à "22h15", et renvoie un texte vide sans heure', () => {
    expect(formatHeure('22:15:00')).toBe('22h15')
    expect(formatHeure(null)).toBe('')
  })
})

describe('formatHoraire', () => {
  it('affiche le début et la fin, ou seulement le début', () => {
    expect(formatHoraire('21:00:00', '22:30:00')).toBe('21h00 – 22h30')
    expect(formatHoraire('21:00:00', null)).toBe('21h00')
    expect(formatHoraire(null, null)).toBe('')
  })
})
