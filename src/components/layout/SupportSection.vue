<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'
import radioNovaBlanc from '../../assets/sponsor/sponsor1.png'
import radioNovaNoir from '../../assets/sponsor/sponsor1-noir.png'
import reporterre from '../../assets/sponsor/sponsor2.png'
import theSimones from '../../assets/sponsor/sponsor3.png'

const { resolvedTheme } = useTheme()

// Le logo Radio Nova est monochrome sur fond transparent : version noire en
// thème clair, blanche en thème sombre. Les deux autres ont un fond blanc
// intégré, lisible dans les deux thèmes.
const sponsors = computed(() => [
  { nom: 'Radio Nova', logo: resolvedTheme.value === 'dark' ? radioNovaBlanc : radioNovaNoir, url: 'https://www.nova.fr' },
  { nom: 'Reporterre', logo: reporterre, url: 'https://reporterre.net' },
  { nom: 'The Simones', logo: theSimones, url: 'https://the-simones.com' },
])
</script>

<template>
  <section class="support" aria-label="Nos sponsors">
    <a
      v-for="sponsor in sponsors"
      :key="sponsor.nom"
      :href="sponsor.url"
      target="_blank"
      rel="noopener noreferrer"
      class="support__link"
    >
      <img :src="sponsor.logo" :alt="`${sponsor.nom} (nouvel onglet)`" class="support__logo" />
    </a>
  </section>
</template>

<style scoped>
.support {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-10) var(--space-4);
}

.support__link {
  display: block;
  border-radius: var(--radius-small);
  transition: opacity 0.2s;
}

.support__link:hover {
  opacity: 0.75;
}

.support__logo {
  display: block;
  height: 4rem;
  max-width: 10rem;
  object-fit: contain;
}
</style>
