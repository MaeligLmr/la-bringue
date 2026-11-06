import { describe, it, expect, vi, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ExposantsView from './ExposantsView.vue'
import type { Exposant } from '../../types/database/exposant'
import { toast } from 'vue-sonner'
import { exposantHandler } from '../../handlers/exposant'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

// IntersectionObserver factice : les tests déclenchent eux-mêmes l'arrivée de
// la sentinelle (« bas de liste atteint ») avec scrollToBottom().
class FakeIntersectionObserver {
  static all: FakeIntersectionObserver[] = []
  callback: (entries: unknown[]) => void
  constructor(callback: (entries: unknown[]) => void) {
    this.callback = callback
    FakeIntersectionObserver.all.push(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {
    FakeIntersectionObserver.all = FakeIntersectionObserver.all.filter((observer) => observer !== this)
  }
}

function scrollToBottom() {
  FakeIntersectionObserver.all.forEach((observer) =>
    observer.callback([{ isIntersecting: true, target: document.body }])
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  FakeIntersectionObserver.all = []
})

let id = 0

function exposant(nom: string, categorie: string): Exposant {
  return { id_exposant: ++id, created_at: '', nom, photo: null, description: null, categorie }
}

// Supabase renvoie les exposants déjà triés par nom.
const EXPOSANTS = [
  exposant('Encre Noire', 'Tatouage'),
  exposant('Green Fest', 'Écologie'),
  exposant('Ink & Love', 'Tatouage'),
  exposant('La Crêperie', 'Restauration'),
]

// Valeurs de l'enum `categories_exposants` renvoyées par la fonction RPC.
const CATEGORIES = ['Tatouage', 'Art', 'Restauration', 'Mode', 'Beauté', 'Prévention', 'Association', 'Écologie']

// Taille de page du mock : petite pour exercer le chargement de la suite.
const PAGE = 3

// Reproduit côté mock le filtrage (catégorie, recherche) et la pagination de Supabase.
function pageOf({ offset, search = '', categorie = '' }: { offset: number; search?: string; categorie?: string }) {
  const rows = EXPOSANTS.filter(
    (row) => (!categorie || row.categorie === categorie) && row.nom!.toLowerCase().includes(search.toLowerCase())
  )
  return { rows: rows.slice(offset, offset + PAGE), hasMore: offset + PAGE < rows.length }
}

vi.mock('../../handlers/exposant', () => ({
  exposantHandler: {
    getPage: vi.fn(async (params) => pageOf(params)),
    getCategories: vi.fn(async () => CATEGORIES),
  },
}))

async function mountExposants(url = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: ExposantsView },
      { path: '/:type/fiche/:id', name: 'fiche', component: { render: () => null } },
    ],
  })
  router.push(url)
  await router.isReady()
  const wrapper = mount(ExposantsView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

function filterButton(wrapper: Awaited<ReturnType<typeof mountExposants>>, label: string) {
  const button = wrapper.findAll('[role="group"] button').find((node) => node.text() === label)
  if (!button) throw new Error(`Bouton de filtre "${label}" introuvable`)
  return button
}

function displayedNames(wrapper: Awaited<ReturnType<typeof mountExposants>>) {
  return wrapper.findAll('.content-card__nom').map((node) => node.text())
}

describe('ExposantsView', () => {
  it('affiche une carte par exposant, dans l’ordre renvoyé par Supabase', async () => {
    const wrapper = await mountExposants()

    expect(displayedNames(wrapper)).toEqual(['Encre Noire', 'Green Fest', 'Ink & Love'])

    wrapper.unmount()
  })

  it('charge la page suivante à la demande, sans doublon', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    const wrapper = await mountExposants()
    expect(exposantHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: '', categorie: '' })

    scrollToBottom()
    await flushPromises()

    expect(exposantHandler.getPage).toHaveBeenLastCalledWith({ offset: 3, search: '', categorie: '' })
    expect(displayedNames(wrapper)).toEqual(['Encre Noire', 'Green Fest', 'Ink & Love', 'La Crêperie'])

    // Plus rien à charger : un nouveau passage en bas de liste ne demande rien.
    vi.mocked(exposantHandler.getPage).mockClear()
    scrollToBottom()
    await flushPromises()
    expect(exposantHandler.getPage).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('propose « Voir plus » quand le navigateur n’a pas d’IntersectionObserver', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const wrapper = await mountExposants()

    const more = wrapper.findAll('button').find((node) => node.text() === 'Voir plus')
    await more!.trigger('click')
    await flushPromises()

    expect(displayedNames(wrapper)).toHaveLength(4)

    wrapper.unmount()
  })

  it('propose de réessayer quand le chargement de la suite échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    const wrapper = await mountExposants()

    vi.mocked(exposantHandler.getPage).mockRejectedValueOnce(new Error('réseau'))
    scrollToBottom()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Impossible de charger la suite.')
    expect(displayedNames(wrapper)).toHaveLength(3)

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(displayedNames(wrapper)).toHaveLength(4)

    wrapper.unmount()
  })

  it('relance la recherche côté serveur, depuis la première page, après la frappe', async () => {
    vi.useFakeTimers()
    const wrapper = await mountExposants()

    await wrapper.find('input[type="search"]').setValue('ink')
    // Pas de requête à chaque touche : on attend la fin de la frappe.
    expect(exposantHandler.getPage).not.toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ink' }))
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    vi.useRealTimers()

    expect(exposantHandler.getPage).toHaveBeenLastCalledWith({ offset: 0, search: 'ink', categorie: '' })
    expect(displayedNames(wrapper)).toEqual(['Ink & Love'])

    wrapper.unmount()
  })

  it('affiche la catégorie sur chaque carte, sans bouton like', async () => {
    const wrapper = await mountExposants()

    const card = wrapper.findAll('.content-card').find((node) => node.text().includes('Ink & Love'))
    expect(card?.find('.tag').text()).toBe('Tatouage')
    expect(card?.find('.like').exists()).toBe(false)

    wrapper.unmount()
  })

  it('propose le filtre catégorie avec les valeurs de l’enum de la base', async () => {
    const wrapper = await mountExposants()

    const groups = wrapper.findAll('[role="group"]').map((group) => group.attributes('aria-label'))
    expect(groups).toEqual(['Catégorie'])
    const labels = wrapper.findAll('[role="group"] button').map((node) => node.text())
    expect(labels).toEqual(['Toutes les catégories', ...CATEGORIES])

    wrapper.unmount()
  })

  it('ne garde que les exposants de la catégorie sélectionnée', async () => {
    const wrapper = await mountExposants()

    await filterButton(wrapper, 'Tatouage').trigger('click')
    await flushPromises()

    expect(displayedNames(wrapper)).toEqual(['Encre Noire', 'Ink & Love'])

    wrapper.unmount()
  })

  it('pré-applique la catégorie passée dans l’URL', async () => {
    const wrapper = await mountExposants('/?categorie=%C3%89cologie')

    expect(filterButton(wrapper, 'Écologie').attributes('aria-pressed')).toBe('true')
    expect(displayedNames(wrapper)).toEqual(['Green Fest'])

    wrapper.unmount()
  })

  it('ouvre la fiche de l’exposant au clic sur sa carte', async () => {
    const wrapper = await mountExposants()

    await wrapper.findAll('.content-card')[1].trigger('click')
    await flushPromises()

    expect(wrapper.vm.$router.currentRoute.value.path).toBe(`/exposant/fiche/${EXPOSANTS[1].id_exposant}`)

    wrapper.unmount()
  })

  it('affiche un toast si les exposants ne se chargent pas, sans casser la page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(exposantHandler.getPage).mockRejectedValueOnce(new Error('[Exposant] permission denied'))
    vi.mocked(toast.error).mockClear()

    const wrapper = await mountExposants()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger les exposants.')
    expect(displayedNames(wrapper)).toEqual([])

    wrapper.unmount()
  })

  it('affiche un toast si les catégories ne se chargent pas, la liste reste affichée', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(exposantHandler.getCategories).mockRejectedValueOnce(new Error('rpc failed'))
    vi.mocked(toast.error).mockClear()

    const wrapper = await mountExposants()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger les catégories d’exposants.')
    expect(displayedNames(wrapper)).toHaveLength(3)

    wrapper.unmount()
  })
})
