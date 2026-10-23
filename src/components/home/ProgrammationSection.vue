<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import Button from '../ui/Button.vue'
import Loader from '../ui/Loader.vue'
import ProgrammationDay from './ProgrammationDay.vue'
import { JOURS } from '../../types/ui/programmation.ts'
import { concertHandler, type DayLineup } from '../../handlers/concert'

// Un loader remplace les jours tant que leur lineup n'est pas arrivé de Supabase.
const jours = ref(JOURS.map((jour) => ({ ...jour, lineup: { others: [] } as DayLineup })))
const loading = ref(true)

onMounted(async () => {
  try {
    const lineups = await Promise.all(JOURS.map((jour) => concertHandler.getDayLineup(jour.value)))
    jours.value = JOURS.map((jour, index) => ({ ...jour, lineup: lineups[index] }))
  } catch (error) {
    console.error(error)
    toast.error('Impossible de charger la programmation.')
  } finally {
    loading.value = false
  }
})

const router = useRouter()

function goToProgrammation() {
  router.push('/programmation')
}
</script>

<template>
  <section class="programmation-section">
    <Loader v-if="loading" />
    <div v-else class="programmation-section__jours">
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
