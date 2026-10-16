import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BilletterieCard from './BilletterieCard.vue'
import type { FormuleCard } from '../../types/ui/billetterie'

function formule(overrides: Partial<FormuleCard> = {}): FormuleCard {
  return {
    id: 1,
    titre: 'Pass 3 jours',
    description: 'Accède aux trois jours du festival',
    duree: '3 jours',
    dates: 'du 28 au 30 août',
    prix: '50 €',
    prixInitial: null,
    promo: null,
    complet: false,
    placesRestantes: null,
    lienShotgun: 'https://shotgun.live/pass',
    ...overrides,
  }
}

const mountCard = (overrides: Partial<FormuleCard> = {}) =>
  mount(BilletterieCard, { props: { formule: formule(overrides) } })

describe('BilletterieCard', () => {
  it('affiche le titre, la durée, les dates, le prix et le contenu', () => {
    const wrapper = mountCard()

    expect(wrapper.find('.formule__titre').text()).toBe('Pass 3 jours')
    expect(wrapper.find('.tag--blue').text()).toBe('3 jours')
    expect(wrapper.find('.formule__dates').text()).toBe('du 28 au 30 août')
    expect(wrapper.find('.formule__prix-final').text()).toBe('50 €')
    expect(wrapper.find('.formule__contenu').text()).toBe('Accède aux trois jours du festival')
  })

  it('masque ce que la formule ne renseigne pas', () => {
    const wrapper = mountCard({ duree: null, dates: null, prix: null, description: '' })

    expect(wrapper.find('.tag--blue').exists()).toBe(false)
    expect(wrapper.find('.formule__dates').exists()).toBe(false)
    expect(wrapper.find('.formule__prix').exists()).toBe(false)
    expect(wrapper.find('.formule__contenu').exists()).toBe(false)
    expect(wrapper.find('.formule__promo').exists()).toBe(false)
  })

  it('affiche le prix barré et la promotion avec sa date limite', () => {
    const wrapper = mountCard({
      prix: '40 €',
      prixInitial: '50 €',
      promo: { nom: 'Early bird', reduction: 20, jusquAu: '15 juin', joursRestants: 20, urgente: false },
    })

    expect(wrapper.find('.formule__prix-initial').text()).toContain('50 €')
    expect(wrapper.find('.formule__prix-final').text()).toBe('40 €')
    const promo = wrapper.find('.formule__promo')
    expect(promo.text()).toContain('Early bird −20 %')
    expect(promo.text()).toContain('jusqu’au 15 juin')
    expect(promo.classes()).not.toContain('formule__promo--urgente')
    expect(promo.find('.formule__delai').exists()).toBe(false)
  })

  it.each([
    [3, 'Plus que 3 jours'],
    [1, 'Plus que 1 jour'],
    [0, 'Dernier jour !'],
  ])('renforce la promotion et affiche le décompte quand il reste %i jour(s)', (joursRestants, texte) => {
    const wrapper = mountCard({
      promo: { nom: 'Early bird', reduction: 20, jusquAu: '15 juin', joursRestants, urgente: true },
    })

    expect(wrapper.find('.formule__promo').classes()).toContain('formule__promo--urgente')
    expect(wrapper.find('.formule__delai').text()).toBe(texte)
  })

  it('affiche le bon statut : disponible, stock faible ou complet', () => {
    expect(mountCard().find('.formule__statut').text()).toBe('Disponible')
    expect(mountCard({ placesRestantes: 12 }).find('.formule__statut').text()).toBe('Plus que 12 places')
    expect(mountCard({ complet: true }).find('.formule__statut').text()).toBe('Complet')
  })

  it('émet buy au clic sur Acheter', async () => {
    const wrapper = mountCard()

    const bouton = wrapper.find('.formule__cta')
    expect(bouton.text()).toBe('Acheter')
    await bouton.trigger('click')

    expect(wrapper.emitted('buy')).toHaveLength(1)
  })

  it('désactive le bouton quand la formule est complète', async () => {
    const wrapper = mountCard({ complet: true })

    const bouton = wrapper.find('.formule__cta')
    expect(bouton.text()).toBe('Complet')
    expect(bouton.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('formule--complet')
    await bouton.trigger('click')
    expect(wrapper.emitted('buy')).toBeUndefined()
  })

  it('affiche « Bientôt disponible » et désactive le bouton sans lien de billetterie', () => {
    const wrapper = mountCard({ lienShotgun: null })

    const bouton = wrapper.find('.formule__cta')
    expect(bouton.text()).toBe('Bientôt disponible')
    expect(bouton.attributes('disabled')).toBeDefined()
  })
})
