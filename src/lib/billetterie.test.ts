import { describe, expect, it } from 'vitest'
import type { FormuleAvecPromotions } from '../handlers/formule'
import type { Promotion } from '../types/database/promotion'
import { activePromo, formatDates, formatDuree, formatPrix, toFormuleCards } from './billetterie'

// Heure locale, comme les dates de promotion de la base.
const NOW = new Date('2026-06-10T12:00:00')

// Les espaces de Intl sont insécables : on les normalise pour comparer.
const normalize = (text: string | null | undefined) => text?.replace(/\s/g, ' ')

function promotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id_promotion: 1,
    created_at: '',
    id_formule: 1,
    description: 'Early bird',
    reduction_prc: 20,
    date_debut: '2026-05-01T00:00:00',
    date_fin: '2026-06-30T23:59:59',
    ...overrides,
  }
}

function formule(overrides: Partial<FormuleAvecPromotions> = {}): FormuleAvecPromotions {
  return {
    id_formule: 1,
    created_at: '',
    titre: 'Pass 3 jours',
    description: 'Accès aux trois jours',
    jour_debut: '2026-08-28',
    jour_fin: '2026-08-30',
    prix: 90,
    lien_shotgun: 'https://shotgun.live/pass',
    nbr_places_total: 500,
    nbr_places_restantes: 300,
    homepage: true,
    nb_jours: '3 jours',
    Promotion: [],
    ...overrides,
  }
}

describe('formatDates', () => {
  it('formate un jour, une période dans le même mois et une période à cheval sur deux mois', () => {
    expect(formatDates('2026-08-28', '2026-08-28')).toBe('28 août')
    expect(formatDates('2026-08-28', null)).toBe('28 août')
    expect(formatDates('2026-08-28', '2026-08-30')).toBe('du 28 au 30 août')
    expect(formatDates('2026-08-30', '2026-09-02')).toBe('du 30 août au 2 septembre')
  })

  it('renvoie null sans aucune date', () => {
    expect(formatDates(null, null)).toBeNull()
  })
})

describe('formatDuree', () => {
  it('transforme le nombre stocké en base en « N jour(s) » avec le bon accord', () => {
    expect(formatDuree('1')).toBe('1 jour')
    expect(formatDuree('2')).toBe('2 jours')
    expect(formatDuree(' 3 ')).toBe('3 jours')
  })

  it('garde un libellé déjà complet et ignore les valeurs vides', () => {
    expect(formatDuree('3 jours')).toBe('3 jours')
    expect(formatDuree('')).toBeNull()
    expect(formatDuree(null)).toBeNull()
  })
})

describe('formatPrix', () => {
  it('n’affiche les centimes que s’il y en a', () => {
    expect(normalize(formatPrix(45))).toBe('45 €')
    expect(normalize(formatPrix(37.5))).toBe('37,50 €')
  })
})

describe('activePromo', () => {
  it('ignore les promotions pas commencées, terminées ou sans réduction', () => {
    expect(activePromo([promotion({ date_debut: '2026-07-01T00:00:00' })], NOW)).toBeNull()
    expect(activePromo([promotion({ date_fin: '2026-06-01T00:00:00' })], NOW)).toBeNull()
    expect(activePromo([promotion({ reduction_prc: null })], NOW)).toBeNull()
    expect(activePromo([], NOW)).toBeNull()
  })

  it('garde la plus avantageuse quand plusieurs sont en cours', () => {
    const promo = activePromo(
      [
        promotion({ reduction_prc: 10, description: 'Printemps' }),
        promotion({ reduction_prc: 30, description: 'Flash' }),
      ],
      NOW
    )
    expect(promo).toMatchObject({ nom: 'Flash', reduction: 30 })
  })

  it('calcule la date limite et les jours restants, urgente à une semaine ou moins', () => {
    const loin = activePromo([promotion({ date_fin: '2026-06-30T23:59:59' })], NOW)
    expect(loin).toMatchObject({ jusquAu: '30 juin', joursRestants: 20, urgente: false })

    const proche = activePromo([promotion({ date_fin: '2026-06-13T23:59:59' })], NOW)
    expect(proche).toMatchObject({ jusquAu: '13 juin', joursRestants: 3, urgente: true })
  })

  it('accepte une promotion sans date limite, jamais urgente, et un nom par défaut', () => {
    const promo = activePromo([promotion({ date_debut: null, date_fin: null, description: ' ' })], NOW)
    expect(promo).toEqual({ nom: 'Promotion', reduction: 20, jusquAu: null, joursRestants: null, urgente: false })
  })
})

describe('toFormuleCards', () => {
  it('formate une formule sans promotion', () => {
    const [card] = toFormuleCards([formule()], NOW)

    expect(card).toMatchObject({
      id: 1,
      titre: 'Pass 3 jours',
      description: 'Accès aux trois jours',
      duree: '3 jours',
      dates: 'du 28 au 30 août',
      promo: null,
      prixInitial: null,
      complet: false,
      placesRestantes: null,
      lienShotgun: 'https://shotgun.live/pass',
    })
    expect(normalize(card.prix)).toBe('90 €')
  })

  it('déduit la promotion du prix et garde le prix initial pour le barrer', () => {
    const [card] = toFormuleCards([formule({ Promotion: [promotion({ reduction_prc: 20 })] })], NOW)

    expect(normalize(card.prix)).toBe('72 €')
    expect(normalize(card.prixInitial)).toBe('90 €')
    expect(card.promo?.reduction).toBe(20)
  })

  it('arrondit au centime', () => {
    const [card] = toFormuleCards([formule({ prix: 33.33, Promotion: [promotion({ reduction_prc: 15 })] })], NOW)

    expect(normalize(card.prix)).toBe('28,33 €')
  })

  it('n’affiche pas de prix quand la base n’en a pas', () => {
    const [card] = toFormuleCards([formule({ prix: null, Promotion: [promotion()] })], NOW)

    expect(card.prix).toBeNull()
    expect(card.prixInitial).toBeNull()
  })

  it('marque une formule complète à zéro place, et signale un stock faible', () => {
    const [complete, faible, large, inconnu] = toFormuleCards(
      [
        formule({ nbr_places_restantes: 0 }),
        formule({ nbr_places_restantes: 12 }),
        formule({ nbr_places_restantes: 21 }),
        formule({ nbr_places_restantes: null }),
      ],
      NOW
    )

    expect(complete).toMatchObject({ complet: true, placesRestantes: null })
    expect(faible).toMatchObject({ complet: false, placesRestantes: 12 })
    expect(large).toMatchObject({ complet: false, placesRestantes: null })
    expect(inconnu).toMatchObject({ complet: false, placesRestantes: null })
  })

  it('tolère les champs vides de la base', () => {
    const [card] = toFormuleCards(
      [formule({ titre: null, description: null, jour_debut: null, jour_fin: null, nb_jours: null })],
      NOW
    )

    expect(card).toMatchObject({ titre: '', description: '', dates: null, duree: null })
  })
})
