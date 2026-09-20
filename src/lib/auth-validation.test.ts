import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidUsername,
  validateLoginFields,
  validateSignupFields,
  validateProfileFields,
  EMAIL_REQUIRED,
  EMAIL_INVALID,
  PASSWORD_REQUIRED,
  PASSWORD_TOO_SHORT,
  PASSWORD_CONFIRMATION_REQUIRED,
  PASSWORD_MISMATCH,
  FIRST_NAME_REQUIRED,
  LAST_NAME_REQUIRED,
  USERNAME_REQUIRED,
  USERNAME_TOO_SHORT,
  USERNAME_INVALID,
  type SignupFields,
  type ProfileFields,
} from './auth-validation'

const VALID_SIGNUP_FIELDS: SignupFields = {
  email: 'alice@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  firstName: 'Alice',
  lastName: 'Martin',
  username: 'alice_m',
}

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

describe('isValidUsername', () => {
  it('accepte lettres, chiffres, tirets et underscores', () => {
    expect(isValidUsername('alice_m-2')).toBe(true)
  })

  it('rejette les espaces et autres caractères spéciaux', () => {
    expect(isValidUsername('alice martin')).toBe(false)
    expect(isValidUsername('alice@martin')).toBe(false)
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
    expect(
      validateSignupFields({ ...VALID_SIGNUP_FIELDS, password: 'abc123', confirmPassword: 'abc123' })
    ).toEqual({
      password: PASSWORD_TOO_SHORT,
    })
  })

  it('renvoie une erreur si le mot de passe est vide', () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, password: '' })).toEqual({
      password: PASSWORD_REQUIRED,
      confirmPassword: PASSWORD_MISMATCH,
    })
  })

  it('renvoie une erreur si la confirmation du mot de passe est vide', () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, confirmPassword: '' })).toEqual({
      confirmPassword: PASSWORD_CONFIRMATION_REQUIRED,
    })
  })

  it('renvoie une erreur si la confirmation ne correspond pas au mot de passe', () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, confirmPassword: 'autrepassword' })).toEqual({
      confirmPassword: PASSWORD_MISMATCH,
    })
  })

  it("renvoie une erreur si l'email est invalide", () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, email: 'pas-un-email' })).toEqual({
      email: EMAIL_INVALID,
    })
  })

  it('renvoie une erreur si le prénom est vide', () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, firstName: '  ' })).toEqual({
      firstName: FIRST_NAME_REQUIRED,
    })
  })

  it('renvoie une erreur si le nom est vide', () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, lastName: '' })).toEqual({
      lastName: LAST_NAME_REQUIRED,
    })
  })

  it("renvoie une erreur si le nom d'utilisateur est vide", () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, username: '' })).toEqual({
      username: USERNAME_REQUIRED,
    })
  })

  it("renvoie une erreur si le nom d'utilisateur fait moins de 3 caractères", () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, username: 'ab' })).toEqual({
      username: USERNAME_TOO_SHORT,
    })
  })

  it("renvoie une erreur si le nom d'utilisateur contient des caractères invalides", () => {
    expect(validateSignupFields({ ...VALID_SIGNUP_FIELDS, username: 'alice martin' })).toEqual({
      username: USERNAME_INVALID,
    })
  })

  it('ne renvoie aucune erreur pour des champs valides', () => {
    expect(validateSignupFields(VALID_SIGNUP_FIELDS)).toEqual({})
  })
})

const VALID_PROFILE_FIELDS: ProfileFields = {
  firstName: 'Alice',
  lastName: 'Martin',
  username: 'alice_m',
}

describe('validateProfileFields', () => {
  it('renvoie une erreur si le prénom est vide', () => {
    expect(validateProfileFields({ ...VALID_PROFILE_FIELDS, firstName: '  ' })).toEqual({
      firstName: FIRST_NAME_REQUIRED,
    })
  })

  it('renvoie une erreur si le nom est vide', () => {
    expect(validateProfileFields({ ...VALID_PROFILE_FIELDS, lastName: '' })).toEqual({
      lastName: LAST_NAME_REQUIRED,
    })
  })

  it("renvoie une erreur si le nom d'utilisateur est invalide", () => {
    expect(validateProfileFields({ ...VALID_PROFILE_FIELDS, username: 'ab' })).toEqual({
      username: USERNAME_TOO_SHORT,
    })
  })

  it('ne renvoie aucune erreur pour des champs valides, et ne connaît pas email/password', () => {
    expect(validateProfileFields(VALID_PROFILE_FIELDS)).toEqual({})
  })
})
