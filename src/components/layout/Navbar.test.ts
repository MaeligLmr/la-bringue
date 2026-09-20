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
  it('affiche les boutons de connexion quand personne n\'est connecté', async () => {
    mockSupabase(null)
    const { wrapper } = await mountNavbar()
    const { useAuth } = await import('../../composables/useAuth')
    await useAuth().ready
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Se connecter')
    expect(wrapper.text()).toContain('Créer un compte')
    expect(wrapper.find('.navbar__badge').exists()).toBe(false)

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

    expect(wrapper.text()).not.toContain('Se connecter')
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
})
