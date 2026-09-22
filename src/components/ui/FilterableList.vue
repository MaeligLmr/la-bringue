<script setup lang="ts" generic="T extends FilterableItem">
import { computed, ref } from 'vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import type { FilterConfig, FilterValues, FilterableItem } from '../../types/filterable-list'

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
      <li v-for="item in filteredItems" :key="item.id">
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

.filterable-list__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
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

.filterable-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) 0;
  text-align: center;
}
</style>
