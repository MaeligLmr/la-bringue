import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PAGE_SIZE } from './crud'

// Chaîne Postgrest factice : chaque méthode renvoie la chaîne elle-même, et
// `await` résout sur `response` (comme un vrai PostgrestBuilder thenable).
function mockSupabase(data: unknown = []) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
  for (const method of ['select', 'eq', 'order', 'limit', 'range', 'ilike', 'maybeSingle']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: unknown) => void) => resolve({ data, error: null })
  const from = vi.fn(() => chain)
  vi.doMock('../supabase.js', () => ({ supabase: { from, rpc: vi.fn(() => chain) } }))
  return { from, chain }
}

beforeEach(() => {
  vi.resetModules()
})

// Une ligne de plus que la page demandée est lue : sa présence indique qu'il
// reste des résultats, sans requête de comptage.
const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id_exposant: index }))

describe('crud — pagination', () => {
  it('containsPattern échappe %, _ et \\ saisis par l’utilisateur', async () => {
    const { containsPattern } = await import('./crud')

    expect(containsPattern('  50%_off\\ ')).toBe('%50\\%\\_off\\\\%')
  })

  it('toPage coupe la ligne en trop et signale la page suivante', async () => {
    const { toPage } = await import('./crud')

    expect(toPage([1, 2, 3], 2)).toEqual({ rows: [1, 2], hasMore: true })
    expect(toPage([1, 2], 2)).toEqual({ rows: [1, 2], hasMore: false })
  })

  it('pageRange demande une ligne de plus que la page', async () => {
    const { pageRange } = await import('./crud')

    expect(pageRange(24, 12)).toEqual([24, 36])
  })
})

describe('pagination des listes', () => {
  it('exposantHandler.getPage lit une page triée, avec filtre et recherche échappée', async () => {
    const { from, chain } = mockSupabase(rows(PAGE_SIZE + 1))
    const { exposantHandler } = await import('./exposant')

    const page = await exposantHandler.getPage({ offset: PAGE_SIZE, search: '50%_off', categorie: 'Tatouage' })

    expect(from).toHaveBeenCalledWith('Exposant')
    expect(chain.select).toHaveBeenCalledWith('id_exposant, nom, photo, categorie')
    expect(chain.eq).toHaveBeenCalledWith('categorie', 'Tatouage')
    expect(chain.ilike).toHaveBeenCalledWith('nom', '%50\\%\\_off%')
    expect(chain.order).toHaveBeenNthCalledWith(1, 'nom')
    expect(chain.order).toHaveBeenNthCalledWith(2, 'id_exposant')
    expect(chain.range).toHaveBeenCalledWith(PAGE_SIZE, 2 * PAGE_SIZE)
    expect(page.rows).toHaveLength(PAGE_SIZE)
    expect(page.hasMore).toBe(true)
  })

  it('exposantHandler.getPage sans filtre ni recherche, dernière page', async () => {
    const { chain } = mockSupabase(rows(PAGE_SIZE - 1))
    const { exposantHandler } = await import('./exposant')

    const page = await exposantHandler.getPage({ offset: 0 })

    expect(chain.eq).not.toHaveBeenCalled()
    expect(chain.ilike).not.toHaveBeenCalled()
    expect(chain.range).toHaveBeenCalledWith(0, PAGE_SIZE)
    expect(page).toEqual({ rows: rows(PAGE_SIZE - 1), hasMore: false })
  })

  it('actualiteHandler.getPage trie de la plus récente à la plus ancienne et cherche dans le titre', async () => {
    const { from, chain } = mockSupabase()
    const { actualiteHandler } = await import('./actualite')

    await actualiteHandler.getPage({ offset: 2 * PAGE_SIZE, search: 'festival' })

    expect(from).toHaveBeenCalledWith('Actualite')
    expect(chain.ilike).toHaveBeenCalledWith('titre', '%festival%')
    expect(chain.order).toHaveBeenNthCalledWith(1, 'date_publication', { ascending: false })
    expect(chain.order).toHaveBeenNthCalledWith(2, 'id_actualite', { ascending: false })
    expect(chain.range).toHaveBeenCalledWith(2 * PAGE_SIZE, 3 * PAGE_SIZE)
  })

  it('conferenceHandler.getPage filtre par jour, thème et titre, trié par jour puis heure', async () => {
    const { from, chain } = mockSupabase()
    const { conferenceHandler } = await import('./conference')

    await conferenceHandler.getPage({ offset: 0, search: 'rap', jour: '2026-08-29', theme: 'Feminisme' })

    expect(from).toHaveBeenCalledWith('Conference')
    expect(chain.eq).toHaveBeenCalledWith('jour', '2026-08-29')
    expect(chain.eq).toHaveBeenCalledWith('theme', 'Feminisme')
    expect(chain.ilike).toHaveBeenCalledWith('titre', '%rap%')
    expect(chain.order).toHaveBeenNthCalledWith(1, 'jour')
    expect(chain.order).toHaveBeenNthCalledWith(2, 'heure_debut')
    expect(chain.order).toHaveBeenNthCalledWith(3, 'id_conference')
    expect(chain.range).toHaveBeenCalledWith(0, PAGE_SIZE)
  })

  it('concertHandler.getPage filtre par jour, scène et nom d’artiste, trié par jour puis heure', async () => {
    const { from, chain } = mockSupabase()
    const { concertHandler } = await import('./concert')

    await concertHandler.getPage({ offset: PAGE_SIZE, search: 'aya', jour: '2026-08-28', scene: 'chrome' })

    expect(from).toHaveBeenCalledWith('Concert')
    // Les jointures filtrées passent en !inner (sinon le filtre ne retire que la jointure).
    const [columns] = chain.select.mock.calls[0]
    expect(columns).toContain('Scene!inner(')
    expect(columns).toContain('ConcertArtiste!inner(')
    expect(columns).toContain('Artiste!inner(')
    expect(chain.eq).toHaveBeenCalledWith('jour', '2026-08-28')
    expect(chain.ilike).toHaveBeenCalledWith('Scene.nom', 'chrome%')
    expect(chain.ilike).toHaveBeenCalledWith('ConcertArtiste.Artiste.nom', '%aya%')
    expect(chain.order).toHaveBeenNthCalledWith(1, 'jour')
    expect(chain.order).toHaveBeenNthCalledWith(2, 'heure_debut')
    expect(chain.order).toHaveBeenNthCalledWith(3, 'id_concert')
    expect(chain.range).toHaveBeenCalledWith(PAGE_SIZE, 2 * PAGE_SIZE)
  })

  it('concertHandler.getPage sans filtre garde des jointures ordinaires', async () => {
    const { chain } = mockSupabase()
    const { concertHandler } = await import('./concert')

    await concertHandler.getPage({ offset: 0 })

    const [columns] = chain.select.mock.calls[0]
    expect(columns).not.toContain('!inner')
    expect(chain.eq).not.toHaveBeenCalled()
    expect(chain.ilike).not.toHaveBeenCalled()
  })

  it('les suggestions ne lisent que quelques lignes', async () => {
    const { chain } = mockSupabase()
    const { exposantHandler } = await import('./exposant')

    await exposantHandler.getByCategorie('Tatouage', 4)

    expect(chain.limit).toHaveBeenCalledWith(4)
  })
})

describe('colonnes lues', () => {
  it('les lectures du CRUD ne demandent que les colonnes de la table, jamais *', async () => {
    const { chain } = mockSupabase()
    const { exposantHandler } = await import('./exposant')

    await exposantHandler.getAll()
    await exposantHandler.getById(1)

    expect(chain.select).toHaveBeenCalledTimes(2)
    for (const [columns] of chain.select.mock.calls) {
      expect(columns).toBe('id_exposant, nom, photo, categorie, description')
    }
  })
})
