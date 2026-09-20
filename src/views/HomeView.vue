<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="home">
    <Hero home-page />
    <div class="home__content">
      <p>Bienvenue sur La Bringue.</p>
    </div>
  </main>
</template>

<style scoped>
.home__content {
  padding: var(--space-8) var(--space-4);
}
</style>
