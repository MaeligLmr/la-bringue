import { onBeforeUnmount, onMounted } from 'vue'

// Sélection par défaut : les cartes (programmation, exposants, conférences,
// actualités), les tuiles de carrousel et les formules de billetterie.
const DEFAULT_SELECTOR = '.content-card, .carousel-tile, .formule'

// Écart entre deux éléments qui apparaissent en même temps (même passage de
// l'observateur) : ils arrivent l'un après l'autre. Les tuiles de carrousel
// prennent leur temps pour s'afficher vraiment une par une.
const STAGGER_SECONDS = 0.12
const CAROUSEL_STAGGER_SECONDS = 0.3
const MAX_DELAY_SECONDS = 1.2

/**
 * Apparition au défilement : chaque carte ou tuile trouvée dans <main> arrive en
 * fondu en glissant vers le haut quand elle entre à l'écran (voir `.reveal` dans
 * style.css). Les éléments ajoutés après le montage (liste chargée, filtre
 * changé) sont pris en compte. Le hero, la navbar et le footer sont exclus.
 *
 * La classe « reveal » n'est posée que côté navigateur : sans IntersectionObserver
 * ou avec « réduire les animations », tout reste visible tel quel.
 */
export function useScrollReveal(selector: string = DEFAULT_SELECTOR) {
  let intersection: IntersectionObserver | null = null
  let mutation: MutationObserver | null = null

  function register(el: HTMLElement) {
    if (el.classList.contains('reveal') || el.closest('.hero')) return
    el.classList.add('reveal')
    intersection?.observe(el)
  }

  function scan(root: ParentNode) {
    if (root instanceof HTMLElement && root.matches(selector)) register(root)
    root.querySelectorAll<HTMLElement>(selector).forEach(register)
  }

  onMounted(() => {
    const main = document.querySelector('main')
    const canAnimate =
      !!main &&
      typeof IntersectionObserver !== 'undefined' &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!canAnimate || !main) return

    intersection = new IntersectionObserver(
      (entries) => {
        // Dans l'ordre de la page, chacun avec un retard croissant : le délai
        // se calcule à l'apparition (et non au montage), donc un élément qui
        // arrive plus tard au défilement n'attend pas inutilement.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        visible.forEach((el, rank) => {
          const step = el.matches('.carousel-tile') ? CAROUSEL_STAGGER_SECONDS : STAGGER_SECONDS
          el.style.setProperty('--reveal-delay', `${Math.min(rank * step, MAX_DELAY_SECONDS)}s`)
          el.classList.add('reveal--visible')
          intersection?.unobserve(el)
        })
      },
      { threshold: 0.15 }
    )

    scan(main)

    mutation = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scan(node)
        })
      }
    })
    mutation.observe(main, { childList: true, subtree: true })
  })

  onBeforeUnmount(() => {
    intersection?.disconnect()
    mutation?.disconnect()
  })
}
