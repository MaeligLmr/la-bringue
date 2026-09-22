import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentCard from './ContentCard.vue'
import Tag from './Tag.vue'
import Like from './Like.vue'

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

  it("exécute la prop onClick au clic sur la carte", async () => {
    const onClick = vi.fn()
    const wrapper = mount(ContentCard, { props: { nom: 'Aya Nakamura', photo: '/aya.jpg', onClick } })

    await wrapper.find('.content-card__nom').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)

    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("n'affiche aucun bouton like par défaut (ex. exposants)", () => {
    const wrapper = mount(ContentCard, { props: { nom: 'Tatouage', photo: '/tatouage.jpg' } })

    expect(wrapper.findComponent(Like).exists()).toBe(false)
  })

  it('like au clic sans jamais exécuter onClick, et retire le like au second clic', async () => {
    const onClick = vi.fn()
    const wrapper = mount(ContentCard, {
      props: {
        nom: 'Aya Nakamura',
        photo: '/aya.jpg',
        likable: true,
        onClick,
        isLiked: false,
        'onUpdate:isLiked': (value: boolean) => wrapper.setProps({ isLiked: value }),
      },
    })

    const like = wrapper.findComponent(Like)
    expect(like.attributes('aria-label')).toBe('Ajouter Aya Nakamura à Mon programme')

    await like.trigger('click')
    expect(wrapper.emitted('update:isLiked')?.[0]).toEqual([true])
    expect(like.attributes('aria-pressed')).toBe('true')

    await like.trigger('click')
    expect(wrapper.emitted('update:isLiked')?.[1]).toEqual([false])
    expect(like.attributes('aria-pressed')).toBe('false')

    await like.trigger('keydown', { key: 'Enter' })
    expect(onClick).not.toHaveBeenCalled()
  })
})
