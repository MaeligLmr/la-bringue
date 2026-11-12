import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminConferencesView from './AdminConferencesView.vue'

const { conferenceHandler, likeHandler, toast } = vi.hoisted(() => ({
  conferenceHandler: { getAllDetailed: vi.fn(), remove: vi.fn() },
  likeHandler: { countFor: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/conference', () => ({ conferenceHandler }))
vi.mock('../../../handlers/like', () => ({ likeHandler }))
vi.mock('vue-sonner', () => ({ toast }))

const CONFERENCES = [
  {
    id_conference: 1,
    titre: 'Le féminisme en 2026',
    photo: null,
    theme: 'Féminisme',
    description: null,
    jour: '2026-08-29',
    heure_debut: '14:00:00',
    heure_fin: '15:30:00',
    Participation: [
      { id_participation: 10, id_conferenciere: 2, id_conference: 1, Conferenciere: { id_conferenciere: 2, nom: 'Rokhaya Diallo' } },
      { id_participation: 11, id_conferenciere: 1, id_conference: 1, Conferenciere: { id_conferenciere: 1, nom: 'Alice Coffin' } },
    ],
  },
  { id_conference: 2, titre: null, photo: null, theme: null, description: null, jour: null, heure_debut: null, heure_fin: null, Participation: [] },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/conferences', name: 'admin-conferences', component: AdminConferencesView },
      { path: '/admin/conferences/nouvelle', name: 'admin-conference-nouvelle', component: { template: '<div />' } },
      { path: '/admin/conferences/:id', name: 'admin-conference', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/conferences')
  await router.isReady()
  const wrapper = mount(AdminConferencesView, { attachTo: document.body, global: { plugins: [router] } })
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
  conferenceHandler.getAllDetailed.mockResolvedValue(CONFERENCES)
  conferenceHandler.remove.mockResolvedValue(undefined)
  likeHandler.countFor.mockResolvedValue(5)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminConferencesView', () => {
  it('affiche titre, intervenantes, jour, horaire et thème de chaque conférence', async () => {
    const { wrapper } = await mountView()

    expect(rows(wrapper)).toEqual([
      ['Le féminisme en 2026', 'Rokhaya Diallo, Alice Coffin', 'Samedi 29 août', '14h00 – 15h30', 'Féminisme'],
      ['Sans titre', '—', '—', '—', '—'],
    ])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-conference-nouvelle')

    await router.push('/admin/conferences')
    await button(wrapper, 'Modifier', 0).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/conferences/1')
    wrapper.unmount()
  })

  it('rappelle les likes avant de supprimer, puis retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    const dialog = document.querySelector('[role="dialog"]')?.textContent
    expect(likeHandler.countFor).toHaveBeenCalledWith({ type: 'conference', id: 1 })
    expect(dialog).toContain('5 personnes ont liké cette conférence.')
    expect(dialog).toContain('Les intervenantes restent dans la liste des intervenantes.')

    const confirm = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent?.trim() === 'Supprimer') as HTMLElement
    confirm.click()
    await flushPromises()

    expect(conferenceHandler.remove).toHaveBeenCalledWith(1)
    expect(rows(wrapper)).toHaveLength(1)
    expect(toast.success).toHaveBeenCalled()
    wrapper.unmount()
  })
})
