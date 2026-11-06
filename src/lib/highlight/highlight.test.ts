import { describe, expect, it } from 'vitest'
import { fold, splitMatches } from './highlight'

describe('fold', () => {
  it('passe en minuscules sans accents en gardant la longueur', () => {
    expect(fold('Accès À Vélo')).toBe('acces a velo')
    expect(fold('Accès À Vélo')).toHaveLength('Accès À Vélo'.length)
  })
})

describe('splitMatches', () => {
  it('renvoie le texte tel quel sans recherche ou avec un seul caractère', () => {
    expect(splitMatches('Cashless', '')).toEqual([{ text: 'Cashless', match: false }])
    expect(splitMatches('Cashless', 'c')).toEqual([{ text: 'Cashless', match: false }])
  })

  it('renvoie un tableau vide sans texte', () => {
    expect(splitMatches(null, 'ca')).toEqual([])
  })

  it('marque chaque occurrence, sans tenir compte de la casse ni des accents', () => {
    expect(splitMatches('Accès à l’accès', 'ACCES')).toEqual([
      { text: 'Accès', match: true },
      { text: ' à l’', match: false },
      { text: 'accès', match: true },
    ])
  })

  it('ne renvoie aucun morceau marqué quand rien ne correspond', () => {
    expect(splitMatches('Parking', 'zz').some((s) => s.match)).toBe(false)
  })
})
