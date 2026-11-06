import { onBeforeUnmount, watch, type Ref } from 'vue'

// Distance avant le bas de la liste à laquelle on charge déjà la suite : elle
// arrive avant que le doigt n'atteigne le bout.
const ROOT_MARGIN = '300px'

interface Options {
  // Élément sentinelle placé sous la liste.
  target: Ref<HTMLElement | null>
  onLoadMore: () => void
  // Pas de chargement tant que c'est vrai (déjà en cours, plus rien à charger,
  // erreur à acquitter).
  disabled: Ref<boolean>
}

// Appelle onLoadMore quand la sentinelle entre (ou approche) dans l'écran.
// L'observateur est recréé à chaque réactivation : si la sentinelle est encore
// visible après une page (page courte, grand écran), il rappelle aussitôt au
// lieu d'attendre un défilement qui n'aura pas lieu.
export function useInfiniteScroll({ target, onLoadMore, disabled }: Options) {
  // Sans IntersectionObserver (vieux navigateur), la liste propose un bouton
  // « Voir plus » à la place (voir FilterableList).
  const supported = typeof IntersectionObserver !== 'undefined'
  let observer: IntersectionObserver | null = null

  function stop() {
    observer?.disconnect()
    observer = null
  }

  watch(
    [target, disabled],
    ([element, off]) => {
      stop()
      if (!supported || !element || off) return
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
        },
        { rootMargin: ROOT_MARGIN }
      )
      observer.observe(element)
    },
    { immediate: true, flush: 'post' }
  )

  onBeforeUnmount(stop)

  return { supported }
}
