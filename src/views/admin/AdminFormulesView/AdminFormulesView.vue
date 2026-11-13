<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { useAdminList } from '../../../composables/useAdminList/useAdminList'
import { ADMIN_PAGE_SIZE } from '../../../handlers/crud'
import { formuleHandler } from '../../../handlers/formule'
import { promotionHandler } from '../../../handlers/promotion'
import { formatDates, formatPrix } from '../../../lib/billetterie/billetterie'
import type { Formule } from '../../../types/database/formule'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

// AdminTable cherche et nomme les lignes par `nom` : le titre de la formule y est recopié.
interface FormuleRow {
  id_formule: number
  nom: string
  dates: string
  prix: string
  places: string
  accueil: string
}

const router = useRouter()

const COLUMNS: AdminTableColumn<FormuleRow>[] = [
  { key: 'nom', label: 'Formule' },
  { key: 'dates', label: 'Dates' },
  { key: 'prix', label: 'Prix' },
  { key: 'places', label: 'Places restantes' },
  { key: 'accueil', label: 'Accueil' },
]

function toRow(formule: Formule): FormuleRow {
  const total = formule.nbr_places_total
  const restantes = formule.nbr_places_restantes
  return {
    id_formule: formule.id_formule,
    nom: formule.titre ?? 'Sans titre',
    dates: formatDates(formule.jour_debut, formule.jour_fin) ?? '—',
    prix: formule.prix === null ? '—' : formatPrix(formule.prix),
    places: restantes === null ? '—' : total === null ? String(restantes) : `${restantes} / ${total}`,
    accueil: formule.homepage ? 'Oui' : 'Non',
  }
}

const { items: formules, search, hasMore, loading, failed, loadMore, remove } = useAdminList({
  fetchPage: async (offset, search) => {
    const page = await formuleHandler.getPage({ offset, search, pageSize: ADMIN_PAGE_SIZE })
    return { ...page, rows: page.rows.map(toRow) }
  },
  remove: (formule: FormuleRow) => formuleHandler.remove(formule.id_formule),
  idOf: (formule) => formule.id_formule,
  loadError: 'Impossible de charger les formules.',
  removed: (formule) => `« ${formule.nom} » a été supprimée.`,
})

// Rappelé dans la modale : les promotions sont rattachées à une formule.
async function deleteImpact(formule: FormuleRow) {
  const promotions = await promotionHandler.getByFormule(formule.id_formule)
  return promotions.length
    ? [`${promotions.length} promotion${promotions.length > 1 ? 's sont liées' : ' est liée'} à cette formule.`]
    : []
}
</script>

<template>
  <AdminPage title="Billetterie">
    <AdminTable
      :items="formules"
      :columns="COLUMNS"
      row-key="id_formule"
      v-model:search="search"
      :loading="loading"
      :has-more="hasMore"
      :failed="failed"
      :delete-impact="deleteImpact"
      @add="router.push({ name: 'admin-formule-nouvelle' })"
      @edit="(formule) => router.push({ name: 'admin-formule', params: { id: formule.id_formule } })"
      @load-more="loadMore"
      @delete="remove"
    />
  </AdminPage>
</template>
