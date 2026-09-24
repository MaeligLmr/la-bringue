<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
import Carousel from '../components/ui/Carousel.vue'
import ProgrammationSection from '../components/home/ProgrammationSection.vue'
import type { CarouselTileData, CarouselTileVariant } from '../types/carousel-tile'
import programmationData from '../data/programmation.json'
import billetterieData from '../data/billetterie.json'
import infosPratiquesData from '../data/infos-pratiques.json'
import actualitesData from '../data/actualites.json'

interface HomeTileSource {
  titre: string
  description: string
}

// L'alternance pink/blue est purement esthétique (voir CarouselTileVariant) :
// elle ne fait pas partie des données métier des fichiers JSON. `start`
// permet d'inverser l'ordre d'une section à l'autre (voir Figma).
function alternateVariant(index: number, start: CarouselTileVariant = 'pink'): CarouselTileVariant {
  const sequence: CarouselTileVariant[] = start === 'pink' ? ['pink', 'blue'] : ['blue', 'pink']
  return sequence[index % 2]
}

function toTiles(
  items: HomeTileSource[],
  ctaLabel: string,
  to: string,
  icon: CarouselTileData['icon'],
  startVariant: CarouselTileVariant = 'pink'
): CarouselTileData[] {
  return items.map((item, index) => ({
    title: item.titre,
    content: item.description,
    variant: alternateVariant(index, startVariant),
    ctaLabel,
    to,
    icon,
  }))
}

const billetterieTiles = toTiles(billetterieData, 'Acheter', '/billetterie', 'ticket')
const infosPratiquesTiles = toTiles(
  infosPratiquesData,
  'En savoir plus',
  '/infos-pratiques',
  'arrow-right',
  'blue'
)
const actualitesTiles = toTiles(actualitesData, 'En savoir plus', '/actualites', 'arrow-right')
</script>

<template>
  <main class="home">
    <Hero home-page />

    <section class="home__section">
      <h2>Programmation</h2>
      <ProgrammationSection :artistes="programmationData" />
    </section>

    <section class="home__section">
      <h2>Billetterie</h2>
      <Carousel :tiles="billetterieTiles" />
    </section>

    <section class="home__section">
      <h2>Infos pratiques</h2>
      <Carousel :tiles="infosPratiquesTiles" />
    </section>

    <section class="home__section">
      <h2>Actualités</h2>
      <Carousel :tiles="actualitesTiles" />
    </section>
  </main>
</template>

<style scoped>
.home__section {
  padding: var(--space-8) 0;
  text-align: center;
}

.home__section h2 {
  margin: 0 0 var(--space-4);
}
</style>
