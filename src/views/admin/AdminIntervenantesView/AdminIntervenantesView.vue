<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { byNom, useAdminList } from '../../../composables/useAdminList/useAdminList'
import { conferenciereHandler } from '../../../handlers/conferenciere'
import { participationHandler } from '../../../handlers/participation'
import type { Conferenciere } from '../../../types/database/conferenciere'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

const router = useRouter()

const COLUMNS: AdminTableColumn<Conferenciere>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'description', label: 'Description', format: (value) => (value ? String(value) : '—') },
]

const { items: intervenantes, loading, remove } = useAdminList({
  load: async () => byNom(await conferenciereHandler.getAll()),
  remove: (intervenante: Conferenciere) => conferenciereHandler.remove(intervenante.id_conferenciere),
  idOf: (intervenante) => intervenante.id_conferenciere,
  loadError: 'Impossible de charger les intervenantes.',
  removed: (intervenante) => `« ${intervenante.nom} » a été supprimée.`,
})

// Rappelé dans la modale : la suppression la retire aussi des conférences
// (Participation en cascade).
async function deleteImpact(intervenante: Conferenciere) {
  const conferences = await participationHandler.getConferencesByConferenciere(intervenante.id_conferenciere)
  return conferences.length
    ? [`Elle sera retirée de ${conferences.length} conférence${conferences.length > 1 ? 's' : ''}.`]
    : []
}
</script>

<template>
  <AdminPage title="Intervenantes">
    <AdminTable
      :items="intervenantes"
      :columns="COLUMNS"
      row-key="id_conferenciere"
      :loading="loading"
      :delete-impact="deleteImpact"
      @add="router.push({ name: 'admin-intervenante-nouvelle' })"
      @edit="(intervenante) => router.push({ name: 'admin-intervenante', params: { id: intervenante.id_conferenciere } })"
      @delete="remove"
    />
  </AdminPage>
</template>

