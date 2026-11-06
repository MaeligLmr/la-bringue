import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ConferencesView from './ConferencesView.vue'
import type { ConferenceResume } from '../../handlers/conference'
import { toast } from 'vue-sonner'
import { conferenceHandler } from '../../handlers/conference'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

let id = 0

function conference(
  jour: string,
  heure: string,
  titre: string,
  theme: string,
  conferencieres: string[]
): ConferenceResume {
  const idConference = ++id
  return {
    id_conference: idConference,
    titre,
    photo: null,
    theme,
    jour,
    heure_debut: heure,
    heure_fin: null,
    Participation: conferencieres.map((nom) => ({
      Conferenciere: { nom },
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

// Reproduit côté mock le filtrage (jour, thème, recherche) de Supabase ; tout
// tient sur une page.
function pageOf({ search = '', jour = '', theme = '' }: { search?: string; jour?: string; theme?: string }) {
  const rows = CONFERENCES.filter(
    (row) =>
      (!jour || row.jour === jour) &&
      (!theme || row.theme === theme) &&
      row.titre!.toLowerCase().includes(search.toLowerCase())
  )
  return { rows, hasMore: false }
}

vi.mock('../../handlers/conference', () => ({
  conferenceHandler: {
    getPage: vi.fn(async (params) => pageOf(params)),
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
    await flushPromises()

    expect(displayedNames(wrapper)).toEqual(['La fête au féminin', 'Rap et engagement'])

    wrapper.unmount()
  })

  it('demande à Supabase le jour et le thème choisis', async () => {
    const wrapper = await mountConferences()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')
    await flushPromises()
    await filterButton(wrapper, 'Écologie').trigger('click')
    await flushPromises()

    expect(conferenceHandler.getPage).toHaveBeenLastCalledWith({
      offset: 0,
      search: '',
      jour: '2026-08-29',
      theme: 'Écologie',
    })

    wrapper.unmount()
  })

  it('combine jour et thème', async () => {
    const wrapper = await mountConferences()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')
    await flushPromises()
    await filterButton(wrapper, 'Écologie').trigger('click')
    await flushPromises()

    expect(displayedNames(wrapper)).toEqual(['Festivals durables'])

    wrapper.unmount()
  })

  it('ne garde que les conférences du jour sélectionné', async () => {
    const wrapper = await mountConferences()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')
    await flushPromises()

    expect(displayedNames(wrapper)).toEqual(['Produire sa musique', 'Festivals durables'])

    wrapper.unmount()
  })

  it('pré-applique le jour passé dans l’URL', async () => {
    const wrapper = await mountConferences('/?date=2026-08-30')

    expect(filterButton(wrapper, 'Dimanche 30 août').attributes('aria-pressed')).toBe('true')
    expect(displayedNames(wrapper)).toEqual(['Rap et engagement'])

    wrapper.unmount()
  })

  it('affiche un toast si les conférences ne se chargent pas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(conferenceHandler.getPage).mockRejectedValueOnce(new Error('[Conference] permission denied'))
    vi.mocked(toast.error).mockClear()

    const wrapper = await mountConferences()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger les conférences.')
    expect(displayedNames(wrapper)).toEqual([])

    wrapper.unmount()
  })

  it('affiche un toast si les thèmes ne se chargent pas, la liste reste affichée', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(conferenceHandler.getThemes).mockRejectedValueOnce(new Error('rpc failed'))
    vi.mocked(toast.error).mockClear()

    const wrapper = await mountConferences()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger les thèmes de conférences.')
    expect(displayedNames(wrapper)).toHaveLength(4)

    wrapper.unmount()
  })
})
