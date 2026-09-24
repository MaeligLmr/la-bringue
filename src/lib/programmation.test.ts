import { describe, it, expect } from 'vitest'
import { getDayLineup } from './programmation'
import type { Artiste } from '../types/programmation'

function artiste(nom: string, date: string, heure: string, scene: string): Artiste {
  return { id: nom, nom, photo: '', date, heure, scene, categorie: 'Rock' }
}

const ARTISTES = [
  artiste('Chrome tôt', '2026-08-28', '18h00', 'chrome'),
  artiste('Chrome tard', '2026-08-28', '22h00', 'chrome'),
  artiste('Soft très tard', '2026-08-28', '23h30', 'soft'),
  artiste('Summer', '2026-08-28', '21h00', 'summer'),
  artiste('2000', '2026-08-28', '20h00', '2000'),
  artiste('Autre jour', '2026-08-29', '23h59', 'chrome'),
]

describe('getDayLineup', () => {
  it('met en tête d’affiche le dernier concert de la scène Chrome, même si une autre scène finit plus tard', () => {
    expect(getDayLineup(ARTISTES, '2026-08-28').headliner?.nom).toBe('Chrome tard')
  })

  it('liste ensuite les autres concerts du jour, du plus tardif au plus tôt', () => {
    const { others } = getDayLineup(ARTISTES, '2026-08-28')

    expect(others.map((a) => a.nom)).toEqual(['Soft très tard', 'Summer', '2000', 'Chrome tôt'])
  })

  it('limite le nombre d’autres artistes à `count`', () => {
    expect(getDayLineup(ARTISTES, '2026-08-28', 2).others.map((a) => a.nom)).toEqual([
      'Soft très tard',
      'Summer',
    ])
  })

  it('n’a pas de tête d’affiche quand personne ne joue sur Chrome ce jour-là', () => {
    const lineup = getDayLineup(ARTISTES.filter((a) => a.scene !== 'chrome'), '2026-08-28')

    expect(lineup.headliner).toBeUndefined()
    expect(lineup.others).toHaveLength(3)
  })
})
