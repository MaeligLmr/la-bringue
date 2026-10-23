<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import Hero from '../components/layout/Hero.vue'
import BilletterieCard from '../components/billetterie/BilletterieCard.vue'
import Loader from '../components/ui/Loader.vue'
import { formuleHandler } from '../handlers/formule'
import { openBilletterie, toFormuleCards } from '../lib/billetterie'
import type { FormuleCard } from '../types/ui/billetterie'

const LOAD_ERROR_MESSAGE = 'Impossible de charger la billetterie.'

// Déjà triées par jour de début côté Supabase.
const formules = ref<FormuleCard[]>([])
const loading = ref(true)
const failed = ref(false)

onMounted(async () => {
  try {
    formules.value = toFormuleCards(await formuleHandler.getAllWithPromotions())
  } catch (error) {
    console.error(error)
    failed.value = true
    toast.error(LOAD_ERROR_MESSAGE)
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <main class="billetterie">
    <Hero />
    <div class="billetterie__content">
      <h1>Billetterie</h1>

      <Loader v-if="loading" />
      <p v-else-if="failed" class="billetterie__message billetterie__message--erreur" role="alert">
        Impossible de charger la billetterie pour le moment. Réessayez dans quelques instants.
      </p>
      <p v-else-if="!formules.length" class="billetterie__message">Les formules arrivent bientôt.</p>

      <ul v-else class="billetterie__grille">
        <li v-for="formule in formules" :key="formule.id">
          <BilletterieCard :formule="formule" @buy="openBilletterie(formule)" />
        </li>
      </ul>
    </div>
  </main>
</template>

<style scoped>
.billetterie__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 64rem;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4) var(--space-20);
}

.billetterie__content h1 {
  margin: 0;
  text-align: center;
}

.billetterie__message {
  margin: 0;
  text-align: center;
}

.billetterie__message--erreur {
  padding: var(--space-4);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-medium);
  background: var(--alert-danger-background);
  color: var(--alert-danger-text);
}

.billetterie__grille {
  display: grid;
  grid-template-columns: repeat(auto-fit, 16rem);
  justify-content: center;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.billetterie__grille > li {
  display: flex;
}
</style>
