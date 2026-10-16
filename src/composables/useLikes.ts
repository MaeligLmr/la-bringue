import { reactive } from 'vue'
import { toast } from 'vue-sonner'
import type { LikeTarget } from '../types/ui/like'

export const LIKE_ADDED_MESSAGE = 'Ajouté à Mon programme'

// État partagé entre tous les cœurs de l'app. La persistance en base viendra
// plus tard : pour l'instant les likes ne vivent que le temps de la session.
const likedKeys = reactive(new Set<string>())

function keyOf(target: LikeTarget) {
  return `${target.type}-${target.id}`
}

function isLiked(target: LikeTarget) {
  return likedKeys.has(keyOf(target))
}

function setLiked(target: LikeTarget, liked: boolean) {
  if (liked) likedKeys.add(keyOf(target))
  else likedKeys.delete(keyOf(target))
}

function addLike(target: LikeTarget) {
  setLiked(target, true)
  toast.success(LIKE_ADDED_MESSAGE)
}

export function useLikes() {
  return { isLiked, setLiked, addLike }
}
