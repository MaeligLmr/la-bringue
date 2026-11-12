<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import ConcertLineup from '../../../components/admin/ConcertLineup/ConcertLineup.vue'
import { concertHandler } from '../../../handlers/concert'
import { concertArtisteHandler } from '../../../handlers/concert-artiste'
import { sceneHandler } from '../../../handlers/scene'
import { diffLineup, type LineupEntry } from '../../../lib/lineup/lineup'
import type { Concert } from '../../../types/database/concert'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'
import { JOURS } from '../../../types/ui/programmation'

const props = defineProps<{ id?: number }>()

const router = useRouter()

const scenes = ref<SelectOption[]>([])
const savedLineup = ref<LineupEntry[]>([])
const lineup = ref<LineupEntry[]>([])
const ready = ref(false)

async function loadLineup(idConcert: number) {
  const liens = await concertArtisteHandler.getArtistesByConcert(idConcert)
  return liens.map((lien) => ({
    id_artiste: lien.id_artiste,
    nom: lien.Artiste?.nom ?? '',
    artiste_annonce: !!lien.artiste_annonce,
    featuring: !!lien.featuring,
  }))
}

onMounted(async () => {
  try {
    const [toutes, liens] = await Promise.all([
      sceneHandler.getAll(),
      props.id === undefined ? Promise.resolve([]) : loadLineup(props.id),
    ])
    scenes.value = toutes.map((scene) => ({ value: String(scene.id_scene), label: scene.nom ?? '' }))
    savedLineup.value = liens
    lineup.value = liens
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

async function saveLineup(idConcert: number) {
  const { added, updated, removed } = diffLineup(savedLineup.value, lineup.value)
  const options = ({ artiste_annonce, featuring }: LineupEntry) => ({ artiste_annonce, featuring })
  await Promise.all([
    ...added.map((entry) => concertArtisteHandler.create(entry.id_artiste, idConcert, options(entry))),
    ...updated.map((entry) => concertArtisteHandler.update(entry.id_artiste, idConcert, options(entry))),
    ...removed.map((entry) => concertArtisteHandler.remove(entry.id_artiste, idConcert)),
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
  <div class="admin-concert-form">
    <RouterLink :to="{ name: 'admin-concerts' }" class="admin-concert-form__back">← Concerts</RouterLink>
    <h1>{{ id === undefined ? 'Nouveau concert' : 'Modifier le concert' }}</h1>

    <AdminForm v-if="ready" :key="id ?? 'nouveau'" :fields="fields" :handler="concertHandler" :id="id" @saved="onSaved">
      <ConcertLineup v-model="lineup" />
    </AdminForm>
  </div>
</template>

<style scoped>
.admin-concert-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 48rem;
}

.admin-concert-form h1 {
  margin: 0;
}

.admin-concert-form__back {
  align-self: flex-start;
  color: var(--text-h);
  font-size: var(--font-size-small);
}
</style>
