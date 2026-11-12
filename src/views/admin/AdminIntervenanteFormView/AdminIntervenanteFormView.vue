<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import { conferenciereHandler } from '../../../handlers/conferenciere'
import type { Conferenciere } from '../../../types/database/conferenciere'
import type { AdminFormField } from '../../../types/ui/admin-form'

defineProps<{ id?: number }>()

const router = useRouter()

const FIELDS: AdminFormField<Conferenciere>[] = [
  { key: 'nom', label: 'Nom', type: 'text', required: true },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'conferencieres' },
  { key: 'description', label: 'Description', type: 'textarea' },
]

function backToList() {
  router.push({ name: 'admin-intervenantes' })
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouvelle intervenante' : 'Modifier l’intervenante'"
    :back="{ to: { name: 'admin-intervenantes' }, label: 'Intervenantes' }"
    width="form"
  >
    <AdminForm :key="id ?? 'nouvelle'" :fields="FIELDS" :handler="conferenciereHandler" :id="id" @saved="backToList" />
  </AdminPage>
</template>

