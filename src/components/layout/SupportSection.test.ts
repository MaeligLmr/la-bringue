import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import SupportSection from './SupportSection.vue'
import { useTheme } from '../../composables/useTheme'
import radioNovaBlanc from '../../assets/sponsor/sponsor1.png'
import radioNovaNoir from '../../assets/sponsor/sponsor1-noir.png'

afterEach(() => {
  useTheme().setPreference('system')
})

describe('SupportSection', () => {
  it('affiche le logo de chaque sponsor, avec son nom en texte alternatif', () => {
    const wrapper = mount(SupportSection)

    const alts = wrapper.findAll('img').map((img) => img.attributes('alt'))
    expect(alts).toEqual([
      'Radio Nova (nouvel onglet)',
      'Reporterre (nouvel onglet)',
      'The Simones (nouvel onglet)',
    ])
  })

  it('ouvre le site du sponsor dans un nouvel onglet au clic sur son logo', () => {
    const wrapper = mount(SupportSection)

    const links = wrapper.findAll('a')
    expect(links.map((link) => link.attributes('href'))).toEqual([
      'https://www.nova.fr',
      'https://reporterre.net',
      'https://the-simones.com',
    ])
    for (const link of links) {
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    }
  })

  it('adapte le logo Radio Nova au thème (noir en clair, blanc en sombre)', async () => {
    const { setPreference } = useTheme()
    setPreference('light')
    const wrapper = mount(SupportSection)
    const novaSrc = () => wrapper.find('img').attributes('src')

    expect(novaSrc()).toBe(radioNovaNoir)

    setPreference('dark')
    await nextTick()
    expect(novaSrc()).toBe(radioNovaBlanc)
  })
})
