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
  it('affiche le titre newsletter et son bouton', async () => {
    const { wrapper } = await mountFooter()

    expect(wrapper.text()).toContain('La newsletter de LA BRINGUE')
    expect(wrapper.find('button').text()).toBe("S'inscrire à la newsletter")
  })

  it("affiche le bloc d'adresse du festival avec l'icône map", async () => {
    const { wrapper } = await mountFooter()

    expect(wrapper.text()).toContain('Accéder au festival')
    expect(wrapper.find('address').exists()).toBe(true)
    expect(wrapper.find('address').text()).toContain('Adresse du festival')
  })

  it('affiche les 4 liens (À propos, Infos pratiques, Contact naviguent, Mentions légales est inerte)', async () => {
    const { wrapper, router } = await mountFooter()

    const links = wrapper.findAll('.footer__link')
    expect(links.map((link) => link.text())).toEqual([
      'À propos',
      'Infos pratiques',
      'Contact',
      'Mentions légales',
    ])

    const mentionsLegales = links[3]
    expect(mentionsLegales.element.tagName).toBe('SPAN')

    await wrapper.find('a[href="/a-propos"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/a-propos'))

    await wrapper.findAll('a[href="/infos-pratiques"]')[0].trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/infos-pratiques'))
  })

  it('affiche les icônes des réseaux sociaux', async () => {
    const { wrapper } = await mountFooter()

    expect(wrapper.find('button[aria-label="Instagram"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="TikTok"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="WhatsApp"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Facebook"]').exists()).toBe(true)
  })
})
