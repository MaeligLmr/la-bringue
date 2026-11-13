import { describe, it, expect, vi, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminActualiteFormView from './AdminActualiteFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import type { Actualite } from '../../../types/database/actualite'
import type { AdminFormField } from '../../../types/ui/admin-form'

const { actualiteHandler } = vi.hoisted(() => ({
  actualiteHandler: { getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

vi.mock('../../../handlers/actualite', () => ({ actualiteHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const ACTUALITE: Actualite = {
  id_actualite: 5,
  titre: 'Billetterie ouverte',
  description: null,
  date_publication: '2026-06-02',
  photo: null,
}

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/actualites', name: 'admin-actualites', component: { template: '<div />' } },
      { path: '/admin/actualites/form', component: AdminActualiteFormView },
    ],
  })
  router.push('/admin/actualites/form')
  await router.isReady()
  const wrapper = mount(AdminActualiteFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as { fields: AdminFormField<Actualite>[]; id?: number }
}

afterEach(() => vi.useRealTimers())

function statut(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.find('.tag').text()
}

function publishButton(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findAll('button').find((button) => button.text() === 'Publier maintenant')
}

describe('AdminActualiteFormView', () => {
  it('propose titre, photo, date de publication et description ; titre et date sont obligatoires', async () => {
    const { wrapper } = await mountView()

    const fields = formProps(wrapper).fields
    expect(fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['titre', 'text', true],
      ['photo', 'image', false],
      ['date_publication', 'date', true],
      ['description', 'textarea', false],
    ])
  })

  it('envoie la photo dans le dossier « actualites » du bucket', async () => {
    const { wrapper } = await mountView()

    expect(formProps(wrapper).fields.find((field) => field.key === 'photo')?.folder).toBe('actualites')
  })

  it('affiche un titre de création ou de modification et passe l’id au formulaire', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvelle actualité')
    expect(formProps(creation.wrapper).id).toBeUndefined()

    actualiteHandler.getById.mockResolvedValue(ACTUALITE)
    const edition = await mountView(5)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier l’actualité')
    expect(formProps(edition.wrapper).id).toBe(5)
  })

  it('revient à la liste une fois l’actualité enregistrée', async () => {
    const { wrapper, router } = await mountView()

    wrapper.findComponent(AdminForm).vm.$emit('saved', ACTUALITE)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-actualites')
  })

  it('une nouvelle actualité sans date est « En attente », avec un bouton pour la publier', async () => {
    const { wrapper } = await mountView()

    expect(statut(wrapper)).toBe('En attente')
    expect(publishButton(wrapper)).toBeDefined()
  })

  it('une actualité dont la date est passée est « Publiée », sans bouton', async () => {
    actualiteHandler.getById.mockResolvedValue({ ...ACTUALITE, date_publication: '2020-01-01' })
    const { wrapper } = await mountView(5)

    expect(statut(wrapper)).toBe('Publiée')
    expect(publishButton(wrapper)).toBeUndefined()
  })

  it('une date future la garde « En attente »', async () => {
    actualiteHandler.getById.mockResolvedValue({ ...ACTUALITE, date_publication: '2999-01-01' })
    const { wrapper } = await mountView(5)

    expect(statut(wrapper)).toBe('En attente')
  })

  it('« Publier maintenant » met la date du jour dans le champ et passe en « Publiée »', async () => {
    actualiteHandler.getById.mockResolvedValue({ ...ACTUALITE, date_publication: '2999-01-01' })
    const { wrapper } = await mountView(5)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 13, 12))

    await publishButton(wrapper)!.trigger('click')

    expect(wrapper.find('#admin-date_publication').text()).toContain('13 novembre 2026')
    expect(statut(wrapper)).toBe('Publiée')
    expect(publishButton(wrapper)).toBeUndefined()
  })
})
