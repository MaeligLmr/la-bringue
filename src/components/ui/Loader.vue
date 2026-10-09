<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'
// L'étoile qui suit « LA BRINGUE » dans le logo de la navbar (mêmes couleurs
// de dégradé et de contour que src/assets/logo/Logo-{Light,Dark}.svg),
// redessinée en étoile régulière centrée sur (0, 0) : celle du logo est
// étirée en hauteur et semblait tanguer en tournant.
import etoileLight from '../../assets/loader/etoile-light.svg'
import etoileDark from '../../assets/loader/etoile-dark.svg'

withDefaults(defineProps<{ label?: string }>(), { label: 'Chargement…' })

const { resolvedTheme } = useTheme()
const etoile = computed(() => (resolvedTheme.value === 'dark' ? etoileDark : etoileLight))
</script>

<template>
  <div class="loader" role="status">
    <img :src="etoile" alt="" aria-hidden="true" class="loader__etoile" />
    <span class="loader__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.loader {
  display: flex;
  justify-content: center;
  padding: var(--space-10) 0;
}

.loader__etoile {
  width: 4rem;
  height: 4rem;
  animation: loader-tourne 0.7s linear infinite;
}

/* Texte lu par les lecteurs d'écran uniquement. */
.loader__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes loader-tourne {
  to {
    transform: rotate(360deg);
  }
}

/* Mouvement réduit : l'étoile pulse doucement au lieu de tourner. */
@media (prefers-reduced-motion: reduce) {
  .loader__etoile {
    animation: loader-pulse 1.6s ease-in-out infinite alternate;
  }
}

@keyframes loader-pulse {
  from {
    opacity: 0.4;
  }
  to {
    opacity: 1;
  }
}
</style>
