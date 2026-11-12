import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminIntervenanteFormView from './AdminIntervenanteFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import type { Conferenciere } from '../../../types/database/conferenciere'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { conferenciereHandler } = vi.hoisted(() => ({
  conferenciereHandler: { getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

vi.mock('../../../handlers/conferenciere', () => ({ conferenciereHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const ROKHAYA: Conferenciere = { id_conferenciere: 2, nom: 'Rokhaya Diallo', description: 'Journaliste', photo: null }

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/intervenantes', name: 'admin-intervenantes', component: { template: '<div />' } },
      { path: '/admin/intervenantes/form', component: AdminIntervenanteFormView },
    ],
  })
  router.push('/admin/intervenantes/form')
  await router.isReady()
  const wrapper = mount(AdminIntervenanteFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as { fields: AdminFormField<Conferenciere>[]; id?: number }
}

beforeEach(() => {
  vi.clearAllMocks()
  conferenciereHandler.getById.mockResolvedValue(ROKHAYA)
})

describe('AdminIntervenanteFormView', () => {
  it('propose nom, photo et description, le nom étant obligatoire', async () => {
    const { wrapper } = await mountView()

    const fields = formProps(wrapper).fields
    expect(fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['nom', 'text', true],
      ['photo', 'image', false],
      ['description', 'textarea', false],
    ])
    expect(fields[1].folder).toBe('conferencieres')
  })

  it('affiche un titre de création ou de modification et passe l’id au formulaire', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvelle intervenante')
    expect(formProps(creation.wrapper).id).toBeUndefined()

    const edition = await mountView(2)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier l’intervenante')
    expect(formProps(edition.wrapper).id).toBe(2)
  })

  it('revient à la liste une fois l’intervenante enregistrée', async () => {
    const { wrapper, router } = await mountView()

    wrapper.findComponent(AdminForm).vm.$emit('saved', ROKHAYA)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-intervenantes')
  })
})
