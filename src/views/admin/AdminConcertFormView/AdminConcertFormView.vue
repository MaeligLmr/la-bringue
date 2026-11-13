<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import ConcertLineup from '../../../components/admin/ConcertLineup/ConcertLineup.vue'
import { useAdminLinks } from '../../../composables/useAdminLinks/useAdminLinks'
import { concertHandler, type ConcertDetail } from '../../../handlers/concert'
import { concertArtisteHandler } from '../../../handlers/concert-artiste'
import { sceneHandler } from '../../../handlers/scene'
import { formatHoraire } from '../../../lib/cards/cards'
import { chevauchements, creneauSaisi, horaireRules } from '../../../lib/concert-checks/concert-checks'
import type { LineupEntry } from '../../../lib/links/links'
import type { Concert } from '../../../types/database/concert'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'
import { JOURS } from '../../../types/ui/programmation'

const props = defineProps<{ id?: number }>()

const scenes = ref<SelectOption[]>([])
const concerts = ref<ConcertDetail[]>([])
const ready = ref(false)

const options = ({ artiste_annonce, featuring }: LineupEntry) => ({ artiste_annonce, featuring })

const { links: lineup, loadLinks, saveLinks } = useAdminLinks<LineupEntry>({
  load: async (idConcert) =>
    (await concertArtisteHandler.getArtistesByConcert(idConcert)).map((lien) => ({
      id: lien.id_artiste,
      nom: lien.Artiste?.nom ?? '',
      artiste_annonce: !!lien.artiste_annonce,
      featuring: !!lien.featuring,
    })),
  save: (idConcert, { added, updated, removed }) =>
    Promise.all([
      ...added.map((entry) => concertArtisteHandler.create(entry.id, idConcert, options(entry))),
      ...updated.map((entry) => concertArtisteHandler.update(entry.id, idConcert, options(entry))),
      ...removed.map((entry) => concertArtisteHandler.remove(entry.id, idConcert)),
    ]),
  changed: (before, after) => before.artiste_annonce !== after.artiste_annonce || before.featuring !== after.featuring,
  listRoute: { name: 'admin-concerts' },
  editRoute: (id) => ({ name: 'admin-concert', params: { id } }),
  errorMessage: 'Le concert est enregistré, mais pas son line-up. Vérifie-le puis enregistre à nouveau.',
})

onMounted(async () => {
  try {
    const [toutes, tous] = await Promise.all([sceneHandler.getAll(), concertHandler.getAllDetailed(), loadLinks(props.id)])
    scenes.value = toutes.map((scene) => ({ value: String(scene.id_scene), label: scene.nom ?? '' }))
    concerts.value = tous
  } catch {
    toast.error('Impossible de charger le concert.')
  } finally {
    ready.value = true
  }
})

const fields = computed<AdminFormField<Concert>[]>(() => [
  { key: 'jour', label: 'Jour', type: 'select', required: true, options: JOURS },
  { key: 'heure_debut', label: 'Heure de début', type: 'time', required: true },
  { key: 'heure_fin', label: 'Heure de fin', type: 'time' },
  { key: 'id_scene', label: 'Scène', type: 'select', required: true, options: scenes.value },
])

function overlapWarning(values: Record<string, unknown>) {
  const autres = concerts.value.map((autre) => ({ ...autre, id: autre.id_concert, lieu: autre.id_scene }))
  const conflits = chevauchements(creneauSaisi(values, props.id, values.id_scene as string), autres)
  if (!conflits.length) return ''
  const details = conflits.map((autre) => {
    const noms = autre.ConcertArtiste.flatMap((lien) => (lien.Artiste?.nom ? [lien.Artiste.nom] : [])).join(', ') || 'sans artiste'
    return `${noms} (${formatHoraire(autre.heure_debut, autre.heure_fin)})`
  })
  return `Ce concert chevauche sur la même scène : ${details.join(' ; ')}.`
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouveau concert' : 'Modifier le concert'"
    :back="{ to: { name: 'admin-concerts' }, label: 'Concerts' }"
    width="wide"
  >
    <AdminForm
      v-if="ready"
      :key="id ?? 'nouveau'"
      :fields="fields"
      :handler="concertHandler"
      :id="id"
      :rules="horaireRules"
      :warning="overlapWarning"
      @saved="(concert) => saveLinks(concert.id_concert, id === undefined)"
    >
      <ConcertLineup v-model="lineup" />
    </AdminForm>
  </AdminPage>
</template>
