<script setup lang="ts">
import Icon from '../Icon/Icon.vue'

withDefaults(defineProps<{ placeholder?: string }>(), { placeholder: 'Rechercher par nom' })

const search = defineModel<string>({ default: '' })
</script>

<template>
  <label class="search-bar">
    <Icon name="search" size="small" />
    <input v-model="search" type="search" class="search-bar__input" :placeholder="placeholder" :aria-label="placeholder" />
    <button v-if="search" type="button" class="search-bar__clear" aria-label="Effacer la recherche" @click="search = ''">
      <Icon name="plus" size="small" />
    </button>
  </label>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--select-medium-gap);
  flex: 1 1 16rem;
  box-sizing: border-box;
  padding: var(--select-medium-padding-y) var(--select-medium-padding-x);
  border: 1px solid var(--select-trigger-border);
  border-radius: var(--radius-medium);
  color: var(--select-trigger-text);
}

.search-bar:focus-within {
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.search-bar__input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--select-medium-font-size);
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

/* Croix pour vider la recherche (celle, native, du champ est masquée). */
.search-bar__input::-webkit-search-cancel-button {
  display: none;
}

.search-bar__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  /* Icône « plus » tournée : c'est une croix. */
  transform: rotate(45deg);
}
</style>
