import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadFiche } from './fiche'
import { artisteHandler, type ArtisteDetail } from '../handlers/artiste'
import { concertHandler, type ConcertDetail } from '../handlers/concert'
import { conferenceHandler, type ConferenceDetail } from '../handlers/conference'
import { exposantHandler } from '../handlers/exposant'
import type { Artiste } from '../types/database/artiste'
import type { Exposant } from '../types/database/exposant'

vi.mock('../handlers/artiste', () => ({
  artisteHandler: { getDetailById: vi.fn(), getByCategorie: vi.fn() },
}))
vi.mock('../handlers/concert', () => ({
  concertHandler: { getDetailedByScene: vi.fn() },
}))
vi.mock('../handlers/conference', () => ({
  conferenceHandler: { getDetailById: vi.fn(), getByTheme: vi.fn() },
}))
vi.mock('../handlers/exposant', () => ({
  exposantHandler: { getById: vi.fn(), getByCategorie: vi.fn() },
}))

const CHROME = { id_scene: 1, created_at: '', nom: 'Chrome', style_musical: null }

function artiste(id: number, nom: string, categorie = 'Rap'): Artiste {
  return { id_artiste: id, created_at: '', nom, photo: null, description: `Bio de ${nom}`, categorie }
}

function concert(id: number, heure: string, artistes: Artiste[]): ConcertDetail {
  return {
    id_concert: id,
    created_at: '',
    id_scene: CHROME.id_scene,
    jour: '2026-08-28',
    heure_debut: heure,
    heure_fin: null,
    Scene: CHROME,
    ConcertArtiste: artistes.map((a) => ({
      id_artiste: a.id_artiste,
      id_concert: id,
      created_at: '',
      artiste_annonce: true,
      featuring: false,
      Artiste: a,
    })),
  }
}

function conference(id: number, titre: string, theme: string): ConferenceDetail {
  return {
    id_conference: id,
    created_at: '',
    titre,
    photo: null,
    theme,
    description: null,
    jour: '2026-08-29',
    heure_debut: '14:30:00',
    heure_fin: null,
    Participation: [],
  }
}

function exposant(id: number, nom: string, categorie: string): Exposant {
  return { id_exposant: id, created_at: '', nom, photo: null, description: null, categorie }
}

beforeEach(() => vi.clearAllMocks())

describe('loadFiche — artiste', () => {
  const AYA = artiste(1, 'Aya')

  it('remplit le bloc commun depuis le concert de l’artiste', async () => {
    const detail: ArtisteDetail = { ...AYA, ConcertArtiste: [{ ...concert(10, '22:15:00', [AYA]).ConcertArtiste[0], Concert: concert(10, '22:15:00', []) }] }
    vi.mocked(artisteHandler.getDetailById).mockResolvedValue(detail)
    vi.mocked(concertHandler.getDetailedByScene).mockResolvedValue([])

    const data = await loadFiche('artiste', 1)

    expect(data?.fiche).toMatchObject({
      nom: 'Aya',
      description: 'Bio de Aya',
      jour: '2026-08-28',
      heure: '22h15',
      scene: 'chrome',
      categorie: { label: 'Rap' },
      likeTarget: { id: 1, type: 'artiste' },
    })
    expect(data?.fiche.tags).toEqual([
      { label: 'Vendredi 28 août', to: { name: 'programmation', query: { date: '2026-08-28' } } },
      { label: 'Chrome', to: { name: 'programmation', query: { scene: 'chrome' } } },
    ])
  })

  it('suggère les autres artistes de la même scène, sans doublon ni l’artiste lui-même', async () => {
    const detail: ArtisteDetail = { ...AYA, ConcertArtiste: [{ ...concert(10, '22:15:00', [AYA]).ConcertArtiste[0], Concert: concert(10, '22:15:00', []) }] }
    const DJ = artiste(2, 'DJ')
    const NOA = artiste(3, 'Noa')
    vi.mocked(artisteHandler.getDetailById).mockResolvedValue(detail)
    vi.mocked(concertHandler.getDetailedByScene).mockResolvedValue([
      concert(10, '22:15:00', [AYA]),
      concert(11, '20:00:00', [DJ]),
      concert(12, '23:00:00', [DJ]),
      concert(13, '18:00:00', [NOA]),
    ])

    const data = await loadFiche('artiste', 1)

    expect(concertHandler.getDetailedByScene).toHaveBeenCalledWith(CHROME.id_scene)
    expect(data?.suggestions.map((s) => s.nom)).toEqual(['DJ', 'Noa'])
    expect(data?.suggestions[0].to).toEqual({ name: 'fiche', params: { type: 'artiste', id: 2 } })
  })

  it('suggère par catégorie un artiste sans concert', async () => {
    vi.mocked(artisteHandler.getDetailById).mockResolvedValue({ ...AYA, ConcertArtiste: [] })
    vi.mocked(artisteHandler.getByCategorie).mockResolvedValue([AYA, artiste(4, 'Zed')])

    const data = await loadFiche('artiste', 1)

    expect(artisteHandler.getByCategorie).toHaveBeenCalledWith('Rap')
    expect(data?.fiche.tags).toEqual([])
    expect(data?.suggestions.map((s) => s.nom)).toEqual(['Zed'])
  })

  it('renvoie null pour un artiste inexistant', async () => {
    vi.mocked(artisteHandler.getDetailById).mockResolvedValue(null)

    expect(await loadFiche('artiste', 99)).toBeNull()
  })
})

describe('loadFiche — conférence', () => {
  it('affiche l’heure de fin dans le bloc commun quand elle est connue', async () => {
    vi.mocked(conferenceHandler.getDetailById).mockResolvedValue({
      ...conference(1, 'La fête au féminin', 'Feminisme'),
      heure_fin: '15:30:00',
    })
    vi.mocked(conferenceHandler.getByTheme).mockResolvedValue([])

    expect((await loadFiche('conference', 1))?.fiche.heure).toBe('14h30 – 15h30')
  })

  it('suggère les autres conférences du même thème', async () => {
    vi.mocked(conferenceHandler.getDetailById).mockResolvedValue(conference(1, 'La fête au féminin', 'Feminisme'))
    vi.mocked(conferenceHandler.getByTheme).mockResolvedValue([
      conference(1, 'La fête au féminin', 'Feminisme'),
      conference(2, 'Rap et engagement', 'Feminisme'),
    ])

    const data = await loadFiche('conference', 1)

    expect(conferenceHandler.getByTheme).toHaveBeenCalledWith('Feminisme')
    expect(data?.fiche.categorie).toEqual({
      label: 'Feminisme',
      to: { name: 'conferences', query: { theme: 'Feminisme' } },
    })
    expect(data?.suggestions.map((s) => s.nom)).toEqual(['Rap et engagement'])
  })
})

describe('loadFiche — exposant', () => {
  it('n’a ni date, ni scène, ni like, et suggère les exposants de la même catégorie', async () => {
    vi.mocked(exposantHandler.getById).mockResolvedValue(exposant(1, 'Encre Noire', 'Tatouage'))
    vi.mocked(exposantHandler.getByCategorie).mockResolvedValue([
      exposant(1, 'Encre Noire', 'Tatouage'),
      exposant(2, 'Ink & Love', 'Tatouage'),
    ])

    const data = await loadFiche('exposant', 1)

    expect(data?.fiche.jour).toBeUndefined()
    expect(data?.fiche.scene).toBeUndefined()
    expect(data?.fiche.likeTarget).toBeUndefined()
    expect(data?.suggestions.map((s) => s.nom)).toEqual(['Ink & Love'])
  })
})
