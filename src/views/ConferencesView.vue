<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="conferences">
    <Hero />
    <div class="conferences__content">
      <h1>Conférences</h1>
      <p>Le programme des conférences arrive prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.conferences__content {
  padding: var(--space-8) var(--space-4);
}
</style>
