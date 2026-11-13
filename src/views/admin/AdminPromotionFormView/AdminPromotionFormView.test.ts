import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminPromotionFormView from './AdminPromotionFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import type { Promotion } from '../../../types/database/promotion'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { formuleHandler, promotionHandler, toast } = vi.hoisted(() => ({
  formuleHandler: { getAll: vi.fn() },
  promotionHandler: { getById: vi.fn(), create: vi.fn(), update: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/formule', () => ({ formuleHandler }))
vi.mock('../../../handlers/promotion', () => ({ promotionHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast }))

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/promotions', name: 'admin-promotions', component: { template: '<div />' } },
      { path: '/admin/promotions/form', component: AdminPromotionFormView },
    ],
  })
  router.push('/admin/promotions/form')
  await router.isReady()
  const wrapper = mount(AdminPromotionFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as {
    fields: AdminFormField<Promotion>[]
    id?: number
    rules: (values: Record<string, unknown>) => Partial<Record<string, string>>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  formuleHandler.getAll.mockResolvedValue([
    { id_formule: 1, titre: 'Pass 1 jour' },
    { id_formule: 3, titre: 'Pass 3 jours' },
    { id_formule: 5, titre: null },
  ])
})

describe('AdminPromotionFormView', () => {
  it('propose nom, formule, réduction, début et fin, tous obligatoires', async () => {
    const { wrapper } = await mountView()

    expect(formProps(wrapper).fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['description', 'text', true],
      ['id_formule', 'select', true],
      ['reduction_prc', 'number', true],
      ['date_debut', 'datetime', true],
      ['date_fin', 'datetime', true],
    ])
  })

  it('propose les formules existantes, avec un libellé de secours sans titre', async () => {
    const { wrapper } = await mountView()

    expect(formProps(wrapper).fields.find((field) => field.key === 'id_formule')?.options).toEqual([
      { value: '1', label: 'Pass 1 jour' },
      { value: '3', label: 'Pass 3 jours' },
      { value: '5', label: 'Formule 5' },
    ])
  })

  it('reste utilisable (sans formule à choisir) si les formules ne se chargent pas', async () => {
    formuleHandler.getAll.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    expect(formProps(wrapper).fields.find((field) => field.key === 'id_formule')?.options).toEqual([])
    expect(toast.error).toHaveBeenCalledWith('Impossible de charger les formules.')
  })

  it('borne la réduction entre 1 et 100 % côté saisie et côté règles', async () => {
    const { wrapper } = await mountView()
    const { fields, rules } = formProps(wrapper)
    const reduction = fields.find((field) => field.key === 'reduction_prc')

    expect([reduction?.min, reduction?.max]).toEqual([1, 100])
    expect(rules({ reduction_prc: 0 }).reduction_prc).toBe('La réduction doit être comprise entre 1 et 100 %.')
    expect(rules({ reduction_prc: 101 }).reduction_prc).toBe('La réduction doit être comprise entre 1 et 100 %.')
    expect(rules({ reduction_prc: 20 }).reduction_prc).toBeUndefined()
    expect(rules({ reduction_prc: '' }).reduction_prc).toBeUndefined()
  })

  it('bloque une fin qui n’est pas après le début', async () => {
    const { wrapper } = await mountView()
    const { rules } = formProps(wrapper)
    const message = 'La fin doit être après le début.'

    expect(rules({ date_debut: '2026-06-10T09:00', date_fin: '2026-06-10T09:00' }).date_fin).toBe(message)
    expect(rules({ date_debut: '2026-06-10T09:00', date_fin: '2026-06-09T23:00' }).date_fin).toBe(message)
    expect(rules({ date_debut: '2026-06-10T09:00', date_fin: '2026-06-10T09:01' }).date_fin).toBeUndefined()
    // La base renvoie les secondes : elles ne faussent pas la comparaison.
    expect(rules({ date_debut: '2026-06-10T09:00:00', date_fin: '2026-06-10T09:00:30' }).date_fin).toBe(message)
    expect(rules({ date_debut: '', date_fin: '2026-06-10T09:00' }).date_fin).toBeUndefined()
  })

  it('affiche un titre de création ou de modification et passe l’id au formulaire', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvelle promotion')
    expect(formProps(creation.wrapper).id).toBeUndefined()

    const edition = await mountView(4)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier la promotion')
    expect(formProps(edition.wrapper).id).toBe(4)
  })

  it('revient à la liste une fois la promotion enregistrée', async () => {
    const { wrapper, router } = await mountView()

    wrapper.findComponent(AdminForm).vm.$emit('saved', {})
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-promotions')
  })
})
