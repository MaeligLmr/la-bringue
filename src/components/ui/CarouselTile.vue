<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from './Button.vue'
import type { IconName } from '../../types/icon'
import type { CarouselTileVariant } from '../../types/carousel-tile'
import carrouselTileBg from '../../assets/carrousel-tile/carrousel-tile-bg.png'

const props = withDefaults(
  defineProps<{
    title: string
    /** Petite description affichée sous le titre. */
    content: string
    /** Option d'affichage purement esthétique (voir Figma "Carrousel Tile"). */
    variant?: CarouselTileVariant
    /** Icône affichée dans le CTA — n'apparaît que si `ctaLabel` et `to` sont fournis. */
    icon?: IconName
    /** Libellé du bouton d'appel à l'action. Sans lui (ou sans `to`), aucun CTA n'est rendu. */
    ctaLabel?: string
    /** Route vers laquelle le CTA navigue. */
    to?: string
  }>(),
  {
    variant: 'pink',
  }
)

const router = useRouter()

function handleCtaClick() {
  if (props.to) router.push(props.to)
}

// L'URL de l'image doit rester un style inline (et non v-bind() dans
// <style>, qui produit url(var(--x)) : lightningcss refuse ça à la
// minification en build de prod — voir Footer.vue/Hero.vue).
const patternStyle = {
  backgroundImage: `url(${carrouselTileBg})`,
}
</script>

<template>
  <article class="carousel-tile shadow" :class="`carousel-tile--${variant}`">
    <div class="carousel-tile__pattern" :style="patternStyle" aria-hidden="true" />

    <div class="carousel-tile__content">
      <h3 class="carousel-tile__title">{{ title }}</h3>
      <p class="carousel-tile__description">{{ content }}</p>

      <Button
        v-if="ctaLabel && to"
        :color="variant === 'blue' ? 'info' : 'primary'"
        variant="full"
        :icon-right="icon"
        class="carousel-tile__cta"
        @click="handleCtaClick"
      >
        {{ ctaLabel }}
      </Button>
    </div>
  </article>
</template>

<style scoped>
.carousel-tile {
  position: relative;
  overflow: hidden;
  /* Largeur fixe : la tile garde sa taille de carte dans un carrousel
     plutôt que de s'étirer à la largeur de son conteneur. */
  width: 16rem;
  box-sizing: border-box;
  border-radius: var(--carrousel-tile-radius);
  padding: var(--carrousel-tile-padding-y) var(--carrousel-tile-padding-x);
  text-align: center;
}

.carousel-tile--pink {
  background-color: var(--carrousel-tile-pink-background);
  color: var(--carrousel-tile-pink-text);
}

.carousel-tile--blue {
  background-color: var(--carrousel-tile-blue-background);
  color: var(--carrousel-tile-blue-text);
}

/* Calque "Image" à 40% d'opacité au-dessus du fond plat (voir Figma) : une
   seule image décorative en cover, pas un motif carrelé comme le Footer. */
.carousel-tile__pattern {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.4;
  pointer-events: none;
}

.carousel-tile__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.carousel-tile__title {
  margin: 0;
}

.carousel-tile__description {
  margin: 0;
}

.carousel-tile__cta {
  margin-top: var(--space-2);
}
</style>
