import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { REMOVE_ERROR_MESSAGE, useAdminList } from './useAdminList'
import type { Page } from '../../handlers/crud'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('vue-sonner', () => ({ toast }))

interface Row {
  id: number
  nom: string | null
}

const ROWS: Row[] = [
  { id: 1, nom: 'Angèle' },
  { id: 2, nom: 'Beyoncé' },
]

const page = (rows: Row[], hasMore = false): Page<Row> => ({ rows, hasMore })

// Le composable charge au montage : on l'utilise dans un composant de test.
async function mountList(options: Partial<Parameters<typeof useAdminList<Row>>[0]> = {}) {
  let list!: ReturnType<typeof useAdminList<Row>>
  const fetchPage = vi.fn().mockResolvedValue(page(ROWS))
  mount(
    defineComponent({
      setup() {
        list = useAdminList<Row>({
          fetchPage,
          remove: vi.fn().mockResolvedValue(undefined),
          idOf: (row) => row.id,
          loadError: 'Chargement impossible.',
          removed: (row) => `${row.nom} supprimée.`,
          ...options,
        })
        return () => null
      },
    })
  )
  await flushPromises()
  return { list, fetchPage: (options.fetchPage ?? fetchPage) as ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAdminList', () => {
  it('charge la première page au montage, sans recherche', async () => {
    const { list, fetchPage } = await mountList()

    expect(fetchPage).toHaveBeenCalledWith(0, '')
    expect(list.items.value).toEqual(ROWS)
    expect(list.loading.value).toBe(false)
    expect(list.hasMore.value).toBe(false)
  })

  it('charge la page suivante à partir du nombre de lignes déjà chargées', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page([ROWS[0]], true))
      .mockResolvedValueOnce(page([ROWS[1]], false))
    const { list } = await mountList({ fetchPage })
    expect(list.hasMore.value).toBe(true)

    list.loadMore()
    await flushPromises()

    expect(fetchPage).toHaveBeenLastCalledWith(1, '')
    expect(list.items.value).toEqual(ROWS)
    expect(list.hasMore.value).toBe(false)
  })

  it('relance la recherche côté serveur depuis la première page, après un délai', async () => {
    vi.useFakeTimers()
    const fetchPage = vi.fn().mockResolvedValue(page(ROWS))
    const { list } = await mountList({ fetchPage })
    fetchPage.mockClear()
    fetchPage.mockResolvedValue(page([ROWS[1]]))

    list.search.value = 'bey'
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchPage).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(300)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(0, 'bey')
    expect(list.items.value).toEqual([ROWS[1]])
  })

  it('signale un chargement impossible', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { list } = await mountList({ fetchPage: vi.fn().mockRejectedValue(new Error('boom')) })

    expect(list.items.value).toEqual([])
    expect(list.loading.value).toBe(false)
    expect(list.failed.value).toBe(true)
    expect(toast.error).toHaveBeenCalledWith('Chargement impossible.')
  })

  it('supprime une ligne et le confirme', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    const { list } = await mountList({ remove })

    await list.remove(ROWS[0])

    expect(remove).toHaveBeenCalledWith(ROWS[0])
    expect(list.items.value).toEqual([ROWS[1]])
    expect(toast.success).toHaveBeenCalledWith('Angèle supprimée.')
  })

  it('garde la ligne si la suppression échoue', async () => {
    const { list } = await mountList({ remove: vi.fn().mockRejectedValue(new Error('boom')) })

    await list.remove(ROWS[0])

    expect(list.items.value).toEqual(ROWS)
    expect(toast.error).toHaveBeenCalledWith(REMOVE_ERROR_MESSAGE)
  })

  it('après une suppression, la page suivante repart du nombre de lignes restantes', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce(page(ROWS, true)).mockResolvedValueOnce(page([]))
    const { list } = await mountList({ fetchPage })

    await list.remove(ROWS[0])
    list.loadMore()
    await flushPromises()

    expect(fetchPage).toHaveBeenLastCalledWith(1, '')
  })
})
