import { describe, it, expect } from 'vitest'
import { diffLinks, type LineupEntry } from './links'

function entry(id: number, artiste_annonce = true, featuring = false): LineupEntry {
  return { id, nom: `Artiste ${id}`, artiste_annonce, featuring }
}

const flagsChanged = (before: LineupEntry, after: LineupEntry) =>
  before.artiste_annonce !== after.artiste_annonce || before.featuring !== after.featuring

describe('diffLinks', () => {
  it('ne change rien quand les liens sont identiques', () => {
    expect(diffLinks([entry(1), entry(2)], [entry(1), entry(2)], flagsChanged)).toEqual({ added: [], updated: [], removed: [] })
  })

  it('repère les liens ajoutés, modifiés et retirés', () => {
    const saved = [entry(1), entry(2), entry(3)]
    const current = [entry(1), entry(2, true, true), entry(4, false)]

    expect(diffLinks(saved, current, flagsChanged)).toEqual({
      added: [entry(4, false)],
      updated: [entry(2, true, true)],
      removed: [entry(3)],
    })
  })

  it('crée tous les liens d’un nouvel élément', () => {
    expect(diffLinks([], [entry(1), entry(2)]).added).toEqual([entry(1), entry(2)])
  })

  it('ne considère aucun lien comme modifié sans comparaison fournie', () => {
    expect(diffLinks([entry(1)], [entry(1, false, true)]).updated).toEqual([])
  })
})
