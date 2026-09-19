import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from './Select.vue'

const OPTIONS = [
  { value: 'system', label: 'Par défaut' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

describe('Select', () => {
  it("affiche le libellé de l'option sélectionnée et pas le dropdown au repos", () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'light', options: OPTIONS },
      attachTo: document.body,
    })

    expect(wrapper.find('.select__value').text()).toBe('Clair')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.find('[role="combobox"]').attributes('aria-expanded')).toBe('false')

    wrapper.unmount()
  })

  it('ouvre le dropdown au clic et liste toutes les options', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS },
      attachTo: document.body,
    })

    await wrapper.find('[role="combobox"]').trigger('click')

    const listbox = wrapper.find('[role="listbox"]')
    expect(listbox.exists()).toBe(true)
    expect(wrapper.findAll('[role="option"]')).toHaveLength(3)

    wrapper.unmount()
  })

  it('sélectionner une option émet update:modelValue et referme le dropdown', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS },
      attachTo: document.body,
    })

    await wrapper.find('[role="combobox"]').trigger('click')
    await wrapper.findAll('[role="option"]')[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['light']])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('se navigue et se sélectionne au clavier (flèches + Entrée)', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS },
      attachTo: document.body,
    })

    const trigger = wrapper.find('[role="combobox"]')
    await trigger.trigger('keydown', { key: 'ArrowDown' }) // ouvre, index actif = "system" (0)
    await trigger.trigger('keydown', { key: 'ArrowDown' }) // -> "light" (1)
    await trigger.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['light']])

    wrapper.unmount()
  })

  it('Échap referme le dropdown sans changer la sélection', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS },
      attachTo: document.body,
    })

    await wrapper.find('[role="combobox"]').trigger('click')
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    wrapper.unmount()
  })

  it('un clic en dehors referme le dropdown', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS },
      attachTo: document.body,
    })

    await wrapper.find('[role="combobox"]').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    document.body.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('pointe la taille (padding/police) vers les tokens Button correspondants', () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS, size: 'large' },
      attachTo: document.body,
    })

    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('var(--button-large-with-text-padding-x)')
    expect(style).toContain('var(--font-size-button-large)')

    wrapper.unmount()
  })

  it('disabled empêche l\'ouverture', async () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'system', options: OPTIONS, disabled: true },
      attachTo: document.body,
    })

    expect(wrapper.find('[role="combobox"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[role="combobox"]').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    wrapper.unmount()
  })
})
