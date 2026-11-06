import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { Page } from '../../handlers/crud'
import type { FilterValues } from '../../types/ui/filterable-list'

// Délai après la dernière frappe avant de relancer la requête de recherche.
const SEARCH_DELAY_MS = 300

interface Options<T> {
  // Lit une page : `offset` = nombre de lignes déjà chargées.
  fetchPage: (offset: number, query: { search: string; filters: FilterValues }) => Promise<Page<T>>
  search: Ref<string>
  filters?: Ref<FilterValues>
  // Appelée quand un chargement échoue (toast d'erreur côté vue).
  onError?: (error: unknown) => void
}

// Liste chargée page par page : la première page à l'ouverture, les suivantes
// à la demande (loadMore, déclenché par le défilement). Changer la recherche
// (avec délai) ou un filtre repart de la première page. Une réponse devenue
// obsolète (filtre changé pendant le chargement) est ignorée.
export function usePaginatedList<T>({ fetchPage, search, filters = ref({}), onError }: Options<T>) {
  const items = ref([]) as Ref<T[]>
  const hasMore = ref(false)
  // Un chargement est en cours (première page ou suivante).
  const loading = ref(false)
  // Le dernier chargement a échoué : loadMore() le relance.
  const failed = ref(false)

  let requestId = 0

  async function load(reset: boolean) {
    if (loading.value && !reset) return
    const current = ++requestId
    loading.value = true
    failed.value = false
    if (reset) {
      items.value = []
      hasMore.value = false
    }
    try {
      const page = await fetchPage(items.value.length, { search: search.value, filters: filters.value })
      if (current !== requestId) return
      items.value = [...items.value, ...page.rows]
      hasMore.value = page.hasMore
    } catch (error) {
      if (current !== requestId) return
      console.error(error)
      failed.value = true
      onError?.(error)
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  watch(search, () => {
    clearTimeout(timer)
    timer = setTimeout(() => load(true), SEARCH_DELAY_MS)
  })
  watch(
    filters,
    () => {
      clearTimeout(timer)
      load(true)
    },
    { deep: true }
  )
  onBeforeUnmount(() => {
    clearTimeout(timer)
    requestId++
  })

  load(true)

  return { items, hasMore, loading, failed, loadMore: () => load(false), reload: () => load(true) }
}
