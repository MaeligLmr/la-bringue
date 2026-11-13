import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const VIEWPORT_MARGIN = 8
const GAP = 4

interface FloatingPanelOptions {
  /** Élément auquel le panneau s'accroche (bouton, champ…). */
  anchor: Ref<HTMLElement | null>
  /** Le panneau lui-même, téléporté dans <body>. */
  panel: Ref<HTMLElement | null>
  isOpen: Ref<boolean>
  close: () => void
  /** Largeur minimale = largeur de l'ancre (menus déroulants). */
  matchWidth?: boolean
  maxHeight?: number
}

// Positionne en `fixed` un panneau téléporté dans <body> (donc jamais rogné par un
// overflow parent : modale, tableau admin…) : sous l'ancre, ou au-dessus quand il
// manque de place, avec une hauteur bornée à l'espace disponible. Gère aussi la
// fermeture au clic en dehors et le repositionnement au scroll / resize.
export function useFloatingPanel({ anchor, panel, isOpen, close, matchWidth = false, maxHeight = 320 }: FloatingPanelOptions) {
  const style = ref<Record<string, string>>({})

  function updatePosition() {
    const rect = anchor.value?.getBoundingClientRect()
    if (!rect) return
    const below = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN
    const above = rect.top - GAP - VIEWPORT_MARGIN
    // S'ouvre vers le haut seulement s'il y a nettement plus de place qu'en dessous.
    const openUp = below < Math.min(maxHeight, 160) && above > below
    const available = Math.max(80, Math.min(maxHeight, openUp ? above : below))
    // Reste dans la fenêtre horizontalement (panneau plus large que l'ancre).
    const width = panel.value?.offsetWidth ?? 0
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN))
    style.value = {
      ...(openUp ? { bottom: `${window.innerHeight - rect.top + GAP}px` } : { top: `${rect.bottom + GAP}px` }),
      left: `${left}px`,
      ...(matchWidth ? { minWidth: `${rect.width}px` } : {}),
      maxWidth: `calc(100vw - ${2 * VIEWPORT_MARGIN}px)`,
      maxHeight: `${available}px`,
    }
  }

  function onClickOutside(event: MouseEvent) {
    const target = event.target as Node
    if (anchor.value?.contains(target) || panel.value?.contains(target)) return
    close()
  }

  function onViewportChange() {
    if (isOpen.value) updatePosition()
  }

  onMounted(() => {
    document.addEventListener('click', onClickOutside)
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', onClickOutside)
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('scroll', onViewportChange, true)
  })

  return { style, updatePosition }
}
