import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ConferencesView from './ConferencesView.vue'
import type { ConferenceDetail } from '../handlers/conference'

let id = 0

function conference(
  jour: string,
  heure: string,
  titre: string,
  theme: string,
  conferencieres: string[]
): ConferenceDetail {
  const idConference = ++id
  return {
    id_conference: idConference,
    created_at: '',
    titre,
    photo: null,
    theme,
    description: null,
    jour,
    heure_debut: heure,
    heure_fin: null,
    Participation: conferencieres.map((nom, index) => ({
      id_participation: idConference * 10 + index,
      created_at: '',
      id_conferenciere: idConference * 10 + index,
      id_conference: idConference,
      Conferenciere: { id_conferenciere: idConference * 10 + index, created_at: '', nom, description: null },
    })),
  }
}

// Supabase renvoie les conférences déjà triées par jour puis par heure.
const CONFERENCES = [
  conference('2026-08-28', '14:00:00', 'La fête au féminin', 'Feminisme', ['Alice Martin']),
  conference('2026-08-29', '15:30:00', 'Produire sa musique', 'Tolérance', ['Léa Dubois', 'Nora Petit']),
  conference('2026-08-29', '17:00:00', 'Festivals durables', 'Écologie', []),
  conference('2026-08-30', '14:30:00', 'Rap et engagement', 'Feminisme', ['Inès Moreau']),
]

// Valeurs de l'enum `themes_conferences` renvoyées par la fonction RPC.
const THEMES = ['Feminisme', 'Écologie', 'Tolérance', 'Sante']

vi.mock('../handlers/conference', () => ({
  conferenceHandler: {
    getAllDetailed: vi.fn(async () => CONFERENCES),
    getThemes: vi.fn(async () => THEMES),
  },
}))

async function mountConferences(url = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: ConferencesView }],
  })
  router.push(url)
  await router.isReady()
  const wrapper = mount(ConferencesView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

function filterButton(wrapper: Awaited<ReturnType<typeof mountConferences>>, label: string) {
  const button = wrapper.findAll('[role="group"] button').find((node) => node.text() === label)
  if (!button) throw new Error(`Bouton de filtre "${label}" introuvable`)
  return button
}

function displayedNames(wrapper: Awaited<ReturnType<typeof mountConferences>>) {
  return wrapper.findAll('.content-card__nom').map((node) => node.text())
}

describe('ConferencesView', () => {
  it('affiche une carte par conférence, dans l’ordre renvoyé par Supabase', async () => {
    const wrapper = await mountConferences()

    expect(displayedNames(wrapper)).toEqual([
      'La fête au féminin',
      'Produire sa musique',
      'Festivals durables',
      'Rap et engagement',
    ])

    wrapper.unmount()
  })

  it('affiche les conférencières, le jour/heure et le thème sur chaque carte', async () => {
    const wrapper = await mountConferences()

    const card = wrapper.findAll('.content-card').find((node) => node.text().includes('Produire sa musique'))
    expect(card?.find('.content-card__scene').text()).toBe('Léa Dubois, Nora Petit')
    expect(card?.find('.content-card__date').text()).toBe('Samedi 29 août - 15h30')
    expect(card?.find('.tag').text()).toBe('Tolérance')

    wrapper.unmount()
  })

  it('propose les filtres jour et thème, avec les thèmes de l’enum de la base', async () => {
    const wrapper = await mountConferences()

    const groups = wrapper.findAll('[role="group"]').map((group) => group.attributes('aria-label'))
    expect(groups).toEqual(['Jour', 'Thème'])
    expect(filterButton(wrapper, 'Tous les jours').attributes('aria-pressed')).toBe('true')
    expect(filterButton(wrapper, 'Tous les thèmes').attributes('aria-pressed')).toBe('true')
    const themeLabels = wrapper.findAll('[aria-label="Thème"] button').map((node) => node.text())
    expect(themeLabels).toEqual(['Tous les thèmes', ...THEMES])

    wrapper.unmount()
  })

  it('ne garde que les conférences du thème sélectionné', async () => {
    const wrapper = await mountConferences()

    await filterButton(wrapper, 'Feminisme').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['La fête au féminin', 'Rap et engagement'])

    wrapper.unmount()
  })

  it('combine jour et thème', async () => {
    const wrapper = await mountConferences()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')
    await filterButton(wrapper, 'Écologie').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['Festivals durables'])

    wrapper.unmount()
  })

  it('ne garde que les conférences du jour sélectionné', async () => {
    const wrapper = await mountConferences()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['Produire sa musique', 'Festivals durables'])

    wrapper.unmount()
  })

  it('pré-applique le jour passé dans l’URL', async () => {
    const wrapper = await mountConferences('/?date=2026-08-30')

    expect(filterButton(wrapper, 'Dimanche 30 août').attributes('aria-pressed')).toBe('true')
    expect(displayedNames(wrapper)).toEqual(['Rap et engagement'])

    wrapper.unmount()
  })
})
