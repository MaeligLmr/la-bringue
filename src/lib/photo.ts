// `photo` est un chemin absolu (ex: "/programmation/aya-nakamura.jpg") vers
// public/ : il faut le préfixer par BASE_URL pour rester valide une fois
// l'app déployée sous un sous-chemin (voir vite.config.ts `base`). Une URL
// complète (ex: Supabase Storage) est utilisée telle quelle.
export function photoUrl(photo: string) {
  return /^https?:\/\//.test(photo) ? photo : import.meta.env.BASE_URL + photo.replace(/^\//, '')
}
