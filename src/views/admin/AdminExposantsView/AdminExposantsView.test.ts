import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminExposantsView from './AdminExposantsView.vue'
import type { Exposant } from '../../../types/database/exposant'

const { exposantHandler, toast } = vi.hoisted(() => ({
  exposantHandler: { getAll: vi.fn(), remove: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/exposant', () => ({ exposantHandler }))
vi.mock('vue-sonner', () => ({ toast }))

const EXPOSANTS: Exposant[] = [
  { id_exposant: 3, nom: 'Biocoop', photo: null, description: null, categorie: 'Alimentation' },
  { id_exposant: 1, nom: 'Zéro Déchet', photo: null, description: null, categorie: 'Écologie' },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/exposants', name: 'admin-exposants', component: AdminExposantsView },
      { path: '/admin/exposants/nouveau', name: 'admin-exposant-nouveau', component: { template: '<div />' } },
      { path: '/admin/exposants/:id', name: 'admin-exposant', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/exposants')
  await router.isReady()
  const wrapper = mount(AdminExposantsView, { attachTo: document.body, global: { plugins: [router] } })
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
  exposantHandler.getAll.mockResolvedValue(EXPOSANTS.map((exposant) => ({ ...exposant })))
  exposantHandler.remove.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminExposantsView', () => {
  it('liste les exposants par ordre alphabétique', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('tbody tr').map((row) => row.find('td').text())).toEqual(['Biocoop', 'Zéro Déchet'])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-exposant-nouveau')

    await router.push('/admin/exposants')
    await button(wrapper, 'Modifier', 1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/exposants/1')
    wrapper.unmount()
  })

  it('demande confirmation avant de supprimer, puis retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Supprimer « Biocoop »')
    expect(exposantHandler.remove).not.toHaveBeenCalled()

    dialogButton('Supprimer').click()
    await flushPromises()

    expect(exposantHandler.remove).toHaveBeenCalledWith(3)
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(toast.success).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('garde la ligne et affiche une erreur si la suppression échoue', async () => {
    exposantHandler.remove.mockRejectedValue(new Error('boom'))
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
