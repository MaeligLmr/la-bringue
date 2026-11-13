import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from './Checkbox.vue'

describe('Checkbox', () => {
  it('affiche le libellé et reflète la valeur', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true }, slots: { default: 'Annoncée' } })

    expect(wrapper.text()).toBe('Annoncée')
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true)
  })

  it('émet la nouvelle valeur au changement', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })

    await wrapper.find('input').setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('transmet l’id à la case native pour qu’un <label for> fonctionne', () => {
    const wrapper = mount(Checkbox, { props: { id: 'admin-actif' } })

    expect(wrapper.find('input#admin-actif').attributes('type')).toBe('checkbox')
  })

  it('désactive la case', () => {
    const wrapper = mount(Checkbox, { props: { disabled: true } })

    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('checkbox--disabled')
  })
})
