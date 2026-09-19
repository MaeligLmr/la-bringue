import { ref } from 'vue'

export type AuthView = 'login' | 'signup'

const isOpen = ref(false)
const activeView = ref<AuthView>('login')

function open(view: AuthView) {
  activeView.value = view
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function switchTo(view: AuthView) {
  activeView.value = view
}

export function useAuthModal() {
  return { isOpen, activeView, open, close, switchTo }
}
