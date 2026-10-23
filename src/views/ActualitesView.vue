<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Hero from '../components/layout/Hero.vue'
import FilterableList from '../components/ui/FilterableList.vue'
import ContentCard from '../components/ui/ContentCard.vue'
import Loader from '../components/ui/Loader.vue'
import type { ActualiteCard } from '../types/ui/actualites.ts'
import { actualiteHandler } from '../handlers/actualite'
import { toActualiteCards } from '../lib/cards'

// Déjà triées de la plus récente à la plus ancienne côté Supabase.
const actualites = ref<ActualiteCard[]>([])
const loading = ref(true)
const router = useRouter()

onMounted(async () => {
  try {
    actualites.value = toActualiteCards(await actualiteHandler.getLatest())
  } catch (error) {
    console.error(error)
    toast.error('Impossible de charger les actualités.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="actualites">
    <Hero />
    <div class="actualites__content">
      <h1>Actualités</h1>
      <Loader v-if="loading" />
      <FilterableList v-else :items="actualites" search-placeholder="Rechercher une actualité">
        <template #item="{ item }">
          <ContentCard
            :nom="item.nom"
            :photo="item.photo"
            :date="item.date"
            :description="item.description"
            :on-click="() => router.push({ name: 'actualite', params: { id: item.id } })"
          />
        </template>
      </FilterableList>
    </div>
  </main>
</template>

<style scoped>
.actualites__content {
  padding: var(--space-5) var(--space-4) var(--space-10);
}

.actualites :deep(.filterable-list__items) {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-10) var(--space-8);
}

.actualites :deep(.content-card) {
  width: 100%;
  height: 100%;
}

/* Photos alignées en bas, quelle que soit la longueur du texte ; les titres
   restent en haut (la carte les aligne en bas par défaut). */
.actualites :deep(.content-card__informations) {
  flex: 1;
  align-items: flex-start;
}

.actualites :deep(.content-card__nom) {
  min-height: 0;
}

/* Décalage une colonne sur deux, comme les autres listes (voir Exposants). */
@media (min-width: 640px) {
  .actualites :deep(.filterable-list__items) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-bottom: var(--space-20);
  }
}

@media (min-width: 640px) and (max-width: 1024px) {
  .actualites :deep(.filterable-list__items > li:nth-child(2n)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1025px) {
  .actualites__content {
    padding: var(--space-5) var(--space-20) var(--space-10);
  }

  .actualites :deep(.filterable-list__items) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1025px) and (max-width: 1439px) {
  .actualites :deep(.filterable-list__items > li:nth-child(3n + 2)) {
    transform: translateY(var(--space-20));
  }
}

@media (min-width: 1440px) {
  .actualites :deep(.filterable-list__items) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .actualites :deep(.filterable-list__items > li:nth-child(4n + 2)),
  .actualites :deep(.filterable-list__items > li:nth-child(4n + 4)) {
    transform: translateY(var(--space-20));
  }
}
</style>
