<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    title: string
    back?: { to: RouteLocationRaw; label: string }
    width?: 'full' | 'form' | 'wide'
  }>(),
  { width: 'full' }
)
</script>

<template>
  <div class="admin-page" :class="`admin-page--${width}`">
    <RouterLink v-if="back" :to="back.to" class="admin-page__back">← {{ back.label }}</RouterLink>
    <h1>{{ title }}</h1>
    <!-- La largeur (form / wide) ne limite que le contenu : le titre, lui, peut tenir sur une ligne. -->
    <div class="admin-page__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.admin-page__content {
  min-width: 0;
}

.admin-page--form .admin-page__content {
  max-width: 36rem;
}

.admin-page--wide .admin-page__content {
  max-width: 48rem;
}

.admin-page h1 {
  margin: 0;
}

.admin-page__back {
  align-self: flex-start;
  color: var(--text-h);
  font-size: var(--font-size-small);
}
</style>
