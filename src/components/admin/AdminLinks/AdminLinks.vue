<script setup lang="ts" generic="T extends LinkEntry">
import { computed, ref } from 'vue'
import Button from '../../ui/Button/Button.vue'
import Select from '../../ui/Select/Select.vue'
import type { LinkEntry } from '../../../lib/links/links'

const props = withDefaults(
  defineProps<{
    items: LinkEntry[]
    legend: string
    empty: string
    placeholder: string
    context: string
    hint?: string
    toEntry?: (item: LinkEntry) => T
  }>(),
  { toEntry: (item: LinkEntry) => ({ id: item.id, nom: item.nom }) as T }
)

const emit = defineEmits<{ added: [entry: T] }>()

const links = defineModel<T[]>({ required: true })

defineSlots<{
  entry?(props: { entry: T; update: (patch: Partial<T>) => void }): unknown
  'add-options'?(): unknown
}>()

const selected = ref('')

const choix = computed(() =>
  props.items
    .filter((item) => !links.value.some((entry) => entry.id === item.id))
    .map((item) => ({ value: String(item.id), label: item.nom }))
)

function add() {
  const item = props.items.find((other) => String(other.id) === selected.value)
  if (!item) return
  const entry = props.toEntry(item)
  links.value = [...links.value, entry]
  selected.value = ''
  emit('added', entry)
}

function update(entry: T, patch: Partial<T>) {
  links.value = links.value.map((item) => (item.id === entry.id ? { ...item, ...patch } : item))
}

function remove(entry: T) {
  links.value = links.value.filter((item) => item.id !== entry.id)
}
</script>

<template>
  <fieldset class="admin-links">
    <legend>{{ legend }}</legend>

    <p v-if="!links.length">{{ empty }}</p>

    <ul v-else class="admin-links__list">
      <li v-for="entry in links" :key="entry.id" class="admin-links__item">
        <span class="admin-links__nom">{{ entry.nom }}</span>
        <slot name="entry" :entry="entry" :update="(patch: Partial<T>) => update(entry, patch)" />
        <Button color="danger" variant="ghost" :aria-label="`Retirer ${entry.nom} ${context}`" @click="remove(entry)">
          Retirer
        </Button>
      </li>
    </ul>

    <div class="admin-links__add">
      <Select v-model="selected" :options="choix" :placeholder="placeholder" :aria-label="placeholder" />
      <slot name="add-options" />
      <Button variant="outlined" icon-left="plus" :disabled="!selected" @click="add">Ajouter</Button>
    </div>

    <p v-if="hint" class="admin-links__hint">{{ hint }}</p>
  </fieldset>
</template>

<style scoped>
.admin-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
}

.admin-links legend {
  margin-bottom: var(--space-1);
  padding: 0;
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
}

.admin-links p {
  margin: 0;
}

.admin-links__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
}

.admin-links__item,
.admin-links__add {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.admin-links__item {
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.admin-links__item:last-child {
  border-bottom: none;
}

.admin-links__nom {
  flex: 1 1 10rem;
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
}

.admin-links :slotted(label) {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-small);
}

.admin-links__hint {
  font-size: var(--font-size-small);
}
</style>
