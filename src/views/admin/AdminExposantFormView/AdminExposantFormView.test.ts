import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminExposantFormView from './AdminExposantFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import type { Exposant } from '../../../types/database/exposant'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { exposantHandler } = vi.hoisted(() => ({
  exposantHandler: { getCategories: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

vi.mock('../../../handlers/exposant', () => ({ exposantHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const EXPOSANTS: Exposant[] = [
  { id_exposant: 1, nom: 'Biocoop', photo: null, description: null, categorie: 'Alimentation' },
  { id_exposant: 2, nom: 'Zéro Déchet', photo: null, description: null, categorie: 'Écologie' },
  { id_exposant: 3, nom: 'Maison Fleur', photo: null, description: null, categorie: 'Écologie' },
]

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/exposants', name: 'admin-exposants', component: { template: '<div />' } },
      { path: '/admin/exposants/form', component: AdminExposantFormView },
    ],
  })
  router.push('/admin/exposants/form')
  await router.isReady()
  const wrapper = mount(AdminExposantFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as { fields: AdminFormField<Exposant>[]; id?: number }
}

function fieldsOf(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return formProps(wrapper).fields
}

beforeEach(() => {
  vi.clearAllMocks()
  exposantHandler.getCategories.mockResolvedValue(['Écologie', 'Alimentation', 'Écologie'])
  exposantHandler.getById.mockResolvedValue(EXPOSANTS[2])
})

describe('AdminExposantFormView', () => {
  it('propose nom, photo, description et catégorie, le nom étant obligatoire', async () => {
    const { wrapper } = await mountView()

    const fields = fieldsOf(wrapper)
    expect(fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['nom', 'text', true],
      ['photo', 'image', false],
      ['description', 'textarea', false],
      ['categorie', 'select', false],
    ])
    expect(fields[1].folder).toBe('exposants')
  })

  it('propose les catégories déjà utilisées, sans doublon, triées', async () => {
    const { wrapper } = await mountView()

    expect(fieldsOf(wrapper)[3].options).toEqual([
      { value: '', label: 'Aucune' },
      { value: 'Alimentation', label: 'Alimentation' },
      { value: 'Écologie', label: 'Écologie' },
    ])
  })

  it('affiche un titre de création ou de modification et passe l’id au formulaire', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvel exposant')
    expect(formProps(creation.wrapper).id).toBeUndefined()

    const edition = await mountView(3)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier l’exposant')
    expect(formProps(edition.wrapper).id).toBe(3)
  })

  it('revient à la liste une fois l’exposant enregistré', async () => {
    const { wrapper, router } = await mountView()

    wrapper.findComponent(AdminForm).vm.$emit('saved', EXPOSANTS[0])
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-exposants')
  })

  it('reste utilisable si les catégories ne peuvent pas être chargées', async () => {
    exposantHandler.getCategories.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    expect(fieldsOf(wrapper)[3].options).toEqual([{ value: '', label: 'Aucune' }])
  })
})
