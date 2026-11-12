import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminIntervenantesView from './AdminIntervenantesView.vue'
import type { Conferenciere } from '../../../types/database/conferenciere'

const { conferenciereHandler, participationHandler, toast } = vi.hoisted(() => ({
  conferenciereHandler: { getAll: vi.fn(), remove: vi.fn() },
  participationHandler: { getConferencesByConferenciere: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/conferenciere', () => ({ conferenciereHandler }))
vi.mock('../../../handlers/participation', () => ({ participationHandler }))
vi.mock('vue-sonner', () => ({ toast }))

const INTERVENANTES: Conferenciere[] = [
  { id_conferenciere: 2, nom: 'Rokhaya Diallo', description: 'Journaliste', photo: null },
  { id_conferenciere: 1, nom: 'Alice Coffin', description: null, photo: null },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/intervenantes', name: 'admin-intervenantes', component: AdminIntervenantesView },
      { path: '/admin/intervenantes/nouvelle', name: 'admin-intervenante-nouvelle', component: { template: '<div />' } },
      { path: '/admin/intervenantes/:id', name: 'admin-intervenante', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/intervenantes')
  await router.isReady()
  const wrapper = mount(AdminIntervenantesView, { attachTo: document.body, global: { plugins: [router] } })
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
  conferenciereHandler.getAll.mockResolvedValue(INTERVENANTES.map((intervenante) => ({ ...intervenante })))
  conferenciereHandler.remove.mockResolvedValue(undefined)
  participationHandler.getConferencesByConferenciere.mockResolvedValue([{ id_conference: 1 }, { id_conference: 2 }])
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminIntervenantesView', () => {
  it('liste les intervenantes par ordre alphabétique, avec leur description', async () => {
    const { wrapper } = await mountView()

    expect(rows(wrapper)).toEqual([
      ['Alice Coffin', '—'],
      ['Rokhaya Diallo', 'Journaliste'],
    ])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-intervenante-nouvelle')

    await router.push('/admin/intervenantes')
    await button(wrapper, 'Modifier', 1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/intervenantes/2')
    wrapper.unmount()
  })

  it('rappelle les conférences concernées avant de supprimer, puis retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Elle sera retirée de 2 conférences.')
    expect(conferenciereHandler.remove).not.toHaveBeenCalled()

    dialogButton('Supprimer').click()
    await flushPromises()

    expect(conferenciereHandler.remove).toHaveBeenCalledWith(1)
    expect(rows(wrapper)).toEqual([['Rokhaya Diallo', 'Journaliste']])
    expect(toast.success).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('garde la ligne et affiche une erreur si la suppression échoue', async () => {
    conferenciereHandler.remove.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    dialogButton('Supprimer').click()
    await flushPromises()

    expect(rows(wrapper)).toHaveLength(2)
    expect(toast.error).toHaveBeenCalled()
    wrapper.unmount()
  })
})
