import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ProgrammationView from './ProgrammationView.vue'
import type { ConcertDetail } from '../handlers/concert'

let id = 0

function concert(
  jour: string,
  heure: string,
  scene: string,
  artistes: { nom: string; categorie: string; featuring?: boolean }[]
): ConcertDetail {
  const idConcert = ++id
  return {
    id_concert: idConcert,
    created_at: '',
    id_scene: null,
    jour,
    heure_debut: heure,
    heure_fin: null,
    Scene: { id_scene: 0, created_at: '', nom: scene, style_musical: null },
    ConcertArtiste: artistes.map(({ nom, categorie, featuring = false }, index) => ({
      id_artiste: idConcert * 10 + index,
      id_concert: idConcert,
      created_at: '',
      artiste_annonce: true,
      featuring,
      Artiste: { id_artiste: idConcert * 10 + index, created_at: '', nom, photo: null, description: null, categorie },
    })),
  }
}

// Supabase renvoie les concerts déjà triés par jour puis par heure.
const CONCERTS = [
  concert('2026-08-28', '17:00:00', 'Summer', [{ nom: 'Iliona', categorie: 'Pop' }]),
  concert('2026-08-28', '22:15:00', 'Chrome', [
    { nom: 'Aya Nakamura', categorie: 'Afro-pop' },
    { nom: 'Invitée', categorie: 'Pop', featuring: true },
  ]),
  concert('2026-08-29', '19:00:00', '2000’', [{ nom: 'Oklou', categorie: 'Électro' }]),
  concert('2026-08-29', '22:00:00', 'Chrome', [{ nom: 'Addison Rae', categorie: 'Pop' }]),
  concert('2026-08-30', '18:00:00', 'Soft', [{ nom: 'Marguerite', categorie: 'Folk' }]),
  concert('2026-08-30', '19:30:00', 'Soft', [{ nom: 'Ethel Cain', categorie: 'Rock' }]),
  concert('2026-08-30', '20:55:00', 'Chrome', [{ nom: 'Theodora', categorie: 'Rap' }]),
]

vi.mock('../handlers/concert', () => ({
  concertHandler: { getAllDetailed: vi.fn(async () => CONCERTS) },
}))

async function mountProgrammation(url = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: ProgrammationView }],
  })
  router.push(url)
  await router.isReady()
  const wrapper = mount(ProgrammationView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

function filterButton(wrapper: Awaited<ReturnType<typeof mountProgrammation>>, label: string) {
  const button = wrapper.findAll('[role="group"] button').find((node) => node.text() === label)
  if (!button) throw new Error(`Bouton de filtre "${label}" introuvable`)
  return button
}

function displayedNames(wrapper: Awaited<ReturnType<typeof mountProgrammation>>) {
  return wrapper.findAll('.content-card__nom').map((node) => node.text())
}

describe('ProgrammationView', () => {
  it('affiche un artiste principal par concert, sans les featurings, sans filtre actif', async () => {
    const wrapper = await mountProgrammation()

    expect(displayedNames(wrapper)).toHaveLength(7)
    expect(displayedNames(wrapper)).not.toContain('Invitée')

    wrapper.unmount()
  })

  it('conserve l’ordre jour puis heure renvoyé par Supabase', async () => {
    const wrapper = await mountProgrammation()

    const names = displayedNames(wrapper)
    expect(names[0]).toBe('Iliona')
    expect(names[names.length - 1]).toBe('Theodora')

    wrapper.unmount()
  })

  it('affiche la scène, le jour/heure et la catégorie sur chaque carte', async () => {
    const wrapper = await mountProgrammation()

    const card = wrapper.findAll('.content-card').find((node) => node.text().includes('Theodora'))
    expect(card?.find('.content-card__scene').text()).toBe('Chrome')
    expect(card?.find('.content-card__date').text()).toBe('Dimanche 30 août - 20h55')
    expect(card?.find('.tag').text()).toBe('Rap')

    wrapper.unmount()
  })

  it('propose les filtres jour et scène', async () => {
    const wrapper = await mountProgrammation()

    const groups = wrapper.findAll('[role="group"]').map((group) => group.attributes('aria-label'))
    expect(groups).toEqual(['Jour', 'Scène'])
    expect(filterButton(wrapper, 'Tous les jours').attributes('aria-pressed')).toBe('true')
    expect(filterButton(wrapper, 'Toutes les scènes').attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })

  it('ne garde que les artistes du jour sélectionné', async () => {
    const wrapper = await mountProgrammation()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['Oklou', 'Addison Rae'])

    wrapper.unmount()
  })

  it('associe les noms de scène de la base aux filtres (ex: « 2000’ »)', async () => {
    const wrapper = await mountProgrammation()

    await filterButton(wrapper, '2000’').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['Oklou'])

    wrapper.unmount()
  })

  it('combine jour et scène', async () => {
    const wrapper = await mountProgrammation()

    await filterButton(wrapper, 'Dimanche 30 août').trigger('click')
    await filterButton(wrapper, 'Soft').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['Marguerite', 'Ethel Cain'])
    expect(wrapper.findAll('.content-card__scene').map((node) => node.text())).toEqual([
      'Soft',
      'Soft',
    ])

    wrapper.unmount()
  })

  it('pré-applique le jour passé dans l’URL (lien depuis l’accueil)', async () => {
    const wrapper = await mountProgrammation('/?date=2026-08-29')

    expect(filterButton(wrapper, 'Samedi 29 août').attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })
})
