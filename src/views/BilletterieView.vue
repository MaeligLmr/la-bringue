<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="billetterie">
    <Hero />
    <div class="billetterie__content">
      <h1>Billetterie</h1>
      <p>La billetterie arrive prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.billetterie__content {
  padding: var(--space-8) var(--space-4);
}
</style>
