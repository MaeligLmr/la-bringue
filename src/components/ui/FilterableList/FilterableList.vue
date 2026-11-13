<script setup lang="ts" generic="T extends FilterableItem">
import { computed, ref } from 'vue'
import Button from '../Button/Button.vue'
import Loader from '../Loader/Loader.vue'
import SearchBar from '../SearchBar/SearchBar.vue'
import { useInfiniteScroll } from '../../../composables/useInfiniteScroll/useInfiniteScroll'
import { provideListSearch } from '../../../composables/useListSearch/useListSearch'
import type { FilterConfig, FilterValues, FilterableItem } from '../../../types/ui/filterable-list.ts'

const props = withDefaults(
  defineProps<{
    // Déjà filtrés côté serveur : la liste ne filtre rien elle-même. Le parent relit
    // la recherche et les filtres via v-model:search / v-model:selected.
    items: T[]
    filters?: FilterConfig[]
    searchPlaceholder?: string
    // Reste-t-il des éléments à charger ? Le défilement émet alors `load-more`.
    hasMore?: boolean
    // Un chargement (première page ou suivante) est en cours.
    loading?: boolean
    // Le dernier chargement a échoué : « Réessayer » émet `load-more`.
    failed?: boolean
  }>(),
  {
    filters: () => [],
    searchPlaceholder: 'Rechercher par nom',
    hasMore: false,
    loading: false,
    failed: false,
  }
)

const emit = defineEmits<{ 'load-more': [] }>()

defineSlots<{ item(props: { item: T }): unknown }>()

const selected = defineModel<FilterValues>('selected', { default: () => ({}) })

const search = defineModel<string>('search', { default: '' })
// Les ContentCard de la liste surlignent cette recherche dans leur nom.
provideListSearch(search)

function setFilter(key: string, value: string) {
  selected.value = { ...selected.value, [key]: value }
}

// Sentinelle sous la liste : la voir arriver charge la page suivante.
const sentinel = ref<HTMLElement | null>(null)
const { supported: canObserve } = useInfiniteScroll({
  target: sentinel,
  onLoadMore: () => emit('load-more'),
  disabled: computed(() => !props.hasMore || props.loading || props.failed),
})

function reset() {
  search.value = ''
  selected.value = {}
}

// Défilement des rangées de filtres à la souris (le doigt et le trackpad
// défilent nativement) : la molette verticale fait défiler horizontalement
// tant que la rangée peut encore avancer — arrivée au bout, c'est la page
// qui défile — et on peut aussi la faire glisser en cliquant-tirant.
function onFilterWheel(event: WheelEvent) {
  const row = event.currentTarget as HTMLElement
  if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
  const max = row.scrollWidth - row.clientWidth
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY
  if (max <= 0 || (delta < 0 && row.scrollLeft <= 0) || (delta > 0 && row.scrollLeft >= max - 1)) return
  event.preventDefault()
  row.scrollLeft += delta
}

// Au-delà de ce déplacement (px), le clic devient un glissement et ne
// sélectionne pas le filtre sous le curseur.
const DRAG_THRESHOLD = 5
let drag: { row: HTMLElement; startX: number; startScroll: number; moved: boolean } | null = null

function onFilterPointerDown(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0) return
  const row = event.currentTarget as HTMLElement
  drag = { row, startX: event.clientX, startScroll: row.scrollLeft, moved: false }
}

function onFilterPointerMove(event: PointerEvent) {
  if (!drag) return
  const dx = event.clientX - drag.startX
  if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD) return
  if (!drag.moved) {
    drag.moved = true
    // Capturé seulement une fois le glissement lancé (sinon le clic
    // n'atteindrait plus le bouton) : le glissement continue hors de la rangée.
    drag.row.setPointerCapture(event.pointerId)
  }
  drag.row.scrollLeft = drag.startScroll - dx
}

function onFilterPointerUp() {
  // Remis à zéro après le clic qui suit le relâchement (voir onFilterClick).
  setTimeout(() => (drag = null))
}

function onFilterClick(event: MouseEvent) {
  if (drag?.moved) event.stopPropagation()
}
</script>

<template>
  <section class="filterable-list">
    <div class="filterable-list__toolbar">
      <SearchBar v-model="search" :placeholder="searchPlaceholder" />
    </div>

    <div
      v-for="filter in filters"
      :key="filter.key"
      class="filterable-list__filter"
      role="group"
      :aria-label="filter.label"
      @wheel="onFilterWheel"
      @pointerdown="onFilterPointerDown"
      @pointermove="onFilterPointerMove"
      @pointerup="onFilterPointerUp"
      @pointercancel="onFilterPointerUp"
      @click.capture="onFilterClick"
    >
      <Button
        :color="!selected[filter.key] ? 'primary' : 'secondary'"
        :aria-pressed="!selected[filter.key]"
        @click="setFilter(filter.key, '')"
      >
        {{ filter.allLabel }}
      </Button>
      <Button
        v-for="option in filter.options"
        :key="option.value"
        :color="selected[filter.key] === option.value ? 'primary' : 'secondary'"
        :aria-pressed="selected[filter.key] === option.value"
        @click="setFilter(filter.key, option.value)"
      >
        {{ option.label }}
      </Button>
    </div>

    <p class="filterable-list__count" aria-live="polite">
      <template v-if="!loading || items.length">
        {{ items.length }}{{ hasMore ? '+' : '' }} résultat{{ items.length > 1 ? 's' : '' }}
      </template>
    </p>

    <ul v-if="items.length" class="filterable-list__items">
      <li class="filterable-list__item" v-for="item in items" :key="item.id">
        <slot name="item" :item="item" />
      </li>
    </ul>

    <div v-else-if="!loading && !failed" class="filterable-list__empty">
      <p>Aucun résultat ne correspond à ta recherche.</p>
      <Button color="primary" variant="outlined" @click="reset">Réinitialiser les filtres</Button>
    </div>

    <Loader v-if="loading" />

    <div v-else-if="failed" class="filterable-list__empty" role="alert">
      <p>Impossible de charger la suite.</p>
      <Button color="primary" variant="outlined" @click="emit('load-more')">Réessayer</Button>
    </div>

    <div v-else-if="hasMore" ref="sentinel" class="filterable-list__more">
      <!-- Sans IntersectionObserver, le défilement ne peut rien déclencher. -->
      <Button v-if="!canObserve" color="primary" variant="outlined" @click="emit('load-more')">Voir plus</Button>
    </div>
  </section>
</template>

<style scoped>
.filterable-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.filterable-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

/* Une ligne qui défile horizontalement, fondue sur le bord droit, plutôt
   qu'un retour à la ligne — sur tous les écrans, pour que les filtres en
   bout de ligne restent atteignables sur un petit écran desktop. */
.filterable-list__filter {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.625rem;
  overflow-x: auto;
  scrollbar-width: thin;
  /* Laisse la place à l'anneau de focus et permet au dernier bouton de
     sortir de la zone fondue en fin de défilement. */
  padding: var(--space-1) var(--space-8) var(--space-1) var(--space-1);
  margin: calc(-1 * var(--space-1));
  mask-image: linear-gradient(to right, #000 calc(100% - var(--space-10)), transparent);
}

.filterable-list__filter > * {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Phone : défilement au doigt, la barre de défilement est superflue. Sur
   desktop elle reste visible (fine) : c'est le seul moyen de défiler à la
   souris sans trackpad. */
@media (max-width: 639px) {
  .filterable-list__filter {
    scrollbar-width: none;
  }

  .filterable-list__filter::-webkit-scrollbar {
    display: none;
  }
}

.filterable-list__count {
  font-size: var(--font-size-small);
}

.filterable-list__items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.filterable-list__item {
  display: flex;
  justify-content: center;
}

.filterable-list__more {
  display: flex;
  justify-content: center;
  /* Hauteur non nulle : une sentinelle vide ne serait jamais « visible ». */
  min-height: 1px;
}

.filterable-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) 0;
  text-align: center;
}
</style>
