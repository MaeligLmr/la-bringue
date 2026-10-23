<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useTextSearch } from '../composables/useTextSearch'
import Hero from '../components/layout/Hero.vue'
import Icon from '../components/ui/Icon.vue'
import HighlightedText from '../components/ui/HighlightedText.vue'
import Loader from '../components/ui/Loader.vue'
import { infoPratiqueHandler } from '../handlers/info-pratique'
import { sectionAnchor } from '../lib/anchor'
import type { InfoPratique } from '../types/database/info-pratique'
import { useScrollReveal } from '../composables/useScrollReveal'

const LOAD_ERROR_MESSAGE = 'Impossible de charger les infos pratiques.'

// Déjà triées par id_info côté Supabase : l'ordre de la page est celui de la base.
const sections = ref<InfoPratique[]>([])
const loading = ref(true)
const failed = ref(false)

const route = useRoute()
const router = useRouter()
const mainEl = ref<HTMLElement | null>(null)

// --- Menu des sections -----------------------------------------------------

// Section actuellement à l'écran, mise en évidence dans le menu.
const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

function observeSections() {
  if (typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting)
      if (visible) activeId.value = visible.target.id
    },
    // Bande étroite sous la navbar : la section qui la traverse est l'active.
    { rootMargin: '-20% 0px -70% 0px' }
  )
  document.querySelectorAll('.infos-section').forEach((el) => observer?.observe(el))
}

// Défilement doux vers une section ; l'ancre est aussi posée dans l'URL pour
// pouvoir partager le lien.
function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  activeId.value = id
  router.replace({ hash: `#${id}` })
}

// --- Recherche dans la page (type Ctrl+F) ----------------------------------

// Voir composables/useTextSearch.ts : `query` est passée aux <HighlightedText>
// de la colonne de contenu (`mainEl`), qui surlignent les occurrences.
const { query, matchCount, currentMatch, isSearching, stepMatch, clearSearch } = useTextSearch(mainEl)

onMounted(async () => {
  try {
    sections.value = await infoPratiqueHandler.getAll()
  } catch (error) {
    console.error(error)
    failed.value = true
    toast.error(LOAD_ERROR_MESSAGE)
  } finally {
    loading.value = false
  }
  // Arrivée par un lien d'ancre (ex. tuile de l'accueil) : les sections
  // n'existent qu'une fois chargées, le navigateur ne peut donc pas défiler
  // tout seul jusqu'à elles.
  await nextTick()
  if (route.hash) document.getElementById(route.hash.slice(1))?.scrollIntoView()
  observeSections()
})

onBeforeUnmount(() => observer?.disconnect())

const anchor = sectionAnchor

// Apparition de chaque section au défilement (chargées après le montage : le
// composable les prend en compte quand elles arrivent).
useScrollReveal('.infos-section')
</script>

<template>
  <main class="infos-pratiques">
    <Hero />
    <div class="infos-pratiques__layout">
      <div ref="mainEl" class="infos-pratiques__content">
        <h1>Infos pratiques</h1>

        <Loader v-if="loading" />
        <p v-else-if="failed" class="infos-pratiques__erreur" role="alert">
          Impossible de charger les infos pratiques pour le moment. Réessayez dans quelques instants.
        </p>

        <template v-else>
        <section
          v-for="section in sections"
          :id="anchor(section.titre, section.id_info)"
          :key="section.id_info"
          class="infos-section"
          :aria-labelledby="`${anchor(section.titre, section.id_info)}-titre`"
        >
          <h2 :id="`${anchor(section.titre, section.id_info)}-titre`" class="infos-section__titre">
            <HighlightedText :text="section.titre" :query="query" />
          </h2>
          <p v-if="section.intro" class="infos-section__intro">
            <HighlightedText :text="section.intro" :query="query" />
          </p>

          <dl class="infos-section__points">
            <div v-for="point in section.points" :key="point.label" class="infos-section__point">
              <dt><HighlightedText :text="point.label" :query="query" /></dt>
              <dd><HighlightedText :text="point.detail" :query="query" /></dd>
            </div>
          </dl>
        </section>
        </template>
      </div>

      <!-- Ordinateur uniquement. Collé sous la navbar au défilement, mais
           démarre sous le hero (il fait partie du flux de la page). -->
      <aside v-if="!loading && !failed" class="infos-menu">
        <form class="infos-recherche" role="search" @submit.prevent="stepMatch(1)">
          <label class="infos-recherche__champ">
            <Icon name="search" size="small" />
            <input
              v-model="query"
              type="search"
              class="infos-recherche__input"
              placeholder="Rechercher dans la page"
              aria-label="Rechercher dans la page"
              @keydown.esc="clearSearch"
              @keydown.enter.prevent="stepMatch($event.shiftKey ? -1 : 1)"
            />
            <button v-if="query" type="button" class="infos-recherche__icone infos-recherche__icone--effacer" aria-label="Effacer la recherche" @click="clearSearch">
              <Icon name="plus" size="small" />
            </button>
          </label>

          <p v-if="isSearching" class="infos-recherche__resultat" aria-live="polite">
            <template v-if="matchCount">
              <span class="infos-recherche__compteur">{{ currentMatch }} / {{ matchCount }}</span>
              <button type="button" class="infos-recherche__icone infos-recherche__icone--haut" aria-label="Résultat précédent" @click="stepMatch(-1)">
                <Icon name="chevron-down" size="small" />
              </button>
              <button type="button" class="infos-recherche__icone" aria-label="Résultat suivant" @click="stepMatch(1)">
                <Icon name="chevron-down" size="small" />
              </button>
            </template>
            <template v-else>Aucun résultat</template>
          </p>
        </form>

        <nav class="infos-menu__liens" aria-label="Sections de la page">
          <a
            v-for="section in sections"
            :key="section.id_info"
            :href="`#${anchor(section.titre, section.id_info)}`"
            class="infos-menu__lien"
            :class="{ 'infos-menu__lien--actif': activeId === anchor(section.titre, section.id_info) }"
            :aria-current="activeId === anchor(section.titre, section.id_info) ? 'true' : undefined"
            @click.prevent="goTo(anchor(section.titre, section.id_info))"
          >
            {{ section.titre }}
          </a>
        </nav>
      </aside>
    </div>
  </main>
</template>

<style scoped>
/* Colonne centrale de 48rem, menu dans la colonne de droite (ordinateur). */
.infos-pratiques__layout {
  display: grid;
  grid-template-columns: 1fr;
  padding: var(--space-8) var(--space-4) var(--space-20);
}

.infos-pratiques__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  min-width: 0;
}

.infos-pratiques__content h1 {
  margin: 0;
}

.infos-pratiques__erreur {
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-medium);
  background: var(--alert-danger-background);
  color: var(--alert-danger-text);
}

/* Une section = un titre, une phrase d'intro, puis des lignes libellé / détail. */
.infos-section {
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
  /* Laisse la place à la navbar fixe quand on défile jusqu'à la section. */
  scroll-margin-top: calc(var(--navbar-height, 4rem) + var(--space-4));
}

.infos-section__titre {
  margin: 0;
}

.infos-section__intro {
  margin: var(--space-2) 0 0;
}

.infos-section__points {
  margin: var(--space-4) 0 0;
}

.infos-section__point {
  display: grid;
  grid-template-columns: 11rem 1fr;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.infos-section__point:last-child {
  border-bottom: 0;
}

.infos-section__point dt {
  font-weight: var(--font-weight-medium);
  color: var(--text-h);
}

.infos-section__point dd {
  margin: 0;
}

@media (max-width: 36rem) {
  .infos-section__point {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}

/* Menu + recherche : masqués hors ordinateur. */
.infos-menu {
  display: none;
}

@media (min-width: 70rem) {
  .infos-pratiques__layout {
    grid-template-columns: 1fr minmax(0, 48rem) 1fr;
  }

  .infos-pratiques__content {
    grid-column: 2;
    grid-row: 1;
  }

  .infos-menu {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
    align-self: start;
    width: 16rem;
    /* sticky : démarre à sa place sous le hero, puis reste collé sous la
       navbar fixe pendant le défilement (sans jamais recouvrir le hero). */
    position: sticky;
    top: calc(var(--navbar-height, 4rem) + var(--space-4));
    padding: var(--space-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-medium);
    background: var(--bg);
    box-shadow: 0 0.25rem 1rem var(--card-shadow-color);
  }
}

.infos-recherche {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* Même champ que la recherche des listes (FilterableList). */
.infos-recherche__champ {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--select-trigger-border);
  border-radius: var(--radius-medium);
  color: var(--select-trigger-text);
}

.infos-recherche__champ:focus-within {
  box-shadow: 0 0 0 3px var(--select-trigger-focus-ring);
}

.infos-recherche__input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1;
}

/* Croix native du champ type=search remplacée par la nôtre. */
.infos-recherche__input::-webkit-search-cancel-button {
  display: none;
}

.infos-recherche__resultat {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  padding: 0 var(--space-1);
  color: var(--text);
  font-size: 0.875rem;
}

.infos-recherche__compteur {
  margin-right: auto;
}

.infos-recherche__icone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border: none;
  border-radius: var(--radius-small);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.infos-recherche__icone:hover,
.infos-recherche__icone:focus-visible {
  background: var(--tag-pink-background);
  color: var(--tag-pink-text);
}

/* Chevron vers le haut = chevron-down retourné ; croix = plus tourné. */
.infos-recherche__icone--haut {
  transform: rotate(180deg);
}

.infos-recherche__icone--effacer {
  transform: rotate(45deg);
}

.infos-menu__liens {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.infos-menu__lien {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-medium);
  color: var(--text-h);
  text-decoration: none;
}

.infos-menu__lien:hover,
.infos-menu__lien:focus-visible {
  background: var(--tag-pink-background);
  color: var(--tag-pink-text);
}

.infos-menu__lien--actif {
  background: var(--tag-pink-background);
  color: var(--tag-pink-text);
  font-weight: var(--font-weight-medium);
}
</style>
