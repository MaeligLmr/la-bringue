<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import { exposantHandler } from '../../../handlers/exposant'
import type { Exposant } from '../../../types/database/exposant'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'

defineProps<{ id?: number }>()

const router = useRouter()

const categories = ref<SelectOption[]>([])
const ready = ref(false)

onMounted(async () => {
  try {
    const noms = await exposantHandler.getCategories()
    categories.value = [...new Set(noms.filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((categorie) => ({ value: categorie, label: categorie }))
  } catch {
    toast.error('Impossible de charger les catégories.')
  } finally {
    ready.value = true
  }
})

const fields = computed<AdminFormField<Exposant>[]>(() => [
  { key: 'nom', label: 'Nom', type: 'text', required: true },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'exposants' },
  { key: 'description', label: 'Description', type: 'textarea' },
  {
    key: 'categorie',
    label: 'Catégorie',
    type: 'select',
    options: [{ value: '', label: 'Aucune' }, ...categories.value],
  },
])

function backToList() {
  router.push({ name: 'admin-exposants' })
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouvel exposant' : 'Modifier l’exposant'"
    :back="{ to: { name: 'admin-exposants' }, label: 'Exposants' }"
    width="form"
  >
    <AdminForm v-if="ready" :key="id ?? 'nouveau'" :fields="fields" :handler="exposantHandler" :id="id" @saved="backToList" />
  </AdminPage>
</template>
