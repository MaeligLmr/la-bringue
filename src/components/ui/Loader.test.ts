import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Loader from './Loader.vue'

describe('Loader', () => {
  it('annonce le chargement aux lecteurs d’écran, l’étoile restant décorative', () => {
    const wrapper = mount(Loader)

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toBe('Chargement…')
    expect(wrapper.find('img').attributes('aria-hidden')).toBe('true')
  })

  it('accepte un libellé personnalisé', () => {
    expect(mount(Loader, { props: { label: 'Chargement de la fiche…' } }).text()).toBe('Chargement de la fiche…')
  })
})
