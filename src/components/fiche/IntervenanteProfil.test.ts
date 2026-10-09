import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IntervenanteProfil from './IntervenanteProfil.vue'
import placeholder from '../../assets/conferenciere/placeholder.jpg'

const INES = { id: 1, nom: 'Inès Moreau', photo: '/conferencieres/ines.jpg', description: 'Programmatrice de festivals' }

describe('IntervenanteProfil', () => {
  it('affiche photo, nom et bio', () => {
    const wrapper = mount(IntervenanteProfil, { props: { intervenante: INES } })

    expect(wrapper.find('img').attributes('src')).toBe('/conferencieres/ines.jpg')
    expect(wrapper.find('h3').text()).toBe('Inès Moreau')
    expect(wrapper.find('p').text()).toBe('Programmatrice de festivals')
  })

  it('affiche le portrait générique sans photo en base', () => {
    const wrapper = mount(IntervenanteProfil, { props: { intervenante: { ...INES, photo: null } } })

    expect(wrapper.find('img').attributes('src')).toBe(placeholder)
  })

  it('bascule sur le portrait générique si la photo est introuvable', async () => {
    const wrapper = mount(IntervenanteProfil, { props: { intervenante: INES } })

    await wrapper.find('img').trigger('error')

    expect(wrapper.find('img').attributes('src')).toBe(placeholder)
  })
})
