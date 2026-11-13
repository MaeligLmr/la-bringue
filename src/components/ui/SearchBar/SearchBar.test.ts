import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from './SearchBar.vue'

describe('SearchBar', () => {
  it('utilise « Rechercher par nom » par défaut, ou le placeholder fourni', () => {
    expect(mount(SearchBar).find('input').attributes('placeholder')).toBe('Rechercher par nom')

    const custom = mount(SearchBar, { props: { placeholder: 'Chercher une artiste' } })
    expect(custom.find('input').attributes('placeholder')).toBe('Chercher une artiste')
    expect(custom.find('input').attributes('aria-label')).toBe('Chercher une artiste')
  })

  it('émet la saisie', async () => {
    const wrapper = mount(SearchBar, { props: { modelValue: '' } })

    await wrapper.find('input[type="search"]').setValue('aya')

    expect(wrapper.emitted('update:modelValue')).toEqual([['aya']])
  })

  it('n’affiche la croix que s’il y a une saisie, et elle vide la recherche', async () => {
    const empty = mount(SearchBar, { props: { modelValue: '' } })
    expect(empty.find('.search-bar__clear').exists()).toBe(false)

    const wrapper = mount(SearchBar, { props: { modelValue: 'aya' } })
    await wrapper.find('.search-bar__clear').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
  })
})
