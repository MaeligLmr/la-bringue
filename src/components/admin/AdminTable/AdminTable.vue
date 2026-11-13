<script setup lang="ts" generic="T extends object">
import { computed, ref, shallowRef } from 'vue'
import Modal from '../../layout/Modal/Modal.vue'
import Button from '../../ui/Button/Button.vue'
import Loader from '../../ui/Loader/Loader.vue'
import SearchBar from '../../ui/SearchBar/SearchBar.vue'
import { fold } from '../../../lib/highlight/highlight'
import type { AdminTableColumn } from '../../../types/ui/admin-table.ts'

const props = withDefaults(
  defineProps<{
    items: T[]
    columns: AdminTableColumn<T>[]
    rowKey: keyof T & string
    loading?: boolean
    deleteImpact?: (item: T) => Promise<string[]>
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

const impact = ref<string[]>([])
const impactLoading = ref(false)
const impactFailed = ref(false)

async function askDelete(item: T) {
  pendingDelete.value = item
  impact.value = []
  impactFailed.value = false
  if (!props.deleteImpact) return

  impactLoading.value = true
  try {
    const lines = await props.deleteImpact(item)
    if (pendingDelete.value === item) impact.value = lines
  } catch {
    if (pendingDelete.value === item) impactFailed.value = true
  } finally {
    if (pendingDelete.value === item) impactLoading.value = false
  }
}

function cancelDelete() {
  pendingDelete.value = null
  impactLoading.value = false
}

function confirmDelete() {
  if (pendingDelete.value) emit('delete', pendingDelete.value)
  cancelDelete()
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
      <SearchBar v-model="search" />

      <Button icon-left="plus" @click="emit('add')">Ajouter</Button>
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
          <td>
            <div class="admin-table__actions">
              <Button color="secondary" variant="ghost" icon-left="edit" @click="emit('edit', item)">Modifier</Button>
              <Button color="danger" variant="ghost" icon-left="trash" @click="askDelete(item)">Supprimer</Button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <Modal :open="pendingDelete !== null" title="Confirmer la suppression" @close="cancelDelete">
      <p v-if="pendingDelete" class="admin-table__confirm-text">
        Supprimer « {{ nameOf(pendingDelete) }} » ? Cette action est définitive.
      </p>
      <p v-if="impactLoading" class="admin-table__impact" aria-live="polite">Calcul de l'impact…</p>
      <p v-else-if="impactFailed" class="admin-table__impact">Impossible de calculer l'impact de la suppression.</p>
      <ul v-else-if="impact.length" class="admin-table__impact">
        <li v-for="line in impact" :key="line">{{ line }}</li>
      </ul>
      <div class="admin-table__confirm-actions">
        <Button color="secondary" variant="outlined" @click="cancelDelete">Annuler</Button>
        <Button color="danger" icon-left="trash" @click="confirmDelete">Supprimer</Button>
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

.admin-table__impact {
  margin: 0 0 var(--space-6);
  color: var(--alert-danger-text);
}

ul.admin-table__impact {
  padding-left: var(--space-5);
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
