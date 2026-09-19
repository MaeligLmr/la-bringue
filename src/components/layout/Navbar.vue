<script setup lang="ts">
import { useAuthModal } from '../../composables/useAuthModal'
import { useTheme } from '../../composables/useTheme'
import type { ThemePreference } from '../../composables/useTheme'

const { open } = useAuthModal()
const { preference, setPreference } = useTheme()

function onThemeChange(event: Event) {
  setPreference((event.target as HTMLSelectElement).value as ThemePreference)
}
</script>

<template>
  <header class="navbar">
    <span class="navbar__brand">La Bringue</span>
    <nav class="navbar__actions">
      <select
        class="navbar__theme-select"
        aria-label="Thème"
        :value="preference"
        @change="onThemeChange"
      >
        <option value="system">Par défaut</option>
        <option value="light">Clair</option>
        <option value="dark">Sombre</option>
      </select>
      <button type="button" @click="open('login')">Se connecter</button>
      <button type="button" @click="open('signup')">Créer un compte</button>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.navbar__brand {
  font-weight: 600;
  color: var(--text-h);
}

.navbar__actions {
  display: flex;
  gap: 0.5rem;
}

.navbar__actions button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
  cursor: pointer;
}

.navbar__theme-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
  cursor: pointer;
}
</style>
