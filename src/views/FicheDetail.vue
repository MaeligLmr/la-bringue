<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Hero from '../components/layout/Hero.vue'
import FichePresentation from '../components/fiche/FichePresentation.vue'
import IntervenanteProfil from '../components/fiche/IntervenanteProfil.vue'
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
          <IntervenanteProfil
            v-for="intervenante in data.intervenantes"
            :key="intervenante.id"
            :intervenante="intervenante"
          />
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
  gap: var(--space-10);
}

/* Une conférencière sur deux : photo à droite (voir maquette). */
@media (min-width: 640px) {
  .fiche-detail__intervenantes :deep(.intervenante-profil:nth-of-type(even)) {
    flex-direction: row-reverse;
  }
}

.fiche-detail__suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.fiche-detail__suggestions .fiche-detail__titre {
  text-align: center;
}

/* Rangée centrée (et non une grille) : une ou deux suggestions restent au
   milieu au lieu de se caler dans les premières colonnes. Les cartes
   gardent la largeur max de ContentCard. */
.fiche-detail__suggestions-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-10) var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.fiche-detail__suggestions-list > li {
  display: flex;
  flex: 0 1 18rem;
}

.fiche-detail__suggestions :deep(.content-card) {
  width: 100%;
}

@media (min-width: 1025px) {
  .fiche-detail__content {
    padding: var(--space-20);
  }
}
</style>
