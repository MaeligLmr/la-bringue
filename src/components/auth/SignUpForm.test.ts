import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { AuthApiError } from '@supabase/supabase-js'
import SignUpForm from './SignUpForm.vue'

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }))
const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('../../supabase.js', () => ({
  supabase: { auth: { signUp } },
}))

vi.mock('vue-sonner', () => ({ toast }))

async function fillValidFields(wrapper: VueWrapper) {
  await wrapper.find('#signup-first-name').setValue('Alice')
  await wrapper.find('#signup-last-name').setValue('Martin')
  await wrapper.find('#signup-username').setValue('alice_m')
  await wrapper.find('#signup-email').setValue('alice@example.com')
  await wrapper.find('#signup-password').setValue('password123')
  await wrapper.find('#signup-confirm-password').setValue('password123')
}

describe('SignUpForm', () => {
  beforeEach(() => {
    signUp.mockReset()
    toast.success.mockClear()
    toast.error.mockClear()
  })

  it('refuse un mot de passe de moins de 8 caractères sans appeler Supabase', async () => {
    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await fillValidFields(wrapper)
    await wrapper.find('#signup-password').setValue('abc123')
    await wrapper.find('#signup-confirm-password').setValue('abc123')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('au moins 8 caractères')
    expect(signUp).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('refuse une confirmation de mot de passe vide ou différente sans appeler Supabase', async () => {
    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await fillValidFields(wrapper)
    await wrapper.find('#signup-confirm-password').setValue('')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('confirmation du mot de passe est requise')
    expect(signUp).not.toHaveBeenCalled()

    await wrapper.find('#signup-confirm-password').setValue('autrepassword')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('ne correspondent pas')
    expect(signUp).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('refuse un prénom, nom ou nom d\'utilisateur vide sans appeler Supabase', async () => {
    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('password123')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('prénom est requis')
    expect(wrapper.text()).toContain('nom est requis')
    expect(wrapper.text()).toContain("nom d'utilisateur est requis")
    expect(document.activeElement).toBe(wrapper.find('#signup-first-name').element)
    expect(signUp).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it("refuse un nom d'utilisateur avec des caractères invalides", async () => {
    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await fillValidFields(wrapper)
    await wrapper.find('#signup-username').setValue('alice martin!')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('lettres, chiffres, tirets et underscores')
    expect(signUp).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('envoie prénom, nom et nom d\'utilisateur dans les métadonnées Supabase', async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [{ id: 'x' }] }, session: { access_token: 'token' } },
      error: null,
    })

    const wrapper = mount(SignUpForm)
    await fillValidFields(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('success')).toBeTruthy())

    expect(signUp).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'password123',
      options: {
        data: { first_name: 'Alice', last_name: 'Martin', username: 'alice_m' },
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    })
  })

  it("détecte un email déjà utilisé via l'heuristique d'obfuscation (identities vide)", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [] }, session: null },
      error: null,
    })

    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await fillValidFields(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Un compte existe déjà')))

    expect(wrapper.emitted('success')).toBeFalsy()

    wrapper.unmount()
  })

  it('détecte un email déjà utilisé via une erreur explicite (email_exists)', async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Email already registered', 422, 'email_exists'),
    })

    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await fillValidFields(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Un compte existe déjà')))

    expect(wrapper.emitted('success')).toBeFalsy()

    wrapper.unmount()
  })

  it('désactive le bouton pendant la requête', async () => {
    signUp.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(SignUpForm)
    await fillValidFields(wrapper)
    await wrapper.find('form').trigger('submit')

    const button = wrapper.find('button[type="submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Création en cours')
  })

  it('émet "success" quand une session est créée immédiatement (confirmation email désactivée)', async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [{ id: 'x' }] }, session: { access_token: 'token' } },
      error: null,
    })

    const wrapper = mount(SignUpForm)
    await fillValidFields(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('success')).toBeTruthy())
  })

  it("invite à vérifier ses emails quand aucune session n'est renvoyée (confirmation email activée)", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [{ id: 'x' }] }, session: null },
      error: null,
    })

    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await fillValidFields(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Vérifie ta boîte mail'))

    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.emitted('success')).toBeFalsy()
    expect(document.activeElement).toBe(wrapper.find('button[type="button"]').element)

    wrapper.unmount()
  })
})
