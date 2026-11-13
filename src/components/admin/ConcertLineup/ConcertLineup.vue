<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import AdminLinks from '../AdminLinks/AdminLinks.vue'
import { byNom } from '../../../lib/options/options'
import Checkbox from '../../ui/Checkbox/Checkbox.vue'
import { artisteHandler } from '../../../handlers/artiste'
import type { Artiste } from '../../../types/database/artiste'
import type { LineupEntry, LinkEntry } from '../../../lib/links/links'

// Line-up d'un concert : AdminLinks avec les cases Annoncée et Featuring.
const lineup = defineModel<LineupEntry[]>({ required: true })

const artistes = ref<Artiste[]>([])

const newAnnoncee = ref(true)
const newFeaturing = ref(false)

onMounted(async () => {
  try {
    artistes.value = await artisteHandler.getAll()
  } catch {
    toast.error('Impossible de charger les artistes.')
  }
})

const items = computed(() => byNom(artistes.value.map((artiste) => ({ id: artiste.id_artiste, nom: artiste.nom ?? '' }))))

function toEntry(item: LinkEntry): LineupEntry {
  return { ...item, artiste_annonce: newAnnoncee.value, featuring: newFeaturing.value }
}

function resetOptions() {
  newAnnoncee.value = true
  newFeaturing.value = false
}
</script>

<template>
  <AdminLinks
    v-model="lineup"
    :items="items"
    :to-entry="toEntry"
    legend="Line-up"
    empty="Aucune artiste sur ce concert pour l'instant."
    placeholder="Choisir une artiste"
    context="du concert"
    hint="Une artiste non annoncée reste cachée sur le site. Une artiste en featuring n'apparaît pas sur l'affiche de la home."
    @added="resetOptions"
  >
    <template #entry="{ entry, update }">
      <Checkbox :model-value="entry.artiste_annonce" @update:model-value="update({ artiste_annonce: $event })">Annoncée</Checkbox>
      <Checkbox :model-value="entry.featuring" @update:model-value="update({ featuring: $event })">Featuring</Checkbox>
    </template>

    <template #add-options>
      <Checkbox v-model="newAnnoncee">Annoncée</Checkbox>
      <Checkbox v-model="newFeaturing">Featuring</Checkbox>
    </template>
  </AdminLinks>
</template>
