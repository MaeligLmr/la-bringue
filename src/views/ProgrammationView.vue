<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Hero from '../components/layout/Hero.vue'
import FilterableList from '../components/ui/FilterableList.vue'
import ContentCard from '../components/ui/ContentCard.vue'
import type { FilterConfig, FilterValues } from '../types/ui/filterable-list.ts'
import { JOURS, SCENES, type ArtisteCard } from '../types/ui/programmation.ts'
import { concertHandler } from '../handlers/concert'
import { labelOf, toArtisteCards } from '../lib/cards'

// Déjà triés par jour puis heure côté Supabase.
const artistes = ref<ArtisteCard[]>([])

onMounted(async () => {
  try {
    artistes.value = toArtisteCards(await concertHandler.getAllDetailed())
  } catch (error) {
    console.error(error)
  }
})

const filters: FilterConfig[] = [
  { key: 'date', label: 'Jour', allLabel: 'Tous les jours', options: JOURS },
  { key: 'scene', label: 'Scène', allLabel: 'Toutes les scènes', options: SCENES },
]

const router = useRouter()
const { date, scene } = useRoute().query
const selected = ref<FilterValues>({ date: String(date ?? ''), scene: String(scene ?? '') })

watch(selected, ({ date, scene }) => {
  router.replace({ query: { date: date || undefined, scene: scene || undefined } })
})
</script>

<template>
  <main class="programmation">
    <Hero />
    <div class="programmation__content">
      <FilterableList v-model:selected="selected" :items="artistes" :filters="filters">
        <template #item="{ item }">
          <ContentCard
            :nom="item.nom"
            :photo="item.photo"
            :scene="labelOf(SCENES, item.scene)"
            :date="`${labelOf(JOURS, item.date)} - ${item.heure}`"
            :categorie="item.categorie"
            likable
            :on-click="() => router.push({ name: 'fiche', params: { type: 'artiste', id: item.idArtiste } })"
            :target="{ id: item.idArtiste, type: 'artiste' }"
          />
        </template>
      </FilterableList>
    </div>
  </main>
</template>

<style scoped>
.programmation__content {
  padding: var(--space-5) var(--space-4) var(--space-10);
}

.programmation :deep(.filterable-list__items) {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-10) var(--space-8);
}

.programmation :deep(.content-card) {
  width: 100%;
}

@media (min-width: 640px) {
  .programmation :deep(.filterable-list__items) {
    grid-template-columns: repeat(2, 1fr);
    padding-bottom: var(--space-20);
  }
}

@media (min-width: 640px) and (max-width: 1024px) {
  .programmation :deep(.filterable-list__items > li:nth-child(2n)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1025px) {
  .programmation__content {
    padding: var(--space-5) var(--space-20) var(--space-10);
  }

  .programmation :deep(.filterable-list__items) {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1025px) and (max-width: 1439px) {
  .programmation :deep(.filterable-list__items > li:nth-child(3n + 2)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1440px) {
  .programmation :deep(.filterable-list__items) {
    grid-template-columns: repeat(4, 1fr);
  }

  .programmation :deep(.filterable-list__items > li:nth-child(4n + 2)),
  .programmation :deep(.filterable-list__items > li:nth-child(4n + 4)) {
    transform: translateY(var(--space-20));
  }
}
</style>
