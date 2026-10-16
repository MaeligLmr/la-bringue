import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { MIN_QUERY_LENGTH } from '../lib/highlight'

// Recherche « type Ctrl+F » dans une zone de la page : état de la saisie,
// nombre d'occurrences, occurrence active et navigation entre elles.
//
// Fonctionnement : `query` est passée aux <HighlightedText> de la zone, qui
// entourent chaque occurrence d'un <mark class="highlighted-text__match">
// (voir lib/highlight.ts). Ce composable ne recalcule rien du texte : il lit
// le DOM de `container` pour compter les <mark>, mettre en avant l'un d'eux et
// défiler jusqu'à lui. `container` ne doit donc contenir que les textes à
// parcourir (pas le champ de recherche ni le menu).
export function useTextSearch(container: Ref<HTMLElement | null>) {
  const query = ref('')
  const matchCount = ref(0)
  // Rang (à partir de 1) de l'occurrence mise en avant ; 0 s'il n'y en a pas.
  const currentMatch = ref(0)

  // Vrai quand la saisie est assez longue pour surligner (voir MIN_QUERY_LENGTH) :
  // c'est alors qu'on affiche le compteur.
  const isSearching = computed(() => query.value.trim().length >= MIN_QUERY_LENGTH)

  // Tous les <mark> de la zone, dans l'ordre de lecture de la page.
  function matchElements() {
    return Array.from(container.value?.querySelectorAll<HTMLElement>('.highlighted-text__match') ?? [])
  }

  // Pose la classe « actif » sur l'occurrence `currentMatch` (et la retire des
  // autres), puis la centre à l'écran. Classe gérée à la main plutôt que par
  // Vue : les <mark> viennent d'un composant enfant et leur nombre n'est connu
  // qu'après coup.
  function showCurrentMatch() {
    const matches = matchElements()
    matches.forEach((el, index) =>
      el.classList.toggle('highlighted-text__match--current', index === currentMatch.value - 1)
    )
    matches[currentMatch.value - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // À chaque frappe, Vue re-rend les textes avec les nouveaux <mark> : on
  // attend que le DOM soit à jour (nextTick) avant de les compter, puis on
  // repart du premier résultat. Les <mark> recréés ayant perdu la classe
  // « actif », elle est reposée ici.
  watch(query, async () => {
    await nextTick()
    matchCount.value = matchElements().length
    currentMatch.value = matchCount.value ? 1 : 0
    showCurrentMatch()
  })

  // Passe au résultat suivant (+1) ou précédent (-1), en bouclant : après le
  // dernier on revient au premier, et inversement.
  function stepMatch(delta: 1 | -1) {
    if (!matchCount.value) return
    currentMatch.value = ((currentMatch.value - 1 + delta + matchCount.value) % matchCount.value) + 1
    showCurrentMatch()
  }

  function clearSearch() {
    query.value = ''
  }

  return { query, matchCount, currentMatch, isSearching, stepMatch, clearSearch }
}
