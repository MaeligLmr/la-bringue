import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ProgrammationSection from './ProgrammationSection.vue'
import programmationData from '../../data/programmation.json'

async function mountSection() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/programmation', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  const wrapper = mount(ProgrammationSection, {
    props: { artistes: programmationData },
    global: { plugins: [router] },
  })
  return { wrapper, router }
}

describe('ProgrammationSection', () => {
  it('affiche un bloc par jour du festival', async () => {
    const { wrapper } = await mountSection()

    const jours = wrapper.findAll('.programmation-day__jour').map((node) => node.text())
    expect(jours).toEqual(['Vendredi 28 août', 'Samedi 29 août', 'Dimanche 30 août'])
  })

  it('met en tête d’affiche le dernier concert de la scène Chrome de chaque jour', async () => {
    const { wrapper } = await mountSection()

    const headliners = wrapper.findAll('.programmation-day__headliner').map((node) => node.text())
    expect(headliners).toEqual(['Aya Nakamura', 'Addison Rae', 'Theodora'])
  })

  it('liste ensuite 4 autres artistes du jour, du plus tardif au plus tôt', async () => {
    const { wrapper } = await mountSection()

    const [vendredi] = wrapper.findAll('.programmation-day__others')
    expect(vendredi.findAll('li').map((node) => node.text())).toEqual([
      'Little Simz',
      'Charlotte de Witte',
      'Zaho',
      'Bamby…',
    ])
  })

  it('mène à la page Programmation via le bouton', async () => {
    const { wrapper, router } = await mountSection()

    const button = wrapper.findAll('button').find((node) => node.text() === 'Toute la programmation')
    await button?.trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/programmation'))
  })
})
