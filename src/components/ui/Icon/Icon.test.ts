import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('affiche une icône avec la taille moyenne par défaut', async () => {
    const wrapper = mount(Icon, { props: { name: 'user' } })

    expect(wrapper.classes()).toContain('icon--medium')
    expect(wrapper.attributes('aria-hidden')).toBe('true')

    // Lazy-loaded: the SVG isn't there synchronously after mount.
    expect(wrapper.find('svg').exists()).toBe(false)
    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
  })

  it('applique la taille demandée', () => {
    const wrapper = mount(Icon, { props: { name: 'search', size: 'large' } })

    expect(wrapper.classes()).toContain('icon--large')
  })

  it('utilise fill="currentColor" pour hériter la couleur du texte ambiant', async () => {
    const wrapper = mount(Icon, { props: { name: 'heart' } })

    await vi.waitFor(() => expect(wrapper.find('svg path').exists()).toBe(true))
    expect(wrapper.find('svg path').attributes('fill')).toBe('currentColor')
  })

  it('affiche une icône distincte pour chaque variante remplie/vide', async () => {
    const empty = mount(Icon, { props: { name: 'heart' } })
    const filled = mount(Icon, { props: { name: 'heart-filled' } })

    await vi.waitFor(() => expect(empty.find('svg').exists()).toBe(true))
    await vi.waitFor(() => expect(filled.find('svg').exists()).toBe(true))
    expect(empty.html()).not.toBe(filled.html())
  })

  it('affiche les icônes de marque', async () => {
    const wrapper = mount(Icon, { props: { name: 'instagram' } })

    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
  })

  it('met en cache une icône déjà chargée (pas de rechargement au retour)', async () => {
    const wrapper = mount(Icon, { props: { name: 'user' } })
    await vi.waitFor(() => expect(wrapper.find('svg').exists()).toBe(true))
    const firstLoad = wrapper.html()

    await wrapper.setProps({ name: 'search' })
    await vi.waitFor(() => expect(wrapper.html()).not.toBe(firstLoad))

    await wrapper.setProps({ name: 'user' })

    // Revenir sur "user" doit être synchrone (servi depuis le cache), pas
    // besoin d'attendre pour le voir déjà affiché.
    expect(wrapper.html()).toBe(firstLoad)
  })
})
