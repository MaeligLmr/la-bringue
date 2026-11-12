import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminArtisteFormView from './AdminArtisteFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import type { Artiste } from '../../../types/database/artiste'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { artisteHandler } = vi.hoisted(() => ({
  artisteHandler: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

vi.mock('../../../handlers/artiste', () => ({ artisteHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const ARTISTES: Artiste[] = [
  { id_artiste: 1, nom: 'Beyoncé', photo: null, description: null, categorie: 'RnB' },
  { id_artiste: 2, nom: 'Aya Nakamura', photo: null, description: null, categorie: null },
  { id_artiste: 3, nom: 'Angèle', photo: null, description: null, categorie: 'Pop' },
  { id_artiste: 4, nom: 'Dua Lipa', photo: null, description: null, categorie: 'Pop' },
]

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/artistes', name: 'admin-artistes', component: { template: '<div />' } },
      { path: '/admin/artistes/form', component: AdminArtisteFormView },
    ],
  })
  router.push('/admin/artistes/form')
  await router.isReady()
  const wrapper = mount(AdminArtisteFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as { fields: AdminFormField<Artiste>[]; id?: number }
}

function fieldsOf(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return formProps(wrapper).fields
}

beforeEach(() => {
  vi.clearAllMocks()
  artisteHandler.getAll.mockResolvedValue(ARTISTES)
  artisteHandler.getById.mockResolvedValue(ARTISTES[2])
})

describe('AdminArtisteFormView', () => {
  it('propose nom, photo, description et catégorie, le nom étant obligatoire', async () => {
    const { wrapper } = await mountView()

    const fields = fieldsOf(wrapper)
    expect(fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['nom', 'text', true],
      ['photo', 'image', false],
      ['description', 'textarea', false],
      ['categorie', 'select', false],
    ])
    expect(fields[1].folder).toBe('programmation')
  })

  it('propose les catégories déjà utilisées, sans doublon, triées', async () => {
    const { wrapper } = await mountView()

    expect(fieldsOf(wrapper)[3].options).toEqual([
      { value: '', label: 'Aucune' },
      { value: 'Pop', label: 'Pop' },
      { value: 'RnB', label: 'RnB' },
    ])
  })

  it('affiche un titre de création ou de modification et passe l’id au formulaire', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvelle artiste')
    expect(formProps(creation.wrapper).id).toBeUndefined()

    const edition = await mountView(3)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier l’artiste')
    expect(formProps(edition.wrapper).id).toBe(3)
  })

  it('revient à la liste une fois l’artiste enregistrée', async () => {
    const { wrapper, router } = await mountView()

    wrapper.findComponent(AdminForm).vm.$emit('saved', ARTISTES[0])
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-artistes')
  })

  it('reste utilisable si les catégories ne peuvent pas être chargées', async () => {
    artisteHandler.getAll.mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountView()

    expect(fieldsOf(wrapper)[3].options).toEqual([{ value: '', label: 'Aucune' }])
  })
})
