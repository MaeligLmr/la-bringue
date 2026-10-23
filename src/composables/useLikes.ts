import { reactive, readonly, ref } from 'vue'
import { toast } from 'vue-sonner'
import { likeHandler } from '../handlers/like'
import type { LikeTarget } from '../types/ui/like'

export const LIKE_ADDED_MESSAGE = 'Ajouté à Mon programme'
export const LIKE_SAVE_ERROR_MESSAGE = "Ton like n'a pas pu être enregistré, réessaie."
export const LIKES_LOAD_ERROR_MESSAGE = "Tes likes n'ont pas pu être chargés."

// État partagé entre tous les cœurs de l'app, synchronisé avec la table Like.
const likedKeys = reactive(new Set<string>())

// Dernière demande en cours d'écriture pour chaque contenu : un chargement qui
// arrive pendant l'écriture ne doit pas écraser le clic de l'utilisatrice.
const pendingWrites = new Map<string, { liked: boolean }>()

// Les écritures d'un même contenu partent l'une après l'autre, pour que le
// dernier clic soit aussi le dernier état enregistré en base.
const writeQueues = new Map<string, Promise<unknown>>()

const likesReady = ref(false)

// Incrémenté à chaque chargement ou déconnexion : une réponse périmée est ignorée.
let loadId = 0

function keyOf(target: LikeTarget) {
  return `${target.type}-${target.id}`
}

function applyLocal(key: string, liked: boolean) {
  if (liked) likedKeys.add(key)
  else likedKeys.delete(key)
}

function isLiked(target: LikeTarget) {
  return likedKeys.has(keyOf(target))
}

// Met à jour l'affichage tout de suite, puis enregistre en base. En cas
// d'échec, on revient à l'état précédent si aucun clic plus récent n'a eu lieu.
async function setLiked(target: LikeTarget, liked: boolean) {
  const key = keyOf(target)
  const request = { liked }
  applyLocal(key, liked)
  pendingWrites.set(key, request)

  const write = (writeQueues.get(key) ?? Promise.resolve()).then(() => likeHandler.setLike(target, liked))
  writeQueues.set(key, write.catch(() => {}))

  try {
    await write
  } catch (error) {
    console.error(error)
    if (pendingWrites.get(key) === request) {
      applyLocal(key, !liked)
      toast.error(LIKE_SAVE_ERROR_MESSAGE)
    }
  } finally {
    if (pendingWrites.get(key) === request) pendingWrites.delete(key)
  }
}

function addLike(target: LikeTarget) {
  toast.success(LIKE_ADDED_MESSAGE)
  return setLiked(target, true)
}

// Remplace l'état local par les likes enregistrés en base pour l'utilisatrice connectée.
async function loadLikes() {
  const id = ++loadId
  try {
    const targets = await likeHandler.getMine()
    if (id !== loadId) return
    likedKeys.clear()
    for (const target of targets) likedKeys.add(keyOf(target))
    for (const [key, request] of pendingWrites) applyLocal(key, request.liked)
  } catch (error) {
    console.error(error)
    if (id === loadId) toast.error(LIKES_LOAD_ERROR_MESSAGE)
  } finally {
    if (id === loadId) likesReady.value = true
  }
}

function clearLikes() {
  loadId++
  likedKeys.clear()
  likesReady.value = false
}

export function useLikes() {
  return { isLiked, setLiked, addLike, loadLikes, clearLikes, likesReady: readonly(likesReady) }
}
