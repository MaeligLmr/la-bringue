import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('affiche une icône avec la taille moyenne par défaut', () => {
    const wrapper = mount(Icon, { props: { name: 'user' } })

    expect(wrapper.classes()).toContain('icon--medium')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applique la taille demandée', () => {
    const wrapper = mount(Icon, { props: { name: 'search', size: 'large' } })

    expect(wrapper.classes()).toContain('icon--large')
  })

  it('utilise fill="currentColor" pour hériter la couleur du texte ambiant', () => {
    const wrapper = mount(Icon, { props: { name: 'heart' } })

    expect(wrapper.find('svg path').attributes('fill')).toBe('currentColor')
  })

  it('affiche une icône distincte pour chaque variante remplie/vide', () => {
    const empty = mount(Icon, { props: { name: 'heart' } })
    const filled = mount(Icon, { props: { name: 'heart-filled' } })

    expect(empty.html()).not.toBe(filled.html())
  })

  it('affiche les icônes de marque', () => {
    const wrapper = mount(Icon, { props: { name: 'instagram' } })

    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
