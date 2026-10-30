// Dossiers d'images hébergés dans le bucket Supabase Storage `images`
// (voir supabase/storage_images.sql et scripts/upload-images.mjs).
const STORAGE_BUCKET = 'images'
const STORAGE_FOLDERS = ['exposants', 'programmation']

// `photo` est soit une URL complète (utilisée telle quelle), soit un chemin
// absolu (ex: "/programmation/aya-nakamura.webp"). Les chemins des dossiers
// ci-dessus pointent vers Supabase Storage ; les autres restent servis depuis
// public/ et doivent être préfixés par BASE_URL pour rester valides une fois
// l'app déployée sous un sous-chemin (voir vite.config.ts `base`).
export function photoUrl(photo: string) {
  if (/^https?:\/\//.test(photo)) return photo

  const path = photo.replace(/^\//, '')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (supabaseUrl && STORAGE_FOLDERS.includes(path.split('/')[0])) {
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
  }
  return import.meta.env.BASE_URL + path
}
