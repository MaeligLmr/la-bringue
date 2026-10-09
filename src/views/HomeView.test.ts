import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'

// Toutes les données viennent de Supabase : on simule les handlers pour ne
// faire aucun appel réseau.
vi.mock('../handlers/concert', () => ({
  concertHandler: { getDayLineup: vi.fn().mockResolvedValue({ others: [] }) },
}))
vi.mock('../handlers/formule', () => ({
  formuleHandler: {
    getAll: vi.fn().mockResolvedValue([
      { id_formule: 1, titre: 'Pass 1 jour', description: 'Un jour au choix' },
      { id_formule: 2, titre: 'Pass 3 jours', description: 'Les trois jours' },
    ]),
  },
}))
vi.mock('../handlers/info-pratique', () => ({
  infoPratiqueHandler: {
    getAll: vi.fn().mockResolvedValue([{ id_info: 1, titre: 'Accès', description: 'Navettes gratuites' }]),
  },
}))
vi.mock('../handlers/actualite', () => ({
  actualiteHandler: {
    getLatest: vi.fn().mockRejectedValue(new Error('[Actualite] permission denied')),
  },
}))

async function mountHome() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: HomeView }],
  })
  router.push('/')
  await router.isReady()

  const wrapper = mount(HomeView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

function sectionTileTitles(wrapper: Awaited<ReturnType<typeof mountHome>>, title: string) {
  const section = wrapper.findAll('.home__section').find((node) => node.find('h2').text() === title)
  if (!section) throw new Error(`Section "${title}" introuvable`)
  return section.findAll('.carousel-tile__title').map((node) => node.text())
}

describe('HomeView', () => {
  it('affiche la section Programmation (détail testé dans ProgrammationSection.test.ts)', async () => {
    const wrapper = await mountHome()

    const titles = wrapper.findAll('.home__section h2').map((node) => node.text())
    expect(titles).toContain('Programmation')
    expect(wrapper.findAll('.programmation-day')).toHaveLength(3)
  })

  it('affiche les formules de la billetterie', async () => {
    const wrapper = await mountHome()

    expect(sectionTileTitles(wrapper, 'Billetterie')).toEqual(['Pass 1 jour', 'Pass 3 jours'])
  })

  it('affiche les infos pratiques', async () => {
    const wrapper = await mountHome()

    expect(sectionTileTitles(wrapper, 'Infos pratiques')).toEqual(['Accès'])
  })

  it('garde la section Actualités, vide, si son chargement échoue sans casser les autres', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountHome()

    expect(sectionTileTitles(wrapper, 'Actualités')).toEqual([])
    expect(sectionTileTitles(wrapper, 'Billetterie')).toHaveLength(2)
  })
})
