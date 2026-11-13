import { ref, type Ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { toast } from 'vue-sonner'
import { diffLinks, type LinkChanges, type LinkEntry } from '../../lib/links/links'

export function useAdminLinks<T extends LinkEntry>(options: {
  load: (idParent: number) => Promise<T[]>
  save: (idParent: number, changes: LinkChanges<T>) => Promise<unknown>
  changed?: (before: T, after: T) => boolean
  listRoute: RouteLocationRaw
  editRoute: (idParent: number) => RouteLocationRaw
  errorMessage: string
}) {
  const router = useRouter()
  const saved = ref<T[]>([]) as Ref<T[]>
  const links = ref<T[]>([]) as Ref<T[]>

  async function loadLinks(idParent: number | undefined) {
    if (idParent === undefined) return
    const rows = await options.load(idParent)
    saved.value = rows
    links.value = rows
  }

  async function saveLinks(idParent: number, isNew: boolean) {
    try {
      await options.save(idParent, diffLinks(saved.value, links.value, options.changed))
      router.push(options.listRoute)
    } catch {
      toast.error(options.errorMessage)
      saved.value = await options.load(idParent).catch(() => saved.value)
      if (isNew) router.replace(options.editRoute(idParent))
    }
  }

  return { links, loadLinks, saveLinks }
}
