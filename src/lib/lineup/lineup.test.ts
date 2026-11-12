import { describe, it, expect } from 'vitest'
import { diffLineup, type LineupEntry } from './lineup'

function entry(id_artiste: number, artiste_annonce = true, featuring = false): LineupEntry {
  return { id_artiste, nom: `Artiste ${id_artiste}`, artiste_annonce, featuring }
}

describe('diffLineup', () => {
  it('ne change rien quand le line-up est identique', () => {
    expect(diffLineup([entry(1), entry(2)], [entry(1), entry(2)])).toEqual({ added: [], updated: [], removed: [] })
  })

  it('repère les artistes ajoutées, modifiées et retirées', () => {
    const saved = [entry(1), entry(2), entry(3)]
    const current = [entry(1), entry(2, true, true), entry(4, false)]

    expect(diffLineup(saved, current)).toEqual({
      added: [entry(4, false)],
      updated: [entry(2, true, true)],
      removed: [entry(3)],
    })
  })

  it('crée tout le line-up d’un nouveau concert', () => {
    expect(diffLineup([], [entry(1), entry(2)]).added).toEqual([entry(1), entry(2)])
  })
})
