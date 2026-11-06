<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../../composables/useAuth/useAuth'
import { useTheme } from '../../../composables/useTheme/useTheme'
import { ADMIN_SECTIONS } from '../../../lib/admin-sections/admin-sections'
import logoLight from '../../../assets/logo/Logo-Light.svg'
import logoDark from '../../../assets/logo/Logo-Dark.svg'

const router = useRouter()
const { isAdmin } = useAuth()
const { resolvedTheme } = useTheme()

const logoSrc = computed(() => (resolvedTheme.value === 'dark' ? logoDark : logoLight))

// La garde du router ne s'exécute qu'à la navigation : une déconnexion
// (ici ou dans un autre onglet) depuis le back office renvoie aussi à la home.
watch(isAdmin, (admin) => {
  if (!admin) router.replace({ name: 'home' })
})
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar">
      <RouterLink to="/" class="admin-layout__logo" aria-label="Retour au site">
        <img :src="logoSrc" alt="La Bringue" />
      </RouterLink>

      <nav class="admin-layout__nav" aria-label="Back office">
        <RouterLink
          v-for="section in ADMIN_SECTIONS"
          :key="section.name"
          :to="{ name: section.name }"
          class="admin-layout__link"
          active-class="admin-layout__link--active"
        >
          {{ section.label }}
        </RouterLink>
      </nav>

      <RouterLink to="/profil" class="admin-layout__back">Retour au site</RouterLink>
    </aside>

    <main class="admin-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.admin-layout__sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.admin-layout__logo img {
  display: block;
  height: 1.75rem;
  width: auto;
}

.admin-layout__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.admin-layout__link,
.admin-layout__back {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-medium);
  color: var(--text-h);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.admin-layout__link:hover,
.admin-layout__back:hover {
  background: var(--accent-bg);
}

.admin-layout__link--active {
  background: var(--accent-bg);
  color: var(--accent);
}

.admin-layout__back {
  align-self: flex-start;
  font-size: var(--font-size-small);
}

.admin-layout__content {
  flex: 1;
  min-width: 0;
  padding: var(--space-6) var(--space-4);
}

@media (min-width: 1025px) {
  .admin-layout {
    flex-direction: row;
  }

  /* Menu latéral fixe : reste visible pendant le défilement des listes. */
  .admin-layout__sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 15rem;
    flex-shrink: 0;
    box-sizing: border-box;
    border-bottom: none;
    border-right: 1px solid var(--border);
  }

  .admin-layout__nav {
    flex-direction: column;
  }

  .admin-layout__back {
    margin-top: auto;
  }

  .admin-layout__content {
    padding: var(--space-8);
  }
}
</style>
