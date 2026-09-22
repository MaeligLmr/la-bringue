import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentCard from './ContentCard.vue'
import Tag from './Tag.vue'

describe('ContentCard', () => {
  it("s'affiche avec nom et photo uniquement, sans date, catégorie ni scène", () => {
    const wrapper = mount(ContentCard, { props: { nom: 'Aya Nakamura', photo: '/aya.jpg' } })

    expect(wrapper.find('.content-card__nom').text()).toBe('Aya Nakamura')
    expect(wrapper.find('.content-card__photo').attributes('src')).toBe('/aya.jpg')
    expect(wrapper.find('.content-card__meta').exists()).toBe(false)
    expect(wrapper.findComponent(Tag).exists()).toBe(false)
  })

  it('affiche la scène et la date quand elles sont renseignées', () => {
    const wrapper = mount(ContentCard, {
      props: { nom: 'Aya Nakamura', photo: '/aya.jpg', scene: 'Chrome', date: 'Samedi - 21h' },
    })

    expect(wrapper.find('.content-card__scene').text()).toBe('Chrome')
    expect(wrapper.find('.content-card__date').text()).toBe('Samedi - 21h')
  })

  it("n'affiche que la scène quand la date est absente", () => {
    const wrapper = mount(ContentCard, {
      props: { nom: 'Aya Nakamura', photo: '/aya.jpg', scene: 'Chrome' },
    })

    expect(wrapper.find('.content-card__scene').text()).toBe('Chrome')
    expect(wrapper.find('.content-card__date').exists()).toBe(false)
  })

  it('affiche la catégorie sous forme de Tag dès qu’elle est renseignée', () => {
    const wrapper = mount(ContentCard, {
      props: { nom: 'Le féminisme en 2026', photo: '/conf.jpg', categorie: 'Tech' },
    })

    const tag = wrapper.findComponent(Tag)
    expect(tag.exists()).toBe(true)
    expect(tag.props('label')).toBe('Tech')
  })
})
