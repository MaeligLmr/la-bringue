import { ref, watch } from 'vue'
import { profilHandler } from '../../handlers/profil'
import { useAuth } from '../useAuth/useAuth'

// L'URL signée d'une photo vaut une heure : on la renouvelle avant qu'elle n'expire,
// pour qu'un onglet resté ouvert n'affiche pas une image cassée.
const REFRESH_MS = 50 * 60 * 1000

// État partagé (navbar, page de profil) : une seule lecture de la photo de la
// personne connectée, suivie à chaque changement de compte.
const ppPath = ref<string | null>(null)
const ppUrl = ref<string>()

const { user } = useAuth()
let timer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

async function show(path: string | null) {
  const current = ++requestId
  clearTimeout(timer)
  ppPath.value = path
  if (!path) {
    ppUrl.value = undefined
    return
  }
  const url = await profilHandler.getPpUrl(path)
  if (current !== requestId) return
  ppUrl.value = url
  timer = setTimeout(() => {
    show(path).catch((error) => console.error('[useProfilePicture] renouvellement de l’URL impossible', error))
  }, REFRESH_MS)
}

// Une photo qui ne se charge pas ne doit gêner personne : on journalise et on
// retombe sur l'icône par défaut.
async function load(id: string | undefined) {
  requestId++
  clearTimeout(timer)
  ppPath.value = null
  ppUrl.value = undefined
  if (!id) return
  try {
    const path = await profilHandler.getPp(id)
    if (user.value?.id !== id) return
    await show(path)
  } catch (error) {
    console.error('[useProfilePicture] lecture de la photo impossible', error)
  }
}

watch(() => user.value?.id, load, { immediate: true })

export function useProfilePicture() {
  return {
    // Chemin dans le bucket, et URL signée pour l'afficher (undefined sans photo).
    ppPath,
    ppUrl,
    // À appeler après un nouvel envoi : met à jour la photo partout.
    setPp: show,
  }
}
