import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterableList from './FilterableList.vue'
import type { FilterConfig } from '../../types/filterable-list'

const ITEMS = [
  { id: 1, nom: 'Beyoncé', jour: 'samedi', scene: 'chrome' },
  { id: 2, nom: 'Aya Nakamura', jour: 'samedi', scene: 'summer' },
  { id: 3, nom: 'Angèle', jour: 'dimanche', scene: 'chrome' },
]

const FILTERS: FilterConfig[] = [
  {
    key: 'jour',
    label: 'Jour',
    allLabel: 'Tous les jours',
    options: [
      { value: 'samedi', label: 'Samedi' },
      { value: 'dimanche', label: 'Dimanche' },
    ],
  },
  {
    key: 'scene',
    label: 'Scène',
    allLabel: 'Toutes les scènes',
    options: [
      { value: 'chrome', label: 'Chrome' },
      { value: 'summer', label: 'Summer' },
    ],
  },
]

function mountList(props: Record<string, unknown> = {}) {
  return mount(FilterableList, {
    props: { items: ITEMS, filters: FILTERS, ...props },
    slots: { item: `<template #item="{ item }"><span class="nom">{{ item.nom }}</span></template>` },
    attachTo: document.body,
  })
}

function filterButton(wrapper: ReturnType<typeof mountList>, label: string) {
  const button = wrapper.findAll('[role="group"] button').find((node) => node.text() === label)
  if (!button) throw new Error(`Bouton de filtre "${label}" introuvable`)
  return button
}

function displayedNames(wrapper: ReturnType<typeof mountList>) {
  return wrapper.findAll('.nom').map((node) => node.text())
}

describe('FilterableList', () => {
  it('affiche tous les éléments via le slot quand rien n’est filtré', () => {
    const wrapper = mountList()

    expect(displayedNames(wrapper)).toEqual(['Beyoncé', 'Aya Nakamura', 'Angèle'])
    expect(wrapper.find('.filterable-list__reset').exists()).toBe(false)

    wrapper.unmount()
  })

  it('filtre en temps réel sur le nom, sans tenir compte de la casse ni des accents', async () => {
    const wrapper = mountList()

    await wrapper.find('input[type="search"]').setValue('beyonce')
    expect(displayedNames(wrapper)).toEqual(['Beyoncé'])

    await wrapper.find('input[type="search"]').setValue('ANG')
    expect(displayedNames(wrapper)).toEqual(['Angèle'])

    wrapper.unmount()
  })

  it('affiche une rangée de boutons par filtre, "tous" sélectionné par défaut', () => {
    const wrapper = mountList()

    const groups = wrapper.findAll('[role="group"]')
    expect(groups.map((group) => group.attributes('aria-label'))).toEqual(['Jour', 'Scène'])
    expect(groups[0].findAll('button').map((node) => node.text())).toEqual([
      'Tous les jours',
      'Samedi',
      'Dimanche',
    ])
    expect(filterButton(wrapper, 'Tous les jours').attributes('aria-pressed')).toBe('true')
    expect(filterButton(wrapper, 'Samedi').attributes('aria-pressed')).toBe('false')

    wrapper.unmount()
  })

  it('sélectionne une option au clic, et "tous" retire le filtre', async () => {
    const wrapper = mountList()

    await filterButton(wrapper, 'Dimanche').trigger('click')
    expect(displayedNames(wrapper)).toEqual(['Angèle'])
    expect(filterButton(wrapper, 'Dimanche').attributes('aria-pressed')).toBe('true')
    expect(filterButton(wrapper, 'Tous les jours').attributes('aria-pressed')).toBe('false')

    await filterButton(wrapper, 'Tous les jours').trigger('click')
    expect(displayedNames(wrapper)).toEqual(['Beyoncé', 'Aya Nakamura', 'Angèle'])

    wrapper.unmount()
  })

  it('combine recherche et filtres en logique ET', async () => {
    const wrapper = mountList({ selected: { jour: 'samedi' } })
    expect(displayedNames(wrapper)).toEqual(['Beyoncé', 'Aya Nakamura'])

    await filterButton(wrapper, 'Chrome').trigger('click')
    expect(displayedNames(wrapper)).toEqual(['Beyoncé'])

    await wrapper.find('input[type="search"]').setValue('aya')
    expect(displayedNames(wrapper)).toEqual([])

    wrapper.unmount()
  })

  it('applique les filtres pré-sélectionnés via v-model:selected', async () => {
    const wrapper = mountList({ selected: { scene: 'chrome' } })

    expect(displayedNames(wrapper)).toEqual(['Beyoncé', 'Angèle'])

    await filterButton(wrapper, 'Dimanche').trigger('click')
    expect(wrapper.emitted('update:selected')?.[0]).toEqual([{ scene: 'chrome', jour: 'dimanche' }])

    wrapper.unmount()
  })

  it('affiche un message explicite et un bouton qui réinitialise tout quand il n’y a aucun résultat', async () => {
    const wrapper = mountList({
      selected: { jour: 'dimanche' },
      'onUpdate:selected': (value: Record<string, string>) => wrapper.setProps({ selected: value }),
    })

    await wrapper.find('input[type="search"]').setValue('aya')
    expect(displayedNames(wrapper)).toEqual([])
    expect(wrapper.find('.filterable-list__empty').text()).toContain(
      'Aucun résultat ne correspond à ta recherche.'
    )

    await wrapper.find('.filterable-list__empty button').trigger('click')
    expect((wrapper.find('input[type="search"]').element as HTMLInputElement).value).toBe('')
    expect(displayedNames(wrapper)).toEqual(['Beyoncé', 'Aya Nakamura', 'Angèle'])
    expect(wrapper.find('.filterable-list__empty').exists()).toBe(false)

    wrapper.unmount()
  })

  it('affiche le bouton "Réinitialiser les filtres" dès qu’un critère est actif', async () => {
    const wrapper = mountList()

    await wrapper.find('input[type="search"]').setValue('a')
    expect(wrapper.find('.filterable-list__reset').text()).toBe('Réinitialiser les filtres')

    wrapper.unmount()
  })
})
