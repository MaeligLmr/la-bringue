<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import Button from '../../../components/ui/Button/Button.vue'
import Tag from '../../../components/ui/Tag/Tag.vue'
import { useAdminList } from '../../../composables/useAdminList/useAdminList'
import { actualiteHandler } from '../../../handlers/actualite'
import { ADMIN_PAGE_SIZE } from '../../../handlers/crud'
import { formatDatePublication } from '../../../lib/cards/cards'
import { todayIso } from '../../../lib/date-picker/date-picker'
import { isPublished } from '../../../lib/publication/publication'
import type { Actualite } from '../../../types/database/actualite'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

// AdminTable cherche et nomme les lignes par `nom` : le titre de l'actualité y est recopié.
interface ActualiteRow {
  id_actualite: number
  nom: string
  date: string
  publiee: boolean
}

const router = useRouter()

const COLUMNS: AdminTableColumn<ActualiteRow>[] = [
  { key: 'nom', label: 'Titre' },
  { key: 'date', label: 'Publiée le', format: (value) => (value ? String(value) : '—') },
  { key: 'publiee', label: 'Statut' },
]

function toRow(actualite: Actualite): ActualiteRow {
  return {
    id_actualite: actualite.id_actualite,
    nom: actualite.titre ?? 'Sans titre',
    date: formatDatePublication(actualite.date_publication),
    publiee: isPublished(actualite.date_publication),
  }
}

const { items: actualites, search, hasMore, loading, failed, loadMore, remove } = useAdminList({
  // Le back-office voit aussi les actualités en attente.
  fetchPage: async (offset, search) => {
    const page = await actualiteHandler.getPage({ offset, search, pageSize: ADMIN_PAGE_SIZE, includeUnpublished: true })
    return { ...page, rows: page.rows.map(toRow) }
  },
  remove: (actualite: ActualiteRow) => actualiteHandler.remove(actualite.id_actualite),
  idOf: (actualite) => actualite.id_actualite,
  loadError: 'Impossible de charger les actualités.',
  removed: (actualite) => `« ${actualite.nom} » a été supprimée.`,
})

// Publier = dater l'actualité d'aujourd'hui : elle devient visible tout de suite.
async function publishNow(actualite: ActualiteRow) {
  try {
    const updated = await actualiteHandler.update(actualite.id_actualite, { date_publication: todayIso() })
    actualites.value = actualites.value.map((row) => (row.id_actualite === actualite.id_actualite ? toRow(updated) : row))
    toast.success(`« ${actualite.nom} » est publiée.`)
  } catch {
    toast.error('La publication a échoué. Réessaie plus tard.')
  }
}
</script>

<template>
  <AdminPage title="Actualités">
    <AdminTable
      :items="actualites"
      :columns="COLUMNS"
      row-key="id_actualite"
      v-model:search="search"
      :loading="loading"
      :has-more="hasMore"
      :failed="failed"
      @add="router.push({ name: 'admin-actualite-nouvelle' })"
      @edit="(actualite) => router.push({ name: 'admin-actualite', params: { id: actualite.id_actualite } })"
      @load-more="loadMore"
      @delete="remove"
    >
      <template #cell-publiee="{ item }">
        <Tag :label="item.publiee ? 'Publiée' : 'En attente'" :variant="item.publiee ? 'pink-bright' : 'violet'" />
      </template>

      <template #row-actions="{ item }">
        <Button v-if="!item.publiee" color="primary" variant="ghost" icon-left="check" @click="publishNow(item)">
          Publier maintenant
        </Button>
      </template>
    </AdminTable>
  </AdminPage>
</template>
