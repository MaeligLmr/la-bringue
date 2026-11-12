<script setup lang="ts" generic="T extends object">
import { computed, ref, shallowRef } from 'vue'
import Modal from '../../layout/Modal/Modal.vue'
import Button from '../../ui/Button/Button.vue'
import Icon from '../../ui/Icon/Icon.vue'
import Loader from '../../ui/Loader/Loader.vue'
import { fold } from '../../../lib/highlight/highlight'
import type { AdminTableColumn } from '../../../types/ui/admin-table.ts'

const props = withDefaults(
  defineProps<{
    items: T[]
    columns: AdminTableColumn<T>[]
    rowKey: keyof T & string
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const emit = defineEmits<{
  add: []
  edit: [item: T]
  delete: [item: T]
}>()

const search = ref('')

function nameOf(item: T) {
  return String((item as Record<string, unknown>).nom ?? '')
}

const filteredItems = computed(() => {
  const query = fold(search.value.trim())
  if (!query) return props.items
  return props.items.filter((item) => fold(nameOf(item)).includes(query))
})

const pendingDelete = shallowRef<T | null>(null)

function askDelete(item: T) {
  pendingDelete.value = item
}

function cancelDelete() {
  pendingDelete.value = null
}

function confirmDelete() {
  if (pendingDelete.value) emit('delete', pendingDelete.value)
  pendingDelete.value = null
}

function cellValue(column: AdminTableColumn<T>, item: T) {
  const value = item[column.key]
  if (column.format) return column.format(value, item)
  return String(value ?? '')
}
</script>

<template>
  <section class="admin-table">
    <div class="admin-table__toolbar">
      <label class="admin-table__search">
        <Icon name="search" size="small" />
        <input
          v-model="search"
          type="search"
          class="admin-table__search-input"
          placeholder="Rechercher par nom"
          aria-label="Rechercher par nom"
        />
      </label>

      <Button @click="emit('add')">Ajouter</Button>
    </div>

    <Loader v-if="loading" />

    <p v-else-if="!filteredItems.length" class="admin-table__empty">Aucun résultat.</p>

    <table v-else class="admin-table__table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col">{{ column.label }}</th>
          <th scope="col" class="admin-table__actions-head">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredItems" :key="String(item[rowKey])">
          <td v-for="column in columns" :key="column.key">{{ cellValue(column, item) }}</td>
          <td class="admin-table__actions">
            <Button color="secondary" variant="ghost" @click="emit('edit', item)">Modifier</Button>
            <Button color="danger" variant="ghost" @click="askDelete(item)">Supprimer</Button>
          </td>
        </tr>
      </tbody>
    </table>

    <Modal :open="pendingDelete !== null" title="Confirmer la suppression" @close="cancelDelete">
      <p v-if="pendingDelete" class="admin-table__confirm-text">
        Supprimer « {{ nameOf(pendingDelete) }} » ? Cette action est définitive.
      </p>
      <div class="admin-table__confirm-actions">
        <Button color="secondary" variant="outlined" @click="cancelDelete">Annuler</Button>
        <Button color="danger" @click="confirmDelete">Supprimer</Button>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
.admin-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.admin-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.admin-table__search {
  display: flex;
  align-items: center;
  gap: var(--button-medium-with-text-gap);
  flex: 1 1 16rem;
  box-sizing: border-box;
  padding: var(--button-medium-with-text-padding-y) var(--button-medium-with-text-padding-x);
  border: 1px solid var(--select-trigger-border);
  border-radius: var(--radius-medium);
  color: var(--select-trigger-text);
}

.admin-table__search:focus-within {
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.admin-table__search-input {
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

.admin-table__table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table__table th,
.admin-table__table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.admin-table__table th {
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
}

.admin-table__actions-head {
  text-align: right;
}

.admin-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.admin-table__confirm-text {
  margin: 0 0 var(--space-6);
}

.admin-table__confirm-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.admin-table__empty {
  margin: 0;
  padding: var(--space-8) 0;
  text-align: center;
}
</style>
