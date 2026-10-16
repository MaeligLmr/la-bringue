import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentCard from './ContentCard.vue'
import FilterableList from './FilterableList.vue'
import type { FilterConfig } from '../../types/ui/filterable-list.ts'

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

  it('affiche une croix dans le champ dès qu’une recherche est saisie, et elle la vide', async () => {
    const wrapper = mountList()
    expect(wrapper.find('.filterable-list__search-clear').exists()).toBe(false)

    const input = wrapper.find('input[type="search"]')
    await input.setValue('aya')
    expect(displayedNames(wrapper)).toEqual(['Aya Nakamura'])

    await wrapper.find('.filterable-list__search-clear').trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(displayedNames(wrapper)).toEqual(['Beyoncé', 'Aya Nakamura', 'Angèle'])
    expect(wrapper.find('.filterable-list__search-clear').exists()).toBe(false)

    wrapper.unmount()
  })

  it('fournit la recherche aux cartes pour qu’elles surlignent le nom', async () => {
    const wrapper = mount(FilterableList, {
      props: { items: ITEMS },
      slots: { item: `<template #item="{ item }"><ContentCard :nom="item.nom" /></template>` },
      global: { components: { ContentCard } },
      attachTo: document.body,
    })

    await wrapper.find('input[type="search"]').setValue('nak')

    expect(wrapper.findAll('mark').map((node) => node.text())).toEqual(['Nak'])

    wrapper.unmount()
  })

  describe('rangées de filtres à la souris', () => {
    // happy-dom ne fait aucune mise en page : on fixe les dimensions à la main.
    function scrollableRow(wrapper: ReturnType<typeof mountList>, scrollLeft = 0) {
      const row = wrapper.find('[role="group"]').element as HTMLElement
      Object.defineProperty(row, 'scrollWidth', { value: 500, configurable: true })
      Object.defineProperty(row, 'clientWidth', { value: 100, configurable: true })
      row.scrollLeft = scrollLeft
      row.setPointerCapture = vi.fn()
      return row
    }

    function wheel(row: HTMLElement, init: WheelEventInit) {
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init })
      row.dispatchEvent(event)
      return event
    }

    it('la molette verticale fait défiler la rangée horizontalement', () => {
      const wrapper = mountList()
      const row = scrollableRow(wrapper)

      const event = wheel(row, { deltaY: 40 })

      expect(event.defaultPrevented).toBe(true)
      expect(row.scrollLeft).toBe(40)

      wrapper.unmount()
    })

    it('convertit les lignes de la molette en pixels', () => {
      const wrapper = mountList()
      const row = scrollableRow(wrapper)

      wheel(row, { deltaY: 2, deltaMode: WheelEvent.DOM_DELTA_LINE })

      expect(row.scrollLeft).toBe(32)

      wrapper.unmount()
    })

    it('laisse la page défiler quand la rangée est au bout, ou pour un défilement horizontal', () => {
      const wrapper = mountList()
      const row = scrollableRow(wrapper)

      expect(wheel(row, { deltaY: -40 }).defaultPrevented).toBe(false)
      expect(wheel(row, { deltaX: 50, deltaY: 10 }).defaultPrevented).toBe(false)

      row.scrollLeft = 400
      expect(wheel(row, { deltaY: 40 }).defaultPrevented).toBe(false)

      wrapper.unmount()
    })

    it('laisse la page défiler quand la rangée n’a rien à défiler', () => {
      const wrapper = mountList()
      const row = wrapper.find('[role="group"]').element as HTMLElement

      expect(wheel(row, { deltaY: 40 }).defaultPrevented).toBe(false)

      wrapper.unmount()
    })

    it('un glissement à la souris fait défiler la rangée sans sélectionner le filtre sous le curseur', async () => {
      vi.useFakeTimers()
      const wrapper = mountList()
      const row = scrollableRow(wrapper, 100)
      const group = wrapper.find('[role="group"]')

      await group.trigger('pointerdown', { pointerType: 'mouse', button: 0, clientX: 200 })
      await group.trigger('pointermove', { pointerType: 'mouse', clientX: 197 })
      expect(row.scrollLeft).toBe(100) // sous le seuil : pas encore un glissement

      await group.trigger('pointermove', { pointerType: 'mouse', clientX: 150, pointerId: 1 })
      expect(row.setPointerCapture).toHaveBeenCalledWith(1)
      expect(row.scrollLeft).toBe(150)

      await group.trigger('pointerup')
      await filterButton(wrapper, 'Samedi').trigger('click')
      expect(filterButton(wrapper, 'Samedi').attributes('aria-pressed')).toBe('false')

      // Après le relâchement, le clic suivant sélectionne de nouveau.
      vi.runAllTimers()
      await filterButton(wrapper, 'Samedi').trigger('click')
      expect(filterButton(wrapper, 'Samedi').attributes('aria-pressed')).toBe('true')

      vi.useRealTimers()
      wrapper.unmount()
    })

    it('ignore le doigt et les boutons autres que le principal', async () => {
      const wrapper = mountList()
      const row = scrollableRow(wrapper)
      const group = wrapper.find('[role="group"]')

      await group.trigger('pointerdown', { pointerType: 'touch', button: 0, clientX: 200 })
      await group.trigger('pointermove', { clientX: 100 })
      await group.trigger('pointerdown', { pointerType: 'mouse', button: 2, clientX: 200 })
      await group.trigger('pointermove', { clientX: 100 })

      expect(row.scrollLeft).toBe(0)

      wrapper.unmount()
    })
  })
})
