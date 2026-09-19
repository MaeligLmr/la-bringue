import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { AuthApiError } from '@supabase/supabase-js'
import SignUpForm from './SignUpForm.vue'

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }))

vi.mock('../../supabase.js', () => ({
  supabase: { auth: { signUp } },
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    signUp.mockReset()
  })

  it('refuse un mot de passe de moins de 8 caractères sans appeler Supabase', async () => {
    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('abc123')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('au moins 8 caractères')
    expect(signUp).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it("détecte un email déjà utilisé via l'heuristique d'obfuscation (identities vide)", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [] }, session: null },
      error: null,
    })

    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Un compte existe déjà'))

    expect(wrapper.emitted('success')).toBeFalsy()

    wrapper.unmount()
  })

  it('détecte un email déjà utilisé via une erreur explicite (email_exists)', async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError('Email already registered', 422, 'email_exists'),
    })

    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Un compte existe déjà'))

    expect(wrapper.emitted('success')).toBeFalsy()

    wrapper.unmount()
  })

  it('désactive le bouton pendant la requête', async () => {
    signUp.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(SignUpForm)
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('password123')
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
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.emitted('success')).toBeTruthy())
  })

  it("invite à vérifier ses emails quand aucune session n'est renvoyée (confirmation email activée)", async () => {
    signUp.mockResolvedValue({
      data: { user: { identities: [{ id: 'x' }] }, session: null },
      error: null,
    })

    const wrapper = mount(SignUpForm, { attachTo: document.body })
    await wrapper.find('#signup-email').setValue('alice@example.com')
    await wrapper.find('#signup-password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Vérifie ta boîte mail'))

    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.emitted('success')).toBeFalsy()
    expect(document.activeElement).toBe(wrapper.find('button[type="button"]').element)

    wrapper.unmount()
  })
})
