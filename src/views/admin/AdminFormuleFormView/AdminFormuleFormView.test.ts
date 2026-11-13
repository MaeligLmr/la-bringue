import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminFormuleFormView from './AdminFormuleFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import type { Formule } from '../../../types/database/formule'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { formuleHandler } = vi.hoisted(() => ({
  formuleHandler: { getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

vi.mock('../../../handlers/formule', () => ({ formuleHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/billetterie', name: 'admin-formules', component: { template: '<div />' } },
      { path: '/admin/billetterie/form', component: AdminFormuleFormView },
    ],
  })
  router.push('/admin/billetterie/form')
  await router.isReady()
  const wrapper = mount(AdminFormuleFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as {
    fields: AdminFormField<Formule>[]
    id?: number
    rules: (values: Record<string, unknown>) => Partial<Record<string, string>>
  }
}

describe('AdminFormuleFormView', () => {
  it('propose les champs d’une formule, avec titre, premier jour et prix obligatoires', async () => {
    const { wrapper } = await mountView()

    expect(formProps(wrapper).fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['titre', 'text', true],
      ['description', 'textarea', false],
      ['jour_debut', 'date', true],
      ['jour_fin', 'date', false],
      ['nb_jours', 'text', false],
      ['prix', 'number', true],
      ['lien_shotgun', 'text', false],
      ['nbr_places_total', 'number', false],
      ['nbr_places_restantes', 'number', false],
      ['homepage', 'checkbox', false],
    ])
  })

  it('affiche un titre de création ou de modification et passe l’id au formulaire', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvelle formule')
    expect(formProps(creation.wrapper).id).toBeUndefined()

    const edition = await mountView(3)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier la formule')
    expect(formProps(edition.wrapper).id).toBe(3)
  })

  it('bloque un dernier jour avant le premier', async () => {
    const { wrapper } = await mountView()
    const { rules } = formProps(wrapper)

    expect(rules({ jour_debut: '2026-08-30', jour_fin: '2026-08-28', nbr_places_total: '', nbr_places_restantes: '' }).jour_fin).toBe(
      'Le dernier jour doit être après le premier.'
    )
    expect(rules({ jour_debut: '2026-08-28', jour_fin: '2026-08-30', nbr_places_total: '', nbr_places_restantes: '' }).jour_fin).toBeUndefined()
    expect(rules({ jour_debut: '2026-08-28', jour_fin: '', nbr_places_total: '', nbr_places_restantes: '' }).jour_fin).toBeUndefined()
  })

  it('bloque des places restantes supérieures au total', async () => {
    const { wrapper } = await mountView()
    const { rules } = formProps(wrapper)
    const base = { jour_debut: '', jour_fin: '' }

    expect(rules({ ...base, nbr_places_total: 100, nbr_places_restantes: 150 }).nbr_places_restantes).toBe(
      'Les places restantes ne peuvent pas dépasser le total.'
    )
    expect(rules({ ...base, nbr_places_total: 100, nbr_places_restantes: 100 }).nbr_places_restantes).toBeUndefined()
    expect(rules({ ...base, nbr_places_total: '', nbr_places_restantes: 50 }).nbr_places_restantes).toBeUndefined()
  })

  it('revient à la liste une fois la formule enregistrée', async () => {
    const { wrapper, router } = await mountView()

    wrapper.findComponent(AdminForm).vm.$emit('saved', {})
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-formules')
  })
})
