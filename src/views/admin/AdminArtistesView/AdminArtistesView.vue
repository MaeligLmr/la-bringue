<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { artisteHandler } from '../../../handlers/artiste'
import { concertArtisteHandler } from '../../../handlers/concert-artiste'
import { likeHandler } from '../../../handlers/like'
import type { Artiste } from '../../../types/database/artiste'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

const router = useRouter()

const COLUMNS: AdminTableColumn<Artiste>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'categorie', label: 'Catégorie', format: (value) => (value ? String(value) : '—') },
]

const artistes = ref<Artiste[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const rows = await artisteHandler.getAll()
    artistes.value = rows.sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''))
  } catch {
    toast.error('Impossible de charger les artistes.')
  } finally {
    loading.value = false
  }
})

// Rappelé dans la modale : la suppression retire aussi les likes et le line-up
// (clés étrangères en cascade).
async function deleteImpact(artiste: Artiste) {
  const [likes, concerts] = await Promise.all([
    likeHandler.countFor({ type: 'artiste', id: artiste.id_artiste }),
    concertArtisteHandler.getConcertsByArtiste(artiste.id_artiste),
  ])
  const lines: string[] = []
  if (likes) lines.push(`${likes} personne${likes > 1 ? 's ont' : ' a'} liké cette artiste.`)
  if (concerts.length) lines.push(`Elle sera retirée de ${concerts.length} concert${concerts.length > 1 ? 's' : ''}.`)
  return lines
}

async function remove(artiste: Artiste) {
  try {
    await artisteHandler.remove(artiste.id_artiste)
    artistes.value = artistes.value.filter((item) => item.id_artiste !== artiste.id_artiste)
    toast.success(`« ${artiste.nom} » a été supprimée.`)
  } catch {
    toast.error('La suppression a échoué. Réessaie plus tard.')
  }
}
</script>

<template>
  <div class="admin-artistes">
    <h1>Artistes</h1>

    <AdminTable
      :items="artistes"
      :columns="COLUMNS"
      row-key="id_artiste"
      :loading="loading"
      :delete-impact="deleteImpact"
      @add="router.push({ name: 'admin-artiste-nouvelle' })"
      @edit="(artiste) => router.push({ name: 'admin-artiste', params: { id: artiste.id_artiste } })"
      @delete="remove"
    />
  </div>
</template>

<style scoped>
.admin-artistes {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-artistes h1 {
  margin: 0;
}
</style>
