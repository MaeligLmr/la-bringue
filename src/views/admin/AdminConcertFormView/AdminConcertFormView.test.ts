import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminConcertFormView from './AdminConcertFormView.vue'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import ConcertLineup from '../../../components/admin/ConcertLineup/ConcertLineup.vue'
import type { Concert } from '../../../types/database/concert'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { LineupEntry } from '../../../lib/lineup/lineup'
import { JOURS } from '../../../types/ui/programmation'

const { concertHandler, concertArtisteHandler, sceneHandler, toast } = vi.hoisted(() => ({
  concertHandler: { getById: vi.fn(), create: vi.fn(), update: vi.fn(), getAllDetailed: vi.fn() },
  concertArtisteHandler: { getArtistesByConcert: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  sceneHandler: { getAll: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../handlers/concert', () => ({ concertHandler }))
vi.mock('../../../handlers/concert-artiste', () => ({ concertArtisteHandler }))
vi.mock('../../../handlers/scene', () => ({ sceneHandler }))
vi.mock('../../../supabase.js', () => ({ supabase: {} }))
vi.mock('vue-sonner', () => ({ toast }))
vi.mock('../../../components/admin/ConcertLineup/ConcertLineup.vue', () => ({
  default: { name: 'ConcertLineup', props: ['modelValue'], emits: ['update:modelValue'], template: '<div class="lineup-stub" />' },
}))

const CONCERT: Concert = { id_concert: 7, id_scene: 1, jour: '2026-08-29', heure_debut: '21:00:00', heure_fin: null }

const AYA = { id_artiste: 1, nom: 'Aya Nakamura', artiste_annonce: true, featuring: false }
const ANGELE = { id_artiste: 2, nom: 'Angèle', artiste_annonce: true, featuring: false }

async function mountView(id?: number) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/concerts', name: 'admin-concerts', component: { template: '<div />' } },
      { path: '/admin/concerts/:id', name: 'admin-concert', component: { template: '<div />' } },
      { path: '/admin/concerts/form', component: AdminConcertFormView },
    ],
  })
  router.push('/admin/concerts/form')
  await router.isReady()
  const wrapper = mount(AdminConcertFormView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function formProps(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.findComponent(AdminForm).props() as {
    fields: AdminFormField<Concert>[]
    id?: number
    rules: (values: Record<string, unknown>) => Partial<Record<string, string>>
  }
}

async function editLineup(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper'], lineup: LineupEntry[]) {
  wrapper.findComponent(ConcertLineup).vm.$emit('update:modelValue', lineup)
  await flushPromises()
}

async function save(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  wrapper.findComponent(AdminForm).vm.$emit('saved', CONCERT)
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  sceneHandler.getAll.mockResolvedValue([
    { id_scene: 1, nom: 'Chrome' },
    { id_scene: 2, nom: 'Summer' },
  ])
  concertHandler.getById.mockResolvedValue(CONCERT)
  concertHandler.getAllDetailed.mockResolvedValue([])
  concertArtisteHandler.getArtistesByConcert.mockResolvedValue([
    { id_artiste: 1, id_concert: 7, artiste_annonce: true, featuring: false, Artiste: { id_artiste: 1, nom: 'Aya Nakamura' } },
  ])
  concertArtisteHandler.create.mockResolvedValue({})
  concertArtisteHandler.update.mockResolvedValue({})
  concertArtisteHandler.remove.mockResolvedValue(undefined)
})

describe('AdminConcertFormView', () => {
  it('propose les jours du festival, les heures et les scènes en base', async () => {
    const { wrapper } = await mountView()

    const fields = formProps(wrapper).fields
    expect(fields.map((field) => [field.key, field.type, !!field.required])).toEqual([
      ['jour', 'select', true],
      ['heure_debut', 'time', true],
      ['heure_fin', 'time', false],
      ['id_scene', 'select', true],
    ])
    expect(fields[0].options).toEqual(JOURS)
    expect(fields[3].options).toEqual([
      { value: '1', label: 'Chrome' },
      { value: '2', label: 'Summer' },
    ])
  })

  it('affiche le line-up dans le formulaire, dès la création', async () => {
    const creation = await mountView()
    expect(creation.wrapper.find('h1').text()).toBe('Nouveau concert')
    expect(creation.wrapper.findComponent(AdminForm).findComponent(ConcertLineup).props('modelValue')).toEqual([])

    const edition = await mountView(7)
    expect(edition.wrapper.find('h1').text()).toBe('Modifier le concert')
    expect(edition.wrapper.findComponent(ConcertLineup).props('modelValue')).toEqual([AYA])
  })

  it('enregistre le line-up d’un nouveau concert puis revient à la liste', async () => {
    const { wrapper, router } = await mountView()

    await editLineup(wrapper, [{ ...AYA, featuring: true }])
    await save(wrapper)

    expect(concertArtisteHandler.create).toHaveBeenCalledWith(1, 7, { artiste_annonce: true, featuring: true })
    expect(router.currentRoute.value.name).toBe('admin-concerts')
  })

  it('n’envoie que les changements du line-up d’un concert existant', async () => {
    const { wrapper } = await mountView(7)

    await editLineup(wrapper, [ANGELE])
    await save(wrapper)

    expect(concertArtisteHandler.create).toHaveBeenCalledWith(2, 7, { artiste_annonce: true, featuring: false })
    expect(concertArtisteHandler.remove).toHaveBeenCalledWith(1, 7)
    expect(concertArtisteHandler.update).not.toHaveBeenCalled()
  })

  it('reste sur le concert créé si le line-up n’a pas pu être enregistré', async () => {
    concertArtisteHandler.create.mockRejectedValue(new Error('boom'))
    concertArtisteHandler.getArtistesByConcert.mockResolvedValue([])
    const { wrapper, router } = await mountView()

    await editLineup(wrapper, [AYA])
    await save(wrapper)

    expect(toast.error).toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/admin/concerts/7')
  })

  it('bloque une heure de fin avant l’heure de début', async () => {
    const { wrapper } = await mountView()
    const { rules } = formProps(wrapper)

    expect(rules({ heure_debut: '21:00', heure_fin: '20:00' }).heure_fin).toBe("L'heure de fin doit être après l'heure de début.")
    expect(rules({ heure_debut: '21:00', heure_fin: '22:00' }).heure_fin).toBeUndefined()
  })

  it('avertit, sans bloquer, d’un autre concert sur la même scène au même moment', async () => {
    concertHandler.getAllDetailed.mockResolvedValue([
      { ...CONCERT, ConcertArtiste: [] },
      {
        id_concert: 8,
        id_scene: 1,
        jour: '2026-08-29',
        heure_debut: '20:30:00',
        heure_fin: '21:30:00',
        ConcertArtiste: [{ Artiste: { nom: 'Angèle' } }],
      },
    ])
    const { wrapper } = await mountView(7)

    const warning = wrapper.find('.admin-concert-form__warning')
    expect(warning.text()).toBe('Ce concert chevauche sur la même scène : Angèle (20h30 – 21h30).')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('n’avertit pas quand la scène est libre', async () => {
    const { wrapper } = await mountView(7)

    expect(wrapper.find('.admin-concert-form__warning').exists()).toBe(false)
  })
})
