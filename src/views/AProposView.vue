<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="a-propos">
    <Hero />
    <div class="a-propos__content">
      <h1>À propos</h1>
      <p>La présentation du festival arrive prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.a-propos__content {
  padding: var(--space-8) var(--space-4);
}
</style>
