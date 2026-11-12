<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import Button from '../../ui/Button/Button.vue'
import Select from '../../ui/Select/Select.vue'
import { artisteHandler } from '../../../handlers/artiste'
import type { Artiste } from '../../../types/database/artiste'
import type { LineupEntry } from '../../../lib/lineup/lineup'

const lineup = defineModel<LineupEntry[]>({ required: true })

const artistes = ref<Artiste[]>([])

const newArtiste = ref('')
const newAnnoncee = ref(true)
const newFeaturing = ref(false)

onMounted(async () => {
  try {
    artistes.value = (await artisteHandler.getAll()).sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''))
  } catch {
    toast.error('Impossible de charger les artistes.')
  }
})

const choix = computed(() =>
  artistes.value
    .filter((artiste) => !lineup.value.some((entry) => entry.id_artiste === artiste.id_artiste))
    .map((artiste) => ({ value: String(artiste.id_artiste), label: artiste.nom ?? '' }))
)

function add() {
  const artiste = artistes.value.find((item) => String(item.id_artiste) === newArtiste.value)
  if (!artiste) return

  lineup.value = [
    ...lineup.value,
    { id_artiste: artiste.id_artiste, nom: artiste.nom ?? '', artiste_annonce: newAnnoncee.value, featuring: newFeaturing.value },
  ]
  newArtiste.value = ''
  newAnnoncee.value = true
  newFeaturing.value = false
}

function set(entry: LineupEntry, option: 'artiste_annonce' | 'featuring', checked: boolean) {
  lineup.value = lineup.value.map((item) => (item.id_artiste === entry.id_artiste ? { ...item, [option]: checked } : item))
}

function remove(entry: LineupEntry) {
  lineup.value = lineup.value.filter((item) => item.id_artiste !== entry.id_artiste)
}
</script>

<template>
  <fieldset class="concert-lineup">
    <legend>Line-up</legend>

    <p v-if="!lineup.length">Aucune artiste sur ce concert pour l'instant.</p>

    <ul v-else class="concert-lineup__list">
      <li v-for="entry in lineup" :key="entry.id_artiste" class="concert-lineup__item">
        <span class="concert-lineup__nom">{{ entry.nom }}</span>
        <label>
          <input
            type="checkbox"
            :checked="entry.artiste_annonce"
            @change="set(entry, 'artiste_annonce', ($event.target as HTMLInputElement).checked)"
          />
          Annoncée
        </label>
        <label>
          <input
            type="checkbox"
            :checked="entry.featuring"
            @change="set(entry, 'featuring', ($event.target as HTMLInputElement).checked)"
          />
          Featuring
        </label>
        <Button color="danger" variant="ghost" :aria-label="`Retirer ${entry.nom} du concert`" @click="remove(entry)">
          Retirer
        </Button>
      </li>
    </ul>

    <!-- Pas de <form> : on est déjà dans celui du concert. -->
    <div class="concert-lineup__add">
      <Select v-model="newArtiste" :options="choix" placeholder="Choisir une artiste" aria-label="Artiste à ajouter" />
      <label>
        <input v-model="newAnnoncee" type="checkbox" />
        Annoncée
      </label>
      <label>
        <input v-model="newFeaturing" type="checkbox" />
        Featuring
      </label>
      <Button variant="outlined" icon-left="plus" :disabled="!newArtiste" @click="add">Ajouter</Button>
    </div>

    <p class="concert-lineup__hint">
      Une artiste non annoncée reste cachée sur le site. Une artiste en featuring n'apparaît pas sur l'affiche de la home.
    </p>
  </fieldset>
</template>

<style scoped>
.concert-lineup {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
}

.concert-lineup legend {
  margin-bottom: var(--space-1);
  padding: 0;
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
}

.concert-lineup p {
  margin: 0;
}

.concert-lineup__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-medium);
}

.concert-lineup__item,
.concert-lineup__add {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.concert-lineup__item {
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.concert-lineup__item:last-child {
  border-bottom: none;
}

.concert-lineup__nom {
  flex: 1 1 10rem;
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
}

.concert-lineup label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-small);
}

.concert-lineup__hint {
  font-size: var(--font-size-small);
}
</style>
