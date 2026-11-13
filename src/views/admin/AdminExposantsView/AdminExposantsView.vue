<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { useAdminList } from '../../../composables/useAdminList/useAdminList'
import { ADMIN_PAGE_SIZE } from '../../../handlers/crud'
import { exposantHandler, type ExposantResume } from '../../../handlers/exposant'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

const router = useRouter()

const COLUMNS: AdminTableColumn<ExposantResume>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'categorie', label: 'Catégorie', format: (value) => (value ? String(value) : '—') },
]

const { items: exposants, search, hasMore, loading, failed, loadMore, remove } = useAdminList({
  fetchPage: (offset, search) => exposantHandler.getPage({ offset, search, pageSize: ADMIN_PAGE_SIZE }),
  remove: (exposant: ExposantResume) => exposantHandler.remove(exposant.id_exposant),
  idOf: (exposant) => exposant.id_exposant,
  loadError: 'Impossible de charger les exposants.',
  removed: (exposant) => `« ${exposant.nom} » a été supprimé.`,
})
</script>

<template>
  <AdminPage title="Exposants">
    <AdminTable
      :items="exposants"
      :columns="COLUMNS"
      row-key="id_exposant"
      v-model:search="search"
      :loading="loading"
      :has-more="hasMore"
      :failed="failed"
      @add="router.push({ name: 'admin-exposant-nouveau' })"
      @edit="(exposant) => router.push({ name: 'admin-exposant', params: { id: exposant.id_exposant } })"
      @load-more="loadMore"
      @delete="remove"
    />
  </AdminPage>
</template>
