import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminActualitesView from './AdminActualitesView.vue'
import type { Actualite } from '../../../types/database/actualite'

const { actualiteHandler, toast } = vi.hoisted(() => ({
  actualiteHandler: { getPage: vi.fn(), remove: vi.fn(), update: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/actualite', () => ({ actualiteHandler }))
vi.mock('vue-sonner', () => ({ toast }))

// Déjà triées de la plus récente à la plus ancienne : le tri est fait côté serveur (getPage).
// Dates fixes très éloignées : la 1re est en attente, la 2e publiée, la 3e sans date.
const ACTUALITES: Actualite[] = [
  { id_actualite: 8, titre: 'Annonce du line-up', description: null, date_publication: '2999-01-01T00:00:00+00:00', photo: null },
  { id_actualite: 5, titre: 'Billetterie ouverte', description: null, date_publication: '2026-06-02T10:00:00+00:00', photo: null },
  { id_actualite: 2, titre: null, description: null, date_publication: null, photo: null },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/actualites', name: 'admin-actualites', component: AdminActualitesView },
      { path: '/admin/actualites/nouvelle', name: 'admin-actualite-nouvelle', component: { template: '<div />' } },
      { path: '/admin/actualites/:id', name: 'admin-actualite', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/actualites')
  await router.isReady()
  const wrapper = mount(AdminActualitesView, { attachTo: document.body, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function rows(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findAll('tbody tr').map((row) => row.findAll('td').slice(0, -1).map((cell) => cell.text()))
}

function button(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper'], label: string, index = 0) {
  return wrapper.findAll('button').filter((b) => b.text() === label)[index]
}

function dialogButton(label: string) {
  return Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent?.trim() === label) as HTMLElement
}

beforeEach(() => {
  vi.clearAllMocks()
  actualiteHandler.getPage.mockResolvedValue({ rows: ACTUALITES.map((actualite) => ({ ...actualite })), hasMore: false })
  actualiteHandler.remove.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminActualitesView', () => {
  it('liste les actualités avec leur date et leur statut, dans l’ordre du serveur', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Titre', 'Publiée le', 'Statut', 'Actions'])
    expect(rows(wrapper)).toEqual([
      ['Annonce du line-up', '1 janvier 2999', 'En attente'],
      ['Billetterie ouverte', '2 juin 2026', 'Publiée'],
      ['Sans titre', '—', 'En attente'],
    ])
    wrapper.unmount()
  })

  it('lit aussi les actualités en attente', async () => {
    const { wrapper } = await mountView()

    expect(actualiteHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: '', pageSize: 20, includeUnpublished: true })
    wrapper.unmount()
  })

  it('propose « Publier maintenant » aux seules actualités en attente', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('button').filter((b) => b.text() === 'Publier maintenant')).toHaveLength(2)
    wrapper.unmount()
  })

  it('« Publier maintenant » date l’actualité d’aujourd’hui et la passe en « Publiée »', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 13, 12))
    const updated = { ...ACTUALITES[0], date_publication: '2026-11-13' }
    actualiteHandler.update.mockResolvedValue(updated)
    const { wrapper } = await mountView()

    await button(wrapper, 'Publier maintenant', 0).trigger('click')
    await flushPromises()
    vi.useRealTimers()

    expect(actualiteHandler.update).toHaveBeenCalledWith(8, { date_publication: '2026-11-13' })
    expect(rows(wrapper)[0]).toEqual(['Annonce du line-up', '13 novembre 2026', 'Publiée'])
    expect(wrapper.findAll('button').filter((b) => b.text() === 'Publier maintenant')).toHaveLength(1)
    expect(toast.success).toHaveBeenCalledWith('« Annonce du line-up » est publiée.')
    wrapper.unmount()
  })

  it('garde l’actualité en attente et prévient si la publication échoue', async () => {
    actualiteHandler.update.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    await button(wrapper, 'Publier maintenant', 0).trigger('click')
    await flushPromises()

    expect(rows(wrapper)[0][2]).toBe('En attente')
    expect(toast.error).toHaveBeenCalledWith('La publication a échoué. Réessaie plus tard.')
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-actualite-nouvelle')

    await router.push('/admin/actualites')
    await button(wrapper, 'Modifier', 1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/actualites/5')
    wrapper.unmount()
  })

  it('demande confirmation avant de supprimer, puis retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 1).trigger('click')
    await flushPromises()

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Supprimer « Billetterie ouverte »')
    expect(actualiteHandler.remove).not.toHaveBeenCalled()

    dialogButton('Supprimer').click()
    await flushPromises()

    expect(actualiteHandler.remove).toHaveBeenCalledWith(5)
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(toast.success).toHaveBeenCalledWith('« Billetterie ouverte » a été supprimée.')
    wrapper.unmount()
  })

  it('garde la ligne et affiche une erreur si la suppression échoue', async () => {
    actualiteHandler.remove.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    dialogButton('Supprimer').click()
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(toast.error).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('lit la première page par 20 et cherche côté serveur après la frappe', async () => {
    const { wrapper } = await mountView()
    expect(actualiteHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: '', pageSize: 20, includeUnpublished: true })

    vi.useFakeTimers()
    await wrapper.find('input[type="search"]').setValue('billetterie')
    await vi.advanceTimersByTimeAsync(300)
    vi.useRealTimers()
    await flushPromises()

    expect(actualiteHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: 'billetterie', pageSize: 20, includeUnpublished: true })
    wrapper.unmount()
  })
})
