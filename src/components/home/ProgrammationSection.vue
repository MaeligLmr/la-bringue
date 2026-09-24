<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../ui/Button.vue'
import ProgrammationDay from './ProgrammationDay.vue'
import { JOURS, type Artiste } from '../../types/programmation'
import { getDayLineup } from '../../lib/programmation'

const props = defineProps<{
  artistes: Artiste[]
}>()

const jours = computed(() =>
  JOURS.map((jour) => ({ ...jour, lineup: getDayLineup(props.artistes, jour.value) }))
)

const router = useRouter()

function goToProgrammation() {
  router.push('/programmation')
}
</script>

<template>
  <section class="programmation-section">
    <div class="programmation-section__jours">
      <ProgrammationDay v-for="jour in jours" :key="jour.value" :label="jour.label" :date="jour.value" :lineup="jour.lineup" />
    </div>

    <Button color="primary" variant="outlined" size="large" @click="goToProgrammation">
      Toute la programmation
    </Button>
  </section>
</template>

<style scoped>
.programmation-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-10);
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.programmation-section h2 {
  margin: 0;
}

.programmation-section__jours {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  width: 100%;
}

@media (min-width: 1025px) {
  .programmation-section {
    padding-left: var(--space-20);
    padding-right: var(--space-20);
  }
}
</style>
