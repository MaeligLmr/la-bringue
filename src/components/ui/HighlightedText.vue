<script setup lang="ts">
import { computed } from 'vue'
import { splitMatches } from '../../lib/highlight'

// Affiche `text` en surlignant les occurrences de `query` (le découpage est
// fait par splitMatches, voir lib/highlight.ts). Sans `query`, le texte
// s'affiche tel quel.
//
// Contrat avec la page qui parcourt les résultats :
// - chaque correspondance est un <mark class="highlighted-text__match"> : c'est
//   ce sélecteur que la page utilise pour les compter et défiler jusqu'à elles ;
// - la page pose elle-même `highlighted-text__match--current` sur le résultat
//   actif (style plus marqué ci-dessous). Cette classe est ajoutée à la main
//   sur le DOM : elle disparaît si Vue recrée le <mark>, d'où le recalcul de la
//   page à chaque changement de recherche.
const props = defineProps<{ text: string | null | undefined; query?: string }>()

const segments = computed(() => splitMatches(props.text, props.query ?? ''))
</script>

<!-- Fragment sans élément racine : le texte reste directement dans le parent
     (titre, paragraphe, <dt>…), sans <span> supplémentaire. -->
<template>
  <template v-for="(segment, index) in segments" :key="index">
    <mark v-if="segment.match" class="highlighted-text__match">{{ segment.text }}</mark>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>

<style scoped>
/* Toutes les correspondances. */
.highlighted-text__match {
  border-radius: var(--radius-small);
  background: var(--tag-pink-bright-background);
  color: var(--tag-pink-bright-text);
}

/* Le résultat sélectionné (flèches / Entrée), plus contrasté que les autres. */
.highlighted-text__match--current {
  background: var(--accent);
  color: var(--bg);
}
</style>
