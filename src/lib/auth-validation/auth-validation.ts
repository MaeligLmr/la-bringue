export const EMAIL_REQUIRED = "L'adresse email est requise."
export const EMAIL_INVALID = "L'adresse email n'est pas valide."
export const PASSWORD_REQUIRED = 'Le mot de passe est requis.'
export const PASSWORD_TOO_SHORT = 'Le mot de passe doit contenir au moins 8 caractères.'
export const PASSWORD_CONFIRMATION_REQUIRED = 'La confirmation du mot de passe est requise.'
export const PASSWORD_MISMATCH = 'Les mots de passe ne correspondent pas.'
export const FIRST_NAME_REQUIRED = 'Le prénom est requis.'
export const LAST_NAME_REQUIRED = 'Le nom est requis.'
export const USERNAME_REQUIRED = "Le nom d'utilisateur est requis."
export const USERNAME_TOO_SHORT = "Le nom d'utilisateur doit contenir au moins 3 caractères."
export const USERNAME_INVALID =
  "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores."

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/
const MIN_PASSWORD_LENGTH = 8
const MIN_USERNAME_LENGTH = 3

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value)
}

export interface FieldErrors {
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  username?: string
}

export interface SignupFields {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  username: string
}

export interface ProfileFields {
  firstName: string
  lastName: string
  username: string
}

function validateEmailField(email: string): string | undefined {
  if (!email) return EMAIL_REQUIRED
  if (!isValidEmail(email)) return EMAIL_INVALID
  return undefined
}

function validateUsernameField(username: string): string | undefined {
  if (!username) return USERNAME_REQUIRED
  if (username.length < MIN_USERNAME_LENGTH) return USERNAME_TOO_SHORT
  if (!isValidUsername(username)) return USERNAME_INVALID
  return undefined
}

// Shared by signup (where they're just two more fields alongside
// email/password) and profile editing (where they're the only fields).
function validateProfileFieldsInto(errors: FieldErrors, fields: ProfileFields) {
  if (!fields.firstName.trim()) errors.firstName = FIRST_NAME_REQUIRED
  if (!fields.lastName.trim()) errors.lastName = LAST_NAME_REQUIRED

  const usernameError = validateUsernameField(fields.username)
  if (usernameError) errors.username = usernameError
}

export function validateProfileFields(fields: ProfileFields): FieldErrors {
  const errors: FieldErrors = {}
  validateProfileFieldsInto(errors, fields)
  return errors
}

export function validateLoginFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  const emailError = validateEmailField(email)
  if (emailError) errors.email = emailError

  if (!password) errors.password = PASSWORD_REQUIRED

  return errors
}

export function validateSignupFields(fields: SignupFields): FieldErrors {
  const errors: FieldErrors = {}

  const emailError = validateEmailField(fields.email)
  if (emailError) errors.email = emailError

  if (!fields.password) errors.password = PASSWORD_REQUIRED
  else if (fields.password.length < MIN_PASSWORD_LENGTH) errors.password = PASSWORD_TOO_SHORT

  if (!fields.confirmPassword) errors.confirmPassword = PASSWORD_CONFIRMATION_REQUIRED
  else if (fields.confirmPassword !== fields.password) errors.confirmPassword = PASSWORD_MISMATCH

  validateProfileFieldsInto(errors, fields)

  return errors
}
