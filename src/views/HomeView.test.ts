import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'

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
