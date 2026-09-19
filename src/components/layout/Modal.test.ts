import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Modal from './Modal.vue'

describe('Modal', () => {
  it("n'affiche rien quand open est faux", () => {
    const wrapper = mount(Modal, { props: { open: false }, attachTo: document.body })

    expect(document.querySelector('.modal__backdrop')).toBeNull()

    wrapper.unmount()
  })

  it('affiche le titre et le contenu du slot quand open est vrai', () => {
    const wrapper = mount(Modal, {
      props: { open: true, title: 'Un titre' },
      slots: { default: '<p>Contenu</p>' },
      attachTo: document.body,
    })

    expect(document.querySelector('.modal__dialog')?.textContent).toContain('Un titre')
    expect(document.querySelector('.modal__dialog')?.textContent).toContain('Contenu')

    wrapper.unmount()
  })

  it("n'affiche pas de <h2> quand aucun titre n'est fourni", () => {
    const wrapper = mount(Modal, {
      props: { open: true },
      slots: { default: '<p>Contenu</p>' },
      attachTo: document.body,
    })

    expect(document.querySelector('.modal__dialog h2')).toBeNull()

    wrapper.unmount()
  })

  it('émet "close" au clic sur le bouton de fermeture', async () => {
    const wrapper = mount(Modal, { props: { open: true }, attachTo: document.body })

    document
      .querySelector('.modal__close')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('émet "close" au clic sur le backdrop', async () => {
    const wrapper = mount(Modal, { props: { open: true }, attachTo: document.body })

    document
      .querySelector('.modal__backdrop')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('émet "close" sur Échap', async () => {
    const wrapper = mount(Modal, { props: { open: true }, attachTo: document.body })

    document
      .querySelector('.modal__backdrop')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })
})
