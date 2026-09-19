import { describe, it, expect } from 'vitest'
import { AuthApiError, type User } from '@supabase/supabase-js'
import {
  mapAuthError,
  isObfuscatedDuplicateSignup,
  INVALID_CREDENTIALS_MESSAGE,
  EMAIL_ALREADY_USED_MESSAGE,
  EMAIL_NOT_CONFIRMED_MESSAGE,
  GENERIC_NETWORK_MESSAGE,
} from './auth-errors'
import { AuthTimeoutError } from './with-timeout'

describe('mapAuthError', () => {
  it('identifie les identifiants invalides', () => {
    const error = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
    expect(mapAuthError(error)).toBe(INVALID_CREDENTIALS_MESSAGE)
  })

  it('identifie un email déjà utilisé (code email_exists)', () => {
    const error = new AuthApiError('Email already registered', 422, 'email_exists')
    expect(mapAuthError(error)).toBe(EMAIL_ALREADY_USED_MESSAGE)
  })

  it('identifie un email déjà utilisé (code user_already_exists)', () => {
    const error = new AuthApiError('User already registered', 422, 'user_already_exists')
    expect(mapAuthError(error)).toBe(EMAIL_ALREADY_USED_MESSAGE)
  })

  it('identifie un email non confirmé, distinct des identifiants invalides', () => {
    const error = new AuthApiError('Email not confirmed', 400, 'email_not_confirmed')
    expect(mapAuthError(error)).toBe(EMAIL_NOT_CONFIRMED_MESSAGE)
    expect(EMAIL_NOT_CONFIRMED_MESSAGE).not.toBe(INVALID_CREDENTIALS_MESSAGE)
  })

  it('retombe sur un message générique pour un timeout', () => {
    expect(mapAuthError(new AuthTimeoutError())).toBe(GENERIC_NETWORK_MESSAGE)
  })

  it('retombe sur un message générique pour une erreur réseau brute', () => {
    expect(mapAuthError(new TypeError('fetch failed'))).toBe(GENERIC_NETWORK_MESSAGE)
  })

  it('le message générique réseau est distinct des messages identifiants/email', () => {
    expect(GENERIC_NETWORK_MESSAGE).not.toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(GENERIC_NETWORK_MESSAGE).not.toBe(EMAIL_ALREADY_USED_MESSAGE)
  })
})

describe('isObfuscatedDuplicateSignup', () => {
  it('détecte un utilisateur avec un tableau identities vide', () => {
    const user = { identities: [] } as unknown as User
    expect(isObfuscatedDuplicateSignup(user)).toBe(true)
  })

  it("n'est pas déclenché pour un nouvel utilisateur avec une identité", () => {
    const user = { identities: [{ id: 'x' }] } as unknown as User
    expect(isObfuscatedDuplicateSignup(user)).toBe(false)
  })

  it('gère un utilisateur null', () => {
    expect(isObfuscatedDuplicateSignup(null)).toBe(false)
  })
})
