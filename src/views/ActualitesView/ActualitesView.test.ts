import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { toast } from 'vue-sonner'
import ActualitesView from './ActualitesView.vue'
import { actualiteHandler } from '../../handlers/actualite'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

const ACTUALITES = [
  { id_actualite: 2, titre: 'Programmation dévoilée', description: 'Les artistes', date_publication: '2026-05-02', photo: null },
  { id_actualite: 1, titre: 'Billetterie ouverte', description: 'Les places', date_publication: '2026-04-01', photo: null },
]

vi.mock('../../handlers/actualite', () => ({
  actualiteHandler: { getPage: vi.fn(async () => ({ rows: ACTUALITES, hasMore: false })) },
}))

async function mountActualites() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: ActualitesView },
      { path: '/actualites/:id', name: 'actualite', component: { render: () => null } },
    ],
  })
  router.push('/')
  await router.isReady()
  const wrapper = mount(ActualitesView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

const displayedNames = (wrapper: Awaited<ReturnType<typeof mountActualites>>) =>
  wrapper.findAll('.content-card__nom').map((node) => node.text())

describe('ActualitesView', () => {
  it('affiche les actualités dans l’ordre renvoyé par Supabase', async () => {
    const wrapper = await mountActualites()

    expect(actualiteHandler.getPage).toHaveBeenCalledWith({ offset: 0, search: '' })
    expect(displayedNames(wrapper)).toEqual(['Programmation dévoilée', 'Billetterie ouverte'])

    wrapper.unmount()
  })

  it('affiche un toast si les actualités ne se chargent pas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(actualiteHandler.getPage).mockRejectedValueOnce(new Error('[Actualite] permission denied'))
    vi.mocked(toast.error).mockClear()

    const wrapper = await mountActualites()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger les actualités.')
    expect(displayedNames(wrapper)).toEqual([])

    wrapper.unmount()
  })
})
