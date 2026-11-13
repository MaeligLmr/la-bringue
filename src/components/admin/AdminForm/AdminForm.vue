<script setup lang="ts" generic="T extends object">
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { supabase } from '../../../supabase.js'
import Button from '../../ui/Button/Button.vue'
import Select from '../../ui/Select/Select.vue'
import FileUpload from '../../ui/FileUpload/FileUpload.vue'
import Checkbox from '../../ui/Checkbox/Checkbox.vue'
import DatePicker from '../../ui/DatePicker/DatePicker.vue'
import { photoUrl } from '../../../lib/photo/photo.ts'
import { IMAGE_INPUT_TYPES, ImageError, MAX_ORIGINAL_BYTES, MAX_WEBP_BYTES, toWebp } from '../../../lib/image/to-webp.ts'
import type { AdminFormField, AdminFormHandler } from '../../../types/ui/admin-form.ts'

const props = defineProps<{
  fields: AdminFormField<T>[]
  handler: AdminFormHandler<T>
  id?: string | number
  rules?: (values: Record<string, unknown>) => Partial<Record<string, string>>
  warning?: (values: Record<string, unknown>) => string
}>()

const emit = defineEmits<{ saved: [item: T] }>()

const MAX_WEBP_MO = MAX_WEBP_BYTES / 1024 / 1024
const ERROR_MESSAGE = 'L’enregistrement a échoué. Réessaie plus tard.'

const values = reactive<Record<string, any>>({})
const files = reactive<Record<string, File | undefined>>({})
const errors = reactive<Record<string, string | undefined>>({})
const submitting = ref(false)

const warningText = computed(() => props.warning?.(values) ?? '')

function toFormValue(field: AdminFormField<T>, value: unknown) {
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'select') return value == null ? '' : String(value)
  return value ?? ''
}

function fill(item: Partial<T>) {
  for (const field of props.fields) {
    values[field.key] = toFormValue(field, (item as Record<string, unknown>)[field.key])
  }
}

fill({})

onMounted(async () => {
  if (props.id === undefined) return
  try {
    const item = await props.handler.getById(props.id as never)
    if (item) fill(item)
  } catch {
    toast.error(ERROR_MESSAGE)
  }
})

function isEmpty(field: AdminFormField<T>) {
  if (field.type === 'checkbox') return false
  if (field.type === 'image') return !values[field.key] && !files[field.key]
  return String(values[field.key] ?? '').trim() === ''
}

function validate() {
  const ruleErrors = props.rules?.(values) ?? {}
  for (const field of props.fields) {
    errors[field.key] = field.required && isEmpty(field) ? 'Ce champ est obligatoire.' : ruleErrors[field.key]
  }
  return props.fields.every((field) => !errors[field.key])
}

// Nom de fichier parlant pour le SEO, tiré du nom (ou titre) de l'élément, sinon du fichier
// (« Angèle » → « angele-3f2a9c1b.webp »), avec un suffixe aléatoire pour garantir l'unicité.
function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Tout ce qui part dans Storage est du WebP : l'extension est donc toujours « .webp »,
// quel que soit le nom du fichier d'origine.
function storageFileName(file: File) {
  const dot = file.name.lastIndexOf('.')
  const base = dot > 0 ? file.name.slice(0, dot) : file.name
  const label = String(values.nom ?? values.titre ?? '')
  const slug = slugify(label) || slugify(base) || 'image'
  const id = crypto.randomUUID().slice(0, 8)
  return `${slug}-${id}.webp`
}

// Convertit l'image en WebP puis l'envoie dans le bucket « images »
async function upload(field: AdminFormField<T>, original: File) {
  const file = await toWebp(original)
  if (file.type !== 'image/webp') throw new Error('Seules les images WebP sont envoyées dans Storage.')
  const path = `${field.folder}/${storageFileName(file)}`
  const { error } = await supabase.storage.from('images').upload(path, file, { contentType: file.type })
  if (error) throw error
  return `/${path}`
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {}
    for (const field of props.fields) {
      const file = files[field.key]
      const value = field.type === 'image' && file ? await upload(field, file) : values[field.key]
      // Champ vide : null en base plutôt qu'une chaîne vide (dates, heures…).
      payload[field.key] = value === '' ? null : value
    }

    const item =
      props.id === undefined
        ? await props.handler.create(payload as never)
        : await props.handler.update(props.id as never, payload as never)

    toast.success('Enregistré.')
    emit('saved', item)
  } catch (error) {
    // Une image refusée (trop lourde, mauvais format) s'explique à l'utilisateur ; le reste reste générique.
    toast.error(error instanceof ImageError ? error.message : ERROR_MESSAGE)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="admin-form" novalidate @submit.prevent="submit">
    <div v-for="field in fields" :key="field.key" class="form-field">
      <label :for="`admin-${field.key}`">{{ field.label }}</label>

      <textarea v-if="field.type === 'textarea'" :id="`admin-${field.key}`" v-model="values[field.key]" />

      <Select
        v-else-if="field.type === 'select'"
        :id="`admin-${field.key}`"
        v-model="values[field.key]"
        :options="field.options ?? []"
        :aria-label="field.label"
      />

      <Checkbox v-else-if="field.type === 'checkbox'" :id="`admin-${field.key}`" v-model="values[field.key]" />

      <DatePicker
        v-else-if="field.type === 'date' || field.type === 'time' || field.type === 'datetime'"
        :id="`admin-${field.key}`"
        v-model="values[field.key]"
        :mode="field.type"
        :aria-label="field.label"
        :clearable="!field.required"
      />

      <FileUpload
        v-else-if="field.type === 'image'"
        :id="`admin-${field.key}`"
        v-model="files[field.key]"
        :accept="IMAGE_INPUT_TYPES.join(',')"
        :max-size="MAX_ORIGINAL_BYTES"
        :hint="`Converti en WebP · ${MAX_WEBP_MO} Mo max après conversion`"
        :current-url="values[field.key] ? photoUrl(String(values[field.key])) : undefined"
      />

      <input v-else :id="`admin-${field.key}`" v-model="values[field.key]" :type="field.type" />

      <p v-if="errors[field.key]" class="form-field__error">{{ errors[field.key] }}</p>
    </div>

    <p v-if="warningText" class="admin-form__warning" role="status">{{ warningText }}</p>

    <slot :values="values" />

    <Button type="submit" :disabled="submitting">
      {{ submitting ? 'Enregistrement…' : 'Enregistrer' }}
    </Button>
  </form>
</template>

<style scoped>
.admin-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
}

.admin-form__warning {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--alert-danger-border);
  border-radius: var(--radius-medium);
  background: var(--alert-danger-background);
  color: var(--alert-danger-text);
}
</style>
