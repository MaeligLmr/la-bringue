<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import ConcertLineup from '../../../components/admin/ConcertLineup/ConcertLineup.vue'
import { concertHandler, type ConcertDetail } from '../../../handlers/concert'
import { concertArtisteHandler } from '../../../handlers/concert-artiste'
import { sceneHandler } from '../../../handlers/scene'
import { formatHeure } from '../../../lib/cards/cards'
import { chevauchements, heureFinError } from '../../../lib/concert-checks/concert-checks'
import { diffLinks, type LineupEntry } from '../../../lib/links/links'
import type { Concert } from '../../../types/database/concert'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'
import { JOURS } from '../../../types/ui/programmation'

const props = defineProps<{ id?: number }>()

const router = useRouter()

const scenes = ref<SelectOption[]>([])
const savedLineup = ref<LineupEntry[]>([])
const lineup = ref<LineupEntry[]>([])
const concerts = ref<ConcertDetail[]>([])
const ready = ref(false)

async function loadLineup(idConcert: number) {
  const liens = await concertArtisteHandler.getArtistesByConcert(idConcert)
  return liens.map((lien) => ({
    id: lien.id_artiste,
    nom: lien.Artiste?.nom ?? '',
    artiste_annonce: !!lien.artiste_annonce,
    featuring: !!lien.featuring,
  }))
}

onMounted(async () => {
  try {
    const [toutes, liens, tous] = await Promise.all([
      sceneHandler.getAll(),
      props.id === undefined ? Promise.resolve([]) : loadLineup(props.id),
      concertHandler.getAllDetailed(),
    ])
    scenes.value = toutes.map((scene) => ({ value: String(scene.id_scene), label: scene.nom ?? '' }))
    savedLineup.value = liens
    lineup.value = liens
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

function rules(values: Record<string, unknown>) {
  return { heure_fin: heureFinError(values.heure_debut as string | null, values.heure_fin as string | null) }
}

function overlapWarning(values: Record<string, unknown>) {
  const concert = {
    id: props.id,
    lieu: values.id_scene as string,
    jour: values.jour as string,
    heure_debut: values.heure_debut as string,
    heure_fin: values.heure_fin as string,
  }
  const autres = concerts.value.map((autre) => ({ ...autre, id: autre.id_concert, lieu: autre.id_scene }))
  const conflits = chevauchements(concert, autres)
  if (!conflits.length) return ''
  const details = conflits.map((autre) => {
    const noms = autre.ConcertArtiste.flatMap((lien) => (lien.Artiste?.nom ? [lien.Artiste.nom] : [])).join(', ') || 'sans artiste'
    const horaire = [formatHeure(autre.heure_debut), formatHeure(autre.heure_fin)].filter(Boolean).join(' – ')
    return `${noms} (${horaire})`
  })
  return `Ce concert chevauche sur la même scène : ${details.join(' ; ')}.`
}

async function saveLineup(idConcert: number) {
  const { added, updated, removed } = diffLinks(
    savedLineup.value,
    lineup.value,
    (before, after) => before.artiste_annonce !== after.artiste_annonce || before.featuring !== after.featuring
  )
  const options = ({ artiste_annonce, featuring }: LineupEntry) => ({ artiste_annonce, featuring })
  await Promise.all([
    ...added.map((entry) => concertArtisteHandler.create(entry.id, idConcert, options(entry))),
    ...updated.map((entry) => concertArtisteHandler.update(entry.id, idConcert, options(entry))),
    ...removed.map((entry) => concertArtisteHandler.remove(entry.id, idConcert)),
  ])
}

async function onSaved(concert: Concert) {
  try {
    await saveLineup(concert.id_concert)
    router.push({ name: 'admin-concerts' })
  } catch {
    toast.error("Le concert est enregistré, mais pas son line-up. Vérifie-le puis enregistre à nouveau.")
    savedLineup.value = await loadLineup(concert.id_concert).catch(() => savedLineup.value)
    if (props.id === undefined) router.replace({ name: 'admin-concert', params: { id: concert.id_concert } })
  }
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
      :rules="rules"
      @saved="onSaved"
    >
      <template #default="{ values }">
        <p v-if="overlapWarning(values)" class="admin-concert-form__warning" role="status">
          {{ overlapWarning(values) }}
        </p>
        <ConcertLineup v-model="lineup" />
      </template>
    </AdminForm>
  </AdminPage>
</template>

<style scoped>
.admin-concert-form__warning {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-medium);
  background: var(--alert-danger-background);
  color: var(--alert-danger-text);
}
</style>
