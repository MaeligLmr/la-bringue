import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminConcertsView from './AdminConcertsView.vue'

const { concertHandler, toast } = vi.hoisted(() => ({
  concertHandler: { getAllDetailed: vi.fn(), remove: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/concert', () => ({ concertHandler }))
vi.mock('vue-sonner', () => ({ toast }))

const CONCERTS = [
  {
    id_concert: 1,
    id_scene: 1,
    jour: '2026-08-29',
    heure_debut: '21:00:00',
    heure_fin: '22:30:00',
    Scene: { id_scene: 1, nom: 'Chrome' },
    ConcertArtiste: [
      { id_artiste: 1, id_concert: 1, artiste_annonce: true, featuring: false, Artiste: { id_artiste: 1, nom: 'Aya Nakamura', photo: null, categorie: null } },
      { id_artiste: 2, id_concert: 1, artiste_annonce: true, featuring: true, Artiste: { id_artiste: 2, nom: 'Angèle', photo: null, categorie: null } },
    ],
  },
  { id_concert: 2, id_scene: null, jour: null, heure_debut: null, heure_fin: null, Scene: null, ConcertArtiste: [] },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/concerts', name: 'admin-concerts', component: AdminConcertsView },
      { path: '/admin/concerts/nouveau', name: 'admin-concert-nouveau', component: { template: '<div />' } },
      { path: '/admin/concerts/:id', name: 'admin-concert', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/concerts')
  await router.isReady()
  const wrapper = mount(AdminConcertsView, { attachTo: document.body, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function rows(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findAll('tbody tr').map((row) => row.findAll('td').slice(0, -1).map((cell) => cell.text()))
}

function button(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper'], label: string, index = 0) {
  return wrapper.findAll('button').filter((b) => b.text() === label)[index]
}

beforeEach(() => {
  vi.clearAllMocks()
  concertHandler.getAllDetailed.mockResolvedValue(CONCERTS)
  concertHandler.remove.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminConcertsView', () => {
  it('affiche artistes, jour, horaire et scène de chaque concert', async () => {
    const { wrapper } = await mountView()

    expect(rows(wrapper)).toEqual([
      ['Aya Nakamura, Angèle', 'Samedi 29 août', '21h00 – 22h30', 'Chrome'],
      ['Aucune artiste', '—', '—', '—'],
    ])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-concert-nouveau')

    await router.push('/admin/concerts')
    await button(wrapper, 'Modifier', 0).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/concerts/1')
    wrapper.unmount()
  })

  it('supprime le concert après confirmation et retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Les artistes restent dans la liste des artistes.')

    const confirm = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent?.trim() === 'Supprimer') as HTMLElement
    confirm.click()
    await flushPromises()

    expect(concertHandler.remove).toHaveBeenCalledWith(1)
    expect(rows(wrapper)).toHaveLength(1)
    expect(toast.success).toHaveBeenCalled()
    wrapper.unmount()
  })
})
