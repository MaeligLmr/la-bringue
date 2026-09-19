import { watch, type Ref } from 'vue'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

/**
 * Piège le focus clavier (Tab / Shift+Tab) à l'intérieur de `containerRef`
 * tant que `isActive` est vrai, et restitue le focus à l'élément qui
 * l'avait avant l'activation.
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, isActive: Ref<boolean>) {
  let previouslyFocused: HTMLElement | null = null

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return

    const container = containerRef.value
    if (!container) return

    const focusable = getFocusableElements(container)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const current = document.activeElement

    if (event.shiftKey) {
      if (current === first || !container.contains(current)) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (current === last || !container.contains(current)) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  watch(isActive, (active) => {
    if (active) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  })
}
