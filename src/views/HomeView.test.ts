import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'

// Le lineup vient de Supabase : on le simule pour ne faire aucun appel réseau.
vi.mock('../handlers/concert', () => ({
  concertHandler: { getDayLineup: vi.fn().mockResolvedValue({ others: [] }) },
}))

async function mountHome() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: HomeView }],
  })
  router.push('/')
  await router.isReady()

  return mount(HomeView, { global: { plugins: [router] } })
}

describe('HomeView', () => {
  it('affiche la section Programmation (détail testé dans ProgrammationSection.test.ts)', async () => {
    const wrapper = await mountHome()

    const titles = wrapper.findAll('.home__section h2').map((node) => node.text())
    expect(titles).toContain('Programmation')
    expect(wrapper.findAll('.programmation-day')).toHaveLength(3)
  })

  it('affiche la section Billetterie (détail testé dans Carousel.test.ts)', async () => {
    const wrapper = await mountHome()

    const titles = wrapper.findAll('.home__section h2').map((node) => node.text())
    expect(titles).toContain('Billetterie')
  })

  it('affiche la section Infos pratiques (détail testé dans Carousel.test.ts)', async () => {
    const wrapper = await mountHome()

    const titles = wrapper.findAll('.home__section h2').map((node) => node.text())
    expect(titles).toContain('Infos pratiques')
  })

  it('affiche la section Actualités (détail testé dans Carousel.test.ts)', async () => {
    const wrapper = await mountHome()

    const titles = wrapper.findAll('.home__section h2').map((node) => node.text())
    expect(titles).toContain('Actualités')
  })
})
