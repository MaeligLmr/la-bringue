import { ref } from 'vue'
import type { LikeTarget } from '../types/ui/like'

export type AuthView = 'login' | 'signup'

const isOpen = ref(false)
const activeView = ref<AuthView>('login')
const pendingLike = ref<LikeTarget | null>(null)

function open(view: AuthView, likeTarget?: LikeTarget) {
  activeView.value = view
  pendingLike.value = likeTarget ?? null
  isOpen.value = true
}

function close() {
  isOpen.value = false
  pendingLike.value = null
}

function complete() {
  isOpen.value = false
}

function switchTo(view: AuthView) {
  activeView.value = view
}

export function useAuthModal() {
  return { isOpen, activeView, pendingLike, open, close, complete, switchTo }
}
