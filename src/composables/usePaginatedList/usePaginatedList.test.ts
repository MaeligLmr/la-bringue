import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { usePaginatedList } from './usePaginatedList'
import type { Page } from '../../handlers/crud'
import type { FilterValues } from '../../types/ui/filterable-list'

const SOURCE = [1, 2, 3, 4, 5]

function page(offset: number, size = 2): Page<number> {
  return { rows: SOURCE.slice(offset, offset + size), hasMore: offset + size < SOURCE.length }
}

function setup(fetchPage = vi.fn(async (offset: number) => page(offset))) {
  const search = ref('')
  const filters = ref<FilterValues>({})
  const onError = vi.fn()
  const scope = effectScope()
  const list = scope.run(() => usePaginatedList({ fetchPage, search, filters, onError }))!
  return { list, search, filters, fetchPage, onError }
}

const settle = async () => {
  await vi.advanceTimersByTimeAsync(500)
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePaginatedList', () => {
  it('charge la première page au montage', async () => {
    const { list } = setup()
    expect(list.loading.value).toBe(true)
    await settle()

    expect(list.items.value).toEqual([1, 2])
    expect(list.hasMore.value).toBe(true)
    expect(list.loading.value).toBe(false)
  })

  it('loadMore ajoute la page suivante à la suite, jusqu’à épuisement', async () => {
    const { list, fetchPage } = setup()
    await settle()

    list.loadMore()
    await settle()
    list.loadMore()
    await settle()

    expect(list.items.value).toEqual([1, 2, 3, 4, 5])
    expect(list.hasMore.value).toBe(false)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, { search: '', filters: {} })
    expect(fetchPage).toHaveBeenNthCalledWith(3, 4, { search: '', filters: {} })
  })

  it('ignore loadMore pendant un chargement', async () => {
    const { list, fetchPage } = setup()
    await settle()

    list.loadMore()
    list.loadMore()
    await settle()

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(list.items.value).toEqual([1, 2, 3, 4])
  })

  it('repart de la première page quand un filtre change', async () => {
    const { list, filters, fetchPage } = setup()
    await settle()
    list.loadMore()
    await settle()

    filters.value = { categorie: 'Tatouage' }
    await settle()

    expect(fetchPage).toHaveBeenLastCalledWith(0, { search: '', filters: { categorie: 'Tatouage' } })
    expect(list.items.value).toEqual([1, 2])
  })

  it('attend la fin de la frappe avant de relancer la recherche', async () => {
    const { search, fetchPage } = setup()
    await settle()
    fetchPage.mockClear()

    search.value = 'i'
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    search.value = 'in'
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(fetchPage).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(300)
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(0, { search: 'in', filters: {} })
  })

  it('ignore la réponse d’un chargement devenu obsolète', async () => {
    const resolvers: Array<(value: Page<number>) => void> = []
    const fetchPage = vi.fn(() => new Promise<Page<number>>((resolve) => resolvers.push(resolve)))
    const { list, filters } = setup(fetchPage)

    filters.value = { categorie: 'Art' }
    await nextTick()
    // Le second chargement répond d'abord, puis le premier (périmé).
    resolvers[1]({ rows: [9], hasMore: false })
    await nextTick()
    resolvers[0]({ rows: [1, 2], hasMore: true })
    await settle()

    expect(list.items.value).toEqual([9])
    expect(list.hasMore.value).toBe(false)
  })

  it('signale l’erreur, garde ce qui est affiché et permet de réessayer', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchPage = vi.fn(async (offset: number) => page(offset))
    const { list, onError } = setup(fetchPage)
    await settle()

    fetchPage.mockRejectedValueOnce(new Error('réseau'))
    list.loadMore()
    await settle()

    expect(list.failed.value).toBe(true)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(list.items.value).toEqual([1, 2])

    list.loadMore()
    await settle()
    expect(list.failed.value).toBe(false)
    expect(list.items.value).toEqual([1, 2, 3, 4])
  })
})
