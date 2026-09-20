<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'
</script>

<template>
  <main class="infos-pratiques">
    <Hero />
    <div class="infos-pratiques__content">
      <h1>Infos pratiques</h1>
      <p>Les informations pratiques arrivent prochainement.</p>
    </div>
  </main>
</template>

<style scoped>
.infos-pratiques__content {
  padding: var(--space-8) var(--space-4);
}
</style>
