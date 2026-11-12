<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { byNom, useAdminList } from '../../../composables/useAdminList/useAdminList'
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

const { items: artistes, loading, remove } = useAdminList({
  load: async () => byNom(await artisteHandler.getAll()),
  remove: (artiste: Artiste) => artisteHandler.remove(artiste.id_artiste),
  idOf: (artiste) => artiste.id_artiste,
  loadError: 'Impossible de charger les artistes.',
  removed: (artiste) => `« ${artiste.nom} » a été supprimée.`,
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
</script>

<template>
  <AdminPage title="Artistes">
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
  </AdminPage>
</template>

