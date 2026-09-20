<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="programmation">
    <Hero />
    <div class="programmation__content">
      <h1>Programmation</h1>
      <p>La programmation arrive prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.programmation__content {
  padding: var(--space-8) var(--space-4);
}
</style>
