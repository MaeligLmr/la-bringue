<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import AdminLinks from '../../../components/admin/AdminLinks/AdminLinks.vue'
import { conferenceHandler, type ConferenceDetail } from '../../../handlers/conference'
import { conferenciereHandler } from '../../../handlers/conferenciere'
import { participationHandler } from '../../../handlers/participation'
import { formatHeure } from '../../../lib/cards/cards'
import { chevauchements, heureFinError } from '../../../lib/concert-checks/concert-checks'
import { diffLinks, type IntervenanteEntry, type LinkEntry } from '../../../lib/links/links'
import type { Conference } from '../../../types/database/conference'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'
import { JOURS } from '../../../types/ui/programmation'

const props = defineProps<{ id?: number }>()

const router = useRouter()

const LIEU = 'conferences'

const themes = ref<SelectOption[]>([])
const savedIntervenantes = ref<IntervenanteEntry[]>([])
const intervenantes = ref<IntervenanteEntry[]>([])
const toutesIntervenantes = ref<LinkEntry[]>([])
const conferences = ref<ConferenceDetail[]>([])
const ready = ref(false)

async function loadIntervenantes(idConference: number): Promise<IntervenanteEntry[]> {
  const participations = await participationHandler.getConferencieresByConference(idConference)
  return participations.flatMap((participation) =>
    participation.id_conferenciere === null
      ? []
      : [
          {
            id: participation.id_conferenciere,
            nom: participation.Conferenciere?.nom ?? '',
            id_participation: participation.id_participation,
          },
        ]
  )
}

onMounted(async () => {
  try {
    const [noms, liens, toutes, conferencieres] = await Promise.all([
      conferenceHandler.getThemes(),
      props.id === undefined ? Promise.resolve([]) : loadIntervenantes(props.id),
      conferenceHandler.getAllDetailed(),
      conferenciereHandler.getAll(),
    ])
    themes.value = [...noms].sort((a, b) => a.localeCompare(b)).map((theme) => ({ value: theme, label: theme }))
    savedIntervenantes.value = liens
    intervenantes.value = liens
    conferences.value = toutes
    toutesIntervenantes.value = conferencieres
      .map((conferenciere) => ({ id: conferenciere.id_conferenciere, nom: conferenciere.nom ?? '' }))
      .sort((a, b) => a.nom.localeCompare(b.nom))
  } catch {
    toast.error('Impossible de charger la conférence.')
  } finally {
    ready.value = true
  }
})

const fields = computed<AdminFormField<Conference>[]>(() => [
  { key: 'titre', label: 'Titre', type: 'text', required: true },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'conferences' },
  { key: 'theme', label: 'Thème', type: 'select', options: [{ value: '', label: 'Aucun' }, ...themes.value] },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'jour', label: 'Jour', type: 'select', required: true, options: JOURS },
  { key: 'heure_debut', label: 'Heure de début', type: 'time', required: true },
  { key: 'heure_fin', label: 'Heure de fin', type: 'time' },
])

function rules(values: Record<string, unknown>) {
  return { heure_fin: heureFinError(values.heure_debut as string | null, values.heure_fin as string | null) }
}

function overlapWarning(values: Record<string, unknown>) {
  const conference = {
    id: props.id,
    lieu: LIEU,
    jour: values.jour as string,
    heure_debut: values.heure_debut as string,
    heure_fin: values.heure_fin as string,
  }
  const autres = conferences.value.map((autre) => ({ ...autre, id: autre.id_conference, lieu: LIEU }))
  const conflits = chevauchements(conference, autres)
  if (!conflits.length) return ''
  const details = conflits.map((autre) => {
    const horaire = [formatHeure(autre.heure_debut), formatHeure(autre.heure_fin)].filter(Boolean).join(' – ')
    return `${autre.titre ?? 'Sans titre'} (${horaire})`
  })
  return `Cette conférence a lieu en même temps que : ${details.join(' ; ')}.`
}

async function saveIntervenantes(idConference: number) {
  const { added, removed } = diffLinks(savedIntervenantes.value, intervenantes.value)
  await Promise.all([
    ...added.map((entry) => participationHandler.create({ id_conferenciere: entry.id, id_conference: idConference })),
    ...removed
      .filter((entry) => entry.id_participation !== undefined)
      .map((entry) => participationHandler.remove(entry.id_participation!)),
  ])
}

async function onSaved(conference: Conference) {
  try {
    await saveIntervenantes(conference.id_conference)
    router.push({ name: 'admin-conferences' })
  } catch {
    toast.error("La conférence est enregistrée, mais pas ses intervenantes. Vérifie-les puis enregistre à nouveau.")
    savedIntervenantes.value = await loadIntervenantes(conference.id_conference).catch(() => savedIntervenantes.value)
    if (props.id === undefined) router.replace({ name: 'admin-conference', params: { id: conference.id_conference } })
  }
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouvelle conférence' : 'Modifier la conférence'"
    :back="{ to: { name: 'admin-conferences' }, label: 'Conférences' }"
    width="wide"
  >
    <AdminForm
      v-if="ready"
      :key="id ?? 'nouvelle'"
      :fields="fields"
      :handler="conferenceHandler"
      :id="id"
      :rules="rules"
      @saved="onSaved"
    >
      <template #default="{ values }">
        <p v-if="overlapWarning(values)" class="admin-conference-form__warning" role="status">
          {{ overlapWarning(values) }}
        </p>
        <AdminLinks
          v-model="intervenantes"
          :items="toutesIntervenantes"
          legend="Intervenantes"
          empty="Aucune intervenante sur cette conférence pour l'instant."
          placeholder="Choisir une intervenante"
          context="de la conférence"
          hint="Retirer une intervenante la retire seulement de cette conférence : elle reste dans la liste des intervenantes."
        />
      </template>
    </AdminForm>
  </AdminPage>
</template>

<style scoped>
.admin-conference-form__warning {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-medium);
  background: var(--alert-danger-background);
  color: var(--alert-danger-text);
}
</style>
