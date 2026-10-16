import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { toast } from 'vue-sonner'
import InfosPratiquesView from './InfosPratiquesView.vue'
import { infoPratiqueHandler } from '../handlers/info-pratique'

const INFOS = [
  {
    id_info: 1,
    created_at: '',
    titre: 'Accès & transport',
    intro: 'Privilégiez les transports en commun.',
    points: [{ label: 'En train', detail: 'Navettes gratuites' }],
  },
  {
    id_info: 2,
    created_at: '',
    titre: 'Cashless',
    intro: null,
    points: [
      { label: 'Fonctionnement', detail: 'Bracelet lié à un solde' },
      { label: 'Recharger', detail: 'En ligne ou sur place' },
    ],
  },
]

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('../handlers/info-pratique', () => ({
  infoPratiqueHandler: { getAll: vi.fn(async () => INFOS) },
}))

async function mountView() {
  const wrapper = mount(InfosPratiquesView, { global: { stubs: { Hero: true } } })
  await flushPromises()
  return wrapper
}

describe('InfosPratiquesView', () => {
  it('affiche une section par ligne de la base, dans l’ordre', async () => {
    const wrapper = await mountView()
    expect(wrapper.findAll('h2').map((h) => h.text())).toEqual(['Accès & transport', 'Cashless'])
    expect(wrapper.find('#acces-transport').exists()).toBe(true)
    expect(wrapper.find('#cashless').exists()).toBe(true)
  })

  it('affiche l’intro quand elle existe et les points de chaque section', async () => {
    const wrapper = await mountView()
    const [acces, cashless] = wrapper.findAll('section')
    expect(acces.find('.infos-section__intro').text()).toBe('Privilégiez les transports en commun.')
    expect(cashless.find('.infos-section__intro').exists()).toBe(false)
    expect(cashless.findAll('dt').map((dt) => dt.text())).toEqual(['Fonctionnement', 'Recharger'])
    expect(cashless.findAll('dd')[1].text()).toBe('En ligne ou sur place')
  })

  it('propose une navigation vers chaque section', async () => {
    const wrapper = await mountView()
    expect(wrapper.findAll('nav a').map((a) => a.attributes('href'))).toEqual(['#acces-transport', '#cashless'])
  })

  it('affiche un toast et un message d’erreur si le chargement échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(infoPratiqueHandler.getAll).mockRejectedValueOnce(new Error('[InfoPratique] permission denied'))
    const wrapper = await mountView()
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('section').exists()).toBe(false)
  })
})
