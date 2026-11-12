<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { useAdminList } from '../../../composables/useAdminList/useAdminList'
import { concertHandler, type ConcertDetail } from '../../../handlers/concert'
import { formatHeure, labelOf } from '../../../lib/cards/cards'
import { JOURS } from '../../../types/ui/programmation'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

interface ConcertRow {
  id_concert: number
  nom: string
  jour: string
  horaire: string
  scene: string
}

const router = useRouter()

const COLUMNS: AdminTableColumn<ConcertRow>[] = [
  { key: 'nom', label: 'Artistes' },
  { key: 'jour', label: 'Jour' },
  { key: 'horaire', label: 'Horaire' },
  { key: 'scene', label: 'Scène' },
]

function toRow(concert: ConcertDetail): ConcertRow {
  const noms = concert.ConcertArtiste.flatMap((lien) => (lien.Artiste?.nom ? [lien.Artiste.nom] : []))
  return {
    id_concert: concert.id_concert,
    nom: noms.join(', ') || 'Aucune artiste',
    jour: concert.jour ? labelOf(JOURS, concert.jour) : '—',
    horaire: [formatHeure(concert.heure_debut), formatHeure(concert.heure_fin)].filter(Boolean).join(' – ') || '—',
    scene: concert.Scene?.nom ?? '—',
  }
}

const { items: concerts, loading, remove } = useAdminList({
  load: async () => (await concertHandler.getAllDetailed()).map(toRow),
  remove: (concert: ConcertRow) => concertHandler.remove(concert.id_concert),
  idOf: (concert) => concert.id_concert,
  loadError: 'Impossible de charger les concerts.',
  removed: () => 'Le concert a été supprimé.',
})

async function deleteImpact(concert: ConcertRow) {
  return [`Concert du ${concert.jour.toLowerCase()}, ${concert.horaire}, scène ${concert.scene}.`, 'Les artistes restent dans la liste des artistes.']
}
</script>

<template>
  <AdminPage title="Concerts">
    <AdminTable
      :items="concerts"
      :columns="COLUMNS"
      row-key="id_concert"
      :loading="loading"
      :delete-impact="deleteImpact"
      @add="router.push({ name: 'admin-concert-nouveau' })"
      @edit="(concert) => router.push({ name: 'admin-concert', params: { id: concert.id_concert } })"
      @delete="remove"
    />
  </AdminPage>
</template>

