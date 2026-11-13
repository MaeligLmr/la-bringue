<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { byNom, useAdminList } from '../../../composables/useAdminList/useAdminList'
import { exposantHandler } from '../../../handlers/exposant'
import type { Exposant } from '../../../types/database/exposant'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

const router = useRouter()

const COLUMNS: AdminTableColumn<Exposant>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'categorie', label: 'Catégorie', format: (value) => (value ? String(value) : '—') },
]

const { items: exposants, loading, remove } = useAdminList({
  load: async () => byNom(await exposantHandler.getAll()),
  remove: (exposant: Exposant) => exposantHandler.remove(exposant.id_exposant),
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
      :loading="loading"
      @add="router.push({ name: 'admin-exposant-nouveau' })"
      @edit="(exposant) => router.push({ name: 'admin-exposant', params: { id: exposant.id_exposant } })"
      @delete="remove"
    />
  </AdminPage>
</template>
