import { describe, it, expect } from 'vitest'
import { byNom, toOptions } from './options'

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

describe('byNom', () => {
  it('trie par nom sans modifier la liste d’origine, les noms vides en premier', () => {
    const rows = [
      { id: 1, nom: 'Beyoncé' },
      { id: 2, nom: 'Angèle' },
      { id: 3, nom: null },
    ]

    expect(byNom(rows).map((row) => row.id)).toEqual([3, 2, 1])
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3])
  })
})
