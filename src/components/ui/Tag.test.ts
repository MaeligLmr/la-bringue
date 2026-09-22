import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Tag from './Tag.vue'
import { TAG_VARIANTS } from '../../types/tag'

describe('Tag', () => {
  it('affiche le libellé fourni', () => {
    const wrapper = mount(Tag, { props: { label: 'Restauration' } })

    expect(wrapper.text()).toBe('Restauration')
  })

  it('se réutilise pour des types de catégorie différents sans modification du composant', () => {
    const labels = ['Chrome', 'Restauration', 'Tech']

    for (const label of labels) {
      const wrapper = mount(Tag, { props: { label } })
      expect(wrapper.text()).toBe(label)
    }
  })

  it('variante pink par défaut', () => {
    const wrapper = mount(Tag, { props: { label: 'Tech' } })

    expect(wrapper.classes()).toContain('tag--pink')
  })

  it('change de couleur selon la variante, sans changer de structure', () => {
    const [reference, ...others] = TAG_VARIANTS.map((variant) =>
      mount(Tag, { props: { label: 'Tech', variant } })
    )

    expect(reference.classes()).toContain(`tag--${TAG_VARIANTS[0]}`)
    others.forEach((wrapper, index) => {
      expect(wrapper.classes()).toContain(`tag--${TAG_VARIANTS[index + 1]}`)
      expect(wrapper.element.tagName).toBe(reference.element.tagName)
      expect(wrapper.text()).toBe(reference.text())
    })
  })
})
