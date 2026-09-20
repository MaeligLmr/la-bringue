<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="mon-programme">
    <Hero />
    <div class="mon-programme__content">
      <h1>Mon programme</h1>
      <p>Retrouve ici les événements que tu as sauvegardés (bientôt disponible).</p>
    </div>
  </main>
</template>

<style scoped>
.mon-programme__content {
  padding: var(--space-8) var(--space-4);
}
</style>
