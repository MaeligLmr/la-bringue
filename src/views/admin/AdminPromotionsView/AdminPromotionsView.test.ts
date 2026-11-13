import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminPromotionsView from './AdminPromotionsView.vue'
import type { PromotionAvecFormule } from '../../../handlers/promotion'

const { promotionHandler, toast } = vi.hoisted(() => ({
  promotionHandler: { getPage: vi.fn(), remove: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/promotion', () => ({ promotionHandler }))
vi.mock('vue-sonner', () => ({ toast }))

// Dates fixes très éloignées : la 1re est en cours, la 2e à venir, la 3e terminée.
const PROMOTIONS: PromotionAvecFormule[] = [
  { id_promotion: 4, id_formule: 3, description: 'Early bird', reduction_prc: 20, date_debut: '2000-01-01T00:00:00', date_fin: '2999-01-01T00:00:00', Formule: { titre: 'Pass 3 jours' } },
  { id_promotion: 3, id_formule: 3, description: 'Dernière minute', reduction_prc: 10, date_debut: '2998-01-01T00:00:00', date_fin: '2999-01-01T00:00:00', Formule: { titre: 'Pass 3 jours' } },
  { id_promotion: 1, id_formule: null, description: null, reduction_prc: null, date_debut: '2000-01-01T00:00:00', date_fin: '2000-02-01T00:00:00', Formule: null },
]

async function mountView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/promotions', name: 'admin-promotions', component: AdminPromotionsView },
      { path: '/admin/promotions/nouvelle', name: 'admin-promotion-nouvelle', component: { template: '<div />' } },
      { path: '/admin/promotions/:id', name: 'admin-promotion', component: { template: '<div />' } },
    ],
  })
  router.push('/admin/promotions')
  await router.isReady()
  const wrapper = mount(AdminPromotionsView, { attachTo: document.body, global: { plugins: [router] } })
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
  promotionHandler.getPage.mockResolvedValue({ rows: PROMOTIONS.map((promotion) => ({ ...promotion })), hasMore: false })
  promotionHandler.remove.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('AdminPromotionsView', () => {
  it('liste les promotions avec leur formule, réduction et statut', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.findAll('th').map((th) => th.text())).toEqual(['Promotion', 'Formule', 'Réduction', 'Période', 'Statut', 'Actions'])
    const lignes = wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()))
    expect([lignes[0][0], lignes[0][1], lignes[0][2], lignes[0][4]]).toEqual(['Early bird', 'Pass 3 jours', '−20 %', 'En cours'])
    expect([lignes[1][0], lignes[1][4]]).toEqual(['Dernière minute', 'À venir'])
    expect([lignes[2][0], lignes[2][1], lignes[2][2], lignes[2][4]]).toEqual(['Sans nom', '—', '—', 'Terminée'])
    wrapper.unmount()
  })

  it('mène au formulaire de création et de modification', async () => {
    const { wrapper, router } = await mountView()

    await button(wrapper, 'Ajouter').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('admin-promotion-nouvelle')

    await router.push('/admin/promotions')
    await button(wrapper, 'Modifier', 1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/admin/promotions/3')
    wrapper.unmount()
  })

  it('prévient du retour au prix plein avant de supprimer, puis retire la ligne', async () => {
    const { wrapper } = await mountView()

    await button(wrapper, 'Supprimer', 0).trigger('click')
    await flushPromises()

    const dialog = document.querySelector('[role="dialog"]')?.textContent
    expect(dialog).toContain('Supprimer « Early bird »')
    expect(dialog).toContain('Le prix de « Pass 3 jours » repasse au prix plein sur le site.')

    dialogButton('Supprimer').click()
    await flushPromises()

    expect(promotionHandler.remove).toHaveBeenCalledWith(4)
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(toast.success).toHaveBeenCalledWith('« Early bird » a été supprimée.')
    wrapper.unmount()
  })

  it('garde la ligne et affiche une erreur si la suppression échoue', async () => {
    promotionHandler.remove.mockRejectedValue(new Error('boom'))
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
    expect(promotionHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: '', pageSize: 20 })

    vi.useFakeTimers()
    await wrapper.find('input[type="search"]').setValue('early')
    await vi.advanceTimersByTimeAsync(300)
    vi.useRealTimers()
    await flushPromises()

    expect(promotionHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: 'early', pageSize: 20 })
    wrapper.unmount()
  })
})
