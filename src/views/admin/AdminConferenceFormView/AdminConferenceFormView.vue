<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminLinks from '../../../components/admin/AdminLinks/AdminLinks.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import { byNom } from '../../../composables/useAdminList/useAdminList'
import { useAdminLinks } from '../../../composables/useAdminLinks/useAdminLinks'
import { conferenceHandler, type ConferenceDetail } from '../../../handlers/conference'
import { conferenciereHandler } from '../../../handlers/conferenciere'
import { participationHandler } from '../../../handlers/participation'
import { formatHoraire } from '../../../lib/cards/cards'
import { chevauchements, creneauSaisi, horaireRules } from '../../../lib/concert-checks/concert-checks'
import type { IntervenanteEntry, LinkEntry } from '../../../lib/links/links'
import { toOptions } from '../../../lib/options/options'
import type { Conference } from '../../../types/database/conference'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'
import { JOURS } from '../../../types/ui/programmation'

const props = defineProps<{ id?: number }>()

const LIEU = 'conferences'

const themes = ref<SelectOption[]>([])
const toutesIntervenantes = ref<LinkEntry[]>([])
const conferences = ref<ConferenceDetail[]>([])
const ready = ref(false)

const { links: intervenantes, loadLinks, saveLinks } = useAdminLinks<IntervenanteEntry>({
  load: async (idConference) =>
    (await participationHandler.getConferencieresByConference(idConference)).flatMap((participation) =>
      participation.id_conferenciere === null
        ? []
        : [
            {
              id: participation.id_conferenciere,
              nom: participation.Conferenciere?.nom ?? '',
              id_participation: participation.id_participation,
            },
          ]
    ),
  save: (idConference, { added, removed }) =>
    Promise.all([
      ...added.map((entry) => participationHandler.create({ id_conferenciere: entry.id, id_conference: idConference })),
      ...removed
        .filter((entry) => entry.id_participation !== undefined)
        .map((entry) => participationHandler.remove(entry.id_participation!)),
    ]),
  listRoute: { name: 'admin-conferences' },
  editRoute: (id) => ({ name: 'admin-conference', params: { id } }),
  errorMessage: 'La conférence est enregistrée, mais pas ses intervenantes. Vérifie-les puis enregistre à nouveau.',
})

onMounted(async () => {
  try {
    const [noms, toutes, conferencieres] = await Promise.all([
      conferenceHandler.getThemes(),
      conferenceHandler.getAllDetailed(),
      conferenciereHandler.getAll(),
      loadLinks(props.id),
    ])
    themes.value = toOptions(noms, { sorted: true })
    conferences.value = toutes
    toutesIntervenantes.value = byNom(
      conferencieres.map((conferenciere) => ({ id: conferenciere.id_conferenciere, nom: conferenciere.nom ?? '' }))
    )
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

function overlapWarning(values: Record<string, unknown>) {
  const autres = conferences.value.map((autre) => ({ ...autre, id: autre.id_conference, lieu: LIEU }))
  const conflits = chevauchements(creneauSaisi(values, props.id, LIEU), autres)
  if (!conflits.length) return ''
  const details = conflits.map((autre) => `${autre.titre ?? 'Sans titre'} (${formatHoraire(autre.heure_debut, autre.heure_fin)})`)
  return `Cette conférence a lieu en même temps que : ${details.join(' ; ')}.`
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
      :rules="horaireRules"
      :warning="overlapWarning"
      @saved="(conference) => saveLinks(conference.id_conference, id === undefined)"
    >
      <AdminLinks
        v-model="intervenantes"
        :items="toutesIntervenantes"
        legend="Intervenantes"
        empty="Aucune intervenante sur cette conférence pour l'instant."
        placeholder="Choisir une intervenante"
        context="de la conférence"
        hint="Retirer une intervenante la retire seulement de cette conférence : elle reste dans la liste des intervenantes."
      />
    </AdminForm>
  </AdminPage>
</template>
