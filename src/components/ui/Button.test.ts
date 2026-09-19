import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche le texte du bouton et type="button" par défaut', () => {
    const wrapper = mount(Button, { slots: { default: 'Valider' } })

    expect(wrapper.text()).toBe('Valider')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })

  it('transmet les clics au gestionnaire natif du parent', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Button, {
      slots: { default: 'Valider' },
      attrs: { onClick },
    })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('se désactive via la prop disabled', () => {
    const wrapper = mount(Button, { props: { disabled: true }, slots: { default: 'Valider' } })

    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it("affiche seulement l'icône en mode icon-only, avec un aria-label", () => {
    const wrapper = mount(Button, { props: { iconOnly: 'heart', label: 'Ajouter aux favoris' } })

    expect(wrapper.text()).toBe('')
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.attributes('aria-label')).toBe('Ajouter aux favoris')
  })

  it('avertit en développement si iconOnly est utilisé sans label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(Button, { props: { iconOnly: 'heart' } })

    expect(warn).toHaveBeenCalled()
  })

  it('pointe les tokens CSS vers la bonne couleur/variante', () => {
    const wrapper = mount(Button, {
      props: { color: 'danger', variant: 'outlined' },
      slots: { default: 'Supprimer' },
    })

    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('var(--button-danger-outlined-idle-background)')
  })
})
