<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Hero from '../components/layout/Hero.vue'
import FichePresentation from '../components/fiche/FichePresentation.vue'
import ContentCard from '../components/ui/ContentCard.vue'
import Loader from '../components/ui/Loader.vue'
import { loadFiche } from '../lib/fiche'
import type { FicheData, FicheType } from '../types/ui/fiche.ts'

const props = defineProps<{
  type: FicheType
  id: number
}>()

const router = useRouter()

const data = ref<FicheData | null>(null)
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')

// La vue est réutilisée quand on passe d'une fiche à une autre (clic sur une
// suggestion) : on recharge à chaque changement d'identifiant, en ignorant la
// réponse d'un chargement devenu obsolète entre-temps.
let requestId = 0
watch(
  () => [props.type, props.id] as const,
  async ([type, id]) => {
    const current = ++requestId
    status.value = 'loading'
    try {
      const result = await loadFiche(type, id)
      if (current !== requestId) return
      data.value = result
      status.value = result ? 'ready' : 'not-found'
    } catch (error) {
      if (current !== requestId) return
      console.error(error)
      status.value = 'error'
    }
  },
  { immediate: true }
)
</script>

<template>
  <main class="fiche-detail">
    <Hero />
    <div class="fiche-detail__content">
      <Loader v-if="status === 'loading'" />
      <p v-else-if="status === 'not-found'" class="fiche-detail__message">Cette fiche n’existe pas.</p>
      <p v-else-if="status === 'error'" class="fiche-detail__message">
        Impossible de charger cette fiche pour le moment.
      </p>

      <template v-else-if="data">
        <FichePresentation :fiche="data.fiche" />

        <section v-if="data.intervenantes.length" class="fiche-detail__intervenantes">
          <h2 class="fiche-detail__titre">Intervenantes</h2>
          <article v-for="intervenante in data.intervenantes" :key="intervenante.id" class="fiche-detail__intervenante">
            <h3>{{ intervenante.nom }}</h3>
            <p v-if="intervenante.description">{{ intervenante.description }}</p>
          </article>
        </section>

        <section v-if="data.suggestions.length" class="fiche-detail__suggestions">
          <h2 class="fiche-detail__titre">Ça peut aussi vous intéresser</h2>
          <ul class="fiche-detail__suggestions-list">
            <li v-for="suggestion in data.suggestions" :key="suggestion.id">
              <ContentCard
                :nom="suggestion.nom"
                :photo="suggestion.photo"
                :scene="suggestion.scene"
                :date="suggestion.date"
                :categorie="suggestion.categorie"
                :likable="!!suggestion.target"
                :target="suggestion.target"
                :on-click="() => router.push(suggestion.to)"
              />
            </li>
          </ul>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.fiche-detail__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  padding: var(--space-10) var(--space-4);
}

.fiche-detail__message {
  margin: 0;
  text-align: center;
}

.fiche-detail__titre {
  margin: 0;
  font-family: var(--heading);
  font-size: var(--font-size-heading-3);
  line-height: var(--line-height-heading-3);
  color: var(--text-h);
}

.fiche-detail__intervenantes {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.fiche-detail__intervenante h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-medium);
  color: var(--text-h);
}

.fiche-detail__intervenante p {
  margin: 0;
  white-space: pre-line;
}

.fiche-detail__suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Même grille que les pages liste. */
.fiche-detail__suggestions-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-10) var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fiche-detail__suggestions-list > li {
  display: flex;
  justify-content: center;
}

.fiche-detail__suggestions :deep(.content-card) {
  width: 100%;
}

@media (min-width: 640px) {
  .fiche-detail__suggestions-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .fiche-detail__content {
    padding: var(--space-20);
  }

  .fiche-detail__suggestions-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
