import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import Carousel from './Carousel.vue'
import type { CarouselTileData } from '../../types/carousel-tile'

const TILES: CarouselTileData[] = [
  { title: 'Pass 1 jour', content: 'Pass 1 jour au choix' },
  { title: 'Pass 2 jours', content: 'Pass 2 jour au choix' },
  { title: 'Pass 3 jours', content: 'Accéder sur trois jours du festival' },
]

async function mountCarousel(tiles: CarouselTileData[] = TILES) {
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
  router.push('/')
  await router.isReady()
  return mount(Carousel, { props: { tiles }, global: { plugins: [router] } })
}

// happy-dom ne calcule pas de vraie mise en page : scrollWidth/clientWidth
// valent 0 par défaut. On les force sur l'élément .carousel__track pour
// simuler un contenu qui déborde (ou non) et déclencher la logique de
// visibilité des flèches, sans dépendre d'un vrai moteur de rendu.
function fakeScrollMetrics(el: Element, { scrollLeft = 0, clientWidth = 0, scrollWidth = 0 }) {
  Object.defineProperty(el, 'scrollLeft', { value: scrollLeft, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
}

describe('Carousel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche une CarouselTile par élément de `tiles`, avec les bons titres', async () => {
    const wrapper = await mountCarousel()

    const items = wrapper.findAll('.carousel__item')
    expect(items).toHaveLength(3)
    expect(wrapper.text()).toContain('Pass 1 jour')
    expect(wrapper.text()).toContain('Pass 2 jours')
    expect(wrapper.text()).toContain('Pass 3 jours')
  })

  it("n'affiche aucune flèche quand le contenu tient déjà dans le viewport", async () => {
    const wrapper = await mountCarousel([TILES[0]])

    expect(wrapper.find('.carousel__arrow--prev').exists()).toBe(false)
    expect(wrapper.find('.carousel__arrow--next').exists()).toBe(false)
  })

  it('affiche la flèche "suivant" quand le contenu déborde, et "précédent" une fois scrollé', async () => {
    const wrapper = await mountCarousel()
    const track = wrapper.find('.carousel__track').element

    fakeScrollMetrics(track, { scrollLeft: 0, clientWidth: 400, scrollWidth: 1200 })
    await wrapper.find('.carousel__track').trigger('scroll')

    expect(wrapper.find('.carousel__arrow--next').exists()).toBe(true)
    expect(wrapper.find('.carousel__arrow--prev').exists()).toBe(false)

    fakeScrollMetrics(track, { scrollLeft: 400, clientWidth: 400, scrollWidth: 1200 })
    await wrapper.find('.carousel__track').trigger('scroll')

    expect(wrapper.find('.carousel__arrow--prev').exists()).toBe(true)
  })

  it('la flèche "suivant" scrolle le track vers la droite d\'une page', async () => {
    const wrapper = await mountCarousel()
    const track = wrapper.find('.carousel__track').element as HTMLElement

    fakeScrollMetrics(track, { scrollLeft: 0, clientWidth: 400, scrollWidth: 1200 })
    await wrapper.find('.carousel__track').trigger('scroll')

    const scrollBy = vi.fn()
    track.scrollBy = scrollBy

    await wrapper.find('.carousel__arrow--next').trigger('click')

    expect(scrollBy).toHaveBeenCalledWith({ left: 400, behavior: 'smooth' })
  })
})
