import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminFormulesView from './AdminFormulesView.vue'
import type { Formule } from '../../../types/database/formule'

const { formuleHandler, promotionHandler, toast } = vi.hoisted(() => ({
  formuleHandler: { getPage: vi.fn(), remove: vi.fn() },
  promotionHandler: { getByFormule: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/formule', () => ({ formuleHandler }))
vi.mock('../../../handlers/promotion', () => ({ promotionHandler }))
vi.mock('vue-sonner', () => ({ toast }))

const BASE: Formule = {
  id_formule: 1,
  titre: null,
  description: null,
  jour_debut: null,
  jour_fin: null,
  prix: null,
  lien_shotgun: null,
  nbr_places_total: null,
  nbr_places_restantes: null,
  homepage: false,
  nb_jours: null,
}

// Déjà triées par jour de début : le tri est fait côté serveur (getPage).
const FORMULES: Formule[] = [
  { ...BASE, id_formule: 3, titre: 'Pass 3 jours', jour_debut: '2026-08-28', jour_fin: '2026-08-30', prix: 80, nbr_places_total: 500, nbr_places_restantes: 120, homepage: true },
  { ...BASE, id_formule: 1, titre: null },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/billetterie', name: 'admin-formules', component: AdminFormulesView },
      { path: '/admin/billetterie/nouvelle', name: 'admin-formule-nouvelle', component: { template: '<div />' } },
      { path: '/admin/billetterie/:id', name: 'admin-formule', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/billetterie')
  await router.isReady()
  const wrapper = mount(AdminFormulesView, { attachTo: document.body, global: { plugins: [router] } })
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
  formuleHandler.getPage.mockResolvedValue({ rows: FORMULES.map((formule) => ({ ...formule })), hasMore: false })
  formuleHandler.remove.mockResolvedValue(undefined)
  promotionHandler.getByFormule.mockResolvedValue([])
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminFormulesView', () => {
  it('liste les formules avec leurs dates, prix, places et présence à l’accueil', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Formule', 'Dates', 'Prix', 'Places restantes', 'Accueil', 'Actions'])
    const [premiere, vide] = rows(wrapper)
    expect(premiere[0]).toBe('Pass 3 jours')
    expect(premiere[1]).toBe('du 28 au 30 août')
    expect(premiere[2].replace(/\s/g, ' ')).toBe('80 €')
    expect(premiere[3]).toBe('120 / 500')
    expect(premiere[4]).toBe('Oui')
    expect(vide).toEqual(['Sans titre', '—', '—', '—', 'Non'])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-formule-nouvelle')

    await router.push('/admin/billetterie')
    await button(wrapper, 'Modifier', 1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/billetterie/1')
    wrapper.unmount()
  })

  it('rappelle les promotions liées avant de supprimer, puis retire la ligne', async () => {
    promotionHandler.getByFormule.mockResolvedValue([{ id_promotion: 1 }, { id_promotion: 2 }])
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()

    expect(promotionHandler.getByFormule).toHaveBeenCalledWith(3)
    const dialog = document.querySelector('[role="dialog"]')?.textContent
    expect(dialog).toContain('Supprimer « Pass 3 jours »')
    expect(dialog).toContain('2 promotions sont liées à cette formule.')
    expect(formuleHandler.remove).not.toHaveBeenCalled()

    dialogButton('Supprimer').click()
    await flushPromises()

    expect(formuleHandler.remove).toHaveBeenCalledWith(3)
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(toast.success).toHaveBeenCalledWith('« Pass 3 jours » a été supprimée.')
    wrapper.unmount()
  })

  it('garde la ligne et affiche une erreur si la suppression échoue', async () => {
    formuleHandler.remove.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()
    dialogButton('Supprimer').click()
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(toast.error).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('lit la première page par 20 et cherche côté serveur après la frappe', async () => {
    const { wrapper } = await mountView()
    expect(formuleHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: '', pageSize: 20 })

    vi.useFakeTimers()
    await wrapper.find('input[type="search"]').setValue('pass')
    await vi.advanceTimersByTimeAsync(300)
    vi.useRealTimers()
    await flushPromises()

    expect(formuleHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: 'pass', pageSize: 20 })
    wrapper.unmount()
  })
})
