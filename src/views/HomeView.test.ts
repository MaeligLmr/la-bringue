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
    getAllHomepage: vi.fn().mockResolvedValue([
      { id_formule: 1, titre: 'Pass 1 jour', description: 'Un jour au choix', lien_shotgun: 'https://shotgun.live/pass-1-jour', prix: 30 },
      { id_formule: 2, titre: 'Pass 3 jours', description: 'Les trois jours' },
    ]),
  },
}))
vi.mock('../handlers/info-pratique', () => ({
  infoPratiqueHandler: {
    getAllHomepage: vi
      .fn()
      .mockResolvedValue([{ id_info: 1, titre: 'Accès & transport', intro: 'Navettes gratuites', points: [] }]),
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
    routes: [
      { path: '/', component: HomeView },
      { path: '/infos-pratiques', component: { template: '<div />' } },
    ],
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
  return section.findAll('.carousel-tile__title, .formule__titre').map((node) => node.text())
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

  it('affiche les formules sous forme de cartes de billetterie, avec leur prix', async () => {
    const wrapper = await mountHome()

    const section = wrapper.findAll('.home__section').find((node) => node.find('h2').text() === 'Billetterie')!
    expect(section.findAll('.formule')).toHaveLength(2)
    expect(section.find('.formule__prix-final').text().replace(/\s/g, ' ')).toBe('30 €')
  })

  it('ouvre la billetterie Shotgun depuis une carte de l’accueil', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = await mountHome()

    await wrapper.find('.formule__cta').trigger('click')

    expect(open).toHaveBeenCalledWith('https://shotgun.live/pass-1-jour', '_blank', 'noopener,noreferrer')
    open.mockRestore()
  })

  it('affiche les infos pratiques', async () => {
    const wrapper = await mountHome()

    expect(sectionTileTitles(wrapper, 'Infos pratiques')).toEqual(['Accès & transport'])
  })

  it('fait pointer chaque tuile d’infos pratiques vers sa section', async () => {
    const wrapper = await mountHome()
    const router = wrapper.vm.$router

    const section = wrapper.findAll('.home__section').find((node) => node.find('h2').text() === 'Infos pratiques')
    await section!.find('.carousel-tile__cta').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/infos-pratiques')
    expect(router.currentRoute.value.hash).toBe('#acces-transport')
  })

  it.each([
    ['Billetterie', '/billetterie'],
    ['Infos pratiques', '/infos-pratiques'],
    ['Actualités', '/actualites'],
  ])('le bouton « Voir plus » de la section %s mène à %s', async (title, path) => {
    const wrapper = await mountHome()
    const router = wrapper.vm.$router

    const section = wrapper.findAll('.home__section').find((node) => node.find('h2').text() === title)!
    const button = section.findAll('button').find((node) => node.text() === 'Voir plus')!
    await button.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe(path)
  })

  it('garde la section Actualités, vide, si son chargement échoue sans casser les autres', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountHome()

    expect(sectionTileTitles(wrapper, 'Actualités')).toEqual([])
    expect(sectionTileTitles(wrapper, 'Billetterie')).toHaveLength(2)
  })
})
