import { afterEach, describe, expect, it, vi } from 'vitest'
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
const replace = vi.fn()
vi.mock('vue-router', () => ({ useRoute: () => ({ hash: '' }), useRouter: () => ({ replace }) }))
vi.mock('../handlers/info-pratique', () => ({
  infoPratiqueHandler: { getAll: vi.fn(async () => INFOS) },
}))

async function mountView() {
  const wrapper = mount(InfosPratiquesView, { global: { stubs: { Hero: true } }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

afterEach(() => {
  document.body.innerHTML = ''
})

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
    expect(wrapper.findAll('.infos-menu a').map((a) => a.attributes('href'))).toEqual(['#acces-transport', '#cashless'])
  })

  it('défile vers la section au clic sur un lien du menu et met à jour l’ancre', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const wrapper = await mountView()

    const lien = wrapper.findAll('.infos-menu__lien')[1]
    await lien.trigger('click')

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    expect(replace).toHaveBeenCalledWith({ hash: '#cashless' })
    expect(lien.classes()).toContain('infos-menu__lien--actif')
  })

  it('surligne les occurrences recherchées, sans tenir compte des accents, et les compte', async () => {
    const wrapper = await mountView()

    await wrapper.find('.infos-recherche__input').setValue('acces')
    await flushPromises()

    const marks = wrapper.findAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0].text()).toBe('Accès')
    expect(wrapper.find('.infos-recherche__resultat').text()).toContain('1 / 1')
  })

  it('parcourt les résultats avec Entrée et indique quand il n’y en a aucun', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const wrapper = await mountView()
    const champ = wrapper.find('.infos-recherche__input')

    await champ.setValue('en ')
    await flushPromises()
    expect(wrapper.findAll('mark').length).toBeGreaterThan(1)
    expect(wrapper.find('.infos-recherche__resultat').text()).toContain('1 /')

    await champ.trigger('keydown.enter')
    expect(wrapper.find('.infos-recherche__resultat').text()).toContain('2 /')

    await champ.setValue('zzz')
    await flushPromises()
    expect(wrapper.find('.infos-recherche__resultat').text()).toContain('Aucun résultat')
  })

  it('efface la recherche avec Échap', async () => {
    const wrapper = await mountView()
    const champ = wrapper.find('.infos-recherche__input')

    await champ.setValue('cash')
    await champ.trigger('keydown.esc')
    await flushPromises()

    expect((champ.element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('mark').exists()).toBe(false)
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
