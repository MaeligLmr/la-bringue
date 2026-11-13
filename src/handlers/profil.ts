import { supabase } from '../supabase.js'
import { toWebp } from '../lib/image/to-webp'
import { unwrap } from './crud'

const TABLE = 'Profil'
// Bucket privé : chaque utilisatrice n'accède qu'à son dossier (policies Storage sur <son id>/…),
// WebP uniquement et 1 Mo max côté bucket — à garder aligné sur AVATAR_MAX_BYTES ci-dessous.
const BUCKET = 'profilepictures'

// Durée de validité de l'URL signée d'une photo (privée, donc sans URL publique).
const SIGNED_URL_TTL_SECONDS = 60 * 60
// Une photo de profil s'affiche petite : réduite et plafonnée bien en dessous du bucket.
const AVATAR_MAX_WIDTH = 512
export const AVATAR_MAX_BYTES = 1024 * 1024

export const profilHandler = {
  // Chemin (dans le bucket) de la photo de l'utilisatrice, ou null.
  async getPp(userId: string): Promise<string | null> {
    const row = unwrap<{ pp: string | null } | null>(
      TABLE,
      await supabase.from(TABLE).select('pp').eq('id', userId).maybeSingle()
    )
    return row?.pp ?? null
  },

  // Le bucket est privé : la photo s'affiche via une URL signée temporaire.
  async getPpUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    if (error) throw error
    return data.signedUrl
  },

  // Convertit l'image en WebP, l'envoie dans le dossier de l'utilisatrice, la
  // référence dans Profil.pp, puis supprime l'ancienne. Un nom unique à chaque envoi
  // évite qu'un cache serve l'ancienne photo. Renvoie le nouveau chemin.
  async changePp(userId: string, file: File, previousPath?: string | null): Promise<string> {
    const webp = await toWebp(file, { maxWidth: AVATAR_MAX_WIDTH, maxBytes: AVATAR_MAX_BYTES })
    const path = `${userId}/${crypto.randomUUID()}.webp`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, webp, { contentType: webp.type })
    if (uploadError) throw uploadError

    // RPC (et non un update direct) : l'utilisatrice ne peut ainsi modifier que sa photo, jamais son rôle.
    const { error: saveError } = await supabase.rpc('set_my_pp', { new_pp: path })
    if (saveError) {
      await removeQuietly(path)
      throw saveError
    }

    if (previousPath && previousPath !== path) await removeQuietly(previousPath)
    return path
  },
}

// Un fichier orphelin n'empêche rien : on ne fait pas échouer l'envoi pour ça.
async function removeQuietly(path: string) {
  try {
    await supabase.storage.from(BUCKET).remove([path])
  } catch (error) {
    console.error('[profil] suppression de la photo impossible', error)
  }
}
