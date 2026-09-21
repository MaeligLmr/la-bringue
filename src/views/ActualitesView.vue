<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="actualites">
    <Hero />
    <div class="actualites__content">
      <h1>Actualités</h1>
      <p>Les actualités du festival arrivent prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.actualites__content {
  padding: var(--space-8) var(--space-4);
}
</style>
