import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { useAdminLinks } from './useAdminLinks'
import type { LinkEntry } from '../../lib/links/links'

const { toast } = vi.hoisted(() => ({ toast: { error: vi.fn() } }))
vi.mock('vue-sonner', () => ({ toast }))

const ALICE: LinkEntry = { id: 1, nom: 'Alice Coffin' }
const ROKHAYA: LinkEntry = { id: 2, nom: 'Rokhaya Diallo' }

// Le composable utilise le router : on le monte dans un composant de test.
type Load = (idParent: number) => Promise<LinkEntry[]>
type Save = (idParent: number, changes: unknown) => Promise<unknown>

async function setup(options: { save?: Save; load?: Load } = {}) {
  const load = vi.fn<Load>(options.load ?? (async () => [ALICE]))
  const save = vi.fn<Save>(options.save ?? (async () => undefined))
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/form', component: { template: '<div />' } },
      { path: '/liste', name: 'liste', component: { template: '<div />' } },
      { path: '/element/:id', name: 'element', component: { template: '<div />' } },
    ],
  })
  router.push('/form')
  await router.isReady()

  let links!: ReturnType<typeof useAdminLinks<LinkEntry>>
  mount(
    defineComponent({
      setup() {
        links = useAdminLinks<LinkEntry>({
          load,
          save,
          listRoute: { name: 'liste' },
          editRoute: (id) => ({ name: 'element', params: { id } }),
          errorMessage: 'Liens non enregistrés.',
        })
        return () => null
      },
    }),
    { global: { plugins: [router] } }
  )
  return { links, load, save, router }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAdminLinks', () => {
  it('ne charge rien pour un nouvel élément, charge les liens d’un élément existant', async () => {
    const { links, load } = await setup()

    await links.loadLinks(undefined)
    expect(load).not.toHaveBeenCalled()

    await links.loadLinks(5)
    expect(load).toHaveBeenCalledWith(5)
    expect(links.links.value).toEqual([ALICE])
  })

  it('n’envoie que les changements, puis revient à la liste', async () => {
    const { links, save, router } = await setup()
    await links.loadLinks(5)

    links.links.value = [ROKHAYA]
    await links.saveLinks(5, false)
    await flushPromises()

    expect(save).toHaveBeenCalledWith(5, { added: [ROKHAYA], updated: [], removed: [ALICE] })
    expect(router.currentRoute.value.name).toBe('liste')
  })

  it('en cas d’échec, prévient, recharge l’état réel et reste sur l’élément créé', async () => {
    const { links, load, router } = await setup({
      load: async () => [],
      save: async () => {
        throw new Error('boom')
      },
    })

    links.links.value = [ALICE]
    await links.saveLinks(7, true)
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Liens non enregistrés.')
    expect(load).toHaveBeenCalledWith(7)
    expect(links.links.value).toEqual([ALICE])
    expect(router.currentRoute.value.fullPath).toBe('/element/7')
  })
})
