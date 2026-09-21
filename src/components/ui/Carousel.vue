<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Button from './Button.vue'
import CarouselTile from './CarouselTile.vue'
import type { CarouselTileData } from '../../types/carousel-tile'

defineProps<{
  tiles: CarouselTileData[]
}>()

const trackEl = ref<HTMLElement | null>(null)
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
let resizeObserver: ResizeObserver | null = null

function updateScrollState() {
  const el = trackEl.value
  if (!el) return
  canScrollPrev.value = el.scrollLeft > 0
  // -1px de marge : l'arrondi sub-pixel de scrollLeft/clientWidth peut
  // laisser un résidu une fois vraiment scrollé à fond selon le navigateur.
  canScrollNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollByPage(direction: 1 | -1) {
  const el = trackEl.value
  if (!el) return
  el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  if (typeof ResizeObserver === 'undefined' || !trackEl.value) return
  // Recalcule si le nombre de tiles visibles change (redimensionnement de
  // fenêtre, rotation d'écran...), pas seulement au scroll.
  resizeObserver = new ResizeObserver(updateScrollState)
  resizeObserver.observe(trackEl.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="carousel">
    <!-- v-if (et non juste masqué/disabled) : le critère d'acceptation
         demande explicitement l'absence de flèches inutiles, pas une
         flèche visible mais désactivée. -->
    <Button
      v-if="canScrollPrev"
      class="carousel__arrow carousel__arrow--prev"
      color="primary"
      variant="full"
      icon-only="arrow-left"
      label="Précédent"
      @click="scrollByPage(-1)"
    />

    <div ref="trackEl" class="carousel__track" @scroll="updateScrollState">
      <div v-for="(tile, index) in tiles" :key="index" class="carousel__item">
        <CarouselTile
          :title="tile.title"
          :content="tile.content"
          :variant="tile.variant"
          :icon="tile.icon"
          :cta-label="tile.ctaLabel"
          :to="tile.to"
        />
      </div>
    </div>

    <Button
      v-if="canScrollNext"
      class="carousel__arrow carousel__arrow--next"
      color="primary"
      variant="full"
      icon-only="arrow-right"
      label="Suivant"
      @click="scrollByPage(1)"
    />
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
}

.carousel__track {
  display: flex;
  /* Mobile first : colonne empilée (voir Figma, viewport "Phone"), pas de
     scroll horizontal ni de flèches — juste le flux normal de la page. Le
     scroll/snap horizontal n'est activé qu'en desktop (voir @media). */
  flex-direction: column;
  align-items: center;
  gap: var(--carrousel-gap);
  padding: var(--carrousel-padding-y) var(--carrousel-padding-x);
}

.carousel__item {
  /* flex: none : garde la largeur fixe de CarouselTile (16rem), ne la
     laisse ni s'étirer ni se réduire. */
  flex: none;
}

.carousel__arrow {
  display: none;
}

@media (min-width: 1025px) {
  .carousel__track {
    flex-direction: row;
    align-items: stretch;
    /* Centre les tiles quand elles tiennent déjà dans le viewport (cas
       courant : 3 tiles par section) plutôt que les coller à gauche —
       reste sans effet une fois le contenu scrollable (overflow-x: auto
       ci-dessous prime alors sur le centrage). */
    justify-content: center;
    /* Doit refléter le padding-inline ci-dessus : sans ça, le point
       d'ancrage du scroll-snap ignore le padding du conteneur et certains
       navigateurs "reposent" la position initiale sur scrollLeft ≈ padding
       au lieu de 0, ce qui rendait la flèche "précédent" visible dès le
       premier rendu. */
    scroll-padding-inline: var(--carrousel-padding-x);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    /* Scrollbar masquée : les flèches (voir ci-dessous) suffisent comme
       affordance de navigation en desktop. */
    scrollbar-width: none;
  }

  .carousel__track::-webkit-scrollbar {
    display: none;
  }

  .carousel__item {
    scroll-snap-align: start;
  }

  .carousel__arrow {
    display: inline-flex;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
  }

  .carousel__arrow--prev {
    left: var(--space-2);
  }

  .carousel__arrow--next {
    right: var(--space-2);
  }
}
</style>
