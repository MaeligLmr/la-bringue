<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Hero from '../components/layout/Hero.vue'
import FilterableList from '../components/ui/FilterableList.vue'
import ContentCard from '../components/ui/ContentCard.vue'
import type { FilterConfig, FilterValues } from '../types/ui/filterable-list.ts'
import { JOURS } from '../types/ui/programmation.ts'
import type { ConferenceCard } from '../types/ui/conferences.ts'
import { conferenceHandler, type ConferenceDetail } from '../handlers/conference'

// "14:30:00" → "14h30"
function formatHeure(heure: string | null) {
  return heure ? heure.slice(0, 5).replace(':', 'h') : ''
}

function toCards(conferences: ConferenceDetail[]): ConferenceCard[] {
  return conferences.map((conference) => ({
    id: conference.id_conference,
    nom: conference.titre ?? '',
    photo: conference.photo,
    date: conference.jour ?? '',
    heure: formatHeure(conference.heure_debut),
    conferencieres: conference.Participation.flatMap(({ Conferenciere }) =>
      Conferenciere?.nom ? [Conferenciere.nom] : []
    ).join(', '),
    theme: conference.theme ?? '',
  }))
}

// Déjà triées par jour puis heure côté Supabase.
const conferences = ref<ConferenceCard[]>([])

onMounted(async () => {
  try {
    conferences.value = toCards(await conferenceHandler.getAllDetailed())
  } catch (error) {
    console.error(error)
  }
})

const filters: FilterConfig[] = [{ key: 'date', label: 'Jour', allLabel: 'Tous les jours', options: JOURS }]

const router = useRouter()
const { date } = useRoute().query
const selected = ref<FilterValues>({ date: String(date ?? '') })

watch(selected, ({ date }) => {
  router.replace({ query: { date: date || undefined } })
})

function labelOf(value: string) {
  return JOURS.find((option) => option.value === value)?.label ?? value
}
</script>

<template>
  <main class="conferences">
    <Hero />
    <div class="conferences__content">
      <FilterableList
        v-model:selected="selected"
        :items="conferences"
        :filters="filters"
        search-placeholder="Rechercher par titre"
      >
        <template #item="{ item }">
          <ContentCard
            :nom="item.nom"
            :photo="item.photo"
            :scene="item.conferencieres"
            :date="`${labelOf(item.date)} - ${item.heure}`"
            :categorie="item.theme"
            likable
          />
        </template>
      </FilterableList>
    </div>
  </main>
</template>

<style scoped>
.conferences__content {
  padding: var(--space-5) var(--space-4) var(--space-10);
}

.conferences :deep(.filterable-list__items) {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-10) var(--space-8);
}

/* Les cartes remplissent leur colonne : on lève la largeur max de ContentCard. */
.conferences :deep(.content-card) {
  width: 100%;
  max-width: none;
}

/* 2 colonnes dès la tablette, y compris en desktop. */
@media (min-width: 640px) {
  .conferences :deep(.filterable-list__items) {
    grid-template-columns: repeat(2, 1fr);
    padding-bottom: var(--space-20);
  }

  .conferences :deep(.filterable-list__items > li:nth-child(2n)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1025px) {
  .conferences__content {
    padding: var(--space-5) var(--space-20) var(--space-10);
  }
}
</style>
