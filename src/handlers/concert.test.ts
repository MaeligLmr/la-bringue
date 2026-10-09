import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ConcertDetail } from './concert'

let id = 0

function concert(
  heure: string,
  scene: string,
  artistes: { nom: string; featuring?: boolean }[]
): ConcertDetail {
  return {
    id_concert: ++id,
    created_at: '',
    id_scene: null,
    jour: '2026-08-28',
    heure_debut: heure,
    heure_fin: null,
    Scene: { id_scene: 0, created_at: '', nom: scene, style_musical: null },
    ConcertArtiste: artistes.map(({ nom, featuring = false }, index) => ({
      id_artiste: id * 10 + index,
      id_concert: id,
      created_at: '',
      artiste_annonce: true,
      featuring,
      Artiste: { id_artiste: id * 10 + index, created_at: '', nom, photo: null, description: null, categorie: null },
    })),
  }
}

// Supabase renvoie déjà les concerts du jour triés du plus tardif au plus tôt.
const CONCERTS = [
  concert('23:30:00', 'Soft', [{ nom: 'Soft très tard' }]),
  concert('22:00:00', 'Chrome', [{ nom: 'Chrome tard' }, { nom: 'Invitée', featuring: true }]),
  concert('21:00:00', 'Summer', [{ nom: 'Summer' }]),
  concert('20:00:00', '2000', [{ nom: '2000' }]),
  concert('18:00:00', 'Chrome', [{ nom: 'Chrome tôt' }]),
]

// Chaîne Postgrest factice : chaque méthode renvoie la chaîne elle-même, et
// `await` résout sur la réponse (comme un vrai PostgrestBuilder thenable).
function mockSupabase(data: ConcertDetail[]) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
  for (const method of ['select', 'eq', 'order']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: unknown) => void) => resolve({ data, error: null })
  const from = vi.fn(() => chain)

  vi.doMock('../supabase.js', () => ({ supabase: { from } }))

  return { from, chain }
}

async function getDayLineup(data: ConcertDetail[], count?: number) {
  const mock = mockSupabase(data)
  const { concertHandler } = await import('./concert')
  return { lineup: await concertHandler.getDayLineup('2026-08-28', count), ...mock }
}

beforeEach(() => {
  vi.resetModules()
})

describe('concertHandler.getDayLineup', () => {
  it('filtre les concerts du jour et les demande du plus tardif au plus tôt', async () => {
    const { from, chain } = await getDayLineup(CONCERTS)

    expect(from).toHaveBeenCalledWith('Concert')
    expect(chain.eq).toHaveBeenCalledWith('jour', '2026-08-28')
    expect(chain.order).toHaveBeenCalledWith('heure_debut', { ascending: false, nullsFirst: false })
  })

  it('met en tête d’affiche le dernier concert de la scène Chrome, même si une autre scène finit plus tard', async () => {
    const { lineup } = await getDayLineup(CONCERTS)

    expect(lineup.headliner?.nom).toBe('Chrome tard')
  })

  it('liste ensuite les autres artistes du jour, sans les featurings', async () => {
    const { lineup } = await getDayLineup(CONCERTS)

    expect(lineup.others.map((a) => a.nom)).toEqual(['Soft très tard', 'Summer', '2000', 'Chrome tôt'])
  })

  it('limite le nombre d’autres artistes à `count`', async () => {
    const { lineup } = await getDayLineup(CONCERTS, 2)

    expect(lineup.others.map((a) => a.nom)).toEqual(['Soft très tard', 'Summer'])
  })

  it('n’a pas de tête d’affiche quand personne ne joue sur Chrome ce jour-là', async () => {
    const { lineup } = await getDayLineup(CONCERTS.filter((c) => c.Scene?.nom !== 'Chrome'))

    expect(lineup.headliner).toBeUndefined()
    expect(lineup.others).toHaveLength(3)
  })
})
