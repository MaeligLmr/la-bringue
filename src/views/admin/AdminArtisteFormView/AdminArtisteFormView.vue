<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import { artisteHandler } from '../../../handlers/artiste'
import type { Artiste } from '../../../types/database/artiste'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'
import { toOptions } from '../../../lib/options/options'

defineProps<{ id?: number }>()

const router = useRouter()

const categories = ref<SelectOption[]>([])
const ready = ref(false)

onMounted(async () => {
  try {
    const artistes = await artisteHandler.getAll()
    categories.value = toOptions(artistes.map((artiste) => artiste.categorie), { sorted: true })
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
  <AdminPage
    :title="id === undefined ? 'Nouvelle artiste' : 'Modifier l’artiste'"
    :back="{ to: { name: 'admin-artistes' }, label: 'Artistes' }"
    width="form"
  >
    <AdminForm v-if="ready" :key="id ?? 'nouvelle'" :fields="fields" :handler="artisteHandler" :id="id" @saved="backToList" />
  </AdminPage>
</template>

