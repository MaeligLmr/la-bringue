import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import MonProgrammeView from './MonProgrammeView.vue'
import { useAuthModal } from '../composables/useAuthModal'
import { useLikes } from '../composables/useLikes'
import { EMPTY_MESSAGE } from '../lib/mon-programme'
import type { ConcertDetail } from '../handlers/concert'
import type { ConferenceDetail } from '../handlers/conference'

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('vue-sonner', () => ({ toast }))

const { loggedIn } = vi.hoisted(() => ({ loggedIn: { value: true } }))
vi.mock('../composables/useAuth', () => ({
  useAuth: () => ({ isLoggedIn: computed(() => loggedIn.value), ready: Promise.resolve() }),
}))

const { likeHandler } = vi.hoisted(() => ({
  likeHandler: { setLike: vi.fn(), getMine: vi.fn() },
}))
vi.mock('../handlers/like', () => ({ likeHandler }))

function concert(id: number, jour: string, heure: string, nom: string, heureFin: string | null = null): ConcertDetail {
  return {
    id_concert: id,
    created_at: '',
    id_scene: null,
    jour,
    heure_debut: heure,
    heure_fin: heureFin,
    Scene: { id_scene: 0, created_at: '', nom: 'Chrome' },
    ConcertArtiste: [
      {
        id_artiste: id,
        id_concert: id,
        created_at: '',
        artiste_annonce: true,
        featuring: false,
        Artiste: { id_artiste: id, created_at: '', nom, photo: null, description: null, categorie: 'Pop' },
      },
    ],
  }
}

function conference(id: number, jour: string, heure: string, titre: string, heureFin: string | null = null): ConferenceDetail {
  return {
    id_conference: id,
    created_at: '',
    titre,
    photo: null,
    theme: 'Féminisme',
    description: null,
    jour,
    heure_debut: heure,
    heure_fin: heureFin,
    Participation: [],
  }
}

const { concertHandler, conferenceHandler } = vi.hoisted(() => ({
  concertHandler: { getAllDetailed: vi.fn() },
  conferenceHandler: { getAllDetailed: vi.fn() },
}))
vi.mock('../handlers/concert', () => ({ concertHandler }))
vi.mock('../handlers/conference', () => ({ conferenceHandler }))

async function mountMonProgramme() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: MonProgrammeView },
      { path: '/programmation', component: { template: '<div />' } },
      { path: '/:type/fiche/:id', name: 'fiche', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  const wrapper = mount(MonProgrammeView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function joursAffiches(wrapper: Awaited<ReturnType<typeof mountMonProgramme>>['wrapper']) {
  return wrapper.findAll('.mon-programme__jour').map((jour) => ({
    titre: jour.find('h3').text(),
    noms: jour.findAll('.frise__nom').map((nom) => nom.text()),
  }))
}

beforeEach(async () => {
  vi.clearAllMocks()
  loggedIn.value = true
  useAuthModal().close()
  concertHandler.getAllDetailed.mockResolvedValue([
    concert(1, '2026-08-28', '22:15:00', 'Aya Nakamura'),
    concert(2, '2026-08-28', '17:00:00', 'Iliona'),
    concert(3, '2026-08-30', '19:00:00', 'Oklou'),
  ])
  conferenceHandler.getAllDetailed.mockResolvedValue([conference(7, '2026-08-28', '14:00:00', 'Table ronde')])
  likeHandler.setLike.mockResolvedValue(undefined)
  likeHandler.getMine.mockResolvedValue([
    { id: 1, type: 'artiste' },
    { id: 3, type: 'artiste' },
    { id: 7, type: 'conference' },
  ])
  useLikes().clearLikes()
  await useLikes().loadLikes()
})

describe('MonProgrammeView', () => {
  it('affiche les artistes et conférences likés, regroupés par jour puis par scène', async () => {
    const { wrapper } = await mountMonProgramme()

    // Lu colonne par colonne : la scène Chrome, puis les conférences.
    expect(joursAffiches(wrapper)).toEqual([
      { titre: 'Vendredi 28 août', noms: ['Aya Nakamura', 'Table ronde'] },
      { titre: 'Dimanche 30 août', noms: ['Oklou'] },
    ])
    expect(wrapper.findAll('.frise__details').map((details) => details.text())).toEqual(['22h15', '14h00', '19h00'])
  })

  it('retire l’élément de la frise quand on enlève le like depuis la page', async () => {
    const { wrapper } = await mountMonProgramme()

    await wrapper.find('button[aria-label="Ajouter Oklou à Mon programme"]').trigger('click')
    await flushPromises()

    expect(joursAffiches(wrapper).map((jour) => jour.titre)).toEqual(['Vendredi 28 août'])
    expect(likeHandler.setLike).toHaveBeenCalledWith({ id: 3, type: 'artiste' }, false)
  })

  it('signale les deux éléments likés dont les horaires se chevauchent', async () => {
    concertHandler.getAllDetailed.mockResolvedValue([
      concert(1, '2026-08-28', '14:30:00', 'Aya Nakamura', '15:30:00'),
      concert(3, '2026-08-30', '19:00:00', 'Oklou', '20:00:00'),
    ])
    conferenceHandler.getAllDetailed.mockResolvedValue([
      conference(7, '2026-08-28', '14:00:00', 'Table ronde', '15:00:00'),
    ])
    const { wrapper } = await mountMonProgramme()

    // Une colonne par scène, puis les conférences : les deux éléments en
    // conflit sont dans deux colonnes, décrits en toutes lettres pour les
    // lecteurs d'écran.
    const [vendredi] = wrapper.findAll('.mon-programme__jour')
    expect(vendredi.findAll('.frise__entete').map((entete) => entete.text())).toEqual(['Chrome', 'Conférences'])
    const enConflit = wrapper.findAll('.frise__bloc--conflit')
    expect(enConflit.map((bloc) => bloc.find('.frise__nom').text())).toEqual(['Aya Nakamura', 'Table ronde'])
    expect(enConflit.map((bloc) => bloc.find('.frise__sr-only').text())).toEqual([
      'En même temps que Table ronde',
      'En même temps que Aya Nakamura',
    ])
    expect(wrapper.findAll('.frise__details').map((details) => details.text())).toEqual([
      '14h30 – 15h30',
      '14h00 – 15h00',
      '19h00 – 20h00',
    ])
  })

  it("retire l'alerte quand on enlève le like d'un des deux éléments en conflit", async () => {
    concertHandler.getAllDetailed.mockResolvedValue([concert(1, '2026-08-28', '14:30:00', 'Aya Nakamura', '15:30:00')])
    conferenceHandler.getAllDetailed.mockResolvedValue([
      conference(7, '2026-08-28', '14:00:00', 'Table ronde', '15:00:00'),
    ])
    const { wrapper } = await mountMonProgramme()

    await wrapper.find('button[aria-label="Ajouter Aya Nakamura à Mon programme"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.frise__nom').map((nom) => nom.text())).toEqual(['Table ronde'])
    expect(wrapper.find('.frise__bloc--conflit').exists()).toBe(false)
  })

  it('ouvre la fiche au clic sur le nom', async () => {
    const { wrapper, router } = await mountMonProgramme()

    await wrapper.findAll('.frise__nom')[0].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/artiste/fiche/1')
  })

  it('affiche le message vide et un bouton vers la Programmation sans aucun like', async () => {
    likeHandler.getMine.mockResolvedValue([])
    await useLikes().loadLikes()
    const { wrapper, router } = await mountMonProgramme()

    expect(wrapper.text()).toContain(EMPTY_MESSAGE)
    expect(wrapper.find('.frise__bloc').exists()).toBe(false)

    const bouton = wrapper.findAll('button').find((button) => button.text() === 'Voir la programmation')
    await bouton?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/programmation')
  })

  it("affiche le chargement tant que les likes ne sont pas arrivés", async () => {
    useLikes().clearLikes()
    const { wrapper } = await mountMonProgramme()

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain(EMPTY_MESSAGE)
  })

  it("prévient quand la programmation n'a pas pu être chargée", async () => {
    concertHandler.getAllDetailed.mockRejectedValue(new Error('réseau'))
    await mountMonProgramme()

    expect(toast.error).toHaveBeenCalledWith('Impossible de charger ton programme.')
  })

  it('invite à se connecter quand personne ne l’est', async () => {
    loggedIn.value = false
    const { wrapper } = await mountMonProgramme()

    const bouton = wrapper.findAll('button').find((button) => button.text() === 'Se connecter')
    await bouton?.trigger('click')

    expect(useAuthModal().isOpen.value).toBe(true)
    expect(useAuthModal().activeView.value).toBe('login')
  })
})
