import { describe, it, expect } from 'vitest'
import { toOptions } from './options'

describe('toOptions', () => {
  it('transforme chaque texte en option, dans l’ordre reçu', () => {
    expect(toOptions(['Tatouage', 'Artisanat'])).toEqual([
      { value: 'Tatouage', label: 'Tatouage' },
      { value: 'Artisanat', label: 'Artisanat' },
    ])
  })

  it('retire les valeurs vides et les doublons', () => {
    expect(toOptions(['Pop', null, 'Pop', '', undefined, 'RnB']).map((option) => option.value)).toEqual(['Pop', 'RnB'])
  })

  it('trie par ordre alphabétique si demandé', () => {
    expect(toOptions(['RnB', 'Électro', 'Pop'], { sorted: true }).map((option) => option.value)).toEqual(['Électro', 'Pop', 'RnB'])
  })
})
