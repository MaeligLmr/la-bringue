<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import Hero from '../components/layout/Hero.vue'
import Loader from '../components/ui/Loader.vue'
import { actualiteHandler } from '../handlers/actualite'
import { toActualiteCards } from '../lib/cards'
import { photoUrl } from '../lib/photo'
import type { ActualiteCard } from '../types/ui/actualites.ts'
import placeholderSvg from '../assets/card/placeholder.svg?raw'
import { useScrollReveal } from '../composables/useScrollReveal'

const props = defineProps<{ id: number }>()

const actualite = ref<ActualiteCard | null>(null)
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')

// Vue réutilisée si l'identifiant change : on ignore la réponse d'un
// chargement devenu obsolète.
let requestId = 0
watch(
  () => props.id,
  async (id) => {
    const current = ++requestId
    status.value = 'loading'
    try {
      const row = await actualiteHandler.getById(id)
      if (current !== requestId) return
      actualite.value = row ? toActualiteCards([row])[0] : null
      status.value = row ? 'ready' : 'not-found'
    } catch (error) {
      if (current !== requestId) return
      console.error(error)
      status.value = 'error'
      toast.error('Impossible de charger cette actualité.')
    }
  },
  { immediate: true }
)

// Sans photo en base, ou si le fichier est introuvable : placeholder.
const photoFailed = ref(false)
watch(() => actualite.value?.photo, () => (photoFailed.value = false))
const photoSrc = computed(() => {
  const photo = actualite.value?.photo
  return !photo || photoFailed.value ? null : photoUrl(photo)
})

// Apparition des titres, textes et cartes au défilement.
useScrollReveal()
</script>

<template>
  <main class="actualite">
    <Hero />
    <div class="actualite__content">
      <Loader v-if="status === 'loading'" />
      <p v-else-if="status === 'not-found'" class="actualite__message">Cette actualité n’existe pas.</p>
      <p v-else-if="status === 'error'" class="actualite__message">
        Impossible de charger cette actualité pour le moment.
      </p>

      <article v-else-if="actualite" class="actualite__article">
        <h1 class="actualite__titre">{{ actualite.nom }}</h1>
        <p v-if="actualite.date" class="actualite__date">{{ actualite.date }}</p>

        <div
          v-if="!photoSrc"
          class="actualite__photo actualite__placeholder"
          aria-hidden="true"
          v-html="placeholderSvg"
        />
        <img v-else :src="photoSrc" alt="" class="actualite__photo" @error="photoFailed = true" />

        <p v-if="actualite.description" class="actualite__texte">{{ actualite.description }}</p>
      </article>
    </div>
  </main>
</template>

<style scoped>
.actualite__content {
  padding: var(--space-10) var(--space-4);
}

.actualite__message {
  margin: 0;
  text-align: center;
}

.actualite__article {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 60rem;
  margin: 0 auto;
  color: var(--text-h);
}

.actualite__titre {
  margin: 0;
  font-family: var(--heading);
  font-size: var(--font-size-heading-2);
  line-height: var(--line-height-heading-2);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.actualite__date {
  margin: 0;
  font-family: var(--heading);
  font-size: var(--font-size-heading-3);
  line-height: var(--line-height-heading-3);
  text-transform: uppercase;
}

.actualite__photo {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
}

.actualite__placeholder {
  overflow: hidden;
  background: linear-gradient(135deg, var(--tag-pink-bright-background), var(--tag-violet-background));
  color: var(--tag-pink-bright-text);
}

/* SVG injecté via v-html : hors du scope, d'où :deep(). */
.actualite__placeholder :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.actualite__texte {
  margin: 0;
  white-space: pre-line;
}

@media (min-width: 1025px) {
  .actualite__content {
    padding: var(--space-20);
  }

  .actualite__titre {
    font-size: var(--font-size-heading-1);
    line-height: var(--line-height-heading-1);
  }
}
</style>
