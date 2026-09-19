export const EMAIL_REQUIRED = "L'adresse email est requise."
export const EMAIL_INVALID = "L'adresse email n'est pas valide."
export const PASSWORD_REQUIRED = 'Le mot de passe est requis.'
export const PASSWORD_TOO_SHORT = 'Le mot de passe doit contenir au moins 8 caractères.'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

export interface FieldErrors {
  email?: string
  password?: string
}

function validateEmailField(email: string): string | undefined {
  if (!email) return EMAIL_REQUIRED
  if (!isValidEmail(email)) return EMAIL_INVALID
  return undefined
}

export function validateLoginFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  const emailError = validateEmailField(email)
  if (emailError) errors.email = emailError

  if (!password) errors.password = PASSWORD_REQUIRED

  return errors
}

export function validateSignupFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  const emailError = validateEmailField(email)
  if (emailError) errors.email = emailError

  if (!password) errors.password = PASSWORD_REQUIRED
  else if (password.length < MIN_PASSWORD_LENGTH) errors.password = PASSWORD_TOO_SHORT

  return errors
}
