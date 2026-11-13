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

    <!-- Liste et ligne d'ajout partagent le même cadre et les mêmes colonnes
         (nom / sélecteur · options · bouton) pour rester alignées. -->
    <div class="admin-links__box">
      <p v-if="!links.length" class="admin-links__empty">{{ empty }}</p>

      <ul v-else class="admin-links__list">
        <li v-for="entry in links" :key="entry.id" class="admin-links__row">
          <span class="admin-links__main admin-links__nom">{{ entry.nom }}</span>
          <slot name="entry" :entry="entry" :update="(patch: Partial<T>) => update(entry, patch)" />
          <Button
            class="admin-links__action"
            color="danger"
            variant="ghost"
            icon-left="close"
            :aria-label="`Retirer ${entry.nom} ${context}`"
            @click="remove(entry)"
          >
            Retirer
          </Button>
        </li>
      </ul>

      <div class="admin-links__row admin-links__add">
        <div class="admin-links__main">
          <Select v-model="selected" :options="choix" :placeholder="placeholder" :aria-label="placeholder" />
        </div>
        <slot name="add-options" />
        <Button class="admin-links__action" variant="outlined" icon-left="plus" :disabled="!selected" @click="add">
          Ajouter
        </Button>
      </div>
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

.admin-links__box {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
}

.admin-links__empty {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.admin-links__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.admin-links__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
}

.admin-links__list .admin-links__row {
  border-bottom: 1px solid var(--border);
}

/* Colonne de gauche : nom d'un côté, sélecteur de l'autre. */
.admin-links__main {
  flex: 1 1 10rem;
  min-width: 0;
}

.admin-links__nom {
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
}

/* Même largeur pour Retirer et Ajouter : les options du milieu restent alignées. */
.admin-links__action {
  min-width: 8rem;
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
