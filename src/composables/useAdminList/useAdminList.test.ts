import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { byNom, REMOVE_ERROR_MESSAGE, useAdminList } from './useAdminList'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('vue-sonner', () => ({ toast }))

interface Row {
  id: number
  nom: string | null
}

const ROWS: Row[] = [
  { id: 1, nom: 'Beyoncé' },
  { id: 2, nom: 'Angèle' },
]

// Le composable charge au montage : on l'utilise dans un composant de test.
async function mountList(options: Partial<Parameters<typeof useAdminList<Row>>[0]> = {}) {
  let list!: ReturnType<typeof useAdminList<Row>>
  mount(
    defineComponent({
      setup() {
        list = useAdminList<Row>({
          load: vi.fn().mockResolvedValue(ROWS),
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
  return list
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAdminList', () => {
  it('charge la liste au montage', async () => {
    const list = await mountList()

    expect(list.items.value).toEqual(ROWS)
    expect(list.loading.value).toBe(false)
  })

  it('signale un chargement impossible', async () => {
    const list = await mountList({ load: vi.fn().mockRejectedValue(new Error('boom')) })

    expect(list.items.value).toEqual([])
    expect(list.loading.value).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('Chargement impossible.')
  })

  it('supprime une ligne et le confirme', async () => {
    const remove = vi.fn().mockResolvedValue(undefined)
    const list = await mountList({ remove })

    await list.remove(ROWS[0])

    expect(remove).toHaveBeenCalledWith(ROWS[0])
    expect(list.items.value).toEqual([ROWS[1]])
    expect(toast.success).toHaveBeenCalledWith('Beyoncé supprimée.')
  })

  it('garde la ligne si la suppression échoue', async () => {
    const list = await mountList({ remove: vi.fn().mockRejectedValue(new Error('boom')) })

    await list.remove(ROWS[0])

    expect(list.items.value).toEqual(ROWS)
    expect(toast.error).toHaveBeenCalledWith(REMOVE_ERROR_MESSAGE)
  })
})

describe('byNom', () => {
  it('trie par nom sans modifier la liste d’origine, les noms vides en premier', () => {
    const rows = [...ROWS, { id: 3, nom: null }]

    expect(byNom(rows).map((row) => row.id)).toEqual([3, 2, 1])
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3])
  })
})
