import { onMounted, ref, type Ref } from 'vue'
import { toast } from 'vue-sonner'

export const REMOVE_ERROR_MESSAGE = 'La suppression a échoué. Réessaie plus tard.'

export function useAdminList<T>(options: {
  load: () => Promise<T[]>
  remove: (item: T) => Promise<void>
  idOf: (item: T) => number
  loadError: string
  removed: (item: T) => string
}) {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(true)

  onMounted(async () => {
    try {
      items.value = await options.load()
    } catch {
      toast.error(options.loadError)
    } finally {
      loading.value = false
    }
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

  return { items, loading, remove }
}

export function byNom<T extends { nom: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''))
}
