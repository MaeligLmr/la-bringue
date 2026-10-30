import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import FicheDetail from './FicheDetail.vue'
import { photoUrl } from '../lib/photo'
import { loadFiche } from '../lib/fiche'
import type { FicheData } from '../types/ui/fiche'
import { toast } from 'vue-sonner'

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('../lib/fiche', () => ({ loadFiche: vi.fn() }))

function data(nom: string, suggestions: { id: number; nom: string }[] = []): FicheData {
  return {
    fiche: { nom, photo: null, description: null, tags: [] },
    intervenantes: [],
    suggestions: suggestions.map(({ id, nom }) => ({
      id,
      nom,
      photo: null,
      to: { name: 'fiche', params: { type: 'exposant', id } },
    })),
  }
}

async function mountFiche(url: string) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/:type/fiche/:id',
        name: 'fiche',
        component: FicheDetail,
        props: (route) => ({ type: route.params.type, id: Number(route.params.id) }),
      },
      { path: '/billetterie', name: 'billetterie', component: { render: () => null } },
    ],
  })
  router.push(url)
  await router.isReady()
  const wrapper = mount(RouterView, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

// Accolades : un beforeEach qui renvoie une fonction la fait exécuter comme
// nettoyage après le test (ici le mock, qui lèverait l'erreur simulée).
beforeEach(() => {
  vi.mocked(loadFiche).mockReset()
})

describe('FicheDetail', () => {
  it('charge la fiche selon le type et l’identifiant de l’URL', async () => {
    vi.mocked(loadFiche).mockResolvedValue(data('Encre Noire'))

    const { wrapper } = await mountFiche('/exposant/fiche/1')

    expect(loadFiche).toHaveBeenCalledWith('exposant', 1)
    expect(wrapper.find('h1.fiche-presentation__nom').text()).toBe('Encre Noire')
    wrapper.unmount()
  })

  it('affiche les suggestions en bas de fiche et ouvre la fiche suggérée au clic', async () => {
    vi.mocked(loadFiche).mockImplementation(async (_type, id) =>
      id === 1 ? data('Encre Noire', [{ id: 2, nom: 'Ink & Love' }]) : data('Ink & Love')
    )

    const { wrapper, router } = await mountFiche('/exposant/fiche/1')

    const section = wrapper.find('.fiche-detail__suggestions')
    expect(section.find('h2').text()).toBe('Ça peut aussi vous intéresser')
    await section.find('.content-card').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/exposant/fiche/2')
    expect(loadFiche).toHaveBeenLastCalledWith('exposant', 2)
    expect(wrapper.find('h1.fiche-presentation__nom').text()).toBe('Ink & Love')
    wrapper.unmount()
  })

  it('affiche les conférencières (photo, nom et bio), sans lien vers une page individuelle', async () => {
    vi.mocked(loadFiche).mockResolvedValue({
      ...data('La parité sur scène'),
      intervenantes: [
        { id: 1, nom: 'Inès Moreau', photo: '/conferencieres/ines.jpg', description: 'Programmatrice de festivals' },
      ],
    })

    const { wrapper } = await mountFiche('/conference/fiche/1')

    const intervenante = wrapper.find('.intervenante-profil')
    expect(intervenante.find('img').attributes('src')).toBe(photoUrl('/conferencieres/ines.jpg'))
    expect(intervenante.find('h3').text()).toBe('Inès Moreau')
    expect(intervenante.find('p').text()).toBe('Programmatrice de festivals')
    expect(intervenante.find('a').exists()).toBe(false)
    wrapper.unmount()
  })

  it('masque la section suggestions quand il n’y en a pas', async () => {
    vi.mocked(loadFiche).mockResolvedValue(data('Encre Noire'))

    const { wrapper } = await mountFiche('/exposant/fiche/1')

    expect(wrapper.find('.fiche-detail__suggestions').exists()).toBe(false)
    wrapper.unmount()
  })

  it('signale une fiche inexistante', async () => {
    vi.mocked(loadFiche).mockResolvedValue(null)

    const { wrapper } = await mountFiche('/exposant/fiche/99')

    expect(wrapper.text()).toContain('Cette fiche n’existe pas.')
    wrapper.unmount()
  })

  it('affiche un toast et un message si le chargement échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(loadFiche).mockImplementation(async () => {
      throw new Error('[Exposant] permission denied')
    })
    vi.mocked(toast.error).mockClear()

    const { wrapper } = await mountFiche('/exposant/fiche/1')

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger cette fiche.')
    expect(wrapper.find('.fiche-detail__message').exists()).toBe(true)
    wrapper.unmount()
  })

  it('ignore la réponse d’un chargement devenu obsolète (échec comme succès)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(toast.error).mockClear()
    let rejectFirst!: (error: Error) => void
    vi.mocked(loadFiche).mockImplementation((_type, id) =>
      id === 1
        ? new Promise<FicheData | null>((_resolve, reject) => (rejectFirst = reject))
        : Promise.resolve(data('Ink & Love'))
    )

    const { wrapper, router } = await mountFiche('/exposant/fiche/1')
    await router.push('/exposant/fiche/2')
    await flushPromises()
    expect(wrapper.find('h1.fiche-presentation__nom').text()).toBe('Ink & Love')

    // La première requête échoue après coup : sans effet sur la fiche affichée.
    rejectFirst(new Error('trop tard'))
    await flushPromises()

    expect(toast.error).not.toHaveBeenCalled()
    expect(wrapper.find('h1.fiche-presentation__nom').text()).toBe('Ink & Love')
    wrapper.unmount()
  })
})
