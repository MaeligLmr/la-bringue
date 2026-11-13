import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { Page } from '../../handlers/crud'
import { usePaginatedList } from '../usePaginatedList/usePaginatedList'

export const REMOVE_ERROR_MESSAGE = 'La suppression a échoué. Réessaie plus tard.'

// Liste du back-office : lue page par page côté serveur (recherche comprise, avec
// un délai après la frappe), la suite se charge au défilement (loadMore). Une
// suppression retire la ligne localement, sans tout recharger.
export function useAdminList<T>(options: {
  // Lit une page : `offset` = nombre de lignes déjà chargées, `search` = recherche en cours.
  fetchPage: (offset: number, search: string) => Promise<Page<T>>
  remove: (item: T) => Promise<void>
  idOf: (item: T) => number
  loadError: string
  removed: (item: T) => string
}) {
  const search = ref('')

  const { items, hasMore, loading, failed, loadMore } = usePaginatedList<T>({
    fetchPage: (offset, query) => options.fetchPage(offset, query.search),
    search,
    onError: () => toast.error(options.loadError),
  })

  async function remove(item: T) {
    try {
      await options.remove(item)
      items.value = items.value.filter((other) => options.idOf(other) !== options.idOf(item))
      toast.success(options.removed(item))
    } catch {
      toast.error(REMOVE_ERROR_MESSAGE)
    }
  }

  return { items, search, hasMore, loading, failed, loadMore, remove }
}
