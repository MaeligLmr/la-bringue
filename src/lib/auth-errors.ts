import { isAuthApiError, type User } from '@supabase/supabase-js'

export const INVALID_CREDENTIALS_MESSAGE = 'Email ou mot de passe incorrect.'
export const EMAIL_ALREADY_USED_MESSAGE = 'Un compte existe déjà avec cet email.'
export const EMAIL_NOT_CONFIRMED_MESSAGE =
  "Ton email n'a pas encore été confirmé. Vérifie ta boîte de réception."
export const GENERIC_ERROR_MESSAGE = "Une erreur inattendue s'est produite. Réessaie plus tard."
export const GENERIC_NETWORK_MESSAGE =
  'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.'

export function mapAuthError(error: unknown): string {
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return INVALID_CREDENTIALS_MESSAGE
      case 'email_not_confirmed':
        return EMAIL_NOT_CONFIRMED_MESSAGE
      case 'email_exists':
      case 'user_already_exists':
        return EMAIL_ALREADY_USED_MESSAGE
      case 'weak_password':
        return 'Le mot de passe doit contenir au moins 8 caractères.'
      default:
        return GENERIC_ERROR_MESSAGE
    }
  }

  // Erreur réseau, timeout, Supabase injoignable : tout ce qui n'est pas une
  // AuthApiError structurée tombe dans le message générique (distinct des
  // identifiants invalides et de l'email déjà utilisé).
  return GENERIC_NETWORK_MESSAGE
}

/**
 * Quand la confirmation email est activée sur le projet Supabase, signUp()
 * sur un email déjà enregistré ne renvoie pas d'erreur — il répond avec un
 * utilisateur dont `identities` est un tableau vide, pour éviter
 * l'énumération de comptes. Un vrai nouvel utilisateur a toujours au moins
 * une identité.
 */
export function isObfuscatedDuplicateSignup(user: User | null | undefined): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0)
}
