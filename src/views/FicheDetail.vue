<script setup lang="ts">
import type { FicheType } from '../types/ui/fiche.ts'

// Gabarit vide : le contenu (chargé selon `type` et `id`) arrive plus tard.
defineProps<{
  type: FicheType
  id: number
}>()
</script>

<template>
  <main class="fiche-detail" :data-type="type" :data-id="id" />
</template>
