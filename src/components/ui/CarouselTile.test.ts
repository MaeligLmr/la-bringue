import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import CarouselTile from './CarouselTile.vue'

async function mountTile(props: InstanceType<typeof CarouselTile>['$props']) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/billetterie', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  return { wrapper: mount(CarouselTile, { props, global: { plugins: [router] } }), router }
}

describe('CarouselTile', () => {
  it('affiche le titre et le contenu fournis', async () => {
    const { wrapper } = await mountTile({ title: 'Pass 1 jour', content: 'Pass 1 jour au choix' })

    expect(wrapper.find('.carousel-tile__title').text()).toBe('Pass 1 jour')
    expect(wrapper.find('.carousel-tile__description').text()).toBe('Pass 1 jour au choix')
  })

  it('se réutilise pour des sections différentes sans modification du composant', async () => {
    const cases = [
      { title: 'Programmation', content: 'Découvre les artistes de cette édition.' },
      { title: 'Billetterie', content: 'Réserve ta place pour le festival.' },
      { title: 'Infos pratiques', content: 'Accès, horaires, hébergement.' },
      { title: 'Actualités', content: 'Les dernières nouvelles du festival.' },
    ]

    for (const props of cases) {
      const { wrapper } = await mountTile(props)
      expect(wrapper.find('.carousel-tile__title').text()).toBe(props.title)
      expect(wrapper.find('.carousel-tile__description').text()).toBe(props.content)
    }
  })

  it('variante pink par défaut, blue via la prop variant', async () => {
    const { wrapper: pink } = await mountTile({ title: 'A', content: 'B' })
    expect(pink.classes()).toContain('carousel-tile--pink')

    const { wrapper: blue } = await mountTile({ title: 'A', content: 'B', variant: 'blue' })
    expect(blue.classes()).toContain('carousel-tile--blue')
  })

  it("n'affiche aucun CTA quand ctaLabel/to sont absents (pas d'élément vide disgracieux)", async () => {
    const { wrapper } = await mountTile({ title: 'A', content: 'B' })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('affiche le CTA avec son icône et navigue vers `to` au clic quand ctaLabel et to sont fournis', async () => {
    const { wrapper, router } = await mountTile({
      title: 'Billetterie',
      content: 'Réserve ta place.',
      ctaLabel: 'Acheter',
      to: '/billetterie',
      icon: 'ticket',
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Acheter')
    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))

    await button.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/billetterie'))
  })
})
