import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { useBreadcrumbTitle } from '../../../composables/useBreadcrumbTitle/useBreadcrumbTitle'
import Breadcrumb from './Breadcrumb.vue'

const stub = { template: '<div />' }

async function mountAt(url: string) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: stub },
      { path: '/conferences', name: 'conferences', component: stub },
      { path: '/:type/fiche/:id', name: 'fiche', component: stub },
    ],
  })
  router.push(url)
  await router.isReady()
  return { wrapper: mount(Breadcrumb, { global: { plugins: [router] } }), router }
}

describe('Breadcrumb', () => {
  it("n'est pas affiché sur l'accueil", async () => {
    const { wrapper } = await mountAt('/')
    expect(wrapper.find('.breadcrumb').exists()).toBe(false)
  })

  it('affiche Accueil / page courante', async () => {
    const { wrapper } = await mountAt('/conferences')
    expect(wrapper.find('nav').text()).toContain('Accueil')
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Conférences')
  })

  it('inclut la liste parente pour une fiche', async () => {
    const { wrapper } = await mountAt('/exposant/fiche/3')
    const links = wrapper.findAll('.breadcrumb__link').map((l) => l.attributes('href'))
    expect(links).toEqual(['/', '/exposants'])
  })

  it('affiche le nom de la fiche une fois chargé', async () => {
    useBreadcrumbTitle().breadcrumbTitle.value = 'Maya Dupont'
    const { wrapper } = await mountAt('/exposant/fiche/3')
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Maya Dupont')
    useBreadcrumbTitle().breadcrumbTitle.value = null
  })
})
