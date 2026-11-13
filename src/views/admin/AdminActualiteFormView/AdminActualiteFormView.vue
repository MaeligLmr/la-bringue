<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminForm from '../../../components/admin/AdminForm/AdminForm.vue'
import AdminPage from '../../../components/admin/AdminPage/AdminPage.vue'
import Button from '../../../components/ui/Button/Button.vue'
import Tag from '../../../components/ui/Tag/Tag.vue'
import { actualiteHandler } from '../../../handlers/actualite'
import { todayIso } from '../../../lib/date-picker/date-picker'
import { isPublished } from '../../../lib/publication/publication'
import type { Actualite } from '../../../types/database/actualite'
import type { AdminFormField } from '../../../types/ui/admin-form'

defineProps<{ id?: number }>()

const router = useRouter()

// La date de publication est obligatoire : elle décide de la visibilité sur le site, et
// les actualités sont triées dessus (une date vide remonterait en tête de liste).
const FIELDS: AdminFormField<Actualite>[] = [
  { key: 'titre', label: 'Titre', type: 'text', required: true },
  { key: 'photo', label: 'Photo', type: 'image', folder: 'actualites' },
  { key: 'date_publication', label: 'Date de publication', type: 'date', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
]

function backToList() {
  router.push({ name: 'admin-actualites' })
}
</script>

<template>
  <AdminPage
    :title="id === undefined ? 'Nouvelle actualité' : 'Modifier l’actualité'"
    :back="{ to: { name: 'admin-actualites' }, label: 'Actualités' }"
    width="form"
  >
    <AdminForm :key="id ?? 'nouvelle'" :fields="FIELDS" :handler="actualiteHandler" :id="id" @saved="backToList">
      <template #default="{ values }">
        <div class="actualite-statut">
          <Tag
            :label="isPublished(values.date_publication || null) ? 'Publiée' : 'En attente'"
            :variant="isPublished(values.date_publication || null) ? 'pink-bright' : 'violet'"
          />
          <template v-if="!isPublished(values.date_publication || null)">
            <span class="actualite-statut__hint">Visible sur le site à partir de sa date de publication.</span>
            <!-- Remplit la date : l'actualité est publiée à l'enregistrement. -->
            <Button color="primary" variant="outlined" icon-left="check" @click="values.date_publication = todayIso()">
              Publier maintenant
            </Button>
          </template>
        </div>
      </template>
    </AdminForm>
  </AdminPage>
</template>

<style scoped>
.actualite-statut {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.actualite-statut__hint {
  color: var(--text);
  font-size: var(--font-size-small);
}
</style>
