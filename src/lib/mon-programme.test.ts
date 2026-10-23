import { describe, it, expect } from 'vitest'
import { DATE_A_CONFIRMER, groupProgrammeByJour } from './mon-programme'
import type { ArtisteCard } from '../types/ui/programmation'
import type { ConferenceCard } from '../types/ui/conferences'

function artiste(idArtiste: number, nom: string, date: string, heure: string, scene = 'chrome'): ArtisteCard {
  return { id: `c-${idArtiste}`, idArtiste, nom, photo: null, date, heure, scene, categorie: 'Pop' }
}

function conference(id: number, nom: string, date: string, heure: string): ConferenceCard {
  return { id, nom, photo: null, date, heure, conferencieres: 'Alice, Inès', theme: 'Féminisme' }
}

describe('groupProgrammeByJour', () => {
  it('ne renvoie aucun jour sans contenu', () => {
    expect(groupProgrammeByJour([], [])).toEqual([])
  })

  it("regroupe artistes et conférences par jour, dans l'ordre du festival", () => {
    const jours = groupProgrammeByJour(
      [artiste(1, 'Oklou', '2026-08-30', '19h00'), artiste(2, 'Iliona', '2026-08-28', '17h00')],
      [conference(3, 'Table ronde', '2026-08-28', '14h00')]
    )

    expect(jours.map((jour) => jour.label)).toEqual(['Vendredi 28 août', 'Dimanche 30 août'])
    expect(jours[0].items.map((item) => item.nom)).toEqual(['Table ronde', 'Iliona'])
  })

  it('trie les contenus de la journée par horaire, ceux sans horaire en dernier', () => {
    const [jour] = groupProgrammeByJour(
      [artiste(1, 'Tard', '2026-08-29', '22h15'), artiste(2, 'Sans heure', '2026-08-29', '')],
      [conference(3, 'Tôt', '2026-08-29', '09h30')]
    )

    expect(jour.items.map((item) => item.nom)).toEqual(['Tôt', 'Tard', 'Sans heure'])
  })

  it('affiche la scène pour un artiste et les conférencières pour une conférence', () => {
    const [jour] = groupProgrammeByJour(
      [artiste(1, 'Oklou', '2026-08-29', '19h00', '2000')],
      [conference(3, 'Table ronde', '2026-08-29', '14h00')]
    )

    expect(jour.items).toEqual([
      expect.objectContaining({ target: { id: 3, type: 'conference' }, lieu: 'Alice, Inès', categorie: 'Féminisme' }),
      expect.objectContaining({ target: { id: 1, type: 'artiste' }, lieu: '2000’', heure: '19h00' }),
    ])
  })

  it('place les contenus sans date dans un groupe « Date à confirmer » en fin de liste', () => {
    const jours = groupProgrammeByJour([artiste(1, 'Mystère', '', ''), artiste(2, 'Oklou', '2026-08-30', '19h00')], [])

    expect(jours.map((jour) => jour.label)).toEqual(['Dimanche 30 août', DATE_A_CONFIRMER])
  })
})
