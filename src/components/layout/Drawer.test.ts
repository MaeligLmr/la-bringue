import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Drawer from './Drawer.vue'

describe('Drawer', () => {
  it("n'affiche rien quand open est faux", () => {
    const wrapper = mount(Drawer, { props: { open: false }, attachTo: document.body })

    expect(document.querySelector('.drawer__backdrop')).toBeNull()

    wrapper.unmount()
  })

  it('affiche le titre et le contenu du slot quand open est vrai', () => {
    const wrapper = mount(Drawer, {
      props: { open: true, title: 'Un titre' },
      slots: { default: '<p>Contenu</p>' },
      attachTo: document.body,
    })

    expect(document.querySelector('.drawer__panel')?.textContent).toContain('Un titre')
    expect(document.querySelector('.drawer__panel')?.textContent).toContain('Contenu')

    wrapper.unmount()
  })

  it("n'affiche pas de <h2> quand aucun titre n'est fourni", () => {
    const wrapper = mount(Drawer, {
      props: { open: true },
      slots: { default: '<p>Contenu</p>' },
      attachTo: document.body,
    })

    expect(document.querySelector('.drawer__panel h2')).toBeNull()

    wrapper.unmount()
  })

  it('émet "close" au clic sur le bouton de fermeture', async () => {
    const wrapper = mount(Drawer, { props: { open: true }, attachTo: document.body })

    document
      .querySelector('.drawer__close')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('émet "close" au clic sur le backdrop', async () => {
    const wrapper = mount(Drawer, { props: { open: true }, attachTo: document.body })

    document
      .querySelector('.drawer__backdrop')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('émet "close" sur Échap', async () => {
    const wrapper = mount(Drawer, { props: { open: true }, attachTo: document.body })

    document
      .querySelector('.drawer__backdrop')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })
})
