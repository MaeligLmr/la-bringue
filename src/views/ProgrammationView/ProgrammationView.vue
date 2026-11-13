<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Hero from '../../components/layout/Hero/Hero.vue'
import FilterableList from '../../components/ui/FilterableList/FilterableList.vue'
import ContentCard from '../../components/ui/ContentCard/ContentCard.vue'
import type { FilterConfig, FilterValues } from '../../types/ui/filterable-list.ts'
import { JOURS, SCENES } from '../../types/ui/programmation.ts'
import { concertHandler } from '../../handlers/concert'
import { labelOf, toArtisteCards } from '../../lib/cards/cards'
import { usePaginatedList } from '../../composables/usePaginatedList/usePaginatedList'
import { useScrollReveal } from '../../composables/useScrollReveal/useScrollReveal'

const filters: FilterConfig[] = [
  { key: 'date', label: 'Jour', allLabel: 'Tous les jours', options: JOURS },
  { key: 'scene', label: 'Scène', allLabel: 'Toutes les scènes', options: SCENES },
]

const router = useRouter()
const { date, scene } = useRoute().query
const selected = ref<FilterValues>({ date: String(date ?? ''), scene: String(scene ?? '') })
const search = ref('')

// Recherche, jour et scène sont appliqués par Supabase ; la programmation se
// charge par pages de concerts au fil du défilement, déjà triée par jour puis heure.
const {
  items: artistes,
  hasMore,
  loading,
  failed,
  loadMore,
} = usePaginatedList({
  fetchPage: async (offset, { search, filters }) => {
    const page = await concertHandler.getPage({ offset, search, jour: filters.date, scene: filters.scene })
    return { ...page, rows: toArtisteCards(page.rows) }
  },
  search,
  filters: selected,
  onError: () => toast.error('Impossible de charger la programmation.'),
})

watch(selected, ({ date, scene }) => {
  router.replace({ query: { date: date || undefined, scene: scene || undefined } })
})

// Apparition des titres, textes et cartes au défilement.
useScrollReveal()
</script>

<template>
  <main class="programmation">
    <Hero />
    <div class="programmation__content">
      <FilterableList
        v-model:selected="selected"
        v-model:search="search"
        :items="artistes"
        :filters="filters"
        :has-more="hasMore"
        :loading="loading"
        :failed="failed"
        @load-more="loadMore"
      >
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
