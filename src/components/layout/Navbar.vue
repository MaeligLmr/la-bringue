<script setup lang="ts">
import { useAuthModal } from '../../composables/useAuthModal'
import { useTheme } from '../../composables/useTheme'
import type { ThemePreference } from '../../composables/useTheme'
import Button from '../ui/Button.vue'
import Select from '../ui/Select.vue'

const { open } = useAuthModal()
const { preference, setPreference } = useTheme()

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Par défaut' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
]

function onThemeChange(value: string) {
  setPreference(value as ThemePreference)
}
</script>

<template>
  <header class="navbar">
    <span class="navbar__brand">La Bringue</span>
    <nav class="navbar__actions">
      <Select
        aria-label="Thème"
        :model-value="preference"
        :options="THEME_OPTIONS"
        @update:model-value="onThemeChange"
      />
      <Button color="primary" variant="outlined" @click="open('login')">Se connecter</Button>
      <Button color="primary" variant="full" @click="open('signup')">Créer un compte</Button>
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
  align-items: center;
  gap: 0.5rem;
}
</style>
