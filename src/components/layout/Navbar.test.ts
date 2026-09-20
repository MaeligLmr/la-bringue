import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

// useAuth holds module-level singleton state initialized from
// supabase.auth.getSession() at import time — reset the module registry
// and re-mock supabase before each dynamic re-import, same as
// useAuth.test.ts.
function mockSupabase(
  session: { user: { id: string; email: string; user_metadata?: { username?: string } } } | null
) {
  vi.doMock('../../supabase.js', () => ({
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session } }),
        onAuthStateChange: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  }))
}

async function mountNavbar() {
  const { default: Navbar } = await import('./Navbar.vue')
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/profil', component: { template: '<div />' } },
      { path: '/programmation', component: { template: '<div />' } },
      { path: '/billetterie', component: { template: '<div />' } },
      { path: '/mon-programme', component: { template: '<div />' } },
      { path: '/exposants', component: { template: '<div />' } },
      { path: '/conferences', component: { template: '<div />' } },
      { path: '/a-propos', component: { template: '<div />' } },
      { path: '/infos-pratiques', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  await router.isReady()
  return { wrapper: mount(Navbar, { global: { plugins: [router] } }), router }
}

beforeEach(() => {
  vi.resetModules()
})

describe('Navbar', () => {
  it("affiche une icône profil (pas de badge) menant à /profil quand personne n'est connecté", async () => {
    mockSupabase(null)
    const { wrapper, router } = await mountNavbar()
    const { useAuth } = await import('../../composables/useAuth')
    await useAuth().ready
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.navbar__badge').exists()).toBe(false)

    const profileButton = wrapper.find('button[aria-label="Profil"]')
    expect(profileButton.exists()).toBe(true)

    await profileButton.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/profil'))

    wrapper.unmount()
  })

  it("affiche le badge avec le nom d'utilisateur et navigue vers /profil au clic", async () => {
    mockSupabase({
      user: { id: '1', email: 'alice@example.com', user_metadata: { username: 'alice_m' } },
    })
    const { wrapper, router } = await mountNavbar()
    const { useAuth } = await import('../../composables/useAuth')
    await useAuth().ready
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button[aria-label="Profil"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('alice_m')
    expect(wrapper.text()).not.toContain('alice@example.com')

    const badge = wrapper.find('.navbar__badge')
    expect(badge.exists()).toBe(true)

    await badge.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/profil'))

    wrapper.unmount()
  })

  it("retombe sur l'email si le compte n'a pas de nom d'utilisateur (comptes créés avant ce champ)", async () => {
    mockSupabase({ user: { id: '1', email: 'alice@example.com' } })
    const { wrapper } = await mountNavbar()
    const { useAuth } = await import('../../composables/useAuth')
    await useAuth().ready
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('alice@example.com')

    wrapper.unmount()
  })

  it('le clic sur le logo ramène à l\'accueil', async () => {
    mockSupabase(null)
    const { wrapper, router } = await mountNavbar()
    await router.push('/profil')

    await wrapper.find('.navbar__logo').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))

    wrapper.unmount()
  })

  it('les liens Programmation et Billetterie de la barre naviguent vers les bonnes pages', async () => {
    mockSupabase(null)
    const { wrapper, router } = await mountNavbar()

    const [billetterie, programmation] = wrapper.findAll('.navbar__nav-link')
    expect(billetterie.text()).toBe('Billetterie')
    expect(programmation.text()).toBe('Programmation')

    await billetterie.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/billetterie'))

    wrapper.unmount()
  })

  it('le cœur "Mon programme" navigue vers /mon-programme', async () => {
    mockSupabase(null)
    const { wrapper, router } = await mountNavbar()

    await wrapper.find('button[aria-label="Mon programme"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/mon-programme'))

    wrapper.unmount()
  })

  it('le menu burger contient Programmation, Billetterie, Newsletter et les réseaux sociaux, et navigue au clic', async () => {
    mockSupabase(null)
    const { wrapper, router } = await mountNavbar()

    expect(document.body.querySelector('.navbar__menu')).toBeNull()

    await wrapper.find('button[aria-label="Ouvrir le menu"]').trigger('click')
    await wrapper.vm.$nextTick()

    // Le contenu du drawer est téléporté dans <body>, hors de l'arbre du
    // wrapper — on interagit donc directement avec le DOM réel.
    const menu = document.body.querySelector('.navbar__menu') as HTMLElement
    expect(menu).not.toBeNull()
    expect(menu.textContent).toContain('Programmation')
    expect(menu.textContent).toContain('Billetterie')
    expect(menu.textContent).toContain('Newsletter')
    expect(menu.querySelectorAll('[aria-label="Instagram"]').length).toBe(1)

    const programmationButton = Array.from(menu.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Programmation'
    )
    programmationButton?.click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/programmation'))
    await vi.waitFor(() => expect(document.body.querySelector('.navbar__menu')).toBeNull())

    wrapper.unmount()
  })

  it('le menu burger propose aussi Exposants, Conférences, À propos et Infos pratiques, et navigue au clic', async () => {
    mockSupabase(null)
    const { wrapper, router } = await mountNavbar()

    await wrapper.find('button[aria-label="Ouvrir le menu"]').trigger('click')
    await wrapper.vm.$nextTick()

    const menu = document.body.querySelector('.navbar__menu') as HTMLElement
    expect(menu).not.toBeNull()
    expect(menu.textContent).toContain('Exposants')
    expect(menu.textContent).toContain('Conférences')
    expect(menu.textContent).toContain('À propos')
    expect(menu.textContent).toContain('Infos pratiques')

    const exposantsButton = Array.from(menu.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Exposants'
    )
    exposantsButton?.click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/exposants'))
    await vi.waitFor(() => expect(document.body.querySelector('.navbar__menu')).toBeNull())

    wrapper.unmount()
  })
})
