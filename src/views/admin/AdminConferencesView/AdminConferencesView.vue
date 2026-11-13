<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminTable from '../../../components/admin/AdminTable/AdminTable.vue'
import { useAdminList } from '../../../composables/useAdminList/useAdminList'
import { conferenceHandler, type ConferenceDetail } from '../../../handlers/conference'
import { likeHandler } from '../../../handlers/like'
import { formatHoraire, labelOf } from '../../../lib/cards/cards'
import { JOURS } from '../../../types/ui/programmation'
import type { AdminTableColumn } from '../../../types/ui/admin-table'

interface ConferenceRow {
  id_conference: number
  nom: string
  intervenantes: string
  jour: string
  horaire: string
  theme: string
}

const router = useRouter()

const COLUMNS: AdminTableColumn<ConferenceRow>[] = [
  { key: 'nom', label: 'Titre' },
  { key: 'intervenantes', label: 'Intervenantes' },
  { key: 'jour', label: 'Jour' },
  { key: 'horaire', label: 'Horaire' },
  { key: 'theme', label: 'Thème' },
]

function toRow(conference: ConferenceDetail): ConferenceRow {
  const noms = conference.Participation.flatMap((participation) =>
    participation.Conferenciere?.nom ? [participation.Conferenciere.nom] : []
  )
  return {
    id_conference: conference.id_conference,
    nom: conference.titre ?? 'Sans titre',
    intervenantes: noms.join(', ') || '—',
    jour: conference.jour ? labelOf(JOURS, conference.jour) : '—',
    horaire: formatHoraire(conference.heure_debut, conference.heure_fin) || '—',
    theme: conference.theme ?? '—',
  }
}

const { items: conferences, loading, remove } = useAdminList({
  load: async () => (await conferenceHandler.getAllDetailed()).map(toRow),
  remove: (conference: ConferenceRow) => conferenceHandler.remove(conference.id_conference),
  idOf: (conference) => conference.id_conference,
  loadError: 'Impossible de charger les conférences.',
  removed: (conference) => `« ${conference.nom} » a été supprimée.`,
})

async function deleteImpact(conference: ConferenceRow) {
  const likes = await likeHandler.countFor({ type: 'conference', id: conference.id_conference })
  const lines: string[] = []
  if (likes) lines.push(`${likes} personne${likes > 1 ? 's ont' : ' a'} liké cette conférence.`)
  lines.push('Les intervenantes restent dans la liste des intervenantes.')
  return lines
}
</script>

<template>
  <AdminPage title="Conférences">
    <AdminTable
      :items="conferences"
      :columns="COLUMNS"
      row-key="id_conference"
      :loading="loading"
      :delete-impact="deleteImpact"
      @add="router.push({ name: 'admin-conference-nouvelle' })"
      @edit="(conference) => router.push({ name: 'admin-conference', params: { id: conference.id_conference } })"
      @delete="remove"
    />
  </AdminPage>
</template>
