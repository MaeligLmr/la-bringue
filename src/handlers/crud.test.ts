import { describe, it, expect, beforeEach, vi } from 'vitest'

// Chaîne Postgrest factice : chaque méthode renvoie la chaîne elle-même, et
// `await` résout sur `response` (comme un vrai PostgrestBuilder thenable).
function mockSupabase(response: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle']) {
    chain[method] = vi.fn(() => chain)
  }
  chain.then = (resolve: (value: unknown) => void) => resolve(response)
  const from = vi.fn(() => chain)

  vi.doMock('../supabase.js', () => ({ supabase: { from } }))

  return { from, chain }
}

interface Row {
  id_row: number
  created_at: string
  nom: string | null
}

beforeEach(() => {
  vi.resetModules()
})

describe('createCrudHandler', () => {
  it('getAll interroge la bonne table et renvoie les lignes', async () => {
    const rows = [{ id_row: 1, created_at: '', nom: 'A' }]
    const { from, chain } = mockSupabase({ data: rows, error: null })
    const { createCrudHandler } = await import('./crud')

    const result = await createCrudHandler<Row, 'id_row'>('Row', 'id_row').getAll()

    expect(from).toHaveBeenCalledWith('Row')
    expect(chain.order).toHaveBeenCalledWith('id_row')
    expect(result).toEqual(rows)
  })

  it("getById filtre sur la colonne d'identifiant", async () => {
    const { chain } = mockSupabase({ data: null, error: null })
    const { createCrudHandler } = await import('./crud')

    const result = await createCrudHandler<Row, 'id_row'>('Row', 'id_row').getById(42)

    expect(chain.eq).toHaveBeenCalledWith('id_row', 42)
    expect(result).toBeNull()
  })

  it('update envoie les valeurs puis filtre sur l’identifiant', async () => {
    const updated = { id_row: 3, created_at: '', nom: 'B' }
    const { chain } = mockSupabase({ data: updated, error: null })
    const { createCrudHandler } = await import('./crud')

    const result = await createCrudHandler<Row, 'id_row'>('Row', 'id_row').update(3, { nom: 'B' })

    expect(chain.update).toHaveBeenCalledWith({ nom: 'B' })
    expect(chain.eq).toHaveBeenCalledWith('id_row', 3)
    expect(result).toEqual(updated)
  })

  it('lève une HandlerError préfixée par la table si Supabase renvoie une erreur', async () => {
    mockSupabase({ data: null, error: { message: 'permission denied', code: '42501' } })
    const { createCrudHandler, HandlerError } = await import('./crud')

    const promise = createCrudHandler<Row, 'id_row'>('Row', 'id_row').remove(1)

    await expect(promise).rejects.toBeInstanceOf(HandlerError)
    await expect(promise).rejects.toMatchObject({ message: '[Row] permission denied', code: '42501' })
  })
})
