<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBreadcrumbTitle } from '../../../composables/useBreadcrumbTitle/useBreadcrumbTitle'

interface Crumb {
  label: string
  to?: string
}

const route = useRoute()
const { breadcrumbTitle } = useBreadcrumbTitle()

const TITLES: Record<string, string> = {
  profil: 'Mon profil',
  programmation: 'Programmation',
  billetterie: 'Billetterie',
  'mon-programme': 'Mon programme',
  exposants: 'Exposants',
  conferences: 'Conférences',
  'a-propos': 'À propos',
  'infos-pratiques': 'Infos pratiques',
  actualites: 'Actualités',
}

// Page liste d'où l'on vient pour chaque type de fiche.
const FICHE_PARENTS: Record<string, Crumb> = {
  artiste: { label: 'Programmation', to: '/programmation' },
  conference: { label: 'Conférences', to: '/conferences' },
  exposant: { label: 'Exposants', to: '/exposants' },
}

const crumbs = computed<Crumb[]>(() => {
  const name = String(route.name ?? '')
  if (!name || name === 'home') return []

  const home: Crumb = { label: 'Accueil', to: '/' }
  if (name === 'actualite') {
    return [home, { label: 'Actualités', to: '/actualites' }, { label: 'Article' }]
  }
  if (name === 'fiche') {
    const parent = FICHE_PARENTS[String(route.params.type)]
    return [home, ...(parent ? [parent] : []), { label: breadcrumbTitle.value ?? '…' }]
  }
  return [home, { label: TITLES[name] ?? name }]
})
</script>

<template>
  <nav v-if="crumbs.length" class="breadcrumb" aria-label="Fil d'Ariane">
    <ol class="breadcrumb__list">
      <li v-for="(crumb, index) in crumbs" :key="index" class="breadcrumb__item">
        <RouterLink v-if="crumb.to" :to="crumb.to" class="breadcrumb__link">{{ crumb.label }}</RouterLink>
        <span v-else class="breadcrumb__current" aria-current="page">{{ crumb.label }}</span>
        <span v-if="index < crumbs.length - 1" class="breadcrumb__sep" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  padding: var(--space-4) 5% 0;
  font-size: var(--font-size-small);
  color: var(--hero-section-text);
}

.breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumb__item {
  display: inline-flex;
  gap: var(--space-2);
}

.breadcrumb__link {
  color: inherit;
  text-decoration: none;
}

.breadcrumb__link:hover {
  text-decoration: underline;
}

.breadcrumb__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.breadcrumb__current {
  font-weight: 600;
}

.breadcrumb__sep {
  opacity: 0.6;
}
</style>
