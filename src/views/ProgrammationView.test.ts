import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ProgrammationView from './ProgrammationView.vue'
import programmationData from '../data/programmation.json'

async function mountProgrammation(url = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: ProgrammationView }],
  })
  router.push(url)
  await router.isReady()
  return mount(ProgrammationView, { global: { plugins: [router] }, attachTo: document.body })
}

function filterButton(wrapper: Awaited<ReturnType<typeof mountProgrammation>>, label: string) {
  const button = wrapper.findAll('[role="group"] button').find((node) => node.text() === label)
  if (!button) throw new Error(`Bouton de filtre "${label}" introuvable`)
  return button
}

function displayedNames(wrapper: Awaited<ReturnType<typeof mountProgrammation>>) {
  return wrapper.findAll('.content-card__nom').map((node) => node.text())
}

describe('ProgrammationView', () => {
  it('affiche tous les artistes de programmation.json sans filtre actif', async () => {
    const wrapper = await mountProgrammation()

    expect(displayedNames(wrapper)).toHaveLength(programmationData.length)

    wrapper.unmount()
  })

  it('trie les artistes par jour puis par heure', async () => {
    const wrapper = await mountProgrammation()

    const names = displayedNames(wrapper)
    expect(names[0]).toBe('Iliona')
    expect(names[names.length - 1]).toBe('Theodora')

    wrapper.unmount()
  })

  it('affiche la scène, le jour/heure et la catégorie sur chaque carte', async () => {
    const wrapper = await mountProgrammation()

    const card = wrapper.findAll('.content-card').find((node) => node.text().includes('Theodora'))
    expect(card?.find('.content-card__scene').text()).toBe('Chrome')
    expect(card?.find('.content-card__date').text()).toBe('Dimanche 30 août - 20h55')
    expect(card?.find('.tag').text()).toBe('Rap')

    wrapper.unmount()
  })

  it('propose les filtres jour et scène', async () => {
    const wrapper = await mountProgrammation()

    const groups = wrapper.findAll('[role="group"]').map((group) => group.attributes('aria-label'))
    expect(groups).toEqual(['Jour', 'Scène'])
    expect(filterButton(wrapper, 'Tous les jours').attributes('aria-pressed')).toBe('true')
    expect(filterButton(wrapper, 'Toutes les scènes').attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })

  it('ne garde que les artistes du jour sélectionné', async () => {
    const wrapper = await mountProgrammation()

    await filterButton(wrapper, 'Samedi 29 août').trigger('click')

    const expected = programmationData.filter((a) => a.date === '2026-08-29').map((a) => a.nom)
    expect(displayedNames(wrapper).sort()).toEqual(expected.sort())

    wrapper.unmount()
  })

  it('combine jour et scène', async () => {
    const wrapper = await mountProgrammation()

    await filterButton(wrapper, 'Dimanche 30 août').trigger('click')
    await filterButton(wrapper, 'Soft').trigger('click')

    expect(displayedNames(wrapper)).toEqual(['Marguerite', 'Ethel Cain'])
    expect(wrapper.findAll('.content-card__scene').map((node) => node.text())).toEqual([
      'Soft',
      'Soft',
    ])

    wrapper.unmount()
  })

  it('pré-applique le jour passé dans l’URL (lien depuis l’accueil)', async () => {
    const wrapper = await mountProgrammation('/?date=2026-08-29')

    expect(filterButton(wrapper, 'Samedi 29 août').attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })
})
