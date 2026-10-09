import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgrammationDay from './ProgrammationDay.vue'
import type { Artiste } from '../../types/database/artiste'
import type { DayLineup } from '../../handlers/concert'

function artiste(id_artiste: number, nom: string): Artiste {
  return { id_artiste, nom, created_at: '', photo: null, description: null, categorie: 'Rock' }
}

const LINEUP: DayLineup = {
  headliner: artiste(1, 'The Cure'),
  others: [artiste(2, 'Ditter'), artiste(3, 'Mogwai')],
}

const mountDay = (lineup: DayLineup = LINEUP) =>
  mount(ProgrammationDay, { props: { label: 'Dimanche 30 août', date: '2026-08-30', lineup } })

describe('ProgrammationDay', () => {
  it('affiche le jour puis la tête d’affiche', () => {
    const wrapper = mountDay()

    expect(wrapper.find('.programmation-day__jour').text()).toBe('Dimanche 30 août')
    expect(wrapper.find('.programmation-day__headliner').text()).toBe('The Cure')
  })

  it('liste les autres artistes, le dernier suivi de points de suspension', () => {
    const names = mountDay()
      .findAll('.programmation-day__others li')
      .map((node) => node.text())

    expect(names).toEqual(['Ditter', 'Mogwai…'])
  })

  it('n’affiche ni tête d’affiche ni liste vide', () => {
    const wrapper = mountDay({ headliner: undefined, others: [] })

    expect(wrapper.find('.programmation-day__headliner').exists()).toBe(false)
    expect(wrapper.find('.programmation-day__others').exists()).toBe(false)
  })
})
