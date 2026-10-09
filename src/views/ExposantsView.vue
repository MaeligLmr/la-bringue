<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Hero from '../components/layout/Hero.vue'
import FilterableList from '../components/ui/FilterableList.vue'
import ContentCard from '../components/ui/ContentCard.vue'
import type { FilterConfig, FilterValues } from '../types/ui/filterable-list.ts'
import type { ExposantCard } from '../types/ui/exposants.ts'
import { exposantHandler } from '../handlers/exposant'
import { toExposantCards } from '../lib/cards'

// Déjà triés par nom côté Supabase.
const exposants = ref<ExposantCard[]>([])
// Valeurs de l'enum `categories_exposants`, dans l'ordre de la base.
const categories = ref<string[]>([])

// Chargements indépendants : si la fonction RPC échoue, la liste s'affiche
// quand même (sans options de filtre).
onMounted(() => {
  exposantHandler
    .getAllByNom()
    .then((rows) => (exposants.value = toExposantCards(rows)))
    .catch(console.error)
  exposantHandler
    .getCategories()
    .then((values) => (categories.value = values))
    .catch(console.error)
})

const filters = computed<FilterConfig[]>(() => [
  {
    key: 'categorie',
    label: 'Catégorie',
    allLabel: 'Toutes les catégories',
    options: categories.value.map((categorie) => ({ value: categorie, label: categorie })),
  },
])

const router = useRouter()
const { categorie } = useRoute().query
const selected = ref<FilterValues>({ categorie: String(categorie ?? '') })

watch(selected, ({ categorie }) => {
  router.replace({ query: { categorie: categorie || undefined } })
})
</script>

<template>
  <main class="exposants">
    <Hero />
    <div class="exposants__content">
      <FilterableList v-model:selected="selected" :items="exposants" :filters="filters">
        <template #item="{ item }">
          <ContentCard
            :nom="item.nom"
            :photo="item.photo"
            :categorie="item.categorie"
            :on-click="() => router.push({ name: 'fiche', params: { type: 'exposant', id: item.id } })"
          />
        </template>
      </FilterableList>
    </div>
  </main>
</template>

<style scoped>
.exposants__content {
  padding: var(--space-5) var(--space-4) var(--space-10);
}

.exposants :deep(.filterable-list__items) {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-10) var(--space-8);
}

.exposants :deep(.content-card) {
  width: 100%;
}

@media (min-width: 640px) {
  .exposants :deep(.filterable-list__items) {
    grid-template-columns: repeat(2, 1fr);
    padding-bottom: var(--space-20);
  }
}

@media (min-width: 640px) and (max-width: 1024px) {
  .exposants :deep(.filterable-list__items > li:nth-child(2n)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1025px) {
  .exposants__content {
    padding: var(--space-5) var(--space-20) var(--space-10);
  }

  .exposants :deep(.filterable-list__items) {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1025px) and (max-width: 1439px) {
  .exposants :deep(.filterable-list__items > li:nth-child(3n + 2)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1440px) {
  .exposants :deep(.filterable-list__items) {
    grid-template-columns: repeat(4, 1fr);
  }

  .exposants :deep(.filterable-list__items > li:nth-child(4n + 2)),
  .exposants :deep(.filterable-list__items > li:nth-child(4n + 4)) {
    transform: translateY(var(--space-20));
  }
}
</style>
