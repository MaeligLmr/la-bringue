import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminArtistesView from './AdminArtistesView.vue'
import type { Artiste } from '../../../types/database/artiste'

const { artisteHandler, concertArtisteHandler, likeHandler, toast } = vi.hoisted(() => ({
  artisteHandler: { getAll: vi.fn(), remove: vi.fn() },
  concertArtisteHandler: { getConcertsByArtiste: vi.fn() },
  likeHandler: { countFor: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/artiste', () => ({ artisteHandler }))
vi.mock('../../../handlers/concert-artiste', () => ({ concertArtisteHandler }))
vi.mock('../../../handlers/like', () => ({ likeHandler }))
vi.mock('vue-sonner', () => ({ toast }))

const ARTISTES: Artiste[] = [
  { id_artiste: 3, nom: 'Angèle', photo: null, description: null, categorie: 'Pop' },
  { id_artiste: 1, nom: 'Beyoncé', photo: null, description: null, categorie: 'RnB' },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/artistes', name: 'admin-artistes', component: AdminArtistesView },
      { path: '/admin/artistes/nouvelle', name: 'admin-artiste-nouvelle', component: { template: '<div />' } },
      { path: '/admin/artistes/:id', name: 'admin-artiste', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/artistes')
  await router.isReady()
  const wrapper = mount(AdminArtistesView, { attachTo: document.body, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function button(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper'], label: string, index = 0) {
  return wrapper.findAll('button').filter((b) => b.text() === label)[index]
}

function dialogButton(label: string) {
  return Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent?.trim() === label) as HTMLElement
}

beforeEach(() => {
  vi.clearAllMocks()
  artisteHandler.getAll.mockResolvedValue(ARTISTES.map((artiste) => ({ ...artiste })))
  artisteHandler.remove.mockResolvedValue(undefined)
  likeHandler.countFor.mockResolvedValue(12)
  concertArtisteHandler.getConcertsByArtiste.mockResolvedValue([{ id_concert: 1 }, { id_concert: 2 }])
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminArtistesView', () => {
  it('liste les artistes par ordre alphabétique', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('tbody tr').map((row) => row.find('td').text())).toEqual(['Angèle', 'Beyoncé'])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-artiste-nouvelle')

    await router.push('/admin/artistes')
    await button(wrapper, 'Modifier', 1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/artistes/1')
    wrapper.unmount()
  })

  it('rappelle les likes et les concerts avant de supprimer, puis retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()

    const dialog = document.querySelector('[role="dialog"]')?.textContent
    expect(dialog).toContain('12 personnes ont liké cette artiste.')
    expect(dialog).toContain('Elle sera retirée de 2 concerts.')
    expect(artisteHandler.remove).not.toHaveBeenCalled()

    dialogButton('Supprimer').click()
    await flushPromises()

    expect(artisteHandler.remove).toHaveBeenCalledWith(3)
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(toast.success).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('garde la ligne et affiche une erreur si la suppression échoue', async () => {
    artisteHandler.remove.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    dialogButton('Supprimer').click()
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(toast.error).toHaveBeenCalled()
    wrapper.unmount()
  })
})
