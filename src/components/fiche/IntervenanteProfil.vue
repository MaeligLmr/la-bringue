<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { photoUrl } from '../../lib/photo'
import type { FicheIntervenante } from '../../types/ui/fiche'
import placeholder from '../../assets/conferenciere/placeholder.jpg'

// Mini-profil d'une conférencière sur la fiche conférence : photo, nom, bio.
// Pas de lien : les conférencières n'ont pas de page individuelle.
const props = defineProps<{ intervenante: FicheIntervenante }>()

// Sans photo en base, ou si le fichier est introuvable : portrait générique.
const photoFailed = ref(false)
watch(() => props.intervenante.photo, () => (photoFailed.value = false))
const photoSrc = computed(() =>
  !props.intervenante.photo || photoFailed.value ? placeholder : photoUrl(props.intervenante.photo)
)
</script>

<template>
  <article class="intervenante-profil">
    <img :src="photoSrc" alt="" class="intervenante-profil__photo" @error="photoFailed = true" />

    <div class="intervenante-profil__texte">
      <h3 class="intervenante-profil__nom">{{ intervenante.nom }}</h3>
      <p v-if="intervenante.description" class="intervenante-profil__bio">{{ intervenante.description }}</p>
    </div>
  </article>
</template>

<style scoped>
.intervenante-profil {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.intervenante-profil__photo {
  display: block;
  width: 100%;
  max-width: 14rem;
  aspect-ratio: 1;
  object-fit: cover;
}

.intervenante-profil__nom {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-medium);
  color: var(--text-h);
}

.intervenante-profil__bio {
  margin: 0;
  white-space: pre-line;
}

/* Photo à côté du texte, en alternant gauche / droite (voir maquette). */
@media (min-width: 640px) {
  .intervenante-profil {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-8);
  }

  .intervenante-profil__photo {
    flex: 0 0 12rem;
  }

  .intervenante-profil__texte {
    flex: 1;
    min-width: 0;
  }
}
</style>
