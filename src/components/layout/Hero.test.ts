import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Hero from './Hero.vue'

async function mountHero(props?: { homePage?: boolean }) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/a-propos', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  return { wrapper: mount(Hero, { props, global: { plugins: [router] } }), router }
}

describe('Hero', () => {
  it('affiche le titre et les dates du festival', async () => {
    const { wrapper } = await mountHero()

    expect(wrapper.find('h1').text()).toBe('LA BRINGUE')
    expect(wrapper.text()).toContain('LE FESTIVAL')
    expect(wrapper.text()).toContain('du 28 au 30 août')
  })

  it("variante par défaut : une seule étoile, pas de bouton \"En savoir plus\"", async () => {
    const { wrapper } = await mountHero()

    expect(wrapper.findAll('.hero__star')).toHaveLength(1)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('variante home-page : deux étoiles, bouton "En savoir plus" qui navigue vers /a-propos', async () => {
    const { wrapper, router } = await mountHero({ homePage: true })

    expect(wrapper.findAll('.hero__star')).toHaveLength(2)

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('En savoir plus')

    await button.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/a-propos'))
  })
})
