import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminPage from './AdminPage.vue'

async function mountPage(props: Record<string, unknown>) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/admin/artistes', name: 'admin-artistes', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  return mount(AdminPage, { props, slots: { default: '<p class="contenu">Contenu</p>' }, global: { plugins: [router] } })
}

describe('AdminPage', () => {
  it('affiche le titre et le contenu, sans lien retour sur une liste', async () => {
    const wrapper = await mountPage({ title: 'Artistes' })

    expect(wrapper.find('h1').text()).toBe('Artistes')
    expect(wrapper.find('.contenu').exists()).toBe(true)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.classes()).toContain('admin-page--full')
  })

  it('affiche le lien retour vers la liste sur un formulaire', async () => {
    const wrapper = await mountPage({
      title: 'Nouvelle artiste',
      back: { to: { name: 'admin-artistes' }, label: 'Artistes' },
      width: 'form',
    })

    const back = wrapper.find('a')
    expect(back.text()).toBe('← Artistes')
    expect(back.attributes('href')).toBe('/admin/artistes')
    expect(wrapper.classes()).toContain('admin-page--form')
  })
})
