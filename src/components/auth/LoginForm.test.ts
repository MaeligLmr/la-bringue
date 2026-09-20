import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { AuthApiError } from '@supabase/supabase-js'
import LoginForm from './LoginForm.vue'

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))
const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('../../supabase.js', () => ({
  supabase: { auth: { signInWithPassword } },
}))

vi.mock('vue-sonner', () => ({ toast }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('LoginForm', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
    toast.success.mockClear()
    toast.error.mockClear()
  })

  it('affiche les erreurs de validation et ne contacte pas Supabase si les champs sont vides', async () => {
    const wrapper = mount(LoginForm, { attachTo: document.body })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('email est requise')
    expect(wrapper.text()).toContain('mot de passe est requis')
    expect(signInWithPassword).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(wrapper.find('#login-email').element)

    wrapper.unmount()
  })

  it('affiche un message et refocus l\'email en cas d\'identifiants invalides', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
    })

    const wrapper = mount(LoginForm, { attachTo: document.body })
    await wrapper.find('#login-email').setValue('alice@example.com')
    await wrapper.find('#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email ou mot de passe incorrect.'))

    expect(document.activeElement).toBe(wrapper.find('#login-email').element)

    wrapper.unmount()
  })

  it("affiche un message distinct quand l'email n'est pas confirmé", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'),
    })

    const wrapper = mount(LoginForm, { attachTo: document.body })
    await wrapper.find('#login-email').setValue('alice@example.com')
    await wrapper.find('#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("n'a pas encore été confirmé")))

    expect(toast.error).not.toHaveBeenCalledWith('Email ou mot de passe incorrect.')
    expect(document.activeElement).toBe(wrapper.find('#login-email').element)

    wrapper.unmount()
  })

  it('désactive le bouton pendant la requête puis le réactive', async () => {
    const { promise, resolve } = deferred<{ data: unknown; error: null }>()
    signInWithPassword.mockReturnValue(promise)

    const wrapper = mount(LoginForm, { attachTo: document.body })
    await wrapper.find('#login-email').setValue('alice@example.com')
    await wrapper.find('#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Connexion en cours')

    resolve({ data: { user: {}, session: {} }, error: null })
    await vi.waitFor(() => expect(wrapper.emitted('success')).toBeTruthy())

    wrapper.unmount()
  })

  it('affiche un message générique en cas de délai dépassé', async () => {
    signInWithPassword.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(LoginForm, { attachTo: document.body })
    await wrapper.find('#login-email').setValue('alice@example.com')
    await wrapper.find('#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(
      () => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Impossible de joindre le serveur')),
      { timeout: 11000 }
    )

    wrapper.unmount()
  }, 15000)

  it('émet "switch" au clic sur le lien de bascule', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('.auth-form__switch').trigger('click')
    expect(wrapper.emitted('switch')).toBeTruthy()
  })

  it('émet "success" pour des identifiants valides', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: {}, session: {} }, error: null })

    const wrapper = mount(LoginForm)
    await wrapper.find('#login-email').setValue('alice@example.com')
    await wrapper.find('#login-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('success')).toBeTruthy())
  })
})
