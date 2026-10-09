<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'
import Hero from '../components/layout/Hero.vue'
import Carousel from '../components/ui/Carousel.vue'
import ProgrammationSection from '../components/home/ProgrammationSection.vue'
import type { CarouselTileData, CarouselTileVariant } from '../types/ui/carousel-tile.ts'
import { actualiteHandler } from '../handlers/actualite'
import { formuleHandler } from '../handlers/formule'
import { infoPratiqueHandler } from '../handlers/info-pratique'

interface HomeTileSource {
  titre: string | null
  description: string | null
}

// L'alternance pink/blue est purement esthétique (voir CarouselTileVariant) :
// elle ne fait pas partie des données métier venant de Supabase. `start`
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
    title: item.titre ?? '',
    content: item.description ?? '',
    variant: alternateVariant(index, startVariant),
    ctaLabel,
    to,
    icon,
  }))
}

const billetterieTiles = ref<CarouselTileData[]>([])
const infosPratiquesTiles = ref<CarouselTileData[]>([])
const actualitesTiles = ref<CarouselTileData[]>([])

// Chaque section se charge indépendamment : une table en erreur ne vide pas les autres.
async function load(target: Ref<CarouselTileData[]>, fetchTiles: () => Promise<CarouselTileData[]>) {
  try {
    target.value = await fetchTiles()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  load(billetterieTiles, async () => toTiles(await formuleHandler.getAll(), 'Acheter', '/billetterie', 'ticket'))
  load(infosPratiquesTiles, async () =>
    toTiles(await infoPratiqueHandler.getAll(), 'En savoir plus', '/infos-pratiques', 'arrow-right', 'blue')
  )
  load(actualitesTiles, async () =>
    toTiles(await actualiteHandler.getLatest(), 'En savoir plus', '/actualites', 'arrow-right')
  )
})
</script>

<template>
  <main class="home">
    <Hero home-page />

    <section class="home__section">
      <h2>Programmation</h2>
      <ProgrammationSection />
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
