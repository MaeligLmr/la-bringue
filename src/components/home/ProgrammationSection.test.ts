import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ProgrammationSection from './ProgrammationSection.vue'
import type { Artiste } from '../../types/database/artiste'
import type { DayLineup } from '../../handlers/concert'

const { getDayLineup } = vi.hoisted(() => ({ getDayLineup: vi.fn() }))
vi.mock('../../handlers/concert', () => ({ concertHandler: { getDayLineup } }))

let id = 0
function artiste(nom: string): Artiste {
  return { id_artiste: ++id, nom, created_at: '', photo: null, description: null, categorie: null }
}

const LINEUPS: Record<string, DayLineup> = {
  '2026-08-28': {
    headliner: artiste('Aya Nakamura'),
    others: ['Little Simz', 'Charlotte de Witte', 'Zaho', 'Bamby'].map(artiste),
  },
  '2026-08-29': { headliner: artiste('Addison Rae'), others: [] },
  '2026-08-30': { headliner: artiste('Theodora'), others: [] },
}

async function mountSection() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/programmation', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  const wrapper = mount(ProgrammationSection, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  getDayLineup.mockReset()
  getDayLineup.mockImplementation(async (jour: string) => LINEUPS[jour])
})

describe('ProgrammationSection', () => {
  it('affiche un bloc par jour du festival', async () => {
    const { wrapper } = await mountSection()

    const jours = wrapper.findAll('.programmation-day__jour').map((node) => node.text())
    expect(jours).toEqual(['Vendredi 28 août', 'Samedi 29 août', 'Dimanche 30 août'])
  })

  it('charge le lineup de chaque jour depuis Supabase', async () => {
    await mountSection()

    expect(getDayLineup.mock.calls.map(([jour]) => jour)).toEqual(['2026-08-28', '2026-08-29', '2026-08-30'])
  })

  it('affiche la tête d’affiche de chaque jour', async () => {
    const { wrapper } = await mountSection()

    const headliners = wrapper.findAll('.programmation-day__headliner').map((node) => node.text())
    expect(headliners).toEqual(['Aya Nakamura', 'Addison Rae', 'Theodora'])
  })

  it('liste ensuite les autres artistes du jour', async () => {
    const { wrapper } = await mountSection()

    const [vendredi] = wrapper.findAll('.programmation-day__others')
    expect(vendredi.findAll('li').map((node) => node.text())).toEqual([
      'Little Simz',
      'Charlotte de Witte',
      'Zaho',
      'Bamby…',
    ])
  })

  it('garde les jours affichés, sans artistes, si Supabase échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    getDayLineup.mockRejectedValue(new Error('réseau'))

    const { wrapper } = await mountSection()

    expect(wrapper.findAll('.programmation-day')).toHaveLength(3)
    expect(wrapper.find('.programmation-day__headliner').exists()).toBe(false)
  })

  it('mène à la page Programmation via le bouton', async () => {
    const { wrapper, router } = await mountSection()

    const button = wrapper.findAll('button').find((node) => node.text() === 'Toute la programmation')
    await button?.trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/programmation'))
  })
})
