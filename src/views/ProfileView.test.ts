import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ProfileView from './ProfileView.vue'

const { signOut, updateUser } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
  updateUser: vi.fn().mockResolvedValue({ error: null }),
}))

const { toast } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: '1',
              email: 'alice@example.com',
              user_metadata: { first_name: 'Alice', last_name: 'Martin', username: 'alice_m' },
            },
          },
        },
      }),
      onAuthStateChange: vi.fn(),
      signOut,
      updateUser,
    },
  },
}))

vi.mock('vue-sonner', () => ({ toast }))

async function mountProfileView() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/profil', component: ProfileView },
    ],
  })
  router.push('/profil')
  await router.isReady()
  return { wrapper: mount(ProfileView, { global: { plugins: [router] } }), router }
}

describe('ProfileView', () => {
  beforeEach(() => {
    signOut.mockClear()
    updateUser.mockClear()
    toast.success.mockClear()
    toast.error.mockClear()
  })

  it('affiche un titre et les informations du profil', async () => {
    const { wrapper } = await mountProfileView()
    await vi.waitFor(() => expect(wrapper.find('#profile-first-name').element).toHaveProperty('value', 'Alice'))

    expect(wrapper.find('h1').text()).toBe('Mon profil')
    expect((wrapper.find('#profile-last-name').element as HTMLInputElement).value).toBe('Martin')
    expect((wrapper.find('#profile-username').element as HTMLInputElement).value).toBe('alice_m')

    wrapper.unmount()
  })

  it('la déconnexion appelle supabase.auth.signOut puis retourne à l\'accueil', async () => {
    const { wrapper, router } = await mountProfileView()

    await wrapper.find('.profile__sign-out').trigger('click')
    await vi.waitFor(() => expect(signOut).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))

    wrapper.unmount()
  })

  it('affiche un toast de succès et met à jour le profil quand la sauvegarde réussit', async () => {
    const { wrapper } = await mountProfileView()
    await vi.waitFor(() => expect((wrapper.find('#profile-first-name').element as HTMLInputElement).value).toBe('Alice'))

    await wrapper.find('#profile-username').setValue('alice_new')
    await wrapper.find('.profile__form').trigger('submit')

    await vi.waitFor(() => expect(updateUser).toHaveBeenCalledWith({
      data: { first_name: 'Alice', last_name: 'Martin', username: 'alice_new' },
    }))
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Profil mis à jour.'))
    expect(toast.error).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('affiche un toast d\'erreur quand la sauvegarde échoue', async () => {
    updateUser.mockResolvedValueOnce({ error: { message: 'boom' } })
    const { wrapper } = await mountProfileView()
    await vi.waitFor(() => expect((wrapper.find('#profile-first-name').element as HTMLInputElement).value).toBe('Alice'))

    await wrapper.find('.profile__form').trigger('submit')

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
