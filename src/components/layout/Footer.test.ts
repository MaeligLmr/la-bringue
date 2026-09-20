import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Footer from './Footer.vue'

async function mountFooter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/a-propos', component: { template: '<div />' } },
      { path: '/infos-pratiques', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  return { wrapper: mount(Footer, { global: { plugins: [router] } }), router }
}

describe('Footer', () => {
  it('affiche le bloc newsletter avec un bouton', async () => {
    const { wrapper } = await mountFooter()

    expect(wrapper.text()).toContain('Newsletter de La Bringue')
    expect(wrapper.find('button').text()).toBe("S'inscrire")
  })

  it("affiche le bloc d'adresse du festival", async () => {
    const { wrapper } = await mountFooter()

    expect(wrapper.text()).toContain('Accéder au festival')
    expect(wrapper.find('address').exists()).toBe(true)
  })

  it('les liens À propos et Contact naviguent, Mentions légales est inerte', async () => {
    const { wrapper, router } = await mountFooter()

    expect(wrapper.text()).toContain('À propos')
    expect(wrapper.text()).toContain('Contact')
    expect(wrapper.text()).toContain('Mentions légales')

    const mentionsLegales = wrapper.findAll('.footer__link').find((link) => link.text() === 'Mentions légales')
    expect(mentionsLegales?.element.tagName).toBe('SPAN')

    await wrapper.find('a[href="/a-propos"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/a-propos'))

    await wrapper.find('a[href="/infos-pratiques"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/infos-pratiques'))
  })
})
