import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminConferenceFormView from './AdminConferenceFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminLinks from '../../../components/admin/AdminLinks/AdminLinks.vue'
import type { IntervenanteEntry } from '../../../lib/links/links'
import type { Conference } from '../../../types/database/conference'
import type { AdminFormField } from '../../../types/ui/admin-form'
import { JOURS } from '../../../types/ui/programmation'

const { conferenceHandler, conferenciereHandler, participationHandler, toast } = vi.hoisted(() => ({
  conferenciereHandler: { getAll: vi.fn() },
  conferenceHandler: { getById: vi.fn(), create: vi.fn(), update: vi.fn(), getThemes: vi.fn(), getAllDetailed: vi.fn() },
  participationHandler: { getConferencieresByConference: vi.fn(), create: vi.fn(), remove: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/conference', () => ({ conferenceHandler }))
vi.mock('../../../handlers/conferenciere', () => ({ conferenciereHandler }))
vi.mock('../../../handlers/participation', () => ({ participationHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast }))
// AdminLinks a ses propres tests : ici on vérifie ce que la page en fait.
vi.mock('../../../components/admin/AdminLinks/AdminLinks.vue', () => ({
  default: { name: 'AdminLinks', props: ['modelValue', 'items'], emits: ['update:modelValue'], template: '<div />' },
}))

const CONFERENCE: Conference = {
  id_conference: 5,
  titre: 'Le féminisme en 2026',
  photo: null,
  theme: 'Féminisme',
  description: null,
  jour: '2026-08-29',
  heure_debut: '14:00:00',
  heure_fin: '15:00:00',
}

const ROKHAYA: IntervenanteEntry = { id: 2, nom: 'Rokhaya Diallo', id_participation: 10 }
const ALICE: IntervenanteEntry = { id: 1, nom: 'Alice Coffin' }

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/conferences', name: 'admin-conferences', component: { template: '<div />' } },
      { path: '/admin/conferences/:id', name: 'admin-conference', component: { template: '<div />' } },
      { path: '/admin/conferences/form', component: AdminConferenceFormView },
    ],
  })
  router.push('/admin/conferences/form')
  await router.isReady()
  const wrapper = mount(AdminConferenceFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

// AdminForm est générique : on retype ses props pour les lire.
function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as {
    fields: AdminFormField<Conference>[]
    rules: (values: Record<string, unknown>) => Partial<Record<string, string>>
  }
}

// AdminLinks est générique : on retype aussi ses props.
function linksProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminLinks).props() as { modelValue: IntervenanteEntry[]; items: { id: number; nom: string }[] }
}

async function editIntervenantes(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper'], value: IntervenanteEntry[]) {
  wrapper.findComponent(AdminLinks).vm.$emit('update:modelValue', value)
  await flushPromises()
}

async function save(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  wrapper.findComponent(AdminForm).vm.$emit('saved', CONFERENCE)
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  conferenceHandler.getById.mockResolvedValue(CONFERENCE)
  conferenceHandler.getThemes.mockResolvedValue(['Écologie', 'Féminisme'])
  conferenceHandler.getAllDetailed.mockResolvedValue([])
  participationHandler.getConferencieresByConference.mockResolvedValue([
    { id_participation: 10, id_conferenciere: 2, id_conference: 5, Conferenciere: { id_conferenciere: 2, nom: 'Rokhaya Diallo' } },
  ])
  conferenciereHandler.getAll.mockResolvedValue([
    { id_conferenciere: 2, nom: 'Rokhaya Diallo', description: null, photo: null },
    { id_conferenciere: 1, nom: 'Alice Coffin', description: null, photo: null },
  ])
  participationHandler.create.mockResolvedValue({})
  participationHandler.remove.mockResolvedValue(undefined)
})

describe('AdminConferenceFormView', () => {
  it('propose titre, photo, thème, description, jour et horaires', async () => {
    const { wrapper } = await mountView()

    const fields = formProps(wrapper).fields
    expect(fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['titre', 'text', true],
      ['photo', 'image', false],
      ['theme', 'select', false],
      ['description', 'textarea', false],
      ['jour', 'select', true],
      ['heure_debut', 'time', true],
      ['heure_fin', 'time', false],
    ])
    expect(fields[1].folder).toBe('conferences')
    expect(fields[2].options).toEqual([
      { value: '', label: 'Aucun' },
      { value: 'Écologie', label: 'Écologie' },
      { value: 'Féminisme', label: 'Féminisme' },
    ])
    expect(fields[4].options).toEqual(JOURS)
  })

  it('charge les intervenantes d’une conférence existante', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouvelle conférence')
    expect(linksProps(creation.wrapper).modelValue).toEqual([])

    const edition = await mountView(5)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier la conférence')
    expect(linksProps(edition.wrapper).modelValue).toEqual([ROKHAYA])
  })

  it('propose toutes les intervenantes, par ordre alphabétique', async () => {
    const { wrapper } = await mountView()

    expect(linksProps(wrapper).items).toEqual([
      { id: 1, nom: 'Alice Coffin' },
      { id: 2, nom: 'Rokhaya Diallo' },
    ])
  })

  it('crée les participations d’une nouvelle conférence puis revient à la liste', async () => {
    const { wrapper, router } = await mountView()

    await editIntervenantes(wrapper, [ALICE, { id: 2, nom: 'Rokhaya Diallo' }])
    await save(wrapper)

    expect(participationHandler.create).toHaveBeenCalledWith({ id_conferenciere: 1, id_conference: 5 })
    expect(participationHandler.create).toHaveBeenCalledWith({ id_conferenciere: 2, id_conference: 5 })
    expect(router.currentRoute.value.name).toBe('admin-conferences')
  })

  it('retire une intervenante en supprimant sa participation, pas l’intervenante', async () => {
    const { wrapper } = await mountView(5)

    await editIntervenantes(wrapper, [ALICE])
    await save(wrapper)

    expect(participationHandler.remove).toHaveBeenCalledWith(10)
    expect(participationHandler.create).toHaveBeenCalledWith({ id_conferenciere: 1, id_conference: 5 })
  })

  it('reste sur la conférence créée si les intervenantes n’ont pas pu être enregistrées', async () => {
    participationHandler.create.mockRejectedValue(new Error('boom'))
    participationHandler.getConferencieresByConference.mockResolvedValue([])
    const { wrapper, router } = await mountView()

    await editIntervenantes(wrapper, [ALICE])
    await save(wrapper)

    expect(toast.error).toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/admin/conferences/5')
  })

  it('bloque une heure de fin avant l’heure de début', async () => {
    const { wrapper } = await mountView()
    const { rules } = formProps(wrapper)

    expect(rules({ heure_debut: '15:00', heure_fin: '14:00' }).heure_fin).toBe("L'heure de fin doit être après l'heure de début.")
    expect(rules({ heure_debut: '14:00', heure_fin: '15:00' }).heure_fin).toBeUndefined()
  })

  it('avertit, sans bloquer, d’une autre conférence au même moment', async () => {
    conferenceHandler.getAllDetailed.mockResolvedValue([
      { ...CONFERENCE, Participation: [] },
      { ...CONFERENCE, id_conference: 6, titre: 'Atelier écriture', heure_debut: '14:30:00', heure_fin: '15:30:00', Participation: [] },
    ])
    const { wrapper } = await mountView(5)

    expect(wrapper.find('.admin-conference-form__warning').text()).toBe(
      'Cette conférence a lieu en même temps que : Atelier écriture (14h30 – 15h30).'
    )
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })
})
