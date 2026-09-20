import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

const { signOut, updateUser } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
  updateUser: vi.fn().mockResolvedValue({ error: null }),
}))

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('vue-sonner', () => ({ toast }))

// useAuth (and useAuthModal) hold module-level singleton state — reset the
// module registry and re-mock supabase before each dynamic re-import, same
// as Navbar.test.ts.
function mockSupabase(
  session: { user: { id: string; email: string; user_metadata?: Record<string, string> } } | null
) {
  vi.doMock('../supabase.js', () => ({
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session } }),
        onAuthStateChange: vi.fn(),
        signOut,
        updateUser,
      },
    },
  }))
}

const LOGGED_IN_SESSION = {
  user: {
    id: '1',
    email: 'alice@example.com',
    user_metadata: { first_name: 'Alice', last_name: 'Martin', username: 'alice_m' },
  },
}

async function mountProfileView() {
  const { default: ProfileView } = await import('./ProfileView.vue')
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/profil', component: ProfileView },
    ],
  })
  router.push('/profil')
  await router.isReady()
  const wrapper = mount(ProfileView, { global: { plugins: [router] } })
  const { useAuth } = await import('../composables/useAuth')
  await useAuth().ready
  await wrapper.vm.$nextTick()
  return { wrapper, router }
}

beforeEach(() => {
  vi.resetModules()
  signOut.mockClear()
  updateUser.mockClear()
  toast.success.mockClear()
  toast.error.mockClear()
})

describe('ProfileView', () => {
  it('affiche un titre et les informations du profil quand on est connecté', async () => {
    mockSupabase(LOGGED_IN_SESSION)
    const { wrapper } = await mountProfileView()

    expect(wrapper.find('h1').text()).toBe('Mon profil')
    expect((wrapper.find('#profile-first-name').element as HTMLInputElement).value).toBe('Alice')
    expect((wrapper.find('#profile-last-name').element as HTMLInputElement).value).toBe('Martin')
    expect((wrapper.find('#profile-username').element as HTMLInputElement).value).toBe('alice_m')

    wrapper.unmount()
  })

  it('la déconnexion appelle supabase.auth.signOut puis retourne à l\'accueil', async () => {
    mockSupabase(LOGGED_IN_SESSION)
    const { wrapper, router } = await mountProfileView()

    await wrapper.find('.profile__sign-out').trigger('click')
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))

    wrapper.unmount()
  })

  it('affiche un toast de succès et met à jour le profil quand la sauvegarde réussit', async () => {
    mockSupabase(LOGGED_IN_SESSION)
    const { wrapper } = await mountProfileView()

    await wrapper.find('#profile-username').setValue('alice_new')
    await wrapper.find('.profile__form').trigger('submit')

    await vi.waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({
        data: { first_name: 'Alice', last_name: 'Martin', username: 'alice_new' },
      })
    )
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Profil mis à jour.'))
    expect(toast.error).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('affiche un toast d\'erreur quand la sauvegarde échoue', async () => {
    mockSupabase(LOGGED_IN_SESSION)
    updateUser.mockResolvedValueOnce({ error: { message: 'boom' } })
    const { wrapper } = await mountProfileView()

    await wrapper.find('.profile__form').trigger('submit')

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it("affiche les boutons connexion/inscription à la place du formulaire quand on n'est pas connecté", async () => {
    mockSupabase(null)
    const { wrapper } = await mountProfileView()

    expect(wrapper.text()).toContain('Se connecter')
    expect(wrapper.text()).toContain('Créer un compte')
    expect(wrapper.find('#profile-first-name').exists()).toBe(false)
    expect(wrapper.find('.profile__sign-out').exists()).toBe(false)

    wrapper.unmount()
  })

  it("le clic sur \"Se connecter\" ouvre la modale d'authentification en mode connexion", async () => {
    mockSupabase(null)
    const { wrapper } = await mountProfileView()

    const loginButton = wrapper.findAll('button').find((button) => button.text() === 'Se connecter')
    await loginButton?.trigger('click')

    const { useAuthModal } = await import('../composables/useAuthModal')
    const { isOpen, activeView } = useAuthModal()
    expect(isOpen.value).toBe(true)
    expect(activeView.value).toBe('login')

    wrapper.unmount()
  })
})
