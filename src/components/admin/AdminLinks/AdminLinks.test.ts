import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminLinks from './AdminLinks.vue'
import Select from '../../ui/Select/Select.vue'
import type { LinkEntry } from '../../../lib/links/links'

const ITEMS: LinkEntry[] = [
  { id: 1, nom: 'Alice Coffin' },
  { id: 2, nom: 'Rokhaya Diallo' },
]

function mountLinks(links: LinkEntry[] = [ITEMS[1]], props: Record<string, unknown> = {}) {
  const wrapper = mount(AdminLinks, {
    props: {
      modelValue: links,
      'onUpdate:modelValue': (value: LinkEntry[]) => wrapper.setProps({ modelValue: value }),
      items: ITEMS,
      legend: 'Intervenantes',
      empty: 'Aucune intervenante.',
      placeholder: 'Choisir une intervenante',
      context: 'de la conférence',
      hint: 'Elle reste dans la liste des intervenantes.',
      ...props,
    },
    slots: {
      entry: `<template #entry="{ entry, update }"><button type="button" class="renommer" @click="update({ nom: entry.nom + ' !' })">Renommer</button></template>`,
      'add-options': '<span class="option">Option</span>',
    },
  })
  return wrapper
}

function current(wrapper: ReturnType<typeof mountLinks>) {
  return wrapper.props('modelValue') as LinkEntry[]
}

function addButton(wrapper: ReturnType<typeof mountLinks>) {
  return wrapper.findAll('.admin-links__add button').find((button) => button.text() === 'Ajouter')!
}

describe('AdminLinks', () => {
  it('affiche le titre, les liens et le texte d’aide', () => {
    const wrapper = mountLinks()

    expect(wrapper.find('legend').text()).toBe('Intervenantes')
    expect(wrapper.findAll('.admin-links__nom').map((nom) => nom.text())).toEqual(['Rokhaya Diallo'])
    expect(wrapper.find('.admin-links__hint').text()).toBe('Elle reste dans la liste des intervenantes.')
  })

  it('affiche un message quand rien n’est lié', () => {
    const wrapper = mountLinks([])

    expect(wrapper.text()).toContain('Aucune intervenante.')
    expect(wrapper.find('.admin-links__list').exists()).toBe(false)
  })

  it('ne propose que les éléments pas encore liés', () => {
    const wrapper = mountLinks()

    expect(wrapper.findComponent(Select).props('options')).toEqual([{ value: '1', label: 'Alice Coffin' }])
  })

  it('ajoute l’élément choisi, construit par toEntry, et émet added', async () => {
    const toEntry = (item: LinkEntry) => ({ ...item, nom: item.nom.toUpperCase() })
    const wrapper = mountLinks([ITEMS[1]], { toEntry })

    wrapper.findComponent(Select).vm.$emit('update:modelValue', '1')
    // Le bouton est activé au rendu suivant.
    await wrapper.vm.$nextTick()
    await addButton(wrapper).trigger('click')

    expect(current(wrapper)).toEqual([ITEMS[1], { id: 1, nom: 'ALICE COFFIN' }])
    expect(wrapper.emitted('added')).toEqual([[{ id: 1, nom: 'ALICE COFFIN' }]])
  })

  it('modifie un lien depuis le slot de la page', async () => {
    const wrapper = mountLinks()

    await wrapper.find('.renommer').trigger('click')

    expect(current(wrapper)).toEqual([{ id: 2, nom: 'Rokhaya Diallo !' }])
  })

  it('retire un lien', async () => {
    const wrapper = mountLinks()

    await wrapper.find('[aria-label="Retirer Rokhaya Diallo de la conférence"]').trigger('click')

    expect(current(wrapper)).toEqual([])
  })

  it('affiche les options d’ajout de la page, sans formulaire imbriqué', () => {
    const wrapper = mountLinks()

    expect(wrapper.find('.admin-links__add .option').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(addButton(wrapper).attributes('type')).toBe('button')
  })
})
