<script setup lang="ts" generic="T extends FilterableItem">
import { computed, ref } from 'vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import type { FilterConfig, FilterValues, FilterableItem } from '../../types/ui/filterable-list.ts'

const props = withDefaults(
  defineProps<{
    items: T[]
    filters?: FilterConfig[]
    searchPlaceholder?: string
  }>(),
  {
    filters: () => [],
    searchPlaceholder: 'Rechercher par nom',
  }
)

defineSlots<{ item(props: { item: T }): unknown }>()

const selected = defineModel<FilterValues>('selected', { default: () => ({}) })

const search = ref('')

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

const filteredItems = computed(() => {
  const query = normalize(search.value)
  return props.items.filter((item) => {
    if (query && !normalize(item.nom).includes(query)) return false
    return props.filters.every(({ key }) => {
      const value = selected.value[key]
      return !value || String((item as Record<string, unknown>)[key]) === value
    })
  })
})

const hasActiveCriteria = computed(
  () => search.value.trim() !== '' || Object.values(selected.value).some(Boolean)
)

function setFilter(key: string, value: string) {
  selected.value = { ...selected.value, [key]: value }
}

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
      <label class="filterable-list__search">
        <Icon name="search" size="small" />
        <input
          v-model="search"
          type="search"
          class="filterable-list__search-input"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
        />
      </label>

      <Button
        v-if="hasActiveCriteria"
        color="secondary"
        variant="ghost"
        class="filterable-list__reset"
        @click="reset"
      >
        Réinitialiser les filtres
      </Button>
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
      {{ filteredItems.length }} résultat{{ filteredItems.length > 1 ? 's' : '' }}
    </p>

    <ul v-if="filteredItems.length" class="filterable-list__items">
      <li class="filterable-list__item" v-for="item in filteredItems" :key="item.id">
        <slot name="item" :item="item" />
      </li>
    </ul>

    <div v-else class="filterable-list__empty">
      <p>Aucun résultat ne correspond à ta recherche.</p>
      <Button color="primary" variant="outlined" @click="reset">Réinitialiser les filtres</Button>
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

.filterable-list__search {
  display: flex;
  align-items: center;
  gap: var(--button-medium-with-text-gap);
  flex: 1 1 auto;
  box-sizing: border-box;
  padding: var(--button-medium-with-text-padding-y) var(--button-medium-with-text-padding-x);
  border: 1px solid var(--select-trigger-border);
  border-radius: var(--radius-medium);
  color: var(--select-trigger-text);
}

.filterable-list__search:focus-within {
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.filterable-list__search-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--font-size-button-medium);
  font-weight: var(--font-weight-medium);
  line-height: 1;
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

.filterable-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) 0;
  text-align: center;
}
</style>
