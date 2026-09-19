import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  validateLoginFields,
  validateSignupFields,
  EMAIL_REQUIRED,
  EMAIL_INVALID,
  PASSWORD_REQUIRED,
  PASSWORD_TOO_SHORT,
} from './auth-validation'

describe('isValidEmail', () => {
  it('accepte une adresse email valide', () => {
    expect(isValidEmail('alice@example.com')).toBe(true)
  })

  it('rejette une adresse email mal formée', () => {
    expect(isValidEmail('alice@example')).toBe(false)
    expect(isValidEmail('alice.example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('validateLoginFields', () => {
  it("renvoie une erreur si l'email est vide", () => {
    expect(validateLoginFields('', 'password123')).toEqual({ email: EMAIL_REQUIRED })
  })

  it("renvoie une erreur si l'email est mal formé", () => {
    expect(validateLoginFields('pas-un-email', 'password123')).toEqual({ email: EMAIL_INVALID })
  })

  it('renvoie une erreur si le mot de passe est vide', () => {
    expect(validateLoginFields('alice@example.com', '')).toEqual({ password: PASSWORD_REQUIRED })
  })

  it("n'accepte pas un mot de passe court comme invalide (règle non appliquée à la connexion)", () => {
    expect(validateLoginFields('alice@example.com', 'abc')).toEqual({})
  })

  it('ne renvoie aucune erreur pour des champs valides', () => {
    expect(validateLoginFields('alice@example.com', 'password123')).toEqual({})
  })
})

describe('validateSignupFields', () => {
  it('renvoie une erreur si le mot de passe fait moins de 8 caractères', () => {
    expect(validateSignupFields('alice@example.com', 'abc123')).toEqual({
      password: PASSWORD_TOO_SHORT,
    })
  })

  it('renvoie une erreur si le mot de passe est vide', () => {
    expect(validateSignupFields('alice@example.com', '')).toEqual({ password: PASSWORD_REQUIRED })
  })

  it("renvoie une erreur si l'email est invalide", () => {
    expect(validateSignupFields('pas-un-email', 'password123')).toEqual({ email: EMAIL_INVALID })
  })

  it('ne renvoie aucune erreur pour des champs valides', () => {
    expect(validateSignupFields('alice@example.com', 'password123')).toEqual({})
  })
})
