import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import FichePresentation from './FichePresentation.vue'
import Like from '../ui/Like.vue'
import type { Fiche } from '../../types/ui/fiche'

const ARTISTE: Fiche = {
  nom: 'Aya Nakamura',
  photo: null,
  description: 'Une bio.',
  jour: '2026-08-28',
  heure: '22h15',
  scene: 'chrome',
  categorie: { label: 'Rap' },
  tags: [{ label: 'Vendredi 28 août', to: { path: '/programmation', query: { date: '2026-08-28' } } }],
  likeTarget: { id: 1, type: 'artiste' },
}

const EXPOSANT: Fiche = {
  nom: 'Encre Noire',
  photo: null,
  description: null,
  categorie: { label: 'Tatouage', to: { path: '/exposants', query: { categorie: 'Tatouage' } } },
  tags: [],
}

function mountFiche(fiche: Fiche) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  return mount(FichePresentation, { props: { fiche }, global: { plugins: [router] } })
}

describe('FichePresentation', () => {
  it('affiche nom, date, scène et heure d’un artiste', () => {
    const wrapper = mountFiche(ARTISTE)

    expect(wrapper.find('h1').text()).toBe('Aya Nakamura')
    expect(wrapper.find('.fiche-presentation__date').text()).toBe('28 août 2026')
    expect(wrapper.find('.fiche-presentation__scene-heure').text()).toBe('Chrome • 22h15')
    expect(wrapper.find('.fiche-presentation__bio').text()).toBe('Une bio.')
    expect(wrapper.findComponent(Like).exists()).toBe(true)
  })

  it('pose les stickers de la scène autour de la photo', () => {
    expect(mountFiche(ARTISTE).findAll('.fiche-presentation__sticker')).toHaveLength(2)
    expect(mountFiche(EXPOSANT).findAll('.fiche-presentation__sticker')).toHaveLength(0)
  })

  it('affiche le badge de catégorie puis les tags, cliquables quand ils ont une cible', () => {
    const wrapper = mountFiche(ARTISTE)

    const tags = wrapper.findAll('.fiche-presentation__tags li')
    expect(tags.map((tag) => tag.text())).toEqual(['Rap', 'Vendredi 28 août'])
    expect(tags[0].find('a').exists()).toBe(false)
    expect(tags[1].find('a').attributes('href')).toBe('/programmation?date=2026-08-28')
  })

  it('masque date, heure et like pour un exposant, avec la même structure', () => {
    const wrapper = mountFiche(EXPOSANT)

    expect(wrapper.find('.fiche-presentation__quand').exists()).toBe(false)
    expect(wrapper.findComponent(Like).exists()).toBe(false)
    expect(wrapper.find('.fiche-presentation__tags a').attributes('href')).toBe('/exposants?categorie=Tatouage')
    expect(wrapper.find('.fiche-presentation__actions').text()).toContain('Acheter ma place')
  })
})
