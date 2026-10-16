import { describe, it, expect, beforeEach, vi } from 'vitest'

// Chaîne Postgrest factice : chaque méthode renvoie la chaîne elle-même, et
// `await` résout sur `response` (comme un vrai PostgrestBuilder thenable).
// On vérifie que chaque handler interroge la bonne table avec les bons filtres.
type Response = { data?: unknown; error?: unknown; count?: number | null }

function mockSupabase(response: Response = { data: [], error: null }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
  for (const method of [
    'select', 'insert', 'update', 'delete', 'eq', 'order', 'limit', 'lte', 'gte', 'single', 'maybeSingle',
  ]) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: unknown) => void) => resolve({ error: null, ...response })
  const from = vi.fn(() => chain)
  const rpc = vi.fn(() => chain)

  vi.doMock('../supabase.js', () => ({ supabase: { from, rpc } }))
  vi.doMock('../supabase', () => ({ supabase: { from, rpc } }))

  return { from, rpc, chain }
}

beforeEach(() => {
  vi.resetModules()
})

describe('actualiteHandler', () => {
  it('getLatest trie par date de publication décroissante, sans limite par défaut', async () => {
    const { from, chain } = mockSupabase()
    const { actualiteHandler } = await import('./actualite')

    await actualiteHandler.getLatest()

    expect(from).toHaveBeenCalledWith('Actualite')
    expect(chain.order).toHaveBeenCalledWith('date_publication', { ascending: false })
    expect(chain.limit).not.toHaveBeenCalled()
  })

  it('getLatest applique la limite demandée', async () => {
    const { chain } = mockSupabase()
    const { actualiteHandler } = await import('./actualite')

    await actualiteHandler.getLatest(3)

    expect(chain.limit).toHaveBeenCalledWith(3)
  })
})

describe('artisteHandler', () => {
  it('getDetailById charge l’artiste avec ses concerts et leur scène', async () => {
    const { from, chain } = mockSupabase({ data: { id_artiste: 4 } })
    const { artisteHandler } = await import('./artiste')

    const result = await artisteHandler.getDetailById(4)

    expect(from).toHaveBeenCalledWith('Artiste')
    expect(chain.select).toHaveBeenCalledWith('*, ConcertArtiste(*, Concert(*, Scene(*)))')
    expect(chain.eq).toHaveBeenCalledWith('id_artiste', 4)
    expect(result).toEqual({ id_artiste: 4 })
  })

  it('getByCategorie filtre sur la catégorie et trie par nom', async () => {
    const { chain } = mockSupabase()
    const { artisteHandler } = await import('./artiste')

    await artisteHandler.getByCategorie('Pop')

    expect(chain.eq).toHaveBeenCalledWith('categorie', 'Pop')
    expect(chain.order).toHaveBeenCalledWith('nom')
  })
})

describe('concertArtisteHandler', () => {
  it('getAll lit toute la table de liaison', async () => {
    const { from, chain } = mockSupabase()
    const { concertArtisteHandler } = await import('./concert-artiste')

    await concertArtisteHandler.getAll()

    expect(from).toHaveBeenCalledWith('ConcertArtiste')
    expect(chain.select).toHaveBeenCalledWith('*')
  })

  it('getArtistesByConcert et getConcertsByArtiste joignent l’autre table', async () => {
    const { chain } = mockSupabase()
    const { concertArtisteHandler } = await import('./concert-artiste')

    await concertArtisteHandler.getArtistesByConcert(2)
    expect(chain.select).toHaveBeenCalledWith('*, Artiste(*)')
    expect(chain.eq).toHaveBeenCalledWith('id_concert', 2)

    await concertArtisteHandler.getConcertsByArtiste(5)
    expect(chain.select).toHaveBeenCalledWith('*, Concert(*)')
    expect(chain.eq).toHaveBeenCalledWith('id_artiste', 5)
  })

  it('create insère le couple d’identifiants et les valeurs optionnelles', async () => {
    const { chain } = mockSupabase({ data: { id_artiste: 1, id_concert: 2 } })
    const { concertArtisteHandler } = await import('./concert-artiste')

    await concertArtisteHandler.create(1, 2, { featuring: true })

    expect(chain.insert).toHaveBeenCalledWith({ id_artiste: 1, id_concert: 2, featuring: true })
  })

  it('create fonctionne sans valeurs optionnelles', async () => {
    const { chain } = mockSupabase({ data: {} })
    const { concertArtisteHandler } = await import('./concert-artiste')

    await concertArtisteHandler.create(1, 2)

    expect(chain.insert).toHaveBeenCalledWith({ id_artiste: 1, id_concert: 2 })
  })

  it('update et remove ciblent le couple (artiste, concert)', async () => {
    const { chain } = mockSupabase({ data: {} })
    const { concertArtisteHandler } = await import('./concert-artiste')

    await concertArtisteHandler.update(1, 2, { artiste_annonce: true })
    expect(chain.update).toHaveBeenCalledWith({ artiste_annonce: true })
    expect(chain.eq).toHaveBeenCalledWith('id_artiste', 1)
    expect(chain.eq).toHaveBeenCalledWith('id_concert', 2)

    chain.eq.mockClear()
    await concertArtisteHandler.remove(1, 2)
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id_artiste', 1)
    expect(chain.eq).toHaveBeenCalledWith('id_concert', 2)
  })
})

describe('conferenceHandler', () => {
  it('getAllDetailed joint les conférencières et trie par jour puis heure', async () => {
    const { from, chain } = mockSupabase()
    const { conferenceHandler } = await import('./conference')

    await conferenceHandler.getAllDetailed()

    expect(from).toHaveBeenCalledWith('Conference')
    expect(chain.select).toHaveBeenCalledWith('*, Participation(*, Conferenciere(*))')
    expect(chain.order).toHaveBeenNthCalledWith(1, 'jour')
    expect(chain.order).toHaveBeenNthCalledWith(2, 'heure_debut')
  })

  it('getDetailById, getByJour et getByTheme filtrent sur la bonne colonne', async () => {
    const { chain } = mockSupabase({ data: null })
    const { conferenceHandler } = await import('./conference')

    await conferenceHandler.getDetailById(7)
    expect(chain.eq).toHaveBeenCalledWith('id_conference', 7)

    await conferenceHandler.getByJour('2026-08-29')
    expect(chain.eq).toHaveBeenCalledWith('jour', '2026-08-29')

    await conferenceHandler.getByTheme('Écologie')
    expect(chain.eq).toHaveBeenCalledWith('theme', 'Écologie')
  })

  it('getThemes appelle la fonction SQL get_themes_conferences', async () => {
    const { rpc } = mockSupabase({ data: ['Feminisme', 'Écologie'] })
    const { conferenceHandler } = await import('./conference')

    const themes = await conferenceHandler.getThemes()

    expect(rpc).toHaveBeenCalledWith('get_themes_conferences')
    expect(themes).toEqual(['Feminisme', 'Écologie'])
  })
})

describe('exposantHandler', () => {
  it('getAllByNom trie par nom', async () => {
    const { from, chain } = mockSupabase()
    const { exposantHandler } = await import('./exposant')

    await exposantHandler.getAllByNom()

    expect(from).toHaveBeenCalledWith('Exposant')
    expect(chain.order).toHaveBeenCalledWith('nom')
  })

  it('getByCategorie filtre sur la catégorie', async () => {
    const { chain } = mockSupabase()
    const { exposantHandler } = await import('./exposant')

    await exposantHandler.getByCategorie('Tatouage')

    expect(chain.eq).toHaveBeenCalledWith('categorie', 'Tatouage')
  })

  it('getCategories appelle la fonction SQL get_categories_exposants', async () => {
    const { rpc } = mockSupabase({ data: ['Tatouage', 'Restauration'] })
    const { exposantHandler } = await import('./exposant')

    expect(await exposantHandler.getCategories()).toEqual(['Tatouage', 'Restauration'])
    expect(rpc).toHaveBeenCalledWith('get_categories_exposants')
  })
})

describe('formuleHandler et promotionHandler', () => {
  it('getAllWithPromotions joint les promotions et trie par jour de début', async () => {
    const { from, chain } = mockSupabase()
    const { formuleHandler } = await import('./formule')

    await formuleHandler.getAllWithPromotions()

    expect(from).toHaveBeenCalledWith('Formule')
    expect(chain.select).toHaveBeenCalledWith('*, Promotion(*)')
    expect(chain.order).toHaveBeenCalledWith('jour_debut')
  })

  it('getAllHomepage ne garde que les formules marquées pour l’accueil, avec leurs promotions', async () => {
    const rows = [{ id_formule: 1, titre: 'Pass 1 jour', Promotion: [] }]
    const { from, chain } = mockSupabase({ data: rows })
    const { formuleHandler } = await import('./formule')

    const result = await formuleHandler.getAllHomepage()

    expect(from).toHaveBeenCalledWith('Formule')
    expect(chain.select).toHaveBeenCalledWith('*, Promotion(*)')
    expect(chain.eq).toHaveBeenCalledWith('homepage', true)
    expect(chain.order).toHaveBeenCalledWith('jour_debut')
    expect(result).toEqual(rows)
  })

  it('getByFormule filtre sur la formule', async () => {
    const { from, chain } = mockSupabase()
    const { promotionHandler } = await import('./promotion')

    await promotionHandler.getByFormule(3)

    expect(from).toHaveBeenCalledWith('Promotion')
    expect(chain.eq).toHaveBeenCalledWith('id_formule', 3)
  })

  it('getActives compare à l’instant donné, en ISO sans fuseau', async () => {
    const { chain } = mockSupabase()
    const { promotionHandler } = await import('./promotion')

    await promotionHandler.getActives(new Date('2026-08-28T10:30:45.123Z'))

    expect(chain.lte).toHaveBeenCalledWith('date_debut', '2026-08-28T10:30:45')
    expect(chain.gte).toHaveBeenCalledWith('date_fin', '2026-08-28T10:30:45')
  })

  it('getActives utilise l’heure courante par défaut', async () => {
    const { chain } = mockSupabase()
    const { promotionHandler } = await import('./promotion')

    await promotionHandler.getActives()

    expect(chain.lte).toHaveBeenCalledWith('date_debut', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/))
  })
})

describe('participationHandler', () => {
  it('récupère les conférencières d’une conférence et les conférences d’une conférencière', async () => {
    const { from, chain } = mockSupabase()
    const { participationHandler } = await import('./participation')

    await participationHandler.getConferencieresByConference(1)
    expect(from).toHaveBeenCalledWith('Participation')
    expect(chain.select).toHaveBeenCalledWith('*, Conferenciere(*)')
    expect(chain.eq).toHaveBeenCalledWith('id_conference', 1)

    await participationHandler.getConferencesByConferenciere(2)
    expect(chain.select).toHaveBeenCalledWith('*, Conference(*)')
    expect(chain.eq).toHaveBeenCalledWith('id_conferenciere', 2)
  })
})

describe('likeHandler', () => {
  it('getByUtilisatrice joint artiste et conférence, du plus récent au plus ancien', async () => {
    const { from, chain } = mockSupabase()
    const { likeHandler } = await import('./like')

    await likeHandler.getByUtilisatrice('user-1')

    expect(from).toHaveBeenCalledWith('Like')
    expect(chain.select).toHaveBeenCalledWith('*, Artiste(*), Conference(*)')
    expect(chain.eq).toHaveBeenCalledWith('id_utilisatrice', 'user-1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('getMine appelle get_my_likes et renvoie les cibles likées', async () => {
    const targets = [{ type: 'artiste', id: 4 }, { type: 'conference', id: 9 }]
    const { rpc } = mockSupabase({ data: targets })
    const { likeHandler } = await import('./like')

    expect(await likeHandler.getMine()).toEqual(targets)
    expect(rpc).toHaveBeenCalledWith('get_my_likes')
  })

  it('getMine signale une réponse qui n’est pas un tableau (fonction mal déclarée en base)', async () => {
    mockSupabase({ data: null })
    const { likeHandler } = await import('./like')

    await expect(likeHandler.getMine()).rejects.toThrow('réponse inattendue')
  })

  it('setLike envoie le type, l’identifiant et l’état à set_like, sans identifiante', async () => {
    const { rpc } = mockSupabase({ data: null })
    const { likeHandler } = await import('./like')

    await likeHandler.setLike({ type: 'artiste', id: 4 }, true)
    expect(rpc).toHaveBeenLastCalledWith('set_like', { p_type: 'artiste', p_id: 4, p_liked: true })

    await likeHandler.setLike({ type: 'conference', id: 9 }, false)
    expect(rpc).toHaveBeenLastCalledWith('set_like', { p_type: 'conference', p_id: 9, p_liked: false })
  })

  it('countByArtiste et countByConference renvoient le total, 0 si la base ne répond pas de nombre', async () => {
    const { chain } = mockSupabase({ count: 5 })
    const { likeHandler } = await import('./like')

    expect(await likeHandler.countByArtiste(4)).toBe(5)
    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(await likeHandler.countByConference(9)).toBe(5)

    vi.resetModules()
    mockSupabase({ count: null })
    const { likeHandler: sansCompte } = await import('./like')
    expect(await sansCompte.countByArtiste(4)).toBe(0)
  })

  it('une erreur Supabase est levée en HandlerError', async () => {
    mockSupabase({ error: { message: 'permission denied', code: '42501' } })
    const { likeHandler } = await import('./like')

    await expect(likeHandler.countByArtiste(1)).rejects.toMatchObject({
      name: 'HandlerError',
      code: '42501',
    })
  })
})

describe('infoPratiqueHandler', () => {
  it('getAllHomepage ne garde que les infos marquées pour l’accueil, dans l’ordre', async () => {
    const rows = [{ id_info: 1, titre: 'Accès' }]
    const { from, chain } = mockSupabase({ data: rows })
    const { infoPratiqueHandler } = await import('./info-pratique')

    const result = await infoPratiqueHandler.getAllHomepage()

    expect(from).toHaveBeenCalledWith('InfoPratique')
    expect(chain.eq).toHaveBeenCalledWith('homepage', true)
    expect(chain.order).toHaveBeenCalledWith('id_info')
    expect(result).toEqual(rows)
  })

  it('getAllHomepage lève l’erreur Supabase telle quelle', async () => {
    const error = { message: 'boom', code: 'XX000' }
    mockSupabase({ error })
    const { infoPratiqueHandler } = await import('./info-pratique')

    await expect(infoPratiqueHandler.getAllHomepage()).rejects.toBe(error)
  })

  it('hérite des opérations CRUD de base', async () => {
    const { from } = mockSupabase()
    const { infoPratiqueHandler } = await import('./info-pratique')

    await infoPratiqueHandler.getAll()

    expect(from).toHaveBeenCalledWith('InfoPratique')
  })
})

describe('handlers CRUD simples', () => {
  it('sceneHandler et conferenciereHandler pointent sur leur table', async () => {
    const { from } = mockSupabase()
    const { sceneHandler, conferenciereHandler } = await import('./index')

    await sceneHandler.getAll()
    expect(from).toHaveBeenLastCalledWith('Scene')

    await conferenciereHandler.getAll()
    expect(from).toHaveBeenLastCalledWith('Conferenciere')
  })
})
