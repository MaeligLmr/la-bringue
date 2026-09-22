import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Like from './Like.vue'
import Icon from './Icon.vue'

describe('Like', () => {
  it('affiche le cœur vide et aria-pressed à false par défaut', () => {
    const wrapper = mount(Like)

    expect(wrapper.findComponent(Icon).props('name')).toBe('heart')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    expect(wrapper.attributes('aria-label')).toBe('Ajouter à Mon programme')
  })

  it('passe à liké au clic, puis retire le like au second clic', async () => {
    const wrapper = mount(Like, {
      props: {
        modelValue: false,
        'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
      },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.findComponent(Icon).props('name')).toBe('heart-filled')
    expect(wrapper.attributes('aria-pressed')).toBe('true')

    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false])
    expect(wrapper.findComponent(Icon).props('name')).toBe('heart')
  })

  it('affiche le cœur plein quand il est déjà liké', async () => {
    const wrapper = mount(Like, { props: { modelValue: true } })

    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
    expect(wrapper.findComponent(Icon).props('name')).toBe('heart-filled')
  })
})
