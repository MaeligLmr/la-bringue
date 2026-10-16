import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { toast } from 'vue-sonner'
import BilletterieView from './BilletterieView.vue'
import { formuleHandler } from '../handlers/formule'
import type { FormuleAvecPromotions } from '../handlers/formule'

// Date locale (sans fuseau) dans `jours` jours, comme les promotions de la base :
// la date limite reste dans trois jours quel que soit le jour où le test tourne.
function dans(jours: number) {
  const date = new Date(Date.now() + jours * 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00:00`
}

// Les espaces de Intl sont insécables : on les normalise pour comparer.
const normalize = (text: string) => text.replace(/\s/g, ' ')

function formule(overrides: Partial<FormuleAvecPromotions>): FormuleAvecPromotions {
  return {
    id_formule: 1,
    created_at: '',
    titre: 'Pass 1 jour',
    description: 'Un jour au choix',
    jour_debut: '2026-08-28',
    jour_fin: '2026-08-28',
    prix: 45,
    lien_shotgun: 'https://shotgun.live/pass-1-jour',
    nbr_places_total: 100,
    nbr_places_restantes: 80,
    homepage: true,
    nb_jours: '1 jour',
    Promotion: [],
    ...overrides,
  }
}

const FORMULES = [
  formule({}),
  formule({
    id_formule: 2,
    titre: 'Pass 3 jours',
    prix: 100,
    nb_jours: '3 jours',
    Promotion: [
      {
        id_promotion: 1,
        created_at: '',
        id_formule: 2,
        description: 'Early bird',
        reduction_prc: 20,
        date_debut: dans(-10),
        date_fin: dans(3),
      },
    ],
  }),
  formule({ id_formule: 3, titre: 'Pass VIP', nbr_places_restantes: 0 }),
]

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('../handlers/formule', () => ({
  formuleHandler: { getAllWithPromotions: vi.fn(async () => FORMULES) },
}))

async function mountView() {
  const wrapper = mount(BilletterieView, { global: { stubs: { Hero: true } }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('BilletterieView', () => {
  it('affiche une carte par formule avec son prix, sa durée, ses dates et son contenu', async () => {
    const wrapper = await mountView()

    const cartes = wrapper.findAll('.formule')
    expect(cartes.map((carte) => carte.find('.formule__titre').text())).toEqual([
      'Pass 1 jour',
      'Pass 3 jours',
      'Pass VIP',
    ])

    const premiere = cartes[0]
    expect(normalize(premiere.find('.formule__prix-final').text())).toBe('45 €')
    expect(premiere.find('.tag--blue').text()).toBe('1 jour')
    expect(premiere.find('.formule__dates').text()).toBe('28 août')
    expect(premiere.find('.formule__contenu').text()).toBe('Un jour au choix')
  })

  it('met en avant la date limite d’une promotion, avec le prix barré et le prix réduit', async () => {
    const wrapper = await mountView()

    const carte = wrapper.findAll('.formule')[1]
    const promo = carte.find('.formule__promo')
    expect(promo.text()).toContain('Early bird −20 %')
    expect(promo.text()).toContain('jusqu’au')
    // Date limite à moins d’une semaine : bandeau renforcé et décompte.
    expect(promo.classes()).toContain('formule__promo--urgente')
    expect(promo.find('.formule__delai').text()).toMatch(/Plus que \d jours?|Dernier jour/)
    expect(carte.find('.formule__prix-initial').text()).toContain('100')
    expect(normalize(carte.find('.formule__prix-final').text())).toBe('80 €')
  })

  it('n’affiche aucun bandeau sur une formule sans promotion', async () => {
    const wrapper = await mountView()

    expect(wrapper.findAll('.formule')[0].find('.formule__promo').exists()).toBe(false)
  })

  it('marque une formule complète et désactive son bouton', async () => {
    const wrapper = await mountView()

    const carte = wrapper.findAll('.formule')[2]
    expect(carte.classes()).toContain('formule--complet')
    expect(carte.find('.formule__statut').text()).toBe('Complet')
    const bouton = carte.find('.formule__cta')
    expect(bouton.attributes('disabled')).toBeDefined()
    expect(bouton.text()).toBe('Complet')
  })

  it('ouvre la billetterie Shotgun dans un nouvel onglet au clic sur Acheter', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = await mountView()

    await wrapper.findAll('.formule__cta')[0].trigger('click')

    expect(open).toHaveBeenCalledWith('https://shotgun.live/pass-1-jour', '_blank', 'noopener,noreferrer')
  })

  it('désactive l’achat sans lien Shotgun', async () => {
    vi.mocked(formuleHandler.getAllWithPromotions).mockResolvedValueOnce([formule({ lien_shotgun: null })])
    const wrapper = await mountView()

    const bouton = wrapper.find('.formule__cta')
    expect(bouton.attributes('disabled')).toBeDefined()
    // Pas « Complet » : la formule est simplement pas encore en vente.
    expect(bouton.text()).toBe('Bientôt disponible')
  })

  it('signale quand il n’y a aucune formule', async () => {
    vi.mocked(formuleHandler.getAllWithPromotions).mockResolvedValueOnce([])
    const wrapper = await mountView()

    expect(wrapper.find('.formule').exists()).toBe(false)
    expect(wrapper.text()).toContain('Les formules arrivent bientôt.')
  })

  it('affiche un toast et un message si le chargement échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(formuleHandler.getAllWithPromotions).mockRejectedValueOnce(new Error('[Formule] permission denied'))
    vi.mocked(toast.error).mockClear()

    const wrapper = await mountView()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger la billetterie.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('.formule').exists()).toBe(false)
  })
})
