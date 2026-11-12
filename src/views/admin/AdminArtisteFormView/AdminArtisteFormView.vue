<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import { artisteHandler } from '../../../handlers/artiste'
import type { Artiste } from '../../../types/database/artiste'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'

defineProps<{ id?: number }>()

const router = useRouter()

const categories = ref<SelectOption[]>([])
const ready = ref(false)

onMounted(async () => {
  try {
    const artistes = await artisteHandler.getAll()
    const noms = new Set(artistes.map((artiste) => artiste.categorie).filter((categorie): categorie is string => !!categorie))
    categories.value = [...noms].sort((a, b) => a.localeCompare(b)).map((categorie) => ({ value: categorie, label: categorie }))
  } catch {
    toast.error('Impossible de charger les catégories.')
  } finally {
    ready.value = true
  }
})

const fields = computed<AdminFormField<Artiste>[]>(() => [
  { key: 'nom', label: 'Nom', type: 'text', required: true },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'programmation' },
  { key: 'description', label: 'Description', type: 'textarea' },
  {
    key: 'categorie',
    label: 'Catégorie',
    type: 'select',
    options: [{ value: '', label: 'Aucune' }, ...categories.value],
  },
])

function backToList() {
  router.push({ name: 'admin-artistes' })
}
</script>

<template>
  <div class="admin-artiste-form">
    <RouterLink :to="{ name: 'admin-artistes' }" class="admin-artiste-form__back">← Artistes</RouterLink>
    <h1>{{ id === undefined ? 'Nouvelle artiste' : 'Modifier l’artiste' }}</h1>

    <AdminForm v-if="ready" :key="id ?? 'nouvelle'" :fields="fields" :handler="artisteHandler" :id="id" @saved="backToList" />
  </div>
</template>

<style scoped>
.admin-artiste-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 36rem;
}

.admin-artiste-form h1 {
  margin: 0;
}

.admin-artiste-form__back {
  align-self: flex-start;
  color: var(--text-h);
  font-size: var(--font-size-small);
}
</style>
