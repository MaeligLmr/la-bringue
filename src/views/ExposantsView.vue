<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="exposants">
    <Hero />
    <div class="exposants__content">
      <h1>Exposants</h1>
      <p>La liste des exposants arrive prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.exposants__content {
  padding: var(--space-8) var(--space-4);
}
</style>
