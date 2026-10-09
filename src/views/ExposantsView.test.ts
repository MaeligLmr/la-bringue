import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ExposantsView from './ExposantsView.vue'
import type { Exposant } from '../types/database/exposant'

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

vi.mock('../handlers/exposant', () => ({
  exposantHandler: {
    getAllByNom: vi.fn(async () => EXPOSANTS),
    getCategories: vi.fn(async () => CATEGORIES),
  },
}))

async function mountExposants(url = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: ExposantsView }],
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

    expect(displayedNames(wrapper)).toEqual(['Encre Noire', 'Green Fest', 'Ink & Love', 'La Crêperie'])

    wrapper.unmount()
  })

  it('affiche la catégorie sur chaque carte, sans bouton like', async () => {
    const wrapper = await mountExposants()

    const card = wrapper.findAll('.content-card').find((node) => node.text().includes('La Crêperie'))
    expect(card?.find('.tag').text()).toBe('Restauration')
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

    expect(displayedNames(wrapper)).toEqual(['Encre Noire', 'Ink & Love'])

    wrapper.unmount()
  })

  it('pré-applique la catégorie passée dans l’URL', async () => {
    const wrapper = await mountExposants('/?categorie=%C3%89cologie')

    expect(filterButton(wrapper, 'Écologie').attributes('aria-pressed')).toBe('true')
    expect(displayedNames(wrapper)).toEqual(['Green Fest'])

    wrapper.unmount()
  })
})
