<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import Hero from '../components/layout/Hero.vue'
import BilletterieCard from '../components/billetterie/BilletterieCard.vue'
import Carousel from '../components/ui/Carousel.vue'
import Loader from '../components/ui/Loader.vue'
import ProgrammationSection from '../components/home/ProgrammationSection.vue'
import type { CarouselTileData, CarouselTileVariant } from '../types/ui/carousel-tile.ts'
import { actualiteHandler } from '../handlers/actualite'
import { formuleHandler } from '../handlers/formule'
import { infoPratiqueHandler } from '../handlers/info-pratique'
import { sectionAnchor } from '../lib/anchor'
import { openBilletterie, toFormuleCards } from '../lib/billetterie'
import type { FormuleCard } from '../types/ui/billetterie'

interface HomeTileSource {
  titre: string | null
  description: string | null
  // Lien propre à la tuile ; à défaut, celui de la section (`to` de toTiles).
  to?: string
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
    to: item.to ?? to,
    icon,
  }))
}

const formules = ref<FormuleCard[]>([])
const infosPratiquesTiles = ref<CarouselTileData[]>([])
const actualitesTiles = ref<CarouselTileData[]>([])
const formulesLoading = ref(true)
const infosPratiquesLoading = ref(true)
const actualitesLoading = ref(true)

// Chaque section se charge indépendamment : une table en erreur ne vide pas les autres.
async function load<T>(
  target: Ref<T[]>,
  loading: Ref<boolean>,
  fetchTiles: () => Promise<T[]>,
  errorMessage: string
) {
  try {
    target.value = await fetchTiles()
  } catch (error) {
    console.error(error)
    toast.error(errorMessage)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load(
    formules,
    formulesLoading,
    async () => toFormuleCards(await formuleHandler.getAllHomepage()),
    'Impossible de charger la billetterie.'
  )
  load(
    infosPratiquesTiles,
    infosPratiquesLoading,
    async () =>
      toTiles(
        (await infoPratiqueHandler.getAllHomepage()).map(({ id_info, titre, intro }) => ({
          titre,
          description: intro,
          to: `/infos-pratiques#${sectionAnchor(titre, id_info)}`,
        })),
        'En savoir plus',
        '/infos-pratiques',
        'arrow-right',
        'blue'
      ),
    'Impossible de charger les infos pratiques.'
  )
  load(
    actualitesTiles,
    actualitesLoading,
    async () =>
      toTiles(
        (await actualiteHandler.getLatest(3)).map(({ id_actualite, titre, description }) => ({
          titre,
          description,
          to: `/actualites/${id_actualite}`,
        })),
        'En savoir plus',
        '/actualites',
        'arrow-right'
      ),
    'Impossible de charger les actualités.'
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
      <Loader v-if="formulesLoading" />
      <Carousel v-else :tiles="formules">
        <template #tile="{ tile }">
          <div class="home__formule">
            <BilletterieCard :formule="tile" @buy="openBilletterie(tile)" />
          </div>
        </template>
      </Carousel>
    </section>

    <section class="home__section">
      <h2>Infos pratiques</h2>
      <Loader v-if="infosPratiquesLoading" />
      <Carousel v-else :tiles="infosPratiquesTiles" />
    </section>

    <section class="home__section">
      <h2>Actualités</h2>
      <Loader v-if="actualitesLoading" />
      <Carousel v-else :tiles="actualitesTiles" />
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

/* Loader des sections : même fond que les cards. */
.home__section :deep(.loader) {
  margin: 0 var(--space-4);
  border-radius: var(--card-radius);
  background-color: var(--card-background);
}

/* Largeur de carte fixe dans le carrousel, comme les tuiles : toutes de même
   taille, et la carte remplit la hauteur de la rangée. */
.home__formule {
  display: flex;
  width: 16rem;
  height: 100%;
  text-align: left;
}
</style>
