<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import Tag from '../../../components/ui/Tag/Tag.vue'
import { useAdminList } from '../../../composables/useAdminList/useAdminList'
import { ADMIN_PAGE_SIZE } from '../../../handlers/crud'
import { promotionHandler, type PromotionAvecFormule } from '../../../handlers/promotion'
import { formatPeriode, promotionStatus, type PromotionStatus } from '../../../lib/promotion/promotion'
import type { AdminTableColumn } from '../../../types/ui/admin-table'
import type { TagVariant } from '../../../types/ui/tag'

// AdminTable cherche et nomme les lignes par `nom` : le nom de la promotion y est recopié.
interface PromotionRow {
  id_promotion: number
  nom: string
  formule: string
  reduction: string
  periode: string
  statut: PromotionStatus
}

const STATUTS: Record<PromotionStatus, { label: string; variant: TagVariant }> = {
  'en-cours': { label: 'En cours', variant: 'pink-bright' },
  'a-venir': { label: 'À venir', variant: 'blue' },
  terminee: { label: 'Terminée', variant: 'violet' },
}

const router = useRouter()

const COLUMNS: AdminTableColumn<PromotionRow>[] = [
  { key: 'nom', label: 'Promotion' },
  { key: 'formule', label: 'Formule' },
  { key: 'reduction', label: 'Réduction' },
  { key: 'periode', label: 'Période' },
  { key: 'statut', label: 'Statut' },
]

function toRow(promotion: PromotionAvecFormule): PromotionRow {
  return {
    id_promotion: promotion.id_promotion,
    nom: promotion.description?.trim() || 'Sans nom',
    formule: promotion.Formule?.titre ?? '—',
    reduction: promotion.reduction_prc === null ? '—' : `−${promotion.reduction_prc} %`,
    periode: formatPeriode(promotion),
    statut: promotionStatus(promotion),
  }
}

const { items: promotions, search, hasMore, loading, failed, loadMore, remove } = useAdminList({
  fetchPage: async (offset, search) => {
    const page = await promotionHandler.getPage({ offset, search, pageSize: ADMIN_PAGE_SIZE })
    return { ...page, rows: page.rows.map(toRow) }
  },
  remove: (promotion: PromotionRow) => promotionHandler.remove(promotion.id_promotion),
  idOf: (promotion) => promotion.id_promotion,
  loadError: 'Impossible de charger les promotions.',
  removed: (promotion) => `« ${promotion.nom} » a été supprimée.`,
})

async function deleteImpact(promotion: PromotionRow) {
  return [`Le prix de « ${promotion.formule} » repasse au prix plein sur le site.`]
}
</script>

<template>
  <AdminPage title="Promotions">
    <AdminTable
      :items="promotions"
      :columns="COLUMNS"
      row-key="id_promotion"
      v-model:search="search"
      :loading="loading"
      :has-more="hasMore"
      :failed="failed"
      :delete-impact="deleteImpact"
      @add="router.push({ name: 'admin-promotion-nouvelle' })"
      @edit="(promotion) => router.push({ name: 'admin-promotion', params: { id: promotion.id_promotion } })"
      @load-more="loadMore"
      @delete="remove"
    >
      <template #cell-statut="{ item }">
        <Tag :label="STATUTS[item.statut].label" :variant="STATUTS[item.statut].variant" />
      </template>
    </AdminTable>
  </AdminPage>
</template>
