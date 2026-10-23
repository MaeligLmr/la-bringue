<script setup lang="ts">
import Hero from '../components/layout/Hero.vue'

defineProps<{ id: number }>()
</script>

<template>
  <main class="actualite">
    <Hero />
  </main>
</template>
