<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import { formuleHandler } from '../../../handlers/formule'
import type { Formule } from '../../../types/database/formule'
import type { AdminFormField } from '../../../types/ui/admin-form'

defineProps<{ id?: number }>()

const router = useRouter()

const FIELDS: AdminFormField<Formule>[] = [
  { key: 'titre', label: 'Titre', type: 'text', required: true },
  { key: 'description', label: 'Contenu de la formule', type: 'textarea' },
  { key: 'jour_debut', label: 'Premier jour', type: 'date', required: true },
  { key: 'jour_fin', label: 'Dernier jour', type: 'date' },
  // La base garde le nombre de jours en texte : « 3 » s'affiche « 3 jours » sur le site.
  { key: 'nb_jours', label: 'Durée en jours (ex : 3)', type: 'text' },
  { key: 'prix', label: 'Prix plein (€)', type: 'number', required: true, min: 0 },
  { key: 'lien_shotgun', label: 'Lien de la billetterie (Shotgun)', type: 'text' },
  { key: 'nbr_places_total', label: 'Places au total', type: 'number', min: 0 },
  { key: 'nbr_places_restantes', label: 'Places restantes', type: 'number', min: 0 },
  { key: 'homepage', label: 'Afficher sur la page d’accueil', type: 'checkbox' },
]

function rules(values: Record<string, unknown>) {
  const errors: Partial<Record<string, string>> = {}
  const { jour_debut: debut, jour_fin: fin, nbr_places_total: total, nbr_places_restantes: restantes } = values
  if (debut && fin && String(fin) < String(debut)) errors.jour_fin = 'Le dernier jour doit être après le premier.'
  if (total !== '' && restantes !== '' && Number(restantes) > Number(total)) {
    errors.nbr_places_restantes = 'Les places restantes ne peuvent pas dépasser le total.'
  }
  return errors
}

function backToList() {
  router.push({ name: 'admin-formules' })
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouvelle formule' : 'Modifier la formule'"
    :back="{ to: { name: 'admin-formules' }, label: 'Billetterie' }"
    width="form"
  >
    <AdminForm :key="id ?? 'nouvelle'" :fields="FIELDS" :handler="formuleHandler" :id="id" :rules="rules" @saved="backToList" />
  </AdminPage>
</template>
