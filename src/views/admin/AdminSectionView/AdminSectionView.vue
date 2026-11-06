<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="admin-section">
    <h1>{{ title }}</h1>
    <p>La gestion de ce contenu arrive bientôt.</p>
  </div>
</template>

<style scoped>
.admin-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-section h1,
.admin-section p {
  margin: 0;
}
</style>
