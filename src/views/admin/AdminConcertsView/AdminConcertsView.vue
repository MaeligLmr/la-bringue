<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
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

const concerts = ref<ConcertRow[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    concerts.value = (await concertHandler.getAllDetailed()).map(toRow)
  } catch {
    toast.error('Impossible de charger les concerts.')
  } finally {
    loading.value = false
  }
})

async function deleteImpact(concert: ConcertRow) {
  return [`Concert du ${concert.jour.toLowerCase()}, ${concert.horaire}, scène ${concert.scene}.`, 'Les artistes restent dans la liste des artistes.']
}

async function remove(concert: ConcertRow) {
  try {
    await concertHandler.remove(concert.id_concert)
    concerts.value = concerts.value.filter((item) => item.id_concert !== concert.id_concert)
    toast.success('Le concert a été supprimé.')
  } catch {
    toast.error('La suppression a échoué. Réessaie plus tard.')
  }
}
</script>

<template>
  <div class="admin-concerts">
    <h1>Concerts</h1>

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
  </div>
</template>

<style scoped>
.admin-concerts {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-concerts h1 {
  margin: 0;
}
</style>
