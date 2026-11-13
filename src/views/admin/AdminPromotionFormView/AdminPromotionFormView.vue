<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import { formuleHandler } from '../../../handlers/formule'
import { promotionHandler } from '../../../handlers/promotion'
import type { Promotion } from '../../../types/database/promotion'
import type { AdminFormField } from '../../../types/ui/admin-form'
import type { SelectOption } from '../../../types/ui/select'

defineProps<{ id?: number }>()

const router = useRouter()

const formules = ref<SelectOption[]>([])
const ready = ref(false)

onMounted(async () => {
  try {
    formules.value = (await formuleHandler.getAll()).map((formule) => ({
      value: String(formule.id_formule),
      label: formule.titre ?? `Formule ${formule.id_formule}`,
    }))
  } catch {
    toast.error('Impossible de charger les formules.')
  } finally {
    ready.value = true
  }
})

// Début et fin sont obligatoires : une promotion sans borne serait active indéfiniment.
const fields = computed<AdminFormField<Promotion>[]>(() => [
  { key: 'description', label: 'Nom de la promotion (ex : Early bird)', type: 'text', required: true },
  { key: 'id_formule', label: 'Formule concernée', type: 'select', required: true, options: formules.value },
  { key: 'reduction_prc', label: 'Réduction (%)', type: 'number', required: true, min: 1, max: 100 },
  { key: 'date_debut', label: 'Début', type: 'datetime', required: true },
  { key: 'date_fin', label: 'Fin', type: 'datetime', required: true },
])

function rules(values: Record<string, unknown>) {
  const errors: Partial<Record<string, string>> = {}
  const reduction = Number(values.reduction_prc)
  if (values.reduction_prc !== '' && (reduction < 1 || reduction > 100)) {
    errors.reduction_prc = 'La réduction doit être comprise entre 1 et 100 %.'
  }
  // « YYYY-MM-DDTHH:mm » se compare comme du texte ; les secondes éventuelles sont ignorées.
  const debut = String(values.date_debut ?? '').slice(0, 16)
  const fin = String(values.date_fin ?? '').slice(0, 16)
  if (debut && fin && fin <= debut) errors.date_fin = 'La fin doit être après le début.'
  return errors
}

function backToList() {
  router.push({ name: 'admin-promotions' })
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouvelle promotion' : 'Modifier la promotion'"
    :back="{ to: { name: 'admin-promotions' }, label: 'Promotions' }"
    width="form"
  >
    <AdminForm v-if="ready" :key="id ?? 'nouvelle'" :fields="fields" :handler="promotionHandler" :id="id" :rules="rules" @saved="backToList" />
  </AdminPage>
</template>
