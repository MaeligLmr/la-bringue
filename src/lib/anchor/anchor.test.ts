import { describe, expect, it } from 'vitest'
import { sectionAnchor } from './anchor'

describe('sectionAnchor', () => {
  it('met en minuscules, retire les accents et remplace les séparateurs par des tirets', () => {
    expect(sectionAnchor('Accès & transport', 1)).toBe('acces-transport')
    expect(sectionAnchor('Horaires d’ouverture', 2)).toBe('horaires-d-ouverture')
    expect(sectionAnchor('Accessibilité PMR', 3)).toBe('accessibilite-pmr')
  })

  it('ne laisse pas de tiret en début ou en fin', () => {
    expect(sectionAnchor('  ¿Dormir? ', 4)).toBe('dormir')
  })

  it('retombe sur section-<id> sans titre exploitable', () => {
    expect(sectionAnchor(null, 5)).toBe('section-5')
    expect(sectionAnchor('???', 6)).toBe('section-6')
  })
})
